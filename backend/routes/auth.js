const express = require('express');
const { register, login, getMe } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Handle user registration
router.route('/register')
  .post(register);

// Alias for /register
router.route('/signup')
  .post(register);

// Handle user login
router.route('/login')
  .post(login);

// Get current user (protected route)
router.route('/me')
  .get(protect, getMe);

module.exports = router;
