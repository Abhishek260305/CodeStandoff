const logger = require('../config/logger');
const { AppError } = require('../middleware/errorHandler');

// Get question expected output
const getQuestionOutput = async (req, res, Question) => {
  try {
    const { id } = req.params;

    // Attempt to find the question by ID
    const question = await Question.findById(id);
    
    // If the question does not exist, throw 404 error
    if (!question) {
      throw new AppError('Question not found', 404);
    }

    // Attempt to retrieve the expected output
    const expectedOutput = question['Expected Output'];

    // If expected output does not exist, throw 404 error
    if (!expectedOutput) {
      throw new AppError('Expected output not found for this question', 404);
    }

    // If everything is fine, return the expected output
    res.status(200).json({ expectedOutput });
  } catch (error) {
    // Let error handler middleware handle it
    throw error;
  }
};

// Get questions with pagination
const getQuestions = async (req, res, Question) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 25;
    const skip = (page - 1) * limit;

    const total = await Question.countDocuments();
    const questions = await Question.find().skip(skip).limit(limit);

    res.status(200).json({ questions, total });
  } catch (error) {
    // Let error handler middleware handle it
    throw error;
  }
};

// Get random questions
const getRandomQuestions = async (req, res, Question) => {
  try {
    const questionsCount = await Question.countDocuments();
    const randomIndexes = Array.from({ length: 3 }, () => Math.floor(Math.random() * questionsCount));
    
    const questions = await Promise.all(
      randomIndexes.map(index => Question.findOne().skip(index))
    );

    res.status(200).json(questions);
  } catch (error) {
    // Let error handler middleware handle it
    throw error;
  }
};

module.exports = {
  getQuestionOutput,
  getQuestions,
  getRandomQuestions
};

