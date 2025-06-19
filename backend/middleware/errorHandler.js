const ErrorResponse = require('../utils/errorResponse');
const { isCelebrateError } = require('celebrate');

// Error handling middleware
exports.errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(err.stack.red);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  // Celebrate validation error
  if (isCelebrateError(err)) {
    const validationErrors = [];
    for (const [segment, joiError] of err.details.entries()) {
      validationErrors.push({
        segment,
        message: joiError.message,
        details: joiError.details.map(d => ({
          message: d.message,
          path: d.path,
          type: d.type,
          context: d.context
        }))
      });
    }
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: validationErrors
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Not authorized';
    error = new ErrorResponse(message, 401);
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    const message = 'Token has expired';
    error = new ErrorResponse(message, 401);
  }

  // Default to 500 server error
  // Prepare error response
  const errorResponse = {
    success: false,
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      error: {
        name: error.name,
        code: error.code,
        details: error.details || undefined
      }
    })
  };

  // Remove stack trace in production
  if (process.env.NODE_ENV !== 'development') {
    delete errorResponse.stack;
  }

  // Send error response
  res.status(error.statusCode).json(errorResponse);
};

// 404 Not Found handler
exports.notFound = (req, res, next) => {
  const error = new ErrorResponse(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

// Handle async/await errors
exports.asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(err => {
    // Log the error with additional context
    logger.error({
      message: 'Async handler error',
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query
      },
      timestamp: new Date().toISOString()
    });
    
    next(err);
  });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  // Close server & exit process
  // Consider using a process manager like PM2 to restart the app
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Close server & exit process
  // Consider using a process manager like PM2 to restart the app
  process.exit(1);
});

// Handle SIGTERM for graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  // Close server & exit process
  process.exit(0);
});
