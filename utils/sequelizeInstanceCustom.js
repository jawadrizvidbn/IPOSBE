// sequelizeInstance.js

const { Sequelize } = require("sequelize");

const createSequelizeInstanceCustom = ({
  databaseName,
  username,
  password,
  host,
  port = "3306",
}) => {
  console.log({ databaseName, username, password, host });
  const sequelize = new Sequelize(databaseName, username, password, {
    host: host,
    dialect: "mysql", // Explicitly specify the dialect,
    port: port,
    logging: false,
    dialectOptions: {
      connectTimeout: 1000000,
    },
    pool: {
      max: 100,
      min: 0,
      idle: 1000000,
    },
  });
  console.log(sequelize.config.database, "active database");
  return sequelize;
};

module.exports = createSequelizeInstanceCustom;
