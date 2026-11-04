import * as THREE from "three";
import { loadRecordStoreGhost } from "./recordStoreGhost.js";
import { createLowDriftingFog } from "./lowDriftingFog.js";

const SLEEVE_SPOT = { x: -2.1, z: -12.05 };
const SLEEVE_WALL = { x: -2.1, y: 2.15, z: -13.48 };
export const ALTERED_STORE_GHOST_SPOT = Object.freeze({ x: 2.25, z: -11.9 });

function canvasMap(width, height, paint) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  paint(canvas.getContext("2d"), width, height);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

function sign(parent, text, width, height, color = "#f5c5ed") {
  const map = canvasMap(512, 256, (ctx, w, h) => {
    ctx.fillStyle = "#100b1d"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#b04391"; ctx.lineWidth = 8; ctx.strokeRect(9, 9, w - 18, h - 18);
    ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "bold 35px monospace"; ctx.fillText(text, w / 2, h / 2, w - 28);
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide, toneMapped: false }));
  parent.add(mesh);
  return mesh;
}

function scatterFallenStock(root, covers) {
  const scatter = new THREE.Group();
  scatter.name = "Discos y fundas caídos";
  root.add(scatter);
  const cardboard = new THREE.MeshStandardMaterial({ color: 0x60434b, roughness: .91, side: THREE.DoubleSide });
  const jacketEdge = new THREE.BoxGeometry(.88, .018, .88);
  const jacketFace = new THREE.PlaneGeometry(.82, .82);
  const coverMaterials = [0, 1, 2, 3, 6, 8].map((index) =>
    new THREE.MeshStandardMaterial({ map: covers[index % covers.length], roughness: .76, side: THREE.DoubleSide }));
  // Flat, non-colliding stock is kept around the bins and walls; the central route stays walkable.
  const jackets = [
    [-7.6, 11.3, -.22], [-5.8, 8.2, .47], [-6.5, 7.9, -.31], [-5.7, 7.5, .16], [-7.1, 6.8, -.62],
    [5.2, 10.6, .32], [5.8, 7.6, -.43], [6.5, 7.3, .19], [5.9, 6.8, .73], [7.5, 5.4, -.27],
    [-6.2, 2.1, .14], [-6.8, 1.7, -.55], [-5.8, 1.2, .4], [6.2, 1.3, -.2], [6.7, .6, .58],
    [-6.1, -5.1, .37], [-6.6, -5.4, -.13], [-5.7, -5.7, -.58], [6.1, -7.6, .24], [6.6, -8, -.39],
    [-8.6, -10.7, .28], [8.8, -10.3, -.53], [-1.9, -11.2, .3], [3.2, -10.8, -.24],
    [-1.25, 7.3, -.38], [1.05, 5.95, .44], [-.85, 3.35, .27],
    [1.2, -.95, -.62], [-1.15, -3.3, .19], [.7, -7.8, -.3]
  ];
  for (let i = 0; i < jackets.length; i++) {
    const [x, z, angle] = jackets[i];
    const jacket = new THREE.Group();
    jacket.position.set(x, .019 + (i % 3) * .009, z);
    jacket.rotation.y = angle;
    scatter.add(jacket);
    const edge = new THREE.Mesh(jacketEdge, cardboard);
    edge.position.y = .009;
    edge.receiveShadow = true;
    jacket.add(edge);
    const face = new THREE.Mesh(jacketFace, coverMaterials[i % coverMaterials.length]);
    face.rotation.x = -Math.PI / 2;
    face.position.y = .02;
    jacket.add(face);
  }
  const drawDisc = (labelColor) => canvasMap(512, 512, (ctx) => {
    ctx.clearRect(0, 0, 512, 512);
    ctx.fillStyle = "#09090d";
    ctx.beginPath(); ctx.arc(256, 256, 248, 0, Math.PI * 2); ctx.fill();
    for (let r = 83; r < 244; r += 3) {
      ctx.strokeStyle = r % 9 < 3 ? "#34313a" : "#19191f";
      ctx.lineWidth = .9;
      ctx.beginPath(); ctx.arc(256, 256, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = labelColor;
    ctx.beginPath(); ctx.arc(256, 256, 76, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#d4b6a3";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(256, 256, 66, 0, Math.PI * 2); ctx.stroke();
    ctx.textAlign = "center"; ctx.fillStyle = "#f5dfca";
    ctx.font = "bold 22px sans-serif"; ctx.fillText("NEONBOY", 256, 246);
    ctx.font = "17px sans-serif"; ctx.fillText("33 RPM", 256, 275);
    ctx.fillStyle = "#d4c4ad";
    ctx.beginPath(); ctx.arc(256, 256, 7, 0, Math.PI * 2); ctx.fill();
  });
  const discGeometry = new THREE.PlaneGeometry(.78, .78);
  const clusters = [
    [-6.1, 7.8, 9, 1.3], [6.3, 7.1, 9, 1.25], [-6.3, 1.5, 7, 1.15],
    [6.3, .7, 7, 1.1], [-6.1, -5.3, 7, 1.1], [6.6, -7.9, 7, 1.15],
    [-.1, 7, 8, 1.35], [.4, 4.4, 7, 1.2], [.2, -2.2, 6, 1.25], [.4, -7.4, 4, 1.1]
  ];
  let seed = 29131;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  const discPositions = clusters.flatMap(([x, z, count, radius]) =>
    Array.from({ length: count }, () => {
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * radius;
      return [x + Math.cos(angle) * distance, z + Math.sin(angle) * distance, random() * Math.PI * 2];
    }));
  const dummy = new THREE.Object3D();
  for (let variant = 0; variant < 2; variant++) {
    const points = discPositions.filter((_, index) => index % 2 === variant);
    const records = new THREE.InstancedMesh(discGeometry,
      new THREE.MeshStandardMaterial({
        map: drawDisc(variant ? "#7d354f" : "#9d6750"), transparent: true,
        alphaTest: .3, depthWrite: false, roughness: .38, metalness: .12, side: THREE.DoubleSide,
      }), points.length);
    points.forEach(([x, z, angle], index) => {
      dummy.position.set(x, .038 + (index % 3) * .006, z);
      dummy.rotation.set(-Math.PI / 2, 0, angle);
      dummy.scale.setScalar(.83 + (index % 4) * .075);
      dummy.updateMatrix();
      records.setMatrixAt(index, dummy.matrix);
    });
    records.instanceMatrix.needsUpdate = true;
    records.frustumCulled = false;
    scatter.add(records);
  }
}

export function createAlteredRecordStore(shop, { invaded = false } = {}) {
  const root = new THREE.Group();
  root.name = "La tienda alterada / FREQUENCY 09";
  shop.root.add(root);
  const fogBanks = [-12, -8, -4, 0, 4, 8, 12].flatMap((z, row) =>
    [-9, -6, -3, 0, 3, 6, 9].map((x, column) => ({
      x, z: z + Math.sin(column * 1.7 + row) * .55,
      y: .24 + ((row + column) % 3) * .025, height: .96, width: 5.8 + (column % 2) * .4,
      color: invaded ? 0x413342 : 0xb58b91, opacity: invaded ? (z < -4 ? .32 : .09) : .6, phase: (row * 7 + column) * 2.39996,
      driftX: .4, driftZ: .35, widthDrift: .3,
    })));
  const lowFog = createLowDriftingFog(root, fogBanks, { name: "store knee-high drifting smoke" });
  const wood = new THREE.MeshStandardMaterial({ color: 0x55343b, roughness: .72 });
  const edge = new THREE.MeshStandardMaterial({ color: 0x9f775a, roughness: .5, metalness: .25 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x0c0b16, roughness: .42, metalness: .3 });
  const box = (parent, x, y, z, w, h, d, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
  };
  // Wall-side damage leaves the aisles and all existing hit areas clear.
  const tilted = new THREE.Group();
  tilted.position.set(9.7, 0, -7.3);
  tilted.rotation.z = -.095; root.add(tilted);
  box(tilted, 0, .74, 0, 1.6, 1.45, .42, wood);
  for (const y of [.34, .78, 1.21]) box(tilted, 0, y, .25, 1.72, .055, .52, edge);
  for (let i = 0; i < 9; i++) {
    const item = box(tilted, -.65 + i * .155, .94, .29, .12, .36 + i % 3 * .08, .08, i % 3 ? dark : wood);
    item.rotation.z = (i - 4) * .016;
  }
  const carton = new THREE.Group(); carton.position.set(8.9, .18, -10.2);
  carton.rotation.set(.04, .43, -.19); root.add(carton);
  box(carton, 0, 0, 0, .8, .33, .58, wood);
  box(carton, 0, .2, -.23, .81, .07, .22, edge);
  box(carton, -.4, .2, 0, .07, .07, .58, edge);
  scatterFallenStock(root, shop.covers);
  for (const [x, z, yaw] of [[-8.7, -6.9, -.32], [8.8, 2.2, .43]]) {
    const crate = new THREE.Group();
    crate.position.set(x, .18, z);
    crate.rotation.set(.09, yaw, -.22);
    root.add(crate);
    box(crate, 0, 0, 0, .78, .33, .64, wood);
    box(crate, -.35, .2, 0, .08, .07, .62, edge);
    box(crate, .18, .19, -.3, .43, .06, .13, edge);
    for (let i = 0; i < 4; i++) {
      const jacket = box(crate, -.17 + i * .11, .28, .02, .025, .46, .52, i % 2 ? dark : wood);
      jacket.rotation.z = -.3 + i * .13;
    }
  }
  // The real ceiling fixtures change only in this variant.
  for (const fixture of shop.ceilingFixtures) {
    const key = String(fixture.x) + "," + String(fixture.z);
    if (["-6,5", "6,-9", "0,5", "-6,12"].includes(key)) {
      fixture.alteredMode = "burned";
      fixture.material.color.setHex(0x282125);
      box(root, fixture.x, 4.46, fixture.z, .82, .025, 1.83, dark, false);
    } else {
      fixture.alteredMode = "red";
      fixture.material.color.setHex(0xd3163b);
      fixture.light?.color.setHex(0xff1839);
    }
  }
  for (const [x, z, tilt, title] of [[-10.68, -7.15, -.14, "F / 09"], [10.68, 3.2, .12, "NO SIGNAL"]]) {
    const poster = new THREE.Group(); poster.position.set(x, 2.75, z); poster.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    poster.rotation.z = tilt; root.add(poster);
    box(poster, 0, 0, -.02, 1.35, 1.5, .04, edge);
    sign(poster, title, 1.22, 1.35);
  }
  const cracks = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position",
    new THREE.Float32BufferAttribute([
      9.1,.012,-8.8, 9.45,.012,-8.45, 9.45,.012,-8.45, 9.26,.012,-8.14,
      9.45,.012,-8.45, 9.83,.012,-8.32, 9.83,.012,-8.32, 10.05,.012,-7.97,
      -9.9,1.5,-12.9, -9.6,1.86,-12.9, -9.6,1.86,-12.9, -9.77,2.12,-12.9,
    ],3)), new THREE.LineBasicMaterial({ color: 0x17111e }));
  root.add(cracks);
  const damagedLamp = new THREE.Mesh(new THREE.BoxGeometry(.9,.08,1.8),
    new THREE.MeshStandardMaterial({ color: 0x7b6870, emissive: 0x70111e, emissiveIntensity: .25 }));
  damagedLamp.position.set(6,4.46,-9); damagedLamp.rotation.z = -.11; root.add(damagedLamp);

  // The anomalous sleeve hangs in the gap between the two central album displays.
  const sleeve = new THREE.Group();
  sleeve.position.set(SLEEVE_WALL.x, SLEEVE_WALL.y, SLEEVE_WALL.z);
  root.add(sleeve);
  const sleeveFrame = box(sleeve, 0, 0, 0, 1.22, 1.22, .08,
    new THREE.MeshStandardMaterial({
      color: 0x18111f, metalness: .54, roughness: .34,
      emissive: 0xb5288c, emissiveIntensity: .35,
    }));
  const sleeveMap = canvasMap(512, 512, (ctx, w, h) => {
    const background = ctx.createLinearGradient(0, 0, w, h);
    background.addColorStop(0, "#1a1024");
    background.addColorStop(.6, "#090714");
    background.addColorStop(1, "#361025");
    ctx.fillStyle = background; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#ed62ba"; ctx.lineWidth = 12; ctx.strokeRect(15, 15, w - 30, h - 30);
    ctx.strokeStyle = "#81436f"; ctx.lineWidth = 3;
    for (let index = 0; index < 13; index++) {
      const lineY = 94 + index * 27;
      ctx.beginPath(); ctx.moveTo(22, lineY); ctx.lineTo(w - 22, lineY - (index % 3) * 3); ctx.stroke();
    }
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#f4c5e7"; ctx.font = "bold 48px monospace";
    ctx.fillText("FREQUENCY", w / 2, 89);
    ctx.strokeStyle = "#d455aa"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(w / 2, 280, 145, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#fff0dc"; ctx.font = "bold 186px monospace";
    ctx.fillText("09", w / 2, 280);
    ctx.fillStyle = "#f3a6d4"; ctx.font = "bold 29px monospace";
    ctx.fillText("NO CATALOGADO", w / 2, 440);
  });
  const sleeveCover = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1),
    new THREE.MeshBasicMaterial({
      map: sleeveMap, transparent: true, opacity: 1,
      side: THREE.DoubleSide, toneMapped: false, depthWrite: false,
    }));
  sleeveCover.position.z = .046;
  sleeve.add(sleeveCover);
  const clueLight = new THREE.PointLight(0xd84ab0, 0, 4, 2);
  sleeve.visible = false;
  clueLight.visible = false;
  clueLight.position.set(SLEEVE_WALL.x, SLEEVE_WALL.y, SLEEVE_WALL.z + .55);
  root.add(clueLight);

  // Overlay is independent of the normal CRT/video projection.
  const crt = sign(shop.jukebox, "09 / LA PUERTA ESTÁ ABIERTA", 1.46, .82);
  crt.position.set(0, 1.92, .797);
  crt.visible = false;
  const signalLight = new THREE.PointLight(0xf13cae, 0, 4.5, 2);
  signalLight.position.set(0, 2, .7); shop.jukebox.add(signalLight);
  const ghostAnchor = new THREE.Group();
  ghostAnchor.position.set(ALTERED_STORE_GHOST_SPOT.x, 0, ALTERED_STORE_GHOST_SPOT.z); root.add(ghostAnchor);
  let ghost = null;
  const ghostLight = new THREE.PointLight(0x9b4a8c, 0, 5.2, 2);
  ghostLight.position.set(ALTERED_STORE_GHOST_SPOT.x, 2.1, ALTERED_STORE_GHOST_SPOT.z + .1); root.add(ghostLight);
  return {
    interactions: [{ id: "strange-record", label: "disco extraño", ...SLEEVE_SPOT, reach: 1.9 }],
    setClueVisible(visible) { sleeve.visible = visible; clueLight.visible = visible; },
    loadGhost(loader, isAlive) {
      return loadRecordStoreGhost(loader, ghostAnchor, isAlive, 2.45)
        .then((loaded) => { ghost = loaded; return Boolean(loaded); }).catch(() => false);
    },
    update(dt, elapsed, event, age, reducedMotion, camera) {
      lowFog.update(dt, reducedMotion, dt === 0, camera);
      const jukebox = event === "jukebox";
      const apparition = event === "ghost";
      crt.visible = jukebox && (!reducedMotion ? Math.sin(age * 21) > -.35 : true);
      signalLight.intensity = jukebox ? 11 + Math.sin(age * 15) * 3 : 0;
      const ghostOpacity = apparition
        ? Math.max(0, Math.min(.72, (age - .6) * 1.7, (3.75 - age) * 1.7))
        : 0;
      ghostLight.intensity = ghostOpacity > 0 ? ghostOpacity * (6.8 + Math.sin(age * 8) * .6) : 0;
      ghost?.update(dt, elapsed, ghostOpacity > 0, ghostOpacity);
      damagedLamp.material.emissiveIntensity = reducedMotion ? .2 : .12 + Math.max(0, Math.sin(elapsed * 7)) * .15;
      const pulse = reducedMotion ? .7 : .5 + .5 * Math.sin(elapsed * 3.8);
      const flicker = reducedMotion || Math.sin(elapsed * 14.7) <= .92 ? 1 : .26;
      sleeve.position.y = SLEEVE_WALL.y + (reducedMotion ? 0 : Math.sin(elapsed * 1.7) * .014);
      sleeve.rotation.z = reducedMotion ? 0 : Math.sin(elapsed * 1.1) * .018;
      sleeveFrame.material.emissiveIntensity = (.25 + pulse * .55) * flicker;
      sleeveCover.material.opacity = (.88 + pulse * .12) * flicker;
      clueLight.intensity = sleeve.visible ? (2 + pulse * 2.8) * flicker : 0;
    },
    dispose() { ghost?.dispose(); },
  };
}
