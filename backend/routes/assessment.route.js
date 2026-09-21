const express = require("express");

const {
  generateAssessment,
} = require("../controllers/assessmentGeneration.controller");

const {
  getMyAssessments,
  getAssessmentById,
} = require("../controllers/assessment.controller");

const { protect } = require("../middlewares/auth.middleware");
const { aiLimiter } = require("../middlewares/rateLimit.middleware");

const router = express.Router();

// Generate AI assessment
router.post("/generate", protect, aiLimiter, generateAssessment);

// Get user's assessments
router.get("/my-assessments", protect, getMyAssessments);

// Get a single assessment
router.get("/:id", protect, getAssessmentById);

module.exports = router;
