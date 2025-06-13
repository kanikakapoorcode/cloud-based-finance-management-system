const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
    min: [0, 'Amount must be a positive number']
  },
  type: {
    type: String,
    required: [true, 'Please specify the type (income/expense)'],
    enum: ['income', 'expense']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description can not be more than 500 characters']
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: [true, 'Please select a category']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'other'],
    default: 'cash'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: function() { return this.isRecurring; }
    },
    endDate: {
      type: Date,
      required: function() { return this.isRecurring; }
    }
  },
  attachments: [{
    url: String,
    name: String,
    type: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes can not be more than 1000 characters']
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster querying
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });
transactionSchema.index({ user: 1, type: 1 });

// Pre-save hook to ensure amount is positive for income and negative for expense
transactionSchema.pre('save', function(next) {
  if (this.type === 'expense' && this.amount > 0) {
    this.amount = -Math.abs(this.amount);
  } else if (this.type === 'income' && this.amount < 0) {
    this.amount = Math.abs(this.amount);
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
