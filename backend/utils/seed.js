const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const { defaultCategories } = require('./defaultCategories');

// Load environment variables
require('dotenv').config({ path: '.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Category.deleteMany({});
    await Transaction.deleteMany({});
    console.log('Database cleared');
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
};

// Create test user
const createTestUser = async () => {
  try {
    // Create a test user
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    console.log('Test user created:', user.email);
    return user;
  } catch (err) {
    console.error('Error creating test user:', err);
    process.exit(1);
  }
};

// Create categories for a user
const createCategories = async (userId) => {
  try {
    // Add user ID to each default category
    const categoriesWithUser = defaultCategories.map(category => ({
      ...category,
      user: userId
    }));

    // Create categories in the database
    const categories = await Category.create(categoriesWithUser);
    console.log(`Created ${categories.length} categories`);
    
    // Return categories mapped by name for easy reference
    return categories.reduce((acc, category) => {
      acc[category.name] = category._id;
      return acc;
    }, {});
  } catch (err) {
    console.error('Error creating categories:', err);
    process.exit(1);
  }
};

// Create sample transactions
const createTransactions = async (userId, categoryIds) => {
  try {
    const transactions = [];
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    // Helper function to get a random date within a range
    const randomDate = (start, end) => {
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };

    // Income transactions
    const incomeCategories = [
      { name: 'Salary', min: 2000, max: 5000 },
      { name: 'Freelance', min: 100, max: 2000 },
      { name: 'Investments', min: 50, max: 1000 },
      { name: 'Gifts', min: 20, max: 500 },
    ];

    // Expense transactions
    const expenseCategories = [
      { name: 'Housing', min: 800, max: 2000 },
      { name: 'Utilities', min: 100, max: 300 },
      { name: 'Groceries', min: 50, max: 300 },
      { name: 'Transportation', min: 20, max: 200 },
      { name: 'Entertainment', min: 10, max: 200 },
      { name: 'Dining Out', min: 15, max: 150 },
      { name: 'Healthcare', min: 10, max: 500 },
      { name: 'Shopping', min: 20, max: 400 },
      { name: 'Education', min: 50, max: 1000 },
    ];

    // Create 20 income transactions (about 1-2 per month)
    for (let i = 0; i < 20; i++) {
      const category = incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
      const amount = Math.floor(Math.random() * (category.max - category.min + 1)) + category.min;
      
      transactions.push({
        amount,
        type: 'income',
        description: `${category.name} payment`,
        date: randomDate(oneYearAgo, today),
        category: categoryIds[category.name],
        user: userId,
        paymentMethod: ['cash', 'bank_transfer', 'credit_card', 'paypal'][Math.floor(Math.random() * 4)],
        isVerified: Math.random() > 0.2, // 80% chance of being verified
        notes: Math.random() > 0.7 ? 'Additional notes here...' : undefined,
        tags: Math.random() > 0.5 ? ['recurring'] : [],
      });
    }

    // Create 100 expense transactions (about 8 per month)
    for (let i = 0; i < 100; i++) {
      const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      const amount = (Math.random() * (category.max - category.min) + category.min).toFixed(2);
      
      transactions.push({
        amount,
        type: 'expense',
        description: `Payment for ${category.name.toLowerCase()}`,
        date: randomDate(oneYearAgo, today),
        category: categoryIds[category.name],
        user: userId,
        paymentMethod: ['cash', 'debit_card', 'credit_card', 'online_payment'][Math.floor(Math.random() * 4)],
        isVerified: Math.random() > 0.3, // 70% chance of being verified
        notes: Math.random() > 0.8 ? 'Additional notes here...' : undefined,
        tags: Math.random() > 0.7 ? ['business'] : [],
      });
    }

    // Insert all transactions
    const createdTransactions = await Transaction.insertMany(transactions);
    console.log(`Created ${createdTransactions.length} transactions`);

    return createdTransactions;
  } catch (err) {
    console.error('Error creating transactions:', err);
    process.exit(1);
  }
};

// Main function to run the seed script
const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await clearDatabase();
    
    // Create test user
    const user = await createTestUser();
    
    // Create categories for the user
    const categoryIds = await createCategories(user._id);
    
    // Create transactions for the user
    await createTransactions(user._id, categoryIds);
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

// Run the seed script
seedDatabase();
