# NeonBoy Music Halloween para Android

Este proyecto empaqueta **solo la edición independiente de Halloween** con Capacitor. El sitio web sigue usando `dist-halloween/`; Android usa `dist-halloween-android/` con rutas relativas. El juego principal no se modifica.

## Probar en un celular Android

1. Instalá [Android Studio](https://developer.android.com/studio) y, desde **SDK Manager**, el SDK de Android (API 36) y las herramientas de compilación. No hace falta instalar un emulador si usás un celular real.
2. Abrí en Android Studio la carpeta `apps/neonboy-halloween/android` y esperá la sincronización de Gradle.
3. En el celular, habilitá **Opciones de desarrollador > Depuración por USB**, conectalo y aceptá la autorización que aparezca.
4. Seleccioná el celular en Android Studio y pulsá **Run** (triángulo verde). La app se instala como **NeonBoy Music Halloween** y se abre horizontalmente.

Para generar un APK de prueba sin usar el botón Run, desde esta carpeta ejecutá:

```powershell
npm run android:apk
```

El archivo queda en `android/app/build/outputs/apk/debug/app-debug.apk`. Podés copiarlo al celular e instalarlo. Es una compilación de depuración; para publicar en Google Play se requiere una compilación de lanzamiento firmada.

## Actualizar el juego dentro de la app

Después de cambiar Halloween, desde esta carpeta ejecutá:

```powershell
npm run android:sync
```

Luego volvé a pulsar **Run** en Android Studio. La sincronización recompila el sitio con rutas locales y lo copia a `android/app/src/main/assets/public/`.

Los modelos, el arte, las voces y Freezer se incluyen en la app. Las canciones y videos de YouTube necesitan Internet. El proyecto Android usa la orientación horizontal y tiene aceleración gráfica para la escena 3D.

## Estado de verificación

El build web, `cap sync android` y `assembleDebug` se completaron el 31/10/2026. El APK de prueba quedó en `android/app/build/outputs/apk/debug/app-debug.apk` (38 MiB). La interfaz se probó en un navegador móvil horizontal: escena 3D, controles táctiles, correr, Visión C y personajes. La app se instaló y abrió en el emulador Medium Phone API 37.0; falta probarla en un dispositivo Android real.
## Ícono y exportación

El ícono de la app se genera desde `src/assets/icono-android.png`, sin modificar el original. Para regenerar los recursos Android y la imagen de Play Console, ejecutá desde la raíz del proyecto:

```powershell
powershell -ExecutionPolicy Bypass -File apps/neonboy-halloween/scripts/generate-android-icons.ps1
```

Los recursos del ícono quedan dentro de `android/app/src/main/res/mipmap-*`; la imagen de 512 px para la ficha de la tienda queda en `release-assets/play-store-icon-512.png`.

Para exportar el proyecto, primero ejecutá `npm run android:sync` desde `apps/neonboy-halloween`. Después podés abrir `apps/neonboy-halloween/android` en Android Studio. El archivo `release-assets/neonboy-halloween-android-project.zip` incluye esa carpeta Android con los recursos web ya copiados y sin cachés de compilación.

## Publicar en Google Play

El AAB firmado para la primera publicación queda en `release-assets/neonboy-halloween-v1.0-play.aab`. Se generó y verificó el 31/10/2026. El archivo `android/app/build/outputs/bundle/release/app-release.aab` que genera Gradle directamente queda sin la firma de carga: **subí a Play Console solamente el AAB de `release-assets`**.

La clave de carga está en `C:\Users\posca\.android\neonboy-halloween-upload.jks`. La contraseña se guarda cifrada con Windows DPAPI en `C:\Users\posca\.android\neonboy-halloween-upload-password.dpapi`; solo se puede descifrar desde esta misma cuenta de Windows. Ninguno de estos dos archivos está incluido en el ZIP del proyecto ni en el repositorio.

**Respaldá la clave `.jks` y guardá la contraseña en un gestor de contraseñas** antes de cambiar de PC o reinstalar Windows. Para ver la contraseña localmente y copiarla al gestor, ejecutá esto en PowerShell desde esta misma cuenta (se mostrará en tu pantalla):

```powershell
$secure = Get-Content "$env:USERPROFILE\.android\neonboy-halloween-upload-password.dpapi" -Raw | ConvertTo-SecureString
[System.Net.NetworkCredential]::new('', $secure).Password
```

Para crear una nueva versión firmada desde este equipo, ejecutá desde la raíz del repositorio:

```powershell
powershell -ExecutionPolicy Bypass -File apps/neonboy-halloween/scripts/build-play-bundle.ps1
```

El script sincroniza el contenido web, compila el bundle, lo firma con la clave de carga y verifica la firma. Para una actualización posterior, aumentá `versionCode` en `android/app/build.gradle` antes de compilar. Conservá siempre la misma clave de carga de esta app.
