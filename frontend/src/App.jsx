import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/home/Home";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import OAuthCallback from "./pages/auth/OAuthCallback";

import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/profile/Profile";

import AssessmentSetup from "./pages/assessment/AssessmentSetup";
import Assessment from "./pages/assessment/Assessment";
import AssessmentResult from "./pages/assessment/AssessmentResult";
import AssessmentsReport from "./pages/assessment/AssessmentsReport";

import ProtectedRoute from "./components/ProtectedRoute";

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

          <Route path="/assessment/setup" element={<AssessmentSetup />} />

          <Route
            path="/assessment/:assessmentId/attempt/:attemptId"
            element={<Assessment />}
          />

          <Route
            path="/assessment/:assessmentId/attempt/:attemptId/result"
            element={<AssessmentResult />}
          />

          <Route
            path="/assessment/:assessmentId/attempt/:attemptId/report"
            element={<AssessmentsReport />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
