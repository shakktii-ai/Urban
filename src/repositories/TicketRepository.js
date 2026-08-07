const BaseRepository = require('./BaseRepository');
const Ticket = require('../models/Ticket');

class TicketRepository extends BaseRepository {
  constructor() {
    super(Ticket);
  }

  async findByTicketNumber(ticketNumber) {
    return await this.findOne({ ticketNumber }, 'assignedVendor');
  }

  /**
   * Feature 3: Atomic Lock for First Vendor Accept
   * Uses findOneAndUpdate with status check to prevent duplicate assignments
   */
  async atomicAcceptTicket(ticketId, vendorId, vendorName) {
    return await this.model.findOneAndUpdate(
      {
        _id: ticketId,
        status: { $in: ['ASSIGNED', 'NEW'] }
      },
      {
        $set: {
          status: 'ACCEPTED',
          assignedVendor: vendorId,
          expectedVisit: new Date(Date.now() + 60 * 60 * 1000)
        },
        $push: {
          timeline: {
            status: 'ACCEPTED',
            updatedBy: `VENDOR_${vendorName}`,
            remarks: `Vendor ${vendorName} accepted assignment (Atomic First-to-Accept Lock)`,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );
  }

  async findActiveByCitizenPhone(phone) {
    return await this.findOne({
      'citizen.phone': phone,
      status: { $nin: ['COMPLETED', 'CLOSED', 'CANCELLED'] }
    }).sort({ createdAt: -1 });
  }

  async addTimelineEntry(ticketId, status, updatedBy, remarks) {
    return await this.model.findByIdAndUpdate(
      ticketId,
      {
        $set: { status },
        $push: {
          timeline: {
            status,
            updatedBy: updatedBy || 'SYSTEM',
            remarks: remarks || '',
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );
  }

  async addAuditEntry(ticketId, action, performedBy, details) {
    return await this.model.findByIdAndUpdate(
      ticketId,
      {
        $push: {
          audit: {
            action,
            performedBy: performedBy || 'SYSTEM',
            details: details || {},
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );
  }
}

module.exports = new TicketRepository();
