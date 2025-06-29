require('dotenv').config();
const db = require('../services/db');

async function createTestUser() {
  try {
    console.log('🔍 Checking for existing test user...');
    const existingUser = await db.findUserByEmail('test@example.com');
    
    if (existingUser) {
      console.log('ℹ️ Test user already exists:', {
        _id: existingUser._id,
        email: existingUser.email,
        isVerified: existingUser.isVerified
      });
      return existingUser;
    }
    
    console.log('🔄 Creating new test user...');
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123', // Will be hashed by createUser
      isVerified: true,
      role: 'user',
      isActive: true
    };
    
    console.log('📝 User data to create:', JSON.stringify(testUser, null, 2));
    
    // Add to database using the proper method
    const createdUser = await db.createUser(testUser);
    
    console.log('✅ Test user created successfully:', {
      _id: createdUser._id,
      email: createdUser.email,
      isVerified: createdUser.isVerified,
      createdAt: createdUser.createdAt
    });
    
    // Verify the user was actually saved
    const savedUser = await db.findUserByEmail('test@example.com');
    console.log('🔍 Verifying saved user:', savedUser ? 'Found' : 'Not found!');
    
    return createdUser;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

// Run the function
createTestUser()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
