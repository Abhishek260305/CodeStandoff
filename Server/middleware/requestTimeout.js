const logger = require('../config/logger');

// Default timeout values (in milliseconds)
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const LONG_RUNNING_TIMEOUT = 60000; // 60 seconds for code execution
const SHORT_TIMEOUT = 10000; // 10 seconds for simple requests

// Timeout configuration based on route patterns
const getTimeoutForRoute = (path, method) => {
  // Long-running operations
  if (path.includes('/execute') || path.includes('/api/execute')) {
    return LONG_RUNNING_TIMEOUT; // Code execution needs more time
  }

  // File uploads (if any)
  if (path.includes('/upload') || path.includes('/file')) {
    return LONG_RUNNING_TIMEOUT;
  }

  // Simple GET requests
  if (method === 'GET' && !path.includes('/stream')) {
    return SHORT_TIMEOUT;
  }

  // Default timeout for other requests
  return DEFAULT_TIMEOUT;
};

// Request timeout middleware
const requestTimeout = (req, res, next) => {
  const timeout = getTimeoutForRoute(req.path, req.method);
  const timeoutMs = parseInt(process.env.REQUEST_TIMEOUT) || timeout;

  // Track request start time
  req.startTime = Date.now();
  let timeoutHandled = false;

  // Set timeout on the request socket
  req.setTimeout(timeoutMs, () => {
    if (!timeoutHandled && !res.headersSent && !res.finished) {
      timeoutHandled = true;
      logger.warn('Request timeout', {
        path: req.path,
        method: req.method,
        timeout: timeoutMs,
        ip: req.ip || req.connection?.remoteAddress || 'unknown'
      });

      // Destroy the request socket to free resources
      if (req.socket && !req.socket.destroyed) {
        req.socket.destroy();
      }

      // Send timeout response if headers not sent
      if (!res.headersSent) {
        try {
          res.status(408).json({
            error: true,
            message: 'Request timeout. The request took too long to process.',
            timeout: timeoutMs
          });
        } catch (error) {
          // Response may already be sent, ignore
          logger.error('Error sending timeout response:', error);
        }
      }
    }
  });

  // Set timeout on the response
  const responseTimeout = setTimeout(() => {
    if (!timeoutHandled && !res.headersSent && !res.finished) {
      timeoutHandled = true;
      logger.warn('Response timeout', {
        path: req.path,
        method: req.method,
        timeout: timeoutMs,
        ip: req.ip || req.connection?.remoteAddress || 'unknown'
      });

      try {
        res.status(408).json({
          error: true,
          message: 'Request timeout. The server took too long to respond.',
          timeout: timeoutMs
        });
      } catch (error) {
        // Response may already be sent, ignore
        logger.error('Error sending timeout response:', error);
      }
    }
  }, timeoutMs);

  // Clear timeout when response is sent
  res.on('finish', () => {
    clearTimeout(responseTimeout);
    const duration = Date.now() - req.startTime;
    if (duration > timeoutMs * 0.8) {
      logger.warn('Request took close to timeout', {
        path: req.path,
        method: req.method,
        duration: duration,
        timeout: timeoutMs
      });
    }
  });

  // Clear timeout on response close
  res.on('close', () => {
    clearTimeout(responseTimeout);
  });

  next();
};

// Server-level timeout configuration
const configureServerTimeout = (server) => {
  // Set server timeout (for keep-alive connections)
  const serverTimeout = parseInt(process.env.SERVER_TIMEOUT) || 120000; // 2 minutes
  server.timeout = serverTimeout;
  server.keepAliveTimeout = 65000; // 65 seconds (just below common load balancer timeout)
  server.headersTimeout = 66000; // 66 seconds (just above keepAliveTimeout)

  logger.info('Server timeout configured', {
    serverTimeout: serverTimeout,
    keepAliveTimeout: server.keepAliveTimeout,
    headersTimeout: server.headersTimeout
  });
};

// Graceful timeout handler for long-running operations
const withTimeout = async (promise, timeoutMs, errorMessage = 'Operation timed out') => {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(errorMessage));
      }, timeoutMs);
    })
  ]);
};

module.exports = {
  requestTimeout,
  configureServerTimeout,
  withTimeout,
  DEFAULT_TIMEOUT,
  LONG_RUNNING_TIMEOUT,
  SHORT_TIMEOUT
};

