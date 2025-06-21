const mongoose = require('mongoose');
const colors = require('colors');
const logger = require('../utils/logger');

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
    // Close existing connection if exists
    if (mongoose.connection.readyState === 1) {
      logger.info('Using existing database connection'.blue);
      return mongoose.connection;
    }

    const options = {
      serverSelectionTimeoutMS: 10000, // Increase timeout to 10s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      minPoolSize: 1, // Minimum number of connections in the connection pool
      maxIdleTimeMS: 30000, // Close idle connections after 30s
      connectTimeoutMS: 10000, // Timeout after 10s instead of 30s
      heartbeatFrequencyMS: 10000, // Send a heartbeat every 10 seconds
      retryWrites: true,
      retryReads: true,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cloudfin', options);

    logger.info(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
    
    // When successfully connected
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB'.green);
    });

    // If the connection throws an error
    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:'.red, err);
    });

    // When the connection is disconnected
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose connection disconnected'.yellow);
    });

    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`.red);
    // Exit process with failure
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
