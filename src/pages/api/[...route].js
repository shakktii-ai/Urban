export default function handler(req, res) {
  return res.status(404).json({ success: false, error: 'Endpoint Not Found. Use specific Next.js API routes.' });
}
