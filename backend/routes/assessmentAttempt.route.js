const express = require("express");

const {
  startAttempt,
  submitAnswer,
  completeAttempt,
  getAttemptById,
  getMyAttempts,
} = require("../controllers/assessmentAttempt.controller");

const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/:assessmentId/start", protect, startAttempt);

router.post("/:attemptId/answer", protect, submitAnswer);

router.post("/:attemptId/complete", protect, completeAttempt);

router.get("/my-attempts", protect, getMyAttempts);

router.get("/:attemptId", protect, getAttemptById);

module.exports = router;
