import * as THREE from "three";

export function createCatacombAmmo(parent, world) {
  const group = new THREE.Group(); group.name = "Municion de ballesta"; parent.add(group);
  const metal = new THREE.MeshStandardMaterial({ color: 0x8b6944, metalness: 0.65, roughness: 0.4 });
  const glow = new THREE.MeshBasicMaterial({ color: 0xe7bf78, toneMapped: false });
  const pickups = world.ammoPickups.map((pickup) => {
    const root = new THREE.Group(); root.position.set(pickup.x, pickup.y + 0.6, pickup.z); group.add(root);
    const caseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.48, 8), metal);
    root.add(caseMesh);
    for (const x of [-0.11, 0, 0.11]) {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 6), glow);
      shaft.position.set(x, 0.32, 0); root.add(shaft);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 6), glow);
      tip.position.set(x, 0.63, 0); root.add(tip);
    }
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.39, 30), glow);
    ring.rotation.x = -Math.PI / 2; ring.position.y = -0.55; root.add(ring);
    return { root, pickup };
  });
  return (time) => pickups.forEach(({ root, pickup }, i) => {
    root.visible = time >= pickup.readyAt;
    root.position.y = pickup.y + 0.6 + Math.sin(time * 2 + i) * 0.1;
    root.rotation.y = time * 0.7;
  });
}

export function createArrowVisuals(parent, world) {
  const group = new THREE.Group(); group.name = "Flechas disparadas"; parent.add(group);
  const shaftMaterial = new THREE.MeshStandardMaterial({ color: 0x49372a, metalness: 0.1, roughness: 0.8 });
  const pointMaterial = new THREE.MeshStandardMaterial({ color: 0xd4b77e, metalness: 0.8, roughness: 0.3 });
  const visuals = new Map();
  return () => {
    for (const [arrow, mesh] of visuals) if (!world.arrows.includes(arrow)) { group.remove(mesh); mesh.traverse((part) => part.geometry?.dispose()); visuals.delete(arrow); }
    for (const arrow of world.arrows) {
      let root = visuals.get(arrow);
      if (!root) {
        root = new THREE.Group();
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.55, 6), shaftMaterial);
        shaft.rotation.x = Math.PI / 2; root.add(shaft);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 6), pointMaterial);
        tip.rotation.x = Math.PI / 2; tip.position.z = 0.34; root.add(tip);
        group.add(root); visuals.set(arrow, root);
      }
      root.position.set(arrow.x, arrow.y, arrow.z); root.rotation.set(-(arrow.pitch || 0), arrow.yaw, 0, "YXZ");
    }
  };
}
