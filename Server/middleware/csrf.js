const csrf = require('csrf');
const logger = require('../config/logger');

// CSRF secret - should be stored in environment variable
const CSRF_SECRET = process.env.CSRF_SECRET || 'csrf-secret-key-change-in-production';
const tokens = new csrf({ secret: CSRF_SECRET });

// Generate CSRF token
const generateToken = (req, res, next) => {
  try {
    // Get or create secret from cookie
    let secret = req.cookies?.csrfSecret;
    
    if (!secret) {
      // Generate new secret
      secret = tokens.secretSync();
      // Store in cookie
      res.cookie('csrfSecret', secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
    }

    // Generate token from secret
    const token = tokens.create(secret);
    
    // Store token in response for client
    res.locals.csrfToken = token;
    
    // Also set in cookie for double-submit cookie pattern
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Must be accessible to JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    next();
  } catch (error) {
    logger.error('CSRF token generation error:', error);
    next(error);
  }
};

// Verify CSRF token
const verifyToken = (req, res, next) => {
  try {
    // Get secret from cookie
    const secret = req.cookies?.csrfSecret;
    
    if (!secret) {
      logger.warn('CSRF verification failed - No secret found', {
        path: req.path,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress
      });
      return res.status(403).json({
        error: true,
        message: 'CSRF token missing or invalid'
      });
    }

    // Get token from header, body, or query
    const token = req.headers['x-csrf-token'] || 
                 req.headers['xsrf-token'] ||
                 req.body?._csrf ||
                 req.query?._csrf ||
                 req.cookies?.['XSRF-TOKEN'];

    if (!token) {
      logger.warn('CSRF verification failed - No token provided', {
        path: req.path,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress
      });
      return res.status(403).json({
        error: true,
        message: 'CSRF token missing or invalid'
      });
    }

    // Verify token
    if (!tokens.verify(secret, token)) {
      logger.warn('CSRF verification failed - Invalid token', {
        path: req.path,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress
      });
      return res.status(403).json({
        error: true,
        message: 'CSRF token missing or invalid'
      });
    }

    // Token is valid
    next();
  } catch (error) {
    logger.error('CSRF verification error:', error);
    return res.status(403).json({
      error: true,
      message: 'CSRF token verification failed'
    });
  }
};

// CSRF protection middleware - only for state-changing methods
const csrfProtection = (req, res, next) => {
  // Only protect state-changing methods
  const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (protectedMethods.includes(req.method)) {
    return verifyToken(req, res, next);
  }
  
  // For GET, HEAD, OPTIONS, generate token but don't verify
  return generateToken(req, res, next);
};

// Get CSRF token endpoint (for clients to fetch token)
const getCsrfToken = (req, res) => {
  try {
    // Get or create secret from cookie
    let secret = req.cookies?.csrfSecret;
    
    if (!secret) {
      secret = tokens.secretSync();
      res.cookie('csrfSecret', secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });
    }

    const token = tokens.create(secret);
    
    // Set cookie
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      csrfToken: token,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    logger.error('Error generating CSRF token:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to generate CSRF token'
    });
  }
};

module.exports = {
  csrfProtection,
  generateToken,
  verifyToken,
  getCsrfToken
};

