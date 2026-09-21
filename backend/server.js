require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");

const { connectDB, disconnectDB } = require("./config/db");

const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/user.route");
const assessmentRoutes = require("./routes/assessment.route");
const assessmentAttemptRoutes = require("./routes/assessmentAttempt.route");
const reportRoutes = require("./routes/report.route");

const { errorHandler, notFound } = require("./middlewares/error.middleware");

const app = express();

const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : null;

app.use(
  cors(
    allowedOrigins
      ? {
          origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
              return callback(null, true);
            }

            return callback(new Error("Not allowed by CORS"));
          },
        }
      : undefined,
  ),
);

app.use(helmet());

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use(generalLimiter);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
    },
  }),
);

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

app.use("/api/assessments", assessmentRoutes);

app.use("/api/attempts", assessmentAttemptRoutes);

app.use("/api/reports", reportRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Online Assessment Platform API is running",
  });
});

app.use(notFound);
app.use(errorHandler);

let server;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();
