# Capítulo 14: Fuga de la Red

## Inicio y continuidad

La fuga se inicia al pulsar E (o el indicador táctil) junto al Renault Fuego rojo, frente al Obelisco: x=-6, z=23. Requiere vencer al Vigilante, instalar llave, celda y módulo de navegación, y terminar de leer el registro de 1999. También puede iniciarse desde el panel de reparaciones, una vez instaladas las tres piezas.

La conversación previa debe terminar antes del despegue. Si un modelo todavía está cargando, una pantalla de preparación espera su disponibilidad y permite volver al auto. No se reinician transmisores, ciudadanos, reparaciones ni la victoria sobre el Vigilante.

## Vuelo y controles

- Duración de una ejecución completa: 180 segundos de simulación.
- 0–9 s: encendido, vibración leve y ascenso del mismo GLB.
- 9–16 s: despegue hacia el corredor aéreo; alertas y sincronización breve de la ciudad.
- 16–52 s: avenida y primeras barreras.
- 52–132 s: interceptores y proyectiles.
- 132–164 s: recuperación del archivo de origen.
- 164–180 s: navegación al centro del corredor, distorsión temporal y fundido.

El auto avanza automáticamente. A/D o flechas izquierda/derecha desplazan lateralmente. W/S o flechas arriba/abajo ajustan la altura. F o clic sobre la escena emiten un pulso defensivo. En pantalla hay cuatro botones direccionales y un botón de pulso, con captura de puntero y liberación al cancelar el toque. Pausa y Escape usan la pausa global. Se deshabilitan mapa, inventario y acciones a pie durante el vuelo.

La trayectoria es una elipse continua sobre la ciudad existente, centrada en x=0,z=-5, con semiejes 26 y 62 m; una vuelta dura 33 s. Altura nominal 23.5 m, oscilación suave de 1.4 m, maniobra vertical de ±2 m y lateral de ±3.3 m. Los extremos de maniobra se verifican contra los edificios y el Obelisco ensanchado. Los otros dos automóviles voladores conservan sus rutas por debajo de este corredor. No hay teletransportes entre vueltas.

## Peligros, integridad y reintento

Barreras holográficas bloquean media vía y anuncian el lado seguro 5.5 segundos antes del cruce. Los drones disparan a la posición observada, con 3.2 segundos para desplazarse. El daño es de 20 por barrera y 10 por proyectil, con 1.35 segundos de invulnerabilidad posterior. El Fuego tiene 100 de integridad independiente de los corazones.

El pulso tiene 3.8 segundos de recarga, neutraliza interceptores cercanos durante 3 segundos y elimina proyectiles próximos. No actúa sobre barreras, peatones, transmisores ni el combate terrestre. Al llegar a cero aparece VEHÍCULO INTERCEPTADO. Reintentar vuelve al inicio de la persecución (segundo 16) con 100 de integridad. Volver a la ciudad devuelve el Fuego y los personajes a su estado terrestre.

## Pasajeros y recursos

Se toma control del grupo existente `renault-fuego`, que utiliza `src/assets/neonboy-animaciones/auto-volador-renault-fuego.game.glb`. El administrador ambiental deja de moverlo mientras la fuga lo posee y lo recupera al salir.

Se trasladan los grupos reales de NeonBoy y `ba-disconnected` al vehículo, sin clones permanentes. El modelo no incluye una cabina preparada ni animaciones sentadas: se usan cámaras exteriores y los pasajeros permanecen ocluidos dentro de la carrocería. Sus padres, transformaciones y visibilidad originales se restauran antes de liberar recursos. La Desconectada se prioriza dentro del presupuesto LOD existente durante el embarque.

Drones, barreras, anillos y filamentos son geometrías Three.js compartidas. No se agregan GLB, MP3, físicas complejas, luces con sombras ni render loops. Los textos de vuelo no interrumpen la simulación y aparecen a un costado.

| Perfil | Drones visibles máximos | Capacidad de proyectiles | Partículas temporales |
| --- | ---: | ---: | ---: |
| Bajo | 2 | 4 | 16 |
| Medio | 3 | 6 | 28 |
| Alto | 3 | 8 | 40 |

Se reutiliza el selector y adaptador de calidad existente. El HUD recibe cambios como máximo cada 200 ms, además de eventos explícitos; no usa estado React por frame. El avance usa delta time acotado, y cámara y balanceo usan amortiguación exponencial. No se actualiza la simulación al pausar u ocultar la pestaña.

## Registro, guardado y capítulo siguiente

El archivo reutiliza a bajo volumen el mismo pulso e interferencia del analizador del estudio, compartido ahora en `studioSignalAudio.js`; no se crea un archivo de audio nuevo.

La señal recuperada identifica NEON RECORDING STUDIO, AÑO 1999, SEÑAL ORIGINAL — DATOS CORRUPTOS. La conversación confirma que alguien manipuló una grabación, sin revelar al responsable.

Los eventos se guardan inmediatamente en el mismo sistema global. Flags agregados:

- `fuegoFlightUnlocked`, `fuegoFlightStarted`.
- `originTransmissionRecovered`, `fuegoChaseCompleted`.
- `temporalJumpUnlocked`, `completed`.
- `nextDestination: "buenos-aires-1999"`.
- `disconnectedFuturePending`, para continuar su historia sin resolver su destino ahora.

No se guarda una posición aérea incompleta: recargar devuelve al estacionamiento, manteniendo todos los avances permanentes. Terminar permite repetir la fuga voluntariamente. El cierre muestra CAPÍTULO 14 COMPLETADO / SIGUIENTE DESTINO: BUENOS AIRES — 1999 / EL ORIGEN DE LA SEÑAL — PRÓXIMAMENTE. No se registra ni se intenta cargar una escena 15 inexistente.

## Archivos

Nuevos: `buenosAiresEscapeLogic.js`, `buenosAiresEscapeScene.js`, `buenosAiresEscapeEffects.js`, `BuenosAiresEscapeHud.jsx`, `buenosAiresEscape.css`, `buenosAiresEscape.test.js`, `studioSignalAudio.js`, `studioSignalAudio.test.js` y `tests/game/buenos-aires-escape.spec.js`.

Integración: `RecordStoreScene.jsx`, `DiscographyStore.jsx`, `buenosAiresFlyingVehicles.js`, `buenosAiresActors.js`, `buenosAiresScenery.js`, `buenosAiresFuegoScene.js`, `buenosAiresFuegoQuest.js`, `buenosAiresQuest.js`, `buenosAiresDialogues.js`, `BuenosAiresFuegoPanel.jsx` y `StudioSignalAnalyzer.jsx`. Se actualizan las pruebas anteriores que asumían que el capítulo aún no tenía final.

## Validaciones

- 319/319 pruebas unitarias del juego: `node --no-opt --test src/game/*.test.js`. Incluyen rutas y márgenes de maniobra, drones separados de la cámara, simulación a 30/60/120 FPS, daño, defensa, derrota, victoria, persistencia y señal de estudio reversible.
- JavaScript comprobado con `node --check`; JSX compilado por Vite. El proyecto utiliza JS/JSX y no tiene configuración ni compilador TypeScript: no se ejecutó `tsc`.
- Build correcto en 3.99 s: `node --max-old-space-size=8192 node_modules/vite/bin/vite.js build --config apps/neonboy-discografia/vite.config.js --configLoader runner --outDir ../../tmp/escape-build`.
- Registros: `tmp/escape-unit-tests.log`, `tmp/escape-build.log`.
- 5/5 pruebas de navegador: embarque, movimiento, pulso, pausa, cancelación, recarga, derrota, reintento, recorrido completo, final persistente, controles táctiles y reparación completa con inventario y recargas. Sin errores JavaScript en estos recorridos.
- Emulación Android con gestos táctiles reales de Chromium, UA Android, 4 GB/4 núcleos declarados; el perfil inicial bajo se adaptó a medio. Muestra de 90 frames: 59.34 FPS en el equipo de escritorio. Tamaños comprobados: 844×390, 640×360 y 390×844. Esta cifra no representa rendimiento medido en un teléfono.
- Después del ajuste final del pulso y del giro: 2/2 comprobaciones adicionales de escritorio/móvil y 9/9 pruebas focalizadas de vuelo/audio. Build definitivo recompilado correctamente.
- Capturas inspeccionadas y conservadas en `tmp/escape-validation/`.
- Vite conserva la advertencia de chunk mayor a 500 kB (`RecordStoreScene`, aproximadamente 646 kB); el build termina correctamente.
- Servidor de desarrollo disponible en `http://127.0.0.1:5174/`.
- La emulación táctil de navegador no sustituye una medición en un Android físico de gama media.

## Mejora visual y manejo asistido

Los interceptores incorporan carcasa biselada de titanio, vientre de carbono, turbinas con rotores, sensores, ventilaciones y luces de estado. Las piezas estáticas se fusionan por material y se comparten entre los drones. Los interceptores neutralizados permanecen visibles con motores atenuados.

Los disparos usan un núcleo de plasma, halo y estela corta. El pulso del Fuego genera una onda de ionización y un escudo local de baja opacidad. Las barreras tienen emisores, contornos luminosos, retícula hexagonal, barrido de energía y una onda localizada donde impacta el vehículo. Las balizas cian señalan el carril libre.

Al soltar la dirección se frena inmediatamente el desplazamiento lateral o vertical; invertir la dirección responde desde el primer frame. La cámara y el balanceo mantienen su suavizado. Las barreras dejan un paso más amplio y los proyectiles tienen una zona de contacto algo menor. La fuga aún requiere esquivar y usar la defensa.

Los efectos reutilizan un conjunto fijo de recursos y una textura radial de 32×32. No agregan luces dinámicas, sombras, posprocesado ni bucles de render. Las chispas de impacto tienen un máximo de 12 en perfil bajo y 24 en los demás. El movimiento reducido suprime chispas y giros decorativos y atenúa el escudo.

Validación del ajuste: 12/12 pruebas focalizadas de vuelo, incluida frenada al soltar controles, inversión inmediata, cruce desde el extremo bloqueado, invariancia a 30/60/120 FPS y liberación de recursos. La geometría interna global de Three.js usada por los sprites se conserva; la factoría libera solamente los recursos que creó. Vista aislada WebGL sin errores de shaders: `tmp/escape-effects-review/assemblies.png`.

Se corrigió además el eje lateral respecto de la cámara: D/derecha desplaza hacia la derecha visible; A/izquierda, hacia la izquierda. El balanceo, las posiciones de barreras y las balizas respetan la misma convención. Una prueba proyecta la maniobra y el carril seguro en pantalla a lo largo de toda la ruta.

Validación final: 3/3 pruebas de navegador para derrota, reintento, fuga completa, guardado y controles; después de corregir los ejes, 2/2 verificaciones adicionales de teclado, esquiva sin daño y controles táctiles. Emulación Android final: 60 FPS durante 90 frames sobre el equipo de escritorio, sin afirmar rendimiento en un teléfono físico. Build correcto en 3.57 s, salida `tmp/escape-effects-build/`; continúa la advertencia previa de chunk grande (RecordStoreScene: 654.77 kB). Registros: `tmp/escape-effects-browser.log`, `tmp/escape-effects-final-browser.log` y `tmp/escape-effects-build.log`. Captura de orientación corregida: `tmp/escape-effects-review/barrier-screen-direction.png`.

## Sonidos del vuelo y nuevo corredor temporal

`buenosAiresEscapeAudio.js` genera y reutiliza sonidos propios para el pulso del Renault, disparos de drones, choque con barreras y golpes de proyectil. Los drones tienen posicionamiento estéreo izquierdo/derecho. El viaje temporal tiene una entrada ascendente, una base continua que gana velocidad y una salida que se apaga antes del cierre. Se conserva la señal original del estudio dentro del mismo contexto de audio del vuelo.

Los sonidos responden a los contadores y proyectiles reales de la simulación: una acción rechazada por recarga no dispara audio y un impacto no se repite por frame. El contexto se habilita con el gesto de iniciar el vuelo. La pausa y la pestaña oculta suspenden también el audio; salir o reintentar detiene las fuentes anteriores. Hay un máximo de seis voces simultáneas, compresor de salida y buffers precalculados, sin archivos de sonido adicionales.

`buenosAiresTimeTunnel.js` reemplaza los siete anillos anteriores con una membrana interior de plasma, arcos de luz instanciados, un horizonte temporal y un lote de estelas. Se alinea con la cámara, conserva la trayectoria real del vehículo y entra gradualmente durante 2.1 segundos. La ciudad queda envuelta por el corredor y el cierre utiliza el fundido existente. El modo de movimiento reducido elimina estelas y ralentiza el desplazamiento decorativo.

| Perfil | Arcos | Estelas | Llamadas de dibujo del túnel |
| --- | ---: | ---: | ---: |
| Bajo | 8 | 24 | 4 |
| Medio | 12 | 48 | 4 |
| Alto | 18 | 80 | 4 |

No agrega luces, sombras dinámicas, posprocesado ni render loops. Las geometrías, materiales y recursos de instancias se liberan al salir de la escena.

Pruebas focalizadas: 21/21, incluyendo señales audibles finitas con picos acotados, inicios y finales suaves, disparos sin duplicar, pausa, panorámica estéreo, límite de voces, cierre del viaje, reintentos, entrada visual gradual y perfiles de calidad. Vista WebGL del modelo real del Renault en el túnel: `tmp/escape-time-review/tunnel.png`, sin errores de shaders.

Cuando la entrada del túnel termina, se ocultan las ramas del escenario exterior conservando el Fuego, los efectos y las luces que lo iluminan. El estado de visibilidad original se restaura al salir o reintentar. Así los edificios no aparecen dentro del horizonte temporal ni atraviesan las paredes del corredor.

El audio atiende `visibilitychange` directamente: suspende el contexto aunque el navegador haya detenido `requestAnimationFrame`, y conserva la pausa manual al volver a la pestaña. Ambas situaciones tienen pruebas específicas.

Validación final del audio y túnel: 2/2 pruebas de navegador completas (derrota, reintento, viaje temporal, guardado y controles táctiles), sin errores de ejecución. Se verifican los sonidos de barrera, drones, pulso y entrada/salida temporal, el cierre de todas las voces y la suspensión al pausar. La captura `tmp/escape-time-review/temporal.png` confirma el Renault dentro del corredor sin edificios visibles. Emulación táctil Android: aproximadamente 60 FPS durante 90 frames en escritorio; no es una medición en teléfono físico. Build correcto en 4.25 s, salida `tmp/escape-time-build/`, con la advertencia existente de chunks mayores de 500 kB. Registros: `tmp/escape-time-final-browser.log` y `tmp/escape-time-build.log`.
