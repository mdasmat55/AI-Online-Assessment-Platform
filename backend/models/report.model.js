const mongoose = require("mongoose");

const topicPerformanceSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxScore: {
      type: Number,
      default: 0,
      min: 0,
    },

    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { _id: false },
);

const reportSchema = new mongoose.Schema(
  {
    attempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentAttempt",
      required: true,
      unique: true,
    },

    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    overallScore: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    mcqScore: {
      type: Number,
      default: 0,
      min: 0,
    },

    mcqTotalMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    subjectiveScore: {
      type: Number,
      default: 0,
      min: 0,
    },

    subjectiveTotalMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    topicPerformance: {
      type: [topicPerformanceSchema],
      default: [],
    },

    strengths: {
      type: [String],
      default: [],
    },

    weaknesses: {
      type: [String],
      default: [],
    },

    recommendations: {
      type: [String],
      default: [],
    },

    summary: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Report", reportSchema);
