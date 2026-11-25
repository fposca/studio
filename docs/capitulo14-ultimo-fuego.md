# Capítulo 14: El Último Fuego

La reparación se inicia al examinar el Renault Fuego rojo después de vencer al Vigilante. Conserva el automóvil original y los ciudadanos existentes. La victoria anterior no se repite.

## Recorrido

1. Revisar el Fuego frente al Obelisco, en x=-6, z=23. La Desconectada espera a su lado.
2. Buscar la llave junto a Confitería 99. El chip se revela con Visión de Frecuencia en la ciudadana `ba-woman-2`, x=-38, z=-7. La entrega requiere conversación explícita.
3. Examinar la estación de carga en x=-38.4, z=4.5. La identificación digital falla; la ayuda indica el acceso local de mantenimiento. Abrir el compartimiento y recoger la celda.
4. Leer los tres archivos urbanos de Corrientes, en x=-46, -57 y -69; z=-25. El diario conserva las pistas. Introducir CALLE, CIELO, LIBERTAD en la terminal del este del Obelisco (x=15.2, z=16.5) y recoger el módulo.
5. Volver al vehículo. Instalar cada pieza desde su panel o desde el inventario global. La llave enciende el tablero, la celda activa los propulsores y el módulo habilita el panel independiente.
6. Leer el registro oculto del Neon Recording Studio, año 1999. Al terminar se marca como visto y no se repite en las partidas cargadas.
7. Iniciar el sistema de vuelo. Se encienden los faros, el auto vibra, sube unos centímetros y se estabiliza. Las pantallas muestran la alerta de la Red; los ciudadanos cercanos se detienen durante tres segundos. Los otros vehículos voladores conservan sus rutas.

## Objetos y recursos

Los tres repuestos son geometrías Three.js: llave con hoja, cabezal, chip y anillo; celda con carcasa, conectores y núcleo cian; módulo con placa, circuitos violetas y conectores. Se comparten geometrías y materiales. Sus modelos usan 11, 16 y 30 mallas, respectivamente.

Se agregaron dos terminales compactas con puerta articulada, tres placas de pistas, indicadores de tablero, propulsores, faros y navegación. El inventario usa iconos SVG livianos. No se agregaron GLB, modelos Meshy, luces con sombras, render loops ni assets externos. Los diálogos nuevos son texto; no se inventaron archivos de audio.

## Inventario y persistencia

IDs: `fuego_key`, `fuego_power_cell`, `fuego_navigation_module`. Se derivan del progreso global existente, sin inventario paralelo. Tras instalar una pieza, su entrada permanece con estado usado/instalado. No se duplica al repetir interacciones y no se puede instalar lejos del auto.

El mismo guardado global conserva inicio, descubrimiento del chip, recogida de cada pieza, acceso local, pistas y secuencia, instalaciones, registro visto y encendido. Los eventos de la nueva misión se guardan inmediatamente para resistir una recarga antes del autoguardado habitual. Las partidas antiguas mantienen transmisores, victoria y conocimiento del registro anterior; la fuga requiere ahora reparar el Fuego.

`escapeUnlocked` depende de `fuegoPowered`. El encendido por sí solo no completa el capítulo: ahora conduce a la [Fuga de la Red](capitulo14-fuga-de-la-red.md). Una recarga a mitad del registro lo reanuda hasta terminar; una recarga después de leerlo no lo repite.

## Archivos de esta implementación

Nuevos:
- `src/game/buenosAiresFuegoQuest.js`: estados, normalización, eventos y contadores.
- `src/game/buenosAiresFuegoLayout.js`: posiciones y pistas.
- `src/game/buenosAiresFuegoScene.js`: objetos, terminales, chip, alertas y colisiones.
- `src/game/buenosAiresFuegoArt.js` y `buenosAiresFuegoIcons.js`: geometrías, acoplamientos e iconos.
- `src/game/BuenosAiresFuegoPanel.jsx` y `buenosAiresFuego.css`: paneles de mantenimiento y reparación adaptados a tacto.
- `src/game/buenosAiresFuegoQuest.test.js` y pruebas `tests/game/buenos-aires-fuego*.spec.js`.
- `tests/game/citySession.js`: fixture compartido de partidas del capítulo.

Integrados/modificados:
- `DiscographyStore.jsx`, `RecordStoreScene.jsx`: eventos, diálogos, controles, diario e interfaz.
- `buenosAiresQuest.js`, `buenosAiresDialogues.js`: continuidad de misión y conversaciones.
- `universeInventory.js`, `UniverseInventory.jsx`: piezas y acciones contextuales.
- `buenosAiresScenery.js`, `buenosAiresActors.js`: integración con la ciudad y NPC existentes.
- `buenosAiresFlyingVehicles.js`: estacionamiento, acoplamientos y encendido del Fuego original.
- `buenosAiresVigilante.js`: el combate termina sin omitir la reparación.
- Pruebas de inventario, guardado, combate y UI del Vigilante adaptadas a esta continuidad.

## Validación

- 310/310 pruebas de lógica de todos los capítulos: `node --no-opt --test src/game/*.test.js`.
- 10/10 pruebas finales de navegador: recorrido completo con recargas, panel táctil, puntos de recogida/colisiones/limpieza, Matrix sobre objetos dinámicos, reflectores, combate del Vigilante en high/low y partidas antiguas.
- 2/2 pruebas de arte procedural high/low: objetos, compartimientos, puertas, faros y liberación de recursos GPU.
- 2/2 pruebas del vehículo: captura sin Matrix, elevación de unos 0.25 m, pausa y movimiento continuo de los otros autos.
- Sintaxis JavaScript comprobada con `node --check`. Este proyecto usa JavaScript/JSX; no tiene configuración ni compilador TypeScript. No se ejecutó `tsc`.
- Build del juego correcto en 5.95 s con Vite, salida `tmp/fuego-build/`. Comando: `node --max-old-space-size=8192 node_modules/vite/bin/vite.js build --config apps/neonboy-discografia/vite.config.js --configLoader runner --outDir ../../tmp/fuego-build`. Vite advierte un chunk de unos 636 kB; no impide la compilación.
- Registros: `tmp/fuego-unit-results.txt`, `tmp/fuego-browser-results.txt`, `tmp/fuego-build-results.txt`.
- Capturas de interfaz inspeccionadas en escritorio y formato móvil. Los controles táctiles se probaron mediante emulación de navegador; no se midió rendimiento en un Android físico.

## Fase final integrada

La reparación ahora continúa con una fuga aérea jugable en el Fuego original, con la Desconectada, interceptores, integridad del vehículo, reintento y cierre del capítulo 14. Ver [Fuga de la Red](capitulo14-fuga-de-la-red.md) para controles, guardado y validaciones actuales.
