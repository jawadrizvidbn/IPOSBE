// sequelizeInstance.js

const { Sequelize } = require("sequelize");

const createSequelizeInstanceCustom = ({
  databaseName,
  username,
  password,
  host,
  port = "3306"
}) => {
  console.log({ databaseName, username, password, host });
  const sequelize = new Sequelize(databaseName, username, password, {
    host: host,
    dialect: "mysql", // Explicitly specify the dialect,
    port
  });
  console.log(sequelize.config.database, "active database");
  return sequelize;
};

module.exports = createSequelizeInstanceCustom;
