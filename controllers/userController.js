const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const checkSuperadmin = require("../middleware/superadminMiddleware");
const { Sequelize, QueryTypes } = require("sequelize");
const sequelize = require("../models/databaseModel");
const createSequelizeInstance = require("../utils/sequelizeInstance");

const LZString = require("lz-string");
const { serialize } = require("cookie");
const Plan = require("../models/plan.model");

User.belongsTo(Plan, { foreignKey: "plan" });
Plan.hasOne(User, { foreignKey: "plan" });

// Define default report permissions
const reportPermissions = {
  data: [
    // {
    //   "fieldName": "Daily Sales Report",
    //   "allow": true,
    //   "date": true,
    //   "paymentTypes": {
    //     "paymenttype": true,
    //     "vatpercentage": true,
    //     "totalInclSelling": true,
    //     "totalExclSelling": true,
    //     "totalExclCost": true,
    //     "totalInclCost": true,
    //     "totalVAT": true,
    //     "dayProfit": true,
    //     "splitTenderAmount": true
    //   },
    //   "totals": {
    //     "totalInclSelling": true,
    //     "totalExclSelling": true,
    //     "totalExclCost": true,
    //     "totalInclCost": true,
    //     "totalVAT": true,
    //     "dayProfit": true
    //   },
    //   "overallTotals": {
    //     "totalInclSelling": true,
    //     "totalExclSelling": true,
    //     "totalExclCost": true,
    //     "totalInclCost": true,
    //     "totalVAT": true,
    //     "dayProfit": true,
    //     "totalCash": true,
    //     "totalCard": true
    //   },
    //   "totalCash": true,
    //   "totalCard": true,
    //   "firstRecordDateTime": true,
    //   "lastRecordDateTime": true
    // },
    // {
    //   "fieldName": "Departments Sales Report",
    //   "allow": true,
    //   "date": true,
    //   "paymentTypes": {
    //     "paymenttype": true,
    //     "vatpercentage": true,
    //     "totalInclSelling": true,
    //     "totalExclSelling": true,
    //     "totalExclCost": true,
    //     "totalInclCost": true,
    //     "totalVAT": true,
    //     "dayProfit": true,
    //     "splitTenderAmount": true
    //   },
    //   "totals": {
    //     "totalInclSelling": true,
    //     "totalExclSelling": true,
    //     "totalExclCost": true,
    //     "totalInclCost": true,
    //     "totalVAT": true,
    //     "dayProfit": true
    //   },
    //   "overallTotals": {
    //     "totalInclSelling": true,
    //     "totalExclSelling": true,
    //     "totalExclCost": true,
    //     "totalInclCost": true,
    //     "totalVAT": true,
    //     "dayProfit": true,
    //     "totalCash": true,
    //     "totalCard": true
    //   },
    //   "totalCash": true,
    //   "totalCard": true,
    //   "firstRecordDateTime": true,
    //   "lastRecordDateTime": true
    // }
  ],
};

// Generate JWT token with compressed permissions
const generateToken = (userId, permissions) => {
  // Combine user permissions with static report permissions
  const combinedPermissions = {
    userPermissions: permissions.userPermissions || [],
    staticReportPermissions: reportPermissions,
  };

  // Compress the combined permissions data
  const compressedPermissions = LZString.compressToBase64(
    JSON.stringify(combinedPermissions)
  );
  return jwt.sign(
    { id: userId, permissions: compressedPermissions },
    "your-secret-key",
    { expiresIn: "24h" }
  );
};

exports.register = async (req, res) => {
  try {
    const {
      name,
      password,
      email,
      role,
      permissions = [],
      plan = "defaultPlan", // Default plan if not provided
      planActive = false, // Default plan active status
      planStartDate = null, // Default start date
      planEndDate = null, // Default end date
    } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Combine provided permissions
    const combinedPermissions = {
      userPermissions: permissions,
    };

    // Create the new user
    const newUser = await User.create({
      name,
      email,
      role,
      permissions: JSON.stringify(combinedPermissions),
      password: hashedPassword,
      plan,
      planActive,
      planStartDate,
      planEndDate,
    });

    // Generate a token for the new user
    const token = generateToken(newUser.id, combinedPermissions); // Include combined permissions in token
    // Respond with the new user and token
    res.status(201).json({ user: newUser, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    // Handle case where user is not found
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    // Handle case where password does not match
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if the user is superadmin
    if (user.role === "superadmin") {
      console.log("Superadmin login - skipping plan validation");
      // Generate token and respond for superadmin
      const token = generateToken(user.id, { userPermissions: [] }); // Adjust permissions if needed

      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: [], // Or set relevant superadmin permissions
        },
        token,
      });
    }

    // Check plan validity for other roles
    const currentDate = new Date();
    const isPlanActive =
      user.planActive &&
      user.planStartDate <= currentDate &&
      (!user.planEndDate || user.planEndDate >= currentDate);

    if (!isPlanActive) {
      return res
        .status(403)
        .json({ message: "Your plan is inactive or has expired" });
    }

    // Initialize combined permissions
    let combinedPermissions = {
      userPermissions: [],
      staticReportPermissions: reportPermissions,
    };

    // Parse user.permissions if it exists
    if (user.permissions) {
      try {
        combinedPermissions = JSON.parse(user.permissions);
      } catch (error) {
        console.error("Error parsing user permissions:", error);
      }
    }

    // Filter tables with access: true
    const filteredPermissions = combinedPermissions.userPermissions.map(
      (permission) => {
        let filteredTables = [];

        if (permission.tables && Array.isArray(permission.tables)) {
          filteredTables = permission.tables.map((table) => ({
            group: table.group,
            tables: table.tables.filter((tbl) => tbl.access === true),
          }));
        }

        return {
          group: permission.group,
          shopName: permission.shopName,
          tables: filteredTables,
        };
      }
    );

    // Generate token including combined permissions
    const token = generateToken(user.id, combinedPermissions);

    // Send response with user details and token
    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: filteredPermissions,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // Check if the request has a superadmin flag set by the middleware
    // if (!req.superadmin) {
    //   return res.status(403).json({
    //     message: "Access denied. Only superadmins can grant permissions.",
    //   });
    // }
    const users = await User.findAll({
      include: [
        {
          model: Plan,
        },
      ],
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    // Parse permissions for each user
    const usersWithParsedPermissions = users.map((user) => {
      let parsedPermissions = {};
      try {
        parsedPermissions = JSON.parse(user.permissions); // Attempt to parse permissions
      } catch (error) {
        // Handle JSON parsing error (e.g., if permissions field is empty or invalid JSON)
        console.error(`Error parsing permissions for user ${user.id}:`, error);
      }

      const planDetails = user.Plan || null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: planDetails || user?.plan,
        planActive: user.planActive,
        planStartDate: user.planStartDate,
        planEndDate: user.planEndDate,
        permissions: parsedPermissions, // Use parsedPermissions or default to an empty object
      };
    });

    res.status(200).json(usersWithParsedPermissions);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to retrieve users" });
  }
};

exports.renewPlan = async (req, res) => {
  try {
    if (!req.superadmin) {
      return res.status(403).json({
        message: "Access denied. Only superadmins can grant permissions.",
      });
    }
    const { userId, newPlan, newPlanEndDate } = req.body;

    // Find the user by ID
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare the new plan history entry
    const currentPlanDetails = {
      plan: user.plan,
      planActive: user.planActive,
      planStartDate: user.planStartDate,
      planEndDate: user.planEndDate,
    };

    // Update the user's plan
    user.planHistory = [...user.planHistory, currentPlanDetails]; // Add current plan to history
    user.plan = newPlan; // Update to the new plan
    user.planActive = true; // Activate the new plan
    user.planStartDate = new Date(); // Set the start date to now
    user.planEndDate = newPlanEndDate; // Set the new end date

    // Save the updated user details
    await user.save();

    res.status(200).json({ message: "Plan renewed successfully", user });
  } catch (error) {
    console.error("Error renewing plan:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getShopAccess = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user by userId
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Parse existing permissions and handle potential errors
    let existingPermissions = {};
    try {
      existingPermissions = user.permissions
        ? JSON.parse(user.permissions)
        : {};
    } catch (err) {
      console.error(
        "Error parsing existing permissions:",
        err,
        "Raw permissions:",
        user.permissions
      );
      return res
        .status(500)
        .json({ message: "Error processing user permissions" });
    }

    // Respond with the user's shop access permissions
    res.status(200).json({
      message: "Shop access retrieved successfully",
      permissions: existingPermissions.userPermissions || [],
    });
  } catch (error) {
    console.error("Error retrieving shop access:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Add shop access to a user
exports.addShopAccess = async (req, res) => {
  try {
    // Check if the request has a superadmin flag set by the middleware
    if (!req.superadmin) {
      return res.status(403).json({
        message: "Access denied. Only superadmins can grant permissions.",
      });
    }
    const { userId } = req.params;
    const { shopAccess } = req.body;

    // Validate if shopAccess array is provided
    if (!Array.isArray(shopAccess) || shopAccess.length === 0) {
      return res.status(400).json({
        message: "Shop access array is required and should not be empty",
      });
    }

    // Validate the format of each shop access object
    for (const access of shopAccess) {
      if (!access.group || !access.shopName) {
        return res.status(400).json({
          message: "Each shop access must contain a group and a shopName",
        });
      }
    }

    // Find the user by userId
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if all requested groups exist
    const results = await sequelize.query("SHOW DATABASES", {
      type: QueryTypes.SELECT,
    });
    const databases = results.map((row) => row.Database || row.database);

    const availableGroups = databases.reduce((acc, dbName) => {
      if (!dbName) return acc;
      const baseName = dbName.replace(
        /(debtors|history|host|master|stockmaster)$/i,
        ""
      );
      if (!acc.includes(baseName)) {
        acc.push(baseName);
      }
      return acc;
    }, []);

    const invalidGroups = shopAccess
      .filter((access) => !availableGroups.includes(access.group))
      .map((access) => access.group);

    if (invalidGroups.length > 0) {
      return res
        .status(400)
        .json({ message: `Invalid groups: ${invalidGroups.join(", ")}` });
    }

    // Parse existing permissions and handle potential errors
    let existingPermissions = {};
    try {
      existingPermissions = user.permissions
        ? JSON.parse(user.permissions)
        : {};
      if (
        !existingPermissions.userPermissions ||
        !Array.isArray(existingPermissions.userPermissions)
      ) {
        existingPermissions.userPermissions = [];
      }
      if (
        !existingPermissions.staticReportPermissions ||
        !Array.isArray(existingPermissions.staticReportPermissions)
      ) {
        existingPermissions.staticReportPermissions = [];
      }
    } catch (err) {
      console.error(
        "Error parsing existing permissions:",
        err,
        "Raw permissions:",
        user.permissions
      );
      return res
        .status(500)
        .json({ message: "Error processing user permissions" });
    }

    // Log reportPermissions to ensure it is correct
    console.log("Report Permissions:", reportPermissions);

    // Merge new shop access with existing user permissions
    shopAccess.forEach((newAccess) => {
      const existingGroupIndex = existingPermissions.userPermissions.findIndex(
        (perm) =>
          perm.group === newAccess.group && perm.shopName === newAccess.shopName
      );
      if (existingGroupIndex !== -1) {
        // Update existing group access
        existingPermissions.userPermissions[existingGroupIndex] = {
          ...existingPermissions.userPermissions[existingGroupIndex],
          ...newAccess,
        };
      } else {
        // Add new group access with default staticReportPermissions
        existingPermissions.userPermissions.push({
          ...newAccess,
          staticReportPermissions: reportPermissions, // Assign object directly
        });
      }
    });

    // Save the updated permissions to the user's permissions field
    user.permissions = JSON.stringify(existingPermissions);
    await user.save();

    // Respond with the updated user object including permissions
    res.status(200).json({
      message: "Shop access granted successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: existingPermissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error granting shop access:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.removeShopAccess = async (req, res) => {
  try {
    // Check if the request has a superadmin flag set by the middleware
    if (!req.superadmin) {
      return res.status(403).json({
        message: "Access denied. Only superadmins can remove permissions.",
      });
    }

    const { userId } = req.params;
    const { shopAccess } = req.body;

    // Validate if shopAccess array is provided
    if (!Array.isArray(shopAccess) || shopAccess.length === 0) {
      return res.status(400).json({
        message: "Shop access array is required and should not be empty",
      });
    }

    // Validate the format of each shop access object
    for (const access of shopAccess) {
      if (!access.group || !access.shopName) {
        return res.status(400).json({
          message: "Each shop access must contain a group and a shopName",
        });
      }
    }

    // Find the user by userId
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Parse existing permissions and handle potential errors
    let existingPermissions = {};
    try {
      existingPermissions = user.permissions
        ? JSON.parse(user.permissions)
        : {};
      if (
        !existingPermissions.userPermissions ||
        !Array.isArray(existingPermissions.userPermissions)
      ) {
        existingPermissions.userPermissions = [];
      }
    } catch (err) {
      console.error(
        "Error parsing existing permissions:",
        err,
        "Raw permissions:",
        user.permissions
      );
      return res
        .status(500)
        .json({ message: "Error processing user permissions" });
    }

    // Remove specified shop access
    shopAccess.forEach((accessToRemove) => {
      existingPermissions.userPermissions =
        existingPermissions.userPermissions.filter(
          (perm) =>
            !(
              perm.group === accessToRemove.group &&
              perm.shopName === accessToRemove.shopName
            )
        );
    });

    // Save the updated permissions to the user's permissions field
    user.permissions = JSON.stringify(existingPermissions);
    await user.save();

    // Respond with the updated user object including permissions
    res.status(200).json({
      message: "Shop access removed successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: existingPermissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error removing shop access:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.grantGroupPermissions = async (req, res) => {
  try {
    if (!req.superadmin) {
      return res.status(403).json({
        message: "Access denied. Only superadmins can grant permissions.",
      });
    }

    const { userId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        message: "Permissions array is required and should not be empty",
      });
    }

    // Validate permissions
    for (const perm of permissions) {
      if (!perm.group || !perm.shopName) {
        return res.status(400).json({
          message: "Each permission must contain a group and a shopName",
        });
      }
      if (
        perm.staticReportPermissions &&
        typeof perm.staticReportPermissions !== "object"
      ) {
        return res.status(400).json({
          message: "Static report permissions must be an object if provided",
        });
      }
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Retrieve available groups from the databases
    const results = await sequelize.query("SHOW DATABASES", {
      type: QueryTypes.SELECT,
    });
    const databases = results.map((row) => row.Database || row.database);

    const availableGroups = databases.reduce((acc, dbName) => {
      if (!dbName) return acc;
      const baseName = dbName.replace(
        /(debtors|history|host|master|stockmaster)$/i,
        ""
      );
      if (!acc.includes(baseName)) {
        acc.push(baseName);
      }
      return acc;
    }, []);

    // Check for invalid groups
    const invalidGroups = permissions
      .filter((perm) => !availableGroups.includes(perm.group))
      .map((perm) => perm.group);

    if (invalidGroups.length > 0) {
      return res
        .status(400)
        .json({ message: `Invalid groups: ${invalidGroups.join(", ")}` });
    }

    let existingPermissions = { userPermissions: [] };
    try {
      if (user.permissions) {
        existingPermissions = JSON.parse(user.permissions);
        if (!Array.isArray(existingPermissions.userPermissions)) {
          existingPermissions.userPermissions = [];
        }
      }
    } catch (err) {
      console.error("Error parsing existing permissions:", err);
      return res
        .status(500)
        .json({ message: "Error processing user permissions" });
    }

    // Build a map of existing permissions for easy update
    const existingPermissionsMap = new Map(
      existingPermissions.userPermissions.map((perm) => [
        `${perm.group}:${perm.shopName}`,
        perm,
      ])
    );

    // Update permissions
    permissions.forEach((newPerm) => {
      const key = `${newPerm.group}:${newPerm.shopName}`;
      const existingPerm = existingPermissionsMap.get(key) || {};

      // Ensure staticReportPermissions is always an array
      const existingReports = Array.isArray(
        existingPerm.staticReportPermissions?.data
      )
        ? existingPerm.staticReportPermissions.data
        : [];
      const newReports = Array.isArray(newPerm.staticReportPermissions?.data)
        ? newPerm.staticReportPermissions.data
        : [newPerm.staticReportPermissions];

      // Merge reports and remove unwanted fields
      const mergedReports = existingReports
        .map((existingReport) => {
          const newReport = newReports.find(
            (report) => report.fieldName === existingReport.fieldName
          );
          return newReport
            ? cleanReportFields({ ...existingReport, ...newReport })
            : existingReport;
        })
        .concat(
          newReports
            .filter(
              (report) =>
                !existingReports.some(
                  (existingReport) =>
                    existingReport.fieldName === report.fieldName
                )
            )
            .map(cleanReportFields)
        );

      existingPermissionsMap.set(key, {
        ...existingPerm,
        ...newPerm,
        staticReportPermissions: {
          data: mergedReports,
        },
      });
    });

    existingPermissions.userPermissions = Array.from(
      existingPermissionsMap.values()
    );

    // Save updated permissions
    user.permissions = JSON.stringify(existingPermissions);
    await user.save();

    res.status(200).json({
      message: "Group permissions updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: existingPermissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error granting group permissions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Function to clean up unwanted fields from report

function cleanReportFields(report) {
  const cleanedReport = { ...report };
  // Define fields that you want to remove
  const unwantedFields = ["paymentTypes-paymenttype"];

  unwantedFields.forEach((field) => {
    delete cleanedReport[field];
  });

  return cleanedReport;
}
// Function to fetch tables for a specific group
const fetchTablesForGroup = async (groupName) => {
  try {
    const results = await sequelize.query("SHOW DATABASES", {
      type: QueryTypes.SELECT,
    });
    const databases = results.map((row) => row.Database || row.database);

    const groupDatabases = databases.filter((dbName) => {
      const baseName = dbName.replace(
        /(debtors|history|host|master|stockmaster)$/i,
        ""
      );
      return baseName === groupName;
    });

    const promises = groupDatabases.map(async (dbName) => {
      const dbInstance = createSequelizeInstance(dbName); // Function to create Sequelize instance for database
      const tableResults = await dbInstance.query(
        `SHOW TABLES FROM \`${dbName}\``,
        { type: QueryTypes.SELECT }
      );
      return {
        database: dbName,
        tables: tableResults.map((row) => Object.values(row)[0]),
      };
    });

    const groupTables = await Promise.all(promises);
    return groupTables;
  } catch (error) {
    console.error(`Error fetching tables for group '${groupName}':`, error);
    return []; // Return empty array or handle error as per your application's logic
  }
};
// Get tables for a group with user's permissions
exports.getGroupTables = async (req, res) => {
  const { groupName, userId } = req.params;
  if (!groupName || !userId) {
    return res
      .status(400)
      .json({ message: "Group name and user ID are required" });
  }
  try {
    const groupTables = await fetchTablesForGroup(groupName);
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userPermissions = JSON.parse(user.permissions || "[]");
    const filteredPermissions = userPermissions.filter(
      (permission) => permission.group === groupName
    );
    const accessibleTables = groupTables.map((group) => ({
      database: group.database,
      tables: group.tables.map((table) => ({
        tableName: table,
        access: filteredPermissions.some((perm) =>
          perm.tables.some(
            (tbl) =>
              tbl.group === group.database &&
              tbl.tables.some((t) => t.tableName === table && t.access === true)
          )
        ),
      })),
    }));

    res.status(200).json(accessibleTables);
  } catch (error) {
    console.error(`Error fetching tables for group '${groupName}':`, error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get groups and shop names based on user ID
exports.getUserGroupsAndShops = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    if (!req.superadmin) {
      return res.status(403).json({
        message: "Access denied. Only superadmins can remove permissions.",
      });
    }
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Parse user.permissions
    let parsedPermissions;
    try {
      parsedPermissions = JSON.parse(user.permissions || "{}");
    } catch (err) {
      console.error(
        `Error parsing user permissions for user '${userId}':`,
        err
      );
      return res
        .status(500)
        .json({ message: "Error processing user permissions" });
    }

    // Extract and validate userPermissions
    const userPermissions = Array.isArray(parsedPermissions.userPermissions)
      ? parsedPermissions.userPermissions
      : [];

    // Map over the userPermissions array
    const groupsAndShops = userPermissions.map((permission) => ({
      group: permission.group,
      shopName: permission.shopName,
    }));

    res.status(200).json(groupsAndShops);
  } catch (error) {
    console.error(
      `Error fetching groups and shops for user '${userId}':`,
      error
    );
    res.status(500).json({ message: "Internal server error" });
  }
};
