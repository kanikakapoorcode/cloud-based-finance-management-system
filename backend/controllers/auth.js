const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const db = require('../services/db');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @route   POST /api/v1/auth/signup
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  console.log('Registration attempt with data:', req.body);
  const { name, email, password } = req.body;

  // Input validation
  if (!name || !email || !password) {
    console.error('Missing required fields');
    return next(new ErrorResponse('Please provide all required fields', 400));
  }

  try {
    // Check if user already exists
    console.log('Checking for existing user with email:', email);
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      console.error('User already exists:', email);
      return next(new ErrorResponse('User already exists', 400));
    }

    // Create user
    console.log('Creating new user:', { name, email });
    const user = await db.createUser({
      name,
      email,
      password,
      role: 'user'
    });
    
    console.log('User created successfully:', user.email);
    
    // Remove password before sending response
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    
    // Format response to match frontend expectations
    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token: jwt.sign(
          { id: user._id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRE || '30d' }
        )
      }
    });
  } catch (err) {
    console.error('Error in user registration:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    return next(new ErrorResponse('Registration failed: ' + err.message, 500));
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
    const user = await db.findUserByEmail(email);
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('No user found with email:', email);
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    console.log('Checking password...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    console.log('Login successful for user:', email);
    
    // Remove password before sending response
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    
    // Format response to match frontend expectations
    res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token: jwt.sign(
          { id: user._id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRE || '30d' }
        )
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  try {
    const user = await db.getUserById(req.user.id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Remove password before sending
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    
    res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await db.findUserByEmail(email);
    
    if (!user) {
      return next(new ErrorResponse('No user found with that email', 404));
    }
    
    // Generate reset token
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET + user.password,
      { expiresIn: '10m' }
    );
    
    // Save the reset token to the user
    await db.updateUser(user._id, { 
      resetPasswordToken: resetToken,
      resetPasswordExpire: Date.now() + 10 * 60 * 1000 // 10 minutes
    });
    
    // TODO: Send email with reset token
    console.log('Reset token:', resetToken);
    
    res.status(200).json({
      success: true,
      data: { message: 'Email sent with reset instructions' }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    next(error);
  }
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;
    const resetToken = req.params.resettoken;
    
    if (password !== confirmPassword) {
      return next(new ErrorResponse('Passwords do not match', 400));
    }
    
    // Find user by reset token
    const user = await db.findUserByResetToken(resetToken);
    
    if (!user) {
      return next(new ErrorResponse('Invalid or expired token', 400));
    }
    
    // Check if token is expired
    if (Date.now() > user.resetPasswordExpire) {
      return next(new ErrorResponse('Token has expired', 400));
    }
    
    // Update password and clear reset token
    await db.updateUser(user._id, {
      password,
      resetPasswordToken: undefined,
      resetPasswordExpire: undefined
    });
    
    res.status(200).json({
      success: true,
      data: { message: 'Password updated successfully' }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    next(error);
  }
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email
    };
    
    const user = await db.updateUser(req.user.id, fieldsToUpdate);
    
    // Remove password before sending response
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    
    res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Update details error:', error);
    next(error);
  }
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user from database
    const user = await db.getUserById(req.user.id);
    
    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Remove password before sending response
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Update password error:', error);
    next(error);
  }
});

// @desc    Logout user / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000), // 10 seconds
      httpOnly: true
    });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Logout error:', error);
    next(error);
  }
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  try {
    // Create token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    const options = {
      expires: new Date(
        Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    };

    res
      .status(statusCode)
      .cookie('token', token, options)
      .json({
        success: true,
        token,
        data: user
      });
  } catch (error) {
    console.error('Error in sendTokenResponse:', error);
    throw error;
  }
};
