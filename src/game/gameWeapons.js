import * as THREE from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";

const WEAPON_FIT = {
  sword: { height: 1.14, gripFromBottom: 0.20, flip: true },
  hammer: { height: 1.06, gripFromBottom: 0.245, flip: false },
  axe: { height: 1.06, gripFromBottom: 0.245, flip: false },
  crossbow: { height: 0.72, axis: "x", gripFromBottom: 0.11, flip: false },
  scythe: { height: 2.2, gripFromBottom: 0.35, flip: false }
};

export function createWeaponModel(kind, template) {
  const fit = WEAPON_FIT[kind];
  if (!fit || !template) throw new Error(`Modelo de arma no disponible: ${kind}`);
  const group = new THREE.Group();
  group.name = `Arma ${kind}`;
  // The crossbow GLB is skinned; Object3D.clone leaves its bones bound to the source scene.
  const model = kind === "crossbow" ? clone(template) : template.clone(true);
  group.add(model);
  const bounds = new THREE.Box3().setFromObject(model);
  model.scale.setScalar(fit.height / bounds.getSize(new THREE.Vector3())[fit.axis || "y"]);
  if (fit.flip) model.rotation.z = Math.PI;
  model.updateMatrixWorld(true);
  bounds.setFromObject(model);
  model.position.set(-(bounds.min.x + bounds.max.x) / 2, -bounds.min.y - fit.gripFromBottom,
    -(bounds.min.z + bounds.max.z) / 2);
  model.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = object.receiveShadow = true;
    object.userData.sharedGameAsset = true;
  });
  return group;
}

export function createWeaponPickups(group, world, models) {
  const pickups = world.pickups.map((pickup) => {
    const root = new THREE.Group();
    root.name = `Recogida ${pickup.weapon}`;
    root.position.set(pickup.x, pickup.y, pickup.z);
    const weapon = createWeaponModel(pickup.weapon, models[pickup.weapon]);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.47, 40),
      new THREE.MeshBasicMaterial({ color: 0xf4ca6b, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    root.add(weapon, ring);
    group.add(root);
    return { root, weapon, ring, pickup };
  });
  const animate = (time) => pickups.forEach(({ root, weapon, ring, pickup }) => {
    root.visible = !pickup.collected;
    weapon.position.y = 0.68 + Math.sin(time * 2) * 0.1;
    weapon.rotation.set(0, time * 0.8, -0.25);
    ring.material.opacity = 0.5 + Math.sin(time * 3) * 0.18;
  });
  animate.dispose = () => pickups.filter(({ pickup }) => pickup.weapon === "crossbow")
    .forEach(({ weapon }) => weapon.traverse((object) => object.skeleton?.dispose()));
  return animate;
}
