import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { loginUser } from "../../services/auth.service";
import { useAuth } from "../../context/AuthContext";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const result = await loginUser(formData);

      login(result.user, result.token);

      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google?mode=login`;
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
        <div className="relative hidden bg-linear-to-br from-violet-50 via-white to-indigo-50 px-8 py-8 lg:block lg:w-[40%] lg:px-10">
          {/* Decorative dots */}
          <div className="absolute right-8 top-8 grid grid-cols-4 gap-1.5 opacity-40">
            {[...Array(16)].map((_, index) => (
              <span
                key={index}
                className="h-1.5 w-1.5 rounded-full bg-violet-300"
              />
            ))}
          </div>

          {/* Logo */}
          <Link
            to="/"
            className="relative z-10 flex w-fit items-center gap-2.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-lg text-white shadow-md">
              🤖
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">AI Interview</h1>

              <p className="text-[10px] font-medium tracking-widest text-slate-500">
                INTERVIEW PLATFORM
              </p>
            </div>
          </Link>

          {/* Hero */}
          <div className="relative z-10 mt-12">
            <p className="mb-3 text-xs font-semibold text-violet-600">
              WELCOME BACK
            </p>

            <h2 className="text-4xl font-bold leading-tight tracking-tight text-slate-900">
              Practice.
              <br />
              Improve.
              <br />
              <span className="text-violet-600">Get Hired.</span>
            </h2>

            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
              Continue your interview preparation, practice with AI, and improve
              your performance one interview at a time.
            </p>
          </div>

          {/* Features */}
          <div className="relative z-10 mt-9 space-y-5">
            <Feature
              icon="🤖"
              title="AI-Powered Interviews"
              description="Practice with realistic interview questions."
            />

            <Feature
              icon="✓"
              title="Instant Feedback"
              description="Understand your strengths and weaknesses."
            />

            <Feature
              icon="✦"
              title="Track Your Progress"
              description="See how your interview performance improves."
            />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 lg:px-16">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="mb-10 flex items-center justify-between lg:hidden">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-base text-white">
                  🤖
                </div>

                <span className="font-bold text-slate-900">AI Interview</span>
              </Link>

              <Link
                to="/register"
                className="text-sm font-semibold text-violet-600"
              >
                Register
              </Link>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <p className="mb-1.5 text-xs font-semibold tracking-wide text-violet-600">
                WELCOME BACK
              </p>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Login to continue your interview preparation.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Email Address
                </label>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    ✉
                  </span>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-3 focus:ring-violet-100"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Password
                </label>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    🔒
                  </span>

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-14 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-3 focus:ring-violet-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-violet-600 py-3 font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />

                <span className="text-xs font-medium text-slate-400">OR</span>

                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <FcGoogle className="text-xl" />
                Continue with Google
              </button>
            </form>

            {/* Register */}
            <p className="mt-6 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-violet-600 hover:text-violet-700"
              >
                Create an account
              </Link>
            </p>

            {/* Security */}
            <p className="mt-4 text-center text-[11px] text-slate-400">
              🔒 Your account information is securely protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


const Feature = ({ icon, title, description }) => {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-sm text-violet-600">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>

        <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
};

export default Login;
