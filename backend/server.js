require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");

const { connectDB, disconnectDB } = require("./config/db");

const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/user.route");
const interviewRoutes = require("./routes/interview.route");
const reportRoutes = require("./routes/report.route");
const { errorHandler, notFound } = require("./middlewares/error.middleware");
const app = express();

const PORT = process.env.PORT || 5000;

// Comma-separated list of allowed origins, e.g.
// CORS_ORIGIN=https://myapp.com,https://www.myapp.com
// Falls back to allowing any origin (useful for local dev) when unset.

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : null;

app.use(helmet());
app.use(
  cors(
    allowedOrigins
      ? {
          origin: (origin, callback) => {
            // Allow requests with no origin (curl, mobile apps, server-to-server)
            if (!origin || allowedOrigins.includes(origin)) {
              return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
          },
        }
      : undefined,
  ),
);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use(generalLimiter);
app.use(express.json({ limit: "1mb" }));

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
app.use("/api/interviews", interviewRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Interview Platform API is running",
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