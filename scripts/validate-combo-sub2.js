/** Read-only validation helper. Run on a machine that can reach the application's shop database. */
const mysql = require("mysql2/promise");
const { buildGroupingComparisonQuery } = require("../services/retailWholesaleTier/groupClassification");
require("dotenv").config();

// Require an explicit application user and validated monthly table; never log connection credentials.
const [userId, table, ...requestedSales] = process.argv.slice(2);
const sales = requestedSales.length ? requestedSales : ["44464.2", "44472.2"];
if (!/^\d+$/.test(userId || "") || !/^\d{6}tbldata_current_tran$/.test(table || "") || sales.some(sale => !/^\d+(\.\d+)?$/.test(sale))) {
  console.error("Usage: node scripts/validate-combo-sub2.js <application-user-id> <YYYYMMtbldata_current_tran> [sale-number ...]");
  process.exit(1);
}
const year = Number(table.slice(0, 4));
const month = Number(table.slice(4, 6));
if (month < 1 || month > 12 || year < 1000) throw new Error("Invalid table month.");
const start = `${table.slice(0, 4)}-${table.slice(4, 6)}-01`;
const end = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);

// Tag our own validation errors so their safe explanations can be shown without printing database errors.
function validationError(message) {
  const error = new Error(message);
  error.safeMessage = message;
  return error;
}

async function inspect() {
  let app;
  let shop;
  try {
    // Use raw read-only queries to avoid application model sync or startup jobs.
    app = await mysql.createConnection({
      host: process.env.DB_HOST, port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD,
      database: "ipospermissions", connectTimeout: 7000,
    });
    const [users] = await app.execute(
      "SELECT serverHost, serverPort, serverUser, serverPassword, allowedStores FROM Users WHERE id = ?", [userId],
    );
    if (!users.length) throw validationError("Application user not found.");
    const user = users[0];
    const allowed = JSON.parse(user.allowedStores || "[]").map(name => name.toLowerCase());
    if (!allowed.includes("beacon")) throw validationError("Selected user has no Beacon store access.");
    shop = await mysql.createConnection({
      host: user.serverHost, port: Number(user.serverPort || 3306),
      user: user.serverUser, password: user.serverPassword, connectTimeout: 7000,
    });

    // Locate the video branch's actual history schema without inventing its prefix.
    const [schemas] = await shop.execute(
      "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE LOWER(SCHEMA_NAME) = 'beaconhistory'",
    );
    if (schemas.length !== 1) throw validationError("The video's beaconhistory schema was not found uniquely.");
    const schema = schemas[0].SCHEMA_NAME;
    const [columns] = await shop.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?", [schema, table],
    );
    const names = new Set(columns.map(row => row.COLUMN_NAME.toLowerCase()));
    for (const name of ["salenum", "majorno", "sub1no", "sub2no", "cehquenum", "cardnum", "qty", "linetotal", "stockcode", "stockdescription", "datetime", "transactionnum"]) {
      if (!names.has(name)) throw validationError(`Missing required column: ${name}`);
    }
    const identifier = `${mysql.escapeId(schema)}.${mysql.escapeId(table)}`;

    // Inspect every exact marker and Cardnum population, without returning Cardnum contents.
    const [markers] = await shop.query(`SELECT MIN(CehqueNum) AS marker, HEX(CehqueNum) AS markerKey,
      COUNT(*) AS lineCount,
      SUM(CASE WHEN TRIM(COALESCE(Cardnum,'')) = '' THEN 1 ELSE 0 END) AS blankCardLines
      FROM ${identifier} WHERE datetime >= ? AND datetime < ? GROUP BY HEX(CehqueNum)`, [start, end]);

    // Inspect the actual sale IDs supplied in the clearer screenshot; include both confirmed markers.
    const [lines] = await shop.query(`SELECT salenum, transactionnum, stockcode, stockdescription,
      majorno, sub1no, sub2no, CehqueNum AS marker, qty, linetotal,
      CASE WHEN TRIM(COALESCE(Cardnum,'')) = '' THEN 'blank' ELSE 'populated' END AS cardState
      FROM ${identifier} WHERE datetime >= ? AND datetime < ? AND salenum IN (?)
        AND HEX(CehqueNum) IN (HEX('ComboGroup'),HEX('Category'))
      ORDER BY salenum, transactionnum`, [start, end, sales]);

    // Bind the same dates/sales for both grouping alternatives; never calculate report money from unit price.
    const replacements = { start, endExclusive: end, sales };
    const values = [];
    const comparisonSql = buildGroupingComparisonQuery(table).replace(
      /:(start|endExclusive|sales)\b/g, (_, key) => { values.push(replacements[key]); return "?"; },
    ).replaceAll(`\`${table}\``, identifier);
    const [comparison] = await shop.query(comparisonSql, values);
    console.log(JSON.stringify({ schema, table, sales, markers, lines, comparison,
      note: "withoutSub2Value repeats across Sub2 rows of one sale/marker/Major/Sub1. Count it once, never sum the repeated cells.",
    }, null, 2));
    if (!lines.length) console.log("No source rows found for these sale IDs. Validation is incomplete.");
  } finally {
    // Close all connections after successful reads or connection/query failures.
    if (shop) await shop.end();
    if (app) await app.end();
  }
}

// Report safe diagnostics only; raw database error messages can contain connection details.
inspect().catch(error => {
  console.error("Read-only validation failed:", error.safeMessage || error.code || error.name);
  process.exitCode = 1;
});
