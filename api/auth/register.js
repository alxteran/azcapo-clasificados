const { sql } = require('../../lib/db');
const { hashPassword, generateToken } = require('../../lib/auth');
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'El formato del correo electrónico no es válido.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    // Check if user already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${trimmedEmail}`;
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Este correo ya está registrado. Inicia sesión.' });
    }

    const passwordHash = await hashPassword(password);
    const result = await sql`
      INSERT INTO users (email, password_hash) VALUES (${trimmedEmail}, ${passwordHash})
      RETURNING id, email, created_at
    `;

    const user = result[0];
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: '¡Registro exitoso! Bienvenido.',
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};
