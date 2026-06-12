const { sql } = require('../../lib/db');
const { cors } = require('../../lib/cors');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).end();

  // Simple admin guard via secret header
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [mau, conversion, adsThisMonth, featuredAds, activeStores, totalRevenue, recentReviews] = await Promise.all([
      // MAU — users who have posted at least 1 ad in the last 30 days
      sql`SELECT COUNT(DISTINCT owner_id) as count FROM ads WHERE created_at > NOW() - INTERVAL '30 days'`,
      // Total vs featured ads (for conversion rate)
      sql`SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE featured = true) as featured
          FROM ads WHERE status = 'active'`,
      // Ads published in last 30 days
      sql`SELECT COUNT(*) as count FROM ads WHERE created_at > NOW() - INTERVAL '30 days'`,
      // Active featured ads by boost level
      sql`SELECT boost_level, COUNT(*) as count FROM ads WHERE featured = true AND status = 'active' GROUP BY boost_level`,
      // Active stores by plan
      sql`SELECT plan, COUNT(*) as count FROM stores WHERE status = 'active' GROUP BY plan`,
      // Total revenue from approved payments
      sql`SELECT SUM(amount) as total FROM payments WHERE status = 'approved'`,
      // Recent reviews stats
      sql`SELECT AVG(rating)::NUMERIC(3,1) as avg_rating, COUNT(*) as total FROM reviews`,
    ]);

    const totalAds = Number(conversion[0]?.total || 0);
    const featuredCount = Number(conversion[0]?.featured || 0);
    const conversionRate = totalAds > 0 ? ((featuredCount / totalAds) * 100).toFixed(1) : '0.0';

    // Calculate MRR from active stores
    const storePrices = { basic: 200, plus: 450, pro: 900 };
    const mrr = (activeStores || []).reduce((sum, s) => sum + (storePrices[s.plan] || 0) * Number(s.count), 0);

    return res.status(200).json({
      success: true,
      metrics: {
        mau: Number(mau[0]?.count || 0),
        conversion_rate_pct: conversionRate,
        ads_this_month: Number(adsThisMonth[0]?.count || 0),
        featured_by_level: featuredAds,
        active_stores: activeStores,
        mrr_mxn: mrr,
        total_revenue_mxn: Number(totalRevenue[0]?.total || 0),
        avg_seller_rating: Number(recentReviews[0]?.avg_rating || 0),
        total_reviews: Number(recentReviews[0]?.total || 0),
      }
    });
  } catch (error) {
    console.error('Metrics error:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener métricas.' });
  }
};
