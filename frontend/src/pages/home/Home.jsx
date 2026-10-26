import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50">
     

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}

          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-base text-white shadow-sm">
              🤖
            </div>

            <div>
              <p className="text-base font-bold leading-tight text-slate-900">
                AI Assessment
              </p>

              <p className="text-[9px] font-medium tracking-widest text-slate-400">
                ASSESSMENT PLATFORM
              </p>
            </div>
          </Link>

          {/* Navigation */}

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-600 sm:px-4"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>


      <main>
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />

              <span className="text-xs font-semibold text-violet-700">
                AI-POWERED OA PRACTICE
              </span>
            </div>

            {/* Heading */}

            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Practice assessments.
              <span className="block text-violet-600">Build confidence.</span>
            </h1>

            {/* Description */}

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
              Practice realistic OA questions, get
              evaluated on your answers, and understand exactly where you can
              improve.
            </p>

            {/* Buttons */}

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="rounded-xl bg-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700"
              >
                Start Practicing →
              </Link>

              <Link
                to="/login"
                className="rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Login to Continue
              </Link>
            </div>
          </div>


          <div className="mx-auto mt-16 grid max-w-5xl gap-4 md:grid-cols-3">
            <FeatureCard
              icon="🤖"
              title="AI Assessments"
              description="Practice assessments tailored to your target role and assessment type."
            />

            <FeatureCard
              icon="📊"
              title="Detailed Reports"
              description="Get scores, strengths, weaknesses, and actionable feedback."
            />

            <FeatureCard
              icon="🎯"
              title="Improve Faster"
              description="Identify your weak areas and focus your preparation where it matters."
            />
          </div>
        </section>

      </main>


      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
          AI Assessment Platform
        </div>
      </footer>
    </div>
  );
};


const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-lg">
        {icon}
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
};

export default Home;
