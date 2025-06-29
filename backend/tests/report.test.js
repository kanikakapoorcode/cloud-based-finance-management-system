const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

let authToken;
let testUserId;

// Test data
const TEST_USER = {
  name: 'Report Test User',
  email: `reporttest${Date.now()}@example.com`,
  password: 'Test@1234'
};

const TEST_CATEGORY = {
  name: 'Test Category',
  type: 'expense',
  icon: 'test',
  color: '#000000'
};

describe('Reports API', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-manager-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create test user
    const user = await User.create(TEST_USER);
    testUserId = user._id;

    // Login to get token
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: TEST_USER.email,
        password: TEST_USER.password
      });
    
    authToken = res.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Transaction.deleteMany({});
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/v1/reports/summary', () => {
    it('should return summary report', async () => {
      const res = await request(app)
        .get('/api/v1/reports/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('totalIncome', 0);
      expect(res.body.data).toHaveProperty('totalExpenses', 0);
      expect(res.body.data).toHaveProperty('netSavings', 0);
    });
  });

  describe('GET /api/v1/reports/category-wise', () => {
    it('should return category-wise report', async () => {
      // Create test category
      const category = await Category.create({
        ...TEST_CATEGORY,
        user: testUserId
      });

      // Create test transaction
      await Transaction.create({
        amount: 100,
        type: 'expense',
        category: category._id,
        description: 'Test transaction',
        date: new Date(),
        user: testUserId
      });

      const res = await request(app)
        .get('/api/v1/reports/category-wise')
        .query({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
