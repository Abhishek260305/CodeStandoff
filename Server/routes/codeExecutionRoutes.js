const express = require('express');
const router = express.Router();
const { validateCodeExecution } = require('../middleware/codeExecutionSecurity');
const { executeCode } = require('../controllers/codeExecutionController');
const { asyncHandler } = require('../middleware/errorHandler');
const { verifyToken } = require('../middleware/csrf');
const authenticateToken = require('../middleware/auth');

// Code execution route with authentication, CSRF, and validation
router.post('/execute', 
  authenticateToken, // Require authentication
  verifyToken, // Require CSRF token
  validateCodeExecution, // Validate code and language
  asyncHandler(executeCode)
);

module.exports = router;

