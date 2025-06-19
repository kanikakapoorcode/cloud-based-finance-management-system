const express = require('express');
const rateLimit = require('express-rate-limit');
const { 
  register, 
  login, 
  getMe, 
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  logout
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const { validate, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes
router.post('/register', [
  authLimiter,
  sanitizeInput,
  validate.createUser,
  register
]);

// Alias for /register
router.post('/signup', [
  authLimiter,
  sanitizeInput,
  validate.createUser,
  register
]);

router.post('/login', [
  authLimiter,
  sanitizeInput,
  validate.login,
  login
]);

router.post('/forgotpassword', [
  authLimiter,
  sanitizeInput,
  validate.forgotPassword,
  forgotPassword
]);

router.put('/resetpassword/:resettoken', [
  sanitizeInput,
  validate.resetPassword,
  resetPassword
]);

// Protected routes
router.use(protect);

router.get('/me', getMe);

router.put('/updatedetails', [
  sanitizeInput,
  validate.updateUser,
  updateDetails
]);

router.put('/updatepassword', [
  sanitizeInput,
  validate.updatePassword,
  updatePassword
]);

router.get('/logout', logout);

module.exports = router;
