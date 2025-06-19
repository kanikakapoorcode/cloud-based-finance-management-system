require('colors');
require('dotenv').config();
const logger = require('./utils/logger');

// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('@exortek/express-mongo-sanitize');
const { xss } = require('express-xss-sanitizer');
const hpp = require('hpp');
const { errors } = require('celebrate');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5001; // Changed default port to 5001

// Initialize in-memory database
console.log('Using in-memory database for development');

// Import routes
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const transactionRoutes = require('./routes/transactions');
const userRoutes = require('./routes/users');

// Enable CORS
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Set security HTTP headers
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        process.env.NODE_ENV === 'development' ? 'http://localhost:*' : ''
      ].filter(Boolean),
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      connectSrc: [
        "'self'",
        process.env.API_URL || 'http://localhost:5000',
        'https://*.tiles.mapbox.com',
        'https://api.mapbox.com',
        'https://events.mapbox.com'
      ],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for Mapbox
  crossOriginOpenerPolicy: false, // Required for Mapbox
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Required for Mapbox
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true,
  noSniff: true,
  frameguard: {
    action: 'deny',
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  hidePoweredBy: true,
};

app.use(helmet(helmetConfig));

// Add security headers
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100,
  message: { success: false, error: 'Too many requests, please try again later' }
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
// app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: [
    'amount', 'date', 'type', 'category', 'description'
  ]
}));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/users', userRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Handle 404 - Not Found
app.all('*', (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.statusCode = 404;
  err.status = 'fail';
  next(err);
});

// Global error handling middleware
const errorHandler = require('./middleware/error');

// Celebrate validation errors
app.use(errors());
app.use(errorHandler);

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  const address = server.address();
  const host = address.address === '::' ? 'localhost' : address.address;
  const port = address.port;
  
  logger.info(`\n${'='.repeat(70)}`);
  logger.info(`🚀 Server running in ${NODE_ENV} mode`.green.bold);
  logger.info(`🌐 Access the server at: http://${host}:${port}`.cyan.underline);
  logger.info(`📊 API Documentation: http://${host}:${port}/api-docs`.cyan.underline);
  logger.info(`📈 Health Check: http://${host}:${port}/api/v1/health`.cyan.underline);
  logger.info(`${'='.repeat(70)}\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  
  // In production, you might want to gracefully shut down
  if (NODE_ENV === 'production') {
    server.close(() => {
      logger.error('Server closed due to unhandled rejection');
      process.exit(1);
    });
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  
  // In production, you might want to gracefully shut down
  if (NODE_ENV === 'production') {
    server.close(() => {
      logger.error('Server closed due to uncaught exception');
      process.exit(1);
    });
  }
});

// Handle SIGTERM for graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

// Handle process exit
process.on('exit', (code) => {
  logger.info(`Process exiting with code ${code}`);
});

// Export the Express app for testing
module.exports = { app, server };

// Handle SIGTERM (for production)
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM RECEIVED. Shutting down gracefully'.yellow);
  server.close(() => {
    console.log('💥 Process terminated!'.red);
  });
});

module.exports = app;
