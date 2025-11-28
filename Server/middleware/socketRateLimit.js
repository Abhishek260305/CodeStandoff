const logger = require('../config/logger');

// Rate limiting for socket events
// Using in-memory storage (consider Redis for production with multiple servers)
const socketEventLimits = new Map();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of socketEventLimits.entries()) {
    if (now > data.resetTime) {
      socketEventLimits.delete(key);
    }
  }
}, 60000); // Clean up every minute

// Rate limiter for socket events
const createSocketRateLimiter = (eventName, maxRequests, windowMs) => {
  return (socket, data, next) => {
    const socketId = socket.id;
    const key = `${socketId}:${eventName}`;
    const now = Date.now();

    // Get or create rate limit entry
    let limitData = socketEventLimits.get(key);

    if (!limitData || now > limitData.resetTime) {
      // Create new rate limit entry
      limitData = {
        count: 0,
        resetTime: now + windowMs
      };
      socketEventLimits.set(key, limitData);
    }

    // Increment count
    limitData.count++;

    if (limitData.count > maxRequests) {
      logger.warn(`Socket rate limit exceeded - Event: ${eventName}, Socket ID: ${socketId}, Count: ${limitData.count}`);
      socket.emit('error', {
        type: 'rate_limit_exceeded',
        message: `Too many ${eventName} requests. Please slow down.`,
        retryAfter: Math.ceil((limitData.resetTime - now) / 1000) // seconds
      });
      return next(new Error(`Rate limit exceeded for ${eventName}`));
    }

    // Allow the event
    next();
  };
};

// Pre-configured rate limiters for common events
const socketRateLimiters = {
  // joinGame: 5 attempts per minute
  joinGame: createSocketRateLimiter('joinGame', 5, 60 * 1000),
  
  // sendMessage: 20 messages per minute
  sendMessage: createSocketRateLimiter('sendMessage', 20, 60 * 1000),
  
  // surrender: 3 attempts per 5 minutes
  surrender: createSocketRateLimiter('surrender', 3, 5 * 60 * 1000),
};

module.exports = {
  createSocketRateLimiter,
  socketRateLimiters
};

