const fs = require('fs'), path = require('path');
['.env.local','.env.production','.env.secret.tmp'].forEach(f => {
  const p = path.join(__dirname, '..', f);
  if (fs.existsSync(p)) {
    fs.readFileSync(p, 'utf-8').split('\n').forEach(l => {
      const [k, ...v] = l.split('=');
      if (k && v.length && !process.env[k.trim()]) {
        let val = v.join('=').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        process.env[k.trim()] = val;
      }
    });
  }
});

const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function check() {
  const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='ads' AND column_name IN ('latitude','longitude') ORDER BY column_name`;
  console.log('✅ Columns found:', JSON.stringify(cols, null, 2));

  const sample = await sql`SELECT public_id, latitude, longitude FROM ads LIMIT 3`;
  console.log('📋 Sample ads:', JSON.stringify(sample, null, 2));
}

check().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
