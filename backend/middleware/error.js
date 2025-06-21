const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Default error object
  let error = { ...err };
  error.message = err.message;
  
  // Log the error with request context
  const errorContext = {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    code: err.code,
    keyValue: err.keyValue,
    errors: err.errors,
    request: {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      user: req.user ? { id: req.user._id, role: req.user.role } : undefined,
      ip: req.ip,
      userAgent: req.get('user-agent')
    }
  };
  
  // Log the error with appropriate level
  if (error.statusCode >= 500) {
    logger.error('Server Error', errorContext);
  } else if (error.statusCode >= 400) {
    logger.warn('Client Error', errorContext);
  } else {
    logger.error('Unhandled Error', errorContext);
  }

  // Handle specific error types
  switch (err.name) {
    // Database errors
    case 'CastError':
      error = new ErrorResponse('Resource not found', 404);
      break;
      
    case 'ValidationError':
      const messages = Object.values(err.errors).map(val => val.message);
      error = new ErrorResponse(messages, 400);
      break;
      
    case 'MongoServerError':
      if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        error = new ErrorResponse(`Duplicate field value: ${field} already exists`, 400);
      } else {
        error = new ErrorResponse('Database error', 500);
      }
      break;
      
    case 'JsonWebTokenError':
      error = new ErrorResponse('Invalid token', 401);
      break;
      
    case 'TokenExpiredError':
      error = new ErrorResponse('Token expired', 401);
      break;
      
    case 'UnauthorizedError':
      error = new ErrorResponse('Not authorized', 401);
      break;
      
    case 'ForbiddenError':
      error = new ErrorResponse('Forbidden', 403);
      break;
      
    case 'NotFoundError':
      error = new ErrorResponse('Resource not found', 404);
      break;
      
    default:
      // Handle mongoose errors
      if (err.name === 'MongooseError') {
        error = new ErrorResponse('Database error', 500);
      }
      break;
  }
  
  // Handle validation errors from express-validator
  if (err.errors && Array.isArray(err.errors)) {
    const messages = err.errors.map(e => e.msg);
    error = new ErrorResponse(messages, 400);
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Not authorized';
    error = new ErrorResponse(message, 401);
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    const message = 'Token has expired';
    error = new ErrorResponse(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
