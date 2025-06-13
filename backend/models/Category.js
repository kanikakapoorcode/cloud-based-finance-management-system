const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    trim: true,
    maxlength: [50, 'Name can not be more than 50 characters']
  },
  type: {
    type: String,
    required: [true, 'Please specify the type (income/expense)'],
    enum: ['income', 'expense']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  icon: {
    type: String,
    default: 'category'
  },
  color: {
    type: String,
    default: '#666666'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate categories per user
categorySchema.index({ name: 1, user: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
