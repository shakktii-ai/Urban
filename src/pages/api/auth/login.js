const connectDB = require('../../../config/db');
const authController = require('../../../controllers/authController');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    await connectDB();
    return await authController.login(req, res);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
