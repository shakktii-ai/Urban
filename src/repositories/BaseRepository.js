class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    const item = new this.model(data);
    return await item.save();
  }

  async findById(id, populate = '') {
    const query = this.model.findById(id);
    if (populate) query.populate(populate);
    return await query.exec();
  }

  async findOne(filter = {}, populate = '') {
    const query = this.model.findOne(filter);
    if (populate) query.populate(populate);
    return await query.exec();
  }

  async find(filter = {}, options = {}) {
    const { sort = { createdAt: -1 }, limit = 0, skip = 0, populate = '', select = '' } = options;
    const query = this.model.find(filter);

    if (select) query.select(select);
    if (populate) query.populate(populate);
    if (sort) query.sort(sort);
    if (skip) query.skip(skip);
    if (limit) query.limit(limit);

    return await query.exec();
  }

  async updateById(id, updateData, options = { new: true }) {
    return await this.model.findByIdAndUpdate(id, updateData, options).exec();
  }

  async updateOne(filter, updateData, options = { new: true }) {
    return await this.model.findOneAndUpdate(filter, updateData, options).exec();
  }

  async count(filter = {}) {
    return await this.model.countDocuments(filter).exec();
  }

  async deleteById(id) {
    return await this.model.findByIdAndDelete(id).exec();
  }
}

module.exports = BaseRepository;
