const { sql } = require('../../lib/db');
const { authMiddleware } = require('../../lib/auth');
const { cors } = require('../../lib/cors');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function handleList(req, res) {
  try {
    const stores = await sql`
      SELECT s.*, u.email as owner_email,
        COUNT(a.id) as ad_count
      FROM stores s
      LEFT JOIN users u ON u.id = s.owner_id
      LEFT JOIN ads a ON a.owner_id = s.owner_id AND a.status = 'active'
      WHERE s.status = 'active'
      GROUP BY s.id, u.email
      ORDER BY s.created_at DESC
    `;
    return res.status(200).json({ success: true, stores });
  } catch (error) {
    console.error('List stores error:', error);
    return res.status(500).json({ success: false, message: 'Error al listar tiendas.' });
  }
}

async function handleCreate(req, res) {
  try {
    const user = authMiddleware(req);
    if (!user) return res.status(401).json({ success: false, message: 'Inicia sesión para crear tu tienda.' });

    const { name, slug, description, logo_url, whatsapp } = req.body || {};

    if (!name || !slug) return res.status(400).json({ success: false, message: 'Nombre y slug son requeridos.' });

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ success: false, message: 'El slug solo puede contener letras minúsculas, números y guiones.' });
    }

    // Check if user already has a store
    const existing = await sql`SELECT id FROM stores WHERE owner_id = ${user.userId}`;
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Ya tienes una tienda activa.' });
    }

    const store = await sql`
      INSERT INTO stores (owner_id, slug, name, description, logo_url, whatsapp, plan, status, plan_expires_at)
      VALUES (${user.userId}, ${slug.toLowerCase()}, ${name}, ${description || ''}, ${logo_url || ''}, ${whatsapp || ''}, 'basic', 'pending', NOW())
      RETURNING *
    `;

    return res.status(201).json({ success: true, store: store[0], message: '¡Tienda creada! Activa tu plan para publicarla.' });
  } catch (error) {
    if (error.message?.includes('unique')) {
      return res.status(400).json({ success: false, message: 'Ese nombre de tienda ya está en uso.' });
    }
    console.error('Create store error:', error);
    return res.status(500).json({ success: false, message: 'Error al crear tienda.' });
  }
}
