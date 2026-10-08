import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const COLUMNS = 96;
const ROWS = 128;
const FOLD = 10 / ROWS;
const QUILT_COLUMNS = 6;
const QUILT_ROWS = 8;

function bend(distance, radius) {
  const angle = Math.min(Math.max(distance, 0) / radius, Math.PI / 2);
  return {
    angle,
    horizontal: radius * Math.sin(angle),
    drop: radius * (1 - Math.cos(angle)) + Math.max(0, distance - radius * Math.PI / 2)
  };
}

function duvetPoint(u, v) {
  const flatX = (u - 0.5) * 3.24;
  const flatZ = -1.42 + v * 4.32;
  const side = Math.sign(flatX);
  const sideBend = bend(Math.abs(flatX) - 1.19, 0.14);
  const footBend = bend(flatZ - 2.12, 0.19);
  const normal = new THREE.Vector3(side * Math.sin(sideBend.angle),
    Math.cos(sideBend.angle) * Math.cos(footBend.angle), Math.sin(footBend.angle)).normalize();
  const sideWeight = THREE.MathUtils.smoothstep(Math.abs(flatX), 0.85, 1.55);
  const footWeight = THREE.MathUtils.smoothstep(flatZ, 1.6, 2.75);
  let x = side * (Math.min(Math.abs(flatX), 1.19) + sideBend.horizontal);
  let z = Math.min(flatZ, 2.12) + footBend.horizontal;
  // The corners fan outward instead of collapsing two hanging edges onto one line.
  x += side * (0.065 * footWeight * sideWeight + 0.022 * Math.sin(flatZ * 10 + 0.7) * sideWeight);
  z += footWeight * (0.065 * sideWeight + 0.032 * Math.sin(flatX * 10 + 1.1));
  const cellU = Math.sin(u * QUILT_COLUMNS * Math.PI);
  const cellV = Math.sin(v * QUILT_ROWS * Math.PI);
  const loft = 0.018 + 0.042 * cellU * cellU * cellV * cellV;
  const wrinkles = (0.009 * Math.sin(flatX * 8 + flatZ * 4) + 0.007 * Math.sin(flatZ * 17 - flatX * 5))
    * (0.3 + 0.7 * Math.max(sideWeight, footWeight));
  const foldedLip = v < FOLD ? 0.075 * Math.sin(v / FOLD * Math.PI) ** 2 : 0;
  const y = 1.09 - Math.hypot(sideBend.drop, footBend.drop) + foldedLip * normal.y;
  return new THREE.Vector3(x, y, z).addScaledVector(normal, loft + wrinkles);
}

function duvetNormal(u, v) {
  const du = duvetPoint(Math.min(1, u + 0.0001), v).sub(duvetPoint(Math.max(0, u - 0.0001), v));
  const dv = duvetPoint(u, Math.min(1, v + 0.0001)).sub(duvetPoint(u, Math.max(0, v - 0.0001)));
  return dv.cross(du).normalize();
}

function duvetGeometry() {
  const count = (COLUMNS + 1) * (ROWS + 1);
  const positions = new Float32Array(count * 6);
  const uvs = new Float32Array(count * 4);
  const index = [];
  for (let row = 0; row <= ROWS; row += 1) {
    for (let col = 0; col <= COLUMNS; col += 1) {
      const u = col / COLUMNS, v = row / ROWS, i = row * (COLUMNS + 1) + col;
      const point = duvetPoint(u, v);
      point.toArray(positions, i * 3);
      point.addScaledVector(duvetNormal(u, v), -0.048).toArray(positions, (i + count) * 3);
      uvs.set([u, 1 - v], i * 2);
      uvs.set([u, 1 - v], (i + count) * 2);
    }
  }
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLUMNS; col += 1) {
      const a = row * (COLUMNS + 1) + col, b = a + 1, c = a + COLUMNS + 1, d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  const topCount = index.length;
  for (let i = 0; i < topCount; i += 3) index.push(index[i] + count, index[i + 2] + count, index[i + 1] + count);
  const rim = [];
  for (let col = 0; col <= COLUMNS; col += 1) rim.push(col);
  for (let row = 1; row <= ROWS; row += 1) rim.push(row * (COLUMNS + 1) + COLUMNS);
  for (let col = COLUMNS - 1; col >= 0; col -= 1) rim.push(ROWS * (COLUMNS + 1) + col);
  for (let row = ROWS - 1; row > 0; row -= 1) rim.push(row * (COLUMNS + 1));
  for (let i = 0; i < rim.length; i += 1) {
    const a = rim[i], b = rim[(i + 1) % rim.length];
    index.push(a, b, a + count, b, b + count, a + count);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(index);
  const foldedCount = Math.round(FOLD * ROWS) * COLUMNS * 6;
  geometry.addGroup(0, foldedCount, 1);
  geometry.addGroup(foldedCount, topCount - foldedCount, 0);
  geometry.addGroup(topCount, topCount, 1);
  geometry.addGroup(topCount * 2, index.length - topCount * 2, 2);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function roundedOutline(width, depth, radius, y) {
  const points = [];
  for (let corner = 0; corner < 4; corner += 1) {
    const start = corner * Math.PI / 2;
    const sx = corner === 0 || corner === 3 ? 1 : -1;
    const sz = corner < 2 ? 1 : -1;
    for (let i = 0; i <= 16; i += 1) {
      const angle = start + i / 16 * Math.PI / 2;
      points.push(new THREE.Vector3(sx * (width / 2 - radius) + radius * Math.cos(angle), y,
        sz * (depth / 2 - radius) + radius * Math.sin(angle)));
    }
  }
  return points;
}

export function createRetroGamerBedding({ printMap, clothMap }) {
  const bedding = new THREE.Group();
  bedding.name = "Ropa de cama Monkey Island";
  const weave = clothMap.clone();
  weave.colorSpace = THREE.NoColorSpace;
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
  weave.repeat.set(6, 8);
  const artwork = printMap.clone();
  artwork.colorSpace = THREE.SRGBColorSpace;
  artwork.wrapS = artwork.wrapT = THREE.ClampToEdgeWrapping;
  artwork.anisotropy = 16;
  const cotton = (color) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.94, bumpMap: weave,
    bumpScale: 0.0025, sheen: 0.35, sheenColor: new THREE.Color(0xd8ded8), sheenRoughness: 0.9 });
  const printedCotton = cotton(0xf8f5ef);
  printedCotton.map = artwork;
  const underside = cotton(0x77918d);
  const binding = cotton(0x405d63);
  const linen = cotton(0xe6dfce);
  const seamMaterial = cotton(0xb8b2a1);
  const addMesh = (name, geometry, material, parent = bedding) => {
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.castShadow = object.receiveShadow = true;
    parent.add(object);
    return object;
  };
  const cord = (name, points, material, radius, closed = false, parent = bedding) => {
    const curve = new THREE.CatmullRomCurve3(points, closed, "centripetal");
    return addMesh(name, new THREE.TubeGeometry(curve, Math.max(64, points.length * 2), radius, 5, closed), material, parent);
  };
  const mattress = addMesh("Colchon tapizado", new RoundedBoxGeometry(2.54, 0.35, 4.18, 4, 0.1), linen);
  mattress.position.y = 0.85;
  for (const y of [0.715, 0.985]) cord("Ribete del colchon", roundedOutline(2.53, 4.17, 0.13, y), seamMaterial, 0.007, true);

  addMesh("Acolchado Monkey Island", duvetGeometry(), [printedCotton, underside, binding]);
  const perimeter = [];
  for (let i = 0; i < 64; i += 1) perimeter.push(duvetPoint(i / 64, 0));
  for (let i = 0; i < 96; i += 1) perimeter.push(duvetPoint(1, i / 96));
  for (let i = 0; i < 64; i += 1) perimeter.push(duvetPoint(1 - i / 64, 1));
  for (let i = 0; i < 96; i += 1) perimeter.push(duvetPoint(0, 1 - i / 96));
  cord("Ribete del acolchado", perimeter, binding, 0.009, true);
  cord("Dobladillo vuelto del acolchado", Array.from({ length: 97 }, (_, i) => duvetPoint(i / 96, FOLD)), binding, 0.006);

  const stitches = [];
  const stitchLine = (pointAt) => {
    for (let i = 0; i < 240; i += 2) {
      for (const t of [i / 240, (i + 0.65) / 240]) {
        const [u, v] = pointAt(t);
        if (v < FOLD + 0.003) continue;
        const point = duvetPoint(u, v).addScaledVector(duvetNormal(u, v), 0.002);
        stitches.push(point.x, point.y, point.z);
      }
    }
  };
  for (let col = 1; col < QUILT_COLUMNS; col += 1) stitchLine((t) => [col / QUILT_COLUMNS, FOLD + (1 - FOLD) * t]);
  for (let row = 1; row < QUILT_ROWS; row += 1) stitchLine((t) => [t, row / QUILT_ROWS]);
  const stitchGeometry = new THREE.BufferGeometry();
  stitchGeometry.setAttribute("position", new THREE.Float32BufferAttribute(stitches, 3));
  const stitching = new THREE.LineSegments(stitchGeometry, new THREE.LineBasicMaterial({ color: 0x9ba9a5, transparent: true, opacity: 0.28, depthWrite: false }));
  stitching.name = "Puntadas del acolchado";
  bedding.add(stitching);

  const pillow = new THREE.Group();
  pillow.name = "Almohada de algodon";
  pillow.position.set(-0.025, 1.275, -1.65);
  pillow.rotation.y = -0.045;
  bedding.add(pillow);
  const pillowGeometry = new THREE.SphereGeometry(1, 64, 40);
  const pillowShape = (value, exponent, size) => Math.sign(value) * Math.abs(value) ** exponent * size;
  const pillowGather = (x, z) => 0.007 * Math.sin(z * 29 + x * 8) * (Math.abs(x) / 0.97) ** 8;
  const vertices = pillowGeometry.attributes.position;
  for (let i = 0; i < vertices.count; i += 1) {
    const x = pillowShape(vertices.getX(i), 0.43, 0.97);
    const z = pillowShape(vertices.getZ(i), 0.45, 0.435);
    const y = pillowShape(vertices.getY(i), 0.8, 0.215);
    vertices.setXYZ(i, x, y + pillowGather(x, z), z);
  }
  pillowGeometry.computeVertexNormals();
  addMesh("Funda de algodon", pillowGeometry, linen, pillow);
  const pillowSeam = Array.from({ length: 128 }, (_, i) => {
    const angle = i / 128 * Math.PI * 2;
    const x = pillowShape(Math.cos(angle), 0.43, 0.974);
    const z = pillowShape(Math.sin(angle), 0.45, 0.439);
    return new THREE.Vector3(x, pillowGather(x, z), z);
  });
  cord("Costura de la almohada", pillowSeam, seamMaterial, 0.005, true, pillow);
  return bedding;
}
