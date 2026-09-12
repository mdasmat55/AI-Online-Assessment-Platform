import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/home/Home";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/profile/Profile";

import InterviewSetup from "./pages/interview/InterviewSetup";
import Interview from "./pages/interview/Interview";
import InterviewReport from "./pages/interview/InterviewReport";

import ProtectedRoute from "./components/ProtectedRoute";
import OAuthCallback from "./pages/auth/OAuthCallback";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/interview/setup" element={<InterviewSetup />} />

          <Route path="/interview/:interviewId/start" element={<Interview />} />

          <Route
            path="/interview/:interviewId/report"
            element={<InterviewReport />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
