const Category = require('../models/Category');

/**
 * Default categories that will be created for each new user
 */
const defaultCategories = [
  // Income Categories
  {
    name: 'Salary',
    type: 'income',
    icon: 'attach_money',
    color: '#4CAF50',
    isDefault: true
  },
  {
    name: 'Freelance',
    type: 'income',
    icon: 'work',
    color: '#2196F3',
    isDefault: true
  },
  {
    name: 'Investments',
    type: 'income',
    icon: 'trending_up',
    color: '#9C27B0',
    isDefault: true
  },
  {
    name: 'Gifts',
    type: 'income',
    icon: 'card_giftcard',
    color: '#FF9800',
    isDefault: true
  },
  {
    name: 'Other Income',
    type: 'income',
    icon: 'payments',
    color: '#607D8B',
    isDefault: true
  },
  
  // Expense Categories
  {
    name: 'Housing',
    type: 'expense',
    icon: 'home',
    color: '#F44336',
    isDefault: true
  },
  {
    name: 'Utilities',
    type: 'expense',
    icon: 'flash_on',
    color: '#FFC107',
    isDefault: true
  },
  {
    name: 'Groceries',
    type: 'expense',
    icon: 'shopping_cart',
    color: '#4CAF50',
    isDefault: true
  },
  {
    name: 'Food',
    type: 'expense',
    icon: 'restaurant',
    color: '#8BC34A',
    isDefault: true
  },
  {
    name: 'Transportation',
    type: 'expense',
    icon: 'directions_car',
    color: '#3F51B5',
    isDefault: true
  },
  {
    name: 'Entertainment',
    type: 'expense',
    icon: 'movie',
    color: '#9C27B0',
    isDefault: true
  },
  {
    name: 'Dining Out',
    type: 'expense',
    icon: 'restaurant',
    color: '#FF5722',
    isDefault: true
  },
  {
    name: 'Healthcare',
    type: 'expense',
    icon: 'favorite',
    color: '#E91E63',
    isDefault: true
  },
  {
    name: 'Shopping',
    type: 'expense',
    icon: 'shopping_bag',
    color: '#795548',
    isDefault: true
  },
  {
    name: 'Education',
    type: 'expense',
    icon: 'school',
    color: '#009688',
    isDefault: true
  },
  {
    name: 'Other Expenses',
    type: 'expense',
    icon: 'receipt',
    color: '#9E9E9E',
    isDefault: true
  }
];

/**
 * Create default categories for a new user
 * @param {String} userId - The ID of the user to create categories for
 * @returns {Promise<Array>} Array of created categories
 */
const createDefaultCategories = async (userId) => {
  console.log('Creating default categories for user:', userId);
  
  if (!userId) {
    console.error('No user ID provided for creating default categories');
    throw new Error('User ID is required');
  }

  try {
    // Verify user exists
    const User = require('../models/User');
    const userExists = await User.findById(userId);
    
    if (!userExists) {
      console.error('User not found with ID:', userId);
      throw new Error('User not found');
    }

    // Add user ID to each default category
    const categoriesWithUser = defaultCategories.map(category => {
      console.log('Processing category:', category.name);
      return {
        ...category,
        user: userId
      };
    });

    console.log('Attempting to create categories in database...');
    
    // Create categories in the database
    const createdCategories = await Category.create(categoriesWithUser);
    
    console.log('Successfully created', createdCategories.length, 'default categories');
    return createdCategories;
  } catch (error) {
    console.error('Error in createDefaultCategories:', {
      name: error.name,
      message: error.message,
      code: error.code,
      keyValue: error.keyValue,
      stack: error.stack
    });
    
    // If it's a duplicate key error, log which category already exists
    if (error.code === 11000) {
      console.error('Duplicate category detected. Key conflict:', error.keyValue);
    }
    
    throw new Error('Failed to create default categories: ' + error.message);
  }
};

/**
 * Get all default categories (without user association)
 * @returns {Array} Array of default category objects
 */
const getDefaultCategories = () => {
  return JSON.parse(JSON.stringify(defaultCategories));
};

module.exports = {
  createDefaultCategories,
  getDefaultCategories,
  defaultCategories
};
