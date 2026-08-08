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

  /**
   * Find ALL available vendors matching Category, Ward, and Area
   * Multi-level matching using find() returning ALL vendors.
   */
  async findAllAvailableVendors(category, areaName, wardName) {
    console.log(`🔍 [VendorRepository.find()] Querying ALL available vendors for Category="${category}", Ward="${wardName}", Area="${areaName}"`);

    const categoryRegex = new RegExp(category || '', 'i');
    const areaRegex = new RegExp(areaName || '', 'i');
    const wardRegex = new RegExp(wardName || '', 'i');

    const availableStatusQuery = {
      $or: [{ status: 'AVAILABLE' }, { status: 'Available' }, { status: { $exists: false } }]
    };

    // Level 1 (Exact Match): AVAILABLE + Category + Ward + Area
    let vendors = await this.find({
      ...availableStatusQuery,
      categories: categoryRegex,
      assignedWards: wardRegex,
      assignedAreas: areaRegex
    });

    if (vendors && vendors.length > 0) {
      console.log(`✅ [VendorRepository.find()] Level 1 Exact Match: Found ${vendors.length} vendors.`);
      return vendors;
    }

    // Level 2 (Ward + Category Match): AVAILABLE + Category + Ward
    vendors = await this.find({
      ...availableStatusQuery,
      categories: categoryRegex,
      assignedWards: wardRegex
    });

    if (vendors && vendors.length > 0) {
      console.log(`✅ [VendorRepository.find()] Level 2 Ward+Category Match: Found ${vendors.length} vendors.`);
      return vendors;
    }

    // Level 3 (Category Match): AVAILABLE + Category
    vendors = await this.find({
      ...availableStatusQuery,
      categories: categoryRegex
    });

    if (vendors && vendors.length > 0) {
      console.log(`✅ [VendorRepository.find()] Level 3 Category Match: Found ${vendors.length} vendors.`);
      return vendors;
    }

    // Level 4 (System Fallback): Return all active vendors
    vendors = await this.find({});
    console.log(`⚠️ [VendorRepository.find()] Level 4 Fallback: Returning all ${vendors.length} system vendors.`);
    return vendors;
  }

  async findAvailableVendorForTicket(category, areaName, wardName) {
    const vendors = await this.findAllAvailableVendors(category, areaName, wardName);
    return vendors && vendors.length > 0 ? vendors[0] : null;
  }

  async incrementActiveTickets(vendorId) {
    return await this.model.findByIdAndUpdate(vendorId, { $inc: { activeTicketCount: 1 } }, { new: true });
  }

  async decrementActiveTickets(vendorId) {
    return await this.model.findByIdAndUpdate(vendorId, { $inc: { activeTicketCount: -1 } }, { new: true });
  }
}

module.exports = new VendorRepository();
