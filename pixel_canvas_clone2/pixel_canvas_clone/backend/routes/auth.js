const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with that email or username already exists' 
      });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password
    });
    
    await user.save();
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'pixelcanvassecret',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        pixelsPlaced: user.pixelsPlaced,
        cooldownEnd: user.cooldownEnd,
        stackedPixels: user.stackedPixels
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Update last login
    user.lastLogin = Date.now();
    await user.save();
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'pixelcanvassecret',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        pixelsPlaced: user.pixelsPlaced,
        cooldownEnd: user.cooldownEnd,
        stackedPixels: user.stackedPixels
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pixelcanvassecret');
    
    // Find user by id
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        pixelsPlaced: user.pixelsPlaced,
        cooldownEnd: user.cooldownEnd,
        stackedPixels: user.stackedPixels
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
});

// Get user status (cooldown, stacked pixels)
router.get('/status', async (req, res) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pixelcanvassecret');
    
    // Find user by id
    const user = await User.findById(decoded.id).select('cooldownEnd stackedPixels');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      cooldownEnd: user.cooldownEnd,
      stackedPixels: user.stackedPixels,
      canPlace: user.canPlacePixel()
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ message: 'Server error getting user status' });
  }
});

module.exports = router;
