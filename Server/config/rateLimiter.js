const rateLimit = require('express-rate-limit');
const logger = require('./logger');

// Helper function to get client IP
const getClientIp = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
         'unknown';
};

// Login rate limiter: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many login attempts',
    message: 'Please try again after 15 minutes. Maximum 5 attempts allowed per 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    const clientIp = getClientIp(req);
    logger.warn(`Rate limit exceeded for login - IP: ${clientIp}`);
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Please try again after 15 minutes. Maximum 5 attempts allowed per 15 minutes.',
      retryAfter: '15 minutes'
    });
  },
  skip: (req) => {
    // Skip rate limiting for successful logins (optional - can be removed if you want to count all attempts)
    return false;
  }
});

// Signup rate limiter: 3 attempts per hour
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    error: 'Too many signup attempts',
    message: 'Please try again after 1 hour. Maximum 3 signup attempts allowed per hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const clientIp = getClientIp(req);
    logger.warn(`Rate limit exceeded for signup - IP: ${clientIp}`);
    res.status(429).json({
      error: 'Too many signup attempts',
      message: 'Please try again after 1 hour. Maximum 3 signup attempts allowed per hour.',
      retryAfter: '1 hour'
    });
  }
});

// General API rate limiter: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please slow down. Maximum 100 requests allowed per 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const clientIp = getClientIp(req);
    logger.warn(`Rate limit exceeded for API - IP: ${clientIp}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please slow down. Maximum 100 requests allowed per 15 minutes.',
      retryAfter: '15 minutes'
    });
  },
  skip: (req) => {
    // Skip rate limiting for health check endpoint
    if (req.path === '/health') {
      return true;
    }
    // Skip rate limiting for auth routes (they have their own specific limiters)
    if (req.path === '/login' || req.path === '/signup' || req.path === '/logout' || req.path.startsWith('/auth/')) {
      return true;
    }
    return false;
  }
});

// Strict rate limiter for sensitive operations: 10 requests per hour
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per hour
  message: {
    error: 'Too many requests',
    message: 'Please try again after 1 hour. Maximum 10 requests allowed per hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const clientIp = getClientIp(req);
    logger.warn(`Strict rate limit exceeded - IP: ${clientIp}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again after 1 hour. Maximum 10 requests allowed per hour.',
      retryAfter: '1 hour'
    });
  }
});

module.exports = {
  loginLimiter,
  signupLimiter,
  apiLimiter,
  strictLimiter
};

