const connectDB = require('../../../config/db');
const reportService = require('../../../services/reportService');
const { withAuth } = require('../../../middlewares/authMiddleware');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    await connectDB();
    const { status } = req.query;
    const csvContent = await reportService.generateTicketsCSVReport(status);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=complaints_report_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export default withAuth(handler);
