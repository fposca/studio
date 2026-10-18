import * as THREE from "three";
import defaultTransforms from "./studioAssetTransforms.json";
import { disposeObjects } from "./disposeGameObjects.js";

const availableModels = import.meta.glob("../assets/neonboy-animaciones/estudio-musica/*.glb", { eager: true, query: "?url", import: "default" });
const modelUrl = (filename) => availableModels[`../assets/neonboy-animaciones/estudio-musica/${filename}`];

// Slot anchors and collision footprints live in recordingStudioScenery/studioLayout.
// fit is the model's maximum world-space size before the editable transform.
export const STUDIO_ASSETS = [
  { id: "console", label: "Consola", file: "studio_mixing_console.glb", fit: [7.1, 1.65, 2.25], shape: [1.4, 1, 1] },
  { id: "monitor-left", label: "Monitor izquierdo", file: "studio_monitor.glb", fit: [0.86, 1.24, 0.77] },
  { id: "monitor-right", label: "Monitor derecho", file: "studio_monitor.glb", fit: [0.86, 1.24, 0.77] },
  { id: "chair", label: "Silla", file: "studio_chair.glb", fit: [1.25, 1.45, 1.35] },
  { id: "crt", label: "Computadora 1999", file: "studio_pc_1999.glb", fit: [1.13, 0.97, 1.16] },
  { id: "amplifier", label: "Amplificador", file: "studio_guitar_amp.glb", fit: [1.52, 1.55, 0.9] },
  { id: "microphone", label: "Micrófono vocal", file: "studio_vocal_mic.glb", fit: [0.84, 1.93, 0.84] },
];

const STORAGE_KEY = "neonboy-recording-studio-transforms-v1";
export function loadStudioAssetTransforms() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { /* Invalid local draft; use committed defaults. */ }
  return Object.fromEntries(STUDIO_ASSETS.map(({ id }) => [id, { ...defaultTransforms[id], ...saved[id] }]));
}
export function saveStudioAssetTransforms(transforms) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transforms));
}
export function resetStudioAssetTransforms() {
  localStorage.removeItem(STORAGE_KEY);
  return structuredClone(defaultTransforms);
}

export function applyStudioAssetTransform(studio, id, transform) {
  const root = studio.slots.get(id)?.modelRoot;
  if (!root || !transform) return;
  root.position.fromArray(transform.position);
  root.rotation.set(...transform.rotation.map((degrees) => THREE.MathUtils.degToRad(degrees)));
  root.scale.setScalar(transform.scale);
  root.updateMatrixWorld(true);
}

function placeModel(studio, id, source, settings) {
  const entry = studio.slots.get(id);
  if (!entry) return;
  const root = new THREE.Group();
  root.name = `studio-model:${id}`;
  const model = source.clone(true);
  model.traverse((node) => {
    if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; }
  });
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.x + size.y + size.z) || Math.max(size.x, size.y, size.z) < 0.0001) return;
  const center = bounds.getCenter(new THREE.Vector3());
  const shape = settings.shape || [1, 1, 1];
  const fitScale = Math.min(...settings.fit.map((limit, axis) => limit / Math.max(size.getComponent(axis) * shape[axis], 0.0001)));
  model.scale.set(shape[0] * fitScale, shape[1] * fitScale, shape[2] * fitScale);
  model.position.set(-center.x * model.scale.x, -bounds.min.y * model.scale.y, -center.z * model.scale.z);
  root.add(model);
  entry.anchor.add(root);
  entry.placeholder.visible = false;
  entry.modelRoot = root;
  return root;
}

export async function loadStudioAssets(studio, loader, getTransforms, isAlive) {
  const uniqueFiles = [...new Set(STUDIO_ASSETS.map((asset) => asset.file))];
  const models = new Map();
  // These high-resolution Meshy exports are large; parse no more than two at once.
  for (let index = 0; index < uniqueFiles.length && isAlive(); index += 2) {
    const batch = await Promise.allSettled(uniqueFiles.slice(index, index + 2).map(async (file) => {
      const url = modelUrl(file);
      if (!url) return { file, scene: null };
      const gltf = await loader.loadAsync(url);
      return { file, scene: gltf.scene };
    }));
    for (const item of batch) if (item.status === "fulfilled") models.set(item.value.file, item.value.scene);
  }
  if (!isAlive()) {
    disposeObjects([...models.values()].filter(Boolean));
    return [];
  }
  const loaded = [];
  for (const asset of STUDIO_ASSETS) {
    const model = models.get(asset.file);
    if (!model) { console.warn(`Studio model unavailable: ${asset.file}; using placeholder.`); continue; }
    const root = placeModel(studio, asset.id, model, asset);
    if (root) {
      applyStudioAssetTransform(studio, asset.id, getTransforms()[asset.id]);
      loaded.push(asset.id);
    }
  }
  return loaded;
}
