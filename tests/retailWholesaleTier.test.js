const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const vm = require("node:vm");
const logic = require("../services/retailWholesaleTier/reportLogic");

const user = { allowedStores: ["Beacon", "Bellville"] };
const query = {
  shopKeys: "Beacon,Bellville",
  startDate: "2026-11-01",
  endDate: "2026-11-30",
};

test("validates dates and exact store access, including superadmins", () => {
  assert.throws(
    () => logic.parseRequest({ ...query, startDate: "2026-02-30" }, user),
    /calendar/,
  );
  assert.throws(
    () => logic.parseRequest({ ...query, startDate: "2026-12-01" }, user),
    /before/,
  );
  assert.throws(
    () => logic.parseRequest({ ...query, shopKeys: "Beac" }, user),
    { status: 403 },
  );
  assert.throws(
    () => logic.parseRequest(query, { role: "superadmin", allowedStores: [] }),
    { status: 403 },
  );
  assert.deepEqual(
    logic.parseRequest({ ...query, shopKeys: "beacon,Beacon" }, user).shops,
    ["Beacon"],
  );
  assert.throws(
    () => logic.buildMonthlyQuery("table; DROP DATABASE x"),
    /Invalid/,
  );
});

test("enumerates every month across years and uses an exclusive next-day bound", () => {
  const request = logic.parseRequest(
    { ...query, startDate: "2025-12-15", endDate: "2026-02-28" },
    user,
  );
  assert.deepEqual(request.months, [
    "202512tbldata_current_tran",
    "202601tbldata_current_tran",
    "202602tbldata_current_tran",
  ]);
  assert.equal(request.endExclusive, "2026-03-01");
});

test("executes generated SQL against boundary, group, marker, null and refund fixtures", () => {
  // SQLite is a local calculation check, not MySQL compatibility certification.
  // Its IS operator implements the null-safe equality used by MySQL <=> here.
  const sql = logic
    .buildMonthlyQuery("202611tbldata_current_tran")
    .replaceAll("<=>", "IS");
  const script = `
import sqlite3, json, sys
request = json.load(sys.stdin)
db = sqlite3.connect(':memory:')
db.row_factory = sqlite3.Row
db.execute('CREATE TABLE "202611tbldata_current_tran" (stockcode TEXT, stockdescription TEXT, qty REAL, linetotal REAL, CehqueNum TEXT, Cardnum TEXT, salenum REAL, majorno REAL, sub1no REAL, datetime TEXT)')
rows = []
def add(code, qty, sale, major=1, sub=1, cheque='Qty', card='marked', date='2026-11-15 12:00:00', value=None):
    rows.append((code, code, qty, qty*10 if value is None and qty is not None else value, cheque, card, sale, major, sub, date))
for qty in [9,10,99,100,999,1000]: add(str(qty), qty, qty)
add('shared-a',6,2000,major=None,sub=None)
add('shared-b',5,2000,major=None,sub=None)
add('other-category',5,2000,major=2)
add('unmarked',1000,2000,major=None,sub=None,card=' ')
add('one-marker',1000,2001,cheque=None)
add('refund',-2,3000)
add('null-values',None,3001,value=None)
add('last-second',1,3002,date='2026-11-30 23:59:59')
add('outside',10000,2000,major=None,sub=None,date='2026-12-01 00:00:00')
db.executemany('INSERT INTO "202611tbldata_current_tran" VALUES (?,?,?,?,?,?,?,?,?,?)',rows)
print(json.dumps([dict(r) for r in db.execute(request['sql'], {'start':'2026-11-01','endExclusive':'2026-12-01'})]))
`;
  const result = spawnSync("python3", ["-c", script], {
    input: JSON.stringify({ sql }),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const rows = Object.fromEntries(
    JSON.parse(result.stdout).map((row) => [row.stockcode, row]),
  );
  for (const [qty, tier] of [
    [9, "retail"],
    [10, "wholesaleTier1"],
    [99, "wholesaleTier1"],
    [100, "wholesaleTier2"],
    [999, "wholesaleTier2"],
    [1000, "wholesaleTier3"],
  ]) {
    assert.equal(rows[qty][`${tier}Qty`], qty);
  }
  assert.equal(rows["shared-a"].wholesaleTier1Qty, 6);
  assert.equal(rows["shared-b"].wholesaleTier1Qty, 5);
  assert.equal(rows["other-category"].retailQty, 5);
  assert.equal(rows.unmarked.retailQty, 1000);
  assert.equal(rows["one-marker"].retailQty, 1000);
  assert.equal(rows.refund.retailQty, -2);
  assert.equal(rows["null-values"].totalValue, 0);
  assert.equal(rows["last-second"].totalQty, 1);
  assert.equal(rows.outside, undefined);
  for (const row of Object.values(rows)) {
    assert.equal(
      row.totalQty,
      row.retailQty +
        row.wholesaleTier1Qty +
        row.wholesaleTier2Qty +
        row.wholesaleTier3Qty,
    );
    assert.equal(
      row.totalValue,
      row.retailValue +
        row.wholesaleTier1Value +
        row.wholesaleTier2Value +
        row.wholesaleTier3Value,
    );
  }
});

test("merges months by stock code, preserves zeroes and keeps branch totals independent", () => {
  const row = {
    stockcode: "001",
    stockdescription: "A",
    retailQty: 2,
    retailValue: 0,
    totalQty: 2,
    totalValue: 0,
  };
  const result = logic.aggregateResults([
    { shopKey: "Beacon", rows: [row, { ...row, stockdescription: "B" }] },
    { shopKey: "Bellville", rows: [{ ...row, retailQty: 3, totalQty: 3 }] },
  ]);
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].stockcode, "001");
  assert.equal(result.data[0].stockdescription, "B");
  assert.equal(result.branchTotals.Beacon.totalQty, 4);
  assert.equal(result.branchTotals.Bellville.totalQty, 3);
  assert.equal(result.totals.totalQty, 7);
  assert.equal(result.totals.totalValue, 0);
});

function loadService(
  queryHandler,
  discover = async (_, shop) => ({ [shop]: [`${shop}history`] }),
) {
  let closed = 0;
  const connections = [];
  const discoveries = [];
  const sandbox = {
    module: { exports: {} },
    require: (name) => {
      if (name === "sequelize") return { QueryTypes: { SELECT: "SELECT" } };
      if (name === "./reportLogic") return logic;
      if (name === "../../controllers/databaseController")
        return {
          getActiveDatabases: async (currentUser, shop) => {
            discoveries.push({ user: currentUser, shop });
            return discover(currentUser, shop);
          },
        };
      if (name === "../../utils/sequelizeInstanceCustom")
        return (options) => {
          connections.push(options);
          return {
            query: (sql, replacements) =>
              queryHandler(sql, replacements, options),
            close: async () => {
              closed++;
            },
          };
        };
      throw new Error(name);
    },
  };
  vm.runInNewContext(
    fs.readFileSync(
      require.resolve("../services/retailWholesaleTier/reportService"),
      "utf8",
    ),
    sandbox,
  );
  return {
    generate: sandbox.module.exports.generateReport,
    closed: () => closed,
    connections,
    discoveries,
  };
}

test("reuses existing discovery and connection helpers, warns on missing months and closes pools", async () => {
  const service = loadService(
    async () => [],
    async (_, shop) => (shop === "Beacon" ? { Beacon: ["Beaconhistory"] } : {}),
  );
  const result = await service.generate(query, user);
  assert.equal(result.warnings.length, 2);
  assert.equal(result.data.length, 0);
  assert.equal(service.closed(), 1);
  assert.equal(service.discoveries.length, 2);
  assert.equal(service.discoveries[0].user, user);

  const failing = loadService(async () => {
    throw new Error("connection failed");
  });
  await assert.rejects(
    failing.generate({ ...query, shopKeys: "Beacon" }, user),
    /connection failed/,
  );
  assert.equal(failing.closed(), 1);
});

test("fetches branch monthly data through the existing factory with user credentials and bound dates", async () => {
  let monthlyQueries = 0;
  const service = loadService(async (sql, options, connection) => {
    if (sql.includes("INFORMATION_SCHEMA.TABLES")) {
      assert.equal(options.replacements.db, connection.databaseName);
      assert.equal(options.replacements.list[0], "202611tbldata_current_tran");
      return [{ Name: "202611tbldata_current_tran" }];
    }
    assert.match(sql, /FROM `202611tbldata_current_tran` t/);
    assert.equal(options.replacements.start, "2026-11-01");
    assert.equal(options.replacements.endExclusive, "2026-12-01");
    monthlyQueries++;
    return [
      {
        stockcode: "001",
        stockdescription: "Product",
        wholesaleTier1Qty: 10,
        wholesaleTier1Value: 100,
        totalQty: 10,
        totalValue: 100,
      },
    ];
  });
  const currentUser = {
    ...user,
    serverHost: "test-host",
    serverUser: "test-user",
    serverPassword: "test-password",
    serverPort: "3307",
  };
  const result = await service.generate(query, currentUser);
  assert.equal(monthlyQueries, 2);
  assert.equal(result.data.length, 1);
  assert.equal(result.totals.totalQty, 20);
  assert.equal(result.warnings.length, 0);
  assert.equal(service.closed(), 2);
  for (const connection of service.connections) {
    assert.equal(connection.host, currentUser.serverHost);
    assert.equal(connection.username, currentUser.serverUser);
    assert.equal(connection.password, currentUser.serverPassword);
    assert.equal(connection.port, currentUser.serverPort);
  }
});
