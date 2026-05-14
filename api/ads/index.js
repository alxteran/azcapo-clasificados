const { sql } = require('../../lib/db');
const { authMiddleware } = require('../../lib/auth');
const { cors } = require('../../lib/cors');

const FREE_DAYS = 15;
const PREMIUM_DAYS = 30;
const FREE_MAX_RENEWALS = 3;

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function handleList(req, res) {
  try {
    const { q, category, type, sort, minPrice, maxPrice, limit = 100, page = 1 } = req.query || {};
    const offset = (Number(page) - 1) * Number(limit);

    let query = `SELECT * FROM ads WHERE status != 'deleted'`;
    const params = [];
    let paramIdx = 1;

    // Exclude suspended by default unless requesting own ads
    query += ` AND status = 'active'`;

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      query += ` AND (LOWER(title) LIKE $${paramIdx} OR LOWER(description) LIKE $${paramIdx})`;
      paramIdx++;
    }
    if (category) {
      params.push(category);
      query += ` AND category = $${paramIdx}`;
      paramIdx++;
    }
    if (type) {
      params.push(type);
      query += ` AND type = $${paramIdx}`;
      paramIdx++;
    }
    if (minPrice) {
      params.push(Number(minPrice));
      query += ` AND price >= $${paramIdx}`;
      paramIdx++;
    }
    if (maxPrice) {
      params.push(Number(maxPrice));
      query += ` AND price <= $${paramIdx}`;
      paramIdx++;
    }

    // Sort
    if (sort === 'price-asc') query += ` ORDER BY price ASC`;
    else if (sort === 'price-desc') query += ` ORDER BY price DESC`;
    else if (sort === 'oldest') query += ` ORDER BY created_at ASC`;
    else query += ` ORDER BY (CASE WHEN type = 'premium' THEN 0 ELSE 1 END), created_at DESC`;

    params.push(Number(limit));
    query += ` LIMIT $${paramIdx}`;
    paramIdx++;
    params.push(offset);
    query += ` OFFSET $${paramIdx}`;

    const ads = await sql(query, params);

    return res.status(200).json({ success: true, ads });
  } catch (error) {
    console.error('List ads error:', error);
    return res.status(500).json({ success: false, message: 'Error al listar anuncios.' });
  }
}

async function handleCreate(req, res) {
  try {
    const user = authMiddleware(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Debes iniciar sesión para publicar.' });
    }

    const { title, description, category, price, location, type, images, contact } = req.body || {};

    if (!title || !description || !category || !location) {
      return res.status(400).json({ success: false, message: 'Todos los campos obligatorios deben completarse.' });
    }

    const isPremium = type === 'premium';
    const vigenciaDays = isPremium ? PREMIUM_DAYS : FREE_DAYS;
    const publicId = 'ad_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

    const result = await sql`
      INSERT INTO ads (public_id, owner_id, title, description, category, price, location, type, status, images, contact, featured, expires_at, renewal_count, max_renewals)
      VALUES (
        ${publicId}, ${user.userId}, ${title}, ${description}, ${category},
        ${Number(price) || 0}, ${location},
        ${isPremium ? 'premium' : 'free'},
        ${isPremium ? 'pending_payment' : 'active'},
        ${JSON.stringify(images || [])},
        ${JSON.stringify(contact || { name: user.email, email: user.email })},
        ${isPremium},
        ${new Date(Date.now() + vigenciaDays * 86400000).toISOString()},
        ${0},
        ${isPremium ? 999999 : FREE_MAX_RENEWALS}
      )
      RETURNING *
    `;

    const ad = result[0];
    // Parse JSONB fields for response
    ad.images = typeof ad.images === 'string' ? JSON.parse(ad.images) : ad.images;
    ad.contact = typeof ad.contact === 'string' ? JSON.parse(ad.contact) : ad.contact;

    return res.status(201).json({ success: true, ad, message: '¡Anuncio creado!' });
  } catch (error) {
    console.error('Create ad error:', error);
    return res.status(500).json({ success: false, message: 'Error al crear anuncio.' });
  }
}
