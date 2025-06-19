const rateLimit = require('express-rate-limit');
const { ErrorResponse } = require('../utils/errorResponse');
const logger = require('../utils/logger');

/**
 * Create a rate limiter middleware with the given options
 * @param {Object} options - Rate limiting options
 * @param {number} [options.windowMs=15 * 60 * 1000] - Time window in milliseconds
 * @param {number} [options.max=100] - Maximum number of requests per window
 * @param {string} [options.message='Too many requests, please try again later'] - Error message
 * @param {string} [options.keyGenerator] - Function to generate keys for rate limiting
 * @param {boolean} [options.skipSuccessfulRequests=false] - Whether to skip successful requests
 * @param {boolean} [options.trustProxy=false] - Whether to trust proxy headers
 * @returns {Function} Express middleware function
 */
const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 100,
  message = 'Too many requests, please try again later',
  keyGenerator = null,
  skipSuccessfulRequests = false,
  trustProxy = false,
  skip = () => false,
  ...options
} = {}) => {
  // Default key generator uses IP address
  const defaultKeyGenerator = (req) => {
    // If behind a proxy, use the X-Forwarded-For header
    if (trustProxy && req.headers['x-forwarded-for']) {
      return req.headers['x-forwarded-for'].split(',')[0].trim();
    }
    return req.ip;
  };

  return rateLimit({
    windowMs,
    max,
    message,
    skipSuccessfulRequests,
    trustProxy,
    keyGenerator: keyGenerator || defaultKeyGenerator,
    skip,
    handler: (req, res, next, options) => {
      const error = ErrorResponse.tooManyRequests(options.message, 'RATE_LIMIT_EXCEEDED', {
        windowMs: options.windowMs,
        max: options.max,
        current: req.rateLimit.current,
        remaining: req.rateLimit.remaining,
        resetTime: new Date(Date.now() + req.rateLimit.resetTime).toISOString(),
      });
      
      // Log rate limit exceeded
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        rateLimit: {
          current: req.rateLimit.current,
          remaining: req.rateLimit.remaining,
          resetTime: new Date(Date.now() + req.rateLimit.resetTime).toISOString(),
        },
      });
      
      // Set rate limit headers
      res.setHeader('Retry-After', Math.ceil(options.windowMs / 1000));
      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', req.rateLimit.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + req.rateLimit.resetTime).toISOString());
      
      next(error);
    },
    ...options,
  });
};

// Common rate limiters for different routes
const rateLimiters = {
  // Strict rate limiter for authentication routes
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: 'Too many login attempts, please try again later',
    skip: (req) => {
      // Skip rate limiting for successful logins to prevent lockout
      return req.path.includes('login') && req.method === 'POST' && res.statusCode === 200;
    },
  }),

  // Standard API rate limiter
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  }),

  // Stricter rate limiter for password reset endpoints
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many password reset attempts, please try again later',
  }),

  // Public API rate limiter (for unauthenticated endpoints)
  publicApi: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60, // Limit each IP to 60 requests per windowMs
  }),
};

/**
 * Middleware to apply rate limiting based on route type
 * @param {string} type - Type of rate limiter to use (auth, api, passwordReset, publicApi)
 * @returns {Function} Express middleware function
 */
const rateLimiter = (type = 'api') => {
  if (!rateLimiters[type]) {
    throw new Error(`Unknown rate limiter type: ${type}`);
  }
  return rateLimiters[type];
};

module.exports = {
  createRateLimiter,
  rateLimiter,
  ...rateLimiters,
};
