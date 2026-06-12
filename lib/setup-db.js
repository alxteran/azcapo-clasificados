/**
 * Setup script — Run once to create tables and seed demo data.
 * Usage: node lib/setup-db.js
 *
 * Requires DATABASE_URL environment variable. Set it in .env.local or export it:
 *   export DATABASE_URL="postgresql://..."
 *   node lib/setup-db.js
 */

// Load .env.local for local development
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
}

const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

const DEMO_ADS = [
  { category: 'empleo-ofertas', type: 'premium', title: 'Vendedor de mostrador — Tiempo completo', description: 'Se solicita vendedor de mostrador con experiencia mínima de 1 año. Horario de lunes a sábado. Sueldo base + comisiones.', price: 8000, location: 'Azcapotzalco, CDMX', contact: { name: 'Refacciones del Norte', phone: '55 1234 5678', email: 'rh@refnorte.mx' }, daysAgo: 1 },
  { category: 'empleo-oficios', type: 'free', title: 'Plomero profesional — Servicio a domicilio', description: 'Plomero con 15 años de experiencia. Destape de drenajes, reparación de fugas, instalación de tinacos. Trabajo garantizado.', price: 0, location: 'Azcapotzalco, CDMX', contact: { name: 'Don Manuel', phone: '55 9876 5432', email: '' }, daysAgo: 2 },
  { category: 'empleo-profesionales', type: 'premium', title: 'Diseño gráfico y community manager freelance', description: 'Diseño de logotipos, flyers, menús, redes sociales. Paquetes desde $3,000/mes.', price: 3000, location: 'CDMX, Remoto', contact: { name: 'Ana Sofía Torres', phone: '55 5555 1234', email: 'ana.torres@email.com' }, daysAgo: 0.5 },
  { category: 'moda-calzado', type: 'free', title: 'Tenis Nike Air Max 90 — Talla 27', description: 'Tenis Nike Air Max 90 originales, poco uso, con caja original.', price: 1200, location: 'Azcapotzalco, CDMX', contact: { name: 'Carlos Vega', phone: '55 4444 8888', email: '' }, daysAgo: 1.5 },
  { category: 'moda-bolsas', type: 'premium', title: 'Bolsa Michael Kors original — Como nueva', description: 'Bolsa Michael Kors modelo Jet Set, 100% original con certificado.', price: 3500, location: 'CDMX, Polanco', contact: { name: 'Martha Ramírez', phone: '55 3333 2211', email: '' }, daysAgo: 3 },
  { category: 'celulares-smartphones', type: 'premium', title: 'iPhone 15 Pro Max 256GB — Libre de fábrica', description: 'iPhone 15 Pro Max, Titanio Natural, 256GB, batería al 98%. Con caja y cargador.', price: 22000, location: 'Azcapotzalco, CDMX', contact: { name: 'Andrés López', phone: '55 6666 2222', email: 'andres.l@email.com' }, daysAgo: 0.7 },
  { category: 'celulares-tablets', type: 'premium', title: 'iPad Pro M2 12.9" + Apple Pencil 2 + Magic Keyboard', description: 'iPad Pro 12.9" chip M2, 256GB, WiFi + Cellular. Ideal para diseño.', price: 19500, location: 'Monterrey, San Nicolás', contact: { name: 'Carolina Díaz', phone: '81 7777 3333', email: 'caro.diaz@email.com' }, daysAgo: 0.3 },
  { category: 'muebles-sala', type: 'free', title: 'Juego de sala moderno — 3 piezas', description: 'Sala moderna de 3 piezas, tapizado en tela gris Oxford. Excelente estado.', price: 7500, location: 'Azcapotzalco, CDMX', contact: { name: 'Familia González', phone: '55 2222 8888', email: '' }, daysAgo: 4 },
  { category: 'muebles-cocina', type: 'free', title: 'Refrigerador Samsung 2 puertas — Como nuevo', description: 'Refrigerador Samsung French Door, 25 pies, dispensador de agua y hielo.', price: 12500, location: 'CDMX, Coyoacán', contact: { name: 'Patricia Flores', phone: '55 7777 3333', email: '' }, daysAgo: 4 },
  { category: 'cursos-particulares', type: 'free', title: 'Clases de matemáticas y física — Nivel preparatoria', description: 'Profesor con 10 años de experiencia. Clases a domicilio o en línea.', price: 200, location: 'Azcapotzalco, CDMX', contact: { name: 'Prof. Héctor Morales', phone: '55 1111 4444', email: '' }, daysAgo: 6 },
  { category: 'eventos-boletos', type: 'premium', title: '2 Boletos — Concierto Peso Pluma — Foro Sol', description: 'Vendo 2 boletos zona VIP, fila 10. Boletos digitales transferibles.', price: 4500, location: 'CDMX', contact: { name: 'Miguel Ángel Ríos', phone: '55 2222 6666', email: 'miguelrios@email.com' }, daysAgo: 1 },
  { category: 'eventos-fiestas', type: 'free', title: 'Renta de brincolines y mobiliario para fiestas', description: 'Renta de brincolines, mesas, sillas, manteles. Montaje y desmontaje incluido.', price: 1500, location: 'Azcapotzalco, CDMX', contact: { name: 'Fiestas Mágicas', phone: '55 8888 5555', email: '' }, daysAgo: 2 },
  { category: 'salud-esteticos', type: 'premium', title: 'Estética unisex — Cortes, tintes y tratamientos', description: 'Cortes desde $80, tintes desde $350, keratina brasileña $800.', price: 80, location: 'Azcapotzalco, CDMX', contact: { name: 'Estética Glamour', phone: '55 3333 9999', email: '' }, daysAgo: 2 },
  { category: 'deportes-bicicletas', type: 'free', title: 'Bicicleta Specialized Rockhopper R29', description: 'Cuadro aluminio talla M, frenos disco hidráulicos, suspensión RockShox.', price: 8900, location: 'CDMX, Xochimilco', contact: { name: 'Daniel Ortiz', phone: '55 2222 8888', email: '' }, daysAgo: 4 },
  { category: 'deportes-gimnasio', type: 'premium', title: 'Gym en casa — Multifuncional + banca + discos', description: 'Estación multifuncional Body Solid, banca ajustable, 80kg en discos.', price: 12000, location: 'Azcapotzalco, CDMX', contact: { name: 'Ricardo Peña', phone: '55 4444 2222', email: 'ricardo.p@email.com' }, daysAgo: 2 },
  { category: 'negocios-restaurantes', type: 'free', title: 'Estufa industrial 6 quemadores + plancha', description: 'Estufa industrial acero inoxidable. Ideal para fonda, taquería o restaurante.', price: 8500, location: 'Azcapotzalco, CDMX', contact: { name: 'TechSoluciones', phone: '55 4444 8888', email: 'ventas@techsol.mx' }, daysAgo: 3 },
  { category: 'agricultura-herramientas', type: 'free', title: 'Rotomartillo Bosch + set de brocas profesional', description: 'Rotomartillo Bosch GBH 2-26, 800W, con maletín y set de 15 brocas.', price: 2800, location: 'CDMX, Azcapotzalco', contact: { name: 'Sergio Lara', phone: '55 4444 2222', email: '' }, daysAgo: 5 },
  { category: 'trueque-cambios', type: 'free', title: 'Cambio PS5 por laptop gamer — Solo CDMX', description: 'Ofrezco PS5 con 2 controles y 5 juegos. Busco laptop gamer RTX 3060+.', price: 0, location: 'Azcapotzalco, CDMX', contact: { name: 'Emilio Vargas', phone: '55 6666 8888', email: '' }, daysAgo: 5 },
  { category: 'gratis-cosas', type: 'free', title: 'Regalo ropa de bebé — Tallas 0-12 meses', description: 'Lote de ropa de bebé en buen estado. Pasar a recoger.', price: 0, location: 'Azcapotzalco, CDMX', contact: { name: 'Gabriela Santos', phone: '55 888 3344', email: '' }, daysAgo: 3 },
  { category: 'comunidad-roommates', type: 'free', title: 'Busco roommate — Depa en Azcapotzalco centro', description: 'Depa de 2 recámaras. Renta $3,500 por persona, incluye servicios.', price: 3500, location: 'Azcapotzalco, CDMX', contact: { name: 'Laura Martínez', phone: '55 7777 2222', email: '' }, daysAgo: 4 },
  { category: 'comunidad-mascotas', type: 'premium', title: 'Cachorros en adopción — Criollos vacunados', description: '3 cachorros criollos (2 meses) en adopción responsable. Con cartilla.', price: 0, location: 'Azcapotzalco, CDMX', contact: { name: 'Asociación Patitas', phone: '55 5555 1111', email: 'patitas@email.com' }, daysAgo: 1 },
];

async function setup() {
  console.log('🔧 Creating tables...');

  await sql`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS ads (
    id SERIAL PRIMARY KEY,
    public_id VARCHAR(60) UNIQUE NOT NULL,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(60) NOT NULL,
    price NUMERIC(12,2) DEFAULT 0,
    location VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'free',
    status VARCHAR(20) DEFAULT 'active',
    images JSONB DEFAULT '[]',
    contact JSONB DEFAULT '{}',
    featured BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    renewal_count INTEGER DEFAULT 0,
    max_renewals INTEGER DEFAULT 3,
    latitude DOUBLE PRECISION DEFAULT NULL,
    longitude DOUBLE PRECISION DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    ad_public_id VARCHAR(60),
    mp_preference_id VARCHAR(255),
    mp_payment_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    amount NUMERIC(12,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB DEFAULT '[]',
    updated_at TIMESTAMP DEFAULT NOW()
  )`;

  // ── v2.0 migrations ──
  // Boost columns en ads
  await sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS boost_level VARCHAR(20) DEFAULT NULL`;
  await sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMP DEFAULT NULL`;

  // Tabla stores
  await sql`CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    whatsapp VARCHAR(30) DEFAULT '',
    plan VARCHAR(20) DEFAULT 'basic',
    status VARCHAR(20) DEFAULT 'active',
    plan_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`;

  // Tabla reviews
  await sql`CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ad_public_id VARCHAR(60),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  console.log('✅ Tables created');

  // Check if demo ads already exist
  const existing = await sql`SELECT COUNT(*) as count FROM ads`;
  if (Number(existing[0].count) > 0) {
    console.log(`ℹ️  Database already has ${existing[0].count} ads. Skipping seed.`);
    return;
  }

  console.log('🌱 Seeding demo ads...');
  const FREE_DAYS = 30;
  const PREMIUM_DAYS = 30;

  for (const demo of DEMO_ADS) {
    const isPremium = demo.type === 'premium';
    const vigenciaDays = isPremium ? PREMIUM_DAYS : FREE_DAYS;
    const publicId = 'demo_' + Math.random().toString(36).slice(2, 9);
    const createdAt = new Date(Date.now() - demo.daysAgo * 86400000).toISOString();
    const expiresAt = new Date(Date.now() + (vigenciaDays - demo.daysAgo) * 86400000).toISOString();

    await sql`
      INSERT INTO ads (public_id, owner_id, title, description, category, price, location, type, status, images, contact, featured, expires_at, renewal_count, max_renewals, created_at)
      VALUES (
        ${publicId}, NULL, ${demo.title}, ${demo.description}, ${demo.category},
        ${demo.price}, ${demo.location}, ${demo.type}, 'active',
        ${JSON.stringify([])}, ${JSON.stringify(demo.contact)},
        ${isPremium}, ${expiresAt}, ${0}, ${isPremium ? 999999 : 3}, ${createdAt}
      )
    `;
  }

  console.log(`✅ Seeded ${DEMO_ADS.length} demo ads`);
  console.log('🎉 Setup complete!');
}

setup().catch(err => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
