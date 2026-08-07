const authService = require('../services/authService');

function withAuth(handler, allowedRoles = []) {
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = authService.verifyToken(token);
      req.user = decoded;

      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ success: false, error: 'Forbidden: Insufficient permissions' });
      }

      return await handler(req, res);
    } catch (error) {
      return res.status(401).json({ success: false, error: error.message });
    }
  };
}

module.exports = {
  withAuth
};
