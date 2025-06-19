const { ErrorResponse } = require('../utils/errorResponse');
const logger = require('../utils/logger');

/**
 * Middleware to handle API versioning
 * Extracts the API version from the request headers or query parameters
 * and sets it on the request object for use in route handlers
 */
const apiVersion = (req, res, next) => {
  // Default to v1 if no version is specified
  let version = 'v1';
  
  // Check for version in Accept header (e.g., application/vnd.yourapi.v1+json)
  const acceptHeader = req.headers.accept || '';
  const versionMatch = acceptHeader.match(/application\/vnd\.yourapi\.v(\d+)\+json/);
  
  if (versionMatch && versionMatch[1]) {
    version = `v${versionMatch[1]}`;
  } 
  // Check for version in URL path (e.g., /api/v1/resource)
  else if (req.path.startsWith('/api/v')) {
    const pathParts = req.path.split('/');
    const versionIndex = pathParts.findIndex(part => part.startsWith('v'));
    if (versionIndex !== -1) {
      version = pathParts[versionIndex];
    }
  }
  // Check for version in query parameter (e.g., ?version=1)
  else if (req.query.version) {
    version = `v${req.query.version}`;
  }
  
  // Set the API version on the request object
  req.apiVersion = version;
  
  // Add version to response headers
  res.setHeader('X-API-Version', version);
  
  next();
};

/**
 * Middleware to check if the requested API version is supported
 * @param {Array} supportedVersions - Array of supported API versions (e.g., ['v1', 'v2'])
 */
const validateApiVersion = (supportedVersions = ['v1']) => {
  return (req, res, next) => {
    const requestedVersion = req.apiVersion || 'v1';
    
    if (!supportedVersions.includes(requestedVersion)) {
      logger.warn(`Unsupported API version requested: ${requestedVersion}`, {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        supportedVersions
      });
      
      return next(new ErrorResponse(
        `API version '${requestedVersion}' is not supported. Supported versions: ${supportedVersions.join(', ')}`,
        400,
        null,
        'UNSUPPORTED_API_VERSION',
        { supportedVersions }
      ));
    }
    
    next();
  };
};

/**
 * Middleware to handle maintenance mode
 * Checks if the application is in maintenance mode and returns a 503 response if it is
 * Can be configured to allow certain IPs or paths to bypass maintenance mode
 */
const maintenanceMode = (options = {}) => {
  const {
    enabled = process.env.MAINTENANCE_MODE === 'true',
    message = process.env.MAINTENANCE_MESSAGE || 'The server is currently undergoing maintenance. Please try again later.',
    allowIps = (process.env.MAINTENANCE_ALLOWED_IPS || '').split(',').map(ip => ip.trim()),
    allowPaths = ['/api/v1/health', '/health', '/status']
  } = options;
  
  return (req, res, next) => {
    // Skip middleware if maintenance mode is disabled
    if (!enabled) {
      return next();
    }
    
    // Allow health checks and status endpoints
    if (allowPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Allow specified IPs to bypass maintenance mode
    const clientIp = req.ip || req.connection.remoteAddress;
    if (allowIps.includes(clientIp) || allowIps.includes('*')) {
      return next();
    }
    
    // Set Retry-After header (RFC 7231)
    res.set('Retry-After', '3600'); // 1 hour
    
    // Return maintenance response
    return res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message,
      code: 'MAINTENANCE_MODE',
      timestamp: new Date().toISOString(),
      docs: 'https://docs.example.com/maintenance'
    });
  };
};

/**
 * Middleware to deprecate an API endpoint
 * Adds deprecation headers to the response
 * @param {Object} options - Options for deprecation notice
 * @param {string} options.message - Deprecation message
 * @param {string} [options.alternative] - Alternative endpoint to use
 * @param {string} [options.sunset] - Date when the endpoint will be removed (ISO 8601 format)
 */
const deprecated = (options = {}) => {
  const { message, alternative, sunset } = options;
  
  return (req, res, next) => {
    // Add deprecation notice to response headers (RFC 8594)
    let deprecationHeader = 'true';
    if (sunset) {
      deprecationHeader = `date="${sunset}"`;
    }
    
    res.set('Deprecation', deprecationHeader);
    
    if (message) {
      res.set('Warning', `299 - "Deprecated: ${message}"`);
    }
    
    if (alternative) {
      res.links({
        alternate: alternative,
        type: 'application/json'
      });
    }
    
    next();
  };
};

module.exports = {
  apiVersion,
  validateApiVersion,
  maintenanceMode,
  deprecated
};
