class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

function notFoundHandler(error, req, res, next) {
  if (!(error instanceof AppError) || error.statusCode !== 404) {
    return next(error);
  }

  return res.status(404).json({
    success: false,
    message: error.message
  });
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error("Unhandled error", error);
  }

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error."
  });
}

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler
};
