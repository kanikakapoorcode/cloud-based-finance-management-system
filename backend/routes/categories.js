const express = require('express');
const { 
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesByType
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

// Routes for /api/v1/categories
router.route('/')
  .get(getCategories)
  .post(createCategory);

// Routes for /api/v1/categories/type/:type
router.route('/type/:type')
  .get(getCategoriesByType);

// Routes for /api/v1/categories/:id
router.route('/:id')
  .get(getCategory)
  .put(updateCategory)
  .delete(deleteCategory);

module.exports = router;
