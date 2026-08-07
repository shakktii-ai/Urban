const BaseRepository = require('./BaseRepository');
const Vendor = require('../models/Vendor');

class VendorRepository extends BaseRepository {
  constructor() {
    super(Vendor);
  }

  async findByMobile(mobile) {
    if (!mobile) return null;
    const cleanMobile = String(mobile).replace(/[^0-9]/g, '');

    return await this.findOne({
      $or: [
        { mobile: mobile },
        { mobile: cleanMobile },
        { mobile: { $regex: cleanMobile } },
        { phone: mobile },
        { phone: cleanMobile }
      ]
    });
  }

  async findAvailableVendorForTicket(category, areaName, wardName) {
    const categoryRegex = new RegExp(category, 'i');
    const areaRegex = new RegExp(areaName, 'i');
    const wardRegex = new RegExp(wardName, 'i');

    let vendor = await this.findOne({
      $or: [{ status: 'AVAILABLE' }, { status: 'Available' }, { status: { $exists: false } }],
      categories: categoryRegex,
      $or: [{ assignedAreas: areaRegex }, { assignedWards: wardRegex }]
    });

    if (vendor) return vendor;

    vendor = await this.findOne({
      $or: [{ status: 'AVAILABLE' }, { status: 'Available' }, { status: { $exists: false } }],
      categories: categoryRegex
    });

    if (vendor) return vendor;

    return await this.findOne({});
  }

  /**
   * Feature 2: Find ALL available vendors matching Category, Ward, and Area
   * Uses case-insensitive regex without invalid $elemMatch on primitive arrays.
   */
  async findAllAvailableVendors(category, areaName, wardName) {
    console.log(`🔍 [VendorRepository] Searching vendors for Category="${category}", Area="${areaName}", Ward="${wardName}"`);

    const categoryRegex = new RegExp(category || '', 'i');
    const areaRegex = new RegExp(areaName || '', 'i');
    const wardRegex = new RegExp(wardName || '', 'i');

    // Tier 1: Match category + assignedAreas OR assignedWards
    let vendors = await this.find({
      $or: [{ status: 'AVAILABLE' }, { status: 'Available' }, { status: { $exists: false } }],
      categories: categoryRegex,
      $or: [
        { assignedAreas: areaRegex },
        { assignedWards: wardRegex }
      ]
    });

    if (vendors && vendors.length > 0) {
      console.log(`✅ [VendorRepository] Tier 1 Exact Match Found ${vendors.length} vendors.`);
      return vendors;
    }

    // Tier 2 Fallback: Any vendor matching category
    vendors = await this.find({
      $or: [{ status: 'AVAILABLE' }, { status: 'Available' }, { status: { $exists: false } }],
      categories: categoryRegex
    });

    if (vendors && vendors.length > 0) {
      console.log(`✅ [VendorRepository] Tier 2 Category Fallback Found ${vendors.length} vendors.`);
      return vendors;
    }

    // Tier 3 Ultimate Fallback: Return all vendors in system so no complaint is stranded
    vendors = await this.find({});
    console.log(`⚠️ [VendorRepository] Tier 3 Fallback returning all ${vendors.length} system vendors.`);
    return vendors;
  }

  async incrementActiveTickets(vendorId) {
    return await this.model.findByIdAndUpdate(vendorId, { $inc: { activeTicketCount: 1 } }, { new: true });
  }

  async decrementActiveTickets(vendorId) {
    return await this.model.findByIdAndUpdate(vendorId, { $inc: { activeTicketCount: -1 } }, { new: true });
  }
}

module.exports = new VendorRepository();
