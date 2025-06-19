const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');
const User = require('../models/User');

// Load environment variables
dotenv.config({ path: '../.env' });

// Default categories
const defaultCategories = [
  // Expense categories
  { name: 'Groceries', type: 'expense', icon: 'shopping_cart', color: '#4CAF50' },
  { name: 'Housing', type: 'expense', icon: 'home', color: '#2196F3' },
  { name: 'Transportation', type: 'expense', icon: 'directions_car', color: '#FF9800' },
  { name: 'Entertainment', type: 'expense', icon: 'movie', color: '#9C27B0' },
  { name: 'Dining Out', type: 'expense', icon: 'restaurant', color: '#E91E63' },
  { name: 'Healthcare', type: 'expense', icon: 'local_hospital', color: '#F44336' },
  { name: 'Shopping', type: 'expense', icon: 'shopping_bag', color: '#795548' },
  { name: 'Education', type: 'expense', icon: 'school', color: '#3F51B5' },
  { name: 'Other Expenses', type: 'expense', icon: 'category', color: '#9E9E9E' },
  
  // Income categories
  { name: 'Salary', type: 'income', icon: 'account_balance_wallet', color: '#4CAF50' },
  { name: 'Freelance', type: 'income', icon: 'work', color: '#2196F3' },
  { name: 'Investments', type: 'income', icon: 'trending_up', color: '#FF9800' },
  { name: 'Gifts', type: 'income', icon: 'card_giftcard', color: '#9C27B0' },
  { name: 'Other Income', type: 'income', icon: 'attach_money', color: '#4CAF50' }
];

// Connect to MongoDB
const connectDB = require('../config/db');

const seedCategories = async () => {
  try {
    // Connect to the database
    await connectDB();
    
    // Get the first user (or specify a user ID)
    const user = await User.findOne();
    
    if (!user) {
      console.error('No users found in the database. Please create a user first.');
      process.exit(1);
    }
    
    console.log(`Seeding categories for user: ${user._id} (${user.email})`);
    
    // Add user ID to each category
    const categoriesWithUser = defaultCategories.map(category => ({
      ...category,
      user: user._id,
      isDefault: true
    }));
    
    // Insert default categories
    const result = await Category.insertMany(categoriesWithUser, { ordered: false })
      .catch(err => {
        if (err.code === 11000) {
          console.log('Some categories already exist. Skipping duplicates...');
          return err.result;
        }
        throw err;
      });
    
    console.log('Successfully seeded categories:');
    console.log(result);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
