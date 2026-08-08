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
  PENDING: 'PENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED'
};

/**
 * Official Meta WhatsApp Cloud API / BagAChat Error Code Dictionary
 */
const META_WHATSAPP_ERROR_MAP = {
  '131042': {
    title: 'Meta Payment Eligibility Issue',
    description: 'Message undeliverable due to Meta WhatsApp Business account payment eligibility restriction, unpaid conversation charges, or missing payment method in Meta Business Manager.',
    resolution: 'Add a valid payment method in Meta Business Manager -> Billing & Payments.'
  },
  '131026': {
    title: 'Message Undeliverable',
    description: 'Recipient phone number is invalid or not registered on WhatsApp.',
    resolution: 'Verify vendor/citizen mobile number.'
  },
  '131047': {
    title: '24-Hour Session Expired',
    description: 'More than 24 hours have passed since recipient last messaged. Free-form session messages cannot be sent.',
    resolution: 'Send an approved WhatsApp Template message (API 1.1) to re-open the conversation window.'
  },
  '131051': {
    title: 'Unsupported Media Format',
    description: 'Attached media file type or size is not supported by Meta WhatsApp Cloud API.',
    resolution: 'Use supported JPEG, PNG, or PDF files under 5MB.'
  },
  '132001': {
    title: 'Template Parameter Mismatch',
    description: 'Number of variable parameters sent does not match Meta approved template definition.',
    resolution: 'Check template placeholders {{1}}, {{2}}, etc.'
  },
  '132000': {
    title: 'Template Not Found or Rejected',
    description: 'Template name or language code (en_US) does not match approved template in Meta Business Manager.',
    resolution: 'Verify template name state_vendor_alert1 and language en_US.'
  },
  '130429': {
    title: 'Rate Limit Exceeded',
    description: 'Too many messages sent in a short time interval.',
    resolution: 'Implement throttling / queue delay between dispatches.'
  },
  '100': {
    title: 'Invalid Parameter',
    description: 'Request payload contains missing or malformed mandatory fields.',
    resolution: 'Inspect payload JSON structure.'
  }
};

module.exports = {
  TICKET_STATUS,
  TICKET_PRIORITY,
  USER_ROLES,
  VENDOR_STATUS,
  MESSAGE_DIRECTION,
  DELIVERY_STATUS,
  META_WHATSAPP_ERROR_MAP
};
