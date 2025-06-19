const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const db = require('../services/db');

// @desc    Get all transactions
// @route   GET /api/v1/transactions
// @access  Private
exports.getTransactions = asyncHandler(async (req, res, next) => {
  const transactions = await db.getTransactions();
  const userTransactions = transactions.filter(t => t.user === req.user.id);
  
  res.status(200).json({
    success: true,
    count: userTransactions.length,
    data: userTransactions
  });
});

// @desc    Get single transaction
// @route   GET /api/v1/transactions/:id
// @access  Private
exports.getTransaction = asyncHandler(async (req, res, next) => {
  const transactions = await db.getTransactions();
  const transaction = transactions.find(t => t._id === req.params.id);

  if (!transaction) {
    return next(
      new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is transaction owner
  if (transaction.user !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this transaction`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: transaction
  });
});

// @desc    Create new transaction
// @route   POST /api/v1/transactions
// @access  Private
exports.createTransaction = asyncHandler(async (req, res, next) => {
  try {
    // Validate required fields
    const { amount, type, category, description, date } = req.body;
    
    if (!amount || !type || !category || !description || !date) {
      console.error('Missing required fields:', { amount, type, category, description, date });
      return next(new ErrorResponse('Please provide all required fields: amount, type, category, description, and date', 400));
    }
    
    // Create transaction
    const transaction = await db.addTransaction({
      ...req.body,
      user: req.user.id,
      amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      date: new Date(date).toISOString(),
      _id: Date.now().toString()
    });
    
    res.status(201).json({
      success: true,
      data: transaction
    });
    
  } catch (err) {
    console.error('Error in createTransaction:', {
      message: err.message,
      stack: err.stack
    });
    next(err);
  }
});

// @desc    Update transaction
// @route   PUT /api/v1/transactions/:id
// @access  Private
exports.updateTransaction = asyncHandler(async (req, res, next) => {
  const transactions = await db.getTransactions();
  const transactionIndex = transactions.findIndex(t => t._id === req.params.id);

  if (transactionIndex === -1) {
    return next(
      new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404)
    );
  }

  const transaction = transactions[transactionIndex];

  // Make sure user is transaction owner
  if (transaction.user !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this transaction`,
        401
      )
    );
  }

  // Update transaction
  const updatedTransaction = {
    ...transaction,
    ...req.body,
    _id: transaction._id, // Preserve ID
    updatedAt: new Date().toISOString()
  };

  // Update in memory
  transactions[transactionIndex] = updatedTransaction;
  await db.saveTransactions(transactions);

  res.status(200).json({
    success: true,
    data: updatedTransaction
  });
});

// @desc    Delete transaction
// @route   DELETE /api/v1/transactions/:id
// @access  Private
exports.deleteTransaction = asyncHandler(async (req, res, next) => {
  const transactions = await db.getTransactions();
  const transactionIndex = transactions.findIndex(t => t._id === req.params.id);

  if (transactionIndex === -1) {
    return next(
      new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404)
    );
  }

  const transaction = transactions[transactionIndex];

  // Make sure user is transaction owner
  if (transaction.user !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this transaction`,
        401
      )
    );
  }

  // Remove from array and save
  transactions.splice(transactionIndex, 1);
  await db.saveTransactions(transactions);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get transactions summary
// @route   GET /api/v1/transactions/summary
// @access  Private
exports.getTransactionsSummary = asyncHandler(async (req, res, next) => {
  const transactions = await db.getTransactions();
  const userTransactions = transactions.filter(t => t.user === req.user.id);
  
  const summary = userTransactions.reduce((acc, transaction) => {
    if (!acc[transaction.type]) {
      acc[transaction.type] = { total: 0, count: 0 };
    }
    acc[transaction.type].total += Math.abs(transaction.amount);
    acc[transaction.type].count += 1;
    return acc;
  }, {});
  
  const income = summary.income ? summary.income.total : 0;
  const expense = summary.expense ? summary.expense.total : 0;
  const balance = income - expense;
  
  res.status(200).json({
    success: true,
    data: {
      summary: Object.entries(summary).map(([type, data]) => ({
        type,
        total: data.total,
        count: data.count
      })),
      income,
      expense,
      balance
    }
  });
});
