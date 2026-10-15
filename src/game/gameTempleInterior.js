import * as THREE from "three";
import { createFlutedDoricShaftGeometry } from "../editors/parthenonSet.js";
import { createChurchFog } from "../editors/churchFog.js";
import { createGameFire } from "./gameFire.js";
import { INTERIOR_COLUMNS, INTERIOR_OBSTACLES, INTERIOR_TORCHES } from "./gameInteriorLevel.js";

export function createGameTempleInterior(world) {
  const root = new THREE.Group();
  root.name = "Nivel 2 - Santuario de Atenea";
  const loader = new THREE.TextureLoader();
  const stoneMap = loader.load(new URL("../assets/environments/parthenon-weathered-stone-v2.png", import.meta.url).href);
  stoneMap.colorSpace = THREE.SRGBColorSpace;
  stoneMap.wrapS = stoneMap.wrapT = THREE.RepeatWrapping;
  stoneMap.anisotropy = 8;
  const reliefMap = loader.load(new URL("../assets/environments/parthenon-pediment-relief-v1.png", import.meta.url).href);
  reliefMap.colorSpace = THREE.SRGBColorSpace; reliefMap.anisotropy = 8;
  const stone = new THREE.MeshStandardMaterial({ map: stoneMap, bumpMap: stoneMap, bumpScale: 0.06, color: 0x999789, roughness: 0.84 });
  const floorStone = stone.clone(); floorStone.color.set(0x9b9b91); floorStone.roughness = 0.62;
  const columnStone = stone.clone(); columnStone.vertexColors = true;
  const darkStone = stone.clone(); darkStone.color.set(0x414b49);
  const bronze = new THREE.MeshStandardMaterial({ color: 0x8d7044, metalness: 0.75, roughness: 0.5 });
  const charcoal = new THREE.MeshStandardMaterial({ color: 0x171e1d, roughness: 0.95 });
  const relief = new THREE.MeshStandardMaterial({ map: reliefMap, bumpMap: reliefMap, bumpScale: 0.075, color: 0xb0a58c, roughness: 0.84 });
  const box = new THREE.BoxGeometry(1, 1, 1);
  function mesh(geometry, material, x, y, z, sx = 1, sy = 1, sz = 1, parent = root) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z); object.scale.set(sx, sy, sz);
    object.castShadow = object.receiveShadow = true; parent.add(object); return object;
  }
  function instances(name, geometry, material, entries) {
    const group = new THREE.InstancedMesh(geometry, material, entries.length), transform = new THREE.Object3D();
    group.name = name; group.castShadow = group.receiveShadow = true;
    entries.forEach(([x, y, z, sx = 1, sy = 1, sz = 1], index) => {
      transform.position.set(x, y, z); transform.scale.set(sx, sy, sz); transform.updateMatrix();
      group.setMatrixAt(index, transform.matrix);
      group.setColorAt(index, new THREE.Color().setScalar(0.84 + Math.sin(index * 73.3) * 0.12));
    });
    root.add(group); return group;
  }
  mesh(box, charcoal, 0, -0.12, -11.25, 34.6, 0.2, 65.5);
  const tiles = [];
  for (let x = -16; x <= 16; x += 2) for (let z = -42.5; z <= 20; z += 2.1) tiles.push([x, -0.055, z, 1.974, 0.09, 2.07]);
  instances("Losas de marmol gastado", box, floorStone, tiles);
  const wallBlocks = [];
  for (const x of [-17.1, 17.1]) for (let z = -42; z < 21; z += 3) for (let y = 0.75; y < 8; y += 1.5) wallBlocks.push([x, y, z, 0.6, 1.475, 2.975]);
  for (const z of [-43.8, 21.3]) for (let x = -16; x <= 16; x += 2) for (let y = 0.75; y < 8; y += 1.5) wallBlocks.push([x, y, z, 1.975, 1.475, 0.6]);
  instances("Silleria del santuario", box, stone, wallBlocks);
  for (const obstacle of INTERIOR_OBSTACLES) mesh(box, stone, ...obstacle);
  instances("Columnas doricas", createFlutedDoricShaftGeometry(), columnStone,
    INTERIOR_COLUMNS.map(([x, z]) => [x, 3.5, z, 1.08, 1.24, 1.08]));
  for (const [x, z] of INTERIOR_COLUMNS) {
    mesh(box, stone, x, 0.13, z, 1.45, 0.26, 1.45);
    mesh(new THREE.CylinderGeometry(0.86, 0.58, 0.34, 40), stone, x, 6.93, z);
    mesh(box, stone, x, 7.2, z, 1.75, 0.26, 1.75);
    for (let y = 1.12; y < 6.5; y += 1.09) {
      const joint = mesh(new THREE.TorusGeometry(0.54, 0.007, 4, 48), darkStone, x, y, z);
      joint.rotation.x = Math.PI / 2;
    }
  }
  for (const x of [-5.8, 5.8]) mesh(box, stone, x, 7.65, -12, 1.55, 0.62, 61);
  mesh(box, darkStone, 0, 8.6, -11.25, 34.6, 0.4, 65.5);
  for (let z = -40; z < 21; z += 4) mesh(box, stone, 0, 8.1, z, 34, 0.45, 0.34);
  for (let x = -16; x <= 16; x += 4) mesh(box, stone, x, 8.1, -11.25, 0.34, 0.45, 65);
  for (const x of [-16.7, 16.7]) {
    for (const y of [0.22, 6.1, 7.8]) mesh(box, darkStone, x, y, -11.25, 0.3, 0.22, 65);
    for (const z of [12, -14, -34]) {
      const panel = mesh(new THREE.PlaneGeometry(5.8, 1.65), relief, x - Math.sign(x) * 0.015, 4.6, z);
      panel.rotation.y = -Math.sign(x) * Math.PI / 2;
      for (const y of [3.7, 5.5]) mesh(box, bronze, x - Math.sign(x) * 0.045, y, z, 0.07, 0.07, 6);
    }
  }
  // A recessed bronze entrance and a distant altar frame the route through the hall.
  mesh(box, darkStone, 0, 3.4, 20.92, 5.1, 6.8, 0.15);
  for (const x of [-2.7, 2.7]) mesh(box, stone, x, 3.5, 20.7, 0.6, 7, 0.6);
  mesh(box, stone, 0, 7, 20.7, 6, 0.5, 0.6);
  for (const x of [-1.15, 1.15]) {
    mesh(box, bronze, x, 3.3, 20.8, 2.15, 6.3, 0.16);
    for (const y of [1.5, 4.8]) mesh(box, charcoal, x, y, 20.68, 1.7, 2.3, 0.08);
  }
  const medallion = mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.15, 64), bronze, 0, 4.8, -43.3);
  medallion.rotation.x = Math.PI / 2;
  const inner = mesh(new THREE.TorusGeometry(1.82, 0.07, 8, 64), stone, 0, 4.8, -43.15);
  inner.castShadow = false;
  for (const x of [-0.55, 0.55]) mesh(new THREE.TorusGeometry(0.39, 0.08, 8, 32), darkStone, x, 5.12, -43.16);
  mesh(new THREE.OctahedronGeometry(0.8), stone, 0, 4.1, -43.17, 1, 1, 0.25);
  for (const x of [-4, 4]) mesh(box, stone, x, 1.3, -41, 1.3, 2.6, 1.3);
  const doors = world.secretDoors.map((door) => {
    const group = new THREE.Group(); group.name = `Muro agrietado ${door.id}`; group.position.set(door.x, 0, door.z); root.add(group);
    mesh(box, darkStone, 0, door.height / 2, 0, door.width, door.height, door.depth, group);
    // Uneven joints and a visible bronze fracture distinguish breakable stone from the walls.
    for (let i = 0; i < 5; i++) {
      mesh(box, stone, 0, 0.58 + i * 1.13, 0, 0.53, 1.09, 2.53, group);
      const fissure = mesh(box, bronze, -Math.sign(door.x) * 0.28, 0.5 + i * 0.74, Math.sin(i * 2.1) * 0.23, 0.025, 0.87, 0.045, group);
      fissure.rotation.x = Math.sin(i * 1.8) * 0.6;
    }
    const rubble = new THREE.Group(); rubble.visible = false; root.add(rubble);
    for (let i = 0; i < 8; i++) {
      const chunk = mesh(box, darkStone, door.x + Math.sin(i * 5) * 1.15, 0.12, door.z + Math.cos(i * 5) * 1.3, 0.36, 0.2, 0.32, rubble);
      chunk.rotation.set(0.1, i * 2.3, 0.2);
    }
    return { door, group, rubble };
  });
  const flames = [];
  INTERIOR_TORCHES.forEach(([x, z], index) => {
    mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.4, 12), darkStone, x, 0.7, z);
    mesh(new THREE.CylinderGeometry(0.4, 0.18, 0.25, 16, 1, true), bronze, x, 1.5, z);
    mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.045, 16), charcoal, x, 1.64, z);
    flames.push(createGameFire(root, { x, y: 1.66, z, intensity: 11, distance: 8, seed: index * 2.7 }));
  });
  const lamps = [];
  for (const [i, z] of [11, -3, -17, -31].entries()) {
    const lamp = new THREE.PointLight(0xffb879, 85, 20, 2); lamp.position.set(i % 2 ? 7.2 : -7.2, 2.3, z); root.add(lamp); lamps.push(lamp);
  }
  const altarLight = new THREE.PointLight(0x73cdbf, 55, 13, 2); altarLight.position.set(0, 4, -40); root.add(altarLight);
  const key = new THREE.SpotLight(0xbdced4, 135, 80, 0.62, 0.7, 1.5);
  key.position.set(-3, 7.8, 14); key.target.position.set(0, 0, -10);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.normalBias = 0.045; key.shadow.bias = -0.0001;
  root.add(key, key.target);
  const fill = new THREE.HemisphereLight(0x9ac0c8, 0x35362f, 0.3); root.add(fill);
  const fog = createChurchFog(); root.add(fog);
  const fogConfig = { enabled: true, intensity: 0.06, height: 0.8, coverage: 70, color: "#788d89", windSpeed: 0.16 };
  root.userData.atmosphere = new THREE.FogExp2(0x111d1d, 0.012);
  root.userData.animate = (_enabled, { period }, time) => {
    const brightness = period === "day" ? 1.35 : period === "sunset" ? 1.15 : 1;
    key.intensity = 135 * brightness;
    fill.intensity = 0.3 * brightness;
    lamps.forEach((lamp, i) => { lamp.intensity = 85 * (1 + Math.sin(time * 0.005 + i) * 0.035); });
    flames.forEach((flame) => { flame.update(time, brightness); });
    doors.forEach(({ door, group, rubble }) => { group.visible = !door.broken; rubble.visible = door.broken; });
    fog.userData.animate(fogConfig, time, true, 0.6);
  };
  root.userData.dispose = () => { fog.userData.dispose(); key.shadow.dispose(); };
  return root;
}
