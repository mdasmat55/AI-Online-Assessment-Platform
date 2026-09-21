const Assessment = require("../models/assessment.model");
const { sendError } = require("../middlewares/error.middleware");

// Get assessments created by the logged-in user.
// Only safe assessment data is returned.
const getMyAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find(
      {
        user: req.user._id,
      },
      {
        title: 1,
        description: 1,
        duration: 1,
        totalMarks: 1,
        createdAt: 1,
        "questions._id": 1,
        "questions.question": 1,
        "questions.type": 1,
        "questions.category": 1,
        "questions.difficulty": 1,
        "questions.marks": 1,
      },
    ).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      assessments,
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch assessments", error);
  }
};

// Get a single assessment.
// This endpoint is kept for authenticated assessment
// management. Taking an assessment should use the
// attempt endpoint, which removes answer keys.
const getAssessmentById = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return sendError(res, 404, "Assessment not found");
    }

    if (assessment.user.toString() !== req.user._id.toString()) {
      return sendError(
        res,
        403,
        "You are not allowed to access this assessment",
      );
    }

    return res.status(200).json({
      success: true,
      assessment,
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch assessment", error);
  }
};

module.exports = {
  getMyAssessments,
  getAssessmentById,
};
