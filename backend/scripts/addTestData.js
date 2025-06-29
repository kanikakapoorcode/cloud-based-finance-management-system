require('dotenv').config();
const { addTestTransactions } = require('../utils/testData');
const db = require('../services/db');

async function run() {
  try {
    // Get the test user from the database
    const testUser = await db.findUserByEmail('test@example.com');
    
    if (!testUser) {
      console.error('Test user not found. Please run createTestUser.js first.');
      process.exit(1);
    }
    
    const userId = testUser._id;
    console.log(`Adding test transactions for user: ${userId} (${testUser.email})`);
    
    // Add 10 test transactions
    const transactions = await addTestTransactions(userId, 10);
    console.log(`✅ Successfully added ${transactions.length} test transactions`);
    
    // Print the added transactions
    console.log('\nAdded transactions:');
    transactions.forEach((t, i) => {
      console.log(`[${i + 1}] ${t.type.toUpperCase()} - ${t.description}: $${Math.abs(t.amount).toFixed(2)} (${new Date(t.date).toLocaleDateString()})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding test data:', error);
    process.exit(1);
  }
}

run();
