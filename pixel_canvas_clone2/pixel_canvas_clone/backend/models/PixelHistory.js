const mongoose = require('mongoose');

const PixelHistorySchema = new mongoose.Schema({
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

// Index for efficient querying by coordinates
PixelHistorySchema.index({ x: 1, y: 1 });
// Index for efficient querying by user
PixelHistorySchema.index({ placedBy: 1 });
// Index for efficient querying by time
PixelHistorySchema.index({ placedAt: 1 });

module.exports = mongoose.model('PixelHistory', PixelHistorySchema);
