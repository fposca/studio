# Interbanking Studio

MVP local para editar imagenes y video desde el navegador.

## Funciones incluidas

- Acceso por mail restringido a `fposca`, `jpaz` y `fmachado` con dominio `interbanking.com.ar`.
- Editor de imagen con recorte por coordenadas, retoque, rotacion, espejo, cortar/pegar seleccion, cambio de resolucion y exportacion PNG/JPG/WebP.
- Conversion de imagen raster a SVG mediante Potrace.
- Editor de video con preview, recorte por tiempo, union de multiples videos y exportacion MP4/MOV en H.265 o H.264.
- Backend local con `ffmpeg-static`, sin requerir ffmpeg instalado globalmente.

## Uso

```bash
npm install
npm run dev
```

Abrir `http://127.0.0.1:5173/`.

La API corre en `http://127.0.0.1:5174/`.

## Nota de seguridad

El login actual es una restriccion de MVP en frontend. Para produccion conviene reemplazarlo por SSO corporativo o autenticacion backend con sesiones.
