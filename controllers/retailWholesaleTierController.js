const {
  generateReport,
} = require("../services/retailWholesaleTier/reportService");

// Translate the tier-report service result into an HTTP response.
exports.getReport = async (req, res) => {
  // Generate results using the authenticated user attached by existing middleware.
  try {
    res.json(await generateReport(req.query, req.user));
  } catch (error) {
    // Expose validation messages while keeping internal database errors private.
    console.error("Retail/wholesale tier report failed:", error.message);
    res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "Unable to generate the tier report. Please try again.",
    });
  }
};
