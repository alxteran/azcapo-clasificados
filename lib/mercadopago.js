const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

async function createPreference(preference) {
  const response = await fetch(
    'https://api.mercadopago.com/checkout/preferences',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error('MercadoPago Error:', data);
    throw new Error(data.message || 'MercadoPago error');
  }

  return data;
}

async function getPayment(id) {
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${id}`,
    {
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
      }
    }
  );

  return await response.json();
}

module.exports = {
  createPreference,
  getPayment
};