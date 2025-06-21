// services/ReportServices/ReportServices.js
const {
  getDatabases,
  getDatabasesCustom,
} = require("../../utils/databaseHelper"); // Adjust the path if necessary
const {
  getDatabasesMultiple,
  getDatabasesMultipleCustom,
} = require("../../utils/databaseHelperMultiple"); // Adjust the path if necessary
const databaseController = require("../../controllers/databaseController");
const { QueryTypes } = require("sequelize");
const dateFns = require("date-fns");
const { format, getYear, getMonth, addDays } = require("date-fns");
const createSequelizeInstanceCustom = require("../../utils/sequelizeInstanceCustom");

exports.findSpeficlyStaticTblDataCurrentTran = async (req) => {
  try {
    const { shopKey } = req.query;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb, stockmasterDb } = getDatabases(activeDatabases);

    // Get the database name from the Sequelize instance
    const stockmasterDbName = stockmasterDb.getDatabaseName(); // Ensure this method is available

    const sqlQuery = `
      SELECT 
          t.*, 
          c.MajorDescription AS MajorDescription,
          s.Sub1Description AS Sub1Description,
          w.Sub2Description AS Sub2Description
      FROM 
          202408tbldata_current_tran AS t
      LEFT JOIN 
          ${stockmasterDbName}.tblcategory AS c ON t.majorno = c.MajorNo
      LEFT JOIN 
          ${stockmasterDbName}.tblcategory_sub1 AS s ON t.sub1no = s.Sub1No
      LEFT JOIN 
          ${stockmasterDbName}.tblcategory_sub2 AS w ON t.sub2no = w.Sub2No;
    `;

    const results = await historyDb.query(sqlQuery, {
      type: historyDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      throw new Error("No data found");
    }

    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};
exports.companydetailstblReg = async (req) => {
  try {
    const { serverHost, serverUser, serverPassword, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb, stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost,
      serverUser,
      serverPassword,
      serverPort,
    });

    let sqlQuery = `SELECT * FROM tblreg`;
    const results = await stockmasterDb.query(sqlQuery, {
      type: QueryTypes.SELECT,
    });
    if (results.length === 0) {
      throw new Error("No data found");
    }
    return results;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

// exports.acrossReport = async (startDate, endDate, req, shopKeys) => {
//   try {
//     const { serverHost, serverUser, serverPassword, serverPort } = req.user;
//     const activeDatabases = await databaseController.getActiveDatabases(
//       req.user,
//       req.query.shopKey
//     );

//     // Get the history and stockmaster databases using the utility
//     const { historyDbs, stockmasterDbs } =
//       getDatabasesMultiple(activeDatabases);

//     // Initialize an object to hold results with stock codes as keys
//     const allResults = {};
//     let grandTotalQty = 0; // Initialize a variable for the grand total

//     // Loop through each database
//     for (const historyDb of historyDbs) {
//       const dbName = historyDb.config.database; // Get the current database name
//       // Get all tables in the current database
//       const tables = await historyDb.query("SHOW TABLES", {
//         type: historyDb.QueryTypes.SELECT,
//       });

//       // Collect all tables matching the pattern YYYYMMtbldata_current_tran
//       const matchingTables = [];

//       tables.forEach((table) => {
//         const tableName = Object.values(table)[0]; // Extract table name
//         const match = tableName.match(/^(\d{6})tbldata_current_tran$/);
//         if (match) {
//           matchingTables.push(tableName); // Collect matching table names
//         }
//       });

//       // Query each matching table
//       for (const table of matchingTables) {
//         // Modify the SQL query to include date filtering if dates are provided
//         let sqlQuery = `SELECT stockcode, stockdescription, qty FROM ${table}`;

//         if (startDate && endDate) {
//           // Validate date format
//           if (new Date(startDate) > new Date(endDate)) {
//             throw new Error("Start date cannot be greater than end date");
//           }

//           sqlQuery += ` WHERE datetime BETWEEN :startDate AND :endDate`;
//         }

//         const results = await historyDb.query(sqlQuery, {
//           type: historyDb.QueryTypes.SELECT,
//           timeout: 90000,
//           replacements: { startDate, endDate },
//         });
//         // Aggregate results
//         for (const { stockcode, stockdescription, qty } of results) {
//           if (!allResults[stockcode]) {
//             allResults[stockcode] = {
//               stockcode,
//               stockdescription,
//               qtyByDb: { [dbName]: qty }, // Initialize with current database's quantity
//               totalQty: qty, // Initialize total quantity
//             };
//           } else {
//             allResults[stockcode].qtyByDb[dbName] =
//               (allResults[stockcode].qtyByDb[dbName] || 0) + qty; // Sum quantities for this database
//             allResults[stockcode].totalQty += qty; // Sum total quantities
//           }
//           grandTotalQty += qty; // Add to the grand total
//         }
//       }
//     }

//     // Check if any data was found
//     if (Object.keys(allResults).length === 0) {
//       throw new Error("No data found");
//     }

//     // Prepare final results
//     const finalResults = Object.keys(allResults).map((stockcode) => {
//       const { stockdescription, qtyByDb, totalQty } = allResults[stockcode];
//       return {
//         stockcode,
//         stockdescription,
//         ...qtyByDb, // Spread quantities by database
//         totalQty: parseFloat(totalQty.toFixed(2)), // Add total quantity for this stock code
//       };
//     });

//     // Add missing stock codes with zero quantities for each database
//     for (const dbName of historyDbs.map((db) => db.config.database)) {
//       finalResults.forEach((item) => {
//         if (!(dbName in item)) {
//           item[dbName] = 0; // Assign 0 if the stock code is missing in the database
//         }
//       });
//     }

//     // Round total quantities for each database
//     finalResults.forEach((item) => {
//       Object.keys(item).forEach((key) => {
//         if (typeof item[key] === "number") {
//           item[key] = parseFloat(item[key].toFixed(2)); // Round to 2 decimal places
//         }
//       });
//     });

//     grandTotalQty = parseFloat(grandTotalQty.toFixed(2)); // Round grandTotalQty to 2 decimal places

//     return {
//       finalResults, // This will now include results grouped by stock codes with quantities per database
//       grandTotalQty, // Include the grand total in the return value
//     };
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };

exports.acrossReport = async (startDate, endDate, req) => {
  try {
    const { serverHost, serverUser, serverPassword, serverPort } = req.user;

    // Parse comma-separated shopKeys into an array
    const shopKeysString = req.query.shopKeys || "";
    const shopKeysArray = shopKeysString
      .split(",")
      .map((key) => key.trim())
      .filter((key) => key);

    // For each shopKey, fetch active databases and get history/stockmaster DBs
    const dbGroups = await Promise.all(
      shopKeysArray.map(async (shopKey) => {
        const activeDbs = await databaseController.getActiveDatabases(
          req.user,
          shopKey
        );
        // getDatabasesMultipleCustom expects an object, not an array
        return getDatabasesMultipleCustom({
          activeDatabasesMultiple: activeDbs,
          serverHost,
          serverUser,
          serverPassword,
        });
      })
    );

    // Flatten history and stockmaster DBs across all shopKeys
    const historyDbs = dbGroups.flatMap((group) => group.historyDbs);
    const stockmasterDbs = dbGroups.flatMap((group) => group.stockmasterDbs);

    // 1) Retrieve table info for all history DBs concurrently
    const tableInfoArray = await Promise.all(
      historyDbs.map(async (historyDb) => {
        const dbName = historyDb.config.database;
        const tables = await historyDb.query("SHOW TABLES", {
          type: historyDb.QueryTypes.SELECT,
        });
        // Collect matching tables
        const matchingTables = tables
          .map((tableObj) => Object.values(tableObj)[0])
          .filter((name) => /^(\d{6})tbldata_current_tran$/.test(name));
        return { historyDb, dbName, matchingTables };
      })
    );

    // 2) Query all tables in parallel
    const queryPromises = tableInfoArray.flatMap(
      ({ historyDb, dbName, matchingTables }) =>
        matchingTables.map((table) => {
          let sqlQuery = `SELECT stockcode, stockdescription, qty FROM ${table}`;
          if (startDate && endDate) {
            if (new Date(startDate) > new Date(endDate)) {
              throw new Error("Start date cannot be greater than end date");
            }
            sqlQuery += ` WHERE datetime BETWEEN :startDate AND :endDate`;
          }
          return historyDb
            .query(sqlQuery, {
              type: historyDb.QueryTypes.SELECT,
              timeout: 90000,
              replacements: { startDate, endDate },
            })
            .then((results) => ({ dbName, results }));
        })
    );
    const tableResults = await Promise.all(queryPromises);

    // Aggregate results
    const allResults = {};
    let grandTotalQty = 0;
    tableResults.forEach(({ dbName, results }) => {
      results.forEach(({ stockcode, stockdescription, qty }) => {
        if (!allResults[stockcode]) {
          allResults[stockcode] = {
            stockcode,
            stockdescription,
            qtyByDb: { [dbName]: qty },
            totalQty: qty,
          };
        } else {
          allResults[stockcode].qtyByDb[dbName] =
            (allResults[stockcode].qtyByDb[dbName] || 0) + qty;
          allResults[stockcode].totalQty += qty;
        }
        grandTotalQty += qty;
      });
    });

    if (Object.keys(allResults).length === 0) {
      throw new Error("No data found");
    }

    // Prepare final results
    const finalResults = Object.keys(allResults).map((stockcode) => {
      const { stockdescription, qtyByDb, totalQty } = allResults[stockcode];
      return {
        stockcode,
        stockdescription,
        ...qtyByDb,
        totalQty: parseFloat(totalQty.toFixed(2)),
      };
    });

    // Get unique database names for sortableKeys
    const dbNames = [...new Set(historyDbs.map((db) => db.config.database))];

    // Ensure each DB column exists
    historyDbs
      .map((db) => db.config.database)
      .forEach((dbName) => {
        finalResults.forEach((item) => {
          if (!(dbName in item)) item[dbName] = 0;
        });
      });

    // Round values
    finalResults.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (typeof item[key] === "number") {
          item[key] = parseFloat(item[key].toFixed(2));
        }
      });
    });
    grandTotalQty = parseFloat(grandTotalQty.toFixed(2));

    // Include database names in sortableKeys along with totalQty
    const sortableKeys = ["totalQty", ...dbNames];

    return { finalResults, grandTotalQty, sortableKeys };
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * POST /api/reports/acrossStoresProducts
 * Body:   { shopKeys: ["SHOP_A","SHOP_B",…] }
 * Query:  ?year=2025   (optional; defaults to current calendar year)
 */
exports.acrossStoresProductsReport = async (req) => {
  try {
    const yearParam = req.query.year;
    const { serverHost, serverUser, serverPassword, serverPort } = req.user;

    // Parse comma-separated shopKeys into an array
    const shopKeysString = req.query.shopKeys || "";
    const shopKeys = shopKeysString
      .split(",")
      .map((key) => key.trim())
      .filter((key) => key);

    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    if (isNaN(year) || year < 2000 || year > 3000) {
      throw new Error("`year` must be a valid 4-digit number");
    }

    // 2) Prepare date window and monthly table names
    const yearStart = `${year}-01-01 00:00:00`;
    const yearEnd = `${year}-12-31 23:59:59`;
    const expectedTables = Array.from({ length: 12 }, (_, i) => {
      const mm = String(i + 1).padStart(2, "0");
      return `${year}${mm}tbldata_current_tran`;
    });

    // 3) For each shop, fetch the per-product aggregates
    const perShopPromises = shopKeys.map(async (shopKey) => {
      // 3a) find the history‐DB name for this shopKey
      const activeDbs = await databaseController.getActiveDatabases(
        req.user,
        shopKey
      );
      let historyDbName;
      outer: for (const grp of Object.values(activeDbs)) {
        for (const db of grp) {
          if (db.includes("history")) {
            historyDbName = db;
            break outer;
          }
        }
      }
      if (!historyDbName) {
        // no data for this shop → return empty list
        return { shopKey, data: [] };
      }

      // 3b) connect Sequelize to that DB
      const historyDb = createSequelizeInstanceCustom({
        databaseName: historyDbName,
        host: serverHost,
        username: serverUser,
        password: serverPassword,
        port: serverPort,
      });

      // 3c) discover which monthly tables actually exist
      const existing = await historyDb.query(
        `
        SELECT TABLE_NAME AS Name
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = :db
          AND TABLE_NAME IN (:tbls)
        `,
        {
          replacements: { db: historyDbName, tbls: expectedTables },
          type: QueryTypes.SELECT,
        }
      );
      const tablesInYear = existing.map((r) => r.Name);
      if (tablesInYear.length === 0) {
        return { shopKey, data: [] };
      }

      // 3d) build one subquery per month that sums qty, cost, and selling
      const subq = tablesInYear
        .map((tbl) =>
          `
        SELECT
          stockcode,
          stockdescription,
          SUM(qty)                         AS quantity,
          SUM(averagecostprice * qty)     AS totalCost,
          SUM(linetotal)                  AS totalSelling
        FROM \`${tbl}\`
        WHERE datetime BETWEEN :start AND :end
        GROUP BY stockcode, stockdescription
      `.trim()
        )
        .join("\nUNION ALL\n");

      // 3e) wrap & re-aggregate in case same product appears in multiple months
      const sql = `
        SELECT
          stockcode,
          stockdescription,
          SUM(quantity)     AS quantity,
          SUM(totalCost)    AS totalCost,
          SUM(totalSelling) AS totalSelling
        FROM (
          ${subq}
        ) AS monthly_union
        GROUP BY stockcode, stockdescription;
      `;
      const rows = await historyDb.query(sql, {
        replacements: { start: yearStart, end: yearEnd },
        type: QueryTypes.SELECT,
      });

      return { shopKey, data: rows };
    });

    const perShopResults = await Promise.all(perShopPromises);

    // 4) Merge all shops’ rows into one product-pivot table
    const prodMap = new Map();
    perShopResults.forEach(({ shopKey, data }) => {
      data.forEach(
        ({
          stockcode,
          stockdescription,
          quantity,
          totalCost,
          totalSelling,
        }) => {
          const key = `${stockcode}|||${stockdescription}`;
          if (!prodMap.has(key)) {
            prodMap.set(key, {
              stockcode,
              stockdescription,
              shops: {},
            });
          }
          const rec = prodMap.get(key);
          const qty = Number(quantity) || 0;
          const tc = Number(totalCost) || 0;
          const ts = Number(totalSelling) || 0;
          rec.shops[shopKey] = {
            quantity: qty,
            unitCost: qty > 0 ? tc / qty : 0,
            totalCost: tc,
            unitSelling: qty > 0 ? ts / qty : 0,
            totalSelling: ts,
            quantitySold: qty,
          };
        }
      );
    });

    // 5) build the final array
    const result = [];
    for (const { stockcode, stockdescription, shops } of prodMap.values()) {
      const row = { stockcode, stockdescription };
      shopKeys.forEach((shopKey) => {
        const m = shops[shopKey] || {
          quantity: 0,
          unitCost: 0,
          totalCost: 0,
          unitSelling: 0,
          totalSelling: 0,
          quantitySold: 0,
        };
        row[`${shopKey} Quantity`] = m.quantity;
        row[`${shopKey} Unit Cost`] = m.unitCost;
        row[`${shopKey} Total Cost`] = m.totalCost;
        row[`${shopKey} Unit Selling`] = m.unitSelling;
        row[`${shopKey} Total Selling`] = m.totalSelling;
        row[`${shopKey} Quantity Sold`] = m.quantitySold;
      });
      result.push(row);
    }

    // 6) Generate sortableKeys for all the dynamic columns
    const sortableKeys = [];
    shopKeys.forEach((shopKey) => {
      sortableKeys.push(
        `${shopKey} Quantity`,
        `${shopKey} Unit Cost`,
        `${shopKey} Total Cost`,
        `${shopKey} Unit Selling`,
        `${shopKey} Total Selling`,
        `${shopKey} Quantity Sold`
      );
    });

    return { data: result, sortableKeys };
  } catch (err) {
    throw err;
  }
};


exports.acrossRetailWholesaleByProductReport = async (req) => {
  // 1) parse + validate shopKeys & year
  const rawKeys = req.query.shopKeys
  if (!rawKeys) {
    throw new Error('`shopKeys` is required')
  }
  const shopKeys = String(rawKeys)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  if (!shopKeys.length) {
    throw new Error('At least one shopKey must be provided')
  }
  const yearParam = req.query.year
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()
  if (isNaN(year) || year < 2000 || year > 3000) {
    throw new Error('`year` must be a valid 4-digit number')
  }

  // 2) common setup
  const { serverHost, serverUser, serverPassword, serverPort } = req.user
  const yearStart = `${year}-01-01 00:00:00`
  const yearEnd = `${year}-12-31 23:59:59`
  const expectedTables = Array.from({ length: 12 }, (_, i) => {
    const mm = String(i + 1).padStart(2, '0')
    return `${year}${mm}tbldata_current_tran`
  })

  // 3) fetch each shop's per-product saleNum + qty + type
  const perShopData = await Promise.all(
    shopKeys.map(async shopKey => {
      // find its history DB
      const active = await databaseController.getActiveDatabases(req.user, shopKey)
      let historyDbName
      outer: for (const grp of Object.values(active)) {
        for (const dbName of grp) {
          if (dbName.includes('history')) {
            historyDbName = dbName
            break outer
          }
        }
      }
      if (!historyDbName) return { shopKey, rows: [] }

      // connect
      const db = createSequelizeInstanceCustom({
        databaseName: historyDbName,
        host: serverHost,
        username: serverUser,
        password: serverPassword,
        port: serverPort
      })

      // discover existing tables
      const exist = await db.query(
        `SELECT TABLE_NAME AS Name
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = :db
           AND TABLE_NAME IN (:list)`,
        {
          replacements: { db: historyDbName, list: expectedTables },
          type: QueryTypes.SELECT
        }
      )
      const tables = exist.map(r => r.Name)
      if (!tables.length) return { shopKey, rows: [] }

      // build UNION ALL with qty from Cardnum or qty, and type by CehqueNum
      const subq = tables.map(tbl => `
        SELECT
          stockcode,
          stockdescription,
          salenum,
          CASE WHEN TRIM(Cardnum) <> '' THEN CAST(Cardnum AS DECIMAL(12,2)) ELSE qty END AS saleQty,
          CASE WHEN CehqueNum IN ('Combo','ComboGroup','') THEN 'retail' ELSE 'wholesale' END AS saleType
        FROM \`${tbl}\`
        WHERE datetime BETWEEN :start AND :end
      `.trim()).join('\nUNION ALL\n')

      const sql = `
        SELECT
          stockcode,
          stockdescription,
          COUNT(DISTINCT salenum) AS saleNum,
          SUM(saleQty)           AS qty,
          CASE WHEN MAX(CASE WHEN saleType = 'wholesale' THEN 1 ELSE 0 END) = 1 THEN 'wholesale' ELSE 'retail' END AS type
        FROM (
          ${subq}
        ) AS all_sales
        GROUP BY stockcode, stockdescription
      `

      const rows = await db.query(sql, {
        replacements: { start: yearStart, end: yearEnd },
        type: QueryTypes.SELECT
      })

      return { shopKey, rows }
    })
  )

  // 4) pivot into data rows
  const prodMap = new Map()
  perShopData.forEach(({ shopKey, rows }) => {
    rows.forEach(({ stockcode, stockdescription, saleNum, qty, type }) => {
      const key = `${stockcode}|||${stockdescription}`
      if (!prodMap.has(key)) prodMap.set(key, { stockcode, stockdescription, shops: {} })
      const rec = prodMap.get(key)
      rec.shops[shopKey] = { saleNum: Number(saleNum) || 0, qty: Number(qty) || 0, type }
    })
  })

  const data = []
  prodMap.forEach(({ stockcode, stockdescription, shops }) => {
    const row = { stockcode, stockdescription }
    shopKeys.forEach(shopKey => {
      const k = shopKey.replace(/[^A-Za-z0-9]/g, '')
      const m = shops[shopKey] || { saleNum: 0, qty: 0, type: 'retail' }
      row[`${k} Sale Number`] = m.saleNum
      row[`${k} Quantity`]    = m.qty
      row[`${k} Type`]        = m.type
    })
    data.push(row)
  })

  // 5) sortableKeys
  const sortableKeys = shopKeys.flatMap(shopKey => {
    const k = shopKey.replace(/[^A-Za-z0-9]/g, '')
    return [`${k} Sale Number`, `${k} Quantity`, `${k} Type`]
  })

  // 6) return
  return { success: true, sortableKeys, data }
}


exports.allTblDataCancelTran = async (req) => {
  try {
    const { serverHost, serverUser, serverPassword, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb, stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost,
      serverUser,
      serverPassword,
      serverPort,
    });
    let sqlQuery = `SELECT * FROM tbldatacancel_tran`;
    const results = await historyDb.query(sqlQuery, {
      type: historyDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      throw new Error("No data found");
    }
    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service Function to handle multiple table names dynamically
exports.tblDataCancelTranSearchTables = async (tableNames, req) => {
  try {
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
      serverPort: req.user.serverPort,
    });

    // Split the table names by comma and validate each one
    const tables = tableNames.split(",").map((name) => name.trim());

    // Validate each table name to avoid SQL injection
    tables.forEach((tableName) => {
      if (!/^\d{6}tbldata_cancel_tran$/.test(tableName)) {
        throw new Error(`Invalid table name: ${tableName}`);
      }
    });

    // Initialize an array to hold the results
    const results = [];

    // Query each table and concatenate the results
    for (const tableName of tables) {
      let sqlQuery = `SELECT * FROM ${tableName}`;
      const tableResults = await historyDb.query(sqlQuery, {
        type: historyDb.QueryTypes.SELECT,
      });
      results.push(...tableResults);
    }

    if (results.length === 0) {
      throw new Error("No data found");
    }

    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};
exports.allTblDataPrice = async (req) => {
  try {
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb, stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
      serverPort: req.user.serverPort,
    });
    let sqlQuery = `SELECT * FROM tbldataprice`;
    const results = await historyDb.query(sqlQuery, {
      type: historyDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      throw new Error("No data found");
    }
    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.tblDataPriceSearchTables = async (tableNames, req) => {
  try {
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
      serverPort: req.user.serverPort,
    });

    // Split the table names by comma and validate each one
    const tables = tableNames.split(",").map((name) => name.trim());

    // Validate each table name to avoid SQL injection
    tables.forEach((tableName) => {
      if (!/^\d{6}tbldata_price$/.test(tableName)) {
        throw new Error(`Invalid table name: ${tableName}`);
      }
    });

    // Initialize an array to hold the results
    const results = [];

    // Query each table and concatenate the results
    for (const tableName of tables) {
      let sqlQuery = `SELECT * FROM ${tableName}`;
      const tableResults = await historyDb.query(sqlQuery, {
        type: historyDb.QueryTypes.SELECT,
      });
      results.push(...tableResults);
    }

    if (results.length === 0) {
      throw new Error("No data found");
    }

    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.tblDataStockActivitySearchTables = (
  tableNames,
  stockcode = null,
  req
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const activeDatabases = await databaseController.getActiveDatabases(
        req.user,
        req.query.shopKey
      );
      const { historyDb } = getDatabasesCustom({
        activeDatabases,
        serverHost: req.user.serverHost,
        serverUser: req.user.serverUser,
        serverPassword: req.user.serverPassword,
        serverPort: req.user.serverPort,
      });
      const tables = tableNames.split(",").map((name) => name.trim());

      // Validate table names
      tables.forEach((tableName) => {
        if (!/^\d{6}tbldata_stockactivity$/.test(tableName)) {
          return reject(new Error(`Invalid table name: ${tableName}`));
        }
      });

      const limit = 1000; // Records per page
      let allResults = []; // To store results from all tables

      // Fetch data for each table in parallel using Promise.all
      const tableQueries = tables.map(async (tableName) => {
        const countQuery = `
          SELECT COUNT(*) as total
          FROM ${tableName}
          ${stockcode ? `WHERE stockcode = '${stockcode}'` : ""};`;

        const totalCountResult = await historyDb.query(countQuery, {
          type: historyDb.QueryTypes.SELECT,
        });
        const totalCount = totalCountResult[0].total;
        console.log(`Total records in ${tableName}: ${totalCount}`);

        let page = 1;
        let tableResults = [];

        while ((page - 1) * limit < totalCount) {
          const offset = (page - 1) * limit;
          let sqlQuery = `
            SELECT DISTINCT(stockcode), datetime, stockdescription, openqty,
              FORMAT(openqty + SUM(receivedqty) + SUM(adjustedqty) - SUM(soldqty) - SUM(usedincombinedqty) + SUM(stocktakediffqty), '0.00') AS closeqty,
              SUM(soldqty) AS soldqty, 
              SUM(receivedqty) AS receivedqty, 
              SUM(adjustedqty) AS adjustedqty, 
              SUM(usedincombinedqty) AS usedincombinedqty, 
              SUM(stocktakediffqty) AS stocktakediffqty
            FROM ${tableName}
            ${stockcode ? `WHERE stockcode = '${stockcode}'` : ""}
            GROUP BY stockcode
            LIMIT ${limit} OFFSET ${offset};`;

          const results = await historyDb.query(sqlQuery, {
            type: historyDb.QueryTypes.SELECT,
          });
          tableResults.push(...results);
          page++;
        }

        return tableResults; // Return results for the current table
      });

      // Wait for all table queries to finish
      const results = await Promise.all(tableQueries);
      allResults = results.flat(); // Flatten results from all tables

      if (allResults.length === 0) {
        return reject(new Error("No data found"));
      }

      // Map to limit fields in the response
      const limitedFieldResults = allResults.map((item) => {
        return {
          StockCode: item.stockcode,
          DateTime: item.datetime,
          StockDescription: item.stockdescription,
          OpenQty: parseFloat(item.openqty),
          CloseQty: parseFloat(item.closeqty),
          SoldQty: parseFloat(item.soldqty),
          ReceivedQty: parseFloat(item.receivedqty),
          AdjustedQty: parseFloat(item.adjustedqty),
          UsedInCombinedQty: parseFloat(item.usedincombinedqty),
          StockTakeDiffQty: parseFloat(item.stocktakediffqty),
        };
      });

      // Group by StockCode and StockDescription and calculate the totals for each group
      const groupedResults = limitedFieldResults.reduce((acc, item) => {
        const {
          StockCode,
          StockDescription,
          OpenQty,
          CloseQty,
          SoldQty,
          ReceivedQty,
          AdjustedQty,
          UsedInCombinedQty,
          StockTakeDiffQty,
        } = item;
        const key = `${StockCode}-${StockDescription}`;
        if (!acc[key]) {
          acc[key] = {
            StockCode,
            StockDescription,
            OpenQtytotalAmount: 0,
            CloseQtytotalAmount: 0,
            SoldQtytotalAmount: 0,
            ReceivedQtytotalAmount: 0,
            AdjustedQtytotalAmount: 0,
            UsedInCombinedQtytotalAmount: 0,
            StockTakeDiffQtytotalAmount: 0,
            transactions: [],
          };
        }
        acc[key].OpenQtytotalAmount += OpenQty;
        acc[key].CloseQtytotalAmount += CloseQty;
        acc[key].SoldQtytotalAmount += SoldQty;
        acc[key].ReceivedQtytotalAmount += ReceivedQty;
        acc[key].AdjustedQtytotalAmount += AdjustedQty;
        acc[key].UsedInCombinedQtytotalAmount += UsedInCombinedQty;
        acc[key].StockTakeDiffQtytotalAmount += StockTakeDiffQty;

        acc[key].transactions.push(item);
        return acc;
      }, {});

      const groupedArray = Object.values(groupedResults);
      resolve({ groupedArray }); // Return the result
    } catch (error) {
      reject(new Error(error.message));
    }
  });
};
exports.allTblPayout = async (req) => {
  try {
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb, stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
      serverPort: req.user.serverPort,
    });
    let sqlQuery = `SELECT * FROM tbldatapayout`;
    const results = await historyDb.query(sqlQuery, {
      type: historyDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      throw new Error("No data found");
    }
    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};
exports.allTblStockActivity = async (req) => {
  try {
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb, stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
      serverPort: req.user.serverPort,
    });
    let sqlQuery = `SELECT * FROM tbldatastockactivity`;
    const results = await historyDb.query(sqlQuery, {
      type: historyDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      throw new Error("No data found");
    }
    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};
exports.tblDataPayoutSearchTables = async (tableNames, req) => {
  try {
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
      serverPort: req.user.serverPort,
    });

    // Split the table names by comma and validate each one
    const tables = tableNames.split(",").map((name) => name.trim());

    // Validate each table name to avoid SQL injection
    tables.forEach((tableName) => {
      if (!/^\d{6}tblPayout$/.test(tableName)) {
        throw new Error(`Invalid table name: ${tableName}`);
      }
    });

    // Initialize an array to hold the results
    const results = [];

    // Query each table and concatenate the results
    for (const tableName of tables) {
      let sqlQuery = `SELECT * FROM ${tableName}`;
      const tableResults = await historyDb.query(sqlQuery, {
        type: historyDb.QueryTypes.SELECT,
      });
      results.push(...tableResults);
    }

    if (results.length === 0) {
      throw new Error("No data found");
    }

    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};
exports.allTblDataCreditorsTran = async (req) => {
  try {
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb, stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
      serverPort: req.user.serverPort,
    });
    let sqlQuery = `SELECT * FROM tbldatacreditor_tran`;
    const results = await historyDb.query(sqlQuery, {
      type: historyDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      throw new Error("No data found");
    }
    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};
exports.allTblCreditorsValue = async (req) => {
  try {
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb, stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
      serverPort: req.user.serverPort,
    });
    let sqlQuery = `SELECT * FROM tblcreditorsvalue`;
    const results = await stockmasterDb.query(sqlQuery, {
      type: stockmasterDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      throw new Error("No data found");
    }
    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};
exports.allTblDebtorsValue = async (req) => {
  try {
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb, stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
      serverPort: req.user.serverPort,
    });
    let sqlQuery = `SELECT * FROM tbldebtorsvalue`;
    const results = await stockmasterDb.query(sqlQuery, {
      type: stockmasterDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      throw new Error("No data found");
    }
    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};
exports.allTblStockValue = async (req) => {
  try {
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb, stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
      serverPort: req.user.serverPort,
    });
    let sqlQuery = `SELECT * FROM tblstockvalues`;
    const results = await stockmasterDb.query(sqlQuery, {
      type: stockmasterDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      throw new Error("No data found");
    }
    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.allTblDataDebtorsTran = async (req) => {
  try {
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb, stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
      serverPort: req.user.serverPort,
    });
    let sqlQuery = `SELECT * FROM tbldatadebtor_tran`;
    const results = await historyDb.query(sqlQuery, {
      type: historyDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      throw new Error("No data found");
    }
    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};
exports.allDepartmentsWithCategories = async (req) => {
  try {
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb, stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
      serverPort: req.user.serverPort,
    });

    // Query with LEFT JOIN to include 'MajorNo = 0' as a valid case
    let sqlQuery = `
      SELECT 
        COALESCE(c.MajorNo, 0) AS MajorNo, 
        c.MajorDescription,
        COALESCE(sub1.Sub1No, 0) AS Sub1No,
        COALESCE(sub1.Sub1Description, '') AS Sub1Description,
        COALESCE(sub2.Sub2No, 0) AS Sub2No,
        COALESCE(sub2.Sub2Description, '') AS Sub2Description
      FROM tblcategory AS c
      LEFT JOIN tblcategory_sub1 AS sub1 ON c.MajorNo = sub1.MajorNo
      LEFT JOIN tblcategory_sub2 AS sub2 ON c.MajorNo = sub2.MajorNo AND sub1.Sub1No = sub2.Sub1No
    `;

    const results = await stockmasterDb.query(sqlQuery, {
      type: stockmasterDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      throw new Error("No data found");
    }

    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};
exports.allTblDataProducts = async (
  majorNo,
  sub1No,
  sub2No,
  includeNegativeStockonHand = false,
  includeNegativeLastCostPrice = false,
  includeNegativeAvarageCostPrice = false,
  includeNegativeLaybyeStock = false,
  includeZeroStockonHand = false,
  includeZeroLastCostPrice = false,
  includeZeroAvarageCostPrice = false,
  includeZeroLaybyeStock = false,
  includeOnlyPositiveStock = false,
  pageSize = 6000,
  req
) => {
  try {
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
      serverPort: req.user.serverPort,
    });

    // Step 1: Build the count query with dynamic filters
    let countQuery = `SELECT COUNT(*) AS totalCount FROM tblproducts`;
    const whereConditions = [];
    const replacements = {};

    if (majorNo) {
      whereConditions.push(`tblproducts.MajorNo = :majorNo`);
      replacements.majorNo = majorNo;
    }
    if (sub1No) {
      whereConditions.push(`tblproducts.Sub1No = :sub1No`);
      replacements.sub1No = sub1No;
    }
    if (sub2No) {
      whereConditions.push(`tblproducts.Sub2No = :sub2No`);
      replacements.sub2No = sub2No;
    }

    // Step 2: If includeNegative is true, add condition for negative StockonHand or subcategories
    if (includeNegativeStockonHand) {
      whereConditions.push(`(tblproducts.StockonHand < 0)`);
    }
    if (includeNegativeLastCostPrice) {
      whereConditions.push(`(tblproducts.LastCostPrice < 0)`);
    }
    if (includeNegativeAvarageCostPrice) {
      whereConditions.push(`(tblproducts.AvarageCostPrice < 0)`);
    }
    if (includeNegativeLaybyeStock) {
      whereConditions.push(`(tblproducts.LaybyeStock < 0)`);
    }
    // Check for zero stock in addition to negative checks
    if (includeZeroStockonHand) {
      whereConditions.push(`(tblproducts.StockonHand = 0)`);
    }
    if (includeZeroLastCostPrice) {
      whereConditions.push(`(tblproducts.LastCostPrice = 0)`);
    }
    if (includeZeroAvarageCostPrice) {
      whereConditions.push(`(tblproducts.AvarageCostPrice = 0)`);
    }
    if (includeZeroLaybyeStock) {
      whereConditions.push(`(tblproducts.LaybyeStock = 0)`);
    }
    // New condition for only positive values
    if (includeOnlyPositiveStock) {
      whereConditions.push(`(tblproducts.StockonHand > 0)`);
      whereConditions.push(`(tblproducts.LastCostPrice > 0)`);
      whereConditions.push(`(tblproducts.AvarageCostPrice > 0)`);
    }

    if (whereConditions.length > 0) {
      countQuery += ` WHERE ` + whereConditions.join(" AND ");
    }
    const countResult = await stockmasterDb.query(countQuery, {
      replacements,
      type: stockmasterDb.QueryTypes.SELECT,
    });
    const totalCount = countResult[0]?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    // Step 3: Fetch products with dynamic filtering and pagination
    const productPromises = Array.from({ length: totalPages }, (_, page) => {
      const offset = page * pageSize;
      let productsQuery = `
        SELECT 
          tblproducts.StockCode,
          tblproducts.StockBarCode,
          tblproducts.Description1,
          tblproducts.MajorNo,
          tblproducts.Sub1No,
          tblproducts.Sub2No,
          tblproducts.StockonHand,
          tblproducts.AvarageCostPrice,
          tblproducts.LastCostPrice,
          tblproducts.VatPercentage,
          tblproducts.DefaultSellingPrice,
          tblproducts.LaybyeStock,
          tblcategory.MajorNo AS CategoryMajorNo,
          tblcategory.MajorDescription,
          tblcategory_sub1.Sub1No AS CategorySub1No,
          tblcategory_sub1.Sub1Description,
          tblcategory_sub2.Sub2No AS CategorySub2No,
          tblcategory_sub2.Sub2Description AS CategorySub2Description
        FROM tblproducts
        LEFT JOIN tblcategory ON tblproducts.MajorNo = tblcategory.MajorNo
        LEFT JOIN tblcategory_sub1 ON tblproducts.Sub1No = tblcategory_sub1.Sub1No
        LEFT JOIN tblcategory_sub2 ON tblproducts.Sub2No = tblcategory_sub2.Sub2No
      `;

      if (whereConditions.length > 0) {
        productsQuery += ` WHERE ` + whereConditions.join(" AND ");
      }

      productsQuery += ` LIMIT :pageSize OFFSET :offset`;

      return stockmasterDb.query(productsQuery, {
        replacements: { ...replacements, pageSize, offset },
        type: stockmasterDb.QueryTypes.SELECT,
      });
    });

    const pagesResults = await Promise.all(productPromises);
    const allProducts = pagesResults.flat();

    // Process all products
    const processedProducts = allProducts.map((product) => ({
      ...product,
      TotalAvarageCostPrice:
        Number(product.AvarageCostPrice) * Number(product.StockonHand || 0),
      TotalLastCostPrice:
        Number(product.LastCostPrice) * Number(product.StockonHand || 0),
      TotalSelling:
        Number(product.DefaultSellingPrice) * Number(product.StockonHand || 0),
    }));

    // Group products by MajorNo
    const groupedProducts = processedProducts.reduce((acc, product) => {
      const majorKey = product.CategoryMajorNo;
      if (!acc[majorKey]) {
        acc[majorKey] = {
          MajorNo: majorKey,
          MajorDescription: product.MajorDescription,
          Sub1Description: product.Sub1Description,
          CategorySub2Description: product.CategorySub2Description,
          products: [],
          totalStockOnHand: 0,
          totalLaybyeStock: 0,
          totalAvarageCostPrice: 0,
          totalLastCostPrice: 0,
          totalSelling: 0,
        };
      }

      acc[majorKey].products.push(product);
      acc[majorKey].totalStockOnHand += Number(product.StockonHand || 0);
      acc[majorKey].totalLaybyeStock += Number(product.LaybyeStock || 0);
      acc[majorKey].totalAvarageCostPrice += Number(
        product.TotalAvarageCostPrice || 0
      );
      acc[majorKey].totalLastCostPrice += Number(
        product.TotalLastCostPrice || 0
      );
      acc[majorKey].totalSelling += Number(product.TotalSelling || 0);

      return acc;
    }, {});

    const groupedArray = Object.values(groupedProducts);

    return {
      data: groupedArray,
      totalCount,
      pageSize,
    };
  } catch (error) {
    console.error(`Error fetching products data: ${error.message}`);
    console.error(`Stack Trace: ${error.stack}`); // More detailed error info
    throw new Error(`Error fetching products data: ${error.message}`);
  }
};
exports.tblDataCreditorsTranSearchTables = async (tableNames, req) => {
  try {
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
      serverPort: req.user.serverPort,
    });

    // Split the table names by comma and validate each one
    const tables = tableNames.split(",").map((name) => name.trim());

    // Validate each table name to avoid SQL injection
    tables.forEach((tableName) => {
      if (!/^\d{6}tbldata_creditors_tran$/.test(tableName)) {
        throw new Error(`Invalid table name: ${tableName}`);
      }
    });

    // Initialize an array to hold the results
    const results = [];

    // Query each table and concatenate the results
    for (const tableName of tables) {
      let sqlQuery = `SELECT * FROM ${tableName}`;
      const tableResults = await historyDb.query(sqlQuery, {
        type: historyDb.QueryTypes.SELECT,
      });
      results.push(...tableResults);
    }

    if (results.length === 0) {
      throw new Error("No data found");
    }

    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.tblDataDebtorsTranSearchTables = async (tableNames, req) => {
  try {
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
      serverPort: req.user.serverPort,
    });

    // Split the table names by comma and validate each one
    const tables = tableNames.split(",").map((name) => name.trim());

    // Validate each table name to avoid SQL injection
    tables.forEach((tableName) => {
      if (!/^\d{6}tbldebtor_tran$/.test(tableName)) {
        throw new Error(`Invalid table name: ${tableName}`);
      }
    });

    // Initialize an array to hold the results
    const results = [];

    // Query each table and concatenate the results
    for (const tableName of tables) {
      let sqlQuery = `SELECT * FROM ${tableName}`;
      const tableResults = await historyDb.query(sqlQuery, {
        type: historyDb.QueryTypes.SELECT,
      });
      results.push(...tableResults);
    }

    if (results.length === 0) {
      throw new Error("No data found");
    }

    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.DebtorsCreditNotesReportSearchTables = (tableNames, req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const activeDatabases = await databaseController.getActiveDatabases(
        req.user,
        req.query.shopKey
      );

      // Get the history and stockmaster databases using the utility
      const { historyDb } = getDatabasesCustom({
        activeDatabases,
        serverHost: req.user.serverHost,
        serverUser: req.user.serverUser,
        serverPassword: req.user.serverPassword,
        serverPort: req.user.serverPort,
      });

      // Split the table names by comma and validate each one
      const tables = tableNames.split(",").map((name) => name.trim());

      // Validate each table name to avoid SQL injection
      tables.forEach((tableName) => {
        if (!/^\d{6}tbldebtor_tran$/.test(tableName)) {
          return reject(new Error(`Invalid table name: ${tableName}`));
        }
      });

      // Initialize an array to hold the promises for querying each table
      const queryPromises = tables.map((tableName) => {
        let sqlQuery = `SELECT * FROM ${tableName}`;
        return historyDb.query(sqlQuery, { type: historyDb.QueryTypes.SELECT });
      });

      // Resolve all the query promises
      Promise.all(queryPromises)
        .then((queryResults) => {
          // Flatten the array of results
          const results = [].concat(...queryResults);

          if (results.length === 0) {
            return reject(new Error("No data found"));
          }

          // Filter results where Description starts with "Credit"
          const filteredResults = results.filter((result) =>
            result.Description.startsWith("Credit")
          );

          if (filteredResults.length === 0) {
            return resolve({
              message: "No Credit transactions found",
              data: [],
            });
          }

          // Map to limit fields in the response
          const limitedFieldResults = filteredResults.map((item) => ({
            DateTime: item.DateTime,
            DebtorCode: item.Debtorcode,
            Reference: item.Reference,
            Description: item.Description,
            Amount: item.Amount,
            UserName: item.UserName,
            DebtorName: item.DebtorName,
          }));

          // Group by Creditorcode and CreditorName and calculate the total Amount for each group
          const groupedResults = limitedFieldResults.reduce((acc, item) => {
            const { DebtorCode, DebtorName, Amount } = item;
            const key = `${DebtorCode}-${DebtorName}`; // Create a unique key using Creditorcode and CreditorName
            if (!acc[key]) {
              acc[key] = {
                DebtorCode,
                DebtorName,
                totalAmount: 0,
                transactions: [],
              };
            }
            acc[key].totalAmount += Amount;
            acc[key].transactions.push(item);
            return acc;
          }, {});
          // Calculate the overall total amount
          const overallTotalAmount = limitedFieldResults.reduce(
            (sum, item) => sum + item.Amount,
            0
          );
          // Convert the groupedResults object into an array
          const groupedArray = Object.values(groupedResults);
          // Resolve the result with both the grouped totals and the overall total
          resolve({ groupedArray, overallTotalAmount });
        })
        .catch((error) => reject(error));
    } catch (error) {
      reject(new Error(error.message));
    }
  });
};
exports.DebtorsDebitNotesSearchTables = (tableNames, req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const activeDatabases = await databaseController.getActiveDatabases(
        req.user,
        req.query.shopKey
      );

      // Get the history and stockmaster databases using the utility
      const { historyDb } = getDatabasesCustom({
        activeDatabases,
        serverHost: req.user.serverHost,
        serverUser: req.user.serverUser,
        serverPassword: req.user.serverPassword,
        serverPort: req.user.serverPort,
      });

      // Split the table names by comma and validate each one
      const tables = tableNames.split(",").map((name) => name.trim());

      // Validate each table name to avoid SQL injection
      tables.forEach((tableName) => {
        if (!/^\d{6}tbldebtor_tran$/.test(tableName)) {
          return reject(new Error(`Invalid table name: ${tableName}`));
        }
      });

      // Initialize an array to hold the promises for querying each table
      const queryPromises = tables.map((tableName) => {
        let sqlQuery = `SELECT * FROM ${tableName}`;
        return historyDb.query(sqlQuery, { type: historyDb.QueryTypes.SELECT });
      });

      // Resolve all the query promises
      Promise.all(queryPromises)
        .then((queryResults) => {
          // Flatten the array of results
          const results = [].concat(...queryResults);

          if (results.length === 0) {
            return reject(new Error("No data found"));
          }

          // Filter results where TransType is "Debit"
          const filteredResults = results.filter((result) =>
            result.Description.startsWith("Debit")
          );

          if (filteredResults.length === 0) {
            return resolve({
              message: "No Debit transactions found",
              data: [],
            });
          }

          // Map to limit fields in the response
          const limitedFieldResults = filteredResults.map((item) => ({
            DateTime: item.DateTime,
            DebtorCode: item.Debtorcode,
            Reference: item.Reference,
            Description: item.Description,
            Amount: item.Amount,
            UserName: item.UserName,
            DebtorName: item.DebtorName,
          }));

          // Group by Creditorcode and CreditorName and calculate the total Amount for each group
          const groupedResults = limitedFieldResults.reduce((acc, item) => {
            const { DebtorCode, DebtorName, Amount } = item;
            const key = `${DebtorCode}-${DebtorName}`; // Create a unique key using Creditorcode and CreditorName
            if (!acc[key]) {
              acc[key] = {
                DebtorCode,
                DebtorName,
                totalAmount: 0,
                transactions: [],
              };
            }
            acc[key].totalAmount += Amount;
            acc[key].transactions.push(item);
            return acc;
          }, {});

          // Calculate the overall total amount
          const overallTotalAmount = limitedFieldResults.reduce(
            (sum, item) => sum + item.Amount,
            0
          );

          // Convert the groupedResults object into an array
          const groupedArray = Object.values(groupedResults);

          // Resolve the result with both the grouped totals and the overall total
          resolve({ groupedArray, overallTotalAmount });
        })
        .catch((error) => reject(error));
    } catch (error) {
      reject(new Error(error.message));
    }
  });
};
exports.DebtorsAccountNotesSearchTables = (tableNames, req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const activeDatabases = await databaseController.getActiveDatabases(
        req.user,
        req.query.shopKey
      );

      // Get the history and stockmaster databases using the utility
      const { historyDb } = getDatabasesCustom({
        activeDatabases,
        serverHost: req.user.serverHost,
        serverUser: req.user.serverUser,
        serverPassword: req.user.serverPassword,
        serverPort: req.user.serverPort,
      });

      // Split the table names by comma and validate each one
      const tables = tableNames.split(",").map((name) => name.trim());

      // Validate each table name to avoid SQL injection
      tables.forEach((tableName) => {
        if (!/^\d{6}tbldebtor_tran$/.test(tableName)) {
          return reject(new Error(`Invalid table name: ${tableName}`));
        }
      });

      // Initialize an array to hold the promises for querying each table
      const queryPromises = tables.map((tableName) => {
        let sqlQuery = `SELECT * FROM ${tableName}`;
        return historyDb.query(sqlQuery, { type: historyDb.QueryTypes.SELECT });
      });

      // Resolve all the query promises
      Promise.all(queryPromises)
        .then((queryResults) => {
          // Flatten the array of results
          const results = [].concat(...queryResults);

          if (results.length === 0) {
            return reject(new Error("No data found"));
          }

          // Filter results where Description starts with "Account"
          const filteredResults = results.filter((result) =>
            result.Description.startsWith("Account")
          );

          if (filteredResults.length === 0) {
            return resolve({
              message: "No Account transactions found",
              data: [],
            });
          }

          // Map to limit fields in the response
          const limitedFieldResults = filteredResults.map((item) => ({
            DateTime: item.DateTime,
            DebtorCode: item.Debtorcode,
            Reference: item.Reference,
            Description: item.Description,
            Amount: item.Amount,
            UserName: item.UserName,
            DebtorName: item.DebtorName,
          }));

          // Group by Creditorcode and CreditorName and calculate the total Amount for each group
          const groupedResults = limitedFieldResults.reduce((acc, item) => {
            const { DebtorCode, DebtorName, Amount } = item;
            const key = `${DebtorCode}-${DebtorName}`; // Create a unique key using Creditorcode and CreditorName
            if (!acc[key]) {
              acc[key] = {
                DebtorCode,
                DebtorName,
                totalAmount: 0,
                transactions: [],
              };
            }
            acc[key].totalAmount += Amount;
            acc[key].transactions.push(item);
            return acc;
          }, {});

          // Calculate the overall total amount
          const overallTotalAmount = limitedFieldResults.reduce(
            (sum, item) => sum + item.Amount,
            0
          );

          // Convert the groupedResults object into an array
          const groupedArray = Object.values(groupedResults);

          // Resolve the result with both the grouped totals and the overall total
          resolve({ groupedArray, overallTotalAmount });
        })
        .catch((error) => reject(error));
    } catch (error) {
      reject(new Error(error.message));
    }
  });
};

exports.DebtorsPaymentNotesSearchTables = (tableNames, req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const activeDatabases = await databaseController.getActiveDatabases(
        req.user,
        req.query.shopKey
      );

      // Get the history and stockmaster databases using the utility
      const { historyDb } = getDatabasesCustom({
        activeDatabases,
        serverHost: req.user.serverHost,
        serverUser: req.user.serverUser,
        serverPassword: req.user.serverPassword,
        serverPort: req.user.serverPort,
      });

      // Split the table names by comma and validate each one
      const tables = tableNames.split(",").map((name) => name.trim());

      // Validate each table name to avoid SQL injection
      tables.forEach((tableName) => {
        if (!/^\d{6}tbldebtor_tran$/.test(tableName)) {
          return reject(new Error(`Invalid table name: ${tableName}`));
        }
      });

      // Initialize an array to hold the promises for querying each table
      const queryPromises = tables.map((tableName) => {
        let sqlQuery = `SELECT * FROM ${tableName}`;
        return historyDb.query(sqlQuery, { type: historyDb.QueryTypes.SELECT });
      });

      // Resolve all the query promises
      Promise.all(queryPromises)
        .then((queryResults) => {
          // Flatten the array of results
          const results = [].concat(...queryResults);

          if (results.length === 0) {
            return reject(new Error("No data found"));
          }

          // Filter results where TransType is "Payment - Cash"
          const filteredResults = results.filter((result) =>
            result.Description.startsWith("Payment - Cash")
          );

          if (filteredResults.length === 0) {
            return resolve({
              message: "No Account transactions found",
              data: [],
            });
          }

          // Map to limit fields in the response
          const limitedFieldResults = filteredResults.map((item) => ({
            DateTime: item.DateTime,
            DebtorCode: item.Debtorcode,
            Reference: item.Reference,
            Description: item.Description,
            Amount: item.Amount,
            UserName: item.UserName,
            DebtorName: item.DebtorName,
          }));

          // Group by Creditorcode and CreditorName and calculate the total Amount for each group
          const groupedResults = limitedFieldResults.reduce((acc, item) => {
            const { DebtorCode, DebtorName, Amount } = item;
            const key = `${DebtorCode}-${DebtorName}`; // Create a unique key using Creditorcode and CreditorName
            if (!acc[key]) {
              acc[key] = {
                DebtorCode,
                DebtorName,
                totalAmount: 0,
                transactions: [],
              };
            }
            acc[key].totalAmount += Amount;
            acc[key].transactions.push(item);
            return acc;
          }, {});

          // Calculate the overall total amount
          const overallTotalAmount = limitedFieldResults.reduce(
            (sum, item) => sum + item.Amount,
            0
          );

          // Convert the groupedResults object into an array
          const groupedArray = Object.values(groupedResults);

          // Resolve the result with both the grouped totals and the overall total
          resolve({ groupedArray, overallTotalAmount });
        })
        .catch((error) => reject(error));
    } catch (error) {
      reject(new Error(error.message));
    }
  });
};

exports.CreditorsCreditNotesReportSearchTables = (tableNames, req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const activeDatabases = await databaseController.getActiveDatabases(
        req.user,
        req.query.shopKey
      );

      // Get the history and stockmaster databases using the utility
      const { historyDb } = getDatabasesCustom({
        activeDatabases,
        serverHost: req.user.serverHost,
        serverUser: req.user.serverUser,
        serverPassword: req.user.serverPassword,
        serverPort: req.user.serverPort,
      });

      // Split the table names by comma and validate each one
      const tables = tableNames.split(",").map((name) => name.trim());

      // Validate each table name to avoid SQL injection
      tables.forEach((tableName) => {
        if (!/^\d{6}tbldata_creditors_tran$/.test(tableName)) {
          return reject(new Error(`Invalid table name: ${tableName}`));
        }
      });

      // Initialize an array to hold the promises for querying each table
      const queryPromises = tables.map((tableName) => {
        let sqlQuery = `SELECT * FROM ${tableName}`;
        return historyDb.query(sqlQuery, { type: historyDb.QueryTypes.SELECT });
      });

      // Resolve all the query promises
      Promise.all(queryPromises)
        .then((queryResults) => {
          // Flatten the array of results
          const results = [].concat(...queryResults);

          if (results.length === 0) {
            return reject(new Error("No data found"));
          }

          // Filter results where Description starts with "Credit"
          const filteredResults = results.filter((result) =>
            result.Description.startsWith("Credit")
          );

          if (filteredResults.length === 0) {
            return resolve({
              message: "No Credit transactions found",
              data: [],
            });
          }
          // Map to limit fields in the response
          const limitedFieldResults = filteredResults.map((item) => ({
            DateTime: item.DateTime,
            Creditorcode: item.Creditorcode,
            Reference: item.Reference,
            Description: item.Description,
            Amount: item.Amount,
            UserName: item.UserName,
            CreditorName: item.CreditorName,
          }));

          // Group by Creditorcode and CreditorName and calculate the total Amount for each group
          const groupedResults = limitedFieldResults.reduce((acc, item) => {
            const { Creditorcode, CreditorName, Amount } = item;
            const key = `${Creditorcode}-${CreditorName}`; // Create a unique key using Creditorcode and CreditorName
            if (!acc[key]) {
              acc[key] = {
                Creditorcode,
                CreditorName,
                totalAmount: 0,
                transactions: [],
              };
            }
            acc[key].totalAmount += Amount;
            acc[key].transactions.push(item);
            return acc;
          }, {});
          // Calculate the overall total amount
          const overallTotalAmount = limitedFieldResults.reduce(
            (sum, item) => sum + item.Amount,
            0
          );
          // Convert the groupedResults object into an array
          const groupedArray = Object.values(groupedResults);
          // Resolve the result with both the grouped totals and the overall total
          resolve({ groupedArray, overallTotalAmount });
        })
        .catch((error) => reject(error));
    } catch (error) {
      reject(new Error(error.message));
    }
  });
};
exports.CreditorsDebitNotesSearchTables = (tableNames, req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const activeDatabases = await databaseController.getActiveDatabases(
        req.user,
        req.query.shopKey
      );

      // Get the history and stockmaster databases using the utility
      const { historyDb } = getDatabasesCustom({
        activeDatabases,
        serverHost: req.user.serverHost,
        serverUser: req.user.serverUser,
        serverPassword: req.user.serverPassword,
        serverPort: req.user.serverPort,
      });

      // Split the table names by comma and validate each one
      const tables = tableNames.split(",").map((name) => name.trim());

      // Validate each table name to avoid SQL injection
      tables.forEach((tableName) => {
        if (!/^\d{6}tbldata_creditors_tran$/.test(tableName)) {
          return reject(new Error(`Invalid table name: ${tableName}`));
        }
      });

      // Initialize an array to hold the promises for querying each table
      const queryPromises = tables.map((tableName) => {
        let sqlQuery = `SELECT * FROM ${tableName}`;
        return historyDb.query(sqlQuery, { type: historyDb.QueryTypes.SELECT });
      });

      // Resolve all the query promises
      Promise.all(queryPromises)
        .then((queryResults) => {
          // Flatten the array of results
          const results = [].concat(...queryResults);

          if (results.length === 0) {
            return reject(new Error("No data found"));
          }

          // Filter results where TransType is "Debit"
          const filteredResults = results.filter((result) =>
            result.Description.startsWith("Debit")
          );

          if (filteredResults.length === 0) {
            return resolve({
              message: "No Debit transactions found",
              data: [],
            });
          }
          // Map to limit fields in the response
          const limitedFieldResults = filteredResults.map((item) => ({
            DateTime: item.DateTime,
            Creditorcode: item.Creditorcode,
            Reference: item.Reference,
            Description: item.Description,
            Amount: item.Amount,
            UserName: item.UserName,
            CreditorName: item.CreditorName,
          }));

          // Group by Creditorcode and CreditorName and calculate the total Amount for each group
          const groupedResults = limitedFieldResults.reduce((acc, item) => {
            const { Creditorcode, CreditorName, Amount } = item;
            const key = `${Creditorcode}-${CreditorName}`; // Create a unique key using Creditorcode and CreditorName
            if (!acc[key]) {
              acc[key] = {
                Creditorcode,
                CreditorName,
                totalAmount: 0,
                transactions: [],
              };
            }
            acc[key].totalAmount += Amount;
            acc[key].transactions.push(item);
            return acc;
          }, {});

          // Calculate the overall total amount
          const overallTotalAmount = limitedFieldResults.reduce(
            (sum, item) => sum + item.Amount,
            0
          );

          // Convert the groupedResults object into an array
          const groupedArray = Object.values(groupedResults);

          // Resolve the result with both the grouped totals and the overall total
          resolve({ groupedArray, overallTotalAmount });
        })
        .catch((error) => reject(error));
    } catch (error) {
      reject(new Error(error.message));
    }
  });
};
exports.CreditorsInvoicesNotesSearchTables = (tableNames, req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const activeDatabases = await databaseController.getActiveDatabases(
        req.user,
        req.query.shopKey
      );

      // Get the history and stockmaster databases using the utility
      const { historyDb } = getDatabasesCustom({
        activeDatabases,
        serverHost: req.user.serverHost,
        serverUser: req.user.serverUser,
        serverPassword: req.user.serverPassword,
        serverPort: req.user.serverPort,
      });

      // Split the table names by comma and validate each one
      const tables = tableNames.split(",").map((name) => name.trim());

      // Validate each table name to avoid SQL injection
      tables.forEach((tableName) => {
        if (!/^\d{6}tbldata_creditors_tran$/.test(tableName)) {
          return reject(new Error(`Invalid table name: ${tableName}`));
        }
      });

      // Initialize an array to hold the promises for querying each table
      const queryPromises = tables.map((tableName) => {
        let sqlQuery = `SELECT * FROM ${tableName}`;
        return historyDb.query(sqlQuery, { type: historyDb.QueryTypes.SELECT });
      });

      // Resolve all the query promises
      Promise.all(queryPromises)
        .then((queryResults) => {
          // Flatten the array of results
          const results = [].concat(...queryResults);

          if (results.length === 0) {
            return reject(new Error("No data found"));
          }

          // Filter results where Description starts with "Account"
          const filteredResults = results.filter((result) =>
            result.Description.startsWith("Account")
          );

          if (filteredResults.length === 0) {
            return resolve({
              message: "No Account transactions found",
              data: [],
            });
          }
          // Map to limit fields in the response
          const limitedFieldResults = filteredResults.map((item) => ({
            DateTime: item.DateTime,
            Creditorcode: item.Creditorcode,
            Reference: item.Reference,
            Description: item.Description,
            Amount: item.Amount,
            UserName: item.UserName,
            CreditorName: item.CreditorName,
          }));

          // Group by Creditorcode and CreditorName and calculate the total Amount for each group
          const groupedResults = limitedFieldResults.reduce((acc, item) => {
            const { Creditorcode, CreditorName, Amount } = item;
            const key = `${Creditorcode}-${CreditorName}`; // Create a unique key using Creditorcode and CreditorName
            if (!acc[key]) {
              acc[key] = {
                Creditorcode,
                CreditorName,
                totalAmount: 0,
                transactions: [],
              };
            }
            acc[key].totalAmount += Amount;
            acc[key].transactions.push(item);
            return acc;
          }, {});

          // Calculate the overall total amount
          const overallTotalAmount = limitedFieldResults.reduce(
            (sum, item) => sum + item.Amount,
            0
          );

          // Convert the groupedResults object into an array
          const groupedArray = Object.values(groupedResults);

          // Resolve the result with both the grouped totals and the overall total
          resolve({ groupedArray, overallTotalAmount });
        })
        .catch((error) => reject(error));
    } catch (error) {
      reject(new Error(error.message));
    }
  });
};
exports.CreditorsPaymentNotesSearchTables = (tableNames, req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const activeDatabases = await databaseController.getActiveDatabases(
        req.user,
        req.query.shopKey
      );

      // Get the history and stockmaster databases using the utility
      const { historyDb } = getDatabasesCustom({
        activeDatabases,
        serverHost: req.user.serverHost,
        serverUser: req.user.serverUser,
        serverPassword: req.user.serverPassword,
        serverPort: req.user.serverPort,
      });

      // Split the table names by comma and validate each one
      const tables = tableNames.split(",").map((name) => name.trim());

      // Validate each table name to avoid SQL injection
      tables.forEach((tableName) => {
        if (!/^\d{6}tbldata_creditors_tran$/.test(tableName)) {
          return reject(new Error(`Invalid table name: ${tableName}`));
        }
      });

      // Initialize an array to hold the promises for querying each table
      const queryPromises = tables.map((tableName) => {
        let sqlQuery = `SELECT * FROM ${tableName}`;
        return historyDb.query(sqlQuery, { type: historyDb.QueryTypes.SELECT });
      });

      // Resolve all the query promises
      Promise.all(queryPromises)
        .then((queryResults) => {
          // Flatten the array of results
          const results = [].concat(...queryResults);

          if (results.length === 0) {
            return reject(new Error("No data found"));
          }

          // Filter results where TransType is "Payment - Cash"
          const filteredResults = results.filter((result) =>
            result.Description.startsWith("Payment - Cash")
          );

          if (filteredResults.length === 0) {
            return resolve({
              message: "No Payment transactions found",
              data: [],
            });
          }

          // Map to limit fields in the response
          const limitedFieldResults = filteredResults.map((item) => ({
            DateTime: item.DateTime,
            Creditorcode: item.Creditorcode,
            Reference: item.Reference,
            Description: item.Description,
            Amount: item.Amount,
            UserName: item.UserName,
            CreditorName: item.CreditorName,
          }));

          // Group by Creditorcode and CreditorName and calculate the total Amount for each group
          const groupedResults = limitedFieldResults.reduce((acc, item) => {
            const { Creditorcode, CreditorName, Amount } = item;
            const key = `${Creditorcode}-${CreditorName}`; // Create a unique key using Creditorcode and CreditorName
            if (!acc[key]) {
              acc[key] = {
                Creditorcode,
                CreditorName,
                totalAmount: 0,
                transactions: [],
              };
            }
            acc[key].totalAmount += Amount;
            acc[key].transactions.push(item);
            return acc;
          }, {});

          // Calculate the overall total amount
          const overallTotalAmount = limitedFieldResults.reduce(
            (sum, item) => sum + item.Amount,
            0
          );

          // Convert the groupedResults object into an array
          const groupedArray = Object.values(groupedResults);

          // Resolve the result with both the grouped totals and the overall total
          resolve({ groupedArray, overallTotalAmount });
        })
        .catch((error) => reject(error));
    } catch (error) {
      reject(new Error(error.message));
    }
  });
};

exports.HistoryProductSaleByInvoiceSearchTables = (tableNames, req) => {
  return new Promise(async (resolve, reject) => {
    try {
      const activeDatabases = await databaseController.getActiveDatabases(
        req.user,
        req.query.shopKey
      );
      const { historyDb } = getDatabasesCustom({
        activeDatabases,
        serverHost: req.user.serverHost,
        serverUser: req.user.serverUser,
        serverPassword: req.user.serverPassword,
        serverPort: req.user.serverPort,
      });

      const tables = tableNames.split(",").map((name) => name.trim());

      // Validate each table name
      tables.forEach((tableName) => {
        if (!/^\d{6}tbldata_current_tran$/.test(tableName)) {
          return reject(new Error(`Invalid table name: ${tableName}`));
        }
      });

      const queryPromises = tables.map((tableName) => {
        let sqlQuery = `
        SELECT 
          datetime, 
          salenum, 
          stockcode, 
          stockdescription, 
          qty, 
          stockunitprice, 
          paymenttype, 
          averagecostprice, 
          lastcostprice, 
          linetotal, 
          cashupnum 
        FROM ${tableName}`;
        return historyDb.query(sqlQuery, { type: historyDb.QueryTypes.SELECT });
      });

      Promise.all(queryPromises)
        .then((queryResults) => {
          const results = [].concat(...queryResults);

          if (results.length === 0) {
            return reject(new Error("No data found"));
          }

          // Group results by salenum and calculate totals
          const groupedResults = results.reduce((acc, current) => {
            const { salenum, linetotal } = current; // assuming linetotal is the field to sum

            if (!acc[salenum]) {
              acc[salenum] = {
                salenum,
                transactions: [],
                total: 0, // Initialize total
              };
            }

            acc[salenum].transactions.push(current);
            acc[salenum].total += linetotal; // Accumulate total

            return acc;
          }, {});

          // Convert to an array
          const finalResults = Object.values(groupedResults);

          // Calculate overall total
          const overallTotal = finalResults.reduce(
            (sum, group) => sum + group.total,
            0
          );

          // Resolve with final results and overall total
          resolve({ finalResults, overallTotal });
        })
        .catch((error) => reject(error));
    } catch (error) {
      reject(new Error(error.message));
    }
  });
};

// CurrentDebtorsAnalysisReport
exports.CurrentDebtorsAnalysis = async (req) => {
  try {
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );

    // Get the history and stockmaster databases using the utility
    const { historyDb, stockmasterDb, debtorsDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: serverHost,
      serverUser: serverUser,
      serverPassword: serverPassword,
      serverPort: serverPort,
    });
    let sqlQuery = `
      SELECT 
        debtorcode, 
        debtorname, 
        debtorcell, 
        debtorphone, 
        AccountSystem, 
        currentbalance + 30days + 60days + 90days + 120days + 150days + 180days AS totalBalance, 
        balanceforward, 
        currentbalance, 
        30days, 
        60days, 
        90days, 
        120days, 
        150days, 
        180days 
      FROM 
        tbldebtor 
      WHERE 
        accountsystem = 'Normal'
    `;
    const results = await debtorsDb.query(sqlQuery, {
      type: debtorsDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      throw new Error("No data found");
    }
    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.PERVIOUSDebtorsAgeAnalysis = async (
  debtorGroup,
  previousAging,
  checkBalanceGreaterthanZero,
  req
) => {
  try {
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { historyDb, stockmasterDb, debtorsDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: serverHost,
      serverUser: serverUser,
      serverPassword: serverPassword,
      serverPort: serverPort,
    });

    // Convert previousAging to a Date object
    const previousAgingDate = new Date(previousAging);
    if (isNaN(previousAgingDate)) {
      throw new Error("Invalid date provided for previousAging");
    }

    // Define the SQL query
    let sqlQuery = `
      SELECT 
        tblageinfo.debtorcode, 
        tbldebtor.debtorname, 
        tbldebtor.debtorcell, 
        tbldebtor.debtorphone, 
        tbldebtor.AccountSystem, 
        tblageinfo.currentbalance + 
        tblageinfo.30days + 
        tblageinfo.60days + 
        tblageinfo.90days + 
        tblageinfo.120days + 
        tblageinfo.150days + 
        tblageinfo.180days AS totalBalance, 
        tblageinfo.balanceforward, 
        tblageinfo.currentbalance, 
        tblageinfo.30days, 
        tblageinfo.60days, 
        tblageinfo.90days, 
        tblageinfo.120days, 
        tblageinfo.150days, 
        tblageinfo.180days 
      FROM 
        tblageinfo 
      INNER JOIN 
        tbldebtor ON tblageinfo.debtorcode = tbldebtor.debtorcode 
      WHERE 
        tbldebtor.accountsystem = 'Normal' 
        AND tbldebtor.ACCTERMS = :debtorGroup 
        AND tblageinfo.currentagedate = :previousAging 
    `;

    // Add the balance check if checkBalanceGreaterthanZero is true
    if (checkBalanceGreaterthanZero) {
      sqlQuery += `
     AND (tblageinfo.currentbalance + 
             tblageinfo.30days + 
             tblageinfo.60days + 
             tblageinfo.90days + 
             tblageinfo.120days + 
             tblageinfo.150days + 
             tblageinfo.180days) <> 0
  `;
    }
    const results = await debtorsDb.query(sqlQuery, {
      type: debtorsDb.QueryTypes.SELECT,
      replacements: {
        debtorGroup,
        previousAging: dateFns.format(previousAgingDate, "yyyy-MM-dd HH:mm:ss"), // Format the date
      },
    });

    if (results.length === 0) {
      throw new Error("No data found");
    }

    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.PERVIOUSDebtorsAgeAnalysisGroupsAndPreviousAging = async (req) => {
  try {
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { debtorsDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: serverHost,
      serverUser: serverUser,
      serverPassword: serverPassword,
      serverPort: serverPort,
    });

    // Define the SQL query to get the required fields
    const sqlQuery = `
      SELECT 
        tblageinfo.currentagedate, 
        tbldebtor.ACCTERMS 
      FROM 
        tblageinfo 
      INNER JOIN 
        tbldebtor ON tblageinfo.debtorcode = tbldebtor.debtorcode
    `;

    const results = await debtorsDb.query(sqlQuery, {
      type: debtorsDb.QueryTypes.SELECT,
    });

    if (results.length === 0) {
      throw new Error("No data found");
    }

    // Grouping the results by ACCTERMS
    const groupedData = results.reduce((acc, item) => {
      const terms = item.ACCTERMS;

      // Skip empty terms
      if (terms) {
        if (!acc[terms]) {
          acc[terms] = {
            ACCTERMS: terms,
            currentagedates: [],
          };
        }
        acc[terms].currentagedates.push(item.currentagedate);
      }

      return acc;
    }, {});

    // Convert the grouped object to an array
    const resultArray = Object.values(groupedData);

    return resultArray; // Return the grouped results
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.CURRENTDebtorsAgeAnalysis = async (
  debtorGroup = null,
  previousAging = null,
  checkBalanceGreaterthanZero = true,
  req
) => {
  try {
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { debtorsDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: serverHost,
      serverUser: serverUser,
      serverPassword: serverPassword,
      serverPort: serverPort,
    });
    // Start the base SQL query
    let sqlQuery = `
      SELECT 
          debtorcode, 
          debtorname, 
          debtorcell, 
          debtorphone, 
          AccountSystem, 
          currentbalance + 30days + 60days + 90days + 120days + 150days + 180days AS totalBalance,
          balanceforward, 
          currentbalance, 
          30days, 
          60days, 
          90days, 
          120days, 
          150days, 
          180days 
      FROM 
          tbldebtor
    `;

    const conditions = [];

    // Add conditions based on the presence of parameters
    if (debtorGroup) {
      conditions.push(`AccountSystem = :debtorGroup`);
    }
    if (previousAging) {
      conditions.push(`ACCTERMS = :previousAging`);
    }
    if (checkBalanceGreaterthanZero) {
      conditions.push(
        `(currentbalance + 30days + 60days + 90days + 120days + 150days + 180days) <> 0`
      );
    }

    // Append conditions to the SQL query if any exist
    if (conditions.length > 0) {
      sqlQuery += " WHERE " + conditions.join(" AND ");
    }

    // Execute the query
    const results = await debtorsDb.query(sqlQuery, {
      type: debtorsDb.QueryTypes.SELECT,
      replacements: {
        debtorGroup,
        previousAging,
      },
    });

    // Check if any results were returned
    if (results.length === 0) {
      throw new Error("No data found");
    }

    return results;
  } catch (error) {
    // Catch and rethrow the error with a meaningful message
    throw new Error(error.message);
  }
};
exports.CURRENTDebtorsAgeAnalysisACCTERMSAndAccountSystem = async (req) => {
  try {
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { debtorsDb } = getDatabasesCustom({
      activeDatabases,
      serverHost,
      serverUser,
      serverPassword,
      serverPort,
    });

    // Define the SQL query to get only distinct required fields
    const sqlQuery = `
      SELECT DISTINCT 
          AccountSystem, 
          ACCTERMS
      FROM 
          tbldebtor
    `;

    // Execute the query
    const results = await debtorsDb.query(sqlQuery, {
      type: debtorsDb.QueryTypes.SELECT,
    });

    // Check if any results were returned
    if (results.length === 0) {
      throw new Error("No data found");
    }

    // Filter out entries with empty ACCTERMS and get unique results
    const uniqueResults = Array.from(
      new Set(
        results.filter((item) => item.ACCTERMS !== "").map(JSON.stringify)
      )
    ).map(JSON.parse);

    return uniqueResults;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.CreditorAnalysis = async (
  CmbPreviousAging,
  checkBalanceGreaterThanZero,
  req
) => {
  try {
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { debtorsDb, stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost,
      serverUser,
      serverPassword,
      serverPort,
    }); // Ensure correct reference
    const stockmasterDbName = stockmasterDb.getDatabaseName(); // Ensure this method is available

    // Start defining the SQL query
    let sqlQuery = `
      SELECT 
        tblageinfo.CreditorCode, 
        tblcreditor.CreditorName, 
        tblcreditor.creditorcell, 
        tblcreditor.creditorphone, 
        tblcreditor.creditoremail, 
        tblageinfo.currentbalance + 
        tblageinfo.30days + 
        tblageinfo.60days + 
        tblageinfo.90days + 
        tblageinfo.120days + 
        tblageinfo.150days + 
        tblageinfo.180days AS totalBalance, 
        tblageinfo.balanceforward, 
        tblageinfo.currentbalance, 
        tblageinfo.30days, 
        tblageinfo.60days, 
        tblageinfo.90days, 
        tblageinfo.120days, 
        tblageinfo.150days, 
        tblageinfo.180days 
      FROM 
        ${stockmasterDbName}.tblageinfo 
      INNER JOIN 
        ${stockmasterDbName}.tblcreditor 
      ON 
        tblageinfo.creditorcode = tblcreditor.creditorcode 
      WHERE 
        tblageinfo.currentagedate = '${format(
          new Date(CmbPreviousAging),
          "yyyy-MM-dd HH:mm:ss"
        )}' 
    `;

    // Add the conditional check for balance if requested
    if (checkBalanceGreaterThanZero) {
      sqlQuery += `
        AND (tblageinfo.currentbalance + 
            tblageinfo.30days + 
            tblageinfo.60days + 
            tblageinfo.90days + 
            tblageinfo.120days + 
            tblageinfo.150days + 
            tblageinfo.180days) <> 0
      `;
    }

    // Execute the query using the stockmasterDb connection
    const results = await stockmasterDb.query(sqlQuery, {
      type: stockmasterDb.QueryTypes.SELECT,
    });

    // Check if any results were returned
    if (results.length === 0) {
      throw new Error("No data found");
    }

    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};
exports.CreditorAnalysisCmbPreviousAging = async (req) => {
  try {
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { debtorsDb, stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost,
      serverUser,
      serverPassword,
      serverPort,
    });
    const stockmasterDbName = stockmasterDb.getDatabaseName();

    // SQL query to retrieve currentagedate
    const sqlQuery = `
      SELECT 
        tblageinfo.currentagedate 
      FROM 
        ${stockmasterDbName}.tblageinfo 
    `;

    // Execute the query
    const results = await stockmasterDb.query(sqlQuery, {
      type: stockmasterDb.QueryTypes.SELECT,
    });

    // Check if any results were returned
    if (results.length === 0) {
      throw new Error("No data found");
    }

    // Remove duplicates using an object
    const uniqueDates = {};
    results.forEach((item) => {
      uniqueDates[item.currentagedate] = true;
    });

    // Convert to desired format YYYY-MM-DD HH:mm:ss
    const formattedResults = Object.keys(uniqueDates).map((dateString) => {
      const date = new Date(dateString);
      const formattedDate = date.toISOString().slice(0, 19).replace("T", " ");
      return { currentagedate: formattedDate };
    });

    return formattedResults;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.CURRENTCreditorsAgeAnalysis = async (
  checkBalanceGreaterThanZero,
  req
) => {
  try {
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { debtorsDb, stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost,
      serverUser,
      serverPassword,
      serverPort,
    });
    const stockmasterDbName = stockmasterDb.getDatabaseName(); // Ensure this method is available

    // Start defining the SQL query
    let sqlQuery = `
      SELECT 
        creditorcode, 
        creditorname, 
        creditorcell, 
        creditorphone, 
        creditoremail, 
        currentbalance + 30days + 60days + 90days + 120days + 150days + 180days AS totalBalance, 
        balanceforward, 
        currentbalance, 
        30days, 
        60days, 
        90days, 
        120days, 
        150days, 
        180days 
      FROM 
        ${stockmasterDbName}.tblcreditor
    `;

    // Add the conditional check for totalBalance if requested
    if (checkBalanceGreaterThanZero) {
      sqlQuery += `
        WHERE (currentbalance + 
               30days + 
               60days + 
               90days + 
               120days + 
               150days + 
               180days) <> 0
      `;
    }

    // Execute the query using the stockmasterDb connection
    const results = await stockmasterDb.query(sqlQuery, {
      type: stockmasterDb.QueryTypes.SELECT,
    });

    // Check if any results were returned
    if (results.length === 0) {
      throw new Error("No data found");
    }

    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};
exports.allDataMinStockLevel = async (req) => {
  try {
    // Retrieve active databases
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { debtorsDb, stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost: req.user.serverHost,
      serverUser: req.user.serverUser,
      serverPassword: req.user.serverPassword,
      serverPort: req.user.serverPort,
    }); // Ensure correct reference
    const stockmasterDbName = stockmasterDb.getDatabaseName(); // Ensure this method is available

    // Define the SQL query to find products with a minimum stock level not equal to 0 and stock on hand less than minimum stock
    const sqlQuery = `
      SELECT * 
       FROM ${stockmasterDbName}.tblproducts
      WHERE MinStock <> 0 
        AND StockonHand < MinStock
    `;

    // Execute the query using the stockmasterDb connection
    const results = await stockmasterDb.query(sqlQuery, {
      type: stockmasterDb.QueryTypes.SELECT,
    });

    // Check if any results were returned
    if (results.length === 0) {
      throw new Error("No data found");
    }

    // Return the results
    return results;
  } catch (error) {
    // Throw an error with a meaningful message
    throw new Error(error.message);
  }
};
exports.allDataMaxStockLevel = async (req) => {
  try {
    // Retrieve active databases
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { debtorsDb, stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost,
      serverUser,
      serverPassword,
      serverPort,
    }); // Ensure correct reference
    const stockmasterDbName = stockmasterDb.getDatabaseName(); // Get the database name

    // Define the SQL query to find products with a maximum stock level not equal to 0 and stock on hand less than maximum stock
    const sqlQuery = `
      SELECT * 
      FROM ${stockmasterDbName}.tblproducts
      WHERE Maxstock <> 0 
        AND StockonHand < Maxstock
    `;

    // Execute the query using the stockmasterDb connection
    const results = await stockmasterDb.query(sqlQuery, {
      type: stockmasterDb.QueryTypes.SELECT,
    });

    // Check if any results were returned
    if (results.length === 0) {
      throw new Error("No data found");
    }

    // Return the results
    return results;
  } catch (error) {
    // Throw an error with a meaningful message
    throw new Error(error.message);
  }
};
exports.sixWeek = async (requestBody, req) => {
  try {
    const PB1Max = 6; // Number of weeks

    // Get active databases
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { debtorsDb, stockmasterDb, hostDb, historyDb } = getDatabasesCustom({
      activeDatabases,
      serverHost,
      serverUser,
      serverPassword,
      serverPort,
    });

    if (!debtorsDb || !stockmasterDb || !hostDb || !historyDb) {
      throw new Error("Required databases not found");
    }

    const {
      OptSupplier,
      OptCategory,
      txtSupplierCode,
      txtCategoryNo,
      txtSub1No,
      txtSub2No,
      startDate,
    } = requestBody;

    // Ensure startDate is parsed as a Date object
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      throw new Error("Invalid startDate format");
    }
    console.log(
      `Start Date for Week Calculation: ${start.toISOString().split("T")[0]}`
    );

    // Calculate the start date for 6 weeks prior to the given startDate
    const previousStartDate = new Date(start);
    previousStartDate.setDate(previousStartDate.getDate() - PB1Max * 7); // 6 weeks back
    console.log(
      `Start Date for Previous 6 Weeks: ${
        previousStartDate.toISOString().split("T")[0]
      }`
    );

    let data = null;
    if (OptSupplier) {
      data = await fetchData(stockmasterDb, "supplier", txtSupplierCode);
    } else if (OptCategory) {
      data = await fetchData(
        stockmasterDb,
        "category",
        txtCategoryNo,
        txtSub1No,
        txtSub2No
      );
    }

    // Create a map for unique stockcodes with initial week data
    const stockcodeMap = new Map();
    data.forEach((item) => {
      if (!stockcodeMap.has(item.stockcode)) {
        stockcodeMap.set(item.stockcode, {
          ...item,
          week1: 0,
          week2: 0,
          week3: 0,
          week4: 0,
          week5: 0,
          week6: 0,
        });
      }
    });

    const weekData = generateWeekData(previousStartDate); // Generate previous 6 weeks
    console.log(`Start Date of Week 1: ${weekData[0].startDate}`);
    console.log(`End Date of Week 6: ${weekData[5].endDate}`);

    // Fetch current transaction data
    const currentTranData = await fetchCurrentTranData(
      historyDb,
      startDate,
      weekData
    );
    console.log("Fetched currentTranData:", currentTranData);

    // Adjusted loop for handling nested week structure in currentTranData
    if (typeof currentTranData === "object" && currentTranData !== null) {
      for (const [weekKey, weekData] of Object.entries(currentTranData)) {
        const weekNumber = weekKey.replace("week", ""); // Extract week number, e.g., "1", "2", etc.

        for (const [stockcode, value] of Object.entries(weekData)) {
          if (stockcodeMap.has(stockcode)) {
            stockcodeMap.get(stockcode)[`week${weekNumber}`] += value;
          }
        }
      }
    } else {
      console.error(
        "Error: currentTranData has unexpected structure:",
        currentTranData
      );
      throw new Error("Unexpected data format for currentTranData");
    }

    // Convert the map back to an array format for the response
    const results = Array.from(stockcodeMap.values());

    return {
      startDate: previousStartDate.toISOString().split("T")[0], // Show previous start date
      endDate: start.toISOString().split("T")[0], // Keep the provided start date as the end date
      data: results,
    };
  } catch (error) {
    console.error("Error in sixWeek function:", error);
    throw error;
  }
};

async function fetchData(
  stockmasterDb,
  type,
  code,
  sub1No = null,
  sub2No = null
) {
  const stockmasterDbName = stockmasterDb.getDatabaseName();
  let query = "";

  if (type === "supplier") {
    query = `
      SELECT 
        c.creditorcode, 
        c.creditorname, 
        p.stockcode, 
        p.description1, 
        p.MinStock, 
        p.MaxStock, 
        p.StockOnOrder, 
        p.StockOnHand, 
        p.LastCostPrice, 
        p.AvarageCostPrice, 
        p.MajorNo, 
        p.Sub1No, 
        p.Sub2No
      FROM ${stockmasterDbName}.tblproducts AS p
      INNER JOIN ${stockmasterDbName}.tblcreditoritems AS c
        ON p.stockcode = c.stockcode
      WHERE c.creditorcode = :code
    `;
  } else if (type === "category") {
    query = `
      SELECT 
        '0' AS creditorcode, 
        '0' AS creditorname, 
        p.stockcode, 
        p.description1, 
        p.MinStock, 
        p.MaxStock, 
        p.StockOnOrder, 
        p.StockOnHand, 
        p.LastCostPrice, 
        p.AvarageCostPrice, 
        p.MajorNo, 
        p.Sub1No, 
        p.Sub2No
      FROM ${stockmasterDbName}.tblproducts AS p
      WHERE p.majorno = :code
        AND p.sub1no = :sub1No 
        AND p.sub2no = :sub2No
    `;
  }

  return stockmasterDb.query(query, {
    type: QueryTypes.SELECT,
    replacements: { code, sub1No, sub2No },
  });
}

function generateWeekData(startDate) {
  const weekData = [];
  let currentStartDate = new Date(startDate);

  for (let i = 0; i < 6; i++) {
    const endDate = addDays(currentStartDate, 6);
    weekData.push({ startDate: currentStartDate, endDate });
    currentStartDate = addDays(currentStartDate, 7);
  }

  return weekData;
}

async function fetchCurrentTranData(historyDb, startDate, weekData) {
  try {
    const firstStartDate = weekData[0]?.startDate;
    const lastEndDate = weekData[weekData.length - 1]?.endDate;

    const stockQuantities = {
      week1: {},
      week2: {},
      week3: {},
      week4: {},
      week5: {},
      week6: {},
    };

    const startYear = getYear(new Date(startDate));
    const tables = await historyDb.query("SHOW TABLES", {
      type: QueryTypes.SELECT,
    });
    const matchingTables = tables.filter((table) => {
      const tableName = table["Tables_in_" + historyDb.getDatabaseName()];
      const tableYearMonthMatch = tableName.match(/(\d{6})/);

      if (tableYearMonthMatch) {
        const tableYear = parseInt(tableYearMonthMatch[0].slice(0, 4), 10);
        const tableMonth = parseInt(tableYearMonthMatch[0].slice(4, 6), 10);
        return (
          tableName.endsWith("tbldata_current_tran") &&
          tableYear === startYear &&
          tableMonth >= getMonth(new Date(startDate)) + 1 &&
          tableMonth <= getMonth(new Date(lastEndDate)) + 1
        );
      }
      return false;
    });

    if (matchingTables.length === 0) {
      return stockQuantities;
    }

    for (const table of matchingTables) {
      const tableName = table["Tables_in_" + historyDb.getDatabaseName()];

      for (let i = 0; i < 6; i++) {
        const { startDate: weekStartDate, endDate: weekEndDate } = weekData[i];

        const query = `
          SELECT stockcode, SUM(qty) as totalQty
          FROM ${tableName}
          WHERE datetime BETWEEN :startDate AND :endDate
          GROUP BY stockcode
        `;

        const results = await historyDb.query(query, {
          replacements: { startDate: weekStartDate, endDate: weekEndDate },
          type: QueryTypes.SELECT,
        });

        results.forEach((row) => {
          const weekKey = `week${i + 1}`;
          if (!stockQuantities[weekKey][row.stockcode]) {
            stockQuantities[weekKey][row.stockcode] = 0;
          }
          stockQuantities[weekKey][row.stockcode] += row.totalQty;
        });
      }
    }

    return stockQuantities;
  } catch (error) {
    console.error("Error fetching transaction data:", error.message);
    throw error;
  }
}

exports.tblcreditoritemsGroup = async (req) => {
  try {
    // Get active databases
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost,
      serverUser,
      serverPassword,
      serverPort,
    });
    const stockmasterDbName = stockmasterDb.getDatabaseName();

    // Fetch only unique CreditorName and CreditorCode
    const selectProductQuery = `
      SELECT DISTINCT CreditorName, CreditorCode FROM ${stockmasterDbName}.tblcreditoritems`;

    const productDataToReturn = await stockmasterDb.query(selectProductQuery, {
      type: QueryTypes.SELECT,
    });

    if (productDataToReturn.length === 0) {
      throw new Error("No product data found.");
    }

    console.log(
      `Fetched ${productDataToReturn.length} unique product records.`
    );
    return productDataToReturn; // Return unique product data
  } catch (error) {
    console.error("Error fetching product data:", error.message);
    throw new Error(`Error during product data retrieval: ${error.message}`);
  }
};

exports.saleRepCommission = async (DateFrom, DateTo, req) => {
  try {
    // Get active databases
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost,
      serverUser,
      serverPassword,
      serverPort,
    });
    const stockmasterDbName = stockmasterDb.getDatabaseName();

    // Fetch the data to be returned
    const selectQuery = `
      SELECT * FROM ${stockmasterDbName}.tbldata_salesrep
      WHERE ${stockmasterDbName}.tbldata_salesrep.datetime BETWEEN :dateFrom AND :dateTo
    `;

    const dataToReturn = await stockmasterDb.query(selectQuery, {
      type: QueryTypes.SELECT,
      replacements: {
        dateFrom: DateFrom,
        dateTo: DateTo,
      },
    });

    if (dataToReturn.length === 0) {
      throw new Error("No data found for the specified date range.");
    }

    console.log(`Fetched ${dataToReturn.length} records.`);
    return dataToReturn; // Return the fetched data
  } catch (error) {
    console.error("Error fetching data:", error.message);
    throw new Error(`Error during data retrieval: ${error.message}`);
  }
};
exports.saleRepCommissionByProduct = async (DateFrom, DateTo, req) => {
  try {
    // Get active databases
    const { serverHost, serverPassword, serverUser, serverPort } = req.user;
    const activeDatabases = await databaseController.getActiveDatabases(
      req.user,
      req.query.shopKey
    );
    const { stockmasterDb } = getDatabasesCustom({
      activeDatabases,
      serverHost,
      serverUser,
      serverPassword,
      serverPort,
    });
    const stockmasterDbName = stockmasterDb.getDatabaseName();

    // Fetch commission data by product
    const selectProductQuery = `
      SELECT * FROM ${stockmasterDbName}.tbldata_salesrep_tran
      WHERE ${stockmasterDbName}.tbldata_salesrep_tran.datetime BETWEEN :dateFrom AND :dateTo
    `;

    const productDataToReturn = await stockmasterDb.query(selectProductQuery, {
      type: QueryTypes.SELECT,
      replacements: {
        dateFrom: DateFrom,
        dateTo: DateTo,
      },
    });

    if (productDataToReturn.length === 0) {
      throw new Error("No product data found for the specified date range.");
    }

    console.log(`Fetched ${productDataToReturn.length} product records.`);
    return productDataToReturn; // Return product data
  } catch (error) {
    console.error("Error fetching product data:", error.message);
    throw new Error(`Error during product data retrieval: ${error.message}`);
  }
};
