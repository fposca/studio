import * as THREE from "three";
import stoneTextureUrl from "../assets/environments/castle-interior-stone-v1.png";
import woodTextureUrl from "../assets/environments/walnut-texture.png";
import rugTextureUrl from "../assets/environments/castle-runner-wool-v1.png";

export const DEFAULT_CASTLE_LIGHTING = Object.freeze({
  enabled: false, fire: 0.9, moon: 0.7, flicker: 0.35, dust: 0.4
});

export function normalizeCastleLighting(value = {}) {
  const result = { ...DEFAULT_CASTLE_LIGHTING, ...value };
  result.enabled = Boolean(result.enabled);
  for (const [key, max] of [["fire", 2], ["moon", 2], ["flicker", 1], ["dust", 1]]) {
    const number = Number(result[key]);
    result[key] = Number.isFinite(number) ? THREE.MathUtils.clamp(number, 0, max) : DEFAULT_CASTLE_LIGHTING[key];
  }
  return result;
}

function seededRandom(seed) {
  return () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function createFlameTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  const pixels = context.createImageData(canvas.width, canvas.height);
  for (let row = 0; row < canvas.height; row += 1) {
    const height = 1 - row / (canvas.height - 1);
    const width = 0.32 * Math.pow(1 - height, 0.7) + 0.025;
    const center = 0.5 + Math.sin(height * 13) * 0.045 * height;
    for (let column = 0; column < canvas.width; column += 1) {
      const distance = Math.abs(column / canvas.width - center) / width;
      const edge = Math.max(0, 1 - distance * distance);
      const shape = edge * Math.min(1, height * 15) * Math.min(1, (1 - height) * 9);
      const detail = 0.82 + 0.18 * Math.sin(column * 0.31 + row * 0.19);
      const offset = (row * canvas.width + column) * 4;
      pixels.data[offset] = 255;
      pixels.data[offset + 1] = Math.round(52 + 180 * (1 - height) * edge);
      pixels.data[offset + 2] = Math.round(5 + 95 * (1 - height) * edge * edge);
      pixels.data[offset + 3] = Math.round(240 * shape * detail);
    }
  }
  context.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCastleInteriorSet() {
  const group = new THREE.Group();
  group.name = "Galeria del castillo";
  group.userData.editorHelper = true;
  group.visible = false;
  const stoneTexture = new THREE.TextureLoader().load(stoneTextureUrl);
  stoneTexture.colorSpace = THREE.SRGBColorSpace;
  stoneTexture.wrapS = stoneTexture.wrapT = THREE.RepeatWrapping;
  stoneTexture.repeat.set(1, 2);
  stoneTexture.anisotropy = 8;
  const woodTexture = new THREE.TextureLoader().load(woodTextureUrl);
  woodTexture.colorSpace = THREE.SRGBColorSpace;
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(2, 1);
  const rugTexture = new THREE.TextureLoader().load(rugTextureUrl);
  rugTexture.colorSpace = THREE.SRGBColorSpace;
  rugTexture.wrapS = rugTexture.wrapT = THREE.RepeatWrapping;
  rugTexture.repeat.set(1, 3);
  rugTexture.anisotropy = 16;
  const flameTexture = createFlameTexture();
  const stone = new THREE.MeshStandardMaterial({
    color: 0xaba49a, map: stoneTexture, bumpMap: stoneTexture, bumpScale: 0.055,
    roughness: 1, metalness: 0, envMapIntensity: 0.12
  });
  const darkStone = new THREE.MeshStandardMaterial({ color: 0x655e55, roughness: 1, metalness: 0 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x4b4239, roughness: 0.86, metalness: 0.38 });
  const wood = new THREE.MeshStandardMaterial({ color: 0xc7ad8c, map: woodTexture,
    bumpMap: woodTexture, bumpScale: 0.025, roughness: 0.92, metalness: 0,
    emissive: 0x160d07, emissiveIntensity: 0.22 });
  const brass = new THREE.MeshStandardMaterial({ color: 0x9e8358, roughness: 0.55, metalness: 0.62 });
  const wool = new THREE.MeshStandardMaterial({ color: 0xd2b7a0, map: rugTexture,
    bumpMap: rugTexture, bumpScale: 0.015, roughness: 1, metalness: 0 });
  const rugTrim = new THREE.MeshStandardMaterial({ color: 0x8d6634, roughness: 1, metalness: 0 });
  const fringeMaterial = new THREE.MeshStandardMaterial({ color: 0xa18659, roughness: 1, metalness: 0 });
  const flameMaterial = new THREE.SpriteMaterial({
    map: flameTexture, color: 0xffbd68, toneMapped: false, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending
  });
  const columnGeometry = new THREE.CylinderGeometry(0.42, 0.49, 5.8, 12);
  const baseGeometry = new THREE.CylinderGeometry(0.72, 0.78, 0.28, 12);
  const capitalGeometry = new THREE.CylinderGeometry(0.74, 0.52, 0.42, 12);
  const columnPositions = [];
  for (const side of [-1, 1]) {
    for (const z of [-8, -21, -34]) {
      const x = side * 10.5;
      const base = new THREE.Mesh(baseGeometry, darkStone);
      base.position.set(x, 0.14, z);
      const shaft = new THREE.Mesh(columnGeometry, stone);
      shaft.position.set(x, 3.18, z);
      const capital = new THREE.Mesh(capitalGeometry, stone);
      capital.position.set(x, 6.29, z);
      for (const object of [base, shaft, capital]) {
        object.castShadow = true;
        object.receiveShadow = true;
        group.add(object);
      }
      columnPositions.push({ x, z });
    }
  }
  const benchSeat = new THREE.BoxGeometry(3.5, 0.18, 0.75);
  const benchLeg = new THREE.BoxGeometry(0.2, 0.72, 0.54);
  for (const x of [-8.7, 8.7]) {
    for (const z of [-13, -27]) {
      const seat = new THREE.Mesh(benchSeat, wood);
      seat.position.set(x, 0.83, z);
      for (const offset of [-1.35, 1.35]) {
        const leg = new THREE.Mesh(benchLeg, wood);
        leg.position.set(x + offset, 0.37, z);
        leg.castShadow = true;
        group.add(leg);
      }
      seat.castShadow = true;
      seat.receiveShadow = true;
      group.add(seat);
    }
  }
  const rug = new THREE.Group();
  rug.name = "Alfombra del gran salon";
  rug.position.z = -3;
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 21), wool);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.y = 0.014;
  carpet.receiveShadow = true;
  rug.add(carpet);
  for (const side of [-1, 1]) {
    const sideTrim = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 21), rugTrim);
    sideTrim.rotation.x = -Math.PI / 2;
    sideTrim.position.set(side * 2.31, 0.018, 0);
    rug.add(sideTrim);
    const endTrim = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.18), rugTrim);
    endTrim.rotation.x = -Math.PI / 2;
    endTrim.position.set(0, 0.018, side * 10.4);
    rug.add(endTrim);
  }
  const fringeGeometry = new THREE.BoxGeometry(0.075, 0.015, 0.27);
  const fringes = new THREE.InstancedMesh(fringeGeometry, fringeMaterial, 64);
  const fringePart = new THREE.Object3D();
  for (let index = 0; index < fringes.count; index += 1) {
    const end = index < 32 ? -1 : 1;
    fringePart.position.set(-2.29 + (index % 32) * 0.148, 0.016, end * 10.68);
    fringePart.rotation.y = (index % 3 - 1) * 0.04;
    fringePart.updateMatrix();
    fringes.setMatrixAt(index, fringePart.matrix);
  }
  fringes.instanceMatrix.needsUpdate = true;
  rug.add(fringes);
  group.add(rug);

  const chestBodyGeometry = new THREE.BoxGeometry(1.9, 0.85, 0.92);
  const chestLidGeometry = new THREE.BoxGeometry(2.05, 0.15, 1.04);
  const chestBandGeometry = new THREE.BoxGeometry(0.13, 0.95, 1.05);
  const chestLockGeometry = new THREE.BoxGeometry(0.2, 0.24, 0.07);
  for (const x of [-6.5, 6.5]) {
    for (const z of [-4, -18]) {
      const chest = new THREE.Group();
      chest.name = "Cofre de madera y hierro";
      chest.position.set(x, 0, z);
      const body = new THREE.Mesh(chestBodyGeometry, wood);
      body.position.y = 0.48;
      const lid = new THREE.Mesh(chestLidGeometry, wood);
      lid.position.y = 0.98;
      chest.add(body, lid);
      for (const offset of [-0.65, 0.65]) {
        const band = new THREE.Mesh(chestBandGeometry, iron);
        band.position.set(offset, 0.54, 0);
        chest.add(band);
      }
      const lock = new THREE.Mesh(chestLockGeometry, brass);
      lock.position.set(0, 0.58, 0.51);
      chest.add(lock);
      chest.traverse((object) => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
      group.add(chest);
    }
  }

  const random = seededRandom(23941);
  const slabGeometry = new THREE.BoxGeometry(1, 0.1, 1);
  const slabs = new THREE.InstancedMesh(slabGeometry, stone, 42);
  slabs.name = "Losas levantadas del castillo";
  slabs.receiveShadow = true;
  slabs.frustumCulled = false;
  const dummy = new THREE.Object3D();
  for (let index = 0; index < slabs.count; index += 1) {
    const side = index % 2 ? 1 : -1;
    dummy.position.set(side * (6.8 + random() * 10), 0.035 + random() * 0.035, -35 + random() * 50);
    dummy.rotation.set((random() - 0.5) * 0.08, random() * Math.PI, (random() - 0.5) * 0.08);
    dummy.scale.set(0.5 + random() * 0.9, 0.55 + random() * 0.6, 0.38 + random() * 0.85);
    dummy.updateMatrix();
    slabs.setMatrixAt(index, dummy.matrix);
  }
  slabs.instanceMatrix.needsUpdate = true;
  group.add(slabs);

  const standGeometry = new THREE.CylinderGeometry(0.075, 0.12, 1.05, 8);
  const bowlGeometry = new THREE.CylinderGeometry(0.42, 0.27, 0.18, 12);
  const braziers = [];
  for (const x of [-7.7, 7.7]) {
    for (const z of [-7, -21]) {
      const brazier = new THREE.Group();
      brazier.position.set(x, 0, z);
      const stand = new THREE.Mesh(standGeometry, iron);
      stand.position.y = 0.53;
      const bowl = new THREE.Mesh(bowlGeometry, iron);
      bowl.position.y = 1.1;
      const flame = new THREE.Sprite(flameMaterial);
      flame.position.y = 1.52;
      flame.scale.set(0.6, 0.9, 1);
      const light = new THREE.PointLight(0xff8c45, 0, 11, 2);
      light.position.y = 1.68;
      for (const object of [stand, bowl]) { object.castShadow = true; object.receiveShadow = true; }
      brazier.add(stand, bowl, flame, light);
      group.add(brazier);
      braziers.push({ flame, light, phase: random() * Math.PI * 2 });
    }
  }
  const moon = new THREE.SpotLight(0x9dbddd, 0, 31, 0.62, 0.72, 2);
  moon.name = "Luz de ventana del castillo";
  moon.position.set(-9, 13, -9);
  moon.target.position.set(0, 1, -2);
  group.add(moon, moon.target);

  const dustCount = 120;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustSeeds = Array.from({ length: dustCount }, () => ({
    x: (random() - 0.5) * 24, y: random() * 5.5, z: -28 + random() * 40, phase: random() * 6.28
  }));
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dustMaterial = new THREE.PointsMaterial({
    color: 0xd2b89b, size: 0.055, sizeAttenuation: true,
    transparent: true, opacity: 0, depthWrite: false
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.name = "Polvo en haces del castillo";
  dust.frustumCulled = false;
  group.add(dust);

  let active = false;
  let settings = DEFAULT_CASTLE_LIGHTING;
  let detach = () => {};
  group.userData.stats = { columns: columnPositions.length, benches: 4, chests: 4, rugs: 1,
    braziers: braziers.length, raisedSlabs: slabs.count, dust: dustCount };
  group.userData.animate = (value, time, inCastle, reduced = false) => {
    settings = normalizeCastleLighting(value);
    group.visible = Boolean(inCastle);
    active = group.visible && settings.enabled;
    moon.intensity = active ? 210 * settings.moon : 0;
    for (const { flame, light, phase } of braziers) {
      flame.visible = active && settings.fire > 0;
      const pulse = 1 + settings.flicker * (Math.sin(time * 0.007 + phase) * 0.17 + Math.sin(time * 0.019 + phase) * 0.08);
      flame.scale.set(0.6 * (1 + (pulse - 1) * 0.5), 0.9 * pulse, 1);
      light.intensity = active ? 42 * settings.fire * pulse : 0;
    }
    dust.visible = active && settings.dust > 0;
    dustMaterial.opacity = settings.dust * 0.36;
    dustGeometry.setDrawRange(0, reduced ? 65 : dustCount);
    if (!dust.visible) return;
    for (let index = 0; index < dustCount; index += 1) {
      const seed = dustSeeds[index];
      const offset = index * 3;
      dustPositions[offset] = seed.x + Math.sin(time * 0.00032 + seed.phase) * 0.2;
      dustPositions[offset + 1] = 0.25 + (seed.y + time * 0.00017) % 5.5;
      dustPositions[offset + 2] = seed.z;
    }
    dustGeometry.attributes.position.needsUpdate = true;
  };
  group.userData.bind = (scene, { ambient, keyLight, panorama }) => {
    detach();
    const before = scene.onBeforeRender, after = scene.onAfterRender;
    let saved = null;
    const restore = () => {
      if (!saved) return;
      ambient.intensity = saved.ambient;
      keyLight.intensity = saved.key;
      scene.environmentIntensity = saved.environment;
      if (panorama) panorama.material.uniforms.intensity.value = saved.panorama;
      saved = null;
    };
    scene.onBeforeRender = function(...args) {
      before.apply(this, args);
      if (!active || !group.visible) return;
      saved = { ambient: ambient.intensity, key: keyLight.intensity,
        environment: scene.environmentIntensity, panorama: panorama?.material.uniforms.intensity.value };
      ambient.intensity *= 0.7;
      keyLight.intensity *= 0.48;
      scene.environmentIntensity *= 0.72;
      if (panorama) panorama.material.uniforms.intensity.value *= 0.91;
    };
    scene.onAfterRender = function(...args) { restore(); after.apply(this, args); };
    detach = () => { restore(); scene.onBeforeRender = before; scene.onAfterRender = after; };
  };
  group.userData.dispose = () => {
    detach();
    const geometries = new Set(), materials = new Set();
    group.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
      if (object.isLight) object.dispose?.();
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    stoneTexture.dispose();
    woodTexture.dispose();
    rugTexture.dispose();
    flameTexture.dispose();
  };
  return group;
}
