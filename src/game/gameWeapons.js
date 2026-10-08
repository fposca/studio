import * as THREE from "three";

export function createWeaponModel(kind) {
  const group = new THREE.Group();
  group.name = `Arma ${kind}`;
  const steel = new THREE.MeshStandardMaterial({ color: 0xc5d3d7, metalness: 0.9, roughness: 0.27 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x29353a, metalness: 0.85, roughness: 0.43 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc09444, metalness: 0.8, roughness: 0.32 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x34221c, roughness: 0.93 });
  const add = (geometry, material, x, y, z = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const length = kind === "hammer" ? 0.68 : 0.29;
  add(new THREE.CylinderGeometry(0.031, 0.037, length, 10), leather, 0, length / 2 - 0.15);
  for (let y = -0.13; y < length - 0.15; y += 0.035) {
    const wrap = add(new THREE.TorusGeometry(0.035, 0.005, 4, 12), dark, 0, y);
    wrap.rotation.x = Math.PI / 2;
  }
  add(new THREE.SphereGeometry(0.055, 12, 8), brass, 0, -0.17).scale.y = 0.65;
  if (kind === "sword") {
    const shape = new THREE.Shape();
    shape.moveTo(-0.065, 0.19); shape.lineTo(0.065, 0.19);
    shape.lineTo(0.047, 1.03); shape.lineTo(0, 1.21); shape.lineTo(-0.047, 1.03); shape.closePath();
    const blade = new THREE.ExtrudeGeometry(shape, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.009, bevelSize: 0.008, bevelSegments: 1, steps: 1 });
    blade.translate(0, 0, -0.009);
    add(blade, steel, 0, 0);
    add(new THREE.BoxGeometry(0.013, 0.76, 0.003), dark, 0, 0.62, 0.019);
    add(new THREE.BoxGeometry(0.32, 0.045, 0.064), brass, 0, 0.16);
    for (const side of [-1, 1]) add(new THREE.SphereGeometry(0.038, 8, 6), brass, side * 0.16, 0.15);
  } else {
    add(new THREE.BoxGeometry(0.48, 0.24, 0.23), dark, 0, 0.59);
    for (const side of [-1, 1]) {
      add(new THREE.BoxGeometry(0.06, 0.27, 0.26), steel, side * 0.25, 0.59);
      add(new THREE.BoxGeometry(0.025, 0.245, 0.24), brass, side * 0.18, 0.59);
    }
    add(new THREE.BoxGeometry(0.08, 0.26, 0.24), brass, 0, 0.59);
  }
  return group;
}

export function createWeaponPickups(group, world) {
  const pickups = world.pickups.map((pickup) => {
    const root = new THREE.Group();
    root.name = `Recogida ${pickup.weapon}`;
    root.position.set(pickup.x, pickup.y, pickup.z);
    const weapon = createWeaponModel(pickup.weapon);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.47, 40),
      new THREE.MeshBasicMaterial({ color: 0xf4ca6b, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    root.add(weapon, ring);
    group.add(root);
    return { root, weapon, ring, pickup };
  });
  return (time) => pickups.forEach(({ root, weapon, ring, pickup }) => {
    root.visible = !pickup.collected;
    weapon.position.y = 0.68 + Math.sin(time * 2) * 0.1;
    weapon.rotation.set(0, time * 0.8, -0.25);
    ring.material.opacity = 0.5 + Math.sin(time * 3) * 0.18;
  });
}
