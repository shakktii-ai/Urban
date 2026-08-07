const mongoose = require('mongoose');

const ConversationSessionSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  currentStep: {
    type: String,
    enum: ['CATEGORY', 'AREA', 'WARD', 'PHOTO', 'CONFIRM'],
    default: 'CATEGORY'
  },
  complaintCategory: {
    type: String,
    default: ''
  },
  complaintText: {
    type: String,
    default: ''
  },
  areaName: {
    type: String,
    default: ''
  },
  wardName: {
    type: String,
    default: ''
  },
  photoUrl: {
    type: String,
    default: ''
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000) // 30 mins TTL
  }
}, {
  timestamps: true,
  collection: 'conversationSessions'
});

module.exports = mongoose.models.ConversationSession || mongoose.model('ConversationSession', ConversationSessionSchema);
