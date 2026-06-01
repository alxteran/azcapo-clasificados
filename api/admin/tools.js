const { sql } = require('../../lib/db');
const { cors } = require('../../lib/cors');

/**
 * GET /api/admin/tools?action=<action>
 *
 * Consolidated admin/maintenance endpoint to stay within Vercel Hobby's 12-function limit.
 * All actions require CRON_SECRET via Authorization header OR (for legacy actions) a query key.
 *
 * Actions:
 *   migrate-chat    → Create chat_conversations + chat_messages tables (idempotent)
 *   reset-expiry    → Reset all ads to expire in 7 days (one-time admin tool)
 *   dedup           → Remove duplicate ads by title
 */
module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const action = (req.query && req.query.action) || '';
  const authHeader = req.headers.authorization || '';
  const queryKey = req.query && req.query.key;
  const cronSecret = process.env.CRON_SECRET;

  // Authorize: Bearer token OR legacy query keys for backward compat
  const authorizedViaBearerToken = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const authorizedViaResetKey = queryKey === 'reset-expiry-2026';
  const authorizedViaDedupKey = queryKey === 'dedup-cleanup-2026';

  const isAuthorized =
    authorizedViaBearerToken ||
    (action === 'reset-expiry' && authorizedViaResetKey) ||
    (action === 'dedup' && authorizedViaDedupKey);

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (action === 'migrate-chat') {
    return handleMigrateChat(req, res);
  } else if (action === 'reset-expiry') {
    return handleResetExpiry(req, res);
  } else if (action === 'dedup') {
    return handleDedup(req, res);
  } else if (action === 'migrate-blog') {
    return handleMigrateBlog(req, res);
  } else if (action === 'approve-post') {
    return handleApprovePost(req, res);
  } else if (action === 'reject-post') {
    return handleRejectPost(req, res);
  } else {
    return res.status(400).json({
      error: 'Unknown action. Use: ?action=migrate-chat | reset-expiry | dedup | migrate-blog | approve-post | reject-post',
    });
  }
};

/** Create chat_conversations and chat_messages tables (idempotent via IF NOT EXISTS) */
async function handleMigrateChat(req, res) {
  try {
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
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_conversations_ad ON chat_conversations(ad_public_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_conversations_buyer ON chat_conversations(buyer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_conversations_seller ON chat_conversations(seller_id)`;

    return res.status(200).json({
      success: true,
      message: 'Chat tables created successfully. Tables: chat_conversations, chat_messages',
    });
  } catch (error) {
    console.error('migrate-chat error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/** Reset all active ads to expire in 7 days */
async function handleResetExpiry(req, res) {
  try {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000).toISOString();
    const result = await sql`
      UPDATE ads
      SET expires_at = ${sevenDaysFromNow},
          type = 'free',
          status = 'active',
          max_renewals = 3
      WHERE status IN ('active', 'pending_payment')
      RETURNING public_id, title, expires_at
    `;
    console.log(`Reset expiry: Updated ${result.length} ads to expire in 7 days`);
    return res.status(200).json({
      success: true,
      updated: result.length,
      newExpiry: sevenDaysFromNow,
      ads: result.map(a => ({ id: a.public_id, title: a.title, expiresAt: a.expires_at })),
    });
  } catch (error) {
    console.error('reset-expiry error:', error);
    return res.status(500).json({ success: false, message: 'Error al reiniciar expiración.' });
  }
}

/* ---- Blog Actions ---- */

/** Create blog_posts table (idempotent) */
async function handleMigrateBlog(req, res) {
  try {
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
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category)`;

    return res.status(200).json({
      success: true,
      message: 'blog_posts table created/verified successfully.'
    });
  } catch (error) {
    console.error('migrate-blog error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/** Approve a pending blog post */
async function handleApprovePost(req, res) {
  try {
    const postId = (req.query && req.query.postId) || '';
    if (!postId) return res.status(400).json({ error: 'postId query param is required.' });

    const result = await sql`
      UPDATE blog_posts
      SET status = 'approved', published_at = NOW()
      WHERE public_id = ${postId} AND status = 'pending'
      RETURNING public_id, title, status, published_at
    `;

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found or already processed.' });
    }
    return res.status(200).json({ success: true, post: result[0] });
  } catch (error) {
    console.error('approve-post error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/** Reject a pending blog post */
async function handleRejectPost(req, res) {
  try {
    const postId = (req.query && req.query.postId) || '';
    if (!postId) return res.status(400).json({ error: 'postId query param is required.' });

    const result = await sql`
      UPDATE blog_posts
      SET status = 'rejected'
      WHERE public_id = ${postId} AND status = 'pending'
      RETURNING public_id, title, status
    `;

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found or already processed.' });
    }
    return res.status(200).json({ success: true, post: result[0] });
  } catch (error) {
    console.error('reject-post error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/** Remove duplicate ads by title */
async function handleDedup(req, res) {
  try {
    const exactDups = await sql`
      WITH ranked AS (
        SELECT id, public_id, title,
          COALESCE(jsonb_array_length(images), 0) AS image_count,
          created_at,
          ROW_NUMBER() OVER (
            PARTITION BY LOWER(TRIM(title))
            ORDER BY COALESCE(jsonb_array_length(images), 0) DESC, created_at DESC
          ) AS rn
        FROM ads WHERE status = 'active'
      )
      DELETE FROM ads
      WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
      RETURNING id, public_id, title
    `;
    const fuzzyDups = await sql`
      WITH normalized AS (
        SELECT id, public_id, title,
          COALESCE(jsonb_array_length(images), 0) AS image_count,
          created_at,
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(LOWER(TRIM(title)), 'kyiocera|kyosera', 'kyocera', 'g'),
              'laser ', '', 'g'
            ),
            '\\s+', ' ', 'g'
          ) AS normalized_title
        FROM ads WHERE status = 'active'
      ),
      ranked AS (
        SELECT id, public_id, title, normalized_title,
          ROW_NUMBER() OVER (
            PARTITION BY normalized_title
            ORDER BY image_count DESC, created_at DESC
          ) AS rn
        FROM normalized
      )
      DELETE FROM ads
      WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
      RETURNING id, public_id, title
    `;
    const allDeleted = [...exactDups, ...fuzzyDups];
    console.log(`Dedup: Deleted ${allDeleted.length} duplicates`);
    return res.status(200).json({
      success: true,
      deleted: allDeleted.length,
      exact: exactDups.length,
      fuzzy: fuzzyDups.length,
      ads: allDeleted.map(a => ({ id: a.id, publicId: a.public_id, title: a.title })),
    });
  } catch (error) {
    console.error('dedup error:', error);
    return res.status(500).json({ success: false, message: 'Error al eliminar duplicados.' });
  }
}
