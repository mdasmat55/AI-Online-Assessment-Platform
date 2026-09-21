import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Target,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  BarChart3,
} from "lucide-react";

import Navbar from "../../components/Navbar";
import api from "../../services/api";

const AssessmentsReport = () => {
  const { assessmentId, attemptId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/reports/${attemptId}`);

        if (!response.data?.report) {
          throw new Error("Report not found");
        }

        setReport(response.data.report);
      } catch (error) {
        console.error("Failed to load assessment report:", error);

        setError(
          error.response?.data?.message || "Failed to load assessment report",
        );
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) {
      loadReport();
    }
  }, [attemptId]);

  const handleCreateAssessment = () => {
    navigate("/assessment/setup");
  };

  const handleDashboard = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />

            <p className="text-base font-semibold text-slate-900">
              Loading your assessment report...
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Preparing your performance analysis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <AlertCircle size={24} />
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Report unavailable
            </h2>

            <p className="mt-2 text-sm leading-6 text-red-500">
              {error || "Assessment report not found."}
            </p>

            <button
              onClick={handleDashboard}
              className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const overallScore = report.overallScore ?? 0;
  const totalMarks = report.totalMarks ?? 0;
  const percentage = report.percentage ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}

        <div className="mb-6">
          <button
            onClick={handleDashboard}
            className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-600"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>

          <p className="text-sm font-semibold tracking-wide text-violet-600">
            ASSESSMENT COMPLETED
          </p>

          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Assessment Report
              </h1>

              {report.assessment?.title && (
                <p className="mt-1 text-sm text-slate-500">
                  {report.assessment.title}
                </p>
              )}
            </div>

            <span className="flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={14} />
              Completed
            </span>
          </div>
        </div>

        {/* Overall Score */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Overall Performance
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Your Assessment Score
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Your score is based on your performance across all questions in
                this assessment.
              </p>
            </div>

            <div className="flex h-36 w-36 shrink-0 flex-col items-center justify-center rounded-full border-[10px] border-violet-100 bg-violet-50">
              <p className="text-4xl font-bold text-violet-700">
                {percentage}%
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                {overallScore} / {totalMarks}
              </p>
            </div>
          </div>
        </section>

        {/* Score Cards */}

        <section className="mb-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <ScoreCard
              icon={<Target size={18} />}
              title="Overall Score"
              value={`${overallScore}/${totalMarks}`}
            />

            <ScoreCard
              icon={<CheckCircle2 size={18} />}
              title="MCQ Score"
              value={`${report.mcqScore ?? 0}/${report.mcqTotalMarks ?? 0}`}
            />

            <ScoreCard
              icon={<BarChart3 size={18} />}
              title="Subjective Score"
              value={`${report.subjectiveScore ?? 0}/${report.subjectiveTotalMarks ?? 0}`}
            />
          </div>
        </section>

        {/* Summary */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <SectionHeader
            icon={<TrendingUp size={18} />}
            title="Overall Assessment"
          />

          <p className="mt-5 text-sm leading-7 text-slate-600">
            {report.summary || "No summary available."}
          </p>
        </section>

        {/* Topic Performance */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <SectionHeader
            icon={<BarChart3 size={18} />}
            title="Topic-wise Performance"
          />

          {report.topicPerformance?.length > 0 ? (
            <div className="mt-5 space-y-5">
              {report.topicPerformance.map((topic, index) => {
                const topicPercentage = Math.min(
                  Math.max(Number(topic.percentage) || 0, 0),
                  100,
                );

                return (
                  <div key={`${topic.topic}-${index}`}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {topic.topic || "General"}
                      </p>

                      <p className="text-sm font-semibold text-slate-600">
                        {topic.score ?? 0}/{topic.maxScore ?? 0} (
                        {topicPercentage}%)
                      </p>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-violet-600 transition-all"
                        style={{
                          width: `${topicPercentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-500">
              Topic-wise performance is not available.
            </p>
          )}
        </section>

        {/* Strengths and Weaknesses */}

        <section className="mb-6 grid gap-5 md:grid-cols-2">
          {/* Strengths */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              icon={<CheckCircle2 size={18} />}
              title="Strengths"
              iconClass="bg-emerald-50 text-emerald-600"
            />

            {report.strengths?.length > 0 ? (
              <ul className="mt-5 space-y-3">
                {report.strengths.map((strength, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm leading-6 text-slate-600"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-600">
                      ✓
                    </span>

                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-slate-500">
                No strengths identified.
              </p>
            )}
          </div>

          {/* Weaknesses */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              icon={<AlertCircle size={18} />}
              title="Areas to Improve"
              iconClass="bg-amber-50 text-amber-600"
            />

            {report.weaknesses?.length > 0 ? (
              <ul className="mt-5 space-y-3">
                {report.weaknesses.map((weakness, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm leading-6 text-slate-600"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-50 text-xs font-bold text-amber-600">
                      !
                    </span>

                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-slate-500">
                No major weaknesses identified.
              </p>
            )}
          </div>
        </section>

        {/* Recommendations */}

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <SectionHeader
            icon={<Lightbulb size={18} />}
            title="Recommended Improvements"
          />

          {report.recommendations?.length > 0 ? (
            <div className="mt-5 space-y-3">
              {report.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">
                    {index + 1}
                  </span>

                  <p className="text-sm leading-6 text-slate-600">
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-500">
              No recommendations available.
            </p>
          )}
        </section>

        {/* Actions */}

        <div className="mb-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={handleCreateAssessment}
            className="rounded-xl bg-violet-600 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700"
          >
            Create Another Assessment
          </button>

          <button
            onClick={handleDashboard}
            className="rounded-xl border border-slate-200 px-7 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
};

const SectionHeader = ({
  icon,
  title,
  iconClass = "bg-violet-100 text-violet-600",
}) => {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${iconClass}`}
      >
        {icon}
      </div>

      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    </div>
  );
};

const ScoreCard = ({ icon, title, value }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2 text-violet-600">
        {icon}

        <p className="text-xs font-medium text-slate-500 sm:text-sm">{title}</p>
      </div>

      <p className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
        {value}
      </p>
    </div>
  );
};

export default AssessmentsReport;
