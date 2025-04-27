const { QueryTypes } = require("sequelize");
const databaseController = require("../controllers/databaseController");
const createSequelizeInstance = require("../utils/sequelizeInstance"); // Adjust path as needed
const checkSuperadmin = require("../middleware/superadminMiddleware");
const reportsService = require("../services/ReportServices/ReportServices");
const DebtorCurrentStatement = require("../services/ReportServices/DebtorCurrentStatement");
const DebtorPreviousStatement = require("../services/ReportServices/DebtorPreviousStatement");
const CreditorCurrentStatement = require("../services/ReportServices/CreditorCurrentStatement");
const CreditorPreviousStatement = require("../services/ReportServices/CreditorPreviousStatement");
const FinancialSummary = require("../services/ReportServices/FinancialSummary");
const GrvDataFun = require("../services/ReportServices/GrvDataFun");
const createSequelizeInstanceCustom = require("../utils/sequelizeInstanceCustom");

exports.findAll = async (req, res) => {
  try {
    const results = await reportsService.findSpeficlyStaticTblDataCurrentTran(
      req
    );
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.findDate = async (req, res) => {
  try {
    const { year } = req.body; // Assuming year is in the request body
    if (!year) {
      return res
        .status(400)
        .json({ message: "Year parameter missing in request body" });
    }

    const { serverHost, serverUser, serverPassword, serverPort } = req.user;
    // Get the active databases
    const activeDat7abases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Extract the specific databases needed
    let historyDbName, stockmasterDbName;

    // Iterate over each database group in activeDatabases
    for (const dbNameGroup in activeDatabases) {
      if (Object.hasOwnProperty.call(activeDatabases, dbNameGroup)) {
        const dbNameList = activeDatabases[dbNameGroup];

        // Find history and stockmaster databases in the current group
        for (const dbName of dbNameList) {
          if (dbName.includes("history")) {
            historyDbName = dbName;
          } else if (
            dbName.includes("stockmaster") ||
            dbName.includes("master")
          ) {
            stockmasterDbName = dbName;
          }
        }

        // If both databases are found, break out of the loop
        if (historyDbName && stockmasterDbName) {
          break;
        }
      }
    }

    if (!historyDbName || !stockmasterDbName) {
      return res.status(404).json({ message: "Required databases not found" });
    }

    // Create Sequelize instances
    const historyDb = createSequelizeInstanceCustom({
      databaseName: historyDbName,
      host: serverHost,
      username: serverUser,
      password: serverPassword,
      port: serverPort,
    });
    const stockmasterDbPrefix = stockmasterDbName; // Assuming the database name is the prefix for tables

    // SQL query with the correct database for joins and dynamic year
    const sqlQuery = `
      SELECT 
          t.*, 
          c.MajorDescription AS MajorDescription,
          s.Sub1Description AS Sub1Description,
          w.Sub2Description AS Sub2Description
      FROM 
        ${year}tbldata_current_tran AS t
      LEFT JOIN 
          ${stockmasterDbPrefix}.tblcategory AS c ON t.majorno = c.MajorNo
      LEFT JOIN 
          ${stockmasterDbPrefix}.tblcategory_sub1 AS s ON t.sub1no = s.Sub1No
      LEFT JOIN 
          ${stockmasterDbPrefix}.tblcategory_sub2 AS w ON t.sub2no = w.Sub2No;
    `;

    // Query the history database
    const results = await historyDb.query(sqlQuery, {
      type: QueryTypes.SELECT,
    });

    if (results.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getDepartmentsSalesReports = async (tableName, req, res) => {
  try {
    const { serverHost, serverUser, serverPassword, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Extract the specific databases needed
    let historyDbName, stockmasterDbName;

    // Iterate over each database group in activeDatabases
    for (const dbNameGroup in activeDatabases) {
      if (Object.hasOwnProperty.call(activeDatabases, dbNameGroup)) {
        const dbNameList = activeDatabases[dbNameGroup];

        // Find history and stockmaster databases in the current group
        for (const dbName of dbNameList) {
          if (dbName.includes("history")) {
            historyDbName = dbName;
          } else if (
            dbName.includes("stockmaster") ||
            dbName.includes("master")
          ) {
            stockmasterDbName = dbName;
          }
        }

        // If both databases are found, break out of the loop
        if (historyDbName && stockmasterDbName) {
          break;
        }
      }
    }

    if (!historyDbName || !stockmasterDbName) {
      return res.status(404).json({ message: "Required databases not found" });
    }

    // Create Sequelize instances
    const historyDb = createSequelizeInstanceCustom({
      databaseName: historyDbName,
      host: serverHost,
      username: serverUser,
      password: serverPassword,
      port: serverPort,
    });
    const stockmasterDbPrefix = stockmasterDbName; // Assuming the database name is the prefix for tables

    // Extend execution time
    req.setTimeout(10 * 60 * 1000); // Set timeout to 10 minutes

    const limit = 1000; // Records per page
    let page = 1; // Start from the first page
    let totalCount = 0; // To store the total count of records
    let allResults = []; // To store results from all pages

    // First, get the total count of records
    const countQuery = `
          SELECT COUNT(*) as total
          FROM ${tableName};
        `;
    const totalCountResult = await historyDb.query(countQuery, {
      type: QueryTypes.SELECT,
    });
    totalCount = totalCountResult[0].total;
    console.log(`Total records: ${totalCount}`); // Log total record count
    // Loop through pages until all records are fetched
    while ((page - 1) * limit < totalCount) {
      const offset = (page - 1) * limit; // Calculate offset for the current page

      let sqlQuery = `
          SELECT 
              t.*, 
              c.MajorDescription AS MajorDescription,
              s.Sub1Description AS Sub1Description,
              w.Sub2Description AS Sub2Description
          FROM 
          ${tableName} AS t
          LEFT JOIN 
              ${stockmasterDbPrefix}.tblcategory AS c ON t.majorno = c.MajorNo
          LEFT JOIN 
              ${stockmasterDbPrefix}.tblcategory_sub1 AS s ON t.sub1no = s.Sub1No
          LEFT JOIN 
              ${stockmasterDbPrefix}.tblcategory_sub2 AS w ON t.sub2no = w.Sub2No
        LIMIT ${limit} OFFSET ${offset};
        `;

      const results = await historyDb.query(sqlQuery, {
        type: QueryTypes.SELECT,
      });
      console.log(`Fetching page ${page}, records fetched: ${results.length}`);
      if (results.length === 0) break; // Exit if no more records are found

      allResults = allResults.concat(results); // Combine results from all pages
      page++; // Move to the next page
    }

    if (allResults.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    // Initialize variables
    let totalAverageCostPrice = 0;
    let totalGpValue = 0;
    let totalSelling = 0;
    let totalGPP = 0;
    let totalSalesExcludingVAT = 0;
    const stockCodeGroups = {};
    let earliestDate = new Date(allResults[0].datetime); // Initialize with the first record's date
    let latestDate = new Date(allResults[allResults.length - 1].datetime); // Initialize with the last record's date

    allResults.forEach((record) => {
      const recordDateTime = new Date(record.datetime);
      if (recordDateTime < earliestDate) earliestDate = recordDateTime;
      if (recordDateTime > latestDate) latestDate = recordDateTime;
      // Calculate GPValue and other totals...
      record.GPValue =
        record.linetotal / (1 + record.vatpercentage / 100) -
        record.qty * record.averagecostprice;
      totalGpValue += record.GPValue;
      totalAverageCostPrice += record.averagecostprice * record.qty;
      totalSelling += record.linetotal;
      const {
        majorno,
        sub1no,
        stockcode,
        stockdescription,
        Sub1Description,
        MajorDescription,
      } = record;
      const mainKey = `${majorno}_${sub1no}`;

      // Initialize main group if not exists
      if (!stockCodeGroups[mainKey]) {
        stockCodeGroups[mainKey] = {
          majorno,
          MajorDescription,
          sub1no,
          Sub1Description,
          stockcodes: {},
          totalQuantity: 0,
          totalSelling: 0,
          totalAverageCostPrice: 0,
          totalCostPrice: 0,
          totalCostPricesGPV: 0,
          totalVatPercentage: 0,
          totalGPP: 0,
        };
      }

      const subKey = `${stockcode}`;

      // Initialize sub group if not exists
      if (!stockCodeGroups[mainKey].stockcodes[subKey]) {
        stockCodeGroups[mainKey].stockcodes[subKey] = {
          stockcode,
          stockdescription,
          items: [],
          totalQuantity: 0,
          totalSelling: 0,
          totalAverageCostPrice: 0,
          totalCostPrice: 0,
          totalCostPricesGPV: 0,
          totalVatPercentage: 0,
          totalGPP: 0,
        };
      }

      // Push record to items array of sub group
      stockCodeGroups[mainKey].stockcodes[subKey].items.push(record);
      stockCodeGroups[mainKey].stockcodes[subKey].totalQuantity += record.qty;
      stockCodeGroups[mainKey].stockcodes[subKey].totalSelling +=
        record.linetotal;
      stockCodeGroups[mainKey].stockcodes[subKey].totalAverageCostPrice +=
        record.averagecostprice;
      if (record.vatpercentage) {
        stockCodeGroups[mainKey].stockcodes[subKey].totalVatPercentage +=
          record.vatpercentage;
      } else {
        console.error("VAT percentage is undefined for item:", record);
      }

      // Update main group totals
      stockCodeGroups[mainKey].totalQuantity += record.qty;
      stockCodeGroups[mainKey].totalSelling += record.linetotal;
      stockCodeGroups[mainKey].totalAverageCostPrice += record.averagecostprice;
      if (record.vatpercentage) {
        stockCodeGroups[mainKey].totalVatPercentage += record.vatpercentage;
      }
    });

    Object.values(stockCodeGroups).forEach((mainGroup) => {
      mainGroup.totalCostPrice = 0; // Reset totalCostPrice before calculation
      mainGroup.totalCostPricesGPV = 0;
      mainGroup.totalGpValue = 0; // Initialize totalGpValue for mainGroup
      mainGroup.totalSalesExcludingVAT = 0; // Initialize totalSalesExcludingVAT

      Object.values(mainGroup.stockcodes).forEach((subGroup) => {
        subGroup.totalCostPrice = 0; // Reset totalCostPrice before calculation
        subGroup.totalCostPricesGPV = 0;
        subGroup.totalVATAmount = 0; // Initialize totalVATAmount
        subGroup.totalGpValue = subGroup.items.reduce((acc, item) => {
          return (
            acc +
            (item.linetotal / (1 + item.vatpercentage / 100) -
              item.qty * item.averagecostprice)
          );
        }, 0);

        mainGroup.totalGpValue += subGroup.totalGpValue; // Accumulate totalGpValue for mainGroup

        subGroup.items.forEach((item) => {
          // Calculate totalCostPrice for each subgroup
          subGroup.totalCostPrice += item.lastcostprice * item.qty;
          subGroup.totalCostPricesGPV += item.lastcostprice * item.qty * 1.15; // Calculate totalCostPrice for each subgroup

          // Calculate VAT amount for each item
          const vatAmount =
            (item.lastcostprice * item.qty * item.vatpercentage) / 100;
          subGroup.totalVATAmount += vatAmount;
        });

        mainGroup.totalCostPricesGPV += subGroup.totalCostPricesGPV; // Accumulate totalCostPrice for mainGroup

        // Accumulate totalCostPrice for mainGroup (including VAT)
        mainGroup.totalCostPrice += subGroup.totalCostPrice;

        // Calculate totalSellingExcludingVAT for each subgroup
        subGroup.totalSellingExcludingVAT = subGroup.items.reduce(
          (acc, item) => {
            return acc + item.linetotal / (1 + item.vatpercentage / 100);
          },
          0
        );

        // Accumulate totalSellingExcludingVAT for mainGroup
        mainGroup.totalSalesExcludingVAT += subGroup.totalSellingExcludingVAT;

        // Calculate GPP for each subgroup
        if (subGroup.totalSellingExcludingVAT !== 0) {
          subGroup.totalGPP =
            (1 - subGroup.totalCostPrice / subGroup.totalSellingExcludingVAT) *
            100;
        } else {
          subGroup.totalGPP = 0;
        }
      });

      // Calculate GPP for mainGroup
      if (mainGroup.totalSalesExcludingVAT !== 0) {
        mainGroup.totalGPP =
          (1 - mainGroup.totalCostPrice / mainGroup.totalSalesExcludingVAT) *
          100;
      } else {
        mainGroup.totalGPP = 0;
      }
    });
    const departmentReportData = {
      formattedStockCodes: Object.values(stockCodeGroups),
      totalAverageCostPrice,
      totalSalesExcludingVAT,
      totalGPP,
      totalGpValue,
      totalCount,
      earliestDate,
      latestDate,
    };
    console.log(JSON.stringify(departmentReportData, null, 2));
    // Send response
    res.send(departmentReportData);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (res) {
      // Check if res is defined before using it
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.getDepartmentsSalesReports = async (tableName, req, res) => {
  const maxRetries = 2;
  let attempt = 0;

  const execute = async (req, res) => {
    try {
      // Directly call getDepartmentsSalesReports without permission checks
      await getDepartmentsSalesReports(tableName, req, res);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (attempt < maxRetries) {
        attempt++;
        console.log(`Retrying... Attempt ${attempt}`);
        await execute(req, res);
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  };

  await execute(req, res);
};

const getMultipleDepartmentsSalesReports = async (tableNames, req, res) => {
  try {
    const results = [];

    for (const tableName of tableNames) {
      // Use the existing function to get reports for each table
      const reportResult = await new Promise((resolve, reject) => {
        getDepartmentsSalesReports(tableName, req, {
          send: resolve,
          status: (code) => ({
            json: (data) => reject({ code, data }),
          }),
        });
      });

      results.push({ tableName, report: reportResult });
    }

    res.json(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getMultipleDepartmentsSalesReports = getMultipleDepartmentsSalesReports;

exports.findAllTblDataCurrentTranNames = async (req, res) => {
  try {
    const { shopKey } = req.query;
    const { serverHost, serverUser, serverPassword, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      shopKey
    );
    // Extract the specific databases needed
    let historyDbName, stockmasterDbName;

    // Iterate over each database group in activeDatabases
    for (const dbNameGroup in activeDatabases) {
      if (Object.hasOwnProperty.call(activeDatabases, dbNameGroup)) {
        const dbNameList = activeDatabases[dbNameGroup];

        // Find history and stockmaster databases in the current group
        for (const dbName of dbNameList) {
          console.log(dbName);
          if (dbName.includes("history")) {
            historyDbName = dbName;
          } else if (
            dbName.includes("stockmaster") ||
            dbName.includes("master")
          ) {
            stockmasterDbName = dbName;
          }
        }

        // If both databases are found, break out of the loop
        if (historyDbName && stockmasterDbName) {
          break;
        }
      }
    }

    if (!historyDbName || !stockmasterDbName) {
      return res.status(404).json({ message: "Required databases not found" });
    }

    // Create Sequelize instances
    const historyDb = createSequelizeInstanceCustom({
      databaseName: historyDbName,
      username: serverUser,
      password: serverPassword,
      host: serverHost,
      port: serverPort,
    });
    const stockmasterDbPrefix = createSequelizeInstanceCustom({
      databaseName: stockmasterDbName,
      username: serverUser,
      password: serverPassword,
      host: serverHost,
      port: serverPort,
    });

    // Execute query
    let sqlQuery = `SELECT * FROM tbldatacurrent_tran`;
    const results = await historyDb.query(sqlQuery, {
      type: historyDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getCurrentGRVandGoodsRecivedNotesReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { serverHost, serverUser, serverPassword, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Extract the specific databases needed
    let historyDbName, stockmasterDbName;

    // Iterate over each database group in activeDatabases
    for (const dbNameGroup in activeDatabases) {
      if (Object.hasOwnProperty.call(activeDatabases, dbNameGroup)) {
        const dbNameList = activeDatabases[dbNameGroup];

        // Find history and stockmaster databases in the current group
        for (const dbName of dbNameList) {
          if (dbName.includes("history")) {
            historyDbName = dbName;
          } else if (
            dbName.includes("stockmaster") ||
            dbName.includes("master")
          ) {
            stockmasterDbName = dbName;
          }
        }

        // If both databases are found, break out of the loop
        if (historyDbName && stockmasterDbName) {
          break;
        }
      }
    }

    if (!historyDbName || !stockmasterDbName) {
      return res.status(404).json({ message: "Required databases not found" });
    }

    // Create Sequelize instances
    const stockmasterDbPrefix = createSequelizeInstanceCustom({
      databaseName: stockmasterDbName,
      host: serverHost,
      username: serverUser,
      password: serverPassword,
      port: serverPort,
    });

    // Preliminary query to check if the dates are valid
    let dateValidityQuery = `SELECT MIN(DateTime) AS minDate, MAX(DateTime) AS maxDate FROM tbldata_grn_det`;

    const dateResults = await stockmasterDbPrefix.query(dateValidityQuery, {
      type: stockmasterDbPrefix.QueryTypes.SELECT,
    });

    if (dateResults.length === 0) {
      return res
        .status(404)
        .json({ message: "No date data available in the table" });
    }

    const { minDate, maxDate } = dateResults[0];

    if (startDate && new Date(startDate) < new Date(minDate)) {
      return res
        .status(400)
        .json({ message: `Start date should not be before ${minDate}` });
    }

    if (endDate && new Date(endDate) > new Date(maxDate)) {
      return res
        .status(400)
        .json({ message: `End date should not be after ${maxDate}` });
    }

    // Construct the main query
    let sqlQuery = `SELECT 
      DateTime,                        
      InvoiceNumber,         
      TransactionNumber,         
      StockCode,                     
      CreditorItemCode,            
      Description,                   
      QuantityReceived,            
      BonusQuantity,                
      QuantityOrdered,              
      ExclusiveUnitCost,         
      InclusiveUnitCost,  
      Markup,          
      ExclusiveSelling,   
      InclusiveSelling,   
      VATPercentage,                
      Discount1,                   
      Discount2,                   
      DiscountCurrency,             
      LineTotal,                    
      GRVNum,                        
      Shipping,                     
      Handling,                     
      Other,                       
      Subtotal,                     
      Discount,                     
      VAT,                          
      SupplierCode,                  
      User,                         
      hisYear,                      
      hisMonth,                     
      hisDay,                       
      ShipSuppl,                   
      Comment  
      FROM 
      tbldata_grn_det 
      WHERE 
      1=1`;

    // Add date filters if provided
    const replacements = {};
    if (startDate) {
      sqlQuery += ` AND DateTime >= :startDate`;
      replacements.startDate = new Date(startDate).toISOString(); // Ensure proper date format
    }

    if (endDate) {
      sqlQuery += ` AND DateTime <= :endDate`;
      replacements.endDate = new Date(endDate).toISOString(); // Ensure proper date format
    }

    // Execute the query
    const results = await stockmasterDbPrefix.query(sqlQuery, {
      type: stockmasterDbPrefix.QueryTypes.SELECT,
      replacements,
    });

    if (results.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.findAllTblDataAdjustment = async (req, res) => {
  try {
    const { serverHost, serverUser, serverPassword, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Extract the specific databases needed
    let historyDbName, stockmasterDbName;

    // Iterate over each database group in activeDatabases
    for (const dbNameGroup in activeDatabases) {
      if (Object.hasOwnProperty.call(activeDatabases, dbNameGroup)) {
        const dbNameList = activeDatabases[dbNameGroup];

        // Find history and stockmaster databases in the current group
        for (const dbName of dbNameList) {
          if (dbName.includes("history")) {
            historyDbName = dbName;
          } else if (
            dbName.includes("stockmaster") ||
            dbName.includes("master")
          ) {
            stockmasterDbName = dbName;
          }
        }

        // If both databases are found, break out of the loop
        if (historyDbName && stockmasterDbName) {
          break;
        }
      }
    }

    if (!historyDbName || !stockmasterDbName) {
      return res.status(404).json({ message: "Required databases not found" });
    }

    // Create Sequelize instances
    const historyDb = createSequelizeInstanceCustom({
      databaseName: historyDbName,
      host: serverHost,
      username: serverUser,
      password: serverPassword,
      port: serverPort,
    });
    const stockmasterDbPrefix = createSequelizeInstanceCustom({
      databaseName: stockmasterDbName,
      host: serverHost,
      username: serverUser,
      password: serverPassword,
      port: serverPort,
    });

    // Execute query
    let sqlQuery = `SELECT * FROM tbldataadjustment`;
    const results = await historyDb.query(sqlQuery, {
      type: historyDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAdjustmentReport = async (req, res) => {
  try {
    const { serverHost, serverUser, serverPassword, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { tableName } = req.query; // Get table names from query parameters

    if (!tableName) {
      return res.status(400).json({ message: "Table name(s) not provided" });
    }

    // Parse multiple table names from the query parameter
    const tableNames = tableName.split(","); // Example: "202206tbldata_adjustment,another_table"

    // Extract the specific databases needed
    let historyDbName, stockmasterDbName;

    // Iterate over each database group in activeDatabases
    for (const dbNameGroup in activeDatabases) {
      if (Object.hasOwnProperty.call(activeDatabases, dbNameGroup)) {
        const dbNameList = activeDatabases[dbNameGroup];

        // Find history and stockmaster databases in the current group
        for (const dbName of dbNameList) {
          if (dbName.includes("history")) {
            historyDbName = dbName;
          } else if (
            dbName.includes("stockmaster") ||
            dbName.includes("master")
          ) {
            stockmasterDbName = dbName;
          }
        }

        // If history database is found, break out of the loop
        if (historyDbName) {
          break;
        }
      }
    }

    if (!historyDbName) {
      return res
        .status(404)
        .json({ message: "Required history database not found" });
    }

    // Create Sequelize instance for history database
    const historyDb = createSequelizeInstanceCustom({
      databaseName: historyDbName,
      host: serverHost,
      username: serverUser,
      password: serverPassword,
      port: serverPort,
    });

    // Prepare results container
    const results = [];

    // Function to check if a table exists
    const tableExists = async (tableName) => {
      try {
        const query = `SHOW TABLES LIKE '${tableName}'`;
        const [tables] = await historyDb.query(query, {
          type: historyDb.QueryTypes.SELECT,
        });

        // Check if tables result contains any entry
        const tableNames = Object.values(tables || {});
        return tableNames.length > 0;
      } catch (error) {
        console.error("Error checking table existence:", error);
        return false;
      }
    };

    // Query each table
    for (const tblName of tableNames) {
      // Sanitize table name to prevent SQL injection
      const sanitizedTableName = tblName.replace(/[^a-zA-Z0-9_]/g, "");

      // Check if the table exists
      const exists = await tableExists(sanitizedTableName);

      if (exists) {
        // Construct and execute query
        let sqlQuery = `SELECT * FROM ${sanitizedTableName}`;
        const tableResults = await historyDb.query(sqlQuery, {
          type: historyDb.QueryTypes.SELECT,
        });

        if (tableResults.length > 0) {
          results.push({
            tableName: sanitizedTableName,
            data: tableResults,
          });
        }
      }
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "No data found in the provided tables" });
    }

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.findAllTblDataCashupDet = async (req, res) => {
  try {
    const { serverHost, serverUser, serverPassword, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Extract the specific databases needed
    let historyDbName, stockmasterDbName;

    // Iterate over each database group in activeDatabases
    for (const dbNameGroup in activeDatabases) {
      if (Object.hasOwnProperty.call(activeDatabases, dbNameGroup)) {
        const dbNameList = activeDatabases[dbNameGroup];

        // Find history and stockmaster databases in the current group
        for (const dbName of dbNameList) {
          if (dbName.includes("history")) {
            historyDbName = dbName;
          } else if (
            dbName.includes("stockmaster") ||
            dbName.includes("master")
          ) {
            stockmasterDbName = dbName;
          }
        }

        // If both databases are found, break out of the loop
        if (historyDbName && stockmasterDbName) {
          break;
        }
      }
    }

    if (!historyDbName || !stockmasterDbName) {
      return res.status(404).json({ message: "Required databases not found" });
    }

    // Create Sequelize instances
    const historyDb = createSequelizeInstanceCustom({
      databaseName: historyDbName,
      host: serverHost,
      username: serverUser,
      password: serverPassword,
      port: serverPort,
    });
    const stockmasterDbPrefix = createSequelizeInstanceCustom({
      databaseName: stockmasterDbName,
      host: serverHost,
      username: serverUser,
      password: serverPassword,
      port: serverPort,
    });

    // Execute query
    let sqlQuery = `SELECT * FROM tbldatacashup_det`;
    const results = await historyDb.query(sqlQuery, {
      type: historyDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.currentCashupReport = async (req, res) => {
  try {
    const { serverHost, serverUser, serverPassword, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const tableNames = req.params.tableName.split(","); // Extract multiple table names from request parameters

    // Extract the specific databases needed
    let historyDbName, stockmasterDbName;

    // Iterate over each database group in activeDatabases
    for (const dbNameGroup in activeDatabases) {
      if (Object.hasOwnProperty.call(activeDatabases, dbNameGroup)) {
        const dbNameList = activeDatabases[dbNameGroup];

        // Find history and stockmaster databases in the current group
        for (const dbName of dbNameList) {
          if (dbName.includes("history")) {
            historyDbName = dbName;
          } else if (
            dbName.includes("stockmaster") ||
            dbName.includes("master")
          ) {
            stockmasterDbName = dbName;
          }
        }

        // If both databases are found, break out of the loop
        if (historyDbName && stockmasterDbName) {
          break;
        }
      }
    }

    if (!historyDbName || !stockmasterDbName) {
      return res.status(404).json({ message: "Required databases not found" });
    }

    // Create Sequelize instances
    const historyDb = createSequelizeInstanceCustom({
      databaseName: historyDbName,
      host: serverHost,
      username: serverUser,
      password: serverPassword,
      port: serverPort,
    });
    const stockmasterDb = createSequelizeInstanceCustom({
      databaseName: stockmasterDbName,
      host: serverHost,
      username: serverUser,
      password: serverPassword,
      port: serverPort,
    });

    // Define SQL query with dynamic table names and additional fields
    const sqlQuery = tableNames
      .map(
        (tableName) => `
      SELECT
        cashupnum,          -- Cashup number
        entitydesc,         -- Description of the entity
        salescash,          -- Sales in cash
        salescard,          -- Sales via card
        salescheque,        -- Sales via cheque
        SalesAccount,       -- Sales account
        ddeposit,           -- Deposit amount
        totalsales,         -- Total sales amount
        payout,             -- Payout amount
        refunds,            -- Refunds amount
        hisyear,            -- Year of the historical data
        hismonth,           -- Month of the historical data
        hisday,             -- Day of the historical data
        cashout,            -- Cash out amount
        paytotal,           -- Total payment amount
        declcash + declcard + declcheque - declfloat AS net_declared,  -- Total declared amount minus float
        (declcash + declcard + declcheque - declfloat) - (salescash + salescard + salescheque) AS discrepancy,  -- Difference between declared and actual sales
        DATE_FORMAT(CONCAT(hisyear, '-', LPAD(hismonth, 2, '0'), '-', LPAD(hisday, 2, '0')), '%Y-%m-%d') AS formattedDate  -- Formatted date
      FROM ${tableName}
    `
      )
      .join(" UNION ALL "); // Combine queries using UNION ALL to aggregate results

    // Execute query to fetch data from the specified tables
    const results = await historyDb.query(sqlQuery, {
      type: historyDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    // Calculate grand totals
    const grandTotals = results.reduce(
      (totals, row) => {
        totals.salescash += row.salescash || 0;
        totals.salescard += row.salescard || 0;
        totals.salescheque += row.salescheque || 0;
        totals.ddeposit += row.ddeposit || 0;
        totals.totalsales += row.totalsales || 0;
        totals.payout += row.payout || 0;
        totals.refunds += row.refunds || 0;
        totals.cashout += row.cashout || 0;
        totals.paytotal += row.paytotal || 0;
        totals.net_declared += row.net_declared || 0;
        totals.discrepancy += row.discrepancy || 0;
        return totals;
      },
      {
        salescash: 0,
        salescard: 0,
        salescheque: 0,
        ddeposit: 0,
        totalsales: 0,
        payout: 0,
        refunds: 0,
        cashout: 0,
        paytotal: 0,
        net_declared: 0,
        discrepancy: 0,
      }
    );

    // Include grand totals in the response
    res.send({
      data: results,
      grandTotals,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.CachupReportByClerkReport = async (req, res) => {
  try {
    const { serverHost, serverUser, serverPassword, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const tableNames = req.params.tableName.split(","); // Extract multiple table names from request parameters

    // Extract the specific databases needed
    let historyDbName, stockmasterDbName;

    // Iterate over each database group in activeDatabases
    for (const dbNameGroup in activeDatabases) {
      if (Object.hasOwnProperty.call(activeDatabases, dbNameGroup)) {
        const dbNameList = activeDatabases[dbNameGroup];

        // Find history and stockmaster databases in the current group
        for (const dbName of dbNameList) {
          if (dbName.includes("history")) {
            historyDbName = dbName;
          } else if (
            dbName.includes("stockmaster") ||
            dbName.includes("master")
          ) {
            stockmasterDbName = dbName;
          }
        }

        // If both databases are found, break out of the loop
        if (historyDbName && stockmasterDbName) {
          break;
        }
      }
    }

    if (!historyDbName || !stockmasterDbName) {
      return res.status(404).json({ message: "Required databases not found" });
    }

    // Create Sequelize instances
    const historyDb = createSequelizeInstanceCustom({
      databaseName: historyDbName,
      host: serverHost,
      username: serverUser,
      password: serverPassword,
      port: serverPort,
    });
    const stockmasterDb = createSequelizeInstanceCustom({
      databaseName: stockmasterDbName,
      host: serverHost,
      username: serverUser,
      password: serverPassword,
      port: serverPort,
    });

    // Define SQL query with dynamic table names and additional fields
    const sqlQuery = tableNames
      .map(
        (tableName) => `
      SELECT
        cashupnum,          -- Cashup number
        entitydesc,         -- Description of the entity
        salescash,          -- Sales in cash
        salescard,          -- Sales via card
        salescheque,        -- Sales via cheque
        SalesAccount,       -- Sales account
        ddeposit,           -- Deposit amount
        totalsales,         -- Total sales amount
        payout,             -- Payout amount
        refunds,            -- Refunds amount
        hisyear,            -- Year of the historical data
        hismonth,           -- Month of the historical data
        hisday,             -- Day of the historical data
        cashout,            -- Cash out amount
        paytotal,           -- Total payment amount
        declcash + declcard + declcheque - declfloat AS net_declared,  -- Total declared amount minus float
        (declcash + declcard + declcheque - declfloat) - (salescash + salescard + salescheque) AS discrepancy,  -- Difference between declared and actual sales
        DATE_FORMAT(CONCAT(hisyear, '-', LPAD(hismonth, 2, '0'), '-', LPAD(hisday, 2, '0')), '%Y-%m-%d') AS formattedDate  -- Formatted date
      FROM ${tableName}
    `
      )
      .join(" UNION ALL "); // Combine queries using UNION ALL to aggregate results

    // Execute query to fetch data from the specified tables
    const results = await historyDb.query(sqlQuery, {
      type: historyDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }
    // Grouping results by entitydesc
    const groupedResults = results.reduce((acc, row) => {
      const { entitydesc } = row;
      if (!acc[entitydesc]) {
        acc[entitydesc] = {
          originalEntries: [],
          total: {
            salescash: 0,
            salescard: 0,
            salescheque: 0,
            ddeposit: 0,
            totalsales: 0,
            payout: 0,
            refunds: 0,
            cashout: 0,
            paytotal: 0,
            net_declared: 0,
            discrepancy: 0,
          },
          formattedDate: row.formattedDate,
        };
      }

      // Store the original entry and aggregate values
      acc[entitydesc].originalEntries.push(row);
      acc[entitydesc].total.salescash += row.salescash || 0;
      acc[entitydesc].total.salescard += row.salescard || 0;
      acc[entitydesc].total.salescheque += row.salescheque || 0;
      acc[entitydesc].total.ddeposit += row.ddeposit || 0;
      acc[entitydesc].total.totalsales += row.totalsales || 0;
      acc[entitydesc].total.payout += row.payout || 0;
      acc[entitydesc].total.refunds += row.refunds || 0;
      acc[entitydesc].total.cashout += row.cashout || 0;
      acc[entitydesc].total.paytotal += row.paytotal || 0;
      acc[entitydesc].total.net_declared += row.net_declared || 0;
      acc[entitydesc].total.discrepancy += row.discrepancy || 0;

      return acc;
    }, {});

    const responseData = Object.entries(groupedResults).map(
      ([entitydesc, data]) => ({
        entitydesc,
        total: data.total,
        originalEntries: data.originalEntries,
      })
    );

    // Calculate grand totals
    const grandTotals = responseData.reduce(
      (totals, row) => {
        totals.salescash += row.total.salescash || 0;
        totals.salescard += row.total.salescard || 0;
        totals.salescheque += row.total.salescheque || 0;
        totals.ddeposit += row.total.ddeposit || 0;
        totals.totalsales += row.total.totalsales || 0;
        totals.payout += row.total.payout || 0;
        totals.refunds += row.total.refunds || 0;
        totals.cashout += row.total.cashout || 0;
        totals.paytotal += row.total.paytotal || 0;
        totals.net_declared += row.total.net_declared || 0;
        totals.discrepancy += row.total.discrepancy || 0;
        return totals;
      },
      {
        salescash: 0,
        salescard: 0,
        salescheque: 0,
        ddeposit: 0,
        totalsales: 0,
        payout: 0,
        refunds: 0,
        cashout: 0,
        paytotal: 0,
        net_declared: 0,
        discrepancy: 0,
      }
    );

    // Send response
    res.send({
      data: responseData,
      grandTotals,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.tblReg = async (req, res) => {
  try {
    const results = await reportsService.companydetailstblReg(req);
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.accrossShopReport = async (req, res) => {
  const { startDate, endDate } = req.query; // Get dates from query parameters
  try {
    const results = await reportsService.acrossReport(startDate, endDate, req);
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res
      .status(
        error.message.includes("not found") ||
          error.message.includes("No data found")
          ? 404
          : 500
      )
      .json({ message: error.message });
  }
};

exports.findAllTblDataCancelTran = async (req, res) => {
  try {
    const results = await reportsService.allTblDataCancelTran(req);
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.findAllTblDataPrice = async (req, res) => {
  try {
    const results = await reportsService.allTblDataPrice(req);
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.findAllTblPayout = async (req, res) => {
  try {
    const results = await reportsService.allTblPayout(req);
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.CreditorsValueReport = async (req, res) => {
  try {
    const results = await reportsService.allTblCreditorsValue(req);
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.DebtorsValueReport = async (req, res) => {
  try {
    const results = await reportsService.allTblDebtorsValue(req);
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.StockValueReport = async (req, res) => {
  try {
    const results = await reportsService.allTblStockValue(req);
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.findAllTblDataStockActivity = async (req, res) => {
  try {
    const results = await reportsService.allTblStockActivity(req);
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.findAllTblDataCreditorsTran = async (req, res) => {
  try {
    const results = await reportsService.allTblDataCreditorsTran(req);
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.findAllTblDataDebtorsTran = async (req, res) => {
  try {
    const results = await reportsService.allTblDataDebtorsTran(req);
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.findAllDepartmentWithCategories = async (req, res) => {
  try {
    const results = await reportsService.allDepartmentsWithCategories(req);
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.StockOnHandReport = async (req, res) => {
  try {
    // Extract MajorNo, Sub1No, and Sub2No from query parameters
    const { majorNo, sub1No, sub2No } = req.query;
    const includeNegativeStockonHand =
      req.query.includeNegativeStockonHand === "true"; // Explicitly handle string to boolean conversion
    const includeNegativeLastCostPrice =
      req.query.includeNegativeLastCostPrice === "true"; // Explicitly handle string to boolean conversion
    const includeNegativeLaybyeStock =
      req.query.includeNegativeLaybyeStock === "true"; // Explicitly handle string to boolean conversion
    const includeNegativeAvarageCostPrice =
      req.query.includeNegativeAvarageCostPrice === "true"; // Explicitly handle string to boolean conversion
    const includeZeroStockonHand = req.query.includeZeroStockonHand === "true";
    const includeZeroLastCostPrice =
      req.query.includeZeroLastCostPrice === "true";
    const includeZeroAvarageCostPrice =
      req.query.includeZeroAvarageCostPrice === "true";
    const includeZeroLaybyeStock = req.query.includeZeroLaybyeStock === "true";
    const includeOnlyPositiveStock =
      req.query.includeOnlyPositiveStock === "true";
    // Pass the parameters to the service layer
    const results = await reportsService.allTblDataProducts(
      majorNo,
      sub1No,
      sub2No,
      includeNegativeStockonHand,
      includeNegativeLastCostPrice,
      includeNegativeLaybyeStock,
      includeNegativeAvarageCostPrice,
      includeZeroStockonHand,
      includeZeroLastCostPrice,
      includeZeroAvarageCostPrice,
      includeZeroLaybyeStock,
      includeOnlyPositiveStock,
      req
    );

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

// Controller function to handle multiple tables dynamically
exports.voidReport = async (req, res) => {
  try {
    // Extract table names from the request query
    const { tableName } = req.query; // e.g., 202404tbldata_cancel_tran,202405tbldata_cancel_tran

    if (!tableName) {
      return res.status(400).json({ message: "Table name is required" });
    }

    // Pass the table names to the service function
    const results = await reportsService.tblDataCancelTranSearchTables(
      tableName,
      req
    );

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);

    if (error.message.startsWith("Invalid table name")) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.priceChangeReport = async (req, res) => {
  try {
    // Extract table names from the request query
    const { tableName } = req.query;

    if (!tableName) {
      return res.status(400).json({ message: "Table name is required" });
    }

    // Pass the table names to the service function
    const results = await reportsService.tblDataPriceSearchTables(
      tableName,
      req
    );

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);

    if (error.message.startsWith("Invalid table name")) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.PayoutReport = async (req, res) => {
  try {
    // Extract table names from the request query
    const { tableName } = req.query;

    if (!tableName) {
      return res.status(400).json({ message: "Table name is required" });
    }

    // Pass the table names to the service function
    const results = await reportsService.tblDataPayoutSearchTables(
      tableName,
      req
    );

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);

    if (error.message.startsWith("Invalid table name")) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.StockActivityReport = async (req, res) => {
  try {
    // Extract table names and stockcode from the request query
    const { tableName, stockcode } = req.query; // e.g., ?tableName=202404tbldata_cancel_tran,202405tbldata_cancel_tran&stockcode=ABC123

    if (!tableName) {
      return res.status(400).json({ message: "Table name is required" });
    }

    // Pass the table names and stockcode (if provided) to the service function
    const results = await reportsService.tblDataStockActivitySearchTables(
      tableName,
      stockcode,
      req
    );

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);

    if (error.message.startsWith("Invalid table name")) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.CreditorsTranReport = async (req, res) => {
  try {
    // Extract table names from the request query
    const { tableName } = req.query;

    if (!tableName) {
      return res.status(400).json({ message: "Table name is required" });
    }

    // Pass the table names to the service function
    const results = await reportsService.tblDataCreditorsTranSearchTables(
      tableName,
      req
    );

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);

    if (error.message.startsWith("Invalid table name")) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.CreditorsCreditNotesReport = async (req, res) => {
  try {
    // Extract table names from the request query
    const { tableName } = req.query;

    if (!tableName) {
      return res.status(400).json({ message: "Table name is required" });
    }

    // Pass the table names to the service function
    const results = await reportsService.CreditorsCreditNotesReportSearchTables(
      tableName,
      req
    );

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);

    if (error.message.startsWith("Invalid table name")) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.CreditorsDebitNotesReport = async (req, res) => {
  try {
    // Extract table names from the request query
    const { tableName } = req.query;

    if (!tableName) {
      return res.status(400).json({ message: "Table name is required" });
    }

    // Pass the table names to the service function
    const results = await reportsService.CreditorsDebitNotesSearchTables(
      tableName,
      req
    );

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);

    if (error.message.startsWith("Invalid table name")) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.CreditorsInvoicesReport = async (req, res) => {
  try {
    // Extract table names from the request query
    const { tableName } = req.query;

    if (!tableName) {
      return res.status(400).json({ message: "Table name is required" });
    }

    // Pass the table names to the service function
    const results = await reportsService.CreditorsInvoicesNotesSearchTables(
      tableName,
      req
    );

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);

    if (error.message.startsWith("Invalid table name")) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.CreditorsPaymentsReport = async (req, res) => {
  try {
    // Extract table names from the request query
    const { tableName } = req.query;

    if (!tableName) {
      return res.status(400).json({ message: "Table name is required" });
    }

    // Pass the table names to the service function
    const results = await reportsService.CreditorsPaymentNotesSearchTables(
      tableName,
      req
    );

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);

    if (error.message.startsWith("Invalid table name")) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.DebtorsTranReport = async (req, res) => {
  try {
    // Extract table names from the request query
    const { tableName } = req.query;

    if (!tableName) {
      return res.status(400).json({ message: "Table name is required" });
    }

    // Pass the table names to the service function
    const results = await reportsService.tblDataDebtorsTranSearchTables(
      tableName,
      req
    );

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);

    if (error.message.startsWith("Invalid table name")) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.DebtorsCreditNotesReport = async (req, res) => {
  try {
    // Extract table names from the request query
    const { tableName } = req.query;

    if (!tableName) {
      return res.status(400).json({ message: "Table name is required" });
    }

    // Pass the table names to the service function
    const results = await reportsService.DebtorsCreditNotesReportSearchTables(
      tableName,
      req
    );

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);

    if (error.message.startsWith("Invalid table name")) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.DebtorsDebitNotesReport = async (req, res) => {
  try {
    // Extract table names from the request query
    const { tableName } = req.query;

    if (!tableName) {
      return res.status(400).json({ message: "Table name is required" });
    }

    // Pass the table names to the service function
    const results = await reportsService.DebtorsDebitNotesSearchTables(
      tableName,
      req
    );

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);

    if (error.message.startsWith("Invalid table name")) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.DebtorsInvoicesReport = async (req, res) => {
  try {
    // Extract table names from the request query
    const { tableName } = req.query;

    if (!tableName) {
      return res.status(400).json({ message: "Table name is required" });
    }

    // Pass the table names to the service function
    const results = await reportsService.DebtorsAccountNotesSearchTables(
      tableName,
      req
    );

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);

    if (error.message.startsWith("Invalid table name")) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.DebtorsPaymentsReport = async (req, res) => {
  try {
    // Extract table names from the request query
    const { tableName } = req.query;

    if (!tableName) {
      return res.status(400).json({ message: "Table name is required" });
    }

    // Pass the table names to the service function
    const results = await reportsService.DebtorsPaymentNotesSearchTables(
      tableName,
      req
    );

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);

    if (error.message.startsWith("Invalid table name")) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.HistoryProductSaleByInvoiceReport = async (req, res) => {
  try {
    // Extract table names from the request query
    const { tableName } = req.query;

    if (!tableName) {
      return res.status(400).json({ message: "Table name is required" });
    }

    // Pass the table names to the service function
    const results =
      await reportsService.HistoryProductSaleByInvoiceSearchTables(
        tableName,
        req
      );

    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);

    if (error.message.startsWith("Invalid table name")) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.DailySalesReport = async (req, res, tableName) => {
  try {
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Extract the specific databases needed
    let historyDbName, stockmasterDbName;

    // Iterate over each database group in activeDatabases
    for (const dbNameGroup in activeDatabases) {
      if (Object.hasOwnProperty.call(activeDatabases, dbNameGroup)) {
        const dbNameList = activeDatabases[dbNameGroup];

        // Find history and stockmaster databases in the current group
        for (const dbName of dbNameList) {
          if (dbName.includes("history")) {
            historyDbName = dbName;
          } else if (
            dbName.includes("stockmaster") ||
            dbName.includes("master")
          ) {
            stockmasterDbName = dbName;
          }
        }

        // If both databases are found, break out of the loop
        if (historyDbName && stockmasterDbName) {
          break;
        }
      }
    }

    if (!historyDbName || !stockmasterDbName) {
      return res.status(404).json({ message: "Required databases not found" });
    }

    // Create Sequelize instances
    const historyDb = createSequelizeInstanceCustom({
      databaseName: historyDbName,
      host: serverHost,
      password: serverPassword,
      username: serverUser,
      port: serverPort,
    });
    const stockmasterDbPrefix = createSequelizeInstanceCustom({
      databaseName: stockmasterDbName,
      host: serverHost,
      password: serverPassword,
      username: serverUser,
      port: serverPort,
    }); // Assuming the database name is the prefix for tables

    // SQL query with the correct database for joins
    console.log(tableName, "rana here");
    if (!/^[0-9a-zA-Z_]+$/.test(tableName)) {
      throw new Error("Invalid table name");
    }
    // SQL query to get all payment types total by each day for the entire month
    const dailySalesQuery = `
      SELECT 
      datetime,
          hisday,
          hismonth,
          hisyear,
          paymenttype,
          vatpercentage,
          SUM(linetotal) AS TotalInclSelling,
          SUM(linetotal) / (1 + (vatpercentage / 100)) AS TotalExclSelling,
          SUM((averagecostprice * qty)) AS TotalExclCost,
          SUM(averagecostprice * qty) / (1+vatpercentage/100) AS TotalInclCost,
          SUM(valuediscount) AS TotalVAT
      FROM 
      ${tableName}
      GROUP BY 
        hisday, hismonth, hisyear, paymenttype, vatpercentage
      ORDER BY 
       hisday, hismonth, hisyear;
    `;
    // Queries for aggregated totals for the entire month
    const monthlyAggregatesQuery = {
      totalInclSellingPrice: `
        SELECT SUM(linetotal) AS incl_selling_Price 
        FROM  ${tableName};
      `,
      totalExclSellingPrice: `
        SELECT SUM(linetotal) / (1 + vatpercentage / 100) AS excl_selling_Price 
        FROM  ${tableName};
      `,
      totalInclCostPrice: `
        SELECT SUM(averagecostprice * qty) / (1 + vatpercentage / 100) AS incl_cost_Price 
        FROM  ${tableName};
      `,
      totalExclCostPrice: `
        SELECT SUM(averagecostprice * qty) AS excl_cost_Price 
        FROM  ${tableName};
      `,
      totalVat: `
        SELECT SUM(valuediscount) AS total_vat 
        FROM  ${tableName};
      `,
    };
    // Additional query using sequelize8
    const splitTenderQuery = `
      SELECT 
          datetime,
          paymenttype,
          SUM(tenderamount) AS tenderamount
      FROM 
          tbldata_splittender
      GROUP BY 
          datetime, paymenttype;
    `;

    // const queryOptions = { type:QueryTypes.SELECT, timeout: 80000 }; // Set timeout to 60 seconds
    const queryOptions = { type: historyDb.QueryTypes.SELECT, timeout: 80000 }; // Set timeout to 60 seconds

    const queryPromises = [
      historyDb.query(dailySalesQuery, queryOptions),
      ...Object.values(monthlyAggregatesQuery).map((query) =>
        historyDb.query(query, queryOptions)
      ),
      stockmasterDbPrefix.query(splitTenderQuery, queryOptions),
    ];

    const [
      dailyResults,
      totalInclSellingPrice,
      totalExclSellingPrice,
      totalInclCostPrice,
      totalExclCostPrice,
      totalVat,
      splitTenderResults,
    ] = await Promise.race([
      Promise.all(queryPromises),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Query execution timed out")), 80000)
      ),
    ]);

    if (dailyResults.length === 0) {
      console.log("No data found");
      return { success: true, message: "No data found" };
    }
    // Structuring the daily results
    // Ensure dailyResults are sorted by date
    dailyResults.sort((a, b) => {
      const dateA = new Date(a.hisyear, a.hismonth - 1, a.hisday);
      const dateB = new Date(b.hisyear, b.hismonth - 1, b.hisday);
      return dateA - dateB;
    });

    // Get first and last record's date and time
    const firstRecord = dailyResults[0];
    const lastRecord = dailyResults[dailyResults.length - 1];

    // Function to format date with time
    const formatDateTime = (datetime) => {
      const date = new Date(datetime);
      const formattedDate = `${date.getDate()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getFullYear()).padStart(2, "0")}`;
      const formattedTime = `${String(date.getHours()).padStart(
        2,
        "0"
      )}:${String(date.getMinutes()).padStart(2, "0")}:${String(
        date.getSeconds()
      ).padStart(2, "0")}`;
      return `${formattedDate} ${formattedTime}`;
    };
    const firstRecordDateTime = formatDateTime(firstRecord.datetime);
    const lastRecordDateTime = formatDateTime(lastRecord.datetime);

    const dailySalesDataWithDate = dailyResults.reduce((acc, record) => {
      const dateString = `${record.hisyear}-${String(record.hismonth).padStart(
        2,
        "0"
      )}-${String(record.hisday).padStart(2, "0")}`;
      const totalInclSelling = parseFloat(record.TotalInclSelling);
      const totalExclSelling = parseFloat(record.TotalExclSelling);
      const totalExclCost = parseFloat(record.TotalExclCost);
      const totalInclCost = parseFloat(record.TotalInclCost);
      const totalVAT = parseFloat(record.TotalVAT);
      const dayProfit = totalExclSelling - totalExclCost;

      const paymentTypeData = {
        paymenttype: record.paymenttype,
        vatpercentage: record.vatpercentage,
        totalInclSelling,
        totalExclSelling,
        totalExclCost,
        totalInclCost,
        totalVAT,
        dayProfit,
      };

      if (!acc[dateString]) {
        acc[dateString] = { date: dateString, paymentTypes: [], totals: {} };
      }

      acc[dateString].paymentTypes.push(paymentTypeData);
      // Update the totals for this date
      acc[dateString].totals.totalInclSelling =
        (acc[dateString].totals.totalInclSelling || 0) + totalInclSelling;
      acc[dateString].totals.totalExclSelling =
        (acc[dateString].totals.totalExclSelling || 0) + totalExclSelling;
      acc[dateString].totals.totalExclCost =
        (acc[dateString].totals.totalExclCost || 0) + totalExclCost;
      acc[dateString].totals.totalInclCost =
        (acc[dateString].totals.totalInclCost || 0) + totalInclCost;
      acc[dateString].totals.totalVAT =
        (acc[dateString].totals.totalVAT || 0) + totalVAT;
      acc[dateString].totals.dayProfit =
        (acc[dateString].totals.dayProfit || 0) + dayProfit;

      return acc;
    }, {});

    const formattedDailyData = Object.values(dailySalesDataWithDate);
    // console.log('Processed data with date:', formattedDailyData);
    const aggregatedResults = {
      totalInclSellingPrice: parseFloat(
        totalInclSellingPrice[0].incl_selling_Price
      ),
      totalExclSellingPrice: parseFloat(
        totalExclSellingPrice[0].excl_selling_Price
      ),
      totalInclCostPrice: parseFloat(totalInclCostPrice[0].incl_cost_Price),
      totalExclCostPrice: parseFloat(totalExclCostPrice[0].excl_cost_Price),
      totalVat: parseFloat(totalVat[0].total_vat),
    };
    // console.log('Aggregated monthly results:', aggregatedResults);
    // Process split tender results and format tenderDate
    const splitTenderData = splitTenderResults.map((record) => {
      const tenderDate = new Date(record.datetime);
      const formattedTenderDate = `${tenderDate.getFullYear()}-${String(
        tenderDate.getMonth() + 1
      ).padStart(2, "0")}-${String(tenderDate.getDate()).padStart(2, "0")}`;
      return {
        tenderDate: formattedTenderDate,
        paymentType: record.paymenttype,
        tenderamount: parseFloat(record.tenderamount),
      };
    });
    // Aggregate the split tender data by date and payment type
    const splitTenderSummaryByDate = splitTenderData.reduce((acc, record) => {
      if (!acc[record.tenderDate]) {
        acc[record.tenderDate] = {};
      }
      if (!acc[record.tenderDate][record.paymentType]) {
        acc[record.tenderDate][record.paymentType] = 0;
      }
      acc[record.tenderDate][record.paymentType] += record.tenderamount;
      return acc;
    }, {});
    // Merge split tender summary into daily sales data and update totalInclSelling
    formattedDailyData.forEach((dayData) => {
      const date = dayData.date;
      const paymentTypes = dayData.paymentTypes;

      paymentTypes.forEach((paymentTypeData) => {
        const paymentType = paymentTypeData.paymenttype;
        if (
          splitTenderSummaryByDate[date] &&
          splitTenderSummaryByDate[date][paymentType]
        ) {
          const splitTenderAmount = splitTenderSummaryByDate[date][paymentType];
          paymentTypeData.splitTenderAmount = splitTenderAmount;
          paymentTypeData.totalInclSelling += splitTenderAmount; // Add splitTenderAmount to totalInclSelling
        } else {
          paymentTypeData.splitTenderAmount = 0;
        }
      });
    });
    const overallTotals = formattedDailyData.reduce(
      (totals, dayData) => {
        totals.totalInclSelling += dayData.totals.totalInclSelling || 0;
        totals.totalExclSelling += dayData.totals.totalExclSelling || 0;
        totals.totalExclCost += dayData.totals.totalExclCost || 0;
        totals.totalInclCost += dayData.totals.totalInclCost || 0;
        totals.totalVAT += dayData.totals.totalVAT || 0;
        totals.dayProfit += dayData.totals.dayProfit || 0;

        // Separate calculation for cash and card payments
        totals.totalCash += dayData.paymentTypes.reduce(
          (cashTotal, paymentTypeData) => {
            if (paymentTypeData.paymenttype === "cash") {
              cashTotal += paymentTypeData.totalInclSelling || 0;
            }
            return cashTotal;
          },
          0
        );

        totals.totalCard += dayData.paymentTypes.reduce(
          (cardTotal, paymentTypeData) => {
            if (paymentTypeData.paymenttype === "card") {
              cardTotal += paymentTypeData.totalInclSelling || 0;
            }
            return cardTotal;
          },
          0
        );

        return totals;
      },
      {
        totalInclSelling: 0,
        totalExclSelling: 0,
        totalExclCost: 0,
        totalInclCost: 0,
        totalVAT: 0,
        dayProfit: 0,
        totalCash: 0,
        totalCard: 0, // Initialize totalCash and totalCard
      }
    );

    // Calculate totalInclSelling for each day in the daily array based on payment type (card or cash)
    const totalInclSellingDaily = formattedDailyData.map((dayData) => {
      const cardTotal = dayData.paymentTypes
        .filter(
          (paymentTypeData) =>
            paymentTypeData.paymenttype.toLowerCase() === "card"
        )
        .reduce((total, paymentTypeData) => {
          return total + (paymentTypeData.totalInclSelling || 0);
        }, 0);

      const cashTotal = dayData.paymentTypes
        .filter(
          (paymentTypeData) =>
            paymentTypeData.paymenttype.toLowerCase() === "cash"
        )
        .reduce((total, paymentTypeData) => {
          return total + (paymentTypeData.totalInclSelling || 0);
        }, 0);

      return {
        date: dayData.date,
        cardTotal,
        cashTotal,
      };
    });

    // Sum up the totalInclSelling for all days separately for card and cash payments
    const totalCardInclSellingOverall = totalInclSellingDaily.reduce(
      (total, dayData) => {
        return total + dayData.cardTotal;
      },
      0
    );

    const totalCashInclSellingOverall = totalInclSellingDaily.reduce(
      (total, dayData) => {
        return total + dayData.cashTotal;
      },
      0
    );

    // Compare the totalInclSelling for card and cash payments with the overall totals
    console.log(
      "Total Card Incl Selling (Overall):",
      totalCardInclSellingOverall
    );
    console.log(
      "Total Cash Incl Selling (Overall):",
      totalCashInclSellingOverall
    );

    // Include grandTotalsForDates in the response
    const jsonResponse = {
      success: true,
      data: {
        daily: formattedDailyData,
        // aggregated: aggregatedResults,
        // splitTender: splitTenderData grandTotals,

        overallTotals: overallTotals,
        totalCash: totalCashInclSellingOverall,
        totalCard: totalCardInclSellingOverall,
        firstRecordDateTime: firstRecordDateTime,
        lastRecordDateTime: lastRecordDateTime,
      },
    };

    const getResponse = (req, jsonResponse) => {
      if (req.superadmin || req.userPermissions) {
        return {
          success: true,
          data: jsonResponse.data,
        };
      }
    };
    const response = getResponse(req, jsonResponse);
    return response;
  } catch (error) {
    if (error.message === "Query execution timed out") {
      console.error("Query execution timed out");
      return { success: false, message: "Query execution timed out" };
    } else {
      console.error("Error updating daily sales report:", error);
      return { success: false, message: "Error updating daily sales report" };
    }
  }
};

exports.currentinvoicesReports = async (req, res) => {
  try {
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const tableNames = req.params.tableName.split(","); // Extract and split table names from request parameters

    // Validate tableNames
    if (!tableNames || !Array.isArray(tableNames) || tableNames.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one table name is required" });
    }

    // Extract the specific databases needed
    let historyDbName, stockmasterDbName;

    // Iterate over each database group in activeDatabases
    for (const dbNameGroup in activeDatabases) {
      if (Object.hasOwnProperty.call(activeDatabases, dbNameGroup)) {
        const dbNameList = activeDatabases[dbNameGroup];

        // Find history and stockmaster databases in the current group
        for (const dbName of dbNameList) {
          if (dbName.includes("history")) {
            historyDbName = dbName;
          } else if (
            dbName.includes("stockmaster") ||
            dbName.includes("master")
          ) {
            stockmasterDbName = dbName;
          }
        }

        // If both databases are found, break out of the loop
        if (historyDbName && stockmasterDbName) {
          break;
        }
      }
    }

    if (!historyDbName || !stockmasterDbName) {
      return res.status(404).json({ message: "Required databases not found" });
    }

    // Create Sequelize instances
    const historyDb = createSequelizeInstanceCustom({
      databaseName: historyDbName,
      host: serverHost,
      password: serverPassword,
      username: serverUser,
      port: serverPort,
    });
    const stockmasterDbPrefix = createSequelizeInstanceCustom({
      databaseName: stockmasterDbName,
      host: serverHost,
      password: serverPassword,
      username: serverUser,
      port: serverPort,
    }); // Assuming the database name is the prefix for tables

    // Build dynamic SQL query for multiple tables
    const sqlQuery = `
      SELECT DISTINCT
        datetime AS datetime,
        salenum,
        paymenttype,
        invoicetotal,
        clerkname,
        accountnum,
        hisyear,
        hismonth,
        hisday,
        vatpercentage,
        ComputerName
      FROM (
        ${tableNames.map((name) => `SELECT * FROM ${name}`).join(" UNION ALL ")}
      ) AS combined
    `;

    const results = await historyDb.query(sqlQuery, {
      type: historyDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    // Calculate totals
    const totalValues = results.reduce(
      (totals, row) => {
        totals.invoicetotal += parseFloat(row.invoicetotal) || 0;
        return totals;
      },
      { invoicetotal: 0 }
    );

    // Structure the response with report and total objects
    const response = {
      InvoiceReport: results,
      grandTotal: {
        InvoiceTotal: totalValues.invoicetotal.toFixed(2), // Format total to 2 decimal places
      },
    };

    res.send(response);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.SaleInvoicesByClerkReports = async (req, res) => {
  try {
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const tableNames = req.params.tableName.split(","); // Extract and split table names from request parameters

    // Validate tableNames
    if (!tableNames || !Array.isArray(tableNames) || tableNames.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one table name is required" });
    }

    // Extract the specific databases needed
    let historyDbName, stockmasterDbName;

    // Iterate over each database group in activeDatabases
    for (const dbNameGroup in activeDatabases) {
      if (Object.hasOwnProperty.call(activeDatabases, dbNameGroup)) {
        const dbNameList = activeDatabases[dbNameGroup];

        // Find history and stockmaster databases in the current group
        for (const dbName of dbNameList) {
          if (dbName.includes("history")) {
            historyDbName = dbName;
          } else if (
            dbName.includes("stockmaster") ||
            dbName.includes("master")
          ) {
            stockmasterDbName = dbName;
          }
        }

        // If both databases are found, break out of the loop
        if (historyDbName && stockmasterDbName) {
          break;
        }
      }
    }

    if (!historyDbName || !stockmasterDbName) {
      return res.status(404).json({ message: "Required databases not found" });
    }

    // Create Sequelize instances
    const historyDb = createSequelizeInstanceCustom({
      databaseName: historyDbName,
      host: serverHost,
      password: serverPassword,
      username: serverUser,
      port: serverPort,
    });
    const stockmasterDbPrefix = createSequelizeInstanceCustom({
      databaseName: stockmasterDbName,
      host: serverHost,
      password: serverPassword,
      username: serverUser,
      port: serverPort,
    }); // Assuming the database name is the prefix for tables

    // Build dynamic SQL query for multiple tables
    const sqlQuery = `
      SELECT DISTINCT
        datetime AS datetime,
        salenum,
        paymenttype,
        invoicetotal,
        clerkname,
        accountnum,
        hisyear,
        hismonth,
        hisday,
        vatpercentage,
        ComputerName
      FROM (
        ${tableNames.map((name) => `SELECT * FROM ${name}`).join(" UNION ALL ")}
      ) AS combined
    `;

    const results = await historyDb.query(sqlQuery, {
      type: historyDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    // Group results by ComputerName
    const groupedResults = results.reduce((acc, row) => {
      const clerkname = row.clerkname;
      if (!acc[clerkname]) {
        acc[clerkname] = {
          clerkname: clerkname,
          invoices: [],
          total: 0,
        };
      }
      acc[clerkname].invoices.push(row);
      acc[clerkname].total += parseFloat(row.invoicetotal) || 0;
      return acc;
    }, {});

    // Convert grouped results object to an array
    const groupedArray = Object.values(groupedResults);

    // Structure the response with report and grand totals
    const grandTotal = groupedArray.reduce(
      (total, group) => total + group.total,
      0
    );

    const response = {
      InvoiceReport: groupedArray,
      grandTotal: {
        InvoiceTotal: grandTotal.toFixed(2), // Format total to 2 decimal places
      },
    };

    res.send(response);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.InvoicesByStationReports = async (req, res) => {
  try {
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const tableNames = req.params.tableName.split(","); // Extract and split table names from request parameters

    // Validate tableNames
    if (!tableNames || !Array.isArray(tableNames) || tableNames.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one table name is required" });
    }

    // Extract the specific databases needed
    let historyDbName, stockmasterDbName;

    // Iterate over each database group in activeDatabases
    for (const dbNameGroup in activeDatabases) {
      if (Object.hasOwnProperty.call(activeDatabases, dbNameGroup)) {
        const dbNameList = activeDatabases[dbNameGroup];

        // Find history and stockmaster databases in the current group
        for (const dbName of dbNameList) {
          if (dbName.includes("history")) {
            historyDbName = dbName;
          } else if (
            dbName.includes("stockmaster") ||
            dbName.includes("master")
          ) {
            stockmasterDbName = dbName;
          }
        }

        // If both databases are found, break out of the loop
        if (historyDbName && stockmasterDbName) {
          break;
        }
      }
    }

    if (!historyDbName || !stockmasterDbName) {
      return res.status(404).json({ message: "Required databases not found" });
    }

    // Create Sequelize instances
    const historyDb = createSequelizeInstanceCustom({
      databaseName: historyDbName,
      host: serverHost,
      password: serverPassword,
      username: serverUser,
      port: serverPort,
    });
    const stockmasterDbPrefix = createSequelizeInstanceCustom({
      databaseName: stockmasterDbName,
      host: serverHost,
      password: serverPassword,
      username: serverUser,
      port: serverPort,
    }); // Assuming the database name is the prefix for tables

    // Build dynamic SQL query for multiple tables
    const sqlQuery = `
      SELECT DISTINCT
        datetime AS datetime,
        salenum,
        paymenttype,
        invoicetotal,
        clerkname,
        accountnum,
        hisyear,
        hismonth,
        hisday,
        vatpercentage,
        ComputerName
      FROM (
        ${tableNames.map((name) => `SELECT * FROM ${name}`).join(" UNION ALL ")}
      ) AS combined
    `;

    const results = await historyDb.query(sqlQuery, {
      type: historyDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    // Group results by ComputerName
    const groupedResults = results.reduce((acc, row) => {
      const ComputerName = row.ComputerName;
      if (!acc[ComputerName]) {
        acc[ComputerName] = {
          ComputerName: ComputerName,
          invoices: [],
          total: 0,
        };
      }
      acc[ComputerName].invoices.push(row);
      acc[ComputerName].total += parseFloat(row.invoicetotal) || 0;
      return acc;
    }, {});

    // Convert grouped results object to an array
    const groupedArray = Object.values(groupedResults);

    // Structure the response with report and grand totals
    const grandTotal = groupedArray.reduce(
      (total, group) => total + group.total,
      0
    );

    const response = {
      InvoiceReport: groupedArray,
      grandTotal: {
        InvoiceTotal: grandTotal.toFixed(2), // Format total to 2 decimal places
      },
    };

    res.send(response);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.refundReport = async (req, res) => {
  try {
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const tableNames = req.params.tableName.split(","); // Extract and split table names from request parameters

    // Validate tableNames
    if (!tableNames || !Array.isArray(tableNames) || tableNames.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one table name is required" });
    }

    // Extract the specific databases needed
    let historyDbName, stockmasterDbName;

    // Iterate over each database group in activeDatabases
    for (const dbNameGroup in activeDatabases) {
      if (Object.hasOwnProperty.call(activeDatabases, dbNameGroup)) {
        const dbNameList = activeDatabases[dbNameGroup];

        // Find history and stockmaster databases in the current group
        for (const dbName of dbNameList) {
          if (dbName.includes("history")) {
            historyDbName = dbName;
          } else if (
            dbName.includes("stockmaster") ||
            dbName.includes("master")
          ) {
            stockmasterDbName = dbName;
          }
        }

        // If both databases are found, break out of the loop
        if (historyDbName && stockmasterDbName) {
          break;
        }
      }
    }

    if (!historyDbName || !stockmasterDbName) {
      return res.status(404).json({ message: "Required databases not found" });
    }

    // Create Sequelize instances
    const historyDb = createSequelizeInstanceCustom({
      databaseName: historyDbName,
      host: serverHost,
      password: serverPassword,
      username: serverUser,
      port: serverPort,
    });

    // Build dynamic SQL query for multiple tables
    const sqlQuery = `
      SELECT * 
      FROM (
        ${tableNames
          .map((name) => `SELECT * FROM ${name} WHERE qty < 0`)
          .join(" UNION ALL ")}
      ) AS combined
      ORDER BY salenum;
    `;

    const results = await historyDb.query(sqlQuery, {
      type: historyDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    // Calculate totals
    const totalValues = results.reduce(
      (totals, row) => {
        const invoiceTotal = parseFloat(row.InvoiceTotal); // Updated field name
        if (!isNaN(invoiceTotal)) {
          totals.invoicetotal += invoiceTotal;
        }
        return totals;
      },
      { invoicetotal: 0 }
    );

    // Structure the response with report and total objects
    const response = {
      RefundReport: results,
      grandTotal: {
        InvoiceTotal: totalValues.invoicetotal.toFixed(2), // Format total to 2 decimal places
      },
    };

    res.send(response);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.CurrentDebtorsAnalysisReport = async (req, res) => {
  try {
    const results = await reportsService.CurrentDebtorsAnalysis(req);
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.PERVIOUSDebtorsAgeAnalysisReport = async (req, res) => {
  try {
    const { debtorGroup, previousAging, checkBalanceGreaterthanZero } =
      req.query; // or req.query, depending on your setup
    // Convert to boolean
    const isGreaterThanZero = checkBalanceGreaterthanZero === "true";
    const results = await reportsService.PERVIOUSDebtorsAgeAnalysis(
      debtorGroup,
      previousAging,
      isGreaterThanZero,
      req
    );
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.GetAllPERVIOUSDebtorsAgeAnalysisGroupsAndPreviousAging = async (
  req,
  res
) => {
  try {
    const results =
      await reportsService.PERVIOUSDebtorsAgeAnalysisGroupsAndPreviousAging(
        req
      );
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.CURRENTDebtorsAgeAnalysisReport = async (req, res) => {
  try {
    const { debtorGroup, previousAging, checkBalanceGreaterthanZero } =
      req.query; // or req.query, depending on your setup
    // Convert to boolean
    const isGreaterThanZero = checkBalanceGreaterthanZero === "true";
    const results = await reportsService.CURRENTDebtorsAgeAnalysis(
      debtorGroup,
      previousAging,
      isGreaterThanZero,
      req
    );
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.GetAllCURRENTDebtorsAgeAnalysisACCTERMSAndAccountSystem = async (
  req,
  res
) => {
  try {
    const results =
      await reportsService.CURRENTDebtorsAgeAnalysisACCTERMSAndAccountSystem(
        req
      );
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.CreditorAnalysisReport = async (req, res) => {
  try {
    const { CmbPreviousAging, checkBalanceGreaterThanZero } = req.query; // or req.query, depending on your setup
    // Convert to boolean
    const isGreaterThanZero = checkBalanceGreaterThanZero === "true";
    const results = await reportsService.CreditorAnalysis(
      CmbPreviousAging,
      isGreaterThanZero,
      req
    );
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.GetAllCreditorAnalysisCmbPreviousAging = async (req, res) => {
  try {
    const results = await reportsService.CreditorAnalysisCmbPreviousAging(req);
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.CURRENTCreditorsAgeAnalysisReport = async (req, res) => {
  try {
    // Read from query parameters
    const { checkBalanceGreaterThanZero } = req.query; // Use req.query for GET requests

    // Convert to boolean
    const isGreaterThanZero = checkBalanceGreaterThanZero === "true";
    const results = await reportsService.CURRENTCreditorsAgeAnalysis(
      isGreaterThanZero,
      req
    );
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.MinStockLevelReport = async (req, res) => {
  try {
    const results = await reportsService.allDataMinStockLevel(req);
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.MaxStockLevelReport = async (req, res) => {
  try {
    const results = await reportsService.allDataMaxStockLevel(req);
    res.send(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.SixWeekReport = async (req, res) => {
  try {
    // Call the service function and pass the request body to it
    const results = await reportsService.sixWeek(req.body, req);

    // Return the results from the service function
    res.json(results);
  } catch (error) {
    console.error("Error fetching data:", error);

    // Error handling based on error message
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }
};

exports.CreditoritemsGrouping = async (req, res) => {
  try {
    const results = await reportsService.tblcreditoritemsGroup(req);
    res
      .status(200)
      .json({ message: "Data inserted successfully", data: results });
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.SaleRepCommissionReport = async (req, res) => {
  const { DateFrom, DateTo } = req.body;
  if (!DateFrom || !DateTo) {
    return res
      .status(400)
      .json({ message: "DateFrom and DateTo are required" });
  }

  try {
    const results = await reportsService.saleRepCommission(
      DateFrom,
      DateTo,
      req
    );
    res
      .status(200)
      .json({ message: "Data inserted successfully", data: results });
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.saleRepCommissionByProductReport = async (req, res) => {
  const { DateFrom, DateTo } = req.body;
  if (!DateFrom || !DateTo) {
    return res
      .status(400)
      .json({ message: "DateFrom and DateTo are required" });
  }

  try {
    const results = await reportsService.saleRepCommissionByProduct(
      DateFrom,
      DateTo,
      req
    );
    res
      .status(200)
      .json({ message: "Data inserted successfully", data: results });
  } catch (error) {
    console.error("Error fetching data:", error);
    if (error.message === "Required databases not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No data found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

exports.CurrentDebtorsStatementReport = async (req, res) => {
  const { cmbCode, cmbType, startDate, endDate } = req.query;

  if (!cmbCode || !cmbType) {
    return res
      .status(400)
      .json({ message: "Missing required parameters: cmbCode or cmbType" });
  }

  if (startDate && isNaN(Date.parse(startDate))) {
    return res.status(400).json({ message: "Invalid startDate format" });
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    return res.status(400).json({ message: "Invalid endDate format" });
  }

  try {
    const results = await DebtorCurrentStatement.currentDebtorsStatement(
      cmbCode,
      cmbType,
      startDate,
      endDate,
      req
    );

    if (results.message) {
      return res.status(404).json({ message: results.message });
    }

    res
      .status(200)
      .json({ message: "Data processed successfully", data: results });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.GetAllCurrentDeborsDetails = async (req, res) => {
  try {
    // Fetch all records
    const results = await DebtorCurrentStatement.GetAllcurrentDebtorsDetails(
      req
    );

    if (results.message) {
      return res.status(404).json({ message: results.message });
    }

    // Extract the filter parameter from query
    const { AccountSystem } = req.query;

    // Filter results if AccountSystem is provided
    let filteredResults = results;
    if (AccountSystem) {
      filteredResults = results.filter(
        (record) => record.AccountSystem === AccountSystem
      );
    }

    res
      .status(200)
      .json({ message: "Data processed successfully", data: filteredResults });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.PreviousDebtorsStatementReport = async (req, res) => {
  const { cmbCode, startDate, endDate } = req.query;

  if (!cmbCode) {
    return res
      .status(400)
      .json({ message: "Missing required parameters: cmbCode" });
  }

  if (startDate && isNaN(Date.parse(startDate))) {
    return res.status(400).json({ message: "Invalid startDate format" });
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    return res.status(400).json({ message: "Invalid endDate format" });
  }

  try {
    const results = await DebtorPreviousStatement.previousDebtorsStatement(
      cmbCode,
      startDate,
      endDate,
      req
    );

    if (results.message) {
      return res.status(404).json({ message: results.message });
    }

    res
      .status(200)
      .json({ message: "Data processed successfully", data: results });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.GetAllPerviousDeborsDetails = async (req, res) => {
  try {
    const results = await DebtorPreviousStatement.GetAllPreviousDebtorsDetails(
      req
    );

    // Check if no data was found
    if (!results.data || results.data.length === 0) {
      return res.status(404).json({ message: results.message });
    }

    // Send the actual data
    res.status(200).json({
      message: results.message,
      data: results.data, // Extract data explicitly
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.CurrentCreditorStatementReport = async (req, res) => {
  const { cmbCode, startDate, endDate } = req.query;

  if (!cmbCode) {
    return res
      .status(400)
      .json({ message: "Missing required parameters: cmbCode or cmbType" });
  }

  if (startDate && isNaN(Date.parse(startDate))) {
    return res.status(400).json({ message: "Invalid startDate format" });
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    return res.status(400).json({ message: "Invalid endDate format" });
  }

  try {
    const results = await CreditorCurrentStatement.currentCreditorStatement(
      cmbCode,
      startDate,
      endDate,
      req
    );

    if (results.message) {
      return res.status(404).json({ message: results.message });
    }

    res
      .status(200)
      .json({ message: "Data processed successfully", data: results });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.GetAllCurrentCreditorDetails = async (req, res) => {
  try {
    // Fetch all records
    const results = await CreditorCurrentStatement.GetAllcurrentCreditorDetails(
      req
    );

    if (results.message) {
      return res.status(404).json({ message: results.message });
    }

    // Extract the filter parameter from query
    const { AccountSystem } = req.query;

    // Filter results if AccountSystem is provided
    let filteredResults = results;
    if (AccountSystem) {
      filteredResults = results.filter(
        (record) => record.AccountSystem === AccountSystem
      );
    }

    res
      .status(200)
      .json({ message: "Data processed successfully", data: filteredResults });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.PreviousCreditorStatementReport = async (req, res) => {
  const { cmbCode, startDate, endDate } = req.query;

  if (!cmbCode) {
    return res
      .status(400)
      .json({ message: "Missing required parameters: cmbCode" });
  }

  if (startDate && isNaN(Date.parse(startDate))) {
    return res.status(400).json({ message: "Invalid startDate format" });
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    return res.status(400).json({ message: "Invalid endDate format" });
  }

  try {
    const results = await CreditorPreviousStatement.previousCreditorStatement(
      cmbCode,
      startDate,
      endDate,
      req
    );

    if (results.message) {
      return res.status(404).json({ message: results.message });
    }

    res
      .status(200)
      .json({ message: "Data processed successfully", data: results });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.GetAllPerviousCreditorDetails = async (req, res) => {
  try {
    const results =
      await CreditorPreviousStatement.GetAllPreviousCreditorDetails(req);

    // Check if no data was found
    if (!results.data || results.data.length === 0) {
      return res.status(404).json({ message: results.message });
    }

    // Send the actual data
    res.status(200).json({
      message: results.message,
      data: results.data, // Extract data explicitly
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// FinancialSummaryReport controller
exports.FinancialSummaryReport = async (req, res) => {
  try {
    const { DTPFrom, DTPTo } = req.query;

    // Ensure both dates are provided
    if (!DTPFrom || !DTPTo) {
      return res
        .status(400)
        .json({ message: "Both DTPFrom and DTPTo are required" });
    }

    // Convert to Date objects
    const startDate = new Date(DTPFrom);
    const endDate = new Date(DTPTo);

    // Validate date range (make sure the start date is before the end date)
    if (startDate > endDate) {
      return res.status(400).json({ message: "DTPFrom cannot be after DTPTo" });
    }

    const results = await FinancialSummary.FinancialSummary(
      startDate,
      endDate,
      req
    );
    res
      .status(200)
      .json({ message: "Data fetched successfully", data: results });
  } catch (error) {
    console.error("Error fetching data:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.GrvDataFunReport = async (req, res) => {
  try {
    // Retrieve query parameters (DTPFrom, DTPTo) from the request
    const { DTPFrom, DTPTo } = req.query;

    // Ensure that the date parameters are provided
    if (!DTPFrom || !DTPTo) {
      return res
        .status(400)
        .json({ message: "Both DTPFrom and DTPTo are required" });
    }

    // Call the GrvDataFun function with the 'DTPFrom' and 'DTPTo' parameters
    const results = await GrvDataFun.GrvDataFun(DTPFrom, DTPTo, req);

    // Return the results as a response
    res
      .status(200)
      .json({ message: "Data fetched successfully", data: results });
  } catch (error) {
    console.error("Error fetching GRV data:", error.message || error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
// Function to handle multiple table names and store the reports
exports.generateReportsForTables = async (req, res, tableNames) => {
  try {
    const allReports = [];

    for (const tableName of tableNames) {
      console.log(`Processing table: ${tableName}`);
      const response = await exports.DailySalesReport(req, res, tableName);

      if (response.success) {
        allReports.push({
          tableName,
          report: response.data,
        });
      } else {
        allReports.push({
          tableName,
          error: response.message,
        });
      }
    }

    // Store allReports in a persistent storage if needed
    // For example, you can save it to a file or a database

    return { success: true, reports: allReports };
  } catch (error) {
    console.error(
      "An unexpected error occurred while generating reports:",
      error
    );
    return {
      success: false,
      message: "An unexpected error occurred while generating reports",
    };
  }
};

const executeUpdate = async () => {
  try {
    const response = await exports.DailySalesReport();

    if (response.success) {
      const data = response.data;
      // console.log(JSON.stringify(data, null, 2));
    } else {
      console.error(response.message);
    }
  } catch (error) {
    console.error("An unexpected error occurred:", error);
  }
};

// Call the async function
executeUpdate();
