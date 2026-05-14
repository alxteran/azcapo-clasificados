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
  } else if (path === '/publish') {
    html = renderPublishPage(publishType);
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

/* ---- Publish Handlers ---- */
function switchPublishType(type) {
  publishType = type;
  uploadedImages = [];
  const container = document.getElementById('publish-form-container');
  if (container) {
    container.innerHTML = renderPublishForm(type);
  }
}

function handleImageUpload(event) {
  const files = Array.from(event.target.files);
  const maxImages = 5;

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
      type: data.get('type'),
      images: data.get('type') === 'premium' ? [...uploadedImages] : [],
      contact: {
        name: AuthStore.getCurrentEmail(),
        phone: 'No especificado',
        email: AuthStore.getCurrentEmail(),
      }
    };

    // Premium ads → create ad as pending, then redirect to MercadoPago
    if (ad.type === 'premium') {
      await handlePremiumPublish(ad);
      return;
    }

    // Free ads → publish directly via API
    const newAd = await Store.add(ad);
    uploadedImages = [];
    publishType = 'free';

    showToast(`¡Anuncio publicado! Vigencia: ${FREE_DAYS} días. Renovaciones: hasta ${FREE_MAX_RENEWALS}.`, 'success');
    navigateTo('/ad/' + newAd.id);
  } catch (error) {
    console.error('Publish error:', error);
    showToast(error.message || 'Error al publicar anuncio.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/** Premium publish flow via MercadoPago API */
async function handlePremiumPublish(ad) {
  try {
    // 1. Create ad in DB as pending_payment
    const newAd = await Store.add(ad);

    // 2. Create MercadoPago preference via our API
    const prefData = await apiRequest('/api/payments/create-preference', {
      method: 'POST',
      body: JSON.stringify({
        adPublicId: newAd.id,
        title: ad.title,
      }),
    });

    if (!prefData.success) {
      showToast(prefData.message || 'Error al crear preferencia de pago.', 'error');
      return;
    }

    // 3. Redirect to MercadoPago checkout
    uploadedImages = [];
    publishType = 'free';

    showToast('Redirigiendo a MercadoPago para completar el pago...', 'info');

    // Use init_point for production
    const paymentUrl = prefData.initPoint || prefData.sandboxInitPoint;
    window.location.href = paymentUrl;
  } catch (error) {
    console.error('Premium publish error:', error);
    showToast('Error al procesar pago premium.', 'error');
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

/* ---- Gallery ---- */
function switchGalleryImage(src, thumbEl) {
  const mainImg = document.getElementById('gallery-main-img');
  if (mainImg) mainImg.src = src;
  document.querySelectorAll('.ad-detail-thumb').forEach(t => t.classList.remove('active'));
  if (thumbEl) thumbEl.classList.add('active');
}

/* ---- Chat Handlers ---- */
function sendChatMessage(adId) {
  const input = document.getElementById('chat-input-' + adId);
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  ChatStore.sendMessage(adId, text, currentChatRole);
  input.value = '';

  // Refresh messages
  const messagesEl = document.getElementById('chat-messages-' + adId);
  if (messagesEl) {
    messagesEl.innerHTML = renderChatMessages(adId);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}

function switchChatRole(adId, role) {
  currentChatRole = role;
  document.getElementById('role-buyer').classList.toggle('active', role === 'buyer');
  document.getElementById('role-seller').classList.toggle('active', role === 'seller');

  // Update input placeholder
  const input = document.getElementById('chat-input-' + adId);
  if (input) {
    input.placeholder = role === 'buyer' ? 'Escribe al vendedor...' : 'Responde al comprador...';
    input.focus();
  }
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
