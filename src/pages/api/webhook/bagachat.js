const connectDB = require('../../../config/db');
const webhookController = require('../../../controllers/webhookController');

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  try {
    await connectDB();
    return await webhookController.handleWebhook(req, res);
  } catch (error) {
    console.error('Webhook Endpoint Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
