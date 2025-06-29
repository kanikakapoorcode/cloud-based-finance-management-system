const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_URL = 'http://localhost:5001/api/v1';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

// Test categories
const CATEGORIES = [
  { id: '1', name: 'Food', type: 'expense' },
  { id: '2', name: 'Transportation', type: 'expense' },
  { id: '3', name: 'Shopping', type: 'expense' },
  { id: '4', name: 'Salary', type: 'income' },
  { id: '5', name: 'Freelance', type: 'income' }
];

// Generate random transactions
function generateTransactions(userId, count = 10) {
  const transactions = [];
  const types = ['expense', 'income'];
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
      amount: isExpense ? -amount : amount,
      type,
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
      date: date.toISOString(),
      category: category.id,
      user: userId,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      isRecurring: Math.random() > 0.7
    });
  }
  
  return transactions;
}

async function login() {
  try {
    console.log('🔑 Logging in test user...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    const { token, user } = response.data;
    console.log(`✅ Logged in as ${user.email} (${user._id})`);
    return { token, userId: user._id };
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function addTransactions(token, transactions) {
  try {
    console.log(`📤 Adding ${transactions.length} transactions...`);
    const response = await axios.post(
      `${API_URL}/transactions/batch`,
      { transactions },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log(`✅ Successfully added ${response.data.count} transactions`);
    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to add transactions:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  try {
    // Login to get token
    const { token, userId } = await login();
    
    // Generate test transactions
    const transactions = generateTransactions(userId, 10);
    
    // Add transactions
    await addTransactions(token, transactions);
    
    console.log('\n🎉 Test data setup completed successfully!');
    console.log('You can now log in to the application with:');
    console.log(`Email: ${TEST_USER.email}`);
    console.log(`Password: ${TEST_USER.password}`);
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  }
}

// Run the script
main();
