// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN 
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-CSRF-TOKEN', // Allow CSRF token header
    'X-Requested-With' // Common header for AJAX requests
  ],
  exposedHeaders: ['X-CSRF-TOKEN'], // Expose CSRF token in response if needed
};

module.exports = corsOptions;

