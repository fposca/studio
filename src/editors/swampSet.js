import * as THREE from "three";
import barkTextureUrl from "../assets/environments/cemetery-bark-v1.png";
import boughTextureUrl from "../assets/environments/swamp-cypress-bough-v1.png";
import mudTextureUrl from "../assets/environments/night-swamp-mud-v2.png";

function seededRandom(seed) {
  return () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function swampHeightAt(x, z) {
  const distance = Math.hypot(x * 0.9, z * 1.1);
  const actorClearance = Math.min(
    0.12 + 0.88 * THREE.MathUtils.smoothstep(distance, 2.5, 9),
    0.18 + 0.82 * THREE.MathUtils.smoothstep(Math.abs(x), 2.5, 7.5)
  );
  const broad = Math.sin(x * 0.17 + Math.cos(z * 0.09)) * Math.cos(z * 0.23 - x * 0.05) * 0.16;
  const ripples = Math.sin(x * 0.53 + z * 0.18) * Math.sin(z * 0.61 - x * 0.16) * 0.065;
  const raisedMud = Math.max(0, Math.sin(x * 0.35 + z * 0.23) * Math.sin(z * 0.37 - x * 0.11)) * 0.16;
  return (broad + ripples + raisedMud) * actorClearance;
}

export function createSwampTerrainGeometry() {
  const geometry = new THREE.PlaneGeometry(280, 280, 224, 224);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    positions.setZ(index, swampHeightAt(positions.getX(index), -positions.getY(index)));
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function addBranch(parent, material, from, to, radius) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.58, radius, direction.length(), 6), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

export function createSwampSet() {
  const group = new THREE.Group();
  group.name = "Arboleda del pantano";
  group.userData.editorHelper = true;
  group.visible = false;
  const random = seededRandom(84437);
  const barkTexture = new THREE.TextureLoader().load(barkTextureUrl);
  barkTexture.colorSpace = THREE.SRGBColorSpace;
  barkTexture.wrapS = barkTexture.wrapT = THREE.RepeatWrapping;
  barkTexture.repeat.set(1, 2);
  barkTexture.anisotropy = 8;
  const boughTexture = new THREE.TextureLoader().load(boughTextureUrl);
  boughTexture.colorSpace = THREE.SRGBColorSpace;
  boughTexture.anisotropy = 8;
  const mudTexture = new THREE.TextureLoader().load(mudTextureUrl);
  mudTexture.colorSpace = THREE.SRGBColorSpace;
  mudTexture.anisotropy = 8;
  const bark = new THREE.MeshLambertMaterial({ color: 0xc2c1b5, map: barkTexture, bumpMap: barkTexture, bumpScale: 0.035 });
  const foliageMaterial = new THREE.MeshBasicMaterial({ color: 0x4e705f, map: boughTexture,
    side: THREE.DoubleSide, alphaTest: 0.065, depthWrite: true });
  const foliageGeometry = new THREE.PlaneGeometry(1.5, 1);
  const water = new THREE.MeshStandardMaterial({ color: 0x101e1c, roughness: 0.68, metalness: 0, transparent: true, opacity: 0.88, depthWrite: false });
  const reedsMaterial = new THREE.MeshLambertMaterial({ color: 0x66715d, side: THREE.DoubleSide });
  const mudClodMaterial = new THREE.MeshLambertMaterial({ color: 0xf1eee2, map: mudTexture });
  const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x54694d, side: THREE.DoubleSide });
  grassMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uSwampWind = { value: 0 };
    shader.vertexShader = shader.vertexShader.replace("#include <common>",
      "#include <common>\nuniform float uSwampWind;");
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
      #include <begin_vertex>
      #ifdef USE_INSTANCING
        transformed.x += sin(uSwampWind * 1.7 + instanceMatrix[3].x * 0.21
          + instanceMatrix[3].z * 0.28) * position.y * position.y * 0.13;
      #endif
    `);
    grassMaterial.userData.shader = shader;
  };
  grassMaterial.customProgramCacheKey = () => "swamp-grass-wind-v1";
  const foliageCards = [];
  const treePositions = [
    [-15, -8], [17, -10], [-23, -23], [24, -25], [-34, -37], [35, -38],
    [-30, 7], [31, 8], [-17, 20], [20, 21], [-43, -15], [44, -19]
  ];
  treePositions.forEach(([x, z], index) => {
    const tree = new THREE.Group();
    tree.position.set(x, swampHeightAt(x, z) - 0.015, z);
    tree.rotation.y = random() * Math.PI * 2;
    const height = 5.8 + random() * 2.8;
    const radius = 0.42 + random() * 0.22;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.58, radius, height, 9), bark);
    trunk.position.y = height * 0.5;
    trunk.rotation.z = (random() - 0.5) * 0.09;
    trunk.castShadow = true;
    tree.add(trunk);
    for (let root = 0; root < 5; root += 1) {
      const angle = root * Math.PI * 0.4 + index * 0.37;
      const length = 1.3 + random() * 1.7;
      addBranch(tree, bark,
        [Math.cos(angle) * radius * 0.45, 0.9, Math.sin(angle) * radius * 0.45],
        [Math.cos(angle) * length, 0.04, Math.sin(angle) * length], 0.17 + random() * 0.08);
    }
    for (let branch = 0; branch < 5; branch += 1) {
      const angle = branch * Math.PI * 0.72 + index;
      const y = height * (0.31 + branch * 0.11);
      const length = 2.1 + random() * 2.2;
      const tip = [Math.cos(angle) * length, y + 0.4 + random() * 0.65, Math.sin(angle) * length];
      addBranch(tree, bark, [0, y, 0], tip, 0.14 + random() * 0.07);
      for (let cross = 0; cross < 2; cross += 1) {
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.set(tip[0] * 0.55, tip[1] - 0.43, tip[2] * 0.55);
        foliage.scale.set(length * (0.75 + random() * 0.22), 1.6 + random() * 0.48, 1);
        foliage.rotation.y = -angle + cross * Math.PI * 0.5;
        foliage.rotation.z = (random() - 0.5) * 0.14;
        tree.add(foliage);
        foliageCards.push({ object: foliage, base: foliage.rotation.z, phase: index * 1.7 + branch + cross });
      }
    }
    group.add(tree);
  });

  const puddleGeometry = new THREE.CircleGeometry(1, 12);
  for (let index = 0; index < 24; index += 1) {
    const side = index % 2 ? 1 : -1;
    const puddle = new THREE.Mesh(puddleGeometry, water);
    puddle.rotation.x = -Math.PI / 2;
    puddle.rotation.z = random() * Math.PI;
    const x = side * (8 + random() * 27);
    const z = -38 + random() * 62;
    puddle.position.set(x, swampHeightAt(x, z) - 0.005, z);
    puddle.scale.set(0.55 + random() * 1.9, 0.28 + random() * 0.65, 1);
    group.add(puddle);
  }

  const reedGeometry = new THREE.ConeGeometry(0.035, 1, 3);
  const reedCount = 580;
  const reeds = new THREE.InstancedMesh(reedGeometry, reedsMaterial, reedCount);
  reeds.name = "Juncos del pantano";
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  for (let index = 0; index < reedCount; index += 1) {
    const side = index % 2 ? 1 : -1;
    const height = 0.35 + random() * 0.85;
    const x = side * (7.7 + random() * 38);
    const z = -46 + random() * 76;
    dummy.position.set(x, swampHeightAt(x, z) - 0.015 + height * 0.5, z);
    dummy.rotation.set((random() - 0.5) * 0.22, random() * Math.PI, (random() - 0.5) * 0.38);
    dummy.scale.set(0.7 + random() * 0.8, height, 0.7 + random() * 0.8);
    dummy.updateMatrix();
    reeds.setMatrixAt(index, dummy.matrix);
    const shade = 0.65 + random() * 0.35;
    reeds.setColorAt(index, color.setRGB(shade, shade * 0.96, shade * 0.78));
  }
  reeds.instanceMatrix.needsUpdate = true;
  group.add(reeds);

  const clodCount = 58;
  const clods = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 5), mudClodMaterial, clodCount);
  clods.name = "Terrones de barro";
  for (let index = 0; index < clodCount; index += 1) {
    const side = index % 2 ? 1 : -1;
    const x = side * (4.3 + random() * 24);
    const z = -20 + random() * 47;
    dummy.position.set(x, swampHeightAt(x, z) + 0.005, z);
    dummy.rotation.set(0, random() * Math.PI, 0);
    dummy.scale.set(0.65 + random() * 0.92, 0.14 + random() * 0.21, 0.48 + random() * 0.85);
    dummy.updateMatrix();
    clods.setMatrixAt(index, dummy.matrix);
  }
  clods.instanceMatrix.needsUpdate = true;
  group.add(clods);

  const grassGeometry = new THREE.BufferGeometry();
  grassGeometry.setAttribute("position", new THREE.Float32BufferAttribute([
    -0.028, 0, 0, 0.028, 0, 0, -0.01, 0.55, 0.015, 0.003, 1, 0.08
  ], 3));
  grassGeometry.setIndex([0, 1, 2, 1, 3, 2]);
  grassGeometry.computeVertexNormals();
  const grassCount = 24000;
  const grass = new THREE.InstancedMesh(grassGeometry, grassMaterial, grassCount);
  grass.name = "Pasto alto del pantano";
  grass.frustumCulled = false;
  for (let index = 0; index < grassCount; index += 1) {
    const x = (random() - 0.5) * 78;
    const z = -45 + random() * 72;
    const height = 0.12 + random() * 0.33;
    dummy.position.set(x, swampHeightAt(x, z) - 0.015, z);
    dummy.rotation.set(0, random() * Math.PI, (random() - 0.5) * 0.25);
    dummy.scale.set(0.7 + random() * 0.8, height, 1);
    dummy.updateMatrix();
    grass.setMatrixAt(index, dummy.matrix);
    const shade = 0.58 + random() * 0.42;
    grass.setColorAt(index, color.setRGB(shade, shade * (0.86 + random() * 0.12), shade * 0.73));
  }
  grass.instanceMatrix.needsUpdate = true;
  group.add(grass);
  group.userData.stats = { trees: treePositions.length, puddles: 24, reeds: reedCount, clods: clodCount, grass: grassCount };
  group.userData.animate = (time, active, reduced = false) => {
    group.visible = Boolean(active);
    if (!group.visible) return;
    reeds.count = reduced ? 320 : reedCount;
    clods.count = reduced ? 36 : clodCount;
    grass.count = reduced ? 12000 : grassCount;
    if (grassMaterial.userData.shader) grassMaterial.userData.shader.uniforms.uSwampWind.value = time * 0.001;
    for (const { object, base, phase } of foliageCards) object.rotation.z = base + Math.sin(time * 0.0008 + phase) * 0.018;
  };
  group.userData.dispose = () => {
    const geometries = new Set(), materials = new Set();
    group.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    barkTexture.dispose();
    boughTexture.dispose();
    mudTexture.dispose();
  };
  return group;
}
