const { sql } = require('../../lib/db');
const { cors } = require('../../lib/cors');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ success: false, message: 'Slug requerido.' });

    const stores = await sql`
      SELECT s.*, u.email as owner_email
      FROM stores s
      LEFT JOIN users u ON u.id = s.owner_id
      WHERE s.slug = ${slug} AND s.status = 'active'
    `;

    if (!stores.length) return res.status(404).json({ success: false, message: 'Tienda no encontrada.' });

    const store = stores[0];

    // Get active ads for this store owner
    const ads = await sql`
      SELECT public_id, title, description, category, price, location, images, featured, boost_level, created_at
      FROM ads
      WHERE owner_id = ${store.owner_id} AND status = 'active'
      ORDER BY featured DESC, created_at DESC
      LIMIT 50
    `;

    // Get store rating from reviews
    const ratingData = await sql`
      SELECT AVG(rating)::NUMERIC(3,1) as avg_rating, COUNT(*) as total_reviews
      FROM reviews WHERE seller_id = ${store.owner_id}
    `;

    return res.status(200).json({
      success: true,
      store: {
        ...store,
        avg_rating: Number(ratingData[0]?.avg_rating || 0),
        total_reviews: Number(ratingData[0]?.total_reviews || 0),
      },
      ads,
    });
  } catch (error) {
    console.error('Get store error:', error);
    return res.status(500).json({ success: false, message: 'Error al cargar tienda.' });
  }
};
