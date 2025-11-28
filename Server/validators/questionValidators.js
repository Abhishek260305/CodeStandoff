const { param, query } = require('express-validator');
const mongoose = require('mongoose');

// Validation for question ID parameter
const questionIdValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('Question ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid Question ID format');
      }
      return true;
    })
];

// Validation for questions pagination
const questionsQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 10000 }).withMessage('Page must be a positive integer between 1 and 10000')
    .toInt()
];

module.exports = {
  questionIdValidation,
  questionsQueryValidation
};

