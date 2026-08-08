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

    // Step 3: Create ticket record via Repository
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

    const settings = await settingRepository.getSettings();

    // Step 4 & 6: Automatically trigger multi-vendor broadcast after ticket creation
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
   * Step 5 & 6: Send BagAChat API 1.1 Template Message to ALL matching available vendors simultaneously using Promise.all()
   */
  async broadcastTicketToAllVendors(ticketId) {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) {
      console.error(`❌ [TicketService] broadcastTicketToAllVendors failed: Ticket ${ticketId} not found.`);
      return;
    }

    console.log(`📡 [TicketService] Starting multi-vendor broadcast for Ticket ${ticket.ticketNumber}...`);
    console.log(`   Category: "${ticket.complaint.category}", Ward: "${ticket.wardName}", Area: "${ticket.areaName}"`);

    // Step 5: Execute autoAssignService.findMatchingVendors using VendorRepository.find()
    const matchingVendors = await autoAssignService.findMatchingVendors(
      ticket.complaint.category,
      ticket.areaName,
      ticket.wardName
    );

    // Step 12: If NO vendor exists -> Keep status UNASSIGNED/NEW and generate Dashboard Alert
    if (!matchingVendors || matchingVendors.length === 0) {
      console.error(`❌ No matching vendors found for Ward ${ticket.wardName} / Area ${ticket.areaName}.`);
      ticket.status = TICKET_STATUS.NEW;
      await ticket.save();

      sseManager.broadcast('NO_VENDORS_AVAILABLE', {
        ticketNumber: ticket.ticketNumber,
        category: ticket.complaint.category,
        wardName: ticket.wardName,
        areaName: ticket.areaName,
        alertMessage: `No vendor available for Ward ${ticket.wardName} / Area ${ticket.areaName}`,
        timestamp: new Date()
      });
      return;
    }

    console.log(`📢 [TicketService] Broadcasting Ticket ${ticket.ticketNumber} to ALL ${matchingVendors.length} matching vendors via BagAChat API 1.1...`);

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

    // Step 6: Dispatch BagAChat API 1.1 Template Message to EVERY matching vendor simultaneously using Promise.all()
    const broadcastResults = await Promise.all(
      matchingVendors.map(async (vendor) => {
        const vendorMobile = vendor.mobile || vendor.phone;
        if (!vendorMobile) {
          console.error(`⚠️ [TicketService] Vendor ${vendor.name} has no valid mobile number.`);
          return { vendorId: vendor._id, success: false };
        }

        console.log(`🚀 [TicketService] Dispatching API 1.1 Template Message to Vendor: ${vendor.name} (${vendorMobile})`);

        const result = await bagachatService.sendTemplateMessage(
          vendorMobile,
          'state_vendor_alert1',
          templateParams,
          `New Complaint Assignment (${ticket.ticketNumber})`,
          ticket.ticketNumber,
          {
            ticketId: ticket._id,
            ticketNumber: ticket.ticketNumber,
            vendorId: vendor._id,
            vendorName: vendor.name,
            citizenName: ticket.citizen.name,
            citizenId: ticket.citizen.phone
          }
        );

        // Step 7: Store broadcast information in MongoDB
        await auditLogRepository.logAction('VENDOR_TEMPLATE_SENT', 'Tickets', `VENDOR_${vendorMobile}`, {
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          vendorId: vendor._id,
          vendorName: vendor.name,
          messageId: result.messageId,
          status: result.success ? 'PENDING' : 'FAILED',
          broadcastTime: new Date()
        });

        return { vendorId: vendor._id, vendorName: vendor.name, ...result };
      })
    );

    console.log(`✅ [TicketService] Multi-Vendor Broadcast complete for Ticket ${ticket.ticketNumber}. Results:`, broadcastResults);

    await auditLogRepository.logAction('MULTI_VENDOR_BROADCAST', 'Tickets', 'SYSTEM', {
      ticketNumber: ticket.ticketNumber,
      vendorCount: matchingVendors.length,
      broadcastResults
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
      vendor.mobile || vendor.phone,
      'state_vendor_alert1',
      templateParams,
      `New Complaint Assignment (${ticket.ticketNumber})`,
      ticket.ticketNumber,
      {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        vendorId: vendor._id,
        vendorName: vendor.name,
        citizenName: ticket.citizen.name,
        citizenId: ticket.citizen.phone
      }
    );

    return ticket;
  }

  /**
   * Step 8 & 10: First Vendor Accept Atomic Lock & Rejection of Late Accepts
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

    // Step 8: Atomic Lock Attempt for FIRST Vendor to Accept
    const updatedTicket = await ticketRepository.atomicAcceptTicket(ticket._id, vendor._id, vendor.name);

    // Step 10: If atomic lock failed (another vendor accepted first), send API 1.2 Session Care Message to Vendor B
    if (!updatedTicket) {
      await bagachatService.sendSessionMessage(
        vendorMobile,
        `This complaint (${ticket.ticketNumber}) has already been accepted by another vendor. Thank you!`,
        ticket.ticketNumber,
        {
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          vendorId: vendor._id,
          vendorName: vendor.name
        }
      );
      return null;
    }

    await vendorRepository.incrementActiveTickets(vendor._id);

    // Step 9: Send WhatsApp 24-hr session message (BagAChat API 1.2) to Citizen
    const citizenNotice = `Your complaint ${ticket.ticketNumber} has been accepted.\n` +
      `Vendor: ${vendor.name}\n` +
      `Mobile: ${vendor.mobile || vendor.phone}\n` +
      `Expected Visit: Within 1 Hour.`;

    await bagachatService.sendSessionMessage(
      ticket.citizen.phone,
      citizenNotice,
      ticket.ticketNumber,
      {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        citizenName: ticket.citizen.name,
        citizenId: ticket.citizen.phone,
        vendorId: vendor._id,
        vendorName: vendor.name
      }
    );

    await auditLogRepository.logAction('VENDOR_ACCEPTED', 'Tickets', `VENDOR_${vendor.mobile}`, { ticketNumber: ticket.ticketNumber });

    sseManager.broadcast('VENDOR_ACCEPTED', {
      ticketNumber: ticket.ticketNumber,
      vendorName: vendor.name,
      timestamp: new Date()
    });

    return updatedTicket;
  }

  /**
   * Step 11: If Vendor declines -> Automatically send to NEXT available vendor
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
      remarks: `Vendor ${vendor?.name || ''} declined assignment. Auto-retrying next vendor.`,
      timestamp: new Date()
    });

    await ticket.save();

    await auditLogRepository.logAction('VENDOR_DECLINED', 'Tickets', `VENDOR_${vendor?.mobile}`, { ticketNumber: ticket.ticketNumber });

    sseManager.broadcast('VENDOR_DECLINED', {
      ticketNumber: ticket.ticketNumber,
      vendorName: vendor?.name || 'Vendor',
      timestamp: new Date()
    });

    // Step 11: Automatically retry next available vendor
    const remainingVendors = await autoAssignService.findMatchingVendors(
      ticket.complaint.category,
      ticket.areaName,
      ticket.wardName
    );

    const nextVendor = remainingVendors.find(v => (v.mobile || v.phone) !== vendorMobile);

    if (nextVendor) {
      const templateParams = [
        ticket.ticketNumber,
        `${ticket.wardName} - ${ticket.areaName}`,
        ticket.complaint.text,
        ticket.citizen.name
      ];
      await bagachatService.sendTemplateMessage(
        nextVendor.mobile || nextVendor.phone,
        'state_vendor_alert1',
        templateParams,
        `New Complaint Assignment (${ticket.ticketNumber})`,
        ticket.ticketNumber,
        {
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          vendorId: nextVendor._id,
          vendorName: nextVendor.name,
          citizenName: ticket.citizen.name,
          citizenId: ticket.citizen.phone
        }
      );
    } else {
      ticket.status = TICKET_STATUS.NEW;
      await ticket.save();

      sseManager.broadcast('NO_VENDORS_AVAILABLE', {
        ticketNumber: ticket.ticketNumber,
        category: ticket.complaint.category,
        wardName: ticket.wardName,
        areaName: ticket.areaName,
        alertMessage: `No remaining vendor available for Ward ${ticket.wardName} / Area ${ticket.areaName}`,
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
    await bagachatService.sendSessionMessage(
      ticket.citizen.phone,
      citizenNotice,
      ticket.ticketNumber,
      {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        citizenName: ticket.citizen.name,
        citizenId: ticket.citizen.phone
      }
    );

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
