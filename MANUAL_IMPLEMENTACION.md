# Manual de Implementación — Azcapo Clasificados

## Información del Proyecto

| Campo | Valor |
|-------|-------|
| **Nombre** | Azcapo Clasificados |
| **Versión** | 1.0.0 |
| **Plataforma** | Vercel (Serverless) |
| **Base de datos** | Neon PostgreSQL |
| **Pagos** | MercadoPago SDK v2 |
| **Fecha de paquete** | 12 de mayo de 2026 |

---

## 1. Contenido del Paquete ZIP

```
azcapo-clasificados-produccion.zip
├── index.html                    # Punto de entrada SPA
├── package.json                  # Dependencias Node.js
├── vercel.json                   # Configuración Vercel + Cron Jobs
├── .gitignore                    # Archivos excluidos de Git
├── css/
│   ├── index.css                 # Design tokens y variables
│   ├── layout.css                # Layout y grid
│   ├── components.css            # Componentes UI
│   └── pages.css                 # Estilos de páginas
├── js/
│   ├── data.js                   # Catálogo de categorías
│   ├── auth.js                   # Lógica de autenticación (cliente)
│   ├── store.js                  # Estado global / API client
│   ├── components.js             # Componentes renderizables
│   ├── pages.js                  # Páginas de la SPA
│   └── app.js                    # Router y bootstrap
├── assets/
│   └── logo.png                  # Logo corporativo
├── api/                          # Serverless Functions (Vercel)
│   ├── ads/
│   │   ├── index.js              # GET listar / POST crear anuncios
│   │   ├── my.js                 # GET mis anuncios
│   │   └── [id]/
│   │       ├── index.js          # GET detalle / DELETE eliminar
│   │       └── renew.js          # POST renovar anuncio
│   ├── auth/
│   │   ├── register.js           # POST registro de usuario
│   │   ├── login.js              # POST inicio de sesión
│   │   └── me.js                 # GET perfil autenticado
│   ├── cron/
│   │   └── expire-ads.js         # Cron: suspender anuncios vencidos
│   └── payments/
│       ├── create-preference.js  # POST crear preferencia MercadoPago
│       └── webhook.js            # POST webhook MercadoPago
└── lib/                          # Módulos compartidos del backend
    ├── db.js                     # Conexión Neon PostgreSQL
    ├── auth.js                   # JWT + bcrypt helpers
    ├── cors.js                   # CORS middleware
    ├── mercadopago.js            # MercadoPago SDK wrapper
    └── setup-db.js               # Script de creación de tablas + seed
```

> **NOTA:** El archivo `.env.local` **NO** está incluido en el ZIP por seguridad. Las variables de entorno se configuran directamente en Vercel.

---

## 2. Prerrequisitos

| Requisito | Versión mínima | Propósito |
|-----------|---------------|-----------|
| Node.js | 18.x | Runtime de Vercel Functions |
| npm | 9.x | Gestor de paquetes |
| Cuenta Vercel | — | Hosting y serverless |
| Neon PostgreSQL | — | Base de datos |
| Cuenta MercadoPago | — | Procesamiento de pagos |
| Git | 2.x | Control de versiones |

---

## 3. Variables de Entorno

Configurar en **Vercel → Settings → Environment Variables** para los entornos `Production`, `Preview` y `Development`:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string de Neon PostgreSQL | `postgresql://user:pass@host/dbname?sslmode=require` |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT (mín. 32 caracteres) | `azcapo_jwt_prod_XXXXX` |
| `MP_ACCESS_TOKEN` | Access Token de MercadoPago (producción) | `APP_USR-XXXX` |
| `CRON_SECRET` | Secreto para autenticar Vercel Cron Jobs | `azcapo_cron_XXXXX` |

> **⚠️ IMPORTANTE:** Generar valores únicos y seguros para `JWT_SECRET` y `CRON_SECRET` en producción. Nunca reutilizar los valores de desarrollo.

---

## 4. Procedimiento de Despliegue

### Paso 1 — Preparar repositorio Git

```bash
# Descomprimir el ZIP en una carpeta limpia
mkdir azcapo-clasificados && cd azcapo-clasificados
# Copiar contenido del ZIP aquí

# Inicializar repositorio
git init
git add .
git commit -m "v1.0.0 — Release inicial Azcapo Clasificados"
```

### Paso 2 — Crear proyecto en Vercel

1. Ir a [vercel.com/new](https://vercel.com/new)
2. Importar el repositorio Git (GitHub, GitLab o Bitbucket)
3. **Framework Preset:** seleccionar `Other`
4. **Build Command:** dejar vacío (no hay build step)
5. **Output Directory:** dejar vacío (se sirve la raíz)
6. **Install Command:** `npm install`
7. Hacer clic en **Deploy**

### Paso 3 — Configurar variables de entorno

1. En el dashboard de Vercel → **Settings → Environment Variables**
2. Agregar las 4 variables listadas en la sección 3
3. Marcar todas para `Production` + `Preview`
4. Hacer clic en **Save**
5. **Re-deploy** para que tome las variables: ir a **Deployments** → menú `⋯` del último → **Redeploy**

### Paso 4 — Inicializar la base de datos

```bash
# Opción A: Desde la máquina local (con DATABASE_URL exportada)
export DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"
npm install
node lib/setup-db.js

# Opción B: Desde Vercel CLI
npx vercel env pull .env.local
npm install
node lib/setup-db.js
```

Este script:
- Crea las tablas `users`, `ads` y `payments` si no existen
- Inserta 21 anuncios demo si la tabla `ads` está vacía

### Paso 5 — Verificar Cron Job

El archivo `vercel.json` configura un cron que ejecuta `/api/cron/expire-ads` diariamente a las 06:00 UTC.

Verificar en **Vercel → Settings → Crons** que aparezca:

| Path | Schedule | Descripción |
|------|----------|-------------|
| `/api/cron/expire-ads` | `0 6 * * *` | Suspende anuncios vencidos |

### Paso 6 — Configurar dominio personalizado (opcional)

1. **Vercel → Settings → Domains**
2. Agregar dominio (ej: `clasificados.azcapo.mx`)
3. Configurar DNS según instrucciones de Vercel (CNAME o A record)
4. Esperar propagación (hasta 48 horas)

---

## 5. Esquema de Base de Datos

### Tabla `users`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| id | SERIAL | PRIMARY KEY |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |
| last_login | TIMESTAMP | DEFAULT NOW() |

### Tabla `ads`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| id | SERIAL | PRIMARY KEY |
| public_id | VARCHAR(60) | UNIQUE, NOT NULL |
| owner_id | INTEGER | FK → users(id) ON DELETE SET NULL |
| title | VARCHAR(120) | NOT NULL |
| description | TEXT | NOT NULL |
| category | VARCHAR(60) | NOT NULL |
| price | NUMERIC(12,2) | DEFAULT 0 |
| location | VARCHAR(255) | NOT NULL |
| type | VARCHAR(20) | DEFAULT 'free' |
| status | VARCHAR(20) | DEFAULT 'active' |
| images | JSONB | DEFAULT '[]' |
| contact | JSONB | DEFAULT '{}' |
| featured | BOOLEAN | DEFAULT FALSE |
| expires_at | TIMESTAMP | — |
| renewal_count | INTEGER | DEFAULT 0 |
| max_renewals | INTEGER | DEFAULT 3 |
| created_at | TIMESTAMP | DEFAULT NOW() |

### Tabla `payments`
| Columna | Tipo | Restricciones |
|---------|------|--------------|
| id | SERIAL | PRIMARY KEY |
| ad_public_id | VARCHAR(60) | — |
| mp_preference_id | VARCHAR(255) | — |
| mp_payment_id | VARCHAR(255) | — |
| status | VARCHAR(50) | DEFAULT 'pending' |
| amount | NUMERIC(12,2) | — |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

---

## 6. Endpoints de la API

### Autenticación
| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| POST | `/api/auth/register` | No | Registrar usuario |
| POST | `/api/auth/login` | No | Iniciar sesión (retorna JWT) |
| GET | `/api/auth/me` | JWT | Obtener perfil del usuario |

### Anuncios
| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| GET | `/api/ads` | No | Listar anuncios (con filtros) |
| POST | `/api/ads` | JWT | Crear anuncio |
| GET | `/api/ads/my` | JWT | Mis anuncios |
| GET | `/api/ads/[id]` | No | Detalle de anuncio |
| DELETE | `/api/ads/[id]` | JWT | Eliminar anuncio propio |
| POST | `/api/ads/[id]/renew` | JWT | Renovar anuncio |

**Parámetros de query para GET `/api/ads`:**
- `q` — búsqueda por texto
- `category` — filtrar por categoría
- `type` — `free` o `premium`
- `sort` — `price-asc`, `price-desc`, `oldest`
- `minPrice` / `maxPrice` — rango de precios
- `limit` / `page` — paginación

### Pagos
| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| POST | `/api/payments/create-preference` | JWT | Crear preferencia MercadoPago |
| POST | `/api/payments/webhook` | No (firma MP) | Webhook de notificación |

### Cron
| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| GET | `/api/cron/expire-ads` | CRON_SECRET | Suspender anuncios vencidos |

---

## 7. Reglas de Negocio

| Concepto | Gratuito | Premium |
|----------|----------|---------|
| Vigencia | 15 días | 30 días |
| Renovaciones | 3 máximo | Ilimitadas |
| Destacado | No | Sí (aparece primero) |
| Estado inicial | `active` | `pending_payment` → `active` |

---

## 8. Checklist de Verificación Post-Deploy

```
[ ] La página principal carga correctamente
[ ] El registro de usuario funciona
[ ] El login retorna JWT válido
[ ] GET /api/ads retorna anuncios demo
[ ] Crear anuncio gratuito funciona (autenticado)
[ ] Crear anuncio premium genera preferencia MercadoPago
[ ] El cron de expiración responde 200 (con CRON_SECRET)
[ ] Los estilos CSS cargan correctamente
[ ] El logo se muestra en el header
[ ] Las categorías despliegan subcategorías
[ ] Los filtros de búsqueda funcionan
[ ] HTTPS activo en dominio personalizado
```

---

## 9. Seguridad — Consideraciones para Producción

1. **JWT_SECRET**: Usar un valor aleatorio de al menos 64 caracteres. Generar con:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. **CORS**: Actualmente configurado como `Access-Control-Allow-Origin: *`. Para producción, restringir al dominio específico editando `lib/cors.js`.
3. **MercadoPago**: Usar el Access Token de **producción**, no el de sandbox/test.
4. **CRON_SECRET**: Generar valor único. Vercel envía automáticamente el header `Authorization: Bearer <CRON_SECRET>`.
5. **Rate Limiting**: Considerar agregar rate limiting via Vercel Edge Middleware o un servicio externo.

---

## 10. Dependencias (package.json)

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@neondatabase/serverless` | ^0.10.4 | Driver PostgreSQL para Neon |
| `@vercel/blob` | ^0.27.1 | Almacenamiento de blobs (imágenes) |
| `bcryptjs` | ^2.4.3 | Hash de contraseñas |
| `jsonwebtoken` | ^9.0.2 | Generación/verificación JWT |
| `mercadopago` | ^2.0.15 | SDK MercadoPago |

---

## 11. Soporte y Contacto

Para problemas con el despliegue:
- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **MercadoPago Developers**: https://www.mercadopago.com.mx/developers

---

*Documento generado automáticamente el 12 de mayo de 2026.*
