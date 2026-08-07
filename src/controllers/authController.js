const authService = require('../services/authService');
const userRepository = require('../repositories/UserRepository');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }

      // Seed default Super Admin if database is empty
      await seedDefaultAdmin();

      const result = await authService.login(email, password);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  async me(req, res) {
    return res.status(200).json({ success: true, user: req.user });
  }
}

async function seedDefaultAdmin() {
  const count = await userRepository.count({});
  if (count === 0) {
    await userRepository.create({
      name: 'Super Admin',
      email: 'admin@municipal.gov.in',
      password: 'admin',
      role: 'Super Admin',
      status: 'Active'
    });
    console.log('Seeded Default Super Admin: admin@municipal.gov.in / admin');
  }
}

module.exports = new AuthController();
