const ErrorResponse = require('../utils/errorResponse');

// Wrapper function to handle async/await errors in route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error(`Async Error: ${err.message}`);
    
    // If the error is already an instance of ErrorResponse, pass it to the next middleware
    if (err instanceof ErrorResponse) {
      return next(err);
    }
    
    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return next(new ErrorResponse(`Validation Error: ${messages.join(', ')}`, 400));
    }
    
    // Handle mongoose duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return next(new ErrorResponse(`Duplicate field value: ${field}`, 400));
    }
    
    // Handle invalid ObjectId errors
    if (err.name === 'CastError') {
      return next(new ErrorResponse(`Resource not found with id of ${err.value}`, 404));
    }
    
    // For any other unhandled errors, pass a generic server error
    next(new ErrorResponse('Server Error', 500));
  });
};

module.exports = asyncHandler;
