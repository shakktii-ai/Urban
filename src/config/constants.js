/**
 * Ticket Status Workflow Enums
 */
const TICKET_STATUS = {
  NEW: 'NEW',
  ASSIGNED: 'ASSIGNED',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CLOSED: 'CLOSED',
  DECLINED: 'DECLINED',
  CANCELLED: 'CANCELLED'
};

/**
 * Ticket Priority Enums
 */
const TICKET_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

/**
 * User Roles (RBAC)
 */
const USER_ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  OPERATOR: 'Operator'
};

/**
 * Vendor Status Enums
 */
const VENDOR_STATUS = {
  AVAILABLE: 'AVAILABLE',
  BUSY: 'BUSY',
  OFFLINE: 'OFFLINE'
};

/**
 * WhatsApp Message Direction
 */
const MESSAGE_DIRECTION = {
  INBOUND: 'Inbound',
  OUTBOUND: 'Outbound'
};

/**
 * WhatsApp Delivery Status
 */
const DELIVERY_STATUS = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED'
};

module.exports = {
  TICKET_STATUS,
  TICKET_PRIORITY,
  USER_ROLES,
  VENDOR_STATUS,
  MESSAGE_DIRECTION,
  DELIVERY_STATUS
};
