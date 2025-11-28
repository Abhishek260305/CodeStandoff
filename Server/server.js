// Load environment variables
require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Import configurations
const { connectDatabases } = require('./config/database');
const logger = require('./config/logger');
const { requestLogger } = require('./config/logger');
const corsOptions = require('./config/cors');

// Import models
const userSchema = require('./models/User');
const questionSchema = require('./models/Question');

// Import middleware
const sanitizeInput = require('./middleware/sanitization');
const { apiLimiter } = require('./config/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { csrfProtection, generateToken, getCsrfToken } = require('./middleware/csrf');
const { helmetConfig } = require('./config/helmet');
const { requestTimeout, configureServerTimeout } = require('./middleware/requestTimeout');

// Import routes
const initializeAuthRoutes = require('./routes/authRoutes');
const initializeQuestionRoutes = require('./routes/questionRoutes');
const codeExecutionRoutes = require('./routes/codeExecutionRoutes');

// Import sockets
const initializeGameSocket = require('./sockets/gameSocket');

// Initialize Express app
const app = express();

// Request logging middleware
app.use(requestLogger);

// Security headers (must be before other middleware)
app.use(helmetConfig);

// Request timeout (should be early in middleware chain)
app.use(requestTimeout);

// Set up middleware for JSON parsing, cookies, and CORS
app.use(express.json({ limit: '10mb' })); // Request size limit
app.use(cookieParser());
app.use(cors(corsOptions));

// Apply sanitization to all routes
app.use(sanitizeInput);

// Apply general API rate limiting (100 requests per 15 minutes)
// Note: Specific route limiters (login, signup) will override this
app.use(apiLimiter);

// CSRF token generation for GET requests (before routes)
app.use(generateToken);

// CSRF token endpoint
app.get('/csrf-token', getCsrfToken);

// Connect to databases
const { userDb, problemsDb } = connectDatabases();

// Initialize models
const User = userDb.model('User', userSchema);
const Question = problemsDb.model('Question', questionSchema);

// Initialize routes with models
app.use('/', initializeAuthRoutes(User));
app.use('/', initializeQuestionRoutes(Question));
app.use('/api', codeExecutionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint for timeout testing (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.get('/test-timeout', async (req, res) => {
    const delay = parseInt(req.query.delay) || 5000;
    await new Promise(resolve => setTimeout(resolve, delay));
    res.json({ message: 'Response after delay', delay });
  });
}

// 404 handler for undefined routes (must be after all routes)
app.use(notFoundHandler);

// Error handler middleware (must be last)
app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);

// Configure server-level timeouts
configureServerTimeout(server);

// Initialize Socket.IO
initializeGameSocket(server, Question);

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    userDb.close();
    problemsDb.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    userDb.close();
    problemsDb.close();
    process.exit(0);
  });
});
