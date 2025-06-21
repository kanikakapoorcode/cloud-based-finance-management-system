const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const mongoSanitize = require('@exortek/express-mongo-sanitizer');
const { xss } = require('express-xss-sanitizer');
const cors = require('cors');
const logger = require('../utils/logger');

// Configure CORS with enhanced security
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      // Add production domains here
      process.env.FRONTEND_URL
    ].filter(Boolean); // Remove any undefined values

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS policy: ${origin} not allowed.`;
      logger.warn(msg, { origin, allowedOrigins });
      return callback(new Error(msg), false);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'x-access-token',
    'x-forwarded-for',
    'x-request-id',
    'x-csrf-token'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-Request-ID'],
  maxAge: 600, // Cache preflight request for 10 minutes
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress;
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.'
    });
  }
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many login attempts, please try again after 15 minutes'
  },
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress;
  }
});

// Security headers middleware
const securityHeaders = [
  // Set security headers using helmet
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.example.com'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-site' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 63072000, // 2 years in seconds
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'same-origin' },
    xssFilter: true,
  }),
  
  // Prevent HTTP Parameter Pollution
  hpp({
    whitelist: [
      'filter',
      'sort',
      'limit',
      'page',
      'fields',
      'select',
    ],
  }),
  
  // Sanitize data
  mongoSanitize(),
  
  // Prevent XSS attacks
  xss(),
  
  // Prevent MIME type sniffing
  (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  }
];

// Log security-related events
const securityLogger = (req, res, next) => {
  // Log security-sensitive headers
  const securityHeaders = {
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'user-agent': req.headers['user-agent'],
    'x-real-ip': req.headers['x-real-ip']
  };

  // Log potential security issues
  if (req.path.includes('..') || req.path.includes('//')) {
    logger.warn('Potential path traversal attack detected', {
      path: req.path,
      ip: req.ip,
      headers: securityHeaders
    });
  }

  next();
};

module.exports = {
  corsOptions,
  apiLimiter,
  authLimiter,
  securityHeaders: [...securityHeaders],
  securityLogger,
  
  // Helper function to apply all security middleware
  applySecurity: (app) => {
    // Apply security headers
    app.use(securityHeaders);
    
    // Apply rate limiting
    app.use('/api/v1/auth/', authLimiter);
    app.use('/api/v1/', apiLimiter);
    
    // Apply security logger
    app.use(securityLogger);
    
    // Apply CORS with options
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));
  }
};