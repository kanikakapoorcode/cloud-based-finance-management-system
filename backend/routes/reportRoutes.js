const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getTransactionsReport,
  getBudgetReport,
  exportReport
} = require('../controllers/reportController');

const router = express.Router();

// Protected routes - require authentication
router.use(protect);

// Transaction reports
router.get('/transactions', getTransactionsReport);

// Budget reports
router.get('/budget', getBudgetReport);

// Export reports
router.post('/export', exportReport);

module.exports = router;
