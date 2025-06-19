const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const db = require('../services/db');

// @desc    Get all transactions
// @route   GET /api/v1/transactions
// @access  Private
exports.getTransactions = asyncHandler(async (req, res, next) => {
  // Get transactions for the current user
  const transactions = await db.getTransactions(req.user.id);
  
  // Filter by type if provided
  const type = req.query.type;
  const filteredTransactions = type 
    ? transactions.filter(t => t.type === type)
    : transactions;

  res.status(200).json({
    success: true,
    count: filteredTransactions.length,
    data: filteredTransactions
  });
});

// @desc    Get single transaction
// @route   GET /api/v1/transactions/:id
// @access  Private
exports.getTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await db.getTransactionById(req.params.id);

  if (!transaction) {
    return next(
      new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is transaction owner
  if (transaction.user !== req.user.id && req.user.role !== 'admin') {
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
    
    // Create transaction with sanitized data
    const transactionData = {
      amount: parseFloat(amount),
      type: type.toLowerCase(),
      category: category.trim(),
      description: description.trim(),
      date: new Date(date).toISOString(),
      user: req.user.id
    };
    
    // Additional business logic validation
    if (transactionData.type === 'expense' && transactionData.amount > 0) {
      transactionData.amount = -Math.abs(transactionData.amount);
    } else if (transactionData.type === 'income' && transactionData.amount < 0) {
      transactionData.amount = Math.abs(transactionData.amount);
    }
    
    const transaction = await db.addTransaction(transactionData);
    
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
  const transaction = await db.getTransactionById(req.params.id);

  if (!transaction) {
    return next(
      new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is transaction owner
  if (transaction.user !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this transaction`,
        401
      )
    );
  }

  // Update transaction
  const updatedTransaction = await db.updateTransaction(
    req.params.id,
    {
      ...req.body,
      // Ensure amount is properly formatted based on type
      amount: req.body.amount ? 
        (req.body.type === 'expense' ? 
          -Math.abs(parseFloat(req.body.amount)) : 
          Math.abs(parseFloat(req.body.amount))) :
        transaction.amount
    }
  );

  if (!updatedTransaction) {
    return next(
      new ErrorResponse(`Error updating transaction with id of ${req.params.id}`, 500)
    );
  }

  res.status(200).json({
    success: true,
    data: updatedTransaction
  });
});

// @desc    Delete transaction
// @route   DELETE /api/v1/transactions/:id
// @access  Private
exports.deleteTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await db.getTransactionById(req.params.id);

  if (!transaction) {
    return next(
      new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is transaction owner
  if (transaction.user !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this transaction`,
        401
      )
    );
  }

  const success = await db.deleteTransaction(req.params.id);
  
  if (!success) {
    return next(
      new ErrorResponse(`Error deleting transaction with id of ${req.params.id}`, 500)
    );
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get transactions summary
// @route   GET /api/v1/transactions/summary
// @access Private
exports.getTransactionsSummary = asyncHandler(async (req, res, next) => {
  // Get all transactions for the user
  const transactions = await db.getTransactions(req.user.id);
  
  // Filter by date if provided
  const { startDate, endDate } = req.query;
  let filteredTransactions = [...transactions];
  
  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    filteredTransactions = filteredTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return (!start || transactionDate >= start) && 
             (!end || transactionDate <= end);
    });
  }
  
  // Calculate summary
  const summary = filteredTransactions.reduce((acc, transaction) => {
    const type = transaction.type;
    if (!acc[type]) {
      acc[type] = { total: 0, count: 0 };
    }
    acc[type].total += Math.abs(parseFloat(transaction.amount));
    acc[type].count += 1;
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

// @desc    Get transactions by category
// @route   GET /api/v1/transactions/by-category
// @access  Private
exports.getTransactionsByCategory = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const match = { user: req.user.id };
  
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }
  
  const transactions = await db.getTransactions(req.user.id);
  
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const category = transaction.category;
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0, type: transaction.type };
    }
    acc[category].total += Math.abs(parseFloat(transaction.amount));
    acc[category].count += 1;
    return acc;
  }, {});
  
  const result = Object.entries(groupedTransactions).map(([category, data]) => ({
    category,
    total: data.total,
    count: data.count,
    type: data.type
  }));
  
  res.status(200).json({
    success: true,
    count: result.length,
    data: result
  });
});

// @desc    Get transactions by date range
// @route   GET /api/v1/transactions/by-date
// @access  Private
exports.getTransactionsByDate = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;
  
  if (!startDate || !endDate) {
    return next(
      new ErrorResponse('Please provide both startDate and endDate', 400)
    );
  }
  
  const match = {
    user: req.user.id,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  let groupByFormat;
  let dateFormat;
  
  switch (groupBy) {
    case 'day':
      groupByFormat = '%Y-%m-%d';
      dateFormat = '%Y-%m-%d';
      break;
    case 'week':
      groupByFormat = '%Y-%U';
      dateFormat = 'Week %U, %Y';
      break;
    case 'month':
      groupByFormat = '%Y-%m';
      dateFormat = '%B %Y';
      break;
    case 'year':
      groupByFormat = '%Y';
      dateFormat = '%Y';
      break;
    default:
      return next(new ErrorResponse('Invalid groupBy parameter. Must be one of: day, week, month, year', 400));
  }
  
  const transactions = await db.getTransactions(req.user.id);
  
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const key = date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    if (!acc[key]) {
      acc[key] = { income: 0, expense: 0, count: 0 };
    }
    if (transaction.type === 'income') {
      acc[key].income += parseFloat(transaction.amount);
    } else {
      acc[key].expense += parseFloat(transaction.amount);
    }
    acc[key].count += 1;
    return acc;
  }, {});
  
  const result = Object.entries(groupedTransactions).map(([key, data]) => ({
    period: key,
    date: key,
    income: data.income,
    expense: Math.abs(data.expense),
    balance: data.income - Math.abs(data.expense),
    count: data.count
  }));
  
  res.status(200).json({
    success: true,
    count: result.length,
    data: result
  });
});

module.exports = {
  getTransactions: exports.getTransactions,
  getTransaction: exports.getTransaction,
  createTransaction: exports.createTransaction,
  updateTransaction: exports.updateTransaction,
  deleteTransaction: exports.deleteTransaction,
  getTransactionsSummary: exports.getTransactionsSummary,
  getTransactionsByCategory: exports.getTransactionsByCategory,
  getTransactionsByDate: exports.getTransactionsByDate
};
