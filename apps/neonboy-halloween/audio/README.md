Las 58 grabaciones entregadas están en `/halloween/`, conservan sus nombres originales y se relacionan con el guion mediante `apps/neonboy-halloween/halloweenVoiceManifest.js`.

Para agregar o reemplazar una frase, colocá un MP3, WAV, OGG o M4A en esta carpeta con el ID exacto del diálogo, por ejemplo `roxy-09.mp3` o `tito-05.wav`. Ese archivo tiene prioridad sobre la grabación de `/halloween/`.

La frase `roxy-09` ("La tienda") todavía no tiene audio; se muestra como subtítulo hasta agregarlo.

Opcionales para los apagones: `electric-buzz.mp3`, `electric-spark.mp3` o `blackout-ambient.mp3`. Se usa el primero disponible.


Extras sobrenaturales de la tienda independiente:

- Los efectos originales PCM16/44,1 kHz estan en `audio/sfx/`. Regeneralos con `python apps/neonboy-halloween/scripts/generate-halloween-sfx.py --force`.
- Las cuatro voces telefonicas existentes se cargan desde `src/assets/neonboy-animaciones/voces/telefono/`. Para reemplazarlas, coloca `telefono-01.mp3` a `telefono-04.mp3` en `apps/neonboy-halloween/audio/phone/`.
- El archivo VHS futuro se busca en `apps/neonboy-halloween/media/anniversary-video.mp4`. Sin ese archivo se muestra un mensaje y no se inicia un video.
- El vinilo de cuatro anos es un agradecimiento interactivo; no carga ni reproduce un tema musical.
- Los GLB comprimidos estan en `apps/neonboy-halloween/models/`; los originales en `src/assets/neonboy-animaciones/` no se modifican.

Juez del Abismo (Halloween): las voces futuras van en `apps/neonboy-halloween/voices/` o `apps/neonboy-halloween/audio/judge/` con los IDs `dialogo-juez-01.mp3` a `dialogo-juez-03.mp3`, `dialogo-juez-victoria-01.mp3` a `03`, `dialogo-juez-derrota-01.mp3` a `03` y `dialogo-juez-final.mp3`. Si no existen, se muestran subtitulos temporizados. Las reacciones opcionales de cada pregunta usan `dialogo-juez-pregunta-N-correcta.mp3` o `dialogo-juez-pregunta-N-incorrecta.mp3`, con N de 1 a 5.

Los diez efectos `boss-*.wav` se generan con `python apps/neonboy-halloween/scripts/generate-halloween-sfx.py` sin sobrescribir WAV existentes.
