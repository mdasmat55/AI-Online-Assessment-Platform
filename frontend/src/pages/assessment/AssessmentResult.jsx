import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

const AssessmentResult = () => {
  const { assessmentId, attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/attempts/${attemptId}`);

        const data = response.data?.attempt;

        if (!data) {
          throw new Error("Assessment result not found.");
        }

        if (data.assessment?._id?.toString() !== assessmentId?.toString()) {
          throw new Error("Invalid assessment result.");
        }

        if (data.status !== "completed") {
          navigate(`/assessment/${assessmentId}/attempt/${attemptId}`, {
            replace: true,
          });
          return;
        }

        setAttempt(data);
      } catch (error) {
        console.error("Failed to fetch assessment result:", error);

        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load assessment result.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId, assessmentId, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />

          <p className="text-sm text-slate-500">Loading result...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-lg font-bold text-red-600">
            !
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Result Not Found
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error || "Result not found."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const assessment = attempt.assessment;

  const totalMarks = assessment.totalMarks || 0;
  const score = attempt.score || 0;

  const percentage =
    totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  const answeredCount =
    attempt.answers?.filter(
      (answer) => typeof answer.answer === "string" && answer.answer.trim(),
    ).length || 0;

  const totalQuestions = assessment.questions?.length || 0;

  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-7 rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
          <p className="text-sm font-semibold text-violet-600">
            ASSESSMENT RESULT
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Assessment Completed
              </h1>

              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                {assessment.title}
              </p>
            </div>

            <span className="w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              Completed
            </span>
          </div>
        </div>

        {/* Score */}
        <section className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Your Score
          </p>

          <div className="mt-3">
            <span className="text-5xl font-bold tracking-tight text-violet-600 sm:text-6xl">
              {score}
            </span>

            <span className="ml-2 text-xl font-medium text-slate-400">
              / {totalMarks}
            </span>
          </div>

          <div className="mx-auto mt-5 h-2 max-w-md overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-violet-600 transition-all"
              style={{
                width: `${Math.min(percentage, 100)}%`,
              }}
            />
          </div>

          <p className="mt-3 text-lg font-bold text-slate-700">{percentage}%</p>
        </section>

        {/* Statistics */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <ResultStat
            label="Total Questions"
            value={totalQuestions}
            icon="▣"
            iconStyle="bg-violet-100 text-violet-600"
          />

          <ResultStat
            label="Answered"
            value={answeredCount}
            icon="✓"
            iconStyle="bg-emerald-100 text-emerald-600"
          />

          <ResultStat
            label="Unanswered"
            value={unansweredCount}
            icon="—"
            iconStyle="bg-slate-100 text-slate-500"
          />
        </section>

        {/* Question Review */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Question Review
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review your answers and the feedback received.
            </p>
          </div>

          <div className="space-y-4">
            {assessment.questions.map((question, index) => {
              const answer = attempt.answers?.find(
                (item) =>
                  item.questionId?.toString() === question._id?.toString(),
              );

              const questionAnswered =
                typeof answer?.answer === "string" && answer.answer.trim();

              const questionScore = answer?.score ?? 0;

              const fullScore = questionScore === question.marks;

              return (
                <div
                  key={question._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  {/* Question header */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                          Question {index + 1}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
                          {question.type}
                        </span>
                      </div>

                      <p className="font-semibold leading-6 text-slate-900">
                        {question.question}
                      </p>
                    </div>

                    <span
                      className={`w-fit shrink-0 rounded-xl border px-3 py-1.5 text-sm font-bold ${
                        fullScore
                          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                          : questionScore > 0
                            ? "border-amber-100 bg-amber-50 text-amber-700"
                            : "border-red-100 bg-red-50 text-red-600"
                      }`}
                    >
                      {questionScore} / {question.marks}
                    </span>
                  </div>

                  {/* Answer */}
                  <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Your Answer
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {questionAnswered
                        ? answer.answer.trim()
                        : "No answer provided."}
                    </p>
                  </div>

                  {/* Feedback */}
                  {answer?.feedback && (
                    <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                        Feedback
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-violet-900">
                        {answer.feedback}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Actions */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  setLoading(true);
                  setError("");

                  // Generate the detailed assessment report
                  await api.post(`/reports/${attemptId}`);

                  // Open the detailed report page
                  navigate(
                    `/assessment/${assessmentId}/attempt/${attemptId}/report`,
                  );
                } catch (error) {
                  console.error("Failed to generate assessment report:", error);

                  setError(
                    error.response?.data?.message ||
                      "Failed to generate assessment report.",
                  );

                  setLoading(false);
                }
              }}
              className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700"
            >
              View Detailed Report
            </button>

            <button
              type="button"
              onClick={() => navigate("/assessment/setup")}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Create Another Assessment
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Go to Dashboard
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

const ResultStat = ({ label, value, icon, iconStyle }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${iconStyle}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default AssessmentResult;
