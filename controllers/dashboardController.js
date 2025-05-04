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
