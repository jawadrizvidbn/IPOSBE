// user.model.js

const { Sequelize, DataTypes } = require("sequelize");
const createSequelizeInstance = require("../utils/sequelizeInstance"); // Import the function to create Sequelize instances

// Create Sequelize instance for 'ipospermissions' database dynamically
const sequelize = createSequelizeInstance("ipospermissions");

// Define the User model
const Permission = sequelize.define("Permission", {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

module.exports = Permission;
