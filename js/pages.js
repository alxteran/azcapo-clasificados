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

          <!-- Blog Preview Section -->
          <section class="section blog-preview-section" id="blog-preview-section">
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
          </section>
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
            <div class="auth-benefit-item">✅ Publica anuncios gratuitos con fotos (15 días de vigencia)</div>
            <div class="auth-benefit-item">📸 Agrega hasta 3 fotos para mejor promoción</div>
            <div class="auth-benefit-item">🔄 Renueva hasta 3 veces sin costo</div>
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
              ${CATEGORIES.slice(0, 7).map(c => `<a class="footer-link" href="#" onclick="navigateTo('/category/${c.id}');return false;">${c.emoji} ${c.name}</a>`).join('')}
            </div>
          </div>
          <div>
            <div class="footer-col-title">Más</div>
            <div class="footer-links">
              ${CATEGORIES.slice(7).map(c => `<a class="footer-link" href="#" onclick="navigateTo('/category/${c.id}');return false;">${c.emoji} ${c.name}</a>`).join('')}
            </div>
          </div>
          <div>
            <div class="footer-col-title">Cuenta y Blog</div>
            <div class="footer-links">
              <a class="footer-link" href="#" onclick="navigateTo('/publish');return false;">Publicar anuncio</a>
              <a class="footer-link" href="#" onclick="navigateTo('/my-ads');return false;">Mis anuncios</a>
              <a class="footer-link" href="/blog">📝 Blog de la Comunidad</a>
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
