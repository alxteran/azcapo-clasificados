const { createPreference } = require('../../lib/mercadopago');
const { sql } = require('../../lib/db');
const { authMiddleware } = require('../../lib/auth');

// Pricing table — matches the 3-level boost system
const BOOST_LEVELS = {
  basic:     { label: 'Básico',    price: 80,  days: 3 },
  featured:  { label: 'Destacado', price: 150, days: 7 },
  premium:   { label: 'Premium',   price: 280, days: 7 },
  // Store subscriptions
  store_basic: { label: 'Tienda Básica', price: 200, days: 30 },
  store_plus:  { label: 'Tienda Plus',   price: 450, days: 30 },
  store_pro:   { label: 'Tienda Pro',    price: 900, days: 30 },
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.azcapoclasificados.com.mx';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = authMiddleware(req);
  if (!user) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }

  try {
    const { boost_level, ad_public_id, store_slug, payment_type = 'boost' } = req.body || {};

    if (!boost_level || !BOOST_LEVELS[boost_level]) {
      return res.status(400).json({ error: 'Nivel de boost inválido' });
    }

    const level = BOOST_LEVELS[boost_level];
    const externalRef = payment_type === 'store' ? `store:${store_slug}:${boost_level}` : `${ad_public_id}:${boost_level}`;

    const preference = {
      items: [
        {
          title: level.label + (ad_public_id ? ' — Azcapo Clasificados' : ' — Tienda Azcapo'),
          quantity: 1,
          currency_id: 'MXN',
          unit_price: level.price,
        }
      ],
      external_reference: externalRef,
      back_urls: {
        success: `${BASE_URL}/#/pago-exitoso`,
        failure: `${BASE_URL}/#/pago-fallido`,
        pending: `${BASE_URL}/#/pago-pendiente`,
      },
      auto_return: 'approved',
    };

    // Register pending payment in DB
    if (ad_public_id) {
      await sql`
        INSERT INTO payments (ad_public_id, status, amount)
        VALUES (${ad_public_id}, 'pending', ${level.price})
        ON CONFLICT DO NOTHING
      `;
    }

    const result = await createPreference(preference);

    return res.status(200).json({
      id: result.id,
      init_point: result.init_point,
      level: boost_level,
      price: level.price,
      days: level.days,
    });
  } catch (error) {
    console.error('Error create-preference:', error);
    return res.status(500).json({ error: error.message });
  }
};