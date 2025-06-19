class ErrorResponse extends Error {
  /**
   * Create error response
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {Object} [errors] - Optional error details
   */
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;

    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ErrorResponse);
    }

    // Log the error stack in development
    if (process.env.NODE_ENV === 'development') {
      console.error(this.stack);
    }
  }

  /**
   * Create a 400 Bad Request error
   * @param {string} message - Error message
   * @param {Object} [errors] - Optional error details
   * @returns {ErrorResponse}
   */
  static badRequest(message = 'Bad Request', errors = null) {
    return new ErrorResponse(message, 400, errors);
  }

  /**
   * Create a 401 Unauthorized error
   * @param {string} [message='Not authorized to access this route'] - Error message
   * @returns {ErrorResponse}
   */
  static unauthorized(message = 'Not authorized to access this route') {
    return new ErrorResponse(message, 401);
  }

  /**
   * Create a 403 Forbidden error
   * @param {string} [message='Forbidden'] - Error message
   * @returns {ErrorResponse}
   */
  static forbidden(message = 'Forbidden') {
    return new ErrorResponse(message, 403);
  }

  /**
   * Create a 404 Not Found error
   * @param {string} resource - Name of the resource not found
   * @returns {ErrorResponse}
   */
  static notFound(resource = 'Resource') {
    return new ErrorResponse(`${resource} not found`, 404);
  }

  /**
   * Create a 409 Conflict error
   * @param {string} message - Error message
   * @param {Object} [errors] - Optional error details
   * @returns {ErrorResponse}
   */
  static conflict(message = 'Conflict', errors = null) {
    return new ErrorResponse(message, 409, errors);
  }

  /**
   * Create a 422 Unprocessable Entity error
   * @param {string} message - Error message
   * @param {Object} [errors] - Validation errors
   * @returns {ErrorResponse}
   */
  static validationError(message = 'Validation Error', errors = null) {
    return new ErrorResponse(message, 422, errors);
  }

  /**
   * Create a 500 Internal Server Error
   * @param {string} [message='Server Error'] - Error message
   * @returns {ErrorResponse}
   */
  static serverError(message = 'Server Error') {
    return new ErrorResponse(message, 500);
  }

  /**
   * Format validation errors from Mongoose
   * @param {Object} error - Mongoose validation error
   * @returns {Object} - Formatted error response
   */
  static formatValidationError(error) {
    const errors = {};
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
      return this.validationError('Validation failed', errors);
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return this.conflict(`${field} already exists`);
    }
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return this.notFound('Resource');
    }
    
    // For other types of errors, return a generic server error
    return this.serverError();
  }
}

/**
 * Create a 404 Not Found error
 * @param {string} [message='Resource not found'] - Error message
 * @param {string} [code='NOT_FOUND'] - Error code
 * @param {Object} [metadata] - Additional metadata
 * @returns {ErrorResponse}
 */
ErrorResponse.notFound = function(
  message = 'Resource not found',
  code = 'NOT_FOUND',
  metadata = {}
) {
  return new ErrorResponse(
    message,
    404,
    null,
    code,
    { ...metadata, errorType: 'not_found' },
    true
  );
};

/**
 * Create a 409 Conflict error
 * @param {string} [message='Conflict'] - Error message
 * @param {string} [code='CONFLICT'] - Error code
 * @param {Object} [errors] - Error details
 * @param {Object} [metadata] - Additional metadata
 * @returns {ErrorResponse}
 */
ErrorResponse.conflict = function(
  message = 'Conflict',
  code = 'CONFLICT',
  errors = null,
  metadata = {}
) {
  return new ErrorResponse(
    message,
    409,
    errors,
    code,
    { ...metadata, errorType: 'conflict' },
    true
  );
};

/**
 * Create a 422 Unprocessable Entity error
 * @param {string} [message='Unprocessable Entity'] - Error message
 * @param {Object} [errors] - Validation errors
 * @param {string} [code='VALIDATION_ERROR'] - Error code
 * @param {Object} [metadata] - Additional metadata
 * @returns {ErrorResponse}
 */
ErrorResponse.validationError = function(
  message = 'Validation failed',
  errors = {},
  code = 'VALIDATION_ERROR',
  metadata = {}
) {
  return new ErrorResponse(
    message,
    422,
    errors,
    code,
    { ...metadata, errorType: 'validation' },
    true
  );
};

/**
 * Create a 429 Too Many Requests error
 * @param {string} [message='Too many requests, please try again later'] - Error message
 * @param {string} [code='RATE_LIMIT_EXCEEDED'] - Error code
 * @param {Object} [metadata] - Additional metadata including retryAfter
 * @returns {ErrorResponse}
 */
ErrorResponse.tooManyRequests = function(
  message = 'Too many requests, please try again later',
  code = 'RATE_LIMIT_EXCEEDED',
  metadata = {}
) {
  return new ErrorResponse(
    message,
    429,
    null,
    code,
    { ...metadata, errorType: 'rate_limit' },
    true
  );
};

/**
 * Create a 500 Internal Server Error
 * @param {string} [message='Internal Server Error'] - Error message
 * @param {string} [code='INTERNAL_SERVER_ERROR'] - Error code
 * @param {Error} [error] - Original error object
 * @param {Object} [metadata] - Additional metadata
 * @returns {ErrorResponse}
 */
ErrorResponse.internal = function(
  message = 'Internal Server Error',
  code = 'INTERNAL_SERVER_ERROR',
  error = null,
  metadata = {}
) {
  // Log the original error if provided
  if (error && error instanceof Error) {
    logger.error('Internal Server Error', {
      message: error.message,
      stack: error.stack,
      ...metadata
    });
  }

  return new ErrorResponse(
    message,
    500,
    error ? { error: error.message } : null,
    code,
    { ...metadata, errorType: 'server' },
    false // Not an operational error
  );
};

/**
 * Create a 503 Service Unavailable error
 * @param {string} [message='Service Unavailable'] - Error message
 * @param {string} [code='SERVICE_UNAVAILABLE'] - Error code
 * @param {Object} [metadata] - Additional metadata including retryAfter
 * @returns {ErrorResponse}
 */
ErrorResponse.serviceUnavailable = function(
  message = 'Service Unavailable',
  code = 'SERVICE_UNAVAILABLE',
  metadata = {}
) {
  return new ErrorResponse(
    message,
    503,
    null,
    code,
    { ...metadata, errorType: 'unavailable' },
    true
  );
};

// Export the ErrorResponse class
module.exports = ErrorResponse;
