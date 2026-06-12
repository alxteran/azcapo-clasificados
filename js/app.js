/* ============================================
   CLASIFICADOS MX — App (Router + Init) — API-backed
   ============================================ */

let currentRoute = '';
let currentFilters = {};
let currentQuery = '';
let publishType = 'free';
let uploadedImages = [];
let currentChatRole = 'buyer';
let authMode = 'register';
let openCatSub = null;
let welcomeBannerTimer = null;
let welcomeBannerCountdown = null;

/* ---- Category Sidebar Toggle ---- */
function toggleCatSub(catId) {
  const subList = document.getElementById('sub-' + catId);
  const arrow = document.getElementById('arrow-' + catId);
  if (!subList) return;

  // Close previously open
  if (openCatSub && openCatSub !== catId) {
    const prevSub = document.getElementById('sub-' + openCatSub);
    const prevArrow = document.getElementById('arrow-' + openCatSub);
    const prevItem = document.getElementById('cat-item-' + openCatSub);
    if (prevSub) prevSub.style.display = 'none';
    if (prevArrow) prevArrow.classList.remove('rotated');
    if (prevItem) prevItem.classList.remove('expanded');
  }

  const isOpen = subList.style.display !== 'none';
  subList.style.display = isOpen ? 'none' : 'block';
  arrow.classList.toggle('rotated', !isOpen);
  document.getElementById('cat-item-' + catId).classList.toggle('expanded', !isOpen);
  openCatSub = isOpen ? null : catId;
}

/* ---- Router ---- */
function navigateTo(path) {
  window.location.hash = '#' + path;
}

function parseRoute() {
  const hash = window.location.hash.slice(1) || '/';
  return hash;
}

function router() {
  const path = parseRoute();
  if (path === currentRoute && path !== '/search') return;
  currentRoute = path;

  const appContent = document.getElementById('app-content');
  let html = '';

  if (path === '/' || path === '') {
    html = renderHomePage();
    updateActiveNav('home');
  } else if (path.startsWith('/category/')) {
    const catId = path.split('/category/')[1];
    html = renderCategoryPage(catId);
    updateActiveNav(catId);
  } else if (path.startsWith('/ad/')) {
    const adId = path.split('/ad/')[1];
    html = renderAdDetailPage(adId);
    updateActiveNav('');
    // Load chat from API after page renders
    if (AuthStore.isLoggedIn()) {
      setTimeout(() => loadChatForAd(adId), 0);
    }
    // Init detail mini-map if ad has coordinates
    const detailAd = Store.getById(adId);
    if (detailAd && detailAd.latitude && detailAd.longitude) {
      setTimeout(() => initDetailMap('detail-map-' + adId, detailAd.latitude, detailAd.longitude), 200);
    }
  } else if (path === '/publish') {
    html = renderPublishPage();
    updateActiveNav('publish');
    // Init map widget after DOM renders
    setTimeout(() => initAgMap(), 100);
  } else if (path === '/my-ads') {
    html = renderMyAdsPage();
    updateActiveNav('my-ads');
    // Fetch my ads from API and re-render
    loadMyAds();
  } else if (path === '/admin') {
    if (!AuthStore.isLoggedIn() || AuthStore.getCurrentEmail() !== 'alxteran@gmail.com') {
      navigateTo('/'); return;
    }
    html = renderAdminPage();
    updateActiveNav('');
    setTimeout(() => { loadAdminVideos(); loadAdminReels(); loadAdminExploreVideos(); loadAdminMessages(); loadAdminMetrics(); }, 100);
  } else if (path === '/contact') {
    html = renderContactPage();
    updateActiveNav('contact');
    setTimeout(() => initContactWordCounter(), 50);
  } else if (path === '/auth') {
    html = renderAuthPage(authMode);
    updateActiveNav('auth');
  } else if (path === '/chats') {
    html = renderChatsPage();
    updateActiveNav('chats');
    // Load conversations from API
    if (AuthStore.isLoggedIn()) {
      setTimeout(() => loadChatsPage(), 0);
    }
  } else if (path.startsWith('/search')) {
    const params = new URLSearchParams(path.split('?')[1] || '');
    currentQuery = params.get('q') || '';
    if (params.get('type')) currentFilters.type = params.get('type');
    html = renderSearchPage(currentQuery, currentFilters);
    updateActiveNav('');
  } else if (path === '/media-center') {
    html = renderMediaCenterPage();
    updateActiveNav('media-center');
  } else if (path.startsWith('/tienda/')) {
    const slug = path.split('/tienda/')[1];
    html = renderStorePlaceholderPage(slug);
    updateActiveNav('');
    setTimeout(() => loadStorePage(slug), 0);
  } else {
    html = renderHomePage();
    updateActiveNav('home');
  }

  appContent.innerHTML = html;
  appContent.insertAdjacentHTML('beforeend', renderFooter());

  window.scrollTo({ top: 0, behavior: 'smooth' });
  bindSearchEvents();
  closeMobileMenu();

  // The welcome banner has been disabled.

  // Initialise hero image carousel on home page
  if (path === '/' || path === '') {
    heroCarousel.stop();
    setTimeout(() => heroCarousel.init(), 0);
    setTimeout(() => loadBlogPreview(), 200);
    setTimeout(() => loadYtVideos(), 300);
  }

  // Init Media Center components
  if (path === '/media-center') {
    setTimeout(() => initMediaCenter(), 200);
  }

  // If on auth page, generate and draw CAPTCHA
  if (path === '/auth') {
    setTimeout(() => {
      CaptchaManager.generate();
      CaptchaManager.drawToCanvas('captcha-canvas');
    }, 50);
  }
}

/** Async load of my ads from API, then re-render the grid */
async function loadMyAds() {
  if (!AuthStore.isLoggedIn()) return;
  try {
    const myAds = await Store.fetchMyAds();
    const container = document.querySelector('.my-ads-page');
    if (!container) return;

    const activeAds = myAds.filter(a => !a.suspended && a.status !== 'suspended');
    const suspendedAds = myAds.filter(a => a.suspended || a.status === 'suspended');

    let html = `
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
    `;

    if (activeAds.length > 0) {
      html += `
        <div class="my-ads-section">
          <h2 class="my-ads-section-title">✅ Anuncios Activos (${activeAds.length})</h2>
          <div class="ad-grid">${activeAds.map((a, i) => renderMyAdCard(a, i)).join('')}</div>
        </div>
      `;
    }
    if (suspendedAds.length > 0) {
      html += `
        <div class="my-ads-section">
          <h2 class="my-ads-section-title">🚫 Anuncios Suspendidos (${suspendedAds.length})</h2>
          <p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:var(--space-4)">
            Estos anuncios han expirado. Renuévalos para reactivarlos.
          </p>
          <div class="ad-grid">${suspendedAds.map((a, i) => renderMyAdCard(a, i)).join('')}</div>
        </div>
      `;
    }
    if (myAds.length === 0) {
      html += `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">No tienes anuncios</div>
          <p class="empty-state-text">Los anuncios que publiques aparecerán aquí.</p>
          <button class="btn btn-primary" onclick="navigateTo('/publish')">Publicar mi primer anuncio</button>
        </div>
      `;
    }
    container.innerHTML = html;
  } catch (e) {
    console.error('Failed to load my ads:', e);
  }
}

/* ---- Navigation Highlighting ---- */
function updateActiveNav(id) {
  document.querySelectorAll('.header-nav-link').forEach(el => {
    el.classList.toggle('active', el.dataset.nav === id);
  });
}

/* ---- Header Rendering ---- */
function renderHeader() {
  const isLoggedIn = AuthStore.isLoggedIn();
  const email = AuthStore.getCurrentEmail();

  return `
    <header class="header" id="header">
      <div class="header-inner">
        <div class="header-logo" onclick="navigateTo('/')">
          <img src="assets/logo.png" alt="Azcapo Clasificados" class="header-logo-img">
        </div>
        <div class="header-actions">
          <a class="header-nav-link" href="/blog" style="color:var(--text-secondary)" title="Blog de la comunidad">
            📝 <span class="btn-text">Blog</span>
          </a>
          <a class="header-nav-link" data-nav="media-center" href="#/media-center" onclick="return false" style="color:var(--text-secondary)" title="Videos y Reels">
            🎬 <span class="btn-text">Videos</span>
          </a>
          <a class="header-nav-link" data-nav="contact" href="#/contact" onclick="return false" style="color:var(--text-secondary)" title="Buzón de comentarios">
            📬 <span class="btn-text">Contacto</span>
          </a>
          ${isLoggedIn ? `
            <a class="header-nav-link" data-nav="my-ads" href="#/my-ads" onclick="return false" style="color:var(--text-secondary)">
              📌 <span class="btn-text">Mis Anuncios</span>
            </a>
            ${email === 'alxteran@gmail.com' ? `
            <a class="header-nav-link" data-nav="admin" href="#/admin" onclick="return false" style="color:var(--text-secondary)" title="Panel de Administración">
              ⚙️ <span class="btn-text">Admin</span>
            </a>
            ` : ''}
            <div class="header-user-info">
              <span class="header-user-email">👤 <span class="btn-text">${escapeHtml(email)}</span></span>
              <button class="btn btn-ghost btn-sm" onclick="handleLogout()" title="Cerrar sesión">
                🚪 <span class="btn-text">Salir</span>
              </button>
            </div>
          ` : `
            <a class="header-nav-link" data-nav="auth" href="#/auth" onclick="return false" style="color:var(--text-secondary)">
              🔐 <span class="btn-text">Iniciar Sesión</span>
            </a>
          `}
          <button class="btn-publish" onclick="navigateTo('/publish')">
            <span class="btn-icon">+</span>
            <span class="btn-text">Publicar</span>
          </button>
          <button class="mobile-menu-btn" id="mobile-menu-btn" onclick="toggleMobileMenu()">☰</button>
        </div>
      </div>
    </header>
  `;
}

/* ---- Mobile Menu ---- */
function toggleMobileMenu() {
  const nav = document.getElementById('header-nav');
  nav.classList.toggle('open');
}

function closeMobileMenu() {
  const nav = document.getElementById('header-nav');
  if (nav) nav.classList.remove('open');
}

/* ---- Mobile Sidebar ---- */
function toggleMobileSidebar() {
  const sidebar = document.getElementById('page-sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

/* ---- Search Events ---- */
function bindSearchEvents() {
  const input = document.getElementById('search-input');
  if (!input) return;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = input.value.trim();
      currentQuery = q;
      navigateTo('/search?q=' + encodeURIComponent(q));
    }
  });
}

/* ---- Filters ---- */
function applyFilters() {
  const typeEl = document.querySelector('input[name="filter-type"]:checked');
  const catEl = document.querySelector('input[name="filter-cat"]:checked');
  const minEl = document.getElementById('filter-min-price');
  const maxEl = document.getElementById('filter-max-price');
  const sortEl = document.getElementById('sort-select');

  currentFilters = {};
  if (typeEl && typeEl.value) currentFilters.type = typeEl.value;
  if (catEl && catEl.value) currentFilters.category = catEl.value;
  if (minEl && minEl.value) currentFilters.minPrice = Number(minEl.value);
  if (maxEl && maxEl.value) currentFilters.maxPrice = Number(maxEl.value);
  if (sortEl && sortEl.value) currentFilters.sort = sortEl.value;

  // Re-render main content area
  const pageMain = document.querySelector('.page-main');
  if (pageMain) {
    const results = Store.search(currentQuery, currentFilters);
    pageMain.innerHTML = renderSortBar(results.length, currentFilters.sort) +
      (results.length > 0
        ? `<div class="ad-grid">${results.map((a, i) => renderAdCard(a, i)).join('')}</div>`
        : renderEmptyState());
  }
}

function clearFilters() {
  currentFilters = {};
  currentQuery = '';
  navigateTo('/search');
}

/* ---- Welcome Banner ---- */
function openWelcomeBanner() {
  const banner = document.getElementById('welcome-banner');
  if (!banner) return;

  // Slide open
  requestAnimationFrame(() => banner.classList.add('open'));

  // Start 20-second countdown with progress bar
  const duration = 20000;
  const startTime = Date.now();
  const progressBar = document.getElementById('welcome-banner-progress');

  welcomeBannerCountdown = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 1 - elapsed / duration);
    if (progressBar) progressBar.style.width = (remaining * 100) + '%';
    if (elapsed >= duration) {
      clearInterval(welcomeBannerCountdown);
    }
  }, 200);

  // Auto-close after 20 seconds
  welcomeBannerTimer = setTimeout(() => closeWelcomeBanner(), duration);
}

function closeWelcomeBanner() {
  const banner = document.getElementById('welcome-banner');
  if (!banner) return;

  // Clear timers
  if (welcomeBannerTimer) { clearTimeout(welcomeBannerTimer); welcomeBannerTimer = null; }
  if (welcomeBannerCountdown) { clearInterval(welcomeBannerCountdown); welcomeBannerCountdown = null; }

  // Animate close
  banner.classList.add('closing');
  banner.classList.remove('open');

  // Mark as seen for this session
  sessionStorage.setItem('welcome_banner_seen', '1');

  // Remove from DOM after animation
  setTimeout(() => banner.remove(), 800);
}

/* ---- Publish Handlers ---- */
function handleImageUpload(event) {
  const files = Array.from(event.target.files);
  const maxImages = 3;

  files.slice(0, maxImages - uploadedImages.length).forEach(file => {
    // Compress image before storing
    compressImage(file, 800, 0.7).then(dataUrl => {
      uploadedImages.push(dataUrl);
      renderImagePreviews();
    });
  });
}

/** Compress image to max dimensions and quality using canvas */
function compressImage(file, maxSize, quality) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderImagePreviews() {
  const grid = document.getElementById('image-preview-grid');
  if (!grid) return;
  grid.innerHTML = uploadedImages.map((img, i) => `
    <div class="image-preview-item">
      <img src="${img}" alt="Foto ${i + 1}">
      <div class="image-preview-remove" onclick="removeUploadedImage(${i})">✕</div>
    </div>
  `).join('');
}

function removeUploadedImage(index) {
  uploadedImages.splice(index, 1);
  renderImagePreviews();
}

/* ---- Publish (API-backed) ---- */
async function handlePublish(event) {
  event.preventDefault();

  if (!AuthStore.isLoggedIn()) {
    showToast('Debes iniciar sesión para publicar.', 'error');
    navigateTo('/auth');
    return;
  }

  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  // Disable button
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Publicando...';

  try {
    const data = new FormData(form);
    const latVal = data.get('latitude');
    const lngVal = data.get('longitude');
    const ad = {
      title: data.get('title'),
      description: data.get('description'),
      category: data.get('category'),
      price: Number(data.get('price')),
      location: data.get('location'),
      type: 'free',
      images: [...uploadedImages],
      latitude: latVal ? Number(latVal) : null,
      longitude: lngVal ? Number(lngVal) : null,
      contact: {
        name: AuthStore.getCurrentEmail(),
        phone: 'No especificado',
        email: AuthStore.getCurrentEmail(),
      }
    };

    const newAd = await Store.add(ad);
    uploadedImages = [];

    // Show confirmation page with community message
    showPublishConfirmation(newAd);
  } catch (error) {
    console.error('Publish error:', error);
    showToast(error.message || 'Error al publicar anuncio.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/** Show confirmation page after successful publish — with boost upsell modal */
function showPublishConfirmation(ad) {
  const adId = ad.public_id || ad.id;
  const adTitle = ad.title || 'Tu anuncio';
  const appContent = document.getElementById('app-content');

  // Reset currentRoute so navigateTo can work from this state
  currentRoute = '__confirmation__';

  appContent.innerHTML = `
    <div class="publish-page">
      <div class="publish-confirmation">
        <div class="confirmation-icon">🎉</div>
        <h2 class="confirmation-title">¡Tu anuncio ha sido publicado!</h2>
        <p class="confirmation-subtitle">Tu anuncio estará visible durante 30 días.</p>

        <div class="confirmation-ad-link">
          <button class="btn btn-primary" onclick="navigateTo('/ad/${adId}')">
            👁️ Ver mi anuncio
          </button>
        </div>

        <div class="confirmation-community">
          <div class="confirmation-community-inner">
            <p>Este portal ha sido creado con un propósito claro: <strong>dar un mayor impulso al comercio local.</strong></p>
            <p>A través de AzcapoClasificados, cualquier persona tendrá una herramienta sencilla y efectiva para impulsar y promover sus productos y servicios.</p>
            <p class="confirmation-highlight">Porque cuando el comercio local gana, todos ganamos.</p>
          </div>
          <div class="confirmation-cafe-cta">
            <button class="btn btn-cafe" onclick="window.open('https://mpago.la/1YvFDqr', '_blank')">
              ☕ Gracias por el café — $56.23 MXN
            </button>
            <span class="confirmation-cafe-hint">Tu apoyo nos ayuda a mantener este proyecto vivo</span>
          </div>
        </div>

        <div class="confirmation-actions">
          <button class="btn btn-secondary" onclick="navigateTo('/')">
            🏠 Ir al inicio
          </button>
          <button class="btn btn-ghost" onclick="navigateTo('/publish')">
            📝 Publicar otro anuncio
          </button>
        </div>
      </div>
    </div>
  `;

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Show boost upsell modal after a short delay
  // Track: upsell modal was displayed
  setTimeout(() => { showBoostUpsellModal(adId, adTitle); trackEvent('ad_published', { ad_id: adId }); }, 800);
}

/** Render and show the boost upsell modal */
function showBoostUpsellModal(adId, adTitle) {
  // Remove any existing modal
  const existing = document.getElementById('upsell-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'upsell-overlay';
  overlay.className = 'upsell-overlay';
  overlay.innerHTML = `
    <div class="upsell-modal" role="dialog" aria-modal="true" aria-labelledby="upsell-title">
      <div class="upsell-modal__success">
        <div class="upsell-modal__check">✅</div>
        <div>
          <p class="upsell-modal__title" id="upsell-title">Tu anuncio ya está activo</p>
          <p class="upsell-modal__subtitle">${escapeHtml(adTitle.substring(0, 45))}${adTitle.length > 45 ? '…' : ''}</p>
        </div>
      </div>

      <p class="upsell-modal__cta">¿Quieres que más personas lo vean?</p>
      <p class="upsell-modal__desc">Elige un nivel para destacarlo — aparece arriba de todos los anuncios gratuitos.</p>

      <div class="upsell-levels">
        <div class="upsell-level">
          <div class="upsell-level__header">
            <span class="upsell-level__name">▲ Básico</span>
            <span class="upsell-level__price">$80 <span>MXN</span></span>
          </div>
          <p class="upsell-level__desc">Aparece arriba en su categoría · 3 días</p>
          <button class="upsell-level__btn" id="boost-btn-basic" onclick="handleBoostPayment('${adId}', 'basic')">Elegir Básico</button>
        </div>

        <div class="upsell-level upsell-level--popular">
          <span class="upsell-level__popular-badge">🔥 Más elegido</span>
          <div class="upsell-level__header">
            <span class="upsell-level__name">🔥 Destacado</span>
            <span class="upsell-level__price">$150 <span>MXN</span></span>
          </div>
          <p class="upsell-level__desc">Categoría + sección Destacados en home · 7 días</p>
          <button class="upsell-level__btn" id="boost-btn-featured" onclick="handleBoostPayment('${adId}', 'featured')">Elegir Destacado</button>
        </div>

        <div class="upsell-level">
          <div class="upsell-level__header">
            <span class="upsell-level__name">⭐ Premium</span>
            <span class="upsell-level__price">$280 <span>MXN</span></span>
          </div>
          <p class="upsell-level__desc">Todo lo anterior + 5 fotos extra · 7 días</p>
          <button class="upsell-level__btn" id="boost-btn-premium" onclick="handleBoostPayment('${adId}', 'premium')">Elegir Premium</button>
        </div>
      </div>

      <button class="upsell-skip" onclick="closeBoostUpsellModal('skip')">No gracias, solo publicar gratis</button>
    </div>
  `;

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeBoostUpsellModal('backdrop');
  });

  document.body.appendChild(overlay);

  // Track: modal was shown to this user
  trackEvent('upsell_shown', { ad_id: adId });
}

function closeBoostUpsellModal(reason) {
  const overlay = document.getElementById('upsell-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s';
    setTimeout(() => overlay.remove(), 200);
  }
  if (reason === 'skip')     trackEvent('upsell_skip');
  if (reason === 'backdrop') trackEvent('upsell_backdrop');
}

/** Handle boost payment — calls API and redirects to MercadoPago */
async function handleBoostPayment(adId, boostLevel) {
  const btn = document.getElementById('boost-btn-' + boostLevel);
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Procesando...'; }

  // Track: user clicked a specific level
  trackEvent('upsell_level_click', { level: boostLevel, ad_id: adId });

  try {
    const data = await apiRequest('/api/payments/create-preference', {
      method: 'POST',
      body: JSON.stringify({ ad_public_id: adId, boost_level: boostLevel, payment_type: 'boost' }),
    });

    if (data.init_point) {
      // Track: user is being redirected to MercadoPago
      trackEvent('boost_initiated', { level: boostLevel, price: data.price, ad_id: adId });
      // Small delay so the event fires before navigation
      setTimeout(() => { window.location.href = data.init_point; }, 150);
    } else {
      throw new Error(data.error || 'No se pudo generar el enlace de pago');
    }
  } catch (err) {
    console.error('Boost payment error:', err);
    showToast(err.message || 'Error al procesar el pago. Intenta de nuevo.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Elegir ' + boostLevel; }
  }
}

/**
 * Lightweight analytics tracker — fire-and-forget, never blocks UX.
 * Sends events to /api/analytics/event (stored in Neon DB).
 */
function trackEvent(event, properties = {}) {
  try {
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, properties }),
      keepalive: true, // ensures the request completes even if page navigates away
    }).catch(() => {}); // silently ignore failures
  } catch (_) {
    // never throw from analytics
  }
}

/** Store page — placeholder while loading */
function renderStorePlaceholderPage(slug) {
  return `<div class="container" id="store-page-container"><div style="text-align:center;padding:4rem 1rem;color:var(--text-muted)">⏳ Cargando tienda...</div></div>`;
}

/** Async load of store page */
async function loadStorePage(slug) {
  const container = document.getElementById('store-page-container');
  if (!container) return;
  try {
    const data = await Store.fetchStore(slug);
    if (!data || !data.success) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏪</div><div class="empty-state-title">Tienda no encontrada</div><p class="empty-state-text">Esta tienda no existe o ya no está activa.</p><button class="btn btn-primary" onclick="navigateTo('/')">Volver al inicio</button></div>`;
      return;
    }
    const { store, ads } = data;
    const planLabels = { basic: 'Básica', plus: 'Plus', pro: 'Pro' };
    container.innerHTML = `
      <div class="store-header">
        <div class="store-header__logo">
          ${store.logo_url ? `<img src="${escapeHtml(store.logo_url)}" alt="Logo">` : '🏪'}
        </div>
        <div>
          <div class="store-header__verified">✅ Tienda ${planLabels[store.plan] || 'Verificada'}</div>
          <h1 class="store-header__name">${escapeHtml(store.name)}</h1>
          ${store.description ? `<p class="store-header__desc">${escapeHtml(store.description)}</p>` : ''}
          ${store.avg_rating > 0 ? `<div style="margin-bottom:10px">${renderStarRating(store.avg_rating, store.total_reviews)}</div>` : ''}
          ${store.whatsapp ? `<a class="store-header__wa-btn" href="https://wa.me/${store.whatsapp.replace(/\D/g,'')}" target="_blank" rel="noopener">💬 Contactar por WhatsApp</a>` : ''}
        </div>
      </div>
      <h2 style="font-size:18px;font-weight:700;margin-bottom:16px">Anuncios de la tienda (${ads.length})</h2>
      ${ads.length > 0
        ? `<div class="ad-grid">${ads.map((a, i) => renderAdCard(normalizeAd ? normalizeAd(a) : a, i)).join('')}</div>`
        : `<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">Sin anuncios aún</div></div>`
      }
      <div class="reviews-section" id="store-reviews-${store.owner_id}">
        <div class="reviews-section__title">⭐ Reseñas del vendedor</div>
        <div id="reviews-list-${store.owner_id}"><div style="color:var(--text-muted);font-size:14px">⏳ Cargando reseñas...</div></div>
        ${AuthStore.isLoggedIn() ? `
          <div class="review-form" id="review-form-${store.owner_id}">
            <div style="font-size:14px;font-weight:600;margin-bottom:10px">Dejar una reseña</div>
            <div class="review-form__stars" id="star-selector-${store.owner_id}">
              ${[1,2,3,4,5].map(n => `<span class="review-form__star" data-val="${n}" onclick="selectReviewStar(${store.owner_id}, ${n})">★</span>`).join('')}
            </div>
            <input type="hidden" id="review-rating-${store.owner_id}" value="0">
            <textarea id="review-comment-${store.owner_id}" placeholder="Cuéntanos tu experiencia con este vendedor..." style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border-color,#e5e7eb);font-size:14px;resize:vertical;min-height:80px;box-sizing:border-box;margin-bottom:10px"></textarea>
            <button class="btn btn-primary" onclick="submitReview(${store.owner_id})" id="submit-review-btn-${store.owner_id}">Enviar reseña</button>
          </div>
        ` : `<p style="font-size:13px;color:var(--text-muted);margin-top:12px"><a href="#" onclick="navigateTo('/auth');return false;">Inicia sesión</a> para dejar una reseña.</p>`}
      </div>
    `;
    // Load reviews async
    loadReviewsForSeller(store.owner_id);
  } catch (err) {
    console.error('loadStorePage error:', err);
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Error al cargar tienda</div></div>`;
  }
}

/** Load reviews for a seller and render them */
async function loadReviewsForSeller(sellerId) {
  const container = document.getElementById('reviews-list-' + sellerId);
  if (!container) return;
  try {
    const data = await Store.fetchReviews(sellerId);
    const reviews = data.reviews || [];
    if (!reviews.length) {
      container.innerHTML = `<p style="font-size:13px;color:var(--text-muted)">Aún no hay reseñas para este vendedor. ¡Sé el primero!</p>`;
      return;
    }
    container.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="review-card__header">
          <div>
            ${renderStarRating(r.rating, 0)}
            <span class="review-card__author">${escapeHtml(r.reviewer_email ? r.reviewer_email.split('@')[0] : 'Anónimo')}</span>
          </div>
          <span class="review-card__date">${r.created_at ? new Date(r.created_at).toLocaleDateString('es-MX') : ''}</span>
        </div>
        ${r.comment ? `<p class="review-card__comment">${escapeHtml(r.comment)}</p>` : ''}
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p style="font-size:13px;color:var(--text-muted)">Error al cargar reseñas.</p>`;
  }
}

/** Star selector for review form */
function selectReviewStar(sellerId, value) {
  document.getElementById('review-rating-' + sellerId).value = value;
  const stars = document.querySelectorAll(`#star-selector-${sellerId} .review-form__star`);
  stars.forEach((s, i) => s.classList.toggle('active', i < value));
}

/** Submit a review */
async function submitReview(sellerId) {
  const rating = Number(document.getElementById('review-rating-' + sellerId)?.value || 0);
  const comment = document.getElementById('review-comment-' + sellerId)?.value?.trim() || '';
  const btn = document.getElementById('submit-review-btn-' + sellerId);

  if (!rating) { showToast('Selecciona una calificación (1-5 estrellas)', 'error'); return; }
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Enviando...'; }

  try {
    const result = await Store.submitReview({ seller_id: sellerId, rating, comment });
    if (result.success) {
      showToast('¡Gracias por tu reseña! 🌟', 'success');
      document.getElementById('review-form-' + sellerId)?.remove();
      loadReviewsForSeller(sellerId);
    } else {
      throw new Error(result.message || 'Error al enviar reseña');
    }
  } catch (err) {
    showToast(err.message || 'Error al enviar reseña.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Enviar reseña'; }
  }
}

/* ---- Payment Return Handler ---- */
function handlePaymentReturn() {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment_status');
  const ref = urlParams.get('ref');

  if (!paymentStatus) return;

  // Clean URL
  window.history.replaceState({}, '', window.location.pathname);

  if (paymentStatus === 'approved') {
    showToast('¡Pago aprobado! Tu anuncio Premium está activo.', 'success');
    if (ref) {
      setTimeout(() => navigateTo('/ad/' + ref), 500);
    }
  } else if (paymentStatus === 'pending') {
    showToast('Tu pago está pendiente de confirmación. El anuncio se activará al confirmarse.', 'info');
  } else {
    showToast('El pago fue rechazado. Puedes intentar de nuevo desde "Mis Anuncios".', 'error');
  }
}

/* ---- Auth Handlers (async) ---- */
function switchAuthMode(mode) {
  authMode = mode;
  const container = document.querySelector('.auth-page');
  if (container) {
    container.innerHTML = renderAuthForm(mode);
    setTimeout(() => {
      CaptchaManager.generate();
      CaptchaManager.drawToCanvas('captcha-canvas');
    }, 50);
  }
}

function refreshCaptcha() {
  CaptchaManager.generate();
  CaptchaManager.drawToCanvas('captcha-canvas');
  const input = document.getElementById('auth-captcha');
  if (input) input.value = '';
}

async function handleAuth(event, mode) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  const data = new FormData(form);

  const email = data.get('email');
  const password = data.get('password');
  const captcha = data.get('captcha');

  // Disable button
  submitBtn.disabled = true;
  submitBtn.innerHTML = '⏳ Procesando...';

  try {
    let result;
    if (mode === 'register') {
      result = await AuthStore.register(email, password, captcha);
    } else {
      result = await AuthStore.login(email, password, captcha);
    }

    const errorEl = document.getElementById('auth-error');

    if (result.success) {
      showToast(result.message, 'success');
      // Re-render header to show logged-in state
      updateHeaderState();
      ChatStore.reloadForUser(); // Switch chat store to this user's private key
      navigateTo('/publish');
    } else {
      // Show error inline
      if (errorEl) {
        errorEl.textContent = result.message;
        errorEl.style.display = 'block';
      }
      showToast(result.message, 'error');
      // Refresh CAPTCHA on failure
      refreshCaptcha();
    }
  } catch (error) {
    showToast('Error de conexión. Intenta de nuevo.', 'error');
    refreshCaptcha();
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

function handleLogout() {
  AuthStore.logout();
  ChatStore.reloadForUser(); // Switch chat store to anonymous/guest key
  updateHeaderState();
  showToast('Sesión cerrada correctamente.', 'info');
  navigateTo('/');
}

function updateHeaderState() {
  const headerEl = document.getElementById('header');
  if (headerEl) {
    headerEl.outerHTML = renderHeader();
  }
}

/* ---- Renewal Handler (async) ---- */
async function handleRenewAd(adId) {
  try {
    const result = await Store.renewAd(adId);
    if (result.success) {
      showToast(result.message, 'success');
      // Re-render the page to reflect updated state
      currentRoute = ''; // force re-render
      navigateTo('/my-ads');
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    showToast('Error al renovar anuncio.', 'error');
  }
}

/* ---- Edit Ad Handlers ---- */
let editUploadedImages = [];

/** Open the edit modal pre-filled with the ad's current data */
function handleEditAd(adId) {
  const ad = Store.getById(adId);
  if (!ad) { showToast('Anuncio no encontrado.', 'error'); return; }

  if (!AuthStore.isLoggedIn()) {
    showToast('Debes iniciar sesión para editar.', 'error');
    navigateTo('/auth');
    return;
  }

  if (!Store.isMyAd(adId)) {
    showToast('Solo el autor puede modificar este anuncio.', 'error');
    return;
  }

  editUploadedImages = ad.images ? [...ad.images] : [];

  const categoriesOptions = CATEGORIES.map(c =>
    `<optgroup label="${c.emoji} ${escapeHtml(c.name)}">
       ${c.subs.map(s =>
         `<option value="${s.id}" ${ad.category === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`
       ).join('')}
    </optgroup>`
  ).join('');

  const previewsHtml = editUploadedImages.map((img, i) =>
    `<div class="image-preview-item" id="edit-preview-${i}">
       <img src="${img}" alt="Foto ${i + 1}">
       <div class="image-preview-remove" onclick="removeEditImage(${i})">✕</div>
     </div>`
  ).join('');

  const editLat = ad.latitude || '';
  const editLng = ad.longitude || '';

  openModal('✏️ Modificar Anuncio',
    `<form id="edit-ad-form" onsubmit="handleSaveEdit(event, '${ad.id}')">
      <div class="form-group">
        <label class="form-label">Título del anuncio *</label>
        <input class="form-input" type="text" name="title" required maxlength="120" value="${escapeHtml(ad.title)}">
      </div>
      <div class="form-group">
        <label class="form-label">Categoría *</label>
        <select class="form-select form-input" name="category" required>${categoriesOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Precio (MXN) *</label>
        <input class="form-input" type="number" name="price" required min="0" value="${ad.price}">
      </div>
      <div class="form-group">
        <label class="form-label">Descripción *</label>
        <textarea class="form-textarea" name="description" required maxlength="2000">${escapeHtml(ad.description)}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Ubicación *</label>
        <input class="form-input" type="text" name="location" id="ag-location-text" required value="${escapeHtml(ad.location)}">
      </div>
      <div class="form-group">
        <div class="ag-map-widget" id="ag-map-widget">
          <h3 class="ag-map-widget-title">📍 Ubicación en el Mapa</h3>
          <p class="ag-map-widget-subtitle">Arrastra el marcador o busca tu dirección para una mayor precisión.</p>
          <div class="ag-map-search-bar">
            <input id="ag-search-input" type="text" placeholder="Buscar dirección..." autocomplete="off">
            <button type="button" id="ag-geo-btn" class="ag-map-geo-btn">📍 Usar mi ubicación</button>
          </div>
          <div class="ag-map-canvas" id="ag-map-canvas"></div>
          <div class="ag-map-info-panel" id="ag-info-panel">
            <div class="ag-map-info-row">
              <span class="ag-map-info-label">📌 Dirección:</span>
              <span id="ag-address-display">Selecciona una ubicación en el mapa</span>
            </div>
            <div class="ag-map-info-row">
              <span class="ag-map-info-label">📏 Distancia al centro:</span>
              <span id="ag-distance-display">--</span>
            </div>
          </div>
          <input type="hidden" id="ag-hidden-lat" name="latitude" value="${editLat}">
          <input type="hidden" id="ag-hidden-lng" name="longitude" value="${editLng}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Fotos (hasta 3)</label>
        <div class="image-preview-grid" id="edit-image-preview-grid">${previewsHtml}</div>
        <div class="image-upload-area" style="margin-top:var(--space-3)" onclick="document.getElementById('edit-image-input').click()">
          <div class="image-upload-icon">📸</div>
          <div class="image-upload-text">Agregar / cambiar fotos</div>
        </div>
        <input type="file" id="edit-image-input" accept="image/*" multiple style="display:none" onchange="handleEditImageUpload(event)">
      </div>
    </form>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="document.getElementById('edit-ad-form').requestSubmit()">💾 Guardar cambios</button>`
  );

  // Init map inside modal after DOM renders
  setTimeout(() => initAgMap(editLat ? Number(editLat) : null, editLng ? Number(editLng) : null), 200);
}

function handleEditImageUpload(event) {
  const files = Array.from(event.target.files);
  files.slice(0, 3 - editUploadedImages.length).forEach(file =>
    compressImage(file, 800, 0.7).then(dataUrl => {
      editUploadedImages.push(dataUrl);
      renderEditImagePreviews();
    })
  );
}

function renderEditImagePreviews() {
  const grid = document.getElementById('edit-image-preview-grid');
  if (!grid) return;
  grid.innerHTML = editUploadedImages.map((img, i) =>
    `<div class="image-preview-item">
       <img src="${img}" alt="Foto ${i + 1}">
       <div class="image-preview-remove" onclick="removeEditImage(${i})">✕</div>
     </div>`
  ).join('');
}

function removeEditImage(index) {
  editUploadedImages.splice(index, 1);
  renderEditImagePreviews();
}

async function handleSaveEdit(event, adId) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = document.querySelector('.modal-footer .btn-primary');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Guardando...'; }

  try {
    const data = new FormData(form);
    const latVal = data.get('latitude');
    const lngVal = data.get('longitude');
    const fields = {
      title: data.get('title'),
      description: data.get('description'),
      category: data.get('category'),
      price: Number(data.get('price')),
      location: data.get('location'),
      images: [...editUploadedImages],
      latitude: latVal ? Number(latVal) : null,
      longitude: lngVal ? Number(lngVal) : null,
    };

    const result = await Store.updateAd(adId, fields);
    showToast(result.message || 'Anuncio actualizado.', 'success');
    closeModal();
    // Re-render the ad detail page with fresh data
    currentRoute = '';
    navigateTo('/ad/' + adId);
  } catch (error) {
    showToast(error.message || 'Error al guardar cambios.', 'error');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '💾 Guardar cambios'; }
  }
}


function switchGalleryImage(src, thumbEl) {
  const mainImg = document.getElementById('gallery-main-img');
  if (mainImg) mainImg.src = src;
  document.querySelectorAll('.ad-detail-thumb').forEach(t => t.classList.remove('active'));
  if (thumbEl) thumbEl.classList.add('active');
}

/* ---- Chat Handlers (API-backed) ---- */

// Track which seller conversation is active per adId
let _activeSellerConvId = {};

/**
 * Load chat for an ad from the API and inject into the page.
 * For buyers: shows their private conversation.
 * For sellers: shows a list of buyer conversations to select from.
 */
async function loadChatForAd(adId) {
  const container = document.getElementById('chat-container-' + adId);
  if (!container) return;

  try {
    const data = await ChatStore.loadForAd(adId);
    if (!data) {
      container.innerHTML = `<div class="chat-error-state">No se pudo cargar el chat. Intenta de nuevo.</div>`;
      return;
    }

    const session = AuthStore.getSession();
    const userId = session ? session.userId : null;

    if (data.role === 'buyer') {
      container.innerHTML = renderChatPanelBuyer(adId, data.messages, data.conversationId, userId);
      const msgs = container.querySelector('.chat-messages');
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
    } else if (data.role === 'seller') {
      container.innerHTML = renderChatPanelSeller(adId, data.conversations, userId);
    }
  } catch (e) {
    console.error('loadChatForAd error:', e);
    container.innerHTML = `<div class="chat-error-state">Error al cargar el chat.</div>`;
  }
}

/** Render the buyer's chat panel (single conversation with seller) */
function renderChatPanelBuyer(adId, messages, conversationId, userId) {
  return `
    <div class="chat-privacy-notice">
      🔒 Esta conversación es privada y solo tú y el vendedor pueden verla.
    </div>
    <div class="chat-panel" id="chat-panel-${adId}">
      <div class="chat-messages" id="chat-messages-${adId}">
        ${renderChatMessagesFromData(messages, userId)}
      </div>
      <div class="chat-input-bar">
        <input class="chat-input" type="text" id="chat-input-${adId}"
          placeholder="Escribe un mensaje al vendedor..."
          onkeydown="if(event.key==='Enter'){sendChatMessage('${adId}', null);event.preventDefault()}"
          autocomplete="off">
        <button class="chat-send-btn" onclick="sendChatMessage('${adId}', null)" title="Enviar">➤</button>
      </div>
    </div>
  `;
}

/** Render the seller's chat panel (list of buyer conversations) */
function renderChatPanelSeller(adId, conversations, userId) {
  if (!conversations || conversations.length === 0) {
    return `
      <div class="chat-seller-info">
        📢 Aún no has recibido mensajes en este anuncio.
      </div>
    `;
  }

  const convListHtml = conversations.map(conv => {
    const unreadBadge = conv.unreadCount > 0 ? `<span class="chat-unread-badge">${conv.unreadCount}</span>` : '';
    const lastMsg = conv.messages[conv.messages.length - 1];
    const preview = lastMsg ? escapeHtml(lastMsg.text.substring(0, 50)) + (lastMsg.text.length > 50 ? '...' : '') : 'Sin mensajes';
    return `
      <div class="chat-conv-item" id="conv-item-${conv.conversationId}"
        onclick="selectSellerConversation('${adId}', ${conv.conversationId})">
        <div class="chat-conv-avatar">👤</div>
        <div class="chat-conv-info">
          <div class="chat-conv-email">${escapeHtml(conv.buyerEmail)}</div>
          <div class="chat-conv-preview">${preview}</div>
        </div>
        <div class="chat-conv-meta">
          ${lastMsg ? `<span class="chat-conv-time">${timeAgo(new Date(lastMsg.createdAt).getTime())}</span>` : ''}
          ${unreadBadge}
        </div>
      </div>
    `;
  }).join('');

  // Auto-select first conversation
  const firstConv = conversations[0];
  _activeSellerConvId[adId] = firstConv.conversationId;

  return `
    <div class="chat-seller-wrapper">
      <div class="chat-seller-list" id="seller-conv-list-${adId}">${convListHtml}</div>
      <div class="chat-seller-conversation" id="seller-chat-area-${adId}">
        ${renderSellerChatArea(adId, firstConv, userId)}
      </div>
    </div>
  `;
}

/** Render the selected conversation area for the seller */
function renderSellerChatArea(adId, conv, userId) {
  return `
    <div class="chat-seller-conv-header">
      <span>👤 ${escapeHtml(conv.buyerEmail)}</span>
    </div>
    <div class="chat-messages" id="chat-messages-${adId}">
      ${renderChatMessagesFromData(conv.messages, userId)}
    </div>
    <div class="chat-input-bar">
      <input class="chat-input" type="text" id="chat-input-${adId}"
        placeholder="Responde al comprador..."
        onkeydown="if(event.key==='Enter'){sendChatMessage('${adId}', ${conv.conversationId});event.preventDefault()}"
        autocomplete="off">
      <button class="chat-send-btn" onclick="sendChatMessage('${adId}', ${conv.conversationId})" title="Enviar">➤</button>
    </div>
  `;
}

/** Seller selects a different buyer conversation */
async function selectSellerConversation(adId, conversationId) {
  _activeSellerConvId[adId] = conversationId;

  // Highlight selected
  document.querySelectorAll(`#seller-conv-list-${adId} .chat-conv-item`).forEach(el => {
    el.classList.remove('active');
  });
  const selectedEl = document.getElementById('conv-item-' + conversationId);
  if (selectedEl) selectedEl.classList.add('active');

  // Find conversation data from cache
  const cached = ChatStore.getCached(adId);
  if (!cached || !cached.conversations) return;
  const conv = cached.conversations.find(c => c.conversationId === conversationId);
  if (!conv) return;

  const session = AuthStore.getSession();
  const userId = session ? session.userId : null;

  const chatArea = document.getElementById('seller-chat-area-' + adId);
  if (chatArea) {
    chatArea.innerHTML = renderSellerChatArea(adId, conv, userId);
    const msgs = chatArea.querySelector('.chat-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }
}

/** Send a chat message (works for both buyer and seller) */
async function sendChatMessage(adId, conversationId) {
  if (!AuthStore.isLoggedIn()) {
    showToast('Debes iniciar sesión para enviar mensajes.', 'error');
    navigateTo('/auth');
    return;
  }

  const input = document.getElementById('chat-input-' + adId);
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  input.disabled = true;

  try {
    const convId = conversationId || _activeSellerConvId[adId] || null;
    const result = await ChatStore.sendMessage(adId, text, convId);

    if (result.success) {
      input.value = '';
      // Reload chat to get fresh data from API
      await loadChatForAd(adId);
      const msgs = document.getElementById('chat-messages-' + adId);
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
    } else {
      showToast(result.message || 'Error al enviar mensaje.', 'error');
    }
  } catch (e) {
    showToast('Error al enviar mensaje. Intenta de nuevo.', 'error');
  } finally {
    input.disabled = false;
    input.focus();
  }
}

/** Load and render the /chats page conversations from API */
async function loadChatsPage() {
  const container = document.getElementById('chats-list-content');
  if (!container) return;

  try {
    // Fetch conversations for all ads where the user is buyer or seller
    // We call a dedicated conversations listing API
    const data = await apiRequest('/api/chat/conversations');
    if (!data.success) {
      container.innerHTML = `<div class="chat-error-state">No se pudieron cargar las conversaciones.</div>`;
      return;
    }

    const conversations = data.conversations || [];
    if (conversations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <div class="empty-state-title">No tienes conversaciones</div>
          <p class="empty-state-text">Cuando envíes o recibas un mensaje en un anuncio, aparecerá aquí.</p>
          <button class="btn btn-primary" onclick="navigateTo('/')">Explorar anuncios</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--space-3)">
        ${conversations.map(conv => {
          const lastMsg = conv.lastMessage;
          return `
            <div class="chat-list-item" onclick="navigateTo('/ad/${conv.adPublicId}')">
              <div class="chat-list-icon">💬</div>
              <div class="chat-list-info">
                <div class="chat-list-title">${escapeHtml(conv.adTitle || conv.adPublicId)}</div>
                <div class="chat-list-preview">
                  ${conv.role === 'seller' ? '🛒 ' + escapeHtml(conv.buyerEmail) + ': ' : ''}
                  ${lastMsg ? escapeHtml(lastMsg.text.substring(0, 60)) : 'Sin mensajes'}
                </div>
              </div>
              <div class="chat-list-meta">
                ${lastMsg ? `<span class="chat-list-time">${timeAgo(new Date(lastMsg.createdAt).getTime())}</span>` : ''}
                ${conv.unreadCount > 0 ? `<span class="chat-unread-badge">${conv.unreadCount}</span>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (e) {
    console.error('loadChatsPage error:', e);
    container.innerHTML = `<div class="chat-error-state">Error al cargar conversaciones.</div>`;
  }
}

// Keep stub for compatibility (no longer used with API chat)
function switchChatRole(adId, role) {
  // Role switching is no longer needed — roles are determined by auth
}

/* ---- Hash Link Delegation ---- */
function setupNavDelegation() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#/"]');
    if (link) {
      e.preventDefault();
      const path = link.getAttribute('href').slice(1);
      navigateTo(path);
    }
  });
}

/* ---- Init (async) ---- */
async function initApp() {
  AuthStore.init();
  ChatStore.init();

  const appEl = document.getElementById('app');
  appEl.innerHTML = renderHeader() +
    '<main class="main-content" id="app-content"><div style="text-align:center;padding:4rem 1rem;color:var(--text-muted)">⏳ Cargando anuncios...</div></main>' +
    '<div class="modal-backdrop" id="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modal-header"><h3 class="modal-title"></h3><button class="modal-close" onclick="closeModal()">✕</button></div><div class="modal-body"></div><div class="modal-footer"></div></div></div>' +
    '<div class="toast-container" id="toast-container"></div>';

  // Handle payment return from MercadoPago
  handlePaymentReturn();

  // Load data from API
  await Store.init();

  setupNavDelegation();
  window.addEventListener('hashchange', router);
  router();
}

document.addEventListener('DOMContentLoaded', initApp);

/* ============================================
   MEDIA CENTER — Interactive Functions (API-backed)
   ============================================ */

let _mcReels = [];
let _mcExploreVideos = [];

/** Initialize Media Center page components */
function initMediaCenter() {
  loadMediaCenterData();
  // Keyboard listener for modal
  document.addEventListener('keydown', handleMediaCenterKeydown);
}

/** Load all media center data from API endpoints */
async function loadMediaCenterData() {
  // Load all 3 sections in parallel
  const [heroRes, reelsRes, exploreRes] = await Promise.allSettled([
    fetch('/api/settings/videos').then(r => r.json()),
    fetch('/api/settings/reels').then(r => r.json()),
    fetch('/api/settings/explore-videos').then(r => r.json())
  ]);

  // === HERO VIDEO (first from youtube_videos) ===
  const heroContainer = document.getElementById('mc-hero-container');
  if (heroContainer) {
    const heroVideos = (heroRes.status === 'fulfilled' && heroRes.value.success && Array.isArray(heroRes.value.videos))
      ? heroRes.value.videos.filter(v => v.url && getYouTubeId(v.url))
      : [];

    if (heroVideos.length > 0) {
      const hero = heroVideos[0];
      const heroYtId = getYouTubeId(hero.url);
      heroContainer.innerHTML = `
        <div class="mc-hero-container">
          <div class="mc-hero-video">
            <div class="mc-aspect-16-9">
              <iframe
                src="https://www.youtube.com/embed/${heroYtId}?rel=0&modestbranding=1"
                title="${escapeHtml(hero.title || 'Video Destacado')}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                loading="lazy"
              ></iframe>
            </div>
          </div>
          <div class="mc-hero-info">
            <h3>${escapeHtml(hero.title || 'Video Destacado')}</h3>
            <p>Descubre la mejor plataforma de anuncios clasificados en Azcapotzalco. Compra, vende y promociona tus productos y servicios.</p>
            <div class="mc-hero-meta">
              <span class="mc-hero-price">Elaboramos tu video y lo publicamos aquí</span>
              <span class="mc-hero-location">📍 Azcapotzalco, CDMX</span>
            </div>
            <div class="mc-hero-actions">
              <a href="#" onclick="navigateTo('/search');return false;" class="btn btn-primary">Directorio de anuncios</a>
              <p style="text-align:center;color:var(--text-secondary);font-size:var(--text-sm);margin:var(--space-2) 0">Ponte en contacto con nosotros</p>
              <a href="https://wa.me/525533094563?text=${encodeURIComponent('Hola, me interesa el servicio de video para AzcapoClasificados')}" target="_blank" rel="noopener" class="mc-btn-whatsapp">💬 WhatsApp</a>
            </div>
          </div>
        </div>`;
    } else {
      heroContainer.innerHTML = `
        <div style="text-align:center;padding:var(--space-8) 0;color:var(--text-muted);border:2px dashed var(--glass-border);border-radius:var(--radius-xl)">
          <div style="font-size:2rem;margin-bottom:var(--space-2)">🎬</div>
          <p style="font-size:var(--text-sm)">No hay video destacado configurado.</p>
        </div>`;
    }
  }

  // === REELS POPULARES ===
  const reelsCarousel = document.getElementById('mc-reels-carousel');
  _mcReels = (reelsRes.status === 'fulfilled' && reelsRes.value.success && Array.isArray(reelsRes.value.reels))
    ? reelsRes.value.reels.filter(v => v.url && getYouTubeId(v.url))
    : [];

  if (reelsCarousel) {
    if (_mcReels.length > 0) {
      reelsCarousel.innerHTML = _mcReels.map((v, i) => `
        <div class="mc-reel-card" onclick="openVideoModal('reel', ${i})">
          <div class="mc-aspect-9-16">
            <img src="${getYtThumbnail(v.url)}" alt="${escapeHtml(v.title || 'Reel')}" loading="lazy">
            <div class="mc-reel-play-overlay">
              <div class="mc-play-icon">▶</div>
            </div>
          </div>
          <div class="mc-reel-info-overlay">
            <div class="mc-reel-title">${escapeHtml(v.title || 'Reel ' + (i + 1))}</div>
          </div>
        </div>
      `).join('');
      initReelsCarousel();
    } else {
      reelsCarousel.innerHTML = `
        <div style="text-align:center;padding:var(--space-8) 0;color:var(--text-muted);width:100%;border:2px dashed var(--glass-border);border-radius:var(--radius-xl)">
          <div style="font-size:2rem;margin-bottom:var(--space-2)">📱</div>
          <p style="font-size:var(--text-sm)">No hay reels configurados.</p>
        </div>`;
    }
  }

  // === EXPLORAR VIDEOS ===
  const videoGrid = document.getElementById('mc-video-grid');
  _mcExploreVideos = (exploreRes.status === 'fulfilled' && exploreRes.value.success && Array.isArray(exploreRes.value.videos))
    ? exploreRes.value.videos.filter(v => v.url && getYouTubeId(v.url))
    : [];

  if (videoGrid) {
    if (_mcExploreVideos.length > 0) {
      videoGrid.innerHTML = _mcExploreVideos.map((v, i) => `
        <article class="mc-video-card" onclick="openVideoModal('explore', ${i})">
          <div class="mc-aspect-16-9 mc-thumb-wrapper">
            <img src="${getYtThumbnail(v.url)}" alt="${escapeHtml(v.title || 'Video')}" loading="lazy">
          </div>
          <div class="mc-video-card-body">
            <h3 class="mc-video-card-title">${escapeHtml(v.title || 'Video ' + (i + 1))}</h3>
          </div>
        </article>
      `).join('');
    } else {
      videoGrid.innerHTML = `
        <div style="text-align:center;padding:var(--space-8) 0;color:var(--text-muted);grid-column:1/-1;border:2px dashed var(--glass-border);border-radius:var(--radius-xl)">
          <div style="font-size:2rem;margin-bottom:var(--space-2)">🎥</div>
          <p style="font-size:var(--text-sm)">No hay videos configurados.</p>
        </div>`;
    }
  }
}

/** Handle keyboard events for Media Center modal */
function handleMediaCenterKeydown(e) {
  if (e.key === 'Escape') {
    const modal = document.getElementById('mc-video-modal');
    if (modal && modal.classList.contains('active')) {
      closeVideoModal();
    }
  }
}

/** Initialize reels carousel with mouse drag support */
function initReelsCarousel() {
  const carousel = document.getElementById('mc-reels-carousel');
  if (!carousel) return;

  let isDown = false;
  let startX;
  let scrollLeft;
  let hasDragged = false;

  carousel.addEventListener('mousedown', (e) => {
    isDown = true;
    hasDragged = false;
    carousel.classList.add('mc-grabbing');
    startX = e.pageX - carousel.offsetLeft;
    scrollLeft = carousel.scrollLeft;
  });

  carousel.addEventListener('mouseleave', () => {
    isDown = false;
    carousel.classList.remove('mc-grabbing');
  });

  carousel.addEventListener('mouseup', (e) => {
    isDown = false;
    carousel.classList.remove('mc-grabbing');
    // Prevent click on cards after drag
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  carousel.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - carousel.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) hasDragged = true;
    carousel.scrollLeft = scrollLeft - walk;
  });

  // Prevent click on reel cards after dragging
  carousel.addEventListener('click', (e) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged = false;
    }
  }, true);
}

/** Open video modal with dynamic data */
function openVideoModal(type, index) {
  let video = null;
  if (type === 'reel' && _mcReels[index]) {
    video = _mcReels[index];
  } else if (type === 'explore' && _mcExploreVideos[index]) {
    video = _mcExploreVideos[index];
  }
  if (!video) return;

  const ytId = getYouTubeId(video.url);
  if (!ytId) return;

  const modal = document.getElementById('mc-video-modal');
  const player = document.getElementById('mc-modal-player');

  // Set player source with autoplay
  player.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`;

  // Update title
  document.getElementById('mc-modal-title').textContent = video.title || 'Video';

  // Show modal with animation
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/** Close video modal */
function closeVideoModal() {
  const modal = document.getElementById('mc-video-modal');
  const player = document.getElementById('mc-modal-player');

  if (player) player.src = ''; // Stop video
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

/** Filter video grid by category — no longer needed with simplified admin */
function filterMediaVideos(category, btn) {
  // Update active button
  document.querySelectorAll('.mc-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // Filter grid cards with animation
  const cards = document.querySelectorAll('.mc-video-card');
  let delay = 0;
  cards.forEach(card => {
    const cardCat = card.dataset.category;
    const show = category === 'all' || cardCat === category;
    if (show) {
      card.style.display = '';
      card.style.animation = `fadeInUp 0.3s ease ${delay}s both`;
      delay += 0.04;
    } else {
      card.style.display = 'none';
      card.style.animation = '';
    }
  });
}

/* ============================================================
   HERO BANNER CAROUSEL
   Reads all .jpg/.png images from the remote imagenes folder
   and displays them as a full-width auto-advancing carousel
   (4 seconds per slide, minimalist arrows + dot indicators).
   ============================================================ */

const heroCarousel = (() => {
  // Images are served from the /imagenes/ folder of this project
  const BASE_URL    = '/imagenes/';
  // manifest.json is auto-generated at build time by scripts/generate-manifest.js
  const MANIFEST    = '/imagenes/manifest.json';
  const INTERVAL_MS = 4000;

  let images      = [];
  let idx         = 0;
  let timer       = null;
  let rafId       = null;
  let progressTs  = 0;

  /* ---- DOM helpers ---- */
  const el  = id => document.getElementById(id);
  const all = sel => document.querySelectorAll(sel);

  /* ---- Parse directory listing ---- */
  function parseLinks(html) {
    const doc   = new DOMParser().parseFromString(html, 'text/html');
    const links = Array.from(doc.querySelectorAll('a[href]'));
    return links
      .map(a => a.getAttribute('href'))
      .filter(h => /\.(jpe?g|png)$/i.test(h))
      .map(h => h.split('/').pop());
  }

  /* ---- Go to slide ---- */
  function goTo(i) {
    if (!images.length) return;
    idx = ((i % images.length) + images.length) % images.length;

    const track = el('hero-carousel-track');
    if (track) track.style.transform = `translateX(-${idx * 100}%)`;

    all('.hero-carousel-dot').forEach((d, n) =>
      d.classList.toggle('active', n === idx));

    const bar = el('hero-carousel-progress');
    if (bar) bar.style.width = '0%';
    progressTs = Date.now();
  }

  /* ---- Progress bar animation ---- */
  function animateProgress() {
    const bar = el('hero-carousel-progress');
    if (!bar) return;
    const pct = Math.min(100, ((Date.now() - progressTs) / INTERVAL_MS) * 100);
    bar.style.width = pct + '%';
    if (pct < 100) rafId = requestAnimationFrame(animateProgress);
  }

  /* ---- Start / stop timer ---- */
  function startTimer() {
    progressTs = Date.now();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(animateProgress);
    timer = setInterval(() => {
      goTo(idx + 1);
      progressTs = Date.now();
    }, INTERVAL_MS);
  }

  function stopTimer() {
    if (timer)  { clearInterval(timer);           timer = null; }
    if (rafId)  { cancelAnimationFrame(rafId);    rafId = null; }
  }

  /* ---- Build DOM ---- */
  function build(imgs) {
    images = imgs;
    idx    = 0;

    const track   = el('hero-carousel-track');
    const dots    = el('hero-carousel-dots');
    const loading = el('hero-carousel-loading');
    const prev    = el('hero-carousel-prev');
    const next    = el('hero-carousel-next');
    if (!track || !dots) return;

    // Hide loading spinner
    if (loading) loading.style.display = 'none';

    // Slides
    track.innerHTML = imgs.map((src, i) => `
      <div class="hero-carousel-slide" data-idx="${i}">
        <img src="${BASE_URL}${encodeURIComponent(src)}"
             alt="Banner promocional ${i + 1}"
             loading="${i === 0 ? 'eager' : 'lazy'}"
             onerror="this.closest('.hero-carousel-slide').style.display='none'">
      </div>
    `).join('');

    // Dots
    dots.innerHTML = imgs.map((_, i) => `
      <button class="hero-carousel-dot ${i === 0 ? 'active' : ''}"
              aria-label="Ir al slide ${i + 1}"
              onclick="heroDot(${i})"></button>
    `).join('');

    // Show arrows only when more than 1 image
    if (prev) prev.style.display = imgs.length > 1 ? 'flex' : 'none';
    if (next) next.style.display = imgs.length > 1 ? 'flex' : 'none';

    // Start autoplay
    if (imgs.length > 1) startTimer();
  }

  /* ---- Public API ---- */
  async function init() {
    const loading = el('hero-carousel-loading');
    const track   = el('hero-carousel-track');
    if (!track) return;

    // Reset state
    images = []; idx = 0;
    if (loading) loading.style.display = 'flex';
    track.innerHTML = '';

    try {
      // Read manifest.json — a simple JSON array of filenames, e.g. ["banner1.jpg","banner2.png"]
      const res = await fetch(MANIFEST, { cache: 'no-cache' });
      if (!res.ok) {
        console.warn('HeroCarousel: /api/imagenes not reachable or returned no images.');
        if (loading) loading.style.display = 'none';
        return;
      }
      const imgs = await res.json(); // expects string[]
      if (!Array.isArray(imgs) || !imgs.length) {
        if (loading) loading.style.display = 'none';
        return;
      }
      build(imgs);
    } catch (e) {
      console.warn('HeroCarousel: error loading manifest.json —', e);
      if (loading) loading.style.display = 'none';
    }
  }

  function stop() { stopTimer(); }
  function prev() { stopTimer(); goTo(idx - 1); startTimer(); }
  function next() { stopTimer(); goTo(idx + 1); startTimer(); }
  function dot(i) { stopTimer(); goTo(i);       startTimer(); }

  return { init, stop, prev, next, dot };
})();

/* Global handlers for inline onclick attributes */
function heroPrev() { heroCarousel.prev(); }
function heroNext() { heroCarousel.next(); }
function heroDot(i) { heroCarousel.dot(i); }

/* ---- Blog Preview (Home Page) ---- */
async function loadBlogPreview() {
  const grid = document.getElementById('blog-preview-grid');
  if (!grid) return;

  try {
    const res  = await fetch('/api/blog?limit=3');
    const data = await res.json();
    const posts = (data.success && data.posts) ? data.posts : [];

    if (posts.length === 0) {
      grid.innerHTML = `
        <div style="text-align:center;padding:var(--space-8) 0;color:var(--text-muted)">
          <div style="font-size:2rem;margin-bottom:var(--space-3)">📭</div>
          <p style="font-size:var(--text-sm)">Sé el primero en publicar un artículo en el blog.</p>
          <a href="/blog" class="btn btn-primary" style="margin-top:var(--space-4);display:inline-block">✍️ Ir al Blog</a>
        </div>`;
      return;
    }

    grid.innerHTML = posts.map((p, i) => {
      const date = p.published_at
        ? new Date(p.published_at).toLocaleDateString('es-MX', { day:'numeric', month:'long', year:'numeric' })
        : '';
      const initials = p.author_email ? p.author_email.split('@')[0].slice(0,2).toUpperCase() : '??';
      const delay = i * 0.08;
      return `
        <a href="/blog" class="blog-preview-card" style="animation-delay:${delay}s;text-decoration:none">
          <div class="blog-preview-cover">${escapeHtml(p.cover_emoji || '📝')}</div>
          <div class="blog-preview-body">
            <div class="blog-preview-cat">${escapeHtml(p.category || 'general')}</div>
            <div class="blog-preview-title">${escapeHtml(p.title)}</div>
            <div class="blog-preview-excerpt">${escapeHtml(p.excerpt)}</div>
            <div class="blog-preview-meta">
              <div class="blog-preview-avatar">${initials}</div>
              <span>${escapeHtml(p.author_email.split('@')[0])}</span>
              ${date ? `<span style="color:var(--text-muted)">· ${date}</span>` : ''}
            </div>
          </div>
        </a>`;
    }).join('');
  } catch(e) {
    console.warn('Blog preview load failed:', e);
    const grid2 = document.getElementById('blog-preview-grid');
    if (grid2) grid2.innerHTML = '';
  }
}

/* ---- Admin: Video Management ---- */
/* ---- Admin Metrics Dashboard ---- */
async function loadAdminMetrics() {
  const cronSecret = prompt('Ingresa tu Admin Key (CRON_SECRET):');
  if (!cronSecret) return;

  // Store for refresh without re-asking
  window._adminKey = cronSecret;
  _renderAdminMetrics(cronSecret);
}

// Called internally after key is cached
async function _renderAdminMetrics(adminKey) {
  const ts = document.getElementById('metrics-last-updated');
  if (ts) ts.textContent = '⏳ Actualizando…';

  // Show skeletons
  ['kpi-published','kpi-shown','kpi-clicked','kpi-initiated','kpi-conversion','kpi-mrr'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<div class="admin-kpi-skeleton"></div>';
  });

  try {
    const [funnelRes, metricsRes] = await Promise.all([
      fetch('/api/analytics/funnel', { headers: { 'x-admin-key': adminKey } }).then(r => r.json()),
      fetch('/api/admin/metrics',    { headers: { 'x-admin-key': adminKey } }).then(r => r.json()),
    ]);

    if (!funnelRes.success) {
      showToast('Admin Key incorrecta', 'error');
      return;
    }

    const f  = funnelRes.funnel;
    const m  = metricsRes.metrics || {};

    // ---- KPI Cards ----
    const setKPI = (id, value, prefix = '', suffix = '') => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = '';
        const span = document.createElement('span');
        span.style.cssText = 'font-size:28px;font-weight:800;display:block;line-height:1.1';
        span.textContent = prefix + (value ?? '—') + suffix;
        el.appendChild(span);
        // Count-up animation
        if (typeof value === 'number' && !suffix.includes('%')) {
          let start = 0;
          const end = value;
          const step = Math.ceil(end / 30);
          const timer = setInterval(() => {
            start = Math.min(start + step, end);
            span.textContent = prefix + start + suffix;
            if (start >= end) clearInterval(timer);
          }, 30);
        }
      }
    };

    setKPI('kpi-published',  f.ads_published);
    setKPI('kpi-shown',      f.upsell_shown);
    setKPI('kpi-clicked',    f.upsell_clicked);
    setKPI('kpi-initiated',  f.payment_started);
    setKPI('kpi-conversion', f.rates?.overall_conversion_pct, '', '%');
    setKPI('kpi-mrr',        m.mrr_mxn || 0, '$', ' MXN');

    // ---- Funnel Bar Chart ----
    const funnelContainer = document.getElementById('admin-funnel-bars');
    if (funnelContainer) {
      const steps = [
        { label: 'Publicaron',    value: f.ads_published,   color: '#6366f1' },
        { label: 'Vieron modal',  value: f.upsell_shown,    color: '#0ea5e9' },
        { label: 'Hicieron clic', value: f.upsell_clicked,  color: '#f59e0b' },
        { label: 'Pagaron',       value: f.payment_started, color: '#10b981' },
      ];
      const max = Math.max(...steps.map(s => s.value), 1);
      funnelContainer.innerHTML = steps.map((s, i) => {
        const pct = Math.round((s.value / max) * 100);
        const convPct = i > 0 && steps[i-1].value > 0
          ? ' (' + ((s.value / steps[i-1].value) * 100).toFixed(1) + '% del paso anterior)'
          : '';
        return `
          <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;margin-bottom:5px">
              <span style="font-size:13px;font-weight:600;color:var(--text-primary)">${s.label}</span>
              <span style="font-size:13px;color:var(--text-muted)">${s.value}${convPct}</span>
            </div>
            <div style="background:var(--bg-secondary,#f3f4f6);border-radius:8px;height:10px;overflow:hidden">
              <div style="background:${s.color};height:100%;width:0%;border-radius:8px;transition:width 0.6s ease ${i*0.1}s"
                   id="funnel-bar-${i}"></div>
            </div>
          </div>
        `;
      }).join('');
      // Animate bars after render
      requestAnimationFrame(() => {
        steps.forEach((s, i) => {
          const pct = Math.round((s.value / max) * 100);
          const bar = document.getElementById('funnel-bar-' + i);
          if (bar) setTimeout(() => { bar.style.width = pct + '%'; }, 50);
        });
      });
    }

    // ---- Level Breakdown ----
    const levelEl = document.getElementById('admin-level-breakdown');
    if (levelEl) {
      const levels = funnelRes.level_breakdown || [];
      const levelColors = { basic: '#0ea5e9', featured: '#f59e0b', premium: '#8b5cf6' };
      const levelLabels = { basic: '▲ Básico', featured: '🔥 Destacado', premium: '⭐ Premium' };
      const maxClicks = Math.max(...levels.map(l => Number(l.clicks)), 1);
      if (!levels.length) {
        levelEl.innerHTML = '<p style="font-size:13px;color:var(--text-muted)">Sin datos aún</p>';
      } else {
        levelEl.innerHTML = levels.map(l => `
          <div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:13px;font-weight:600">${levelLabels[l.level] || l.level}</span>
              <span style="font-size:13px;color:var(--text-muted)">${l.clicks} clics</span>
            </div>
            <div style="background:var(--bg-secondary,#f3f4f6);border-radius:6px;height:8px;overflow:hidden">
              <div style="background:${levelColors[l.level]||'#94a3b8'};height:100%;width:${Math.round((l.clicks/maxClicks)*100)}%;border-radius:6px;transition:width 0.5s ease"></div>
            </div>
          </div>
        `).join('');
      }
    }

    // ---- Device Split ----
    const deviceEl = document.getElementById('admin-device-split');
    if (deviceEl) {
      const devices = funnelRes.device_breakdown || [];
      const mobile  = devices.find(d => d.is_mobile === true  || d.is_mobile === 't');
      const desktop = devices.find(d => d.is_mobile === false || d.is_mobile === 'f');
      const mShown  = Number(mobile?.shown  || 0);
      const dShown  = Number(desktop?.shown || 0);
      const total   = mShown + dShown || 1;
      const mPct    = Math.round((mShown / total) * 100);
      const dPct    = 100 - mPct;
      deviceEl.innerHTML = `
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <div style="flex:${mPct};background:#6366f1;border-radius:6px;height:12px;min-width:4px;transition:flex 0.5s ease"></div>
          <div style="flex:${dPct};background:#e2e8f0;border-radius:6px;height:12px;min-width:4px;transition:flex 0.5s ease"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span><b style="color:#6366f1">📱 Móvil</b> ${mShown} (${mPct}%)</span>
          <span><b style="color:#64748b">🖥️ Desktop</b> ${dShown} (${dPct}%)</span>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:10px">
          ${mPct > 60 ? '⚠️ Mayoría móvil — asegúrate de que el modal upsell se vea bien en pantallas chicas.' : '✅ Buen balance dispositivos'}
        </p>
      `;
    }

    // ---- Live Feed ----
    const feedEl = document.getElementById('admin-live-feed');
    if (feedEl) {
      const events = funnelRes.recent_events || [];
      const eventLabels = {
        ad_published:       { icon: '📝', label: 'Anuncio publicado' },
        upsell_shown:       { icon: '👁️',  label: 'Modal visto' },
        upsell_level_click: { icon: '🖱️',  label: 'Nivel clickeado' },
        upsell_skip:        { icon: '⏭️',  label: 'Modal omitido' },
        upsell_backdrop:    { icon: '✖️',  label: 'Cerrado fuera del modal' },
        boost_initiated:    { icon: '💳',  label: 'Pago iniciado' },
      };
      if (!events.length) {
        feedEl.innerHTML = '<p style="font-size:13px;color:var(--text-muted)">Sin actividad reciente</p>';
      } else {
        feedEl.innerHTML = events.map(e => {
          const meta = eventLabels[e.event] || { icon: '•', label: e.event };
          const props = typeof e.properties === 'string' ? JSON.parse(e.properties) : (e.properties || {});
          const when  = e.created_at ? new Date(e.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '';
          const detail = props.level ? ` · ${props.level}` : props.ad_id ? ` · ${props.ad_id.slice(0,8)}…` : '';
          return `
            <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border-color,#f1f5f9)">
              <span style="font-size:18px;flex-shrink:0">${meta.icon}</span>
              <div style="flex:1;min-width:0">
                <span style="font-size:13px;font-weight:600">${meta.label}</span>
                <span style="font-size:12px;color:var(--text-muted)">${detail}</span>
              </div>
              <span style="font-size:11px;color:var(--text-muted);flex-shrink:0">${when}</span>
            </div>
          `;
        }).join('');
      }
    }

    // Update timestamp
    if (ts) ts.textContent = 'Actualizado: ' + new Date().toLocaleTimeString('es-MX');

  } catch (err) {
    console.error('loadAdminMetrics error:', err);
    showToast('Error al cargar métricas', 'error');
    if (ts) ts.textContent = 'Error al cargar';
  }
}

/** Open the investor PDF report in a new tab.
 *  Reuses the cached admin key if already entered, otherwise prompts once.
 */
function openInvestorReport() {
  let key = window._adminKey;
  if (!key) {
    key = prompt('Ingresa tu Admin Key (CRON_SECRET) para generar el reporte:');
    if (!key) return;
    window._adminKey = key;
  }
  // Open the server-rendered report page in a new tab
  const url = '/api/analytics/report?key=' + encodeURIComponent(key);
  const tab = window.open(url, '_blank', 'noopener');
  if (!tab) {
    showToast('Activa las ventanas emergentes para este sitio y vuelve a intentarlo.', 'error');
  }
}

/** Trigger the weekly email report manually — useful to test or send on demand */
async function sendWeeklyReportNow() {
  let key = window._adminKey;
  if (!key) {
    key = prompt('Ingresa tu Admin Key (CRON_SECRET):');
    if (!key) return;
    window._adminKey = key;
  }

  const btn = event?.target;
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Enviando…'; }

  try {
    const res = await fetch('/api/cron/weekly-report?trigger=' + encodeURIComponent(key), {
      method: 'GET',
      headers: { 'x-admin-key': key },
    });
    const data = await res.json();

    if (data.success) {
      showToast(`📧 Email enviado a alxteran@gmail.com · Conversión ${data.metrics.conversion}%`, 'success');
    } else {
      showToast('Error al enviar el email: ' + (data.error || 'desconocido'), 'error');
    }
  } catch (err) {
    showToast('Error de red al enviar el email', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📧 Enviar email'; }
  }
}

let _adminVideos = [];

async function loadAdminVideos() {
  const list = document.getElementById('admin-video-list');
  if (!list) return;

  try {
    const data = await apiRequest('/api/settings/videos');
    _adminVideos = (data.success && Array.isArray(data.videos)) ? data.videos : [];
  } catch(e) {
    _adminVideos = [];
  }

  adminRenderVideoList();
}

function adminRenderVideoList() {
  const list = document.getElementById('admin-video-list');
  if (!list) return;

  if (_adminVideos.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:var(--space-6) 0;color:var(--text-muted);border:2px dashed var(--glass-border);border-radius:var(--radius-xl)">
        <div style="font-size:2rem;margin-bottom:var(--space-2)">📭</div>
        <p style="font-size:var(--text-sm)">No hay videos configurados. Agrega uno arriba.</p>
      </div>`;
    return;
  }

  list.innerHTML = _adminVideos.map((v, i) => {
    const vid = getYouTubeId(v.url);
    const thumb = vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : '';
    return `
      <div class="admin-video-row" style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);background:var(--bg-secondary);border:1px solid var(--glass-border);border-radius:var(--radius-lg);margin-bottom:var(--space-3)">
        ${thumb ? `<img src="${thumb}" alt="" style="width:120px;height:68px;object-fit:cover;border-radius:var(--radius-md);flex-shrink:0">` : ''}
        <div style="flex:1;min-width:0">
          <input type="text" value="${escapeHtml(v.title || '')}" class="input" placeholder="Título del video"
            style="font-size:var(--text-sm);margin-bottom:4px"
            onchange="_adminVideos[${i}].title = this.value">
          <div style="font-size:var(--text-xs);color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(v.url)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0">
          <button onclick="adminMoveVideo(${i}, -1)" class="btn" style="padding:2px 8px;font-size:0.7rem" ${i === 0 ? 'disabled' : ''}>▲</button>
          <button onclick="adminMoveVideo(${i}, 1)" class="btn" style="padding:2px 8px;font-size:0.7rem" ${i === _adminVideos.length - 1 ? 'disabled' : ''}>▼</button>
        </div>
        <button onclick="adminRemoveVideo(${i})" class="btn" style="padding:4px 10px;color:#e53935;font-size:1.1rem" title="Eliminar">✕</button>
      </div>`;
  }).join('');
}

function adminAddVideo() {
  const urlInput = document.getElementById('admin-new-video-url');
  const titleInput = document.getElementById('admin-new-video-title');
  if (!urlInput) return;

  const url = urlInput.value.trim();
  const title = titleInput ? titleInput.value.trim() : '';

  if (!url) { showToast('Pega una URL de YouTube', 'error'); return; }
  const vid = getYouTubeId(url);
  if (!vid) { showToast('URL de YouTube no válida. Usa formato: https://youtu.be/... o https://youtube.com/watch?v=...', 'error'); return; }

  _adminVideos.push({ url, title: title || 'Video ' + (_adminVideos.length + 1) });
  urlInput.value = '';
  if (titleInput) titleInput.value = '';

  adminRenderVideoList();
  showToast('Video agregado. No olvides guardar los cambios.', 'success');
}

function adminRemoveVideo(index) {
  _adminVideos.splice(index, 1);
  adminRenderVideoList();
}

function adminMoveVideo(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= _adminVideos.length) return;
  [_adminVideos[index], _adminVideos[newIndex]] = [_adminVideos[newIndex], _adminVideos[index]];
  adminRenderVideoList();
}

async function adminSaveVideos() {
  const btn = document.getElementById('admin-save-btn');
  const status = document.getElementById('admin-save-status');

  if (btn) { btn.disabled = true; btn.textContent = '⏳ Guardando...'; }

  try {
    const data = await apiRequest('/api/settings/videos', {
      method: 'POST',
      body: JSON.stringify({ videos: _adminVideos }),
    });

    if (data.success) {
      _adminVideos = data.videos || _adminVideos;
      adminRenderVideoList();
      if (status) { status.textContent = '✅ Guardado'; status.style.color = '#4caf50'; }
      showToast('Videos actualizados correctamente', 'success');
    } else {
      showToast(data.error || 'Error al guardar', 'error');
      if (status) { status.textContent = '❌ Error'; status.style.color = '#e53935'; }
    }
  } catch(e) {
    showToast('Error de conexión al guardar', 'error');
    if (status) { status.textContent = '❌ Error'; status.style.color = '#e53935'; }
  }

  if (btn) { btn.disabled = false; btn.textContent = '💾 Guardar cambios'; }
  setTimeout(() => { if (status) status.textContent = ''; }, 3000);
}

/* ---- Admin: Reels Populares Management ---- */
let _adminReels = [];

async function loadAdminReels() {
  const list = document.getElementById('admin-reel-list');
  if (!list) return;

  try {
    const data = await apiRequest('/api/settings/reels');
    _adminReels = (data.success && Array.isArray(data.reels)) ? data.reels : [];
  } catch(e) {
    _adminReels = [];
  }

  adminRenderReelsList();
}

function adminRenderReelsList() {
  const list = document.getElementById('admin-reel-list');
  if (!list) return;

  if (_adminReels.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:var(--space-6) 0;color:var(--text-muted);border:2px dashed var(--glass-border);border-radius:var(--radius-xl)">
        <div style="font-size:2rem;margin-bottom:var(--space-2)">📭</div>
        <p style="font-size:var(--text-sm)">No hay reels configurados. Agrega uno arriba.</p>
      </div>`;
    return;
  }

  list.innerHTML = _adminReels.map((v, i) => {
    const vid = getYouTubeId(v.url);
    const thumb = vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : '';
    return `
      <div class="admin-video-row" style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);background:var(--bg-secondary);border:1px solid var(--glass-border);border-radius:var(--radius-lg);margin-bottom:var(--space-3)">
        ${thumb ? `<img src="${thumb}" alt="" style="width:120px;height:68px;object-fit:cover;border-radius:var(--radius-md);flex-shrink:0">` : ''}
        <div style="flex:1;min-width:0">
          <input type="text" value="${escapeHtml(v.title || '')}" class="input" placeholder="Título del reel"
            style="font-size:var(--text-sm);margin-bottom:4px"
            onchange="_adminReels[${i}].title = this.value">
          <div style="font-size:var(--text-xs);color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(v.url)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0">
          <button onclick="adminMoveReel(${i}, -1)" class="btn" style="padding:2px 8px;font-size:0.7rem" ${i === 0 ? 'disabled' : ''}>▲</button>
          <button onclick="adminMoveReel(${i}, 1)" class="btn" style="padding:2px 8px;font-size:0.7rem" ${i === _adminReels.length - 1 ? 'disabled' : ''}>▼</button>
        </div>
        <button onclick="adminRemoveReel(${i})" class="btn" style="padding:4px 10px;color:#e53935;font-size:1.1rem" title="Eliminar">✕</button>
      </div>`;
  }).join('');
}

function adminAddReel() {
  const urlInput = document.getElementById('admin-new-reel-url');
  const titleInput = document.getElementById('admin-new-reel-title');
  if (!urlInput) return;

  const url = urlInput.value.trim();
  const title = titleInput ? titleInput.value.trim() : '';

  if (!url) { showToast('Pega una URL de YouTube', 'error'); return; }
  const vid = getYouTubeId(url);
  if (!vid) { showToast('URL de YouTube no válida. Usa formato: https://youtu.be/... o https://youtube.com/shorts/...', 'error'); return; }

  _adminReels.push({ url, title: title || 'Reel ' + (_adminReels.length + 1) });
  urlInput.value = '';
  if (titleInput) titleInput.value = '';

  adminRenderReelsList();
  showToast('Reel agregado. No olvides guardar los cambios.', 'success');
}

function adminRemoveReel(index) {
  _adminReels.splice(index, 1);
  adminRenderReelsList();
}

function adminMoveReel(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= _adminReels.length) return;
  [_adminReels[index], _adminReels[newIndex]] = [_adminReels[newIndex], _adminReels[index]];
  adminRenderReelsList();
}

async function adminSaveReels() {
  const btn = document.getElementById('admin-reels-save-btn');
  const status = document.getElementById('admin-reels-save-status');

  if (btn) { btn.disabled = true; btn.textContent = '⏳ Guardando...'; }

  try {
    const data = await apiRequest('/api/settings/reels', {
      method: 'POST',
      body: JSON.stringify({ reels: _adminReels }),
    });

    if (data.success) {
      _adminReels = data.reels || _adminReels;
      adminRenderReelsList();
      if (status) { status.textContent = '✅ Guardado'; status.style.color = '#4caf50'; }
      showToast('Reels actualizados correctamente', 'success');
    } else {
      showToast(data.error || 'Error al guardar', 'error');
      if (status) { status.textContent = '❌ Error'; status.style.color = '#e53935'; }
    }
  } catch(e) {
    showToast('Error de conexión al guardar', 'error');
    if (status) { status.textContent = '❌ Error'; status.style.color = '#e53935'; }
  }

  if (btn) { btn.disabled = false; btn.textContent = '💾 Guardar cambios'; }
  setTimeout(() => { if (status) status.textContent = ''; }, 3000);
}

/* ---- Admin: Explorar Videos Management ---- */
let _adminExploreVideos = [];

async function loadAdminExploreVideos() {
  const list = document.getElementById('admin-explore-list');
  if (!list) return;

  try {
    const data = await apiRequest('/api/settings/explore-videos');
    _adminExploreVideos = (data.success && Array.isArray(data.videos)) ? data.videos : [];
  } catch(e) {
    _adminExploreVideos = [];
  }

  adminRenderExploreVideosList();
}

function adminRenderExploreVideosList() {
  const list = document.getElementById('admin-explore-list');
  if (!list) return;

  if (_adminExploreVideos.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:var(--space-6) 0;color:var(--text-muted);border:2px dashed var(--glass-border);border-radius:var(--radius-xl)">
        <div style="font-size:2rem;margin-bottom:var(--space-2)">📭</div>
        <p style="font-size:var(--text-sm)">No hay videos configurados. Agrega uno arriba.</p>
      </div>`;
    return;
  }

  list.innerHTML = _adminExploreVideos.map((v, i) => {
    const vid = getYouTubeId(v.url);
    const thumb = vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : '';
    return `
      <div class="admin-video-row" style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);background:var(--bg-secondary);border:1px solid var(--glass-border);border-radius:var(--radius-lg);margin-bottom:var(--space-3)">
        ${thumb ? `<img src="${thumb}" alt="" style="width:120px;height:68px;object-fit:cover;border-radius:var(--radius-md);flex-shrink:0">` : ''}
        <div style="flex:1;min-width:0">
          <input type="text" value="${escapeHtml(v.title || '')}" class="input" placeholder="Título del video"
            style="font-size:var(--text-sm);margin-bottom:4px"
            onchange="_adminExploreVideos[${i}].title = this.value">
          <div style="font-size:var(--text-xs);color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(v.url)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0">
          <button onclick="adminMoveExploreVideo(${i}, -1)" class="btn" style="padding:2px 8px;font-size:0.7rem" ${i === 0 ? 'disabled' : ''}>▲</button>
          <button onclick="adminMoveExploreVideo(${i}, 1)" class="btn" style="padding:2px 8px;font-size:0.7rem" ${i === _adminExploreVideos.length - 1 ? 'disabled' : ''}>▼</button>
        </div>
        <button onclick="adminRemoveExploreVideo(${i})" class="btn" style="padding:4px 10px;color:#e53935;font-size:1.1rem" title="Eliminar">✕</button>
      </div>`;
  }).join('');
}

function adminAddExploreVideo() {
  const urlInput = document.getElementById('admin-new-explore-url');
  const titleInput = document.getElementById('admin-new-explore-title');
  if (!urlInput) return;

  const url = urlInput.value.trim();
  const title = titleInput ? titleInput.value.trim() : '';

  if (!url) { showToast('Pega una URL de YouTube', 'error'); return; }
  const vid = getYouTubeId(url);
  if (!vid) { showToast('URL de YouTube no válida. Usa formato: https://youtu.be/... o https://youtube.com/watch?v=...', 'error'); return; }

  _adminExploreVideos.push({ url, title: title || 'Video ' + (_adminExploreVideos.length + 1) });
  urlInput.value = '';
  if (titleInput) titleInput.value = '';

  adminRenderExploreVideosList();
  showToast('Video agregado. No olvides guardar los cambios.', 'success');
}

function adminRemoveExploreVideo(index) {
  _adminExploreVideos.splice(index, 1);
  adminRenderExploreVideosList();
}

function adminMoveExploreVideo(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= _adminExploreVideos.length) return;
  [_adminExploreVideos[index], _adminExploreVideos[newIndex]] = [_adminExploreVideos[newIndex], _adminExploreVideos[index]];
  adminRenderExploreVideosList();
}

async function adminSaveExploreVideos() {
  const btn = document.getElementById('admin-explore-save-btn');
  const status = document.getElementById('admin-explore-save-status');

  if (btn) { btn.disabled = true; btn.textContent = '⏳ Guardando...'; }

  try {
    const data = await apiRequest('/api/settings/explore-videos', {
      method: 'POST',
      body: JSON.stringify({ videos: _adminExploreVideos }),
    });

    if (data.success) {
      _adminExploreVideos = data.videos || _adminExploreVideos;
      adminRenderExploreVideosList();
      if (status) { status.textContent = '✅ Guardado'; status.style.color = '#4caf50'; }
      showToast('Videos actualizados correctamente', 'success');
    } else {
      showToast(data.error || 'Error al guardar', 'error');
      if (status) { status.textContent = '❌ Error'; status.style.color = '#e53935'; }
    }
  } catch(e) {
    showToast('Error de conexión al guardar', 'error');
    if (status) { status.textContent = '❌ Error'; status.style.color = '#e53935'; }
  }

  if (btn) { btn.disabled = false; btn.textContent = '💾 Guardar cambios'; }
  setTimeout(() => { if (status) status.textContent = ''; }, 3000);
}

/* ---- Contact Form (Buzón de Comentarios) ---- */
function initContactWordCounter() {
  const textarea = document.getElementById('contact-message');
  const counter = document.getElementById('contact-word-count');
  if (!textarea || !counter) return;

  textarea.addEventListener('input', function() {
    const text = this.value.trim();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const count = text === '' ? 0 : words.length;
    counter.textContent = count + ' / 1000 palabras';

    if (count > 1000) {
      counter.classList.add('limit-reached');
    } else {
      counter.classList.remove('limit-reached');
    }
  });
}

async function handleContactSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('contact-email');
  const msgInput = document.getElementById('contact-message');
  const btn = document.getElementById('contact-submit-btn');
  if (!emailInput || !msgInput) return;

  const email = emailInput.value.trim();
  const message = msgInput.value.trim();

  if (!email || !message) {
    showToast('Completa todos los campos obligatorios.', 'error');
    return;
  }

  // Validate word count
  const words = message.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 1000) {
    showToast('El comentario excede las 1000 palabras. Por favor, acórtalo.', 'error');
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = '⏳ Enviando...'; }

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, message }),
    });
    const data = await res.json();

    if (data.success) {
      // Show success state
      const form = document.getElementById('contact-form');
      const success = document.getElementById('contact-success');
      if (form) form.style.display = 'none';
      if (success) success.style.display = 'block';
      showToast('¡Mensaje enviado con éxito!', 'success');
    } else {
      showToast(data.error || 'Error al enviar el mensaje.', 'error');
      if (btn) { btn.disabled = false; btn.textContent = '📩 Enviar Comentario'; }
    }
  } catch(err) {
    showToast('Error de conexión. Intenta de nuevo.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = '📩 Enviar Comentario'; }
  }
}

/* ---- Admin: Contact Messages ---- */
async function loadAdminMessages() {
  const list = document.getElementById('admin-messages-list');
  if (!list) return;

  try {
    const data = await apiRequest('/api/contact');
    const messages = (data.success && Array.isArray(data.messages)) ? data.messages : [];
    adminRenderMessages(messages);
  } catch(e) {
    if (list) list.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:var(--space-4)">Error al cargar mensajes.</div>';
  }
}

function adminRenderMessages(messages) {
  const list = document.getElementById('admin-messages-list');
  if (!list) return;

  if (messages.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:var(--space-6) 0;color:var(--text-muted);border:2px dashed var(--glass-border);border-radius:var(--radius-xl)">
        <div style="font-size:2rem;margin-bottom:var(--space-2)">📭</div>
        <p style="font-size:var(--text-sm)">No hay mensajes nuevos.</p>
      </div>`;
    return;
  }

  list.innerHTML = messages.map(m => {
    const date = new Date(m.created_at).toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const preview = m.message.length > 120 ? m.message.slice(0, 120) + '…' : m.message;
    return `
      <div style="padding:var(--space-4);background:var(--bg-secondary);border:1px solid var(--glass-border);border-radius:var(--radius-lg);margin-bottom:var(--space-3)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-2);flex-wrap:wrap;gap:var(--space-2)">
          <div style="font-weight:600;font-size:var(--text-sm);color:var(--accent)">${escapeHtml(m.email)}</div>
          <div style="display:flex;align-items:center;gap:var(--space-2)">
            <span style="font-size:var(--text-xs);color:var(--text-muted)">${date}</span>
            <button onclick="adminDeleteMessage(${m.id})" class="btn" style="padding:2px 8px;color:#e53935;font-size:0.9rem" title="Eliminar">✕</button>
          </div>
        </div>
        <div style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.5;white-space:pre-wrap">${escapeHtml(preview)}</div>
      </div>`;
  }).join('');
}

async function adminDeleteMessage(id) {
  try {
    await apiRequest('/api/contact', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    loadAdminMessages();
    showToast('Mensaje eliminado.', 'success');
  } catch(e) {
    showToast('Error al eliminar.', 'error');
  }
}

/* ---- YouTube Video Carousel (Home Page — combines Videos de YouTube + Explorar Videos) ---- */
let ytCarouselTimer = null;

/** Fetch videos from both APIs, merge, render carousel, then init auto-play */
async function loadYtVideos() {
  const container = document.getElementById('yt-carousel-container');
  const side = document.getElementById('video-side');
  if (!container) return;

  let videos = [];
  try {
    const [ytRes, exRes] = await Promise.allSettled([
      fetch('/api/settings/videos').then(r => r.json()),
      fetch('/api/settings/explore-videos').then(r => r.json())
    ]);
    if (ytRes.status === 'fulfilled' && ytRes.value.success && Array.isArray(ytRes.value.videos)) {
      videos = videos.concat(ytRes.value.videos);
    }
    if (exRes.status === 'fulfilled' && exRes.value.success && Array.isArray(exRes.value.videos)) {
      videos = videos.concat(exRes.value.videos);
    }
  } catch(e) {
    console.warn('Failed to load videos from API:', e);
  }

  // Filter to valid videos and deduplicate by URL
  const seen = new Set();
  videos = videos.filter(v => {
    if (!v.url || !getYouTubeId(v.url)) return false;
    const id = getYouTubeId(v.url);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  if (videos.length === 0) {
    if (side) side.style.display = 'none';
    return;
  }

  // Render carousel HTML
  const slidesHtml = videos.map((v, i) => {
    const vid = getYouTubeId(v.url);
    return `
      <div class="yt-carousel-slide ${i === 0 ? 'active' : ''}" data-index="${i}">
        <iframe
          src="https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1"
          title="${escapeHtml(v.title || 'Video')}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>`;
  }).join('');

  const dotsHtml = videos.length > 1 ? `
    <div class="yt-carousel-controls">
      <button class="yt-carousel-arrow yt-arrow-prev" id="yt-prev" aria-label="Video anterior">‹</button>
      <div class="yt-carousel-dots" id="yt-dots">
        ${videos.map((_, i) => `<button class="yt-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Video ${i+1}"></button>`).join('')}
      </div>
      <button class="yt-carousel-arrow yt-arrow-next" id="yt-next" aria-label="Siguiente video">›</button>
    </div>
    <div class="yt-progress-bar" id="yt-progress"></div>
  ` : '';

  container.innerHTML = `
    <div class="yt-carousel" id="yt-carousel">
      <div class="yt-carousel-viewport">
        <div class="yt-carousel-track" id="yt-carousel-track">${slidesHtml}</div>
      </div>
      ${dotsHtml}
    </div>`;

  initYtCarousel();
}

function initYtCarousel() {
  const track = document.getElementById('yt-carousel-track');
  const dots  = document.querySelectorAll('#yt-dots .yt-dot');
  const prev  = document.getElementById('yt-prev');
  const next  = document.getElementById('yt-next');
  const bar   = document.getElementById('yt-progress');

  if (!track || dots.length === 0) return;

  const slides = track.querySelectorAll('.yt-carousel-slide');
  const total  = slides.length;
  if (total <= 1) return;

  let current  = 0;
  const INTERVAL = 5000; // 5 seconds
  let elapsed  = 0;
  const TICK   = 50;

  function goTo(idx) {
    current = ((idx % total) + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    elapsed = 0;
  }

  function nextSlide() { goTo(current + 1); }
  function prevSlide() { goTo(current - 1); }

  function startAuto() {
    stopAuto();
    elapsed = 0;
    ytCarouselTimer = setInterval(() => {
      elapsed += TICK;
      if (bar) bar.style.width = ((elapsed / INTERVAL) * 100) + '%';
      if (elapsed >= INTERVAL) {
        nextSlide();
        elapsed = 0;
      }
    }, TICK);
  }

  function stopAuto() {
    if (ytCarouselTimer) clearInterval(ytCarouselTimer);
    ytCarouselTimer = null;
    if (bar) bar.style.width = '0%';
  }

  function manualNav(fn) {
    stopAuto();
    fn();
    setTimeout(startAuto, 15000);
  }

  if (prev) prev.addEventListener('click', () => manualNav(prevSlide));
  if (next) next.addEventListener('click', () => manualNav(nextSlide));
  dots.forEach(d => {
    d.addEventListener('click', () => manualNav(() => goTo(Number(d.dataset.index))));
  });

  startAuto();
}

/* ============================================
   MAP WIDGET — Leaflet + OpenStreetMap Location Picker
   ============================================ */

/**
 * Initialize the Leaflet location picker widget.
 * Called after the publish page or edit modal renders.
 * @param {number|null} existingLat - Pre-existing latitude (for edit mode)
 * @param {number|null} existingLng - Pre-existing longitude (for edit mode)
 */
function initAgMap(existingLat, existingLng) {
  if (typeof L === 'undefined') {
    console.error('Leaflet not loaded.');
    const mapDiv = document.getElementById('ag-map-canvas');
    if (mapDiv) {
      mapDiv.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:var(--text-sm);text-align:center;padding:var(--space-4);">⚠️ No se pudo cargar el mapa. Recarga la página.</div>';
    }
    return;
  }

  const mapDiv = document.getElementById('ag-map-canvas');
  if (!mapDiv) return;

  // Destroy any previous map instance on this div
  if (mapDiv._leafletMap) {
    mapDiv._leafletMap.remove();
    mapDiv._leafletMap = null;
  }

  const searchInput = document.getElementById('ag-search-input');
  const hiddenLat = document.getElementById('ag-hidden-lat');
  const hiddenLng = document.getElementById('ag-hidden-lng');
  const addressDisplay = document.getElementById('ag-address-display');
  const distanceDisplay = document.getElementById('ag-distance-display');
  const locationTextInput = document.getElementById('ag-location-text');

  // Default center: Azcapotzalco
  const defaultPos = [19.4833, -99.1833];

  const initialPos = (existingLat && existingLng)
    ? [existingLat, existingLng]
    : defaultPos;

  // Create map with dark tile layer
  const map = L.map(mapDiv, {
    center: initialPos,
    zoom: 15,
    zoomControl: true,
  });

  // Store reference for cleanup
  mapDiv._leafletMap = map;

  // Dark-themed tile layer (CartoDB Dark Matter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // Create draggable marker
  const marker = L.marker(initialPos, {
    draggable: true,
    autoPan: true
  }).addTo(map);

  // Fix map rendering in hidden/delayed containers
  setTimeout(() => map.invalidateSize(), 300);

  // Search functionality using Nominatim (free geocoding)
  if (searchInput) {
    let searchTimeout = null;
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        const query = searchInput.value.trim();
        if (!query) return;
        searchLocation(query);
      }
    });

    // Debounced search on input
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      const query = searchInput.value.trim();
      if (query.length < 3) return;
      searchTimeout = setTimeout(() => searchLocation(query), 600);
    });

    function searchLocation(query) {
      fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query + ', México') + '&limit=1&addressdetails=1')
        .then(r => r.json())
        .then(results => {
          if (results.length > 0) {
            const r = results[0];
            const lat = parseFloat(r.lat);
            const lng = parseFloat(r.lon);
            map.setView([lat, lng], 16);
            marker.setLatLng([lat, lng]);
            updateLocationData(lat, lng, r.display_name);
          }
        })
        .catch(err => console.warn('Geocode search failed:', err));
    }
  }

  // Update hidden fields, address display, location text, and distance
  function updateLocationData(lat, lng, address) {
    if (hiddenLat) hiddenLat.value = lat;
    if (hiddenLng) hiddenLng.value = lng;

    if (address) {
      if (addressDisplay) addressDisplay.textContent = address;
      if (locationTextInput) locationTextInput.value = address;
    } else {
      // Reverse geocode using Nominatim
      fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&addressdetails=1')
        .then(r => r.json())
        .then(data => {
          if (data && data.display_name) {
            if (addressDisplay) addressDisplay.textContent = data.display_name;
            if (locationTextInput) locationTextInput.value = data.display_name;
          }
        })
        .catch(err => console.warn('Reverse geocode failed:', err));
    }

    // Calculate distance from Azcapotzalco center (Haversine)
    calculateDistance(lat, lng, defaultPos[0], defaultPos[1]);
  }

  // Haversine formula
  function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat1 - lat2) * Math.PI / 180;
    const dLng = (lng1 - lng2) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat2 * Math.PI / 180) * Math.cos(lat1 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    if (distanceDisplay) distanceDisplay.textContent = d.toFixed(2) + ' km';
  }

  // Event: marker drag end
  marker.on('dragend', function() {
    const pos = marker.getLatLng();
    updateLocationData(pos.lat, pos.lng);
  });

  // Event: click on map to move marker
  map.on('click', function(e) {
    marker.setLatLng(e.latlng);
    updateLocationData(e.latlng.lat, e.latlng.lng);
  });

  // Event: geolocation button
  const geoBtn = document.getElementById('ag-geo-btn');
  if (geoBtn) {
    geoBtn.addEventListener('click', function() {
      if (!navigator.geolocation) {
        showToast('Tu navegador no soporta geolocalización.', 'error');
        return;
      }

      geoBtn.disabled = true;
      geoBtn.textContent = '⏳ Obteniendo ubicación...';

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          map.setView([lat, lng], 16);
          marker.setLatLng([lat, lng]);
          updateLocationData(lat, lng);

          geoBtn.disabled = false;
          geoBtn.textContent = '📍 Usar mi ubicación';
        },
        (error) => {
          showToast('Error al obtener ubicación: ' + error.message, 'error');
          geoBtn.disabled = false;
          geoBtn.textContent = '📍 Usar mi ubicación';
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  // If we have existing coords, update the display
  if (existingLat && existingLng) {
    updateLocationData(existingLat, existingLng);
  }
}

/**
 * Initialize a read-only mini-map on the ad detail page.
 * @param {string} canvasId - DOM id of the map container
 * @param {number} lat
 * @param {number} lng
 */
function initDetailMap(canvasId, lat, lng) {
  if (typeof L === 'undefined') return;

  const mapDiv = document.getElementById(canvasId);
  if (!mapDiv) return;

  const pos = [lat, lng];
  const map = L.map(mapDiv, {
    center: pos,
    zoom: 15,
    zoomControl: true,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  L.marker(pos).addTo(map);

  // Fix rendering in delayed containers
  setTimeout(() => map.invalidateSize(), 300);
}

