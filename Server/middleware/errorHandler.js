const logger = require('../config/logger');

// Custom error class for application errors
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Set default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorDetails = null;

  // Log the full error details (server-side only)
  const errorLog = {
    message: err.message,
    stack: err.stack,
    statusCode: statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  };

  // Handle different error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation error';
    errorDetails = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    logger.warn('Validation error:', errorLog);
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ID format)
    statusCode = 400;
    message = 'Invalid ID format';
    logger.warn('Cast error:', errorLog);
  } else if (err.name === 'MongoServerError' && err.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
    logger.warn('Duplicate key error:', errorLog);
  } else if (err.name === 'JsonWebTokenError') {
    // JWT error
    statusCode = 401;
    message = 'Invalid token';
    logger.warn('JWT error:', errorLog);
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired
    statusCode = 401;
    message = 'Token expired';
    logger.warn('Token expired:', errorLog);
  } else if (err.isOperational !== false) {
    // Operational errors (expected errors)
    logger.warn('Operational error:', errorLog);
  } else {
    // Programming errors (unexpected errors)
    logger.error('Unexpected error:', errorLog);
    // In production, don't expose internal error details
    if (process.env.NODE_ENV === 'production') {
      message = 'An unexpected error occurred';
      statusCode = 500;
    }
  }

  // Build error response
  const errorResponse = {
    error: true,
    message: message
  };

  // Add details if available (from validation errors or custom error details)
  if (errorDetails) {
    errorResponse.details = errorDetails;
  } else if (err.details) {
    errorResponse.details = err.details;
  }

  // Only include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
    errorResponse.errorDetails = {
      name: err.name,
      message: err.message
    };
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.method} ${req.path} not found`, 404);
  next(error);
};

// Async error wrapper to catch errors in async route handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  AppError,
  asyncHandler
};

