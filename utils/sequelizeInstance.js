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
    }
  );
  console.log(sequelize.config.database, "active database");
  return sequelize;
};

module.exports = createSequelizeInstance;
