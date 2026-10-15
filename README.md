# Neon Studio

MVP local para editar imagenes y video desde el navegador.

## Funciones incluidas

- Acceso privado con cuentas creadas por un administrador.
- Editor de imagen con recorte por coordenadas, retoque, rotacion, espejo, cortar/pegar seleccion, cambio de resolucion y exportacion PNG/JPG/WebP.
- Conversion de imagen raster a SVG mediante Potrace.
- Editor de audio con recorte, volumen, normalizacion, fundidos y exportacion MP3/WAV.
- Editor de video con preview, recorte por tiempo, union de multiples videos y exportacion MP4/MOV en H.265 o H.264.
- Backend local con `ffmpeg-static`, sin requerir ffmpeg instalado globalmente.

## Uso

```bash
npm install
npm run dev
```

Abrir `http://127.0.0.1:5173/`.

La API corre en `http://127.0.0.1:5174/`.

## Esqueleto y animacion

Para crear huesos y pesos de piel localmente, instala SkinTokens (requiere una GPU NVIDIA con al menos 14 GB de VRAM):

```powershell
.\scripts\setup-local-rig3d.ps1
```

Reinicia el servidor, selecciona un GLB sin huesos y usa **Crear esqueleto** en las propiedades del objeto. En **Pose del personaje** puedes mover cada hueso; **Guardar keyframe** registra esa pose en el tiempo actual para animarla en la linea de tiempo. El modelo no crea movimientos pregrabados automaticamente.

## Camara cinematografica

En el editor 3D, la pestaña **Camara** ofrece planos, angulos y combinaciones cinematograficas calculadas a partir del tamano del objeto seleccionado. Selecciona dos personajes con Mayus para usar OTS, Two Shot o Face Off con ambos. Los controles de lente, altura, distancia, orbita, punto de mira y transicion se guardan con la escena.

Los presets mueven la camara al seleccionarlos; la transicion suave se reproduce en ese momento. Al elegir un plano en la pestaña **Camara**, el selector inferior de Director cambia a **Camara: [plano]**. Pulsa **Director** para crear y reproducir un movimiento basado en ese plano. Tambien puedes elegir Hollywood u otro estilo en el selector inferior para generar una secuencia de varias tomas.

Para animar una secuencia manual, coloca la linea de tiempo en 0 s y pulsa **Guardar vista** abajo. Avanza a otro tiempo, elige otro plano y vuelve a pulsar **Guardar vista**. El boton **Play** (triangulo, abajo a la izquierda) reproduce las vistas guardadas; durante la reproduccion cambia a **Pausa**.

## Gamer 90s

El entorno **Fabrica** fue reemplazado por **Gamer 90s**: un cuarto 3D con PC 486, monitor CRT con Guybrush saludando en loop, teclado, disquetes, cama, biblioteca y afiches de Doom, Indiana Jones, Maniac Mansion y Monkey Island. Incluye una TV retro sobre su mueble al pie de la cama; el escritorio queda sin silla para agregar una propia. Se elige en **Escena > Entorno**. Conserva el identificador del entorno anterior para abrir los proyectos guardados.

El mobiliario usa roble con veta y relieve a escala: escritorio con cajones y cantos, biblioteca, cama y placard de dos puertas adelantado junto a la pared izquierda. Las cortinas de tela tejida tienen pliegues 3D, costuras, argollas y barral metalico.

La biblioteca incluye novelas, manuales de PC y guias de juegos con tapas, lomos impresos, cantos de papel y desgaste. Los volumenes tienen distintas medidas, algunos se apilan o inclinan, y el estante superior contiene cajas de juegos y CD-ROM.

La cama tiene un acolchado de Monkey Island con estampado de algodon, relleno acolchado, puntadas, ribetes y caida sobre los laterales y los pies. Incluye una vuelta de tela en la cabecera, colchon tapizado y almohada mullida con costuras.

El frente queda abierto y las superficies de las paredes se ocultan al mirar desde afuera para no tapar a los personajes; los afiches y el placard conservan sus sombras. Las pantallas se pausan junto con las animaciones generales. En **Luz del cuarto gamer** se puede elegir Dia, Atardecer o Noche y encender/apagar la luz interior independientemente; las pantallas siguen encendidas. Estos ajustes se guardan con el proyecto y admiten deshacer.

## Space Ship

El antiguo escenario **Patio del castillo** ahora es **Space Ship**: una cabina industrial con mamparos y metal desgastado, esclusas, conductos, ventanas al espacio y un centro de computo con terminales, teclados y racks. Los proyectos guardados con el patio se migran al nuevo escenario al abrirlos.

El neon y los indicadores se animan en loop con el tiempo de la escena. Los hologramas 3D de anatomia, orbitas y navegacion cambian de modo al hacer clic o tocar la proyeccion o su botonera; arrastrar sigue controlando la camara. Volver a aplicar **Space Ship** carga su nueva iluminacion en proyectos anteriores.

## Juego: Neonboy

La pestana **Juego** abre el inicio de **NeonBoy** de noche, con el logo 3D del editor, el subtitulo *Ancient nightmare*, el personaje animado y **Play** para comenzar una nueva partida en el exterior del Partenon. El nivel 1 tambien se juega de noche. La presentacion no avanza el tiempo ni los enemigos. Neonboy HD puede caminar, correr, saltar y atacar con punetazos y patadas; vuelve a reposo al soltar el movimiento. El primer nivel tiene **56 monedas**, cuatro guardianes, siete plataformas movedizas y una ruta de 18 plataformas hasta las nubes y trampas de pinchos y barras giratorias. Las monedas elevadas siguen la ruta de plataformas y requieren saltar; las trampas se pueden saltar o rodear. Hay vida, invulnerabilidad breve tras recibir un golpe, victoria, derrota, pausa y reinicio. Las columnas, paredes, escalones y plataformas tienen colisiones con Rapier.

Antes del menu, una cinematica infernal de 12 segundos muestra a Neonboy con martillo frente al demonio armado con espada. Siete tomas siguen el combate hasta la victoria y el trueno; se puede omitir. Luego aparece el menu nocturno del Partenon.

Cada nivel empieza con una escena tipografica de 3,6 segundos: **NIVEL 01, 02, 03, 04**, nombre del escenario, Helvetica/Arial y planos a 45 grados con tonos arena del Partenon y tipografia negra. **Omitir intro** entra directamente al juego. El reloj, los enemigos y los controles esperan al final de la presentacion; se repite al reiniciar, pero no al continuar una pausa o cargar una partida. Se adapta a celular y respeta la preferencia de movimiento reducido.

Controles: **WASD o flechas** para moverse; mantener **Shift (Mayus) + movimiento** para correr y soltar Shift para volver a caminar; **Espacio** para saltar; **J o clic izquierdo** para golpear con el arma equipada; **K** para patear; **Q/E o arrastrar con boton derecho** para girar la camara; **V** alterna primera/tercera persona para todas las armas; en primera persona, el **mouse apunta desde el inicio**, incluso sin captura del cursor, y **Escape** libera el cursor y pausa; **rueda** acerca la camara en tercera persona; **P/Escape** para pausar. En pantallas tactiles hay joystick, botones de accion y giro de camara arrastrando el escenario. Los botones tienen sus acciones y teclas en el tooltip.

En el menu inicial podes elegir **Nivel 1**, **Nivel 2**, **Nivel 3** o **Nivel 4** y pulsar **Play** para probar ese escenario directamente. El inicio directo comienza con punos y las armas recogibles de ese nivel; no altera la partida guardada.

El escenario admite Dia, Atardecer y Noche. Se puede silenciar y usar pantalla completa. Cambiar de pestana cierra la partida y libera sus recursos; las escenas del editor no se modifican.

**Guardar** conserva manualmente una partida en este navegador: nivel, posicion, vida, monedas recogidas, enemigos, armas, camara e iluminacion. Hay un unico espacio local; guardar otra vez lo reemplaza. **Cargar partida** esta en el inicio, la barra y el menu de pausa; al cargar queda en pausa hasta tocar **Continuar**. **Inicio** vuelve a la presentacion. Cargar, reiniciar o volver al inicio durante una partida pide confirmacion; **Play** no borra el guardado anterior. No hay sincronizacion entre navegadores ni guardado automatico: guarda antes de cerrar o cambiar de pestana. Si se borran los datos del navegador se pierde la partida. Un archivo danado o almacenamiento bloqueado muestra un aviso sin impedir una nueva partida.

La carrera incorpora zancadas alternadas, rodillas flexionadas, balanceo de brazos e inclinacion del torso. El salto distingue despegue, suspension, caida y flexion al aterrizar; tiene una pequena tolerancia al salir de un borde y permite pulsar salto justo antes de tocar el suelo, sin habilitar doble salto.

Si el juego muestra que WebGL 2 no esta disponible, abre `chrome://settings/system`, activa la aceleracion grafica y reinicia Chrome. Podes comprobar el estado de WebGL 2 en `chrome://gpu`. El Estudio 3D libera su contexto grafico al cambiar a otra pestana y lo recupera al volver.

Hay una **espada recogible** en el camino del primer nivel. **1** equipa punos, **2** espada, **3** martillo y **4** hacha y **5** ballesta, siempre que el arma se haya recogido. Tambien se pueden seleccionar desde el inventario tactil. **J/clic** usa el arma equipada; **K** sigue siendo patada. No se cambia de arma en mitad de un golpe. Carrera, salto, patada y punetazo utilizan las animaciones importadas. Los enemigos anticipan sus ataques y tienen una breve recuperacion para poder esquivarlos.

Al derrotar a los guardianes comunes aparece el **Guardian del Partenon** frente al templo: un demonio del doble de altura que Neonboy, con 360 puntos de vida y golpes de 32 de dano. Anticipa sus ataques antes de abalanzarse; su vida y distancia aparecen en el HUD. Hay que derrotarlo para desbloquear el segundo nivel.

**Nivel 2: El santuario de Atenea.** Interior de fantasia del Partenon, con columnas estriadas, marmol, relieves, braseros con fuego animado y niebla baja. Los pilares de los braseros son solidos. El **Platon animado** espera en la entrada y pide recuperar el **Sello de Atenea**. Sus conversaciones y los hallazgos pausan la partida. Hay 28 monedas, cuatro hoplitas que persiguen, dos estatuas que atacan sin desplazarse y **Medusa**, jefa de 420 puntos de vida, que despierta al entrar en la camara del fondo. El sello solo puede recogerse despues de derrotarla; hay que volver con Platon para completar la mision y obtener 500 puntos. Las monedas y los secretos son opcionales en este nivel.

El **martillo** esta junto a las primeras columnas. Su golpe pesado rompe las dos paredes agrietadas de las camaras laterales; sus tesoros dan 250 y 350 puntos extra. Cuatro corazones repartidos por el santuario recuperan 25 puntos de vida, hasta 100, y no se consumen con la vida completa. Espada, martillo y hacha usan los GLB importados. Los personajes nuevos se cargan al entrar al nivel, sus animaciones de ataque se mezclan con reposo/caminata y sus texturas se limitan a 1024 para reducir memoria grafica.

**Nivel 3: El cementerio.** Tiene 42 monedas, siete plataformas para saltar, tres trampas, ocho zombis, tres demonios y un zombi jefe que alterna barrido y golpe aplastante. Dos criptas secretas se abren con el **hacha** y esconden reliquias; tambien hay tumbas con colisiones, pilares de antorcha solidos, fuego animado y niebla. Entre niveles se conservan armas, arma equipada y puntos, y se recupera la vida. Reintentar vuelve al comienzo del nivel con las armas que se tenian al entrar. La ballesta aparece en el nivel 4.

**Nivel 4: Las catacumbas.** Un subterraneo oscuro con nueve enemigos: ocho momias y una momia jefe armada con guadana. Hay 33 monedas, dos recorridos de losas elevadas, cuatro trampas, dos camaras secretas marcadas por runas y tres corazones. La **ballesta** se recoge al entrar y dispara diez flechas; los carcajes recuperan cinco y reaparecen tras 22 segundos. La mira aparece al equiparla y las flechas abren los muros con runas. Platon espera en la entrada y da consejos durante el recorrido.

Guardar conserva tambien la fase de las plataformas, vida del jefe, corazones consumidos, mision de Platon, sello y paredes secretas abiertas. Las partidas anteriores del primer nivel siguen siendo compatibles; las antiguas del cementerio se migran al nivel 3 sin perder progreso. Los guardados antiguos que llamaban "hammer" al hacha se migran solo en la version anterior: el martillo actual es un arma independiente.

El audio usa efectos sintetizados por capas: metal para monedas, aire para ataques, cuerpo grave para impactos y variaciones para evitar repeticiones identicas. Incluye distancia, paneo, limitacion de volumen y sonidos diferenciados de armas, demonios, recogidas y victoria. No requiere descargar audio externo.

Verificacion del juego: `pnpm run test:game` y `pnpm run test:game:browser` (requiere Chrome). La prueba de navegador usa un escenario aislado de desarrollo y guarda capturas en `test-results/`. La fisica usa el [controlador de personajes de Rapier](https://rapier.rs/docs/user_guides/javascript/character_controller/).

## Autenticacion y roles

La web y la aplicacion de escritorio usan Firebase Authentication con email y contrasena. Copia `.env.example` como `.env.local` y completa `VITE_FIREBASE_API_KEY` antes de iniciar o compilar. Por defecto, el desarrollo usa el proyecto Firebase configurado. Para trabajar completamente en local, define `VITE_USE_FIREBASE_EMULATORS=true` y levanta Emulator Suite.

## Alta de usuarios

No existe registro publico. Un administrador crea cada cuenta desde la pestana `Usuarios`; una Cloud Function valida su rol, crea la cuenta y registra el perfil. Firebase envia al nuevo usuario un enlace para definir su contrasena.

Cloud Functions requiere el plan Blaze. Las funciones corren en `southamerica-east1` y validan el rol `admin` antes de crear cuentas o cambiar accesos.

Los permisos se leen desde `users/{uid}` en Cloud Firestore:

- `viewer`: demo web sin herramientas; sin acceso a escritorio.
- `tester`: acceso completo a web y escritorio.
- `admin`: acceso completo y permiso administrativo reservado.

Si el documento no existe, el rol es desconocido o Firestore falla, se usa `viewer`. Los roles se administran desde la pestana `Usuarios` o Firebase Console.

### Preparar el Firebase de la empresa

1. Crea un proyecto Firebase propiedad de la empresa.
2. Habilita solamente Email/Password en Authentication.
3. Copia `.env.example` como `.env.local` y completa los datos del nuevo proyecto.
4. Crea la primera cuenta en Authentication y un documento `users/{uid}` con `role: "admin"`.
5. Ejecuta `firebase use --add` para seleccionar el proyecto corporativo.
6. Publica con `firebase deploy --only firestore:rules,functions`.
7. Elimina las cuentas de prueba desde Authentication y sus documentos en `users`.

## Aplicacion de escritorio

La aplicacion de escritorio procesa imagenes y videos en la PC del usuario. No necesita conectarse a un servidor de Neon Studio.

```bash
pnpm run desktop
```

Para generar el instalador de Windows:

```bash
pnpm run dist:win
```

El instalador se crea en `release/`.

### Publicar la descarga web

1. Ejecuta `pnpm run dist:win`.
2. Crea una nueva version en GitHub Releases.
3. Adjunta `release/Neon-Studio-Setup-Windows.exe` a esa version.

Para publicar una descarga desde la web, configura la URL del instalador antes del build:

```powershell
$env:VITE_WINDOWS_DOWNLOAD_URL = "https://servidor.example/Neon-Studio-Setup-Windows.exe"
pnpm run build
```

### Firma digital

El empaquetado detecta automaticamente un certificado de firma de codigo en formato PFX mediante estas variables de entorno:

```powershell
$env:CSC_LINK = "C:\ruta\certificado.pfx"
$env:CSC_KEY_PASSWORD = "contrasena-del-certificado"
pnpm run dist:win
```

No guardes el certificado ni su contrasena dentro del repositorio. Para reducir las advertencias de SmartScreen, el PFX debe provenir de una autoridad certificadora reconocida y mantenerse vigente.

## Nota de seguridad

El login actual es una restriccion de MVP en frontend. Para produccion conviene reemplazarlo por SSO corporativo o autenticacion backend con sesiones.
