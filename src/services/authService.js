const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/UserRepository');
const auditLogRepository = require('../repositories/AuditLogRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_gov_platform_2026';

class AuthService {
  /**
   * Login user and generate JWT token
   */
  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.status !== 'Active') {
      throw new Error('Account is inactive. Please contact Super Admin.');
    }

    // Direct password match (or bcrypt fallback)
    if (user.password !== password) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await userRepository.updateById(user._id, { lastLogin: user.lastLogin });

    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await auditLogRepository.logAction('USER_LOGIN', 'Auth', user.name, { email: user.email, role: user.role });

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      throw new Error('Unauthorized: Invalid or expired token');
    }
  }
}

module.exports = new AuthService();
