const { sql } = require('../../../lib/db');
const { authMiddleware } = require('../../../lib/auth');
const { cors } = require('../../../lib/cors');

const FREE_DAYS = 15;
const PREMIUM_DAYS = 30;
const FREE_MAX_RENEWALS = 3;

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = authMiddleware(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Debes iniciar sesión.' });
    }

    const { id } = req.query;
    const ads = await sql`SELECT * FROM ads WHERE public_id = ${id}`;
    if (ads.length === 0) {
      return res.status(404).json({ success: false, message: 'Anuncio no encontrado.' });
    }

    const ad = ads[0];
    if (ad.owner_id !== user.userId) {
      return res.status(403).json({ success: false, message: 'No puedes renovar este anuncio.' });
    }

    const isPremium = ad.type === 'premium';
    const maxR = ad.max_renewals != null ? ad.max_renewals : (isPremium ? 999999 : FREE_MAX_RENEWALS);
    const currentCount = ad.renewal_count || 0;

    if (currentCount >= maxR) {
      return res.status(400).json({ success: false, message: 'Has agotado tus renovaciones para este anuncio.' });
    }

    const vigenciaDays = isPremium ? PREMIUM_DAYS : FREE_DAYS;
    const newExpiry = new Date(Date.now() + vigenciaDays * 86400000).toISOString();

    await sql`
      UPDATE ads SET
        expires_at = ${newExpiry},
        renewal_count = ${currentCount + 1},
        status = 'active'
      WHERE public_id = ${id}
    `;

    const remaining = maxR >= 999999 ? 'ilimitadas' : `${maxR - currentCount - 1}`;
    return res.status(200).json({
      success: true,
      message: `¡Anuncio renovado por ${vigenciaDays} días más! Renovaciones restantes: ${remaining}.`,
    });
  } catch (error) {
    console.error('Renew ad error:', error);
    return res.status(500).json({ success: false, message: 'Error al renovar anuncio.' });
  }
};
