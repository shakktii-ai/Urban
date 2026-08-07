const mongoose = require('mongoose');
const { MESSAGE_DIRECTION, DELIVERY_STATUS } = require('../config/constants');

const MessageSchema = new mongoose.Schema({
  direction: {
    type: String,
    enum: Object.values(MESSAGE_DIRECTION),
    required: true,
    index: true
  },
  phone: {
    type: String,
    required: true,
    index: true
  },
  message: {
    type: String,
    default: ''
  },
  mediaUrl: {
    type: String,
    default: ''
  },
  mediaType: {
    type: String,
    default: ''
  },
  templateName: {
    type: String,
    default: ''
  },
  deliveryStatus: {
    type: String,
    enum: Object.values(DELIVERY_STATUS),
    default: DELIVERY_STATUS.SENT,
    index: true
  },
  messageId: {
    type: String,
    default: '',
    index: true
  },
  ticketNumber: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'messages'
});

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);
