const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// Validation middleware - handles validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));
    
    // Throw AppError to be handled by error handler middleware
    const error = new AppError('Validation failed', 400);
    error.details = errorDetails;
    return next(error);
  }
  next();
};

module.exports = handleValidationErrors;

