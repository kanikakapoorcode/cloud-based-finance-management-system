const ErrorResponse = require('../utils/errorResponse');

// Wrapper function to handle async/await errors in route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error('=== ASYNC HANDLER ERROR ===');
    console.error('Error:', err);
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    console.error('Request URL:', req.originalUrl);
    console.error('Request Method:', req.method);
    console.error('Request Body:', req.body);
    console.error('Request Params:', req.params);
    console.error('Request Query:', req.query);
    console.error('Request User:', req.user);
    
    // If the error is already an instance of ErrorResponse, pass it to the next middleware
    if (err instanceof ErrorResponse) {
      console.error('ErrorResponse with status:', err.statusCode);
      return next(err);
    }
    
    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
      console.error('Mongoose Validation Error:', err.errors);
      const messages = Object.values(err.errors).map(val => val.message);
      return next(new ErrorResponse(`Validation Error: ${messages.join(', ')}`, 400));
    }
    
    // Handle mongoose duplicate key errors
    if (err.code === 11000) {
      console.error('Duplicate Key Error:', err.keyValue);
      const field = Object.keys(err.keyValue)[0];
      return next(new ErrorResponse(`Duplicate field value: ${field}`, 400));
    }
    
    // Handle invalid ObjectId errors
    if (err.name === 'CastError') {
      console.error('Cast Error:', err);
      return next(new ErrorResponse(`Resource not found with id of ${err.value}`, 404));
    }
    
    // Log any additional error codes or properties
    if (err.code) {
      console.error('Error Code:', err.code);
    }
    if (err.keyPattern) {
      console.error('Key Pattern:', err.keyPattern);
    }
    if (err.keyValue) {
      console.error('Key Value:', err.keyValue);
    }
    
    console.error('=== END ERROR HANDLER ===');
    
    // For any other unhandled errors, include the error message in the response
    next(new ErrorResponse(`Server Error: ${err.message || 'An unexpected error occurred'}`, 500));
  });
};

module.exports = asyncHandler;
