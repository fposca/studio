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

## Guía contextual y controles (24/11/2026)

La tarjeta **Siguiente paso** y el botón **GUÍA** indican la acción pendiente a partir de la partida actual: llave, cofre, gafas, semidemonio, VHS, conversaciones, llamadas y espejo. La lista separa las condiciones de la historia de los secretos opcionales. Un marcador señala el destino y muestra una flecha cuando queda fuera de vista; no representa una ruta que atraviese muebles.

Al recoger la llave, una vista de cinco segundos muestra el cofre y vuelve a la misma cámara. Se puede omitir con **Volver al personaje** o Escape, y repetir desde **Mostrar el cofre** mientras falten las gafas. Movimiento, ataques y el reloj de visión quedan pausados durante la vista. Con movimiento reducido se usa un encuadre fijo. Cargar una partida con la llave no repite automáticamente la secuencia.

Al recoger las gafas, una vista de ocho segundos enfoca al semidemonio con un acento magenta y explica que el Orbe solo lo daña con VISIÓN C activa. El tiempo de las gafas queda pausado; repetir la ayuda no concede otra carga. Después del VHS se presenta al primer personaje pendiente, con una lista de los siete ciudadanos y botones para enfocar a cada uno. Al reunir todas las pistas, otro encuadre muestra el espejo sin invocar al Juez durante la explicación. Estas presentaciones se registran en `guideSeen`, separado de los descubrimientos de la misión, para no repetirse al cargar; se pueden volver a ver desde **GUÍA**.

Los subtítulos comparten una pila con las acciones contextuales; su margen inferior se calcula con el alto real de los controles táctiles mediante ResizeObserver. Solo se muestra una voz escrita a la vez. Las señales se actualizan a 10 Hz dentro del render loop existente, sin nuevos modelos, luces ni render loops.

Validación: 91 pruebas unitarias de Halloween y cinco pruebas de navegador aprobadas (915×412 y 740×360), incluyendo retorno/omisión de cámara, guardado, recarga, reloj de las gafas pausado, condición del espejo, conversaciones pendientes y separación de subtítulos/controles. Build web Android, sincronización Capacitor y `assembleDebug` correctos. APK instalado con `adb install -r` en **NeonBoy_AOSP_API_36**, conservando la partida; inicio, lista de siete personajes, encuadre de Tito y retorno a los controles verificados en su WebView de 867×388. No se midió rendimiento en un teléfono físico.

Para repetir las comprobaciones desde la raíz:

```powershell
node --test apps/neonboy-halloween/*.test.js
npx playwright test --config tests/halloween.playwright.config.js
```

## Actualización 1.0.6 (24/11/2026)

Esta versión incluye las ayudas de cámara para cofre, semidemonio, personajes y espejo. El paquete Android usa `versionCode 7` y `versionName 1.0.6`.

- Para instalarla directamente sobre una compilación de prueba de esta app: `release-assets/neonboy-halloween-v1.0.6-debug.apk`.
- Para actualizar la publicación de Google Play: `release-assets/neonboy-halloween-v1.0.6-play.aab`. El AAB está firmado con la misma clave de carga que el paquete 1.0.5; se verificó la firma y el contenido.

El APK de prueba usa la firma de depuración, por lo que Android no lo acepta como reemplazo de una instalación procedente de Google Play. En ese caso la actualización debe distribuirse desde Play Console usando el AAB. La compilación no se publicó automáticamente.


## Presentación musical 1.0.7 (25/11/2026)

La primera entrada a la tienda incluye un recorrido de cámara de aproximadamente 36 segundos: NeonBoy, discos instrumentales, discos de 9th Revelation, Roxy y Rulo, y regreso a la cámara del jugador. Las tarjetas explican cómo abrir un disco con **E** (o el botón táctil), elegir una canción, hablar con los personajes y consultar **GUÍA**. Escuchar música y seguir la aventura se presentan como opciones del mismo recorrido interactivo.

Incluye **Siguiente**, **Omitir presentación** y **Entrar a la tienda**. **GUÍA → Ver presentación de la tienda** permite repetirla. El indicador `welcome` se guarda al completar u omitir el recorrido; no se repite automáticamente al continuar esa partida. Movimiento reducido usa encuadres fijos. Las voces e interacciones del juego quedan pausadas, sin conceder objetos, descubrimientos ni avance de misiones. Se reutilizan los modelos, las portadas y el render loop existentes.

Validación: 93 pruebas unitarias aprobadas y siete pruebas de navegador aprobadas; la prueba del cofre se repitió tras un cierre de Chrome durante su arranque. Se comprobaron recorrido, regreso exacto, omisión, persistencia, repetición desde GUÍA, pantallas de 915×412 y 740×360, apertura de Gloom y Holy Fire con sus canciones y conservación de las ayudas previas.

Paquetes con `versionCode 8` y `versionName 1.0.7`:

- `release-assets/neonboy-halloween-v1.0.7-debug.apk`: APK de prueba; compilación web, sincronización y `assembleDebug` correctos.
- `release-assets/neonboy-halloween-v1.0.7-play.aab`: AAB firmado con la clave existente y firma verificada, sin publicación automática.

Para compilar en este equipo se utilizó Microsoft JDK 21 (`C:/Program Files/Microsoft/jdk-21.0.12.101-hotspot`); el JBR 25 instalado con Android Studio no es compatible con el Gradle actual del proyecto.

Prueba nativa: APK instalado mediante `adb install -r` en **NeonBoy_AOSP_API_36**, conservando la partida. Las cinco etapas se reprodujeron en la WebView de 867×388; se verificaron ausencia de controles durante el recorrido, regreso a la cámara del jugador, controles restaurados, guardado de `welcome` y avance de historia intacto. Captura: `tmp/halloween-android-welcome.png`. No se midió rendimiento en un teléfono físico.


## Interfaz compacta 1.0.8 (25/11/2026)

Las frases de NeonBoy y las conversaciones ambientales se muestran en una tarjeta lateral derecha, independiente de las acciones centrales. Conservan el texto completo, el nombre del personaje y el control para omitir las charlas. La tarjeta respeta el alto medido de los controles táctiles. Se comprobó también la frase más larga de los personajes para evitar solapamientos con las vidas.

El inicio utiliza el alto disponible de la pantalla: logo, escena de NeonBoy, Continuar/Nueva partida, privacidad y resumen del guardado. La confirmación de Nueva partida aparece en un diálogo modal, sin desplazar la página; Cancelar y Escape conservan la partida y devuelven el foco al botón. El borrado de datos usa el mismo diseño. Se eliminaron los botones duplicados de carga/reinicio y la tarjeta inferior extensa.

Validación: 93 pruebas unitarias y nueve de navegador aprobadas. Inicio/confirmación sin scroll comprobados en 915×412, 867×388, 740×360, 640×320, 390×844, 360×640 y 1280×720. Recorrido inicial y ayudas de juego siguen pasando sus pruebas. Build web, sincronización Capacitor, APK y AAB correctos.

Versión `1.0.8`, `versionCode 9`: `release-assets/neonboy-halloween-v1.0.8-debug.apk` y `release-assets/neonboy-halloween-v1.0.8-play.aab`. AAB firmado y verificado, sin publicar. APK instalado en **NeonBoy_AOSP_API_36** conservando el guardado. En la WebView de 867×388 se verificaron cero scroll, confirmación visible, cancelación sin cambios al guardado y la frase real «Año 1999... ¿Otra vez?» a la derecha sin superposición con vidas ni controles. Capturas en `tmp/halloween-android-start-108.png`, `tmp/halloween-android-confirm-108.png` y `tmp/halloween-android-caption-108.png`. Sin medición en un dispositivo físico.
