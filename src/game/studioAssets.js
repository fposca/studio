import * as THREE from "three";
import defaultTransforms from "./studioAssetTransforms.json";
import { disposeObjects } from "./disposeGameObjects.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";

const studioModels = import.meta.glob([
  "../assets/neonboy-animaciones/estudio-musica/*.glb",
  "!../assets/neonboy-animaciones/estudio-musica/hugo-sentado.glb"
], { eager: true, query: "?url", import: "default" });
const libraryModels = {
  "bateria.optimized.glb": new URL("../assets/neonboy-animaciones/bateria.optimized.glb", import.meta.url).href,
  "guitar.glb": new URL("../assets/neonboy-animaciones/guitar.glb", import.meta.url).href,
  "guitarra-profe.glb": new URL("../assets/neonboy-animaciones/guitarra-profe.glb", import.meta.url).href,
  "demon-guitar.glb": new URL("../assets/neonboy-animaciones/demon-guitar.glb", import.meta.url).href,
};
const modelUrl = (filename) => studioModels[`../assets/neonboy-animaciones/estudio-musica/${filename}`] || libraryModels[filename];

// Existing IDs and localStorage key stay stable so saved manual edits survive.
// Procedural assemblies use the same transform editor as imported models.
export const STUDIO_ASSETS = [
  { id: "console", label: "Consola", file: "studio_mixing_console.glb", fit: [7.1, 1.65, 2.25], shape: [1.4, 1, 1] },
  { id: "crt", label: "Computadora 1999", file: "studio_pc_1999.glb", fit: [1.13, 0.97, 1.16] },
  { id: "pc-table", label: "Mesa de PC" },
  { id: "monitor-left", label: "Monitor izquierdo", file: "studio_monitor.glb", fit: [0.86, 1.24, 0.77] },
  { id: "monitor-right", label: "Monitor derecho", file: "studio_monitor.glb", fit: [0.86, 1.24, 0.77] },
  { id: "chair", label: "Silla", file: "studio_chair.glb", fit: [1.25, 1.45, 1.35] },
  { id: "hugo", label: "Hugo Mendez", file: "hugo-parado.glb", fit: [0.78, 1.78, 0.66], skinned: true, embeddedIdle: true },
  { id: "amplifier", label: "Marshall", file: "studio_guitar_amp.glb", fit: [1.52, 1.55, 0.9] },
  { id: "microphone", label: "Micr\u00f3fono vocal", file: "studio_vocal_mic.glb", fit: [0.84, 1.93, 0.84] },
  { id: "drumkit", label: "Bater\u00eda", file: "bateria.optimized.glb", fit: [2.7, 1.94, 1.9], lift: 0.055 },
  { id: "drum-bench", label: "Silla de bater\u00eda", file: "silla-bateria.glb", fit: [0.68, 0.72, 0.68] },
  { id: "guitar", label: "Guitarra NeonBoy", file: "guitar.glb", fit: [0.75, 1.75, 0.27], lift: 0.2 },
  { id: "guitar-2", label: "Guitarra Profe", file: "guitarra-profe.glb", fit: [0.75, 1.75, 0.27], lift: 0.2 },
  { id: "guitar-3", label: "Guitarra Demon", file: "demon-guitar.glb", fit: [0.75, 1.75, 0.35], lift: 0.2 },
  { id: "sofa", label: "Sof\u00e1" },
];

const STORAGE_KEY = "neonboy-recording-studio-transforms-v1";
const PRODUCER_CALIBRATION_VERSION = 5;
const SOFA_WALL_PLACEMENT_VERSION = 1;
export function loadStudioAssetTransforms() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { /* Use committed defaults. */ }
  return Object.fromEntries(STUDIO_ASSETS.map(({ id }) => {
    const base = defaultTransforms[id];
    const producerNeedsCalibration = (id === "chair" || id === "hugo") && saved?.__producerCalibration !== PRODUCER_CALIBRATION_VERSION;
    const previous = producerNeedsCalibration ? {} : saved?.[id] || {};
    const sofaNeedsWallPlacement = id === "sofa"
      && saved?.__sofaWallPlacement !== SOFA_WALL_PLACEMENT_VERSION
      && (!Array.isArray(previous.rotation) || previous.rotation.every((angle) => angle === 0));
    const axis = (field) => base[field].map((value, index) =>
      field === "rotation" && sofaNeedsWallPlacement
        ? value
        : Number.isFinite(previous[field]?.[index]) ? previous[field][index] : value);
    const transform = { position: axis("position"), rotation: axis("rotation"), scale: Number.isFinite(previous.scale) && previous.scale > 0 ? previous.scale : base.scale };
    if (id === "hugo") {
      transform.reach = Number.isFinite(previous.reach) ? Math.max(1, Math.min(4, previous.reach)) : base.reach;
      transform.indicator = axis("indicator");
    }
    return [id, transform];
  }));
}
export function saveStudioAssetTransforms(transforms) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...transforms, __producerCalibration: PRODUCER_CALIBRATION_VERSION, __sofaWallPlacement: SOFA_WALL_PLACEMENT_VERSION }));
}
export function resetStudioAssetTransforms() {
  localStorage.removeItem(STORAGE_KEY);
  return structuredClone(defaultTransforms);
}
export function defaultStudioAssetTransform(id) {
  return structuredClone(defaultTransforms[id]);
}

export function applyStudioAssetTransform(studio, id, transform) {
  const entry = studio.slots.get(id);
  if (!entry || !transform) return;
  const root = entry.assembly;
  root.position.fromArray(transform.position);
  const [rx, ry, rz] = transform.rotation.map((degrees) => THREE.MathUtils.degToRad(degrees));
  root.rotation.set(rx, ry, rz);
  root.scale.setScalar(transform.scale);
  root.updateMatrixWorld(true);
  if (id === "hugo" && studio.hugoInteraction) {
    const interaction = root.getWorldPosition(new THREE.Vector3());
    studio.hugoInteraction.x = interaction.x;
    studio.hugoInteraction.z = interaction.z;
    studio.hugoInteraction.reach = transform.reach;
    // Keep the sign at the shop's physical size even when Hugo is rescaled.
    studio.hugoPrompt.position.set(0, 2.43 / transform.scale, 0);
    studio.hugoPrompt.scale.set(1.65 / transform.scale, 0.42 / transform.scale, 1 / transform.scale);
  }
  const obstacle = studio.obstacles.find((item) => item.id === id);
  if (obstacle) {
    obstacle.x = entry.anchor.position.x + root.position.x;
    obstacle.z = entry.anchor.position.z + root.position.z;
    const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry));
    obstacle.hx = (c * obstacle.baseHx + s * obstacle.baseHz) * transform.scale;
    obstacle.hz = (s * obstacle.baseHx + c * obstacle.baseHz) * transform.scale;
  }
}

function placeModel(studio, id, source, settings, animations = []) {
  const entry = studio.slots.get(id);
  if (!entry) return;
  const root = new THREE.Group();
  root.name = `studio-model:${id}`;
  const model = settings.skinned ? cloneSkeleton(source) : source.clone(true);
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
  model.position.set(-center.x * model.scale.x, -bounds.min.y * model.scale.y + (settings.lift || 0), -center.z * model.scale.z);
  root.add(model);
  entry.assembly.add(root);
  entry.placeholder.visible = false;
  entry.modelRoot = root;
  if (settings.embeddedIdle && animations.length) {
    const mixer = new THREE.AnimationMixer(model);
    mixer.clipAction(animations[0]).play();
    studio.mixers.push(mixer);
  }
  return root;
}

export async function loadStudioAssets(studio, loader, getTransforms, isAlive) {
  const uniqueFiles = [...new Set(STUDIO_ASSETS.map((asset) => asset.file).filter(Boolean))];
  const models = new Map();
  // These high-resolution Meshy exports are large; parse no more than two at once.
  for (let index = 0; index < uniqueFiles.length && isAlive(); index += 2) {
    const batch = await Promise.allSettled(uniqueFiles.slice(index, index + 2).map(async (file) => {
      const url = modelUrl(file);
      if (!url) return { file, scene: null, animations: [] };
      const gltf = await loader.loadAsync(url);
      return { file, scene: gltf.scene, animations: gltf.animations };
    }));
    for (const item of batch) if (item.status === "fulfilled") models.set(item.value.file, item.value);
  }
  if (!isAlive()) {
    disposeObjects([...models.values()].map((value) => value?.scene).filter(Boolean));
    return [];
  }
  const loaded = [];
  for (const asset of STUDIO_ASSETS) {
    if (!asset.file) { applyStudioAssetTransform(studio, asset.id, getTransforms()[asset.id]); continue; }
    const model = models.get(asset.file);
    if (!model?.scene) { console.warn(`Studio model unavailable: ${asset.file}; using placeholder.`); applyStudioAssetTransform(studio, asset.id, getTransforms()[asset.id]); continue; }
    const root = placeModel(studio, asset.id, model.scene, asset, model.animations);
    applyStudioAssetTransform(studio, asset.id, getTransforms()[asset.id]);
    if (root) loaded.push(asset.id);
  }
  return loaded;
}
