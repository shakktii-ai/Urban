const connectDB = require('../../../config/db');
const bagachatService = require('../../../services/bagachatService');
const { withAuth } = require('../../../middlewares/authMiddleware');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    await connectDB();
    const { messageId } = req.body;
    if (!messageId) {
      return res.status(400).json({ success: false, error: 'messageId is required' });
    }

    const result = await bagachatService.checkDeliveryStatus(messageId);
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export default withAuth(handler);
