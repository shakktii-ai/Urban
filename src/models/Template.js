const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
  templateName: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  category: {
    type: String,
    default: 'UTILITY'
  },
  language: {
    type: String,
    default: 'en_us'
  },
  status: {
    type: String,
    default: 'APPROVED'
  },
  bodyText: {
    type: String,
    default: ''
  },
  buttons: [{
    type: { type: String, default: 'QUICK_REPLY' },
    text: { type: String, default: '' }
  }],
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'templates'
});

module.exports = mongoose.models.Template || mongoose.model('Template', TemplateSchema);
