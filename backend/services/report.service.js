const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableGeminiError = (error) => {
  const status = error?.status || error?.code;
  const message = String(error?.message || "").toLowerCase();

  return (
    status === 503 ||
    status === "503" ||
    status === "UNAVAILABLE" ||
    message.includes("503") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("temporarily unavailable")
  );
};

const generateReportWithRetry = async (prompt) => {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `Generating assessment report with Gemini (${attempt}/${MAX_RETRIES})...`,
      );

      return await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
    } catch (error) {
      lastError = error;

      console.error(
        `Gemini report request failed (${attempt}/${MAX_RETRIES}):`,
        error?.message || error,
      );

      if (!isRetryableGeminiError(error) || attempt === MAX_RETRIES) {
        throw error;
      }

      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);

      console.log(
        `Retrying Gemini report request in ${delay / 1000} seconds...`,
      );

      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * Creates a report without Gemini.
 *
 * This is used when Gemini is temporarily unavailable.
 * All numerical values are calculated from the actual
 * assessment and attempt data.
 */
const generateFallbackReport = ({ assessment, attempt, questions }) => {
  let mcqScore = 0;
  let mcqTotalMarks = 0;

  let subjectiveScore = 0;
  let subjectiveTotalMarks = 0;

  const topicMap = new Map();

  for (const item of questions) {
    const score = Number(item.score) || 0;
    const marks = Number(item.marks) || 0;

    if (item.type === "mcq") {
      mcqScore += score;
      mcqTotalMarks += marks;
    } else if (item.type === "subjective") {
      subjectiveScore += score;
      subjectiveTotalMarks += marks;
    }

    const topic = item.category || "General";

    if (!topicMap.has(topic)) {
      topicMap.set(topic, {
        topic,
        score: 0,
        maxScore: 0,
      });
    }

    const topicData = topicMap.get(topic);

    topicData.score += score;
    topicData.maxScore += marks;
  }

  const topicPerformance = Array.from(topicMap.values()).map((item) => ({
    topic: item.topic,
    score: item.score,
    maxScore: item.maxScore,
    percentage:
      item.maxScore > 0 ? Math.round((item.score / item.maxScore) * 100) : 0,
  }));

  const sortedTopics = [...topicPerformance].sort(
    (a, b) => b.percentage - a.percentage,
  );

  const strengths = [];
  const weaknesses = [];

  sortedTopics.forEach((topic) => {
    if (topic.percentage >= 70) {
      strengths.push(`${topic.topic}: ${topic.percentage}% performance`);
    }

    if (topic.percentage < 50) {
      weaknesses.push(`${topic.topic}: ${topic.percentage}% performance`);
    }
  });

  if (strengths.length === 0) {
    strengths.push(
      "Continue practicing consistently across the assessment topics.",
    );
  }

  if (weaknesses.length === 0) {
    weaknesses.push(
      "Continue practicing to maintain consistency across all topics.",
    );
  }

  const recommendations = [
    "Review the questions where marks were lost and understand the evaluator feedback.",
    "Practice more questions from the weaker topics.",
    "Attempt timed assessments regularly to improve accuracy under time constraints.",
  ];

  const actualScore = Number(attempt.score) || 0;
  const totalMarks = Number(assessment.totalMarks) || 0;

  const percentage =
    totalMarks > 0 ? Math.round((actualScore / totalMarks) * 100) : 0;

  return {
    overallScore: actualScore,
    totalMarks,
    percentage,

    mcqScore,
    mcqTotalMarks,

    subjectiveScore,
    subjectiveTotalMarks,

    topicPerformance,

    strengths,
    weaknesses,
    recommendations,

    summary: `You scored ${actualScore} out of ${totalMarks} marks, which is ${percentage}%. The report is based on your actual assessment responses, scores, and topic-wise performance.`,
  };
};

const generateAssessmentReport = async ({ assessment, attempt }) => {
  const questions = assessment.questions.map((question) => {
    const answer = attempt.answers.find(
      (item) => item.questionId.toString() === question._id.toString(),
    );

    return {
      question: question.question,
      type: question.type,
      category: question.category,
      marks: question.marks,
      answer: answer?.answer || "",
      score: answer?.score ?? 0,
      feedback: answer?.feedback || "",
    };
  });

  /*
   * First calculate the numerical values ourselves.
   *
   * We don't depend on Gemini for these values because
   * the backend already has the real assessment result.
   */
  let mcqScore = 0;
  let mcqTotalMarks = 0;

  let subjectiveScore = 0;
  let subjectiveTotalMarks = 0;

  const topicMap = new Map();

  for (const item of questions) {
    const score = Number(item.score) || 0;
    const marks = Number(item.marks) || 0;

    if (item.type === "mcq") {
      mcqScore += score;
      mcqTotalMarks += marks;
    } else if (item.type === "subjective") {
      subjectiveScore += score;
      subjectiveTotalMarks += marks;
    }

    const topic = item.category || "General";

    if (!topicMap.has(topic)) {
      topicMap.set(topic, {
        topic,
        score: 0,
        maxScore: 0,
      });
    }

    const topicData = topicMap.get(topic);

    topicData.score += score;
    topicData.maxScore += marks;
  }

  const calculatedTopicPerformance = Array.from(topicMap.values()).map(
    (item) => ({
      topic: item.topic,
      score: item.score,
      maxScore: item.maxScore,
      percentage:
        item.maxScore > 0 ? Math.round((item.score / item.maxScore) * 100) : 0,
    }),
  );

  const prompt = `
You are an expert online assessment performance analyst.

Analyze the completed assessment below and generate a useful performance report.

ASSESSMENT:
Title: ${assessment.title}
Difficulty: ${assessment.questions[0]?.difficulty || "medium"}
Total Marks: ${assessment.totalMarks}

QUESTIONS AND ANSWERS:
${questions
  .map(
    (item, index) => `
Question ${index + 1}
Type: ${item.type}
Topic: ${item.category || "General"}
Question: ${item.question}
Candidate Answer: ${item.answer || "Not answered"}
Score: ${item.score}/${item.marks}
Evaluator Feedback: ${item.feedback || "No feedback"}
`,
  )
  .join("\n-------------------\n")}

Generate a performance report.

IMPORTANT RULES:

1. Base the report ONLY on the provided questions,
   answers, scores and feedback.

2. Do not invent information about the candidate.

3. Identify the candidate's strongest areas.

4. Identify weak areas that need improvement.

5. Give practical and actionable recommendations.

6. Analyze performance by topic/category.

7. Separate MCQ performance from subjective performance.

8. The overall score and percentage should reflect
   the actual assessment result.

9. Keep the report concise and useful.

10. Return ONLY valid JSON.

IMPORTANT:
The backend has already calculated the actual numerical
MCQ, subjective and topic scores.

Do not invent or change these values.

Return exactly this structure:

{
  "mcqScore": ${mcqScore},
  "mcqTotalMarks": ${mcqTotalMarks},
  "subjectiveScore": ${subjectiveScore},
  "subjectiveTotalMarks": ${subjectiveTotalMarks},
  "topicPerformance": ${JSON.stringify(calculatedTopicPerformance)},
  "strengths": [
    "Strength 1",
    "Strength 2"
  ],
  "weaknesses": [
    "Weakness 1",
    "Weakness 2"
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "summary": "Short overall performance summary"
}
`;

  let result;

  /*
   * Try Gemini first.
   */
  try {
    const response = await generateReportWithRetry(prompt);

    if (!response?.text) {
      throw new Error("Gemini returned an empty report");
    }

    try {
      result = JSON.parse(response.text);
    } catch (error) {
      throw new Error("Gemini returned invalid report JSON");
    }

    if (!result || typeof result !== "object") {
      throw new Error("Gemini returned an invalid report");
    }

    if (!Array.isArray(result.strengths)) {
      throw new Error("Invalid strengths data");
    }

    if (!Array.isArray(result.weaknesses)) {
      throw new Error("Invalid weaknesses data");
    }

    if (!Array.isArray(result.recommendations)) {
      throw new Error("Invalid recommendations data");
    }

    if (typeof result.summary !== "string") {
      throw new Error("Invalid report summary");
    }

    console.log("Gemini assessment report generated successfully.");
  } catch (error) {
    /*
     * Gemini failure should NOT make the assessment report
     * unavailable.
     */
    console.error(
      "Gemini report generation failed. Using fallback report:",
      error?.message || error,
    );

    result = generateFallbackReport({
      assessment,
      attempt,
      questions,
    });
  }

  const actualScore = Number(attempt.score) || 0;
  const totalMarks = Number(assessment.totalMarks) || 0;

  const percentage =
    totalMarks > 0 ? Math.round((actualScore / totalMarks) * 100) : 0;

  return {
    overallScore: actualScore,
    totalMarks,

    percentage,

    mcqScore: Number(result.mcqScore) >= 0 ? Number(result.mcqScore) : mcqScore,

    mcqTotalMarks:
      Number(result.mcqTotalMarks) >= 0
        ? Number(result.mcqTotalMarks)
        : mcqTotalMarks,

    subjectiveScore:
      Number(result.subjectiveScore) >= 0
        ? Number(result.subjectiveScore)
        : subjectiveScore,

    subjectiveTotalMarks:
      Number(result.subjectiveTotalMarks) >= 0
        ? Number(result.subjectiveTotalMarks)
        : subjectiveTotalMarks,

    topicPerformance:
      Array.isArray(result.topicPerformance) &&
      result.topicPerformance.length > 0
        ? result.topicPerformance
        : calculatedTopicPerformance,

    strengths: result.strengths,

    weaknesses: result.weaknesses,

    recommendations: result.recommendations,

    summary: result.summary.trim(),
  };
};

module.exports = {
  generateAssessmentReport,
};
