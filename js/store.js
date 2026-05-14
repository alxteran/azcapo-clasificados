/* ============================================
   CLASIFICADOS MX — Store (API-backed Data Layer)
   ============================================ */

/* ---- Vigencia Constants ---- */
const FREE_DAYS = 15;
const PREMIUM_DAYS = 30;
const FREE_MAX_RENEWALS = 3;
const PREMIUM_MAX_RENEWALS = Infinity;
const DAY_MS = 86400000; // 1 day in milliseconds

const CATEGORIES = [
  { id: 'empleo', name: 'Empleo y Servicios', emoji: '💼',
    subs: [
      { id: 'empleo-ofertas', name: 'Ofertas de trabajo' },
      { id: 'empleo-freelance', name: 'Freelance / por proyecto' },
      { id: 'empleo-profesionales', name: 'Servicios profesionales' },
      { id: 'empleo-oficios', name: 'Oficios (plomería, electricidad, carpintería)' },
    ]},
  { id: 'moda', name: 'Moda y Accesorios', emoji: '👗',
    subs: [
      { id: 'moda-hombre-mujer', name: 'Ropa hombre/mujer' },
      { id: 'moda-calzado', name: 'Calzado' },
      { id: 'moda-bolsas', name: 'Bolsas y accesorios' },
      { id: 'moda-marca', name: 'Ropa de marca / segunda mano' },
    ]},
  { id: 'celulares', name: 'Celulares y Tablets', emoji: '📱',
    subs: [
      { id: 'celulares-smartphones', name: 'Smartphones' },
      { id: 'celulares-tablets', name: 'Tablets' },
      { id: 'celulares-accesorios', name: 'Accesorios (fundas, cargadores)' },
    ]},
  { id: 'computo', name: 'Cómputo', emoji: '🖥️',
    subs: [
      { id: 'computo-laptops', name: 'Laptops y PCs' },
      { id: 'computo-componentes', name: 'Componentes y Periféricos' },
      { id: 'computo-impresion', name: 'Impresión y Redes' },
      { id: 'computo-accesorios', name: 'Accesorios y Software' },
    ]},
  { id: 'electronica', name: 'Electrónica', emoji: '📺',
    subs: [
      { id: 'electronica-audio', name: 'Audio' },
      { id: 'electronica-tv', name: 'TV y Video' },
      { id: 'electronica-gaming', name: 'Gaming' },
      { id: 'electronica-camaras', name: 'Cámaras y Drones' },
      { id: 'electronica-gadgets', name: 'Gadgets y Smart Home' },
    ]},
  { id: 'muebles', name: 'Muebles y Hogar', emoji: '🛋️',
    subs: [
      { id: 'muebles-sala', name: 'Sala' },
      { id: 'muebles-recamara', name: 'Recámara' },
      { id: 'muebles-cocina', name: 'Cocina' },
      { id: 'muebles-decoracion', name: 'Decoración' },
    ]},
  { id: 'cursos', name: 'Cursos y Educación', emoji: '📚',
    subs: [
      { id: 'cursos-particulares', name: 'Clases particulares' },
      { id: 'cursos-online', name: 'Cursos online' },
      { id: 'cursos-talleres', name: 'Talleres presenciales' },
    ]},
  { id: 'eventos', name: 'Eventos y Entretenimiento', emoji: '🎉',
    subs: [
      { id: 'eventos-boletos', name: 'Boletos' },
      { id: 'eventos-locales', name: 'Eventos locales' },
      { id: 'eventos-fiestas', name: 'Fiestas / servicios para eventos' },
    ]},
  { id: 'salud', name: 'Salud y Belleza', emoji: '💆',
    subs: [
      { id: 'salud-esteticos', name: 'Servicios estéticos' },
      { id: 'salud-cuidado', name: 'Productos de cuidado personal' },
      { id: 'salud-nutricion', name: 'Nutrición / fitness' },
    ]},
  { id: 'deportes', name: 'Deportes y Fitness', emoji: '⚽',
    subs: [
      { id: 'deportes-equipo', name: 'Equipo deportivo' },
      { id: 'deportes-bicicletas', name: 'Bicicletas' },
      { id: 'deportes-gimnasio', name: 'Gimnasio en casa' },
    ]},
  { id: 'negocios', name: 'Negocios y Equipamiento Comercial', emoji: '🏪',
    subs: [
      { id: 'negocios-maquinaria', name: 'Maquinaria' },
      { id: 'negocios-restaurantes', name: 'Equipo para restaurantes' },
      { id: 'negocios-mobiliario', name: 'Mobiliario comercial' },
    ]},
  { id: 'agricultura', name: 'Agricultura y Herramientas', emoji: '🔧',
    subs: [
      { id: 'agricultura-herramientas', name: 'Herramientas' },
      { id: 'agricultura-maquinaria', name: 'Maquinaria ligera' },
      { id: 'agricultura-insumos', name: 'Insumos' },
    ]},
  { id: 'trueque', name: 'Trueque / Intercambios', emoji: '🔄',
    subs: [
      { id: 'trueque-cambios', name: 'Cambios sin dinero' },
    ]},
  { id: 'gratis', name: 'Gratis / Donaciones', emoji: '🎁',
    subs: [
      { id: 'gratis-cosas', name: 'Cosas que la gente regala' },
    ]},
  { id: 'comunidad', name: 'Comunidad', emoji: '🤝',
    subs: [
      { id: 'comunidad-roommates', name: 'Búsqueda de roommates' },
      { id: 'comunidad-grupos', name: 'Grupos / actividades' },
      { id: 'comunidad-mascotas', name: 'Mascotas en adopción' },
    ]},
];

function getCategoryById(id) {
  // Check top-level
  const main = CATEGORIES.find(c => c.id === id);
  if (main) return main;
  // Check subcategories
  for (const cat of CATEGORIES) {
    const sub = cat.subs.find(s => s.id === id);
    if (sub) return { ...sub, emoji: cat.emoji, parentId: cat.id, parentName: cat.name };
  }
  return CATEGORIES[CATEGORIES.length - 1];
}

/** Get parent category for a subcategory id */
function getParentCategory(subId) {
  for (const cat of CATEGORIES) {
    if (cat.id === subId) return cat;
    if (cat.subs.some(s => s.id === subId)) return cat;
  }
  return null;
}

/* ---- Normalize ad from API (DB columns → frontend format) ---- */
function normalizeAd(ad) {
  return {
    id: ad.public_id || ad.id,
    title: ad.title,
    description: ad.description,
    category: ad.category,
    price: Number(ad.price) || 0,
    location: ad.location,
    type: ad.type || 'free',
    status: ad.status || 'active',
    images: typeof ad.images === 'string' ? JSON.parse(ad.images) : (ad.images || []),
    contact: typeof ad.contact === 'string' ? JSON.parse(ad.contact) : (ad.contact || {}),
    featured: ad.featured || false,
    expiresAt: ad.expires_at ? new Date(ad.expires_at).getTime() : null,
    renewalCount: ad.renewal_count || 0,
    maxRenewals: ad.max_renewals != null ? ad.max_renewals : (ad.type === 'premium' ? 999999 : FREE_MAX_RENEWALS),
    suspended: ad.status === 'suspended',
    createdAt: ad.created_at ? new Date(ad.created_at).getTime() : Date.now(),
    ownerEmail: ad.owner_email || '',
    _dbId: ad.id, // internal DB id
  };
}

/* ---- Store (API-backed with local cache) ---- */
const Store = {
  _ads: [],
  _initialized: false,

  async init() {
    if (this._initialized) return;
    try {
      const data = await apiRequest('/api/ads?limit=200');
      if (data.success && data.ads) {
        this._ads = data.ads.map(normalizeAd);
      } else {
        // Fallback to demo data if API unavailable
        this._ads = (typeof DEMO_ADS !== 'undefined') ? DEMO_ADS.map(a => ({ ...a })) : [];
      }
    } catch (e) {
      console.warn('API unavailable, using fallback data', e);
      this._ads = (typeof DEMO_ADS !== 'undefined') ? DEMO_ADS.map(a => ({ ...a })) : [];
    }
    this._initialized = true;
  },

  /** Refresh data from API */
  async refresh() {
    try {
      const data = await apiRequest('/api/ads?limit=200');
      if (data.success && data.ads) {
        this._ads = data.ads.map(normalizeAd);
      }
    } catch (e) {
      console.warn('Refresh failed', e);
    }
  },

  getAll(includeExpired = false) {
    let ads = [...this._ads];
    if (!includeExpired) {
      ads = ads.filter(a => !a.suspended && a.status !== 'suspended');
    }
    return ads.sort((a, b) => {
      if (a.type === 'premium' && b.type !== 'premium') return -1;
      if (b.type === 'premium' && a.type !== 'premium') return 1;
      return b.createdAt - a.createdAt;
    });
  },

  getById(id) {
    return this._ads.find(a => a.id === id) || null;
  },

  getByCategory(catId) {
    // If it's a parent category, match all its subcategories too
    const parent = CATEGORIES.find(c => c.id === catId);
    if (parent) {
      const subIds = parent.subs.map(s => s.id);
      return this.getAll().filter(a => a.category === catId || subIds.includes(a.category));
    }
    return this.getAll().filter(a => a.category === catId);
  },

  getFeatured() {
    return this._ads.filter(a => a.type === 'premium' && !a.suspended).sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
  },

  getRecent(limit = 8) {
    return this.getAll().slice(0, limit);
  },

  search(query, filters = {}) {
    let results = this.getAll();
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        getCategoryById(a.category).name.toLowerCase().includes(q)
      );
    }
    if (filters.category) {
      results = results.filter(a => a.category === filters.category);
    }
    if (filters.type) {
      results = results.filter(a => a.type === filters.type);
    }
    if (filters.minPrice != null) {
      results = results.filter(a => a.price >= filters.minPrice);
    }
    if (filters.maxPrice != null) {
      results = results.filter(a => a.price <= filters.maxPrice);
    }
    if (filters.sort === 'price-asc') {
      results.sort((a, b) => a.price - b.price);
    } else if (filters.sort === 'price-desc') {
      results.sort((a, b) => b.price - a.price);
    } else if (filters.sort === 'oldest') {
      results.sort((a, b) => a.createdAt - b.createdAt);
    }
    return results;
  },

  /** Create ad via API */
  async add(ad) {
    const data = await apiRequest('/api/ads', {
      method: 'POST',
      body: JSON.stringify(ad),
    });

    if (data.success && data.ad) {
      const normalized = normalizeAd(data.ad);
      this._ads.unshift(normalized);
      return normalized;
    }
    throw new Error(data.message || 'Error al crear anuncio');
  },

  /** Delete ad via API */
  async delete(id) {
    const data = await apiRequest('/api/ads/' + id, { method: 'DELETE' });
    if (data.success) {
      this._ads = this._ads.filter(a => a.id !== id);
    }
    return data;
  },

  getCountByCategory(catId) {
    return this._ads.filter(a => a.category === catId && !a.suspended).length;
  },

  getTotalCount() {
    return this._ads.filter(a => !a.suspended).length;
  },

  /** Get my ads via API */
  async fetchMyAds() {
    try {
      const data = await apiRequest('/api/ads/my');
      if (data.success && data.ads) {
        return data.ads.map(normalizeAd);
      }
    } catch (e) {
      console.warn('Failed to fetch my ads', e);
    }
    return [];
  },

  getMyAds() {
    // Synchronous read from cache — filtered by current user email
    const email = AuthStore.isLoggedIn() ? AuthStore.getCurrentEmail() : null;
    if (!email) return [];
    return this._ads.filter(a => a.ownerEmail === email);
  },

  isMyAd(id) {
    const ad = this.getById(id);
    const email = AuthStore.isLoggedIn() ? AuthStore.getCurrentEmail() : null;
    return email && ad && ad.ownerEmail === email;
  },

  /* ---- Vigencia helpers (client-side, same logic) ---- */

  getRemainingDays(ad) {
    if (!ad || !ad.expiresAt) return 0;
    const remaining = ad.expiresAt - Date.now();
    return Math.max(0, Math.ceil(remaining / DAY_MS));
  },

  canRenew(ad) {
    if (!ad) return false;
    const maxR = ad.maxRenewals != null ? ad.maxRenewals : (ad.type === 'premium' ? Infinity : FREE_MAX_RENEWALS);
    if (maxR >= 999999) return true;
    return (ad.renewalCount || 0) < maxR;
  },

  getRemainingRenewals(ad) {
    if (!ad) return 0;
    const maxR = ad.maxRenewals != null ? ad.maxRenewals : (ad.type === 'premium' ? Infinity : FREE_MAX_RENEWALS);
    if (maxR >= 999999) return Infinity;
    return Math.max(0, maxR - (ad.renewalCount || 0));
  },

  /** Renew ad via API */
  async renewAd(id) {
    const data = await apiRequest('/api/ads/' + id + '/renew', { method: 'POST' });
    if (data.success) {
      // Refresh cache to get updated expiration
      await this.refresh();
    }
    return data;
  },

  getVigenciaStatus(ad) {
    if (!ad) return { status: 'unknown', label: 'Desconocido', cssClass: '' };

    if (ad.suspended) {
      return { status: 'suspended', label: 'Suspendido', cssClass: 'status-suspended' };
    }

    const days = this.getRemainingDays(ad);
    if (days <= 3) {
      return { status: 'expiring', label: `Vence en ${days} día${days !== 1 ? 's' : ''}`, cssClass: 'status-expiring' };
    }

    return { status: 'active', label: `${days} días restantes`, cssClass: 'status-active' };
  },
};

/* ---- Chat Store (stays localStorage for now) ---- */
const CHAT_STORAGE_KEY = 'clasificados_mx_chats';

const ChatStore = {
  _chats: [],
  _initialized: false,

  init() {
    if (this._initialized) return;
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      try { this._chats = JSON.parse(saved); } catch { this._chats = []; }
    }
    this._initialized = true;
  },

  _save() {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(this._chats));
  },

  // Get or create a conversation for an ad
  getOrCreateChat(adId) {
    let chat = this._chats.find(c => c.adId === adId);
    if (!chat) {
      chat = {
        id: 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        adId: adId,
        messages: [],
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      this._chats.push(chat);
      this._save();
    }
    return chat;
  },

  getChatByAdId(adId) {
    return this._chats.find(c => c.adId === adId) || null;
  },

  getAllChats() {
    return [...this._chats].sort((a, b) => b.lastActivity - a.lastActivity);
  },

  sendMessage(adId, text, sender = 'buyer') {
    const chat = this.getOrCreateChat(adId);
    const message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      text: text,
      sender: sender, // 'buyer' or 'seller'
      timestamp: Date.now(),
      read: false,
    };
    chat.messages.push(message);
    chat.lastActivity = Date.now();
    this._save();
    return message;
  },

  getMessages(adId) {
    const chat = this.getChatByAdId(adId);
    return chat ? chat.messages : [];
  },

  getUnreadCount(adId, role) {
    const chat = this.getChatByAdId(adId);
    if (!chat) return 0;
    const otherRole = role === 'buyer' ? 'seller' : 'buyer';
    return chat.messages.filter(m => m.sender === otherRole && !m.read).length;
  },

  getTotalUnread() {
    let count = 0;
    this._chats.forEach(chat => {
      count += chat.messages.filter(m => !m.read).length;
    });
    return count;
  },

  markAsRead(adId, role) {
    const chat = this.getChatByAdId(adId);
    if (!chat) return;
    const otherRole = role === 'buyer' ? 'seller' : 'buyer';
    chat.messages.forEach(m => {
      if (m.sender === otherRole) m.read = true;
    });
    this._save();
  },

  getChatCount() {
    return this._chats.length;
  },
};
