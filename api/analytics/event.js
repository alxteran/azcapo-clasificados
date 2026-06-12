const { sql } = require('../../lib/db');
const { cors } = require('../../lib/cors');

// Events we accept (whitelist to avoid noise)
const ALLOWED_EVENTS = [
  'upsell_shown',       // Modal appeared after publishing
  'upsell_level_click', // User clicked a boost level button
  'upsell_skip',        // User dismissed the modal
  'upsell_backdrop',    // User clicked backdrop to close
  'boost_initiated',    // Redirect to MercadoPago started
  'page_view',          // Generic page view
  'ad_detail_view',     // Opened an ad detail page
  'ad_published',       // User published a free ad
];

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { event, properties = {} } = req.body || {};

    if (!event || !ALLOWED_EVENTS.includes(event)) {
      return res.status(400).json({ error: 'Evento no reconocido' });
    }

    // Collect basic context from headers (no PII stored)
    const userAgent = req.headers['user-agent'] || '';
    const referer   = req.headers['referer'] || '';
    const isMobile  = /mobile|android|iphone/i.test(userAgent);

    await sql`
      INSERT INTO analytics_events (event, properties, is_mobile, referer, created_at)
      VALUES (
        ${event},
        ${JSON.stringify(properties)},
        ${isMobile},
        ${referer.substring(0, 255)},
        NOW()
      )
    `;

    return res.status(200).json({ ok: true });
  } catch (err) {
    // Silently fail — never block the user experience for analytics
    console.error('Analytics error:', err.message);
    return res.status(200).json({ ok: true });
  }
};
