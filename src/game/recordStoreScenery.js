import * as THREE from "three";
import { buildStoreJukebox } from "./recordStoreJukeboxScenery.js";
import { STORE_LAYOUT } from "./recordStoreLayout.js";
import { buildStoreAtmosphere } from "./recordStoreAtmosphere.js";
const STORE_FONT = '"Bahnschrift", "Segoe UI", sans-serif';

function canvasTexture(width, height, paint, { repeat, color = true } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext("2d"), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  if (repeat) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(...repeat);
  }
  return texture;
}

function randomSequence(seed = 93) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

function signTexture(text, { background = "#232029", color = "#f3dcba", font = 52, width = 512, height = 128 } = {}) {
  return canvasTexture(width, height, (ctx, w, h) => {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = `${color}55`;
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = color;
    ctx.font = `600 ${font}px ${STORE_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2, w - 26);
  });
}

function box(parent, x, y, z, w, h, d, material, shadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function plane(parent, map, x, y, z, w, h, lit = false) {
  const material = lit
    ? new THREE.MeshStandardMaterial({ map, roughness: 0.62, side: THREE.DoubleSide })
    : new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function sign(parent, text, x, y, z, w, h, options = {}) {
  const height = options.height || 128;
  const width = Math.max(128, Math.round(height * w / h));
  return plane(parent, signTexture(text, { ...options, width, height, font: (options.font || 52) * 1.15 }), x, y, z, w, h);
}

function cylinder(parent, radius, height, x, y, z, material, segments = 24) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function wire(parent, points, material, radius = 0.012) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 5, false), material);
  parent.add(mesh);
  return mesh;
}

function makeMaterials() {
  const random = randomSequence();
  const floorMap = canvasTexture(1024, 1024, (ctx, w, h) => {
    // Keep the original purple 90s record-store checker across the larger room.
    ctx.fillStyle = "#211624";
    ctx.fillRect(0, 0, w, h);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
      const x = col * 256, y = row * 256;
      const dark = (row + col) % 2 === 0;
      ctx.fillStyle = dark ? "#3f2b4a" : "#70556d";
      ctx.fillRect(x + 4, y + 4, 248, 248);
      const glaze = ctx.createLinearGradient(x + 4, y + 4, x + 252, y + 252);
      glaze.addColorStop(0, "#f9dff516");
      glaze.addColorStop(0.5, "#ffffff00");
      glaze.addColorStop(1, "#120d1d26");
      ctx.fillStyle = glaze;
      ctx.fillRect(x + 4, y + 4, 248, 248);
      ctx.strokeStyle = dark ? "#a47d9c4c" : "#e4bdd34f";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 8, y + 8, 240, 240);
      for (let i = 0; i < 1200; i++) {
        const px = x + 7 + random() * 242, py = y + 7 + random() * 242;
        ctx.fillStyle = i % 3 ? "#f5e8f018" : "#24172d24";
        ctx.fillRect(px, py, 1 + random() * 3, 1 + random() * 2);
      }
    }
    for (let i = 0; i < 75; i++) {
      const x = random() * w, y = random() * h;
      ctx.strokeStyle = i % 2 ? "#21182612" : "#f4d8ec12";
      ctx.lineWidth = 1 + random() * 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + random() * 40, y + random() * 14); ctx.stroke();
    }
  }, { repeat: [4.5, 6.25] });
  const floorRoughness = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#b8b8b8"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = `rgba(255,255,255,${random() * 0.15})`;
      ctx.beginPath(); ctx.ellipse(random() * w, random() * h, 20 + random() * 70, 8 + random() * 20, random() * 3, 0, Math.PI * 2); ctx.fill();
    }
  }, { repeat: [4.5, 6.25], color: false });
  const woodMap = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#5b3931"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 580; i++) {
      const y = random() * h;
      ctx.strokeStyle = i % 3 ? "#d59c6430" : "#1f11172c";
      ctx.lineWidth = 0.5 + random() * 2;
      ctx.beginPath(); ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + random() * 11, w * 0.7, y - random() * 10, w, y + random() * 4); ctx.stroke();
    }
  });
  const plaster = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#77717b"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 16000; i++) {
      ctx.fillStyle = i % 2 ? "#ffffff12" : "#00000016";
      ctx.fillRect(random() * w, random() * h, 1, 1);
    }
  }, { repeat: [5, 2] });
  const ceilingMap = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#78737a"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#3f3b43"; ctx.lineWidth = 4; ctx.strokeRect(2, 2, w - 4, h - 4);
    for (let i = 0; i < 2800; i++) {
      ctx.fillStyle = "#2e293427"; ctx.fillRect(random() * w, random() * h, 1, 2);
    }
  }, { repeat: [9, 13] });
  const standard = (color, roughness = 0.65, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  return {
    floor: new THREE.MeshStandardMaterial({ map: floorMap, roughnessMap: floorRoughness, bumpMap: floorMap, bumpScale: 0.025, roughness: 0.7, metalness: 0.08 }),
    wood: new THREE.MeshStandardMaterial({ map: woodMap, bumpMap: woodMap, bumpScale: 0.018, roughness: 0.66 }),
    wall: new THREE.MeshStandardMaterial({ map: plaster, color: 0x55434e, bumpMap: plaster, bumpScale: 0.025, roughness: 0.9 }),
    ceiling: new THREE.MeshStandardMaterial({ map: ceilingMap, roughness: 0.96 }),
    charcoal: standard(0x18191d, 0.56), sand: standard(0xc0ac90, 0.62), cream: standard(0xbfb6a4, 0.7),
    chrome: standard(0x9b9ba0, 0.28, 0.75), brass: standard(0x8b6b48, 0.37, 0.55), rubber: standard(0x111217, 0.92),
    orange: standard(0xc15a23, 0.75), stem: standard(0x4c4530, 0.85),
    purpleGlow: new THREE.MeshBasicMaterial({ color: 0xb172d5 }),
    warmGlow: new THREE.MeshBasicMaterial({ color: 0xffdfb0 }),
    orangeGlow: new THREE.MeshBasicMaterial({ color: 0xffb34f }),
    redGlow: new THREE.MeshBasicMaterial({ color: 0xf14d3e }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xb6b2b1, metalness: 0.12, roughness: 0.13, transparent: true, opacity: 0.15, depthWrite: false })
  };
}

function vinylTexture(id) {
  return canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = "#101115"; ctx.fillRect(0, 0, 512, 512);
    for (let radius = 82; radius < 253; radius += 1.7) {
      ctx.strokeStyle = Math.round(radius) % 3 ? "#303137" : "#090a0c";
      ctx.lineWidth = 0.75;
      ctx.beginPath(); ctx.arc(256, 256, radius, 0, Math.PI * 2); ctx.stroke();
    }
    for (const start of [-0.8, 2.4]) {
      const sheen = ctx.createConicGradient(start, 256, 256);
      sheen.addColorStop(0, "#ddddea00"); sheen.addColorStop(0.055, "#ddddea28"); sheen.addColorStop(0.11, "#ddddea00"); sheen.addColorStop(1, "#ddddea00");
      ctx.fillStyle = sheen; ctx.fillRect(0, 0, 512, 512);
    }
    ctx.fillStyle = "#a8655d"; ctx.beginPath(); ctx.arc(256, 256, 76, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#f6dab1"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(256, 256, 69, 0, Math.PI * 2); ctx.stroke();
    ctx.textAlign = "center"; ctx.fillStyle = "#241a23"; ctx.font = `600 21px ${STORE_FONT}`; ctx.fillText("NEONBOY", 256, 226);
    ctx.font = `500 13px ${STORE_FONT}`; ctx.fillText(`DISCO ${id} · LADO A`, 256, 283); ctx.font = `400 11px ${STORE_FONT}`; ctx.fillText("33 ⅓ RPM · STEREO", 256, 300);
    ctx.fillStyle = "#eee0c9"; ctx.beginPath(); ctx.arc(256, 256, 12, 0, Math.PI * 2); ctx.fill();
  });
}

function vinyl(parent, texture, radius, x, y, z, materials) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const edge = cylinder(group, radius, 0.012, 0, 0, 0, materials.charcoal, 64);
  edge.rotation.x = Math.PI / 2;
  edge.castShadow = false;
  const surface = new THREE.Mesh(new THREE.RingGeometry(radius * 0.019, radius, 64),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.34, metalness: 0.23, side: THREE.DoubleSide }));
  surface.position.z = 0.008;
  group.add(surface);
  parent.add(group);
  return group;
}

function headphones(parent, x, y, z, m) {
  const group = new THREE.Group(); group.position.set(x, y, z); parent.add(group);
  const headband = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.033, 8, 28, Math.PI), m.charcoal);
  group.add(headband);
  const padding = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.024, 8, 24, Math.PI), m.rubber);
  group.add(padding);
  for (const side of [-1, 1]) {
    box(group, side * 0.23, -0.075, 0, 0.028, 0.16, 0.05, m.chrome, false);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), m.charcoal);
    ear.scale.set(0.55, 1.3, 0.9); ear.position.set(side * 0.23, -0.17, 0); group.add(ear);
    const cushion = ear.clone(); cushion.material = m.rubber; cushion.position.x -= side * 0.035; group.add(cushion);
  }
  wire(group, [[0.23, -0.23, 0], [0.31, -0.6, 0.04], [0.35, -0.94, 0.12], [0.12, -0.98, 0.18], [-0.12, -0.6, 0.1]], m.rubber, 0.009);
}

function turntable(parent, x, y, z, m, recordMap) {
  const group = new THREE.Group(); group.position.set(x, y, z); parent.add(group);
  box(group, 0, 0, 0, 1.18, 0.13, 0.84, m.charcoal);
  box(group, 0, 0.075, 0, 1.13, 0.035, 0.79, m.chrome, false);
  cylinder(group, 0.345, 0.04, -0.12, 0.11, 0, m.charcoal, 64);
  const record = vinyl(group, recordMap, 0.325, -0.12, 0.138, 0, m);
  record.rotation.x = -Math.PI / 2;
  cylinder(group, 0.012, 0.045, -0.12, 0.16, 0, m.chrome, 8);
  cylinder(group, 0.065, 0.05, 0.39, 0.13, -0.25, m.charcoal);
  wire(group, [[0.39, 0.2, -0.25], [0.38, 0.21, -0.02], [0.19, 0.2, 0.19], [0.14, 0.18, 0.2]], m.chrome, 0.014);
  box(group, 0.14, 0.16, 0.2, 0.06, 0.035, 0.1, m.charcoal, false);
  box(group, -0.46, 0.11, 0.3, 0.1, 0.02, 0.055, m.cream, false);
  box(group, -0.48, 0.127, 0.24, 0.025, 0.012, 0.025, m.redGlow, false);
  const lid = box(group, 0, 0.46, -0.36, 1.15, 0.7, 0.02, m.glass, false); lid.rotation.x = -0.22;
  return record;
}

function stereo(parent, x, y, z, m) {
  const group = new THREE.Group(); group.position.set(x, y, z); parent.add(group);
  box(group, 0, 0, 0, 1.17, 0.42, 0.44, m.charcoal);
  box(group, 0, 0, 0.231, 1.12, 0.36, 0.016, m.chrome, false);
  const panel = canvasTexture(768, 256, (ctx, w, h) => {
    ctx.fillStyle = "#191e22"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#b4d7a1"; ctx.font = "20px monospace"; ctx.fillText("STEREO  /  FM  102.9", 25, 37);
    for (let i = 0; i < 55; i++) { ctx.fillRect(25 + i * 13, 58, 2, i % 5 ? 9 : 18); }
    ctx.fillStyle = "#e8ba82"; ctx.fillRect(430, 50, 4, 38);
    for (const x of [195, 555]) {
      ctx.fillStyle = "#7b8281"; ctx.fillRect(x - 115, 103, 230, 129);
      ctx.fillStyle = "#12181e"; ctx.fillRect(x - 105, 113, 210, 109);
      for (const side of [-1, 1]) {
        ctx.strokeStyle = "#b2a88c"; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x + side * 52, 162, 27, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#a9adac"; ctx.beginPath(); ctx.arc(x + side * 52, 162, 8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = "#b6a68f"; ctx.font = "13px monospace"; ctx.fillText("AUTO REVERSE", x - 52, 209);
    }
  });
  plane(group, panel, -0.05, 0.01, 0.245, 0.85, 0.29);
  for (let i = 0; i < 3; i++) {
    const knob = cylinder(group, i ? 0.022 : 0.052, 0.035, 0.48, 0.1 - i * 0.11, 0.26, m.charcoal);
    knob.rotation.x = Math.PI / 2;
  }
  for (let i = 0; i < 6; i++) box(group, -0.35 + i * 0.12, -0.15, 0.26, 0.08, 0.025, 0.03, m.charcoal, false);
}

function pumpkin(parent, x, z, yaw, m) {
  const group = new THREE.Group(); group.position.set(x, 0, z); group.rotation.y = yaw; parent.add(group);
  const geometry = new THREE.SphereGeometry(0.39, 40, 24);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const px = positions.getX(i), pz = positions.getZ(i);
    const bulge = 1 + Math.cos(Math.atan2(pz, px) * 10) * 0.055;
    positions.setXYZ(i, px * bulge, positions.getY(i) * 0.79, pz * bulge);
  }
  geometry.computeVertexNormals();
  const body = new THREE.Mesh(geometry, m.orange); body.position.y = 0.34; body.castShadow = true;
  group.add(body);
  const stem = cylinder(group, 0.047, 0.19, 0, 0.69, 0, m.stem, 8); stem.rotation.z = -0.25;
  for (const side of [-1, 1]) {
    const shape = new THREE.Shape(); shape.moveTo(-0.07, -0.04); shape.lineTo(0.07, -0.04); shape.lineTo(0, 0.095); shape.closePath();
    const eye = new THREE.Mesh(new THREE.ShapeGeometry(shape), m.orangeGlow); eye.position.set(side * 0.14, 0.4, 0.348); eye.rotation.y = side * 0.3; group.add(eye);
  }
  const mouth = new THREE.Shape(); mouth.moveTo(-0.18, 0.02); mouth.lineTo(-0.1, -0.01); mouth.lineTo(-0.07, 0.03); mouth.lineTo(0, -0.015); mouth.lineTo(0.08, 0.03); mouth.lineTo(0.12, -0.01); mouth.lineTo(0.18, 0.02); mouth.quadraticCurveTo(0, -0.17, -0.18, 0.02);
  const grin = new THREE.Mesh(new THREE.ShapeGeometry(mouth), m.orangeGlow); grin.position.set(0, 0.25, 0.36); group.add(grin);
}

export function buildRecordStore(scene, albums, albumPositions, obstacles) {
  const root = new THREE.Group(); scene.add(root);
  const m = makeMaterials(), clickable = [], albumTargets = [], bulbs = [], records = [], flickeringLights = [];
  let resolveCovers;
  const coversReady = new Promise((resolve) => { resolveCovers = resolve; });
  const coverManager = new THREE.LoadingManager();
  coverManager.onLoad = () => resolveCovers();
  const coverLoader = new THREE.TextureLoader(coverManager);
  const covers = albums.map((album) => {
    const texture = album.cover ? coverLoader.load(album.cover) : signTexture(album.name, { height: 512, font: 60 });
    texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8; return texture;
  });
  const vinylMaps = albums.map((album) => vinylTexture(album.number));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(STORE_LAYOUT.roomWidth, STORE_LAYOUT.roomDepth), m.floor);
  floor.rotation.x = -Math.PI / 2; floor.position.z = STORE_LAYOUT.roomCenterZ; floor.receiveShadow = true; root.add(floor);
  box(root, 0, 2.7, STORE_LAYOUT.backWallZ, STORE_LAYOUT.roomWidth, 5.4, 0.35, m.wall, false);
  for (const side of [-1, 1]) {
    box(root, side * STORE_LAYOUT.sideWallX, 2.7, STORE_LAYOUT.roomCenterZ, 0.35, 5.4, STORE_LAYOUT.roomDepth, m.wall, false);
    box(root, side * 10.82, 0.51, STORE_LAYOUT.roomCenterZ, 0.15, 1.02, STORE_LAYOUT.roomDepth, m.wood, false);
    box(root, side * 10.7, 1.05, STORE_LAYOUT.roomCenterZ, 0.24, 0.065, STORE_LAYOUT.roomDepth, m.brass, false);
    box(root, side * 10.78, 4.48, STORE_LAYOUT.roomCenterZ, 0.09, 0.07, STORE_LAYOUT.roomDepth, m.purpleGlow, false);
    for (let z = -13; z < 15; z += 1.2) box(root, side * 10.7, 0.51, z, 0.08, 0.95, 0.025, m.charcoal, false);
  }
  box(root, 0, 4.9, STORE_LAYOUT.roomCenterZ, STORE_LAYOUT.roomWidth, 0.3, STORE_LAYOUT.roomDepth, m.ceiling, false);
  box(root, 0, 0.5, -13.78, STORE_LAYOUT.roomWidth, 1, 0.14, m.wood, false);
  box(root, 0, 4.48, -13.74, 21.9, 0.07, 0.08, m.purpleGlow, false);
  box(root, 0, 3.89, -13.67, 9, 1.14, 0.16, m.charcoal, false);
  sign(root, "NEONBOY MUSIC", 0, 4.02, -13.57, 8.5, 0.74, { width: 1024, font: 88, background: "#201e27", color: "#f5dcb7" });
  sign(root, "VINILOS · COMPACT DISC · CASSETTES", 0, 3.48, -13.57, 7.5, 0.28, { width: 1024, font: 44, background: "#784047", color: "#ffe3b4" });

  // Acoustic ceiling panels and louvred fluorescent fixtures belong to the room itself.
  for (const x of [-6, 0, 6]) for (const z of [-9, -2, 5, 12]) {
    box(root, x, 4.68, z, 1.06, 0.13, 2.2, m.charcoal, false);
    box(root, x, 4.59, z, 0.96, 0.03, 2.1, m.chrome, false);
    const flickerIndex = [[-6, -9], [-6, 5], [0, -2], [0, 12], [6, -9], [6, 5]]
      .findIndex(([fixtureX, fixtureZ]) => fixtureX === x && fixtureZ === z);
    const flickers = flickerIndex !== -1;
    const fixtureMaterial = flickers ? m.warmGlow.clone() : m.warmGlow;
    for (const side of [-1, 1]) {
      const tube = cylinder(root, 0.034, 1.94, x + side * 0.26, 4.54, z, fixtureMaterial, 10); tube.rotation.x = Math.PI / 2; tube.castShadow = false;
    }
    if (flickers) {
      const light = new THREE.PointLight(0xffdfc0, 32, 8, 2);
      light.position.set(x, 4.28, z); root.add(light);
      flickeringLights.push({ light, material: fixtureMaterial, color: fixtureMaterial.color.clone(), pattern: flickerIndex });
    }
    for (let offset = -0.9; offset <= 0.9; offset += 0.3) box(root, x, 4.5, z + offset, 0.98, 0.07, 0.022, m.chrome, false);
  }
  const keyLight = new THREE.DirectionalLight(0xffe4bd, 1.35);
  keyLight.position.set(-3, 8, 7); keyLight.target.position.set(0, 0, -2); keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  Object.assign(keyLight.shadow.camera, { left: -17, right: 17, top: 18, bottom: -16, near: 1, far: 35 });
  keyLight.shadow.bias = -0.0003; keyLight.shadow.normalBias = 0.04;
  root.add(keyLight, keyLight.target);

  const contactMap = canvasTexture(128, 128, (ctx) => {
    const gradient = ctx.createRadialGradient(64, 64, 18, 64, 64, 63);
    gradient.addColorStop(0, "#000000a0"); gradient.addColorStop(1, "#00000000"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
  });
  const contactMaterial = new THREE.MeshBasicMaterial({ map: contactMap, transparent: true, depthWrite: false, opacity: 0.48 });
  const sleeveGeometry = new THREE.PlaneGeometry(0.72, 0.72);
  const sleeveMaterials = covers.map((map) => new THREE.MeshStandardMaterial({ map, roughness: 0.62, side: THREE.DoubleSide }));
  const categories = ["INSTRUMENTALES", "9TH REVELATION", "VINILOS / NEONBOY", "SINGLES / NOVEDADES", "EDICIONES / 90s", "NUEVOS DISCOS"];
  obstacles.slice(0, 6).forEach((obstacle, bin) => {
    const group = new THREE.Group(); group.position.set(obstacle.x, 0, obstacle.z); root.add(group);
    const stock = bin === 0 ? albums.filter((album) => album.group === "instrumental") : bin === 1 ? albums.filter((album) => album.group === "band") : albums;
    const contact = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.1), contactMaterial); contact.rotation.x = -Math.PI / 2; contact.position.y = 0.012; group.add(contact);
    box(group, 0, 0.42, 0, 2.74, 0.78, 2.18, m.wood);
    box(group, 0, 0.14, 0, 2.55, 0.26, 2, m.charcoal);
    box(group, 0, 0.83, 0, 2.82, 0.1, 2.23, m.sand);
    for (const side of [-1, 1]) box(group, side * 1.36, 1.03, 0, 0.09, 0.35, 2.18, m.wood);
    box(group, 0, 1.02, 1.06, 2.72, 0.28, 0.09, m.wood);
    box(group, 0, 1.18, 1.08, 2.82, 0.045, 0.08, m.brass, false);
    for (const x of [-0.45, 0.45]) box(group, x, 1.03, 0, 0.025, 0.35, 2.08, m.sand, false);
    for (let col = 0; col < 3; col++) for (let row = 0; row < 7; row++) {
      const albumIndex = albums.indexOf(stock[(bin * 3 + col + row) % stock.length]);
      const sleeve = new THREE.Mesh(sleeveGeometry, sleeveMaterials[albumIndex]);
      sleeve.position.set((col - 1) * 0.88, 1.29 + (row % 3) * 0.018, -0.8 + row * 0.275);
      sleeve.rotation.x = -0.16 - row * 0.008;
      sleeve.userData.albumId = albums[albumIndex].id;
      group.add(sleeve); clickable.push(sleeve);
      albumTargets.push({ id: albums[albumIndex].id, x: obstacle.x + sleeve.position.x, z: obstacle.z + sleeve.position.z, reach: 2.1 });
      if (row === 6 && col === 1) {
        const record = vinyl(group, vinylMaps[albumIndex], 0.32, 0.21, 1.43, sleeve.position.z - 0.025, m);
        record.rotation.x = sleeve.rotation.x;
      }
    }
    for (let col = 0; col < 3; col++) {
      box(group, (col - 1) * 0.88, 1.3, -0.85, 0.78, 0.85, 0.025, m.cream, false);
      sign(group, ["A — D", "E — H", "I — L"][col], (col - 1) * 0.88, 1.72, -0.82, 0.53, 0.15, { font: 64, background: "#ded2ba", color: "#28242a" });
    }
    sign(group, categories[bin], 0, 0.6, 1.105, 2.35, 0.29, { font: 41, background: "#34212b", color: "#efcfa3" });
    sign(group, "33 RPM · STEREO", 0, 0.36, 1.106, 1.5, 0.14, { font: 44, background: "#5b3931", color: "#f6dfb4" });
  });

  for (const side of [-1, 1]) {
    const x = side * 8.2;
    box(root, x, 0.65, -2.8, 1.55, 1.3, 2.7, m.wood);
    box(root, x, 1.34, -2.8, 1.7, 0.12, 2.8, m.charcoal);
    records.push(turntable(root, x, 1.49, -2.1, m, vinylMaps[side < 0 ? 0 : 3]));
    stereo(root, x, 1.66, -3.6, m);
    headphones(root, x - 0.4, 2.15, -3.8, m);
    box(root, x - 0.4, 1.79, -3.81, 0.035, 0.65, 0.035, m.chrome, false);
    sign(root, "PUESTO DE ESCUCHA", x, 0.95, -1.44, 1.36, 0.19, { font: 42, background: "#c9b79b", color: "#2a2029" });
    for (const speakerZ of [-3.94, -1.72]) {
      const speakerX = x + side * 0.61;
      box(root, speakerX, 1.65, speakerZ, 0.28, 0.48, 0.25, m.charcoal);
      const cone = new THREE.Mesh(new THREE.RingGeometry(0.022, 0.09, 24), m.rubber); cone.position.set(speakerX, 1.62, speakerZ + 0.13); root.add(cone);
    }
  }

  albums.forEach((album, index) => {
    const spot = albumPositions[index];
    const display = new THREE.Group(); display.position.set(spot.x, 2.12, spot.z); display.rotation.y = spot.yaw; root.add(display);
    box(display, 0.15, -0.78, 0.14, 2.16, 0.09, 0.53, m.wood);
    box(display, 0.15, -0.72, 0.4, 2.16, 0.025, 0.035, m.brass, false);
    vinyl(display, vinylMaps[index], 0.69, 0.62, 0.13, -0.025, m);
    box(display, -0.22, 0.05, 0.015, 1.47, 1.47, 0.035, m.cream, false);
    const cover = plane(display, covers[index], -0.22, 0.05, 0.038, 1.43, 1.43, true);
    cover.userData.albumId = album.id; clickable.push(cover);
    albumTargets.push({ id: album.id, x: spot.x, z: spot.z, reach: 2.35 });
    const sticker = sign(display, album.incoming ? "INCOMING" : album.single ? "SINGLE" : "LP · 33 RPM", -0.6, -0.48, 0.047, 0.49, 0.16,
      { font: 48, background: album.incoming ? "#d18546" : "#e6d5af", color: "#2a2024" });
    sticker.rotation.z = -0.08;
    sign(display, album.name.toUpperCase(), 0.08, -0.9, 0.17, 1.31, 0.15, { font: 52, background: "#31252d", color: "#f1d7b4" });
    box(display, 0.12, 1.12, 0.21, 1.4, 0.07, 0.25, m.charcoal, false);
    box(display, 0.12, 1.07, 0.23, 1.27, 0.018, 0.12, m.warmGlow, false);
  });

  // Period props: a CRT at the register, cassette stock and jewel-case CD racks.
  const counter = new THREE.Group(); counter.position.set(STORE_LAYOUT.counter.x, 0, STORE_LAYOUT.counter.z); counter.rotation.y = Math.PI; root.add(counter);
  box(counter, 0, 0.58, 0, 3.25, 1.16, 1.5, m.wood);
  box(counter, 0, 1.19, 0, 3.4, 0.1, 1.62, m.sand);
  sign(counter, "CAJA · NEONBOY MUSIC", 0, 0.75, 0.76, 2.7, 0.35, { font: 41 });
  box(counter, -0.75, 1.38, -0.1, 0.82, 0.26, 0.62, m.cream);
  box(counter, -0.75, 1.7, -0.17, 0.76, 0.64, 0.64, m.cream);
  const crt = canvasTexture(512, 384, (ctx, w, h) => {
    ctx.fillStyle = "#102b2b"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#95bba0"; ctx.font = "25px monospace";
    ["NEONBOY / MUSIC STORE", "CATALOGO 199X", "----------------------", "VINILOS  CD  CASSETTES", "STEREO / ALTA FIDELIDAD"].forEach((text, i) => ctx.fillText(text, 20, 65 + i * 55));
    ctx.fillStyle = "#0b101438"; for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  });
  plane(counter, crt, -0.75, 1.72, 0.158, 0.6, 0.45);
  box(counter, -0.65, 1.285, 0.43, 0.86, 0.045, 0.24, m.charcoal, false);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 10; col++) box(counter, -1.02 + col * 0.078, 1.313, 0.35 + row * 0.067, 0.059, 0.016, 0.045, m.cream, false);
  box(counter, 0.64, 1.51, 0.05, 0.55, 0.58, 0.25, m.sand);
  sign(counter, "NEONBOY", 0.64, 1.51, 0.18, 0.44, 0.16, { background: "#c0ac90", color: "#45303b", font: 66 });
  wire(counter, [[0.47, 1.8, 0.05], [0.48, 1.98, 0.05], [0.79, 1.98, 0.05], [0.81, 1.8, 0.05]], m.brass, 0.012);
  const cdRack = new THREE.Group(); cdRack.position.set(STORE_LAYOUT.cdRack.x, 0, STORE_LAYOUT.cdRack.z); cdRack.rotation.y = -Math.PI / 2; root.add(cdRack);
  box(cdRack, 0, 0.94, 0, 2.5, 1.88, 0.7, m.charcoal);
  for (let row = 0; row < 4; row++) {
    box(cdRack, 0, 0.3 + row * 0.42, 0.42, 2.6, 0.045, 0.36, m.chrome, false);
    for (let col = 0; col < 6; col++) {
      box(cdRack, -1.02 + col * 0.4, 0.49 + row * 0.42, 0.27, 0.35, 0.35, 0.045, m.chrome, false);
      plane(cdRack, covers[(row * 6 + col) % covers.length], -1.02 + col * 0.4, 0.49 + row * 0.42, 0.297, 0.31, 0.31, true);
    }
  }
  sign(cdRack, "COMPACT DISC", 0, 2.16, 0.05, 2.4, 0.3, { background: "#d2bd9b", color: "#29232b", font: 58 });
  for (const [x, text] of [[-3.8, "INSTRUMENTALES"], [3.8, "9TH REVELATION"]]) {
    for (const offset of [-0.9, 0.9]) wire(root, [[x + offset, 4.7, 1.6], [x + offset, 3.9, 1.6]], m.chrome, 0.008);
    box(root, x, 3.66, 1.6, 2.8, 0.52, 0.06, m.cream, false);
    sign(root, text, x, 3.66, 1.637, 2.7, 0.44, { font: 42, background: "#b8aa92", color: "#30252c" });
  }

  for (const side of [-1, 1]) {
    box(root, side * 5.55, 2.3, STORE_LAYOUT.frontWallZ, 10.7, 4.4, 0.08, m.glass, false);
    box(root, side * 0.12, 2.3, STORE_LAYOUT.frontWallZ, 0.07, 4.5, 0.1, m.chrome, false);
    for (const z of [-12.3, 13.2]) pumpkin(root, side * 9.35, z, -side * 0.5, m);
    wire(root, [[side * 10.2, 4.32, -13], [side * 10.2, 4.02, -7], [side * 10.2, 4.31, -1], [side * 10.2, 4.04, 5], [side * 10.2, 4.3, 14]], m.rubber, 0.012);
    for (let z = -12.8, index = 0; z < 14.5; z += 1.35, index++) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), index % 3 ? m.orangeGlow : m.purpleGlow);
      bulb.position.set(side * 10.2, 4.16 + Math.cos(z * 0.58) * 0.1, z); root.add(bulb); bulbs.push(bulb);
    }
  }
  const batShape = new THREE.Shape();
  [[-0.5, 0.16], [-0.29, 0.06], [-0.16, 0.12], [-0.05, -0.04], [0, 0.1], [0.05, -0.04], [0.16, 0.12], [0.29, 0.06], [0.5, 0.16], [0.37, -0.14], [0.2, -0.07], [0.09, -0.2], [0, -0.1], [-0.09, -0.2], [-0.2, -0.07], [-0.37, -0.14]].forEach(([x, y], i) => i ? batShape.lineTo(x, y) : batShape.moveTo(x, y)); batShape.closePath();
  const batGeometry = new THREE.ShapeGeometry(batShape);
  for (let i = 0; i < 5; i++) {
    const bat = new THREE.Mesh(batGeometry, new THREE.MeshBasicMaterial({ color: 0x100c17, side: THREE.DoubleSide }));
    bat.position.set(-8.2 + i * 4.1, 3.8 + (i % 2) * 0.28, -11.8); bat.rotation.z = (i % 2 ? 1 : -1) * 0.17; root.add(bat);
    wire(root, [[bat.position.x, 4.7, -11.8], [bat.position.x, bat.position.y + 0.1, -11.8]], m.rubber, 0.004);
  }
  sign(root, "31 OCT · NOCHE DE DISCOS", 0, 2.98, -13.7, 5.6, 0.25, { width: 1024, font: 50, background: "#432635", color: "#ecb46f" });
  const kiosk = buildStoreJukebox(root, clickable, m);
  const atmosphere = buildStoreAtmosphere(root, flickeringLights);
  return { root, clickable, albumTargets, bulbs, records, atmosphere, ready: coversReady, ...kiosk };
}
