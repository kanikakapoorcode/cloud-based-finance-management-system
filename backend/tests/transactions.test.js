const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

let authToken;
let testUserId;
let testCategoryId;
let testTransactionId;

const TEST_USER = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  password: 'Test@1234'
};

const TEST_CATEGORY = {
  name: 'Test Category',
  type: 'expense',
  icon: 'test',
  color: '#000000'
};

const TEST_TRANSACTION = {
  description: 'Test Transaction',
  amount: 100,
  date: new Date().toISOString().split('T')[0],
  type: 'expense'
};

describe('Transactions API', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-manager-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create test user and get auth token
    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send(TEST_USER);
    
    authToken = userRes.body.token;
    testUserId = userRes.body.data._id;

    // Create test category
    const category = await Category.create({
      ...TEST_CATEGORY,
      user: testUserId
    });
    testCategoryId = category._id;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: /test.*@example\.com/ } });
    await Category.deleteMany({ name: TEST_CATEGORY.name });
    await Transaction.deleteMany({ description: TEST_TRANSACTION.description });
    await mongoose.connection.close();
  });

  describe('POST /api/v1/transactions', () => {
    it('should create a new transaction', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...TEST_TRANSACTION,
          category: testCategoryId
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('description', TEST_TRANSACTION.description);
      
      testTransactionId = res.body.data._id;
    });

    it('should not create transaction without required fields', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Incomplete Transaction'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/transactions', () => {
    it('should get all transactions for the user', async () => {
      const res = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });
  });

  describe('GET /api/v1/transactions/:id', () => {
    it('should get a single transaction', async () => {
      const res = await request(app)
        .get(`/api/v1/transactions/${testTransactionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('_id', testTransactionId);
    });

    it('should return 404 for non-existent transaction', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/transactions/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('PUT /api/v1/transactions/:id', () => {
    it('should update a transaction', async () => {
      const updatedData = {
        description: 'Updated Transaction',
        amount: 200
      };

      const res = await request(app)
        .put(`/api/v1/transactions/${testTransactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('description', updatedData.description);
      expect(res.body.data).toHaveProperty('amount', updatedData.amount);
    });
  });

  describe('DELETE /api/v1/transactions/:id', () => {
    it('should delete a transaction', async () => {
      const res = await request(app)
        .delete(`/api/v1/transactions/${testTransactionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('_id', testTransactionId);

      // Verify it's actually deleted
      const deletedTransaction = await Transaction.findById(testTransactionId);
      expect(deletedTransaction).toBeNull();
    });
  });
});
