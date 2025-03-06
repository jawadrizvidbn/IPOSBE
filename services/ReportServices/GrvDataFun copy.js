const { QueryTypes } = require('sequelize');
const { format } = require('date-fns');
const { getDatabases } = require('../../utils/databaseHelper');
const databaseController = require('../../controllers/databaseController');

// Helper function to handle errors
const handleError = (message, error) => {
  console.error(`${message}:`, error.message || error);
  throw new Error(`${message}: ${error.message || error}`);
};

// Helper function to format date condition based on month
// Helper function to format date condition based on month
const getDateCondition = (tableName, fromDate, toDate) => {
  if (!tableName) {
    console.error("Error: tableName is undefined or null");
    return '';  // If tableName is invalid, return empty condition
  }

  const tableMonth = tableName.slice(0, 6); // Extract month from table name
  const formattedFromDate = format(fromDate, 'yyyy-MM-dd HH:mm:ss');
  const formattedToDate = format(toDate, 'yyyy-MM-dd HH:mm:ss');

  if (tableMonth === format(fromDate, 'yyyyMM')) {
    return `datetime >= '${formattedFromDate}'`;
  }
  if (tableMonth === format(toDate, 'yyyyMM')) {
    return `datetime <= '${formattedToDate}'`;
  }
  if (tableMonth > format(fromDate, 'yyyyMM') && tableMonth < format(toDate, 'yyyyMM')) {
    return `datetime BETWEEN '${formattedFromDate}' AND '${formattedToDate}'`;
  }
  return ''; // If no condition matches, return an empty string
};


// Fetch financial data (GRV, Debtors, Creditors)
const getFinancialData = async (db, tableName, dateCondition) => {
  return await db.query(
    `SELECT 
      SUM(COALESCE(exclusiveunitcost, 0) * quantityreceived) AS ExclCost,
      SUM(COALESCE(inclusiveunitcost, 0) * quantityreceived) AS InclCost,
      SUM(COALESCE(exclusiveselling, 0) * quantityreceived) AS ExclSelling,
      SUM(COALESCE(inclusiveselling, 0) * quantityreceived) AS InclSelling
    FROM ${tableName} WHERE ${dateCondition}`,
    { type: QueryTypes.SELECT }
  );
};

// Helper function to fetch debtor/creditor data
const getAccountData = async (db, tableName, fromDate, toDate) => {
  const dateCondition = getDateCondition(tableName, fromDate, toDate);
  if (!dateCondition) return null;

  return await db.query(
    `SELECT 
      current, "30days", "60days", "90days", "120days", "150days", "180days", 
      TotalBalance, totalnoofdebtors, debtorwithbalance
    FROM ${tableName} WHERE ${dateCondition}`,
    { type: QueryTypes.SELECT }
  );
};

// Aggregating results into totals
const aggregateResults = (totals, data, type) => {
  if (!data) return;

  const keyMap = {
    ExclCost: 'CrExclGRVCost',
    InclCost: 'CrInclGRVCost',
    ExclSelling: 'CrExclSelling',
    InclSelling: 'CrInclGRVSelling',
    // Add more mappings here as needed
  };

  Object.keys(data).forEach((key) => {
    if (keyMap[key]) {
      totals[keyMap[key]] += data[key] || 0;
    }
  });
};

// Main function to calculate GRV, Debtor, Creditor, and Payout data
exports.GrvDataFun = async (DTPFrom, DTPTo) => {
  try {
    const fromDate = new Date(DTPFrom);
    const toDate = new Date(DTPTo);

    if (isNaN(fromDate) || isNaN(toDate)) {
      throw new Error('Invalid date provided.');
    }

    const activeDatabases = await databaseController.getActiveDatabases();
    const { historyDb, stockmasterDb, hostDb, debtorsDb } = getDatabases(activeDatabases);

    let totals = {
      CrExclGRVCost: 0,
      CrInclGRVCost: 0,
      CrExclSelling: 0,
      CrInclGRVSelling: 0,
      CrNONVATCost: 0,
      CrNONVATSelling: 0,
      DrCurrent: 0,
      Dr30Days: 0,
      Dr60Days: 0,
      Dr90Days: 0,
      Dr120Days: 0,
      Dr150Days: 0,
      Dr180Days: 0,
      DrTotals: 0,
      lblNoOfDebtors: 0,
      lblDebtorsWithBalance: 0,
      CrCurrent: 0,
      CR30Days: 0,
      Cr60Days: 0,
      Cr90Days: 0,
      Cr120Days: 0,
      Cr150Days: 0,
      Cr180Days: 0,
      CrTotals: 0,
      lblNoOfCreditors: 0,
      lblCreditorsWithBalance: 0,
      PayoutTotal: 0,
      CrInvoices: 0,
      CrPayments: 0,
      CrDebitNotes: 0,
      CrCreditNotes: 0,
      DCashSales: 0,
      DDepositSales: 0,
      DCardSales: 0,
      DChequeSales: 0,
      DAccountSales: 0,
      DPensionSales: 0,
    };

    const startMonth = format(fromDate, 'yyyyMM');
    const endMonth = format(toDate, 'yyyyMM');

    const tables = await historyDb.query(
      `SELECT name FROM tbldatagrv WHERE LEFT(name, 6) >= ?`,
      { replacements: [startMonth], type: QueryTypes.SELECT }
    );

    // GRV table processing
    for (const table of tables) {
      const dateCondition = getDateCondition(table.name, fromDate, toDate);
      if (!dateCondition) continue;

      const financialData = await getFinancialData(historyDb, table.name, dateCondition);
      aggregateResults(totals, financialData[0]);
    }

    const debtorData = await getAccountData(stockmasterDb, 'tbldebtorsvalue', fromDate, toDate);
    aggregateResults(totals, debtorData && debtorData[0]);

    // Creditor data processing
    const creditorDataQuery = `SELECT * FROM tbldatacreditor_tran WHERE LEFT(name, 6) >= ?`;
    const creditorTables = await historyDb.query(creditorDataQuery, {
      replacements: [startMonth],
      type: QueryTypes.SELECT,
    });

    for (const creditorTable of creditorTables) {
      const dateCondition = getDateCondition(creditorTable.name, fromDate, toDate);
      if (!dateCondition) continue;

      const creditorTransactionData = await historyDb.query(
        `SELECT SUM(amount) AS TAmount, description
         FROM ${creditorTable.name}
         WHERE ${dateCondition}
         GROUP BY LEFT(description, 3)`,
        { type: QueryTypes.SELECT }
      );

      creditorTransactionData.forEach((row) => {
        switch (row.description.substring(0, 3)) {
          case 'Acc': totals.CrInvoices += row.TAmount || 0; break;
          case 'Pay': totals.CrPayments += row.TAmount || 0; break;
          case 'Deb': totals.CrDebitNotes += row.TAmount || 0; break;
          case 'Cre': totals.CrCreditNotes += row.TAmount || 0; break;
        }
      });
    }

    // Payout data processing
    const payoutTables = await historyDb.query(
      `SELECT name FROM tbldatapayout WHERE LEFT(name, 6) >= ?`,
      { replacements: [startMonth], type: QueryTypes.SELECT }
    );

    for (const payoutTable of payoutTables) {
      const payoutDateCondition = getDateCondition(payoutTable.name, fromDate, toDate);
      if (!payoutDateCondition) continue;

      const payoutData = await historyDb.query(
        `SELECT SUM(amount) AS TotalAmount FROM ${payoutTable.name} WHERE ${payoutDateCondition}`,
        { type: QueryTypes.SELECT }
      );

      if (payoutData.length) {
        totals.PayoutTotal += payoutData[0].TotalAmount || 0;
      }
    }

    // Fetch payment types
    const paymentTypes = await hostDb.query(
      `SELECT sum(linetotal) as TTotal, paymenttype 
       FROM tmpdata_current_tran 
       GROUP BY paymenttype`,
      { type: QueryTypes.SELECT }
    );

    paymentTypes.forEach((type) => {
      switch (type.paymenttype) {
        case 'Cash': totals.DCashSales += type.TTotal || 0; break;
        case 'Deposit': totals.DDepositSales += type.TTotal || 0; break;
        case 'Card': totals.DCardSales += type.TTotal || 0; break;
        case 'Cheque': totals.DChequeSales += type.TTotal || 0; break;
        case 'Account': totals.DAccountSales += type.TTotal || 0; break;
        case 'Pension': totals.DPensionSales += type.TTotal || 0; break;
      }
    });

    return totals;
  } catch (error) {
    handleError('Error in calculating GRV data', error);
  }
};
