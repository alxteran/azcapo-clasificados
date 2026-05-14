console.log('Token usado (primeros 15 caracteres):', process.env.MP_ACCESS_TOKEN?.slice(0,15));
console.log('Payload enviado:', JSON.stringify(preference, null, 2));

const { createPreference } = require('../../lib/mercadopago');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Payload mínimo para pruebas
    const preference = {
      items: [
        {
          title: 'Anuncio Premium',
          quantity: 1,
          currency_id: 'MXN',
          unit_price: 99  // Cambia según tu precio real
        }
      ],
      back_urls: {
        success: 'https://project-cle17.vercel.app//pago-exitoso',
        failure: 'https://project-cle17.vercel.app//pago-fallido',
        pending: 'https://project-cle17.vercel.app//pago-pendiente'
      },
      auto_return: 'approved'
    };

    // Opcional: si necesitas external_reference (para vincular con el anuncio)
    if (req.body.external_reference) {
      preference.external_reference = req.body.external_reference;
    }

    const result = await createPreference(preference);

    return res.status(200).json({
      id: result.id,
      init_point: result.init_point
    });
  } catch (error) {
    console.error('Error create-preference:', error);
    return res.status(500).json({ error: error.message });
  }
};