const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  let token = req.cookies.token;

  // Debug logging (remove in production)
  if (process.env.NODE_ENV !== 'production') {
    logger.info('Auth check - All cookies:', req.cookies);
    logger.info('Auth check - Cookie header:', req.headers.cookie);
    logger.info('Auth check - Token from req.cookies:', !!token);
  }

  // If cookie parser didn't get it, try parsing the cookie header manually
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    token = cookies.token;
    
    if (process.env.NODE_ENV !== 'production') {
      logger.info('Auth check - Parsed cookie header, token found:', !!token);
    }
  }

  // Fallback: try to get token from Authorization header
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('No token found in cookies, cookie header, or authorization header');
    }
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key-change-in-production');
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = authenticateToken;

