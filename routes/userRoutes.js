const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const checkSuperadmin = require("../middleware/superadminMiddleware"); // Import authentication middleware if needed

// Route to register a new user
router.post("/register", userController.register);

// Route to login an existing user
router.post("/login", userController.login);
router.post("/renewPlan", checkSuperadmin, userController.renewPlan);

router.post("/users", userController.create);
// Route to get all users with parsed permissions (requires superadmin access)
router.get("/users", userController.getAllUsers);
// Route to grant group permissions (requires superadmin access)

router.get("/users/:userId", userController.getUserById);
router.put("/users/:userId", userController.updateUser);
router.delete("/users/:userId", userController.deleteUser);
router.put(
  "/users/:userId/groups",
  checkSuperadmin,
  userController.grantGroupPermissions
);
router.post(
  "/users/:userId/shop-access",
  checkSuperadmin,
  userController.addShopAccess
);
router.get(
  "/users/:userId/shop-access",
  checkSuperadmin,
  userController.getShopAccess
);
router.delete(
  "/users/removeShopAccess/:userId",
  checkSuperadmin,
  userController.removeShopAccess
);
router.get(
  "/users/:userId/groups/:groupName/tables",
  checkSuperadmin,
  userController.getGroupTables
);
router.get(
  "/users/getUserGroupsAndShops/:userId",
  checkSuperadmin,
  userController.getUserGroupsAndShops
);
module.exports = router;
