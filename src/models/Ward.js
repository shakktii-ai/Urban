const mongoose = require('mongoose');

const WardSchema = new mongoose.Schema({
  wardName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  areas: [{
    type: String,
    required: true,
    trim: true
  }]
}, {
  timestamps: true,
  collection: 'wards'
});

module.exports = mongoose.models.Ward || mongoose.model('Ward', WardSchema);
