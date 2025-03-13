const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Template = require('../models/Template');
const User = require('../models/User');

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

// Get all public templates
router.get('/', async (req, res) => {
  try {
    const templates = await Template.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username')
      .limit(50);
    
    res.json({ templates });
  } catch (error) {
    console.error('Templates fetch error:', error);
    res.status(500).json({ message: 'Server error fetching templates' });
  }
});

// Get user's templates
router.get('/my', auth, async (req, res) => {
  try {
    const templates = await Template.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username');
    
    res.json({ templates });
  } catch (error) {
    console.error('User templates fetch error:', error);
    res.status(500).json({ message: 'Server error fetching user templates' });
  }
});

// Create a new template
router.post('/', auth, async (req, res) => {
  try {
    const { title, imageUrl, isPublic, offsetX, offsetY } = req.body;
    
    // Validate input
    if (!title || !imageUrl) {
      return res.status(400).json({ message: 'Title and image URL are required' });
    }
    
    // Create template
    const template = new Template({
      title,
      imageUrl,
      createdBy: req.user._id,
      isPublic: isPublic !== undefined ? isPublic : true,
      offsetX: offsetX || 0,
      offsetY: offsetY || 0
    });
    
    await template.save();
    
    res.status(201).json({ template });
  } catch (error) {
    console.error('Template creation error:', error);
    res.status(500).json({ message: 'Server error creating template' });
  }
});

// Get a specific template
router.get('/:id', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id)
      .populate('createdBy', 'username');
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json({ template });
  } catch (error) {
    console.error('Template fetch error:', error);
    res.status(500).json({ message: 'Server error fetching template' });
  }
});

// Update a template
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, imageUrl, isPublic, offsetX, offsetY } = req.body;
    
    // Find template
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Check ownership
    if (template.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this template' });
    }
    
    // Update fields
    if (title) template.title = title;
    if (imageUrl) template.imageUrl = imageUrl;
    if (isPublic !== undefined) template.isPublic = isPublic;
    if (offsetX !== undefined) template.offsetX = offsetX;
    if (offsetY !== undefined) template.offsetY = offsetY;
    
    await template.save();
    
    res.json({ template });
  } catch (error) {
    console.error('Template update error:', error);
    res.status(500).json({ message: 'Server error updating template' });
  }
});

// Delete a template
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find template
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Check ownership
    if (template.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this template' });
    }
    
    await template.remove();
    
    res.json({ message: 'Template deleted' });
  } catch (error) {
    console.error('Template deletion error:', error);
    res.status(500).json({ message: 'Server error deleting template' });
  }
});

module.exports = router;
