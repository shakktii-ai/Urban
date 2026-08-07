const mongoose = require('mongoose');
const { VENDOR_STATUS } = require('../config/constants');

const VendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  categories: [{
    type: String,
    required: true
  }],
  assignedWards: [{
    type: String,
    required: true
  }],
  assignedAreas: [{
    type: String,
    required: true
  }],
  status: {
    type: String,
    enum: Object.values(VENDOR_STATUS),
    default: VENDOR_STATUS.AVAILABLE,
    index: true
  },
  activeTicketCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 5.0
  }
}, {
  timestamps: true,
  collection: 'vendors'
});

module.exports = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);
