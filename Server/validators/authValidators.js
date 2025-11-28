const { body } = require('express-validator');

// Validation rules for signup
const signupValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 1, max: 50 }).withMessage('First name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('First name can only contain letters and spaces')
    .escape(),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 1, max: 50 }).withMessage('Last name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Last name can only contain letters and spaces')
    .escape(),
  
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores')
    .escape(),
  
  body('contact')
    .trim()
    .notEmpty().withMessage('Contact number is required')
    .matches(/^\d{10}$/).withMessage('Contact number must be exactly 10 digits')
    .escape(),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('Email must be less than 100 characters'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/).withMessage('Password must contain at least one letter, one number, and one special character (!@#$%^&*)')
    .isLength({ max: 128 }).withMessage('Password must be less than 128 characters')
];

// Validation rules for login
const loginValidation = [
  body('usernameOrEmail')
    .custom((value) => {
      // Ensure it's a string, not an object (prevents NoSQL injection)
      if (typeof value !== 'string') {
        throw new Error('Username or email must be a string');
      }
      return true;
    })
    .trim()
    .notEmpty().withMessage('Username or email is required')
    .isLength({ min: 1, max: 100 }).withMessage('Username or email must be between 1 and 100 characters')
    .escape(),
  
  body('password')
    .custom((value) => {
      // Ensure it's a string, not an object
      if (typeof value !== 'string') {
        throw new Error('Password must be a string');
      }
      return true;
    })
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 1, max: 128 }).withMessage('Password must be between 1 and 128 characters')
];

module.exports = {
  signupValidation,
  loginValidation
};

