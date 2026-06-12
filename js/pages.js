/* ============================================
   CLASIFICADOS MX — Pages
   ============================================ */

/* ---- Home Page ---- */
function renderHomePage() {
  const featured = Store.getFeatured();
  const recent = Store.getRecent(8);
  const total = Store.getTotalCount();

  return `
    <!-- ===== HERO BANNER CAROUSEL ===== -->
    <div class="hero-carousel-wrap" id="hero-carousel-wrap">
      <!-- Loading placeholder -->
      <div class="hero-carousel-loading" id="hero-carousel-loading">
        <div class="hero-carousel-spinner"></div>
      </div>
      <!-- Slides track -->
      <div class="hero-carousel-track-outer">
        <div class="hero-carousel-track" id="hero-carousel-track"></div>
      </div>
      <!-- Arrows -->
      <button class="hero-carousel-arrow hero-carousel-arrow-left"
              id="hero-carousel-prev" aria-label="Anterior"
              onclick="heroPrev()" style="display:none">&#8249;</button>
      <button class="hero-carousel-arrow hero-carousel-arrow-right"
              id="hero-carousel-next" aria-label="Siguiente"
              onclick="heroNext()" style="display:none">&#8250;</button>
      <!-- Dots -->
      <div class="hero-carousel-dots" id="hero-carousel-dots"></div>
      <!-- Progress bar -->
      <div class="hero-carousel-progress" id="hero-carousel-progress" style="width:0%"></div>
    </div>
    <!-- ===== /HERO BANNER CAROUSEL ===== -->

    <!-- Search + Stats section (below carousel) -->
    <section class="hero-search-section">
      <div class="container">
        <div class="hero-search-row">
          <div class="hero-search-tagline">
            <h1 class="hero-search-title">Encuentra lo que buscas,</h1>
            <p class="hero-search-subtitle gradient-text">cerca de ti.</p>
          </div>
          <div class="hero-search-bar-wrap">
            ${renderSearchBar('', '¿Qué estás buscando?')}
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <div class="hero-stat-number gradient-text">${total}</div>
            <div class="hero-stat-label">Anuncios activos</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-number gradient-text">${CATEGORIES.length}</div>
            <div class="hero-stat-label">Categorías</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-number gradient-text">24/7</div>
            <div class="hero-stat-label">Disponible</div>
          </div>
        </div>
      </div>
    </section>

    <div class="container">
      <!-- Welcome Banner / Cortinilla -->
      <div class="welcome-banner" id="welcome-banner">
        <div class="welcome-banner-inner">
          <button class="welcome-banner-close" onclick="closeWelcomeBanner()" title="Cerrar">✕</button>
          <div class="welcome-banner-header">
            <span class="welcome-banner-icon">🤝</span>
            <div class="welcome-banner-title">Impulsemos juntos el comercio local</div>
          </div>
          <div class="welcome-banner-body">
            <p class="welcome-banner-text">
              Este portal ha sido creado con un propósito claro: <strong>dar un mayor impulso al comercio local.</strong>
            </p>
            <p class="welcome-banner-text">
              A través de AzcapoClasificados, cualquier persona tendrá una herramienta sencilla y efectiva para impulsar y promover sus productos y servicios, llegando a más personas de su propia comunidad.
            </p>
            <p class="welcome-banner-text">
              Este proyecto nace de una idea libre y espontánea: <strong>ayudar de forma desinteresada</strong> a que el comercio de nuestra zona crezca y se fortalezca. No hay intereses ocultos, solo la convicción de que el trabajo local merece visibilidad.
            </p>
            <p class="welcome-banner-text">
              Pero para que este espacio pueda mantenerse activo, mejorar sus funciones y seguir siendo gratuito para la mayoría, <strong>necesitamos tu apoyo.</strong>
            </p>
            <p class="welcome-banner-text">
              Si puedes apoyarnos, te invitamos a publicar tus anuncios con fotos en la <strong>versión premium</strong>. Con ese pequeño gesto, nos darás la posibilidad de seguir manteniendo este proyecto… pensando siempre en tu beneficio.
            </p>
            <p class="welcome-banner-highlight">
              Porque cuando el comercio local gana, todos ganamos.
            </p>
            <div class="welcome-banner-cta">
              <button class="btn btn-primary" onclick="navigateTo('/publish');closeWelcomeBanner();">⭐ ¿Te animas a ser parte del cambio?</button>
            </div>
          </div>
          <div class="welcome-banner-progress">
            <div class="welcome-banner-progress-bar" id="welcome-banner-progress" style="width:100%"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="home-with-sidebar">
        <!-- Vertical Category Menu -->
        <nav class="category-sidebar" id="category-sidebar">
          <div class="cat-sidebar-title">📂 Categorías</div>
          <ul class="cat-sidebar-list">
            ${CATEGORIES.map(c => `
              <li class="cat-sidebar-item" id="cat-item-${c.id}">
                <div class="cat-sidebar-link" onclick="toggleCatSub('${c.id}')">
                  <span class="cat-sidebar-emoji">${c.emoji}</span>
                  <span class="cat-sidebar-name">${escapeHtml(c.name)}</span>
                  <span class="cat-sidebar-count">${Store.getByCategory(c.id).length}</span>
                  <span class="cat-sidebar-arrow" id="arrow-${c.id}">›</span>
                </div>
                <ul class="cat-sub-list" id="sub-${c.id}" style="display:none">
                  <li class="cat-sub-item">
                    <a href="#" onclick="navigateTo('/category/${c.id}');return false;" class="cat-sub-link">
                      Ver todo en ${escapeHtml(c.name)}
                    </a>
                  </li>
                  ${c.subs.map(s => `
                    <li class="cat-sub-item">
                      <a href="#" onclick="navigateTo('/category/${s.id}');return false;" class="cat-sub-link">
                        ${escapeHtml(s.name)}
                        <span class="cat-sub-count">${Store.getByCategory(s.id).length}</span>
                      </a>
                    </li>
                  `).join('')}
                </ul>
              </li>
            `).join('')}
          </ul>
        </nav>

        <!-- Main Content -->
        <div class="home-main-content">
          ${featured.length > 0 ? `
            <section class="section featured-section">
              <div class="section-header">
                <div>
                  <h2 class="section-title">⭐ Anuncios Destacados</h2>
                  <p class="section-subtitle">Los mejores anuncios premium</p>
                </div>
                <a class="section-link" href="#" onclick="navigateTo('/search?type=premium');return false;">Ver todos →</a>
              </div>
              <div class="ad-grid">
                ${featured.map((a, i) => renderAdCard(a, i)).join('')}
              </div>
            </section>
          ` : ''}

          <section class="section">
            <div class="section-header">
              <div>
                <h2 class="section-title">Anuncios Recientes</h2>
                <p class="section-subtitle">Lo más nuevo publicado</p>
              </div>
              <a class="section-link" href="#" onclick="navigateTo('/search');return false;">Ver todos →</a>
            </div>
            <div class="ad-grid">
              ${recent.map((a, i) => renderAdCard(a, i)).join('')}
            </div>
          </section>

          <!-- Blog + YouTube Section -->
          <section class="section blog-preview-section" id="blog-preview-section">
            <div class="blog-video-layout">

              <!-- Left: Blog Preview -->
              <div class="blog-side">
                <div class="section-header">
                  <div>
                    <h2 class="section-title">📝 Blog de la Comunidad</h2>
                    <p class="section-subtitle">Consejos, guías y noticias locales</p>
                  </div>
                  <a class="section-link" href="/blog">Ver todos →</a>
                </div>
                <div class="blog-preview-grid" id="blog-preview-grid">
                  <div class="blog-preview-loading">Cargando artículos…</div>
                </div>
                <div style="text-align:center;margin-top:var(--space-5)">
                  <a href="/blog" class="btn btn-secondary">✨ Ver todos los artículos del Blog</a>
                </div>
              </div>

              <!-- Right: YouTube Video Carousel (loaded from API) -->
              <div class="video-side" id="video-side">
                <div class="section-header">
                  <div>
                    <h2 class="section-title">🎬 Videos</h2>
                    <p class="section-subtitle">Contenido destacado</p>
                  </div>
                </div>
                <div id="yt-carousel-container">
                  <div style="text-align:center;padding:var(--space-8) 0;color:var(--text-muted);font-size:var(--text-sm)">Cargando videos…</div>
                </div>
              </div>

            </div>
          </section>
        </div>
      </div>
    </div>
  `;
}

/* ---- Admin Panel ---- */
function renderAdminPage() {
  return `
    <div class="container" style="max-width:900px;padding-top:var(--space-8);padding-bottom:var(--space-12)">
      <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-6)">
        <a href="#" onclick="navigateTo('/');return false;" style="color:var(--text-muted);text-decoration:none;font-size:1.2rem">← Inicio</a>
      </div>

      <h1 style="font-family:var(--font-display);font-size:var(--text-2xl);margin-bottom:var(--space-2)">⚙️ Panel de Administración</h1>
      <p style="color:var(--text-muted);margin-bottom:var(--space-8)">Gestiona el contenido y monitorea el crecimiento del negocio</p>

      <!-- ===== METRICS DASHBOARD ===== -->
      <div class="admin-metrics-section" id="admin-metrics-section">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-5);flex-wrap:wrap;gap:12px">
          <div>
            <h2 style="font-family:var(--font-display);font-size:var(--text-xl);margin:0">📊 Dashboard de Métricas</h2>
            <p style="color:var(--text-muted);font-size:var(--text-sm);margin:4px 0 0">Últimos 30 días · Embudo de conversión boost</p>
          </div>
          <div style="display:flex;gap:10px;align-items:center">
            <span id="metrics-last-updated" style="font-size:12px;color:var(--text-muted)"></span>
            <button class="btn btn-secondary" onclick="loadAdminMetrics()" style="font-size:13px;padding:8px 14px">🔄 Actualizar</button>
            <button class="btn btn-primary" onclick="openInvestorReport()" style="font-size:13px;padding:8px 16px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none">📄 Reporte PDF</button>
            <button class="btn btn-secondary" onclick="sendWeeklyReportNow()" style="font-size:13px;padding:8px 14px" title="Envía el email de reporte ahora a alxteran@gmail.com">📧 Enviar email</button>
          </div>
        </div>

        <!-- KPI Cards -->
        <div class="admin-kpi-grid" id="admin-kpi-grid">
          ${[
            { id: 'kpi-published',   icon: '📝', label: 'Anuncios publicados',   color: '#6366f1' },
            { id: 'kpi-shown',       icon: '👁️',  label: 'Modal upsell visto',   color: '#0ea5e9' },
            { id: 'kpi-clicked',     icon: '🖱️',  label: 'Nivel seleccionado',   color: '#f59e0b' },
            { id: 'kpi-initiated',   icon: '💳',  label: 'Pagos iniciados',      color: '#10b981' },
            { id: 'kpi-conversion',  icon: '📈',  label: 'Conversión global',    color: '#8b5cf6', suffix: '%' },
            { id: 'kpi-mrr',         icon: '💰',  label: 'MRR Tiendas',          color: '#ef4444', prefix: '$', suffix: ' MXN' },
          ].map(k => `
            <div class="admin-kpi-card" style="border-top:3px solid ${k.color}">
              <div class="admin-kpi-icon">${k.icon}</div>
              <div class="admin-kpi-value" id="${k.id}">
                <div class="admin-kpi-skeleton"></div>
              </div>
              <div class="admin-kpi-label">${k.label}</div>
            </div>
          `).join('')}
        </div>

        <!-- Funnel Bar Chart -->
        <div class="admin-card" style="margin-top:var(--space-5)">
          <h3 style="font-size:15px;font-weight:700;margin:0 0 18px;display:flex;align-items:center;gap:8px">
            🔽 Embudo de Conversión
            <span style="font-size:12px;font-weight:400;color:var(--text-muted)">publicar → modal → click → pago</span>
          </h3>
          <div id="admin-funnel-bars" class="admin-funnel-bars">
            <div style="color:var(--text-muted);font-size:14px;text-align:center;padding:24px 0">⏳ Cargando embudo…</div>
          </div>
        </div>

        <!-- Bottom row: level breakdown + device + daily -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">

          <!-- Level Breakdown -->
          <div class="admin-card">
            <h3 style="font-size:15px;font-weight:700;margin:0 0 14px">🎯 Nivel más elegido</h3>
            <div id="admin-level-breakdown">
              <div style="color:var(--text-muted);font-size:13px">⏳ Cargando…</div>
            </div>
          </div>

          <!-- Device Split -->
          <div class="admin-card">
            <h3 style="font-size:15px;font-weight:700;margin:0 0 14px">📱 Dispositivo</h3>
            <div id="admin-device-split">
              <div style="color:var(--text-muted);font-size:13px">⏳ Cargando…</div>
            </div>
          </div>
        </div>

        <!-- Recent Events Live Feed -->
        <div class="admin-card" style="margin-top:16px">
          <h3 style="font-size:15px;font-weight:700;margin:0 0 14px">⚡ Actividad reciente</h3>
          <div id="admin-live-feed" style="max-height:220px;overflow-y:auto">
            <div style="color:var(--text-muted);font-size:13px">⏳ Cargando…</div>
          </div>
        </div>

      </div>
      <!-- ===== /METRICS DASHBOARD ===== -->

      <!-- YouTube Videos Section -->
      <div class="admin-card" style="margin-top:var(--space-8)">
        <h2 style="font-family:var(--font-display);font-size:var(--text-lg);margin-bottom:var(--space-2)">🎬 Videos de YouTube</h2>
        <p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:var(--space-5)">
          Los videos aparecen como carrusel junto al blog en la página principal. Se rotan cada 5 segundos.
        </p>

        <!-- Add new video form -->
        <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-5);flex-wrap:wrap">
          <input type="text" id="admin-new-video-url" class="input" placeholder="Pega la URL de YouTube aquí…" style="flex:1;min-width:200px">
          <input type="text" id="admin-new-video-title" class="input" placeholder="Título (opcional)" style="width:180px">
          <button class="btn btn-primary" onclick="adminAddVideo()" style="white-space:nowrap">+ Agregar video</button>
        </div>

        <!-- Video list -->
        <div id="admin-video-list">
          <div style="text-align:center;padding:var(--space-6) 0;color:var(--text-muted)">Cargando videos…</div>
        </div>

        <!-- Save button -->
        <div style="display:flex;justify-content:flex-end;gap:var(--space-3);margin-top:var(--space-5)">
          <span id="admin-save-status" style="color:var(--text-muted);font-size:var(--text-sm);align-self:center"></span>
          <button class="btn btn-primary" id="admin-save-btn" onclick="adminSaveVideos()">💾 Guardar cambios</button>
        </div>
      </div>

      <!-- Reels Populares Section -->
      <div class="admin-card" style="margin-top:var(--space-6)">
        <h2 style="font-family:var(--font-display);font-size:var(--text-lg);margin-bottom:var(--space-2)">📱 Reels Populares</h2>
        <p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:var(--space-5)">
          Los reels aparecen como carrusel horizontal en la sección de Media Center. Usa URLs de YouTube Shorts.
        </p>

        <!-- Add new reel form -->
        <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-5);flex-wrap:wrap">
          <input type="text" id="admin-new-reel-url" class="input" placeholder="Pega la URL de YouTube aquí…" style="flex:1;min-width:200px">
          <input type="text" id="admin-new-reel-title" class="input" placeholder="Título (opcional)" style="width:180px">
          <button class="btn btn-primary" onclick="adminAddReel()" style="white-space:nowrap">+ Agregar reel</button>
        </div>

        <!-- Reel list -->
        <div id="admin-reel-list">
          <div style="text-align:center;padding:var(--space-6) 0;color:var(--text-muted)">Cargando reels…</div>
        </div>

        <!-- Save button -->
        <div style="display:flex;justify-content:flex-end;gap:var(--space-3);margin-top:var(--space-5)">
          <span id="admin-reels-save-status" style="color:var(--text-muted);font-size:var(--text-sm);align-self:center"></span>
          <button class="btn btn-primary" id="admin-reels-save-btn" onclick="adminSaveReels()">💾 Guardar cambios</button>
        </div>
      </div>

      <!-- Explorar Videos Section -->
      <div class="admin-card" style="margin-top:var(--space-6)">
        <h2 style="font-family:var(--font-display);font-size:var(--text-lg);margin-bottom:var(--space-2)">🎥 Explorar Videos</h2>
        <p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:var(--space-5)">
          Los videos aparecen en la sección "Explorar Videos" del Media Center. Usa URLs de YouTube.
        </p>

        <!-- Add new explore video form -->
        <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-5);flex-wrap:wrap">
          <input type="text" id="admin-new-explore-url" class="input" placeholder="Pega la URL de YouTube aquí…" style="flex:1;min-width:200px">
          <input type="text" id="admin-new-explore-title" class="input" placeholder="Título (opcional)" style="width:180px">
          <button class="btn btn-primary" onclick="adminAddExploreVideo()" style="white-space:nowrap">+ Agregar video</button>
        </div>

        <!-- Explore video list -->
        <div id="admin-explore-list">
          <div style="text-align:center;padding:var(--space-6) 0;color:var(--text-muted)">Cargando videos…</div>
        </div>

        <!-- Save button -->
        <div style="display:flex;justify-content:flex-end;gap:var(--space-3);margin-top:var(--space-5)">
          <span id="admin-explore-save-status" style="color:var(--text-muted);font-size:var(--text-sm);align-self:center"></span>
          <button class="btn btn-primary" id="admin-explore-save-btn" onclick="adminSaveExploreVideos()">💾 Guardar cambios</button>
        </div>
      </div>

      <!-- Contact Messages Section -->
      <div class="admin-card" style="margin-top:var(--space-6)">
        <h2 style="font-family:var(--font-display);font-size:var(--text-lg);margin-bottom:var(--space-2)">📬 Mensajes del Buzón</h2>
        <p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:var(--space-5)">
          Mensajes enviados desde la página de Contacto. Los más recientes aparecen primero.
        </p>
        <div id="admin-messages-list">
          <div style="text-align:center;padding:var(--space-6) 0;color:var(--text-muted)">Cargando mensajes…</div>
        </div>
      </div>
    </div>
  `;
}


/* ---- Contact / Buzón de Comentarios ---- */
function renderContactPage() {
  return `
    <div class="container" style="max-width:680px;padding-top:var(--space-8);padding-bottom:var(--space-12)">
      <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-6)">
        <a href="#" onclick="navigateTo('/');return false;" style="color:var(--text-muted);text-decoration:none;font-size:1.2rem">← Inicio</a>
      </div>

      <div class="contact-card">
        <div class="contact-header">
          <span class="contact-icon">📬</span>
          <div>
            <h1 class="contact-title">Buzón de Comentarios</h1>
            <p class="contact-subtitle">Tu opinión es importante. Déjanos tus sugerencias, quejas o comentarios.</p>
          </div>
        </div>

        <form id="contact-form" onsubmit="handleContactSubmit(event)">
          <!-- Email -->
          <div class="form-group">
            <label class="form-label" for="contact-email">
              Correo Electrónico <span style="color:var(--accent);font-size:var(--text-xs)">* Obligatorio</span>
            </label>
            <input type="email" id="contact-email" class="input" placeholder="ejemplo@correo.com" required autocomplete="email">
          </div>

          <!-- Comentario -->
          <div class="form-group">
            <label class="form-label" for="contact-message">
              Comentario <span style="color:var(--accent);font-size:var(--text-xs)">* Obligatorio (máx. 1000 palabras)</span>
            </label>
            <textarea id="contact-message" class="input contact-textarea" placeholder="Escribe aquí tu mensaje, sugerencia o comentario..." required></textarea>
            <div id="contact-word-count" class="contact-word-counter">0 / 1000 palabras</div>
          </div>

          <!-- Submit -->
          <button type="submit" class="btn btn-primary contact-submit-btn" id="contact-submit-btn">
            📩 Enviar Comentario
          </button>
        </form>

        <div id="contact-success" style="display:none;text-align:center;padding:var(--space-8) 0">
          <div style="font-size:3rem;margin-bottom:var(--space-3)">✅</div>
          <h2 style="font-family:var(--font-display);font-size:var(--text-xl);margin-bottom:var(--space-2)">¡Mensaje enviado!</h2>
          <p style="color:var(--text-muted);margin-bottom:var(--space-5)">Gracias por tu comentario. Lo revisaremos a la brevedad.</p>
          <button class="btn btn-secondary" onclick="navigateTo('/')">← Volver al inicio</button>
        </div>
      </div>
    </div>
  `;
}

/* ---- Category Page ---- */
function renderCategoryPage(catId) {
  const cat = getCategoryById(catId);
  const ads = Store.getByCategory(catId);
  const parent = getParentCategory(catId);
  const isSubcategory = parent && parent.id !== catId;

  // Breadcrumb
  let breadcrumb = `<a href="#" onclick="navigateTo('/');return false;">Inicio</a>`;
  if (isSubcategory) {
    breadcrumb += ` › <a href="#" onclick="navigateTo('/category/${parent.id}');return false;">${parent.emoji} ${escapeHtml(parent.name)}</a>`;
    breadcrumb += ` › <strong>${escapeHtml(cat.name)}</strong>`;
  } else {
    breadcrumb += ` › <strong>${cat.emoji} ${escapeHtml(cat.name)}</strong>`;
  }

  // Subcategory tabs (for parent categories)
  let subTabs = '';
  if (!isSubcategory && parent && parent.subs) {
    subTabs = `
      <div class="cat-sub-tabs">
        <a class="cat-sub-tab active" href="#" onclick="navigateTo('/category/${catId}');return false;">Todo</a>
        ${parent.subs.map(s => `
          <a class="cat-sub-tab" href="#" onclick="navigateTo('/category/${s.id}');return false;">${escapeHtml(s.name)}</a>
        `).join('')}
      </div>
    `;
  }

  return `
    <div class="container">
      <div class="category-breadcrumb">${breadcrumb}</div>
      <div class="category-page-header">
        <h1 class="category-page-title">
          <span class="cat-icon">${cat.emoji}</span>
          ${escapeHtml(cat.name)}
        </h1>
        <p class="category-page-count">${ads.length} anuncio${ads.length !== 1 ? 's' : ''} disponible${ads.length !== 1 ? 's' : ''}</p>
      </div>
      ${subTabs}
      <div class="page-layout" style="padding-top:0">
        <aside class="page-sidebar" id="page-sidebar">
          ${renderFilterPanel({ category: catId })}
        </aside>
        <div class="page-main">
          ${renderSortBar(ads.length)}
          ${ads.length > 0
            ? `<div class="ad-grid">${ads.map((a, i) => renderAdCard(a, i)).join('')}</div>`
            : renderEmptyState()
          }
        </div>
      </div>
    </div>
  `;
}

/* ---- Search / All Ads Page ---- */
function renderSearchPage(query = '', filters = {}) {
  const results = Store.search(query, filters);

  return `
    <div class="container">
      <div class="category-page-header">
        <h1 class="category-page-title">
          ${query ? `🔍 Resultados para "${escapeHtml(query)}"` : '📋 Todos los Anuncios'}
        </h1>
        <p class="category-page-count">${results.length} resultado${results.length !== 1 ? 's' : ''}</p>
      </div>
      <div class="page-layout" style="padding-top:0">
        <aside class="page-sidebar" id="page-sidebar">
          ${renderFilterPanel(filters)}
        </aside>
        <div class="page-main">
          ${renderSortBar(results.length, filters.sort)}
          ${results.length > 0
            ? `<div class="ad-grid">${results.map((a, i) => renderAdCard(a, i)).join('')}</div>`
            : renderEmptyState()
          }
        </div>
      </div>
    </div>
  `;
}

/* ---- Ad Detail Page ---- */
function renderAdDetailPage(adId) {
  const ad = Store.getById(adId);
  if (!ad) {
    return `<div class="container"><div class="empty-state"><div class="empty-state-icon">😕</div><div class="empty-state-title">Anuncio no encontrado</div><p class="empty-state-text">Este anuncio ya no está disponible.</p><button class="btn btn-primary" onclick="navigateTo('/')">Volver al inicio</button></div></div>`;
  }

  const cat = getCategoryById(ad.category);
  const isPremium = ad.type === 'premium';
  const hasImages = ad.images && ad.images.length > 0;
  const related = Store.getByCategory(ad.category).filter(a => a.id !== ad.id).slice(0, 3);

  return `
    <div class="ad-detail-page">
      <div class="ad-detail-breadcrumb">
        <a href="#" onclick="navigateTo('/');return false;">Inicio</a>
        <span class="separator">›</span>
        <a href="#" onclick="navigateTo('/category/${cat.id}');return false;">${cat.emoji} ${escapeHtml(cat.name)}</a>
        <span class="separator">›</span>
        <span style="color:var(--text-secondary)">${escapeHtml(ad.title.substring(0, 40))}${ad.title.length > 40 ? '...' : ''}</span>
      </div>

      <div class="ad-detail-content">
        <div class="ad-detail-main">
          <div class="ad-detail-gallery">
            ${hasImages
              ? `<img src="${ad.images[0]}" alt="${escapeHtml(ad.title)}" id="gallery-main-img">`
              : `<div class="ad-detail-gallery-placeholder">${cat.emoji}</div>`
            }
          </div>
          ${hasImages && ad.images.length > 1 ? `
            <div class="ad-detail-thumbs">
              ${ad.images.map((img, i) => `
                <div class="ad-detail-thumb ${i === 0 ? 'active' : ''}" onclick="switchGalleryImage('${img}', this)">
                  <img src="${img}" alt="Foto ${i + 1}">
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div style="margin-top:var(--space-6)">
            <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-4);flex-wrap:wrap;align-items:center;">
              ${isPremium ? '<span class="badge badge-premium">⭐ Premium</span>' : '<span class="badge badge-free">Gratis</span>'}
              <span class="badge badge-category">${cat.emoji} ${escapeHtml(cat.name)}</span>
              ${(Date.now() - ad.createdAt) < 86400000 * 3 ? '<span class="badge badge-new">Nuevo</span>' : ''}
              ${Store.isMyAd(ad.id) ? `
                <button class="btn btn-edit-ad" onclick="handleEditAd('${ad.id}')" id="btn-edit-ad-top">
                  ✏️ Modificar anuncio
                </button>
              ` : ''}
            </div>
            <h1 class="ad-detail-title">${escapeHtml(ad.title)}</h1>
            <div class="ad-detail-price-row">
              <span class="ad-detail-price">${formatPrice(ad.price)}</span>
            </div>
            <div class="ad-detail-meta-grid">
              <div class="ad-detail-meta-item">
                <span class="ad-detail-meta-label">Ubicación</span>
                <span class="ad-detail-meta-value">📍 ${escapeHtml(ad.location)}</span>
              </div>
              <div class="ad-detail-meta-item">
                <span class="ad-detail-meta-label">Publicado</span>
                <span class="ad-detail-meta-value">🕐 ${timeAgo(ad.createdAt)}</span>
              </div>
              <div class="ad-detail-meta-item">
                <span class="ad-detail-meta-label">Tipo</span>
                <span class="ad-detail-meta-value">${isPremium ? '⭐ Premium' : '📝 Gratuito'}</span>
              </div>
              <div class="ad-detail-meta-item">
                <span class="ad-detail-meta-label">ID</span>
                <span class="ad-detail-meta-value" style="font-size:var(--text-xs)">${ad.id.substring(0, 12)}</span>
              </div>
            </div>
            <h2 style="font-size:var(--text-lg);margin-bottom:var(--space-3);">Descripción</h2>
            <div class="ad-detail-description">${escapeHtml(ad.description)}</div>

            ${ad.latitude && ad.longitude ? `
              <div class="ad-detail-map-wrap">
                <h2 class="ad-detail-map-title">📍 Ubicación</h2>
                <div class="ad-detail-map-canvas" id="detail-map-${ad.id}"></div>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="ad-detail-sidebar">
          <div class="ad-detail-info">
            <h3 style="font-size:var(--text-lg);margin-bottom:var(--space-5);">💬 Chat con el vendedor</h3>
            ${AuthStore.isLoggedIn()
              ? `<div id="chat-container-${ad.id}">
                  <div class="chat-loading-state">
                    <div class="chat-loading-spinner"></div>
                    <span>Cargando mensajes...</span>
                  </div>
                </div>`
              : `<div class="chat-auth-wall">
                  <div class="chat-auth-wall-icon">🔐</div>
                  <p class="chat-auth-wall-text">
                    Inicia sesión para ver los mensajes y contactar al vendedor.
                  </p>
                  <button class="btn btn-primary" style="width:100%" onclick="navigateTo('/auth')">
                    📝 Iniciar sesión / Registrarse
                  </button>
                </div>`
            }
          </div>
        </div>
      </div>

      ${related.length > 0 ? `
        <section class="section" style="margin-top:var(--space-12)">
          <div class="section-header">
            <h2 class="section-title">Anuncios relacionados</h2>
          </div>
          <div class="ad-grid">
            ${related.map((a, i) => renderAdCard(a, i)).join('')}
          </div>
        </section>
      ` : ''}
    </div>
  `;
}

/* ---- Auth Page ---- */
function renderAuthPage(mode = 'register') {
  return `
    <div class="auth-page">
      ${renderAuthForm(mode)}
    </div>
  `;
}

/* ---- Publish Page ---- */
function renderPublishPage() {
  // Check if user is logged in
  if (!AuthStore.isLoggedIn()) {
    return `
      <div class="auth-required-page">
        <div class="auth-required-card">
          <div class="auth-required-icon">🔐</div>
          <h2 class="auth-required-title">Inicia sesión para publicar</h2>
          <p class="auth-required-text">
            Para publicar un anuncio necesitas crear una cuenta o iniciar sesión con tu correo electrónico.
          </p>
          <div class="auth-required-actions">
            <button class="btn btn-primary btn-lg" onclick="navigateTo('/auth')">📝 Registrarse / Iniciar Sesión</button>
          </div>
          <div class="auth-required-benefits">
            <div class="auth-benefit-item">✅ Publica anuncios gratuitos con fotos (30 días de vigencia)</div>
            <div class="auth-benefit-item">📸 Agrega hasta 3 fotos para mejor promoción</div>
            <div class="auth-benefit-item">🔄 Renueva gratis las veces que necesites</div>
            <div class="auth-benefit-item">🔒 Tu información está protegida</div>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="publish-page">
      <h1 class="publish-page-title">Publicar Anuncio</h1>
      <p class="publish-page-subtitle">Publicando como <strong>${escapeHtml(AuthStore.getCurrentEmail())}</strong></p>
      <div class="publish-form" id="publish-form-container">
        ${renderPublishForm()}
      </div>
    </div>
  `;
}

/* ---- My Ads Page ---- */
function renderMyAdsPage() {
  if (!AuthStore.isLoggedIn()) {
    return `
      <div class="auth-required-page">
        <div class="auth-required-card">
          <div class="auth-required-icon">🔐</div>
          <h2 class="auth-required-title">Inicia sesión para ver tus anuncios</h2>
          <p class="auth-required-text">Necesitas una cuenta para administrar tus anuncios.</p>
          <div class="auth-required-actions">
            <button class="btn btn-primary btn-lg" onclick="navigateTo('/auth')">📝 Registrarse / Iniciar Sesión</button>
          </div>
        </div>
      </div>
    `;
  }

  // Show loading placeholder — loadMyAds() in app.js will replace this content
  return `
    <div class="my-ads-page">
      <div class="my-ads-header">
        <div>
          <h1 class="my-ads-title">Mis Anuncios</h1>
          <p style="color:var(--text-muted);font-size:var(--text-sm);margin-top:var(--space-1)">
            Sesión: ${escapeHtml(AuthStore.getCurrentEmail())}
          </p>
        </div>
        <div style="display:flex;gap:var(--space-3)">
          <button class="btn btn-primary" onclick="navigateTo('/publish')">+ Publicar nuevo</button>
        </div>
      </div>
      <div style="text-align:center;padding:3rem 1rem;color:var(--text-muted)">⏳ Cargando tus anuncios...</div>
    </div>
  `;
}

/* ---- Chat Messages Renderer (from API data) ---- */
function renderChatMessagesFromData(messages, currentUserId) {
  if (!messages || messages.length === 0) {
    return `
      <div class="chat-empty">
        <div class="chat-empty-icon">💬</div>
        <div class="chat-empty-text">Inicia la conversación enviando un mensaje al vendedor.</div>
      </div>
    `;
  }
  return messages.map(msg => {
    const isOwn = msg.senderId === currentUserId;
    const roleCss = msg.role || (isOwn ? 'buyer' : 'seller');
    return `
      <div class="chat-message ${roleCss}">
        <div class="chat-bubble">${escapeHtml(msg.text)}</div>
        <div class="chat-message-meta">
          <span class="chat-message-sender">${msg.role === 'seller' ? '🏷️ Vendedor' : '🛒 Comprador'}</span>
          <span>· ${timeAgo(new Date(msg.createdAt).getTime())}</span>
        </div>
      </div>
    `;
  }).join('');
}

/* ---- Chats List Page ---- */
function renderChatsPage() {
  if (!AuthStore.isLoggedIn()) {
    return `
      <div class="auth-required-page">
        <div class="auth-required-card">
          <div class="auth-required-icon">🔐</div>
          <h2 class="auth-required-title">Inicia sesión para ver tus conversaciones</h2>
          <p class="auth-required-text">Necesitas una cuenta para acceder a tus mensajes.</p>
          <div class="auth-required-actions">
            <button class="btn btn-primary btn-lg" onclick="navigateTo('/auth')">📝 Iniciar sesión / Registrarse</button>
          </div>
        </div>
      </div>
    `;
  }
  return `
    <div class="my-ads-page">
      <div class="my-ads-header">
        <h1 class="my-ads-title">💬 Mis Conversaciones</h1>
      </div>
      <div id="chats-list-content">
        <div style="text-align:center;padding:3rem 1rem;color:var(--text-muted)">⏳ Cargando conversaciones...</div>
      </div>
    </div>
  `;
}

/* ---- Media Center Page ---- */
function renderMediaCenterPage() {
  return `
    <div class="media-center-page">
      <!-- Breadcrumb -->
      <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-6)">
        <a href="#" onclick="navigateTo('/');return false;" style="color:var(--text-muted);text-decoration:none;font-size:1.2rem">← Inicio</a>
      </div>

      <!-- Page Header -->
      <div class="mc-page-header">
        <h1 class="mc-page-title">🎬 Videos y Reels</h1>
        <p class="mc-page-subtitle">Descubre los mejores anuncios en video de Azcapotzalco</p>
      </div>

      <!-- SECCIÓN 1: VIDEO DESTACADO (HERO 16:9) — loaded dynamically -->
      <section class="mc-section" id="mc-hero-section">
        <h2 class="mc-section-title">Video Destacado</h2>
        <div id="mc-hero-container">
          <div style="text-align:center;padding:var(--space-8) 0;color:var(--text-muted);font-size:var(--text-sm)">Cargando video destacado…</div>
        </div>
      </section>

      <!-- SECCIÓN 2: REELS POPULARES (9:16 Carrusel) — loaded dynamically -->
      <section class="mc-section" id="mc-reels-section">
        <div class="mc-section-header">
          <h2 class="mc-section-title">Reels Populares</h2>
          <p class="mc-section-subtitle">Desliza para ver más →</p>
        </div>
        <div class="mc-reels-carousel" id="mc-reels-carousel">
          <div style="text-align:center;padding:var(--space-8) 0;color:var(--text-muted);font-size:var(--text-sm);width:100%">Cargando reels…</div>
        </div>
      </section>

      <!-- SECCIÓN 3: EXPLORAR VIDEOS (Grid 16:9) — loaded dynamically -->
      <section class="mc-section" id="mc-grid-section">
        <h2 class="mc-section-title">Explorar Videos</h2>
        <div class="mc-video-grid" id="mc-video-grid">
          <div style="text-align:center;padding:var(--space-8) 0;color:var(--text-muted);font-size:var(--text-sm);grid-column:1/-1">Cargando videos…</div>
        </div>
      </section>
    </div>

    <!-- MODAL PARA REPRODUCCIÓN INTERNA -->
    <div class="mc-video-modal" id="mc-video-modal">
      <div class="mc-modal-backdrop" onclick="closeVideoModal()"></div>
      <div class="mc-modal-content">
        <button class="mc-modal-close" onclick="closeVideoModal()">✕</button>
        <div class="mc-aspect-16-9">
          <iframe id="mc-modal-player" src="" title="Video Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen></iframe>
        </div>
        <div class="mc-modal-info">
          <h2 id="mc-modal-title" class="mc-modal-title-text">Título del Video</h2>
        </div>
      </div>
    </div>
  `;
}

/* ---- Empty State ---- */
function renderEmptyState() {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <div class="empty-state-title">Sin resultados</div>
      <p class="empty-state-text">No encontramos anuncios con esos criterios. Intenta cambiar los filtros.</p>
      <button class="btn btn-secondary" onclick="clearFilters()">Limpiar filtros</button>
    </div>
  `;
}

/* ---- Footer ---- */
function renderFooter() {
  return `
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="footer-brand-name"><img src="assets/logo.png" alt="Azcapo Clasificados" style="height:36px;filter:brightness(1.1)"></div>
            <p class="footer-brand-desc">La plataforma #1 de anuncios clasificados en Azcapotzalco. Compra, vende e intercambia de forma rápida y segura.</p>
          </div>
          <div>
            <div class="footer-col-title">Categorías</div>
            <div class="footer-links">
              ${CATEGORIES.slice(0, 8).map(c => `<a class="footer-link" href="#" onclick="navigateTo('/category/${c.id}');return false;">${c.emoji} ${c.name}</a>`).join('')}
            </div>
          </div>
          <div>
            <div class="footer-col-title">Más</div>
            <div class="footer-links">
              ${CATEGORIES.slice(8).map(c => `<a class="footer-link" href="#" onclick="navigateTo('/category/${c.id}');return false;">${c.emoji} ${c.name}</a>`).join('')}
            </div>
          </div>
          <div>
            <div class="footer-col-title">Cuenta y Blog</div>
            <div class="footer-links">
              <a class="footer-link" href="#" onclick="navigateTo('/publish');return false;">Publicar anuncio</a>
              <a class="footer-link" href="#" onclick="navigateTo('/my-ads');return false;">Mis anuncios</a>
              <a class="footer-link" href="/blog">📝 Blog de la Comunidad</a>
              <a class="footer-link" href="#" onclick="navigateTo('/media-center');return false;">🎬 Videos y Reels</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2026 Azcapo Clasificados — Todos los derechos reservados</span>
          <span>Hecho con ❤️ en México</span>
        </div>
      </div>
    </footer>
  `;
}
