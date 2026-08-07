const BaseRepository = require('./BaseRepository');
const Message = require('../models/Message');

class MessageRepository extends BaseRepository {
  constructor() {
    super(Message);
  }

  async findByMessageId(messageId) {
    return await this.findOne({ messageId });
  }

  async findRecentMessagesByPhone(phone, limit = 20) {
    return await this.find({ phone }, { limit, sort: { timestamp: -1 } });
  }
}

module.exports = new MessageRepository();
