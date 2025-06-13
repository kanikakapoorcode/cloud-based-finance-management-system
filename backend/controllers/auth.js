const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const jwt = require('jsonwebtoken');
const { createDefaultCategories } = require('../utils/defaultCategories');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @route   POST /api/v1/auth/signup
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User already exists', 400));
  }

  try {
    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    // Create default categories for the new user
    await createDefaultCategories(user._id);

    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error('Error creating user:', err);
    return next(new ErrorResponse('Error creating user', 500));
  }
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // Validate email & password
    if (!email || !password) {
      console.log('Missing email or password');
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for user
    console.log('Looking up user in database...');
    const user = await User.findOne({ email }).select('+password');
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('No user found with email:', email);
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    console.log('Checking password...');
    const isMatch = await user.matchPassword(password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    console.log('Login successful for user:', email);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    next(error);
  }
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // The user object from login might contain the password, so we create a new object
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    token: token
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      data: userResponse
    });
};
