/* ============================================
   CLASIFICADOS MX — Demo Data
   ============================================ */

const DEMO_ADS = [
  // Empleo y Servicios
  {
    id: 'demo_1', category: 'empleo-ofertas', type: 'premium',
    title: 'Vendedor de mostrador — Tiempo completo',
    description: 'Se solicita vendedor de mostrador con experiencia mínima de 1 año. Horario de lunes a sábado. Sueldo base + comisiones. Prestaciones de ley.',
    price: 8000, location: 'Azcapotzalco, CDMX',
    contact: { name: 'Refacciones del Norte', phone: '55 1234 5678', email: 'rh@refnorte.mx' },
    images: [], featured: true, createdAt: Date.now() - 86400000
  },
  {
    id: 'demo_2', category: 'empleo-oficios', type: 'free',
    title: 'Plomero profesional — Servicio a domicilio',
    description: 'Plomero con 15 años de experiencia. Destape de drenajes, reparación de fugas, instalación de tinacos y calentadores. Trabajo garantizado.',
    price: 0, location: 'Azcapotzalco, CDMX',
    contact: { name: 'Don Manuel', phone: '55 9876 5432', email: '' },
    images: [], featured: false, createdAt: Date.now() - 172800000
  },
  {
    id: 'demo_3', category: 'empleo-profesionales', type: 'premium',
    title: 'Diseño gráfico y community manager freelance',
    description: 'Diseño de logotipos, flyers, menús, redes sociales. Manejo de Instagram, Facebook y TikTok para tu negocio. Paquetes desde $3,000/mes.',
    price: 3000, location: 'CDMX, Remoto',
    contact: { name: 'Ana Sofía Torres', phone: '55 5555 1234', email: 'ana.torres@email.com' },
    images: [], featured: true, createdAt: Date.now() - 43200000
  },
  // Moda y Accesorios
  {
    id: 'demo_4', category: 'moda-calzado', type: 'free',
    title: 'Tenis Nike Air Max 90 — Talla 27',
    description: 'Tenis Nike Air Max 90 originales, talla 27, color blanco/negro. Poco uso, excelente estado. Con caja original.',
    price: 1200, location: 'Azcapotzalco, CDMX',
    contact: { name: 'Carlos Vega', phone: '55 4444 8888', email: '' },
    images: [], featured: false, createdAt: Date.now() - 129600000
  },
  {
    id: 'demo_5', category: 'moda-bolsas', type: 'premium',
    title: 'Bolsa Michael Kors original — Como nueva',
    description: 'Bolsa Michael Kors modelo Jet Set, color café con dorado. 100% original con certificado. Usada 3 veces. Incluye dustbag.',
    price: 3500, location: 'CDMX, Polanco',
    contact: { name: 'Martha Ramírez', phone: '55 3333 2211', email: '' },
    images: [], featured: true, createdAt: Date.now() - 259200000
  },
  // Celulares y Tablets
  {
    id: 'demo_6', category: 'celulares-smartphones', type: 'premium',
    title: 'iPhone 15 Pro Max 256GB — Libre de fábrica',
    description: 'iPhone 15 Pro Max, color Titanio Natural, 256GB, libre para cualquier compañía. Batería al 98%. Incluye caja, cargador y mica de cristal.',
    price: 22000, location: 'Azcapotzalco, CDMX',
    contact: { name: 'Andrés López', phone: '55 6666 2222', email: 'andres.l@email.com' },
    images: [], featured: true, createdAt: Date.now() - 60000000
  },
  {
    id: 'demo_7', category: 'celulares-tablets', type: 'premium',
    title: 'iPad Pro M2 12.9" + Apple Pencil 2 + Magic Keyboard',
    description: 'iPad Pro 12.9" con chip M2, 256GB, WiFi + Cellular, color Space Gray. Incluye Apple Pencil 2da gen y Magic Keyboard. Ideal para diseño.',
    price: 19500, location: 'Monterrey, San Nicolás',
    contact: { name: 'Carolina Díaz', phone: '81 7777 3333', email: 'caro.diaz@email.com' },
    images: [], featured: true, createdAt: Date.now() - 30000000
  },
  // Muebles y Hogar
  {
    id: 'demo_8', category: 'muebles-sala', type: 'free',
    title: 'Juego de sala moderno — 3 piezas',
    description: 'Sala moderna de 3 piezas (sofá 3 plazas, love seat y sillón individual), tapizado en tela gris Oxford. Muy cómoda y en excelente estado.',
    price: 7500, location: 'Azcapotzalco, CDMX',
    contact: { name: 'Familia González', phone: '55 2222 8888', email: '' },
    images: [], featured: false, createdAt: Date.now() - 380000000
  },
  {
    id: 'demo_9', category: 'muebles-cocina', type: 'free',
    title: 'Refrigerador Samsung 2 puertas — Como nuevo',
    description: 'Refrigerador Samsung French Door, 25 pies cúbicos, dispensador de agua y hielo, acabado acero inoxidable. 1 año de uso, con garantía vigente.',
    price: 12500, location: 'CDMX, Coyoacán',
    contact: { name: 'Patricia Flores', phone: '55 7777 3333', email: '' },
    images: [], featured: false, createdAt: Date.now() - 345600000
  },
  // Cursos y Educación
  {
    id: 'demo_10', category: 'cursos-particulares', type: 'free',
    title: 'Clases de matemáticas y física — Nivel preparatoria',
    description: 'Profesor con 10 años de experiencia. Clases a domicilio o en línea. Regularización, preparación para exámenes. Primera clase de prueba gratis.',
    price: 200, location: 'Azcapotzalco, CDMX',
    contact: { name: 'Prof. Héctor Morales', phone: '55 1111 4444', email: '' },
    images: [], featured: false, createdAt: Date.now() - 500000000
  },
  // Eventos y Entretenimiento
  {
    id: 'demo_11', category: 'eventos-boletos', type: 'premium',
    title: '2 Boletos — Concierto Peso Pluma — Foro Sol',
    description: 'Vendo 2 boletos para el concierto de Peso Pluma en el Foro Sol. Zona VIP, fila 10. Boletos digitales Ticketmaster transferibles.',
    price: 4500, location: 'CDMX',
    contact: { name: 'Miguel Ángel Ríos', phone: '55 2222 6666', email: 'miguelrios@email.com' },
    images: [], featured: true, createdAt: Date.now() - 75000000
  },
  {
    id: 'demo_12', category: 'eventos-fiestas', type: 'free',
    title: 'Renta de brincolines y mobiliario para fiestas',
    description: 'Renta de brincolines, mesas, sillas, manteles, loza y cristalería. Servicio de montaje y desmontaje incluido. Atendemos en toda la zona norte CDMX.',
    price: 1500, location: 'Azcapotzalco, CDMX',
    contact: { name: 'Fiestas Mágicas', phone: '55 8888 5555', email: '' },
    images: [], featured: false, createdAt: Date.now() - 200000000
  },
  // Salud y Belleza
  {
    id: 'demo_13', category: 'salud-esteticos', type: 'premium',
    title: 'Estética unisex — Cortes, tintes y tratamientos',
    description: 'Cortes de cabello desde $80, tintes desde $350, keratina brasileña $800. Manicure y pedicure. Citas disponibles toda la semana.',
    price: 80, location: 'Azcapotzalco, CDMX',
    contact: { name: 'Estética Glamour', phone: '55 3333 9999', email: '' },
    images: [], featured: true, createdAt: Date.now() - 180000000
  },
  // Deportes y Fitness
  {
    id: 'demo_14', category: 'deportes-bicicletas', type: 'free',
    title: 'Bicicleta de montaña Specialized Rockhopper R29',
    description: 'Bicicleta Specialized Rockhopper rodada 29, cuadro de aluminio talla M, frenos de disco hidráulicos, suspensión delantera RockShox.',
    price: 8900, location: 'CDMX, Xochimilco',
    contact: { name: 'Daniel Ortiz', phone: '55 2222 8888', email: '' },
    images: [], featured: false, createdAt: Date.now() - 320000000
  },
  {
    id: 'demo_15', category: 'deportes-gimnasio', type: 'premium',
    title: 'Gym en casa — Multifuncional + banca + discos',
    description: 'Estación multifuncional Body Solid, banca ajustable, barra olímpica, 80kg en discos, mancuernas. Todo en excelente estado. Por mudanza.',
    price: 12000, location: 'Azcapotzalco, CDMX',
    contact: { name: 'Ricardo Peña', phone: '55 4444 2222', email: 'ricardo.p@email.com' },
    images: [], featured: true, createdAt: Date.now() - 150000000
  },
  // Negocios y Equipamiento Comercial
  {
    id: 'demo_16', category: 'negocios-restaurantes', type: 'free',
    title: 'Estufa industrial 6 quemadores + plancha',
    description: 'Estufa industrial de acero inoxidable, 6 quemadores y plancha. Ideal para fonda, taquería o restaurante. Funciona con gas LP o natural.',
    price: 8500, location: 'Azcapotzalco, CDMX',
    contact: { name: 'Empresa TechSoluciones', phone: '55 4444 8888', email: 'ventas@techsol.mx' },
    images: [], featured: false, createdAt: Date.now() - 280000000
  },
  // Agricultura y Herramientas
  {
    id: 'demo_17', category: 'agricultura-herramientas', type: 'free',
    title: 'Rotomartillo Bosch + set de brocas profesional',
    description: 'Rotomartillo Bosch GBH 2-26, 800W, incluye maletín y set de 15 brocas para concreto, metal y madera. Poco uso.',
    price: 2800, location: 'CDMX, Azcapotzalco',
    contact: { name: 'Sergio Lara', phone: '55 4444 2222', email: '' },
    images: [], featured: false, createdAt: Date.now() - 420000000
  },
  // Trueque
  {
    id: 'demo_18', category: 'trueque-cambios', type: 'free',
    title: 'Cambio PS5 por laptop gamer — Solo CDMX',
    description: 'Ofrezco PS5 con 2 controles y 5 juegos. Busco laptop gamer con RTX 3060 o superior. Solo cambio en persona, zona norte CDMX.',
    price: 0, location: 'Azcapotzalco, CDMX',
    contact: { name: 'Emilio Vargas', phone: '55 6666 8888', email: '' },
    images: [], featured: false, createdAt: Date.now() - 450000000
  },
  // Gratis / Donaciones
  {
    id: 'demo_19', category: 'gratis-cosas', type: 'free',
    title: 'Regalo ropa de bebé — Tallas 0-12 meses',
    description: 'Lote de ropa de bebé en buen estado, tallas de 0 a 12 meses. Incluye mamelucos, pantalones, playeras y chamarrita. Pasar a recoger.',
    price: 0, location: 'Azcapotzalco, CDMX',
    contact: { name: 'Gabriela Santos', phone: '55 888 3344', email: '' },
    images: [], featured: false, createdAt: Date.now() - 250000000
  },
  // Comunidad
  {
    id: 'demo_20', category: 'comunidad-roommates', type: 'free',
    title: 'Busco roommate — Depa en Azcapotzalco centro',
    description: 'Busco roommate para compartir departamento de 2 recámaras. Renta $3,500 por persona, incluye servicios. Cerca del metro Camarones.',
    price: 3500, location: 'Azcapotzalco, CDMX',
    contact: { name: 'Laura Martínez', phone: '55 7777 2222', email: '' },
    images: [], featured: false, createdAt: Date.now() - 350000000
  },
  {
    id: 'demo_21', category: 'comunidad-mascotas', type: 'premium',
    title: 'Cachorros en adopción — Criollos vacunados',
    description: '3 cachorros criollos (2 meses) en adopción responsable. Ya desparasitados y con primera vacuna. Se entregan con cartilla de vacunación.',
    price: 0, location: 'Azcapotzalco, CDMX',
    contact: { name: 'Asociación Patitas', phone: '55 5555 1111', email: 'patitas@email.com' },
    images: [], featured: true, createdAt: Date.now() - 90000000
  },
];

/* ============================================
   YOUTUBE VIDEO CAROUSEL — URL Parser Utility
   ============================================ */

/** Extract YouTube video ID from various URL formats */
function getYouTubeId(url) {
  if (!url) return null;
  // Already a plain ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  // youtube.com/shorts/ID
  let m = url.match(/shorts\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  // youtu.be/ID
  m = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  // youtube.com/watch?v=ID
  m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  // youtube.com/embed/ID
  m = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  return null;
}

/** Get YouTube thumbnail URL from a video URL */
function getYtThumbnail(url) {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}

/* ============================================
   MEDIA CENTER — Demo Videos & Reels
   ============================================ */
const DEMO_VIDEOS = [
  // === FEATURED / HERO ===
  {
    id: 'mc_hero', format: 'video', featured: true,
    url: 'https://youtu.be/QgRKX3wEYkg',
    title: 'Conoce AzcapoClasificados — Tu plataforma local',
    description: 'Descubre la mejor plataforma de anuncios clasificados en Azcapotzalco. Compra, vende y promociona tus productos y servicios.',
    category: 'todos', categoryLabel: '⭐ Destacado',
    price: 'Gratis', location: 'Azcapotzalco, CDMX',
    duration: '3:45', phone: '5512345678'
  },
  // === REELS (9:16) ===
  {
    id: 'mc_reel_1', format: 'reel',
    url: 'https://youtube.com/shorts/Jpit9t-KksQ',
    title: 'Depto en Renta — Reforma',
    description: 'Departamento amueblado cerca del metro. Ideal para profesionistas.',
    category: 'inmuebles', categoryLabel: '🏠 Inmuebles',
    price: '$8,500/mes', location: 'Azcapotzalco',
    phone: '5512345678'
  },
  {
    id: 'mc_reel_2', format: 'reel',
    url: 'https://youtube.com/shorts/Jpit9t-KksQ',
    title: 'Nissan Versa 2023',
    description: 'Seminuevo, único dueño, 25,000 km. Financiamiento disponible.',
    category: 'vehiculos', categoryLabel: '🚗 Vehículos',
    price: '$285,000', location: 'Azcapotzalco',
    phone: '5598765432'
  },
  {
    id: 'mc_reel_3', format: 'reel',
    url: 'https://youtube.com/shorts/Jpit9t-KksQ',
    title: 'Taquería El Güero — Azcapotzalco',
    description: 'Los mejores tacos de la zona. Servicio a domicilio.',
    category: 'negocios', categoryLabel: '🏪 Negocios',
    price: 'Desde $15', location: 'Azcapotzalco Centro',
    phone: '5544332211'
  },
  {
    id: 'mc_reel_4', format: 'reel',
    url: 'https://youtube.com/shorts/Jpit9t-KksQ',
    title: 'Electricista Certificado',
    description: 'Instalaciones eléctricas, mantenimiento y reparaciones. Trabajo garantizado.',
    category: 'servicios', categoryLabel: '🔧 Servicios',
    price: 'A convenir', location: 'Azcapotzalco',
    phone: '5566778899'
  },
  {
    id: 'mc_reel_5', format: 'reel',
    url: 'https://youtube.com/shorts/Jpit9t-KksQ',
    title: 'Vacante Mostrador — Medio Tiempo',
    description: 'Se solicita personal para atención al cliente. Sueldo base + comisiones.',
    category: 'empleo', categoryLabel: '💼 Empleo',
    price: '$8,000/mes', location: 'Azcapotzalco',
    phone: '5511223344'
  },
  {
    id: 'mc_reel_6', format: 'reel',
    url: 'https://youtube.com/shorts/Jpit9t-KksQ',
    title: 'Casa 3 Recámaras — Oportunidad',
    description: 'Casa con cochera, patio y roof garden. Escrituras al corriente.',
    category: 'inmuebles', categoryLabel: '🏠 Inmuebles',
    price: '$1,850,000', location: 'Col. Clavería',
    phone: '5533221100'
  },
  // === VIDEOS (16:9) ===
  {
    id: 'mc_vid_1', format: 'video',
    url: 'https://youtu.be/QgRKX3wEYkg',
    title: 'Casa en Venta — Col. Azcapotzalco Centro',
    description: 'Amplia casa de 3 recámaras, 2 baños completos, cochera para 2 autos. Cerca del metro Camarones.',
    category: 'inmuebles', categoryLabel: '🏠 Inmuebles',
    price: '$2,500,000', location: 'Azcapotzalco, CDMX',
    duration: '2:15', phone: '5512345678'
  },
  {
    id: 'mc_vid_2', format: 'video',
    url: 'https://youtu.be/QgRKX3wEYkg',
    title: 'Honda Civic 2020 — Único Dueño',
    description: 'Honda Civic Touring 2020, piel, quemacocos, 45,000 km. Servicio de agencia.',
    category: 'vehiculos', categoryLabel: '🚗 Vehículos',
    price: '$345,000', location: 'Azcapotzalco, CDMX',
    duration: '1:30', phone: '5598765432'
  },
  {
    id: 'mc_vid_3', format: 'video',
    url: 'https://youtu.be/QgRKX3wEYkg',
    title: 'Plomería Profesional — Servicio Garantizado',
    description: 'Plomero certificado con 15 años de experiencia. Destape, reparación de fugas, instalación de tinacos.',
    category: 'servicios', categoryLabel: '🔧 Servicios',
    price: 'A convenir', location: 'Azcapotzalco, CDMX',
    duration: '0:58', phone: '5544332211'
  },
  {
    id: 'mc_vid_4', format: 'video',
    url: 'https://youtu.be/QgRKX3wEYkg',
    title: 'Local Comercial en Renta — Av. Azcapotzalco',
    description: 'Local de 80m² en avenida principal. Ideal para restaurante, tienda o consultorio.',
    category: 'negocios', categoryLabel: '🏪 Negocios',
    price: '$18,000/mes', location: 'Azcapotzalco, CDMX',
    duration: '1:45', phone: '5566778899'
  },
  {
    id: 'mc_vid_5', format: 'video',
    url: 'https://youtu.be/QgRKX3wEYkg',
    title: 'Se Solicita Personal — Restaurante',
    description: 'Vacantes para meseros, cocineros y cajeros. Prestaciones de ley y propinas.',
    category: 'empleo', categoryLabel: '💼 Empleo',
    price: '$9,500/mes', location: 'Azcapotzalco, CDMX',
    duration: '0:45', phone: '5511223344'
  },
  {
    id: 'mc_vid_6', format: 'video',
    url: 'https://youtu.be/QgRKX3wEYkg',
    title: 'Departamento Nuevo — 2 Recámaras',
    description: 'Departamento nuevo en condominio con vigilancia. 2 recámaras, cocina integral, 1 cajón.',
    category: 'inmuebles', categoryLabel: '🏠 Inmuebles',
    price: '$1,950,000', location: 'Col. Clavería, CDMX',
    duration: '3:10', phone: '5533221100'
  },
  {
    id: 'mc_vid_7', format: 'video',
    url: 'https://youtu.be/QgRKX3wEYkg',
    title: 'Moto Italika FT150 — Semi Nueva',
    description: 'Italika FT150 2024, 3,000 km. Incluye casco y chaleco. Papeles en regla.',
    category: 'vehiculos', categoryLabel: '🚗 Vehículos',
    price: '$22,500', location: 'Azcapotzalco, CDMX',
    duration: '1:12', phone: '5512345678'
  },
  {
    id: 'mc_vid_8', format: 'video',
    url: 'https://youtu.be/QgRKX3wEYkg',
    title: 'Estética Unisex — Promociones del Mes',
    description: 'Cortes desde $80, tintes desde $350, alaciado permanente $600.',
    category: 'servicios', categoryLabel: '🔧 Servicios',
    price: 'Desde $80', location: 'Azcapotzalco, CDMX',
    duration: '0:55', phone: '5544332211'
  }
];
