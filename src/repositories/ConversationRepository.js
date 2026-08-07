const BaseRepository = require('./BaseRepository');
const ConversationSession = require('../models/ConversationSession');

class ConversationRepository extends BaseRepository {
  constructor() {
    super(ConversationSession);
  }

  async getSession(phone) {
    let session = await this.findOne({ phone });
    // Reset if expired
    if (session && session.expiresAt && new Date() > session.expiresAt) {
      await this.deleteById(session._id);
      session = null;
    }
    return session;
  }

  async createOrResetSession(phone) {
    await this.model.deleteMany({ phone });
    return await this.create({
      phone,
      currentStep: 'CATEGORY',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    });
  }

  async updateSession(phone, updateData) {
    return await this.updateOne(
      { phone },
      { ...updateData, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
      { new: true }
    );
  }

  async clearSession(phone) {
    return await this.model.deleteMany({ phone });
  }
}

module.exports = new ConversationRepository();
