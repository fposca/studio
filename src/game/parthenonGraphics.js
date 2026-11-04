import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const STONE_URL = new URL("../assets/environments/parthenon-weathered-stone-v2.png", import.meta.url).href;
const MARBLE_URL = new URL("../assets/environments/parthenon-pentelic-marble-v1.png", import.meta.url).href;
const RELIEF_URL = new URL("../assets/environments/parthenon-pediment-relief-v1.png", import.meta.url).href;

// Batch only fixed decoration. Moving doors, collision meshes and transparent effects retain their identity.
export function batchTempleDetails(parent, excluded = new Set()) {
  const batches = new Map();
  for (const object of parent.children) {
    if (!object.isMesh || object.isInstancedMesh || object.children.length || excluded.has(object)
      || Array.isArray(object.material) || object.material.transparent) continue;
    const key = object.material.uuid + ":" + object.castShadow + ":" + object.receiveShadow;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(object);
  }
  const replacedGeometries = new Set();
  for (const objects of batches.values()) {
    if (objects.length < 2) continue;
    const geometries = objects.map(object => {
      object.updateMatrix();
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      geometry.applyMatrix4(object.matrix); geometry.clearGroups();
      return geometry;
    });
    const merged = mergeGeometries(geometries);
    geometries.forEach(geometry => geometry.dispose());
    if (!merged) continue;
    const combined = new THREE.Mesh(merged, objects[0].material);
    combined.name = "batched temple carvings";
    combined.castShadow = objects[0].castShadow; combined.receiveShadow = objects[0].receiveShadow;
    for (const object of objects) { replacedGeometries.add(object.geometry); parent.remove(object); }
    parent.add(combined);
  }
  parent.traverse(object => { if (object.geometry) replacedGeometries.delete(object.geometry); });
  replacedGeometries.forEach(geometry => geometry.dispose());
}

function randomSource(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
function canvasMap(width, height, paint) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  paint(canvas.getContext("2d"));
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}
function stoneTexture(url) {
  const map = new THREE.TextureLoader().load(url);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 4;
  return map;
}
function mirrorDialMap() {
  return canvasMap(512, 512, ctx => {
    const gradient = ctx.createLinearGradient(50, 0, 460, 512);
    gradient.addColorStop(0, "#172f3a"); gradient.addColorStop(.35, "#7a9090");
    gradient.addColorStop(.48, "#c2c7b7"); gradient.addColorStop(.53, "#42595e");
    gradient.addColorStop(1, "#142732");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = "rgba(215,225,219,.12)"; ctx.lineWidth = 1;
    for (let r = 20; r < 250; r += 3) { ctx.beginPath(); ctx.arc(256, 256, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.strokeStyle = "#243c43"; ctx.lineWidth = 3;
    for (const r of [165, 172, 222]) { ctx.beginPath(); ctx.arc(256, 256, r, 0, Math.PI * 2); ctx.stroke(); }
    for (let i = 0; i < 48; i++) {
      ctx.save(); ctx.translate(256,256); ctx.rotate(i * Math.PI / 24);
      ctx.fillStyle = "#c1b78a"; ctx.fillRect(193, -2, i % 4 === 0 ? 23 : 9, 3); ctx.restore();
    }
    ctx.strokeStyle = "rgba(31,49,54,.45)";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(207,305);ctx.lineTo(305,207);ctx.lineTo(278,209);
    ctx.moveTo(305,207);ctx.lineTo(302,235);ctx.stroke();
  });
}

export function createTempleMaterials() {
  const stoneMap = stoneTexture(STONE_URL), marbleMap = stoneTexture(MARBLE_URL);
  const stone = new THREE.MeshStandardMaterial({ map: stoneMap, color: 0x97968e, roughness: .94,
    bumpMap: stoneMap, bumpScale: .065 });
  const marble = new THREE.MeshStandardMaterial({ map: marbleMap, color: 0xb3b4ad, roughness: .74,
    bumpMap: marbleMap, bumpScale: .035 });
  const paving = new THREE.MeshStandardMaterial({ map: marbleMap, color: 0x999d9d, roughness: .76,
    bumpMap: stoneMap, bumpScale: .022 });
  const dark = new THREE.MeshStandardMaterial({ map: stoneMap, color: 0x33363d, roughness: .82,
    bumpMap: stoneMap, bumpScale: .025 });
  const bronze = new THREE.MeshStandardMaterial({ color: 0x967b45, metalness: .72, roughness: .48,
    bumpMap: stoneMap, bumpScale: .012 });
  const oxidized = new THREE.MeshStandardMaterial({ color: 0x344b48, metalness: .55, roughness: .7,
    bumpMap: stoneMap, bumpScale: .025 });
  const shaftStone = marble.clone(); shaftStone.vertexColors = true;
  const reliefMap = new THREE.TextureLoader().load(RELIEF_URL);
  reliefMap.colorSpace = THREE.SRGBColorSpace;
  const relief = new THREE.MeshStandardMaterial({ map: reliefMap, color: 0xaaa39b, roughness: .9,
    bumpMap: reliefMap, bumpScale: .1 });
  const mirror = new THREE.MeshStandardMaterial({ map: mirrorDialMap(), metalness: .75, roughness: .31,
    color: 0xabc3c5, emissive: 0x17333d, emissiveIntensity: .3 });
  return { stone, marble, paving, dark, bronze, oxidized, shaftStone, relief, mirror };
}

// Meter-scale UVs avoid stretching a single patch of stone over an entire wall.
export function templeBoxGeometry(w, h, d, bevel = 0) {
  const geometry = bevel ? new RoundedBoxGeometry(w, h, d, 1, Math.min(bevel, h / 4, w / 4, d / 4))
    : new THREE.BoxGeometry(w, h, d);
  const p = geometry.attributes.position, n = geometry.attributes.normal, uv = geometry.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    uv.setXY(i, (Math.abs(n.getX(i)) > .5 ? p.getZ(i) : p.getX(i)) / 2.4,
      (Math.abs(n.getY(i)) > .5 ? p.getZ(i) : p.getY(i)) / 2.4);
  }
  return geometry;
}
function addMesh(parent, name, geometry, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name; mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh);
  return mesh;
}
function box(parent, name, material, size, position, bevel = .025) {
  return addMesh(parent, name, templeBoxGeometry(...size, bevel), material, ...position);
}
function instances(parent, name, geometry, material, transforms, tint = false) {
  const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
  mesh.name = name;
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  transforms.forEach((t, i) => {
    dummy.position.set(...t.position);
    dummy.rotation.set(...(t.rotation || [0, 0, 0]));
    dummy.scale.set(...(t.scale || [1, 1, 1]));
    dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
    if (tint) mesh.setColorAt(i, color.setScalar(t.tint ?? .9));
  });
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function columnGeometry(height = 4.2) {
  const geometry = new THREE.CylinderGeometry(.46, .52, height, 100, 12);
  const p = geometry.attributes.position, colors = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), theta = Math.atan2(z, x);
    const flute = 1 - .105 * (.5 + .5 * Math.cos(theta * 20));
    const entasis = 1 + .018 * Math.sin(Math.PI * (y / height + .5));
    p.setX(i, x * flute * entasis); p.setZ(i, z * flute * entasis);
    const patina = (.67 + .33 * THREE.MathUtils.smoothstep(y, -height / 2, -height / 2 + .9))
      * (.85 + .15 * (1 - Math.cos(theta * 20)) * .5);
    colors.push(patina, patina, patina * .97);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}
function meanderMap() {
  const map = canvasMap(256, 64, ctx => {
    ctx.fillStyle = "#292b30"; ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = "#96876b"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(256, 5); ctx.moveTo(0, 59); ctx.lineTo(256, 59); ctx.stroke();
    ctx.lineWidth = 4;
    for (let x = 0; x < 256; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 48); ctx.lineTo(x + 50, 48); ctx.lineTo(x + 50, 16);
      ctx.lineTo(x + 17, 16); ctx.lineTo(x + 17, 35); ctx.lineTo(x + 34, 35); ctx.stroke();
    }
  });
  map.wrapS = THREE.RepeatWrapping; return map;
}
function floorMedallion() {
  return canvasMap(512, 512, ctx => {
    ctx.strokeStyle = "#8f8373"; ctx.fillStyle = "#8f8373"; ctx.lineWidth = 2;
    for (const r of [222, 232, 184, 177]) { ctx.beginPath(); ctx.arc(256, 256, r, 0, Math.PI * 2); ctx.stroke(); }
    for (let i = 0; i < 48; i++) {
      const angle = i * Math.PI / 24;
      ctx.save(); ctx.translate(256, 256); ctx.rotate(angle);
      ctx.fillRect(189, -2, i % 4 === 0 ? 25 : 13, 3); ctx.restore();
    }
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.translate(256, 256); ctx.rotate(i * Math.PI / 3);
      ctx.strokeRect(-91, -91, 182, 182); ctx.restore();
    }
  });
}
function fractureMap() {
  return canvasMap(512, 512, ctx => {
    const random = randomSource(99);
    for (let i = 0; i < 5; i++) {
      let x = 256, y = 256;
      const angle = i * 1.7;
      ctx.strokeStyle = "rgba(27,30,32,.65)"; ctx.lineWidth = 1.2 + random();
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let j = 0; j < 7; j++) {
        x += Math.cos(angle + random() * .7) * 32; y += Math.sin(angle + random() * .7) * 32;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 170; i++) {
      ctx.fillStyle = "rgba(25,29,26," + (random() * .17) + ")";
      ctx.fillRect(random() * 512, random() * 512, random() * 15 + 2, random() * 4 + 1);
    }
  });
}
export function buildTempleArchitecture(root, m, obstacles, colliders, magenta) {
  const random = randomSource(2909);
  const solid = (name, w, h, d, x, y, z, mat = m.stone) => {
    const mesh = box(root, name, mat, [w, h, d], [x, y, z], .035);
    obstacles.push({ id: name, x, z, hx: w / 2, hz: d / 2 }); colliders.push(mesh);
    return mesh;
  };
  box(root, "temple foundation", m.dark, [31, .28, 57], [0, -.18, -11.5]);
  const tiles = [];
  for (let row = 0; row < 22; row++) for (let col = 0; col < 12; col++)
    tiles.push({ position: [(col - 5.5) * 2.55, -.065, -11.5 + (10.5 - row) * 2.55],
      rotation: [0, Math.floor(random() * 4) * Math.PI / 2, 0], tint: .78 + random() * .21 });
  const floor = instances(root, "individual worn marble paving", templeBoxGeometry(2.524, .12, 2.524, .017), m.paving, tiles, true);
  floor.castShadow = false;
  const borderMap = meanderMap(); borderMap.repeat.x = 20;
  const borderMaterial = new THREE.MeshStandardMaterial({ map: borderMap, roughness: .82 });
  for (const x of [-9.8, 9.8]) {
    const strip = addMesh(root, "Greek key floor inlay", new THREE.PlaneGeometry(55, .36), borderMaterial, x, .004, -11.5);
    strip.rotation.set(-Math.PI / 2, 0, Math.PI / 2); strip.castShadow = false;
  }
  const medallionMaterial = new THREE.MeshStandardMaterial({ map: floorMedallion(), transparent: true, depthWrite: false,
    roughness: .8, polygonOffset: true, polygonOffsetFactor: -1 });
  for (const [z, radius] of [[-3, 3.5], [-19, 3], [-35, 3.6]]) {
    const medallion = addMesh(root, "inlaid ritual mosaic", new THREE.PlaneGeometry(radius * 2, radius * 2), medallionMaterial, 0, .008, z);
    medallion.rotation.x = -Math.PI / 2; medallion.castShadow = false;
  }
  const crackMaterial = new THREE.MeshStandardMaterial({ map: fractureMap(), transparent: true, depthWrite: false,
    roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 });
  const cracks = [];
  for (let i = 0; i < 28; i++) cracks.push({ position: [(random() - .5) * 28, .01, 14 - random() * 51],
    rotation: [-Math.PI / 2, 0, random() * 6.28], scale: [1 + random(), 1 + random(), 1] });
  const crackMesh = instances(root, "fractured paving decals", new THREE.PlaneGeometry(2.1, 2.1), crackMaterial, cracks);
  crackMesh.castShadow = false;

  for (const x of [-15.7, 15.7]) {
    solid("muro perimetral", .8, 1.5, 58, x, .65, -11.5);
    box(root, "parapet coping", m.marble, [1.04, .18, 58], [x, 1.46, -11.5]);
    box(root, "parapet skirting", m.dark, [1.05, .22, 58], [x, .1, -11.5]);
  }
  solid("muro del santuario", 31, 4, .7, 0, 2, -40);
  for (let i = 0; i < 3; i++) box(root, "weathered arrival step", m.marble,
    [12 - i * 1.1, .16, 1.8], [0, -.12 - i * .11, 17.3 + i * 1.6]);

  const columns = [], feet = [], echini = [], caps = [], rings = [];
  for (const z of [12, 7, 2, -3, -8, -14, -20, -26, -32, -37]) for (const x of [-12.4, 12.4]) {
    columns.push({ position: [x, 2.2, z], tint: .84 + random() * .15 });
    feet.push({ position: [x, .13, z] }); caps.push({ position: [x, 4.49, z] });
    echini.push({ position: [x, 4.22, z] });
    for (const y of [.4, 1.45, 2.5, 3.55, 4.04]) rings.push({ position: [x, y, z] });
    obstacles.push({ id: "columna", x, z, radius: .57 });
  }
  const shafts = instances(root, "twenty fluted Doric columns", columnGeometry(), m.shaftStone, columns, true);
  colliders.push(shafts);
  instances(root, "column plinths", templeBoxGeometry(1.44, .25, 1.44, .035), m.stone, feet);
  instances(root, "Doric echinus capitals", new THREE.CylinderGeometry(.66, .47, .29, 32), m.marble, echini);
  instances(root, "carved abacus", templeBoxGeometry(1.38, .24, 1.38, .025), m.stone, caps);
  instances(root, "column drum seams", new THREE.CylinderGeometry(.49, .49, .018, 32), m.stone, rings);

  const dentils = [], triglyphs = [], masonry = [];
  for (const z of [12, -8, -26, -37]) {
    box(root, "layered architrave", m.stone, [26, .42, 1.35], [0, 4.78, z]);
    box(root, "architrave lower fillet", m.marble, [26.3, .13, 1.55], [0, 4.54, z]);
    box(root, "cornice", m.marble, [26.55, .19, 1.65], [0, 5.08, z]);
    for (let x = -12.5; x < 13; x += .65) dentils.push({ position: [x, 4.93, z + .7] });
    for (let x = -12; x <= 12; x += 2) triglyphs.push({ position: [x, 4.77, z + .69] });
  }
  instances(root, "cornice dentils", templeBoxGeometry(.22, .18, .25), m.marble, dentils);
  instances(root, "Doric frieze triglyphs", templeBoxGeometry(.22, .31, .06), m.dark, triglyphs);
  const gates = [];
  for (const [z, name] of [[-10.7, "puerta de los guardianes"], [-26, "acceso al santuario"]]) {
    for (const x of [-10, 10]) {
      solid("muro " + name, 12, 3.7, .8, x, 1.85, z);
      for (let row = 0; row < 5; row++) for (let col = 0; col < 6; col++)
        masonry.push({ position: [x - 4.98 + col * 1.99, .36 + row * .72, z + .4],
          tint: .78 + random() * .2 });
      box(root, "wall skirting", m.dark, [12, .25, 1], [x, .15, z]);
      box(root, "wall crown", m.marble, [12.1, .18, 1.05], [x, 3.76, z]);
    }
    const slab = solid(name, 8, 3.5, .6, 0, 1.75, z, m.dark);
    const obstacle = obstacles.at(-1);
    const bars = [-3.4, -1.7, 0, 1.7, 3.4].map(x =>
      box(root, "dimensional gate seam", magenta, [.035, 2.85, .64], [x, 1.75, z], 0));
    for (const side of [-1, 1]) {
      box(slab, "door inset", m.oxidized, [3.55, 2.65, .08], [side * 1.93, 0, .34]);
      for (const x of [-1.58, 1.58]) box(slab, "bronze gate fillet", m.bronze,
        [.05, 2.65, .045], [side * 1.93 + x, 0, .4]);
      for (const y of [-1.3, 1.3]) box(slab, "bronze gate crosspiece", m.bronze,
        [3.22, .06, .045], [side * 1.93, y, .4]);
      const boss = addMesh(slab, "hammered gate boss", new THREE.SphereGeometry(.27, 16, 10), m.bronze, side * 1.93, .06, .43);
      boss.scale.z = .3;
      const ring = addMesh(slab, "gate concentric carving", new THREE.TorusGeometry(.68, .025, 6, 48), m.bronze, side * 1.93, .06, .42);
      ring.castShadow = false;
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        box(slab, "radial gate engraving", m.bronze, [.07, .16, .035],
          [side * 1.93 + Math.cos(a) * .51, .06 + Math.sin(a) * .51, .43], 0).rotation.z = a;
      }
    }
    for (const x of [-4.17, 4.17]) box(root, "carved gateway jamb", m.marble, [.38, 3.95, 1.02], [x, 1.98, z]);
    box(root, "gateway lintel", m.marble, [8.8, .33, 1.08], [0, 3.88, z]);
    const triangle = new THREE.Shape();
    triangle.moveTo(-4.5, 0); triangle.lineTo(4.5, 0); triangle.lineTo(0, 1.45); triangle.closePath();
    addMesh(root, "temple pediment", new THREE.ExtrudeGeometry(triangle, { depth: .4, bevelEnabled: false }), m.stone, 0, 4.1, z - .2);
    const relief = addMesh(root, "sculpted pediment frieze", new THREE.PlaneGeometry(5.7, .72), m.relief, 0, 4.49, z + .22);
    relief.castShadow = false;
    for (const sign of [-1, 1]) {
      const rake = box(root, "pediment raking cornice", m.marble, [4.8, .2, .65], [sign * 2.25, 4.82, z]);
      rake.rotation.z = -sign * Math.atan2(1.45, 4.5);
    }
    gates.push({ slab, bars, obstacle });
  }
  for (let row = 0; row < 5; row++) for (let col = 0; col < 15; col++)
    masonry.push({ position: [-13.93 + col * 1.99, .36 + row * .72, -39.6], tint: .78 + random() * .18 });
  for (const x of [-7.4, -2.5, 2.5, 7.4]) {
    box(root, "sanctuary wall pilaster", m.marble, [.28, 3.8, .26], [x, 1.9, -39.45]);
    box(root, "sanctuary pilaster foot", m.dark, [.53, .3, .43], [x, .15, -39.4]);
  }
  box(root, "sanctuary cornice", m.marble, [31, .2, 1], [0, 3.95, -39.9]);
  instances(root, "chamfered ashlar masonry", templeBoxGeometry(1.96, .69, .1, .023), m.stone, masonry, true);

  const rubble = [];
  for (const [x, z, size] of [[-8, 5.8, 1.4], [-7, -13, 1.1], [9, -24, 1.2], [6, -34, 1.5]]) {
    const drum = addMesh(root, "fallen fluted column drum", columnGeometry(1.4), m.shaftStone, x, .52, z);
    drum.rotation.set(Math.PI / 2, .18, z * .13); drum.scale.setScalar(size);
    obstacles.push({ id: "ruina", x, z, radius: size * .7 }); colliders.push(drum);
    for (let i = 0; i < 5; i++) rubble.push({ position: [x + (random() - .5) * 2.4, .08, z + (random() - .5) * 2.4],
      rotation: [random(), random() * 6.28, random()], scale: [.15 + random() * .2, .07 + random() * .1, .13 + random() * .2] });
  }
  for (let i = 0; i < 55; i++) rubble.push({ position: [(i % 2 ? -1 : 1) * (13.4 + random() * 1.6), .07, 14 - random() * 52],
    rotation: [random(), random() * 6.28, random()], scale: [.1 + random() * .3, .06 + random() * .12, .1 + random() * .3] });
  instances(root, "scattered marble chips", new THREE.DodecahedronGeometry(1, 0), m.stone, rubble, true);
  batchTempleDetails(root, new Set([...colliders, ...gates.flatMap(g => [g.slab, ...g.bars])]));
  return { gates };
}

export function dressTempleMechanisms(root, m, { guardians, seals, mirrors, prismStand, pedestal, altarSlot }) {
  const existing = new Set(root.children);
  for (const g of [...guardians, ...seals]) {
    const x = g.position.x, z = g.position.z - .2;
    box(root, "moulded receptor foot", m.marble, [1.3, .13, 1.3], [x, .49, z]);
    box(root, "receptor bronze band", m.bronze, [.94, .06, .95], [x, .64, z], .01);
    const shoulder = addMesh(root, "carved guardian shoulders", new THREE.SphereGeometry(.36, 16, 10), m.marble, x, 1.67, z);
    shoulder.scale.set(1.55, .57, .77);
    const crown = addMesh(root, "guardian laurel", new THREE.TorusGeometry(.275, .035, 8, 24), m.bronze, x, 2.04, z);
    crown.rotation.x = Math.PI / 2;
    const halo = addMesh(root, "mechanism bronze housing", new THREE.TorusGeometry(.44, .06, 10, 48), m.bronze, x, 2.45, z + .2);
    const rivets = [];
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      rivets.push({ position: [Math.cos(a) * .44, Math.sin(a) * .44, .055] });
    }
    instances(halo, "receptor housing rivets", new THREE.SphereGeometry(.025, 6, 4), m.oxidized, rivets);
  }
  for (const mirror of mirrors) {
    const { x, z } = mirror.position;
    box(root, "reflector stepped plinth", m.stone, [1.7, .18, .85], [x, .1, z]);
    for (const y of [.32, 2.33]) box(root, "reflector engraved lintel", m.bronze, [1.45, .12, .44], [x, y, z]);
    for (const side of [-1, 1]) box(root, "reflector side moulding", m.oxidized, [.1, 2, .4], [x + side * .64, 1.32, z]);
    const gear = addMesh(root, "astrolabe outer ring", new THREE.TorusGeometry(.61, .055, 8, 64), m.bronze, x, 1.45, z + .22);
    const marks = [];
    for (let i = 0; i < 24; i++) {
      const a = i * Math.PI / 12;
      marks.push({ position: [Math.cos(a) * .61, Math.sin(a) * .61, .045], rotation: [0, 0, a],
        scale: [1, i % 3 ? .5 : 1, 1] });
    }
    instances(gear, "astrolabe calibration marks", new THREE.BoxGeometry(.035, .1, .025), m.marble, marks);
    for (const side of [-1, 1]) {
      const handle = addMesh(root, "reflector adjustment handle", new THREE.TorusGeometry(.17, .035, 8, 20), m.bronze, x + side * .78, .8, z + .1);
      handle.rotation.y = Math.PI / 2;
    }
  }
  for (const [base,w,h,d] of [[prismStand,1.2,1.1,1.2],[pedestal,1.55,.4,1.55]]) {
    box(base, "carved pedestal upper rim", m.marble, [w * 1.05, .1, d * 1.05], [0, h / 2, 0]);
  }
  batchTempleDetails(root, existing);
  // These rings surround the existing altar without changing its interaction or collision footprint.
  for (const r of [1.5, 1.68]) {
    const ring = addMesh(altarSlot, "altar floor inlay", new THREE.TorusGeometry(r, .025, 6, 80), m.bronze, 0, .02, 0);
    ring.rotation.x = -Math.PI / 2;
  }
}
export function createTempleLectern(root, m, x, z) {
  const group = new THREE.Group(); group.position.set(x, 0, z - .25); root.add(group);
  box(group, "inscription base", m.stone, [1.65, .17, .85], [0, .09, 0]);
  const pillar = addMesh(group, "tapered inscription pedestal", new THREE.CylinderGeometry(.57, .69, 1.1, 4), m.dark, 0, .68, 0);
  pillar.rotation.y = Math.PI / 4; pillar.scale.z = .7;
  box(group, "inscription stone tablet", m.marble, [1.82, .12, .72], [0, 1.34, 0]).rotation.x = -.2;
  box(group, "engraved inscription surface", m.bronze, [1.65, .035, .59], [0, 1.415, 0]).rotation.x = -.2;
  for (let row = 0; row < 4; row++) box(group, "incised record script", m.oxidized,
    [1.12 - row * .12, .019, .018], [0, 1.435 + row * .022, .16 - row * .11], 0);
  return group;
}
export function createTempleUrn(root, m) {
  const urn = new THREE.Group(); urn.position.set(-7, 0, 5); root.add(urn);
  const points = [[.22,0],[.28,.07],[.24,.16],[.41,.29],[.47,.55],[.42,.76],[.29,.91],[.2,.97],[.2,1.08],[.3,1.12],[.31,1.19],[.22,1.19]];
  const body = addMesh(urn, "terracotta amphora", new THREE.LatheGeometry(points.map(p => new THREE.Vector2(...p)), 32), m.bronze);
  for (const y of [.18, .34, .75, 1.12]) {
    const band = addMesh(urn, "amphora decorative band", new THREE.TorusGeometry(y > 1 ? .28 : y > .7 ? .42 : y > .2 ? .44 : .28, .025, 6, 32), m.oxidized, 0, y, 0);
    band.rotation.x = Math.PI / 2;
  }
  for (const side of [-1, 1]) {
    const handle = addMesh(urn, "amphora loop handle", new THREE.TorusGeometry(.19, .043, 8, 24), m.bronze, side * .36, .89, 0);
    handle.scale.y = 1.4;
  }
  return urn;
}
