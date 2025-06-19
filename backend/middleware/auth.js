const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const db = require('../services/db');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  } 
  // Set token from cookie
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from in-memory database
    const users = await db.getUsers();
    const user = users.find(u => u._id === decoded.id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user?.role || 'guest'} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
