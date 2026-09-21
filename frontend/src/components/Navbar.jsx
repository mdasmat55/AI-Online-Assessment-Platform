import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => handleNavigate("/dashboard")}
          className="flex items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-base text-white shadow-sm">
            🤖
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-base font-bold leading-tight text-slate-900">
              AI Assessment
            </p>

            <p className="text-[9px] font-medium tracking-widest text-slate-400">
              ONLINE ASSESSMENT PLATFORM
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={() => handleNavigate("/dashboard")}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-600"
          >
            Dashboard
          </button>

          <button
            onClick={() => handleNavigate("/assessment/setup")}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-600"
          >
            Create Assessment
          </button>

          <button
            onClick={() => handleNavigate("/profile")}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-600"
          >
            Profile
          </button>

          <div className="mx-2 h-7 w-px bg-slate-200" />

          <div className="flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>

            <span className="max-w-32 truncate text-sm font-medium text-slate-700">
              {user?.name || "User"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="ml-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Logout
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-600 transition hover:bg-slate-50 md:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            {/* User */}
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-violet-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-600">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user?.name || "User"}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user?.email || ""}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => handleNavigate("/dashboard")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-600"
              >
                <span>▣</span>
                Dashboard
              </button>

              <button
                onClick={() => handleNavigate("/assessment/setup")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-600"
              >
                <span>＋</span>
                Create Assessment
              </button>

              <button
                onClick={() => handleNavigate("/profile")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-600"
              >
                <span>👤</span>
                Profile
              </button>

              <div className="my-2 border-t border-slate-100" />

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-red-500 transition hover:bg-red-50"
              >
                <span>↪</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
