const bcrypt = require('bcryptjs');
const db = require('../services/db');

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await db.findUserByEmail('test@example.com');
    
    if (existingUser) {
      console.log('Deleting existing test user...');
      await db.findByIdAndDelete(existingUser._id);
    }

    console.log('Creating test user...');
    
    // Hash the password first
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Create test user with hashed password
    const user = await db.createUser({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'user'
    });

    console.log('Test user created successfully:', {
      email: user.email,
      name: user.name,
      role: user.role,
      _id: user._id
    });
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the function
createTestUser();
