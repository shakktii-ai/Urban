const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  autoAssignEnabled: {
    type: Boolean,
    default: true
  },
  autoCategoryDetection: {
    type: Boolean,
    default: true
  },
  defaultVendorTimeoutMinutes: {
    type: Number,
    default: 30
  },
  systemNotificationEmail: {
    type: String,
    default: 'admin@municipal.gov.in'
  }
}, {
  timestamps: true,
  collection: 'settings'
});

module.exports = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
