const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, './data/db.json');

// Default data structure
const DEFAULT_DB = {
  transactions: [],
  users: [
    {
      _id: uuidv4(),
      name: 'Admin User',
      email: 'admin@example.com',
      password: '', // Will be set with hashed password
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
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
    // Hash the default admin password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    DEFAULT_DB.users[0].password = hashedPassword;
    
    // Ensure data directory exists
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    
    // Write the default database
    await fs.writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf8');
    
    console.log('Database has been reset successfully!');
    console.log('Default admin credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
