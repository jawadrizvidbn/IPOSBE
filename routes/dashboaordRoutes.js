const express = require("express");
const checkSuperadmin = require("../middleware/superadminMiddleware");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");

router.get(
  "/sales-overview",
  checkSuperadmin,
  dashboardController.salesOverview
);

module.exports = router;
