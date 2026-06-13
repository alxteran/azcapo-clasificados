/**
 * api/admin/migrate.js — Ejecuta las migraciones de BD
 * Protegido por CRON_SECRET. Eliminar después de usar.
 * GET /api/admin/migrate?key=TU_CRON_SECRET
 */
const { sql } = require('../../lib/db');

module.exports = async function handler(req, res) {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (key !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = [];

  try {
    // ── analytics_events ──
    await sql`CREATE TABLE IF NOT EXISTS analytics_events (
      id SERIAL PRIMARY KEY,
      event VARCHAR(100) NOT NULL,
      properties JSONB DEFAULT '{}',
      session_id VARCHAR(100),
      user_agent TEXT DEFAULT '',
      ip VARCHAR(50) DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    )`;
    results.push('✅ analytics_events created');

    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at)`;
    results.push('✅ analytics_events indexes created');

    // Missing columns that event.js and funnel.js need
    await sql`ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS is_mobile BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS referer VARCHAR(255) DEFAULT ''`;
    results.push('✅ analytics_events columns is_mobile + referer added');

    // ── boost columns on ads ──
    await sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS boost_level VARCHAR(20) DEFAULT NULL`;
    await sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMP DEFAULT NULL`;
    results.push('✅ ads boost columns added');

    // ── stores ──
    await sql`CREATE TABLE IF NOT EXISTS stores (
      id SERIAL PRIMARY KEY,
      owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      slug VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(120) NOT NULL,
      description TEXT DEFAULT '',
      logo_url TEXT DEFAULT '',
      whatsapp VARCHAR(30) DEFAULT '',
      plan VARCHAR(20) DEFAULT 'basic',
      status VARCHAR(20) DEFAULT 'active',
      plan_expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`;
    results.push('✅ stores table created');

    // ── reviews ──
    await sql`CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      ad_public_id VARCHAR(60),
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    )`;
    results.push('✅ reviews table created');

    return res.status(200).json({ success: true, results });
  } catch (err) {
    results.push('❌ Error: ' + err.message);
    return res.status(500).json({ success: false, results, error: err.message });
  }
};
