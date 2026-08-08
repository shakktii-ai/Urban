const connectDB = require('../../../config/db');
const bagachatService = require('../../../services/bagachatService');
const deliveryStatusRepository = require('../../../repositories/DeliveryStatusRepository');

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const { search, status, ticketNumber, messageType, limit = 100 } = req.query;

      const filter = {};

      if (status) {
        filter.status = status.toUpperCase();
      }

      if (messageType) {
        filter.messageType = messageType.toUpperCase();
      }

      if (ticketNumber) {
        filter.ticketNumber = new RegExp(ticketNumber, 'i');
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        filter.$or = [
          { messageId: searchRegex },
          { ticketNumber: searchRegex },
          { phone: searchRegex },
          { vendorName: searchRegex },
          { citizenName: searchRegex }
        ];
      }

      const messages = await deliveryStatusRepository.find(filter, {
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 }
      });

      const stats = await deliveryStatusRepository.getDeliveryStats();

      return res.status(200).json({
        success: true,
        stats,
        count: messages.length,
        messages
      });
    }

    if (req.method === 'POST') {
      const { messageId } = req.body;
      if (!messageId) {
        return res.status(400).json({ success: false, error: 'messageId is required' });
      }

      const statusRecord = await deliveryStatusRepository.findByMessageId(messageId);
      const messageType = statusRecord?.messageType || 'TEMPLATE';

      const statusResult = await bagachatService.getMessageStatus(messageId, messageType);

      if (statusResult.success) {
        await deliveryStatusRepository.updateApi2Status(
          messageId,
          statusResult.messageStatus,
          statusResult.reason,
          statusResult.rawResponse
        );
      }

      const updatedRecord = await deliveryStatusRepository.findByMessageId(messageId);

      return res.status(200).json({
        success: true,
        statusResult,
        record: updatedRecord
      });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Delivery Status Route Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
