const { getStartDateEndDate } = require("../utils/dashboardHelper");
const {
  getRequiredDbs,
  getDatabasesCustom,
  monthRangeTables,
} = require("../utils/databaseHelper");
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

  const validTables = monthRangeTables(startDateForTblTran, endDateForTblTran, results)
  console.log({validTables})

  if(validTables.length === 0) {
    return res.status(404).json({ message: "No data found" });
  }
  // 1) Build one subquery per month-table, pre-aggregated by product
  const subqueries = validTables.map((tbl) => `
    SELECT
      stockcode,
      stockdescription,
      SUM(linetotal) AS subTotal
    FROM \`${tbl}\`
    WHERE datetime BETWEEN :start AND :end
    GROUP BY stockcode, stockdescription
  `.trim());

  // 2) Join them all with UNION ALL
  const unionSql = subqueries.join("\nUNION ALL\n");

  // 3) Wrap with an outer aggregation to combine subtotals across months
  const finalSql = `
  -- per-product totals
  SELECT
    stockcode,
    stockdescription,
    SUM(subTotal) AS totalSales
  FROM (
    ${unionSql}
  ) AS monthly_sales
  GROUP BY stockcode, stockdescription

  UNION ALL

  -- grand total row
  SELECT
    NULL                AS stockcode,
    'Grand Total'       AS stockdescription,
    SUM(subTotal)       AS totalSales
  FROM (
    ${unionSql}
  ) AS monthly_sales_gt

  -- sort products first, grand total last
  ORDER BY
    CASE WHEN stockcode IS NULL THEN 1 ELSE 0 END,
    totalSales DESC;
`;

  // 4) Execute in one shot
  const finalResult = await historyDb.query(finalSql, {
    replacements: {
      start: startDate,
      end: endDate
    },
    type: historyDb.QueryTypes.SELECT
  });

  // const startNameExists = data.some(item => item.Name === startName)
  // const endNameExists = data.some(item => item.Name === endName)

  // console.log(results)

  res.send(finalResult);
};
