import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

function sphere(parent, position, scale, material) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), material);
  mesh.position.set(...position); mesh.scale.set(...scale); parent.add(mesh);
  return mesh;
}

function bone(parent, from, to, radius, material) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.82, radius, direction.length(), 8), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  parent.add(mesh);
  for (const point of [from, to]) sphere(parent, point, [radius * 1.35, radius * 1.12, radius * 1.25], material);
}

function tube(parent, points, radius, material) {
  const path = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 16, radius, 6, false), material);
  parent.add(mesh);
}

// Decorations move as a whole. Merge their small bones and legs to keep draw calls low.
function mergeDecoration(group) {
  group.updateMatrixWorld(true);
  const inverse = group.matrixWorld.clone().invert();
  const batches = new Map();
  const originals = new Set();
  group.traverse(object => {
    if (!object.isMesh) return;
    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    geometry.applyMatrix4(inverse.clone().multiply(object.matrixWorld));
    if (!batches.has(object.material)) batches.set(object.material, []);
    batches.get(object.material).push(geometry);
    originals.add(object.geometry);
  });
  group.clear();
  for (const [material, parts] of batches) {
    const mesh = new THREE.Mesh(mergeGeometries(parts), material);
    mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
    parts.forEach(part => part.dispose());
  }
  originals.forEach(geometry => geometry.dispose());
}

function skeleton(parent, x, z, yaw, scale, materials) {
  const pivot = new THREE.Group();
  pivot.position.set(x, 4.64, z); pivot.rotation.y = yaw; parent.add(pivot);
  bone(pivot, [0, 0, 0], [0, -0.42, 0], 0.006, materials.silk);
  const body = new THREE.Group(); body.position.y = -0.6; body.scale.setScalar(scale); pivot.add(body);
  sphere(body, [0, -0.04, 0], [0.16, 0.19, 0.145], materials.bone);
  sphere(body, [0, -0.18, 0.04], [0.112, 0.065, 0.108], materials.bone);
  for (const sign of [-1, 1]) {
    sphere(body, [sign * 0.068, -0.065, 0.123], [0.048, 0.061, 0.028], materials.dark);
    sphere(body, [sign * 0.12, -0.13, 0.09], [0.035, 0.044, 0.039], materials.bone);
    bone(body, [sign * 0.02, -0.29, 0], [sign * 0.22, -0.32, 0], 0.025, materials.bone);
    for (let row = 0; row < 6; row++) {
      const y = -0.35 - row * 0.055, width = 0.19 - Math.abs(row - 2) * 0.015;
      tube(body, [[0, y + 0.025, -0.035], [sign * width, y, 0], [sign * width * 0.85, y - 0.045, 0.095], [sign * 0.025, y - 0.06, 0.13]], 0.014, materials.bone);
    }
    tube(body, [[sign * 0.025, -0.78, 0], [sign * 0.145, -0.74, 0.015], [sign * 0.17, -0.86, 0.025], [sign * 0.08, -0.93, 0.035], [0, -0.86, 0]], 0.037, materials.bone);
    bone(body, [sign * 0.225, -0.33, 0], [sign * 0.31, -0.63, 0.02], 0.029, materials.bone);
    bone(body, [sign * 0.31, -0.63, 0.02], [sign * 0.33, -0.89, 0.045], 0.019, materials.bone);
    bone(body, [sign * 0.345, -0.64, 0.02], [sign * 0.36, -0.88, 0.035], 0.012, materials.bone);
    sphere(body, [sign * 0.345, -0.94, 0.04], [0.043, 0.06, 0.023], materials.bone);
    for (let finger = 0; finger < 4; finger++) bone(body, [sign * (0.315 + finger * 0.02), -0.97, 0.04], [sign * (0.31 + finger * 0.024), -1.06 + finger * 0.009, 0.045], 0.007, materials.bone);
    bone(body, [sign * 0.105, -0.91, 0], [sign * 0.125, -1.25, 0.025], 0.034, materials.bone);
    sphere(body, [sign * 0.125, -1.25, 0.055], [0.039, 0.045, 0.024], materials.bone);
    bone(body, [sign * 0.125, -1.29, 0.01], [sign * 0.13, -1.62, 0.025], 0.025, materials.bone);
    bone(body, [sign * 0.16, -1.29, 0.01], [sign * 0.16, -1.6, 0.025], 0.011, materials.bone);
    sphere(body, [sign * 0.14, -1.65, 0.09], [0.055, 0.037, 0.12], materials.bone);
  }
  sphere(body, [0, -0.125, 0.14], [0.025, 0.03, 0.017], materials.dark);
  bone(body, [-0.08, -0.165, 0.143], [0.08, -0.165, 0.143], 0.015, materials.dark);
  for (let tooth = 0; tooth < 8; tooth++) sphere(body, [-0.072 + tooth * 0.02, -0.169, 0.156], [0.008, 0.018, 0.009], materials.bone);
  for (let i = 0; i < 10; i++) sphere(body, [0, -0.25 - i * 0.054, -0.015], [0.035, 0.023, 0.036], materials.bone);
  bone(body, [0, -0.34, 0.14], [0, -0.66, 0.14], 0.016, materials.bone);
  mergeDecoration(pivot);
  return { pivot, yaw };
}

function web(parent, x, y, z, yaw, size, material) {
  const points = [];
  const sample = (angle, radius) => new THREE.Vector3(Math.sin(angle) * radius, -Math.cos(angle) * radius, Math.sin(angle * 2) * radius * 0.045);
  const rays = 11;
  for (let i = 0; i <= rays; i++) {
    const angle = i / rays * Math.PI / 2;
    points.push(new THREE.Vector3(), sample(angle, size * (0.92 + Math.sin(i * 3.4) * 0.08)));
  }
  for (let ring = 1; ring <= 10; ring++) for (let spoke = 0; spoke < rays; spoke++) {
    let last = sample(spoke / rays * Math.PI / 2, size * ring / 10);
    for (let segment = 1; segment <= 4; segment++) {
      const t = segment / 4;
      const next = sample((spoke + t) / rays * Math.PI / 2, size * ring / 10 * (1 - Math.sin(t * Math.PI) * 0.035));
      points.push(last, next); last = next;
    }
  }
  const strands = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), material);
  strands.position.set(x, y, z); strands.rotation.y = yaw; parent.add(strands);
}

function spider(parent, x, y, z, scale, yaw, materials, hanging = false) {
  const group = new THREE.Group(); group.position.set(x, y, z); group.rotation.y = yaw; group.scale.setScalar(scale); parent.add(group);
  sphere(group, [0, 0, 0], [0.1, 0.07, 0.15], materials.spider);
  sphere(group, [0, -0.008, 0.16], [0.07, 0.052, 0.076], materials.spider);
  for (const side of [-1, 1]) {
    for (let leg = 0; leg < 4; leg++) {
      const zz = 0.12 - leg * 0.075;
      tube(group, [[side * 0.05, 0, zz], [side * (0.19 + (leg % 2) * 0.025), 0.07, zz + (1.5 - leg) * 0.065], [side * 0.3, -0.065, zz + (1.5 - leg) * 0.13]], 0.011, materials.spider);
    }
    sphere(group, [side * 0.026, 0.01, 0.226], [0.012, 0.013, 0.009], materials.eye);
  }
  mergeDecoration(group);
  if (!hanging) { group.rotation.x = Math.PI / 3; return null; }
  const positions = new Float32Array([x, 4.65, z, x, y, z]);
  const threadGeometry = new THREE.BufferGeometry(); threadGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const thread = new THREE.Line(threadGeometry, materials.web); parent.add(thread);
  return { group, y, x, z, positions, threadGeometry };
}

export function buildStoreAtmosphere(root, flickeringLights) {
  const materials = {
    bone: new THREE.MeshStandardMaterial({ color: 0xc8bd99, roughness: 0.84 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x211c20, roughness: 0.95 }),
    silk: new THREE.MeshStandardMaterial({ color: 0x77716b, roughness: 0.9 }),
    spider: new THREE.MeshStandardMaterial({ color: 0x201921, roughness: 0.39, metalness: 0.18 }),
    eye: new THREE.MeshBasicMaterial({ color: 0x9b392b }),
    web: new THREE.LineBasicMaterial({ color: 0xc8c2cd, transparent: true, opacity: 0.44, depthWrite: false })
  };
  const skeletons = [
    skeleton(root, -9.65, 4.8, Math.PI * 0.35, 1, materials),
    skeleton(root, 9.65, 5.1, -Math.PI * 0.4, 1.07, materials),
    skeleton(root, -6.3, -12.8, 0.2, 1.08, materials)
  ];
  for (const [x, y, z, yaw, size] of [
    [-10.7, 4.63, 10.4, Math.PI / 2, 2.5], [-10.7, 4.63, 3, Math.PI / 2, 2.2],
    [10.7, 4.63, 1.5, -Math.PI / 2, 2.7], [10.7, 4.63, -8, -Math.PI / 2, 2.1],
    [-10.6, 4.63, -13.68, 0, 3.4], [7.2, 4.63, -13.68, 0, 3.3],
    [-4.9, 4.62, 1.58, 0, 1.1], [2.4, 4.62, 1.58, 0, 1.15]
  ]) web(root, x, y, z, yaw, size, materials.web);
  const spiders = [
    spider(root, -8.7, 3.35, 8, 1.05, 0.9, materials, true),
    spider(root, 7.2, 3.55, 0.3, 0.95, -0.7, materials, true),
    spider(root, -4.4, 3.8, 1.6, 0.7, 0.2, materials, true)
  ];
  spider(root, -8.9, 3.6, -13.55, 0.7, 0, materials);
  spider(root, 9.3, 3.3, -13.55, 0.85, -0.5, materials);

  const rhythms = [
    { period: 4.8, phase: 0.2, dips: [[0.2, 0.16, 0.82], [0.58, 0.12, 0.92], [0.87, 0.22, 0.72]] },
    { period: 7.1, phase: 2.4, dips: [[0.1, 0.5, 0.62], [1.05, 0.13, 0.88], [1.42, 0.1, 0.74]] },
    { period: 5.3, phase: 1.1, dips: [[0.3, 0.1, 0.85], [0.53, 0.1, 0.9], [0.76, 0.1, 0.8], [1.1, 0.3, 0.65]] },
    { period: 8.4, phase: 3.6, dips: [[0.15, 0.72, 0.5], [1.5, 0.19, 0.9], [2.04, 0.14, 0.68]] },
    { period: 6.2, phase: 4.4, dips: [[0.08, 0.18, 0.94], [0.42, 0.32, 0.68], [1.03, 0.11, 0.8]] },
    { period: 9.3, phase: 5.9, dips: [[0.12, 0.55, 0.6], [0.92, 0.1, 0.94], [1.18, 0.12, 0.9], [1.61, 0.25, 0.72]] }
  ];

  return {
    update(time, reducedMotion) {
      skeletons.forEach(({ pivot, yaw }, index) => {
        pivot.rotation.z = reducedMotion ? 0 : Math.sin(time * 0.65 + index * 2.2) * 0.036;
        pivot.rotation.y = yaw + (reducedMotion ? 0 : Math.sin(time * 0.43 + index) * 0.075);
      });
      spiders.forEach(({ group, y, x, z, positions, threadGeometry }, index) => {
        group.position.y = y + (reducedMotion ? 0 : Math.sin(time * 0.48 + index * 2) * 0.21);
        group.position.x = x + (reducedMotion ? 0 : Math.sin(time * 0.72 + index) * 0.045);
        positions.set([group.position.x, group.position.y, z], 3);
        threadGeometry.attributes.position.needsUpdate = true;
      });
      flickeringLights.forEach(({ material, light, color, pattern }, index) => {
        const rhythm = rhythms[(pattern ?? index) % rhythms.length];
        const cycle = (time + rhythm.phase) % rhythm.period;
        let level = 1;
        if (!reducedMotion) for (const [start, duration, depth] of rhythm.dips) {
          const fade = Math.min(1, (cycle - start) / 0.035, (start + duration - cycle) / 0.035);
          if (fade > 0) level = Math.min(level, 1 - depth * fade);
        }
        material.color.copy(color).multiplyScalar(level);
        light.intensity = 32 * level;
      });
    }
  };
}