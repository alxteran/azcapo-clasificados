const { sql } = require('../../lib/db');
const { authMiddleware } = require('../../lib/auth');
const { cors } = require('../../lib/cors');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = authMiddleware(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Debes iniciar sesión.' });
    }

    const ads = await sql`
      SELECT * FROM ads WHERE owner_id = ${user.userId} AND status != 'deleted'
      ORDER BY created_at DESC
    `;

    // Parse JSONB fields
    ads.forEach(ad => {
      ad.images = typeof ad.images === 'string' ? JSON.parse(ad.images) : ad.images;
      ad.contact = typeof ad.contact === 'string' ? JSON.parse(ad.contact) : ad.contact;
    });

    return res.status(200).json({ success: true, ads });
  } catch (error) {
    console.error('My ads error:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener tus anuncios.' });
  }
};
