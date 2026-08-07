const sseManager = require('../../../utils/sseManager');

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Send connection established event
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to Realtime Events Stream' })}\n\n`);

  sseManager.addClient(res);
}
