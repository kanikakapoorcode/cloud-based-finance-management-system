const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Basic metadata about the API
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Management System API',
      version: '1.0.0',
      description: 'API for managing personal finances',
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Only include specific route files explicitly
  apis: [
    path.join(__dirname, '../routes/auth.js'),
    path.join(__dirname, '../routes/categories.js'),
    path.join(__dirname, '../routes/transactions.js'),
  ],
};

const specs = swaggerJsdoc(options);

const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
  },
};

module.exports = { specs, swaggerUi, swaggerOptions };
