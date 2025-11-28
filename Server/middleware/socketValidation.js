// Input validation for socket events
const validateSocketInput = {
  // Validate joinGame event (no input needed, but check authentication)
  joinGame: (socket, data, next) => {
    if (!socket.data.user) {
      return next(new Error('Authentication required'));
    }
    // No data validation needed for joinGame
    next();
  },

  // Validate sendMessage event
  sendMessage: (socket, data, next) => {
    if (!socket.data.user) {
      return next(new Error('Authentication required'));
    }

    // Validate message data
    if (typeof data !== 'string' && typeof data !== 'object') {
      return next(new Error('Invalid message format'));
    }

    // If it's an object, extract the message
    const message = typeof data === 'string' ? data : data.message || data.text;

    if (!message || typeof message !== 'string') {
      return next(new Error('Message is required and must be a string'));
    }

    // Validate message length (prevent DoS via large messages)
    if (message.length > 1000) {
      return next(new Error('Message too long. Maximum 1000 characters allowed'));
    }

    // Basic XSS prevention - escape HTML
    const sanitizedMessage = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .trim();

    // Attach sanitized message to socket data
    socket.data.sanitizedMessage = sanitizedMessage;
    next();
  },

  // Validate surrender event (no input needed)
  surrender: (socket, data, next) => {
    if (!socket.data.user) {
      return next(new Error('Authentication required'));
    }
    // No data validation needed for surrender
    next();
  }
};

module.exports = validateSocketInput;

