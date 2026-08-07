const connectDB = require('../../../config/db');
const adminController = require('../../../controllers/adminController');
const { withAuth } = require('../../../middlewares/authMiddleware');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    await connectDB();
    return await adminController.getMessages(req, res);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export default withAuth(handler);
