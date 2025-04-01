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
  });
  const stockmasterDb = createSequelizeInstanceCustom({
    databaseName: stockmasterDbName,
    host: serverHost,
    username: serverUser,
    password: serverPassword,
  });
  const debtorsDb = createSequelizeInstanceCustom({
    databaseName: debtorsDbName,
    host: serverHost,
    username: serverUser,
    password: serverPassword,
  }); // Create Sequelize instance for debtors
  const hostDb = createSequelizeInstanceCustom({
    databaseName: hostDbName,
    host: serverHost,
    username: serverUser,
    password: serverPassword,
  }); // Create Sequelize instance for host

  return { historyDb, stockmasterDb, debtorsDb, hostDb }; // Return the Sequelize instances
};
