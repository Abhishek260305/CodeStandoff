const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  logger.info(`Request URL: ${req.originalUrl}, Method: ${req.method}`);
  next();
};

module.exports = logger;
module.exports.requestLogger = requestLogger;

