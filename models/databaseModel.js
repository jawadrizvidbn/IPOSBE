// sequelize.js
const { Sequelize } = require("sequelize");
const config = require("../config/config");

const sequelize = new Sequelize(
  "",
  config.mysql.username,
  config.mysql.password,
  {
    host: config.mysql.host,
    logging: false,
    dialect: "mysql",
    pool: {
      max: 50, // Maximum number of connections in the pool
      min: 0, // Minimum number of connections in the pool
      acquire: 30000, // Maximum time (in ms) that pool will try to get connection before throwing error
      idle: 10000, // Maximum time (in ms) that a connection can be idle before being released
    },
    // logging: false   // Disable logging for cleaner output
  }
);

module.exports = sequelize;
