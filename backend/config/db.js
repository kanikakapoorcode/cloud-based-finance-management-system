const mongoose = require('mongoose');
const colors = require('colors');
const logger = require('../utils/logger');

// Get MongoDB URI from environment variables or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-manager';

// Log the MongoDB URI (without the password) for debugging
const safeMongoUri = MONGODB_URI.replace(/:([^:]+)@/, ':<REDACTED>@');
logger.info(`Connecting to MongoDB: ${safeMongoUri}`);

// Enable debug mode in development
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    logger.debug(`Mongoose: ${collectionName}.${method}`, {
      query: JSON.stringify(query),
      doc: JSON.stringify(doc)
    });
  });
}

// Exit application on error
mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err}`.red);
  process.exit(-1);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection disconnected'.yellow);
});

// When the connection is reconnected
mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB connection reestablished'.green);
});

// Close the Mongoose connection when the Node process ends
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed through app termination'.yellow);
    process.exit(0);
  } catch (err) {
    logger.error('Error closing MongoDB connection:'.red, err);
    process.exit(1);
  }
});

/**
 * Connect to MongoDB with retry logic
 * @returns {Promise<mongoose.Connection>}
 */
const connectDB = async () => {
  try {
    logger.info('\n🔍 Starting MongoDB connection...'.yellow);
    
    // Log environment variables (except sensitive ones)
    logger.debug('Environment Variables:'.gray);
    Object.keys(process.env).forEach(key => {
      if (key.includes('MONGODB') || key.includes('NODE_ENV')) {
        const value = key.includes('PASSWORD') ? '********' : process.env[key];
        logger.debug(`  ${key}=${value}`.gray);
      }
    });
    
    // Close existing connection if exists
    if (mongoose.connection.readyState === 1) {
      logger.info('ℹ️ Using existing database connection'.blue);
      return mongoose.connection;
    }
    
    // Log connection state
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const currentState = states[mongoose.connection.readyState] || 'unknown';
    logger.info(`📊 Current connection state: ${currentState}`.yellow);

    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      family: 4, // Use IPv4
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      dbName: 'finance-manager'
    };

    logger.info('\n🔌 Attempting to connect to MongoDB...'.yellow);
    logger.debug(`Connection string: ${safeMongoUri}`.gray);
    logger.debug('Connection options:'.gray, JSON.stringify(options, null, 2).gray);
    
    // Test the connection
    const startTime = Date.now();
    const conn = await mongoose.connect(MONGODB_URI, options);
    const endTime = Date.now();
    
    // Verify the connection
    const db = mongoose.connection.db;
    await db.command({ ping: 1 });
    
    logger.info('\n✅ MongoDB Connected Successfully!'.green.bold);
    logger.info(`   Host: ${conn.connection.host}`.cyan);
    logger.info(`   Database: ${db.databaseName}`.cyan);
    logger.info(`   Connection time: ${endTime - startTime}ms`.cyan);
    
    try {
      const collections = await db.listCollections().toArray();
      logger.info(`   Collections (${collections.length}):`.cyan);
      collections.forEach((col, index) => {
        logger.info(`     ${index + 1}. ${col.name}`.cyan);
      });
    } catch (err) {
      logger.warn('   Could not list collections:'.yellow, err.message);
    }
    
    // When successfully connected
    mongoose.connection.on('connected', () => {
      logger.info('✅ Mongoose connected to MongoDB'.green);
    });

    // If the connection throws an error
    mongoose.connection.on('error', (err) => {
      logger.error('❌ Mongoose connection error:'.red, err);
    });

    // When the connection is disconnected
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  Mongoose connection disconnected'.yellow);
    });

    return conn;
  } catch (error) {
    const errorMessage = error.message || 'Unknown error';
    logger.error('\n❌ MongoDB connection failed!'.red.bold);
    
    // Detailed error information
    logger.error('\n🔍 Error Details:'.red);
    logger.error(`Message: ${errorMessage}`.red);
    
    if (error.code) logger.error(`Code: ${error.code}`.red);
    if (error.codeName) logger.error(`Code Name: ${error.codeName}`.red);
    
    // More specific error handling
    if (errorMessage.includes('bad auth') || errorMessage.includes('Authentication failed')) {
      logger.error('\n🔐 Authentication failed!'.red.bold);
      logger.error('Please check:'.yellow);
      logger.error('1. Your MongoDB Atlas username and password'.yellow);
      logger.error('2. The authentication database for your user'.yellow);
    } 
    else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
      logger.error('\n🌐 Network Error!'.red.bold);
      logger.error('Please check:'.yellow);
      logger.error('1. Your internet connection'.yellow);
      logger.error('2. MongoDB Atlas cluster status (check dashboard)'.yellow);
      logger.error('3. Firewall settings (port 27017)'.yellow);
    } 
    else if (errorMessage.includes('timed out')) {
      logger.error('\n⏱️  Connection Timeout!'.red.bold);
      logger.error('Please check:'.yellow);
      logger.error('1. Your network connection speed'.yellow);
      logger.error('2. MongoDB Atlas cluster status'.yellow);
      logger.error('3. Try increasing serverSelectionTimeoutMS'.yellow);
    }
    
    // Connection troubleshooting
    logger.error('\n🔧 Troubleshooting Steps:'.yellow.bold);
    logger.error('1. Verify your MongoDB Atlas cluster is running'.yellow);
    logger.error('2. Check if your IP (49.36.222.70) is whitelisted'.yellow);
    logger.error('3. Verify database user has readWrite permissions'.yellow);
    logger.error('4. Test connection in MongoDB Compass with same credentials'.yellow);
    
    // Debug information
    logger.error('\n📊 Debug Information:'.gray);
    logger.error(`Connection String: ${safeMongoUri}`.gray);
    logger.error(`Mongoose Version: ${mongoose.version}`.gray);
    logger.error(`Node Version: ${process.version}`.gray);
    logger.error(`Platform: ${process.platform} ${process.arch}`.gray);
    
    // Detailed error logging for development
    if (process.env.NODE_ENV !== 'production') {
      logger.error('\n🔍 Stack Trace:'.gray);
      logger.error(error.stack.gray);
      
      if (error.name === 'MongoServerError') {
        logger.error('\n🔍 MongoDB Error Details:'.gray);
        Object.keys(error).forEach(key => {
          if (key !== 'stack' && key !== 'message' && key !== 'name') {
            logger.error(`  ${key}: ${JSON.stringify(error[key])}`.gray);
          }
        });
      }
    }
    
    // Exit with error code
    process.exit(1);
  }
};

// Handle Node process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('Mongoose connection closed through app termination'.yellow);
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:'.red, err);
    process.exit(1);
  }
});

module.exports = connectDB;
