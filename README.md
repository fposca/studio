# Neon Studio

MVP local para editar imagenes y video desde el navegador.

## Funciones incluidas

- Acceso privado con cuentas creadas por un administrador.
- Editor de imagen con recorte por coordenadas, retoque, rotacion, espejo, cortar/pegar seleccion, cambio de resolucion y exportacion PNG/JPG/WebP.
- Conversion de imagen raster a SVG mediante Potrace.
- Editor de audio con recorte, volumen, normalizacion, fundidos y exportacion MP3/WAV.
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

## Alta de usuarios

No existe registro publico. Un administrador crea cada cuenta desde la pestana `Usuarios`; una Cloud Function valida su rol, crea la cuenta y registra el perfil. Firebase envia al nuevo usuario un enlace para definir su contrasena.

Cloud Functions requiere el plan Blaze. Las funciones corren en `southamerica-east1` y validan el rol `admin` antes de crear cuentas o cambiar accesos.

Los permisos se leen desde `users/{uid}` en Cloud Firestore:

- `viewer`: demo web sin herramientas; sin acceso a escritorio.
- `tester`: acceso completo a web y escritorio.
- `admin`: acceso completo y permiso administrativo reservado.

Si el documento no existe, el rol es desconocido o Firestore falla, se usa `viewer`. Los roles se administran desde la pestana `Usuarios` o Firebase Console.

### Preparar el Firebase de la empresa

1. Crea un proyecto Firebase propiedad de la empresa.
2. Habilita solamente Email/Password en Authentication.
3. Copia `.env.example` como `.env.local` y completa los datos del nuevo proyecto.
4. Crea la primera cuenta en Authentication y un documento `users/{uid}` con `role: "admin"`.
5. Ejecuta `firebase use --add` para seleccionar el proyecto corporativo.
6. Publica con `firebase deploy --only firestore:rules,functions`.
7. Elimina las cuentas de prueba desde Authentication y sus documentos en `users`.

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

Para publicar una descarga desde la web, configura la URL del instalador antes del build:

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
