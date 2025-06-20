const { QueryTypes } = require("sequelize");
const { getStartDateEndDate } = require("../utils/dashboardHelper");
const {
  getRequiredDbs,
  getDatabasesCustom,
  monthRangeTables,
} = require("../utils/databaseHelper");
const createSequelizeInstanceCustom = require("../utils/sequelizeInstanceCustom");
const databaseController = require("./databaseController");

exports.salesOverview = async (req, res) => {
  const { shopKey, duration } = req.query;
  const { serverHost, serverUser, serverPassword, serverPort } = req.user;

  const { startDate: startDateForTblTran, endDate: endDateForTblTran } =
    getStartDateEndDate(duration, true);
  const { startDate, endDate } = getStartDateEndDate(duration);

  // console.log({ startDate, endDate });

  const activeDatabases = await databaseController.getActiveDatabases(
    req.user,
    shopKey
  );

  const { historyDb, stockmasterDb } = await getDatabasesCustom({
    activeDatabases,
    serverHost,
    serverUser,
    serverPassword,
    serverPort,
  });

  let sqlQuery = `SELECT * FROM tbldatacurrent_tran`;
  const results = await historyDb.query(sqlQuery, {
    type: historyDb.QueryTypes.SELECT,
  });

  if (results.length === 0) {
    return res.status(404).json({ message: "No data found" });
  }

  const validTables = monthRangeTables(
    startDateForTblTran,
    endDateForTblTran,
    results
  );
  console.log({ validTables });

  if (validTables.length === 0) {
    return res.status(404).json({ message: "No data found" });
  }
  // 1) Build one subquery per month-table, pre-aggregated by product
  const subqueries = validTables.map((tbl) =>
    `
    SELECT
      stockcode,
      stockdescription,
      SUM(linetotal) AS subTotal
    FROM \`${tbl}\`
    WHERE datetime BETWEEN :start AND :end
    GROUP BY stockcode, stockdescription
  `.trim()
  );

  // 2) Join them all with UNION ALL
  const unionSql = subqueries.join("\nUNION ALL\n");

  // 3) Wrap with an outer aggregation to combine subtotals across months
  const finalSql = `
    (
      SELECT stockcode, stockdescription, totalSales, isGrand
      FROM (
        SELECT
          stockcode,
          stockdescription,
          SUM(subTotal)    AS totalSales,
          0                AS isGrand
        FROM (
          ${unionSql}
        ) AS monthly_sales
        GROUP BY stockcode, stockdescription
        ORDER BY totalSales DESC
        LIMIT 4
      ) AS top_products
    )
    UNION ALL
    (
      SELECT stockcode, stockdescription, totalSales, isGrand
      FROM (
        SELECT
          NULL             AS stockcode,
          'Grand Total'    AS stockdescription,
          SUM(subTotal)    AS totalSales,
          1                AS isGrand
        FROM (
          ${unionSql}
        ) AS monthly_sales_gt
      ) AS grand_total
    )
    ORDER BY
      isGrand ASC,
      totalSales DESC;
  `;

  // 4) Execute in one shot
  const finalResult = await historyDb.query(finalSql, {
    replacements: {
      start: startDate,
      end: endDate,
    },
    type: historyDb.QueryTypes.SELECT,
  });

  // const startNameExists = data.some(item => item.Name === startName)
  // const endNameExists = data.some(item => item.Name === endName)

  // console.log(results)

  res.send(finalResult);
};

exports.getRevenueReportForYear = async (req, res) => {
  try {
    const { shopKey, year: yearParam } = req.query;
    const { serverHost, serverUser, serverPassword, serverPort } = req.user;

    if (!shopKey) {
      return res
        .status(400)
        .json({ success: false, message: "`shopKey` is required" });
    }

    // 1) decide which calendar year to report
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    if (isNaN(year) || year < 2000 || year > 3000) {
      return res
        .status(400)
        .json({ success: false, message: "`year` must be a valid number" });
    }

    // 2) derive the date window and table‐names
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    const startTbl = `${year}01tbldata_current_tran`;
    const endTbl = `${year}12tbldata_current_tran`;

    // 3) pick the history‐DB for this shopKey
    const activeDbs = await databaseController.getActiveDatabases(
      req.user,
      shopKey
    );
    let historyDbName;
    for (const grp of Object.values(activeDbs)) {
      for (const db of grp) {
        if (db.includes("history")) {
          historyDbName = db;
          break;
        }
      }
      if (historyDbName) break;
    }
    if (!historyDbName) {
      return res
        .status(404)
        .json({ success: false, message: "History database not found" });
    }

    // 4) connect to history DB
    const historyDb = createSequelizeInstanceCustom({
      databaseName: historyDbName,
      host: serverHost,
      username: serverUser,
      password: serverPassword,
      port: serverPort,
    });

    // 5) list all monthly tables in that DB
    const allTables = await historyDb.query(
      `
      SELECT TABLE_NAME AS Name
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = :db
        AND TABLE_NAME LIKE '%tbldata_current_tran'
      `,
      {
        replacements: { db: historyDbName },
        type: QueryTypes.SELECT,
      }
    );

    // 6) pick only those 12 tables for Jan→Dec of that year
    const tablesInRange = monthRangeTables(startTbl, endTbl, allTables);
    if (!tablesInRange.length) {
      return res.json({ success: true, data: [] });
    }

    // 7) build one subquery per table: sum earning & expense by month
    const subqueries = tablesInRange.map((tbl) =>
      `
      SELECT
        HisMonth         AS month,
        SUM(linetotal)   AS earning,
        SUM(averagecostprice * qty) AS expense
      FROM \`${tbl}\`
      WHERE datetime BETWEEN :start AND :end
      GROUP BY HisMonth
    `.trim()
    );

    // 8) UNION ALL + final roll-up across months
    const unionSql = subqueries.join("\nUNION ALL\n");
    const finalSql = `
      SELECT
        month,
        SUM(earning) AS earning,
        SUM(expense) AS expense
      FROM (
        ${unionSql}
      ) AS u
      GROUP BY month
      ORDER BY month;
    `;

    // 9) execute
    const rows = await historyDb.query(finalSql, {
      replacements: { start: startDate, end: endDate },
      type: QueryTypes.SELECT,
    });

    // 10) map month numbers → labels, invert expense for charting
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const data = rows.map((r) => ({
      month: monthNames[Number(r.month) - 1],
      earning: Number(r.earning),
      expense: -Math.abs(Number(r.expense)),
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error("getRevenueReportForYear:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * POST /api/stores/top
 *
 * Body:
 *   {
 *     "shopKeys": ["SHOP_A", "SHOP_B", ...]
 *   }
 *
 * Optional query-param:
 *   ?year=2025
 */
exports.getTopStores = async (req, res) => {
  try {
    const { shopKeys } = req.body;
    const yearParam = req.query.year;
    const { serverHost, serverUser, serverPassword, serverPort } = req.user;

    // 1) Validate shopKeys array
    if (!Array.isArray(shopKeys) || shopKeys.length === 0) {
      return res.status(400).json({
        success: false,
        message: "`shopKeys` must be a non-empty array",
      });
    }

    // 2) Determine which calendar year to use (defaults to current)
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    if (isNaN(year) || year < 2000 || year > 3000) {
      return res.status(400).json({
        success: false,
        message: "`year` must be a valid 4-digit number.",
      });
    }

    // 3) Precompute the start/end timestamps for SQL filters
    const yearStart = `${year}-01-01 00:00:00`;
    const yearEnd = `${year}-12-31 23:59:59`;

    // 4) For each shopKey, build a Promise that:
    //    a) finds its history DB name
    //    b) lists all monthly tables for that DB
    //    c) filters the ones for our YYYYMM range
    //    d) runs one UNION-ALL query to get totalCost, totalSelling, totalTransactions
    //    e) returns { shopKey, totalCost, totalSelling, profit, totalTransactions, avgPerTransaction }
    let storeFields = [];

    const perShopPromises = shopKeys.map(async (shopKey) => {
      // 4a) find "history" DB for this shopKey
      const allDbs = await databaseController.getActiveDatabases(
        req.user,
        shopKey
      );

      let historyDbName;
      let masterDbName;
      outerLoop:
      for (const grp of Object.values(allDbs)) {
        for (const dbName of grp) {
          // if we haven't found history yet and this one matches, grab it
          if (historyDbName === null && dbName.includes("history")) {
            historyDbName = dbName;
          }
          // if we haven't found master yet and this one matches, grab it
          if (masterDbName  === null && dbName.includes("master")) {
            masterDbName = dbName;
          }
          // once we've got both, stop all looping
          if (historyDbName && masterDbName) {
            break outerLoop;
          }
        }
      }
      if (!historyDbName) {
        // If no history DB, treat as zero-sales
        return {
          shopKey,
          totalCost: 0,
          totalSelling: 0,
          profit: 0,
          totalTransactions: 0,
          avgPerTransaction: 0,
        };
      }

      // 4b) connect to that history DB
      const historyDb = createSequelizeInstanceCustom({
        databaseName: historyDbName,
        host: serverHost,
        username: serverUser,
        password: serverPassword,
        port: serverPort,
      });

      const masterDb = createSequelizeInstanceCustom({
        databaseName: masterDbName,
        host: serverHost,
        username: serverUser,
        password: serverPassword,
        port: serverPort,
      });
      // 4c) figure out the twelve expected "YYYYMMtbldata_current_tran" table names for `year`
      const expectedTables = [];
      for (let m = 1; m <= 12; ++m) {
        const mm = String(m).padStart(2, "0");
        expectedTables.push(`${year}${mm}tbldata_current_tran`);
      }

      try {
        const storeFieldsQuery = await masterDb.query(
          `
          SELECT *
          FROM tblstorefields
        `,
          {
            type: QueryTypes.SELECT,
          }
        );

        storeFields.push({shopKey: storeFieldsQuery[0]})
      } catch (err) {
        console.error("getTopStores:", err);
      }

      // 4d) query INFORMATION_SCHEMA to see which of those actually exist
      const existingTables = await historyDb.query(
        `
        SELECT TABLE_NAME AS Name
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = :dbName
          AND TABLE_NAME IN (:tableList)
        `,
        {
          replacements: {
            dbName: historyDbName,
            tableList: expectedTables,
          },
          type: QueryTypes.SELECT,
        }
      );
      const tablesInYear = existingTables.map((r) => r.Name);
      if (!tablesInYear.length) {
        // No monthly data: return zeros
        return {
          shopKey,
          totalCost: 0,
          totalSelling: 0,
          profit: 0,
          totalTransactions: 0,
          avgPerTransaction: 0,
        };
      }

      // 4e) for each monthly table, build a subquery that computes:
      //       subCost        = SUM(averagecostprice * qty)
      //       subSelling     = SUM(linetotal)
      //       subTransactions= COUNT(DISTINCT transactionnum)
      const subqueries = tablesInYear.map((tbl) =>
        `
        SELECT
          SUM(averagecostprice * qty)    AS subCost,
          SUM(linetotal)                 AS subSelling,
          COUNT(DISTINCT transactionnum) AS subTransactions
        FROM \`${tbl}\`
        WHERE datetime BETWEEN :yearStart AND :yearEnd
      `.trim()
      );

      // 4f) UNION ALL them, then do one final "SELECT SUM(...)"
      const unionSql = subqueries.join("\nUNION ALL\n");
      const finalSql = `
        SELECT
          SUM(subCost)         AS totalCost,
          SUM(subSelling)      AS totalSelling,
          SUM(subTransactions) AS totalTransactions
        FROM (
          ${unionSql}
        ) AS yearly_union;
      `;

      const [aggregateRow] = await historyDb.query(finalSql, {
        replacements: { yearStart, yearEnd },
        type: QueryTypes.SELECT,
      });

      // 4g) parse numbers, compute profit & average per txn
      const totalCost = Number(aggregateRow.totalCost) || 0;
      const totalSelling = Number(aggregateRow.totalSelling) || 0;
      const totalTransactions = Number(aggregateRow.totalTransactions) || 0;
      const profit = totalSelling - totalCost;
      const avgPerTransaction =
        totalTransactions > 0 ? totalSelling / totalTransactions : 0;

      return {
        shopKey,
        totalCost,
        totalSelling,
        profit,
        totalTransactions,
        avgPerTransaction,
        
      };
    }); // end map(shopKey → metrics)

    // 5) await all shops
    const shopsMetrics = await Promise.all(perShopPromises);

    // 6) sort & slice for "byTurnover" (top 5) and "byTransactions" (top 10)
    const byTurnover = [...shopsMetrics]
      .sort((a, b) => b.totalSelling - a.totalSelling)
      .slice(0, 5);

    const byTransactions = [...shopsMetrics]
      .sort((a, b) => b.totalTransactions - a.totalTransactions)
      .slice(0, 10);

    // 7) return JSON
    return res.json({
      success: true,
      data: {
        byTurnover,
        byTransactions,
        storeFields,
        sortableKeys: [
          "totalSelling",
          "totalCost",
          "totalTransactions",
          "profit",
          "avgPerTransaction",
        ],
      },
    });
  } catch (err) {
    console.error("getTopStoresByShopKeys error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching top stores.",
    });
  }
};
