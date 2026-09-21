import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getMyAssessments,
  getMyAttempts,
  startAssessmentAttempt,
} from "../../services/dashboard.service";

import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assessments, setAssessments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [assessmentResult, attemptResult] = await Promise.all([
          getMyAssessments(),
          getMyAttempts(),
        ]);

        setAssessments(assessmentResult.assessments || []);

        setAttempts(attemptResult.attempts || []);
      } catch (error) {
        console.error("Failed to load dashboard:", error);

        setError(error.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const completedAttempts = useMemo(
    () => attempts.filter((attempt) => attempt.status === "completed"),
    [attempts],
  );

  const averageScore = useMemo(() => {
    const validAttempts = completedAttempts.filter(
      (attempt) => Number(attempt.assessment?.totalMarks) > 0,
    );

    if (validAttempts.length === 0) {
      return 0;
    }

    const totalPercentage = validAttempts.reduce((sum, attempt) => {
      const totalMarks = attempt.assessment?.totalMarks || 0;

      return sum + (attempt.score / totalMarks) * 100;
    }, 0);

    return Math.round(totalPercentage / validAttempts.length);
  }, [completedAttempts]);

  const bestScore = useMemo(() => {
    const validAttempts = completedAttempts.filter(
      (attempt) => Number(attempt.assessment?.totalMarks) > 0,
    );

    if (validAttempts.length === 0) {
      return 0;
    }

    return Math.round(
      Math.max(
        ...validAttempts.map((attempt) => {
          const totalMarks = attempt.assessment?.totalMarks || 0;

          return (attempt.score / totalMarks) * 100;
        }),
      ),
    );
  }, [completedAttempts]);

  // Attempts are returned newest first by the backend.
  const getLatestAttemptForAssessment = (assessmentId) => {
    return attempts.find(
      (attempt) =>
        attempt.assessment?._id?.toString() === assessmentId?.toString(),
    );
  };

  const startNewAttempt = async (assessment) => {
    const result = await startAssessmentAttempt(assessment._id);

    navigate(`/assessment/${assessment._id}/attempt/${result.attempt._id}`);
  };

  const handleAssessmentAction = async (assessment) => {
    try {
      setError("");

      const attempt = getLatestAttemptForAssessment(assessment._id);

      if (!attempt) {
        await startNewAttempt(assessment);
        return;
      }

      if (attempt.status === "in-progress") {
        navigate(`/assessment/${assessment._id}/attempt/${attempt._id}`);
        return;
      }

      if (attempt.status === "completed") {
        await startNewAttempt(assessment);
      }
    } catch (error) {
      console.error("Failed to start assessment:", error);

      setError(error.response?.data?.message || "Failed to start assessment");
    }
  };

  const handleViewResult = (attempt) => {
    navigate(
      `/assessment/${attempt.assessment._id}/attempt/${attempt._id}/result`,
    );
  };

  const formatDate = (date) => {
    if (!date) {
      return "Unknown date";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="mb-7">
          <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8 sm:py-7 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-1 text-sm font-semibold text-violet-600">
                DASHBOARD
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Welcome back, {user?.name || "there"} 👋
              </h1>

              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                Create assessments, practice, and track your progress.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/assessment/setup")}
              className="w-full rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 sm:w-auto"
            >
              + Create Assessment
            </button>
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total Assessments"
              value={assessments.length}
              icon="▣"
              accent="violet"
            />

            <StatCard
              label="Completed Attempts"
              value={completedAttempts.length}
              icon="✓"
              accent="green"
            />

            <StatCard
              label="Average Score"
              value={averageScore}
              suffix="%"
              icon="↗"
              accent="blue"
            />

            <StatCard
              label="Best Score"
              value={bestScore}
              suffix="%"
              icon="★"
              accent="amber"
            />
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />

            <p className="text-sm text-slate-500">
              Loading your assessments...
            </p>
          </div>
        )}

        {/* Assessments */}
        {!loading && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  My Assessments
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Practice with your generated assessments.
                </p>
              </div>

              <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 sm:block">
                {assessments.length}{" "}
                {assessments.length === 1 ? "assessment" : "assessments"}
              </span>
            </div>

            {assessments.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-2xl text-violet-600">
                  🤖
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  No assessments yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Create your first AI-generated assessment and start
                  practicing.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/assessment/setup")}
                  className="mt-6 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700"
                >
                  Create Your First Assessment
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {assessments.map((assessment) => {
                  const attempt = getLatestAttemptForAssessment(assessment._id);

                  return (
                    <AssessmentCard
                      key={assessment._id}
                      assessment={assessment}
                      attempt={attempt}
                      formatDate={formatDate}
                      onAction={handleAssessmentAction}
                      onViewResult={handleViewResult}
                    />
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Recent Attempts */}
        {!loading && attempts.length > 0 && (
          <section className="mt-10">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Recent Attempts
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your latest assessment activity.
              </p>
            </div>

            <div className="space-y-3">
              {attempts.slice(0, 5).map((attempt) => (
                <AttemptCard
                  key={attempt._id}
                  attempt={attempt}
                  navigate={navigate}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

/* ============================================================
   STAT CARD
============================================================ */

const StatCard = ({ label, value, suffix, icon, accent }) => {
  const accentStyles = {
    violet: {
      icon: "bg-violet-100 text-violet-600",
      border: "hover:border-violet-200",
    },

    green: {
      icon: "bg-emerald-100 text-emerald-600",
      border: "hover:border-emerald-200",
    },

    blue: {
      icon: "bg-blue-100 text-blue-600",
      border: "hover:border-blue-200",
    },

    amber: {
      icon: "bg-amber-100 text-amber-600",
      border: "hover:border-amber-200",
    },
  };

  const style = accentStyles[accent];

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition ${style.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value}

            {suffix && (
              <span className="ml-1 text-sm font-medium text-slate-400">
                {suffix}
              </span>
            )}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${style.icon}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   ASSESSMENT CARD
============================================================ */

const AssessmentCard = ({
  assessment,
  attempt,
  formatDate,
  onAction,
  onViewResult,
}) => {
  const isCompleted = attempt?.status === "completed";

  const isInProgress = attempt?.status === "in-progress";

  const totalQuestions = assessment.questions?.length || 0;

  const totalMarks = assessment.totalMarks || 0;

  const percentage =
    isCompleted && totalMarks > 0
      ? Math.round((attempt.score / totalMarks) * 100)
      : 0;

  const statusStyles = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-100",

    "in-progress": "bg-amber-50 text-amber-700 border-amber-100",

    created: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const status = attempt?.status || "created";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                {assessment.title}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {totalQuestions}{" "}
                {totalQuestions === 1 ? "question" : "questions"}{" "}
                <span className="text-slate-300">•</span> {assessment.duration}{" "}
                minutes <span className="text-slate-300">•</span> {totalMarks}{" "}
                marks
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                statusStyles[status]
              }`}
            >
              {status === "created" ? "Not attempted" : status}
            </span>
          </div>

          {assessment.description && (
            <p className="mt-3 line-clamp-2 text-sm text-slate-500">
              {assessment.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 sm:text-sm">
            <span>📅 {formatDate(assessment.createdAt)}</span>

            {attempt && <span>Attempted {formatDate(attempt.createdAt)}</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4 lg:border-t-0 lg:pt-0">
          {isCompleted && (
            <div className="min-w-22.5">
              <p className="text-xs font-medium text-slate-500">Latest Score</p>

              <p className="mt-0.5 text-2xl font-bold text-slate-900">
                {attempt.score}
                <span className="text-sm font-medium text-slate-400">
                  /{totalMarks}
                </span>
              </p>

              <p className="text-xs font-medium text-slate-500">
                {percentage}%
              </p>
            </div>
          )}

          {!isCompleted && (
            <div className="min-w-22.5">
              <p className="text-xs font-medium text-slate-500">Questions</p>

              <p className="mt-0.5 text-2xl font-bold text-slate-900">
                {totalQuestions}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {isCompleted && (
              <button
                type="button"
                onClick={() => onViewResult(attempt)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                View Result
              </button>
            )}

            <button
              type="button"
              onClick={() => onAction(assessment)}
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              {isCompleted
                ? "Retake Assessment"
                : isInProgress
                  ? "Continue"
                  : "Start Assessment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   ATTEMPT CARD
============================================================ */

const AttemptCard = ({ attempt, navigate, formatDate }) => {
  const assessment = attempt.assessment;

  if (!assessment) {
    return null;
  }

  const totalMarks = assessment.totalMarks || 0;

  const percentage =
    attempt.status === "completed" && totalMarks > 0
      ? Math.round((attempt.score / totalMarks) * 100)
      : 0;

  const handleClick = () => {
    if (attempt.status === "completed") {
      navigate(`/assessment/${assessment._id}/attempt/${attempt._id}/result`);
      return;
    }

    if (attempt.status === "in-progress") {
      navigate(`/assessment/${assessment._id}/attempt/${attempt._id}`);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h3 className="truncate font-semibold text-slate-900">
          {assessment.title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {formatDate(attempt.createdAt)}
          <span className="mx-2 text-slate-300">•</span>
          <span className="capitalize">{attempt.status}</span>
        </p>
      </div>

      <div className="flex items-center gap-4">
        {attempt.status === "completed" && (
          <div className="text-right">
            <p className="font-bold text-slate-900">
              {attempt.score}/{totalMarks}
            </p>

            <p className="text-xs text-slate-500">{percentage}%</p>
          </div>
        )}

        {attempt.status === "in-progress" && (
          <button
            type="button"
            onClick={handleClick}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Continue
          </button>
        )}

        {attempt.status === "completed" && (
          <button
            type="button"
            onClick={handleClick}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View Result
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
