**NeonBoy Halloween — mensajes ocultos de Visión Matrix**

Implementación exclusiva de apps/neonboy-halloween. El juego principal y sus GLB no se modifican.

Hay 15 mensajes configurados: 4 de control (blanco y negro), 6 de despertar (verde, incluido el final) y 5 demoníacos (rojo). Nunca hay más de 15 caras de cartel visibles: el letrero INSTRUMENTALES tiene dos caras legibles, y la advertencia del demonio y el final son excluyentes.

| ID | Texto | Estilo | Ubicación real |
|---|---|---|---|
| entry | NO DEBISTE ENTRAR | demonic | Entrada, sobre la puerta |
| logo | DESPERTÁ | awakening | A la derecha de NEONBOY MUSIC |
| jukebox | ELEGÍ TU DESTINO | awakening | Franja sobre la pantalla de la rockola |
| new-records | CONSUMÍ | control | Frente de NUEVOS DISCOS, estantería derecha de la entrada |
| promotions | SOS EL PRODUCTO | control | Frente de EDICIONES / 90s, estantería izquierda de la entrada |
| rulo | NO PIENSES | control | SINGLES / NOVEDADES, junto al sector de Rulo |
| advertising | OBEDECÉ | control | Cartel colgante INSTRUMENTALES, ambas caras |
| tv-wall | ABRÍ LOS OJOS | awakening | Pared sobre el puesto del televisor |
| mirror | NO CONFÍES EN TUS OJOS | demonic | Pared sobre el Espejo de las Almas |
| phone | ELLOS ESCUCHAN | demonic | Vidriera junto al mostrador y el teléfono |
| vhs | LA VERDAD FUE GRABADA | awakening | Franja 31 OCT del fondo, detrás de la cinta VHS |
| archive | EL CÓDIGO NO PUEDE / BORRARTE | awakening | Pared izquierda del fondo, zona del archivo y el vinilo |
| mask | LA MÁSCARA MIENTE | demonic | Pared del fondo a la derecha, junto al recorrido del reguetonero |
| demon | NO ES HUMANO | demonic | Sobre el semidemonio al acercarse |
| freedom | ELLOS CONTROLAN LA FRECUENCIA. / VOS CONTROLÁS LA MÚSICA. | awakening | Sobre el puesto de escucha derecho, tras derrotar al demonio |

Para verificar cada mensaje:

1. Abrí la edición Halloween. En desarrollo: npm run dev:halloween y http://127.0.0.1:5175/discografia/.
2. Recogé los anteojos en el pasillo de entrada con E (o el botón táctil de interacción). Activá C / Visión Matrix. Se conservan los 10 segundos de visión y los 20 de recarga.
3. Recorré las ubicaciones de la tabla. Mirá los frentes de las estanterías para los mensajes blancos y levantá la cámara para los murales. Para leerlos cómodamente, acercate a unos 2–4 metros. Los carteles de pared muestran texto solo del lado interior; el colgante se lee por delante y por detrás.
4. Los mensajes aparecen suavemente durante 0,3 segundos. Con movimiento reducido aparecen estables, sin fluctuaciones. Al terminar Matrix desaparecen inmediatamente; las portadas, el logo y los letreros normales deben conservar su aspecto anterior.
5. El descubrimiento es automático: mirá un texto aproximadamente medio segundo. No hace falta E. Requiere Matrix real activa, cercanía (máximo 7,5 m en planta), estar dentro de la cámara y una línea de visión libre de paredes/muebles/decoración sólida de la tienda. Un texto no cuenta dos veces. El registro se detiene en dos mensajes porque son los únicos necesarios para el aniversario; los demás siguen visibles para explorar.
6. Para una prueba rápida, mirá CONSUMÍ y SOS EL PRODUCTO desde el pasillo frente a las dos primeras estanterías. En ARCHIVO 4 AÑOS debe figurar Mensajes ocultos 2/2. Se reutiliza matrix-secret.wav, con avisos separados por un mínimo de cuatro segundos de visión activa; no hay un sonido por cartel ni cambios en el volumen de las canciones.
7. Acercate al reguetonero (menos de 5,5 m) y activá Matrix: NO ES HUMANO debe seguirlo por encima de la cabeza mientras camina. Al derrotarlo desaparece. Las animaciones, colisiones y el escudo del combate siguen usando su lógica existente.
8. Después de derrotarlo, dejá terminar la activación actual. Tras la recarga, activá Matrix de nuevo y mirá la pared sobre el puesto de escucha derecho: aparece ELLOS CONTROLAN LA FRECUENCIA. / VOS CONTROLÁS LA MÚSICA. No abre un diálogo ni detiene la música.
9. El aniversario requiere 20/20 en total: dos mensajes ocultos distintos, las cuatro portadas Matrix (Holy Fire, Glowshine, Gloom y Secrets), los cinco mensajes del espejo, las cuatro llamadas del teléfono, recoger e insertar el VHS, derrotar al semidemonio y reproducir tres temas distintos. Los requisitos anteriores no se omiten. Al completarlos sigue la secuencia de aniversario que ya existía.

Archivos agregados:

- halloweenMatrixMessagesConfig.js: configuración declarativa, anclajes, estilos lógicos y requisito de dos descubrimientos.
- halloweenMatrixMessages.js: texturas persistentes, planos, transición, seguimiento del NPC, visibilidad, raycast espaciado y liberación de recursos.
- halloweenMatrixMessages.test.js: pruebas del ciclo de vida, descubrimiento, oclusión, NPC y final.

Archivos modificados:

- HalloweenStoreScene.jsx: integra los mensajes en el único bucle de renderizado y usa la geometría estática para oclusión.
- halloweenDemonEncounter.js: retira los ocho letreros verdes anteriores; conserva el combate y las formas del NPC.
- halloweenSecretsLogic.js y halloweenSecretsLogic.test.js: agrega dos descubrimientos al desbloqueo existente.
- HalloweenStoreApp.jsx: contador Mensajes ocultos 0/2 y avisos sonoros limitados mediante el callback existente.

Sistemas reutilizados: Visión C y su temporizador, efecto de código, estado de derrota del demonio, registro de secretos, progreso del aniversario, audio matrix-secret, caché de texturas persistentes y el render loop de Halloween. No se generan audios ni se editan modelos originales. No hay nuevas luces, sombras o capas HTML por cartel. Las texturas se crean una sola vez, en la primera activación; cada una tiene 512 px de ancho, o 1024 en los letreros muy anchos y el final. No se asignan texturas si la función está deshabilitada.

Validación automatizada:

- node --test apps/neonboy-halloween/*.test.js
- .tmp/check-halloween-messages.mjs comprueba la escena real, todos los anclajes, los tres estilos, los 10 segundos completos, restauración, oclusión, el final posterior a la derrota y estabilidad del número de texturas en diez alternancias. Usa una sonda temporal del navegador; no agrega controles de depuración al producto.
- La variante --mobile verifica el viewport táctil horizontal. Esta comprobación no sustituye una prueba de rendimiento en un teléfono real.
- Vite compila los módulos JS/JSX existentes para web y Android; assembleDebug genera solo el APK de pruebas.

Entregables de esta versión:

- release-assets/neonboy-halloween-mensajes-matrix-debug.apk
- release-assets/neonboy-halloween-mensajes-matrix-web.zip (contenido listo para /discografia/)

El AAB de Google Play y las claves de firma no se regeneran.

Resultado de esta entrega (03/11/2026): 43 pruebas unitarias aprobadas. Navegador Chrome con WebGL en escritorio y viewport táctil horizontal: 15 anclajes encontrados, 14 mensajes previos al final legibles desde posiciones cercanas sin atravesar geometría sólida, tres estilos visibles, desaparición al finalizar los 10 segundos, progreso real Mensajes ocultos 2/2 y final en la siguiente activación. Diez alternancias sin crecimiento del contador de texturas; cero errores de página/WebGL en ambas ejecuciones. Builds Vite web/Android y Gradle assembleDebug completados; firma APK verificada. Se comprobó que ambos paquetes incluyen la lógica nueva y que el SHA-256 del AAB de Google Play conserva su valor anterior. No había un dispositivo Android conectado a ADB para hacer la prueba nativa; queda la comprobación de rendimiento en un teléfono real.
