const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const logger = require('../utils/logger');

// @desc    Get transactions report
// @route   GET /api/v1/reports/transactions
// @access  Private
exports.getTransactionsReport = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, category, minAmount, maxAmount, type } = req.query;
  
  // Build query
  const query = { user: req.user.id };
  
  // Date range
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
  }
  
  // Category filter
  if (category) {
    query.category = category;
  }
  
  // Amount range
  if (minAmount || maxAmount) {
    query.amount = {};
    if (minAmount) query.amount.$gte = parseFloat(minAmount);
    if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
  }
  
  // Transaction type (income/expense)
  if (type === 'income') {
    query.amount = { ...query.amount, $gt: 0 };
  } else if (type === 'expense') {
    query.amount = { ...query.amount, $lt: 0 };
  }
  
  // Execute query
  const transactions = await Transaction.find(query).sort({ date: -1 });
  
  // Calculate summary
  const totalTransactions = transactions.length;
  const totalIncome = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(
    transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );
  const netAmount = totalIncome - totalExpenses;
  
  // Group by category
  const incomeByCategory = {};
  const expensesByCategory = {};
  
  transactions.forEach(transaction => {
    const amount = transaction.amount;
    const category = transaction.category;
    
    if (amount > 0) {
      incomeByCategory[category] = (incomeByCategory[category] || 0) + amount;
    } else {
      expensesByCategory[category] = (expensesByCategory[category] || 0) + Math.abs(amount);
    }
  });
  
  // Format response
  const response = {
    success: true,
    count: totalTransactions,
    data: {
      transactions: transactions.map(t => ({
        id: t._id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
        type: t.amount > 0 ? 'income' : 'expense',
        paymentMethod: t.paymentMethod,
        notes: t.notes
      })),
      summary: {
        totalTransactions,
        totalIncome,
        totalExpenses,
        netAmount,
        incomeByCategory,
        expensesByCategory
      },
      chartData: {
        incomeByCategory: Object.entries(incomeByCategory).map(([name, value]) => ({
          name,
          value
        })),
        expensesByCategory: Object.entries(expensesByCategory).map(([name, value]) => ({
          name,
          value
        }))
      }
    }
  };
  
  logger.info(`Generated transactions report for user ${req.user.id}`);
  res.status(200).json(response);
});

// @desc    Get budget vs actual report
// @route   GET /api/v1/reports/budget
// @access  Private
exports.getBudgetReport = asyncHandler(async (req, res, next) => {
  const { month, year } = req.query;
  const userId = req.user.id;
  
  // Get the target month and year
  const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  
  // Calculate date range for the month
  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
  
  // Get budgets for the user
  const budgets = await Budget.find({ user: userId });
  
  // Get transactions for the period
  const transactions = await Transaction.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate },
    amount: { $lt: 0 } // Only expenses for budget comparison
  });
  
  // Calculate actual spending by category
  const actualSpending = {};
  transactions.forEach(transaction => {
    const category = transaction.category;
    actualSpending[category] = (actualSpending[category] || 0) + Math.abs(transaction.amount);
  });
  
  // Prepare report data
  const reportData = [];
  let totalBudget = 0;
  let totalActual = 0;
  
  budgets.forEach(budget => {
    const actual = actualSpending[budget.category] || 0;
    const remaining = budget.amount - actual;
    const percentageUsed = (actual / budget.amount) * 100;
    
    totalBudget += budget.amount;
    totalActual += actual;
    
    reportData.push({
      category: budget.category,
      budget: budget.amount,
      actual,
      remaining,
      percentageUsed: Math.min(percentageUsed, 100), // Cap at 100%
      status: percentageUsed > 90 ? 'Critical' : 
              percentageUsed > 75 ? 'Warning' : 
              'On Track'
    });
  });
  
  // Calculate overall summary
  const totalRemaining = totalBudget - totalActual;
  const totalPercentageUsed = (totalActual / totalBudget) * 100;
  
  // Format response
  const response = {
    success: true,
    data: {
      period: {
        month: targetMonth + 1,
        year: targetYear,
        startDate,
        endDate
      },
      summary: {
        totalBudget,
        totalActual,
        totalRemaining,
        totalPercentageUsed: Math.min(totalPercentageUsed, 100), // Cap at 100%
        status: totalPercentageUsed > 90 ? 'Critical' : 
                totalPercentageUsed > 75 ? 'Warning' : 
                'On Track'
      },
      details: reportData
    }
  };
  
  logger.info(`Generated budget report for user ${userId} for ${targetMonth + 1}/${targetYear}`);
  res.status(200).json(response);
});

// @desc    Export report to PDF/CSV
// @route   POST /api/v1/reports/export
// @access  Private
exports.exportReport = asyncHandler(async (req, res, next) => {
  const { reportType, format = 'pdf', ...filters } = req.body;
  
  // In a real implementation, this would generate and return the file
  // For now, we'll just return a success response
  
  const response = {
    success: true,
    message: `Report exported successfully as ${format.toUpperCase()}`,
    data: {
      reportType,
      format,
      filters,
      downloadUrl: `/api/v1/reports/download/${Date.now()}-report.${format}`
    }
  };
  
  logger.info(`Exported ${reportType} report as ${format} for user ${req.user.id}`);
  res.status(200).json(response);
});
