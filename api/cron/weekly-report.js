/**
 * api/cron/weekly-report.js
 *
 * Vercel Cron Job — runs every Monday at 9:00 AM México (15:00 UTC)
 * Schedule in vercel.json: "0 15 * * 1"
 *
 * Fetches live metrics from the DB and sends a beautiful HTML email
 * to alxteran@gmail.com with the weekly business summary.
 *
 * Protected by CRON_SECRET (Vercel sets Authorization header automatically).
 */
const { sql }       = require('../../lib/db');
const { sendEmail } = require('../../lib/mailer');

const RECIPIENT = 'alxteran@gmail.com';

module.exports = async function handler(req, res) {
  // Security: Vercel sends Bearer token, or we allow x-admin-key for manual triggers
  const authHeader = req.headers['authorization'] || '';
  const adminKey   = req.headers['x-admin-key']   || req.query.trigger;
  const isVercel   = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isManual   = adminKey === process.env.CRON_SECRET;

  if (!isVercel && !isManual) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // ── Fetch all data in parallel ──────────────────────────────────────────
    const [funnelData, adsThisWeek, activeBoosts, storeData, revenueData, reviewData, topLevel] = await Promise.all([
      // Upsell funnel — last 7 days
      sql`
        SELECT
          COUNT(*) FILTER (WHERE event = 'ad_published')       AS ads_published,
          COUNT(*) FILTER (WHERE event = 'upsell_shown')       AS upsell_shown,
          COUNT(*) FILTER (WHERE event = 'upsell_level_click') AS upsell_clicked,
          COUNT(*) FILTER (WHERE event = 'boost_initiated')    AS payment_started,
          COUNT(*) FILTER (WHERE event = 'upsell_skip')        AS skipped
        FROM analytics_events
        WHERE created_at > NOW() - INTERVAL '7 days'
      `,
      // Ads published this week
      sql`SELECT COUNT(*) AS count FROM ads WHERE created_at > NOW() - INTERVAL '7 days'`,
      // Active boosted ads
      sql`SELECT boost_level, COUNT(*) AS count FROM ads WHERE featured = true AND status = 'active' GROUP BY boost_level`,
      // Stores
      sql`SELECT plan, COUNT(*) AS count FROM stores WHERE status = 'active' GROUP BY plan`,
      // Total revenue (all time) + this week
      sql`
        SELECT
          COALESCE(SUM(amount), 0) AS total_all_time,
          COALESCE(SUM(amount) FILTER (WHERE created_at > NOW() - INTERVAL '7 days'), 0) AS total_this_week
        FROM payments WHERE status = 'approved'
      `,
      // Reviews
      sql`SELECT AVG(rating)::NUMERIC(3,1) AS avg_rating, COUNT(*) AS total FROM reviews`,
      // Top boost level this week
      sql`
        SELECT properties->>'level' AS level, COUNT(*) AS clicks
        FROM analytics_events
        WHERE event = 'upsell_level_click' AND created_at > NOW() - INTERVAL '7 days'
        GROUP BY level ORDER BY clicks DESC LIMIT 1
      `,
    ]);

    // ── Calculate metrics ───────────────────────────────────────────────────
    const f           = funnelData[0];
    const shown       = Number(f?.upsell_shown    || 0);
    const clicked     = Number(f?.upsell_clicked  || 0);
    const initiated   = Number(f?.payment_started || 0);
    const published   = Number(f?.ads_published   || 0);
    const skipped     = Number(f?.skipped         || 0);

    const clickRate   = shown   > 0 ? ((clicked   / shown)   * 100).toFixed(1) : '0.0';
    const overallRate = shown   > 0 ? ((initiated / shown)   * 100).toFixed(1) : '0.0';

    const storePrices = { basic: 200, plus: 450, pro: 900 };
    const mrr         = (storeData || []).reduce((s, st) => s + (storePrices[st.plan] || 0) * Number(st.count), 0);
    const totalStores = (storeData || []).reduce((s, st) => s + Number(st.count), 0);

    const revenueWeek    = Number(revenueData[0]?.total_this_week || 0);
    const revenueAllTime = Number(revenueData[0]?.total_all_time  || 0);
    const avgRating      = Number(reviewData[0]?.avg_rating       || 0);
    const totalReviews   = Number(reviewData[0]?.total            || 0);
    const newAds         = Number(adsThisWeek[0]?.count           || 0);

    const boostRows = (activeBoosts || []).map(b => `
      <tr>
        <td style="padding:8px 12px">${b.boost_level === 'basic' ? '▲ Básico' : b.boost_level === 'featured' ? '🔥 Destacado' : '⭐ Premium'}</td>
        <td style="padding:8px 12px;text-align:right;font-weight:700">${b.count}</td>
      </tr>
    `).join('');

    const topLevelName = topLevel[0]?.level
      ? { basic: '▲ Básico', featured: '🔥 Destacado', premium: '⭐ Premium' }[topLevel[0].level] || topLevel[0].level
      : 'N/A';

    const conversion      = parseFloat(overallRate);
    const statusEmoji     = conversion >= 5 ? '🟢' : conversion >= 3 ? '🟡' : '🔴';
    const statusText      = conversion >= 5 ? 'Excelente' : conversion >= 3 ? 'Objetivo cumplido' : 'Acumulando datos';
    const trendArrow      = revenueWeek > 0 ? '⬆️' : '→';

    const now       = new Date();
    const weekEnd   = now.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    const weekStart = new Date(now - 7 * 86400000).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
    const weekNum   = Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / (7 * 86400000));

    // ── Build email HTML ────────────────────────────────────────────────────
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reporte Semanal — Azcapo Clasificados</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">

<div style="max-width:600px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#1e1b4b,#4f46e5);padding:36px 40px 28px;color:white">
    <div style="font-size:13px;opacity:0.7;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Reporte Semanal · Semana ${weekNum}</div>
    <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;margin-bottom:4px">Azcapo Clasificados</div>
    <div style="font-size:14px;opacity:0.8">${weekStart} — ${weekEnd}</div>

    <!-- Hero conversion rate -->
    <div style="margin-top:28px;background:rgba(255,255,255,0.12);border-radius:16px;padding:20px 24px;display:flex;align-items:center;gap:20px">
      <div>
        <div style="font-size:48px;font-weight:900;line-height:1">${overallRate}%</div>
        <div style="font-size:13px;opacity:0.85;margin-top:4px">Conversión global boost</div>
      </div>
      <div style="margin-left:auto;text-align:right">
        <div style="font-size:24px">${statusEmoji}</div>
        <div style="font-size:13px;font-weight:700;opacity:0.9;margin-top:4px">${statusText}</div>
        <div style="font-size:11px;opacity:0.7">Benchmark: 3%</div>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div style="padding:32px 40px">

    <!-- KPI Row -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:28px">
      <div style="background:#f8fafc;border-radius:12px;padding:16px;border-top:3px solid #6366f1;text-align:center">
        <div style="font-size:24px;font-weight:800;color:#1e293b">${published}</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px">Anuncios publicados</div>
      </div>
      <div style="background:#f8fafc;border-radius:12px;padding:16px;border-top:3px solid #f59e0b;text-align:center">
        <div style="font-size:24px;font-weight:800;color:#1e293b">${initiated}</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px">Pagos iniciados</div>
      </div>
      <div style="background:#f8fafc;border-radius:12px;padding:16px;border-top:3px solid #10b981;text-align:center">
        <div style="font-size:24px;font-weight:800;color:#1e293b">${trendArrow} $${revenueWeek.toLocaleString('es-MX')}</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px">Ingresos esta semana</div>
      </div>
    </div>

    <!-- Funnel -->
    <div style="margin-bottom:28px">
      <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:14px">🔽 Embudo de conversión (7 días)</div>

      ${[
        { label: 'Publicaron', value: published, color: '#6366f1' },
        { label: 'Vieron modal', value: shown, color: '#0ea5e9' },
        { label: 'Eligieron nivel', value: clicked, color: '#f59e0b' },
        { label: 'Iniciaron pago', value: initiated, color: '#10b981' },
      ].map(s => {
        const pct = Math.round((s.value / Math.max(published, 1)) * 100);
        return `
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:13px;color:#475569">${s.label}</span>
            <span style="font-size:13px;font-weight:700;color:#1e293b">${s.value}</span>
          </div>
          <div style="background:#f1f5f9;border-radius:6px;height:8px;overflow:hidden">
            <div style="background:${s.color};height:100%;width:${pct}%;border-radius:6px"></div>
          </div>
        </div>`;
      }).join('')}

      <div style="background:#f8fafc;border-radius:10px;padding:12px 16px;margin-top:14px;font-size:13px;color:#64748b">
        Click-through: <strong style="color:#1e293b">${clickRate}%</strong> ·
        Omitieron modal: <strong style="color:#1e293b">${skipped}</strong> ·
        Nivel más elegido: <strong style="color:#1e293b">${topLevelName}</strong>
      </div>
    </div>

    <!-- Revenue & Stores -->
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:14px;padding:20px 24px;margin-bottom:28px">
      <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#16a34a;margin-bottom:14px">💰 Ingresos y Tiendas</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>
          <div style="font-size:11px;color:#4ade80;text-transform:uppercase;letter-spacing:0.5px">MRR Tiendas</div>
          <div style="font-size:28px;font-weight:800;color:#15803d">$${mrr.toLocaleString('es-MX')}<span style="font-size:13px;font-weight:400;color:#4ade80"> MXN/mes</span></div>
        </div>
        <div>
          <div style="font-size:11px;color:#4ade80;text-transform:uppercase;letter-spacing:0.5px">Ingresos totales</div>
          <div style="font-size:28px;font-weight:800;color:#15803d">$${revenueAllTime.toLocaleString('es-MX')}<span style="font-size:13px;font-weight:400;color:#4ade80"> MXN</span></div>
        </div>
      </div>
      <div style="margin-top:12px;font-size:13px;color:#166534">
        ${totalStores} tienda${totalStores !== 1 ? 's' : ''} activa${totalStores !== 1 ? 's' : ''} ·
        ${avgRating > 0 ? `Rating vendedores: ⭐ ${avgRating}/5 (${totalReviews} reseñas)` : 'Sin reseñas aún'}
      </div>
    </div>

    <!-- Boosts activos -->
    ${activeBoosts?.length ? `
    <div style="margin-bottom:28px">
      <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:12px">🎯 Boosts activos ahora</div>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px;overflow:hidden">
        <tr style="background:#e2e8f0">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#475569">Nivel</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:#475569">Anuncios</th>
        </tr>
        ${boostRows}
      </table>
    </div>` : ''}

    <!-- Tip semanal -->
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:18px 20px;margin-bottom:28px">
      <div style="font-size:13px;font-weight:700;color:#92400e;margin-bottom:6px">💡 Insight de esta semana</div>
      <div style="font-size:14px;color:#78350f;line-height:1.6">
        ${conversion < 1
          ? 'El funnel necesita más tráfico para mostrar datos significativos. Considera compartir el sitio en grupos de Facebook de Azcapotzalco para acelerar los primeros 50 anuncios.'
          : conversion < 3
          ? `Con ${overallRate}% de conversión, estás cerca del benchmark. Una mejora en el copy del modal ("Aparece primero que ${shown * 3} personas") podría llevar la tasa al 3%+.`
          : `¡Excelente semana! ${overallRate}% de conversión supera el benchmark de 3%. Es momento de presentar estos datos al inversor y hablar de escalar el presupuesto de adquisición.`
        }
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center">
      <a href="https://www.azcapoclasificados.com.mx/#/admin"
         style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:15px">
        📊 Ver dashboard completo
      </a>
    </div>

  </div>

  <!-- FOOTER -->
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center">
    <div style="font-size:12px;color:#94a3b8">
      © ${now.getFullYear()} Azcapo Clasificados · azcapoclasificados.com.mx<br>
      Este reporte se genera automáticamente cada lunes a las 9:00 AM.
    </div>
  </div>

</div>
</body>
</html>`;

    // ── Send the email ──────────────────────────────────────────────────────
    const result = await sendEmail({
      to: RECIPIENT,
      subject: `📊 Reporte Semanal S${weekNum} — ${overallRate}% conversión · $${revenueWeek.toLocaleString('es-MX')} MXN esta semana`,
      html,
    });

    console.log('Weekly report sent:', result);
    return res.status(200).json({
      success: true,
      recipient: RECIPIENT,
      subject: `Reporte Semanal S${weekNum}`,
      metrics: { conversion: overallRate, revenue_week: revenueWeek, mrr },
      resend_id: result?.data?.id,
    });

  } catch (err) {
    console.error('Weekly report error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
