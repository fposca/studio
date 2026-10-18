# NeonBoy Music: tienda independiente

Esta entrada compila sólo la tienda de discos 3D. No carga los editores de Neon Studio ni los niveles del juego. Se mantiene el código fuente de la tienda en `src/game` para que la versión integrada y la independiente compartan las mismas mejoras.

Desde la raíz del repositorio:

- `npm run dev:discografia` abre la tienda en `http://127.0.0.1:5174/`.
- `npm run build:discografia` genera `dist-discografia/`.
- `npm run preview:discografia` permite revisar ese build en `http://127.0.0.1:4174/`.

Para publicarla, subí **sólo el contenido de `dist-discografia/`** a un hosting estático. El sitio no necesita el servidor, el editor ni el resto de Neon Studio. Los videos de YouTube siguen necesitando conexión a Internet y algunos navegadores pueden pedir una interacción antes de reproducir sonido.

## Neon Recording Studio (vista previa)

En desarrollo, el estudio se puede abrir desde el edificio central del mapa con M. El estado de desbloqueo permanente sigue bloqueado. Para incluir el acceso de prueba en un build, ejecutá `VITE_RECORDING_STUDIO_PREVIEW=true npm run build:discografia` (en PowerShell: `$env:VITE_RECORDING_STUDIO_PREVIEW = "true"` y después `npm run build:discografia`). Para ocultarlo también en desarrollo, usá `VITE_RECORDING_STUDIO_PREVIEW=false`.

## Modelos Meshy del estudio

Colocá los seis GLB con estos nombres exactos en `src/assets/neonboy-animaciones/estudio-musica/`:

- `studio_mixing_console.glb`
- `studio_monitor.glb` (se usa dos veces)
- `studio_chair.glb`
- `studio_pc_1999.glb`
- `studio_guitar_amp.glb`
- `studio_vocal_mic.glb`

Los seis archivos ya están en esa carpeta. Si falta alguno o no carga, queda visible su objeto provisional. El rack se genera con geometría del proyecto.

En desarrollo, entrá al estudio y pulsá **Ajustar modelos** arriba a la derecha. Elegí un objeto y cambiá su posición X/Y/Z, rotación X/Y/Z (grados) o escala; el cambio aparece al instante. **Guardar aquí** conserva el ajuste en este navegador. **Copiar JSON** y **Descargar JSON** exportan todos los valores. Para incorporarlos al proyecto y al build, reemplazá `src/game/studioAssetTransforms.json` con el JSON descargado (o pegá el copiado) y volvé a compilar. **Restablecer** borra el ajuste local y vuelve a los valores del archivo. Conviene mantener los modelos cerca de su ubicación inicial para conservar la alineación con las colisiones y las zonas de interacción.
