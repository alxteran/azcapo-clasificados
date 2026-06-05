const { neon } = require('@neondatabase/serverless');
const { cors } = require('../../lib/cors');
const { authMiddleware } = require('../../lib/auth');

const ADMIN_EMAIL = 'alxteran@gmail.com';

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  const sql = neon(process.env.DATABASE_URL);

  // Auto-create table
  await sql`CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  // POST: Submit a new contact message (public)
  if (req.method === 'POST') {
    const { email, message } = req.body || {};

    if (!email || !message) {
      return res.status(400).json({ success: false, error: 'El correo y el mensaje son obligatorios.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Correo electrónico no válido.' });
    }

    // Validate message length (max ~1000 words ≈ 7000 chars)
    if (message.length > 7000) {
      return res.status(400).json({ success: false, error: 'El mensaje excede el límite de 1000 palabras.' });
    }

    const trimmedMsg = message.trim().slice(0, 7000);

    await sql`INSERT INTO contact_messages (email, message) VALUES (${email.trim()}, ${trimmedMsg})`;

    return res.status(200).json({ success: true, message: 'Mensaje enviado correctamente.' });
  }

  // GET: Fetch all messages (admin only)
  if (req.method === 'GET') {
    const user = authMiddleware(req);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ success: false, error: 'No autorizado.' });
    }

    const messages = await sql`SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100`;
    return res.status(200).json({ success: true, messages });
  }

  // DELETE: Delete a message (admin only)
  if (req.method === 'DELETE') {
    const user = authMiddleware(req);
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ success: false, error: 'No autorizado.' });
    }

    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, error: 'ID requerido.' });

    await sql`DELETE FROM contact_messages WHERE id = ${id}`;
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
