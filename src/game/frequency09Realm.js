import * as THREE from "three";
import { curvedCrtGeometry } from "./arcadeVisuals.js";
import { batchArcadeDetails } from "./arcadeGeometryBatch.js";
import { loadRecordStoreGhost } from "./recordStoreGhost.js";

export const FREQUENCY09_LAYOUT = {
  playerLimitX: 4.2, playerBackZ: -17.8, playerFrontZ: 8.2, spawnZ: 6.4,
  cameraLimitX: 5.1, cameraBackZ: -18.4, cameraFrontZ: 11.8,
};

function canvasTexture(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  draw(canvas.getContext("2d"), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function placard(title, subtitle, color = "#ea76c3") {
  const texture = canvasTexture(512, 192, (ctx, w, h) => {
    ctx.fillStyle = "#090d19"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(9, 9, w - 18, h - 18);
    ctx.fillStyle = color; ctx.fillRect(21, 24, 40, 4);
    ctx.textAlign = "center"; ctx.font = "bold 38px Arial"; ctx.fillStyle = "#faedda";
    ctx.fillText(title, w / 2, 93, w - 40);
    ctx.font = "16px monospace"; ctx.fillStyle = color; ctx.fillText(subtitle, w / 2, 140, w - 40);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.1),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
}

function deckMaterial() {
  const map = canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = "#444752"; ctx.fillRect(0, 0, w, h);
    // Baked grain, machined seams and recessed bolts, shared by every deck plate.
    for (let i = 0; i < 6500; i++) {
      const n = Math.sin(i * 127.1) * 43758.5453, v = n - Math.floor(n);
      ctx.fillStyle = i % 2 ? "#b4b8c513" : "#0000001a";
      ctx.fillRect((i * 79) % w, v * h, 1 + v * 8, .7);
    }
    ctx.strokeStyle = "#171d29"; ctx.lineWidth = 7; ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.strokeStyle = "#6d7484"; ctx.lineWidth = 1; ctx.strokeRect(10, 10, w - 20, h - 20);
    for (const x of [22, w - 22]) for (const y of [22, h - 22]) {
      ctx.fillStyle = "#131b26"; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#8a8a92"; ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + 2, y); ctx.stroke();
    }
    for (let y = 40; y < h - 28; y += 8) {
      ctx.fillStyle = "#171e29"; ctx.fillRect(36, y, 72, 3); ctx.fillRect(w - 108, y, 72, 3);
    }
    ctx.fillStyle = "#afb4bc50"; ctx.font = "12px monospace"; ctx.fillText("F / 09    SIGNAL TRANSIT", 165, 230);
  });
  return new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: .018, metalness: .64, roughness: .48 });
}

export function buildFrequency09Realm(scene) {
  const ink = new THREE.MeshStandardMaterial({ color: 0x171c2b, roughness: .57, metalness: .55 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x576477, roughness: .42, metalness: .72 });
  const edge = new THREE.MeshStandardMaterial({ color: 0x302239, emissive: 0x68234d, emissiveIntensity: .65 });
  const pink = new THREE.MeshBasicMaterial({ color: 0xee6ab7, toneMapped: false });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x6ad9e5, toneMapped: false });
  const violet = new THREE.MeshBasicMaterial({ color: 0x927bd7, toneMapped: false });
  const red = new THREE.MeshBasicMaterial({ color: 0xb71f4e });
  const gold = new THREE.MeshStandardMaterial({ color: 0x9a7050, metalness: .25, roughness: .8 });
  const black = new THREE.MeshStandardMaterial({ color: 0x080a10, metalness: .3, roughness: .55 });
  const deck = deckMaterial();
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const box = (w, h, d, material, x, y, z, parent = scene) => {
    const mesh = new THREE.Mesh(boxGeometry, material);
    mesh.scale.set(w, h, d); mesh.position.set(x, y, z);
    mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const glowMap = canvasTexture(128, 128, (ctx) => {
    const glow = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    glow.addColorStop(0, "#ffffff"); glow.addColorStop(.15, "#ffffff80");
    glow.addColorStop(.5, "#ffffff18"); glow.addColorStop(1, "#ffffff00");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 128, 128);
  });
  const haloMaterial = new THREE.SpriteMaterial({ map: glowMap, color: 0x9c4cc5,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: .24 });
  function halo(x, y, z, size, material = haloMaterial) {
    const sprite = new THREE.Sprite(material); sprite.position.set(x, y, z);
    sprite.scale.set(size, size, 1); scene.add(sprite); return sprite;
  }

  scene.background = new THREE.Color(0x040610);
  scene.fog = new THREE.FogExp2(0x0c0b21, .032);
  scene.add(new THREE.AmbientLight(0x8a89b9, .62));
  const pulseLight = new THREE.PointLight(0xda61c5, 24, 19, 2);
  pulseLight.position.set(-2.6, 3.3, -3); scene.add(pulseLight);
  const entryLight = new THREE.PointLight(0x68c9e8, 28, 18, 2);
  entryLight.position.set(2.2, 3.7, 5.4); scene.add(entryLight);
  const visionLight = new THREE.PointLight(0xe35a89, 0, 12, 2);
  visionLight.position.set(0, 3.5, -14); scene.add(visionLight);

  // Continuous ground matches the controller's limits; the void is decorative.
  box(8.7, .32, 27, ink, 0, -.22, -4.8);
  for (let i = 0; i < 18; i++) {
    const z = 7.5 - i * 1.5;
    for (const x of [-2.12, 2.12]) box(4.18, .045, 1.43, deck, x, -.02, z);
    for (const side of [-1, 1]) {
      box(.045, .025, 1.27, i % 3 ? cyan : pink, side * 3.85, .015, z);
      box(.19, .025, .055, steel, side * 3.55, .014, z - .5);
    }
    if (i % 3 === 0) {
      for (const side of [-1, 1]) {
        const arrow = box(.25, .012, .03, cyan, side * .1, .015, z);
        arrow.rotation.y = side * -.6;
      }
    }
  }
  for (const side of [-1, 1]) {
    box(.18, .19, 27, steel, side * 4.28, -.06, -4.8);
    box(.04, .025, 26.7, pink, side * 4.39, -.08, -4.8);
  }

  // Massive frames give the corridor a readable silhouette and depth.
  for (let i = 0; i < 5; i++) {
    const z = 5.3 - i * 5.4, frame = new THREE.Group();
    frame.position.z = z; scene.add(frame);
    for (const side of [-1, 1]) {
      box(.48, 4, .62, ink, side * 4.65, 1.75, 0, frame);
      box(.04, 3.7, .055, i % 2 ? pink : cyan, side * 4.37, 1.8, .34, frame);
      const shoulder = box(2.18, .4, .62, steel, side * 3.85, 4.17, 0, frame);
      shoulder.rotation.z = side * -.62;
      const light = box(2.05, .035, .035, violet, side * 3.85, 4.05, .34, frame);
      light.rotation.z = side * -.62;
      box(.85, .6, 1, ink, side * 4.65, .1, 0, frame);
      for (let j = 0; j < 4; j++) box(.18, .055, .05, steel, side * 4.65, 1.5 + j * .18, .34, frame);
    }
    box(6.05, .42, .64, ink, 0, 4.8, 0, frame);
    box(5.3, .025, .03, i % 2 ? cyan : pink, 0, 4.57, .33, frame);
    const sign = placard("FREQUENCY / 09", "SECTOR 0" + (i + 1) + "  \u00b7  NO SIGNAL");
    sign.scale.set(.42, .42, 1); sign.position.set(0, 4.78, .34); frame.add(sign);
    halo(0, 4.1, z, 8);
  }

  // One instanced draw call for the suspended ruins instead of many loose meshes.
  const ruins = new THREE.InstancedMesh(boxGeometry, ink, 56), matrix = new THREE.Object3D();
  for (let i = 0; i < 56; i++) {
    matrix.position.set((i % 2 ? -1 : 1) * (6 + (i * 7 % 13) * .67),
      -4 + (i * 11 % 19) * .57, 10 - (i * 7.17) % 42);
    matrix.rotation.set(i * .07, i * .31, Math.sin(i * 3.1) * .22);
    matrix.scale.set(.6 + i % 4 * .6, 1 + i % 5 * 1.25, .5 + i % 3 * .48);
    matrix.updateMatrix(); ruins.setMatrixAt(i, matrix.matrix);
  }
  ruins.computeBoundingSphere(); scene.add(ruins);
  const lattice = [];
  for (let i = -18; i <= 18; i += 2) {
    lattice.push(-22, -3.5, i - 6, 22, -3.5, i - 6, i, -3.5, -30, i, -3.5, 14);
  }
  const grid = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position",
    new THREE.Float32BufferAttribute(lattice, 3)), new THREE.LineBasicMaterial({ color: 0x67478b, transparent: true, opacity: .28 }));
  scene.add(grid);

  const screens = [];
  for (const [index, x, z, title, caption] of [
    [0, -2.9, 1, "ECO DEL CLUB", "EL FINAL NO FUE EL FINAL"],
    [1, 2.9, -4.4, "TIEMPO ALTERADO", "1999 / FECHA DESCONOCIDA"],
  ]) {
    const group = new THREE.Group(); group.position.set(x, 1.8, z);
    group.rotation.set(-.06, x < 0 ? .3 : -.3, x < 0 ? -.035 : .035); scene.add(group);
    box(2.42, 1.82, .74, ink, 0, 0, 0, group);
    box(2.2, 1.61, .06, steel, 0, .03, .4, group);
    box(2.02, 1.42, .06, black, -.04, .05, .445, group);
    for (let j = 0; j < 7; j++) box(.04, .62, .02, black, -.8 + j * .26, .09, -.38, group);
    const texture = canvasTexture(512, 320, () => {});
    const panel = new THREE.Mesh(curvedCrtGeometry(1.85, 1.22),
      new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
    panel.position.set(-.04, .05, .49); group.add(panel);
    box(.1, .035, .025, index ? cyan : pink, -.84, -.77, .41, group);
    for (let j = 0; j < 3; j++) box(.11, .07, .06, steel, .46 + j * .17, -.77, .43, group);
    box(.48, .42, .5, ink, 0, -1.08, -.05, group);
    const wire = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -.9, -.35), new THREE.Vector3(.3, -1.2, -.7),
      new THREE.Vector3(-.3, -1.5, -.85), new THREE.Vector3(.6, -1.72, -1.1),
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(wire, 16, .025, 5, false), black));
    screens.push({ group, texture, title, caption, index });
    halo(x, 1.8, z + .55, 3.2);
  }
  function drawScreen(screen, time) {
    const ctx = screen.texture.image.getContext("2d"), accent = screen.index ? "#77dee6" : "#f68dc6";
    ctx.fillStyle = "#070f1e"; ctx.fillRect(0, 0, 512, 320);
    ctx.strokeStyle = "#213b4b"; ctx.lineWidth = 1;
    for (let x = 20; x < 512; x += 32) { ctx.beginPath(); ctx.moveTo(x, 72); ctx.lineTo(x, 250); ctx.stroke(); }
    for (let y = 76; y < 252; y += 24) { ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(492, y); ctx.stroke(); }
    ctx.textAlign = "left"; ctx.fillStyle = accent; ctx.font = "14px monospace";
    ctx.fillText("F/09   ARCHIVO DE MEMORIA", 22, 29);
    ctx.fillStyle = "#fff0da"; ctx.font = "bold 30px monospace"; ctx.fillText(screen.title, 22, 63);
    ctx.strokeStyle = accent; ctx.lineWidth = 2.5; ctx.shadowColor = accent; ctx.shadowBlur = 9;
    ctx.beginPath();
    for (let x = 22; x < 490; x += 3) {
      const y = 158 + Math.sin(x * .035 + time * 1.4) * Math.sin(x * .009 + time * .2) * 52
        + Math.cos(x * .15 - time * 2) * 7;
      if (x === 22) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.shadowBlur = 0; ctx.fillStyle = accent; ctx.font = "15px monospace";
    ctx.fillText(screen.caption, 22, 282);
    ctx.fillStyle = "#d3d1df"; ctx.font = "12px monospace"; ctx.fillText("REC \u25cf   00:09:09        SIGNAL LOST", 22, 307);
    ctx.fillStyle = "#00000040"; for (let y = 0; y < 320; y += 4) ctx.fillRect(0, y, 512, 1);
    ctx.fillStyle = "#a2e8ff0c"; ctx.fillRect(0, (time * 28) % 320, 512, 12);
    screen.texture.needsUpdate = true;
  }
  screens.forEach(screen => drawScreen(screen, 0));

  const gate = new THREE.Group(); gate.position.set(0, 2.45, -17.8); scene.add(gate);
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.9 + i * .24, i ? .018 : .085, 5, 64, Math.PI * (i ? 1.7 : 2)),
      i === 1 ? cyan : i ? pink : steel);
    ring.rotation.z = i * 1.5; ring.position.z = -.12 * i; gate.add(ring); rings.push(ring);
  }
  const gateTitle = placard("09", "EL OTRO LADO"); gateTitle.position.set(0, 1.15, -.1); gate.add(gateTitle);
  halo(0, 2.4, -18.1, 13);
  const arrivalRing = new THREE.Mesh(new THREE.RingGeometry(.95, 1, 64),
    new THREE.MeshBasicMaterial({ color: 0x99e4ee, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  arrivalRing.rotation.x = -Math.PI / 2; arrivalRing.position.set(0, .028, FREQUENCY09_LAYOUT.spawnZ); scene.add(arrivalRing);

  const future = new THREE.Group(); future.position.set(0, 0, -14.4);
  future.visible = false; scene.add(future);
  box(6.5, .13, 4.6, ink, 0, -.025, -.1, future);
  box(6.3, 2.8, .17, ink, 0, 1.37, -2.25, future);
  const sign = placard("LA TIENDA DE LOS DISCOS", "NEONBOY MUSIC  /  LOCAL CERRADO", "#c69b77");
  sign.scale.set(1.55, .83, 1); sign.position.set(0, 2.2, -2.12); future.add(sign);
  for (const [i, x] of [-2.2, 2.2].entries()) {
    const shelf = new THREE.Group(); shelf.position.set(x, .6, -.65); shelf.rotation.z = i ? -.58 : .4;
    box(1.7, .15, 1.05, gold, 0, .2, 0, shelf);
    box(1.6, .95, .16, gold, 0, -.27, -.45, shelf);
    for (const side of [-1, 1]) box(.1, .9, 1, gold, side * .79, -.2, 0, shelf);
    for (let j = 0; j < 8; j++) box(.11, .68, .64, j % 3 ? edge : red,
      -.67 + j * .19, .61 + j % 2 * .04, 0, shelf);
    future.add(shelf);
  }
  const discGeometry = new THREE.CylinderGeometry(.27, .27, .017, 24);
  const labelGeometry = new THREE.CircleGeometry(.07, 12);
  for (let i = 0; i < 14; i++) {
    const disc = new THREE.Mesh(discGeometry, black);
    disc.position.set((i * 17 % 53) / 9 - 2.8, .052 + (i % 3) * .008, (i * 11 % 31) / 10 - 1.8);
    future.add(disc);
    const label = new THREE.Mesh(labelGeometry, i % 2 ? pink : violet);
    label.rotation.x = -Math.PI / 2; label.position.copy(disc.position);
    label.position.y += .01; future.add(label);
  }
  const ghostAnchor = new THREE.Group(); ghostAnchor.position.set(.65, 0, -1.65);
  future.add(ghostAnchor);
  let ghost = null;
  const loadGhost = (loader, isAlive) => loadRecordStoreGhost(loader, ghostAnchor, isAlive, 2.25)
    .then((loaded) => { ghost = loaded; return Boolean(loaded); }).catch(() => false);


  // Dust and distant signal fragments share one small buffer and one draw call.
  const dustPositions = [], dustColors = [];
  const color = new THREE.Color();
  for (let i = 0; i < 540; i++) {
    dustPositions.push(Math.sin(i * 127.1) * 15, -2 + (i * 17 % 137) * .075, 11 - (i * 7.31) % 43);
    color.set(i % 3 ? 0x78b9d6 : 0xf08bc7); dustColors.push(color.r, color.g, color.b);
  }
  const dust = new THREE.Points(new THREE.BufferGeometry()
    .setAttribute("position", new THREE.Float32BufferAttribute(dustPositions, 3))
    .setAttribute("color", new THREE.Float32BufferAttribute(dustColors, 3)),
  new THREE.PointsMaterial({ map: glowMap, size: .075, vertexColors: true,
    transparent: true, opacity: .65, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(dust);
  const interactions = [
    { id: "signal-club", label: "Eco del Club", x: -1.3, z: 1, reach: 2.25 },
    { id: "signal-time", label: "Pantalla del tiempo", x: 1.3, z: -4.4, reach: 2.25 },
    { id: "future-store", label: "Visi\u00f3n de la Tienda", x: 0, z: -10.3, reach: 2.35 },
  ];
  // Reuse the existing instancing utility; animated roots remain independent.
  batchArcadeDetails(scene, []);
  let lastScreenFrame = -1;
  function update(dt, elapsed, phase, reducedMotion, arrivalAge = 10) {
    future.visible = ["vision", "presence", "collapse"].includes(phase);
    ghost?.update(dt, elapsed, phase === "presence" || phase === "collapse", .68);
    visionLight.intensity = future.visible ? (reducedMotion ? 22 : 22 + Math.sin(elapsed * 2.4) * 2) : 0;
    pulseLight.intensity = reducedMotion ? 24 : 24 + Math.sin(elapsed * 1.1) * 3;
    arrivalRing.visible = !reducedMotion && arrivalAge < 3;
    arrivalRing.scale.setScalar(1 + arrivalAge * 1.1);
    arrivalRing.material.opacity = Math.max(0, .65 * (1 - arrivalAge / 3));
    const screenFrame = reducedMotion ? 0 : Math.floor(elapsed * 8);
    if (screenFrame !== lastScreenFrame) {
      screens.forEach(screen => drawScreen(screen, reducedMotion ? 0 : elapsed));
      lastScreenFrame = screenFrame;
    }
    if (reducedMotion) return;
    screens.forEach(({ group, index }) => { group.position.y = 1.8 + Math.sin(elapsed * .9 + index) * .055; });
    rings[1].rotation.z = elapsed * .09; rings[2].rotation.z = -elapsed * .06;
    dust.position.y = Math.sin(elapsed * .15) * .22;
    ghostAnchor.position.x = .65 + Math.sin(elapsed * 1.2) * .07;
    future.rotation.z = phase === "collapse" ? Math.sin(elapsed * 23) * .009 : 0;
  }
  return { obstacles: [
    { x: -2.9, z: 1, hx: 1.12, hz: .48 }, { x: 2.9, z: -4.4, hx: 1.12, hz: .48 },
  ], colliders: [], interactions, update, loadGhost, mixers: [] };
}
