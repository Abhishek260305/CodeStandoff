const express = require('express');
const router = express.Router();
const { questionIdValidation, questionsQueryValidation } = require('../validators/questionValidators');
const handleValidationErrors = require('../middleware/validation');
const { getQuestionOutput, getQuestions, getRandomQuestions } = require('../controllers/questionController');
const { asyncHandler } = require('../middleware/errorHandler');

// Initialize Question model (will be injected from server.js)
let Question = null;

const initializeQuestionRoutes = (questionModel) => {
  Question = questionModel;
  return router;
};

// Get question expected output
router.get('/questions/:id/output', questionIdValidation, handleValidationErrors, asyncHandler((req, res) => {
  return getQuestionOutput(req, res, Question);
}));

// Get questions with pagination
router.get('/questions', questionsQueryValidation, handleValidationErrors, asyncHandler((req, res) => {
  return getQuestions(req, res, Question);
}));

// Get random questions
router.get('/random-questions', asyncHandler((req, res) => {
  return getRandomQuestions(req, res, Question);
}));

module.exports = initializeQuestionRoutes;

