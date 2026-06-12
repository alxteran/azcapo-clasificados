/**
 * Migration: Add latitude/longitude columns to ads table.
 * Usage: node lib/migrate-map.js
 *
 * Requires DATABASE_URL environment variable (loaded from .env.local).
 */

const fs = require('fs');
const path = require('path');

// Load env files (try .env.local first, then .env.production)
const envFiles = ['.env.local', '.env.production', '.env.secret.tmp'];
for (const file of envFiles) {
  const p = path.join(__dirname, '..', file);
  if (fs.existsSync(p)) {
    fs.readFileSync(p, 'utf-8').split('\n').forEach(line => {
      const [key, ...vals] = line.split('=');
      if (key && vals.length && !process.env[key.trim()]) {
        process.env[key.trim()] = vals.join('=').trim();
      }
    });
  }
}

const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('🗺️  Migrating: Adding latitude/longitude to ads table...');

  await sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION DEFAULT NULL`;
  console.log('  ✅ Column "latitude" added');

  await sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT NULL`;
  console.log('  ✅ Column "longitude" added');

  console.log('🎉 Migration complete!');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
