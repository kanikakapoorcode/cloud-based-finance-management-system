const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  const safeUri = uri.replace(/:([^:]+)@/, ':<REDACTED>@');
  
  console.log('Testing MongoDB connection...');
  console.log(`Connection string: ${safeUri}`);
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  });

  try {
    console.log('Attempting to connect...');
    await client.connect();
    
    console.log('✅ Successfully connected to MongoDB!');
    console.log('Server info:', await client.db().admin().serverInfo());
    
    const collections = await client.db().listCollections().toArray();
    console.log(`\nCollections (${collections.length}):`);
    collections.forEach((col, i) => console.log(`  ${i + 1}. ${col.name}`));
    
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    
    if (error.name === 'MongoServerError') {
      console.error('\nMongoDB Error Details:');
      console.error('Code:', error.code);
      console.error('Code Name:', error.codeName);
    }
    
    process.exit(1);
  } finally {
    await client.close();
    process.exit(0);
  }
}

testConnection();
