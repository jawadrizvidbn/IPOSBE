const { QueryTypes } = require('sequelize');
const { format, addDays } = require('date-fns');
const { getDatabases, getDatabasesCustom } = require('../../utils/databaseHelper');
const databaseController = require('../../controllers/databaseController');

const handleError = (message, error) => {
  console.error(`${message}:`, error.message || error);
  throw new Error(message);
};

// Utility to format date as 'YYYYMMDD'
const formatDate = (date) => format(date, 'yyyyMMdd');

// Query with retry logic
const queryWithRetry = async (db, tableName, reportDate, retries = 3) => {
  const allowedTables = ['tblstockvalues', 'tbldebtorsvalue', 'tblcreditorsvalue'];
  if (!allowedTables.includes(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  let attempt = 0;
  let results = [];
  while (attempt < retries && results.length === 0) {
    try {
      const formattedDate = formatDate(reportDate);
      
      console.log(`Attempting query on table: ${tableName} for date ${formattedDate}`);
      results = await db.query(
        `SELECT * FROM ${tableName} WHERE CONCAT(tranyear, tranmonth, tranday) = :reportDate`,
        {
          replacements: { reportDate: formattedDate },
          type: QueryTypes.SELECT,
        }
      );

      console.log(`Query attempt ${attempt + 1} results:`, results);
    } catch (error) {
      console.error(`Query attempt ${attempt + 1} failed:`, error.message);
    }

    if (results.length === 0) {
      attempt++;
    }
  }

  if (results.length === 0) {
    throw new Error('No data found after retries.');
  }

  return results;
};

// Main function to fetch financial summary data
exports.FinancialSummary = async (startDate, endDate, req) => {
  try {
    if (isNaN(new Date(startDate)) || isNaN(new Date(endDate))) {
      throw new Error('Invalid start or end date provided.');
    }

    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    if (!activeDatabases || activeDatabases.length === 0) {
      throw new Error('No active databases available.');
    }

    const { stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
    });
    if (!stockmasterDb) {
      throw new Error('Stockmaster database is not configured or connected.');
    }

    let reportDate = new Date(endDate);

    // Query stock values and debtors values between the two dates
    let stockValues = await queryWithRetry(stockmasterDb, 'tblstockvalues', addDays(reportDate, 1));
    let mappedStockValues = stockValues.map(stockValue => ({
      StkExclCost: (stockValue.TExclCost || 0).toFixed(2),
      StkInclCost: (stockValue.TInclCost || 0).toFixed(2),
      StkExclSelling: (stockValue.TExclSelling || 0).toFixed(2),
      StkInclSelling: (stockValue.TInclSelling || 0).toFixed(2),
      StkProjectedProfit: ((stockValue.TInclSelling || 0) - (stockValue.TExclCost || 0)).toFixed(2),
      ZeroRatedTotal: (stockValue.ZeroRated || 0).toFixed(2),
      StandardTotal: (stockValue.Standard || 0).toFixed(2),
    }));

    let debtorsValues = await queryWithRetry(stockmasterDb, 'tbldebtorsvalue', addDays(reportDate, 1));
    let mappedDebtorsValues = debtorsValues.map(debtor => ({
      DrCurrent: (debtor.Current || 0).toFixed(2),
      Dr30Days: (debtor['30Days'] || 0).toFixed(2),
      Dr60Days: (debtor['60Days'] || 0).toFixed(2),
      Dr90Days: (debtor['90Days'] || 0).toFixed(2),
    }));

    let creditorsValues = await queryWithRetry(stockmasterDb, 'tblcreditorsvalue', addDays(reportDate, 1));
    let mappedCreditorsValues = creditorsValues.map(creditor => ({
      CrCurrent: (creditor.Current || 0).toFixed(2),
      Cr30Days: (creditor['30Days'] || 0).toFixed(2),
      Cr60Days: (creditor['60Days'] || 0).toFixed(2),
      Cr90Days: (creditor['90Days'] || 0).toFixed(2),
    }));

    return {
      stockValues: mappedStockValues,
      debtorsValues: mappedDebtorsValues,
      creditorsValues: mappedCreditorsValues,
    };
  } catch (error) {
    handleError('Error fetching financial summary data', error);
  }
};
