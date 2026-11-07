const {
  generateReport,
} = require("../services/retailWholesaleTier/reportService");

exports.getReport = async (req, res) => {
  try {
    res.json(await generateReport(req.query, req.user));
  } catch (error) {
    console.error("Retail/wholesale tier report failed:", error.message);
    res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "Unable to generate the tier report. Please try again.",
    });
  }
};
