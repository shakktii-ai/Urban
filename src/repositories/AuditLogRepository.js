const BaseRepository = require('./BaseRepository');
const AuditLog = require('../models/AuditLog');

class AuditLogRepository extends BaseRepository {
  constructor() {
    super(AuditLog);
  }

  async logAction(action, moduleName, performedBy, details = {}, ipAddress = '127.0.0.1') {
    return await this.create({
      action,
      module: moduleName,
      performedBy: performedBy || 'SYSTEM',
      details,
      ipAddress,
      timestamp: new Date()
    });
  }
}

module.exports = new AuditLogRepository();
