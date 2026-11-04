import * as THREE from "three";

// A dropped key in the narrow aisle by the jukebox, far from the chest.
export const REALITY_KEY_POSITION = Object.freeze({ x: -8.45, z: 7.7, reach: 1.2 });

export function createHalloweenRealityKeyPickup(scene) {
  const root = new THREE.Group();
  root.name = "Halloween / Reality key";
  root.position.set(REALITY_KEY_POSITION.x, .055, REALITY_KEY_POSITION.z);
  root.rotation.y = .34;
  root.visible = false;
  scene.add(root);

  const bronze = new THREE.MeshStandardMaterial({ color: 0xb89052, metalness: .8, roughness: .32 });
  const rim = new THREE.MeshStandardMaterial({ color: 0xf0d195, metalness: .82, roughness: .23 });
  const shadow = new THREE.MeshBasicMaterial({ color: 0x251b1d, transparent: true, opacity: .18, depthWrite: false, side: THREE.DoubleSide });
  const eye = new THREE.Mesh(new THREE.TorusGeometry(.045, .012, 8, 22), bronze);
  eye.rotation.x = -Math.PI / 2;
  eye.position.x = -.11;
  root.add(eye);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(.023, .003, 4, 16), rim);
  inner.rotation.x = -Math.PI / 2;
  inner.position.set(-.11, .004, 0);
  root.add(inner);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(.17, .021, .025), bronze);
  shaft.position.set(.018, 0, 0);
  root.add(shaft);
  for (const x of [.075, .114]) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(.019, .021, .045), bronze);
    tooth.position.set(x, 0, .024);
    root.add(tooth);
  }
  const glint = new THREE.Mesh(new THREE.BoxGeometry(.14, .002, .004), rim);
  glint.position.set(.018, .012, -.006);
  root.add(glint);
  const floorShadow = new THREE.Mesh(new THREE.CircleGeometry(.18, 20), shadow);
  floorShadow.rotation.x = -Math.PI / 2;
  floorShadow.scale.y = .43;
  floorShadow.position.y = -.048;
  root.add(floorShadow);
  root.traverse((part) => { if (part.isMesh) part.castShadow = false; });
  return {
    root,
    setAvailable(available) { root.visible = Boolean(available); },
  };
}
