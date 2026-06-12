const { neon } = require('@neondatabase/serverless');
const { authMiddleware } = require('../../lib/auth');
const { cors } = require('../../lib/cors');

const ADMIN_EMAIL = 'alxteran@gmail.com';

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'GET') {
    await sql`CREATE TABLE IF NOT EXISTS site_settings (
      key VARCHAR(100) PRIMARY KEY,
      value JSONB DEFAULT '[]',
      updated_at TIMESTAMP DEFAULT NOW()
    )`;
    const rows = await sql`SELECT value FROM site_settings WHERE key = 'explore_videos'`;
    const videos = rows.length > 0 ? rows[0].value : [];
    return res.status(200).json({ success: true, videos });
  }

  if (req.method === 'POST') {
    const user = authMiddleware(req);
    if (!user) return res.status(401).json({ error: 'No autorizado' });
    if (user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Solo el administrador puede modificar los videos' });

    const { videos } = req.body || {};
    if (!Array.isArray(videos)) return res.status(400).json({ error: 'Se requiere un array de videos' });

    const cleaned = videos.slice(0, 30).map(v => ({
      url: String(v.url || '').trim(),
      title: String(v.title || '').trim().slice(0, 100)
    })).filter(v => v.url.length > 0);

    await sql`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES ('explore_videos', ${JSON.stringify(cleaned)}::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(cleaned)}::jsonb, updated_at = NOW()
    `;

    return res.status(200).json({ success: true, videos: cleaned });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
