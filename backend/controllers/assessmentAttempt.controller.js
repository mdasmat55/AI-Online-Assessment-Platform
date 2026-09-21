const Assessment = require("../models/assessment.model");
const AssessmentAttempt = require("../models/assessmentAttempt.model");
const Report = require("../models/report.model");

const { evaluateSubjectiveAnswer } = require("../services/ai.service");

const { generateAssessmentReport } = require("../services/report.service");

const sendError = (res, statusCode, message, error = null) => {
  if (error) {
    console.error(message, error);
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

// --------------------------------------------------
// Start an assessment attempt
// --------------------------------------------------

const startAttempt = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return sendError(res, 404, "Assessment not found");
    }

    if (assessment.user.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "You are not allowed to take this assessment");
    }

    const attempt = await AssessmentAttempt.create({
      assessment: assessment._id,
      candidate: req.user._id,
      answers: [],
      score: 0,
      status: "in-progress",
      startedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Assessment attempt started",
      attempt: {
        _id: attempt._id,
        assessment: assessment._id,
        status: attempt.status,
        startedAt: attempt.startedAt,
      },
    });
  } catch (error) {
    return sendError(res, 500, "Failed to start assessment", error);
  }
};

// --------------------------------------------------
// Save/update an answer
// --------------------------------------------------

const submitAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionId, answer } = req.body;

    if (!questionId) {
      return sendError(res, 400, "Question ID is required");
    }

    const attempt =
      await AssessmentAttempt.findById(attemptId).populate("assessment");

    if (!attempt) {
      return sendError(res, 404, "Assessment attempt not found");
    }

    if (attempt.candidate.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "You are not allowed to access this attempt");
    }

    if (attempt.status !== "in-progress") {
      return sendError(res, 400, "Assessment attempt is not in progress");
    }

    const durationMs = attempt.assessment.duration * 60 * 1000;

    const expiresAt = attempt.startedAt.getTime() + durationMs;

    if (Date.now() >= expiresAt) {
      return sendError(res, 400, "Assessment time has expired");
    }

    const question = attempt.assessment.questions.id(questionId);

    if (!question) {
      return sendError(res, 404, "Question not found in this assessment");
    }

    const answerText = typeof answer === "string" ? answer : "";

    const existingAnswer = attempt.answers.find(
      (item) => item.questionId.toString() === questionId.toString(),
    );

    if (existingAnswer) {
      existingAnswer.answer = answerText;

      existingAnswer.answeredAt = new Date();

      // Reset evaluation because the
      // candidate changed the answer.
      existingAnswer.score = null;
      existingAnswer.feedback = "";
    } else {
      attempt.answers.push({
        questionId,
        answer: answerText,
        score: null,
        feedback: "",
        answeredAt: new Date(),
      });
    }

    await attempt.save();

    return res.status(200).json({
      success: true,
      message: "Answer saved successfully",
    });
  } catch (error) {
    return sendError(res, 500, "Failed to save answer", error);
  }
};

// --------------------------------------------------
// Complete and evaluate the assessment
// --------------------------------------------------

const completeAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt =
      await AssessmentAttempt.findById(attemptId).populate("assessment");

    if (!attempt) {
      return sendError(res, 404, "Assessment attempt not found");
    }

    if (attempt.candidate.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "You are not allowed to access this attempt");
    }

    if (attempt.status !== "in-progress") {
      return sendError(res, 400, "Assessment attempt is not in progress");
    }

    let totalScore = 0;

    // ------------------------------------------
    // Evaluate every submitted answer
    // ------------------------------------------

    for (const answerItem of attempt.answers) {
      const question = attempt.assessment.questions.id(answerItem.questionId);

      if (!question) {
        continue;
      }

      // ------------------------------------------
      // MCQ evaluation
      // ------------------------------------------

      if (question.type === "mcq") {
        if (answerItem.answer && answerItem.answer === question.correctAnswer) {
          answerItem.score = question.marks;

          answerItem.feedback = "Correct answer.";
        } else {
          answerItem.score = 0;

          answerItem.feedback = "Incorrect answer.";
        }

        totalScore += answerItem.score;
      }

      // ------------------------------------------
      // Subjective evaluation
      // ------------------------------------------

      if (question.type === "subjective") {
        if (!answerItem.answer?.trim()) {
          answerItem.score = 0;

          answerItem.feedback = "No answer provided.";
        } else {
          const evaluation = await evaluateSubjectiveAnswer({
            question: question.question,
            answer: answerItem.answer,
            evaluationCriteria: question.evaluationCriteria,
            maxMarks: question.marks,
          });

          answerItem.score = evaluation.score;

          answerItem.feedback = evaluation.feedback;
        }

        totalScore += answerItem.score;
      }
    }

    // ------------------------------------------
    // Complete attempt
    // ------------------------------------------

    attempt.score = totalScore;

    attempt.status = "completed";

    attempt.completedAt = new Date();

    await attempt.save();

    // ------------------------------------------
    // Generate assessment report
    // ------------------------------------------

    let report = await Report.findOne({
      attempt: attempt._id,
    });

    if (!report) {
      try {
        const reportData = await generateAssessmentReport({
          assessment: attempt.assessment,
          attempt,
        });

        report = await Report.create({
          attempt: attempt._id,
          assessment: attempt.assessment._id,
          user: req.user._id,

          overallScore: totalScore,

          totalMarks: attempt.assessment.totalMarks || 0,

          percentage:
            attempt.assessment.totalMarks > 0
              ? Math.round((totalScore / attempt.assessment.totalMarks) * 100)
              : 0,

          mcqScore: reportData.mcqScore,

          mcqTotalMarks: reportData.mcqTotalMarks,

          subjectiveScore: reportData.subjectiveScore,

          subjectiveTotalMarks: reportData.subjectiveTotalMarks,

          topicPerformance: reportData.topicPerformance,

          strengths: reportData.strengths,

          weaknesses: reportData.weaknesses,

          recommendations: reportData.recommendations,

          summary: reportData.summary,
        });
      } catch (reportError) {
        console.error("Assessment report generation failed:", reportError);

        // The assessment itself is already completed.
        // The report can be generated later using
        // POST /api/reports/:attemptId.
      }
    }

    return res.status(200).json({
      success: true,
      message: report
        ? "Assessment completed and report generated successfully"
        : "Assessment completed. Report generation can be retried.",
      result: {
        attemptId: attempt._id,
        score: attempt.score,
        totalMarks: attempt.assessment.totalMarks,
        reportId: report?._id || null,
        reportGenerated: Boolean(report),
      },
    });
  } catch (error) {
    console.error("Assessment evaluation error:", error);

    return sendError(res, 500, "Failed to evaluate assessment", error);
  }
};

// --------------------------------------------------
// Get a specific attempt
// --------------------------------------------------

const getAttemptById = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt =
      await AssessmentAttempt.findById(attemptId).populate("assessment");

    if (!attempt) {
      return sendError(res, 404, "Assessment attempt not found");
    }

    if (attempt.candidate.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "You are not allowed to access this attempt");
    }

    if (!attempt.assessment) {
      return sendError(
        res,
        404,
        "Assessment associated with this attempt was not found",
      );
    }

    const assessment = attempt.assessment;

    // Never expose:
    // - correctAnswer
    // - evaluationCriteria

    const safeQuestions = assessment.questions.map((question) => ({
      _id: question._id,
      question: question.question,
      type: question.type,
      category: question.category,
      difficulty: question.difficulty,
      marks: question.marks,
      options: question.type === "mcq" ? question.options : [],
    }));

    return res.status(200).json({
      success: true,
      attempt: {
        _id: attempt._id,

        assessment: {
          _id: assessment._id,
          title: assessment.title,
          description: assessment.description,
          duration: assessment.duration,
          totalMarks: assessment.totalMarks,
          questions: safeQuestions,
        },

        answers: attempt.answers,

        score: attempt.score,

        status: attempt.status,

        startedAt: attempt.startedAt,

        completedAt: attempt.completedAt,
      },
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch assessment attempt", error);
  }
};

// --------------------------------------------------
// Get all attempts of the logged-in user
// --------------------------------------------------

const getMyAttempts = async (req, res) => {
  try {
    const attempts = await AssessmentAttempt.find({
      candidate: req.user._id,
    })
      .populate("assessment", "title description duration totalMarks createdAt")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      attempts,
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch assessment attempts", error);
  }
};

module.exports = {
  startAttempt,
  submitAnswer,
  completeAttempt,
  getAttemptById,
  getMyAttempts,
};
