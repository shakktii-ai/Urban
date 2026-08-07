const BaseRepository = require('./BaseRepository');
const Ward = require('../models/Ward');

class WardRepository extends BaseRepository {
  constructor() {
    super(Ward);
  }

  async findByWardName(wardName) {
    return await this.findOne({ wardName });
  }

  async findWardByAreaName(areaName) {
    return await this.findOne({
      areas: { $regex: new RegExp(`^${areaName.trim()}$`, 'i') }
    });
  }
}

module.exports = new WardRepository();
