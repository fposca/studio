# NeonBoy Music: edicion Halloween

Esta aplicacion abre directamente la tienda de discos original. Incluye los 13 discos, la rockola y conversaciones con los siete personajes de la tienda. No carga el menu ni los otros niveles de NeonBoy Universe. La tecla **C** (o el boton **VISION C**) activa y desactiva codigo animado directamente sobre las superficies 3D, incluidos el piso, los muebles y los personajes. Al desactivarla se recuperan los materiales originales.

## Probar localmente

Desde la raiz del repositorio:

```sh
corepack pnpm run dev:halloween
```

Abrir `http://127.0.0.1:5175/discografia/`.

## Preparar para neonboy.com.ar/discografia/

```sh
corepack pnpm run build:halloween
```

Subir **el contenido** de `dist-halloween/` al directorio publico `/discografia/` del sitio. La compilacion usa la base absoluta `/discografia/`; el servidor debe entregar `index.html` para esa ruta y redirigir `/discografia` a `/discografia/`. La musica y los videos usan los reproductores de YouTube, por lo que requieren conexion a Internet.

La edicion es independiente: no modifica las pantallas ni los estados de la tienda del juego principal.

## Verificar el render independiente

```sh
node --test apps/neonboy-halloween/halloweenRendering.test.js
```

El render, el efecto de codigo y la copia persistente de las texturas procedurales viven en esta carpeta. Los modulos del juego principal se reutilizan sin modificarlos.

## Modelos optimizados para celulares

La edicion Halloween usa siete modelos visibles comprimidos y dos archivos de caminata que solo contienen animacion. Rulo usa `rulo-respira.glb` y gira suavemente para mirar a NeonBoy cuando se acerca. Bones reemplaza a Freddy con `reemplazo-freddy-respirar.glb` y `remplazo-fredy-caminar.glb`; Moloc- reemplaza a Jason con `reemplazo-jason-respirar.glb` y `reemplazo-jason-caminar.glb`. Los identificadores internos, dialogos y sonidos originales siguen conectados.

```sh
corepack pnpm run optimize:halloween-models
corepack pnpm run build:halloween
```

El generador `scripts/optimize-halloween-models.mjs` no modifica los GLB originales de `src/assets/neonboy-animaciones`. El plugin de `apps/neonboy-halloween/vite.config.js` redirige solo esta edicion a las copias moviles. El build debe contener los dos modelos `reemplazo-*-respirar.mobile-*.glb` y sus dos caminatas `*.anim.mobile-*.glb`, sin las versiones anteriores de Freddy y Jason.

## Juez del Abismo (solo desarrollo)

Con el servidor local abierto en `/discografia/`, espera a que termine el loader y ejecuta en la consola `window.__neonboyHalloweenDev.startJudge()` para iniciar la aparicion y las cinco preguntas sin derrotar manualmente al primer demonio. Para ir directo al combate usa `window.__neonboyHalloweenDev.startJudgeCombat()`. Durante el combate, `window.__neonboyHalloweenDev.hitJudge()` simula un impacto y `window.__neonboyHalloweenDev.judgeStatus()` muestra fase, vida y vinilo desbloqueado. Estos accesos existen solo en modo DEV; no se incluyen en produccion.


El Juez reutiliza el cuerpo existente para las animaciones de muerte y ataque. El archivo demonFinal-attack.anim.mobile.glb se regenera con node scripts/extract-judge-attack.mjs: conserva el esqueleto y la animacion Punch_Combo sin duplicar el modelo ni las texturas del original de 42 MB. La caida se ejecuta una sola vez; entonces aparece el disco, y su panel se abre solo al recogerlo.

Los efectos de aparicion, plasma, impacto y cenizas usan dos texturas procedurales de 64 x 64 y reservas fijas de particulas (168 en tactil / 280 en escritorio). No agregan luces, postprocesado ni render targets. El ajuste de parpadeo reducido suaviza su movimiento y brillo. Los GLB fuente permanecen intactos.


## Voces del Juez del Abismo

Las 25 grabaciones de `src/assets/neonboy-animaciones/voces/demonio final/` se copiaron a `apps/neonboy-halloween/audio/judge/` con los IDs de cada frase. Se reproducen en orden la presentacion, cada pregunta, su respuesta correcta o incorrecta, el desenlace del juicio y la frase de muerte. El archivo repetido de "Responsabilidad" se incluyo una sola vez. El original y el juego principal permanecen sin cambios.


La aparicion del Juez reproduce `aparecerDemonio.mp3` y su desaparicion, una vez terminada la animacion y el desvanecimiento, reproduce `desapareceDemobio.mp3`. Ambos se enlazan directamente desde la carpeta de voces original; los dos WAV generados anteriores quedan excluidos del empaquetado de Halloween.


## Progresion del final

El Juez del Abismo se desbloquea al mirar el espejo con la Vision Matrix activa despues de derrotar al semidemonio, atender las cuatro llamadas, usar el VHS en la TV y completar al menos un dialogo con los siete personajes. Aparece y se teletransporta solo en el fondo despejado de la tienda. El telefono sigue llamando hasta completar las cuatro conversaciones. La vista del espejo requiere acercarse y tenerlo en el centro de la pantalla; en celular se puede arrastrar para mirar. Al vencer al Juez aparece el vinilo de los cuatro anos; al recogerlo se abre el agradecimiento con opciones para reiniciar o seguir explorando, sin reproducir un tema especial.

El vinilo rosa es un premio adicional: aparece al completar los 27 elementos del Archivo de secretos y vencer al Juez. Se puede seguir explorando la tienda para encontrar los elementos que falten. Esta progresion solo existe en la edicion Halloween.


Las gafas estan dentro de una caja cerrada al fondo izquierdo. La llave se recoge del suelo cerca de la rockola y no depende de Moloc-. El VHS esta escondido al fondo, cerca del guardian de Holy Fire. Para la charla del jefe hay que elegir un tema con Tito, Rulo, Roxy y ambos guardianes, escuchar a Bones y obtener la respuesta de Moloc- tras insistir.
