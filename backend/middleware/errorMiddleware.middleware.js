/**
 * Centralized Error Handling Middleware
 * ─────────────────────────────────────
 * All unhandled errors in the app flow through here via next(error).
 * This keeps controller code clean — they only throw, not format errors.
 *
 * Handles:
 *  - Mongoose validation errors (400)
 *  - Mongoose duplicate key errors (409)
 *  - Mongoose cast errors / bad ObjectId (400)
 *  - JWT errors (401)
 *  - Generic server errors (500)
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // ── Mongoose Validation Error ──────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ── Mongoose Duplicate Key (unique index violation) ────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value: '${err.keyValue[field]}' already exists for field '${field}'.`;
  }

  // ── Mongoose Bad ObjectId ──────────────────────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field '${err.path}': ${err.value}`;
  }

  // ── JWT Errors ─────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please login again.';
  }

  const response = {
    success: false,
    message,
  };
  if (errors) response.errors = errors;

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${statusCode} - ${message}`, err.stack);
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Handler — for routes that don't exist
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFoundHandler };
