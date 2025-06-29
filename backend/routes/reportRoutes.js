const express = require('express');
const { protect } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

const router = express.Router();

// Protected routes - require authentication
router.use(protect);

// Transaction reports
router.get('/transactions', reportController.getTransactionsReport);

// Budget reports
router.get('/budget', reportController.getBudgetReport);
router.get('/budget-vs-actual', reportController.getBudgetVsActual);

// Summary reports
router.get('/summary', reportController.getFinancialSummary);

// Category reports
router.get('/category-wise', reportController.getCategoryWiseReport);

// Export reports
router.post('/export', reportController.exportReport);

module.exports = router;
