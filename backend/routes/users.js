const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { validate, sanitizeInput } = require('../middleware/validation');
const userController = require('../controllers/userController');

const router = express.Router();

// All routes are protected
router.use(protect);

// User profile routes
router.get('/me', userController.getMe);
router.put('/me', [
  sanitizeInput,
  validate.updateUser,
  userController.updateDetails
]);

router.put('/update-password', [
  sanitizeInput,
  validate.updatePassword,
  userController.updatePassword
]);

// Admin routes - only accessible by admin
router.use(authorize('admin'));

// User management routes
router.get('/', userController.getAllUsers);
router.post('/', [
  sanitizeInput,
  validate.createUser,
  userController.createUser
]);

// User by ID routes
router.get('/:id', userController.getUser);
router.put('/:id', [
  sanitizeInput,
  validate.updateUser,
  userController.updateUser
]);
router.delete('/:id', userController.deleteUser);

module.exports = router;
