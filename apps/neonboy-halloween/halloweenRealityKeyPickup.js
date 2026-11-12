import * as THREE from "three";

// Show the rotating key at the entrance in both web and Android.
export const REALITY_KEY_POSITION = Object.freeze({ x: 0, z: 9.2, reach: 2.4 });

export function createHalloweenRealityKeyPickup(scene, { position = REALITY_KEY_POSITION, floating = true } = {}) {
  const root = new THREE.Group();
  root.name = "Halloween / Reality key";
  root.position.set(position.x, floating ? 1.25 : .055, position.z);
  root.rotation.y = floating ? 0 : .34;
  const key = new THREE.Group();
  root.add(key);
  if (floating) { key.scale.setScalar(2.6); key.rotation.x = -Math.PI / 2; }
  root.visible = false;
  scene.add(root);

  const bronze = new THREE.MeshStandardMaterial({ color: 0xb89052, metalness: .8, roughness: .32 });
  const rim = new THREE.MeshStandardMaterial({ color: 0xf0d195, metalness: .82, roughness: .23 });
  const shadow = new THREE.MeshBasicMaterial({ color: 0x251b1d, transparent: true, opacity: .18, depthWrite: false, side: THREE.DoubleSide });
  const eye = new THREE.Mesh(new THREE.TorusGeometry(.045, .012, 8, 22), bronze);
  eye.rotation.x = -Math.PI / 2;
  eye.position.x = -.11;
  key.add(eye);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(.023, .003, 4, 16), rim);
  inner.rotation.x = -Math.PI / 2;
  inner.position.set(-.11, .004, 0);
  key.add(inner);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(.17, .021, .025), bronze);
  shaft.position.set(.018, 0, 0);
  key.add(shaft);
  for (const x of [.075, .114]) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(.019, .021, .045), bronze);
    tooth.position.set(x, 0, .024);
    key.add(tooth);
  }
  const glint = new THREE.Mesh(new THREE.BoxGeometry(.14, .002, .004), rim);
  glint.position.set(.018, .012, -.006);
  key.add(glint);
  const floorShadow = new THREE.Mesh(new THREE.CircleGeometry(.18, 20), shadow);
  floorShadow.rotation.x = -Math.PI / 2;
  floorShadow.scale.y = .43;
  floorShadow.position.y = floating ? -1.24 : -.048;
  if (floating) floorShadow.scale.multiplyScalar(2.2);
  root.add(floorShadow);
  root.traverse((part) => { if (part.isMesh) part.castShadow = false; });
  return {
    root,
    setAvailable(available) { root.visible = Boolean(available); },
    update(dt, elapsed) {
      if (!floating || !root.visible) return;
      root.position.y = 1.25 + Math.sin(elapsed * 2.1) * .11;
      floorShadow.position.y = -root.position.y + .01;
      key.rotation.y += dt * 1.25;
    },
  };
}
