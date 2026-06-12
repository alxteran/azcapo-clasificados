/**
 * lib/mailer.js — Email helper using Resend
 *
 * Required env var in Vercel:
 *   RESEND_API_KEY = re_xxxxxxxxxxxxxxxx
 *
 * Sender: until you verify azcapoclasificados.com.mx in Resend's dashboard,
 * emails go out from onboarding@resend.dev — they still deliver fine.
 * To use your own domain: resend.com → Domains → Add Domain.
 */
const { Resend } = require('resend');

let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

/**
 * Send an HTML email via Resend.
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.from]  defaults to onboarding@resend.dev until domain is verified
 */
async function sendEmail({ to, subject, html, from }) {
  const resend = getResend();
  const result = await resend.emails.send({
    from: from || 'Azcapo Clasificados <onboarding@resend.dev>',
    to,
    subject,
    html,
  });
  return result;
}

module.exports = { sendEmail };
