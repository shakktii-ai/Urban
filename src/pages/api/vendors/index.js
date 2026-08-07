const connectDB = require('../../../config/db');
const adminController = require('../../../controllers/adminController');
const { withAuth } = require('../../../middlewares/authMiddleware');

async function handler(req, res) {
  try {
    await connectDB();
    if (req.method === 'GET') {
      return await adminController.getVendors(req, res);
    }
    if (req.method === 'POST') {
      return await adminController.createVendor(req, res);
    }
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export default withAuth(handler);
