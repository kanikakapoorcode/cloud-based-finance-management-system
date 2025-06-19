const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../data/db.json');

// Default data structure
const DEFAULT_DB = {
  transactions: [],
  users: [],
  categories: [
    { _id: '1', name: 'Food', type: 'expense', color: '#FF6B6B', icon: 'utensils', isDefault: true },
    { _id: '2', name: 'Transportation', type: 'expense', color: '#4ECDC4', icon: 'bus', isDefault: true },
    { _id: '3', name: 'Shopping', type: 'expense', color: '#FFD166', icon: 'shopping-bag', isDefault: true },
    { _id: '4', name: 'Salary', type: 'income', color: '#06D6A0', icon: 'money-bill-wave', isDefault: true },
    { _id: '5', name: 'Freelance', type: 'income', color: '#118AB2', icon: 'laptop-code', isDefault: true },
  ]
};

let db = { ...DEFAULT_DB };

// Load data from file
async function loadDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    const savedData = JSON.parse(data);
    // Merge with default data to ensure all required fields exist
    db = {
      transactions: savedData.transactions || [],
      users: savedData.users || [],
      categories: [...DEFAULT_DB.categories, ...(savedData.categories || []).filter(c => !c.isDefault)]
    };
    console.log('Database loaded successfully');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No existing database found, creating new one');
      await saveDB();
      
      // Create default admin user if no users exist
      if (db.users.length === 0) {
        console.log('Creating default admin user...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const adminUser = {
          _id: uuidv4(),
          name: 'Admin User',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.users.push(adminUser);
        await saveDB();
        console.log('Default admin user created:', adminUser.email);
      }
    } else {
      console.error('Error loading database:', error);
    }
  }
}

// Save data to file
async function saveDB() {
  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Initialize the database
loadDB().catch(console.error);

module.exports = {
  // Transactions
  async getTransactions(userId) {
    if (userId) {
      return db.transactions.filter(t => t.user === userId);
    }
    return db.transactions;
  },
  
  async getTransactionById(id) {
    return db.transactions.find(t => t._id === id);
  },
  
  async addTransaction(transaction) {
    const newTransaction = { 
      ...transaction,
      _id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Convert amount to number and ensure correct sign based on type
    newTransaction.amount = parseFloat(newTransaction.amount);
    if (newTransaction.type === 'expense' && newTransaction.amount > 0) {
      newTransaction.amount = -newTransaction.amount;
    } else if (newTransaction.type === 'income' && newTransaction.amount < 0) {
      newTransaction.amount = Math.abs(newTransaction.amount);
    }
    
    db.transactions.push(newTransaction);
    await saveDB();
    return newTransaction;
  },
  
  async updateTransaction(id, updates) {
    const index = db.transactions.findIndex(t => t._id === id);
    if (index === -1) return null;
    
    const updatedTransaction = {
      ...db.transactions[index],
      ...updates,
      _id: id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    // Update amount sign if type changes
    if (updates.type) {
      const amount = Math.abs(updatedTransaction.amount);
      updatedTransaction.amount = updates.type === 'expense' ? -amount : amount;
    }
    
    db.transactions[index] = updatedTransaction;
    await saveDB();
    return updatedTransaction;
  },
  
  async deleteTransaction(id) {
    const index = db.transactions.findIndex(t => t._id === id);
    if (index === -1) return false;
    
    db.transactions.splice(index, 1);
    await saveDB();
    return true;
  },

  // Users
  async getUsers() {
    return db.users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  },
  
  async getUserById(id) {
    const user = db.users.find(user => user._id === id);
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  async findUserByEmail(email) {
    return db.users.find(user => user.email === email);
  },
  
  async findUserByResetToken(token) {
    return db.users.find(user => user.resetPasswordToken === token);
  },
  
  async findByIdAndUpdate(id, update, options = {}) {
    const index = db.users.findIndex(user => user._id === id);
    if (index === -1) return null;
    
    const updatedUser = {
      ...db.users[index],
      ...update,
      updatedAt: new Date().toISOString()
    };
    
    if (options.new) {
      db.users[index] = updatedUser;
      await saveDB();
      return updatedUser;
    }
    
    db.users[index] = updatedUser;
    await saveDB();
    return updatedUser;
  },
  
  async findByIdAndDelete(id) {
    const index = db.users.findIndex(user => user._id === id);
    if (index === -1) return null;
    
    const [deletedUser] = db.users.splice(index, 1);
    await saveDB();
    return deletedUser;
  },
  
  async findById(id) {
    return db.users.find(user => user._id === id) || null;
  },

  async createUser(userData) {
    // Hash password if provided
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }
    
    const user = {
      ...userData,
      _id: uuidv4(),
      role: userData.role || 'user',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.users.push(user);
    await saveDB();
    
    // Don't return the password hash
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  async updateUser(id, updates) {
    const index = db.users.findIndex(u => u._id === id);
    if (index === -1) return null;
    
    // Don't update password here, use changePassword method
    if (updates.password) {
      delete updates.password;
    }
    
    const updatedUser = {
      ...db.users[index],
      ...updates,
      _id: id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    db.users[index] = updatedUser;
    await saveDB();
    
    // Don't return the password hash
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  },
  
  async changePassword(id, newPassword) {
    const user = db.users.find(u => u._id === id);
    if (!user) return false;
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.updatedAt = new Date().toISOString();
    
    await saveDB();
    return true;
  },

  // Categories
  async getCategories(userId) {
    if (userId) {
      return db.categories.filter(c => c.isDefault || c.user === userId);
    }
    return db.categories;
  },
  
  async getCategoryById(id) {
    return db.categories.find(c => c._id === id);
  },

  async addCategory(category) {
    const newCategory = {
      ...category,
      _id: uuidv4(),
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.categories.push(newCategory);
    await saveDB();
    return newCategory;
  },
  
  async updateCategory(id, updates) {
    const index = db.categories.findIndex(c => c._id === id);
    if (index === -1) return null;
    
    // Prevent updating default categories
    if (db.categories[index].isDefault) {
      throw new Error('Cannot update default categories');
    }
    
    const updatedCategory = {
      ...db.categories[index],
      ...updates,
      _id: id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    db.categories[index] = updatedCategory;
    await saveDB();
    return updatedCategory;
  },
  
  async deleteCategory(id) {
    const index = db.categories.findIndex(c => c._id === id);
    if (index === -1) return false;
    
    // Prevent deleting default categories
    if (db.categories[index].isDefault) {
      throw new Error('Cannot delete default categories');
    }
    
    // Check if category is used in transactions
    const isUsed = db.transactions.some(t => t.category === id);
    if (isUsed) {
      throw new Error('Cannot delete category that is being used in transactions');
    }
    
    db.categories.splice(index, 1);
    await saveDB();
    return true;
  },
  
  // Helper method to reset database (for testing)
  async resetDB() {
    db = { ...DEFAULT_DB };
    await saveDB();
    return true;
  }
};
