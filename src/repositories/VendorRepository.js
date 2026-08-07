const BaseRepository = require('./BaseRepository');
const Vendor = require('../models/Vendor');

class VendorRepository extends BaseRepository {
  constructor() {
    super(Vendor);
  }

  async findByMobile(mobile) {
    return await this.findOne({ mobile });
  }

  async findAvailableVendorForTicket(category, areaName, wardName) {
    // 1. Exact match on category + assignedAreas + AVAILABLE status
    let vendor = await this.findOne({
      status: 'AVAILABLE',
      categories: category,
      assignedAreas: areaName
    });

    if (vendor) return vendor;

    // 2. Match on category + assignedWards + AVAILABLE status
    vendor = await this.findOne({
      status: 'AVAILABLE',
      categories: category,
      assignedWards: wardName
    });

    if (vendor) return vendor;

    // 3. Fallback: Any available vendor matching category
    return await this.findOne({
      status: 'AVAILABLE',
      categories: category
    });
  }

  /**
   * Feature 2: Find ALL available vendors matching Category, Ward, and Area
   */
  async findAllAvailableVendors(category, areaName, wardName) {
    // Search exact match on category + assignedAreas or assignedWards
    const vendors = await this.find({
      status: 'AVAILABLE',
      categories: category,
      $or: [
        { assignedAreas: areaName },
        { assignedWards: wardName }
      ]
    });

    if (vendors && vendors.length > 0) return vendors;

    // Fallback: All available vendors matching category
    return await this.find({
      status: 'AVAILABLE',
      categories: category
    });
  }

  async incrementActiveTickets(vendorId) {
    return await this.model.findByIdAndUpdate(vendorId, { $inc: { activeTicketCount: 1 } }, { new: true });
  }

  async decrementActiveTickets(vendorId) {
    return await this.model.findByIdAndUpdate(vendorId, { $inc: { activeTicketCount: -1 } }, { new: true });
  }
}

module.exports = new VendorRepository();
