const express = require('express');
const router = express.Router();
const { signupValidation, loginValidation } = require('../validators/authValidators');
const handleValidationErrors = require('../middleware/validation');
const authenticateToken = require('../middleware/auth');
const { signup, login, logout, verifyAuth } = require('../controllers/authController');
const { loginLimiter, signupLimiter } = require('../config/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');
const { verifyToken } = require('../middleware/csrf');

// Initialize User model (will be injected from server.js)
let User = null;

const initializeAuthRoutes = (userModel) => {
  User = userModel;
  return router;
};

// Signup route with CSRF protection and rate limiting (3 attempts per hour)
router.post('/signup', verifyToken, signupLimiter, signupValidation, handleValidationErrors, asyncHandler((req, res) => {
  return signup(req, res, User);
}));

// Login route with CSRF protection and rate limiting (5 attempts per 15 minutes)
router.post('/login', verifyToken, loginLimiter, loginValidation, handleValidationErrors, asyncHandler((req, res) => {
  return login(req, res, User);
}));

// Logout route with CSRF protection
router.post('/logout', verifyToken, logout);

// Verify authentication status
router.get('/auth/verify', authenticateToken, asyncHandler((req, res) => {
  return verifyAuth(req, res, User);
}));

module.exports = initializeAuthRoutes;

