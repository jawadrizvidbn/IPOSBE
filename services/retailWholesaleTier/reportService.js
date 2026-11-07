const { QueryTypes } = require("sequelize");
const databaseController = require("../../controllers/databaseController");
const createSequelizeInstanceCustom = require("../../utils/sequelizeInstanceCustom");
const {
  parseRequest,
  buildMonthlyQuery,
  aggregateResults,
} = require("./reportLogic");

/**
 * Follow acrossRetailWholesaleByProductReport's existing fetching flow:
 * getActiveDatabases -> first history database -> existing connection factory
 * -> INFORMATION_SCHEMA monthly table discovery -> parameterized report queries.
 * Only classification/aggregation is specific to the new tier report.
 */
async function generateReport(query, user) {
  const request = parseRequest(query, user);
  const { serverHost, serverUser, serverPassword, serverPort } = user;

  const branches = await Promise.all(
    request.shops.map(async (shopKey) => {
      const active = await databaseController.getActiveDatabases(user, shopKey);
      let historyDbName;

      // Same first-history selection used by the existing Retail/Wholesale report.
      outer: for (const group of Object.values(active)) {
        for (const dbName of group) {
          if (dbName.includes("history")) {
            historyDbName = dbName;
            break outer;
          }
        }
      }

      const rows = [];
      const warnings = [];
      if (!historyDbName) {
        warnings.push(`${shopKey}: history database not found.`);
        return { shopKey, rows, warnings };
      }

      // Reuse all existing host, port, dialect and pool configuration unchanged.
      const db = createSequelizeInstanceCustom({
        databaseName: historyDbName,
        host: serverHost,
        username: serverUser,
        password: serverPassword,
        port: serverPort,
      });

      try {
        const existing = await db.query(
          `SELECT TABLE_NAME AS Name
           FROM INFORMATION_SCHEMA.TABLES
           WHERE TABLE_SCHEMA = :db AND TABLE_NAME IN (:list)`,
          {
            replacements: { db: historyDbName, list: request.months },
            type: QueryTypes.SELECT,
          },
        );
        const tables = new Set(existing.map((row) => row.Name));

        // Classify each month separately, as required by the customer's SQL.
        for (const month of request.months) {
          if (!tables.has(month)) {
            warnings.push(
              `${shopKey}: ${month.slice(0, 4)}-${month.slice(
                4,
                6,
              )} table not found.`,
            );
            continue;
          }

          rows.push(
            ...(await db.query(buildMonthlyQuery(month), {
              replacements: {
                start: request.start,
                endExclusive: request.endExclusive,
              },
              type: QueryTypes.SELECT,
            })),
          );
        }

        return { shopKey, rows, warnings };
      } finally {
        // Release the new report's history connection, including query failures.
        await db.close();
      }
    }),
  );

  return {
    ...aggregateResults(branches),
    shops: request.shops,
    warnings: branches.flatMap((branch) => branch.warnings),
  };
}

module.exports = { generateReport };
