const { sql } = require('../../lib/db');
const { verifyPassword, generateToken } = require('../../lib/auth');
const { cors } = require('../../lib/cors');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Correo y contraseña son requeridos.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const users = await sql`SELECT id, email, password_hash FROM users WHERE email = ${trimmedEmail}`;
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'No existe una cuenta con este correo. Regístrate primero.' });
    }

    const user = users[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'La contraseña es incorrecta.' });
    }

    // Update last login
    await sql`UPDATE users SET last_login = NOW() WHERE id = ${user.id}`;

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: '¡Bienvenido de nuevo!',
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};
