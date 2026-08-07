const BaseRepository = require('./BaseRepository');
const Template = require('../models/Template');

class TemplateRepository extends BaseRepository {
  constructor() {
    super(Template);
  }

  async findByTemplateName(templateName) {
    return await this.findOne({ templateName });
  }

  async upsertTemplate(templateData) {
    return await this.updateOne(
      { templateName: templateData.templateName },
      { ...templateData, syncedAt: new Date() },
      { upsert: true, new: true }
    );
  }
}

module.exports = new TemplateRepository();
