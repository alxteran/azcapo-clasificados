/**
 * Seed 20 example ads into the database.
 * Usage: node lib/seed-20-ads.js
 */

const fs = require('fs'), path = require('path');
['.env.local', '.env.production', '.env.secret.tmp'].forEach(f => {
  const p = path.join(__dirname, '..', f);
  if (fs.existsSync(p)) {
    fs.readFileSync(p, 'utf-8').split('\n').forEach(l => {
      const [k, ...v] = l.split('=');
      if (k && v.length && !process.env[k.trim()]) {
        let val = v.join('=').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        process.env[k.trim()] = val;
      }
    });
  }
});

const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

const FREE_DAYS = 30;

const ADS = [
  {
    title: 'Monitor 15 pulgadas Acer',
    description: 'Monitor 15 pulgadas Acer en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Cuauhtémoc, CDMX.\n\nEtiquetas: Electrónicos, CDMX, venta, segunda mano, oportunidad',
    category: 'electronica-tv',
    price: 200,
    location: 'Cuauhtémoc, CDMX',
    latitude: 19.4326,
    longitude: -99.1332,
    daysAgo: 0.5,
  },
  {
    title: 'BOTIN SUELA DE CUERO',
    description: 'BOTIN SUELA DE CUERO en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Cuauhtémoc, CDMX.\n\nEtiquetas: Moda, CDMX, venta, segunda mano, oportunidad',
    category: 'moda-calzado',
    price: 1,
    location: 'Cuauhtémoc, CDMX',
    latitude: 19.4326,
    longitude: -99.1332,
    daysAgo: 1,
  },
  {
    title: 'Xbox One',
    description: 'Xbox One en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Benito Juárez, CDMX.\n\nEtiquetas: Videojuegos, CDMX, venta, segunda mano, oportunidad',
    category: 'electronica-gaming',
    price: 500,
    location: 'Benito Juárez, CDMX',
    latitude: 19.3718,
    longitude: -99.1568,
    daysAgo: 1.5,
  },
  {
    title: 'Minicomponente Sony',
    description: 'Minicomponente Sony en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Cuauhtémoc, CDMX.\n\nEtiquetas: Audio, CDMX, venta, segunda mano, oportunidad',
    category: 'electronica-audio',
    price: 600,
    location: 'Cuauhtémoc, CDMX',
    latitude: 19.4326,
    longitude: -99.1332,
    daysAgo: 2,
  },
  {
    title: 'Laptop 8Gb RAM 500Gb Disco HDMI',
    description: 'Laptop 8Gb RAM 500Gb Disco HDMI en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Cuauhtémoc, CDMX.\n\nEtiquetas: Computación, CDMX, venta, segunda mano, oportunidad',
    category: 'computo-laptops',
    price: 1100,
    location: 'Cuauhtémoc, CDMX',
    latitude: 19.4326,
    longitude: -99.1332,
    daysAgo: 0.8,
  },
  {
    title: 'Piano enrollable 49 teclas',
    description: 'Piano enrollable 49 teclas en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Cuauhtémoc, CDMX.\n\nEtiquetas: Instrumentos Musicales, CDMX, venta, segunda mano, oportunidad',
    category: 'electronica-audio',
    price: 600,
    location: 'Cuauhtémoc, CDMX',
    latitude: 19.4326,
    longitude: -99.1332,
    daysAgo: 3,
  },
  {
    title: 'Monedas del mundial 2026',
    description: 'Monedas del mundial 2026 en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Cuauhtémoc, CDMX.\n\nEtiquetas: Coleccionables, CDMX, venta, segunda mano, oportunidad',
    category: 'trueque-cambios',
    price: 200,
    location: 'Cuauhtémoc, CDMX',
    latitude: 19.4326,
    longitude: -99.1332,
    daysAgo: 1.2,
  },
  {
    title: 'Piano de cola vintage',
    description: 'Piano de cola vintage en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Cuauhtémoc, CDMX.\n\nEtiquetas: Instrumentos Musicales, CDMX, venta, segunda mano, oportunidad',
    category: 'electronica-audio',
    price: 1,
    location: 'Cuauhtémoc, CDMX',
    latitude: 19.4326,
    longitude: -99.1332,
    daysAgo: 2.5,
  },
  {
    title: 'Estufa industrial de 2 quemadores',
    description: 'Estufa industrial de 2 quemadores en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Cuauhtémoc, CDMX.\n\nEtiquetas: Hogar, CDMX, venta, segunda mano, oportunidad',
    category: 'muebles-cocina',
    price: 0,
    location: 'Cuauhtémoc, CDMX',
    latitude: 19.4326,
    longitude: -99.1332,
    daysAgo: 4,
  },
  {
    title: 'Mezcladora Profesional 8 Canales',
    description: 'Mezcladora Profesional 8 Canales en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Cuauhtémoc, CDMX.\n\nEtiquetas: Audio Profesional, CDMX, venta, segunda mano, oportunidad',
    category: 'electronica-audio',
    price: 1250,
    location: 'Cuauhtémoc, CDMX',
    latitude: 19.4326,
    longitude: -99.1332,
    daysAgo: 1.8,
  },
  {
    title: 'Relojes Swatch',
    description: 'Relojes Swatch en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Cuauhtémoc, CDMX.\n\nEtiquetas: Accesorios, CDMX, venta, segunda mano, oportunidad',
    category: 'moda-bolsas',
    price: 250,
    location: 'Cuauhtémoc, CDMX',
    latitude: 19.4326,
    longitude: -99.1332,
    daysAgo: 2.2,
  },
  {
    title: 'Volkswagen Vento 2018',
    description: 'Volkswagen Vento 2018 en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Venustiano Carranza, CDMX.\n\nEtiquetas: Vehículos, CDMX, venta, segunda mano, oportunidad',
    category: 'vehiculos-autos',
    price: 0,
    location: 'Venustiano Carranza, CDMX',
    latitude: 19.4195,
    longitude: -99.1068,
    daysAgo: 0.3,
  },
  {
    title: 'PS2',
    description: 'PS2 en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Cuauhtémoc, CDMX.\n\nEtiquetas: Videojuegos, CDMX, venta, segunda mano, oportunidad',
    category: 'electronica-gaming',
    price: 500,
    location: 'Cuauhtémoc, CDMX',
    latitude: 19.4326,
    longitude: -99.1332,
    daysAgo: 3.5,
  },
  {
    title: 'Radio vintage retro Bluetooth',
    description: 'Radio vintage retro Bluetooth en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Benito Juárez, CDMX.\n\nEtiquetas: Electrónicos, CDMX, venta, segunda mano, oportunidad',
    category: 'electronica-gadgets',
    price: 300,
    location: 'Benito Juárez, CDMX',
    latitude: 19.3718,
    longitude: -99.1568,
    daysAgo: 1.3,
  },
  {
    title: 'Lava secadora Samsung',
    description: 'Lava secadora Samsung en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Cuauhtémoc, CDMX.\n\nEtiquetas: Electrodomésticos, CDMX, venta, segunda mano, oportunidad',
    category: 'muebles-cocina',
    price: 0,
    location: 'Cuauhtémoc, CDMX',
    latitude: 19.4326,
    longitude: -99.1332,
    daysAgo: 5,
  },
  {
    title: 'Estéreo SONY Genezi',
    description: 'Estéreo SONY Genezi en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Cuauhtémoc, CDMX.\n\nEtiquetas: Audio, CDMX, venta, segunda mano, oportunidad',
    category: 'electronica-audio',
    price: 650,
    location: 'Cuauhtémoc, CDMX',
    latitude: 19.4326,
    longitude: -99.1332,
    daysAgo: 2.8,
  },
  {
    title: 'Monedas conmemorativas del mundial',
    description: 'Monedas conmemorativas del mundial en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Cuauhtémoc, CDMX.\n\nEtiquetas: Coleccionables, CDMX, venta, segunda mano, oportunidad',
    category: 'trueque-cambios',
    price: 200,
    location: 'Cuauhtémoc, CDMX',
    latitude: 19.4326,
    longitude: -99.1332,
    daysAgo: 4.5,
  },
  {
    title: 'Laptop ASUS Vivobook',
    description: 'Laptop ASUS Vivobook en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Iztapalapa, CDMX.\n\nEtiquetas: Computación, CDMX, venta, segunda mano, oportunidad',
    category: 'computo-laptops',
    price: 0,
    location: 'Iztapalapa, CDMX',
    latitude: 19.3553,
    longitude: -99.0728,
    daysAgo: 0.6,
  },
  {
    title: 'Bota de lluvia',
    description: 'Bota de lluvia en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Cuauhtémoc, CDMX.\n\nEtiquetas: Moda, CDMX, venta, segunda mano, oportunidad',
    category: 'moda-calzado',
    price: 1,
    location: 'Cuauhtémoc, CDMX',
    latitude: 19.4326,
    longitude: -99.1332,
    daysAgo: 6,
  },
  {
    title: 'Botas Caterpillar originales',
    description: 'Botas Caterpillar originales en buenas condiciones. Publicación de ejemplo para poblar AzcapoClasificados. Disponible para entrega en Venustiano Carranza, CDMX.\n\nEtiquetas: Moda, CDMX, venta, segunda mano, oportunidad',
    category: 'moda-calzado',
    price: 0,
    location: 'Venustiano Carranza, CDMX',
    latitude: 19.4195,
    longitude: -99.1068,
    daysAgo: 3.2,
  },
];

async function seed() {
  console.log('🌱 Seeding 20 example ads...\n');

  let count = 0;
  for (const ad of ADS) {
    const publicId = 'seed_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
    const createdAt = new Date(Date.now() - ad.daysAgo * 86400000).toISOString();
    const expiresAt = new Date(Date.now() + (FREE_DAYS - ad.daysAgo) * 86400000).toISOString();
    const contact = JSON.stringify({ name: 'AzcapoClasificados', phone: '', email: 'ejemplo@azcapo.mx' });

    await sql`
      INSERT INTO ads (public_id, owner_id, title, description, category, price, location, type, status, images, contact, featured, expires_at, renewal_count, max_renewals, latitude, longitude, created_at)
      VALUES (
        ${publicId}, NULL, ${ad.title}, ${ad.description}, ${ad.category},
        ${ad.price}, ${ad.location}, ${'free'}, ${'active'},
        ${JSON.stringify([])}, ${contact},
        ${false}, ${expiresAt}, ${0}, ${3},
        ${ad.latitude}, ${ad.longitude}, ${createdAt}
      )
    `;

    count++;
    console.log(`  ✅ [${count}/20] ${ad.title} → ${ad.category} (${ad.location})`);
  }

  console.log(`\n🎉 Done! ${count} ads inserted successfully.`);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
