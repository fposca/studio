import * as THREE from "three";

export function createHealthPickups(group, world, template) {
  const bounds = new THREE.Box3().setFromObject(template);
  const center = bounds.getCenter(new THREE.Vector3());
  const height = bounds.getSize(new THREE.Vector3()).y;
  const pickups = world.hearts.map((heart) => {
    const root = new THREE.Group();
    root.name = `Vida ${heart.id}`;
    root.position.set(heart.x, heart.y, heart.z);
    const model = template.clone(true);
    model.scale.setScalar(0.62 / height);
    model.position.copy(center).multiplyScalar(-0.62 / height);
    model.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.userData.sharedGameAsset = true;
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.39, 40),
      new THREE.MeshBasicMaterial({ color: 0xff4e6d, transparent: true, opacity: 0.65,
        depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.035;
    root.add(model, ring);
    group.add(root);
    return { root, model, ring, heart };
  });
  return (time) => pickups.forEach(({ root, model, ring, heart }, index) => {
    root.visible = !heart.collected;
    model.position.y = -center.y * (0.62 / height) + 0.86 + Math.sin(time * 2.4 + index) * 0.09;
    model.rotation.y = time * 0.75 + index;
    ring.material.opacity = world.player.health >= world.player.maxHealth ? 0.22 : 0.55 + Math.sin(time * 3 + index) * 0.15;
  });
}
