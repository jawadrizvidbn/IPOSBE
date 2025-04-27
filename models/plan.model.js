// user.model.js

const { Sequelize, DataTypes } = require("sequelize");
const createSequelizeInstance = require("../utils/sequelizeInstance"); // Import the function to create Sequelize instances

// Create Sequelize instance for 'ipospermissions' database dynamically
const sequelize = createSequelizeInstance("ipospermissions");

// Define the User model
const Plan = sequelize.define("Plan", {
  planName: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "defaultPlan", // Set your default plan here
  },
  planPrice: {
    type: Sequelize.DECIMAL,
    allowNull: false,
    defaultValue: 0,
  },
  numberOfStores: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

module.exports = Plan;
