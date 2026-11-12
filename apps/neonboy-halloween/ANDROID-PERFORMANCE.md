# Rendimiento de Halloween Android

La edición Android usa el mismo contenido y guardado local. La calidad gráfica se configura desde **Gráficos** durante la partida; el modo Automática es el predeterminado. El interruptor **Mostrar FPS** enseña FPS, tiempo medio de cuadro, llamadas de dibujo, triángulos y resolución interna. Estas preferencias usan `neonboy.halloween.graphics.v1` en `localStorage`, separadas de la partida.

## Auditoría y cambios

- En la tienda se observaron 961 llamadas de dibujo en Chrome a 740×390 CSS px y calidad Media, antes de instanciar decoración. Se fusionaron 287 cajas estáticas repetidas sin tocar portadas clicables, personajes ni piezas móviles. En la misma vista y perfil se observaron 770 llamadas después. El visor de prueba usó SwiftShader; sus FPS no representan un teléfono.
- Los cuatro modelos Android `demonioFinal`, `demonio-matrix`, `reemplazo-freddy-respirar` y `reemplazo-jason-respirar` tenían cada uno un mapa metálico/rugosidad de 4096×4096. `gltf-transform inspect` estima 89,48 MB de memoria GPU por mapa. Las variantes `.android.glb` usan 1024×1024 (5,59 MB estimados por mapa), manteniendo mapas de color y normales de 2048×2048, geometría y animaciones. Reducción estimada conjunta de esos cuatro mapas: 335,56 MB; **no es una medición de memoria física del teléfono**. Los GLB `.mobile.glb` originales se conservan y la sustitución se aplica solo al bundle Android.
- El bundle web de Android medido pasó de 65,99 a 63,61 MiB. La reducción de transferencia es menor que la reducción estimada de texturas descomprimidas.
- La carga GLB limita a cuatro decodificaciones concurrentes para evitar picos. La búsqueda completa de texturas y materiales de Visión Matrix termina al quedar listos los assets; cada montaje asíncrono registra los nuevos objetos por separado.
- Los perfiles limitan resolución interna, sombras, luces de relleno, densidad de partículas del jefe, frecuencia del reflejo y distancia de render. Las transiciones automáticas usan FPS reales de varias muestras, calentamiento e histéresis. Los objetivos de 30/60 FPS no son garantías.
- Al ocultar la app se suspende la simulación 3D y se pausa el reproductor YouTube activo. El guardado automático existente sigue funcionando al ocultar la página.
- Detrás de paneles y del reproductor YouTube, la escena 3D se actualiza como máximo 12 veces por segundo; los vídeos y la interfaz conservan su propia frecuencia. Las cinemáticas del jefe no usan esta limitación.
- `AndroidManifest.xml`, identificador `ar.com.neonboy.halloween`, firma y política de privacidad no se modificaron. No se añadieron servicios externos.

## Validación pendiente en un Galaxy A53

No había dispositivo conectado por ADB. En un teléfono, activar **Mostrar FPS** y probar durante al menos un minuto en cada caso: tienda normal, Visión Matrix, espejo, combate con el semidemonio, combate final, YouTube abierto y retorno desde segundo plano. Registrar FPS, tirones visibles, temperatura y `adb shell dumpsys meminfo ar.com.neonboy.halloween` tras diez minutos de juego. Repetir con Automática y Media; ajustar los umbrales solo con esos datos.

El bundle web compiló, Capacitor se sincronizó y `assembleDebug` terminó correctamente. No se generó ni publicó un AAB nuevo durante esta optimización.
