// routes/databaseRoutes.js

const express = require("express");
const router = express.Router();
const databaseController = require("../controllers/databaseController");
const reportController = require("../controllers/reportController");
const checkSuperadmin = require("../middleware/superadminMiddleware");

router.post(
  "/connect-new-server",
  databaseController.connectServerAndGetAllDatabases
);
router.get("/getalldatabases", databaseController.getalldatabases);
router.get("/getallshoptable", databaseController.getallshoptable);
router.get("/getallshop", checkSuperadmin, databaseController.getallshop);
router.get("/:dbname/tables", databaseController.getTables);
router.get("/:dbname/tables/:tablename", databaseController.getTableData);
router.post("/:dbname/tables/:tablename", databaseController.insertTableData);
router.get("/groups/:basename/tables", databaseController.getTablesFromGroup);
router.get(
  "/activedatabase/:baseName",
  checkSuperadmin,
  databaseController.findAllAndActiveDatabase
);
router.get(
  "/activedatabaseMultiple/:baseName",
  checkSuperadmin,
  databaseController.findAllAndActiveDatabaseMultiple
);
router.get("/reportController", reportController.findAll);
router.post("/findreportdate", reportController.findDate);
// Update daily sales report and retrieve the response

// Define route for retrieving department reports for a specific table
router.get(
  "/departmentsSalesReports/:tableName",
  checkSuperadmin,
  async (req, res) => {
    const tableName = req.params.tableName;
    try {
      await reportController.getDepartmentsSalesReports(tableName, req, res);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
); // Define route for retrieving department reports for multiple tables
router.get("/departmentsSalesReports", checkSuperadmin, async (req, res) => {
  const tableNames = req.query.tableNames
    ? req.query.tableNames.split(",")
    : [];
  try {
    await reportController.getMultipleDepartmentsSalesReports(
      tableNames,
      req,
      res
    );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get(
  "/CurrentGRVandGoodsRecivedNotes-Reports",
  checkSuperadmin,
  reportController.getCurrentGRVandGoodsRecivedNotesReports
);

// Route definition for fetching Daily Sales Report for multiple tables
router.get("/daily-sales-reports", checkSuperadmin, async (req, res) => {
  try {
    const tableNames = req.query.tableNames.split(","); // Convert comma-separated string to array

    if (!Array.isArray(tableNames) || tableNames.length === 0) {
      return res.status(400).json({ error: "Table names are required" });
    }

    const response = await reportController.generateReportsForTables(
      req,
      res,
      tableNames
    );

    if (response.success) {
      res.status(200).json(response.reports);
    } else {
      res.status(500).json({ error: response.message });
    }
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
});
router.get(
  "/allTblDataCurrentTran",
  checkSuperadmin,
  reportController.findAllTblDataCurrentTranNames
);
router.get(
  "/allTblDataAdjustment",
  checkSuperadmin,
  reportController.findAllTblDataAdjustment
);
router.get(
  "/allDepartmentWithCategories",
  checkSuperadmin,
  reportController.findAllDepartmentWithCategories
);
router.get(
  "/allTblDataProducts",
  checkSuperadmin,
  reportController.StockOnHandReport
);
router.get(
  "/AdjustmentReports",
  checkSuperadmin,
  reportController.getAdjustmentReport
);
router.get(
  "/allTblDataCashupDet",
  checkSuperadmin,
  reportController.findAllTblDataCashupDet
);
router.get(
  "/currentInvoice/:tableName",
  checkSuperadmin,
  reportController.currentinvoicesReports
);
router.get(
  "/refundReport/:tableName",
  checkSuperadmin,
  reportController.refundReport
);
router.get(
  "/currentCashupReport/:tableName",
  checkSuperadmin,
  reportController.currentCashupReport
);
router.get("/tblReg", checkSuperadmin, reportController.tblReg);
router.get(
  "/accrossShopReport",
  checkSuperadmin,
  reportController.accrossShopReport
);
router.get(
  "/acrossShopProducts",
  checkSuperadmin,
  reportController.acrossStoresProductsReport
);
router.get(
  "/acrossRetailWholesaleByProductReport",
  checkSuperadmin,
  reportController.acrossRetailWholesaleByProductReport
);
router.get(
  "/acrossStockOnHandReport",
  checkSuperadmin,
  reportController.acrossStockOnHandReport
);
router.get(
  "/acrossDailySalesReport",
  checkSuperadmin,
  reportController.acrossDailySalesReport
);

router.get(
  "/tblDataCancelTran",
  checkSuperadmin,
  reportController.findAllTblDataCancelTran
);
router.get(
  "/tblDataPrice",
  checkSuperadmin,
  reportController.findAllTblDataPrice
);
router.get("/tblPayout", checkSuperadmin, reportController.findAllTblPayout);
router.get(
  "/tblDataStockActivity",
  checkSuperadmin,
  reportController.findAllTblDataStockActivity
);
router.get(
  "/tblDataCreditorsTran",
  checkSuperadmin,
  reportController.findAllTblDataCreditorsTran
);
router.get(
  "/tblDataDebtorsTran",
  checkSuperadmin,
  reportController.findAllTblDataDebtorsTran
);
router.get(
  "/CurrentDebtorsAnalysisReport",
  checkSuperadmin,
  reportController.CurrentDebtorsAnalysisReport
);
router.get(
  "/PERVIOUSDebtorsAgeAnalysisReport",
  checkSuperadmin,
  reportController.PERVIOUSDebtorsAgeAnalysisReport
);
router.get(
  "/GetAllPERVIOUSDebtorsAgeAnalysisGroupsAndPreviousAging",
  checkSuperadmin,
  reportController.GetAllPERVIOUSDebtorsAgeAnalysisGroupsAndPreviousAging
);
router.get(
  "/CreditorAnalysisReport",
  checkSuperadmin,
  reportController.CreditorAnalysisReport
);
router.get(
  "/GetAllCreditorAnalysisCmbPreviousAging",
  checkSuperadmin,
  reportController.GetAllCreditorAnalysisCmbPreviousAging
);
router.get(
  "/MinStockLevelReport",
  checkSuperadmin,
  reportController.MinStockLevelReport
);
router.get(
  "/MaxStockLevelReport",
  checkSuperadmin,
  reportController.MaxStockLevelReport
);
router.post("/SixWeekReport", checkSuperadmin, reportController.SixWeekReport);
router.get(
  "/CreditoritemsGrouping",
  checkSuperadmin,
  reportController.CreditoritemsGrouping
);

router.get(
  "/CurrentDebtorsStatementReport",
  checkSuperadmin,
  reportController.CurrentDebtorsStatementReport
);
router.get(
  "/GetAllCurrentDeborsDetails",
  checkSuperadmin,
  reportController.GetAllCurrentDeborsDetails
);
router.get(
  "/PreviousDebtorsStatementReport",
  checkSuperadmin,
  reportController.PreviousDebtorsStatementReport
);
router.get(
  "/GetAllPerviousDeborsDetails",
  checkSuperadmin,
  reportController.GetAllPerviousDeborsDetails
);

router.get(
  "/CurrentCreditorStatementReport",
  checkSuperadmin,
  reportController.CurrentCreditorStatementReport
);
router.get(
  "/GetAllCurrentCreditorDetails",
  checkSuperadmin,
  reportController.GetAllCurrentCreditorDetails
);

router.get(
  "/PreviousCreditorStatementReport",
  checkSuperadmin,
  reportController.PreviousCreditorStatementReport
);
router.get(
  "/GetAllPerviousCreditorDetails",
  checkSuperadmin,
  reportController.GetAllPerviousCreditorDetails
);

router.post(
  "/SaleRepCommissionReport",
  checkSuperadmin,
  reportController.SaleRepCommissionReport
);
router.post(
  "/saleRepCommissionByProductReport",
  checkSuperadmin,
  reportController.saleRepCommissionByProductReport
);
router.get(
  "/CURRENTCreditorsAgeAnalysisReport",
  checkSuperadmin,
  reportController.CURRENTCreditorsAgeAnalysisReport
);
router.get(
  "/CURRENTDebtorsAgeAnalysisReport",
  checkSuperadmin,
  reportController.CURRENTDebtorsAgeAnalysisReport
);
router.get(
  "/GetAllCURRENTDebtorsAgeAnalysisACCTERMSAndAccountSystem",
  checkSuperadmin,
  reportController.GetAllCURRENTDebtorsAgeAnalysisACCTERMSAndAccountSystem
);
router.get(
  "/priceChangeReports",
  checkSuperadmin,
  reportController.priceChangeReport
);
router.get("/payoutReports", checkSuperadmin, reportController.PayoutReport);
router.get("/voidReports", checkSuperadmin, reportController.voidReport);
router.get(
  "/stockActivityReports",
  checkSuperadmin,
  reportController.StockActivityReport
);
router.get(
  "/creditorsTranReports",
  checkSuperadmin,
  reportController.CreditorsTranReport
);
router.get(
  "/creditorsCreditNotesReports",
  checkSuperadmin,
  reportController.CreditorsCreditNotesReport
);
router.get(
  "/creditorsDebitNotesReports",
  checkSuperadmin,
  reportController.CreditorsDebitNotesReport
);
router.get(
  "/creditorsInvoicesReports",
  checkSuperadmin,
  reportController.CreditorsInvoicesReport
);
router.get(
  "/creditorsPaymentsReports",
  checkSuperadmin,
  reportController.CreditorsPaymentsReport
);

router.get(
  "/debtorsTranReports",
  checkSuperadmin,
  reportController.DebtorsTranReport
);
router.get(
  "/debtorsCreditNotesReports",
  checkSuperadmin,
  reportController.DebtorsCreditNotesReport
);
router.get(
  "/debtorsDebitNotesReports",
  checkSuperadmin,
  reportController.DebtorsDebitNotesReport
);
router.get(
  "/DebtorsInvoicesReports",
  checkSuperadmin,
  reportController.DebtorsInvoicesReport
);
router.get(
  "/DebtorsPaymentsReports",
  checkSuperadmin,
  reportController.DebtorsPaymentsReport
);
router.get(
  "/HistoryProductSaleByInvoiceReport",
  checkSuperadmin,
  reportController.HistoryProductSaleByInvoiceReport
);

router.get(
  "/CreditorsValueReports",
  checkSuperadmin,
  reportController.CreditorsValueReport
);
router.get(
  "/DebtorsValueReport",
  checkSuperadmin,
  reportController.DebtorsValueReport
);
router.get(
  "/StockValueReport",
  checkSuperadmin,
  reportController.StockValueReport
);
router.get(
  "/CachupReportByClerkReport/:tableName",
  checkSuperadmin,
  reportController.CachupReportByClerkReport
);
router.get(
  "/SaleInvoicesByClerkReports/:tableName",
  checkSuperadmin,
  reportController.SaleInvoicesByClerkReports
);
router.get(
  "/InvoicesByStationReports/:tableName",
  checkSuperadmin,
  reportController.InvoicesByStationReports
);

router.get(
  "/FinancialSummaryReport",
  checkSuperadmin,
  reportController.FinancialSummaryReport
);
router.get(
  "/GrvDataFunReport",
  checkSuperadmin,
  reportController.GrvDataFunReport
);

module.exports = router;
