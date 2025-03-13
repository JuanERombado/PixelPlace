const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Pixel = require('../models/Pixel');
const PixelHistory = require('../models/PixelHistory');
const User = require('../models/User');
const { io } = require('../server');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pixelcanvassecret');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Get current canvas state
router.get('/', async (req, res) => {
  try {
    // Get all pixels from the database
    const pixels = await Pixel.find({}).select('x y color');
    
    // Convert to a format easier to use on the frontend
    const canvasData = {};
    pixels.forEach(pixel => {
      canvasData[`${pixel.x},${pixel.y}`] = pixel.color;
    });
    
    res.json({ canvasData });
  } catch (error) {
    console.error('Canvas fetch error:', error);
    res.status(500).json({ message: 'Server error fetching canvas' });
  }
});

// Place a pixel on the canvas
router.post('/pixel', auth, async (req, res) => {
  try {
    const { x, y, color } = req.body;
    const user = req.user;
    
    // Validate input
    if (x === undefined || y === undefined || !color) {
      return res.status(400).json({ message: 'Missing required pixel data' });
    }
    
    // Check if coordinates are within canvas bounds
    const canvasSize = process.env.CANVAS_SIZE || 1000;
    if (x < 0 || x >= canvasSize || y < 0 || y >= canvasSize) {
      return res.status(400).json({ message: 'Coordinates out of bounds' });
    }
    
    // Check if color is valid
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      return res.status(400).json({ message: 'Invalid color format' });
    }
    
    // Check if user can place a pixel (cooldown)
    if (!user.canPlacePixel()) {
      return res.status(429).json({ 
        message: 'Cooldown active', 
        cooldownEnd: user.cooldownEnd 
      });
    }
    
    // Get active user count for dynamic cooldown
    const activeUsers = await User.countDocuments({ 
      lastLogin: { $gte: new Date(Date.now() - 15 * 60 * 1000) } 
    });
    
    // Update user cooldown
    await user.updateCooldown(activeUsers);
    
    // Create or update pixel
    const pixel = await Pixel.findOneAndUpdate(
      { x, y },
      { x, y, color, placedBy: user._id, placedAt: Date.now() },
      { upsert: true, new: true }
    );
    
    // Add to pixel history
    await PixelHistory.create({
      x, 
      y, 
      color, 
      placedBy: user._id, 
      placedAt: Date.now()
    });
    
    // Broadcast update to all clients
    io.emit('pixel:update', { x, y, color });
    
    res.json({ 
      success: true, 
      pixel, 
      cooldownEnd: user.cooldownEnd,
      stackedPixels: user.stackedPixels
    });
  } catch (error) {
    console.error('Pixel placement error:', error);
    res.status(500).json({ message: 'Server error placing pixel' });
  }
});

// Get information about a specific pixel
router.get('/pixel/:x/:y', async (req, res) => {
  try {
    const { x, y } = req.params;
    
    // Find the pixel
    const pixel = await Pixel.findOne({ x, y }).populate('placedBy', 'username');
    
    if (!pixel) {
      return res.status(404).json({ message: 'Pixel not found' });
    }
    
    // Get pixel history
    const history = await PixelHistory.find({ x, y })
      .sort({ placedAt: -1 })
      .limit(10)
      .populate('placedBy', 'username');
    
    res.json({ pixel, history });
  } catch (error) {
    console.error('Pixel info error:', error);
    res.status(500).json({ message: 'Server error fetching pixel info' });
  }
});

// Get user cooldown status
router.get('/cooldown', auth, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      cooldownEnd: user.cooldownEnd,
      stackedPixels: user.stackedPixels,
      canPlace: user.canPlacePixel()
    });
  } catch (error) {
    console.error('Cooldown error:', error);
    res.status(500).json({ message: 'Server error fetching cooldown' });
  }
});

module.exports = router;
