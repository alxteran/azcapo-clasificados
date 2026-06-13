/**
 * api/admin/ping.js — diagnóstico temporal
 * GET /api/admin/ping?key=TU_KEY
 * Devuelve si la key coincide con CRON_SECRET (sin revelar el valor real)
 */
module.exports = async function handler(req, res) {
  const provided = req.headers['x-admin-key'] || req.query.key || '';
  const secret   = process.env.CRON_SECRET || '';

  // Seguro: solo revela longitudes y match, nunca el valor real
  return res.status(200).json({
    match:           provided === secret,
    provided_length: provided.length,
    secret_length:   secret.length,
    secret_preview:  secret ? secret.substring(0, 4) + '****' : '(vacío)',
    provided_preview: provided ? provided.substring(0, 4) + '****' : '(vacío)',
  });
};
