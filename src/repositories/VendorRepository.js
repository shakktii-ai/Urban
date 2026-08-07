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
   * Uses case-insensitive regex and multi-tier fallbacks so vendors are always found.
   */
  async findAllAvailableVendors(category, areaName, wardName) {
    const categoryRegex = new RegExp(category, 'i');
    const areaRegex = new RegExp(areaName, 'i');
    const wardRegex = new RegExp(wardName, 'i');

    // 1. Match category + assignedAreas OR assignedWards (case-insensitive)
    let vendors = await this.find({
      $or: [{ status: 'AVAILABLE' }, { status: 'Available' }, { status: { $exists: false } }],
      categories: { $elemMatch: { $regex: categoryRegex } },
      $or: [
        { assignedAreas: { $elemMatch: { $regex: areaRegex } } },
        { assignedWards: { $elemMatch: { $regex: wardRegex } } }
      ]
    });

    if (vendors && vendors.length > 0) return vendors;

    // 2. Fallback: Any vendor matching category (case-insensitive)
    vendors = await this.find({
      $or: [{ status: 'AVAILABLE' }, { status: 'Available' }, { status: { $exists: false } }],
      categories: { $elemMatch: { $regex: categoryRegex } }
    });

    if (vendors && vendors.length > 0) return vendors;

    // 3. Ultimate Fallback: Return all vendors in the system so no complaint is stranded
    return await this.find({});
  }

  async incrementActiveTickets(vendorId) {
    return await this.model.findByIdAndUpdate(vendorId, { $inc: { activeTicketCount: 1 } }, { new: true });
  }

  async decrementActiveTickets(vendorId) {
    return await this.model.findByIdAndUpdate(vendorId, { $inc: { activeTicketCount: -1 } }, { new: true });
  }
}

module.exports = new VendorRepository();
