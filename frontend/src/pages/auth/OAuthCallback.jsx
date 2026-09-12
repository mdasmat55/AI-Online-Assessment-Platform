import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          navigate("/login");
          return;
        }

        // Store the JWT temporarily so the authenticated request can use it
        localStorage.setItem("token", token);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to get user");
        }

        // Store user + token through AuthContext
        login(data.user, token);

        // Remove token from the URL
        window.history.replaceState({}, document.title, "/oauth/callback");

        navigate("/dashboard");
      } catch (error) {
        console.error("OAuth callback error:", error);

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
      }
    };

    handleOAuthCallback();
  }, [login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Signing you in...</p>
    </div>
  );
};

export default OAuthCallback;
