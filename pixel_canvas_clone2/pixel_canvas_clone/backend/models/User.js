const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  pixelsPlaced: {
    type: Number,
    default: 0
  },
  cooldownEnd: {
    type: Date,
    default: Date.now
  },
  stackedPixels: {
    type: Number,
    default: 0,
    max: 6
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user can place a pixel
UserSchema.methods.canPlacePixel = function() {
  return Date.now() >= this.cooldownEnd || this.stackedPixels > 0;
};

// Method to update cooldown after placing a pixel
UserSchema.methods.updateCooldown = function(activeUsers) {
  // Base cooldown time in milliseconds (30 seconds)
  const baseCooldown = 30000;
  
  // Adjust cooldown based on active users (more users = longer cooldown)
  const adjustedCooldown = baseCooldown * (1 + (activeUsers / 100));
  
  if (this.stackedPixels > 0) {
    // Use a stacked pixel if available
    this.stackedPixels -= 1;
  } else {
    // Set cooldown end time
    this.cooldownEnd = new Date(Date.now() + adjustedCooldown);
  }
  
  // Increment pixels placed counter
  this.pixelsPlaced += 1;
  
  return this.save();
};

module.exports = mongoose.model('User', UserSchema);
