const { QueryTypes } = require('sequelize');
const { format } = require('date-fns');
const { getDatabases, getDatabasesCustom } = require('../../utils/databaseHelper');
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
exports.GrvDataFun = async (DTPFrom, DTPTo, req) => {
  try {
    // Convert the string date inputs to Date objects
    const fromDate = new Date(DTPFrom);
    const toDate = new Date(DTPTo);

    // Check for invalid date
    if (isNaN(fromDate) || isNaN(toDate)) throw new Error('Invalid date provided.');
    if (fromDate > toDate) throw new Error('From date cannot be after To date.');

    // Active databases
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { historyDb, stockmasterDb, hostDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
    });
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

    const debtorDatas = await getAccountData(stockmasterDb, 'tbldebtorsvalue', fromDate, toDate);
    aggregateResults(totals, debtorDatas && debtorDatas[0]);

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
    const reportData = {
      totalStockValue: 0,
      totalDebtors: 0,
      totalCreditors: 0,
      totals: {
        Refunds: 0,
        CashSales: 0,
        DepositSales: 0,
        CardSales: 0,
        ChequeSales: 0,
        AccountSales: 0,
        PensionSales: 0,
        PayoutTotal: 0,
        VoidsTotal: 0
      },
      debtorData: {},
      creditorData: {},
      ExclSalesCost: 0,
      InclSalesCost: 0,
      ExclSalesSelling: 0,
      InclSalesSelling: 0,
      StkAdjustments: 0,
      StkStockTake: 0
    };

    // Query for adjustments (like tbldataadjustment in VBScript)
    const adjustmentsQuery = `
      SELECT * 
      FROM tbldataadjustment 
      WHERE LEFT(name, 6) >= :fromMonth
    `;
    const adjustmentsData = await historyDb.query(adjustmentsQuery, {
      replacements: { fromMonth: format(fromDate, 'yyyyMM') },
      type: QueryTypes.SELECT,
    });

    // Process adjustments
    for (const adjustment of adjustmentsData) {
      const tableName = adjustment.name;
      let adjustQuery = '';
      if (format(fromDate, 'MM') !== format(toDate, 'MM')) {
        if (format(fromDate, 'yyyyMM') === tableName.substring(0, 6)) {
          adjustQuery = `SELECT SUM(adjusttquantity * costprice) AS AdjustedAmount FROM ${tableName} WHERE datetime >= :fromDate`;
        } else if (format(toDate, 'yyyyMM') === tableName.substring(0, 6)) {
          adjustQuery = `SELECT SUM(adjusttquantity * costprice) AS AdjustedAmount FROM ${tableName} WHERE datetime <= :toDate`;
        }
      } else {
        adjustQuery = `SELECT SUM(adjusttquantity * costprice) AS AdjustedAmount FROM ${tableName} WHERE datetime BETWEEN :fromDate AND :toDate`;
      }

      if (adjustQuery) {
        const adjustmentAmount = await historyDb.query(adjustQuery, {
          replacements: {
            fromDate: format(fromDate, 'yyyy-MM-dd HH:mm:ss'),
            toDate: format(toDate, 'yyyy-MM-dd HH:mm:ss'),
          },
          type: QueryTypes.SELECT,
        });

        if (adjustmentAmount && adjustmentAmount[0]) {
          reportData.StkAdjustments += parseFloat(adjustmentAmount[0].AdjustedAmount || 0);
        }
      }
    }

    // Process stock take data
    const stockTakeQuery = `
      SELECT * 
      FROM tbldatastocktake 
      WHERE LEFT(name, 6) >= :fromMonth
    `;
    const stockTakeData = await historyDb.query(stockTakeQuery, {
      replacements: { fromMonth: format(fromDate, 'yyyyMM') },
      type: QueryTypes.SELECT,
    });

    for (const stockTake of stockTakeData) {
      const tableName = stockTake.name;
      let stockQuery = '';
      if (format(fromDate, 'MM') !== format(toDate, 'MM')) {
        if (format(fromDate, 'yyyyMM') === tableName.substring(0, 6)) {
          stockQuery = `
            SELECT SUM(costprice) AS StockTakeAmount 
            FROM ${tableName} 
            WHERE datetime >= :fromDate
          `;
        } else if (format(toDate, 'yyyyMM') === tableName.substring(0, 6)) {
          stockQuery = `
            SELECT SUM(costprice) AS StockTakeAmount 
            FROM ${tableName} 
            WHERE datetime <= :toDate
          `;
        }
      } else {
        stockQuery = `
          SELECT SUM(costprice) AS StockTakeAmount 
          FROM ${tableName} 
          WHERE datetime BETWEEN :fromDate AND :toDate
        `;
      }

      if (stockQuery) {
        const stockTakeAmount = await historyDb.query(stockQuery, {
          replacements: {
            fromDate: format(fromDate, 'yyyy-MM-dd HH:mm:ss'),
            toDate: format(toDate, 'yyyy-MM-dd HH:mm:ss'),
          },
          type: QueryTypes.SELECT,
        });

        if (stockTakeAmount && stockTakeAmount[0]) {
          reportData.StkStockTake += parseFloat(stockTakeAmount[0].StockTakeAmount || 0);
        }
      }
    }

    // Process stock values (as in original VBScript)
    let stockQuery = `SELECT * FROM tblstockvalues WHERE tranday='${format(toDate, 'dd')}' AND tranmonth='${format(toDate, 'MM')}' AND tranyear='${format(toDate, 'yyyy')}'`;
    let stockData = await stockmasterDb.query(stockQuery, { type: QueryTypes.SELECT });

    if (!stockData || stockData.length === 0) {
      toDate.setDate(toDate.getDate() + 1);
      stockQuery = `SELECT * FROM tblstockvalues WHERE tranday='${format(toDate, 'dd')}' AND tranmonth='${format(toDate, 'MM')}' AND tranyear='${format(toDate, 'yyyy')}'`;
      stockData = await stockmasterDb.query(stockQuery, { type: QueryTypes.SELECT });
    }

    if (stockData && stockData.length > 0) {
      const stockRecord = stockData[0];
      reportData.totalStockValue = stockRecord.texclcost + stockRecord.tinclcost + stockRecord.texclselling + stockRecord.tinclselling;
    }

    // Process debtor and creditor data similarly
    const debtorQuery = `SELECT * FROM tbldebtorsvalue WHERE tranday='${format(toDate, 'dd')}' AND tranmonth='${format(toDate, 'MM')}' AND tranyear='${format(toDate, 'yyyy')}'`;
    const debtorData = await stockmasterDb.query(debtorQuery, { type: QueryTypes.SELECT });

    const creditorQuery = `SELECT * FROM tblcreditorsvalue WHERE tranday='${format(toDate, 'dd')}' AND tranmonth='${format(toDate, 'MM')}' AND tranyear='${format(toDate, 'yyyy')}'`;
    const creditorData = await stockmasterDb.query(creditorQuery, { type: QueryTypes.SELECT });

    // Step 4: Process Stock Data (same as original)
    if (stockData && stockData.length > 0) {
      const stockRecord = stockData[0];
      reportData.totalStockValue = stockRecord.texclcost + stockRecord.tinclcost + stockRecord.texclselling + stockRecord.tinclselling;
    }

    // Step 5: Process Debtors Data (same as original)
    if (debtorData && debtorData.length > 0) {
      const debtorRecord = debtorData[0];
      reportData.debtorData = debtorRecord;
    }

    // Step 6: Process Creditors Data (same as original)
    if (creditorData && creditorData.length > 0) {
      const creditorRecord = creditorData[0];
      reportData.creditorData = creditorRecord;
    }

    // Step 7: Calculate Refunds (same as original)
    const refundsQuery = `SELECT SUM(linetotal) AS Refunds FROM tmpdata_current_tran WHERE qty < 0`;
    const refundsData = await hostDb.query(refundsQuery, { type: QueryTypes.SELECT });

    if (refundsData && refundsData[0]) {
      reportData.totals.Refunds = refundsData[0].Refunds || 0;
    }

    // Step 8: Calculate Sales and Financial Data (same as original)
    const financialQuery = `SELECT 
      SUM(averagecostprice * qty) AS ExclCost, 
      SUM((averagecostprice * qty) * (1 + vatpercentage / 100)) AS InclCost, 
      SUM(linetotal) AS InclSelling, 
      SUM(linetotal / (1 + vatpercentage / 100)) AS ExclSelling 
    FROM tmpdata_current_tran`;

    const financialData = await hostDb.query(financialQuery, { type: QueryTypes.SELECT });

    if (financialData && financialData[0]) {
      reportData.ExclSalesCost = financialData[0].ExclCost || 0;
      reportData.InclSalesCost = financialData[0].InclCost || 0;
      reportData.ExclSalesSelling = financialData[0].ExclSelling || 0;
      reportData.InclSalesSelling = financialData[0].InclSelling || 0;
    }

    // Step 9: Add calculations for sales by payment type (same as original)
    const salesMapping = {
      'Cash': 'CashSales',
      'D.Deposit': 'DepositSales',
      'Card': 'CardSales',
      'Cheque': 'ChequeSales',
      'Account': 'AccountSales',
      'Pension': 'PensionSales'
    };

    const salesQuery = `SELECT paymenttype, SUM(tenderAmount) AS TTotal FROM tbldata_splittender WHERE datetime BETWEEN ? AND ? GROUP BY paymenttype`;
    const salesData = await stockmasterDb.query(salesQuery, {
      replacements: [format(fromDate, 'yyyy-MM-dd HH:mm:ss'), format(toDate, 'yyyy-MM-dd HH:mm:ss')],
      type: QueryTypes.SELECT,
    });

    salesData.forEach((record) => {
      if (salesMapping[record.paymenttype]) {
        reportData.totals[salesMapping[record.paymenttype]] += record.TTotal;
      }
    });

    // Step 10: Add Cashout Calculation (same as original)
    const cashoutQuery = `SELECT SUM(tenderAmount) AS CashoutTotal FROM tbldata_splittender WHERE paymenttype='Cash' AND datetime BETWEEN ? AND ?`;
    const cashoutData = await stockmasterDb.query(cashoutQuery, {
      replacements: [format(fromDate, 'yyyy-MM-dd HH:mm:ss'), format(toDate, 'yyyy-MM-dd HH:mm:ss')],
      type: QueryTypes.SELECT,
    });

    if (cashoutData && cashoutData[0]) {
      reportData.totals.PayoutTotal = cashoutData[0].CashoutTotal || 0;
    }

    // Step 11: Add Voids Calculation (same as original)
    const voidsQuery = `SELECT SUM(InclSellingPrice) AS VoidsTotal FROM tbldata_cancel_tran WHERE datetime BETWEEN ? AND ?`;
    const voidsData = await stockmasterDb.query(voidsQuery, {
      replacements: [format(fromDate, 'yyyy-MM-dd HH:mm:ss'), format(toDate, 'yyyy-MM-dd HH:mm:ss')],
      type: QueryTypes.SELECT,
    });

    if (voidsData && voidsData[0]) {
      reportData.totals.VoidsTotal = voidsData[0].VoidsTotal || 0;
    }

    // Return the complete report
    return { reportData, totals };

  } catch (error) {
    console.error('Error generating GRV report:', error);
    throw new Error('Error generating GRV report');
  }
};
