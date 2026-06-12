// Public endpoint — returns the pricing table for boost levels
module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  return res.status(200).json({
    success: true,
    levels: [
      { id: 'basic',    label: 'Básico',    price: 80,  days: 3, description: 'Aparece arriba en su categoría', badge: null },
      { id: 'featured', label: 'Destacado', price: 150, days: 7, description: 'Categoría + sección Destacados en home', badge: 'Más elegido' },
      { id: 'premium',  label: 'Premium',   price: 280, days: 7, description: 'Todo lo anterior + 5 fotos extra', badge: 'Más completo' },
    ],
    store_plans: [
      { id: 'store_basic', label: 'Tienda Básica', price: 200, days: 30, description: 'Perfil + listado de anuncios' },
      { id: 'store_plus',  label: 'Tienda Plus',   price: 450, days: 30, description: 'Perfil + 2 destacados/mes + insignia' },
      { id: 'store_pro',   label: 'Tienda Pro',    price: 900, days: 30, description: 'Todo lo anterior + reporte de visitas' },
    ]
  });
};
