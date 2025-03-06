const { Sequelize, QueryTypes } = require('sequelize');
const sequelize = require('../models/databaseModel');
const createSequelizeInstance = require('../utils/sequelizeInstance');


const getalldatabases = async (req, res) => {
  try {
    const results = await sequelize.query('SHOW DATABASES', { type: QueryTypes.SHOWDATABASES });
    res.json(results);
  } catch (err) {
    console.error('Error fetching databases:', err);
    res.status(500).send('Error fetching databases');
  }
};

const getallshoptable = async (req, res) => {
  try {
    const results = await sequelize.query('SHOW DATABASES', { type: QueryTypes.SELECT });
    const databases = results.map(row => row.Database || row.database);

    const promises = databases.map(async (dbName) => {
      if (!dbName) return null;
      const tableResults = await sequelize.query(`SHOW TABLES FROM \`${dbName}\``, { type: QueryTypes.SELECT });
      return { database: dbName, tables: tableResults.map(row => Object.values(row)[0]) };
    });

    const data = await Promise.all(promises);

    const groupedDatabases = data.reduce((acc, { database, tables }) => {
      if (!database) return acc;
      const baseName = database.replace(/(debtors|history|host|master|stockmaster)$/i, '');

      if (!acc[baseName]) {
        acc[baseName] = {
          databases: [],
          tables: {}
        };
      }

      acc[baseName].databases.push(database);
      acc[baseName].tables[database] = tables;

      return acc;
    }, {});

    res.json(groupedDatabases);
  } catch (err) {
    console.error('Error fetching tables:', err);
    res.status(500).send('Error fetching tables');
  }
};

const getallshop = async (req, res) => {
  try {
    // Fetch all databases
    const results = await sequelize.query('SHOW DATABASES', { type: QueryTypes.SELECT });
    const databases = results.map(row => row.Database || row.database);

    // Regular expression for identifying system or irrelevant databases
    const excludePattern = /^(information_schema|mysql|performance_schema|test|sys)$/i;

    // Group databases based on their base names
    const groupedDatabases = databases.reduce((acc, dbName) => {
      // Skip system databases and databases matching the exclusion pattern
      if (excludePattern.test(dbName)) {
        return acc; // Skip this database
      }

      // Dynamically determine the baseName by removing specific suffixes (e.g., debtors, history, etc.)
      const baseName = dbName.replace(/(debtors|history|host|master|stockmaster)$/i, '').trim();

      // Exclude databases where baseName becomes empty or does not follow our valid patterns
      if (baseName && baseName !== dbName) {
        if (!acc[baseName]) {
          acc[baseName] = [];
        }
        acc[baseName].push(dbName); // Group the database by baseName
      }

      return acc;
    }, {});
    // If the user is a superadmin, skip the permission check and return all grouped databases
    if (req.superadmin) {
      return res.json(groupedDatabases);
    }

    // Extract user permissions from the request object
    const permissions = req.userPermissions;
    if (!permissions || permissions.length === 0) {
      return res.status(403).json({ error: 'No permissions available for this user.' });
    }

    // Initialize an empty object to store the final filtered result
    const filteredGroupedDatabases = {};

    // Iterate over each group in groupedDatabases
    Object.keys(groupedDatabases).forEach(group => {
      // Find permissions for the current group
      const groupPermission = permissions.find(permission => permission.group === group);

      // Only include databases where there is a matching permission
      if (groupPermission && groupedDatabases[group].length > 0) {
        filteredGroupedDatabases[groupPermission.shopName] = groupedDatabases[group];
      }
    });

    // Return the filtered databases based on permissions
    res.json(filteredGroupedDatabases);

  } catch (err) {
    console.error('Error fetching databases:', err);
    res.status(500).json({ error: 'Error fetching databases' });
  }
};
// const getallshop = async (req, res) => {
//   try {
//     const results = await sequelize.query('SHOW DATABASES', { type: QueryTypes.SELECT });
//     const databases = results.map(row => row.Database || row.database);

//     const groupedDatabases = databases.reduce((acc, dbName) => {
//       if (!dbName) return acc;
//       const baseName = dbName.replace(/(debtors|history|host|master|stockmaster)$/i, '');

//       if (!acc[baseName]) {
//         acc[baseName] = [];
//       }

//       acc[baseName].push(dbName);
//       return acc;
//     }, {});
//     // If the user is a superadmin, skip the permission check
//     if (req.superadmin) {
//       res.json(groupedDatabases);
//       return;
//     }

//     // Extract user permissions from the request object
//     const permissions = req.userPermissions; // This should be set in the middleware

//     // Initialize an empty object to store the final result
//     const filteredGroupedDatabases = {};

//     // Iterate over each group in groupedDatabases
//     Object.keys(groupedDatabases).forEach(group => {
//       // Find permissions for the current group
//       const groupPermission = permissions.find(permission => permission.group === group);
//       if (groupPermission) {
//         // Use shopName as key in filteredGroupedDatabases
//         filteredGroupedDatabases[groupPermission.shopName] = groupedDatabases[group];
//       }
//     });

//     res.json(filteredGroupedDatabases);
//   } catch (err) {
//     console.error('Error fetching databases:', err);
//     res.status(500).send('Error fetching databases');
//   }
// };
const getTablesFromGroup = async (req, res) => {
  const baseName = req.params.basename;

  try {
    const results = await sequelize.query('SHOW DATABASES', { type: QueryTypes.SELECT });
    const databases = results.map(row => row.Database || row.database);

    const groupedDatabases = databases.reduce((acc, dbName) => {
      if (!dbName) return acc;
      const name = dbName.replace(/(debtors|history|host|master|stockmaster)$/i, '');
      if (!acc[name]) acc[name] = [];
      acc[name].push(dbName);
      return acc;
    }, {});

    if (!groupedDatabases[baseName]) {
      res.status(404).send('Group not found');
      return;
    }

    const dbNames = groupedDatabases[baseName];

    const promises = dbNames.map(async (dbName) => {
      // Create a new Sequelize instance for each database
      const dbInstance = createSequelizeInstance(dbName);
      const tableResults = await dbInstance.query(`SHOW TABLES FROM \`${dbName}\``, { type: QueryTypes.SELECT });
      return { database: dbName, tables: tableResults.map(row => Object.values(row)[0]) };
    });

    const data = await Promise.all(promises);
    res.json(data);
  } catch (err) {
    console.error('Error fetching tables:', err);
    res.status(500).send('Error fetching tables');
  }
};

const getTables = async (req, res) => {
  const dbName = req.params.dbname;
  try {
    const results = await sequelize.query(`SHOW TABLES FROM \`${dbName}\``, { type: QueryTypes.SELECT });
    const tables = results.map(row => Object.values(row)[0]);
    res.json(tables);
  } catch (err) {
    console.error('Error fetching tables:', err);
    res.status(500).send('Error fetching tables');
  }
};

const getTableData = async (req, res) => {
  const dbName = req.params.dbname;
  const tableName = req.params.tablename;
  try {
    const results = await sequelize.query(`SELECT * FROM \`${dbName}\`.\`${tableName}\``, { type: QueryTypes.SELECT });
    res.json(results);
  } catch (err) {
    console.error('Error fetching table data:', err);
    res.status(500).send('Error fetching table data');
  }
};

const insertTableData = async (req, res) => {
  const dbName = req.params.dbname;
  const tableName = req.params.tablename;
  const data = req.body;
  try {
    const results = await sequelize.query(`INSERT INTO \`${dbName}\`.\`${tableName}\` SET ?`, {
      replacements: [data],
      type: QueryTypes.INSERT
    });
    res.json(results);
  } catch (err) {
    console.error('Error inserting data:', err);
    res.status(500).send('Error inserting data');
  }
};
// In-memory store for selected databases
let activeDatabases = {};
const findAllAndActiveDatabase = async (req, res) => {
  const baseName = req.params.baseName; // Ensure parameter name matches exactly

  try {
    // Determine the group to activate databases based on user permissions or superadmin status
    const userPermissions = Array.isArray(req.userPermissions) ? req.userPermissions : [];
    const isSuperAdmin = req.superadmin; // Assuming isSuperAdmin is provided in the request
    let groupToActivate = '';

    if (isSuperAdmin) {
      // Superadmin can access any group directly
      groupToActivate = baseName;
    } else if (userPermissions.length > 0) {
      // Find the group corresponding to the shopName in userPermissions
      const permission = userPermissions.find(perm => perm.shopName.trim().toLowerCase() === baseName.trim().toLowerCase()); 
      if (permission) {
        groupToActivate = permission.group;
      } else {
        console.log(`User does not have permission for '${baseName}'.`);
        return res.status(403).send('Permission denied');
      }
    } else {
      console.log('User role and permissions are not properly provided.');
      return res.status(403).send('Permission denied');
    }
    // Fetch all databases
    const results = await sequelize.query('SHOW DATABASES', { type: QueryTypes.SELECT });
    const databases = results.map(row => row.Database || row.database);

    // Group databases based on baseName (similar to your controller logic)
    const groupedDatabases = databases.reduce((acc, dbName) => {
      if (!dbName) return acc;
      const name = dbName.replace(/(debtors|history|host|master|stockmaster)$/i, '');
      if (!acc[name]) acc[name] = [];
      acc[name].push(dbName);
      return acc;
    }, {});

    // Check if the requested group exists in groupedDatabases
    if (!groupedDatabases[groupToActivate]) {
      console.log(`Requested baseName '${baseName}' not found.`);
      return res.status(404).send('Group not found');
    }
    // Deactivate previously active group database, if any
    for (const groupName in activeDatabases) {
      if (groupName !== baseName) {
        delete activeDatabases[groupName];
      }
    }

    // Select databases from the requested group
    const dbNames = groupedDatabases[groupToActivate];
    // Store selected databases globally in activeDatabases
    activeDatabases[baseName] = dbNames;

    // Perform operations using Sequelize instances for selected databases
    const promises = dbNames.map(async (dbName) => {
      try {
        const dbInstance = createSequelizeInstance(dbName);
        // Example: Fetch tables from each database
        const tableResults = await dbInstance.query(`SHOW TABLES FROM \`${dbName}\``, { type: QueryTypes.SELECT });
        return { database: dbName, tables: tableResults.map(row => Object.values(row)[0]) };
      } catch (err) {
        console.error(`Error fetching tables for database '${dbName}':`, err);
        return { database: dbName, error: err.message }; // Handle error response if needed
      }
    });

    const data = await Promise.all(promises);
    res.json(data);
  } catch (err) {
    console.error('Error fetching grouped databases:', err);
    res.status(500).send('Error fetching grouped databases');
  }
};
// Function to get active databases
const getActiveDatabases = () => {
  return activeDatabases;
};
// In-memory store for selected databases
let activeDatabasesMultiple = {};
const findAllAndActiveDatabaseMultiple = async (req, res) => {
  const baseNames = req.params.baseName.split(',');

  try {
    const userPermissions = Array.isArray(req.userPermissions) ? req.userPermissions : [];
    const isSuperAdmin = req.superadmin;
    const groupsToActivate = [];

    for (const baseName of baseNames) {
      let groupToActivate = '';

      if (isSuperAdmin) {
        groupToActivate = baseName;
      } else {
        const permission = userPermissions.find(perm => perm.shopName.trim().toLowerCase() === baseName.trim().toLowerCase());
        if (permission) {
          groupToActivate = permission.group;
        } else {
          console.log(`User does not have permission for '${baseName}'.`);
          return res.status(403).send('Permission denied');
        }
      }
      groupsToActivate.push(groupToActivate);
    }

    // Fetch all databases
    const results = await sequelize.query('SHOW DATABASES', { type: QueryTypes.SELECT });
    const databases = results.map(row => row.Database || row.database);

    // Group databases based on baseNames
    const groupedDatabases = databases.reduce((acc, dbName) => {
      if (!dbName) return acc;
      const name = dbName.replace(/(debtors|history|host|master|stockmaster)$/i, '');
      if (!acc[name]) acc[name] = [];
      acc[name].push(dbName);
      return acc;
    }, {});
    // Clear previously active databases
    activeDatabasesMultiple = {};

    const allDataPromises = [];

    for (const groupToActivate of groupsToActivate) {
      if (!groupedDatabases[groupToActivate]) {
        console.log(`Requested baseName '${groupToActivate}' not found.`);
        return res.status(404).send('Group not found');
      }

      const dbNames = groupedDatabases[groupToActivate];
      activeDatabasesMultiple[groupToActivate] = dbNames; // Store in activeDatabasesMultiple

      // Create Sequelize instances for each database and query
      const promises = dbNames.map(async (dbName) => {
        const dbInstance = createSequelizeInstance(dbName);
        try {
          const tableResults = await dbInstance.query(`SHOW TABLES FROM \`${dbName}\``, { type: QueryTypes.SELECT });
          return { database: dbName, tables: tableResults.map(row => Object.values(row)[0]) };
        } catch (err) {
          console.error(`Error fetching tables for database '${dbName}':`, err);
          return { database: dbName, error: err.message };
        }
      });

      allDataPromises.push(...promises);
    }

    // Wait for all database queries to complete
    const allData = await Promise.all(allDataPromises);
    res.json(allData.filter(data => !data.error)); // Filter out errors from the response
  } catch (err) {
    console.error('Error fetching grouped databases:', err);
    if (!res.headersSent) {
      res.status(500).send('Error fetching grouped databases');
    }
  }
};

// Function to get active databases
const getActiveDatabasesMultiple = () => {
  return activeDatabasesMultiple;
};
module.exports = {
  getalldatabases,
  getallshoptable,
  getallshop,
  getTablesFromGroup,
  getTables,
  getTableData,
  insertTableData,
  findAllAndActiveDatabase,
  findAllAndActiveDatabaseMultiple,
  getActiveDatabasesMultiple,
  getActiveDatabases,

};
