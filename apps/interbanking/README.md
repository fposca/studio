# Oficina interactiva de Interbanking

Escena independiente del juego NeonBoy Universe. No carga partidas, misiones ni servicios del juego.

- En el servidor de desarrollo principal (`npm run client`), abrir `http://127.0.0.1:5173/interbanking/`.
- Para trabajar solo en esta escena, ejecutar `npm run dev:interbanking` y abrir `http://127.0.0.1:5176/`.
- Cuando corresponda generar el sitio separado, ejecutar `npm run build:interbanking`. El resultado se escribe en `dist-interbanking/`; se puede subir el contenido a una carpeta `/interbanking/` de un hosting estático.

Controles: WASD o flechas para caminar, Shift para caminar rápido, arrastrar el mouse para mirar, rueda para acercar o alejar la cámara, E para conversar o inspeccionar. También se puede pulsar el botón de interacción que aparece cerca de Roxy, el logo y la cocina.

La oficina se recrea con geometría, materiales e iluminación de Three.js, tomando la fotografía de referencia como guía de distribución. Usa los modelos de Fernando, Victoria y Roxy ya presentes en `src/assets/neonboy-animaciones/`. Los diálogos de esta escena están en `officeDialogue.js`.

La portada permite elegir a Fernando o Victoria, con miniaturas hechas a partir de sus modelos 3D. Las respuestas usan las voces grabadas para cada avatar; Roxy tiene un saludo personalizado para Victoria.

La tecla C o el botón de cámara alternan entre tercera y primera persona para ambos avatares. En primera persona, arrastrar el mouse cambia la dirección de la mirada.

Alfredo, seguridad del edificio, espera en la misma zona que Roxy, a unos pasos de distancia y responde tres preguntas sobre una evacuación. Sus indicaciones son ilustrativas para la demo; antes de usarlas como capacitación deben reemplazarse por el protocolo real del edificio.
