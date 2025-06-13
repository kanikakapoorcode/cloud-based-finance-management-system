const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Create Express app
const app = express();

// Enable CORS for all routes and origins
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Middleware
app.use(express.json());

// Mock users database
const users = [];

// Routes
// @desc    Register user
// @route   POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create user
    const user = {
      id: Date.now().toString(),
      name,
      email,
      password
    };
    
    users.push(user);
    console.log('User registered:', user);

    // Create token
    const token = jwt.sign(
      { id: user.id },
      'your_jwt_secret_key_here',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      token
    });
  } catch (err) {
    console.error('Error in register:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Register user (alias)
// @route   POST /api/auth/signup
app.post('/api/auth/signup', (req, res) => {
  console.log('Signup request received:', req.body);
  
  try {
    const { name, email, password } = req.body;
    
    // Basic validation
    if (!name || !email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email and password'
      });
    }

    // Check if user exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create user
    const user = {
      id: Date.now().toString(),
      name,
      email,
      password
    };
    
    users.push(user);
    console.log('User signed up successfully:', user);

    // Create token
    const token = jwt.sign(
      { id: user.id },
      'your_jwt_secret_key_here',
      { expiresIn: '30d' }
    );

    // Send response with user data and token
    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (err) {
    console.error('Error in signup:', err);
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = users.find(user => user.email === email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id },
      'your_jwt_secret_key_here',
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      token
    });
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
app.get('/api/auth/me', (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, 'your_jwt_secret_key_here');
    
    // Find user
    const user = users.find(user => user.id === decoded.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Return user without password
    const { password, ...userData } = user;
    
    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (err) {
    console.error('Error in getMe:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// Dashboard route
app.get('/api/dashboard', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      balance: 25850,
      income: 45000,
      expenses: 19150,
      savings: 7755,
      recentTransactions: [
        { 
          id: 1, 
          title: 'Grocery Shopping', 
          amount: -2450, 
          date: '21 May 2025',
          category: 'Shopping'
        },
        { 
          id: 2, 
          title: 'Salary Credit', 
          amount: 45000, 
          date: '18 May 2025',
          category: 'Income'
        },
        { 
          id: 3, 
          title: 'Restaurant Bill', 
          amount: -1200, 
          date: '16 May 2025',
          category: 'Food'
        },
        { 
          id: 4, 
          title: 'Petrol', 
          amount: -1500, 
          date: '14 May 2025',
          category: 'Transport'
        },
        { 
          id: 5, 
          title: 'Rent Payment', 
          amount: -15000, 
          date: '10 May 2025',
          category: 'Housing'
        }
      ],
      budgets: [
        { category: 'Housing', current: 15000, limit: 20000 },
        { category: 'Food & Groceries', current: 3650, limit: 8000 },
        { category: 'Transportation', current: 3000, limit: 5000 },
        { category: 'Entertainment', current: 4500, limit: 5000 }
      ]
    }
  });
});

// Transactions route
app.get('/api/transactions', (req, res) => {
  console.log('GET transactions request received, query:', req.query);
  
  // Mock transactions data
  const transactionsData = [
    { id: 1, date: '2025-05-18', description: 'Salary', amount: 45000, category: 'income' },
    { id: 2, date: '2025-05-10', description: 'Rent Payment', amount: -15000, category: 'housing' },
    { id: 3, date: '2025-05-21', description: 'Grocery Shopping', amount: -2450, category: 'food' },
    { id: 4, date: '2025-05-16', description: 'Restaurant Bill', amount: -1200, category: 'food' },
    { id: 5, date: '2025-05-14', description: 'Petrol', amount: -1500, category: 'transport' },
    { id: 6, date: '2025-05-08', description: 'Movie Tickets', amount: -800, category: 'entertainment' },
    { id: 7, date: '2025-05-05', description: 'Electricity Bill', amount: -2200, category: 'utilities' },
    { id: 8, date: '2025-05-03', description: 'Freelance Work', amount: 12000, category: 'income' },
    { id: 9, date: '2025-05-01', description: 'Online Shopping', amount: -3500, category: 'shopping' },
    { id: 10, date: '2025-04-28', description: 'Mobile Recharge', amount: -499, category: 'utilities' },
    { id: 11, date: '2025-04-25', description: 'Gym Membership', amount: -1800, category: 'other' },
    { id: 12, date: '2025-04-22', description: 'Birthday Gift', amount: -1000, category: 'other' }
  ];
  
  // Return the transactions data
  return res.status(200).json({
    success: true,
    data: transactionsData
  });
});

// Add transaction route
app.post('/api/transactions/add', (req, res) => {
  console.log('POST add transaction request received:', req.body);
  
  try {
    const { description, amount, date, category } = req.body;
    
    // Validate required fields
    if (!description || amount === undefined || !date || !category) {
      console.log('Missing required fields for transaction');
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }
    
    // Create a new transaction object
    const newTransaction = {
      id: Date.now(),
      description,
      amount,
      date,
      category
    };
    
    console.log('New transaction created:', newTransaction);
    
    // In a real app, this would save to a database
    // Here we just return success with the data
    return res.status(201).json({
      success: true,
      data: newTransaction
    });
  } catch (err) {
    console.error('Error adding transaction:', err);
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// Delete transaction route
app.delete('/api/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real app, this would delete from a database
    // Here we just return success
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Finance Management System API is running...');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
