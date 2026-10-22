# NeonBoy Music: tienda independiente

Esta entrada compila sólo la tienda de discos 3D. No carga los editores de Neon Studio ni los niveles del juego. Se mantiene el código fuente de la tienda en `src/game` para que la versión integrada y la independiente compartan las mismas mejoras.

Desde la raíz del repositorio:

- `npm run dev:discografia` abre la tienda en `http://127.0.0.1:5174/`.
- `npm run build:discografia` genera `dist-discografia/`.
- `npm run preview:discografia` permite revisar ese build en `http://127.0.0.1:4174/`.

Para publicarla, subí **sólo el contenido de `dist-discografia/`** a un hosting estático. El sitio no necesita el servidor, el editor ni el resto de Neon Studio. Los videos de YouTube siguen necesitando conexión a Internet y algunos navegadores pueden pedir una interacción antes de reproducir sonido.

## Portada, menú y partidas

La app independiente abre en la portada de **NEONBOY UNIVERSE**. Enter o clic lleva al menú principal; **Nueva partida** entra a la tienda, **Continuar** abre el guardado más reciente y **Cargar partida** muestra el autoguardado y tres slots manuales. Durante el juego, **Escape** cierra primero diálogos y paneles; después abre la pausa. Desde la pausa se puede guardar, cargar, abrir el mapa o volver al menú principal. En la web, **Salir** vuelve a la portada.

El guardado usa \`neonboy.universe.saves.v1\` en el almacenamiento local del navegador. Se actualiza tras cambios de progreso y cada siete segundos para conservar la posición. Incluye escenario, posiciones, monedas, diálogos, misiones, fichas, Neon Sessions y desbloqueos. Los tres slots manuales no se sobrescriben al iniciar una partida nueva. Si todavía no hay guardado nuevo, se importa una vez el progreso previo de tienda, estudio y misión. Como todo \`localStorage\`, cada origen (dominio y puerto) tiene sus propias partidas.

Para cambiar el arte de portada, sustituí \`src/assets/neonboy-logo.png\` y \`src/assets/neonboy-animaciones/imagenes/Mapa nocturno de ciudad musical neón.png\`. El montaje y los textos están en \`src/game/NeonUniverseApp.jsx\`; colores, encuadre y animación en \`src/game/neonUniverseApp.css\`. La ruta \`/discografia/?direct=1\` conserva el acceso directo a la escena para herramientas y pruebas.

## Neon Recording Studio

En desarrollo, el estudio se puede abrir desde el edificio central del mapa con M. En producción se desbloquea cuando Tito entrega la cinta de la misión **El máster perdido**. Para incluir acceso de prueba desde el inicio en un build, configurá \`$env:VITE_RECORDING_STUDIO_PREVIEW = "true"\` en PowerShell y después ejecutá \`npm run build:discografia\`. Para ocultar el acceso de prueba en desarrollo, usá \`VITE_RECORDING_STUDIO_PREVIEW=false\`.

## Club de Rock 1999

El edificio del club (arriba a la derecha en el mapa) abre una tercera escena explorable. En desarrollo está habilitado para pruebas, salvo que configures \`VITE_ROCK_CLUB_PREVIEW=false\`. En producción se desbloquea al completar la misión **El máster perdido**; para probarlo sin completar la misión, compilá con \`$env:VITE_ROCK_CLUB_PREVIEW = "true"\` y luego \`npm run build:discografia\` en PowerShell.

La tecla **M** abre el mapa desde el club. Al volver a la tienda o al estudio se conservan el progreso y la posición de cada escena. El club reutiliza los modelos musicales del estudio y los controles de NeonBoy. Acercate a los objetos y pulsá **E** para examinarlos.

## Modelos Meshy del estudio

Los modelos definitivos del estudio están en `src/assets/neonboy-animaciones/estudio-musica/`:

- `studio_mixing_console.glb`
- `studio_monitor.glb` (dos instancias)
- `studio_chair.glb`
- `studio_pc_1999.glb`
- `studio_guitar_amp.glb`
- `studio_vocal_mic.glb`
- `hugo-parado.glb` (incluye su propia animación suave de pie)
- `silla-bateria.glb` (sustituye el banco usado antes en la cabina)

Los seis equipos Meshy conservan sus objetos provisionales si falta el GLB; Hugo y la silla de batería se muestran solo cuando están sus modelos reales. El rack se genera con geometría del proyecto. El estudio también reutiliza `bateria.optimized.glb`, `guitar.glb`, `guitarra-profe.glb` y `demon-guitar.glb` de la biblioteca principal, sin copiarlos. La mesa de PC, los soportes, el sofá y los marcos de discos se construyen con Three.js. Los cuadros usan las carátulas existentes `gloom.jpg`, `holy fire.jpg` y `arcade.jpg`.

## Hugo Mendez y la misión

Hugo está de pie junto a la silla del productor. Acercate y pulsá E, o hacé clic en la tarjeta contextual, para hablar. La conversación reutiliza el panel de la tienda; sus fichas y la misión **Detrás de la mezcla** se guardan en este navegador con la clave `neonboy.recording-studio.progress.v1`. La PC y la consola mantienen sus fichas educativas; no simulan stems ni sesiones de audio. La carpeta de discografía de Hugo reutiliza el reproductor de YouTube de la tienda.

## Discografía de Hugo

Los tres JPG de src/assets/neonboy-animaciones/estudio-musica/ aparecen como cuadros en la pared derecha de la sala de control. Al acercarte pulsá **E** para examinar un disco. La PC de 1999 muestra la carpeta **HUGO MENDEZ — DISCOGRAFÍA** aunque todavía no hayas completado la misión; las sesiones de NeonBoy mantienen su desbloqueo original. Ambos accesos abren la misma vista y un solo reproductor.

El catálogo se edita en src/game/studioHugoCatalog.js. Cada álbum tiene artist, name, cover, year, totalTracks, status y tracks. Las canciones de *El ternero, la vaca y el cosmos* usan los 11 enlaces de YouTube recibidos; los otros dos temas del total declarado de 13 quedan pendientes, sin títulos inventados. **BS AS Overdrive** y **Voodoo Women Blues** muestran sus portadas, a la espera de los datos de sus canciones. El audio se carga sólo al seleccionar un tema y el reproductor se desmonta al cerrar el panel.

En desarrollo, entrá al estudio y pulsá **Ajustar modelos** arriba a la derecha. Elegí un objeto y cambiá su posición X/Y/Z, rotación X/Y/Z (grados) o escala; el cambio aparece al instante. **Guardar aquí** conserva el ajuste en este navegador. **Copiar JSON** y **Descargar JSON** exportan todos los valores. Para incorporarlos al proyecto y al build, reemplazá `src/game/studioAssetTransforms.json` con el JSON descargado (o pegá el copiado) y volvé a compilar. **Restablecer objeto** devuelve solo el objeto seleccionado a su valor inicial; después podés guardar ese cambio. Los ajustes guardados de otros objetos se conservan. Conviene mantener los modelos cerca de su ubicación inicial para conservar la alineación con las colisiones y las zonas de interacción.


## Correccion de instrumentos, movimiento y camaras del recital

Tras completar la prueba de sonido, acercate al escenario o al microfono y pulsa **E: Iniciar recital**. Durante la cancion, **Camara del recital** permite elegir planos automaticos o planos de NeonBoy, John Zool, bateria, publico y orbita 360. **R** termina el recital y devuelve la camara y al jugador a la exploracion.

El montaje automatico cambia de plano cada **2 segundos**. La orbita conserva una velocidad suave y las camaras elegidas manualmente mantienen recorridos mas largos. La opcion de movimiento reducido conserva el plano general estable.

El club tiene niebla ambiental y bancos de humo bajo que se intensifican durante el recital, seis focos moviles y cuatro haces desde el fondo del escenario. Solo el foco frontal original genera sombras. La densidad y el humo se ajustan en src/game/rockClubFog.js; colores y recorridos de luces en src/game/rockClubLighting.js; tiempos y encuadres en src/game/rockClubConcertCamera.js.

En desarrollo aparece **Ajustar recital**. Elegi NeonBoy, John Zool o Revenant para ajustar posicion X/Y/Z, rotacion y escala de su guitarra o bajo. El anclaje inicial es **Cintura** y se puede cambiar a **Ambas manos**. Tambien podes elegir la mano que va al mastil. NeonBoy aparece espejado mientras toca y vuelve a su orientacion normal al terminar. John Zool usa john-zool-playing2.glb y conserva su animacion de espera. Para Lujan, el panel ajusta su posicion en el asiento.

**Pose del personaje** permite seleccionar a NeonBoy, John Zool, Revenant, Lilith o Lujan. Elegi hombro, brazo, antebrazo o mano y gira la articulacion en X/Y/Z con los deslizadores o los campos numericos. Un marcador rosa senala el hueso y la camara se acerca a el. **Rotar en escena** activa un manipulador de rotacion directamente sobre la articulacion; los deslizadores y el manipulador editan los mismos valores. Los ajustes se suman a la animacion del recital; **Restaurar articulacion** y **Restaurar personaje** los eliminan.

Al abrir el editor se congelan la pose y la musica. **Grabar nueva toma** inicia un bucle de la duracion elegida y reanuda el recital. Move los controles de posicion, rotacion o escala del instrumento, o las articulaciones del personaje, durante la grabacion: cada cambio crea un fotograma. **Marcar fotograma** permite agregar uno en el instante actual. **Detener grabacion** guarda la toma en este navegador y la reproduce en bucle. Tambien podes congelar, mover **Tiempo del movimiento**, cargar un fotograma, modificarlo y volver a marcarlo. **Pausar movimiento** detiene la toma sin detener el recital.

**Guardar aqui** conserva los ajustes, las poses y la toma en el navegador. **Descargar poses** exporta rockClubConcertPose.json. **Descargar JSON** exporta la ubicacion de los instrumentos a rockClubConcertTransforms.json; **Descargar movimiento** exporta los fotogramas a rockClubConcertMotion.json. Para incluir estos valores en el juego publicado, reemplaza los archivos de src/game/ con los descargados y volve a compilar. Los ajustes son independientes de las partidas guardadas. El panel de desarrollo no aparece en produccion.
