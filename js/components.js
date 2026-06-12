/* ============================================
   CLASIFICADOS MX — UI Components
   ============================================ */

/* ---- Helpers ---- */
function formatPrice(n) {
  return '$' + Number(n).toLocaleString('es-MX');
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Justo ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `Hace ${days}d`;
  const months = Math.floor(days / 30);
  return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ---- Ad Card ---- */
function renderAdCard(ad, index = 0) {
  const cat = getCategoryById(ad.category);
  const delay = Math.min(index * 0.06, 0.5);
  const hasImage = ad.images && ad.images.length > 0;

  // Calculate remaining days
  let remainingBadge = '';
  if (ad.expiresAt) {
    const remaining = Math.max(0, Math.ceil((new Date(ad.expiresAt).getTime() - Date.now()) / DAY_MS));
    if (remaining <= 3 && remaining > 0) {
      remainingBadge = `<span class="badge badge-expiring">⏳ ${remaining}d</span>`;
    } else if (remaining > 3) {
      remainingBadge = `<span class="badge badge-time">⏱️ ${remaining}d</span>`;
    }
  }

  return `
    <article class="ad-card" data-id="${ad.id}" onclick="navigateTo('/ad/${ad.id}')" style="animation-delay:${delay}s">
      <div class="ad-card-image">
        ${hasImage
          ? `<img src="${ad.images[0]}" alt="${escapeHtml(ad.title)}" loading="lazy">`
          : `<div class="ad-card-image-placeholder">${cat.emoji}</div>`
        }
        <div class="ad-card-badges">
          ${(Date.now() - ad.createdAt) < 86400000 * 3 ? '<span class="badge badge-new">Nuevo</span>' : ''}
          ${remainingBadge}
          ${ad.featured ? `<span class="badge-boost badge-boost--${ad.boostLevel || 'featured'}">${ad.boostLevel === 'premium' ? '⭐ Premium' : ad.boostLevel === 'basic' ? '▲ Básico' : '🔥 Destacado'}</span>` : ''}
        </div>
      </div>
      <div class="ad-card-body">
        <div class="ad-card-category">
          <span>${cat.emoji}</span> ${escapeHtml(cat.name)}
        </div>
        <h3 class="ad-card-title">${escapeHtml(ad.title)}</h3>
        <p class="ad-card-desc">${escapeHtml(ad.description)}</p>
        <div class="ad-card-footer">
          <span class="ad-card-price">${formatPrice(ad.price)}</span>
          <div class="ad-card-meta">
            <span class="ad-card-meta-item">📍 ${escapeHtml(ad.location.split(',')[0])}</span>
            <span class="ad-card-meta-item">🕐 ${timeAgo(ad.createdAt)}</span>
          </div>
        </div>
      </div>
    </article>
  `;
}

/* ---- Category Card ---- */
function renderCategoryCard(cat) {
  const count = Store.getCountByCategory(cat.id);
  return `
    <div class="category-card" onclick="navigateTo('/category/${cat.id}')">
      <div class="category-card-icon" style="background:${cat.color}20;color:${cat.color}">
        ${cat.emoji}
      </div>
      <span class="category-card-name">${escapeHtml(cat.name)}</span>
      <span class="category-card-count">${count} anuncio${count !== 1 ? 's' : ''}</span>
    </div>
  `;
}

/* ---- Search Bar ---- */
function renderSearchBar(value = '', placeholder = 'Buscar anuncios...') {
  return `
    <div class="search-bar" id="search-bar">
      <span class="search-bar-icon">🔍</span>
      <input type="text" id="search-input" placeholder="${placeholder}" value="${escapeHtml(value)}" autocomplete="off">
    </div>
  `;
}

/* ---- Filter Panel ---- */
function renderFilterPanel(activeFilters = {}) {
  const typeChecked = (t) => activeFilters.type === t ? 'checked' : '';
  return `
    <div class="filter-panel">
      <div class="filter-section">
        <div class="filter-title">Tipo de Anuncio</div>
        <label class="filter-option">
          <input type="radio" name="filter-type" value="" ${!activeFilters.type ? 'checked' : ''} onchange="applyFilters()">
          <span class="filter-check"></span>
          Todos
        </label>
        <label class="filter-option">
          <input type="radio" name="filter-type" value="premium" ${typeChecked('premium')} onchange="applyFilters()">
          <span class="filter-check"></span>
          ⭐ Premium
        </label>
        <label class="filter-option">
          <input type="radio" name="filter-type" value="free" ${typeChecked('free')} onchange="applyFilters()">
          <span class="filter-check"></span>
          Gratuitos
        </label>
      </div>
      <div class="filter-section">
        <div class="filter-title">Rango de Precio</div>
        <div class="filter-price-inputs">
          <input type="number" class="filter-price-input" id="filter-min-price" placeholder="Mín" value="${activeFilters.minPrice || ''}" onchange="applyFilters()">
          <span style="color:var(--text-muted)">—</span>
          <input type="number" class="filter-price-input" id="filter-max-price" placeholder="Máx" value="${activeFilters.maxPrice || ''}" onchange="applyFilters()">
        </div>
      </div>
      <div class="filter-section">
        <div class="filter-title">Categoría</div>
        <div style="max-height:300px;overflow-y:auto">
        <label class="filter-option">
          <input type="radio" name="filter-cat" value="" ${!activeFilters.category ? 'checked' : ''} onchange="applyFilters()">
          <span class="filter-check"></span>
          Todas las categorías
        </label>
        ${CATEGORIES.map(c => `
          <label class="filter-option" style="font-weight:600">
            <input type="radio" name="filter-cat" value="${c.id}" ${activeFilters.category === c.id ? 'checked' : ''} onchange="applyFilters()">
            <span class="filter-check"></span>
            ${c.emoji} ${escapeHtml(c.name)}
          </label>
          ${c.subs.map(s => `
            <label class="filter-option" style="padding-left:var(--space-6);font-size:var(--text-xs)">
              <input type="radio" name="filter-cat" value="${s.id}" ${activeFilters.category === s.id ? 'checked' : ''} onchange="applyFilters()">
              <span class="filter-check"></span>
              ${escapeHtml(s.name)}
            </label>
          `).join('')}
        `).join('')}
        </div>
      </div>
      <button class="btn btn-secondary" style="width:100%;margin-top:var(--space-4)" onclick="clearFilters()">Limpiar filtros</button>
    </div>
  `;
}

/* ---- Sort Bar ---- */
function renderSortBar(count, sort = '') {
  return `
    <div class="sort-bar">
      <span class="sort-bar-info">${count} resultado${count !== 1 ? 's' : ''}</span>
      <div class="sort-bar-actions">
        <button class="btn btn-ghost btn-sm filter-toggle-mobile" onclick="toggleMobileSidebar()">☰ Filtros</button>
        <select class="sort-select" id="sort-select" onchange="applyFilters()">
          <option value="" ${sort === '' ? 'selected' : ''}>Más relevantes</option>
          <option value="price-asc" ${sort === 'price-asc' ? 'selected' : ''}>Precio: menor a mayor</option>
          <option value="price-desc" ${sort === 'price-desc' ? 'selected' : ''}>Precio: mayor a menor</option>
          <option value="oldest" ${sort === 'oldest' ? 'selected' : ''}>Más antiguos</option>
        </select>
      </div>
    </div>
  `;
}

/* ---- Modal ---- */
function openModal(title, bodyHtml, footerHtml = '') {
  const backdrop = document.getElementById('modal-backdrop');
  backdrop.querySelector('.modal-title').textContent = title;
  backdrop.querySelector('.modal-body').innerHTML = bodyHtml;
  backdrop.querySelector('.modal-footer').innerHTML = footerHtml;
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const backdrop = document.getElementById('modal-backdrop');
  backdrop.classList.remove('open');
  document.body.style.overflow = '';
}

/* ---- Toast ---- */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ---- Publish Form ---- */
function renderPublishForm(existingAd) {
  const title = existingAd ? escapeHtml(existingAd.title) : '';
  const description = existingAd ? escapeHtml(existingAd.description) : '';
  const price = existingAd ? existingAd.price : '';
  const location = existingAd ? escapeHtml(existingAd.location) : '';
  const lat = existingAd && existingAd.latitude ? existingAd.latitude : '';
  const lng = existingAd && existingAd.longitude ? existingAd.longitude : '';
  const selectedCat = existingAd ? existingAd.category : '';

  return `
    <div class="vigencia-notice vigencia-free">
      <div class="vigencia-notice-icon">📋</div>
      <div class="vigencia-notice-content">
        <div class="vigencia-notice-title">Publica tu anuncio</div>
        <div class="vigencia-notice-text">
          Tu anuncio tendrá una <strong>vigencia de 30 días</strong> y podrás agregar <strong>hasta 3 fotos</strong> para mejor promoción.
          Podrás <strong>renovarlo gratis</strong> las veces que necesites.
        </div>
        <div class="vigencia-notice-details">
          <span>⏱️ 30 días de vigencia</span>
          <span>📸 Hasta 3 fotos</span>
          <span>🔄 Renovaciones ilimitadas</span>
          <span>💰 Sin costo</span>
        </div>
      </div>
    </div>

    <form id="publish-form" onsubmit="handlePublish(event)">
      <input type="hidden" name="type" value="free">
      <div class="form-group">
        <label class="form-label">Título del anuncio *</label>
        <input class="form-input" type="text" name="title" required placeholder="Ej: iPhone 15 Pro — Como nuevo" maxlength="120" value="${title}">
      </div>
      <div class="form-group">
        <label class="form-label">Categoría *</label>
        <select class="form-select form-input" name="category" required>
          <option value="">Selecciona una categoría</option>
          ${CATEGORIES.map(c => `
            <optgroup label="${c.emoji} ${c.name}">
              ${c.subs.map(s => `<option value="${s.id}" ${selectedCat === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
            </optgroup>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Precio (MXN) *</label>
        <input class="form-input" type="number" name="price" required min="0" placeholder="0" value="${price}">
      </div>
      <div class="form-group">
        <label class="form-label">Descripción *</label>
        <textarea class="form-textarea" name="description" required placeholder="Describe tu producto o servicio con detalle..." maxlength="2000">${description}</textarea>
        <span class="form-hint">Máximo 2000 caracteres</span>
      </div>
      <div class="form-group">
        <label class="form-label">Ubicación *</label>
        <input class="form-input" type="text" name="location" id="ag-location-text" required placeholder="Ej: CDMX, Polanco" value="${location}">
      </div>

      <!-- Map Location Widget -->
      <div class="form-group">
        <div class="ag-map-widget" id="ag-map-widget">
          <h3 class="ag-map-widget-title">📍 Ubicación en el Mapa</h3>
          <p class="ag-map-widget-subtitle">Arrastra el marcador o busca tu dirección para una mayor precisión.</p>

          <div class="ag-map-search-bar">
            <input id="ag-search-input" type="text" placeholder="Buscar dirección..." autocomplete="off">
            <button type="button" id="ag-geo-btn" class="ag-map-geo-btn">
              📍 Usar mi ubicación
            </button>
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

          <input type="hidden" id="ag-hidden-lat" name="latitude" value="${lat}">
          <input type="hidden" id="ag-hidden-lng" name="longitude" value="${lng}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Fotos (hasta 3)</label>
        <div class="image-upload-area" id="image-upload-area" onclick="document.getElementById('image-input').click()">
          <div class="image-upload-icon">📸</div>
          <div class="image-upload-text">Haz clic para seleccionar imágenes</div>
          <div class="image-upload-hint">Agrega fotos para mejor promoción de tu anuncio</div>
        </div>
        <input type="file" id="image-input" accept="image/*" multiple style="display:none" onchange="handleImageUpload(event)">
        <div class="image-preview-grid" id="image-preview-grid"></div>
      </div>
      <div class="publish-form-actions">
        <button type="button" class="btn btn-secondary" onclick="navigateTo('/')">Cancelar</button>
        <button type="submit" class="btn btn-primary">📝 Publicar Ahora</button>
      </div>
    </form>
  `;
}

/* ---- Auth Form (Login / Register) ---- */
function renderAuthForm(mode = 'register') {
  const isRegister = mode === 'register';
  return `
    <div class="auth-card">
      <div class="auth-card-header">
        <div class="auth-icon">${isRegister ? '📝' : '🔐'}</div>
        <h2 class="auth-title">${isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
        <p class="auth-subtitle">${isRegister ? 'Regístrate para publicar tus anuncios' : 'Ingresa con tu correo y contraseña'}</p>
      </div>

      <div class="auth-toggle">
        <div class="toggle-group">
          <div class="toggle-option ${isRegister ? 'active' : ''}" onclick="switchAuthMode('register')">📝 Registrarse</div>
          <div class="toggle-option ${!isRegister ? 'active' : ''}" onclick="switchAuthMode('login')">🔐 Iniciar Sesión</div>
        </div>
      </div>

      <form id="auth-form" onsubmit="handleAuth(event, '${mode}')">
        <div class="form-group">
          <label class="form-label">📧 Correo Electrónico *</label>
          <input class="form-input" type="email" name="email" id="auth-email" required placeholder="tu@correo.com" autocomplete="email">
        </div>
        <div class="form-group">
          <label class="form-label">🔒 Contraseña *${isRegister ? ' (mínimo 6 caracteres)' : ''}</label>
          <input class="form-input" type="password" name="password" id="auth-password" required placeholder="${isRegister ? 'Crea una contraseña segura' : 'Tu contraseña'}" minlength="${isRegister ? '6' : '1'}" autocomplete="${isRegister ? 'new-password' : 'current-password'}">
        </div>

        <div class="form-group">
          <label class="form-label">🤖 Verificación CAPTCHA *</label>
          <div class="captcha-container">
            <canvas id="captcha-canvas" width="180" height="55" class="captcha-canvas"></canvas>
            <button type="button" class="captcha-refresh" onclick="refreshCaptcha()" title="Generar nuevo código">🔄</button>
          </div>
          <input class="form-input captcha-input" type="text" name="captcha" id="auth-captcha" required placeholder="Ingresa los 4 dígitos" maxlength="4" pattern="[0-9]{4}" autocomplete="off">
          <span class="form-hint">Ingresa los 4 dígitos que ves en la imagen</span>
        </div>

        <div class="auth-error" id="auth-error" style="display:none"></div>

        <div class="publish-form-actions">
          <button type="submit" class="btn btn-primary btn-lg" style="width:100%">
            ${isRegister ? '📝 Crear Cuenta' : '🔐 Iniciar Sesión'}
          </button>
        </div>
      </form>

      <div class="auth-footer">
        ${isRegister
          ? '<span>¿Ya tienes cuenta? <a href="#" onclick="switchAuthMode(\'login\');return false;" class="auth-link">Inicia sesión</a></span>'
          : '<span>¿No tienes cuenta? <a href="#" onclick="switchAuthMode(\'register\');return false;" class="auth-link">Regístrate</a></span>'
        }
      </div>
    </div>
  `;
}

/* ---- Vigencia Status Badge ---- */
function renderVigenciaBadge(ad) {
  if (!ad) return '';
  const status = Store.getVigenciaStatus(ad);
  const icons = { active: '✅', expiring: '⚠️', suspended: '🚫' };
  return `<span class="badge-vigencia ${status.cssClass}">${icons[status.status] || ''} ${status.label}</span>`;
}

/* ---- Renewal Info & Button ---- */
function renderRenewalInfo(ad) {
  if (!ad) return '';
  const canRenew = Store.canRenew(ad);
  const remaining = Store.getRemainingRenewals(ad);
  const used = ad.renewalCount || 0;

  const isUnlimited = (ad.maxRenewals || FREE_MAX_RENEWALS) >= 999999;
  const renewalText = isUnlimited
    ? `🔄 Renovaciones: ${used} usadas — <strong>ilimitadas</strong>`
    : `🔄 Renovaciones: ${used} de ${ad.maxRenewals || FREE_MAX_RENEWALS} usadas — <strong>${remaining} restante${remaining !== 1 ? 's' : ''}</strong>`;

  return `
    <div class="renewal-info">
      <div class="renewal-text">${renewalText}</div>
      ${ad.suspended ? `
        ${canRenew ? `
          <button class="btn btn-primary btn-sm" onclick="handleRenewAd('${ad.id}')">
            🔄 Renovar Anuncio (${remaining} restante${remaining !== 1 ? 's' : ''})
          </button>
        ` : `
          <div class="renewal-exhausted">
            ❌ Has agotado tus renovaciones para este anuncio.
          </div>
        `}
      ` : ''}
    </div>
  `;
}

/* ---- My Ad Card (with vigencia info) ---- */
function renderMyAdCard(ad, index = 0) {
  const cat = getCategoryById(ad.category);
  const delay = Math.min(index * 0.06, 0.5);
  const status = Store.getVigenciaStatus(ad);
  const remainingDays = Store.getRemainingDays(ad);

  return `
    <article class="ad-card ${ad.suspended ? 'suspended' : ''}" data-id="${ad.id}" style="animation-delay:${delay}s">
      <div class="ad-card-body" onclick="navigateTo('/ad/${ad.id}')">
        <div class="ad-card-category">
          <span>${cat.emoji}</span> ${escapeHtml(cat.name)}
        </div>
        <h3 class="ad-card-title">${escapeHtml(ad.title)}</h3>
        <p class="ad-card-desc">${escapeHtml(ad.description)}</p>
        <div class="ad-card-footer">
          <span class="ad-card-price">${formatPrice(ad.price)}</span>
          <div class="ad-card-meta">
            <span class="ad-card-meta-item">📍 ${escapeHtml(ad.location.split(',')[0])}</span>
          </div>
        </div>
      </div>
      <div class="ad-card-vigencia">
        <div class="ad-card-vigencia-row">
          ${renderVigenciaBadge(ad)}
          ${remainingDays > 0 ? `<span class="badge badge-time">⏱️ ${remainingDays} día${remainingDays !== 1 ? 's' : ''} restante${remainingDays !== 1 ? 's' : ''}</span>` : ''}
        </div>
        ${!ad.suspended && remainingDays > 0 ? `
          <div class="vigencia-progress">
            <div class="vigencia-progress-bar ${status.cssClass}" style="width:${Math.min(100, (remainingDays / FREE_DAYS) * 100)}%"></div>
          </div>
        ` : ''}
        ${renderRenewalInfo(ad)}
        <div style="margin-top:var(--space-3);display:flex;gap:var(--space-2);flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="handleEditAd('${ad.id}')">
            ✏️ Modificar anuncio
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderStarRating(rating, totalReviews) {
  if (!rating || rating === 0) return '';
  const stars = Math.round(rating);
  const starHtml = Array.from({length: 5}, (_, i) => 
    `<span style="color: ${i < stars ? '#f59e0b' : '#d1d5db'}">&#9733;</span>`
  ).join('');
  return `
    <div class="star-rating">
      ${starHtml}
      <span class="star-rating__score">${Number(rating).toFixed(1)}</span>
      ${totalReviews ? `<span class="star-rating__count">(${totalReviews} reseñas)</span>` : ''}
    </div>
  `;
}
