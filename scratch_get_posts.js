const fs = require('fs');
const path = require('path');

// Manually parse env file
const envPath = path.join(__dirname, '.env.production.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  });
}

const { getSQL } = require('./lib/db.js');

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let limit = 20;
  let jsonMode = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' || args[i] === '-l') {
      const parsedLimit = parseInt(args[i + 1], 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
      i++; // Skip next argument as it was the value
    } else if (args[i] === '--json' || args[i] === '-j') {
      jsonMode = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: node scratch_get_posts.js [options]

Options:
  -l, --limit <number>  Number of posts to retrieve (default: 20)
  -j, --json            Output in raw JSON format (default: false, prints table)
  -h, --help            Display this help message
      `);
      process.exit(0);
    }
  }

  return { limit, jsonMode };
}

async function run() {
  const { limit, jsonMode } = parseArgs();

  try {
    const sql = getSQL();
    
    // Validate database connection configuration
    if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
      throw new Error('Database connection URL not found in environment variables.');
    }

    const rows = await sql`
      SELECT public_id, title, author_email, status, created_at 
      FROM blog_posts 
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `;

    if (rows.length === 0) {
      console.log('No posts found.');
      return;
    }

    if (jsonMode) {
      console.log(JSON.stringify(rows, null, 2));
    } else {
      console.log(`\n--- Showing latest ${rows.length} blog posts ---\n`);
      console.table(rows.map(row => ({
        ID: row.public_id,
        Title: row.title.length > 40 ? row.title.substring(0, 37) + '...' : row.title,
        Author: row.author_email,
        Status: row.status,
        'Created At': new Date(row.created_at).toLocaleString()
      })));
      console.log('\nUse --json to output raw JSON data.\n');
    }
  } catch (error) {
    console.error('Error fetching posts:', error.message || error);
    process.exit(1);
  }
}

run();

