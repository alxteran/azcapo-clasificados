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
  const isPremium = ad.type === 'premium';
  const delay = Math.min(index * 0.06, 0.5);
  const hasImage = isPremium && ad.images && ad.images.length > 0;

  return `
    <article class="ad-card ${isPremium ? 'premium' : ''}" data-id="${ad.id}" onclick="navigateTo('/ad/${ad.id}')" style="animation-delay:${delay}s">
      ${isPremium || hasImage ? `
        <div class="ad-card-image">
          ${hasImage
            ? `<img src="${ad.images[0]}" alt="${escapeHtml(ad.title)}" loading="lazy">`
            : `<div class="ad-card-image-placeholder">${cat.emoji}</div>`
          }
          <div class="ad-card-badges">
            ${isPremium ? '<span class="badge badge-premium">⭐ Premium</span>' : ''}
            ${(Date.now() - ad.createdAt) < 86400000 * 3 ? '<span class="badge badge-new">Nuevo</span>' : ''}
          </div>
        </div>
      ` : ''}
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
      ${!isPremium ? `
        <div class="ad-card-badges" style="position:absolute;top:var(--space-3);right:var(--space-3);">
          <span class="badge badge-free">Gratis</span>
        </div>
      ` : ''}
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
function renderPublishForm(type = 'free') {
  const isPremium = type === 'premium';
  return `
    <div class="publish-type-toggle">
      <div class="toggle-group">
        <div class="toggle-option ${!isPremium ? 'active' : ''}" onclick="switchPublishType('free')">📝 Gratuito</div>
        <div class="toggle-option ${isPremium ? 'active' : ''}" onclick="switchPublishType('premium')">⭐ Premium</div>
      </div>
    </div>

    ${isPremium ? `
      <div class="premium-features">
        <div class="premium-features-title">⭐ Anuncio Premium — $56.23 MXN / mes</div>
        <div class="premium-features-list">
          <div class="premium-feature-item">📸 Hasta 5 fotos para mejor promoción</div>
          <div class="premium-feature-item">🔝 Posición prioritaria en resultados</div>
          <div class="premium-feature-item">✨ Textos destacados para mayor impacto</div>
          <div class="premium-feature-item">📅 30 días de vigencia</div>
          <div class="premium-feature-item">🔄 Renovaciones ilimitadas</div>
          <div class="premium-feature-item">👁️ Mayor visibilidad y alcance</div>
        </div>
        <div class="premium-price-tag">
          <span class="premium-price-amount">$56.23</span>
          <span class="premium-price-period">MXN / por anuncio al mes</span>
        </div>
      </div>
    ` : `
      <div class="vigencia-notice vigencia-free">
        <div class="vigencia-notice-icon">📋</div>
        <div class="vigencia-notice-content">
          <div class="vigencia-notice-title">Anuncio Gratuito</div>
          <div class="vigencia-notice-text">
            Tu anuncio tendrá una <strong>vigencia de 15 días</strong>. Una vez concluido el tiempo, se suspenderá su visibilidad.
            Podrás <strong>renovarlo hasta 3 veces</strong> sin costo adicional.
          </div>
          <div class="vigencia-notice-details">
            <span>⏱️ 15 días de vigencia</span>
            <span>🔄 3 renovaciones máximas</span>
            <span>💰 Sin costo</span>
          </div>
        </div>
      </div>
    `}

    ${isPremium ? `
      <div class="vigencia-notice vigencia-premium">
        <div class="vigencia-notice-icon">💎</div>
        <div class="vigencia-notice-content">
          <div class="vigencia-notice-title">Vigencia y Renovación Premium</div>
          <div class="vigencia-notice-text">
            Tu anuncio de pago tendrá una <strong>vigencia de 30 días</strong>. Incluye <strong>fotos y textos destacados</strong> para mejor promoción.
            Una vez concluido el tiempo, podrás <strong>renovarlo las veces que quieras</strong>.
          </div>
          <div class="vigencia-notice-details">
            <span>⏱️ 30 días de vigencia</span>
            <span>🔄 Renovaciones ilimitadas</span>
            <span>💰 $56.23 MXN / mes</span>
          </div>
        </div>
      </div>
    ` : ''}

    <form id="publish-form" onsubmit="handlePublish(event)">
      <input type="hidden" name="type" value="${type}">
      <div class="form-group">
        <label class="form-label">Título del anuncio *</label>
        <input class="form-input" type="text" name="title" required placeholder="Ej: iPhone 15 Pro — Como nuevo" maxlength="120">
      </div>
      <div class="form-group">
        <label class="form-label">Categoría *</label>
        <select class="form-select form-input" name="category" required>
          <option value="">Selecciona una categoría</option>
          ${CATEGORIES.map(c => `
            <optgroup label="${c.emoji} ${c.name}">
              ${c.subs.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
            </optgroup>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Precio (MXN) *</label>
        <input class="form-input" type="number" name="price" required min="0" placeholder="0">
      </div>
      <div class="form-group">
        <label class="form-label">Descripción *</label>
        <textarea class="form-textarea" name="description" required placeholder="Describe tu producto o servicio con detalle..." maxlength="2000"></textarea>
        <span class="form-hint">Máximo 2000 caracteres</span>
      </div>
      <div class="form-group">
        <label class="form-label">Ubicación *</label>
        <input class="form-input" type="text" name="location" required placeholder="Ej: CDMX, Polanco">
      </div>
      ${isPremium ? `
        <div class="form-group">
          <label class="form-label">Fotos (hasta 5)</label>
          <div class="image-upload-area" id="image-upload-area" onclick="document.getElementById('image-input').click()">
            <div class="image-upload-icon">📸</div>
            <div class="image-upload-text">Haz clic para seleccionar imágenes</div>
            <div class="image-upload-hint">Agrega fotos para mejor promoción de tu anuncio</div>
          </div>
          <input type="file" id="image-input" accept="image/*" multiple style="display:none" onchange="handleImageUpload(event)">
          <div class="image-preview-grid" id="image-preview-grid"></div>
        </div>
      ` : ''}
      <div class="publish-form-actions">
        <button type="button" class="btn btn-secondary" onclick="navigateTo('/')">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isPremium ? '⭐ Publicar Premium — $56.23 MXN' : '📝 Publicar Gratis'}</button>
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
  const isPremium = ad.type === 'premium';
  const used = ad.renewalCount || 0;

  let renewalText = '';
  if (isPremium) {
    renewalText = `🔄 Renovaciones: ${used} usada${used !== 1 ? 's' : ''} — <strong>Ilimitadas</strong>`;
  } else {
    renewalText = `🔄 Renovaciones: ${used} de ${ad.maxRenewals || FREE_MAX_RENEWALS} usadas — <strong>${remaining} restante${remaining !== 1 ? 's' : ''}</strong>`;
  }

  return `
    <div class="renewal-info">
      <div class="renewal-text">${renewalText}</div>
      ${ad.suspended ? `
        ${canRenew ? `
          <button class="btn btn-primary btn-sm" onclick="handleRenewAd('${ad.id}')">
            🔄 Renovar Anuncio${isPremium ? '' : ` (${remaining} restante${remaining !== 1 ? 's' : ''})`}
          </button>
        ` : `
          <div class="renewal-exhausted">
            ❌ Has agotado tus renovaciones para este anuncio.
            ${!isPremium ? '<br><small>Considera publicar un <strong>anuncio Premium ($56.23 MXN)</strong> para renovaciones ilimitadas.</small>' : ''}
          </div>
        `}
      ` : ''}
    </div>
  `;
}

/* ---- My Ad Card (with vigencia info) ---- */
function renderMyAdCard(ad, index = 0) {
  const cat = getCategoryById(ad.category);
  const isPremium = ad.type === 'premium';
  const delay = Math.min(index * 0.06, 0.5);
  const status = Store.getVigenciaStatus(ad);
  const remainingDays = Store.getRemainingDays(ad);

  return `
    <article class="ad-card ${isPremium ? 'premium' : ''} ${ad.suspended ? 'suspended' : ''}" data-id="${ad.id}" style="animation-delay:${delay}s">
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
          ${isPremium ? '<span class="badge badge-premium">⭐ Premium</span>' : '<span class="badge badge-free">Gratuito</span>'}
        </div>
        ${!ad.suspended && remainingDays > 0 ? `
          <div class="vigencia-progress">
            <div class="vigencia-progress-bar ${status.cssClass}" style="width:${Math.min(100, (remainingDays / (isPremium ? PREMIUM_DAYS : FREE_DAYS)) * 100)}%"></div>
          </div>
        ` : ''}
        ${renderRenewalInfo(ad)}
      </div>
    </article>
  `;
}
