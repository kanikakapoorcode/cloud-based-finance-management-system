const express = require('express');
const { 
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesByType
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const { validate, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

// Routes for /api/v1/categories
router.route('/')
  .get(validate.list, getCategories)
  .post([
    authorize('admin'),
    sanitizeInput,
    validate.createCategory,
    createCategory
  ]);

// Routes for /api/v1/categories/type/:type
router.route('/type/:type')
  .get(validate.getCategoriesByType, getCategoriesByType);

// Routes for /api/v1/categories/:id
router.route('/:id')
  .get(validate.getCategory, getCategory)
  .put([
    authorize('admin'),
    sanitizeInput,
    validate.updateCategory,
    updateCategory
  ])
  .delete([
    authorize('admin'),
    validate.deleteCategory,
    deleteCategory
  ]);

module.exports = router;
