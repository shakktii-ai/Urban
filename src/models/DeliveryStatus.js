const mongoose = require('mongoose');

const DeliveryStatusSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  },
  ticketNumber: {
    type: String,
    default: '',
    index: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  vendorName: {
    type: String,
    default: ''
  },
  citizenId: {
    type: String,
    default: ''
  },
  citizenName: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: '',
    index: true
  },
  messageType: {
    type: String,
    enum: ['TEMPLATE', 'SESSION'],
    default: 'TEMPLATE',
    index: true
  },
  apiUsed: {
    type: String,
    default: 'API 1.1'
  },
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'UNKNOWN'],
    default: 'PENDING',
    index: true
  },
  reason: {
    type: String,
    default: ''
  },
  errorCode: {
    type: String,
    default: ''
  },
  errorMessage: {
    type: String,
    default: ''
  },
  retryCount: {
    type: Number,
    default: 0
  },
  retryTime: {
    type: Date
  },
  checkedAt: {
    type: Date
  },
  requestPayload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  rawResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    remarks: { type: String, default: '' }
  }]
}, {
  timestamps: true,
  collection: 'deliveryStatus'
});

module.exports = mongoose.models.DeliveryStatus || mongoose.model('DeliveryStatus', DeliveryStatusSchema);
