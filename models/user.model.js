// user.model.js

const { Sequelize, DataTypes } = require("sequelize");
const createSequelizeInstance = require("../utils/sequelizeInstance"); // Import the function to create Sequelize instances

// Create Sequelize instance for 'ipospermissions' database dynamically
const sequelize = createSequelizeInstance("ipospermissions");

// Define the User model
const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: "user",
  },
  permissions: {
    type: DataTypes.TEXT, // Store permissions as JSON
  },
  plan: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "defaultPlan", // Set your default plan here
  },
  planActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  planStartDate: {
    type: DataTypes.DATE,
  },
  planEndDate: {
    type: DataTypes.DATE,
  },
  gracePeriod: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  serverHost: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  serverUser: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  serverPassword: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  allowedStores: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Store login history as a string and parse it
  loginHistory: {
    type: DataTypes.TEXT, // Store login history as a JSON string
    get() {
      const value = this.getDataValue("loginHistory");
      return value ? JSON.parse(value) : []; // Parse JSON string on retrieval
    },
    set(value) {
      this.setDataValue("loginHistory", JSON.stringify(value)); // Store as JSON string
    },
  },
  planHistory: {
    type: DataTypes.TEXT, // Store as JSON
    get() {
      const value = this.getDataValue("planHistory");
      return value ? JSON.parse(value) : []; // Parse JSON string on retrieval
    },
    set(value) {
      this.setDataValue("planHistory", JSON.stringify(value)); // Store as JSON string
    },
  },
});

// Synchronize the model with the database and handle errors if 'ipospermissions' database doesn't exist
(async () => {
  try {
    // Sync the 'User' model with the database
    await User.sync({ force: false });
    console.log("User table synchronized successfully.");
  } catch (error) {
    // If database 'ipospermissions' doesn't exist, log an error
    console.error("Error synchronizing user table:", error);

    // Check if the error is related to 'Unknown database', attempt to create 'ipospermissions'
    if (
      error.name === "SequelizeConnectionError" &&
      error.parent &&
      error.parent.code === "ER_BAD_DB_ERROR"
    ) {
      console.log("Attempting to create database 'ipospermissions'...");

      try {
        // Attempt to create the 'ipospermissions' database
        await sequelize.query(`CREATE DATABASE IF NOT EXISTS ipospermissions`);
        console.log(
          "Database '' created successfully. Retrying synchronization..."
        );

        // Retry synchronization after creating 'ipospermissions' database
        await User.sync();
        console.log(
          "User table synchronized successfully after creating 'ipospermissions'."
        );
      } catch (createError) {
        console.error(
          "Failed to create 'ipospermissions' database:",
          createError
        );
      }
    }
  }
})();

module.exports = User;
