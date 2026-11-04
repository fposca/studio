import * as THREE from "three";
import { createHalloweenMirror } from "./halloweenMirror.js";

export const VHS_PICKUP_WIDTH = 0.28;

export const SECRET_POSITIONS = Object.freeze({
  phone: { x: -8.05, y: 1.245, z: 12.15, reach: 2.7 },
  mirror: { x: 10.78, y: 2.24, z: 8.55, reach: 2.1 },
  vhs: { x: -8.95, y: .58, z: -11.35, reach: 1.8 },
  tv: { x: -8.2, y: 1.55, z: -2.8, reach: 2.5 },
  vinyl: { x: 0, y: 1.28, z: -10.5, reach: 1.8 },
  secretVinyl: { x: 2.3, y: 1.28, z: -10.5, reach: 1.8 },
});
const SPECS = {
  phone: { width: .58, placeOnSurface: true, yaw: Math.PI },
  mirror: { height: 1.92, yaw: -Math.PI / 2 },
  vhs: { width: VHS_PICKUP_WIDTH },
  tv: { width: .91, placeOnSurface: true },
};
function makeVinylTexture(pink = false) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = pink ? "#ea5ba8" : "#0a0810"; ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = pink ? "#ffb9db" : "#a873c9"; ctx.lineWidth = 2;
  for (let r = 54; r < 126; r += 8) { ctx.beginPath(); ctx.arc(128, 128, r, 0, Math.PI * 2); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(128, 128, 48, 0, Math.PI * 2); ctx.fillStyle = "#603061"; ctx.fill();
  ctx.textAlign = "center"; ctx.fillStyle = "#f8d69e"; ctx.font = "bold 15px sans-serif";
  ctx.fillText("NEONBOY", 128, 117); ctx.font = "bold 19px sans-serif"; ctx.fillText(pink ? "SECRETOS" : "4 A\u00d1OS", 128, 143);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  return map;
}
export function createHalloweenSecretProps(scene, mirrorOptions = {}) {
  const root = new THREE.Group(); root.name = "Halloween / Secret props"; scene.add(root);
  const slots = {};
  for (const [kind, position] of Object.entries(SECRET_POSITIONS)) {
    slots[kind] = new THREE.Group();
    slots[kind].name = "Halloween / " + kind;
    slots[kind].position.set(position.x, position.y, position.z);
    if (SPECS[kind]?.yaw) slots[kind].rotation.y = SPECS[kind].yaw;
    root.add(slots[kind]);
  }
  const mirror = createHalloweenMirror(mirrorOptions);
  slots.mirror.add(mirror.root);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xd486ff, transparent: true, opacity: .32, side: THREE.DoubleSide, depthWrite: false });
  const vhsRing = new THREE.Mesh(new THREE.RingGeometry(.28, .32, 32), ringMaterial);
  vhsRing.rotation.x = -Math.PI / 2; vhsRing.position.y = -SECRET_POSITIONS.vhs.y + .04; slots.vhs.add(vhsRing);
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 512; labelCanvas.height = 160;
  const labelContext = labelCanvas.getContext("2d");
  labelContext.fillStyle = "#e7d6b8"; labelContext.fillRect(0, 0, 512, 160);
  labelContext.fillStyle = "#271e2d"; labelContext.font = "bold 32px sans-serif";
  labelContext.textAlign = "center";
  labelContext.fillText("NEONBOY", 256, 63);
  labelContext.font = "23px sans-serif";
  labelContext.fillText("ARCHIVOS 2022-2026", 256, 112);
  const labelMap = new THREE.CanvasTexture(labelCanvas);
  labelMap.colorSpace = THREE.SRGBColorSpace;
  const vhsLabel = new THREE.Mesh(new THREE.PlaneGeometry(VHS_PICKUP_WIDTH * .86, VHS_PICKUP_WIDTH * .28),
    new THREE.MeshBasicMaterial({ map: labelMap, side: THREE.DoubleSide }));
  vhsLabel.rotation.x = -Math.PI / 2;
  vhsLabel.position.y = .035;
  slots.vhs.add(vhsLabel);
  const vinylMap = makeVinylTexture();
  const vinyl = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .028, 48),
    [new THREE.MeshStandardMaterial({ color: 0x120e1a, metalness: .35, roughness: .35 }),
      new THREE.MeshStandardMaterial({ map: vinylMap, metalness: .28, roughness: .42 }),
      new THREE.MeshStandardMaterial({ map: vinylMap, metalness: .28, roughness: .42 })]);
  vinyl.rotation.x = Math.PI / 2; slots.vinyl.add(vinyl);
  const vinylRing = new THREE.Mesh(new THREE.RingGeometry(.46, .51, 32),
    new THREE.MeshBasicMaterial({ color: 0xe9b978, transparent: true, opacity: .65, side: THREE.DoubleSide, depthWrite: false }));
  vinylRing.rotation.x = -Math.PI / 2; vinylRing.position.y = -1.24; slots.vinyl.add(vinylRing);
  slots.vinyl.visible = false;
  const secretVinylMap = makeVinylTexture(true);
  const secretVinyl = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .032, 48),
    [new THREE.MeshStandardMaterial({ color: 0xe34191, metalness: .42, roughness: .3 }),
      new THREE.MeshStandardMaterial({ map: secretVinylMap, emissive: 0x6b173e, emissiveIntensity: .27, metalness: .25, roughness: .34 }),
      new THREE.MeshStandardMaterial({ map: secretVinylMap, emissive: 0x6b173e, emissiveIntensity: .27, metalness: .25, roughness: .34 })]);
  secretVinyl.rotation.x = Math.PI / 2; slots.secretVinyl.add(secretVinyl);
  const secretRing = new THREE.Mesh(new THREE.RingGeometry(.5, .57, 48),
    new THREE.MeshBasicMaterial({ color: 0xff75ba, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false }));
  secretRing.rotation.x = -Math.PI / 2; secretRing.position.y = -1.23; slots.secretVinyl.add(secretRing);
  slots.secretVinyl.visible = false;
  let vhsCollected = false, unlocked = false, secretUnlocked = false;
  return {
    root, slots,
    mount(kind, model) {
      const spec = SPECS[kind];
      if (!spec) return false;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
      const scale = spec.width ? spec.width / Math.max(size.x, .001) : spec.height / Math.max(size.y, .001);
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, (spec.placeOnSurface ? -bounds.min.y : -center.y) * scale, -center.z * scale);
      model.traverse((object) => { if (object.isMesh) { object.castShadow = false; object.receiveShadow = false; } });
      slots[kind].add(model);
      if (kind === "mirror") mirror.setDepth((bounds.max.z - center.z) * scale + .035);
      return true;
    },
    setVision: mirror.setVision,
    setMirrorPlayer: mirror.setPlayer,
    setReflectionEnabled: mirror.setEnabled,
    invalidateReflection: mirror.invalidate,
    setVhsCollected(value) { vhsCollected = value; slots.vhs.visible = !value; },
    setAnniversaryUnlocked(value) { unlocked = value; slots.vinyl.visible = value; },
    setSecretVinylUnlocked(value) { secretUnlocked = value; slots.secretVinyl.visible = value; },
    update(dt, elapsed) {
      if (!vhsCollected) { slots.vhs.rotation.y += dt * .27; slots.vhs.position.y = SECRET_POSITIONS.vhs.y + Math.sin(elapsed * 1.8) * .03; }
      if (unlocked) { slots.vinyl.rotation.y += dt * .36; slots.vinyl.position.y = SECRET_POSITIONS.vinyl.y + Math.sin(elapsed * 1.6) * .09; }
      if (secretUnlocked) { slots.secretVinyl.rotation.y -= dt * .31; slots.secretVinyl.position.y = SECRET_POSITIONS.secretVinyl.y + Math.sin(elapsed * 1.5 + 1) * .08; }
    },
    dispose() {
      mirror.dispose();
      vinylMap.dispose(); secretVinylMap.dispose(); labelMap.dispose();
    },
  };
}
