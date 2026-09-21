const AssessmentAttempt = require("../models/assessmentAttempt.model");
const Assessment = require("../models/assessment.model");
const Report = require("../models/report.model");

const { generateAssessmentReport } = require("../services/report.service");

const createReport = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await AssessmentAttempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Assessment attempt not found",
      });
    }

    if (attempt.candidate.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this assessment attempt",
      });
    }

    if (attempt.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Complete the assessment before generating a report",
      });
    }

    const assessment = await Assessment.findById(attempt.assessment);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found",
      });
    }

    const existingReport = await Report.findOne({
      attempt: attempt._id,
    });

    if (existingReport) {
      return res.status(200).json({
        success: true,
        message: "Report already exists",
        report: existingReport,
      });
    }

    const reportData = await generateAssessmentReport({
      assessment,
      attempt,
    });

    if (!reportData || typeof reportData !== "object") {
      return res.status(500).json({
        success: false,
        message: "AI returned an invalid assessment report",
      });
    }

    const report = await Report.create({
      attempt: attempt._id,
      assessment: assessment._id,
      user: req.user._id,

      overallScore: Number(reportData.overallScore) || attempt.score || 0,

      totalMarks: assessment.totalMarks || 0,

      percentage:
        Number(reportData.percentage) ||
        (assessment.totalMarks
          ? Math.round(((attempt.score || 0) / assessment.totalMarks) * 100)
          : 0),

      mcqScore: Number(reportData.mcqScore) || 0,

      mcqTotalMarks: Number(reportData.mcqTotalMarks) || 0,

      subjectiveScore: Number(reportData.subjectiveScore) || 0,

      subjectiveTotalMarks: Number(reportData.subjectiveTotalMarks) || 0,

      topicPerformance: Array.isArray(reportData.topicPerformance)
        ? reportData.topicPerformance
        : [],

      strengths: Array.isArray(reportData.strengths)
        ? reportData.strengths
        : [],

      weaknesses: Array.isArray(reportData.weaknesses)
        ? reportData.weaknesses
        : [],

      recommendations: Array.isArray(reportData.recommendations)
        ? reportData.recommendations
        : [],

      summary:
        typeof reportData.summary === "string" ? reportData.summary.trim() : "",
    });

    return res.status(201).json({
      success: true,
      message: "Assessment report generated successfully",
      report,
    });
  } catch (error) {
    if (error.code === 11000) {
      try {
        const existingReport = await Report.findOne({
          attempt: req.params.attemptId,
        });

        if (existingReport) {
          return res.status(200).json({
            success: true,
            message: "Report already exists",
            report: existingReport,
          });
        }
      } catch (lookupError) {
        console.error("Failed to retrieve existing report:", lookupError);
      }
    }

    console.error("Assessment report generation error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate assessment report",
    });
  }
};

const getReportByAttemptId = async (req, res) => {
  try {
    const report = await Report.findOne({
      attempt: req.params.attemptId,
      user: req.user._id,
    }).populate("assessment", "title description duration totalMarks");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Assessment report not found",
      });
    }

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Get assessment report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch assessment report",
    });
  }
};

const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({
      user: req.user._id,
    })
      .populate("assessment", "title description duration totalMarks")
      .populate("attempt", "score status startedAt completedAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Get my reports error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch assessment reports",
    });
  }
};

module.exports = {
  createReport,
  getReportByAttemptId,
  getMyReports,
};
