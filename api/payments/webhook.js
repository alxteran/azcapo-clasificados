const { sql } = require('../../lib/db');
const { getPayment } = require('../../lib/mercadopago');

// Maps boost_level → number of days
const BOOST_DAYS = {
  basic: 3,
  featured: 7,
  premium: 7,
  store_basic: 30,
  store_plus: 30,
  store_pro: 30,
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { type, data } = req.body || {};

    if (type !== 'payment' || !data?.id) {
      return res.status(200).json({ received: true });
    }

    const payment = await getPayment(data.id);

    if (!payment || !payment.external_reference) {
      return res.status(200).json({ received: true, note: 'No external_reference' });
    }

    const externalRef = payment.external_reference; // e.g. "ad_xxx:basic" or "store:slug:store_plus"
    const mpStatus = payment.status;

    // Parse external_reference
    const isStore = externalRef.startsWith('store:');
    const parts = externalRef.split(':');

    if (isStore) {
      // store:slug:plan
      const storeSlug = parts[1];
      const plan = parts[2];
      const days = BOOST_DAYS[plan] || 30;

      if (mpStatus === 'approved') {
        const newExpiry = new Date(Date.now() + days * 86400000).toISOString();
        await sql`
          UPDATE stores SET
            status = 'active',
            plan = ${plan.replace('store_', '')},
            plan_expires_at = ${newExpiry},
            updated_at = NOW()
          WHERE slug = ${storeSlug}
        `;
        console.log(`Store subscription approved for ${storeSlug} plan=${plan}`);
      }
    } else {
      // ad_public_id:boost_level
      const adPublicId = parts[0];
      const boostLevel = parts[1];
      const days = BOOST_DAYS[boostLevel] || 7;

      // Update payment record
      await sql`
        UPDATE payments SET
          mp_payment_id = ${String(data.id)},
          status = ${mpStatus},
          updated_at = NOW()
        WHERE ad_public_id = ${adPublicId}
        AND status = 'pending'
      `;

      if (mpStatus === 'approved') {
        const newExpiry = new Date(Date.now() + days * 86400000).toISOString();
        await sql`
          UPDATE ads SET
            status = 'active',
            type = 'premium',
            featured = true,
            boost_level = ${boostLevel},
            boost_expires_at = ${newExpiry},
            expires_at = ${newExpiry}
          WHERE public_id = ${adPublicId}
        `;
        console.log(`Boost approved: ad=${adPublicId} level=${boostLevel} days=${days}`);
      } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
        await sql`
          UPDATE ads SET status = 'active'
          WHERE public_id = ${adPublicId} AND status = 'pending_payment'
        `;
        console.log(`Payment ${mpStatus} for ad ${adPublicId}`);
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ received: true, error: 'Internal processing error' });
  }
};
