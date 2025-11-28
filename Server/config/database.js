const mongoose = require('mongoose');
const logger = require('./logger');

// MongoDB connection configuration
const connectDatabases = () => {
  if (!process.env.MONGODB_USER_DB || !process.env.MONGODB_PROBLEMS_DB) {
    logger.error('MongoDB connection strings are not set in environment variables');
    process.exit(1);
  }

  const userDb = mongoose.createConnection(process.env.MONGODB_USER_DB);
  const problemsDb = mongoose.createConnection(process.env.MONGODB_PROBLEMS_DB);

  userDb.on('connected', () => logger.info('User database connected'));
  problemsDb.on('connected', () => logger.info('Problems database connected'));

  userDb.on('error', err => logger.error('User DB connection error:', err));
  problemsDb.on('error', err => logger.error('Problems DB connection error:', err));

  userDb.on('disconnected', () => logger.warn('User database disconnected'));
  problemsDb.on('disconnected', () => logger.warn('Problems database disconnected'));

  return { userDb, problemsDb };
};

module.exports = { connectDatabases };

