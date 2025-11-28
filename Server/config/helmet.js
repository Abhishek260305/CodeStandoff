const helmet = require('helmet');
const logger = require('./logger');

// Configure Helmet.js with security headers
const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts for React dev
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.NODE_ENV === 'production' 
        ? process.env.CORS_ORIGIN 
        : 'http://localhost:3000'],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null, // Only in production
    },
  },
  
  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Disable for Socket.IO compatibility
  
  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { policy: "same-origin" },
  
  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin for API
  
  // DNS Prefetch Control
  dnsPrefetchControl: true,
  
  // Expect-CT (Certificate Transparency) - Deprecated but still useful
  // Note: Expect-CT is deprecated, but we'll keep it for older browsers
  // expectCt: false, // Disabled as it's deprecated
  
  // Frameguard (X-Frame-Options)
  frameguard: {
    action: 'deny' // Prevent clickjacking
  },
  
  // Hide Powered-By
  hidePoweredBy: true,
  
  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // IE No Open
  ieNoOpen: true,
  
  // No Sniff (X-Content-Type-Options)
  noSniff: true,
  
  // Origin Agent Cluster
  originAgentCluster: true,
  
  // Permissions Policy (formerly Feature-Policy)
  // Format: feature-name=(), feature-name=()
  permissionsPolicy: {
    accelerometer: [],
    ambientLightSensor: [],
    autoplay: [],
    battery: [],
    camera: [],
    crossOriginIsolated: [],
    displayCapture: [],
    documentDomain: [],
    encryptedMedia: [],
    executionWhileNotRendered: [],
    executionWhileOutOfViewport: [],
    fullscreen: ["self"],
    geolocation: [],
    gyroscope: [],
    keyboardMap: [],
    magnetometer: [],
    microphone: [],
    midi: [],
    navigationOverride: [],
    payment: [],
    pictureInPicture: [],
    publickeyCredentials: [],
    screenWakeLock: [],
    syncXhr: [],
    usb: [],
    webShare: [],
    xrSpatialTracking: [],
  },
  
  // Referrer Policy
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin"
  },
  
  // XSS Protection (legacy, but still useful)
  xssFilter: true,
});

// Custom middleware to log security header violations
const securityHeaderLogger = (req, res, next) => {
  // Log CSP violations if any (would need CSP reporting endpoint)
  next();
};

module.exports = {
  helmetConfig,
  securityHeaderLogger
};

