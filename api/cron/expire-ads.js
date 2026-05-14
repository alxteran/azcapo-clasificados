const { sql } = require('../../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Verify cron secret
  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await sql`
      UPDATE ads SET status = 'suspended'
      WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < NOW()
      RETURNING public_id, title
    `;

    console.log(`Cron: Suspended ${result.length} expired ads`);

    return res.status(200).json({
      success: true,
      suspended: result.length,
      ads: result.map(a => ({ id: a.public_id, title: a.title })),
    });
  } catch (error) {
    console.error('Cron expire error:', error);
    return res.status(500).json({ success: false, message: 'Error en cron de expiración.' });
  }
};
