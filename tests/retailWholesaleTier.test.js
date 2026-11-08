const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const logic = require("../services/retailWholesaleTier/reportLogic");

const user = { allowedStores: ["Beacon", "Bellville"] };
const query = {
  shopKeys: "Beacon,Bellville",
  startDate: "2026-11-01",
  endDate: "2026-11-30",
};

// Verify validation rejects invalid dates and unauthorized store names.
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

// Verify monthly enumeration and inclusive date handling across year boundaries.
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

// Verify aggregation keeps products and branch totals correctly reconciled.
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

// Stub existing database helpers so service tests never access live databases.
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
      if (name === "./groupClassification") return require("../services/retailWholesaleTier/groupClassification");
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

// Verify existing helper reuse, missing-data warnings and connection cleanup.
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

// Verify credential forwarding and monthly query parameters through the existing factory.
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

// A warning must survive zero-valued signed groups instead of relying on their net quantity/value.
test("reports unmatched line counts without hiding reconciled zero totals", async () => {
  const service = loadService(async (sql) => {
    if (sql.includes("INFORMATION_SCHEMA.TABLES")) return [{ Name: "202611tbldata_current_tran" }];
    return [{ stockcode: "zero", unmatchedLineCount: 2, unmatchedRetailQty: 0, unmatchedRetailValue: 0 }];
  });
  const result = await service.generate({ ...query, shopKeys: "Beacon" }, user);
  assert.match(result.warnings[0], /2 unmatched lines/);
  assert.equal(result.totals.totalQty, 0);
  assert.deepEqual(Array.from(result.grouping.combo), ["salenum", "majorno", "sub1no"]);
  assert.deepEqual(Array.from(result.grouping.category), ["salenum", "majorno", "sub1no"]);
});

// Verify false query strings, omitted defaults and hostile/nonboolean inputs before any database lookup.
test("parses optional Sub2 checkbox strictly and propagates it into SQL and response metadata", async () => {
  for (const value of [undefined, false, "false"]) {
    assert.equal(logic.parseRequest({ ...query, includeSub2: value }, user).includeSub2, false);
  }
  for (const value of [true, "true"]) {
    assert.equal(logic.parseRequest({ ...query, includeSub2: value }, user).includeSub2, true);
  }
  for (const value of ["0", "1", "yes", "TRUE", "", [], {}, 1]) {
    assert.throws(() => logic.parseRequest({ ...query, includeSub2: value }, user), /includeSub2/);
  }
  let monthly = "";
  const service = loadService(async sql => {
    if (sql.includes("INFORMATION_SCHEMA.TABLES")) return [{ Name: "202611tbldata_current_tran" }];
    monthly = sql;
    return [];
  });
  const result = await service.generate({ ...query, shopKeys: "Beacon", includeSub2: "true" }, user);
  assert.equal(result.includeSub2, true);
  assert.match(monthly, /g.sub2no <=> \(t.sub2no\)/);
  assert.deepEqual(Array.from(result.grouping.combo), ["salenum", "majorno", "sub1no", "sub2no"]);
  assert.deepEqual(Array.from(result.grouping.category), ["salenum", "majorno", "sub1no", "sub2no"]);
});
