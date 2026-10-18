import * as THREE from "three";

export function createGameChallenges(parent, world) {
  const group = new THREE.Group();
  group.name = world.level.id === 2 ? "Galeria movil de Atenea" : world.level.id === 4 ? "Galeria de huesos de las catacumbas" : world.level.id === 3 ? "Trampas y plataformas del cementerio" : "Pruebas del Partenon";
  parent.add(group);
  if (!world.platforms.length) return () => {};
  const map = new THREE.TextureLoader().load(world.level.id >= 3 ?
    new URL("../assets/environments/cemetery-stone-v2.png", import.meta.url).href :
    new URL("../assets/environments/parthenon-weathered-stone-v2.png", import.meta.url).href);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const stone = new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: 0.055, color: world.level.id >= 3 ? 0x9ba69e : 0xb7b5aa, roughness: 0.9 });
  const bronze = new THREE.MeshStandardMaterial({ color: 0x79663c, metalness: 0.75, roughness: 0.4 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x383c3e, metalness: 0.78, roughness: 0.48 });
  const inlay = new THREE.MeshStandardMaterial({ color: world.level.id === 2 ? 0xc9ab79 : world.level.id >= 3 ? 0xc5a77a : 0x74d8c3, emissive: world.level.id === 2 ? 0x6c4c27 : world.level.id >= 3 ? 0x654624 : 0x2d8e7b, emissiveIntensity: 0.65, metalness: 0.4, roughness: 0.3 });
  const warning = new THREE.MeshStandardMaterial({ color: 0xeb7651, emissive: 0x9e2916, emissiveIntensity: 0.5, roughness: 0.55 });
  function mesh(geometry, material, owner, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.castShadow = object.receiveShadow = true;
    owner.add(object);
    return object;
  }
  const platforms = world.platforms.map((platform) => {
    const root = new THREE.Group();
    root.name = `Plataforma ${platform.id}`;
    group.add(root);
    mesh(new THREE.BoxGeometry(platform.width, platform.height, platform.depth), stone, root, 0, -platform.height / 2);
    for (const side of [-1, 1]) {
      mesh(new THREE.BoxGeometry(platform.width - 0.12, 0.035, 0.045), inlay, root, 0, 0.015, side * (platform.depth / 2 - 0.1));
      mesh(new THREE.BoxGeometry(0.045, 0.035, platform.depth - 0.12), inlay, root, side * (platform.width / 2 - 0.1), 0.015);
      for (const end of [-1, 1]) mesh(new THREE.BoxGeometry(0.26, platform.height + 0.06, 0.26), bronze, root,
        side * (platform.width / 2 - 0.15), -platform.height / 2, end * (platform.depth / 2 - 0.15));
    }
    const keel = mesh(new THREE.CylinderGeometry(0.9, 0.5, 0.22, 4), stone, root, 0, -platform.height - 0.11);
    keel.rotation.y = Math.PI / 4;
    return root;
  });
  const hazards = world.hazards.map((hazard) => {
    const root = new THREE.Group();
    root.name = `Trampa ${hazard.id}`;
    root.position.set(hazard.x, hazard.y, hazard.z);
    group.add(root);
    if (hazard.kind === "sweeper") {
      mesh(new THREE.BoxGeometry(hazard.width, hazard.height, hazard.depth), bronze, root);
      for (const side of [-1, 1]) {
        mesh(new THREE.BoxGeometry(0.4, hazard.height + 0.025, hazard.depth + 0.04), warning, root, side * (hazard.width / 2 - 0.25));
      }
      mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.55, 16), iron, root, 0, -0.1);
      mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 12), bronze, root, 0, 0.2);
    } else {
      mesh(new THREE.BoxGeometry(hazard.width, 0.06, hazard.depth), bronze, root, 0, -0.18);
      const spike = new THREE.ConeGeometry(0.13, 0.37, 5);
      for (let x = -hazard.width / 2 + 0.2; x < hazard.width / 2; x += 0.4) {
        for (let z = -0.32; z <= 0.32; z += 0.32) mesh(spike, iron, root, x, 0.015, z);
      }
    }
    return root;
  });
  const sealMaterial = new THREE.MeshStandardMaterial({ color: 0xb37f49, emissive: 0x752516, emissiveIntensity: 0.1, metalness: 0.65, roughness: 0.5 });
  const seal = mesh(new THREE.RingGeometry(2.65, 2.8, 64), sealMaterial, group, world.boss.spawn.x, 0.025, world.boss.spawn.z);
  seal.rotation.x = -Math.PI / 2;
  return (alpha) => {
    world.platforms.forEach((platform, index) => {
      platforms[index].position.set(THREE.MathUtils.lerp(platform.previous.x, platform.x, alpha), platform.y,
        THREE.MathUtils.lerp(platform.previous.z, platform.z, alpha));
    });
    world.hazards.forEach((hazard, index) => { hazards[index].rotation.y = THREE.MathUtils.lerp(hazard.previousAngle, hazard.angle, alpha); });
    sealMaterial.emissiveIntensity = world.boss.active && world.boss.health > 0 ? 0.7 + Math.sin(world.time * 2) * 0.2 : 0.1;
  };
}
