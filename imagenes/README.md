# Carpeta de imágenes del carrusel

Coloca aquí cualquier archivo `.jpg` o `.png` que quieras mostrar
en el carrusel del banner de la página principal.

## Cómo agregar banners

1. Copia tu imagen a esta carpeta (`imagenes/`)
2. Haz `git add`, `git commit` y `git push` (o haz deploy desde Vercel)
3. El carrusel la mostrará automáticamente en el próximo deploy

## Formato recomendado

- Proporción: **6000 × 2200 px** (≈ 2.73 : 1)
- Formato: `.jpg` (óptimo) o `.png`
- Peso máximo recomendado: 500 KB por imagen (comprime en TinyPNG si es necesario)

## API

El endpoint `GET /api/imagenes` devuelve la lista de archivos de esta carpeta.
