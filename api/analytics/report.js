/**
 * GET /api/analytics/report
 * Returns a self-contained, print-ready HTML investor report.
 * Fetches live data from the DB and renders it server-side.
 * Protected by x-admin-key header.
 */
const { sql } = require('../../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const adminKey = req.headers['x-admin-key'] || req.query.key;
  if (adminKey !== process.env.CRON_SECRET) {
    return res.status(401).send('<h1>No autorizado</h1>');
  }

  try {
    const [funnelData, featuredAds, activeStores, totalRevenue, reviewStats, topLevels] = await Promise.all([
      sql`
        SELECT
          COUNT(*) FILTER (WHERE event = 'ad_published')       AS ads_published,
          COUNT(*) FILTER (WHERE event = 'upsell_shown')       AS upsell_shown,
          COUNT(*) FILTER (WHERE event = 'upsell_level_click') AS upsell_clicked,
          COUNT(*) FILTER (WHERE event = 'boost_initiated')    AS payment_started,
          COUNT(*) FILTER (WHERE event = 'upsell_skip')        AS skipped
        FROM analytics_events
        WHERE created_at > NOW() - INTERVAL '30 days'
      `,
      sql`SELECT COUNT(*) AS count FROM ads WHERE featured = true AND status = 'active'`,
      sql`SELECT plan, COUNT(*) AS count FROM stores WHERE status = 'active' GROUP BY plan`,
      sql`SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status = 'approved'`,
      sql`SELECT AVG(rating)::NUMERIC(3,1) AS avg_rating, COUNT(*) AS total FROM reviews`,
      sql`
        SELECT properties->>'level' AS level, COUNT(*) AS clicks
        FROM analytics_events
        WHERE event = 'upsell_level_click' AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY level ORDER BY clicks DESC LIMIT 3
      `,
    ]);

    const f = funnelData[0];
    const shown     = Number(f?.upsell_shown     || 0);
    const clicked   = Number(f?.upsell_clicked   || 0);
    const initiated = Number(f?.payment_started  || 0);
    const published = Number(f?.ads_published    || 0);
    const skipped   = Number(f?.skipped          || 0);

    const clickRate   = shown     > 0 ? ((clicked   / shown)     * 100).toFixed(1) : '0.0';
    const initRate    = clicked   > 0 ? ((initiated / clicked)   * 100).toFixed(1) : '0.0';
    const overallRate = shown     > 0 ? ((initiated / shown)     * 100).toFixed(1) : '0.0';

    const storePrices = { basic: 200, plus: 450, pro: 900 };
    const mrr = (activeStores || []).reduce((s, st) => s + (storePrices[st.plan] || 0) * Number(st.count), 0);
    const revenue = Number(totalRevenue[0]?.total || 0);
    const featuredCount = Number(featuredAds[0]?.count || 0);
    const avgRating = Number(reviewStats[0]?.avg_rating || 0);
    const totalReviews = Number(reviewStats[0]?.total || 0);

    const reportDate = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    const periodEnd  = new Date().toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' });
    const periodStart = new Date(Date.now() - 30 * 86400000).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' });

    // Build funnel bar SVG (horizontal)
    const funnelSteps = [
      { label: 'Publicaron anuncio', value: published, color: '#6366f1' },
      { label: 'Vieron oferta boost', value: shown,    color: '#0ea5e9' },
      { label: 'Eligieron nivel',    value: clicked,   color: '#f59e0b' },
      { label: 'Iniciaron pago',     value: initiated, color: '#10b981' },
    ];
    const maxVal = Math.max(...funnelSteps.map(s => s.value), 1);

    const funnelBars = funnelSteps.map((s, i) => {
      const pct = Math.round((s.value / maxVal) * 100);
      const prev = i > 0 ? funnelSteps[i-1].value : null;
      const dropPct = prev && prev > 0 ? (100 - ((s.value / prev) * 100)).toFixed(1) : null;
      return `
        <div class="funnel-row">
          <div class="funnel-label">${s.label}</div>
          <div class="funnel-bar-wrap">
            <div class="funnel-bar" style="width:${pct}%;background:${s.color}"></div>
          </div>
          <div class="funnel-val">
            <strong>${s.value}</strong>
            ${dropPct ? `<span class="drop">▼ ${dropPct}%</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Level breakdown
    const levelLabels = { basic: '▲ Básico ($80)', featured: '🔥 Destacado ($150)', premium: '⭐ Premium ($280)' };
    const topLevel = topLevels[0];
    const levelRows = (topLevels || []).map(l => `
      <div class="level-row">
        <span>${levelLabels[l.level] || l.level}</span>
        <span><strong>${l.clicks}</strong> clics</span>
      </div>
    `).join('');

    // Benchmark status
    const conversion = parseFloat(overallRate);
    const benchmarkStatus = conversion >= 5 ? { emoji: '🟢', text: 'Excelente — supera benchmark (3%)', color: '#10b981' }
                          : conversion >= 3 ? { emoji: '🟡', text: 'Piloto exitoso — cumple benchmark (3%)', color: '#f59e0b' }
                          : { emoji: '🔴', text: 'En construcción — datos acumulándose', color: '#ef4444' };

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reporte de Inversión — Azcapo Clasificados</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; }

  .page { max-width: 860px; margin: 0 auto; background: white; }

  /* Header */
  .report-header {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%);
    color: white;
    padding: 48px 48px 36px;
  }
  .report-header__top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .report-logo { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
  .report-logo span { opacity: 0.7; font-weight: 400; }
  .report-badge { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .report-title { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
  .report-subtitle { font-size: 15px; opacity: 0.8; }
  .report-period { margin-top: 20px; display: flex; gap: 32px; }
  .report-period-item { }
  .report-period-label { font-size: 11px; opacity: 0.65; text-transform: uppercase; letter-spacing: 0.8px; }
  .report-period-value { font-size: 15px; font-weight: 700; margin-top: 2px; }

  /* Body */
  .report-body { padding: 40px 48px; }

  /* Section */
  .section { margin-bottom: 36px; }
  .section-title {
    font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
    color: #64748b; margin-bottom: 16px; padding-bottom: 8px;
    border-bottom: 2px solid #f1f5f9;
    display: flex; align-items: center; gap: 8px;
  }

  /* KPI row */
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .kpi-card {
    background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 14px; padding: 18px 16px;
    border-top: 3px solid currentColor;
  }
  .kpi-card__icon { font-size: 20px; margin-bottom: 8px; }
  .kpi-card__value { font-size: 26px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
  .kpi-card__label { font-size: 11px; color: #64748b; font-weight: 500; }

  /* Conversion highlight */
  .conversion-box {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border: 2px solid #86efac;
    border-radius: 16px;
    padding: 24px 28px;
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 36px;
  }
  .conversion-pct { font-size: 56px; font-weight: 900; color: #16a34a; line-height: 1; }
  .conversion-label { font-size: 22px; font-weight: 700; color: #15803d; }
  .conversion-sub { font-size: 13px; color: #4ade80; margin-top: 4px; }
  .benchmark-badge { margin-left: auto; text-align: center; }
  .benchmark-badge__emoji { font-size: 28px; }
  .benchmark-badge__text { font-size: 12px; color: #166534; font-weight: 600; margin-top: 4px; max-width: 140px; }

  /* Funnel */
  .funnel-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .funnel-label { width: 160px; font-size: 13px; color: #475569; flex-shrink: 0; }
  .funnel-bar-wrap { flex: 1; background: #f1f5f9; border-radius: 6px; height: 10px; overflow: hidden; }
  .funnel-bar { height: 100%; border-radius: 6px; transition: width 0.6s; }
  .funnel-val { width: 100px; font-size: 13px; color: #1e293b; flex-shrink: 0; display: flex; align-items: center; gap: 8px; }
  .drop { font-size: 11px; color: #94a3b8; }

  /* Level breakdown */
  .level-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  .level-row:last-child { border-bottom: none; }

  /* 2-col */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

  /* Summary box */
  .summary-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px 24px; }
  .summary-box p { font-size: 14px; line-height: 1.6; color: #78350f; margin-bottom: 8px; }
  .summary-box p:last-child { margin: 0; }
  .summary-box strong { color: #92400e; }

  /* Revenue box */
  .revenue-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .revenue-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; }
  .revenue-card__val { font-size: 22px; font-weight: 800; color: #1e293b; }
  .revenue-card__label { font-size: 11px; color: #64748b; margin-top: 4px; }

  /* Footer */
  .report-footer {
    background: #f8fafc; border-top: 1px solid #e2e8f0;
    padding: 24px 48px;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 12px; color: #94a3b8;
  }
  .report-footer strong { color: #64748b; }

  /* Print button */
  .print-btn {
    position: fixed; bottom: 32px; right: 32px;
    background: linear-gradient(135deg,#6366f1,#8b5cf6);
    color: white; border: none; border-radius: 50px;
    padding: 14px 28px; font-size: 15px; font-weight: 700;
    cursor: pointer; box-shadow: 0 8px 24px rgba(99,102,241,0.35);
    display: flex; align-items: center; gap: 8px;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .print-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(99,102,241,0.45); }

  @media print {
    .print-btn { display: none; }
    body { background: white; }
    .page { max-width: 100%; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="report-header">
    <div class="report-header__top">
      <div class="report-logo">Azcapo<span>Clasificados</span>.com.mx</div>
      <div class="report-badge">CONFIDENCIAL · INVERSOR</div>
    </div>
    <div class="report-title">Reporte de Métricas</div>
    <div class="report-subtitle">Desempeño del modelo freemium · Motor de monetización boost</div>
    <div class="report-period">
      <div class="report-period-item">
        <div class="report-period-label">Período</div>
        <div class="report-period-value">${periodStart} — ${periodEnd}</div>
      </div>
      <div class="report-period-item">
        <div class="report-period-label">Generado</div>
        <div class="report-period-value">${reportDate}</div>
      </div>
    </div>
  </div>

  <div class="report-body">

    <!-- CONVERSION HIGHLIGHT -->
    <div class="conversion-box">
      <div>
        <div class="conversion-pct">${overallRate}%</div>
      </div>
      <div>
        <div class="conversion-label">Tasa de Conversión Global</div>
        <div class="conversion-sub">modal upsell → pago iniciado (últimos 30 días)</div>
      </div>
      <div class="benchmark-badge">
        <div class="benchmark-badge__emoji">${benchmarkStatus.emoji}</div>
        <div class="benchmark-badge__text" style="color:${benchmarkStatus.color}">${benchmarkStatus.text}</div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="section">
      <div class="section-title">📊 Métricas Clave</div>
      <div class="kpi-grid">
        <div class="kpi-card" style="color:#6366f1">
          <div class="kpi-card__icon">📝</div>
          <div class="kpi-card__value">${published}</div>
          <div class="kpi-card__label">Anuncios publicados</div>
        </div>
        <div class="kpi-card" style="color:#f59e0b">
          <div class="kpi-card__icon">👁️</div>
          <div class="kpi-card__value">${shown}</div>
          <div class="kpi-card__label">Vieron oferta boost</div>
        </div>
        <div class="kpi-card" style="color:#10b981">
          <div class="kpi-card__icon">💳</div>
          <div class="kpi-card__value">${initiated}</div>
          <div class="kpi-card__label">Pagos iniciados</div>
        </div>
        <div class="kpi-card" style="color:#ef4444">
          <div class="kpi-card__icon">💰</div>
          <div class="kpi-card__value">$${revenue.toLocaleString('es-MX')}</div>
          <div class="kpi-card__label">Ingresos totales MXN</div>
        </div>
      </div>
    </div>

    <!-- FUNNEL -->
    <div class="section">
      <div class="section-title">🔽 Embudo de Conversión</div>
      ${funnelBars}
      <div style="margin-top:16px;display:flex;gap:28px;font-size:13px;color:#64748b;background:#f8fafc;padding:12px 16px;border-radius:10px">
        <span>Click-through rate: <strong style="color:#1e293b">${clickRate}%</strong></span>
        <span>Click → Pago: <strong style="color:#1e293b">${initRate}%</strong></span>
        <span>Omitieron modal: <strong style="color:#1e293b">${skipped}</strong></span>
      </div>
    </div>

    <!-- TWO COLUMNS -->
    <div class="two-col section">
      <div>
        <div class="section-title">🎯 Niveles Más Elegidos</div>
        ${levelRows || '<p style="font-size:13px;color:#94a3b8">Sin datos aún</p>'}
        ${topLevel ? `<div style="margin-top:14px;padding:12px;background:#fffbeb;border-radius:10px;font-size:13px;color:#92400e">
          <strong>Ganador:</strong> ${levelLabels[topLevel.level] || topLevel.level} con ${topLevel.clicks} clics
        </div>` : ''}
      </div>
      <div>
        <div class="section-title">🏪 Tiendas y Reputación</div>
        <div class="revenue-grid" style="grid-template-columns:1fr 1fr">
          <div class="revenue-card">
            <div class="revenue-card__val">$${mrr.toLocaleString('es-MX')}</div>
            <div class="revenue-card__label">MRR Tiendas (MXN)</div>
          </div>
          <div class="revenue-card">
            <div class="revenue-card__val">${featuredCount}</div>
            <div class="revenue-card__label">Anuncios destacados activos</div>
          </div>
        </div>
        <div style="margin-top:12px;padding:12px 16px;background:#f8fafc;border-radius:10px;font-size:13px;color:#475569">
          ⭐ Rating promedio del vendedor: <strong>${avgRating > 0 ? avgRating + '/5' : 'Sin datos aún'}</strong>
          ${totalReviews > 0 ? ` (${totalReviews} reseñas)` : ''}
        </div>
      </div>
    </div>

    <!-- SUMMARY -->
    <div class="section">
      <div class="section-title">📋 Resumen Ejecutivo</div>
      <div class="summary-box">
        <p>Azcapo Clasificados opera un <strong>marketplace freemium hiperlocal</strong> en Azcapotzalco, CDMX. El modelo monetiza mediante dos motores: <strong>pagos por boost de anuncio</strong> ($80/$150/$280 MXN por 3-7 días) y <strong>suscripciones de tienda</strong> ($200/$450/$900 MXN/mes).</p>
        <p>En el período analizado, el embudo de conversión registró una tasa global de <strong>${overallRate}%</strong> (modal upsell → pago iniciado). El <strong>benchmark de referencia es 3%</strong> para considerar el piloto exitoso y escalar inversión en adquisición.</p>
        <p>El sistema de <strong>reseñas verificadas</strong> (${totalReviews} actualmente) construye el moat estratégico: un vendedor con reputación acumulada no abandona la plataforma, generando retención orgánica sin costo de adquisición adicional.</p>
      </div>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="report-footer">
    <div>© ${new Date().getFullYear()} <strong>Azcapo Clasificados</strong> · www.azcapoclasificados.com.mx</div>
    <div>Reporte generado: ${reportDate} · Datos en tiempo real</div>
  </div>

</div>

<!-- PRINT BUTTON -->
<button class="print-btn" onclick="window.print()">
  🖨️ Imprimir / Guardar PDF
</button>

</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(html);

  } catch (err) {
    console.error('Report generation error:', err);
    return res.status(500).send(`<h1>Error al generar reporte: ${err.message}</h1>`);
  }
};
