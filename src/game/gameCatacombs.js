import * as THREE from "three";
import { createGameFire } from "./gameFire.js";
import { CATACOMB_CHAMBERS, CATACOMB_OBSTACLES, CATACOMB_TORCHES } from "./gameCatacombsLevel.js";

export function createGameCatacombs(world) {
  const root = new THREE.Group();
  root.name = "Nivel 4 - Catacumbas";
  const map = new THREE.TextureLoader().load(new URL("../assets/environments/cemetery-stone-v2.png", import.meta.url).href);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(5, 10);
  const stone = new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: 0.07, color: 0x666960, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x252a28, roughness: 1 });
  const brass = new THREE.MeshStandardMaterial({ color: 0x8a6341, metalness: 0.55, roughness: 0.62 });
  const rune = new THREE.MeshStandardMaterial({ color: 0xe5bc76, emissive: 0xc38037, emissiveIntensity: 1.2, roughness: 0.45 });
  const bone = new THREE.MeshStandardMaterial({ color: 0xb6a88a, roughness: 0.9 });
  const box = new THREE.BoxGeometry(1, 1, 1);
  function mesh(geometry, material, x, y, z, sx = 1, sy = 1, sz = 1, owner = root) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z); object.scale.set(sx, sy, sz);
    object.castShadow = object.receiveShadow = true;
    owner.add(object);
    return object;
  }
  mesh(new THREE.PlaneGeometry(36, 68), stone, 0, -0.015, -11).rotation.x = -Math.PI / 2;
  // Shallow vaults let the third-person camera see inside while still reading as underground.
  for (const x of [-16.1, 16.1]) mesh(box, stone, x, 2.4, -11, 0.65, 4.8, 65);
  for (const z of [-43.5, 20.5]) mesh(box, stone, 0, 2.4, z, 32.5, 4.8, 0.65);
  for (const z of [8, -4, -16, -28, -39]) {
    for (const x of [-14.5, 14.5]) {
      mesh(box, stone, x, 4.7, z, 2.3, 0.65, 0.6);
      mesh(box, brass, x, 3.7, z, 0.08, 1.2, 0.08);
    }
    mesh(box, stone, 0, 4.7, z, 26, 0.38, 0.45);
  }
  for (let z = -38; z <= 17; z += 3.1) {
    for (const x of [-11, 11]) {
      mesh(box, dark, x, 0.006, z, 0.035, 0.012, 2.8);
      mesh(box, stone, x * 0.92, 0.045, z, 0.34, 0.09, 0.45);
    }
  }
  for (const [x, y, z, width, height, depth] of CATACOMB_OBSTACLES) {
    mesh(box, stone, x, y, z, width, height, depth);
    if (height > 3 && width < 2) {
      mesh(box, brass, x, height + 0.08, z, width + 0.18, 0.16, depth + 0.18);
      mesh(box, brass, x, 0.13, z, width + 0.18, 0.26, depth + 0.18);
    }
  }
  const panels = world.secretDoors.map((door) => {
    const group = new THREE.Group(); group.position.set(door.x, 0, door.z); root.add(group);
    mesh(box, stone, 0, door.height / 2, 0, door.width, door.height, door.depth, group);
    const face = -Math.sign(door.x) * (door.width / 2 + 0.025);
    mesh(box, rune, face, 1.75, 0, 0.045, 0.54, 0.065, group);
    mesh(box, rune, face, 1.75, 0, 0.045, 0.065, 0.54, group);
    mesh(new THREE.RingGeometry(0.39, 0.45, 24), rune, face, 1.75, 0, 1, 1, 1, group).rotation.y = Math.PI / 2;
    return { door, group };
  });
  for (const { x, z } of CATACOMB_CHAMBERS) {
    mesh(box, dark, x, 0.12, z, 4.2, 0.24, 3.7);
    mesh(box, brass, x, 0.27, z, 2.6, 0.15, 1.1);
  }
  // Sarcophagi and scattered remains mark the climb and hidden routes.
  for (const [x, z] of [[-9, 1], [9, -10], [-9, -22], [8.8, -35]]) {
    mesh(box, stone, x, 0.42, z, 1.5, 0.84, 2.7);
    mesh(box, brass, x, 0.89, z, 1.62, 0.12, 2.82);
    mesh(new THREE.SphereGeometry(0.18, 10, 8), bone, x, 0.98, z - 0.72);
  }
  const flames = CATACOMB_TORCHES.map(([x, z], i) => {
    mesh(box, stone, x, 0.8, z, 0.72, 1.6, 0.72);
    mesh(new THREE.CylinderGeometry(0.3, 0.18, 0.18, 10), brass, x, 1.65, z);
    return createGameFire(root, { x, y: 1.75, z, size: 0.72, intensity: 11, distance: 8, seed: i * 2.4 });
  });
  const dustGeometry = new THREE.BufferGeometry();
  const dust = new Float32Array(240 * 3);
  for (let i = 0; i < 240; i++) {
    dust[i * 3] = Math.sin(i * 78.2) * 10.8;
    dust[i * 3 + 1] = 0.4 + (i * 0.73 % 3.5);
    dust[i * 3 + 2] = 16 - (i * 17.13 % 57);
  }
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dust, 3));
  const motes = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0xd4aa73, size: 0.045,
    transparent: true, opacity: 0.45, depthWrite: false, sizeAttenuation: true }));
  root.add(motes);
  const lantern = new THREE.PointLight(0xa48bd6, 28, 17, 2);
  lantern.position.set(0, 3.8, -37); root.add(lantern);
  root.userData.atmosphere = new THREE.FogExp2(0x11191b, 0.026);
  root.userData.animate = (_enabled, _settings, time) => {
    panels.forEach(({ door, group }) => { group.visible = !door.broken; });
    flames.forEach((flame) => flame.update(time, 1));
    motes.rotation.y = Math.sin(time * 0.00013) * 0.025;
    lantern.intensity = 24 + Math.sin(time * 0.004) * 4;
  };
  root.userData.dispose = () => {};
  return root;
}
