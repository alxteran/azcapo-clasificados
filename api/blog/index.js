const { sql } = require('../../lib/db');
const { authMiddleware } = require('../../lib/auth');
const { cors } = require('../../lib/cors');

/* ---- Auto-migrate: create table on first use ---- */
let _tableReady = false;

async function ensureTable() {
  if (_tableReady) return;
  // Use tagged template (guaranteed compatible with @neondatabase/serverless)
  // No FK constraints, no emoji in SQL to avoid any encoding edge cases
  await sql`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id           SERIAL       PRIMARY KEY,
      public_id    VARCHAR(80)  NOT NULL UNIQUE,
      author_id    INTEGER,
      author_email VARCHAR(255) NOT NULL DEFAULT '',
      title        VARCHAR(120) NOT NULL,
      excerpt      TEXT         NOT NULL DEFAULT '',
      body         TEXT         NOT NULL DEFAULT '',
      category     VARCHAR(60)  NOT NULL DEFAULT 'general',
      cover_emoji  VARCHAR(12)  NOT NULL DEFAULT '',
      status       VARCHAR(20)  NOT NULL DEFAULT 'pending',
      created_at   TIMESTAMP    DEFAULT NOW(),
      published_at TIMESTAMP
    )
  `;
  _tableReady = true;
  console.log('[blog] blog_posts table ready');
}

/* ========================================================
   MAIN HANDLER
   ======================================================== */
module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method === 'GET')  return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

/* ---- GET /api/blog — list approved posts ---- */
async function handleList(req, res) {
  // Ensure table exists — if it fails, return empty list (graceful degradation)
  try {
    await ensureTable();
  } catch (ensureErr) {
    console.error('[blog] ensureTable failed:', ensureErr.message);
    // Return empty list so the page renders without error
    return res.status(200).json({ success: true, posts: [], total: 0, page: 1, limit: 20 });
  }

  try {
    const { category, q, limit = 20, page = 1 } = req.query || {};
    const offset = (Number(page) - 1) * Number(limit);
    const lim    = Number(limit);

    // Build filter params
    const params = [];
    let whereExtra = '';
    let idx = 1;

    if (category) {
      params.push(category);
      whereExtra += ` AND category = $${idx++}`;
    }
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      whereExtra += ` AND (LOWER(title) LIKE $${idx} OR LOWER(excerpt) LIKE $${idx})`;
      idx++;
    }

    // Main query
    params.push(lim);
    params.push(offset);
    const posts = await sql(
      `SELECT id, public_id, author_id, author_email, title, excerpt,
              category, cover_emoji, status, published_at, created_at
       FROM blog_posts
       WHERE status = 'approved'${whereExtra}
       ORDER BY published_at DESC NULLS LAST
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    // Count
    const countParams = [];
    let cExtra = '';
    let cIdx = 1;
    if (category) { countParams.push(category); cExtra += ` AND category = $${cIdx++}`; }
    if (q)        { countParams.push(`%${q.toLowerCase()}%`); cExtra += ` AND (LOWER(title) LIKE $${cIdx} OR LOWER(excerpt) LIKE $${cIdx})`; }
    const countRes = await sql(`SELECT COUNT(*) AS total FROM blog_posts WHERE status = 'approved'${cExtra}`, countParams);
    const total = Number(countRes[0]?.total || 0);

    return res.status(200).json({ success: true, posts, total, page: Number(page), limit: lim });
  } catch (err) {
    console.error('[blog] handleList error:', err.message);
    // If table still doesn't exist somehow, return empty instead of 500
    if (err.message && (err.message.includes('does not exist') || err.message.includes('relation'))) {
      return res.status(200).json({ success: true, posts: [], total: 0, page: 1, limit: 20 });
    }
    return res.status(500).json({ success: false, message: 'Error al listar art\u00edculos: ' + err.message });
  }
}

/* ---- POST /api/blog — submit new post (requires auth) ---- */
async function handleCreate(req, res) {
  // Ensure table — fail hard here so the user knows something is wrong
  try {
    await ensureTable();
  } catch (ensureErr) {
    console.error('[blog] ensureTable failed on POST:', ensureErr.message);
    return res.status(500).json({ success: false, message: 'Error de base de datos: ' + ensureErr.message });
  }

  try {
    const user = authMiddleware(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Debes iniciar sesión para publicar en el blog.' });
    }

    const { title, excerpt, body, category, cover_emoji } = req.body || {};

    if (!title || !excerpt || !body || !category) {
      return res.status(400).json({ success: false, message: 'Título, extracto, contenido y categoría son obligatorios.' });
    }
    if (String(title).length > 120) {
      return res.status(400).json({ success: false, message: 'El título no puede superar 120 caracteres.' });
    }
    if (String(body).length > 10000) {
      return res.status(400).json({ success: false, message: 'El contenido no puede superar 10,000 caracteres.' });
    }

    const publicId = 'blog_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const emoji    = String(cover_emoji || '').slice(0, 8) || '';

    const result = await sql`
      INSERT INTO blog_posts
        (public_id, author_id, author_email, title, excerpt, body, category, cover_emoji, status)
      VALUES
        (${publicId}, ${user.userId || null}, ${user.email || ''},
         ${String(title).trim()}, ${String(excerpt).trim()},
         ${String(body).trim()}, ${String(category)}, ${emoji}, ${'pending'})
      RETURNING public_id, title, status, created_at
    `;

    return res.status(201).json({
      success: true,
      post: result[0],
      message: '¡Artículo enviado! Será revisado por el equipo antes de publicarse.'
    });
  } catch (err) {
    console.error('[blog] handleCreate error:', err.message);
    return res.status(500).json({ success: false, message: 'Error al enviar art\u00edculo: ' + err.message });
  }
}
