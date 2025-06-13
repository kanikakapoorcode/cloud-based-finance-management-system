const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all transactions
// @route   GET /api/v1/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res, next) => {
  // Copy req.query
  const reqQuery = { ...req.query };
  
  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];
  
  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);
  
  // Create query string
  let queryStr = JSON.stringify(reqQuery);
  
  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  
  // Finding resource
  let query = Transaction.find(JSON.parse(queryStr))
    .populate({
      path: 'category',
      select: 'name type icon color'
    });
  
  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }
  
  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-date');
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Transaction.countDocuments(JSON.parse(queryStr));
  
  query = query.skip(startIndex).limit(limit);
  
  // Filter for the logged in user
  query = query.find({ user: req.user.id });
  
  // Executing query
  const transactions = await query;
  
  // Pagination result
  const pagination = {};
  
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  res.status(200).json({
    success: true,
    count: transactions.length,
    pagination,
    data: transactions
  });
});

// @desc    Get single transaction
// @route   GET /api/v1/transactions/:id
// @access  Private
const getTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate({
      path: 'category',
      select: 'name type icon color'
    });

  if (!transaction) {
    return next(
      new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is transaction owner
  if (transaction.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view this transaction`,
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
const createTransaction = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  const categoryIdentifier = req.body.category;

  if (!categoryIdentifier) {
    return next(new ErrorResponse('Please provide a category', 400));
  }

  // Find the category by its ID or name, ensuring it belongs to the user
  const category = await Category.findOne({
    user: req.user.id,
    $or: [
      { _id: mongoose.Types.ObjectId.isValid(categoryIdentifier) ? categoryIdentifier : null },
      { name: { $regex: new RegExp(`^${categoryIdentifier}$`, 'i'), $options: 'i' } }
    ]
  });

  if (!category) {
    return next(
      new ErrorResponse(`Category '${categoryIdentifier}' not found or you're not authorized to use it.`, 404)
    );
  }

  // Use the found category's ID and type for the new transaction
  req.body.category = category._id;
  req.body.type = category.type;

  const transaction = await Transaction.create(req.body);

  // Populate category details in the response
  await transaction.populate({
    path: 'category',
    select: 'name type icon color'
  });

  res.status(201).json({
    success: true,
    data: transaction
  });
});

// @desc    Update transaction
// @route   PUT /api/v1/transactions/:id
// @access  Private
const updateTransaction = asyncHandler(async (req, res, next) => {
  let transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(
      new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404)
    );
  }


  // Make sure user is transaction owner
  if (transaction.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this transaction`,
        401
      )
    );
  }
  
  // If category is being updated, verify it exists and belongs to user
  if (req.body.category) {
    const category = await Category.findOne({
      _id: req.body.category,
      user: req.user.id
    });
    
    if (!category) {
      return next(
        new ErrorResponse(`Category not found or not authorized`, 404)
      );
    }
    
    // Update transaction type if category type is different
    if (category.type !== transaction.type) {
      req.body.type = category.type;
    }
  }
  
  // Prevent changing the user field
  if (req.body.user) {
    delete req.body.user;
  }

  transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate({
    path: 'category',
    select: 'name type icon color'
  });

  res.status(200).json({
    success: true,
    data: transaction
  });
});

// @desc    Delete transaction
// @route   DELETE /api/v1/transactions/:id
// @access  Private
const deleteTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(
      new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is transaction owner
  if (transaction.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this transaction`,
        401
      )
    );
  }

  await transaction.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get transactions summary
// @route   GET /api/v1/transactions/summary
// @access  Private
const getTransactionsSummary = asyncHandler(async (req, res, next) => {
  // Get date range from query params (default to current month)
  const { startDate, endDate } = req.query;
  const match = { user: req.user.id };
  
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  } else {
    // Default to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    match.date = {
      $gte: firstDay,
      $lte: lastDay
    };
  }
  
  const summary = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        type: '$_id',
        total: 1,
        count: 1
      }
    }
  ]);
  
  // Calculate balance
  let income = 0;
  let expense = 0;
  
  summary.forEach(item => {
    if (item.type === 'income') {
      income = item.total;
    } else if (item.type === 'expense') {
      expense = Math.abs(item.total);
    }
  });
  
  const balance = income - expense;
  
  res.status(200).json({
    success: true,
    data: {
      summary,
      income,
      expense,
      balance
    }
  });
});

// @desc    Get transactions by category
// @route   GET /api/v1/transactions/by-category
// @access  Private
const getTransactionsByCategory = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const match = { user: req.user.id };
  
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }
  
  const transactions = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        type: { $first: '$type' }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: '$category' },
    {
      $project: {
        category: {
          _id: '$category._id',
          name: '$category.name',
          icon: '$category.icon',
          color: '$category.color'
        },
        total: 1,
        count: 1,
        type: 1
      }
    },
    { $sort: { total: -1 } }
  ]);
  
  res.status(200).json({
    success: true,
    count: transactions.length,
    data: transactions
  });
});

// @desc    Get transactions by date range
// @route   GET /api/v1/transactions/by-date
// @access  Private
const getTransactionsByDate = asyncHandler(async (req, res, next) => {
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
  
  const transactions = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: { format: groupByFormat, date: '$date' }
        },
        date: { $first: { $dateToString: { format: dateFormat, date: '$date' } } },
        income: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
          }
        },
        expense: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, { $abs: '$amount' }, 0]
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        period: '$_id',
        date: 1,
        income: 1,
        expense: 1,
        balance: { $subtract: ['$income', '$expense'] },
        count: 1
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    count: transactions.length,
    data: transactions
  });
});

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsSummary,
  getTransactionsByCategory,
  getTransactionsByDate
};
