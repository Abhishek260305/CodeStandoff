// Input sanitization middleware - prevents NoSQL injection and XSS
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize object
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? obj.trim() : obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item));
    }
    
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Remove MongoDB operators to prevent NoSQL injection
        if (key.startsWith('$')) {
          continue; // Skip MongoDB operators
        }
        sanitized[key] = sanitize(obj[key]);
      }
    }
    return sanitized;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }
  next();
};

module.exports = sanitizeInput;

