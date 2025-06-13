const express = require('express');
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsSummary,
  getTransactionsByCategory,
  getTransactionsByDate
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

// Routes for /api/v1/transactions
router.route('/')
  .get(getTransactions)
  .post(createTransaction);

// Routes for /api/v1/transactions/summary
router.route('/summary')
  .get(getTransactionsSummary);

// Routes for /api/v1/transactions/by-category
router.route('/by-category')
  .get(getTransactionsByCategory);

// Routes for /api/v1/transactions/by-date
router.route('/by-date')
  .get(getTransactionsByDate);

// Routes for /api/v1/transactions/:id
router.route('/:id')
  .get(getTransaction)
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
