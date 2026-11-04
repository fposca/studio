import * as THREE from "three";
import { snapshotCanvasTexture } from "./halloweenTextures.js";
import { MATRIX_MESSAGES, REQUIRED_MATRIX_MESSAGES } from "./halloweenMatrixMessagesConfig.js";

export const MATRIX_MESSAGE_STYLES = Object.freeze({
  control: { background: "#f0eee6", color: "#101010", border: "#171717", font: '900 SIZEpx "Arial Narrow", Impact, "Arial Black", sans-serif', glow: 0 },
  awakening: { background: "#03130c", color: "#92ffb4", border: "#246841", font: 'bold SIZEpx "Consolas", monospace', glow: 3 },
  demonic: { background: "#19060b", color: "#ff6776", border: "#7b2537", font: 'bold SIZEpx "Consolas", monospace', glow: 2 },
});

function makeTexture(config) {
  const style = MATRIX_MESSAGE_STYLES[config.category];
  const canvas = document.createElement("canvas");
  canvas.width = config.visibility === "after-defeat" || config.scale[0] / config.scale[1] > 10 ? 1024 : 512;
  canvas.height = Math.max(32, Math.round(canvas.width * config.scale[1] / config.scale[0]));
  const ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.fillStyle = style.background; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = style.border; ctx.lineWidth = 2;
  ctx.strokeRect(5, 5, w - 10, h - 10);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const lines = config.text.split("\n");
  lines.forEach((text, i) => {
    let size = h * (lines.length > 1 ? .28 : .57);
    ctx.font = style.font.replace("SIZE", size);
    size *= Math.min(1, (w - 34) / Math.max(1, ctx.measureText(text).width));
    ctx.font = style.font.replace("SIZE", size);
    ctx.fillStyle = config.visibility === "after-defeat" && i === 1 ? "#f5fff7" : style.color;
    ctx.shadowColor = style.color; ctx.shadowBlur = style.glow;
    ctx.fillText(text, w / 2, h * (lines.length === 1 ? .52 : .32 + i * .38));
  });
  const source = new THREE.CanvasTexture(canvas);
  source.colorSpace = THREE.SRGBColorSpace; source.anisotropy = 4;
  source.name = "halloween-matrix-message:" + config.id;
  const texture = snapshotCanvasTexture(source);
  source.dispose();
  return texture;
}

// Bound to the existing Halloween scene and animation loop. Resources are lazy:
// normal play (or another season) does not allocate the message textures.
export function createHalloweenMatrixMessages(scene, { demon, enabled = true, configs = MATRIX_MESSAGES, getOccluders = () => [], onDiscover, textureFactory = makeTexture } = {}) {
  const entries = [], discovered = new Set();
  let geometry = null, active = false, finalEligible = false, scanIn = 0, noticeCooldown = 0;
  const frustum = new THREE.Frustum(), projection = new THREE.Matrix4(), raycaster = new THREE.Raycaster();
  const world = new THREE.Vector3(), normal = new THREE.Vector3(), towardEye = new THREE.Vector3();
  const direction = new THREE.Vector3(), cameraWorld = new THREE.Vector3(), hits = [];

  function initialize() {
    if (geometry || !enabled) return;
    geometry = new THREE.PlaneGeometry(1, 1);
    for (const config of configs) {
      const anchor = config.targetObjectId && config.targetObjectId !== "demon" ? scene.getObjectByName(config.targetObjectId) : scene;
      // Never leave a floating replacement if its source sign is absent.
      if (!anchor) continue;
      const texture = textureFactory(config);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0, depthWrite: false, side: THREE.FrontSide, toneMapped: false, fog: false });
      const front = new THREE.Mesh(geometry, material);
      front.name = "matrix-message:" + config.id;
      front.userData.halloweenCodeExclude = true;
      front.position.fromArray(config.position);
      front.rotation.fromArray([...config.rotation, "XYZ"]);
      front.scale.set(config.scale[0], config.scale[1], 1);
      front.visible = false;
      anchor.add(front);
      const faces = [front];
      if (config.doubleFace) {
        const back = front.clone(); back.name += ":reverse";
        back.position.z = -config.position[2]; back.rotation.y += Math.PI;
        anchor.add(back); faces.push(back);
      }
      entries.push({ config, faces, material, texture, offset: new THREE.Vector3(...config.position), opacity: 0, seenFor: 0 });
    }
  }

  function canRead(face, camera, player, occluders) {
    face.getWorldPosition(world);
    if (Math.hypot(world.x - player.x, world.z - player.z) > 7.5 || !frustum.containsPoint(world)) return false;
    towardEye.copy(cameraWorld).sub(world);
    const distance = towardEye.length();
    if (distance < .65) return false;
    normal.set(0, 0, 1).transformDirection(face.matrixWorld);
    if (normal.dot(towardEye.normalize()) < .3) return false;
    // A sign must occupy enough pixels to be legible, not just touch the frustum.
    const projectedHeight = face.scale.y / (distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 2);
    if (projectedHeight < .018) return false;
    raycaster.set(cameraWorld, direction.copy(world).sub(cameraWorld).normalize());
    raycaster.far = Math.max(0, distance - .045);
    hits.length = 0;
    raycaster.intersectObjects(occluders, false, hits);
    return hits.length === 0;
  }

  return {
    get entries() { return entries; },
    setActive(next) {
      next = Boolean(enabled && next);
      if (next === active) return;
      active = next;
      if (active) { initialize(); finalEligible = Boolean(demon?.defeated); scanIn = 0; }
      else for (const entry of entries) {
        entry.opacity = 0; entry.seenFor = 0; entry.material.opacity = 0;
        entry.faces.forEach(face => { face.visible = false; });
      }
    },
    update(dt, camera, player, { reducedMotion = false, locked = false } = {}) {
      if (!active) return;
      noticeCooldown = Math.max(0, noticeCooldown - dt);
      camera.updateMatrixWorld(true); camera.getWorldPosition(cameraWorld);
      for (const entry of entries) {
        const { config, faces, material } = entry;
        let show = config.visibility !== "after-defeat" || finalEligible;
        if (config.visibility === "near-demon") {
          show = Boolean(demon && !demon.defeated && Math.hypot(player.x - demon.position.x, player.z - demon.position.z) < 5.5);
          if (show) {
            faces[0].position.copy(demon.position).add(entry.offset);
            faces[0].rotation.y = Math.atan2(cameraWorld.x - faces[0].position.x, cameraWorld.z - faces[0].position.z);
          }
        }
        entry.opacity = show ? Math.min(1, entry.opacity + (reducedMotion ? 1 : dt / .3)) : 0;
        material.opacity = entry.opacity;
        faces.forEach(face => { face.visible = show; face.updateWorldMatrix(true, false); });
      }
      if (locked || discovered.size >= REQUIRED_MATRIX_MESSAGES) return;
      scanIn -= dt;
      if (scanIn > 0) return;
      scanIn = .25;
      projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projection);
      const occluders = getOccluders();
      for (const entry of entries) {
        if (discovered.size >= REQUIRED_MATRIX_MESSAGES) break;
        if (entry.config.visibility === "after-defeat" || discovered.has(entry.config.id)) continue;
        const readable = entry.opacity >= .8 && entry.faces.some(face => face.visible && canRead(face, camera, player, occluders));
        entry.seenFor = readable ? entry.seenFor + .25 : 0;
        if (entry.seenFor < .5) continue;
        discovered.add(entry.config.id);
        onDiscover?.(`matrix-message:${entry.config.id}`, entry.config.text, { silent: noticeCooldown > 0 });
        noticeCooldown = 4;
      }
    },
    dispose() {
      for (const entry of entries) {
        entry.faces.forEach(face => face.removeFromParent());
        entry.material.dispose(); entry.texture.dispose();
      }
      geometry?.dispose(); geometry = null; entries.length = 0; discovered.clear(); active = false;
    },
  };
}
