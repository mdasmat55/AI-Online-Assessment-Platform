const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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

Return exactly this structure:

{
  "mcqScore": 0,
  "mcqTotalMarks": 0,
  "subjectiveScore": 0,
  "subjectiveTotalMarks": 0,
  "topicPerformance": [
    {
      "topic": "Topic name",
      "score": 0,
      "maxScore": 0,
      "percentage": 0
    }
  ],
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

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  if (!response?.text) {
    throw new Error("Gemini returned an empty report");
  }

  let result;

  try {
    result = JSON.parse(response.text);
  } catch (error) {
    throw new Error("Gemini returned invalid report JSON");
  }

  if (!result || typeof result !== "object") {
    throw new Error("Gemini returned an invalid report");
  }

  if (!Array.isArray(result.topicPerformance)) {
    throw new Error("Invalid topic performance data");
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

  const mcqScore = Number(result.mcqScore) || 0;

  const mcqTotalMarks = Number(result.mcqTotalMarks) || 0;

  const subjectiveScore = Number(result.subjectiveScore) || 0;

  const subjectiveTotalMarks = Number(result.subjectiveTotalMarks) || 0;

  if (mcqScore < 0 || mcqScore > mcqTotalMarks) {
    throw new Error("Invalid MCQ score");
  }

  if (subjectiveScore < 0 || subjectiveScore > subjectiveTotalMarks) {
    throw new Error("Invalid subjective score");
  }

  const actualScore = attempt.score || 0;

  const totalMarks = assessment.totalMarks || 0;

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

    topicPerformance: result.topicPerformance,

    strengths: result.strengths,

    weaknesses: result.weaknesses,

    recommendations: result.recommendations,

    summary: result.summary.trim(),
  };
};

module.exports = {
  generateAssessmentReport,
};
