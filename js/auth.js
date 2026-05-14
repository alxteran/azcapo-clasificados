/* ============================================
   AZCAPO CLASIFICADOS — Auth (API-backed)
   ============================================ */

const TOKEN_KEY = 'clasificados_mx_token';

/* ---- Captcha Generator (client-side, reCAPTCHA later) ---- */
const CaptchaManager = {
  _currentCode: '',

  generate() {
    this._currentCode = String(Math.floor(1000 + Math.random() * 9000));
    return this._currentCode;
  },

  getCode() {
    return this._currentCode;
  },

  verify(input) {
    return input === this._currentCode;
  },

  /** Draws the CAPTCHA onto a canvas element */
  drawToCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Background with noise
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, w, h);

    // Draw noise lines
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.strokeStyle = `hsl(${Math.random() * 360}, 40%, 75%)`;
      ctx.lineWidth = 1;
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.lineTo(Math.random() * w, Math.random() * h);
      ctx.stroke();
    }

    // Draw noise dots
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.fillStyle = `hsl(${Math.random() * 360}, 40%, 70%)`;
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 2 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw each digit with individual rotation and position
    const code = this._currentCode;
    const fontSize = 32;
    ctx.font = `bold ${fontSize}px 'Outfit', sans-serif`;
    ctx.textBaseline = 'middle';

    const startX = 20;
    const spacing = (w - 40) / code.length;

    for (let i = 0; i < code.length; i++) {
      ctx.save();
      const x = startX + spacing * i + spacing / 2;
      const y = h / 2 + (Math.random() * 8 - 4);
      const angle = (Math.random() * 30 - 15) * (Math.PI / 180);

      ctx.translate(x, y);
      ctx.rotate(angle);

      // Character color — dark shades of red/orange/gray
      const colors = ['#c62828', '#d84315', '#333333', '#bf360c', '#4e342e'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillText(code[i], -fontSize / 4, 0);
      ctx.restore();
    }

    // Add subtle crosshatch overlay
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < w; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.stroke();
    }
  }
};

/* ---- API Helper ---- */
async function apiRequest(url, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  return data;
}

/* ---- Auth Store (API-backed) ---- */
const AuthStore = {
  _token: null,
  _user: null,
  _initialized: false,

  init() {
    if (this._initialized) return;
    this._token = localStorage.getItem(TOKEN_KEY);
    if (this._token) {
      try {
        const payload = JSON.parse(atob(this._token.split('.')[1]));
        // Check expiration
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          this._token = null;
          this._user = null;
          localStorage.removeItem(TOKEN_KEY);
        } else {
          this._user = { id: payload.userId, email: payload.email };
        }
      } catch {
        this._token = null;
        this._user = null;
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    this._initialized = true;
  },

  _setSession(token, user) {
    this._token = token;
    this._user = user;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  /** Register a new user via API. Returns { success, message } */
  async register(email, password, captchaInput) {
    // Validate CAPTCHA client-side (reCAPTCHA will replace this later)
    if (!CaptchaManager.verify(captchaInput)) {
      return { success: false, message: 'El código CAPTCHA no coincide. Intenta de nuevo.' };
    }

    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.success && data.token) {
      this._setSession(data.token, data.user);
    }
    return data;
  },

  /** Login an existing user via API. Returns { success, message } */
  async login(email, password, captchaInput) {
    // Validate CAPTCHA client-side
    if (!CaptchaManager.verify(captchaInput)) {
      return { success: false, message: 'El código CAPTCHA no coincide. Intenta de nuevo.' };
    }

    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.success && data.token) {
      this._setSession(data.token, data.user);
    }
    return data;
  },

  /** Logout the current user */
  logout() {
    this._setSession(null, null);
  },

  /** Check if a user is logged in */
  isLoggedIn() {
    return this._token !== null && this._user !== null;
  },

  /** Get current session */
  getSession() {
    return this._user ? { userId: this._user.id, email: this._user.email } : null;
  },

  /** Get current user email */
  getCurrentEmail() {
    return this._user ? this._user.email : null;
  },

  /** Get JWT token for API calls */
  getToken() {
    return this._token;
  },
};
