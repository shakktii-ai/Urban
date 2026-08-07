const mongoose = require('mongoose');
const { TICKET_STATUS, TICKET_PRIORITY } = require('../config/constants');

const TimelineEntrySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: Object.values(TICKET_STATUS),
    required: true
  },
  updatedBy: {
    type: String,
    default: 'SYSTEM'
  },
  remarks: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const AuditEntrySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  performedBy: {
    type: String,
    default: 'SYSTEM'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const TicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  citizen: {
    name: { type: String, default: 'Citizen' },
    phone: { type: String, required: true, index: true }
  },
  areaName: {
    type: String,
    default: 'Unassigned Area'
  },
  wardName: {
    type: String,
    default: 'Unassigned Ward'
  },
  complaint: {
    text: { type: String, required: true },
    category: { type: String, required: true, default: 'General' },
    mediaUrl: { type: String, default: '' },
    mediaType: { type: String, default: '' }
  },
  assignedVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null
  },
  priority: {
    type: String,
    enum: Object.values(TICKET_PRIORITY),
    default: TICKET_PRIORITY.MEDIUM
  },
  status: {
    type: String,
    enum: Object.values(TICKET_STATUS),
    default: TICKET_STATUS.NEW,
    index: true
  },
  expectedVisit: {
    type: Date,
    default: null
  },
  resolutionPhoto: {
    type: String,
    default: ''
  },
  timeline: [TimelineEntrySchema],
  audit: [AuditEntrySchema]
}, {
  timestamps: true,
  collection: 'tickets'
});

module.exports = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
