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

async function resetDatabase() {
  try {
    // Create test user with hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const testUser = {
      _id: uuidv4(),
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'user',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Create admin user
    const adminHashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = {
      _id: uuidv4(),
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminHashedPassword,
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Create database with test users
    const db = {
      ...DEFAULT_DB,
      users: [testUser, adminUser]
    };
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    
    // Write to file
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
    
    console.log('✅ Database reset successfully!');
    console.log('Test User:', testUser.email, '| Password: password123');
    console.log('Admin User:', adminUser.email, '| Password: admin123');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

resetDatabase();
