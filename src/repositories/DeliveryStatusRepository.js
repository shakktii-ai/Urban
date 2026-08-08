const BaseRepository = require('./BaseRepository');
const DeliveryStatus = require('../models/DeliveryStatus');

class DeliveryStatusRepository extends BaseRepository {
  constructor() {
    super(DeliveryStatus);
  }

  async findByMessageId(messageId) {
    return await this.findOne({ messageId });
  }

  async findPendingOrSentOlderThanOneMinute() {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    return await this.find({
      status: { $in: ['PENDING', 'SENT'] },
      createdAt: { $lte: oneMinuteAgo }
    });
  }

  async upsertStatusRecord(data) {
    const existing = await this.findOne({ messageId: data.messageId });
    if (existing) {
      return await this.updateOne({ messageId: data.messageId }, data);
    }
    return await this.create({
      ...data,
      statusHistory: [{
        status: data.status || 'PENDING',
        timestamp: new Date(),
        remarks: 'Message recorded for delivery tracking'
      }]
    });
  }

  async updateApi2Status(messageId, newStatus, reason = '', rawResponse = {}) {
    const existing = await this.findOne({ messageId });
    if (!existing) return null;

    const oldStatus = existing.status;
    const historyUpdate = {
      status: newStatus,
      timestamp: new Date(),
      remarks: reason || `Status updated via BagAChat API 2 to ${newStatus}`
    };

    const updatePayload = {
      status: newStatus,
      reason: reason || existing.reason,
      rawResponse,
      checkedAt: new Date(),
      $push: { statusHistory: historyUpdate }
    };

    if (newStatus === 'FAILED') {
      updatePayload.retryCount = (existing.retryCount || 0) + 1;
      updatePayload.retryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 min retry delay
    }

    const updated = await this.model.findOneAndUpdate(
      { messageId },
      updatePayload,
      { new: true }
    );

    return { updated, statusChanged: oldStatus !== newStatus, oldStatus };
  }

  async getDeliveryStats() {
    const all = await this.find({});
    const total = all.length;
    const pending = all.filter(m => m.status === 'PENDING' || m.status === 'SENT').length;
    const delivered = all.filter(m => m.status === 'DELIVERED').length;
    const read = all.filter(m => m.status === 'READ').length;
    const failed = all.filter(m => m.status === 'FAILED').length;
    const successCount = delivered + read;
    const successRate = total > 0 ? ((successCount / total) * 100).toFixed(1) : '100.0';

    return {
      total,
      pending,
      delivered,
      read,
      failed,
      successRate: `${successRate}%`
    };
  }
}

module.exports = new DeliveryStatusRepository();
