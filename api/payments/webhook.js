const { sql } = require('../../lib/db');
const { getPayment } = require('../../lib/mercadopago');

const PREMIUM_DAYS = 30;

module.exports = async function handler(req, res) {
  // Webhooks are always POST from MercadoPago
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { type, data } = req.body || {};

    // MercadoPago sends different notification types; we only care about payments
    if (type !== 'payment' || !data?.id) {
      return res.status(200).json({ received: true });
    }

    // Fetch payment details from MercadoPago
    const payment = await getPayment(data.id);

    if (!payment || !payment.external_reference) {
      return res.status(200).json({ received: true, note: 'No external_reference' });
    }

    const adPublicId = payment.external_reference;
    const mpStatus = payment.status; // approved, rejected, pending, etc.

    // Update payment record
    await sql`
      UPDATE payments SET
        mp_payment_id = ${String(data.id)},
        status = ${mpStatus},
        updated_at = NOW()
      WHERE ad_public_id = ${adPublicId}
      AND status = 'pending'
    `;

    // If approved, activate the premium ad
    if (mpStatus === 'approved') {
      const newExpiry = new Date(Date.now() + PREMIUM_DAYS * 86400000).toISOString();
      await sql`
        UPDATE ads SET
          status = 'active',
          type = 'premium',
          featured = true,
          expires_at = ${newExpiry}
        WHERE public_id = ${adPublicId}
      `;
      console.log(`Payment approved for ad ${adPublicId}`);
    } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
      // Mark ad as rejected so user can retry
      await sql`
        UPDATE ads SET status = 'payment_failed' WHERE public_id = ${adPublicId} AND status = 'pending_payment'
      `;
      console.log(`Payment ${mpStatus} for ad ${adPublicId}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Always return 200 to MercadoPago to avoid retries on our errors
    return res.status(200).json({ received: true, error: 'Internal processing error' });
  }
};
