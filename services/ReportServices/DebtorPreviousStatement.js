const { getDatabases, getDatabasesCustom } = require('../../utils/databaseHelper');
const databaseController = require("../../controllers/databaseController");
const { QueryTypes } = require('sequelize');
const { format, getYear, getMonth, isValid } = require('date-fns');

// Helper function for error handling
const handleError = (message, error) => {
  console.error(`${message}:`, error.message || error);
  throw new Error(message);
};

// Insert history records into tbltmpCTran
const insertHistoryRecords = async (debtorsDb, historyRecords, debtorRecord) => {
  let currentBalance = debtorRecord?.BalanceForward || 0;
  let current = debtorRecord.CurrentBalance;
  let days30 = debtorRecord?.['30days'];
  let days60 = debtorRecord?.['60days'];
  let days90 = debtorRecord?.['90days'];
  let days120 = debtorRecord?.['120days'];
  let days150 = debtorRecord?.['150days'];
  let days180 = debtorRecord?.['180days'];

  const recordsToInsert = historyRecords.map(record => {
    const { DateTime, Debtorcode, Reference, OrderNo, Description, Amount, TransType, date } = record;

    // Handle DateTime (with time) or Date (without time)
    let formattedDateTime = null;

    if (DateTime && isValid(new Date(DateTime))) {
      formattedDateTime = format(new Date(DateTime), 'yyyy-MM-dd HH:mm:ss');
    } else if (date && isValid(new Date(date))) {
      formattedDateTime = format(new Date(date), 'yyyy-MM-dd') + ' 00:00:00';
    } else {
      console.warn(`Invalid or null Date/DateTime for DebtorCode: ${Debtorcode || 'undefined'}, setting to null.`);
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
      Debtorcode: Debtorcode || debtorRecord.DebtorCode,  // Fallback to debtorRecord.DebtorCode if not found
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

exports.previousDebtorsStatement = async (cmbCode, startDate, endDate, req) => {
  try {
    // Get active databases
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { debtorsDb, historyDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
    });

    if (!debtorsDb || !historyDb) {
      throw new Error('Required databases not found');
    }

    // Fetch debtor record
    const debtorRecordsQuery = `SELECT * FROM tblageinfo WHERE debtorcode = :cmbCode AND PreviousAgeDate = :startDate `;
    const debtorRecords = await debtorsDb.query(debtorRecordsQuery, {
      replacements: { cmbCode, startDate, endDate },
      type: QueryTypes.SELECT
    });

    if (!debtorRecords.length) {
      return { message: `No debtor records found for debtor code: ${cmbCode}` };
    }

    const debtorRecord = debtorRecords[0];

    // Extract Last Balance Forward date
    const lastBF = debtorRecord.PreviousAgeDate;
    if (!lastBF) {
      return { message: `Last balance forward date not found for debtor code: ${cmbCode}` };
    }

    const lastBFDate = new Date(lastBF);
    if (isNaN(lastBFDate.getTime())) {
      console.log(`Invalid LastBF date for debtor code: ${cmbCode}: ${lastBF}`);
      return { message: `Invalid LastBF date format for debtor code: ${cmbCode}` };
    }

    const lastBFDateFormatted = format(lastBFDate, 'yyyy-MM-dd HH:mm:ss'); // Format LastBF date

    // Balance Forward record
    const balanceForwardRecord = {
      date: format(lastBFDate, 'yyyy-MM-dd HH:mm:ss'),
      debtorcode: debtorRecord?.DebtorCode || debtorRecord?.debtorcode,
      reference: debtorRecord?.reference || '0',
      orderNo: null,
      description: 'Balance B/F',
      transtype: null,
      debitAmount: '0',
      creditAmount: '0',
      balanceAmount: debtorRecord.BalanceForward
    };

    console.log('Balance Forward Record:', balanceForwardRecord);

    // Fetch history records
    const historyRecords = [];
    let year = getYear(lastBFDate);
    let month = getMonth(lastBFDate) + 1;
    let hasMoreRecords = true;

    while (hasMoreRecords) {
      const historyTableName = `${year}${String(month).padStart(2, '0')}tbldebtor_tran`;

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
      let historyQuery = `SELECT * FROM ${historyTableName} WHERE debtorcode = :cmbCode AND DateTime >= :lastBFDate`;

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
      return { message: `No history records found for debtor code: ${cmbCode}` };
    }

    // Merge balance forward record with history records
    const mergedHistoryRecords = [balanceForwardRecord, ...historyRecords];
    // Process records and calculate balance
    const { currentBalance, current, days30, days60, days90, days120, days150, days180, recordsToInsert } = await insertHistoryRecords(debtorsDb, mergedHistoryRecords, debtorRecord);

    // Return the final records and balance details with Balance B/F merged
    return { historyRecords: recordsToInsert, TotalBalance: currentBalance, current, days30, days60, days90, days120, days150, days180 };

  } catch (error) {
    console.error('Error details:', error);
    handleError('Error processing debtor statement', error);
  }
};
exports.GetAllPreviousDebtorsDetails = async (req) => {
  try {
    // Fetch active databases
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { debtorsDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
    });

    if (!debtorsDb) {
      throw new Error('Debtors database not found');
    }

    // Query to fetch Aging details and DebtorName from tblageinfo and tbldebtor_tran
    const ageInfoQuery = `
      SELECT 
        a.DebtorCode, 
        a.Agingno, 
        a.PreviousAgeDate, 
        a.CurrentAgeDate, 
        b.DebtorName 
      FROM tblageinfo a
      JOIN tbldebtor_tran b ON a.DebtorCode = b.DebtorCode
    `;
    const ageInfoRecords = await debtorsDb.query(ageInfoQuery, {
      type: QueryTypes.SELECT,
    });

    if (ageInfoRecords.length === 0) {
      return {
        message: "No records found matching DebtorCode",
        data: [],
      };
    }

    // Group records by DebtorCode
    const groupedByDebtorCode = ageInfoRecords.reduce((acc, record) => {
      // If DebtorCode doesn't exist in accumulator, create it
      if (!acc[record.DebtorCode]) {
        acc[record.DebtorCode] = {
          DebtorCode: record.DebtorCode,
          DebtorName: record.DebtorName || '', // In case DebtorName is null or empty
          AgingDetails: [],
        };
      }

      // Check if this aging record already exists (same DebtorCode and Agingno)
      const exists = acc[record.DebtorCode].AgingDetails.some(
        (detail) => detail.Agingno === record.Agingno
      );

      // If it doesn't exist, add it to AgingDetails
      if (!exists) {
        acc[record.DebtorCode].AgingDetails.push({
          DebtorCode: record.DebtorCode,
          Agingno: record.Agingno,
          PreviousAgeDate: record.PreviousAgeDate,
          CurrentAgeDate: record.CurrentAgeDate,
        });
      }

      return acc;
    }, {});

    // Convert the grouped object into an array of debtor records
    const groupedDebtorsArray = Object.values(groupedByDebtorCode);

    // Sort the grouped records by DebtorName in ascending order (A-Z)
    const sortedRecords = groupedDebtorsArray.sort((a, b) => 
      a.DebtorName.localeCompare(b.DebtorName)
    );

    // Return success response with sorted data
    return {
      message: "Data processed successfully",
      data: sortedRecords,
    };
  } catch (error) {
    // Handle error and return message
    return {
      message: "Error fetching data from tblageinfo and tbldebtor_tran",
      error: error.message,
    };
  }
};



