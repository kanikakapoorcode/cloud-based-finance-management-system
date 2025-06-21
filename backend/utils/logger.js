const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json, errors, metadata } = format;
const path = require('path');
const fs = require('fs');
const DailyRotateFile = require('winston-daily-rotate-file');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
require('colors');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Generate a unique request ID for each log entry
const requestId = format((info) => {
  info.requestId = info.requestId || uuidv4();
  return info;
});

// Add hostname to logs
const hostname = os.hostname();

// Define log levels and colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Add colors to winston
winston.addColors(colors);

// Simple console format for development
const simpleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const color = colors[level] || 'white';
  const levelStr = `[${level.toUpperCase()}]`.padEnd(7);
  return `${timestamp} ${levelStr} [${hostname}] ${message}`[color];
});

// JSON format for production
const jsonFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// Define different log formats for different environments
const devFormat = combine(
  requestId(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  simpleFormat
);

const prodFormat = combine(
  requestId(),
  timestamp(),
  errors({ stack: true }),
  json()
);

// Create a logger instance with request ID tracking
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  defaultMeta: { 
    service: 'finance-management-system',
    environment: process.env.NODE_ENV || 'development',
    pid: process.pid,
    hostname
  },
  exitOnError: false, // Don't exit on handled exceptions
  transports: [
    // Console transport for all environments
    new transports.Console({
      format: combine(
        colorize({ all: true }),
        devFormat
      ),
      handleExceptions: true,
      handleRejections: true
    })
  ]
});

// In production, add file transports
if (process.env.NODE_ENV === 'production') {
  // Daily rotate file transport for errors
  logger.add(new DailyRotateFile({
    level: 'error',
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: prodFormat
  }));

  // Daily rotate file transport for all logs
  logger.add(new DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: prodFormat
  }));
}

// Create a stream for morgan (HTTP request logging)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  // Consider whether to exit the process here
  // process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { 
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined
  });
});

module.exports = logger;
