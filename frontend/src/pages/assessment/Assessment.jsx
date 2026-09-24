import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

const Assessment = () => {
  const { assessmentId, attemptId } = useParams();
  const navigate = useNavigate();

  const autoSubmitTriggered = useRef(false);

  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/attempts/${attemptId}`);

        const attempt = response.data?.attempt;

        if (!attempt) {
          throw new Error("Assessment attempt not found.");
        }

        if (attempt.assessment?._id?.toString() !== assessmentId?.toString()) {
          throw new Error("Invalid assessment attempt.");
        }

        if (attempt.status === "completed") {
          navigate(`/assessment/${assessmentId}/attempt/${attemptId}/result`, {
            replace: true,
          });
          return;
        }

        setAssessment(attempt.assessment);

        const restoredAnswers = {};

        attempt.answers?.forEach((item) => {
          restoredAnswers[item.questionId?.toString()] = item.answer || "";
        });

        setAnswers(restoredAnswers);

        const startedAt = new Date(attempt.startedAt).getTime();
        const durationMs = attempt.assessment.duration * 60 * 1000;
        const endTime = startedAt + durationMs;

        const remainingSeconds = Math.max(
          0,
          Math.floor((endTime - Date.now()) / 1000),
        );

        setTimeLeft(remainingSeconds);
      } catch (error) {
        console.error("Failed to fetch assessment:", error);

        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load assessment.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptId, assessmentId, navigate]);

  const currentQuestion = assessment?.questions?.[currentQuestionIndex];

  const saveAnswer = useCallback(
    async (questionId) => {
      try {
        setSaving(true);

        await api.post(`/attempts/${attemptId}/answer`, {
          questionId,
          answer: answers[questionId] || "",
        });

        return true;
      } catch (error) {
        console.error("Failed to save answer:", error);

        setError(error.response?.data?.message || "Failed to save answer.");

        return false;
      } finally {
        setSaving(false);
      }
    },
    [attemptId, answers],
  );

  const handleCompleteAssessment = useCallback(
    async (isAutoSubmit = false) => {
      if (submitting) {
        return;
      }

      try {
        setSubmitting(true);
        setError("");

        if (currentQuestion) {
          const saved = await saveAnswer(currentQuestion._id);

          if (!saved && !isAutoSubmit) {
            setSubmitting(false);
            return;
          }
        }

        const response = await api.post(`/attempts/${attemptId}/complete`);

        if (!response.data?.result) {
          throw new Error("Assessment result was not returned.");
        }

        navigate(`/assessment/${assessmentId}/attempt/${attemptId}/result`, {
          replace: true,
          state: {
            result: response.data.result,
          },
        });
      } catch (error) {
        console.error("Failed to complete assessment:", error);

        setError(
          error.response?.data?.message || "Failed to submit assessment.",
        );

        setSubmitting(false);
      }
    },
    [
      submitting,
      currentQuestion,
      saveAnswer,
      attemptId,
      assessmentId,
      navigate,
    ],
  );

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitting) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitting]);

  useEffect(() => {
    if (
      timeLeft === 0 &&
      assessment &&
      !submitting &&
      !autoSubmitTriggered.current
    ) {
      autoSubmitTriggered.current = true;
      handleCompleteAssessment(true);
    }
  }, [timeLeft, assessment, submitting, handleCompleteAssessment]);

  const answeredCount = useMemo(() => {
    if (!assessment) {
      return 0;
    }

    return assessment.questions.filter((question) =>
      answers[question._id]?.trim(),
    ).length;
  }, [assessment, answers]);

  const formatTime = (seconds) => {
    if (seconds === null) {
      return "--:--";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  const handleAnswerChange = (value) => {
    if (!currentQuestion) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion._id]: value,
    }));
  };

  const handleNext = async () => {
    if (!currentQuestion || saving) {
      return;
    }

    const saved = await saveAnswer(currentQuestion._id);

    if (!saved) {
      return;
    }

    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex((previous) => previous + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((previous) => previous - 1);
    }
  };

  const handleQuestionNavigation = async (index) => {
    if (!currentQuestion || saving) {
      return;
    }

    if (index === currentQuestionIndex) {
      return;
    }

    const saved = await saveAnswer(currentQuestion._id);

    if (!saved) {
      return;
    }

    setCurrentQuestionIndex(index);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />

          <p className="text-sm text-slate-500">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-xl">
            !
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Unable to load assessment
          </h2>

          <p className="mt-2 text-sm text-red-600">{error}</p>

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

  if (!assessment || !currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Assessment not available.</p>
      </div>
    );
  }

  const isLastQuestion =
    currentQuestionIndex === assessment.questions.length - 1;

  const currentAnswer = answers[currentQuestion._id] || "";

  const isTimeCritical = timeLeft !== null && timeLeft <= 60;

  const progressPercentage =
    assessment.questions.length > 0
      ? Math.round(
          ((currentQuestionIndex + 1) / assessment.questions.length) * 100,
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-violet-600">
                ASSESSMENT
              </p>

              <h1 className="mt-1 truncate text-lg font-bold text-slate-900 sm:text-xl">
                {assessment.title}
              </h1>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Question {currentQuestionIndex + 1} of{" "}
                {assessment.questions.length}
              </p>
            </div>

            <div
              className={`shrink-0 rounded-xl border px-4 py-2.5 ${
                isTimeCritical
                  ? "border-red-200 bg-red-50 text-red-600"
                  : "border-violet-100 bg-violet-50 text-violet-700"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide">
                Time Left
              </p>

              <p className="font-mono text-lg font-bold">
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-violet-600 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_300px] lg:px-8">
        {/* Question */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  {currentQuestion.type === "mcq"
                    ? "Multiple Choice"
                    : "Subjective"}
                </span>

                {currentQuestion.category && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {currentQuestion.category}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold leading-relaxed text-slate-900 sm:text-2xl">
                {currentQuestion.question}
              </h2>
            </div>

            <span className="shrink-0 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 sm:text-sm">
              {currentQuestion.marks}{" "}
              {currentQuestion.marks === 1 ? "mark" : "marks"}
            </span>
          </div>

          {/* MCQ */}
          {currentQuestion.type === "mcq" && (
            <div className="mt-6 space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = currentAnswer === option.text;

                return (
                  <button
                    key={`${option.text}-${index}`}
                    type="button"
                    onClick={() => handleAnswerChange(option.text)}
                    disabled={saving || submitting}
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-violet-500 bg-violet-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${
                        isSelected
                          ? "border-violet-600 bg-violet-600 text-white"
                          : "border-slate-300 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>

                    <span className="text-sm font-medium leading-6 text-slate-800">
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Subjective */}
          {currentQuestion.type === "subjective" && (
            <div className="mt-6">
              <textarea
                value={currentAnswer}
                onChange={(event) => handleAnswerChange(event.target.value)}
                placeholder="Write your answer here..."
                rows={12}
                disabled={submitting}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50"
              />

              <p className="mt-2 text-xs text-slate-400">
                Explain your approach clearly. You can include code, pseudocode,
                examples, or reasoning where appropriate.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || saving || submitting}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <div className="order-first text-center text-xs text-slate-400 sm:order-0">
              {saving
                ? "Saving answer..."
                : "Answer is saved when you navigate"}
            </div>

            {!isLastQuestion ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={saving || submitting}
                className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next Question
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteAssessment}
                disabled={submitting}
                className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Assessment"}
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </section>

        {/* Question Navigator */}
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28">
          <div className="mb-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Questions</h3>

              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                {answeredCount}/{assessment.questions.length}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Select a question to navigate.
            </p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {assessment.questions.map((question, index) => {
              const answered = Boolean(answers[question._id]?.trim());

              const current = index === currentQuestionIndex;

              return (
                <button
                  key={question._id}
                  type="button"
                  onClick={() => handleQuestionNavigation(index)}
                  disabled={saving || submitting}
                  className={`h-10 rounded-xl border text-sm font-semibold transition ${
                    current
                      ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                      : answered
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-200 hover:bg-violet-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-violet-600" />
              <span>Current question</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-emerald-50 ring-1 ring-emerald-300" />
              <span>Answered</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-slate-50 ring-1 ring-slate-300" />
              <span>Not answered</span>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">Progress</span>

              <span className="font-bold text-slate-700">
                {progressPercentage}%
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-violet-600 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Assessment;
