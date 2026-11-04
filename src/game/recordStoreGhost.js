import * as THREE from "three";
import { disposeObjects } from "./disposeGameObjects.js";

export const RECORD_STORE_GHOST_URL = new URL("../assets/neonboy-animaciones/arcade/fantasma.glb", import.meta.url).href;

// The same authored model appears in both scenes. Only a suitable idle clip is reused.
export async function loadRecordStoreGhost(loader, parent, isAlive, height = 2.35) {
  const gltf = await loader.loadAsync(RECORD_STORE_GHOST_URL);
  if (!isAlive()) { disposeObjects([gltf.scene]); return null; }
  const model = gltf.scene;
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const wrapper = new THREE.Group();
  const scaled = new THREE.Group();
  const scale = height / Math.max(size.y, 0.001);
  scaled.scale.setScalar(scale);
  model.position.set(-center.x, -bounds.min.y, -center.z);
  scaled.add(model);
  wrapper.add(scaled);
  wrapper.visible = false;
  parent.add(wrapper);
  const ghostMaterials = [];
  model.traverse((object) => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.material = [object.material].flat().map((material) => {
      const ghost = material.clone();
      ghost.transparent = true;
      ghost.opacity = 0.72;
      ghost.depthWrite = false;
      if (ghost.emissive) { ghost.emissive.set(0x846b9b); ghost.emissiveIntensity = 0.42; }
      ghostMaterials.push(ghost);
      return ghost;
    });
    if (object.material.length === 1) object.material = object.material[0];
  });
  const idleClip = gltf.animations.find((clip) => /idle|float|hover|breath|levitat/i.test(clip.name));
  const mixer = idleClip ? new THREE.AnimationMixer(model) : null;
  if (mixer) mixer.clipAction(idleClip).play();
  let apparitionTime = 0;
  return { root: wrapper, mixer, update(dt, elapsed, visible, opacity = 0.72) {
    wrapper.visible = visible;
    if (!visible) return;
    apparitionTime += dt;
    mixer?.update(dt);
    wrapper.position.y = Math.sin(apparitionTime * 1.25) * 0.055;
    wrapper.rotation.y = Math.sin(apparitionTime * .8) * .045;
    const shimmer = .96 + Math.sin(apparitionTime * 3.1) * .04;
    for (const material of ghostMaterials) material.opacity = opacity * shimmer;
  }, dispose() { mixer?.stopAllAction(); } };
}
