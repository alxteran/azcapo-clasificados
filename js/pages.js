/* ============================================
   CLASIFICADOS MX — Pages
   ============================================ */

/* ---- Home Page ---- */
function renderHomePage() {
  const featured = Store.getFeatured();
  const recent = Store.getRecent(8);
  const total = Store.getTotalCount();

  return `
    <section class="hero">
      <div class="container">
        <h1 class="hero-title">Encuentra lo que <span class="gradient-text">buscas</span></h1>
        <p class="hero-subtitle">Tu comunidad de anuncios clasificados en Azcapotzalco. Compra, vende e intercambia de forma rápida y segura.</p>
        <div class="hero-search">
          ${renderSearchBar('', '¿Qué estás buscando?')}
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
            <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-4);flex-wrap:wrap;">
              ${isPremium ? '<span class="badge badge-premium">⭐ Premium</span>' : '<span class="badge badge-free">Gratis</span>'}
              <span class="badge badge-category">${cat.emoji} ${escapeHtml(cat.name)}</span>
              ${(Date.now() - ad.createdAt) < 86400000 * 3 ? '<span class="badge badge-new">Nuevo</span>' : ''}
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
            <div class="chat-role-switcher" style="margin-bottom:var(--space-4)">
              <div class="chat-role-btn active" id="role-buyer" onclick="switchChatRole('${ad.id}','buyer')">🛒 Comprador</div>
              <div class="chat-role-btn" id="role-seller" onclick="switchChatRole('${ad.id}','seller')">🏷️ Vendedor</div>
            </div>
            <div class="chat-panel" id="chat-panel-${ad.id}">
              <div class="chat-messages" id="chat-messages-${ad.id}">
                ${renderChatMessages(ad.id)}
              </div>
              <div class="chat-input-bar">
                <input class="chat-input" type="text" id="chat-input-${ad.id}" placeholder="Escribe un mensaje..." onkeydown="if(event.key==='Enter'){sendChatMessage('${ad.id}');event.preventDefault()}" autocomplete="off">
                <button class="chat-send-btn" onclick="sendChatMessage('${ad.id}')" title="Enviar">➤</button>
              </div>
            </div>
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
function renderPublishPage(type = 'free') {
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
            <div class="auth-benefit-item">✅ Publica anuncios gratuitos (15 días, hasta 3 renovaciones)</div>
            <div class="auth-benefit-item">⭐ Anuncios Premium por solo $56.23 MXN/mes (30 días, renovaciones ilimitadas)</div>
            <div class="auth-benefit-item">📸 Agrega fotos y textos para mejor promoción</div>
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
        ${renderPublishForm(type)}
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

/* ---- Chat Messages Renderer ---- */
function renderChatMessages(adId) {
  const messages = ChatStore.getMessages(adId);
  if (messages.length === 0) {
    return `
      <div class="chat-empty">
        <div class="chat-empty-icon">💬</div>
        <div class="chat-empty-text">Inicia la conversación. Escribe un mensaje al vendedor sobre este anuncio.</div>
      </div>
    `;
  }
  return messages.map(msg => `
    <div class="chat-message ${msg.sender}">
      <div class="chat-bubble">${escapeHtml(msg.text)}</div>
      <div class="chat-message-meta">
        <span class="chat-message-sender">${msg.sender === 'buyer' ? '🛒 Comprador' : '🏷️ Vendedor'}</span>
        <span>· ${timeAgo(msg.timestamp)}</span>
      </div>
    </div>
  `).join('');
}

/* ---- Chats List Page ---- */
function renderChatsPage() {
  const chats = ChatStore.getAllChats();
  return `
    <div class="my-ads-page">
      <div class="my-ads-header">
        <h1 class="my-ads-title">💬 Mis Conversaciones</h1>
      </div>
      ${chats.length > 0
        ? `<div style="display:flex;flex-direction:column;gap:var(--space-4)">
            ${chats.map(chat => {
              const ad = Store.getById(chat.adId);
              if (!ad) return '';
              const cat = getCategoryById(ad.category);
              const lastMsg = chat.messages[chat.messages.length - 1];
              const unread = chat.messages.filter(m => !m.read).length;
              return `
                <div class="chat-list-item" onclick="navigateTo('/ad/${ad.id}')">
                  <div class="chat-list-icon">${cat.emoji}</div>
                  <div class="chat-list-info">
                    <div class="chat-list-title">${escapeHtml(ad.title)}</div>
                    <div class="chat-list-preview">
                      ${lastMsg ? `${lastMsg.sender === 'buyer' ? '🛒' : '🏷️'} ${escapeHtml(lastMsg.text)}` : 'Sin mensajes'}
                    </div>
                  </div>
                  <div class="chat-list-meta">
                    <span class="chat-list-time">${lastMsg ? timeAgo(lastMsg.timestamp) : ''}</span>
                    ${unread > 0 ? `<span class="chat-unread-badge">${unread}</span>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>`
        : `<div class="empty-state">
            <div class="empty-state-icon">💬</div>
            <div class="empty-state-title">No tienes conversaciones</div>
            <p class="empty-state-text">Cuando envíes un mensaje en un anuncio, la conversación aparecerá aquí.</p>
            <button class="btn btn-primary" onclick="navigateTo('/')">Explorar anuncios</button>
          </div>`
      }
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
            <div class="footer-col-title">Cuenta</div>
            <div class="footer-links">
              <a class="footer-link" href="#" onclick="navigateTo('/publish');return false;">Publicar anuncio</a>
              <a class="footer-link" href="#" onclick="navigateTo('/my-ads');return false;">Mis anuncios</a>
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
