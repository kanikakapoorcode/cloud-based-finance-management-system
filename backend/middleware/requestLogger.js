const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Middleware to add request ID and log HTTP requests
 */
const requestLogger = (req, res, next) => {
  // Generate a unique request ID
  const requestId = uuidv4();
  
  // Add request ID to request object
  req.requestId = requestId;
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Log request start
  const start = Date.now();
  
  // Log request details (excluding sensitive data)
  const requestLog = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    requestId,
  };
  
  // Log request body if present (excluding sensitive fields)
  if (req.body && Object.keys(req.body).length > 0) {
    const { password, newPassword, confirmPassword, ...sanitizedBody } = req.body;
    requestLog.body = sanitizedBody;
  }
  
  logger.info('Request started', requestLog);
  
  // Log response when it's finished
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    // Log response details
    const responseLog = {
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      requestId,
    };
    
    // Log error responses
    if (res.statusCode >= 400) {
      logger.error('Request error', responseLog);
    } else {
      logger.info('Request completed', responseLog);
    }
    
    // Call the original end function
    originalEnd.apply(res, arguments);
  };
  
  next();
};

module.exports = requestLogger;
