import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const AssessmentSetup = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [difficulty, setDifficulty] = useState("medium");

  const [questionDistribution, setQuestionDistribution] = useState({
    mcq: 10,
    subjective: 0,
  });

  const [duration, setDuration] = useState(30);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalQuestions =
    questionDistribution.mcq + questionDistribution.subjective;

  const totalMarks =
    questionDistribution.mcq + questionDistribution.subjective * 5;

  const handleGenerateAssessment = async (event) => {
    event.preventDefault();

    setError("");

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Please enter an assessment title.");
      return;
    }

    if (trimmedTitle.length > 100) {
      setError("Assessment title cannot exceed 100 characters.");
      return;
    }

    const topics = topicInput
      .split(",")
      .map((topic) => topic.trim())
      .filter(Boolean);

    const uniqueTopics = [...new Set(topics)];

    if (uniqueTopics.length === 0) {
      setError("Please enter at least one topic.");
      return;
    }

    if (uniqueTopics.length > 20) {
      setError("You can enter a maximum of 20 topics.");
      return;
    }

    if (totalQuestions === 0) {
      setError("Please select at least one question.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/assessments/generate", {
        title: trimmedTitle,
        topics: uniqueTopics,
        difficulty,
        mcqCount: questionDistribution.mcq,
        subjectiveCount: questionDistribution.subjective,
        duration: Number(duration),
      });

      const assessment = response.data?.assessment;

      if (!assessment?._id) {
        throw new Error("Assessment was not generated correctly.");
      }

      const attemptResponse = await api.post(
        `/attempts/${assessment._id}/start`,
      );

      const attempt = attemptResponse.data?.attempt;

      if (!attempt?._id) {
        throw new Error("Assessment attempt could not be started.");
      }

      navigate(`/assessment/${assessment._id}/attempt/${attempt._id}`);
    } catch (error) {
      console.error("Assessment generation error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to generate assessment.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-7 rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
          <p className="text-sm font-semibold text-violet-600">
            CREATE ASSESSMENT
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Build Your Assessment
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Configure your assessment and let AI generate the questions for you.
          </p>
        </div>

        <form
          onSubmit={handleGenerateAssessment}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          {/* Assessment Title */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Assessment Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Software Development Engineer Assessment"
              maxLength={100}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />

            <p className="mt-1.5 text-right text-xs text-slate-400">
              {title.length}/100
            </p>
          </div>

          {/* Topics */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Topics
            </label>

            <input
              type="text"
              value={topicInput}
              onChange={(event) => setTopicInput(event.target.value)}
              placeholder="e.g. Arrays, Trees, Graphs, Dynamic Programming"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />

            <p className="mt-2 text-xs text-slate-400">
              Enter multiple topics separated by commas.
            </p>
          </div>

          {/* Configuration */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {/* Difficulty */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Difficulty
              </label>

              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium capitalize text-slate-800 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Duration
              </label>

              <select
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              >
                <option value={10}>10 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>

            {/* Objective Questions */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Objective Questions
              </label>

              <select
                value={questionDistribution.mcq}
                onChange={(event) =>
                  setQuestionDistribution((previous) => ({
                    ...previous,
                    mcq: Number(event.target.value),
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              >
                <option value={10}>10 questions</option>
                <option value={20}>20 questions</option>
                <option value={30}>30 questions</option>
                <option value={50}>50 questions</option>
              </select>

              <p className="mt-2 text-xs text-slate-400">
                1 mark per objective question.
              </p>
            </div>

            {/* Subjective Questions */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Subjective Questions
              </label>

              <select
                value={questionDistribution.subjective}
                onChange={(event) =>
                  setQuestionDistribution((previous) => ({
                    ...previous,
                    subjective: Number(event.target.value),
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              >
                <option value={0}>0 questions</option>
                <option value={2}>2 questions</option>
                <option value={5}>5 questions</option>
                <option value={10}>10 questions</option>
              </select>

              <p className="mt-2 text-xs text-slate-400">
                5 marks per subjective question.
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
              <p className="text-xs font-medium text-violet-600">
                Total Questions
              </p>

              <p className="mt-1 text-2xl font-bold text-violet-700">
                {totalQuestions}
              </p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-medium text-amber-600">Total Marks</p>

              <p className="mt-1 text-2xl font-bold text-amber-700">
                {totalMarks}
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-100 font-bold text-red-600">
                  !
                </span>

                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Generate */}
          <div className="mt-7 border-t border-slate-100 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Generating Assessment..."
                : "Generate & Start Assessment"}
            </button>

            <p className="mt-3 text-center text-xs text-slate-400">
              Your assessment will be generated and started immediately.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssessmentSetup;
