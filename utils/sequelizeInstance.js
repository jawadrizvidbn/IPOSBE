// sequelizeInstance.js

const { Sequelize } = require("sequelize");
const config = require("../config/config"); // Ensure this path is correct

const createSequelizeInstance = (databaseName) => {
  const sequelize = new Sequelize(
    databaseName,
    config.mysql.username,
    config.mysql.password,
    {
      host: config.mysql.host,
      dialect: "mysql", // Explicitly specify the dialect
      dialectOptions: {
        connectTimeout: 1000000,
      },
      pool: {
        max: 100,
        min: 0,
        idle: 1000000,
      },
    }
  );
  console.log(sequelize.config.database, "active database");
  return sequelize;
};

module.exports = createSequelizeInstance;
