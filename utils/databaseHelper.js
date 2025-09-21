const createSequelizeInstance = require("../utils/sequelizeInstance"); // Correct the import path
const createSequelizeInstanceCustom = require("./sequelizeInstanceCustom");

exports.getDatabases = (activeDatabases) => {
  let historyDbName, stockmasterDbName, debtorsDbName, hostDbName;

  for (const dbNameGroup in activeDatabases) {
    if (Object.hasOwnProperty.call(activeDatabases, dbNameGroup)) {
      const dbNameList = activeDatabases[dbNameGroup];

      for (const dbName of dbNameList) {
        if (dbName.endsWith("history")) {
          historyDbName = dbName;
        } else if (
          dbName.endsWith("stockmaster") ||
          dbName.endsWith("master")
        ) {
          stockmasterDbName = dbName;
        } else if (dbName.endsWith("debtors")) {
          debtorsDbName = dbName; // Connect to debtors database
        } else if (dbName.endsWith("host")) {
          hostDbName = dbName; // Connect to host database
        }
      }

      // Break the loop if we have found all required databases
      if (historyDbName && stockmasterDbName && debtorsDbName && hostDbName) {
        break;
      }
    }
  }

  // Check if all required databases were found
  if (!historyDbName || !stockmasterDbName || !debtorsDbName || !hostDbName) {
    throw new Error("Required databases not found");
  }

  // Create Sequelize instances for each database
  const historyDb = createSequelizeInstance(historyDbName);
  const stockmasterDb = createSequelizeInstance(stockmasterDbName);
  const debtorsDb = createSequelizeInstance(debtorsDbName); // Create Sequelize instance for debtors
  const hostDb = createSequelizeInstance(hostDbName); // Create Sequelize instance for host

  return { historyDb, stockmasterDb, debtorsDb, hostDb }; // Return the Sequelize instances
};

exports.getDatabasesCustom = ({
  activeDatabases,
  serverHost,
  serverUser,
  serverPassword,
  serverPort = "3306",
}) => {
  let historyDbName, stockmasterDbName, debtorsDbName, hostDbName;

  for (const dbNameGroup in activeDatabases) {
    if (Object.hasOwnProperty.call(activeDatabases, dbNameGroup)) {
      const dbNameList = activeDatabases[dbNameGroup];

      for (const dbName of dbNameList) {
        if (dbName.endsWith("history")) {
          historyDbName = dbName;
        } else if (
          dbName.endsWith("stockmaster") ||
          dbName.endsWith("master")
        ) {
          stockmasterDbName = dbName;
        } else if (dbName.endsWith("debtors")) {
          debtorsDbName = dbName; // Connect to debtors database
        } else if (dbName.endsWith("host")) {
          hostDbName = dbName; // Connect to host database
        }
      }

      // Break the loop if we have found all required databases
      if (historyDbName && stockmasterDbName && debtorsDbName && hostDbName) {
        break;
      }
    }
  }

  // Check if all required databases were found
  if (!historyDbName || !stockmasterDbName || !debtorsDbName || !hostDbName) {
    throw new Error("Required databases not found");
  }

  // Create Sequelize instances for each database
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
  const debtorsDb = createSequelizeInstanceCustom({
    databaseName: debtorsDbName,
    host: serverHost,
    username: serverUser,
    password: serverPassword,
    port: serverPort,
  }); // Create Sequelize instance for debtors
  const hostDb = createSequelizeInstanceCustom({
    databaseName: hostDbName,
    host: serverHost,
    username: serverUser,
    password: serverPassword,
    port: serverPort,
  }); // Create Sequelize instance for host

  return { historyDb, stockmasterDb, debtorsDb, hostDb }; // Return the Sequelize instances
};

exports.getRequiredDbs = (activeDatabases) => {
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

  return { historyDbName, stockmasterDbName };
};

/**
 * @param {string} startTable   e.g. "202502tbldata_current_tran"
 * @param {string} endTable     e.g. "202504tbldata_current_tran"
 * @param {{Name: string}[]} allTables
 * @returns {string[]}          sorted list of table-names between start & end
 */
exports.monthRangeTables = (startTable, endTable, allTables) => {
  // extract the 6-digit YYYYMM from each
  const prefix = (tblName) => tblName.slice(0, 6);

  const start = prefix(startTable);
  const end = prefix(endTable);

  return (
    allTables
      // pull out the raw names
      .map((t) => t.Name)
      // keep only those whose YYYYMM is between start and end
      .filter((name) => {
        const p = prefix(name);
        return p >= start && p <= end;
      })
      // sort ascending by that same 6-digit prefix
      .sort((a, b) => {
        const pa = prefix(a),
          pb = prefix(b);
        // lexicographic works for numeric YYYYMM
        return pa.localeCompare(pb);
      })
  );
};
