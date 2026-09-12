// Send a consistent error response
const sendErrorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);

  const statusCode = err.statusCode >= 400 ? err.statusCode : 500;

  // Hide internal error details in production
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal server error."
      : err.message || "Something went wrong on the server.";

  return sendErrorResponse(res, statusCode, message);
};

module.exports.notFound = (req, res) => {
  return sendErrorResponse(
    res,
    404,
    `Route not found: ${req.method} ${req.originalUrl}`
  );
};

module.exports.sendError = (res, error, fallbackMessage) => {
  console.error(fallbackMessage, error);

  // Invalid MongoDB ObjectId
  if (error.name === "CastError") {
    return sendErrorResponse(res, 400, "Invalid ID.");
  }

  // Mongoose validation error
  if (error.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((fieldError) => fieldError.message)
      .join(" ");

    return sendErrorResponse(
      res,
      400,
      message || "Invalid input."
    );
  }

  // Duplicate value for a unique field
  if (error.code === 11000) {
    return sendErrorResponse(
      res,
      400,
      "A record with this value already exists."
    );
  }

  // Unknown error
  return sendErrorResponse(res, 500, fallbackMessage);
};

