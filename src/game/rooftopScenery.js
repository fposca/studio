import * as THREE from "three";
import { ROOFTOP_PROPS, defaultRooftopTransform } from "./rooftopLayout.js";
import { createRooftopMaterials, canvasMap, makeRoofLabel, roofRandom } from "./rooftopMaterials.js";
import { buildRooftopCity } from "./rooftopCity.js";
import { createRooftopWeather } from "./rooftopWeather.js";
import { disposeObjects } from "./disposeGameObjects.js";

const demonUrl = new URL("../assets/neonboy-animaciones/demonio-alado-2.glb", import.meta.url).href;

export function buildRooftop(scene) {
  const root = new THREE.Group(); root.name = "La Azotea 1999"; scene.add(root);
  const m = createRooftopMaterials();
  const colliders = [], obstacles = [], interactions = [], slots = new Map();
  const cube = new THREE.BoxGeometry(1, 1, 1);
  function box(parent, material, x, y, z, sx, sy, sz, collider = false) {
    const mesh = new THREE.Mesh(cube, material);
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
    mesh.castShadow = sy > .12; mesh.receiveShadow = true; parent.add(mesh);
    if (collider) colliders.push(mesh);
    return mesh;
  }
  function pipe(parent, a, b, radius = .03, material = m.steel) {
    const start = new THREE.Vector3(...a), delta = new THREE.Vector3(...b).sub(start);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 8), material);
    mesh.position.copy(start).addScaledVector(delta, .5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  function cylinder(parent, material, radius, height, x, y, z, segments = 20) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function sign(parent, title, subtitle, x, y, z, width = 1.5, back = false, accent) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4),
      new THREE.MeshStandardMaterial({ map: makeRoofLabel(title, subtitle, accent), roughness: .76, metalness: .12 }));
    mesh.position.set(x, y, z); if (back) mesh.rotation.y = Math.PI; parent.add(mesh); return mesh;
  }
  function screws(parent, width, height, y, z) {
    for (const x of [-width / 2, width / 2]) for (const dy of [-height / 2, height / 2]) {
      const screw = cylinder(parent, m.steel, .019, .012, x, y + dy, z, 8);
      screw.rotation.x = Math.PI / 2;
      box(parent, m.dark, x, y + dy, z + .008, .023, .003, .003);
    }
  }
  function vent(parent, x, y, z, width, rows = 7) {
    box(parent, m.rubber, x, y, z, width, rows * .045 + .04, .014);
    for (let i = 0; i < rows; i++) box(parent, m.steel, x, y + (i - (rows - 1) / 2) * .045, z + .012, width - .035, .015, .018);
  }
  function slot(id) { const group = new THREE.Group(); group.name = id; root.add(group); slots.set(id, group); return group; }
  function obstacle(id, hx, hz) { const entry = { id, x: 0, z: 0, hx, hz, baseHx: hx, baseHz: hz }; obstacles.push(entry); }

  box(root, m.floor, 0, -.24, 0, 24, .48, 24);
  box(root, m.plaster, 0, -8.8, 0, 23.8, 17.1, 23.8);
  for (const [x, z, sx, sz] of [[0, -11.9, 24, .42], [0, 11.9, 24, .42], [-11.9, 0, .42, 24], [11.9, 0, .42, 24]]) {
    box(root, m.plaster, x, .58, z, sx, 1.35, sz, true);
    box(root, m.cap, x, 1.28, z, sx + .15, .12, sz + .15);
    box(root, m.rust, x, .12, z, sx + .02, .07, sz + .02);
  }
  for (const x of [-10.5, 10.5]) for (const z of [-10.5, 10.5]) {
    box(root, m.dark, x, .018, z, .58, .025, .58);
    for (let i = 0; i < 7; i++) box(root, m.steel, x - .23 + i * .077, .035, z, .025, .016, .53);
  }
  const city = buildRooftopCity(scene, m);

  const stair = slot("stairDoor");
  box(stair, m.plaster, 0, 1.5, 0, 3.8, 3, 2.6, true);
  box(stair, m.cap, 0, 3.03, 0, 4.02, .16, 2.81);
  box(stair, m.rubber, 0, 1.1, -1.315, 1.68, 2.25, .08);
  box(stair, m.cabinet, 0, 1.08, -1.38, 1.49, 2.1, .08);
  for (const x of [-.77, .77]) box(stair, m.steel, x, 1.1, -1.44, .055, 2.25, .06);
  for (const y of [.55, 1.55]) box(stair, m.dark, -.67, y, -1.46, .04, .13, .07);
  pipe(stair, [.53, .99, -1.47], [.53, 1.18, -1.47], .025);
  box(stair, m.cap, 0, .025, -1.52, 1.66, .05, .48);
  sign(stair, "ACCESO A LA AZOTEA", "BUENOS AIRES / 1999", 0, 2.62, -1.32, 1.93, true);
  const lampGlass = new THREE.MeshStandardMaterial({ color: 0xffd1a0, emissive: 0xffb46c, emissiveIntensity: 1.8, roughness: .35 });
  box(stair, m.dark, 1.26, 2.25, -1.4, .38, .28, .18);
  box(stair, lampGlass, 1.26, 2.25, -1.51, .28, .16, .025);
  obstacle("stairDoor", 1.9, 1.3);

  const panel = slot("powerPanel");
  for (const x of [-.48, .48]) {
    box(panel, m.steel, x, .35, 0, .075, .7, .13);
    box(panel, m.cap, x, .055, 0, .36, .11, .36);
  }
  box(panel, m.cabinet, 0, 1.35, 0, 1.38, 1.58, .42, true);
  box(panel, m.rubber, 0, 1.35, .218, 1.26, 1.43, .022);
  box(panel, m.steel, 0, 1.35, .24, 1.21, 1.38, .025);
  const panelFace = canvasMap(768, 1024, ctx => {
    ctx.fillStyle = "#8a9290"; ctx.fillRect(0, 0, 768, 1024);
    ctx.fillStyle = "#202d33"; ctx.fillRect(30, 30, 708, 140);
    ctx.fillStyle = "#e2d8bc"; ctx.font = "bold 48px Arial"; ctx.textAlign = "center"; ctx.fillText("CONTROL DE SENAL", 384, 93);
    ctx.font = "23px Arial"; ctx.fillText("ANTENA / CIRCUITO VIRTUAL 09", 384, 137);
    ctx.strokeStyle = "#526268"; ctx.lineWidth = 3;
    ctx.strokeRect(40, 205, 688, 565);
    for (let i = 0; i < 3; i++) {
      const x = 161 + i * 223;
      ctx.fillStyle = "#28363c"; ctx.font = "bold 29px Arial"; ctx.fillText(["I / LUNA", "II / RAYO", "III / ANTENA"][i], x, 263);
      ctx.fillStyle = "#aab2aa"; ctx.fillRect(x - 70, 288, 140, 330);
      ctx.strokeStyle = "#5b6869"; ctx.strokeRect(x - 70, 288, 140, 330);
      ctx.fillStyle = "#3b4748"; ctx.font = "22px Arial"; ctx.fillText("LINEA 0" + (i + 1), x, 715);
    }
    ctx.fillStyle = "#d3ba75"; ctx.fillRect(56, 810, 656, 90);
    ctx.fillStyle = "#303638"; ctx.font = "bold 28px Arial"; ctx.fillText("I  >  II  >  III", 384, 848);
    ctx.font = "20px Arial"; ctx.fillText("DISTRIBUCION DE SENAL / 1999", 384, 881);
    ctx.fillStyle = "#3e4a4d"; ctx.font = "19px Arial"; ctx.fillText("NB-09  /  MANTENIMIENTO DE ANTENAS", 384, 958);
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 1.32), new THREE.MeshStandardMaterial({ map: panelFace, roughness: .72 }));
  face.position.set(0, 1.35, .256); panel.add(face);
  const panelLeds = [], handles = [];
  for (let i = 0; i < 3; i++) {
    const x = -.338 + i * .338;
    box(panel, m.ceramic, x, 1.42, .31, .16, .29, .11);
    box(panel, m.dark, x, 1.43, .375, .1, .17, .034);
    const handle = box(panel, m.rubber, x, 1.38, .406, .072, .105, .06); handles.push(handle);
    const led = new THREE.Mesh(new THREE.SphereGeometry(.025, 8, 6), new THREE.MeshStandardMaterial({ color: 0x5a3627, emissive: 0x553122, emissiveIntensity: .15, roughness: .25 }));
    led.position.set(x, 1.14, .296); panel.add(led); panelLeds.push(led);
  }
  screws(panel, 1.11, 1.29, 1.35, .28);
  for (const y of [.85, 1.8]) box(panel, m.steel, -.72, y, .1, .065, .17, .12);
  box(panel, m.dark, .63, 1.36, .29, .07, .25, .055);
  const hood = box(panel, m.cabinet, 0, 2.17, .07, 1.53, .075, .66); hood.rotation.x = -.08;
  pipe(panel, [-.41, .57, -.02], [-.41, .12, -.02], .045);
  pipe(panel, [.4, .57, -.02], [.4, .13, -.02], .04);
  obstacle("powerPanel", .77, .36);

  const antenna = slot("mainAntenna");
  box(antenna, m.plaster, 0, .18, 0, 1.85, .36, 1.85, true);
  box(antenna, m.steel, 0, .39, 0, .86, .06, .86);
  for (const x of [-.35, .35]) for (const z of [-.35, .35]) cylinder(antenna, m.brass, .045, .08, x, .45, z, 6);
  for (const x of [-.27, .27]) pipe(antenna, [x, .42, -.23], [x * .45, 5.75, -.1], .045);
  pipe(antenna, [0, .42, .28], [0, 5.75, .12], .045);
  for (let i = 0; i < 7; i++) {
    const y = .6 + i * .7, width = .27 - i * .02;
    pipe(antenna, [-width, y, -.22], [width - .02, y + .66, -.2], .017);
    pipe(antenna, [width, y, -.22], [-width + .02, y + .66, -.2], .017);
  }
  pipe(antenna, [0, 4.8, 0], [0, 6.4, 0], .065);
  const rotor = new THREE.Group(); rotor.position.y = 5.8; antenna.add(rotor);
  pipe(rotor, [0, 0, -1.6], [0, 0, 1.3], .045);
  for (let i = 0; i < 7; i++) {
    const z = -1.5 + i * .43, half = .55 + i * .085;
    pipe(rotor, [-half, 0, z], [half, 0, z], .025);
  }
  for (const [x, z] of [[-1.55, 1.45], [1.55, 1.45], [0, -1.7]]) {
    pipe(antenna, [0, 4.1, 0], [x, .08, z], .008, m.dark);
    box(antenna, m.cap, x, .04, z, .25, .08, .25);
  }
  const powerLamp = new THREE.Mesh(new THREE.SphereGeometry(.075, 10, 6), new THREE.MeshStandardMaterial({ color: 0x642c2c, emissive: 0x431010, emissiveIntensity: .35 }));
  powerLamp.position.set(0, 6.45, 0); antenna.add(powerLamp);
  box(antenna, m.cabinet, .3, 1.1, .18, .23, .4, .18);
  sign(antenna, "ANTENA / 09", "RECEPTOR DE LARGO ALCANCE", 0, .28, .935, 1.18);
  obstacle("mainAntenna", .95, .95);

  const receiver = slot("receiver");
  for (const x of [-.72, .72]) for (const z of [-.35, .35]) {
    box(receiver, m.steel, x, .34, z, .065, .68, .065);
    cylinder(receiver, m.rubber, .075, .04, x, .045, z, 10);
  }
  box(receiver, m.dark, 0, .92, 0, 1.74, 1.1, .89, true);
  box(receiver, m.steel, 0, 1.49, 0, 1.85, .07, 1.02);
  box(receiver, m.cabinet, 0, 1.15, .46, 1.62, .53, .045);
  box(receiver, m.rubber, -.25, 1.16, .505, .92, .37, .05);
  const crtMap = canvasMap(512, 192, ctx => {
    ctx.fillStyle = "#112825"; ctx.fillRect(0, 0, 512, 192);
    ctx.strokeStyle = "#244d43"; ctx.lineWidth = 1;
    for (let x = 0; x < 512; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 192); ctx.stroke(); }
    for (let y = 0; y < 192; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
    ctx.strokeStyle = "#a4c5a6"; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 0; x < 512; x++) { const y = 109 + Math.sin(x * .06) * Math.sin(x * .017) * 20; if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
    ctx.fillStyle = "#b9d6b6"; ctx.font = "24px monospace"; ctx.fillText("F/09  STANDBY", 22, 38);
  });
  const crtMaterial = new THREE.MeshStandardMaterial({ map: crtMap, emissiveMap: crtMap, emissive: 0x8ecca4, emissiveIntensity: .4, roughness: .22 });
  const crt = new THREE.Mesh(new THREE.PlaneGeometry(.82, .29), crtMaterial); crt.position.set(-.25, 1.16, .534); receiver.add(crt);
  for (let i = 0; i < 3; i++) {
    const knob = cylinder(receiver, m.rubber, .055, .06, .44 + (i % 2) * .2, 1.23 - Math.floor(i / 2) * .18, .53, 14); knob.rotation.x = Math.PI / 2;
    box(receiver, m.ceramic, knob.position.x, knob.position.y + .025, .565, .008, .025, .004);
  }
  sign(receiver, "RECEPTOR DE RADIO", "FRECUENCIA DIGITAL / 1999", 0, .82, .478, 1.45);
  vent(receiver, 0, .57, .46, 1.4, 4);
  screws(receiver, 1.52, .43, 1.15, .495);
  obstacle("receiver", .96, .53);

  const tank = slot("waterTank");
  box(tank, m.plaster, 0, .12, 0, 2.9, .24, 2.9, true);
  for (const x of [-.87, .87]) for (const z of [-.87, .87]) box(tank, m.steel, x, .62, z, .1, .98, .1);
  pipe(tank, [-.87, .2, -.87], [.87, 1.1, -.87], .03);
  pipe(tank, [.87, .2, .87], [-.87, 1.1, .87], .03);
  cylinder(tank, m.cabinet, 1.23, 2.05, 0, 2.12, 0, 32);
  for (const y of [1.13, 1.3, 2.05, 2.92, 3.13]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(1.235, .025, 6, 32), m.steel);
    band.position.y = y; band.rotation.x = Math.PI / 2; tank.add(band);
  }
  const lid = new THREE.Mesh(new THREE.SphereGeometry(1.24, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2), m.steel);
  lid.scale.y = .14; lid.position.y = 3.13; tank.add(lid);
  cylinder(tank, m.dark, .23, .06, 0, 3.33, 0, 16);
  pipe(tank, [1.18, 1.6, .25], [1.48, 1.6, .25], .065);
  pipe(tank, [1.48, 1.6, .25], [1.48, .15, .25], .065);
  for (const x of [-.24, .24]) pipe(tank, [x, .2, 1.36], [x, 3.3, 1.36], .027);
  for (let i = 0; i < 10; i++) pipe(tank, [-.24, .32 + i * .29, 1.36], [.24, .32 + i * .29, 1.36], .019);
  sign(tank, "RESERVA DE AGUA", "ACCESO RESTRINGIDO", 0, 2.27, 1.246, .85);
  obstacle("waterTank", 1.5, 1.5);

  const service = slot("serviceBox");
  box(service, m.plaster, 0, .1, 0, 1.65, .2, 1.06, true);
  box(service, m.cabinet, 0, .68, 0, 1.43, .98, .84, true);
  box(service, m.steel, 0, 1.21, 0, 1.59, .08, .98);
  vent(service, 0, .72, .433, 1.19, 11);
  screws(service, 1.29, .8, .68, .448);
  for (const side of [-1, 1]) {
    const sideVent = new THREE.Group(); sideVent.position.set(side * .72, .71, 0);
    sideVent.rotation.y = side * Math.PI / 2; service.add(sideVent);
    vent(sideVent, 0, 0, 0, .65, 8);
  }
  pipe(service, [.55, .28, -.15], [.55, .1, -.15], .055);
  obstacle("serviceBox", .85, .55);

  const safe = slot("safeZone");
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.53, 1.59, 48), new THREE.MeshStandardMaterial({ color: 0x8aa995, roughness: .9, transparent: true, opacity: .65, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .012; safe.add(ring);
  const safeLabel = sign(safe, "ZONA SEGURA", "MANTENER LIBRE", 0, .018, -1.94, 1.5, false, "#93bba7");
  safeLabel.rotation.x = -Math.PI / 2;
  for (const x of [-1.8, 1.8]) {
    box(safe, m.dark, x, .027, 0, .15, .04, 2.5);
    for (let i = 0; i < 7; i++) box(safe, m.ceramic, x, .05, -1.03 + i * .34, .16, .012, .13);
  }

  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-6.7, .07, 3.5), new THREE.Vector3(-4.9, .05, 2),
    new THREE.Vector3(-3.4, .04, -1.8), new THREE.Vector3(2.8, .06, -2.5), new THREE.Vector3(5, .4, -5.1),
  ]);
  root.add(new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 40, .026, 5, false), m.rubber));
  for (const x of [-10.8, 10.8]) {
    pipe(root, [x, .17, -10.6], [x, .17, 9.6], .05, m.rust);
    for (let i = 0; i < 6; i++) box(root, m.steel, x, .12, -9 + i * 3.4, .23, .22, .1);
  }
  const puddles = [];
  for (let i = 0; i < 11; i++) {
    const x = -9.5 + roofRandom(i + 30) * 19, z = -9.8 + roofRandom(i + 50) * 18.7;
    const radius = .6 + roofRandom(i + 80) * 1.1;
    const outline = [];
    for (let j = 0; j < 12; j++) {
      const a = j * Math.PI / 6, r = radius * (.78 + roofRandom(i * 24 + j) * .22);
      outline.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * .65, 0));
    }
    const curve = new THREE.CatmullRomCurve3(outline, true, "catmullrom", .25);
    const shape = new THREE.Shape(curve.getPoints(64).map(point => new THREE.Vector2(point.x, point.y)));
    shape.closePath();
    const puddle = new THREE.Mesh(new THREE.ShapeGeometry(shape), m.puddle);
    puddle.rotation.x = -Math.PI / 2; puddle.position.set(x, .012, z); root.add(puddle);
    puddles.push({ x, z, radius });
  }
  const weather = createRooftopWeather(root, puddles);

  const maintenance = new THREE.PointLight(0xffc28c, 11, 12, 2);
  maintenance.position.set(1.3, 2.5, 8.6); root.add(maintenance);
  const panelFill = new THREE.PointLight(0xb7d1dd, 4.5, 7, 2); panelFill.position.set(-4.6, 2.7, 3.7); root.add(panelFill);
  const blue = new THREE.PointLight(0x9eb9d8, 3, 12, 2); blue.position.set(5, 4, -5); root.add(blue);
  const moon = new THREE.DirectionalLight(0xa6bdd8, 1.05); moon.position.set(-10, 18, -7);
  moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: .5, far: 50 });
  moon.shadow.bias = -.0006; moon.shadow.normalBias = .035; scene.add(moon);
  const lightning = new THREE.DirectionalLight(0xc6d9ff, 0); lightning.position.set(12, 20, -14); scene.add(lightning);
  const red = new THREE.PointLight(0xc53253, 0, 42, 2); red.position.set(3, 12, -8); root.add(red);

  const portal = new THREE.Group(); portal.position.set(3, 17, -37); scene.add(portal);
  const portalRing = new THREE.Mesh(new THREE.TorusGeometry(3.1, .09, 7, 64), new THREE.MeshBasicMaterial({ color: 0x9f1c3f, transparent: true, opacity: .65 }));
  portal.add(portalRing);
  const glowTexture = canvasMap(256, 256, ctx => {
    const g = ctx.createRadialGradient(128, 128, 5, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,.58)"); g.addColorStop(.36, "rgba(255,255,255,.17)"); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  });
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: 0xe23f57, transparent: true, opacity: .6, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.scale.set(17, 17, 1); portal.add(glow); portal.visible = false;
  const demon = new THREE.Group(); demon.position.set(3, 11.2, -34); scene.add(demon);
  const shadow = new THREE.MeshStandardMaterial({ color: 0x080b12, roughness: 1 });
  const body = new THREE.Mesh(new THREE.ConeGeometry(1.05, 4.6, 7), shadow); body.position.y = 2.5; demon.add(body);
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.ConeGeometry(1.4, 4.4, 3), shadow);
    wing.position.set(side * 1.55, 3.7, .1); wing.rotation.z = side * .58; demon.add(wing);
  }
  demon.visible = false;

  function applyTransform(id, transform) {
    const group = slots.get(id); if (!group || !transform) return;
    group.position.set(...transform.position);
    group.rotation.set(...transform.rotation.map(v => v * Math.PI / 180)); group.scale.setScalar(transform.scale);
    const spot = interactions.find(s => s.id === id);
    if (spot) { spot.x = transform.position[0]; spot.z = transform.position[2]; spot.reach = transform.reach; }
    const block = obstacles.find(o => o.id === id);
    if (block) {
      const yaw = transform.rotation[1] * Math.PI / 180;
      block.x = transform.position[0]; block.z = transform.position[2];
      block.hx = (Math.abs(Math.cos(yaw)) * block.baseHx + Math.abs(Math.sin(yaw)) * block.baseHz) * transform.scale;
      block.hz = (Math.abs(Math.sin(yaw)) * block.baseHx + Math.abs(Math.cos(yaw)) * block.baseHz) * transform.scale;
    }
  }
  for (const prop of ROOFTOP_PROPS) {
    interactions.push({ id: prop.id, label: prop.label, x: prop.position[0], z: prop.position[2], reach: prop.reach });
    applyTransform(prop.id, defaultRooftopTransform(prop.id));
  }
  async function loadDemon(loader, isAlive) {
    try {
      const gltf = await loader.loadAsync(demonUrl);
      if (!isAlive()) { disposeObjects([gltf.scene]); return false; }
      const bounds = new THREE.Box3().setFromObject(gltf.scene), size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3()), scale = 5.5 / Math.max(size.x, size.y, size.z, .001);
      gltf.scene.scale.setScalar(scale); gltf.scene.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      gltf.scene.traverse(object => { if (object.isMesh) { object.castShadow = false; object.receiveShadow = false; } });
      disposeObjects([demon]); demon.clear(); demon.add(gltf.scene); return true;
    } catch { return false; }
  }
  function update(dt, elapsed, phase, age, progress, reducedMotion, paused) {
    const active = phase === "anomaly";
    portal.visible = active && age > 2 && age < 10;
    demon.visible = active && age > 4 && age < 8.5;
    if (!paused) portalRing.rotation.z += dt * .13;
    demon.position.y = 11.2 + (reducedMotion ? 0 : Math.sin(elapsed * 1.3) * .16);
    powerLamp.material.color.setHex(progress?.powerRestored ? 0x83d2b5 : 0x642c2c);
    powerLamp.material.emissive.setHex(progress?.powerRestored ? 0x437d65 : 0x431010);
    rotor.rotation.y = (progress?.bearing || 0) * Math.PI / 180;
    panelLeds.forEach((led, index) => {
      const on = (progress?.switches?.length || 0) > index;
      led.material.color.setHex(on ? 0x8ebca0 : 0x6a4533); led.material.emissive.setHex(on ? 0x4a9868 : 0x26120b);
      led.material.emissiveIntensity = on ? 1.3 : .15; handles[index].rotation.x = on ? -.35 : .22;
    });
    crtMaterial.emissiveIntensity = progress?.powerRestored ? .65 : .12;
    blue.intensity = progress?.powerRestored ? 5 : 2.4;
    const flash = !reducedMotion && !paused ? Math.max(0, 1 - Math.abs((elapsed % 17) - 9.3) / .28) : 0;
    lightning.intensity = flash * 1.8;
    maintenance.intensity = active ? 4 : 11; moon.intensity = active ? .6 : 1.05;
    red.intensity = active ? Math.max(0, Math.sin(Math.min(1, age / 11) * Math.PI)) * 90 : 0;
    portalRing.material.opacity = active ? Math.min(.7, Math.max(0, (age - 2) * .35)) : 0;
    if (!paused) { weather.update(dt, elapsed, reducedMotion); city.update(dt, active, reducedMotion); }
  }
  return { root, colliders, obstacles, interactions, slots, applyTransform, loadDemon, update };
}
