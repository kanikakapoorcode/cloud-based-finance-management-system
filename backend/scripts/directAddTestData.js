const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../data/db.json');

// Test user data
const TEST_USER = {
  _id: 'test_user_' + Date.now(),
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  isVerified: true,
  role: 'user',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Test categories
const CATEGORIES = [
  { _id: '1', name: 'Food', type: 'expense', color: '#FF6B6B', icon: 'utensils', isDefault: true },
  { _id: '2', name: 'Transportation', type: 'expense', color: '#4ECDC4', icon: 'bus', isDefault: true },
  { _id: '3', name: 'Shopping', type: 'expense', color: '#FFD166', icon: 'shopping-bag', isDefault: true },
  { _id: '4', name: 'Salary', type: 'income', color: '#06D6A0', icon: 'money-bill-wave', isDefault: true },
  { _id: '5', name: 'Freelance', type: 'income', color: '#118AB2', icon: 'laptop-code', isDefault: true }
];

// Generate test transactions
function generateTransactions(userId, count = 10) {
  const transactions = [];
  const paymentMethods = ['cash', 'credit card', 'debit card', 'bank transfer'];
  
  for (let i = 0; i < count; i++) {
    const isExpense = Math.random() > 0.3;
    const type = isExpense ? 'expense' : 'income';
    const category = isExpense 
      ? CATEGORIES.find(c => c.type === 'expense')
      : CATEGORIES.find(c => c.type === 'income');
    
    const amount = isExpense 
      ? Math.floor(Math.random() * 500) + 10
      : Math.floor(Math.random() * 2000) + 500;
    
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    transactions.push({
      _id: uuidv4(),
      amount: isExpense ? -amount : amount,
      type,
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
      date: date.toISOString(),
      category: category._id,
      user: userId,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      isRecurring: Math.random() > 0.7,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  return transactions;
}

async function main() {
  try {
    console.log('🚀 Starting test data setup...');
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    TEST_USER.password = await bcrypt.hash(TEST_USER.password, salt);
    
    // Generate transactions
    const transactions = generateTransactions(TEST_USER._id, 10);
    
    // Create database object
    const db = {
      users: [TEST_USER],
      categories: CATEGORIES,
      transactions: transactions
    };
    
    // Write to file
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
    
    console.log('✅ Test data setup completed successfully!');
    console.log('\nTest user created:');
    console.log(`Email: ${TEST_USER.email}`);
    console.log(`Password: password123`);
    console.log(`User ID: ${TEST_USER._id}`);
    console.log(`\nAdded ${transactions.length} test transactions.`);
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  }
}

// Run the script
main();
