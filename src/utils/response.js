// Standardized API response helpers — keeps all responses consistent

// ─── Success Response ─────────────────────────────────────────────────────
export const successResponse = (res, statusCode = 200, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// ─── Error Response ───────────────────────────────────────────────────────
export const errorResponse = (res, statusCode = 500, message, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors; // Include field-level errors if provided
  return res.status(statusCode).json(body);
};