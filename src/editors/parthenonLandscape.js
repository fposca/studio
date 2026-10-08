import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

function random(seed) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = THREE.MathUtils.smoothstep(x - ix, 0, 1);
  const fz = THREE.MathUtils.smoothstep(z - iz, 0, 1);
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(random(ix + iz * 157), random(ix + 1 + iz * 157), fx),
    THREE.MathUtils.lerp(random(ix + (iz + 1) * 157), random(ix + 1 + (iz + 1) * 157), fx), fz);
}

export function parthenonTerrainHeight(x, z) {
  const distance = Math.hypot(x, (z + 16) * 0.82);
  const beyondTerrace = THREE.MathUtils.smoothstep(distance, 32, 64);
  const foothills = THREE.MathUtils.smoothstep(distance, 65, 155);
  const hills = noise(x * 0.019, z * 0.019) * 27 + noise(x * 0.052, z * 0.052) * 8;
  return -0.15 + beyondTerrace * (-5 + foothills * hills)
    + beyondTerrace * noise(x * 0.22, z * 0.22) * 0.85;
}

export function createParthenonTerrain(material) {
  const geometry = new THREE.PlaneGeometry(740, 740, 220, 220);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const colors = [];
  const color = new THREE.Color();
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index), z = positions.getZ(index);
    positions.setY(index, parthenonTerrainHeight(x, z));
    uv.setXY(index, x / 6, z / 6);
    const distance = Math.hypot(x, z + 16);
    const vegetation = THREE.MathUtils.smoothstep(distance, 45, 90) * noise(x * 0.05 + 17, z * 0.05);
    color.set("#b5aea0").lerp(new THREE.Color("#636b52"), vegetation * 0.8);
    color.multiplyScalar(0.82 + noise(x * 0.11, z * 0.11) * 0.25);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const ground = new THREE.Mesh(geometry, material);
  ground.name = "Roca caliza y colinas del Atica";
  ground.receiveShadow = true;
  return ground;
}

function branchGeometry(start, end, radius, tipRadius) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const geometry = new THREE.CylinderGeometry(tipRadius, radius, direction.length(), 9, 3);
  const matrix = new THREE.Matrix4().compose(
    start.clone().add(end).multiplyScalar(0.5),
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()),
    new THREE.Vector3(1, 1, 1));
  geometry.applyMatrix4(matrix);
  return geometry;
}

function oliveSprigGeometry() {
  const parts = [];
  for (let leaf = 0; leaf < 14; leaf += 1) {
    const side = leaf % 2 ? 1 : -1;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute([
      0, 0, 0, -0.048, 0.115, 0, 0, 0.125, 0.018, 0.048, 0.115, 0, 0, 0.26, 0
    ], 3));
    geometry.setIndex([0, 1, 2, 0, 2, 3, 1, 4, 2, 2, 4, 3]);
    geometry.rotateZ(side * 0.9);
    geometry.rotateY(leaf * 0.91);
    geometry.translate(side * 0.025, (leaf >> 1) * 0.085, 0);
    geometry.computeVertexNormals();
    parts.push(geometry);
  }
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  return merged;
}

export function addParthenonOlives(parent, barkMaterial) {
  const sprig = oliveSprigGeometry();
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0xa4b19a, roughness: 0.94, side: THREE.DoubleSide });
  const positions = [[-18, -10], [19, -18], [-24, -29], [25, -40], [-38, -56], [37, -61], [-47, -75], [52, -89]];
  positions.forEach(([x, z], treeIndex) => {
    const tree = new THREE.Group();
    tree.name = "Olivo de hojas plateadas";
    tree.position.set(x, parthenonTerrainHeight(x, z), z);
    tree.scale.setScalar(0.9 + random(treeIndex + 73) * 0.45);
    const branches = [];
    const crowns = [];
    const root = new THREE.Vector3(0, 0, 0);
    const fork = new THREE.Vector3(0.12, 2.2, -0.16);
    branches.push(branchGeometry(root, fork, 0.32, 0.21));
    for (let limb = 0; limb < 7; limb += 1) {
      const angle = limb * 2.4 + treeIndex;
      const end = new THREE.Vector3(Math.cos(angle) * (1.35 + random(limb + 13) * 0.8),
        3.5 + random(limb * 7) * 1.5, Math.sin(angle) * 1.6);
      branches.push(branchGeometry(fork, end, 0.14, 0.045));
      crowns.push(end);
      for (let twig = 0; twig < 4; twig += 1) {
        const tip = end.clone().add(new THREE.Vector3(Math.cos(twig * 2.4) * 0.75, 0.55, Math.sin(twig * 2.4) * 0.75));
        branches.push(branchGeometry(end, tip, 0.045, 0.011));
      }
    }
    const trunk = new THREE.Mesh(mergeGeometries(branches), barkMaterial);
    branches.forEach((part) => part.dispose());
    trunk.name = "Tronco y ramificacion del olivo";
    trunk.castShadow = trunk.receiveShadow = true;
    tree.add(trunk);
    const leaves = new THREE.InstancedMesh(sprig, leafMaterial, 980);
    leaves.name = "Hojas de olivo";
    const dummy = new THREE.Object3D();
    for (let index = 0; index < leaves.count; index += 1) {
      const seed = index + treeIndex * 1039;
      const angle = random(seed * 3 + 1) * Math.PI * 2;
      const latitude = random(seed * 3 + 2) * 2 - 1;
      const radius = Math.cbrt(random(seed * 3 + 3));
      const horizontal = Math.sqrt(1 - latitude * latitude);
      dummy.position.copy(crowns[index % crowns.length]).add(new THREE.Vector3(
        Math.cos(angle) * horizontal * radius * 1.2, latitude * radius * 0.95,
        Math.sin(angle) * horizontal * radius * 1.1));
      dummy.rotation.set(random(seed + 2) * 2 - 1, angle, random(seed + 9) * 5);
      dummy.scale.setScalar(0.7 + random(seed + 43) * 0.6);
      dummy.updateMatrix();
      leaves.setMatrixAt(index, dummy.matrix);
      leaves.setColorAt(index, new THREE.Color().setHSL(0.23, 0.13 + random(seed + 4) * 0.11, 0.4 + random(seed + 7) * 0.28));
    }
    leaves.castShadow = leaves.receiveShadow = true;
    tree.add(leaves);
    parent.add(tree);
  });
}

export function addParthenonRocks(parent, material) {
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index), y = positions.getY(index), z = positions.getZ(index);
    const distortion = 0.85 + noise(x * 4 + y, z * 4) * 0.3;
    positions.setXYZ(index, x * distortion, y * distortion, z * distortion);
  }
  geometry.computeVertexNormals();
  const rocks = new THREE.InstancedMesh(geometry, material, 230);
  rocks.name = "Fragmentos de caliza en el terreno";
  const dummy = new THREE.Object3D();
  for (let index = 0; index < rocks.count; index += 1) {
    const side = index % 2 ? 1 : -1;
    const x = side * (17 + random(index * 4 + 1) * 44);
    const z = 18 - random(index * 4 + 2) * 110;
    const size = index % 11 === 0 ? 0.6 + random(index) * 1.5 : 0.08 + random(index * 5) * 0.3;
    dummy.position.set(x, parthenonTerrainHeight(x, z) + size * 0.09, z);
    dummy.rotation.set(random(index + 3), random(index + 8) * 6, random(index + 7));
    dummy.scale.set(size * 1.3, size * 0.55, size);
    dummy.updateMatrix();
    rocks.setMatrixAt(index, dummy.matrix);
    rocks.setColorAt(index, new THREE.Color().setScalar(0.67 + random(index) * 0.3));
  }
  rocks.castShadow = rocks.receiveShadow = true;
  parent.add(rocks);
}

export function createParthenonSky(mode) {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(470, 48, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      topColor: { value: new THREE.Color(mode.skyTop) }, horizonColor: { value: new THREE.Color(mode.skyHorizon) },
      sunDirection: { value: new THREE.Vector3(...mode.sun).normalize() }, night: { value: 0 }, time: { value: 0 }
    },
    vertexShader: `varying vec3 vDirection;
      void main() { vDirection = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform vec3 topColor, horizonColor, sunDirection;
      uniform float night, time;
      varying vec3 vDirection;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1)), f.x), f.y);
      }
      float fbm(vec2 p) {
        float value = 0.0, weight = 0.5;
        for (int i = 0; i < 5; i++) { value += weight * noise(p); p = p * 2.03 + vec2(17, 9); weight *= 0.5; }
        return value;
      }
      void main() {
        vec3 d = normalize(vDirection);
        vec3 color = mix(horizonColor, topColor, smoothstep(-0.08, 0.72, d.y));
        float facing = max(dot(d, sunDirection), 0.0);
        color += mix(vec3(1.0, 0.67, 0.38), vec3(0.5, 0.64, 1.0), night) * pow(facing, 64.0) * 0.15;
        color += mix(vec3(1.0, 0.91, 0.72), vec3(0.68, 0.79, 1.0), night) * smoothstep(0.99972, 0.99985, facing) * 1.2;
        vec2 cloudUv = d.xz / max(d.y + 0.18, 0.05) * 2.4 + vec2(time * 0.004, 0.0);
        float clouds = smoothstep(0.52, 0.76, fbm(cloudUv)) * smoothstep(-0.01, 0.22, d.y);
        vec3 cloudColor = mix(horizonColor * 0.92 + vec3(0.2), vec3(0.055, 0.065, 0.1), night);
        color = mix(color, cloudColor, clouds * 0.88);
        vec2 starUv = vec2(atan(d.z, d.x) * 130.0, asin(d.y) * 180.0);
        float star = step(0.995, hash(floor(starUv))) * (1.0 - smoothstep(0.035, 0.13, length(fract(starUv) - 0.5)));
        color += vec3(0.74, 0.82, 1.0) * star * night * smoothstep(0.0, 0.3, d.y) * (1.0 - clouds);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  }));
  sky.name = "Atmosfera del Atica";
  sky.renderOrder = -4;
  return sky;
}
