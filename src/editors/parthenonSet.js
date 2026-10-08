import * as THREE from "three";
import { addParthenonOlives, addParthenonRocks, createParthenonSky, createParthenonTerrain } from "./parthenonLandscape.js";

const marbleUrl = new URL("../assets/environments/parthenon-weathered-stone-v2.png", import.meta.url).href;
const dirtUrl = new URL("../assets/environments/parthenon-limestone-ground-v1.png", import.meta.url).href;
const barkUrl = new URL("../assets/environments/cemetery-bark-v1.png", import.meta.url).href;
const reliefUrl = new URL("../assets/environments/parthenon-pediment-relief-v1.png", import.meta.url).href;

export const PARTHENON_PERIODS = Object.freeze([
  { id: "day", name: "Dia", skyTop: "#326696", skyHorizon: "#b7c7ce", ambient: 0.38, key: 3.2, environment: 0.22, color: "#fff1d9", skyLight: "#bed5ef", ground: "#8d8674", torches: 0, sun: [-0.62, 0.72, 0.48] },
  { id: "sunset", name: "Atardecer", skyTop: "#344666", skyHorizon: "#c79b84", ambient: 0.24, key: 2.8, environment: 0.15, color: "#ffba7c", skyLight: "#a3b1d7", ground: "#77655c", torches: 0.5, sun: [-0.82, 0.24, 0.38] },
  { id: "night", name: "Noche", skyTop: "#071020", skyHorizon: "#243146", ambient: 0.16, key: 0.85, environment: 0.1, color: "#a6c4ef", skyLight: "#718aaa", ground: "#333b43", torches: 1, sun: [0.45, 0.65, -0.42] }
]);

export const DEFAULT_PARTHENON_LIGHTING = Object.freeze({ period: "day" });

export function normalizeParthenonLighting(value = {}) {
  return { period: PARTHENON_PERIODS.some((mode) => mode.id === value?.period) ? value.period : "day" };
}

export function createFlutedDoricShaftGeometry() {
  const geometry = new THREE.CylinderGeometry(0.48, 0.57, 5.25, 160, 18);
  const positions = geometry.attributes.position;
  const colors = [];
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const theta = Math.atan2(z, x);
    const flute = 1 - 0.095 * (0.5 + 0.5 * Math.cos(theta * 20));
    const entasis = 1 + 0.012 * Math.sin(Math.PI * (y / 5.25 + 0.5));
    positions.setX(index, x * flute * entasis);
    positions.setZ(index, z * flute * entasis);
    const basePatina = 0.73 + 0.27 * THREE.MathUtils.smoothstep(y, -2.62, -1.9);
    const grooveShade = 0.89 + 0.11 * (1 - Math.cos(theta * 20)) * 0.5;
    colors.push(basePatina * grooveShade, basePatina * grooveShade, basePatina * grooveShade * 0.97);
    geometry.attributes.uv.setXY(index, geometry.attributes.uv.getX(index) * 2.1, geometry.attributes.uv.getY(index) * 3.3);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export function parthenonColumnPositions() {
  const columns = [];
  for (let index = 0; index < 8; index += 1) {
    const x = -8.75 + index * 2.5;
    columns.push([x, -8.1], [x, -39.1]);
  }
  for (let index = 1; index < 16; index += 1) {
    const z = -8.1 - index * (31 / 16);
    columns.push([-8.75, z], [8.75, z]);
  }
  return columns;
}

function addMesh(parent, name, geometry, material, x, y, z, castShadow = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addBox(parent, name, material, size, position) {
  const geometry = new THREE.BoxGeometry(...size);
  const p = geometry.attributes.position, n = geometry.attributes.normal, uv = geometry.attributes.uv;
  // Meter-scale UVs keep long beams and the sides of steps from stretching the stone.
  for (let i = 0; i < p.count; i += 1) {
    uv.setXY(i, (Math.abs(n.getX(i)) > 0.5 ? p.getZ(i) : p.getX(i)) / 2.4,
      (Math.abs(n.getY(i)) > 0.5 ? p.getZ(i) : p.getY(i)) / 2.4);
  }
  return addMesh(parent, name, geometry, material, ...position);
}

export function createWeatheredSlabGeometry(width, depth, seed = 0) {
  const shape = new THREE.Shape();
  const cut = 0.04 + (seed % 4) * 0.015;
  shape.moveTo(-width / 2 + cut, -depth / 2);
  shape.lineTo(width / 2 - cut * 1.6, -depth / 2);
  shape.lineTo(width / 2, -depth / 2 + cut);
  shape.lineTo(width / 2 - 0.012, depth / 2 - cut * 1.8);
  shape.lineTo(width / 2 - cut, depth / 2);
  shape.lineTo(-width / 2 + cut * 1.5, depth / 2 - 0.009);
  shape.lineTo(-width / 2, depth / 2 - cut);
  shape.lineTo(-width / 2, -depth / 2 + cut);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.09, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.021, bevelSegments: 2, steps: 1
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -0.11, 0);
  const p = geometry.attributes.position, uv = geometry.attributes.uv;
  for (let i = 0; i < p.count; i += 1) uv.setXY(i, p.getX(i) / 1.7 + seed * 0.173, p.getZ(i) / 1.7 + seed * 0.219);
  return geometry;
}

function texturedMap(url, repeatX = 1, repeatY = 1) {
  const map = new THREE.TextureLoader().load(url);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);
  map.anisotropy = 16;
  return map;
}

function addInstanced(parent, name, geometry, material, positions, positionAt, colorAt) {
  const mesh = new THREE.InstancedMesh(geometry, material, positions.length);
  const dummy = new THREE.Object3D();
  positions.forEach((position, index) => {
    positionAt(dummy, position, index);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    if (colorAt) mesh.setColorAt(index, colorAt(index));
  });
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
  return mesh;
}

function pedimentGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-10.1, 0);
  shape.lineTo(10.1, 0);
  shape.lineTo(0, 2.25);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: false });
}

function addSlopingBeam(parent, material, start, end, z) {
  const dx = end[0] - start[0], dy = end[1] - start[1];
  const beam = addBox(parent, "Cornisa inclinada", material,
    [Math.hypot(dx, dy), 0.28, 1.05], [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, z]);
  beam.rotation.z = Math.atan2(dy, dx);
}

function createPedimentReliefGeometry() {
  const geometry = new THREE.PlaneGeometry(19.7, 2.13, 120, 32);
  const p = geometry.attributes.position, uv = geometry.attributes.uv;
  for (let i = 0; i < p.count; i += 1) {
    const height = (p.getY(i) + 1.065) / 2.13;
    const x = p.getX(i) * (1 - height);
    p.setX(i, x);
    uv.setXY(i, x / 19.7 + 0.5, 0.013 + height * 0.525);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createBrazierFlameMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float time; varying vec2 vUv;
      void main() {
        float y = vUv.y;
        float x = vUv.x * 2.0 - 1.0 + sin(y * 15.0 - time * 6.0) * y * 0.17;
        float width = (1.0 - y) * (0.58 + sin(y * 22.0 - time * 9.0) * 0.09);
        float flame = (1.0 - smoothstep(width * 0.24, width, abs(x))) * smoothstep(0.0, 0.1, y) * (1.0 - smoothstep(0.65, 1.0, y));
        vec3 color = mix(vec3(1.0, 0.18, 0.015), vec3(1.0, 0.8, 0.26), flame * (1.0 - y));
        gl_FragColor = vec4(color, flame * 0.87);
        #include <colorspace_fragment>
      }`
  });
}


function disposeSet(root) {
  const geometries = new Set(), materials = new Set(), maps = new Set();
  root.traverse((object) => {
    if (object.isLight) object.dispose();
    if (object.geometry) geometries.add(object.geometry);
    for (const material of [object.material].flat().filter(Boolean)) {
      materials.add(material);
      Object.values(material).forEach((value) => { if (value?.isTexture) maps.add(value); });
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  maps.forEach((map) => map.dispose());
}

export function createParthenonSet() {
  const set = new THREE.Group();
  set.name = "Partenon - exterior";
  set.userData.editorHelper = true;
  set.visible = false;
  let built = false, disposed = false, currentPeriod = "";
  let sky, sunLight;
  set.userData.atmosphere = new THREE.Fog(PARTHENON_PERIODS[0].skyHorizon, 70, 280);
  const flames = [], torchLights = [];

  function build() {
    if (built) return;
    built = true;
    const marble = texturedMap(marbleUrl);
    const roofMap = texturedMap(marbleUrl, 5, 15);
    const dirt = texturedMap(dirtUrl);
    const stone = new THREE.MeshStandardMaterial({ map: marble, color: 0xcac5b9, roughness: 0.89, bumpMap: marble, bumpScale: 0.065 });
    const shaftStone = stone.clone();
    shaftStone.vertexColors = true;
    const carved = new THREE.MeshStandardMaterial({ map: marble, color: 0xcec8ba, roughness: 0.86, bumpMap: marble, bumpScale: 0.045 });
    const broadStone = new THREE.MeshStandardMaterial({ map: marble, color: 0xbdb6a6, roughness: 0.92, bumpMap: marble, bumpScale: 0.06 });
    const paving = new THREE.MeshStandardMaterial({ map: marble, color: 0xb2ad9f, roughness: 0.95, bumpMap: marble, bumpScale: 0.085 });
    const darkStone = new THREE.MeshStandardMaterial({ map: marble, color: 0x797465, roughness: 1, bumpMap: marble, bumpScale: 0.045 });
    const roofStone = new THREE.MeshStandardMaterial({ map: roofMap, color: 0xada18c, roughness: 0.95, bumpMap: roofMap, bumpScale: 0.045, side: THREE.DoubleSide });
    const bronze = new THREE.MeshStandardMaterial({ color: 0x493e2f, metalness: 0.45, roughness: 0.57 });
    const reliefMap = texturedMap(reliefUrl);
    reliefMap.wrapS = reliefMap.wrapT = THREE.ClampToEdgeWrapping;
    const reliefMaterial = new THREE.MeshStandardMaterial({ map: reliefMap, color: 0xd3cfc5, roughness: 0.94,
      bumpMap: reliefMap, bumpScale: 0.095, displacementMap: reliefMap, displacementScale: 0.065 });

    sky = createParthenonSky(PARTHENON_PERIODS[0]);
    set.add(sky);
    const terrainMaterial = new THREE.MeshStandardMaterial({ map: dirt, roughness: 1, bumpMap: dirt, bumpScale: 0.14, vertexColors: true });
    set.add(createParthenonTerrain(terrainMaterial));
    addParthenonRocks(set, broadStone);

    const slabWidths = [1.42, 1.67, 1.92, 2.12];
    const pavers = slabWidths.map(() => []);
    for (let row = 0; row < 59; row += 1) {
      let x = -18.2 + Math.sin(row * 5.4) * 0.9;
      let column = 0;
      const z = 23 - row * 1.19;
      while (x < 18) {
        const variant = (column * 3 + row * 7) % slabWidths.length;
        const width = slabWidths[variant];
        const centerX = x + width * 0.5;
        if (!(Math.abs(centerX) < 11.5 && z < -6 && z > -41.5)) pavers[variant].push([centerX, z]);
        x += width + 0.055;
        column += 1;
      }
    }
    pavers.forEach((positions, variant) => {
      addInstanced(set, "Losas erosionadas de la explanada", createWeatheredSlabGeometry(slabWidths[variant], 1.105, variant), paving,
        positions, (dummy, [x, z], index) => {
          dummy.position.set(x, Math.sin(index * 4.1) * 0.006, z);
          dummy.rotation.y = (index % 2 ? Math.PI : 0) + Math.sin(index * 3.37) * 0.004;
        }, (index) => new THREE.Color().setScalar(0.78 + Math.sin(index * 8.37) * 0.16));
    });

    const centerZ = -23.6;
    addBox(set, "Primer escalon del Partenon", broadStone, [22.8, 0.25, 35], [0, 0.12, centerZ]);
    addBox(set, "Segundo escalon del Partenon", broadStone, [21.9, 0.25, 34.1], [0, 0.36, centerZ]);
    addBox(set, "Estilobato del Partenon", broadStone, [21.1, 0.27, 33.2], [0, 0.61, centerZ]);
    const stepJoints = [];
    for (let level = 0; level < 3; level += 1) {
      const width = 22.8 - level * 0.85, depth = 35 - level * 0.9;
      const y = 0.12 + level * 0.245;
      for (let x = -width / 2 + 1.7; x < width / 2; x += 1.8) {
        stepJoints.push([x, y, centerZ + depth / 2 + 0.002, 0], [x, y, centerZ - depth / 2 - 0.002, 0]);
      }
      for (let z = centerZ - depth / 2 + 1.7; z < centerZ + depth / 2; z += 1.8) {
        stepJoints.push([-width / 2 - 0.002, y, z, Math.PI / 2], [width / 2 + 0.002, y, z, Math.PI / 2]);
      }
    }
    addInstanced(set, "Juntas de sillares en escalones", new THREE.BoxGeometry(0.012, 0.22, 0.009), darkStone,
      stepJoints, (dummy, [x, y, z, angle]) => { dummy.position.set(x, y, z); dummy.rotation.y = angle; });

    const columns = parthenonColumnPositions();
    const columnColor = (index) => new THREE.Color().setScalar(0.91 + Math.sin(index * 3.8) * 0.07);
    addInstanced(set, "Columnas doricas estriadas", createFlutedDoricShaftGeometry(), shaftStone,
      columns, (dummy, [x, z]) => { dummy.position.set(x, 3.34, z); }, columnColor);
    addInstanced(set, "Collarinos doricos", new THREE.TorusGeometry(0.49, 0.065, 8, 40), carved,
      columns, (dummy, [x, z]) => {
        dummy.position.set(x, 6.02, z);
        dummy.rotation.x = Math.PI / 2;
      });
    const echinusProfile = [[0.49, 0], [0.5, 0.07], [0.61, 0.14], [0.7, 0.22], [0.75, 0.3], [0.76, 0.37]];
    const echinus = new THREE.LatheGeometry(echinusProfile.map(([x, y]) => new THREE.Vector2(x, y - 0.185)), 64);
    addInstanced(set, "Equinos de los capiteles", echinus, carved,
      columns, (dummy, [x, z]) => { dummy.position.set(x, 6.19, z); }, columnColor);
    addInstanced(set, "Abacos de los capiteles", new THREE.BoxGeometry(1.57, 0.22, 1.57), carved,
      columns, (dummy, [x, z]) => { dummy.position.set(x, 6.47, z); }, columnColor);
    const drums = columns.flatMap(([x, z]) => [1.58, 2.46, 3.34, 4.22, 5.1].map((y) => [x, y, z]));
    addInstanced(set, "Juntas de tambores tallados", new THREE.TorusGeometry(1, 0.004, 4, 80), darkStone,
      drums, (dummy, [x, y, z]) => {
        const height = (y - 0.715) / 5.25;
        const radius = THREE.MathUtils.lerp(0.57, 0.48, height) * (1 + 0.012 * Math.sin(Math.PI * height));
        dummy.position.set(x, y, z);
        dummy.rotation.x = Math.PI / 2;
        dummy.scale.setScalar(radius * 0.975);
      });

    const frontGlyphs = [], frontMetopes = [], sideGlyphs = [], roofJoints = [];
    for (const z of [-8.1, -39.1]) {
      addBox(set, "Arquitrabe frontal", broadStone, [20.4, 0.72, 1.55], [0, 6.96, z]);
      addBox(set, "Friso dorico frontal", darkStone, [20.4, 0.67, 1.5], [0, 7.67, z]);
      addBox(set, "Cornisa horizontal frontal", carved, [21.3, 0.27, 1.8], [0, 8.13, z]);
      addBox(set, "Tenia del arquitrabe", carved, [20.65, 0.09, 1.64], [0, 7.34, z]);
      addBox(set, "Banda inferior del arquitrabe", carved, [20.5, 0.07, 1.59], [0, 6.75, z]);
      for (let index = 0; index < 16; index += 1) {
        const x = -9.1 + index * 1.22;
        const front = z > -20 ? z + 0.78 : z - 0.78;
        for (const offset of [-0.18, 0, 0.18]) {
          frontGlyphs.push([x + offset, 7.66, front]);
        }
        if (index < 15) frontMetopes.push([x + 0.61, 7.67, front]);
      }
      const pediment = addMesh(set, "Fronton triangular", pedimentGeometry(), broadStone,
        0, 8.25, z - 0.28);
      pediment.material.side = THREE.DoubleSide;
      addSlopingBeam(set, carved, [-10.35, 8.25], [0, 10.61], z);
      addSlopingBeam(set, carved, [0, 10.61], [10.35, 8.25], z);
      const relief = addMesh(set, "Relieve escultorico del fronton", createPedimentReliefGeometry(),
        reliefMaterial, 0, 9.325, z > -20 ? z + 0.29 : z - 0.3);
      relief.rotation.y = z > -20 ? 0 : Math.PI;
    }
    for (const x of [-8.75, 8.75]) {
      addBox(set, "Arquitrabe lateral", broadStone, [1.55, 0.72, 32.4], [x, 6.96, centerZ]);
      addBox(set, "Friso lateral", darkStone, [1.5, 0.67, 32.4], [x, 7.67, centerZ]);
      addBox(set, "Cornisa lateral", carved, [1.8, 0.27, 33.1], [x, 8.13, centerZ]);
      for (let index = 0; index < 26; index += 1) {
        const z = -8.5 - index * 1.2;
        const sideX = x + Math.sign(x) * 0.78;
        for (const offset of [-0.17, 0, 0.17]) {
          sideGlyphs.push([sideX, 7.67, z + offset]);
        }
      }
    }
    addInstanced(set, "Triglifos frontales", new THREE.BoxGeometry(0.105, 0.53, 0.09), carved,
      frontGlyphs, (dummy, [x, y, z]) => { dummy.position.set(x, y, z); });
    addInstanced(set, "Metopas de piedra tallada", new THREE.BoxGeometry(0.64, 0.5, 0.075), stone,
      frontMetopes, (dummy, [x, y, z]) => { dummy.position.set(x, y, z); });
    addInstanced(set, "Triglifos laterales", new THREE.BoxGeometry(0.09, 0.5, 0.1), carved,
      sideGlyphs, (dummy, [x, y, z]) => { dummy.position.set(x, y, z); });

    const darkInterior = new THREE.MeshStandardMaterial({ color: 0x242521, roughness: 1 });
    addBox(set, "Muro interior izquierdo", broadStone, [4.7, 5.75, 0.5], [-4.35, 3.68, -12.7]);
    addBox(set, "Muro interior derecho", broadStone, [4.7, 5.75, 0.5], [4.35, 3.68, -12.7]);
    addBox(set, "Dintel de entrada", carved, [4.3, 1.15, 0.55], [0, 5.99, -12.7]);
    addBox(set, "Oscuridad del naos", darkInterior, [4, 4.7, 0.28], [0, 3.14, -13.05]);
    for (const side of [-1, 1]) {
      addBox(set, "Puerta de bronce", bronze, [1.62, 4.25, 0.12], [side * 0.86, 3.0, -12.82]);
      addBox(set, "Jamba de entrada", carved, [0.18, 4.75, 0.64], [side * 1.97, 3.16, -12.66]);
      for (let row = 0; row < 3; row += 1) {
        addBox(set, "Panel rehundido de puerta", darkStone, [1.22, 1.03, 0.03], [side * 0.86, 1.58 + row * 1.24, -12.745]);
      }
      const handle = addMesh(set, "Aro de bronce de la puerta", new THREE.TorusGeometry(0.11, 0.024, 8, 20),
        bronze, side * 0.23, 2.7, -12.69);
      handle.castShadow = false;
      addBox(set, "Muro lateral del naos", broadStone, [0.45, 5.75, 24], [side * 6.85, 3.68, -25.0]);
    }
    addBox(set, "Muro posterior del naos", broadStone, [14.1, 5.75, 0.55], [0, 3.68, -37.2]);
    const wallJoints = [];
    for (let row = 0; row < 7; row += 1) {
      const y = 1.35 + row * 0.72;
      for (const side of [-1, 1]) {
        wallJoints.push([side * 4.35, y, 4.68, 0.015]);
        for (let column = 0; column < 2; column += 1) {
          wallJoints.push([side * 4.35 - 1.4 + column * 1.7 + (row % 2) * 0.52, y + 0.35, 0.012, 0.7]);
        }
      }
    }
    addInstanced(set, "Juntas de sillares del naos", new THREE.BoxGeometry(1, 1, 0.018), darkStone,
      wallJoints, (dummy, [x, y, width, height]) => { dummy.position.set(x, y, -12.44); dummy.scale.set(width, height, 1); });

    for (const side of [-1, 1]) {
      const roof = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        0, 10.48, -7.3, side * 10.55, 8.26, -7.3,
        0, 10.48, -39.9, side * 10.55, 8.26, -39.9
      ]);
      roof.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      roof.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2));
      roof.setIndex([0, 1, 2, 2, 1, 3]);
      roof.computeVertexNormals();
      addMesh(set, "Cubierta de tejas marmoreas", roof, roofStone, 0, 0, 0);
      for (let index = 0; index < 24; index += 1) {
        const z = -7.9 - index * 1.34;
        roofJoints.push([side * 5.3, 9.37, z, side]);
      }
    }
    addInstanced(set, "Juntas de tejas", new THREE.BoxGeometry(10.8, 0.035, 0.055), carved,
      roofJoints, (dummy, [x, y, z, side]) => {
        dummy.position.set(x, y, z);
        dummy.rotation.z = side * -Math.atan2(2.22, 10.55);
      });
    for (const x of [-10.4, 0, 10.4]) {
      addMesh(set, "Acrotera del tejado", new THREE.ConeGeometry(x === 0 ? 0.32 : 0.24, x === 0 ? 0.95 : 0.65, 12),
        carved, x, x === 0 ? 10.96 : 8.77, -8.1);
    }
    const bark = texturedMap(barkUrl, 1, 2);
    addParthenonOlives(set, new THREE.MeshStandardMaterial({ map: bark, color: 0x888477, roughness: 1, bumpMap: bark, bumpScale: 0.09 }));
    const flameMaterial = createBrazierFlameMaterial();
    for (const x of [-11.9, 11.9]) {
      for (const z of [-3.5, -13.5]) {
        addBox(set, "Pedestal de brasero", stone, [0.72, 1.22, 0.72], [x, 0.61, z]);
        addMesh(set, "Copa de brasero", new THREE.CylinderGeometry(0.54, 0.3, 0.27, 20), bronze,
          x, 1.36, z);
        const flame = new THREE.Group();
        flame.name = "Fuego del brasero";
        flame.position.set(x, 1.84, z);
        for (const angle of [0, Math.PI / 2]) {
          const sheet = addMesh(flame, "Lengua de fuego", new THREE.PlaneGeometry(0.66, 0.94), flameMaterial, 0, 0, 0, false);
          sheet.rotation.y = angle;
        }
        set.add(flame);
        flames.push(flame);
        const torch = new THREE.PointLight(0xff9953, 0, 8, 2);
        torch.position.set(x, 1.8, z);
        set.add(torch);
        torchLights.push(torch);
      }
    }
    sunLight = new THREE.DirectionalLight(0xfff1d9, 3.2);
    sunLight.name = "Sol y luna del Partenon";
    sunLight.target.position.set(0, 0, -13);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    Object.assign(sunLight.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38, near: 1, far: 150 });
    sunLight.shadow.camera.updateProjectionMatrix();
    sunLight.shadow.bias = -0.00008;
    sunLight.shadow.normalBias = 0.022;
    sunLight.shadow.radius = 2;
    set.userData.sunLight = sunLight;
    set.add(sunLight, sunLight.target);
  }

  set.userData.animate = (active, lighting, time = 0) => {
    set.visible = Boolean(active && !disposed);
    if (!set.visible) return;
    build();
    const period = normalizeParthenonLighting(lighting).period;
    set.userData.period = period;
    if (period !== currentPeriod) {
      currentPeriod = period;
      const mode = PARTHENON_PERIODS.find((entry) => entry.id === period);
      sky.material.uniforms.topColor.value.set(mode.skyTop);
      sky.material.uniforms.horizonColor.value.set(mode.skyHorizon);
      sky.material.uniforms.sunDirection.value.set(...mode.sun).normalize();
      sky.material.uniforms.night.value = period === "night" ? 1 : 0;
      sunLight.color.set(mode.color);
      sunLight.intensity = mode.key;
      sunLight.position.set(...mode.sun).normalize().multiplyScalar(65).add(sunLight.target.position);
      sunLight.shadow.needsUpdate = true;
      set.userData.atmosphere.color.set(mode.skyHorizon);
      flames.forEach((flame) => { flame.visible = mode.torches > 0; });
      torchLights.forEach((torch) => { torch.intensity = 24 * mode.torches; });
    }
    sky.material.uniforms.time.value = time * 0.001;
    flames.forEach((flame, index) => {
      flame.scale.y = 0.86 + Math.sin(time * 0.007 + index * 1.9) * 0.11;
      flame.children[0].material.uniforms.time.value = time * 0.001;
    });
  };
  set.userData.dispose = () => {
    disposed = true;
    set.visible = false;
    if (built) disposeSet(set);
  };
  return set;
}

export function bindParthenonLighting(scene, set, { ambient, keyLight, floor }) {
  const before = scene.onBeforeRender, after = scene.onAfterRender;
  let saved = null;
  const restore = () => {
    if (!saved) return;
    ambient.intensity = saved.ambient;
    ambient.color.copy(saved.ambientColor);
    ambient.groundColor.copy(saved.groundColor);
    keyLight.intensity = saved.key;
    keyLight.color.copy(saved.keyColor);
    keyLight.castShadow = saved.keyShadow;
    scene.environmentIntensity = saved.environment;
    scene.fog = saved.fog;
    if (floor) floor.visible = saved.floorVisible;
    saved = null;
  };
  scene.onBeforeRender = function(...args) {
    before.apply(this, args);
    if (!set.visible) return;
    const mode = PARTHENON_PERIODS.find((entry) => entry.id === set.userData.period) || PARTHENON_PERIODS[0];
    saved = {
      ambient: ambient.intensity, ambientColor: ambient.color.clone(), groundColor: ambient.groundColor.clone(),
      key: keyLight.intensity, keyColor: keyLight.color.clone(), keyShadow: keyLight.castShadow,
      environment: scene.environmentIntensity, fog: scene.fog, floorVisible: floor?.visible
    };
    ambient.intensity = Math.min(ambient.intensity, 1.5) * mode.ambient;
    ambient.color.set(mode.skyLight);
    ambient.groundColor.set(mode.ground);
    if (set.userData.sunLight) set.userData.sunLight.intensity = mode.key * Math.min(keyLight.intensity / 2.35, 2);
    keyLight.intensity = 0;
    keyLight.castShadow = false;
    scene.environmentIntensity = Math.min(scene.environmentIntensity, 0.75) * mode.environment;
    scene.fog = saved.fog || set.userData.atmosphere || null;
    // Hide only during rendering: the editor still uses floor.visible as its scene toggle.
    if (floor) floor.visible = false;
  };
  scene.onAfterRender = function(...args) { restore(); after.apply(this, args); };
  return () => {
    restore();
    scene.onBeforeRender = before;
    scene.onAfterRender = after;
  };
}
