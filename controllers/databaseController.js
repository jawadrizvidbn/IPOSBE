const { Sequelize, QueryTypes } = require("sequelize");
const sequelize = require("../models/databaseModel");
const createSequelizeInstance = require("../utils/sequelizeInstance");

const connectServerAndGetAllDatabases = async (req, res) => {
  try {
    const { host, user, password, port } = req.body;
    const connection = new Sequelize("", user, password, {
      host,
      port: port || "3306",
      dialect: "mysql",
    });
    const results = await connection.query("SHOW DATABASES", {
      type: QueryTypes.SELECT,
    });

    const excludePattern =
      /^(information_schema|mysql|performance_schema|test|sys)$/i;

    const filteredStores = results
      .map((row) => row.Database || row.database || null)
      .filter((db) => !excludePattern.test(db))
      .map((dbName) =>
        dbName.replace(/(debtors|history|host|master|stockmaster)/gi, "").trim()
      );

    const uniqueStores = [...new Set(filteredStores)];
    res.json(uniqueStores || []);
  } catch (err) {
    console.error("Error fetching databases:", err);
    res.status(500).send("Error fetching databases");
  }
};

const getalldatabases = async (req, res) => {
  try {
    const results = await sequelize.query("SHOW DATABASES", {
      type: QueryTypes.SHOWDATABASES,
    });
    res.json(results);
  } catch (err) {
    console.error("Error fetching databases:", err);
    res.status(500).send("Error fetching databases");
  }
};

const getallshoptable = async (req, res) => {
  try {
    const results = await sequelize.query("SHOW DATABASES", {
      type: QueryTypes.SELECT,
    });
    const databases = results.map((row) => row.Database || row.database);

    const promises = databases.map(async (dbName) => {
      if (!dbName) return null;
      const tableResults = await sequelize.query(
        `SHOW TABLES FROM \`${dbName}\``,
        { type: QueryTypes.SELECT }
      );
      return {
        database: dbName,
        tables: tableResults.map((row) => Object.values(row)[0]),
      };
    });

    const data = await Promise.all(promises);

    const groupedDatabases = data.reduce((acc, { database, tables }) => {
      if (!database) return acc;
      const baseName = database.replace(
        /(debtors|history|host|master|stockmaster)$/i,
        ""
      );

      if (!acc[baseName]) {
        acc[baseName] = {
          databases: [],
          tables: {},
        };
      }

      acc[baseName].databases.push(database);
      acc[baseName].tables[database] = tables;

      return acc;
    }, {});

    res.json(groupedDatabases);
  } catch (err) {
    console.error("Error fetching tables:", err);
    res.status(500).send("Error fetching tables");
  }
};

const getallshop = async (req, res) => {
  try {
    // Fetch all databases
    console.log("allowed stores: ", req.user?.allowedStores);

    const {
      serverHost,
      serverUser,
      serverPassword,
      allowedStores,
      serverPort,
    } = req.user;

    const userInstance = new Sequelize("", serverUser, serverPassword, {
      host: serverHost,
      port: serverPort,
      dialect: "mysql",
    });
    const results = await userInstance.query("SHOW DATABASES", {
      type: QueryTypes.SELECT,
    });
    const databases = results.map((row) => row.Database || row.database);
    // .filter((r) => allowedStores.includes(r.toLowerCase()));

    // Regular expression for identifying system or irrelevant databases
    const excludePattern =
      /^(information_schema|mysql|performance_schema|test|sys)$/i;

    // Group databases based on their base names
    const groupedDatabases = databases.reduce((acc, dbName) => {
      // Skip system databases and databases matching the exclusion pattern
      if (excludePattern.test(dbName)) {
        return acc; // Skip this database
      }

      // Dynamically determine the baseName by removing specific suffixes (e.g., debtors, history, etc.)
      const baseName = dbName
        .replace(/(debtors|history|host|master|stockmaster)/gi, "")
        .trim();

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
    // if (req.superadmin) {
    //   return res.json(groupedDatabases);
    // }

    // Initialize an empty object to store the final filtered result
    const filteredGroupedDatabases = {};

    // Iterate over each group in groupedDatabases
    Object.keys(groupedDatabases).forEach((group) => {
      // Find permissions for the current group
      const allowedGroup = allowedStores.find((store) => store === group);

      // Only include databases where there is a matching permission
      if (allowedGroup && groupedDatabases[allowedGroup].length > 0) {
        filteredGroupedDatabases[allowedGroup] = groupedDatabases[allowedGroup];
      }
    });

    // Return the filtered databases based on permissions
    res.json(filteredGroupedDatabases);
  } catch (err) {
    console.error("Error fetching databases:", err);
    res.status(500).json({ error: "Error fetching databases" });
  }
};

const getTablesFromGroup = async (req, res) => {
  const baseName = req.params.basename;

  try {
    const results = await sequelize.query("SHOW DATABASES", {
      type: QueryTypes.SELECT,
    });
    const databases = results.map((row) => row.Database || row.database);

    const groupedDatabases = databases.reduce((acc, dbName) => {
      if (!dbName) return acc;
      const name = dbName.replace(
        /(debtors|history|host|master|stockmaster)$/i,
        ""
      );
      if (!acc[name]) acc[name] = [];
      acc[name].push(dbName);
      return acc;
    }, {});

    if (!groupedDatabases[baseName]) {
      res.status(404).send("Group not found");
      return;
    }

    const dbNames = groupedDatabases[baseName];

    const promises = dbNames.map(async (dbName) => {
      // Create a new Sequelize instance for each database
      const dbInstance = createSequelizeInstance(dbName);
      const tableResults = await dbInstance.query(
        `SHOW TABLES FROM \`${dbName}\``,
        { type: QueryTypes.SELECT }
      );
      return {
        database: dbName,
        tables: tableResults.map((row) => Object.values(row)[0]),
      };
    });

    const data = await Promise.all(promises);
    res.json(data);
  } catch (err) {
    console.error("Error fetching tables:", err);
    res.status(500).send("Error fetching tables");
  }
};

const getTables = async (req, res) => {
  const dbName = req.params.dbname;
  try {
    const results = await sequelize.query(`SHOW TABLES FROM \`${dbName}\``, {
      type: QueryTypes.SELECT,
    });
    const tables = results.map((row) => Object.values(row)[0]);
    res.json(tables);
  } catch (err) {
    console.error("Error fetching tables:", err);
    res.status(500).send("Error fetching tables");
  }
};

const getTableData = async (req, res) => {
  const dbName = req.params.dbname;
  const tableName = req.params.tablename;
  try {
    const results = await sequelize.query(
      `SELECT * FROM \`${dbName}\`.\`${tableName}\``,
      { type: QueryTypes.SELECT }
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching table data:", err);
    res.status(500).send("Error fetching table data");
  }
};

const insertTableData = async (req, res) => {
  const dbName = req.params.dbname;
  const tableName = req.params.tablename;
  const data = req.body;
  try {
    const results = await sequelize.query(
      `INSERT INTO \`${dbName}\`.\`${tableName}\` SET ?`,
      {
        replacements: [data],
        type: QueryTypes.INSERT,
      }
    );
    res.json(results);
  } catch (err) {
    console.error("Error inserting data:", err);
    res.status(500).send("Error inserting data");
  }
};
// In-memory store for selected databases
let activeDatabases = {};
const findAllAndActiveDatabase = async (req, res) => {
  const baseName = req.params.baseName; // Ensure parameter name matches exactly
  console.log(req.user);

  const { serverHost, serverUser, serverPassword, allowedStores, serverPort } =
    req.user;

  try {
    // Determine the group to activate databases based on user permissions or superadmin status

    const userInstance = new Sequelize("", serverUser, serverPassword, {
      host: serverHost,
      dialect: "mysql",
      port: serverPort,
    });
    // Fetch all databases
    const results = await userInstance.query("SHOW DATABASES", {
      type: QueryTypes.SELECT,
    });
    const databases = results.map((row) => row.Database || row.database);

    // Group databases based on baseName (similar to your controller logic)
    const groupedDatabases = databases.reduce((acc, dbName) => {
      if (!dbName) return acc;
      const name = dbName.replace(
        /(debtors|history|host|master|stockmaster)/gi,
        ""
      );
      if (!acc[name]) acc[name] = [];
      acc[name].push(dbName);
      return acc;
    }, {});

    // Check if the requested group exists in groupedDatabases
    if (!groupedDatabases[baseName]) {
      console.log(`Requested baseName '${baseName}' not found.`);
      return res.status(404).send("Group not found");
    }
    // Deactivate previously active group database, if any
    for (const groupName in activeDatabases) {
      if (groupName !== baseName) {
        delete activeDatabases[groupName];
      }
    }

    // Select databases from the requested group
    const dbNames = groupedDatabases[baseName];

    const masterDb = dbNames.filter((dbName) => dbName.endsWith("master"));

    // Store selected databases globally in activeDatabases
    // activeDatabases[baseName] = dbNames;
    const data = [];
    // Perform operations using Sequelize instances for selected databases
    for (const dbName of masterDb) {
      try {
        const dbInstance = new Sequelize(dbName, serverUser, serverPassword, {
          host: serverHost,
          dialect: "mysql",
          port: serverPort,
          pool: {
            max: 1, // Only one connection per database
            min: 1,
            acquire: 30000, // Time in ms to wait before throwing a timeout error
            idle: 10000, // Time in ms before an idle connection is released
          },
        });
        // Example: Fetch tables from each database
        const tableResults = await dbInstance.query(
          `SHOW TABLES FROM \`${dbName}\``,
          { type: QueryTypes.SELECT }
        );
        data.push({
          database: dbName,
          tables: tableResults.map((row) => Object.values(row)[0]),
        });
      } catch (err) {
        console.error(`Error fetching tables for database '${dbName}':`, err);
        data.push({ database: dbName, error: err.message }); // Handle error response if needed
      }
    }

    // const data = await Promise.all(promises);
    res.json(data);
  } catch (err) {
    console.error("Error fetching grouped databases:", err);
    res.status(500).send("Error fetching grouped databases");
  }
};
// Function to get active databases
const getActiveDatabases = async (user, store) => {
  const { serverHost, serverUser, serverPassword, allowedStores, serverPort } =
    user || {};

  console.log("store: ", store);
  if (!store && typeof store !== "string") {
    throw new Error("Store not found");
  }
  const userInstance = new Sequelize("", serverUser, serverPassword, {
    host: serverHost,
    dialect: "mysql",
    port: serverPort,
    dialectOptions: {
      connectTimeout: 1000000,
    },
  });
  const results = await userInstance.query("SHOW DATABASES", {
    type: QueryTypes.SELECT,
  });
  const databases = results
    .map((row) => row.Database || row.database)
    .filter((r) => r.toLowerCase().includes(store.toLowerCase()));

  const groupedDatabases = databases.reduce((acc, dbName) => {
    if (!dbName) return acc;
    const name = dbName.replace(
      /(debtors|history|host|master|stockmaster)/gi,
      ""
    );
    if (!acc[name]) acc[name] = [];
    acc[name].push(dbName);
    return acc;
  }, {});

  return groupedDatabases;
};
// In-memory store for selected databases
let activeDatabasesMultiple = {};
const findAllAndActiveDatabaseMultiple = async (req, res) => {
  const baseNames = req.params.baseName.split(",");

  try {
    const userPermissions = Array.isArray(req.userPermissions)
      ? req.userPermissions
      : [];
    const isSuperAdmin = req.superadmin;
    const groupsToActivate = [];

    for (const baseName of baseNames) {
      let groupToActivate = "";

      if (isSuperAdmin) {
        groupToActivate = baseName;
      } else {
        const permission = userPermissions.find(
          (perm) =>
            perm.shopName.trim().toLowerCase() === baseName.trim().toLowerCase()
        );
        if (permission) {
          groupToActivate = permission.group;
        } else {
          console.log(`User does not have permission for '${baseName}'.`);
          return res.status(403).send("Permission denied");
        }
      }
      groupsToActivate.push(groupToActivate);
    }

    // Fetch all databases
    const results = await sequelize.query("SHOW DATABASES", {
      type: QueryTypes.SELECT,
    });
    const databases = results.map((row) => row.Database || row.database);

    // Group databases based on baseNames
    const groupedDatabases = databases.reduce((acc, dbName) => {
      if (!dbName) return acc;
      const name = dbName.replace(
        /(debtors|history|host|master|stockmaster)$/i,
        ""
      );
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
        return res.status(404).send("Group not found");
      }

      const dbNames = groupedDatabases[groupToActivate];
      activeDatabasesMultiple[groupToActivate] = dbNames; // Store in activeDatabasesMultiple

      // Create Sequelize instances for each database and query
      const promises = dbNames.map(async (dbName) => {
        const dbInstance = createSequelizeInstance(dbName);
        try {
          const tableResults = await dbInstance.query(
            `SHOW TABLES FROM \`${dbName}\``,
            { type: QueryTypes.SELECT }
          );
          return {
            database: dbName,
            tables: tableResults.map((row) => Object.values(row)[0]),
          };
        } catch (err) {
          console.error(`Error fetching tables for database '${dbName}':`, err);
          return { database: dbName, error: err.message };
        }
      });

      allDataPromises.push(...promises);
    }

    // Wait for all database queries to complete
    const allData = await Promise.all(allDataPromises);
    res.json(allData.filter((data) => !data.error)); // Filter out errors from the response
  } catch (err) {
    console.error("Error fetching grouped databases:", err);
    if (!res.headersSent) {
      res.status(500).send("Error fetching grouped databases");
    }
  }
};

// Function to get active databases
const getActiveDatabasesMultiple = () => {
  return activeDatabasesMultiple;
};
module.exports = {
  connectServerAndGetAllDatabases,
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
