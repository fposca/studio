# VÉRTICE — oficina corporativa 3D

Esta aplicación es independiente de NeonBoy Universe. La landing y la demo importan el mismo `OfficeApp.jsx` y la misma `OfficeScene.jsx`; al modificar la oficina, el siguiente build comercial refleja el cambio. La separación futura puede hacerse sustituyendo esa importación por una versión fijada. La marca de plataforma (provisional) y la empresa ficticia NEXORA están centralizadas en `branding/brand.js`.

## Desarrollo y build

- `npm run dev:interbanking` — landing en `http://127.0.0.1:5176/`.
- `node apps/interbanking/server/index.mjs` — API local en puerto 8787. Vite envía `/api` a ese puerto.
- `npm run build:interbanking` — sitio estático en `dist-interbanking/`.
- `npm run preview:interbanking` — previsualización del build.

El sitio puede publicarse en la raíz o en una subcarpeta. Debe haber una ruta de servidor para `POST /api/contact` en el mismo dominio. Subir solo `dist-interbanking/` **no habilita el formulario**. El endpoint actual valida datos, usa honeypot y limita intentos por IP, pero responde 503 hasta elegir y configurar un proveedor de correo. No afirma que se envió ningún mensaje si no existe el envío real. El destinatario y las credenciales deben configurarse solo en el entorno privado del servidor; nunca como variables `VITE_*` ni en archivos públicos. Para producción con varias instancias, mover el límite de intentos a un almacenamiento compartido.

La oficina jugable aparece dentro de la landing al llegar a su sección; el botón Ampliar ventana conserva la misma sesión. React/Three.js se carga al acercarse a esa sección y los modelos 3D cuando se inicia el recorrido. Usa los GLB optimizados de `models/`, los retratos de `avatars/` y las voces copiadas a `voices/`. La captura real optimizada de la oficina en `branding/office-preview.webp` se muestra antes de descargar el 3D. El favicon y la vista previa social están en `public/branding/`.

## Interacción

Elegir avatar, iniciar recorrido, caminar con WASD o flechas, arrastrar para mirar, E para conversar/inspeccionar y C para alternar cámara. En móvil hay controles táctiles de desplazamiento y arrastre para mirar. Roxy tiene voces grabadas para Fernando y Victoria. Las indicaciones de Alfredo son ilustrativas y no deben usarse como protocolo real de evacuación.

## Pendiente para publicar el contacto

1. Elegir y autorizar el proveedor de envío de correo o un servidor SMTP propio.
2. Configurar en el servidor un remitente verificado, la credencial del proveedor y el destinatario privado indicado para las consultas. No incorporar esos valores al frontend.
3. Conectar el adaptador de envío del endpoint, probar la recepción real y verificar `Reply-To` con un correo de prueba.
4. Configurar la ruta `/api/contact`, HTTPS y `CONTACT_ALLOWED_ORIGIN` en el hosting. Revisar la política de privacidad del sitio para cubrir las consultas comerciales.
5. Definir el dominio definitivo para usar URL absoluta en `og:image` y actualizar la marca provisional si corresponde.

No se agregó Firebase, autenticación, IA ni base de datos.