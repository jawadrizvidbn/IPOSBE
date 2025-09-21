// sequelizeInstance.js

const { Sequelize } = require("sequelize");

const createSequelizeInstanceCustom = ({
  databaseName,
  username,
  password,
  host,
  port = "3306",
}) => {
  const sequelize = new Sequelize(databaseName, username, password, {
    host: host,
    dialect: "mysql", // Explicitly specify the dialect,
    port: port,
    logging: false,
    dialectOptions: {
      connectTimeout: 1000000,
    },
    pool: {
      max: 1000,
      min: 0,
      idle: 10000,
      evict: 10000,
      acquire: 30000,
    },
  });
  return sequelize;
};

module.exports = createSequelizeInstanceCustom;
