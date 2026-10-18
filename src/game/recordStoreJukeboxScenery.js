import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { STORE_LAYOUT } from "./recordStoreLayout.js";

export const JUKEBOX_POSITION = STORE_LAYOUT.jukebox;
export const COIN_TABLE_POSITION = STORE_LAYOUT.coinTable;
const FONT = '"Bahnschrift", "Segoe UI", sans-serif';
const mat = (color, metalness = 0.1, roughness = 0.5) => new THREE.MeshStandardMaterial({ color, metalness, roughness });

function box(parent, x, y, z, w, h, d, material, rounded = false) {
  const geometry = rounded ? new RoundedBoxGeometry(w, h, d, 3, Math.min(0.055, w / 4, h / 4, d / 4)) : new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
  return mesh;
}

function texture(width, height, paint) {
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  paint(canvas.getContext("2d"), width, height);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  return map;
}

function label(parent, text, x, y, z, w, h, background = "#231d25", color = "#e6d3ae") {
  const map = texture(Math.max(128, Math.round(128 * w / h)), 128, (ctx, width, height) => {
    ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#bc996455"; ctx.lineWidth = 2; ctx.strokeRect(8, 8, width - 16, height - 16);
    ctx.fillStyle = color; ctx.font = `500 78px ${FONT}`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, width / 2, height / 2 + 3, width - 45);
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide }));
  mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}

function archPanel(parent, radius, depth, y, z, material) {
  const shape = new THREE.Shape(); shape.moveTo(-radius, 0); shape.lineTo(radius, 0); shape.absarc(0, 0, radius, 0, Math.PI, false); shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.024, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 48, steps: 1 });
  geometry.translate(0, 0, -depth / 2);
  const mesh = new THREE.Mesh(geometry, material); mesh.position.set(0, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
}

function ring(parent, radius, tube, x, y, z, material, arc = Math.PI * 2) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 64, arc), material);
  mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}

export function buildStoreJukebox(root, clickable, storeMaterials) {
  const bronze = mat(0xb49a6a, 0.78, 0.3);
  const chrome = mat(0xd2d4d2, 0.92, 0.19);
  const dark = mat(0x111216, 0.3, 0.65);
  const walnut = storeMaterials.wood.clone(); walnut.color.set(0x9f7660); walnut.roughness = 0.38;
  const enamel = new THREE.MeshPhysicalMaterial({ color: 0x211b25, metalness: 0.3, roughness: 0.28, clearcoat: 0.85, clearcoatRoughness: 0.21 });
  const cream = new THREE.MeshPhysicalMaterial({ color: 0xd5c5a5, roughness: 0.35, clearcoat: 0.7 });
  const amber = new THREE.MeshStandardMaterial({ color: 0xffd6a0, emissive: 0xffa15c, emissiveIntensity: 1.4, roughness: 0.21 });
  const pink = new THREE.MeshStandardMaterial({ color: 0xc18caf, emissive: 0xb75291, emissiveIntensity: 0.8, roughness: 0.28 });
  const invisible = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const jukebox = new THREE.Group(); jukebox.name = "Rockola · gabinete de nogal y cromo";
  jukebox.position.set(JUKEBOX_POSITION.x, 0, JUKEBOX_POSITION.z); jukebox.rotation.y = JUKEBOX_POSITION.yaw;
  jukebox.scale.setScalar(1.12); root.add(jukebox);

  box(jukebox, 0, 1.54, 0, 2.2, 2.74, 0.9, walnut, true);
  archPanel(jukebox, 1.1, 0.9, 2.9, 0, walnut);
  box(jukebox, 0, 1.54, 0.48, 1.96, 2.65, 0.11, enamel, true);
  archPanel(jukebox, 0.97, 0.1, 2.9, 0.49, enamel);
  box(jukebox, 0, 0.12, 0.12, 2.22, 0.24, 1.03, dark, true);
  box(jukebox, 0, 0.28, 0.49, 2.13, 0.1, 0.17, chrome, true);
  for (const side of [-1, 1]) {
    box(jukebox, side * 1.02, 1.63, 0.49, 0.095, 2.58, 0.14, chrome, true);
    box(jukebox, side * 0.91, 1.63, 0.58, 0.026, 2.58, 0.045, bronze, true);
    box(jukebox, side * 0.82, 1.63, 0.61, 0.044, 2.58, 0.045, amber, true);
    box(jukebox, side * 0.75, 0.65, 0.65, 0.027, 0.65, 0.035, pink, true);
    for (let i = 0; i < 10; i++) box(jukebox, side * 1.104, 0.75 + i * 0.11, -0.03, 0.012, 0.028, 0.42, dark);
    for (const y of [0.42, 1.51, 2.78]) {
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 12), chrome);
      screw.rotation.x = Math.PI / 2; screw.position.set(side * 1.02, y, 0.572); jukebox.add(screw);
      box(jukebox, side * 1.02, y, 0.58, 0.023, 0.004, 0.002, dark);
    }
  }
  ring(jukebox, 1.02, 0.055, 0, 2.92, 0.52, chrome, Math.PI);
  ring(jukebox, 0.91, 0.018, 0, 2.92, 0.59, bronze, Math.PI);
  const neonArch = ring(jukebox, 0.82, 0.024, 0, 2.92, 0.61, amber, Math.PI);
  ring(jukebox, 0.32, 0.025, 0, 3.36, 0.59, chrome);
  ring(jukebox, 0.27, 0.01, 0, 3.36, 0.61, bronze);
  label(jukebox, "NB", 0, 3.38, 0.62, 0.39, 0.18);
  label(jukebox, "HI-FI", 0, 3.23, 0.62, 0.31, 0.08);
  label(jukebox, "N E O N B O Y", 0, 2.94, 0.64, 1.44, 0.2);
  label(jukebox, "VIDEO JUKEBOX  /  STEREO", 0, 2.73, 0.62, 1.34, 0.105);

  // Recessed CRT. Its image remains aligned with the playable world-space screen.
  box(jukebox, 0, 1.92, 0.59, 1.72, 1.24, 0.24, chrome, true);
  box(jukebox, 0, 1.92, 0.712, 1.59, 1.1, 0.095, dark, true);
  box(jukebox, 0, 1.92, 0.754, 1.49, 0.88, 0.035, enamel, true);
  const standbyMap = texture(1024, 576, (ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.6);
    gradient.addColorStop(0, "#294246"); gradient.addColorStop(1, "#070b13"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#a5c0b738"; ctx.lineWidth = 2; ctx.strokeRect(40, 38, w - 80, h - 76);
    ctx.textAlign = "center"; ctx.fillStyle = "#e8d6b7"; ctx.font = `500 78px ${FONT}`; ctx.fillText("NEONBOY", w / 2, 240);
    ctx.fillStyle = "#b0d1c7"; ctx.font = `400 30px ${FONT}`; ctx.fillText("VIDEO JUKEBOX", w / 2, 290);
    ctx.font = `500 25px ${FONT}`; ctx.fillText("INSERTÁ UNA MONEDA", w / 2, 405);
    ctx.fillStyle = "#8ca7a3"; ctx.font = `400 19px ${FONT}`; ctx.fillText("01 — 10     ·     ESTÉREO", w / 2, 449);
    ctx.fillStyle = "#00000022"; for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
    const shine = ctx.createLinearGradient(0, 0, w * 0.4, h); shine.addColorStop(0, "#e9ffff16"); shine.addColorStop(0.5, "#ffffff00");
    ctx.fillStyle = shine; ctx.fillRect(0, 0, w, h);
  });
  const standbyLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.46, 0.82), new THREE.MeshBasicMaterial({ map: standbyMap }));
  standbyLabel.position.set(0, 1.92, 0.78); jukebox.add(standbyLabel);
  box(jukebox, 0, 1.24, 0.65, 1.61, 0.24, 0.19, bronze, true);
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 0.225;
    box(jukebox, x, 1.26, 0.76, 0.18, 0.11, 0.05, dark, true);
    box(jukebox, x, 1.27, 0.792, 0.157, 0.075, 0.037, i === 2 ? amber : cream, true);
    label(jukebox, ["BACK", "STOP", "PLAY", "PAUSE", "NEXT"][i], x, 1.18, 0.754, 0.17, 0.037, "#ac9065", "#201e24");
  }
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.08, 32), chrome);
  knob.rotation.x = Math.PI / 2; knob.position.set(-0.68, 1.26, 0.81); jukebox.add(knob);
  ring(jukebox, 0.053, 0.006, -0.68, 1.26, 0.855, dark);
  box(jukebox, -0.68, 1.29, 0.861, 0.006, 0.03, 0.003, dark);
  box(jukebox, 0.69, 1.25, 0.77, 0.16, 0.2, 0.06, chrome, true);
  box(jukebox, 0.69, 1.27, 0.804, 0.018, 0.125, 0.009, dark, true);
  label(jukebox, "1 MONEDA · 1 VIDEO", 0, 1.04, 0.68, 1.3, 0.09);

  box(jukebox, 0, 0.65, 0.58, 1.53, 0.61, 0.19, dark, true);
  for (const x of [-0.37, 0.37]) {
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.24, 0.07, 48, 1, true), mat(0x353238, 0.05, 0.88));
    cone.rotation.x = -Math.PI / 2; cone.position.set(x, 0.65, 0.68); jukebox.add(cone);
    ring(jukebox, 0.24, 0.025, x, 0.65, 0.715, dark);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 12), dark); cap.scale.z = 0.45; cap.position.set(x, 0.65, 0.72); jukebox.add(cap);
  }
  const grilleMap = texture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#99948c"; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = "destination-out";
    for (let y = 8; y < h; y += 16) for (let x = 8; x < w; x += 16) { ctx.beginPath(); ctx.arc(x, y, 5.2, 0, Math.PI * 2); ctx.fill(); }
  });
  grilleMap.wrapS = grilleMap.wrapT = THREE.RepeatWrapping; grilleMap.repeat.set(4, 2);
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 0.54), new THREE.MeshStandardMaterial({ map: grilleMap, alphaTest: 0.4, metalness: 0.8, roughness: 0.4, side: THREE.DoubleSide }));
  grille.position.set(0, 0.65, 0.773); jukebox.add(grille);
  for (const y of [0.37, 0.93]) box(jukebox, 0, y, 0.78, 1.5, 0.022, 0.025, chrome, true);
  label(jukebox, "NEONBOY SOUND SYSTEM · 199X", 0, 0.29, 0.59, 1.12, 0.055);

  const jukeboxHit = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.4), invisible);
  jukeboxHit.position.set(0, 1.9, 0.89); jukeboxHit.userData.shopAction = "jukebox";
  jukebox.add(jukeboxHit); clickable.push(jukeboxHit);
  const glow = new THREE.PointLight(0xffba7e, 5, 4, 2);
  glow.position.set(0, 2.24, 0.95); jukebox.add(glow);

  const table = new THREE.Group();
  table.position.set(COIN_TABLE_POSITION.x, 0, COIN_TABLE_POSITION.z);
  root.add(table);
  box(table, 0, 0.87, 0, 1.35, 0.16, 0.82, walnut);
  box(table, 0, 0.96, 0, 1.42, 0.035, 0.88, bronze);
  for (const x of [-0.52, 0.52]) for (const z of [-0.28, 0.28]) box(table, x, 0.43, z, 0.1, 0.8, 0.1, walnut);
  label(table, "MONEDAS · TOMAR", 0, 0.63, 0.43, 1.18, 0.18);
  for (const x of [-0.51, 0.51]) box(table, x, 1.25, 0.31, 0.03, 0.5, 0.03, bronze);
  label(table, "10 FICHAS · TOMAR", 0, 1.55, 0.34, 1.32, 0.22);
  const coinGroup = new THREE.Group();
  coinGroup.position.y = 1.05;
  table.add(coinGroup);
  const fallbackCoins = [];
  const coinSpinners = [];
  const fallbackMaterial = mat(0xe9a83d, 0.76, 0.23);
  for (let index = 0; index < 10; index++) {
    const spinner = new THREE.Group();
    spinner.position.set(-0.4 + (index % 5) * 0.2, 0.17 + Math.floor(index / 5) * 0.035, index % 2 ? 0.1 : -0.08);
    spinner.userData.baseY = spinner.position.y;
    spinner.rotation.y = index * 0.37;
    coinGroup.add(spinner);
    coinSpinners.push(spinner);
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.023, 30), fallbackMaterial);
    coin.rotation.z = Math.PI / 2;
    spinner.add(coin);
    fallbackCoins.push(coin);
  }
  const coinHit = new THREE.Mesh(new THREE.PlaneGeometry(1.43, 0.9), invisible);
  coinHit.rotation.x = -Math.PI / 2;
  coinHit.position.y = 1.1;
  coinHit.userData.shopAction = "coins";
  table.add(coinHit);
  clickable.push(coinHit);
  const coinLamp = new THREE.PointLight(0xffbd63, 3, 2.6, 2);
  coinLamp.position.set(0, 1.5, 0);
  table.add(coinLamp);

  return { jukebox, table, coinGroup, coinSpinners, fallbackCoins, neonArch, glow, standbyLabel };
}
