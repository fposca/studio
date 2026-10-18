import * as THREE from "three";
import { createChurchFog } from "../editors/churchFog.js";
import { createGameFire } from "./gameFire.js";
import { CEMETERY_CRYPT_WALLS, CEMETERY_MAUSOLEUMS, CEMETERY_REAR_CRYPTS, CEMETERY_TORCHES, GRAVES } from "./gameLevels.js";

export function createGameCemetery(world) {
  const root = new THREE.Group();
  root.name = "Nivel 3 - Cementerio";
  const loader = new THREE.TextureLoader();
  const texture = (url, repeat = 1) => {
    const map = loader.load(url);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(repeat, repeat);
    map.anisotropy = 8;
    return map;
  };
  const stoneMap = texture(new URL("../assets/environments/cemetery-stone-v2.png", import.meta.url).href);
  const soilMap = texture(new URL("../assets/environments/cemetery-soil-v3.png", import.meta.url).href, 24);
  const barkMap = texture(new URL("../assets/environments/cemetery-bark-v1.png", import.meta.url).href);
  const stone = new THREE.MeshStandardMaterial({ map: stoneMap, bumpMap: stoneMap, bumpScale: 0.075, color: 0xa1aca2, roughness: 0.95 });
  const soil = new THREE.MeshStandardMaterial({ map: soilMap, bumpMap: soilMap, bumpScale: 0.1, color: 0x737d67, roughness: 1 });
  const bark = new THREE.MeshStandardMaterial({ map: barkMap, bumpMap: barkMap, bumpScale: 0.06, color: 0x697068, roughness: 1 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x303637, metalness: 0.65, roughness: 0.75 });
  const black = new THREE.MeshStandardMaterial({ color: 0x10191a, roughness: 1 });
  const box = new THREE.BoxGeometry(1, 1, 1);
  const mesh = (geometry, material, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z); object.scale.set(sx, sy, sz);
    object.castShadow = object.receiveShadow = true;
    root.add(object);
    return object;
  };
  mesh(new THREE.PlaneGeometry(200, 200), soil, 0, -0.016, 0).rotation.x = -Math.PI / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-0.54, 0); shape.lineTo(0.54, 0); shape.lineTo(0.54, 1.08);
  shape.quadraticCurveTo(0.54, 1.53, 0, 1.56); shape.quadraticCurveTo(-0.54, 1.53, -0.54, 1.08); shape.closePath();
  const marker = new THREE.ExtrudeGeometry(shape, { depth: 0.29, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 2, steps: 1 });
  marker.translate(0, 0, -0.145);
  for (const { x, z, kind } of GRAVES) {
    mesh(marker, stone, x, 0, z);
    mesh(box, stone, x, 0.06, z + 1.1, 1.08, 0.12, 2.6);
    if (kind === 1) {
      mesh(box, stone, x, 1.78, z, 0.14, 0.65, 0.18);
      mesh(box, stone, x, 1.88, z, 0.52, 0.12, 0.18);
    }
    mesh(box, black, x, 0.94, z + 0.177, 0.035, 0.32, 0.012);
    mesh(box, black, x, 1.0, z + 0.177, 0.2, 0.035, 0.012);
    for (let i = 0; i < 3; i++) mesh(box, black, x, 0.69 - i * 0.075, z + 0.177, 0.42 - i * 0.06, 0.018, 0.012);
  }
  // Each mausoleum is solid, forcing a choice between the two burial aisles.
  for (const [x, y, z, width, height, depth] of CEMETERY_MAUSOLEUMS) {
    mesh(box, stone, x, y, z, width, height, depth);
    mesh(box, stone, x, height + 0.02, z, width + 0.6, 0.32, depth + 0.5);
    mesh(box, stone, x, 0.16, z, width + 0.5, 0.32, depth + 0.5);
    mesh(box, black, x, 1.9, z + depth / 2 + 0.02, 2.65, 3.8, 0.03);
    for (let bar = -1.1; bar <= 1.15; bar += 0.22)
      mesh(box, iron, x + bar, 1.87, z + depth / 2 + 0.1, 0.035, 3.7, 0.07);
    for (const side of [-1, 1]) mesh(box, stone, x + side * (width / 2 - 0.7), 2.7,
      z + depth / 2 + 0.22, 0.5, 5.4, 0.55);
    mesh(box, stone, x, height + 0.75, z, 0.28, 1.4, 0.32);
    mesh(box, stone, x, height + 0.96, z, 1, 0.24, 0.32);
  }
  // A ruined gate frames the last encounter and stays solid at ground level.
  for (const x of [-4, 4]) {
    mesh(box, stone, x, 2.2, -91.7, 1.15, 4.4, 1.1);
    mesh(box, iron, x, 4.45, -91.7, 1.45, 0.16, 1.35);
  }
  mesh(box, stone, 0, 4.75, -91.7, 9.6, 0.65, 1.35);
  mesh(box, black, 0, 2, -92.35, 6.8, 4, 0.18);
  for (let x = -3; x <= 3.1; x += 0.45) mesh(box, iron, x, 2, -92.23, 0.055, 3.8, 0.09);
  // Two walled burial chambers share their dimensions with the physics colliders.
  for (const [x, y, z, width, height, depth] of CEMETERY_CRYPT_WALLS) {
    mesh(box, stone, x, y, z, width, height, depth);
    mesh(box, iron, x, height + 0.08, z, width + 0.06, 0.16, depth + 0.06);
  }
  const secretPanels = world.secretDoors.map((door) => {
    const panel = new THREE.Group();
    panel.name = `Muro secreto ${door.id}`;
    panel.position.set(door.x, 0, door.z);
    root.add(panel);
    const slab = new THREE.Mesh(box, stone);
    slab.position.y = door.height / 2;
    slab.scale.set(door.width, door.height, door.depth);
    slab.castShadow = slab.receiveShadow = true;
    panel.add(slab);
    for (const z of [-1.03, 0, 1.03]) {
      const crack = new THREE.Mesh(box, black);
      crack.position.set(-Math.sign(door.x) * (door.width / 2 + 0.012), 1.22, z);
      crack.scale.set(0.025, 1.35, 0.035);
      crack.rotation.x = 0.27 * Math.sign(z || 1);
      panel.add(crack);
    }
    return { door, panel };
  });
  for (const side of [-1, 1]) {
    const z = side < 0 ? -16 : -23;
    mesh(box, stone, side * 15.05, 0.1, z, 2.8, 0.2, 3.8);
    mesh(box, black, side * 15.1, 0.22, z, 1.9, 0.025, 2.9);
  }
  for (const { x, z } of CEMETERY_REAR_CRYPTS) {
    mesh(box, stone, x, 0.12, z, 4.6, 0.24, 3.9);
    mesh(box, black, x, 0.25, z, 3.5, 0.025, 2.8);
    for (const offset of [-1.3, 1.3]) mesh(box, stone, x + offset, 0.42, z, 0.7, 0.6, 1.4);
  }
  const flames = [];
  CEMETERY_TORCHES.forEach(([x, z], index) => {
    mesh(box, stone, x, 0.8, z, 0.65, 1.6, 0.65);
    mesh(new THREE.CylinderGeometry(0.33, 0.15, 0.2, 12), iron, x, 1.67, z);
    mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 12), black, x, 1.79, z);
    flames.push(createGameFire(root, { x, y: 1.8, z, size: 0.85, intensity: 15, distance: 10, seed: index * 3.1 }));
  });
  const segment = new THREE.CylinderGeometry(0.1, 0.18, 1, 7);
  const from = new THREE.Vector3(), to = new THREE.Vector3(), direction = new THREE.Vector3();
  function branch(ax, ay, az, bx, by, bz, width) {
    from.set(ax, ay, az); to.set(bx, by, bz); direction.subVectors(to, from);
    const limb = mesh(segment, bark, (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, width, direction.length(), width);
    limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  }
  for (let i = 0; i < 40; i++) {
    const side = i % 2 ? 1 : -1, x = side * (26 + (i % 4) * 2.8), z = 20 - Math.floor(i / 2) * 6.2;
    const h = 5.2 + (i % 3);
    branch(x, 0, z, x + side * 0.5, h, z - 0.7, 3.2);
    for (let j = 0; j < 5; j++) {
      const angle = j * 2.4 + i, y = h * (0.42 + j * 0.09);
      const bx = x + Math.sin(angle) * 2.6, bz = z + Math.cos(angle) * 2.6;
      branch(x, y, z, bx, y + 1.3, bz, 1.3);
      branch(bx, y + 1.3, bz, bx + Math.sin(angle + 1) * 1.1, y + 2.4, bz + 0.8, 0.65);
    }
  }
  const moon = new THREE.DirectionalLight(0xd4e3ff, 2.2);
  moon.position.set(-18, 27, -35); moon.target.position.set(0, 0, -43);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -65, right: 65, top: 70, bottom: -70, near: 0.5, far: 180 });
  moon.shadow.normalBias = 0.04; moon.shadow.bias = -0.00015;
  root.add(moon, moon.target);
  const gateLight = new THREE.PointLight(0x91a9b2, 62, 20, 2);
  gateLight.position.set(0, 4.1, -88); root.add(gateLight);
  const sky = mesh(new THREE.SphereGeometry(180, 48, 24), new THREE.MeshBasicMaterial({
    map: texture(new URL("../assets/environments/sky-cemetery-v2.png", import.meta.url).href), side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false
  }), 0, 0, -35);
  sky.castShadow = sky.receiveShadow = false;
  const fog = createChurchFog(); root.add(fog);
  const fogConfig = { enabled: true, intensity: 0.18, height: 1.6, coverage: 120, color: "#63736f", windSpeed: 0.34 };
  root.userData.atmosphere = new THREE.FogExp2(0x202b2e, 0.018);
  root.userData.animate = (_enabled, { period }, time) => {
    const night = period === "night";
    moon.intensity = night ? 2.2 : 3;
    moon.color.set(period === "sunset" ? 0xffbd83 : night ? 0xd4e3ff : 0xf4f0dc);
    sky.material.color.setScalar(night ? 0.6 : 0.95);
    fog.userData.animate(fogConfig, time, true, 0.6);
    secretPanels.forEach(({ door, panel }) => { panel.visible = !door.broken; });
    flames.forEach((flame) => { flame.update(time, night ? 1 : 0.6); });
  };
  root.userData.dispose = () => { fog.userData.dispose(); moon.shadow.dispose(); };
  return root;
}
