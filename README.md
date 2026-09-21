# Neon Studio

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

## Autenticacion y roles

La web y la aplicacion de escritorio usan Firebase Authentication con email y contrasena. Copia `.env.example` como `.env.local` y completa `VITE_FIREBASE_API_KEY` antes de iniciar o compilar. Por defecto, el desarrollo usa el proyecto Firebase configurado. Para trabajar completamente en local, define `VITE_USE_FIREBASE_EMULATORS=true` y levanta Emulator Suite.

## Solicitudes de acceso

El login permite solicitar acceso con nombre, email y empresa opcional. Las solicitudes aparecen en la pestana `Usuarios` de los administradores. Al aprobar una solicitud, una Cloud Function crea la cuenta con rol `viewer`; cuando la funcion responde, el frontend usa Firebase Authentication para enviar el correo estandar de restablecimiento de contrasena.

Para habilitar el flujo en Firebase:

Publica las reglas y las funciones con `firebase deploy --only firestore:rules,functions --project videostudio-4446b`.

Cloud Functions requiere que este proyecto use el plan Blaze. Las funciones corren en `southamerica-east1` y validan el rol `admin` en Firestore antes de crear cuentas o cambiar accesos.

Los permisos se leen desde `users/{uid}` en Cloud Firestore:

- `viewer`: demo web sin herramientas; sin acceso a escritorio.
- `tester`: acceso completo a web y escritorio.
- `admin`: acceso completo y permiso administrativo reservado.

Si el documento no existe, el rol es desconocido o Firestore falla, se usa `viewer`. Los roles se asignan manualmente desde Firebase Console y se actualizan en la aplicacion al volver a iniciar sesion.

## Aplicacion de escritorio

La aplicacion de escritorio procesa imagenes y videos en la PC del usuario. No necesita conectarse a un servidor de Neon Studio.

```bash
pnpm run desktop
```

Para generar el instalador de Windows:

```bash
pnpm run dist:win
```

El instalador se crea en `release/`.

### Publicar la descarga web

1. Ejecuta `pnpm run dist:win`.
2. Crea una nueva version en GitHub Releases.
3. Adjunta `release/Neon-Studio-Setup-Windows.exe` a esa version.

La web apunta por defecto al instalador de la version mas reciente del repositorio `fposca/studio`. Para usar otra ubicacion, configura antes del build:

```powershell
$env:VITE_WINDOWS_DOWNLOAD_URL = "https://servidor.example/Neon-Studio-Setup-Windows.exe"
pnpm run build
```

### Firma digital

El empaquetado detecta automaticamente un certificado de firma de codigo en formato PFX mediante estas variables de entorno:

```powershell
$env:CSC_LINK = "C:\ruta\certificado.pfx"
$env:CSC_KEY_PASSWORD = "contrasena-del-certificado"
pnpm run dist:win
```

No guardes el certificado ni su contrasena dentro del repositorio. Para reducir las advertencias de SmartScreen, el PFX debe provenir de una autoridad certificadora reconocida y mantenerse vigente.

## Nota de seguridad

El login actual es una restriccion de MVP en frontend. Para produccion conviene reemplazarlo por SSO corporativo o autenticacion backend con sesiones.
