const { sql } = require('../../lib/db');
const { cors } = require('../../lib/cors');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).end();

  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [funnelData, dailyVolume, levelBreakdown, mobileVsDesktop, recentEvents] = await Promise.all([

      // === UPSELL FUNNEL ===
      // Shows: shown → click → initiated (payment redirect)
      sql`
        SELECT
          COUNT(*) FILTER (WHERE event = 'upsell_shown')       AS shown,
          COUNT(*) FILTER (WHERE event = 'upsell_level_click') AS clicked,
          COUNT(*) FILTER (WHERE event = 'boost_initiated')    AS initiated,
          COUNT(*) FILTER (WHERE event = 'upsell_skip')        AS skipped,
          COUNT(*) FILTER (WHERE event = 'upsell_backdrop')    AS backdrop_closed,
          COUNT(*) FILTER (WHERE event = 'ad_published')       AS ads_published
        FROM analytics_events
        WHERE created_at > NOW() - INTERVAL '30 days'
      `,

      // === DAILY UPSELL VOLUME (last 14 days) ===
      sql`
        SELECT
          DATE(created_at)                                           AS day,
          COUNT(*) FILTER (WHERE event = 'upsell_shown')            AS shown,
          COUNT(*) FILTER (WHERE event = 'upsell_level_click')      AS clicked,
          COUNT(*) FILTER (WHERE event = 'boost_initiated')         AS initiated
        FROM analytics_events
        WHERE created_at > NOW() - INTERVAL '14 days'
          AND event IN ('upsell_shown','upsell_level_click','boost_initiated')
        GROUP BY DATE(created_at)
        ORDER BY day DESC
      `,

      // === BOOST LEVEL BREAKDOWN ===
      // Which level do users click most?
      sql`
        SELECT
          properties->>'level' AS level,
          COUNT(*)              AS clicks
        FROM analytics_events
        WHERE event = 'upsell_level_click'
          AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY level
        ORDER BY clicks DESC
      `,

      // === MOBILE vs DESKTOP ===
      sql`
        SELECT
          is_mobile,
          COUNT(*) FILTER (WHERE event = 'upsell_shown')       AS shown,
          COUNT(*) FILTER (WHERE event = 'boost_initiated')    AS initiated
        FROM analytics_events
        WHERE created_at > NOW() - INTERVAL '30 days'
          AND event IN ('upsell_shown','boost_initiated')
        GROUP BY is_mobile
      `,

      // === RECENT EVENTS (last 20 for live feed) ===
      sql`
        SELECT event, properties, is_mobile, created_at
        FROM analytics_events
        ORDER BY created_at DESC
        LIMIT 20
      `,
    ]);

    // Calculate conversion rates
    const f = funnelData[0];
    const shown     = Number(f?.shown     || 0);
    const clicked   = Number(f?.clicked   || 0);
    const initiated = Number(f?.initiated || 0);
    const skipped   = Number(f?.skipped   || 0);
    const published = Number(f?.ads_published || 0);

    const clickRate     = shown     > 0 ? ((clicked   / shown)     * 100).toFixed(1) : '0.0';
    const initiateRate  = clicked   > 0 ? ((initiated / clicked)   * 100).toFixed(1) : '0.0';
    const overallRate   = shown     > 0 ? ((initiated / shown)     * 100).toFixed(1) : '0.0';
    const publishToShow = published > 0 ? ((shown     / published)  * 100).toFixed(1) : '0.0';

    return res.status(200).json({
      success: true,
      period: '30 days',
      funnel: {
        ads_published:   published,
        upsell_shown:    shown,
        upsell_clicked:  clicked,
        payment_started: initiated,
        skipped,
        rates: {
          publish_to_upsell_shown_pct: publishToShow,   // % of publishers who see the modal
          upsell_click_through_pct:    clickRate,        // % who click a level
          click_to_payment_pct:        initiateRate,     // % who go to MercadoPago
          overall_conversion_pct:      overallRate,      // shown → payment (the KEY metric)
        },
        benchmark: '3% overall conversion = piloto exitoso',
      },
      daily_volume: dailyVolume,
      level_breakdown: levelBreakdown,   // which tier users prefer
      device_breakdown: mobileVsDesktop, // mobile vs desktop behavior
      recent_events: recentEvents,       // live activity feed
    });

  } catch (err) {
    console.error('Funnel metrics error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
