const Assessment = require("../models/assessment.model");
const {
  generateAssessment: generateAssessmentWithAI,
} = require("../services/ai.service");

const sendError = (res, statusCode, message, error = null) => {
  if (error) {
    console.error(message, error);
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

const generateAssessment = async (req, res) => {
  try {
    const { title, topics, difficulty, mcqCount, subjectiveCount, duration } =
      req.body;

    // Validate title
    if (!title || typeof title !== "string" || !title.trim()) {
      return sendError(res, 400, "Assessment title is required");
    }

    const cleanedTitle = title.trim();

    if (cleanedTitle.length > 100) {
      return sendError(
        res,
        400,
        "Assessment title cannot exceed 100 characters",
      );
    }

    // Validate topics
    if (!Array.isArray(topics) || topics.length === 0) {
      return sendError(res, 400, "At least one topic is required");
    }

    if (topics.length > 20) {
      return sendError(res, 400, "You can provide a maximum of 20 topics");
    }

    const cleanedTopics = [
      ...new Set(
        topics
          .filter(
            (topic) => typeof topic === "string" && topic.trim().length > 0,
          )
          .map((topic) => topic.trim()),
      ),
    ];

    if (cleanedTopics.length === 0) {
      return sendError(res, 400, "At least one valid topic is required");
    }

    // Validate difficulty
    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return sendError(res, 400, "Difficulty must be easy, medium, or hard");
    }

    // Validate question counts
    const mcq = Number(mcqCount);
    const subjective = Number(subjectiveCount);

    if (!Number.isInteger(mcq) || mcq < 0 || mcq > 50) {
      return sendError(
        res,
        400,
        "MCQ count must be an integer between 0 and 50",
      );
    }

    if (!Number.isInteger(subjective) || subjective < 0 || subjective > 50) {
      return sendError(
        res,
        400,
        "Subjective count must be an integer between 0 and 50",
      );
    }

    const totalQuestions = mcq + subjective;

    if (totalQuestions === 0) {
      return sendError(res, 400, "At least one question is required");
    }

    if (totalQuestions > 50) {
      return sendError(res, 400, "Total questions cannot exceed 50");
    }

    // Validate duration
    const assessmentDuration = Number(duration);

    if (
      !Number.isInteger(assessmentDuration) ||
      assessmentDuration < 5 ||
      assessmentDuration > 180
    ) {
      return sendError(
        res,
        400,
        "Duration must be an integer between 5 and 180 minutes",
      );
    }

    // Generate assessment using Gemini
    const generatedAssessment = await generateAssessmentWithAI({
      title: cleanedTitle,
      topics: cleanedTopics,
      difficulty,
      mcqCount: mcq,
      subjectiveCount: subjective,
      duration: assessmentDuration,
    });

    // Validate AI response
    if (!generatedAssessment || !Array.isArray(generatedAssessment.questions)) {
      return sendError(res, 500, "AI generated an invalid assessment");
    }

    if (generatedAssessment.questions.length !== totalQuestions) {
      return sendError(
        res,
        500,
        "AI generated an incorrect number of questions",
      );
    }

    const generatedMcqCount = generatedAssessment.questions.filter(
      (question) => question.type === "mcq",
    ).length;

    const generatedSubjectiveCount = generatedAssessment.questions.filter(
      (question) => question.type === "subjective",
    ).length;

    if (generatedMcqCount !== mcq || generatedSubjectiveCount !== subjective) {
      return sendError(
        res,
        500,
        "AI generated an incorrect question distribution",
      );
    }

    // Normalize marks on the backend.
    // MCQ = 1 mark
    // Subjective = 5 marks
    const normalizedQuestions = generatedAssessment.questions.map(
      (question) => {
        if (question.type === "mcq") {
          return {
            ...question,
            marks: 1,
          };
        }

        return {
          ...question,
          marks: 5,
        };
      },
    );

    const totalMarks = normalizedQuestions.reduce(
      (total, question) => total + question.marks,
      0,
    );

    // Store assessment
    const assessment = await Assessment.create({
      user: req.user._id,

      title:
        typeof generatedAssessment.title === "string" &&
        generatedAssessment.title.trim()
          ? generatedAssessment.title.trim()
          : cleanedTitle,

      description:
        typeof generatedAssessment.description === "string"
          ? generatedAssessment.description.trim()
          : "",

      duration: assessmentDuration,

      totalMarks,

      questions: normalizedQuestions,
    });

    return res.status(201).json({
      success: true,
      message: "Assessment generated successfully",
      assessment,
    });
  } catch (error) {
    console.error("Generate assessment controller error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to generate assessment",
    );
  }
};

module.exports = {
  generateAssessment,
};
