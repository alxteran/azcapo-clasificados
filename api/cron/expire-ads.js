const { sql } = require('../../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Verify cron secret
  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Get IDs of expired ads before deleting (to clean up chat data)
    const expiredAds = await sql`
      SELECT public_id, title FROM ads
      WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < NOW()
    `;

    if (expiredAds.length > 0) {
      const expiredIds = expiredAds.map(a => a.public_id);

      // 2. Delete chat conversations for expired ads
      //    chat_messages are cascade-deleted by the FK ON DELETE CASCADE constraint
      for (const publicId of expiredIds) {
        await sql`
          DELETE FROM chat_conversations WHERE ad_public_id = ${publicId}
        `;
      }
      console.log(`Cron: Deleted chat data for ${expiredIds.length} expired ads`);

      // 3. Delete the expired ads themselves
      const result = await sql`
        DELETE FROM ads
        WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < NOW()
        RETURNING public_id, title
      `;

      console.log(`Cron: Deleted ${result.length} expired ads`);

      return res.status(200).json({
        success: true,
        deleted: result.length,
        chatsDeleted: expiredIds.length,
        ads: result.map(a => ({ id: a.public_id, title: a.title })),
      });
    }

    return res.status(200).json({
      success: true,
      deleted: 0,
      chatsDeleted: 0,
      ads: [],
    });
  } catch (error) {
    console.error('Cron expire error:', error);
    return res.status(500).json({ success: false, message: 'Error en cron de expiración.' });
  }
};
