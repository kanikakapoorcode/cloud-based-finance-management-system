const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const db = require('../services/db');
const logger = require('../utils/logger');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth endpoints
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many login attempts, please try again after 15 minutes',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip; // Use IP address for rate limiting
  }
});

// Token validation
const validateToken = (token) => {
  if (!token) {
    throw new Error('No token provided');
  }
  
  // Check token format
  if (!/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(token)) {
    throw new Error('Invalid token format');
  }
  
  return true;
};

// Protect routes
exports.protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  
  // Extract token from Authorization header or cookies
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Check if token exists
  if (!token) {
    logger.warn('No authentication token provided', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Validate token format before verification
    validateToken(token);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      ignoreExpiration: false
    });
    
    if (!decoded || !decoded.id) {
      throw new Error('Invalid token payload');
    }
    
    // Get user from database
    const user = await db.findById(decoded.id);
    
    if (!user) {
      logger.warn('User not found for token', {
        userId: decoded.id,
        ip: req.ip
      });
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Check if user account is active
    if (user.isActive === false) {
      logger.warn('Attempt to access deactivated account', {
        userId: user._id,
        email: user.email,
        ip: req.ip
      });
      return next(new ErrorResponse('Account is deactivated', 403));
    }
    
    // Attach user to request object
    req.user = user;
    req.token = token;
    
    // Set user info in response locals for logging
    res.locals.user = {
      id: user._id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (err) {
    logger.error('Authentication error', {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      ip: req.ip,
      path: req.path
    });
    
    let message = 'Not authorized to access this route';
    let statusCode = 401;
    
    if (err.name === 'TokenExpiredError') {
      message = 'Session expired, please log in again';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Invalid token';
    } else if (err.name === 'NotBeforeError') {
      message = 'Token not yet active';
    }
    
    return next(new ErrorResponse(message, statusCode));
  }
};

// Grant access to specific roles with enhanced security
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        logger.warn('Unauthorized access attempt - No user in request', {
          path: req.path,
          method: req.method,
          ip: req.ip
        });
        return next(new ErrorResponse('Authentication required', 401));
      }

      const userRole = req.user.role || 'guest';
      
      // Check if user role is in the allowed roles
      if (!allowedRoles.includes(userRole)) {
        logger.warn('Forbidden access - Insufficient permissions', {
          userId: req.user._id,
          userRole,
          requiredRoles: allowedRoles,
          path: req.path,
          method: req.method,
          ip: req.ip
        });
        
        // Don't reveal which roles are allowed in the error message
        return next(
          new ErrorResponse(
            'You do not have permission to perform this action',
            403
          )
        );
      }

      // Log successful authorization for sensitive operations
      if (req.method !== 'GET') {
        logger.info('Authorized access', {
          userId: req.user._id,
          userRole,
          path: req.path,
          method: req.method,
          ip: req.ip
        });
      }

      next();
    } catch (error) {
      logger.error('Authorization error', {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        userId: req.user?._id,
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      
      next(new ErrorResponse('Authorization error', 500));
    }
  };
};

// Middleware to check if user is the owner of the resource
exports.isOwnerOrAdmin = (modelName, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      // Allow admins to bypass ownership check
      if (req.user.role === 'admin') {
        return next();
      }
      
      const resourceId = req.params[idParam];
      if (!resourceId) {
        return next(new ErrorResponse('Resource ID is required', 400));
      }
      
      // Get the resource from the database
      const resource = await db[modelName].findById(resourceId);
      if (!resource) {
        return next(new ErrorResponse('Resource not found', 404));
      }
      
      // Check if the user is the owner of the resource
      if (resource.user.toString() !== req.user._id.toString()) {
        logger.warn('Forbidden - User is not the owner of the resource', {
          userId: req.user._id,
          resourceId,
          resourceOwner: resource.user,
          model: modelName,
          path: req.path,
          method: req.method,
          ip: req.ip
        });
        return next(new ErrorResponse('Not authorized to access this resource', 403));
      }
      
      // Attach resource to request for use in route handlers
      req[`${modelName.toLowerCase()}`] = resource;
      next();
    } catch (error) {
      logger.error('Ownership check error', {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        userId: req.user?._id,
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      
      next(error);
    }
  };
};
