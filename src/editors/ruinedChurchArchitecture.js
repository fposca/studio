import * as THREE from "three";

const GROUND_Y = -0.19;

function brokenShaft(radius, height, seed) {
  const geometry = new THREE.CylinderGeometry(radius * 0.93, radius, height, 12, 1);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i), z = positions.getZ(i);
    if (positions.getY(i) > 0) {
      positions.setY(i, height / 2 + Math.sin(x * 19 + z * 13 + seed) * 0.12 + Math.cos(z * 31 + seed) * 0.06);
    }
  }
  geometry.translate(0, height / 2, 0);
  geometry.computeVertexNormals();
  return geometry;
}

function masonryBlock() {
  const shape = new THREE.Shape([
    new THREE.Vector2(-0.45, -0.44), new THREE.Vector2(0.39, -0.45),
    new THREE.Vector2(0.46, -0.33), new THREE.Vector2(0.44, 0.4),
    new THREE.Vector2(0.31, 0.46), new THREE.Vector2(-0.43, 0.42)
  ]);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.85, steps: 1, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 1
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeBoundingBox();
  geometry.translate(0, -geometry.boundingBox.min.y, 0);
  const position = geometry.attributes.position, normal = geometry.attributes.normal, uv = geometry.attributes.uv;
  for (let i = 0; i < position.count; i += 1) {
    if (Math.abs(normal.getY(i)) > 0.6) uv.setXY(i, position.getX(i), position.getZ(i));
    else uv.setXY(i, position.getX(i) + position.getZ(i), position.getY(i));
  }
  return geometry;
}

export function createRuinedChurchArchitecture(texture) {
  const group = new THREE.Group();
  group.name = "Ruinas laterales y velas";
  group.userData.editorHelper = true;
  const geometries = new Set();
  const materials = new Set();
  const stone = new THREE.MeshStandardMaterial({
    color: 0xaaa99d, map: texture, bumpMap: texture, bumpScale: 0.06,
    roughness: 1, metalness: 0, envMapIntensity: 0.5
  });
  const wax = new THREE.MeshStandardMaterial({ color: 0xb8ab8c, roughness: 0.88 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x25201a, roughness: 0.92, metalness: 0.35 });
  const flame = new THREE.MeshBasicMaterial({
    color: 0xffa22d, toneMapped: false, transparent: true, opacity: 0.58,
    depthWrite: false, blending: THREE.AdditiveBlending
  });
  const core = new THREE.MeshBasicMaterial({
    color: 0xffedb6, toneMapped: false, transparent: true, opacity: 0.92, depthWrite: false
  });
  [stone, wax, iron, flame, core].forEach(material => materials.add(material));
  const batches = new Map();
  const dummy = new THREE.Object3D();
  const point = new THREE.Vector3();
  const pillars = [];
  const candles = [];
  let wallBlocks = 0;
  let minStageClearance = Infinity;

  const place = (geometry, material, x, z, scale, supportY, rotation = [0, 0, 0], shade = 1) => {
    geometries.add(geometry);
    dummy.position.set(x, 0, z);
    dummy.rotation.set(...rotation);
    dummy.scale.set(...scale);
    dummy.updateMatrix();
    let lowest = Infinity, highest = -Infinity;
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i += 1) {
      point.fromBufferAttribute(positions, i).applyMatrix4(dummy.matrix);
      lowest = Math.min(lowest, point.y);
      highest = Math.max(highest, point.y);
      minStageClearance = Math.min(minStageClearance, Math.abs(point.x));
    }
    dummy.position.y = supportY - lowest;
    dummy.updateMatrix();
    if (!batches.has(geometry)) batches.set(geometry, { material, instances: [] });
    batches.get(geometry).instances.push({ matrix: dummy.matrix.clone(), shade });
    return supportY + highest - lowest;
  };

  const block = masonryBlock();
  const collar = new THREE.CylinderGeometry(0.5, 0.53, 0.16, 12);
  const shaftVariants = [2.1, 3.6, 2.7, 3.2].map((height, i) => brokenShaft(0.32, height, i * 7));
  const ribVariants = [1.85, 3.3, 2.45, 2.9].map((height, i) => brokenShaft(0.13, height, i * 3 + 1));
  for (const side of [-1, 1]) {
    [-8, -19, -30, 15].forEach((z, index) => {
      const x = side * (10.8 + (index === 2 ? 0.4 : 0));
      const variant = (index + (side > 0 ? 1 : 0)) % 4;
      const baseTop = place(block, stone, x, z, [1.5, 0.32, 1.5], GROUND_Y, [0, 0.03 * side, 0], 0.86);
      const plinthTop = place(block, stone, x, z, [1.18, 0.22, 1.18], baseTop, [0, -0.02, 0], 0.93);
      const shaftBase = place(collar, stone, x, z, [1, 1, 1], plinthTop);
      const top = place(shaftVariants[variant], stone, x, z, [1, 1, 1], shaftBase, [0, index * 0.7, 0]);
      for (let rib = 0; rib < 4; rib += 1) {
        const angle = rib * Math.PI / 2;
        place(ribVariants[variant], stone, x + Math.cos(angle) * 0.34, z + Math.sin(angle) * 0.34,
          [1, 1, 1], shaftBase, [0, rib, 0], 0.91);
      }
      pillars.push({ x, z, bottom: GROUND_Y, top });

      // Broken courses extend outwards from each pier, leaving the nave unobstructed.
      const courses = [3, 2, 3, 1];
      for (let column = 0; column < 4; column += 1) {
        let support = GROUND_Y;
        for (let row = 0; row < courses[column]; row += 1) {
          const wx = x + side * (1.3 + column * 0.95 + (row % 2) * 0.15);
          support = place(block, stone, wx, z + 0.1 * (column % 2), [1.02, 0.43, 0.72], support,
            [0, (column % 2 ? 0.045 : -0.025) * side, 0], 0.72 + ((row + column) % 3) * 0.09);
          wallBlocks += 1;
        }
      }
      for (let fragment = 0; fragment < 4; fragment += 1) {
        place(block, stone, x + side * (1.2 + fragment * 0.67), z + 0.95 + (fragment % 2) * 0.5,
          [0.5, 0.2 + fragment * 0.07, 0.48], GROUND_Y,
          [0.11 * fragment, fragment * 1.7, 0.07 * fragment], 0.78);
      }
    });
  }

  const candleGeometry = new THREE.CylinderGeometry(0.068, 0.074, 1, 10);
  const wickGeometry = new THREE.CylinderGeometry(0.006, 0.009, 0.045, 5);
  const waxDripGeometry = new THREE.SphereGeometry(0.016, 6, 5);
  const trayGeometry = new THREE.CylinderGeometry(0.43, 0.4, 0.045, 16);
  const flameGeometry = new THREE.LatheGeometry([
    new THREE.Vector2(0, 0), new THREE.Vector2(0.037, 0.035),
    new THREE.Vector2(0.045, 0.085), new THREE.Vector2(0.025, 0.16), new THREE.Vector2(0, 0.26)
  ], 8);
  geometries.add(flameGeometry);
  const coreGeometry = flameGeometry.clone().scale(0.5, 0.58, 0.5);
  geometries.add(coreGeometry);
  const flames = new THREE.InstancedMesh(flameGeometry, flame, 12);
  const cores = new THREE.InstancedMesh(coreGeometry, core, 12);
  for (const mesh of [flames, cores]) {
    mesh.name = "Llamas de las velas";
    mesh.userData.churchArchitecture = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    group.add(mesh);
  }
  const flameAnchors = [];
  const lights = [];
  [[-9.3, -6.7], [9.3, -8.7], [-9.3, 13.7], [9.3, -28.7]].forEach(([x, z], cluster) => {
    const trayTop = place(trayGeometry, iron, x, z, [1, 4, 1], GROUND_Y);
    for (let i = 0; i < 3; i += 1) {
      const angle = i * 2.094 + cluster;
      const cx = x + Math.cos(angle) * 0.22, cz = z + Math.sin(angle) * 0.22;
      const height = 0.25 + ((i + cluster) % 3) * 0.12;
      const top = place(candleGeometry, wax, cx, cz, [1, height, 1], trayTop);
      place(wickGeometry, iron, cx, cz, [1, 1, 1], top - 0.008);
      for (let drip = 0; drip < 3; drip += 1) {
        const dripAngle = drip * 2.094 + i;
        const length = 0.08 + ((drip + i) % 3) * 0.04;
        place(waxDripGeometry, wax, cx + Math.cos(dripAngle) * 0.068, cz + Math.sin(dripAngle) * 0.068,
          [1, length / 0.032, 1], top - length - 0.008);
      }
      flameAnchors.push(new THREE.Vector3(cx, top - 0.012, cz));
      candles.push({ x: cx, z: cz, bottom: trayTop, top });
    }
    const light = new THREE.PointLight(0xffbf79, 4.8, 7, 2);
    light.position.set(x, 0.75, z);
    group.add(light);
    lights.push(light);
  });

  const color = new THREE.Color();
  for (const [geometry, { material, instances }] of batches) {
    const mesh = new THREE.InstancedMesh(geometry, material, instances.length);
    mesh.name = material === stone ? "Mamposteria arquitectonica" : "Velas y soportes";
    mesh.userData.churchArchitecture = true;
    instances.forEach(({ matrix, shade }, i) => {
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, color.setScalar(shade));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = material === stone;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    group.add(mesh);
  }
  group.userData.stats = { pillars, wallBlocks, candles, minStageClearance };
  group.userData.animate = (time) => {
    const seconds = time * 0.001;
    flameAnchors.forEach((position, i) => {
      const flicker = Math.sin(seconds * 9.7 + i * 1.9) * 0.07 + Math.sin(seconds * 17.3 + i) * 0.035;
      dummy.position.copy(position);
      dummy.scale.set(1 - flicker * 0.5, 1 + flicker, 1 - flicker * 0.5);
      dummy.rotation.set(0, 0, Math.sin(seconds * 4.6 + i) * 0.065);
      dummy.updateMatrix();
      flames.setMatrixAt(i, dummy.matrix);
      cores.setMatrixAt(i, dummy.matrix);
    });
    flames.instanceMatrix.needsUpdate = true;
    cores.instanceMatrix.needsUpdate = true;
    lights.forEach((light, i) => {
      light.intensity = 4.8 * (1 + Math.sin(seconds * 9.7 + i * 2) * 0.045 + Math.sin(seconds * 17.3 + i) * 0.018);
    });
  };
  group.userData.animate(0);
  group.userData.dispose = () => {
    group.traverse(object => { if (object.isInstancedMesh) object.dispose(); });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
  };
  return group;
}
