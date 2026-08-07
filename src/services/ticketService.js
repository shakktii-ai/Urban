const ticketRepository = require('../repositories/TicketRepository');
const vendorRepository = require('../repositories/VendorRepository');
const settingRepository = require('../repositories/SettingRepository');
const auditLogRepository = require('../repositories/AuditLogRepository');
const autoAssignService = require('./autoAssignService');
const bagachatService = require('./bagachatService');
const sseManager = require('../utils/sseManager');
const { generateNextTicketNumber } = require('../utils/ticketGenerator');
const { TICKET_STATUS } = require('../config/constants');

class TicketService {
  /**
   * Process completed citizen complaint session & create ticket with Multi-Vendor Broadcast
   */
  async processIncomingComplaint({ phone, name, messageText, mediaUrl, mediaType, areaName, wardName, category }) {
    const ticketNumber = await generateNextTicketNumber();

    const finalCategory = category || autoAssignService.detectCategory(messageText);
    const finalArea = areaName || 'Unassigned Area';
    const finalWard = wardName || 'Unassigned Ward';

    const initialTimeline = [{
      status: TICKET_STATUS.NEW,
      updatedBy: 'SYSTEM',
      remarks: 'Complaint registered via WhatsApp Conversational Flow',
      timestamp: new Date()
    }];

    const initialAudit = [{
      action: 'TICKET_CREATED',
      performedBy: 'SYSTEM',
      details: { phone, category: finalCategory, areaName: finalArea, wardName: finalWard },
      timestamp: new Date()
    }];

    // Create ticket record via Repository
    const ticket = await ticketRepository.create({
      ticketNumber,
      citizen: { name: name || 'Citizen', phone },
      areaName: finalArea,
      wardName: finalWard,
      complaint: {
        text: messageText,
        category: finalCategory,
        mediaUrl: mediaUrl || '',
        mediaType: mediaType || ''
      },
      status: TICKET_STATUS.NEW,
      timeline: initialTimeline,
      audit: initialAudit
    });

    // Feature 2: Multi-Vendor Broadcast to ALL matching available vendors
    if (settings?.autoAssignEnabled !== false) {
      await this.broadcastTicketToAllVendors(ticket._id);
    }

    await auditLogRepository.logAction('TICKET_CREATED', 'Tickets', 'SYSTEM', { ticketNumber, category: finalCategory, wardName: finalWard });

    sseManager.broadcast('NEW_COMPLAINT', {
      ticketNumber,
      category: finalCategory,
      wardName: finalWard,
      areaName: finalArea,
      citizenPhone: phone,
      timestamp: new Date()
    });

    return { ticket };
  }

  /**
   * Feature 2: Send BagAChat API 1.1 Template Message to ALL matching available vendors simultaneously
   */
  async broadcastTicketToAllVendors(ticketId) {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) return;

    const matchingVendors = await vendorRepository.findAllAvailableVendors(
      ticket.complaint.category,
      ticket.areaName,
      ticket.wardName
    );

    if (!matchingVendors || matchingVendors.length === 0) {
      ticket.status = TICKET_STATUS.NEW;
      await ticket.save();

      sseManager.broadcast('NO_VENDORS_AVAILABLE', {
        ticketNumber: ticket.ticketNumber,
        category: ticket.complaint.category,
        wardName: ticket.wardName,
        timestamp: new Date()
      });
      return;
    }

    ticket.status = TICKET_STATUS.ASSIGNED;
    ticket.timeline.push({
      status: TICKET_STATUS.ASSIGNED,
      updatedBy: 'AUTO_ASSIGN_ENGINE',
      remarks: `Broadcasted to ${matchingVendors.length} matching vendors on WhatsApp`,
      timestamp: new Date()
    });
    await ticket.save();

    const templateParams = [
      ticket.ticketNumber,
      `${ticket.wardName} - ${ticket.areaName}`,
      ticket.complaint.text,
      ticket.citizen.name
    ];

    // Dispatch BagAChat API 1.1 Template Message to EVERY matching vendor simultaneously
    for (const vendor of matchingVendors) {
      await bagachatService.sendTemplateMessage(
        vendor.mobile,
        'state_vendor_alert1',
        templateParams,
        `New Complaint Assignment (${ticket.ticketNumber})`,
        ticket.ticketNumber
      );
    }

    await auditLogRepository.logAction('MULTI_VENDOR_BROADCAST', 'Tickets', 'SYSTEM', {
      ticketNumber: ticket.ticketNumber,
      vendorCount: matchingVendors.length
    });
  }

  /**
   * Manual Single Vendor Assignment Override
   */
  async assignVendorToTicket(ticketId, vendorId, assignedBy = 'ADMIN') {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    const vendor = await vendorRepository.findById(vendorId);
    if (!vendor) throw new Error('Vendor not found');

    ticket.assignedVendor = vendor._id;
    ticket.status = TICKET_STATUS.ASSIGNED;
    ticket.timeline.push({
      status: TICKET_STATUS.ASSIGNED,
      updatedBy: assignedBy,
      remarks: `Assigned manually to Vendor ${vendor.name} (${vendor.mobile})`,
      timestamp: new Date()
    });

    await ticket.save();
    await vendorRepository.incrementActiveTickets(vendor._id);

    const templateParams = [
      ticket.ticketNumber,
      `${ticket.wardName} - ${ticket.areaName}`,
      ticket.complaint.text,
      ticket.citizen.name
    ];

    await bagachatService.sendTemplateMessage(
      vendor.mobile,
      'state_vendor_alert1',
      templateParams,
      `New Complaint Assignment (${ticket.ticketNumber})`,
      ticket.ticketNumber
    );

    return ticket;
  }

  /**
   * Feature 3: First Vendor Accept Atomic Lock & Rejection of Late Accepts
   */
  async handleVendorAccept(vendorMobile, ticketNumber = '') {
    const vendor = await vendorRepository.findByMobile(vendorMobile);
    if (!vendor) return null;

    let ticket = null;
    if (ticketNumber) {
      ticket = await ticketRepository.findByTicketNumber(ticketNumber);
    } else {
      const tickets = await ticketRepository.find({
        status: { $in: [TICKET_STATUS.ASSIGNED, TICKET_STATUS.NEW] }
      }, { limit: 1, sort: { updatedAt: -1 } });
      ticket = tickets[0];
    }

    if (!ticket) return null;

    // Feature 3: Atomic Lock Attempt
    const updatedTicket = await ticketRepository.atomicAcceptTicket(ticket._id, vendor._id, vendor.name);

    // If atomic lock failed (another vendor already accepted first)
    if (!updatedTicket) {
      await bagachatService.sendSessionMessage(
        vendorMobile,
        `This complaint (${ticket.ticketNumber}) has already been accepted by another vendor. Thank you!`,
        ticket.ticketNumber
      );
      return null;
    }

    await vendorRepository.incrementActiveTickets(vendor._id);

    // Step 9: Send WhatsApp 24-hr session message (BagAChat API 1.2) to Citizen
    const citizenNotice = `Your complaint ${ticket.ticketNumber} has been accepted.\n` +
      `Vendor: ${vendor.name}\n` +
      `Mobile: ${vendor.mobile}\n` +
      `Expected Visit: Within 1 Hour.`;

    await bagachatService.sendSessionMessage(ticket.citizen.phone, citizenNotice, ticket.ticketNumber);

    await auditLogRepository.logAction('VENDOR_ACCEPTED', 'Tickets', `VENDOR_${vendor.mobile}`, { ticketNumber: ticket.ticketNumber });

    sseManager.broadcast('VENDOR_ACCEPTED', {
      ticketNumber: ticket.ticketNumber,
      vendorName: vendor.name,
      timestamp: new Date()
    });

    return updatedTicket;
  }

  /**
   * Feature 4: Automatic Vendor Retry on Decline
   */
  async handleVendorDecline(vendorMobile, ticketNumber = '') {
    const vendor = await vendorRepository.findByMobile(vendorMobile);

    let ticket = null;
    if (ticketNumber) {
      ticket = await ticketRepository.findByTicketNumber(ticketNumber);
    } else {
      const tickets = await ticketRepository.find({
        status: TICKET_STATUS.ASSIGNED
      }, { limit: 1, sort: { updatedAt: -1 } });
      ticket = tickets[0];
    }

    if (!ticket) return null;

    ticket.timeline.push({
      status: TICKET_STATUS.DECLINED,
      updatedBy: `VENDOR_${vendor?.name || 'WHATSAPP'}`,
      remarks: `Vendor ${vendor?.name || ''} declined assignment. Triggering auto retry loop.`,
      timestamp: new Date()
    });

    await ticket.save();

    await auditLogRepository.logAction('VENDOR_DECLINED', 'Tickets', `VENDOR_${vendor?.mobile}`, { ticketNumber: ticket.ticketNumber });

    sseManager.broadcast('VENDOR_DECLINED', {
      ticketNumber: ticket.ticketNumber,
      vendorName: vendor?.name || 'Vendor',
      timestamp: new Date()
    });

    // Feature 4: Auto Retry next available vendor
    const remainingVendors = await vendorRepository.findAllAvailableVendors(
      ticket.complaint.category,
      ticket.areaName,
      ticket.wardName
    );

    const nextVendor = remainingVendors.find(v => v.mobile !== vendorMobile);

    if (nextVendor) {
      const templateParams = [
        ticket.ticketNumber,
        `${ticket.wardName} - ${ticket.areaName}`,
        ticket.complaint.text,
        ticket.citizen.name
      ];
      await bagachatService.sendTemplateMessage(
        nextVendor.mobile,
        'state_vendor_alert1',
        templateParams,
        `New Complaint Assignment (${ticket.ticketNumber})`,
        ticket.ticketNumber
      );
    } else {
      ticket.status = TICKET_STATUS.NEW;
      await ticket.save();

      sseManager.broadcast('NO_VENDORS_AVAILABLE', {
        ticketNumber: ticket.ticketNumber,
        category: ticket.complaint.category,
        wardName: ticket.wardName,
        timestamp: new Date()
      });
    }

    return ticket;
  }

  /**
   * Handle Vendor Resolution & Completion
   */
  async handleVendorCompletion(vendorMobile, resolutionText = '', resolutionPhoto = '', ticketNumber = '') {
    const vendor = await vendorRepository.findByMobile(vendorMobile);

    let ticket = null;
    if (ticketNumber) {
      ticket = await ticketRepository.findByTicketNumber(ticketNumber);
    } else if (vendor) {
      const tickets = await ticketRepository.find({
        assignedVendor: vendor._id,
        status: { $in: [TICKET_STATUS.ACCEPTED, TICKET_STATUS.IN_PROGRESS, TICKET_STATUS.ASSIGNED] }
      }, { limit: 1, sort: { updatedAt: -1 } });
      ticket = tickets[0];
    }

    if (!ticket) return null;

    ticket.status = TICKET_STATUS.COMPLETED;
    if (resolutionPhoto) ticket.resolutionPhoto = resolutionPhoto;
    ticket.timeline.push({
      status: TICKET_STATUS.COMPLETED,
      updatedBy: `VENDOR_${vendor?.name || 'WHATSAPP'}`,
      remarks: resolutionText || 'Complaint marked resolved by vendor',
      timestamp: new Date()
    });

    await ticket.save();

    if (vendor) {
      await vendorRepository.decrementActiveTickets(vendor._id);
    }

    const citizenNotice = `Your complaint ${ticket.ticketNumber} has been resolved.\nThank You!`;
    await bagachatService.sendSessionMessage(ticket.citizen.phone, citizenNotice, ticket.ticketNumber);

    await auditLogRepository.logAction('TICKET_COMPLETED', 'Tickets', `VENDOR_${vendor?.mobile}`, { ticketNumber: ticket.ticketNumber });

    sseManager.broadcast('COMPLETED', {
      ticketNumber: ticket.ticketNumber,
      vendorName: vendor?.name || 'Vendor',
      timestamp: new Date()
    });

    return ticket;
  }
}

module.exports = new TicketService();
