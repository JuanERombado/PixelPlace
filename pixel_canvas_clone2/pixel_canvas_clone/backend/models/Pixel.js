const mongoose = require('mongoose');

const PixelSchema = new mongoose.Schema({
  x: {
    type: Number,
    required: true,
    min: 0
  },
  y: {
    type: Number,
    required: true,
    min: 0
  },
  color: {
    type: String,
    required: true,
    match: /^#[0-9A-F]{6}$/i  // Hex color format
  },
  placedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  placedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure uniqueness of x,y coordinates
PixelSchema.index({ x: 1, y: 1 }, { unique: true });

module.exports = mongoose.model('Pixel', PixelSchema);
