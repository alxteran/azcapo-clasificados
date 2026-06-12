const { sql } = require('../../../lib/db');
const { authMiddleware } = require('../../../lib/auth');
const { cors } = require('../../../lib/cors');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;

  const { id } = req.query;

  if (req.method === 'GET') return handleGet(req, res, id);
  if (req.method === 'PUT') return handleUpdate(req, res, id);
  if (req.method === 'DELETE') return handleDelete(req, res, id);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function handleGet(req, res, id) {
  try {
    const ads = await sql`SELECT * FROM ads WHERE public_id = ${id} AND status != 'deleted'`;
    if (ads.length === 0) {
      return res.status(404).json({ success: false, message: 'Anuncio no encontrado.' });
    }
    const ad = ads[0];
    ad.images = typeof ad.images === 'string' ? JSON.parse(ad.images) : ad.images;
    ad.contact = typeof ad.contact === 'string' ? JSON.parse(ad.contact) : ad.contact;

    return res.status(200).json({ success: true, ad });
  } catch (error) {
    console.error('Get ad error:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener anuncio.' });
  }
}

async function handleUpdate(req, res, id) {
  try {
    const user = authMiddleware(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Debes iniciar sesión para editar.' });
    }

    const ads = await sql`SELECT * FROM ads WHERE public_id = ${id} AND status != 'deleted'`;
    if (ads.length === 0) {
      return res.status(404).json({ success: false, message: 'Anuncio no encontrado.' });
    }
    if (ads[0].owner_id !== user.userId) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para editar este anuncio.' });
    }

    const { title, description, category, price, location, images, latitude, longitude } = req.body || {};

    if (!title || !description || !category || !location) {
      return res.status(400).json({ success: false, message: 'Todos los campos obligatorios deben completarse.' });
    }

    const lat = latitude != null ? Number(latitude) : null;
    const lng = longitude != null ? Number(longitude) : null;

    const result = await sql`
      UPDATE ads SET
        title = ${title},
        description = ${description},
        category = ${category},
        price = ${Number(price) || 0},
        location = ${location},
        images = ${JSON.stringify((images || []).slice(0, 3))},
        latitude = ${lat},
        longitude = ${lng}
      WHERE public_id = ${id}
      RETURNING *
    `;

    const ad = result[0];
    ad.images = typeof ad.images === 'string' ? JSON.parse(ad.images) : ad.images;
    ad.contact = typeof ad.contact === 'string' ? JSON.parse(ad.contact) : ad.contact;

    return res.status(200).json({ success: true, ad, message: 'Anuncio actualizado correctamente.' });
  } catch (error) {
    console.error('Update ad error:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar el anuncio.' });
  }
}

async function handleDelete(req, res, id) {
  try {
    const user = authMiddleware(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Debes iniciar sesión.' });
    }

    const ads = await sql`SELECT * FROM ads WHERE public_id = ${id}`;
    if (ads.length === 0) {
      return res.status(404).json({ success: false, message: 'Anuncio no encontrado.' });
    }
    if (ads[0].owner_id !== user.userId) {
      return res.status(403).json({ success: false, message: 'No puedes eliminar este anuncio.' });
    }

    await sql`UPDATE ads SET status = 'deleted' WHERE public_id = ${id}`;
    return res.status(200).json({ success: true, message: 'Anuncio eliminado.' });
  } catch (error) {
    console.error('Delete ad error:', error);
    return res.status(500).json({ success: false, message: 'Error al eliminar anuncio.' });
  }
}
