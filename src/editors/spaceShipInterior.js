import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const ARCH = [
  [-12.6, 0], [-12.35, 2.8], [-11.6, 5.8], [-9.7, 8.7], [-5.2, 10.4],
  [0, 10.8], [5.2, 10.4], [9.7, 8.7], [11.6, 5.8], [12.35, 2.8], [12.6, 0]
];
const RIB_DEPTHS = [-20.5, -14.4, -8.3, -2.2, 3.9, 10];

function organicShape(width, height) {
  const shape = new THREE.Shape();
  shape.moveTo(0, height / 2);
  shape.bezierCurveTo(width * 0.44, height * 0.5, width * 0.58, height * 0.27, width * 0.44, -height * 0.16);
  shape.bezierCurveTo(width * 0.32, -height * 0.43, width * 0.18, -height * 0.5, 0, -height / 2);
  shape.bezierCurveTo(-width * 0.18, -height * 0.5, -width * 0.32, -height * 0.43, -width * 0.44, -height * 0.16);
  shape.bezierCurveTo(-width * 0.58, height * 0.27, -width * 0.44, height * 0.5, 0, height / 2);
  return shape;
}

function vaultGeometry() {
  const curve = new THREE.CatmullRomCurve3(ARCH.map(([x, y]) => new THREE.Vector3(x, y, 0)));
  const points = curve.getPoints(80);
  const positions = [], uvs = [], indices = [];
  for (let column = 0; column < points.length; column++) {
    const point = points[column];
    positions.push(point.x, point.y, -21, point.x, point.y, 11);
    uvs.push(column / 8, 0, column / 8, 6);
    if (column < points.length - 1) {
      const a = column * 2;
      indices.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function buildSpaceShipSet(maps = {}, environment = null) {
  const group = new THREE.Group();
  group.name = "Space Ship";
  group.visible = false;
  group.userData.editorHelper = true;
  const materials = new Set(), geometries = new Set();
  const textures = new Set(Object.values(maps).filter(Boolean));
  const staticMeshes = [];
  const lights = [];
  const pulses = [];
  const material = (name, settings) => {
    const mat = new THREE.MeshStandardMaterial(settings);
    mat.name = name;
    materials.add(mat);
    return mat;
  };
  const metal = (name, color, roughness, metalness = 0.9) => material(name, {
    color, map: maps.alloy || null, bumpMap: maps.relief || null, bumpScale: 0.024,
    roughnessMap: maps.relief || null, roughness, metalness
  });
  const hull = metal("Titanio ennegrecido", 0x42474b, 0.85);
  const ribs = metal("Costillas de aleacion", 0x53595c, 0.42);
  const steel = metal("Acero pulido", 0x79818a, 0.32, 0.96);
  const dark = metal("Cavidades de grafito", 0x11171b, 0.8, 0.62);
  // An explicit shared PMREM lets the deck use less fill than the surrounding hull.
  const deck = material("Cubierta de metal gastado", {
    map: maps.brushed || null, bumpMap: maps.relief || null, bumpScale: 0.055,
    roughnessMap: maps.relief || null, roughness: 0.85,
    color: 0x34393e, metalness: 0.94, envMap: environment, envMapIntensity: 0.12
  });
  const rubber = material("Juntas negras", { color: 0x06090b, metalness: 0.22, roughness: 0.87 });
  const amber = [0, 1, 2].map((index) => {
    const mat = material("Luz ambar " + index, { color: 0x211409, emissive: 0xff9f42,
      emissiveIntensity: 2.1, toneMapped: false, roughness: 0.28 });
    pulses.push({ material: mat, phase: index * 1.7 });
    return mat;
  });
  const mesh = (name, geometry, mat, parent = group) => {
    const object = new THREE.Mesh(geometry, mat);
    object.name = name;
    object.receiveShadow = true;
    parent.add(object);
    staticMeshes.push(object);
    geometries.add(geometry);
    return object;
  };
  const box = (name, size, position, mat, parent = group, bevel = 0.04) => {
    const geometry = bevel ? new RoundedBoxGeometry(...size, 1, Math.min(bevel, Math.min(...size) * 0.38)) : new THREE.BoxGeometry(...size);
    const object = mesh(name, geometry, mat, parent);
    object.position.set(...position);
    return object;
  };
  const tube = (name, points, radius, mat, parent = group) => {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    return mesh(name, new THREE.TubeGeometry(curve, Math.min(112, Math.max(24, points.length * 8)), radius, 10, false), mat, parent);
  };
  const torus = (name, radius, thickness, position, mat) => {
    const object = mesh(name, new THREE.TorusGeometry(radius, thickness, 8, 80), mat);
    object.rotation.x = Math.PI / 2;
    object.position.set(...position);
    return object;
  };
  const shell = (width, height, position, parent, horizontal = false) => {
    const recess = new THREE.Group();
    recess.name = "Cavidad biomecanica";
    recess.position.set(...position);
    if (horizontal) recess.rotation.x = Math.PI / 2;
    parent.add(recess);
    mesh("Fondo de cavidad", new THREE.ShapeGeometry(organicShape(width, height), 16), dark, recess).position.z = -0.035;
    const frame = organicShape(width, height);
    frame.holes.push(organicShape(width - 0.36, height - 0.42));
    mesh("Borde organico del casco", new THREE.ExtrudeGeometry(frame, {
      depth: 0.14, bevelEnabled: true, bevelSize: 0.045, bevelThickness: 0.045, bevelSegments: 2, curveSegments: 16
    }), ribs, recess);
    for (const offset of [0.02, 0.15]) {
      const contour = organicShape(width - offset, height - offset).getPoints(44).map((p) => [p.x, p.y, 0.18 - offset * 0.5]);
      tube("Nervadura de borde", contour, offset === 0.02 ? 0.045 : 0.024, steel, recess);
    }
    for (let index = 0; index < 14; index++) {
      const y = (index / 13 - 0.5) * height * 0.78;
      const halfWidth = width * 0.40 * Math.sqrt(1 - (y / (height * 0.5)) ** 2);
      tube("Lama curva interior", [[-halfWidth, y, 0.06], [0, y - 0.08, -0.025], [halfWidth, y, 0.06]],
        0.041, index % 3 ? ribs : steel, recess);
    }
    return recess;
  };

  // The vault runs behind the side ribs; the camera-facing end remains completely open.
  mesh("Boveda continua de la nave", vaultGeometry(), hull);
  box("Base de cubierta", [27, 0.2, 32], [0, -0.15, -5], dark);
  const plateShape = new THREE.Shape();
  const w = 2.05, d = 1.385, r = 0.31;
  plateShape.moveTo(-w + r, -d);
  plateShape.lineTo(w - r, -d);
  plateShape.quadraticCurveTo(w, -d, w, -d + r);
  plateShape.lineTo(w, d - r);
  plateShape.quadraticCurveTo(w, d, w - r, d);
  plateShape.lineTo(-w + r, d);
  plateShape.quadraticCurveTo(-w, d, -w, d - r);
  plateShape.lineTo(-w, -d + r);
  plateShape.quadraticCurveTo(-w, -d, -w + r, -d);
  const plateGeometry = new THREE.ExtrudeGeometry(plateShape, { depth: 0.035, bevelEnabled: true,
    bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1, curveSegments: 6 });
  plateGeometry.rotateX(-Math.PI / 2);
  const platePosition = plateGeometry.attributes.position;
  const plateUv = plateGeometry.attributes.uv;
  for (let index = 0; index < platePosition.count; index++) plateUv.setXY(index, platePosition.getX(index) / (w * 2) + 0.5, platePosition.getZ(index) / (d * 2) + 0.5);
  const fasteners = [], grilles = [];
  for (let row = 0; row < 11; row++) {
    const z = -19.45 + row * 2.91;
    for (const x of [-10.65, -6.39, -2.13, 2.13, 6.39, 10.65]) {
      mesh("Placa de cubierta biselada", plateGeometry.clone(), deck).position.set(x, 0, z);
      for (const side of [-1, 1]) {
        box("Canal de junta", [0.055, 0.013, 2.3], [x + side * 1.86, 0.057, z], rubber, group, 0);
        for (const end of [-1, 1]) fasteners.push([x + side * 1.79, 0.057, z + end * 1.13]);
      }
    }
  }
  plateGeometry.dispose();
  for (const x of [-8.5, 0, 8.5]) {
    box("Canal de drenaje", [0.66, 0.02, 31.8], [x, 0.052, -5], rubber, group, 0);
    for (const side of [-1, 1]) box("Borde de drenaje", [0.04, 0.025, 31.8], [x + side * 0.34, 0.072, -5], steel, group, 0);
    for (let index = 0; index < 152; index++) grilles.push([x, 0.074, -20.75 + index * 0.208]);
  }
  const instanced = (name, geometry, mat, positions) => {
    geometries.add(geometry);
    const object = new THREE.InstancedMesh(geometry, mat, positions.length);
    object.name = name;
    const transform = new THREE.Matrix4();
    positions.forEach((position, index) => { transform.makeTranslation(...position); object.setMatrixAt(index, transform); });
    object.receiveShadow = true;
    group.add(object);
    return object;
  };
  instanced("Rejillas de cubierta", new THREE.BoxGeometry(0.57, 0.026, 0.05), steel, grilles);
  instanced("Pernos de cubierta", new THREE.CylinderGeometry(0.036, 0.036, 0.013, 8), steel, fasteners);
  const hatch = mesh("Escotilla circular de cubierta", new THREE.CylinderGeometry(3.2, 3.2, 0.042, 80), deck);
  hatch.position.set(0, 0.06, -7.1);
  for (const radius of [1.35, 2.65, 3.12]) {
    torus("Junta circular de escotilla", radius, 0.05, [0, 0.087, -7.1], rubber);
    torus("Aro mecanico de escotilla", radius + 0.075, 0.021, [0, 0.096, -7.1], steel);
  }
  for (let index = 0; index < 16; index++) {
    const angle = index / 16 * Math.PI * 2;
    const latch = box("Cierre radial de escotilla", [0.12, 0.022, 0.3], [Math.sin(angle) * 2.88, 0.095, -7.1 + Math.cos(angle) * 2.88], ribs, group, 0.016);
    latch.rotation.y = angle;
  }

  for (const [index, z] of RIB_DEPTHS.entries()) {
    const path = ARCH.map(([x, y]) => [x * 0.965, y * 0.968 + 0.08, z]);
    tube("Costilla principal de la boveda", path, 0.255, ribs);
    for (const offset of [-0.34, 0.34]) {
      tube("Filete pulido de costilla", path.map(([x, y]) => [x * 0.995, y - 0.015, z + offset]), 0.071, steel);
      tube("Conducto adosado", path.map(([x, y]) => [x * 1.014, y + 0.12, z + offset * 1.6]), 0.098, dark);
    }
    for (const side of [-1, 1]) {
      for (const offset of [-0.26, 0.26]) {
        tube("Raiz estructural curvada", [[side * 11.22, 0.06, z + offset * 3], [side * 11.82, 0.6, z + offset * 1.8],
          [side * 11.67, 2.7, z + offset], [side * 10.6, 5.7, z], [side * 8.9, 8.3, z + offset]], 0.20, ribs);
      }
      const fixture = new THREE.Group();
      fixture.position.set(side * 11.75, 1.07, z + 0.02);
      fixture.rotation.z = -side * 0.32;
      group.add(fixture);
      box("Cuna de luminaria", [0.38, 1.28, 0.48], [0, 0, 0], dark, fixture, 0.12);
      box("Luminaria ambar integrada", [0.094, 0.78, 0.08], [0, 0, 0.28], amber[index % amber.length], fixture, 0.03);
      tube("Armadura de luminaria", [[-0.14, -0.49, 0.3], [-0.23, 0, 0.3], [-0.14, 0.49, 0.3]], 0.027, steel, fixture);
      tube("Armadura de luminaria", [[0.14, -0.49, 0.3], [0.23, 0, 0.3], [0.14, 0.49, 0.3]], 0.027, steel, fixture);
      box("Luz alta de costilla", [0.06, 1.2, 0.065], [side * 11.06, 5.7, z + 0.30], amber[(index + 1) % 3]);
    }
  }
  for (let bay = 0; bay < RIB_DEPTHS.length - 1; bay++) {
    const z = (RIB_DEPTHS[bay] + RIB_DEPTHS[bay + 1]) / 2;
    for (const side of [-1, 1]) {
      const wall = new THREE.Group();
      wall.position.set(side * 11.95, 3.8, z);
      wall.rotation.y = -side * Math.PI / 2;
      wall.rotation.x = -0.08;
      group.add(wall);
      shell(5.1, 6.6, [0, 0, 0], wall);
      const ceiling = shell(6.4, 4.85, [side * 5.35, 9.94, z], group, true);
      ceiling.rotateY(-side * 0.24);
      for (let duct = 0; duct < 3; duct++) {
        tube("Tendones del mamparo", [[side * (11.4 - duct * 0.18), 0.2, z - 2.5],
          [side * (12.0 - duct * 0.18), 2.1, z - 2.7], [side * (11.4 - duct * 0.18), 5.7, z - 2.4],
          [side * (8.5 - duct * 0.18), 8.8, z - 2.3], [side * 4, 10.25, z - 2.2]], 0.042, duct % 2 ? steel : dark);
      }
    }
    box("Rebaje de luminaria cenital", [0.62, 0.17, 2.1], [0, 10.2, z], dark);
    box("Luminaria cenital ambar", [0.10, 0.055, 1.42], [0, 10.09, z], amber[bay % 3]);
  }
  for (const x of [-0.48, -0.23, 0.23, 0.48]) {
    tube("Espina longitudinal del techo", [[x, 10.38, 10.7], [x, 10.33, 0], [x, 10.28, -15], [x * 1.3, 9.5, -20.1]],
      Math.abs(x) > 0.3 ? 0.13 : 0.054, Math.abs(x) > 0.3 ? ribs : steel);
  }

  const backShape = new THREE.Shape();
  new THREE.CatmullRomCurve3(ARCH.map(([x, y]) => new THREE.Vector3(x, y, 0))).getPoints(80).forEach((point, index) => {
    if (index === 0) backShape.moveTo(point.x, point.y); else backShape.lineTo(point.x, point.y);
  });
  backShape.closePath();
  const back = mesh("Mamparo posterior cerrado", new THREE.ShapeGeometry(backShape), hull);
  back.position.z = -20.96;
  for (const side of [-1, 1]) {
    shell(4.1, 7.2, [side * 8.2, 4.25, -20.75], group);
    shell(3.5, 5.6, [side * 3.4, 4.8, -20.74], group);
    for (const offset of [0, 0.22]) {
      tube("Nervadura ramificada posterior", [[side * (1.8 + offset), 0.07, -20.26], [side * (3.4 + offset), 1.5, -20.22],
        [side * (5.6 + offset), 4.2, -20.23], [side * (6.1 + offset), 7.2, -20.27], [side * (9.5 + offset), 9.7, -20.3]],
        offset ? 0.045 : 0.17, offset ? steel : ribs);
    }
    tube("Espina del mamparo posterior", [[side * 0.48, 0.04, -20.25], [side * 1.08, 1.6, -20.06],
      [side * 0.74, 4.6, -20.12], [side * 1.4, 7.4, -20.1], [side * 5.0, 10.18, -20.2]], 0.29, ribs);
    tube("Borde de espina posterior", [[side * 0.20, 0.08, -19.98], [side * 0.72, 1.6, -19.84],
      [side * 0.4, 4.6, -19.90], [side * 1.08, 7.4, -19.88], [side * 4.9, 10.16, -19.95]], 0.05, steel);
    box("Baliza del mamparo posterior", [0.06, 1.4, 0.05], [side * 0.44, 5.6, -19.82], amber[1]);
  }

  // Area lights make the warm fixtures reflect on the metal instead of acting as flat neon stripes.
  for (const side of [-1, 1]) for (const z of [-12.5, 3.2]) {
    const light = new THREE.RectAreaLight(0xffb365, 7, 1.8, 3.8);
    light.name = "Luz rasante de mamparo";
    light.position.set(side * 11.0, 2.8, z);
    light.lookAt(0, 0.6, z - 1);
    group.add(light);
    lights.push({ light, intensity: 7, phase: z * 0.2 });
  }
  const overhead = new THREE.RectAreaLight(0xd5deeb, 3.2, 1.2, 24);
  overhead.name = "Reflejo cenital frio";
  overhead.position.set(0, 9.8, -5);
  overhead.rotation.x = -Math.PI / 2;
  group.add(overhead);
  lights.push({ light: overhead, intensity: 3.2, phase: 0 });
  for (const [position, intensity, color] of [[[0, 5.6, 7.5], 46, 0xc7d7e9], [[0, 5.7, -17.4], 30, 0xa4bad0]]) {
    const light = new THREE.PointLight(color, intensity, 30, 2);
    light.position.set(...position);
    group.add(light);
    lights.push({ light, intensity, phase: 1.2 });
  }

  group.updateMatrixWorld(true);
  const batches = new Map();
  for (const object of staticMeshes) {
    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);
    const batch = batches.get(object.material) || [];
    batch.push(geometry);
    batches.set(object.material, batch);
    object.removeFromParent();
    object.geometry.dispose();
    geometries.delete(object.geometry);
  }
  for (const [mat, parts] of batches) {
    const geometry = mergeGeometries(parts, false);
    parts.forEach((part) => part.dispose());
    if (!geometry) throw new Error("No se pudo construir el casco biomecanico");
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, mat);
    object.name = "Nave / " + mat.name;
    object.receiveShadow = true;
    group.add(object);
  }
  const shadowMaterial = new THREE.ShadowMaterial({ color: 0x010407, opacity: 0.68, transparent: true, depthWrite: false });
  const shadowGeometry = new THREE.PlaneGeometry(27, 32);
  const shadowCatcher = new THREE.Mesh(shadowGeometry, shadowMaterial);
  shadowCatcher.name = "Sombras sobre cubierta";
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.set(0, 0.115, -5);
  shadowCatcher.receiveShadow = true;
  shadowCatcher.renderOrder = 3;
  group.add(shadowCatcher);
  materials.add(shadowMaterial);
  geometries.add(shadowGeometry);
  let disposed = false;
  group.userData.animate = (time, active) => {
    group.visible = Boolean(active && !disposed);
    if (!group.visible) return;
    const seconds = time * 0.001;
    pulses.forEach(({ material: mat, phase }) => { mat.emissiveIntensity = 2.0 + Math.sin(seconds * Math.PI / 5 + phase) * 0.10; });
    lights.forEach(({ light, intensity, phase }) => { light.intensity = intensity * (0.97 + Math.sin(seconds * Math.PI / 5 + phase) * 0.03); });
  };
  group.userData.dispose = () => {
    if (disposed) return;
    disposed = true;
    group.visible = false;
    group.traverse((object) => { if (object.isInstancedMesh) object.dispose(); });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((mat) => mat.dispose());
    textures.forEach((map) => map.dispose());
    lights.forEach(({ light }) => light.dispose());
  };
  return group;
}
