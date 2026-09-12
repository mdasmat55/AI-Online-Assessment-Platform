const express = require("express");

const {
  register,
  login,
  updateProfile,
  googleCallback,
  getMe,
} = require("../controllers/auth.controller");

const { protect } = require("../middlewares/auth.middleware");

const { authLimiter } = require("../middlewares/rateLimit.middleware");

const oauth2Client = require("../config/googleOAuth");

const router = express.Router();

router.post("/register", authLimiter, register);

router.post("/login", authLimiter, login);

router.get("/google", (req, res) => {
  const { mode } = req.query;

  if (mode !== "login" && mode !== "signup") {
    return res.status(400).json({
      success: false,
      message: "Invalid Google authentication mode",
    });
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
    state: mode,
  });

  res.redirect(authUrl);
});

router.get("/google/callback", googleCallback);

router.get("/me", protect, getMe);

router.put("/profile", protect, updateProfile);

module.exports = router;
