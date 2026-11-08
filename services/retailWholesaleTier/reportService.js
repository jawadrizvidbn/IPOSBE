const { QueryTypes } = require("sequelize");
const databaseController = require("../../controllers/databaseController");
const { getGroupFields } = require("./groupClassification");
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
  // Validate request inputs before reusing the existing database access flow.
  const request = parseRequest(query, user);
  const { serverHost, serverUser, serverPassword, serverPort } = user;

  // Fetch selected branches concurrently, matching the original report.
  const branches = await Promise.all(
    request.shops.map(async (shopKey) => {
      // Discover the user’s branch databases through the existing shared helper.
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
      // Report a missing history database explicitly instead of hiding incomplete data.
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

      // Discover available monthly tables within the selected history database.
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
          // Warn about absent months while keeping results from available months.
          if (!tables.has(month)) {
            warnings.push(
              `${shopKey}: ${month.slice(0, 4)}-${month.slice(
                4,
                6,
              )} table not found.`,
            );
            continue;
          }

          // Execute the tier SQL with bound dates and append this month’s results.
          rows.push(
            ...(await db.query(buildMonthlyQuery(month, request.includeSub2), {
              replacements: {
                start: request.start,
                endExclusive: request.endExclusive,
              },
              type: QueryTypes.SELECT,
            })),
          );
        }

        // Disclose unmatched lines even when signed quantities and values cancel to zero.
        const unmatchedLines = rows.reduce((sum, row) => sum + Number(row.unmatchedLineCount || 0), 0);
        if (unmatchedLines) {
          warnings.push(`${shopKey}: ${unmatchedLines} unmatched lines retain their existing Retail/Wholesale classification; review validation amounts before using these totals.`);
        }

        // Preserve branch identity for the final cross-store aggregation.
        return { shopKey, rows, warnings };
      } finally {
        // Release the new report's history connection, including query failures.
        await db.close();
      }
    }),
  );

  // Combine branch results and expose any missing-data warnings to the frontend.
  return {
    ...aggregateResults(branches),
    // Keep unexpected records visible as validation, outside the standard business columns.
    validationLineCount: branches.reduce((sum, branch) => sum + branch.rows.reduce((count, row) => count + Number(row.unmatchedLineCount || 0), 0), 0),
    shops: request.shops,
    warnings: branches.flatMap((branch) => branch.warnings),
    // Echo the submitted grouping so existing results and exports never follow an edited checkbox.
    includeSub2: request.includeSub2,
    grouping: { combo: getGroupFields(request.includeSub2), category: getGroupFields(request.includeSub2) },
  };
}

module.exports = { generateReport };
