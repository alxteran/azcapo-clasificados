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
  } else if (path === '/publish') {
    html = renderPublishPage();
    updateActiveNav('publish');
  } else if (path === '/my-ads') {
    html = renderMyAdsPage();
    updateActiveNav('my-ads');
    // Fetch my ads from API and re-render
    loadMyAds();
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
          ${isLoggedIn ? `
            <a class="header-nav-link" data-nav="my-ads" href="#/my-ads" onclick="return false" style="color:var(--text-secondary)">
              📌 <span class="btn-text">Mis Anuncios</span>
            </a>
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
    const ad = {
      title: data.get('title'),
      description: data.get('description'),
      category: data.get('category'),
      price: Number(data.get('price')),
      location: data.get('location'),
      type: 'free',
      images: [...uploadedImages],
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

/** Show confirmation page after successful publish */
function showPublishConfirmation(ad) {
  const adId = ad.public_id || ad.id;
  const appContent = document.getElementById('app-content');
  
  // Reset currentRoute so navigateTo can work from this state
  currentRoute = '__confirmation__';
  
  appContent.innerHTML = `
    <div class="publish-page">
      <div class="publish-confirmation">
        <div class="confirmation-icon">🎉</div>
        <h2 class="confirmation-title">¡Tu anuncio ha sido publicado!</h2>
        <p class="confirmation-subtitle">Tu anuncio estará visible durante 15 días.</p>

        <div class="confirmation-ad-link">
          <button class="btn btn-primary" onclick="navigateTo('/ad/${adId}')">
            👁️ Ver mi anuncio
          </button>
        </div>

        <div class="confirmation-community">
          <div class="confirmation-community-inner">
            <p>Este portal ha sido creado con un propósito claro: <strong>dar un mayor impulso al comercio local.</strong></p>
            <p>A través de AzcapoClasificados, cualquier persona tendrá una herramienta sencilla y efectiva para impulsar y promover sus productos y servicios, llegando a más personas de su propia comunidad.</p>
            <p>Este proyecto nace de una idea libre y espontánea: <strong>ayudar de forma desinteresada</strong> a que el comercio de nuestra zona crezca y se fortalezca. No hay intereses ocultos, solo la convicción de que el trabajo local merece visibilidad.</p>
            <p>Pero para que este espacio pueda mantenerse activo, mejorar sus funciones y seguir siendo gratuito para la mayoría, <strong>necesitamos tu apoyo.</strong></p>
            <p>Si puedes apoyarnos, te invitamos a dispararnos un café. Con ese pequeño gesto, nos darás la posibilidad de seguir manteniendo este proyecto… pensando siempre en tu beneficio.</p>
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
        <input class="form-input" type="text" name="location" required value="${escapeHtml(ad.location)}">
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
    const fields = {
      title: data.get('title'),
      description: data.get('description'),
      category: data.get('category'),
      price: Number(data.get('price')),
      location: data.get('location'),
      images: [...editUploadedImages],
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
