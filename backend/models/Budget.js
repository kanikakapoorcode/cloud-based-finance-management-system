const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0, 'Budget amount cannot be negative']
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 2000,
    max: 2100
  },
  spent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add index for faster querying
budgetSchema.index({ user: 1, month: 1, year: 1, category: 1 }, { unique: true });

// Virtual for remaining budget
budgetSchema.virtual('remaining').get(function() {
  return Math.max(0, this.amount - this.spent);
});

// Method to update spent amount
budgetSchema.methods.updateSpent = async function(amount) {
  this.spent = (this.spent || 0) + amount;
  return this.save();
};

// Static method to get budget for a user by category and date
budgetSchema.statics.findByUserAndCategory = async function(userId, category, date) {
  const month = new Date(date).getMonth() + 1;
  const year = new Date(date).getFullYear();
  
  return this.findOne({
    user: userId,
    category,
    month,
    year
  });
};

// Pre-save hook to ensure no duplicate budgets for same category and period
budgetSchema.pre('save', async function(next) {
  const budget = this;
  
  const existingBudget = await Budget.findOne({
    user: budget.user,
    category: budget.category,
    month: budget.month,
    year: budget.year,
    _id: { $ne: budget._id }
  });

  if (existingBudget) {
    const err = new Error('Budget already exists for this category and period');
    err.statusCode = 400;
    return next(err);
  }
  
  next();
});

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
