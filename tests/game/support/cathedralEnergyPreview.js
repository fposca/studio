import * as THREE from "three";
import { createCathedralEnergy } from "../../../src/game/cathedralEnergy.js";

// Exercise the real GPU materials, including the normally hidden final portal.
export function createCathedralEnergyPreview(reducedMotion = false) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x13121c);
  scene.add(new THREE.HemisphereLight(0xcbd5ef, 0x4c3548, 1.5));
  const key = new THREE.DirectionalLight(0xffdec2, 3); key.position.set(-2, 4, 5); scene.add(key);
  const camera = new THREE.PerspectiveCamera(44, 1000 / 620, .1, 50);
  camera.position.set(0, 3.4, 10); camera.lookAt(0, 2, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(1000, 620); renderer.setPixelRatio(1); renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.id = "cathedral-energy-preview";
  Object.assign(renderer.domElement.style, { position: "fixed", inset: "0", zIndex: "99999" });
  document.body.append(renderer.domElement);
  // Three r186 lazily uploads a renderer-owned DFG lighting lookup for Standard materials.
  // Warm it first so the leak check counts only textures owned by our effects.
  const probe = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, .1), new THREE.MeshStandardMaterial());
  probe.position.y = 2; scene.add(probe); renderer.render(scene, camera);
  scene.remove(probe); probe.geometry.dispose(); probe.material.dispose(); renderer.render(scene, camera);
  const baselineTextures = renderer.info.memory.textures;
  const effects = createCathedralEnergy(scene);
  const memory = effects.memory("nave", -2.7, 0, 0);
  effects.altar(-.8, -1);
  const portal = effects.portal(2.1, 2.35, -1.8);
  const progress = { memories: [], visionActive: false, completed: false, altarActivated: false };
  const clue = scene.getObjectByName("Pista de frecuencia / 1");
  const render = () => renderer.render(scene, camera);
  const sample = () => [memory.position.y, ...memory.getObjectByName("Armadura de frecuencia").rotation.toArray()];
  effects.update(0, progress, false, reducedMotion, camera); render();
  const before = sample();
  for (let i = 0; i < 30; i++) effects.update(1 / 60, progress, false, reducedMotion, camera);
  render();
  const after = sample();
  const initial = { clueVisible: clue.visible, portalVisible: portal.visible, moves: JSON.stringify(before) !== JSON.stringify(after) };
  const pausedBefore = sample();
  for (let i = 0; i < 20; i++) effects.update(1 / 60, progress, true, reducedMotion, camera);
  const pausedStill = JSON.stringify(pausedBefore) === JSON.stringify(sample());
  return {
    initial, pausedStill,
    reveal() {
      Object.assign(progress, { visionActive: true, memories: ["nave"], altarActivated: true, completed: true });
      effects.update(1 / 60, progress, false, reducedMotion, camera); render();
      return { clueVisible: clue.visible, portalVisible: portal.visible, restored: memory.userData.restored };
    },
    dispose() {
      effects.dispose(); effects.dispose(); render();
      const remaining = { geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures - baselineTextures };
      renderer.dispose(); renderer.domElement.remove(); return remaining;
    },
  };
}
