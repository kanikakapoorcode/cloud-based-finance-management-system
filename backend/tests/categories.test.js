const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Category = require('../models/Category');

let authToken;
let testUserId;
let testCategoryId;

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

describe('Categories API', () => {
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
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: /test.*@example\.com/ } });
    await Category.deleteMany({ name: TEST_CATEGORY.name });
    await mongoose.connection.close();
  });

  describe('POST /api/v1/categories', () => {
    it('should create a new category', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(TEST_CATEGORY);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('name', TEST_CATEGORY.name);
      
      testCategoryId = res.body.data._id;
    });

    it('should not create category without required fields', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Incomplete Category'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/categories', () => {
    it('should get all categories for the user', async () => {
      const res = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });
  });

  describe('GET /api/v1/categories/type/:type', () => {
    it('should get categories by type', async () => {
      const res = await request(app)
        .get(`/api/v1/categories/type/${TEST_CATEGORY.type}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });
  });

  describe('GET /api/v1/categories/:id', () => {
    it('should get a single category', async () => {
      const res = await request(app)
        .get(`/api/v1/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('_id', testCategoryId);
    });

    it('should return 404 for non-existent category', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/categories/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('PUT /api/v1/categories/:id', () => {
    it('should update a category', async () => {
      const updatedData = {
        name: 'Updated Category',
        color: '#FFFFFF'
      };

      const res = await request(app)
        .put(`/api/v1/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('name', updatedData.name);
      expect(res.body.data).toHaveProperty('color', updatedData.color);
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('should delete a category', async () => {
      // First, create a category to delete
      const category = await Category.create({
        ...TEST_CATEGORY,
        name: 'Category to delete',
        user: testUserId
      });

      const res = await request(app)
        .delete(`/api/v1/categories/${category._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('_id', category._id.toString());

      // Verify it's actually deleted
      const deletedCategory = await Category.findById(category._id);
      expect(deletedCategory).toBeNull();
    });
  });
});
