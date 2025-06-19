const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  phone: String,
  avatar: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  try {
    console.log('Running pre-save hook for user:', this.email);
    
    // Only run this function if password was modified (or is new)
    if (!this.isModified('password')) {
      console.log('Password not modified, skipping hashing');
      return next();
    }

    console.log('Hashing password for user:', this.email);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    
    next();
  } catch (error) {
    console.error('Error in pre-save hook:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    next(error);
  }
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  try {
    console.log('Generating JWT for user:', this.email);
    const token = jwt.sign(
      { id: this._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
    console.log('JWT generated successfully');
    return token;
  } catch (error) {
    console.error('Error generating JWT:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    console.log('Matching password for user:', this.email);
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log('Password match result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error matching password:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Check if email is taken
userSchema.statics.isEmailTaken = async function(email) {
  const user = await this.findOne({ email });
  return !!user;
};

// Static method to get user by ID
userSchema.statics.findById = async function(id) {
  return this.findOne({ _id: id });
};

// Static method to find user by ID and update
userSchema.statics.findByIdAndUpdate = async function(id, update, options = {}) {
  return this.findOneAndUpdate(
    { _id: id },
    { ...update, updatedAt: Date.now() },
    { new: true, runValidators: true, ...options }
  );
};

// Static method to find user by ID and delete
userSchema.statics.findByIdAndDelete = async function(id) {
  return this.findOneAndDelete({ _id: id });
};

// Static method to get all users with pagination
userSchema.statics.find = async function(query = {}, options = {}) {
  const { select, sort, skip, limit } = options;
  
  let queryBuilder = this.find(query);
  
  if (select) {
    queryBuilder = queryBuilder.select(select);
  }
  
  if (sort) {
    queryBuilder = queryBuilder.sort(sort);
  }
  
  if (skip) {
    queryBuilder = queryBuilder.skip(skip);
  }
  
  if (limit) {
    queryBuilder = queryBuilder.limit(limit);
  }
  
  return queryBuilder;
};

// Check if email is taken
userSchema.statics.isEmailTaken = async function(email) {
  try {
    console.log('Checking if email is taken:', email);
    const user = await this.findOne({ email });
    const isTaken = !!user;
    console.log('Email taken check result:', isTaken);
    return isTaken;
  } catch (error) {
    console.error('Error checking if email is taken:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = mongoose.model('User', userSchema);
