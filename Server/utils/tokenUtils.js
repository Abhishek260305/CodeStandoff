const jwt = require('jsonwebtoken');

// JWT Token generation function
const generateToken = (userId, username) => {
  return jwt.sign(
    { userId, username },
    process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

// Get cookie options based on environment
const getCookieOptions = () => {
  const cookieOptions = {
    httpOnly: true, // Prevents JavaScript access to cookie (XSS protection)
    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/', // Available site-wide
  };

  return cookieOptions;
};

module.exports = {
  generateToken,
  getCookieOptions
};

