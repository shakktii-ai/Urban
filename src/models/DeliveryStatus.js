const mongoose = require('mongoose');
const { DELIVERY_STATUS } = require('../config/constants');

const DeliveryStatusSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: Object.values(DELIVERY_STATUS),
    default: DELIVERY_STATUS.SENT,
    index: true
  },
  phone: {
    type: String,
    default: ''
  },
  errorCode: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'deliveryStatus'
});

module.exports = mongoose.models.DeliveryStatus || mongoose.model('DeliveryStatus', DeliveryStatusSchema);
