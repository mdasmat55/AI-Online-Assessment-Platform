const express = require("express");

const { protect } = require("../middlewares/auth.middleware");

const { aiLimiter } = require("../middlewares/rateLimit.middleware");

const {
  createReport,
  getReportByAttemptId,
  getMyReports,
} = require("../controllers/report.controller");

const router = express.Router();

// Get all reports of the logged-in user
router.get("/my-reports", protect, getMyReports);

// Generate report for a completed assessment attempt
router.post("/:attemptId", protect, aiLimiter, createReport);

// Get report for a specific attempt
router.get("/:attemptId", protect, getReportByAttemptId);

module.exports = router;
