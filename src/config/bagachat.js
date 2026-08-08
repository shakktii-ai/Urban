module.exports = {
  // Official BagAChat Basic Authorization Token
  BAGACHAT_BASIC_AUTH: process.env.BAGACHAT_BASIC_AUTH || 'PUSHKARBOT1',

  // Official API 1.1 Endpoint (Business Initiated Template Messages)
  BAGACHAT_TRANSACTIONAL_API: process.env.BAGACHAT_TRANSACTIONAL_API || 'https://push.bagachat.com/api/sendtransactionalmsg_waentapi.bg',

  // Official API 1.2 Endpoint (Customer Care Session Messages)
  BAGACHAT_SESSION_API: process.env.BAGACHAT_SESSION_API || 'https://link.bagachat.com/api/sendcustomercaremsg_waentapi.bg',

  // Official API 2 Endpoints (Delivery Status Tracking)
  BAGACHAT_TEMPLATE_STATUS_API: process.env.BAGACHAT_TEMPLATE_STATUS_API || 'https://push.bagachat.com/api/gettransactionalmsgstatus.bg',
  BAGACHAT_SESSION_STATUS_API: process.env.BAGACHAT_SESSION_STATUS_API || 'https://link.bagachat.com/api/gettransactionalmsgstatus.bg',

  // API 4 Webhook Verification Token & URL
  BAGACHAT_VERIFY_TOKEN: process.env.BAGACHAT_VERIFY_TOKEN || '919405235430',
  BAGACHAT_WEBHOOK_URL: process.env.BAGACHAT_WEBHOOK_URL || '/api/webhook/bagachat',
  BAGACHAT_PHONE_NUMBER: process.env.BAGACHAT_PHONE_NUMBER || '919405235430'
};
