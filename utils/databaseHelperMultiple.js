const createSequelizeInstance = require('../utils/sequelizeInstance'); // Correct the import path

exports.getDatabasesMultiple = (activeDatabasesMultiple) => {
  const historyDbNames = [];
  const stockmasterDbNames = [];

  for (const dbNameGroup in activeDatabasesMultiple) {
    if (Object.hasOwnProperty.call(activeDatabasesMultiple, dbNameGroup)) {
      const dbNameList = activeDatabasesMultiple[dbNameGroup];

      for (const dbName of dbNameList) {
        if (dbName.endsWith('history')) {
          historyDbNames.push(dbName);
        } else if (dbName.endsWith('stockmaster') || dbName.endsWith('master')) {
          stockmasterDbNames.push(dbName);
        }
      }
    }
  }

  if (historyDbNames.length === 0 || stockmasterDbNames.length === 0) {
    throw new Error('Required databases not found');
  }

  // Create Sequelize instances for all found databases
  const historyDbs = historyDbNames.map(dbName => createSequelizeInstance(dbName));
  const stockmasterDbs = stockmasterDbNames.map(dbName => createSequelizeInstance(dbName));

  return { historyDbs, stockmasterDbs }; // Return the arrays of Sequelize instances
};
