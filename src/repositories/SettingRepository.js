const BaseRepository = require('./BaseRepository');
const Setting = require('../models/Setting');

class SettingRepository extends BaseRepository {
  constructor() {
    super(Setting);
  }

  async getSettings() {
    let settings = await this.findOne({});
    if (!settings) {
      settings = await this.create({});
    }
    return settings;
  }
}

module.exports = new SettingRepository();
