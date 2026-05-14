const { sql } = require('../../lib/db');
const { authMiddleware } = require('../../lib/auth');
const { cors } = require('../../lib/cors');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const decoded = authMiddleware(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado.' });
    }

    const users = await sql`SELECT id, email, created_at, last_login FROM users WHERE id = ${decoded.userId}`;
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    return res.status(200).json({ success: true, user: users[0] });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};
