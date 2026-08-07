const ticketRepository = require('../repositories/TicketRepository');
const vendorRepository = require('../repositories/VendorRepository');
const wardRepository = require('../repositories/WardRepository');
const messageRepository = require('../repositories/MessageRepository');
const templateRepository = require('../repositories/TemplateRepository');
const userRepository = require('../repositories/UserRepository');
const settingRepository = require('../repositories/SettingRepository');
const auditLogRepository = require('../repositories/AuditLogRepository');
const ticketService = require('../services/ticketService');
const bagachatService = require('../services/bagachatService');

class AdminController {
  /**
   * Dashboard Overview Metrics & Statistics
   */
  async getOverviewStats(req, res) {
    try {
      const totalTickets = await ticketRepository.count({});
      const newTickets = await ticketRepository.count({ status: 'NEW' });
      const assignedTickets = await ticketRepository.count({ status: 'ASSIGNED' });
      const acceptedTickets = await ticketRepository.count({ status: 'ACCEPTED' });
      const inProgressTickets = await ticketRepository.count({ status: 'IN_PROGRESS' });
      const completedTickets = await ticketRepository.count({ status: 'COMPLETED' });
      const declinedTickets = await ticketRepository.count({ status: 'DECLINED' });
      const totalVendors = await vendorRepository.count({});
      const availableVendors = await vendorRepository.count({ status: 'AVAILABLE' });
      const totalMessages = await messageRepository.count({});

      const recentTickets = await ticketRepository.find({}, { limit: 5, sort: { createdAt: -1 } });

      return res.status(200).json({
        success: true,
        stats: {
          totalTickets,
          newTickets,
          assignedTickets,
          acceptedTickets,
          inProgressTickets,
          completedTickets,
          declinedTickets,
          totalVendors,
          availableVendors,
          totalMessages
        },
        recentTickets
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get Tickets with search, filter, and pagination
   */
  async getTickets(req, res) {
    try {
      const { status, wardName, search, page = 1, limit = 10 } = req.query;
      const filter = {};

      if (status && status !== 'ALL') filter.status = status;
      if (wardName && wardName !== 'ALL') filter.wardName = wardName;

      if (search) {
        filter.$or = [
          { ticketNumber: { $regex: search, $options: 'i' } },
          { 'citizen.phone': { $regex: search, $options: 'i' } },
          { 'citizen.name': { $regex: search, $options: 'i' } },
          { 'complaint.text': { $regex: search, $options: 'i' } },
          { areaName: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const tickets = await ticketRepository.find(filter, {
        skip,
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: 'assignedVendor'
      });

      const total = await ticketRepository.count(filter);

      return res.status(200).json({
        success: true,
        tickets,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Manual Vendor Assignment Override
   */
  async assignVendorManual(req, res) {
    try {
      const { ticketId, vendorId } = req.body;
      if (!ticketId || !vendorId) {
        return res.status(400).json({ success: false, error: 'Ticket ID and Vendor ID are required' });
      }

      const updatedTicket = await ticketService.assignVendorToTicket(ticketId, vendorId, req.user?.name || 'ADMIN');
      return res.status(200).json({ success: true, ticket: updatedTicket });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Vendors Management
   */
  async getVendors(req, res) {
    try {
      const vendors = await vendorRepository.find({}, { sort: { createdAt: -1 } });
      return res.status(200).json({ success: true, vendors });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async createVendor(req, res) {
    try {
      const { name, mobile, categories, assignedWards, assignedAreas, status } = req.body;
      const vendor = await vendorRepository.create({
        name,
        mobile,
        categories: Array.isArray(categories) ? categories : [categories],
        assignedWards: Array.isArray(assignedWards) ? assignedWards : [assignedWards],
        assignedAreas: Array.isArray(assignedAreas) ? assignedAreas : [assignedAreas],
        status: status || 'AVAILABLE'
      });

      await auditLogRepository.logAction('VENDOR_CREATED', 'Vendors', req.user?.name || 'ADMIN', { name, mobile });
      return res.status(201).json({ success: true, vendor });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Wards & Areas Management
   */
  async getWards(req, res) {
    try {
      const wards = await wardRepository.find({}, { sort: { wardName: 1 } });
      return res.status(200).json({ success: true, wards });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async createWard(req, res) {
    try {
      const { wardName, areas } = req.body;
      const ward = await wardRepository.create({
        wardName,
        areas: Array.isArray(areas) ? areas : areas.split(',').map(a => a.trim())
      });

      await auditLogRepository.logAction('WARD_CREATED', 'Areas', req.user?.name || 'ADMIN', { wardName });
      return res.status(201).json({ success: true, ward });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * WhatsApp Messages Feed
   */
  async getMessages(req, res) {
    try {
      const { limit = 50 } = req.query;
      const messages = await messageRepository.find({}, { limit: parseInt(limit), sort: { timestamp: -1 } });
      return res.status(200).json({ success: true, messages });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Templates Management & API 5 Sync
   */
  async getTemplates(req, res) {
    try {
      const templates = await templateRepository.find({}, { sort: { templateName: 1 } });
      return res.status(200).json({ success: true, templates });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async syncTemplates(req, res) {
    try {
      const result = await bagachatService.syncApprovedTemplates();
      return res.status(200).json({ success: true, result });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Users Management (RBAC)
   */
  async getUsers(req, res) {
    try {
      const users = await userRepository.find({}, { select: '-password', sort: { createdAt: -1 } });
      return res.status(200).json({ success: true, users });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async createUser(req, res) {
    try {
      const { name, email, password, role } = req.body;
      const user = await userRepository.create({ name, email, password, role });
      await auditLogRepository.logAction('USER_CREATED', 'Users', req.user?.name || 'ADMIN', { email, role });
      return res.status(201).json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Settings
   */
  async getSettings(req, res) {
    try {
      const settings = await settingRepository.getSettings();
      return res.status(200).json({ success: true, settings });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateSettings(req, res) {
    try {
      const settings = await settingRepository.getSettings();
      const updated = await settingRepository.updateById(settings._id, req.body);
      return res.status(200).json({ success: true, settings: updated });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Audit Logs
   */
  async getAuditLogs(req, res) {
    try {
      const logs = await auditLogRepository.find({}, { limit: 100, sort: { timestamp: -1 } });
      return res.status(200).json({ success: true, logs });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AdminController();
