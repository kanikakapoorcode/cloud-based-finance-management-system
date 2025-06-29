const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
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
  
  // Group by category for breakdown
  const categoryTotals = {};
  transactions.forEach(t => {
    const categoryName = t.category ? t.category.name : 'Uncategorized';
    if (!categoryTotals[categoryName]) {
      categoryTotals[categoryName] = 0;
    }
    categoryTotals[categoryName] += Math.abs(t.amount);
  });
  
  res.status(200).json({
    success: true,
    count: totalTransactions,
    data: transactions,
    summary: {
      totalTransactions,
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      avgTransaction: totalTransactions > 0 ? (totalIncome + totalExpenses) / totalTransactions : 0,
      categoryTotals
    }
  });
});

// @desc    Get financial summary
// @route   GET /api/v1/reports/summary
// @access  Private
exports.getFinancialSummary = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  
  // Get current month's start and end dates
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Query transactions for current month
  const transactions = await Transaction.find({
    user: userId,
    date: { $gte: firstDay, $lte: lastDay }
  }).populate('category', 'name type');
  
  // Calculate summary
  const totalIncome = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = Math.abs(
    transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );
  
  // Get top categories
  const categoryExpenses = {};
  transactions
    .filter(t => t.amount < 0 && t.category)
    .forEach(t => {
      const catName = t.category.name;
      categoryExpenses[catName] = (categoryExpenses[catName] || 0) + Math.abs(t.amount);
    });
  
  const topCategories = Object.entries(categoryExpenses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));
  
  res.status(200).json({
    success: true,
    data: {
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      period: {
        start: firstDay,
        end: lastDay
      },
      topCategories
    }
  });
});

// @desc    Get category-wise report
// @route   GET /api/v1/reports/category-wise
// @access  Private
exports.getCategoryWiseReport = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const userId = req.user.id;
  
  // Set default date range if not provided (last 30 days)
  const start = startDate ? new Date(startDate) : new Date();
  start.setDate(start.getDate() - 30);
  const end = endDate ? new Date(endDate) : new Date();
  
  // Get all categories for the user
  const categories = await Category.find({ user: userId });
  
  // Get transactions within date range
  const transactions = await Transaction.find({
    user: userId,
    date: { $gte: start, $lte: end }
  });
  
  // Calculate category-wise totals
  const categoryReport = categories.map(category => {
    const categoryTransactions = transactions.filter(
      t => t.category && t.category.toString() === category._id.toString()
    );
    
    const totalAmount = categoryTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount), 0
    );
    
    return {
      category: category.name,
      categoryId: category._id,
      type: category.type,
      icon: category.icon,
      color: category.color,
      transactionCount: categoryTransactions.length,
      totalAmount,
      percentage: 0 // Will be calculated after we have all categories
    };
  });
  
  // Calculate total for percentage calculation
  const totalByType = {
    income: categoryReport
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + item.totalAmount, 0),
    expense: categoryReport
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + item.totalAmount, 0)
  };
  
  // Calculate percentages
  const reportWithPercentages = categoryReport.map(item => ({
    ...item,
    percentage: totalByType[item.type] > 0 
      ? Math.round((item.totalAmount / totalByType[item.type]) * 100) 
      : 0
  }));
  
  res.status(200).json({
    success: true,
    data: reportWithPercentages,
    period: {
      start,
      end
    },
    totals: totalByType
  });
});

// @desc    Get budget vs actual report
// @route   GET /api/v1/reports/budget-vs-actual
// @access  Private
exports.getBudgetVsActual = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { month, year } = req.query;
  
  // Get the first and last day of the target month
  const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  
  const firstDay = new Date(targetYear, targetMonth, 1);
  const lastDay = new Date(targetYear, targetMonth + 1, 0);
  
  // Get budgets for the month
  const budgets = await Budget.find({
    user: userId,
    $or: [
      { month: { $exists: false } }, // Recurring budgets
      { 
        month: targetMonth + 1,
        year: targetYear
      }
    ]
  }).populate('category');
  
  // Get actual transactions
  const transactions = await Transaction.find({
    user: userId,
    date: { $gte: firstDay, $lte: lastDay },
    amount: { $lt: 0 } // Only expenses for budget comparison
  });
  
  // Calculate actuals by category
  const actualsByCategory = {};
  transactions.forEach(t => {
    const categoryId = t.category ? t.category.toString() : 'uncategorized';
    actualsByCategory[categoryId] = (actualsByCategory[categoryId] || 0) + Math.abs(t.amount);
  });
  
  // Prepare report
  const report = budgets.map(budget => {
    const categoryId = budget.category ? budget.category._id.toString() : 'uncategorized';
    const actual = actualsByCategory[categoryId] || 0;
    const remaining = Math.max(0, budget.amount - actual);
    const percentageUsed = Math.min(100, Math.round((actual / budget.amount) * 100)) || 0;
    
    return {
      category: budget.category ? budget.category.name : 'Uncategorized',
      categoryId: budget.category ? budget.category._id : null,
      budget: budget.amount,
      actual,
      remaining,
      percentageUsed,
      isOverBudget: actual > budget.amount
    };
  });
  
  // Add categories with actuals but no budget
  const budgetedCategoryIds = new Set(budgets.map(b => 
    b.category ? b.category._id.toString() : 'uncategorized'
  ));
  
  Object.entries(actualsByCategory).forEach(([categoryId, actual]) => {
    if (!budgetedCategoryIds.has(categoryId)) {
      const category = categories.find(c => c._id.toString() === categoryId);
      report.push({
        category: category ? category.name : 'Uncategorized',
        categoryId: category ? category._id : null,
        budget: 0,
        actual,
        remaining: 0,
        percentageUsed: 100,
        isOverBudget: true
      });
    }
  });
  
  const totalBudget = report.reduce((sum, item) => sum + item.budget, 0);
  const totalActual = report.reduce((sum, item) => sum + item.actual, 0);
  
  res.status(200).json({
    success: true,
    data: {
      period: {
        month: targetMonth + 1,
        year: targetYear,
        start: firstDay,
        end: lastDay
      },
      summary: {
        totalBudget,
        totalActual,
        remaining: Math.max(0, totalBudget - totalActual),
        percentageUsed: totalBudget > 0 ? Math.min(100, Math.round((totalActual / totalBudget) * 100)) : 0,
        isOverBudget: totalActual > totalBudget
      },
      categories: report
    }
  });
});
