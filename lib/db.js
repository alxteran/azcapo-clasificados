const { neon } = require('@neondatabase/serverless');

/* ---- Lazy connection (fixes Vercel serverless cold-start) ---- */
let _sql = null;

function getSQL() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL no está definida en las variables de entorno.');
    }
    _sql = neon(url);
  }
  return _sql;
}

// Tagged-template wrapper so callers can keep using sql`...` syntax unchanged
const sql = (strings, ...values) => getSQL()(strings, ...values);

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ads (
  id SERIAL PRIMARY KEY,
  public_id VARCHAR(60) UNIQUE NOT NULL,
  owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(60) NOT NULL,
  price NUMERIC(12,2) DEFAULT 0,
  location VARCHAR(255) NOT NULL,
  type VARCHAR(20) DEFAULT 'free',
  status VARCHAR(20) DEFAULT 'active',
  images JSONB DEFAULT '[]',
  contact JSONB DEFAULT '{}',
  featured BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP,
  renewal_count INTEGER DEFAULT 0,
  max_renewals INTEGER DEFAULT 3,
  latitude DOUBLE PRECISION DEFAULT NULL,
  longitude DOUBLE PRECISION DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  ad_public_id VARCHAR(60),
  mp_preference_id VARCHAR(255),
  mp_payment_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  amount NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
`;

async function initDB() {
  const statements = SCHEMA.split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await sql(stmt);
  }
}

module.exports = { sql, getSQL, initDB, SCHEMA };

