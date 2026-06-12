/**
 * lib/mailer.js — Email helper using Resend
 * Requires env var: RESEND_API_KEY
 */
const { Resend } = require('resend');

let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

/**
 * Send an HTML email.
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.from]   defaults to reports@azcapoclasificados.com.mx
 */
async function sendEmail({ to, subject, html, from }) {
  const resend = getResend();
  const result = await resend.emails.send({
    from: from || 'Azcapo Clasificados <reports@azcapoclasificados.com.mx>',
    to,
    subject,
    html,
  });
  return result;
}

module.exports = { sendEmail };
