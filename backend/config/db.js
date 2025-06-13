const mongoose = require('mongoose');
const colors = require('colors');

// Enable debug mode in development
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}

// Remove the warning with Promise
mongoose.Promise = global.Promise;

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
      console.log('Mongoose default connection open to ' + process.env.MONGODB_URI);
    });

    // If the connection throws an error
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose default connection error: ' + err);
    });

    // When the connection is disconnected
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose default connection disconnected');
    });

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', () => {
      mongoose.connection.close(() => {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
      });
    });

    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`.red);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
