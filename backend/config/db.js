const mongoose = require('mongoose');
const colors = require('colors');

// Enable debug mode in development
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}

// Exit application on error
mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err}`.red);
  process.exit(-1);
});

// Print mongoose logs in dev env
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    console.log(`${collectionName}.${method}`, JSON.stringify(query), doc);
  });
}

/**
 * Connect to MongoDB
 * @returns {Promise<mongoose.Connection>}
 */
const connectDB = async () => {
  try {
    // Close existing connection if exists
    if (mongoose.connection.readyState === 1) {
      console.log('Using existing database connection'.blue);
      return mongoose.connection;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
    
    // When successfully connected
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB'.green);
    });

    // If the connection throws an error
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:'.red, err);
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
