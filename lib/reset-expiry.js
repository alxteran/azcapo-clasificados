/**
 * One-time script: Reset all current ads to expire in 7 days.
 * Converts all ads to free/active.
 * 
 * Usage: node lib/reset-expiry.js
 * Requires DATABASE_URL in .env.local
 */

const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) {
      const value = vals.join('=').trim().replace(/^"(.*)"$/, '$1');
      if (value) process.env[key.trim()] = value;
    }
  });
}

// Also try .env.prod.local
const prodEnvPath = path.join(__dirname, '..', '.env.prod.local');
if (fs.existsSync(prodEnvPath)) {
  const envContent = fs.readFileSync(prodEnvPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) {
      const value = vals.join('=').trim().replace(/^"(.*)"$/, '$1');
      if (value && !process.env[key.trim()]) process.env[key.trim()] = value;
    }
  });
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found. Set it in .env.local');
  process.exit(1);
}

const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function resetExpiry() {
  const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000).toISOString();

  console.log(`🔧 Resetting all ads to expire at: ${sevenDaysFromNow}`);

  const result = await sql`
    UPDATE ads
    SET expires_at = ${sevenDaysFromNow},
        type = 'free',
        status = 'active',
        max_renewals = 3
    WHERE status IN ('active', 'pending_payment', 'suspended')
    RETURNING public_id, title, expires_at
  `;

  console.log(`✅ Updated ${result.length} ads:`);
  result.forEach(ad => {
    console.log(`  - ${ad.title} → expires ${ad.expires_at}`);
  });
}

resetExpiry().catch(err => {
  console.error('❌ Reset failed:', err);
  process.exit(1);
});
