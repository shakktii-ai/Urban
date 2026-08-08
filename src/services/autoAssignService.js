const wardRepository = require('../repositories/WardRepository');
const vendorRepository = require('../repositories/VendorRepository');

const CATEGORY_KEYWORDS = {
  'Water Leakage': ['water', 'pipe', 'leak', 'leakage', 'tap', 'supply', 'waterlog'],
  'Drainage & Sewage': ['drain', 'drainage', 'gutter', 'sewer', 'sewage', 'overflow', 'manhole'],
  'Electricity': ['power', 'electricity', 'transformer', 'spark', 'current', 'wire', 'meter', 'outage'],
  'Roads & Potholes': ['road', 'pothole', 'street', 'tar', 'footpath', 'asphalt', 'bridge', 'pavement'],
  'Sanitation & Garbage': ['garbage', 'trash', 'waste', 'dump', 'cleanliness', 'sanitation', 'dustbin'],
  'Street Lighting': ['light', 'lamp', 'pole', 'street light', 'darkness', 'bulb'],
  'General': []
};

class AutoAssignService {
  /**
   * Detect Category from complaint text
   */
  detectCategory(text) {
    if (!text) return 'General';
    const lowerText = text.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const kw of keywords) {
        if (lowerText.includes(kw)) {
          return category;
        }
      }
    }

    return 'General';
  }

  /**
   * Detect Area and Ward from text
   */
  async detectAreaAndWard(text) {
    if (!text) return { areaName: 'Unassigned Area', wardName: 'Unassigned Ward' };

    const lowerText = text.toLowerCase();

    // Check for explicit "Ward X" mention
    const wardMatch = lowerText.match(/ward\s*(\d+)/i);
    let wardName = wardMatch ? `Ward ${wardMatch[1]}` : '';

    // Search all wards and their areas
    const wards = await wardRepository.find({});
    let matchedArea = '';

    for (const ward of wards) {
      if (!wardName && ward.wardName.toLowerCase().includes(lowerText)) {
        wardName = ward.wardName;
      }

      for (const area of ward.areas || []) {
        if (lowerText.includes(area.toLowerCase())) {
          matchedArea = area;
          wardName = ward.wardName;
          break;
        }
      }
      if (matchedArea) break;
    }

    return {
      areaName: matchedArea || 'Unassigned Area',
      wardName: wardName || 'Unassigned Ward'
    };
  }

  /**
   * Find ALL matching available vendors for ticket
   */
  async findMatchingVendors(category, areaName, wardName) {
    return await vendorRepository.findAllAvailableVendors(category, areaName, wardName);
  }

  async findSuitableVendor(category, areaName, wardName) {
    const vendors = await this.findMatchingVendors(category, areaName, wardName);
    return vendors && vendors.length > 0 ? vendors[0] : null;
  }
}

module.exports = new AutoAssignService();
