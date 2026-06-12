/**
 * lib/mailer.js — Email helper using Nodemailer + Gmail SMTP
 *
 * Required env vars in Vercel:
 *   GMAIL_USER        = alxteran@gmail.com
 *   GMAIL_APP_PASSWORD = xxxx xxxx xxxx xxxx  (Google App Password, 16 chars)
 *
 * How to get an App Password:
 *   1. myaccount.google.com → Security → 2-Step Verification (must be ON)
 *   2. Security → App Passwords → Create → name it "Azcapo Clasificados"
 *   3. Copy the 16-character password → paste as GMAIL_APP_PASSWORD in Vercel
 */
const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return _transporter;
}

/**
 * Send an HTML email via Gmail SMTP.
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.from]  defaults to GMAIL_USER
 */
async function sendEmail({ to, subject, html, from }) {
  const transporter = getTransporter();

  const info = await transporter.sendMail({
    from: from || `"Azcapo Clasificados" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });

  return info;
}

module.exports = { sendEmail };
