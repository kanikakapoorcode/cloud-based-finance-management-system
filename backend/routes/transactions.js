const express = require('express');
const rateLimit = require('express-rate-limit');
const { celebrate } = require('celebrate');
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsSummary
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
const { validate, sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// Rate limiting for transaction routes
const createTransactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many transaction requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all transaction routes
router.use(createTransactionLimiter);

// All routes are protected and require authentication
router.use(protect);

// Routes for /api/v1/transactions
router.route('/')
  .get(
    validate.list,
    getTransactions
  )
  .post(
    sanitizeInput,
    validate.createTransaction,
    createTransaction
  );

// Routes for /api/v1/transactions/summary
router.route('/summary')
  .get(
    validate.list,
    getTransactionsSummary
  );

// Routes for /api/v1/transactions/:id
router.route('/:id')
  .get(
    validate.getTransaction,
    getTransaction
  )
  .put(
    sanitizeInput,
    validate.updateTransaction,
    updateTransaction
  )
  .delete(
    validate.deleteTransaction,
    deleteTransaction
  );

// Error handling middleware for celebrate validation errors
router.use((err, req, res, next) => {
  if (err.name === 'CelebrationError') {
    const formattedError = errorFormatter(err);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: formattedError.details
    });
  }
  
  // Pass to the next error handler
  next(err);
});

module.exports = router;
