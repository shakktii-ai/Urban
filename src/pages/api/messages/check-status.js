const connectDB = require('../../../config/db');
const bagachatService = require('../../../services/bagachatService');
const deliveryStatusRepository = require('../../../repositories/DeliveryStatusRepository');
const auditLogRepository = require('../../../repositories/AuditLogRepository');

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === 'GET' || req.method === 'POST') {
      console.log('🔄 [API 2 Delivery Status Check] Fetching pending messages older than 1 minute...');

      const pendingMessages = await deliveryStatusRepository.findPendingOrSentOlderThanOneMinute();

      console.log(`📦 [API 2 Delivery Status Check] Found ${pendingMessages.length} messages to check.`);

      const results = [];

      for (const msg of pendingMessages) {
        const statusResult = await bagachatService.getMessageStatus(msg.messageId, msg.messageType);

        if (statusResult.success) {
          const { updated, statusChanged, oldStatus } = await deliveryStatusRepository.updateApi2Status(
            msg.messageId,
            statusResult.messageStatus,
            statusResult.reason,
            statusResult.rawResponse
          );

          if (statusChanged) {
            await auditLogRepository.logAction(
              'DELIVERY_STATUS_CHANGED',
              'DeliveryStatus',
              'BAGACHAT_API_2',
              {
                messageId: msg.messageId,
                ticketNumber: msg.ticketNumber,
                phone: msg.phone,
                oldStatus,
                newStatus: statusResult.messageStatus,
                reason: statusResult.reason,
                checkedAt: new Date()
              }
            );
          }

          results.push({
            messageId: msg.messageId,
            oldStatus,
            newStatus: statusResult.messageStatus,
            statusChanged
          });
        }
      }

      const stats = await deliveryStatusRepository.getDeliveryStats();

      return res.status(200).json({
        success: true,
        checkedCount: pendingMessages.length,
        updatedCount: results.filter(r => r.statusChanged).length,
        stats,
        results
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('❌ [API 2 Check Status Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
