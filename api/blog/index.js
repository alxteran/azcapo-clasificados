const { sql } = require('../../lib/db');
const { authMiddleware } = require('../../lib/auth');
const { cors } = require('../../lib/cors');

/* ---- Auto-migrate: create table on first use ---- */
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id           SERIAL PRIMARY KEY,
      public_id    VARCHAR(80)  NOT NULL UNIQUE,
      author_id    INTEGER      REFERENCES users(id) ON DELETE SET NULL,
      author_email VARCHAR(255) NOT NULL,
      title        VARCHAR(120) NOT NULL,
      excerpt      TEXT         NOT NULL,
      body         TEXT         NOT NULL,
      category     VARCHAR(60)  NOT NULL DEFAULT 'general',
      cover_emoji  VARCHAR(10)  NOT NULL DEFAULT '📝',
      status       VARCHAR(20)  NOT NULL DEFAULT 'pending',
      created_at   TIMESTAMP    DEFAULT NOW(),
      published_at TIMESTAMP
    )
  `;
}

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method === 'GET')  return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

/* ---- GET /api/blog — list approved posts ---- */
async function handleList(req, res) {
  try {
    await ensureTable();

    const { category, q, limit = 20, page = 1 } = req.query || {};
    const offset = (Number(page) - 1) * Number(limit);

    let query = `SELECT id, public_id, author_id, author_email, title, excerpt,
                        category, cover_emoji, status, published_at, created_at
                 FROM blog_posts
                 WHERE status = 'approved'`;
    const params = [];
    let idx = 1;

    if (category) {
      params.push(category);
      query += ` AND category = $${idx++}`;
    }
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      query += ` AND (LOWER(title) LIKE $${idx} OR LOWER(excerpt) LIKE $${idx})`;
      idx++;
    }

    query += ` ORDER BY published_at DESC NULLS LAST`;

    params.push(Number(limit));
    query += ` LIMIT $${idx++}`;
    params.push(offset);
    query += ` OFFSET $${idx}`;

    const posts = await sql(query, params);

    // Count total approved for pagination
    let countQuery = `SELECT COUNT(*) AS total FROM blog_posts WHERE status = 'approved'`;
    const countParams = [];
    let cIdx = 1;
    if (category) { countParams.push(category); countQuery += ` AND category = $${cIdx++}`; }
    if (q)        { countParams.push(`%${q.toLowerCase()}%`); countQuery += ` AND (LOWER(title) LIKE $${cIdx} OR LOWER(excerpt) LIKE $${cIdx})`; }
    const countResult = await sql(countQuery, countParams);
    const total = Number(countResult[0]?.total || 0);

    return res.status(200).json({ success: true, posts, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('Blog list error:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener artículos.' });
  }
}

/* ---- POST /api/blog — submit new post (requires auth) ---- */
async function handleCreate(req, res) {
  try {
    await ensureTable();

    const user = authMiddleware(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Debes iniciar sesión para publicar en el blog.' });
    }

    const { title, excerpt, body, category, cover_emoji } = req.body || {};

    if (!title || !excerpt || !body || !category) {
      return res.status(400).json({ success: false, message: 'Título, extracto, contenido y categoría son obligatorios.' });
    }
    if (title.length > 120) {
      return res.status(400).json({ success: false, message: 'El título no puede superar 120 caracteres.' });
    }
    if (body.length > 10000) {
      return res.status(400).json({ success: false, message: 'El contenido no puede superar 10,000 caracteres.' });
    }

    const publicId = 'blog_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

    const result = await sql`
      INSERT INTO blog_posts
        (public_id, author_id, author_email, title, excerpt, body, category, cover_emoji, status)
      VALUES
        (${publicId}, ${user.userId}, ${user.email}, ${title.trim()}, ${excerpt.trim()},
         ${body.trim()}, ${category}, ${cover_emoji || '📝'}, ${'pending'})
      RETURNING public_id, title, status, created_at
    `;

    return res.status(201).json({
      success: true,
      post: result[0],
      message: '¡Artículo enviado! Será revisado por el equipo antes de publicarse.'
    });
  } catch (err) {
    console.error('Blog create error:', err);
    return res.status(500).json({ success: false, message: 'Error al enviar artículo.' });
  }
}

/* ---- GET /api/blog — list approved posts ---- */
async function handleList(req, res) {
  try {
    const { category, q, limit = 20, page = 1 } = req.query || {};
    const offset = (Number(page) - 1) * Number(limit);

    let query = `SELECT id, public_id, author_id, author_email, title, excerpt,
                        category, cover_emoji, status, published_at, created_at
                 FROM blog_posts
                 WHERE status = 'approved'`;
    const params = [];
    let idx = 1;

    if (category) {
      params.push(category);
      query += ` AND category = $${idx++}`;
    }
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      query += ` AND (LOWER(title) LIKE $${idx} OR LOWER(excerpt) LIKE $${idx})`;
      idx++;
    }

    query += ` ORDER BY published_at DESC NULLS LAST`;

    params.push(Number(limit));
    query += ` LIMIT $${idx++}`;
    params.push(offset);
    query += ` OFFSET $${idx}`;

    const posts = await sql(query, params);

    // Count total approved for pagination
    let countQuery = `SELECT COUNT(*) AS total FROM blog_posts WHERE status = 'approved'`;
    const countParams = [];
    let cIdx = 1;
    if (category) { countParams.push(category); countQuery += ` AND category = $${cIdx++}`; }
    if (q)        { countParams.push(`%${q.toLowerCase()}%`); countQuery += ` AND (LOWER(title) LIKE $${cIdx} OR LOWER(excerpt) LIKE $${cIdx})`; }
    const countResult = await sql(countQuery, countParams);
    const total = Number(countResult[0]?.total || 0);

    return res.status(200).json({ success: true, posts, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('Blog list error:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener artículos.' });
  }
}

/* ---- POST /api/blog — submit new post (requires auth) ---- */
async function handleCreate(req, res) {
  try {
    const user = authMiddleware(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Debes iniciar sesión para publicar en el blog.' });
    }

    const { title, excerpt, body, category, cover_emoji } = req.body || {};

    if (!title || !excerpt || !body || !category) {
      return res.status(400).json({ success: false, message: 'Título, extracto, contenido y categoría son obligatorios.' });
    }
    if (title.length > 120) {
      return res.status(400).json({ success: false, message: 'El título no puede superar 120 caracteres.' });
    }
    if (body.length > 10000) {
      return res.status(400).json({ success: false, message: 'El contenido no puede superar 10,000 caracteres.' });
    }

    const publicId = 'blog_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

    const result = await sql`
      INSERT INTO blog_posts
        (public_id, author_id, author_email, title, excerpt, body, category, cover_emoji, status)
      VALUES
        (${publicId}, ${user.userId}, ${user.email}, ${title.trim()}, ${excerpt.trim()},
         ${body.trim()}, ${category}, ${cover_emoji || '📝'}, ${'pending'})
      RETURNING public_id, title, status, created_at
    `;

    return res.status(201).json({
      success: true,
      post: result[0],
      message: '¡Artículo enviado! Será revisado por el equipo antes de publicarse.'
    });
  } catch (err) {
    console.error('Blog create error:', err);
    return res.status(500).json({ success: false, message: 'Error al enviar artículo.' });
  }
}
