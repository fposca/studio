# Catedral de los Condenados — mejoras reactivas

Implementación verificada el 12 de noviembre de 2026. Se conserva la Catedral existente, su distribución, sus colisiones, los modelos optimizados, los diálogos, los acertijos y el sistema de partidas.

Los tres recuerdos tienen colores y activaciones diferentes: coordenadas y partículas cian para la Nave Perdida; runas, dorado/violeta y onda sobre el suelo para el Partenón; fragmentos digitales fucsia para la Realidad Fracturada. Las activaciones duran 2,6 segundos y muestran las frases solicitadas en un aviso que permite seguir caminando. Solo se disparan cuando la lógica del acertijo acepta el recuerdo. Repetir uno recuperado conserva el progreso; elegir otro pendiente fuera de orden mantiene la penalización existente. Visión C sigue siendo necesaria.

El sello muestra de cero a tres símbolos encendidos, grietas discretas con dos recuerdos y tres conexiones de colores al completar el Archivo. La reja se retrae y el paso conserva la condición de navegación existente. Al cargar una partida, se muestra directamente el estado guardado, sin repetir la apertura.

El Custodio conserva sus cinco animaciones: respirar, caminar, hablar, señalar e invocar. Gira suavemente hacia NeonBoy cuando está cerca, tiene una luz facial tenue, halo y partículas. Al señalar, aparece una señal breve en el altar. La invocación se reserva al ritual. El GLB utiliza una sola malla y un material horneado: no se inventaron máscaras para iluminar dibujos de la ropa. Visión C intensifica su presencia y revela las pistas y conexiones; los recuerdos completados conservan su estado al desactivarla.

El altar cambia de brillo con el desbloqueo. Su activación modula la iluminación, añade ondas, runas y un espectro abstracto durante el diálogo. La revelación final oscurece el núcleo, presenta un símbolo, expande una onda y estabiliza la señal antes del panel final. Se mantiene la despedida del Custodio y el destino narrativo «El Trono del Abismo», señalado como próximo; no se intenta abrir una escena inexistente.

Se reutiliza la cámara habitual. El impulso al recuperar un recuerdo es mínimo; el enfoque del altar funciona solo en tercera persona y en su zona, se cancela con entrada del jugador y respeta movimiento reducido. La conversación conserva «Omitir» y la revelación final tiene «Omitir secuencia». Los eventos visuales son transitorios: no agregan flags persistentes ni reproducen cinemáticas al cargar.

**Archivos de implementación de esta entrega**

| Archivo | Cambio |
| --- | --- |
| src/game/DiscographyStore.jsx | Avisos de recuerdos, contador, revelación final, omisión y conexión con el progreso. |
| src/game/RecordStoreScene.jsx | Integra efectos, cámara y calidad adaptable en el bucle existente. |
| src/game/cathedralQuest.js | Interacción idempotente con recuerdos recuperados. |
| src/game/cathedralPresentation.js | Nuevo controlador transitorio de eventos, pausa y omisión. |
| src/game/cathedralResonance.js | Nuevas ondas, glifos, conexiones, sello, espectro, símbolo y presencia del Custodio. |
| src/game/cathedralEnergy.js | Reacción de las esferas a proximidad, progreso y secuencias; presupuestos de efectos. |
| src/game/cathedralArt.js | Capas de polvo, calidad de bruma y sello ligado a recuerdos. |
| src/game/cathedralScenery.js | Iluminación, Custodio, cámara, puerta y coordinación de efectos. |
| src/game/cathedralQuality.js | Reutiliza los presupuestos y el muestreador de calidad existentes. |
| src/game/cathedralAudio.js | Registro opcional de sonidos, prioridad del diálogo y limpieza. |
| src/game/cathedral.css | Avisos, omisión y revelación sin destellos rápidos. |
| src/game/chapter10.css | Corrige saltos de línea literales preexistentes que invalidaban una regla CSS de movimiento reducido. |

Se agregaron src/game/cathedralPresentation.test.js, tests/game/cathedral-progression.spec.js y tests/game/support/cathedralProgressProbe.js. Los archivos del Custodio, la narrativa y los audios existentes no se reemplazaron.

**Presupuestos y recursos**

Se mantiene un solo bucle de render. Los efectos usan geometrías preasignadas, materiales y texturas compartidos, THREE.Points y distancias de visibilidad. No se agregaron sombras dinámicas ni postprocesado. Se liberan las geometrías, materiales, texturas, audio y listeners al salir.

| Perfil | Partículas por activación | Polvo ambiental | Bancos de bruma | Distancia de efectos |
| --- | ---: | ---: | ---: | ---: |
| Alto | 40 | 99 | 10 | 40 |
| Medio | 30 | 72 | 6 | 24 |
| Bajo | 11 | 27 | 2 | 15 |

La resolución y los halos también se ajustan. El perfil inicial usa las características disponibles del dispositivo y el muestreador existente puede reducir calidad. Estos presupuestos se comprobaron por código y en Chrome; no son una medición de FPS en Android.

**Validación realizada**

- 247 pruebas de lógica aprobadas: node --no-opt --test src/game/*.test.js.
- 10 pruebas de navegador aprobadas en cathedral.spec.js, cathedral-energy.spec.js y cathedral-progression.spec.js.
- Cobertura de entrada desde el capítulo 11, controles táctiles, diálogos y gestos del Custodio, Visión C, recuerdos sin duplicación, movimiento durante el aviso, recarga sin repetición, sello 0/1/2/3, cámara y omisión, final sin MP3 y mapa del próximo capítulo.
- Efectos WebGL comprobados con y sin movimiento reducido; la prueba de liberación del módulo de energía devuelve cero geometrías y cero texturas propias pendientes.
- Capturas revisadas del Archivo normal, Visión C, recuperación del primer y tercer recuerdo y altar completado. Sin errores de consola en estas verificaciones.
- Build web aprobado: node --max-old-space-size=8192 node_modules/vite/bin/vite.js build --config apps/neonboy-discografia/vite.config.js --configLoader runner.
- Salida actualizada: dist-discografia/. También se cargó el Archivo y se activó Visión C desde esa salida compilada, sin errores.
- La sección usa JavaScript/JSX. No tiene una comprobación TypeScript configurada; no se presenta el build de Vite como una validación de tipos.
- Vite conserva el aviso de tamaño del archivo JavaScript principal, de aproximadamente 2 MB antes de gzip. La advertencia de sintaxis CSS quedó corregida.

**Recursos y comprobaciones pendientes**

Los archivos opcionales se buscan en src/assets/neonboy-animaciones/voces/catedral/ al compilar. Actualmente no están presentes. Los identificadores preparados son:

- ambiente-catedral, viento-catedral, resonancia-dimensional.
- pulso-recuerdo, activacion-sello, apertura-puerta.
- activacion-altar, interferencia-transmision.
- primera-voz-guitarra.mp3, utilizado por el registro de diálogo existente cuando se incorpore.

Los efectos admiten MP3, WAV u OGG; las voces y la guitarra conservan el registro MP3 existente. No se generó música ni se solicitan rutas de audio inexistentes. Se reutilizan los efectos sintéticos del gestor de sonido para los pulsos disponibles. El ambiente opcional baja durante los diálogos y el audio se pausa al ocultar la pestaña.

Queda medir FPS, temperatura, memoria y fluidez en dispositivos Android físicos. La emulación táctil y las pruebas de presupuesto no sustituyen esa comprobación. También queda evaluar por separado la división del JavaScript principal y los assets de otros capítulos si se necesita reducir la descarga completa.
