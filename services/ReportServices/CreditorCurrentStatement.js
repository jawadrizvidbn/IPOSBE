const { getDatabases } = require('../../utils/databaseHelper');
const databaseController = require("../../controllers/databaseController");
const { QueryTypes } = require('sequelize');
const { format, getYear, getMonth, isValid } = require('date-fns');

// Helper function for error handling
const handleError = (message, error) => {
  console.error(`${message}:`, error.message || error);
  throw new Error(message);
};

// Insert history records into tbltmpCTran
const insertHistoryRecords = async (debtorsDb, historyRecords, creditorRecord) => {
  let currentBalance = creditorRecord?.BalanceForward || 0;
  let current = creditorRecord.CurrentBalance;
  let days30 = creditorRecord?.['30days'];
  let days60 = creditorRecord?.['60days'];
  let days90 = creditorRecord?.['90days'];
  let days120 = creditorRecord?.['120days'];
  let days150 = creditorRecord?.['150days'];
  let days180 = creditorRecord?.['180days'];

  const recordsToInsert = historyRecords.map(record => {
    const { DateTime, Creditorcode, Reference, OrderNo, Description, Amount, TransType, date } = record;

    // Handle DateTime (with time) or Date (without time)
    let formattedDateTime = null;

    if (DateTime && isValid(new Date(DateTime))) {
      formattedDateTime = format(new Date(DateTime), 'yyyy-MM-dd HH:mm:ss');
    } else if (date && isValid(new Date(date))) {
      formattedDateTime = format(new Date(date), 'yyyy-MM-dd') + ' 00:00:00';
    } else {
      console.warn(`Invalid or null Date/DateTime for CreditorCode: ${Creditorcode || 'undefined'}, setting to null.`);
    }

    let debitAmount = 0;
    let creditAmount = 0;
    let balanceAmount = currentBalance;

    if (TransType === 'DT') {
      debitAmount = Amount;
      currentBalance += Amount;
      balanceAmount = currentBalance;
    } else if (TransType === 'CT') {
      creditAmount = Amount;
      currentBalance -= Amount;
      balanceAmount = currentBalance;
    }

    return {
      DateTime: formattedDateTime,
      Creditorcode: Creditorcode || creditorRecord.CreditorCode,  // Fallback to creditorRecord.CreditorCode if not found
      Reference: Reference || '0',  // Default to 'N/A' if reference is missing
      OrderNo: OrderNo || '0',  // Default to 'N/A' if OrderNo is missing
      Description: Description || 'Balance B/F',  // Provide default if Description is missing
      TransType,
      DebitAmount: debitAmount,
      CreditAmount: creditAmount,
      BalanceAmount: balanceAmount
    };
  });

  return { currentBalance, current, days30, days60, days90, days120, days150, days180, recordsToInsert };
};

exports.currentCreditorStatement = async (cmbCode, startDate, endDate) => {
  try {
    // Get active databases
    const activeDatabases = await databaseController.getActiveDatabases();
    const { stockmasterDb, historyDb } = getDatabases(activeDatabases);

    if (!stockmasterDb || !historyDb) {
      throw new Error('Required databases not found');
    }

    // Fetch creditor record
    const creditorRecordsQuery = `SELECT * FROM tblcreditor WHERE creditorcode = :cmbCode`;
    const creditorRecords = await stockmasterDb.query(creditorRecordsQuery, {
      replacements: { cmbCode },
      type: QueryTypes.SELECT
    });

    if (!creditorRecords.length) {
      return { message: `No creditor records found for creditor code: ${cmbCode}` };
    }

    const creditorRecord = creditorRecords[0];

    // Extract Last Balance Forward date
    const lastBF = creditorRecord.LastBf;
    if (!lastBF) {
      return { message: `Last balance forward date not found for creditor code: ${cmbCode}` };
    }

    const lastBFDate = new Date(lastBF);
    if (isNaN(lastBFDate.getTime())) {
      console.log(`Invalid LastBF date for creditor code: ${cmbCode}: ${lastBF}`);
      return { message: `Invalid LastBF date format for creditor code: ${cmbCode}` };
    }

    const lastBFDateFormatted = format(lastBFDate, 'yyyy-MM-dd'); // Format LastBF date

    // Balance Forward record
    const balanceForwardRecord = {
      date: format(lastBFDate, 'yyyy-MM-dd HH:mm:ss'),
      creditorcode: creditorRecord?.CreditorCode || creditorRecord?.creditorcode,
      reference: creditorRecord?.reference || '0',
      orderNo: null,
      description: 'Balance B/F',
      transtype: null,
      debitAmount: '0',
      creditAmount: '0',
      balanceAmount: creditorRecord.BalanceForward
    };

    console.log('Balance Forward Record:', balanceForwardRecord);

    // Fetch history records
    const historyRecords = [];
    let year = getYear(lastBFDate);
    let month = getMonth(lastBFDate) + 1;
    let hasMoreRecords = true;

    while (hasMoreRecords) {
      const historyTableName = `${year}${String(month).padStart(2, '0')}tbldata_creditors_tran`;

      // Check if the history table exists before querying
      const tableExistsQuery = `SHOW TABLES LIKE :tableName`;
      const tableExists = await historyDb.query(tableExistsQuery, {
        replacements: { tableName: historyTableName },
        type: QueryTypes.SELECT
      });

      if (!tableExists.length) {
        console.warn(`Table ${historyTableName} does not exist. Skipping...`);
        month++;
        if (month > 12) {
          month = 1;
          year++;
        }
        if (`${year}${String(month).padStart(2, '0')}` > `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`) {
          hasMoreRecords = false;
        }
        continue;
      }

      let historyQuery = `SELECT * FROM ${historyTableName} WHERE creditorcode = :cmbCode AND DateTime >= :lastBFDate`;

      if (startDate && endDate) {
        historyQuery += ` AND DateTime BETWEEN :startDate AND :endDate`;
      } else if (startDate) {
        historyQuery += ` AND DateTime >= :startDate`;
      } else if (endDate) {
        historyQuery += ` AND DateTime <= :endDate`;
      }

      const currentHistoryRecords = await historyDb.query(historyQuery, {
        replacements: {
          cmbCode,
        
          lastBFDate: lastBFDateFormatted,
          startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
          endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined
        },
        type: QueryTypes.SELECT
      });

      historyRecords.push(...currentHistoryRecords);

      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }

    // Merge balance forward record with history records
    const mergedHistoryRecords = [balanceForwardRecord, ...historyRecords];
    // Process records and calculate balance
    const { currentBalance, current, days30, days60, days90, days120, days150, days180, recordsToInsert } = await insertHistoryRecords(stockmasterDb, mergedHistoryRecords, creditorRecord);

    // Return the final records and balance details with Balance B/F merged
    return { historyRecords: recordsToInsert, TotalBalance: currentBalance, current, days30, days60, days90, days120, days150, days180 };

  } catch (error) {
    console.error('Error details:', error);
    handleError('Error processing creditor statement', error);
  }
};
exports.GetAllcurrentCreditorDetails = async () => {
  try {
    const activeDatabases = await databaseController.getActiveDatabases();
    const { stockmasterDb } = getDatabases(activeDatabases);

    if (!stockmasterDb) {
      throw new Error('Stockmaster database not found');
    }

    // Query to fetch data from the 'tblcreditor' table
    const creditorsQuery = `SELECT CreditorCode, CreditorName FROM tblcreditor`;
    const creditorsRecords = await stockmasterDb.query(creditorsQuery, {
      type: QueryTypes.SELECT,
    });

    // Sort records alphabetically by CreditorName
    creditorsRecords.sort((a, b) => {
      if (a.CreditorName < b.CreditorName) return -1;
      if (a.CreditorName > b.CreditorName) return 1;
      return 0;
    });
    return creditorsRecords;
  } catch (error) {
    handleError('Error processing tblcreditor details', error);
  }
};
