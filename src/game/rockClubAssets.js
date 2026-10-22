import * as THREE from "three";
import { disposeObjects } from "./disposeGameObjects.js";
import { limitRockClubTextures } from "./rockClubTextureBudget.js";

// Reuse the files already shared with the studio. The club has no separate copies.
const ASSETS = [
  { file: "bateria.optimized.glb", url: new URL("../assets/neonboy-animaciones/bateria.optimized.glb", import.meta.url).href,
    slots: ["drums"], fit: [2.38, 1.48, 1.8] },
  { file: "silla-bateria.glb", url: new URL("../assets/neonboy-animaciones/estudio-musica/silla-bateria.glb", import.meta.url).href,
    slots: ["drum-bench"], fit: [0.8, 0.85, 0.8] },
  { file: "studio_guitar_amp.glb", url: new URL("../assets/neonboy-animaciones/estudio-musica/studio_guitar_amp.glb", import.meta.url).href,
    slots: ["amp-left", "amp-right"], fit: [1.3, 1.48, 0.86] },
  { file: "studio_vocal_mic.glb", url: new URL("../assets/neonboy-animaciones/estudio-musica/studio_vocal_mic.glb", import.meta.url).href,
    slots: ["microphone"], fit: [0.56, 1.45, 0.56] },
  { file: "bajo.glb", url: new URL("../assets/neonboy-animaciones/club-de-rock/bajo.glb", import.meta.url).href,
    slots: ["bass"], fit: [0.48, 1.32, 0.28] },
  { file: "demon-guitar.glb", url: new URL("../assets/neonboy-animaciones/demon-guitar.glb", import.meta.url).href,
    slots: ["guitar"], fit: [0.72, 1.55, 0.42] },
];

export const ROCK_CLUB_PROP_ASSETS = [
  { id: "guitar", label: "Guitarra roja de John Zool" },
  { id: "guitar-stand", label: "Soporte de guitarra" },
  { id: "bass", label: "Bajo de Revenant" },
  { id: "bass-stand", label: "Soporte de bajo" },
  { id: "microphone", label: "Micrófono de Lilith-9" },
  { id: "drums", label: "Batería de Luján" },
  { id: "drum-bench", label: "Banco de batería" },
];

export function applyRockClubPropTransform(club, id, transform) {
  const slot = club?.slots.get(id);
  if (!slot || !transform) return false;
  slot.anchor.position.fromArray(transform.position);
  slot.anchor.rotation.set(...transform.rotation.map(THREE.MathUtils.degToRad));
  slot.anchor.scale.setScalar(transform.scale);
  const obstacle = club.obstacles.find((item) => item.id === id);
  if (obstacle) {
    obstacle.x = transform.position[0]; obstacle.z = transform.position[2];
    obstacle.hx = obstacle.hz = 0.3 * transform.scale;
  }
  return true;
}

function place(club, slotId, source, fit) {
  const slot = club.slots.get(slotId);
  if (!slot) return false;
  const model = source.clone(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.x + size.y + size.z) || Math.max(size.x, size.y, size.z) < 0.0001) return false;
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = Math.min(...fit.map((limit, index) => limit / Math.max(size.getComponent(index), 0.0001)));
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -bounds.min.y * scale + (["guitar", "bass"].includes(slotId) ? 0.16 : 0), -center.z * scale);
  model.traverse((object) => {
    if (object.isMesh) { object.castShadow = false; object.receiveShadow = true; }
  });
  model.name = `club-model:${slotId}`;
  slot.anchor.add(model);
  slot.placeholder.visible = false;
  return true;
}

export async function loadRockClubAssets(club, loader, isAlive) {
  const loaded = [];
  // Sequential parsing avoids a burst of large GLB allocations in Chrome.
  for (const asset of ASSETS) {
    if (!isAlive()) break;
    try {
      const gltf = await loader.loadAsync(asset.url);
      if (!isAlive()) { disposeObjects([gltf.scene]); break; }
      limitRockClubTextures(gltf.scene);
      for (const slot of asset.slots) if (place(club, slot, gltf.scene, asset.fit)) loaded.push(slot);
    } catch {
      // Procedural props remain visible if one asset is unavailable.
    }
  }
  return loaded;
}
