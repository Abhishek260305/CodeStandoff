const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// Socket.IO authentication middleware
const authenticateSocket = (socket, next) => {
  try {
    // Get token from handshake auth (client sends token in auth object)
    const token = socket.handshake.auth?.token || 
                 socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
                 socket.handshake.query?.token;

    if (!token) {
      logger.warn(`Socket connection rejected - No token provided. Socket ID: ${socket.id}`);
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key-change-in-production');
      
      // Attach user info to socket
      socket.data.user = {
        userId: decoded.userId,
        username: decoded.username
      };

      logger.info(`Socket authenticated - User: ${decoded.username}, Socket ID: ${socket.id}`);
      next();
    } catch (error) {
      logger.error(`Socket authentication failed - Invalid token. Socket ID: ${socket.id}`, error);
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  } catch (error) {
    logger.error(`Socket authentication error - Socket ID: ${socket.id}`, error);
    return next(new Error('Authentication error: Token verification failed'));
  }
};

module.exports = authenticateSocket;

