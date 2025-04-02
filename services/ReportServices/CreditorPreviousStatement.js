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
const insertHistoryRecords = async (stockmasterDb, historyRecords, creditorRecord) => {
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

exports.previousCreditorStatement = async (cmbCode, startDate, endDate, req) => {
  try {
    // Get active databases
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { stockmasterDb, historyDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
    });

    if (!stockmasterDb || !historyDb) {
      throw new Error('Required databases not found');
    }

    // Fetch creditor record
    const creditorRecordsQuery = `SELECT * FROM tblageinfo WHERE CreditorCode = :cmbCode AND PreviousAgeDate = :startDate `;
    const creditorRecords = await stockmasterDb.query(creditorRecordsQuery, {
      replacements: { cmbCode, startDate, endDate },
      type: QueryTypes.SELECT
    });

    if (!creditorRecords.length) {
      return { message: `No creditor records found for creditor code: ${cmbCode}` };
    }

    const creditorRecord = creditorRecords[0];

    // Extract Last Balance Forward date
    const lastBF = creditorRecord.PreviousAgeDate;
    if (!lastBF) {
      return { message: `Last balance forward date not found for creditor code: ${cmbCode}` };
    }

    const lastBFDate = new Date(lastBF);
    if (isNaN(lastBFDate.getTime())) {
      console.log(`Invalid LastBF date for creditor code: ${cmbCode}: ${lastBF}`);
      return { message: `Invalid LastBF date format for creditor code: ${cmbCode}` };
    }

    const lastBFDateFormatted = format(lastBFDate, 'yyyy-MM-dd HH:mm:ss'); // Format LastBF date

    // Balance Forward record
    const balanceForwardRecord = {
      date: format(lastBFDate, 'yyyy-MM-dd HH:mm:ss'),
      creditorcode: creditorRecord?.CreditorCode || creditorRecord?.Creditorcode,
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

      if (tableExists.length === 0) {
        console.warn(`Table ${historyTableName} does not exist. Skipping...`);
          // Stop the loop if you've checked all relevant tables
          if (month === 12 && year === getYear(endDate)) {
              hasMoreRecords = false;
          } else {
              // Increment month/year even if the table doesn't exist
              if (month === 12) {
                  month = 1;
                  year += 1;
              } else {
                  month += 1;
              }
          }
  
          continue;
      }

      // Fetch historical data
      let historyQuery = `SELECT * FROM ${historyTableName} WHERE CreditorCode = :cmbCode AND DateTime >= :lastBFDate`;

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
          startDate: startDate ? format(startDate, 'yyyy-MM-dd HH:mm:ss') : undefined,
          endDate: endDate ? format(endDate, 'yyyy-MM-dd HH:mm:ss') : undefined
        },
        type: QueryTypes.SELECT
      });

      if (currentHistoryRecords.length > 0) {
        historyRecords.push(...currentHistoryRecords);
      }

    // Increment month and year
      if (month === 12) {
        month = 1;
        year += 1;
      } else {
        month += 1;
      }

      // Stop when the year-month exceeds the range
      if (year > getYear(endDate) || (year === getYear(endDate) && month > getMonth(endDate) + 1)) {
        hasMoreRecords = false;
      }
    }

    if (!historyRecords.length) {
      return { message: `No history records found for creditor code: ${cmbCode}` };
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
exports.GetAllPreviousCreditorDetails = async (req) => {
  try {
    // Fetch active databases
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
    });

    if (!stockmasterDb) {
      throw new Error('Stockmaster database not found');
    }

    // Query to fetch Aging details and CreditorName from tblageinfo and tbldata_creditors_tran
    const creditorsTranQuery = `
      SELECT 
        a.CreditorCode, 
        a.Agingno, 
        a.PreviousAgeDate, 
        a.CurrentAgeDate, 
        b.CreditorName 
      FROM tblageinfo a
      JOIN tbldata_creditors_tran b ON a.CreditorCode = b.CreditorCode
    `;
    const creditorsTranRecords = await stockmasterDb.query(creditorsTranQuery, {
      type: QueryTypes.SELECT,
    });

    if (creditorsTranRecords.length === 0) {
      return {
        message: "No records found matching CreditorCode",
        data: [],
      };
    }

    // Group records by CreditorCode
    const groupedByCreditorCode = creditorsTranRecords.reduce((acc, record) => {
      // If CreditorCode doesn't exist in accumulator, create it
      if (!acc[record.CreditorCode]) {
        acc[record.CreditorCode] = {
          CreditorCode: record.CreditorCode,
          CreditorName: record.CreditorName || '', // In case CreditorName is null or empty
          AgingDetails: [],
        };
      }

      // Check if this aging record already exists (same CreditorCode and Agingno)
      const exists = acc[record.CreditorCode].AgingDetails.some(
        (detail) => detail.Agingno === record.Agingno
      );

      // If it doesn't exist, add it to AgingDetails
      if (!exists) {
        acc[record.CreditorCode].AgingDetails.push({
          CreditorCode: record.CreditorCode,
          Agingno: record.Agingno,
          PreviousAgeDate: record.PreviousAgeDate,
          CurrentAgeDate: record.CurrentAgeDate,
        });
      }

      return acc;
    }, {});

    // Convert the grouped object into an array of debtor records
    const groupedCreditorArray = Object.values(groupedByCreditorCode);

    // Sort the grouped records by CreditorName in ascending order (A-Z)
    const sortedRecords = groupedCreditorArray.sort((a, b) => 
      a.CreditorName.localeCompare(b.CreditorName)
    );

    // Return success response with sorted data
    return {
      message: "Data processed successfully",
      data: sortedRecords,
    };
  } catch (error) {
    // Handle error and return message
    return {
      message: "Error fetching data from tblageinfo and tbldata_creditors_tran",
      error: error.message,
    };
  }
};

