const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  offsetX: {
    type: Number,
    default: 0
  },
  offsetY: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying by user
TemplateSchema.index({ createdBy: 1 });
// Index for efficient querying by public status
TemplateSchema.index({ isPublic: 1 });

module.exports = mongoose.model('Template', TemplateSchema);
