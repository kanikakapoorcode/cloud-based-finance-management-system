require('colors');
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const { xss } = require('express-xss-sanitizer');
const mongoSanitize = require('express-mongo-sanitize');
const { errors } = require('celebrate');
const connectDB = require('./config/db');

// Import middleware
const logger = require('./utils/logger');
const errorHandler = require('./middleware/error');

// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5002;

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5174', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Connect to MongoDB
require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const transactionRoutes = require('./routes/transactions');
const testRoutes = require('./routes/test');
const testDataRoutes = require('./routes/testData');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reportRoutes');

// Security headers with CSP configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        connectSrc: ["'self'", 'http://localhost:5001', 'ws://localhost:5001'],
      },
    },
  })
);

// Trust first proxy (if behind a proxy like Nginx)
app.set('trust proxy', 1);

// Request logging
if (!isProduction) {
  // Development logging with morgan
  app.use(morgan('dev'));
  
  // Log all requests in development
  app.use((req, res, next) => {
    logger.info(`Incoming request`, {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    next();
  });
} else {
  // Production logging
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.http(message.trim())
    },
    skip: (req) => req.originalUrl === '/health'
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100,
  message: { success: false, error: 'Too many requests, please try again later' }
});
app.use('/api', limiter);

// Body parser middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['amount', 'date', 'type', 'category', 'description']
}));

// Security headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Disable caching for sensitive routes
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: NODE_ENV,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage()
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/test', testRoutes);
app.use('/api/v1/test-data', testDataRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/reports', reportRoutes);

// Serve static assets in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
} else {
  // 404 handler for API in development
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `Not found - ${req.originalUrl}`
    });
  });
}

// Celebrate validation errors
app.use(errors());

// Error handling middleware
app.use(errorHandler);

// Create server instance
let server;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`\n❌ Unhandled Rejection: ${err.message}`.red);
  logger.error(err.stack);
  if (server) {
    server.close(() => {
      logger.error('💥 Server closed due to unhandled rejection');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('\n❌ UNCAUGHT EXCEPTION! 💥 Shutting down...'.red);
  logger.error(`Error: ${err.message}`.red);
  logger.error(err.stack);
  process.exit(1);
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    logger.info('🔌 Connecting to MongoDB...'.yellow);
    await connectDB();
    
    // Start server after successful DB connection
    server = app.listen(PORT, '0.0.0.0', () => {
      const address = server.address();
      const host = address.address === '::' ? 'localhost' : address.address;
      const port = address.port;
      
      logger.info(`\n${'='.repeat(70)}`);
      logger.info(`🚀 Server running in ${NODE_ENV} mode on port ${port}`.green.bold);
      logger.info(`🌐 Access the server at: http://${host}:${port}`.cyan.underline);
      logger.info(`📊 Health Check: http://${host}:${port}/api/health`.cyan.underline);
      
      // Log MongoDB connection status
      const dbStatus = mongoose.connection.readyState === 1 ? 'connected'.green : 'disconnected'.red;
      logger.info(`\n📊 MongoDB connection: ${dbStatus}`);
      
      // Log environment information
      logger.info(`\n🌍 Environment: ${NODE_ENV}`);
      logger.info(`🛠️  Node version: ${process.version}`);
      logger.info(`💻 Platform: ${process.platform} ${process.arch}`);
      
      // Log memory usage
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      logger.info(`💾 Memory usage: ${Math.round(used * 100) / 100} MB`);
      logger.info(`${'='.repeat(70)}\n`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') throw error;
      
      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
      
      // Handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          logger.error(`❌ ${bind} requires elevated privileges`.red);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`❌ ${bind} is already in use`.red);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
    
  } catch (error) {
    logger.error(`\n❌ Failed to start server: ${error.message}`.red);
    logger.error(`Stack: ${error.stack}`.red);
    process.exit(1);
  }
};

// Start the application
startServer();

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
    error: err.message,
    stack: err.stack
  });
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM for graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle process termination
process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = { app, server };
