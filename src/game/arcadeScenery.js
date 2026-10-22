import * as THREE from "three";
import { ARCADE_PROPS, arcadeObstacleFor, defaultArcadeTransform } from "./arcadeLayout.js";
import { ARCADE_COLORS, arcadeCanvas, arcadeFloorMaterial, arcadeWallMaterial, arcadeGlowTexture, arcadePoster, arcadeLaminateMaterial, drawArcadeScreen, curvedCrtGeometry } from "./arcadeVisuals.js";
import { dressArcadeRoom, decorateArcadeCounter } from "./arcadeDressing.js";
import { batchArcadeDetails } from "./arcadeGeometryBatch.js";

const PALETTE = ARCADE_COLORS;
const canvasTexture = arcadeCanvas;

function labelTexture(title, subtitle, accent = "#e47fbb") {
  return canvasTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = "#100e1a"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent; ctx.lineWidth = 5; ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.textAlign = "center"; ctx.fillStyle = "#fff0d4";
    ctx.font = "900 43px Arial"; ctx.fillText(title.toUpperCase(), w / 2, 67, w - 32);
    ctx.fillStyle = accent; ctx.font = "700 18px Arial"; ctx.fillText(subtitle.toUpperCase(), w / 2, 101, w - 30);
  }).texture;
}

export function buildArcade(scene, altered = false) {
  const geometry = new Map();
  const colliders = [];
  const slots = new Map();
  const obstacles = [];
  const interactions = [];
  const screenTextures = new Map();
  const materials = {
    wall: arcadeWallMaterial(),
    trim: new THREE.MeshStandardMaterial({ color: 0x241a2c, roughness: .77, metalness: .17 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x82717c, roughness: .42, metalness: .54 }),
    black: new THREE.MeshStandardMaterial({ color: 0x11101b, roughness: .56, metalness: .19 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x1c2e42, roughness: .2, metalness: .38 }),
    pink: new THREE.MeshBasicMaterial({ color: 0xdc539e }),
    red: new THREE.MeshBasicMaterial({ color: 0xd54c66 }),
    blue: new THREE.MeshBasicMaterial({ color: 0x5b9bd8 }),
    green: new THREE.MeshBasicMaterial({ color: 0x8ed89f }),
    warm: new THREE.MeshBasicMaterial({ color: 0xf5cb99 }),
    wood: arcadeLaminateMaterial(),
    paper: new THREE.MeshStandardMaterial({ color: 0xd3c1a0, roughness: .95 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xa98645, metalness: .65, roughness: .38 }),
    tokenBlue: new THREE.MeshStandardMaterial({ color: 0x468ca2, roughness: .58 }),
    tokenPink: new THREE.MeshStandardMaterial({ color: 0x9f4f75, roughness: .58 }),
  };
  const cabinetMaterials = Object.fromEntries(Object.entries(PALETTE).map(([name, [color]]) =>
    [name, new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(.33), roughness: .62, metalness: .22 })]));
  function box(parent, name, w, h, d, x, y, z, material, cameraCollision = false) {
    const key = `${w}/${h}/${d}`;
    if (!geometry.has(key)) geometry.set(key, new THREE.BoxGeometry(w, h, d));
    const mesh = new THREE.Mesh(geometry.get(key), material);
    mesh.name = name; mesh.position.set(x, y, z);
    mesh.castShadow = h > .25; mesh.receiveShadow = true;
    parent.add(mesh);
    if (cameraCollision) colliders.push(mesh);
    return mesh;
  }
  function cylinder(parent, name, radius, height, x, y, z, material) {
    const key = `${radius}/${height}`;
    if (!geometry.has(key)) geometry.set(key, new THREE.CylinderGeometry(radius, radius, height, 10));
    const mesh = new THREE.Mesh(geometry.get(key), material);
    mesh.name = name; mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh);
    return mesh;
  }
  function sign(parent, name, title, subtitle, w, h, x, y, z, accent) {
    const tex = labelTexture(title, subtitle, accent);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    mesh.name = name; mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }
  function slot(prop) {
    const anchor = new THREE.Group(); anchor.name = `arcade-slot:${prop.id}`;
    scene.add(anchor); slots.set(prop.id, anchor); return anchor;
  }
  const glowMap = arcadeGlowTexture();
  const contactMaterial = new THREE.MeshBasicMaterial({ map: glowMap, color: 0x000000, transparent: true, opacity: .72, depthWrite: false });
  const glowMaterials = Object.fromEntries(Object.entries(PALETTE).map(([theme, [color]]) => [theme,
    new THREE.MeshBasicMaterial({ map: glowMap, color, transparent: true, opacity: .12, depthWrite: false, blending: THREE.AdditiveBlending })]));
  const screenGeometry = curvedCrtGeometry(.82, .63);
  const shape = new THREE.Shape();
  const profile = [[-.47,.08],[-.47,2.08],[.44,2.08],[.51,1.87],[.30,1.8],[.49,1.11],[.82,1.02],[.82,.85],[.48,.75],[.48,.08]];
  profile.forEach(([z,y], i) => i ? shape.lineTo(-z,y) : shape.moveTo(-z,y)); shape.closePath();
  const cheekGeometry = new THREE.ExtrudeGeometry(shape, { depth: .065, bevelEnabled: false });
  cheekGeometry.rotateY(Math.PI / 2); cheekGeometry.translate(-.0325, 0, 0);
  function screenMaterial(prop) {
    const entry = canvasTexture(384, 256, (ctx) => drawArcadeScreen(ctx, prop, 0, altered, 0));
    screenTextures.set(prop.id, { ...entry, prop });
    return new THREE.MeshBasicMaterial({ map: entry.texture, toneMapped: false });
  }
  function groundPatch(anchor, width, length, z, material) {
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(width, length), material);
    patch.rotation.x = -Math.PI / 2; patch.position.set(0, .006, z); patch.renderOrder = 1; anchor.add(patch);
  }
  function cable(parent, points, radius = .016) {
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 16, radius, 5, false), materials.black);
    parent.add(tube); return tube;
  }
  function cabinet(prop, anchor) {
    const machine = new THREE.Group(); anchor.add(machine);
    const wide = prop.kind === "shooter" || prop.id === "fight-cabinet";
    machine.scale.x = wide ? 1.25 : 1;
    const shell = cabinetMaterials[prop.theme];
    const sideArt = new THREE.MeshStandardMaterial({ map: arcadePoster(prop.label, "ORIGINAL ARCADE / 99", prop.theme), roughness: .76, metalness: .06 });
    box(machine, `${prop.id}:cabinet`, 1.16, 1.93, .78, 0, 1.02, -.08, shell, true);
    for (const side of [-1, 1]) {
      const cheek = new THREE.Mesh(cheekGeometry, shell); cheek.position.x = side * .60; cheek.castShadow = cheek.receiveShadow = true; machine.add(cheek);
      const art = new THREE.Mesh(new THREE.PlaneGeometry(.70, 1.55), sideArt);
      art.name = prop.id + ":side-art"; art.position.set(side * .635, .91, -.025); art.rotation.y = side * Math.PI / 2; machine.add(art);
      box(machine, "cabinet T molding", .025, 1.50, .028, side * .635, .84, -.49, materials.black);
      for (const y of [.22, 1.97]) {
        const screw = new THREE.Mesh(new THREE.SphereGeometry(.018, 5, 4), materials.steel);
        screw.position.set(side * .636, y, -.37); machine.add(screw);
      }
    }
    box(machine, "lower coin service door", 1.12, .67, .07, 0, .43, .42, materials.black);
    const monitor = new THREE.Group(); monitor.position.set(0, 1.48, .39); monitor.rotation.x = -.16; machine.add(monitor);
    box(monitor, "deep CRT bezel", 1.08, .90, .13, 0, 0, 0, materials.black);
    box(monitor, "CRT inner bevel", .94, .74, .045, 0, 0, .073, materials.trim);
    const screen = new THREE.Mesh(screenGeometry, screenMaterial(prop)); screen.name = prop.id + ":crt"; screen.position.z = .104; monitor.add(screen);
    box(machine, "marquee canopy", 1.18, .28, .22, 0, 1.94, .42, materials.black);
    sign(machine, `${prop.id}:marquee`, prop.label, prop.theme === "frequency" ? "UNKNOWN SYSTEM / 09" : "INSERT COIN / 1999", 1.08, .23, 0, 1.95, .535, PALETTE[prop.theme][0]);
    // Perforated speaker grille below the illuminated marquee.
    for (let i = 0; i < 11; i++) box(machine, "speaker aperture", .043, .023, .014, -.44 + i * .087, 1.785, .46, materials.black);
    const controls = box(machine, "sloped control panel", 1.15, .12, .50, 0, .94, .58, shell); controls.rotation.x = .12;
    box(machine, "control panel wrist rest", 1.17, .065, .08, 0, .92, .83, materials.black);
    if (prop.kind === "shooter") {
      for (const side of [-1, 1]) {
        const gun = new THREE.Group(); gun.position.set(side * .31, 1.025, .61); gun.rotation.x = .12; gun.rotation.y = side * .2; machine.add(gun);
        box(gun, "light gun barrel", .11, .09, .29, 0, .09, -.05, side < 0 ? materials.blue : materials.red);
        box(gun, "light gun grip", .08, .18, .10, 0, -.015, .04, materials.black).rotation.x = -.35;
        box(gun, "optical sensor", .07, .055, .02, 0, .09, -.20, materials.black);
        cable(machine, [[side * .31, 1.01, .74], [side * .43, .38, .88], [side * .45, .29, .50]]);
      }
    } else if (prop.kind !== "racer") {
      for (const player of (wide ? [-.27, .28] : [0])) {
        const stickX = player - (wide ? .13 : .29);
        cylinder(machine, "joystick rubber boot", .066, .025, stickX, 1.025, .61, materials.black);
        cylinder(machine, "joystick shaft", .021, .12, stickX, 1.09, .61, materials.steel);
        const ball = new THREE.Mesh(new THREE.SphereGeometry(.055, 10, 8), player > 0 ? materials.blue : materials.red);
        ball.position.set(stickX, 1.16, .61); machine.add(ball);
        for (let i = 0; i < 6; i++) {
          const x = player + (wide ? -.015 : .03) + i % 3 * (wide ? .073 : .10), z = .55 + Math.floor(i / 3) * .10;
          cylinder(machine, "button bezel", wide ? .032 : .042, .024, x, 1.025, z, materials.black);
          cylinder(machine, "colored button", wide ? .025 : .034, .027, x, 1.043, z, [materials.blue, materials.green, materials.red][i % 3]);
        }
      }
    }
    for (const x of (wide ? [-.22,.22] : [0])) {
      box(machine, "metal coin mechanism", .25, .34, .028, x, .51, .47, materials.steel);
      box(machine, "coin insertion", .12, .019, .02, x, .58, .493, materials.black);
      box(machine, "coin return", .10, .075, .025, x, .42, .496, materials.black);
      box(machine, "red start button", .06, .035, .026, x, .52, .495, materials.red);
    }
    box(machine, "rubber kickplate", 1.20, .11, 1.02, 0, .075, .02, materials.black);
    for (let i = 0; i < 8; i++) box(machine, "lower vent", .055, .018, .015, -.39 + i * .11, .21, .464, materials.steel);
    groundPatch(anchor, wide ? 2.6 : 2.1, 2.1, .16, contactMaterial);
    if (prop.theme !== "broken") groundPatch(anchor, 2.7, 2.5, 1.18, glowMaterials[prop.theme]);
    if (prop.theme === "broken") {
      const card = sign(machine, "service notice", "FUERA DE SERVICIO", "NO INSISTIR", .82, .31, 0, 1.42, .58, "#c0ae8e"); card.rotation.z = -.08;
      for (const x of [-.37,.37]) box(machine, "service tape", .13, .065, .015, x, 1.56, .60, materials.warm);
    }
    if (prop.theme === "frequency") {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), materials.pink);
      lamp.position.set(.46, 2.13, .40); machine.add(lamp); anchor.userData.warningLamp = lamp;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.11, .009, 6, 24), materials.pink);
      ring.position.set(0, .74, .49); machine.add(ring);
      for (const side of [-1,1]) box(machine, "frequency fine edge", .012, 1.25, .015, side * .59, 1.32, .45, materials.pink);
      cable(machine, [[.48,.7,-.45],[.8,.03,-.64],[1.0,.025,-1.2],[.6,.025,-1.6]], .022);
    }
    if (prop.kind === "racer") {
      box(machine, "racer platform", 1.02, .12, 2.2, 0, .1, .55, materials.black, true);
      box(machine, "racing seat cushion", .76, .16, .58, 0, .53, 1.20, shell, true);
      const back = box(machine, "bucket seat back", .77, .79, .16, 0, .98, 1.52, shell, true); back.rotation.x = -.12;
      box(machine, "seat headrest", .42, .20, .14, 0, 1.40, 1.55, materials.black);
      for (const x of [-.34,.34]) box(machine, "seat bolster", .10, .24, .61, x, .63, 1.20, materials.black);
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(.23, .034, 8, 24), materials.black);
      wheel.position.set(0, 1.13, .92); wheel.rotation.x = -.35; machine.add(wheel);
      for (const angle of [0, 2.1, 4.2]) { const spoke = box(machine, "wheel spoke", .036, .40, .026, 0, 1.13, .92, materials.steel); spoke.rotation.z = angle; }
      const hub = new THREE.Mesh(new THREE.SphereGeometry(.075, 10, 8), materials.black); hub.position.copy(wheel.position); machine.add(hub);
      for (const x of [-.14,.14]) box(machine, "accelerator pedal", .13, .035, .23, x, .20, .68, materials.steel).rotation.x = -.35;
    }
  }
  function pinball(prop, anchor) {
    const shell = cabinetMaterials.pinball;
    box(anchor, `${prop.id}:table`, 1.18, .27, 2.12, 0, .87, 0, shell, true);
    for (const x of [-.46, .46]) for (const z of [-.83, .83])
      box(anchor, `${prop.id}:leg`, .12, .75, .12, x, .39, z, materials.steel);
    const art = new THREE.MeshStandardMaterial({ map: arcadePoster(prop.label, "MULTIBALL / BONUS", "pinball"), roughness: .45, metalness: .1 });
    const field = box(anchor, `${prop.id}:playfield`, 1.06, .04, 1.89, 0, 1.035, -.06, art);
    field.rotation.x = -.065;
    for (const [x, z] of [[-.22, -.48], [.22, -.12], [0, .28]]) {
      const bumper = new THREE.Mesh(new THREE.TorusGeometry(.13, .032, 6, 16), materials.pink);
      bumper.rotation.x = Math.PI / 2; bumper.position.set(x, 1.065, z); anchor.add(bumper);
    }
    box(anchor, `${prop.id}:backbox`, 1.17, .86, .21, 0, 1.61, -1.0, shell, true);
    sign(anchor, `${prop.id}:backglass`, prop.label, "MULTIBALL", 1.04, .69, 0, 1.65, -.884, PALETTE.pinball[0]);
    box(anchor, `${prop.id}:coin-slot`, .23, .2, .02, 0, .69, 1.07, materials.steel);
    for (const side of [-1,1]) {
      box(anchor, "pinball polished side rail", .055, .08, 2.17, side * .58, 1.08, 0, materials.steel);
      const flipper = box(anchor, "pinball flipper", .24, .035, .055, side * .17, 1.09, .66, materials.warm); flipper.rotation.y = side * .35;
      cable(anchor, [[side * .45,1.09,.64],[side * .40,1.12,-.45],[side * .19,1.13,-.75]], .015);
    }
    for (let i = 0; i < 12; i++) cylinder(anchor, "pinball playfield lamp", .018, .012, -.40 + (i % 4) * .25, 1.095, -.66 + Math.floor(i / 4) * .38, i % 2 ? materials.blue : materials.pink);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.037, 10, 8), materials.steel); ball.position.set(.23, 1.11, .38); anchor.add(ball);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.05,1.9), new THREE.MeshPhysicalMaterial({ color: 0xc8e0e6, transparent: true, opacity: .11, roughness: .12, depthWrite: false }));
    glass.rotation.x = -Math.PI / 2; glass.position.set(0,1.18,-.06); anchor.add(glass);
    groundPatch(anchor, 2.2, 3.0, 0, contactMaterial);
    groundPatch(anchor, 2.0, 1.6, 1.25, glowMaterials.pinball);
  }
  function counter(prop, anchor) {
    box(anchor, "counter:body", 3.3, .97, 1.15, 0, .49, 0, materials.wood, true);
    box(anchor, "counter:top", 3.55, .12, 1.35, 0, 1.04, 0, materials.wood);
    for (const x of [-1.48, -.75, 0, .75, 1.48]) box(anchor, "counter:flute", .045, .70, .07, x, .52, .62, materials.trim);
    sign(anchor, "counter:front", "FICHAS", "CAMBIO EN MOSTRADOR", 2.45, .42, 0, .56, .626, "#f3b982");
    box(anchor, "counter:register", .64, .38, .48, -.95, 1.28, -.17, materials.black);
    box(anchor, "counter:register-keys", .58, .09, .33, -.95, 1.48, .10, materials.steel);
    for (let i = 0; i < 9; i++) box(anchor, "counter:key", .07, .02, .06, -1.13 + (i % 3) * .16, 1.535, -.02 + Math.floor(i / 3) * .08, materials.warm);
    box(anchor, "counter:token-tray", .53, .09, .35, .73, 1.16, .08, materials.black);
    for (let i = 0; i < 8; i++) cylinder(anchor, "counter:token", .075, .025, .50 + (i % 4) * .14, 1.22, -.02 + Math.floor(i / 4) * .13, materials.brass);
    box(anchor, "counter:stool-leg", .13, .69, .13, 1.1, .36, -.85, materials.steel);
    cylinder(anchor, "counter:stool", .31, .1, 1.1, .75, -.85, materials.wood);
    decorateArcadeCounter(anchor, { box, cylinder, sign, materials });
    groundPatch(anchor, 4.1, 2.0, 0, contactMaterial);
  }
  function staffDoor(prop, anchor) {
    box(anchor, "staff-door:frame", 1.9, 2.55, .25, 0, 1.27, 0, materials.black, true);
    box(anchor, "staff-door:leaf", 1.65, 2.28, .09, 0, 1.18, .14, materials.wood, true);
    box(anchor, "staff-door:handle", .14, .09, .07, -.62, 1.13, .225, materials.steel);
    sign(anchor, "staff-door:sign", "SOLO PERSONAL", "ACCESO CERRADO", 1.42, .35, 0, 1.82, .196, "#f28e94");
  }

  function lounge(anchor) {
    for (const x of [-1.2, 0, 1.2]) {
      cylinder(anchor, "vinyl seat cushion", .29, .10, x, .68, 0, cabinetMaterials.horror);
      cylinder(anchor, "stool center support", .055, .62, x, .33, 0, materials.steel);
      cylinder(anchor, "stool weighted base", .29, .055, x, .035, 0, materials.black);
      const rail = new THREE.Mesh(new THREE.TorusGeometry(.20,.017,5,16), materials.steel); rail.rotation.x = Math.PI/2; rail.position.set(x,.24,0); anchor.add(rail);
    }
    box(anchor, "social wall shelf", 3.2,.09,.30, 0, 1.05, -.58, materials.wood, true);
    for (const x of [-.5,.8]) cylinder(anchor, "social paper cup", .06,.16,x,1.175,-.57,materials.warm);
  }

  // The entrance and rear service area share one continuous, collision-safe floor.
  box(scene, "arcade slab", 22.4, .24, 31.8, 0, -.14, -6.2, materials.black);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(22.1, 31.5), arcadeFloorMaterial());
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -.014, -6.2); floor.receiveShadow = true; scene.add(floor);
  for (const x of [-10.95, 10.95]) {
    box(scene, "arcade worn side wall", .26, 4.65, 31.5, x, 2.32, -6.2, materials.wall, true);
    box(scene, "arcade side wainscot", .08, 1.1, 30.8, x - Math.sign(x) * .16, .65, -6.2, materials.wood);
    box(scene, "arcade side pipe", .08, .08, 30.2, x - Math.sign(x) * .19, 3.52, -6.2, materials.steel);
  }
  box(scene, "arcade entrance wall", 22.1, 4.65, .25, 0, 2.32, 9.48, materials.wall, true);
  box(scene, "arcade back wall", 22.1, 4.65, .25, 0, 2.32, -21.88, materials.wall, true);
  sign(scene, "back wall arcade sign", "ARCADE 1999", "ESTA NOCHE / OTRA PARTIDA", 6.0, .85, 0, 3.56, -21.56, "#ec72c2");
  for (const x of [-5.1, 5.1]) {
    sign(scene, "back wall scores", x < 0 ? "RANKING 99" : "NUEVA PARTIDA", x < 0 ? "TOP SCORE / 99999" : "PULSA START", 2.8, .78, x, 2.65, -21.68, x < 0 ? "#6daee0" : "#a3d68b");
    box(scene, "back wall neon column", .08, 3.65, .08, x < 0 ? -6.85 : 6.85, 2.35, -21.66, x < 0 ? materials.blue : materials.pink);
  }
  box(scene, "arcade low ceiling", 22.1, .2, 31.5, 0, 4.72, -6.2, materials.trim);
  box(scene, "front entrance frame", 3.0, 3.18, .14, 0, 1.58, 9.28, materials.steel);
  box(scene, "front entrance glazed door", 2.68, 2.86, .08, 0, 1.48, 9.15, materials.glass);
  sign(scene, "arcade entrance sign", "ARCADE 1999", "FICHINES · NUEVA PARTIDA", 4.4, .71, 0, 3.67, 9.1, "#ee7fbb");
  sign(scene, "exit prompt sign", "SALIDA", "VOLVER A LA CIUDAD", 1.85, .40, 0, 2.2, 8.99, "#91d8de");
  interactions.push({ id: "exit", label: "Salida al mapa", x: 0, z: 7.65, reach: 1.55 });
  sign(scene, "token counter prices", "CAMBIO DE FICHAS", "CONSULTÁ PRECIOS EN MOSTRADOR", 3.2, .62, -7.3, 3.35, 9.05, "#ecb48d");
  for (const x of [-4.2, 4.2]) {
    box(scene, "entrance promotion frame", 2.9, 1.4, .10, x, 2.33, 9.12, materials.steel);
    sign(scene, "entrance promotion poster", x < 0 ? "NOCHE DE FICHINES" : "TOP SCORES", x < 0 ? "UNA FICHA · OTRO MUNDO" : "ROMPÉ TU RÉCORD", 2.72, 1.22, x, 2.33, 9.06, x < 0 ? "#8bcbe8" : "#ed8bb7");
  }
  for (const [x, title, subtitle] of [[-10.72, "RETRO NOCTURNO", "JUGÁ OTRA VEZ"], [10.72, "NIVEL 99", "SIN PAUSA"], [-10.72, "LUNA ELÉCTRICA", "PINBALL CLUB"], [10.72, "MEDIANOCHE 13", "NO MIRES ATRÁS"]]) {
    const z = title === "RETRO NOCTURNO" || title === "NIVEL 99" ? -8.6 : -15.2;
    const poster = sign(scene, `wall poster ${title}`, title, subtitle, 2.6, .78, 0, 2.6, 0, x < 0 ? "#7dbce9" : "#ef87b9");
    poster.position.set(x, 3.15, z); poster.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
  }
  for (let z = 6; z > -20; z -= 5.1) {
    box(scene, "ceiling cable trough", .3, .12, 3.7, -4.8, 4.48, z, materials.steel);
    box(scene, "ceiling cable trough", .3, .12, 3.7, 4.8, 4.48, z, materials.steel);
    const light = box(scene, "fluorescent housing", 2.8, .12, .56, 0, 4.51, z, materials.black);
    light.castShadow = false;
    box(scene, "fluorescent diffuser", 2.55, .035, .38, 0, 4.43, z, z < -10 ? materials.blue : materials.warm);
  }
  for (const z of [-18, -11, -4, 3]) {
    box(scene, "wall neon line", .06, .035, 3.2, -10.7, 3.95, z, materials.pink);
    box(scene, "wall neon line", .06, .035, 3.2, 10.7, 3.95, z, materials.blue);
  }
  for (const object of [...scene.children]) {
    if (object.isMesh && object.geometry.type === "PlaneGeometry" && object.position.z > 8.9) object.rotation.y = Math.PI;
  }
  const dressing = dressArcadeRoom(scene, { box, cylinder, sign, materials });
  const transforms = Object.fromEntries(ARCADE_PROPS.map(({ id }) => [id, defaultArcadeTransform(id)]));
  for (const prop of ARCADE_PROPS) {
    const anchor = slot(prop);
    if (prop.kind === "cabinet" || prop.kind === "racer" || prop.kind === "shooter") cabinet(prop, anchor);
    else if (prop.kind === "pinball") pinball(prop, anchor);
    else if (prop.kind === "counter") counter(prop, anchor);
    else if (prop.kind === "door") staffDoor(prop, anchor);
    else if (prop.kind === "lounge") lounge(anchor);
    const obstacle = arcadeObstacleFor(prop, transforms[prop.id]);
    obstacles.push(obstacle);
    interactions.push({ id: prop.id, label: prop.label, x: prop.position[0], z: prop.position[2], reach: prop.reach ?? 2.2 });
  }
  function applyTransform(id, transform) {
    const anchor = slots.get(id), prop = ARCADE_PROPS.find((item) => item.id === id);
    if (!anchor || !transform || !prop) return false;
    anchor.position.fromArray(transform.position);
    anchor.userData.baseX = transform.position[0];
    anchor.rotation.set(...transform.rotation.map(THREE.MathUtils.degToRad));
    anchor.scale.setScalar(transform.scale);
    const box = arcadeObstacleFor(prop, transform);
    Object.assign(obstacles.find((item) => item.id === id), box);
    const interaction = interactions.find((item) => item.id === id);
    Object.assign(interaction, { x: transform.position[0], z: transform.position[2], reach: transform.reach ?? prop.reach ?? 2.2 });
    return true;
  }
  for (const prop of ARCADE_PROPS) applyTransform(prop.id, transforms[prop.id]);
  const lights = [
    [-6.6, 3.2, 4.8, 0xffc99a, 20, 11], [-4.6, 2.9, -3.4, 0xca4caa, 26, 12],
    [6.5, 2.9, -7.5, 0x518bcc, 24, 12], [0, 2.6, -18.4, 0xd146ad, 8, 6],
  ].map(([x, y, z, color, intensity, distance]) => {
    const light = new THREE.PointLight(color, intensity, distance, 2);
    light.position.set(x, y, z); scene.add(light); return light;
  });
  const overhead = new THREE.SpotLight(0xd6d7e5, 65, 24, 1.10, .65, 2);
  overhead.position.set(1.5,4.45,-2); overhead.target.position.set(0,0,-3.5);
  overhead.castShadow = true; overhead.shadow.mapSize.set(1024,1024);
  overhead.shadow.bias = -.0004; overhead.shadow.normalBias = .035;
  overhead.shadow.camera.near = .5; overhead.shadow.camera.far = 24;
  scene.add(overhead, overhead.target);
  let screenTimer = 0, rearPulse = 0, triggered = false, previousPlayerZ = null;
  function update(dt, time, changed, playerZ, reducedMotion, paused, intake = false) {
    if (paused) return false;
    const crossedRear = previousPlayerZ !== null && previousPlayerZ >= -11.3 && playerZ < -11.3;
    previousPlayerZ = playerZ;
    const firstEvent = changed && !triggered && crossedRear;
    if (firstEvent) { triggered = true; rearPulse = 1.8; }
    rearPulse = Math.max(0, rearPulse - dt);
    const frequency = slots.get("frequency09Cabinet");
    lights[3].position.set(frequency.position.x, frequency.position.y + 2.6 * frequency.scale.y, frequency.position.z + .75 * frequency.scale.z);
    const failing = dressing.update(time, changed, reducedMotion);
    overhead.intensity = failing ? 54 : 65;
    if (!reducedMotion) {
      lights[3].intensity = intake ? 20 + Math.sin(time * 19) * 8 : changed ? 8 + Math.sin(time * 2.1) * 1.2 + (rearPulse > 0 ? 2 : 0) : 2.5;
      frequency.position.x = (frequency.userData.baseX || 0) + (intake ? Math.sin(time * 36) * .025 : 0);
      const lamp = slots.get("frequency09Cabinet")?.userData.warningLamp;
      if (lamp) lamp.visible = intake || (changed && Math.sin(time * 2.2) > -.2);
    }
    screenTimer += dt;
    if (screenTimer >= .18 || firstEvent) {
      screenTimer = 0;
      for (const entry of screenTextures.values()) {
        drawArcadeScreen(entry.canvas.getContext("2d"), entry.prop, time, changed, entry.prop.theme === "broken" ? rearPulse : 0);
        entry.texture.needsUpdate = true;
      }
    }
    return firstEvent;
  }
  batchArcadeDetails(scene, colliders);
  // Original machine/hum audio can be attached to this scene lifecycle later;
  // update() already exposes the one-time rear interference event.
  return { slots, colliders, obstacles, interactions, applyTransform, update, mixers: [] };
}
