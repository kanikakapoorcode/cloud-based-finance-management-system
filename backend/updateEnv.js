const fs = require('fs');
const path = require('path');

// MongoDB Atlas connection string (replace with your actual connection string)
const mongodbUri = 'mongodb+srv://username:password@cluster0.mongodb.net/finance-manager?retryWrites=true&w=majority';

const envPath = path.join(__dirname, '.env');
let envContent = '';

// Read existing .env file if it exists
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (err) {
  console.log('Creating new .env file...');
}

// Update or add MONGODB_URI
if (envContent.includes('MONGODB_URI=')) {
  envContent = envContent.replace(
    /MONGODB_URI=.*/,
    `MONGODB_URI=${mongodbUri}`
  );
} else {
  envContent += `\nMONGODB_URI=${mongodbUri}\n`;
}

// Ensure other required variables exist
const requiredVars = {
  JWT_SECRET: 'your_jwt_secret_key_here_change_this_in_production',
  JWT_EXPIRE: '30d',
  JWT_COOKIE_EXPIRE: '30',
  NODE_ENV: 'development',
  PORT: '5001'
};

Object.entries(requiredVars).forEach(([key, defaultValue]) => {
  if (!envContent.includes(`${key}=`)) {
    envContent += `${key}=${defaultValue}\n`;
  }
});

// Write back to .env file
try {
  fs.writeFileSync(envPath, envContent.trim() + '\n');
  console.log('Successfully updated .env file');
} catch (err) {
  console.error('Error writing .env file:', err);
}
