// Global error handler — catches any error passed via next(error)

export const errorHandler = (err, req, res, next) => {
  // Log the full error internally (never send stack traces to clients!)
  console.error(`[ERROR] ${err.stack || err.message}`);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ── Handle specific Mongoose/MongoDB errors ────────────────────────────

  // Duplicate key (e.g., email already registered)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    statusCode = 409; // Conflict
  }

  // Invalid MongoDB ObjectId (e.g., /user/not-a-valid-id)
  if (err.name === 'CastError') {
    message = `Invalid ${err.path}: ${err.value}`;
    statusCode = 400;
  }

  // Mongoose validation errors (from schema rules)
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    statusCode = 400;
  }

  // Always return a clean, safe error message to the client
  res.status(statusCode).json({
    success: false,
    message,
    // Only include stack trace in development for debugging
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};