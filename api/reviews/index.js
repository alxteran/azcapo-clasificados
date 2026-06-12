const { sql } = require('../../lib/db');
const { authMiddleware } = require('../../lib/auth');
const { cors } = require('../../lib/cors');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handleCreate(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function handleGet(req, res) {
  try {
    const { seller_id, ad_public_id } = req.query;
    if (!seller_id && !ad_public_id) {
      return res.status(400).json({ success: false, message: 'seller_id o ad_public_id requerido.' });
    }

    let reviews;
    if (seller_id) {
      reviews = await sql`
        SELECT r.*, u.email as reviewer_email
        FROM reviews r
        LEFT JOIN users u ON u.id = r.reviewer_id
        WHERE r.seller_id = ${Number(seller_id)}
        ORDER BY r.created_at DESC
        LIMIT 50
      `;
    } else {
      reviews = await sql`
        SELECT r.*, u.email as reviewer_email
        FROM reviews r
        LEFT JOIN users u ON u.id = r.reviewer_id
        WHERE r.ad_public_id = ${ad_public_id}
        ORDER BY r.created_at DESC
      `;
    }

    const avgData = seller_id ? await sql`
      SELECT AVG(rating)::NUMERIC(3,1) as avg_rating, COUNT(*) as total
      FROM reviews WHERE seller_id = ${Number(seller_id)}
    ` : null;

    return res.status(200).json({
      success: true,
      reviews,
      avg_rating: avgData ? Number(avgData[0]?.avg_rating || 0) : null,
      total_reviews: avgData ? Number(avgData[0]?.total || 0) : null,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return res.status(500).json({ success: false, message: 'Error al cargar reseñas.' });
  }
}

async function handleCreate(req, res) {
  try {
    const user = authMiddleware(req);
    if (!user) return res.status(401).json({ success: false, message: 'Debes iniciar sesión para dejar una reseña.' });

    const { seller_id, ad_public_id, rating, comment } = req.body || {};

    if (!seller_id || !rating) {
      return res.status(400).json({ success: false, message: 'seller_id y rating son requeridos.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'El rating debe ser entre 1 y 5.' });
    }
    // Prevent self-review
    if (Number(seller_id) === user.userId) {
      return res.status(400).json({ success: false, message: 'No puedes reseñarte a ti mismo.' });
    }

    // Check for duplicate review on the same ad
    if (ad_public_id) {
      const dup = await sql`
        SELECT id FROM reviews
        WHERE reviewer_id = ${user.userId} AND ad_public_id = ${ad_public_id}
      `;
      if (dup.length > 0) {
        return res.status(400).json({ success: false, message: 'Ya dejaste una reseña para este anuncio.' });
      }
    }

    const review = await sql`
      INSERT INTO reviews (reviewer_id, seller_id, ad_public_id, rating, comment)
      VALUES (${user.userId}, ${Number(seller_id)}, ${ad_public_id || null}, ${Number(rating)}, ${comment || ''})
      RETURNING *
    `;

    return res.status(201).json({ success: true, review: review[0], message: '¡Gracias por tu reseña!' });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ success: false, message: 'Error al crear reseña.' });
  }
}
