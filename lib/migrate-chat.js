/**
 * Migrate Chat Tables — Run once to add chat tables to existing DB.
 * Usage: node lib/migrate-chat.js
 *
 * Requires DATABASE_URL environment variable.
 */
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
}

const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('🔧 Creating chat tables...');

  // Conversations table: one row per buyer-ad pair
  await sql`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id SERIAL PRIMARY KEY,
      ad_public_id VARCHAR(60) NOT NULL,
      buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      last_message_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(ad_public_id, buyer_id)
    )
  `;

  // Messages table: individual messages within a conversation
  await sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER REFERENCES chat_conversations(id) ON DELETE CASCADE,
      sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      read BOOLEAN DEFAULT FALSE
    )
  `;

  // Indexes for performance
  await sql`
    CREATE INDEX IF NOT EXISTS idx_chat_conversations_ad
    ON chat_conversations(ad_public_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_conv
    ON chat_messages(conversation_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_chat_conversations_buyer
    ON chat_conversations(buyer_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_chat_conversations_seller
    ON chat_conversations(seller_id)
  `;

  console.log('✅ Chat tables created successfully!');
  console.log('');
  console.log('Tables created:');
  console.log('  - chat_conversations (id, ad_public_id, buyer_id, seller_id, created_at, last_message_at)');
  console.log('  - chat_messages      (id, conversation_id, sender_id, text, created_at, read)');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
