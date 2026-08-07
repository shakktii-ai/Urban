const BaseRepository = require('./BaseRepository');
const DeliveryStatus = require('../models/DeliveryStatus');

class DeliveryStatusRepository extends BaseRepository {
  constructor() {
    super(DeliveryStatus);
  }

  async findByMessageId(messageId) {
    return await this.findOne({ messageId });
  }

  async updateDeliveryStatus(messageId, status, errorCode = '') {
    return await this.updateOne(
      { messageId },
      { status, errorCode, updatedAt: new Date() },
      { upsert: true, new: true }
    );
  }
}

module.exports = new DeliveryStatusRepository();
