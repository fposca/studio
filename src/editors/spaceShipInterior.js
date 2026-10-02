import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import brushedMetalUrl from "../assets/environments/brushed-metal-texture.png";
import wornAlloyUrl from "../assets/environments/ship-worn-alloy-v1.png";
import { createShipHolograms } from "./shipHolograms.js";

export function buildSpaceShipSet(textureFactories) {
  const group = new THREE.Group();
  group.name = "Space Ship";
  group.userData.editorHelper = true;
  group.visible = false;
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const staticMeshes = [];
  const lights = [];
  const pulses = [];
  const runners = [];
  const loader = new THREE.TextureLoader();
  const texture = (url, repeat) => {
    const map = loader.load(url);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(...repeat);
    map.anisotropy = 8;
    textures.add(map);
    return map;
  };
  const worn = texture(wornAlloyUrl, [1.5, 1.5]);
  const brushed = texture(brushedMetalUrl, [2, 2]);
  const floorRelief = textureFactories.surfaceReliefTexture("floor");
  textures.add(floorRelief);
  const material = (settings) => {
    const result = new THREE.MeshStandardMaterial(settings);
    materials.add(result);
    return result;
  };
  const hull = material({ map: worn, bumpMap: worn, bumpScale: 0.014,
    color: 0x89958f, metalness: 0.32, roughness: 0.61 });
  const steel = material({ map: brushed, bumpMap: brushed, bumpScale: 0.012,
    color: 0x7c8a8b, metalness: 0.82, roughness: 0.36 });
  const graphite = material({ map: worn, bumpMap: worn, bumpScale: 0.014,
    color: 0x485357, metalness: 0.46, roughness: 0.62 });
  const rubber = material({ color: 0x111719, roughness: 0.91, metalness: 0.05 });
  const deck = material({ map: brushed, bumpMap: floorRelief, bumpScale: 0.045,
    color: 0x414c4d, metalness: 0.68, roughness: 0.52 });
  const ceiling = material({ map: brushed, bumpMap: brushed, bumpScale: 0.013,
    color: 0x7e8d87, metalness: 0.48, roughness: 0.55 });
  const enamel = material({ map: worn, color: 0xb3b7ae, bumpMap: worn,
    bumpScale: 0.012, roughness: 0.57, metalness: 0.18 });
  const hazard = material({ color: 0xc5a361, roughness: 0.61, metalness: 0.25 });
  const whiteLight = material({ color: 0x8a8e83, emissive: 0xe1e2c8,
    emissiveIntensity: 1.6, roughness: 0.45, toneMapped: false });
  const indicator = new THREE.MeshBasicMaterial({ color: 0xb2dcaa, toneMapped: false });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xb7d0ca, roughness: 0.12,
    clearcoat: 1, metalness: 0, transparent: true, opacity: 0.095, depthWrite: false });
  materials.add(indicator);
  materials.add(glass);
  const mesh = (name, geometry, mat, parent = group, isStatic = true) => {
    const object = new THREE.Mesh(geometry, mat);
    object.name = name;
    object.receiveShadow = !mat.transparent;
    parent.add(object);
    geometries.add(geometry);
    if (isStatic && !mat.transparent) staticMeshes.push(object);
    return object;
  };
  const box = (name, size, position, mat, parent = group, bevel = 0, isStatic = true) => {
    const geometry = bevel
      ? new RoundedBoxGeometry(...size, 1, Math.min(bevel, Math.min(...size) * 0.4))
      : new THREE.BoxGeometry(...size);
    const object = mesh(name, geometry, mat, parent, isStatic);
    object.position.set(...position);
    return object;
  };
  const beam = (name, start, end, width, depth, mat, parent = group) => {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const direction = b.clone().sub(a);
    const object = box(name, [width, direction.length(), depth], [0, 0, 0], mat, parent, 0.045);
    object.position.copy(a.add(b).multiplyScalar(0.5));
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return object;
  };
  const pipe = (name, points, radius, mat, parent = group) => {
    const path = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    return mesh(name, new THREE.TubeGeometry(path, Math.max(12, points.length * 6), radius, 8, false), mat, parent);
  };
  const cylinder = (name, radius, height, position, mat, parent = group) => {
    const object = mesh(name, new THREE.CylinderGeometry(radius, radius, height, 24), mat, parent);
    object.position.set(...position);
    return object;
  };
  const label = (text, width, height, position, parent = group, color = "#c4c9b8") => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.font = "bold 38px monospace";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 9, 48, 490);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    textures.add(map);
    const mat = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, opacity: 0.8 });
    materials.add(mat);
    const object = mesh(text, new THREE.PlaneGeometry(width, height), mat, parent, false);
    object.position.set(...position);
    return object;
  };
  const neon = (name, size, position, color, phase, parent = group) => {
    const mat = material({ color: 0x162422, emissive: color, emissiveIntensity: 1,
      roughness: 0.35, toneMapped: false });
    pulses.push({ material: mat, phase });
    return box(name, size, position, mat, parent, 0.02);
  };
  const screenMaterials = new Map();
  const screen = (kind, width, height, position, parent) => {
    let mat = screenMaterials.get(kind);
    if (!mat) {
      const map = kind === "operations" ? textureFactories.operationsTexture() : textureFactories.screenTexture(kind);
      textures.add(map);
      mat = new THREE.MeshBasicMaterial({ map, color: 0xabbcab, toneMapped: false });
      materials.add(mat);
      screenMaterials.set(kind, mat);
    }
    box("Terminal con carcasa profunda", [width + 0.24, height + 0.23, 0.39],
      [position[0], position[1], position[2] - 0.2], graphite, parent, 0.09);
    box("Bisel de pantalla", [width + 0.08, height + 0.07, 0.035],
      [position[0], position[1], position[2] + 0.004], rubber, parent);
    const display = mesh("Monitor " + kind, new THREE.PlaneGeometry(width, height), mat, parent);
    display.position.set(position[0], position[1], position[2] + 0.024);
    const pane = mesh("Protector de monitor", new THREE.PlaneGeometry(width, height), glass, parent, false);
    pane.position.set(position[0], position[1], position[2] + 0.032);
  };

  // Individual panels sit above dark gaskets; repeated detail is batched below.
  box("Casco inferior", [27, 0.22, 32], [0, -0.16, -5], graphite);
  const treads = [];
  for (let row = 0; row < 10; row += 1) {
    const z = -19.3 + row * 3.05;
    for (let column = -3; column <= 3; column += 1) {
      const x = column * 3.68;
      box("Junta de cubierta", [3.64, 0.035, 3], [x, 0.003, z], rubber);
      box("Placa de cubierta", [3.52, 0.062, 2.87], [x, 0.039, z], deck, group, 0.02);
      for (const side of [-1, 1]) {
        box("Cierre de placa", [0.09, 0.012, 0.13], [x + side * 1.61, 0.077, z - 1.29], steel);
      }
      for (let y = -1; y <= 1; y += 1) {
        for (let xOffset = -2; xOffset <= 2; xOffset += 1) {
          treads.push([x + xOffset * 0.58, 0.079, z + y * 0.65]);
        }
      }
    }
  }
  const treadGeometry = new THREE.BoxGeometry(0.24, 0.012, 0.035);
  geometries.add(treadGeometry);
  const treadMesh = new THREE.InstancedMesh(treadGeometry, steel, treads.length);
  const instance = new THREE.Object3D();
  treads.forEach((position, index) => {
    instance.position.set(...position);
    instance.rotation.y = index % 2 ? 0.55 : -0.55;
    instance.updateMatrix();
    treadMesh.setMatrixAt(index, instance.matrix);
  });
  treadMesh.name = "Antideslizante de acero";
  group.add(treadMesh);
  for (const side of [-1, 1]) {
    box("Canal electrico de cubierta", [0.16, 0.025, 29.5], [side * 4.35, 0.085, -5], rubber);
    neon("Guia de cubierta", [0.035, 0.019, 29], [side * 4.35, 0.102, -5], 0x437e72, side + 1);
    const runner = box("Pulso de cubierta", [0.06, 0.025, 0.72], [side * 4.35, 0.119, -5],
      indicator, group, 0.01, false);
    runners.push(runner);
    for (const z of [-18, -12, -6, 0, 6]) {
      box("Marca de seguridad", [0.12, 0.012, 0.48], [side * 4.65, 0.086, z], hazard);
    }
  }

  for (const side of [-1, 1]) {
    const wall = new THREE.Group();
    wall.name = "Mamparo industrial lateral";
    wall.position.set(side * 13, 0, -5);
    wall.rotation.y = -side * Math.PI / 2;
    group.add(wall);
    box("Zocalo tecnico", [31.8, 0.35, 0.8], [0, 0.2, 0.05], graphite, wall, 0.035);
    box("Mamparo inferior", [31.8, 2.35, 0.45], [0, 1.5, -0.14], hull, wall, 0.05);
    box("Mamparo superior", [31.8, 3.3, 0.55], [0, 7.1, -0.18], hull, wall, 0.05);
    for (const x of [-14.1, -6.8, 0, 6.8, 14.1]) {
      box("Division de mamparo", [0.7, 6.3, 0.72], [x, 3.8, 0], graphite, wall, 0.075);
      box("Refuerzo de mamparo", [0.21, 4.9, 0.1], [x, 3.9, 0.41], steel, wall, 0.02);
    }
    for (const x of [-10.25, 10.25]) {
      box("Umbral profundo de ventana", [6.05, 0.3, 0.78], [x, 2.75, 0.16], graphite, wall, 0.04);
      box("Dintel profundo de ventana", [6.05, 0.3, 0.78], [x, 5.6, 0.16], graphite, wall, 0.04);
      for (const direction of [-1, 1]) {
        box("Jamba de ventana", [0.32, 2.85, 0.78], [x + direction * 2.87, 4.18, 0.16], graphite, wall, 0.04);
        box("Junta de cristal", [0.055, 2.48, 0.06], [x + direction * 2.65, 4.18, 0.57], rubber, wall);
      }
      const pane = mesh("Cristal de observacion", new THREE.PlaneGeometry(5.37, 2.48), glass, wall, false);
      pane.position.set(x, 4.18, -0.13);
      box("Pasamanos bajo ventana", [5.75, 0.1, 0.18], [x, 2.45, 0.56], steel, wall, 0.025);
      label("OBSERVATION // " + (side < 0 ? "PORT" : "STBD"), 3.5, 0.25, [x - 0.8, 2.11, 0.15], wall);
    }
    box("Panel de sistemas", [6.05, 2.8, 0.52], [3.4, 4.18, 0.05], hull, wall, 0.1);
    for (const x of [1.3, 3.4, 5.5]) {
      box("Registro de servicio", [1.75, 1.96, 0.11], [x, 4.25, 0.37], graphite, wall, 0.035);
      for (let index = 0; index < 6; index += 1) {
        box("Aleta de registro", [1.5, 0.055, 0.12], [x, 3.63 + index * 0.22, 0.47], steel, wall);
      }
    }
    label("LIFE SUPPORT // 04", 4, 0.32, [1.5, 5.25, 0.39], wall);
    box("Marco de esclusa", [5.8, 5.6, 0.45], [-3.4, 3.11, 0.18], graphite, wall, 0.18);
    for (const direction of [-1, 1]) {
      box("Hoja de esclusa", [2.51, 4.97, 0.2], [-3.4 + direction * 1.29, 3.11, 0.48], enamel, wall, 0.08);
      box("Refuerzo vertical de esclusa", [0.19, 4.45, 0.065],
        [-3.4 + direction * 0.28, 3.11, 0.62], steel, wall, 0.02);
      box("Banda de precaucion", [0.15, 0.62, 0.035],
        [-3.4 + direction * 2.24, 2.32, 0.63], hazard, wall);
    }
    label("AIRLOCK 02", 2.4, 0.28, [-4.6, 5.32, 0.63], wall);
    neon("Baliza de esclusa", [0.5, 0.06, 0.06], [-3.4, 5.95, 0.49], 0xb6904e, side + 2, wall);
    for (const z of [-17.8, -10.5, -3.2, 4.1]) {
      box("Escotilla inferior", [0.06, 0.77, 4.9], [side * 12.69, 1.1, z], graphite, group, 0.02);
    }
    const slope = box("Panel oblicuo superior", [4.6, 0.24, 32], [side * 11.13, 7.14, -5], ceiling);
    slope.rotation.z = -side * 0.7;
    for (let line = 0; line < 3; line += 1) {
      pipe("Conducto longitudinal", [
        [side * (10.2 + line * 0.3), 7.57 - line * 0.16, 10],
        [side * (10.2 + line * 0.3), 7.57 - line * 0.16, -15],
        [side * 11.2, 6.8 - line * 0.15, -18.7],
        [side * 11.2, 2.6, -19.1]
      ], line === 1 ? 0.105 : 0.063, line === 1 ? rubber : steel);
    }
  }

  box("Techo presurizado", [19.5, 0.3, 32], [0, 8.7, -5], graphite);
  for (const z of [-18, -12, -6, 0, 6]) {
    for (const side of [-1, 1]) {
      box("Casete superior biselado", [7.8, 0.17, 5.45], [side * 5.3, 8.49, z], ceiling, group, 0.04);
      box("Rebaje de ventilacion", [3.8, 0.12, 1.9], [side * 6, 8.33, z], rubber, group, 0.035);
      for (let index = -4; index <= 4; index += 1) {
        box("Rejilla de conducto", [3.42, 0.085, 0.09], [side * 6, 8.22, z + index * 0.17], steel);
      }
    }
    box("Carcasa de luz cenital", [1.38, 0.26, 3.2], [0, 8.35, z], graphite, group, 0.05);
    box("Difusor de luz cenital", [1.03, 0.06, 2.83], [0, 8.18, z], whiteLight, group, 0.025);
    for (const side of [-1, 1]) {
      pipe("Jaula de luminaria", [[side * 0.62, 8.22, z - 1.45],
        [side * 0.62, 8.08, z], [side * 0.62, 8.22, z + 1.45]], 0.027, steel);
    }
  }
  for (const [index, z] of [-19.6, -12.2, -4.8, 2.6, 10].entries()) {
    for (const side of [-1, 1]) {
      beam("Costilla vertical", [side * 12.38, 0, z], [side * 12.38, 5.65, z], 0.46, 0.68, graphite);
      beam("Costilla oblicua", [side * 12.38, 5.55, z], [side * 9.12, 8.22, z], 0.43, 0.68, graphite);
      neon("Neon de costilla", [0.065, 1.4, 0.07], [side * 12.1, 4.35, z + 0.38],
        index % 2 ? 0x3acfb1 : 0x56bad8, index * 0.65 + side);
      box("Anclaje de costilla", [0.83, 0.43, 0.96], [side * 12.35, 0.3, z], steel, group, 0.045);
    }
    beam("Travesano estructural", [-9.2, 8.21, z], [9.2, 8.21, z], 0.38, 0.68, graphite);
    neon("Neon de travesano", [5.4, 0.033, 0.055], [0, 7.99, z + 0.36],
      index % 2 ? 0x44b89b : 0xc49c55, index * 0.7);
  }
  box("Mamparo frontal inferior", [27, 4.25, 0.7], [0, 2.06, -21], hull, group, 0.05);
  box("Mamparo frontal superior", [27, 2, 0.7], [0, 7.9, -21], hull, group, 0.05);
  for (const x of [-11.5, -3.85, 3.85, 11.5]) {
    box("Montante frontal", [0.72, 3.2, 0.8], [x, 5.5, -20.8], graphite, group, 0.05);
  }
  for (const x of [-7.65, 0, 7.65]) {
    for (const y of [4.22, 6.77]) {
      box("Marco frontal", [7.05, 0.24, 0.7], [x, y, -20.69], graphite, group, 0.035);
      box("Junta frontal", [6.71, 0.048, 0.1], [x, y + (y < 5 ? 0.16 : -0.16), -20.23], rubber);
    }
    const pane = mesh("Cristal frontal blindado", new THREE.PlaneGeometry(6.85, 2.25), glass, group, false);
    pane.position.set(x, 5.49, -20.95);
  }
  // Keep the camera-facing side open so exterior shots can frame the characters.
  label("DEEP SPACE // COMMAND", 7, 0.39, [-3.5, 7.32, -20.6]);
  const controlTargets = [];
  const keyboard = (parent, position, width, id) => {
    const controls = new THREE.Group();
    controls.position.set(...position);
    controls.rotation.x = 0.2;
    parent.add(controls);
    box("Bisel de teclado", [width, 0.12, 0.86], [0, 0, 0], steel, controls, 0.03);
    const deckPanel = box("Botonera interactiva", [width - 0.12, 0.045, 0.74], [0, 0.08, 0],
      rubber, controls, 0.012, false);
    deckPanel.userData.shipInteraction = id;
    controlTargets.push(deckPanel);
    const keyGeometry = new RoundedBoxGeometry(0.115, 0.045, 0.11, 1, 0.008);
    geometries.add(keyGeometry);
    const keyMesh = new THREE.InstancedMesh(keyGeometry, enamel, 40);
    const transform = new THREE.Object3D();
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 10; column += 1) {
        transform.position.set((column - 4.5) * 0.15 - 0.14, 0.13, (row - 1.5) * 0.15);
        transform.updateMatrix();
        keyMesh.setMatrixAt(row * 10 + column, transform.matrix);
      }
    }
    controls.add(keyMesh);
    for (let index = 0; index < 3; index += 1) {
      cylinder("Selector rotativo", 0.071, 0.09, [width / 2 - 0.22, 0.15, -0.25 + index * 0.25], graphite, controls);
      box("Indicador de selector", [0.017, 0.009, 0.066], [width / 2 - 0.22, 0.2, -0.26 + index * 0.25], hazard, controls);
    }
    box("Testigo de teclado", [0.06, 0.025, 0.07], [-width / 2 + 0.17, 0.13, -0.25], indicator, controls);
  };
  for (const [id, kind, x, z] of [
    ["anatomy", "human", -7.4, -7.4], ["orbit", "planet", 7.4, -8.2]
  ]) {
    const station = new THREE.Group();
    station.name = "Estacion " + id;
    station.position.set(x, 0, z);
    station.rotation.y = x < 0 ? 0.17 : -0.17;
    group.add(station);
    box("Base de estacion cientifica", [3.45, 0.3, 2.9], [0, 0.15, 0.05], graphite, station, 0.07);
    box("Pedestal de estacion cientifica", [2.72, 1.02, 2.1], [0, 0.74, -0.11], enamel, station, 0.09);
    box("Cubierta de control", [3.6, 0.22, 1.86], [0, 1.29, 0.52], graphite, station, 0.06);
    for (let index = -4; index <= 4; index += 1) {
      box("Rejilla inferior de consola", [0.105, 0.45, 0.075], [index * 0.22, 0.65, 0.98], rubber, station);
    }
    const monitor = new THREE.Group();
    monitor.rotation.x = -0.13;
    monitor.position.set(0, 1.89, -0.54);
    station.add(monitor);
    screen(kind, 2.65, 1.28, [0, 0, 0], monitor);
    keyboard(station, [0, 1.37, 0.72], 2.3, id);
    label(id === "anatomy" ? "BIO / 03" : "ORBIT / 02", 1.17, 0.16, [-0.6, 1.13, 1.51], station);
    cylinder("Base de proyector", 0.62, 0.13, [0, 2.08, 0], graphite, station);
    cylinder("Emisor holografico", 0.46, 0.04, [0, 2.17, 0], steel, station);
    for (const side of [-1, 1]) {
      pipe("Asidero de consola", [[side * 1.74, 0.91, 1.13], [side * 1.74, 1.44, 1.13],
        [side * 1.74, 1.5, 0.42]], 0.036, steel, station);
    }
  }
  const command = new THREE.Group();
  command.name = "Centro de computo de mando";
  command.position.set(0, 0, -16.8);
  group.add(command);
  box("Plinto del centro de computo", [8.8, 0.22, 3.3], [0, 0.1, 0.62], graphite, command, 0.07);
  box("Bastidor central", [7.8, 1.13, 2.5], [0, 0.72, 0.35], enamel, command, 0.1);
  for (const x of [-3.1, -1.55, 0, 1.55, 3.1]) {
    box("Registro frontal de mando", [1.35, 0.77, 0.06], [x, 0.74, 1.64], graphite, command, 0.03);
    box("Tirador de registro", [0.42, 0.045, 0.095], [x, 1, 1.72], steel, command, 0.014);
  }
  box("Mesa de operaciones", [9, 0.27, 2.28], [0, 1.49, 0.98], graphite, command, 0.08);
  box("Soporte del monitor principal", [4.9, 1.52, 0.7], [0, 2.06, -0.46], hull, command, 0.06);
  screen("operations", 4.9, 2.27, [0, 3.16, -0.01], command);
  for (const side of [-1, 1]) {
    const bank = new THREE.Group();
    bank.position.set(side * 3.62, 2.52, 0.45);
    bank.rotation.y = -side * 0.29;
    command.add(bank);
    screen(side < 0 ? "human" : "planet", 1.79, 1.33, [0, 0, 0], bank);
    label(side < 0 ? "REACTOR" : "TELEMETRY", 1.1, 0.13, [-0.55, -0.84, 0.07], bank);
  }
  for (const x of [-3, 0, 3]) keyboard(command, [x, 1.66, 1.14], 2.35, "navigation");
  label("CENTRAL OPERATIONS // 01", 4, 0.23, [-2, 1.25, 2.23], command);
  cylinder("Proyector tactico central", 0.54, 0.1, [0, 4.47, 0.7], graphite, command);
  const projectorMat = new THREE.MeshBasicMaterial({ color: 0x70b5a3, transparent: true,
    opacity: 0.034, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  materials.add(projectorMat);
  for (const [x, y, z, radius, height] of [[-7.4, 2.9, -7.4, 0.59, 1.5],
    [7.4, 3.05, -8.2, 1.1, 1.7], [0, 4.73, -16.1, 0.7, 0.5]]) {
    const cone = mesh("Volumen de proyeccion", new THREE.ConeGeometry(radius, height, 24, 1, true),
      projectorMat, group, false);
    cone.position.set(x, y, z);
    cone.rotation.z = Math.PI;
  }

  const rackLedMaterials = [0x86a98c, 0xbfa05c, 0x6d9caa].map((color) => {
    const mat = material({ color: 0x101514, emissive: color, emissiveIntensity: 0.9, toneMapped: false });
    pulses.push({ material: mat, phase: pulses.length * 0.7 });
    return mat;
  });
  for (const side of [-1, 1]) {
    for (const [index, z] of [-12.4, -17.3].entries()) {
      const rack = new THREE.Group();
      rack.name = "Rack de computo";
      rack.position.set(side * 11.64, 0, z);
      rack.rotation.y = -side * 1.14;
      group.add(rack);
      box("Armario de computo", [2.5, 4.7, 1.25], [0, 2.39, 0], graphite, rack, 0.08);
      for (const direction of [-1, 1]) {
        box("Bastidor de rack", [0.13, 4.6, 0.18], [direction * 1.15, 2.38, 0.72], steel, rack, 0.025);
      }
      for (let row = 0; row < 7; row += 1) {
        const y = 0.58 + row * 0.53;
        box("Modulo de computo", [2.03, 0.45, 0.12], [0, y, 0.66], row % 3 ? graphite : enamel, rack, 0.025);
        for (let vent = 0; vent < 3; vent += 1) {
          box("Ranura de rack", [1.18, 0.035, 0.018], [-0.2, y - 0.1 + vent * 0.09, 0.73], rubber, rack);
        }
        for (let led = 0; led < 3; led += 1) {
          box("LED de estado", [0.06, 0.065, 0.035], [0.58 + led * 0.15, y, 0.75], rackLedMaterials[(row + led) % 3], rack);
        }
      }
      screen("operations", 1.9, 0.51, [0, 4.25, 0.7], rack);
      label("CORE " + (side < 0 ? "A" : "B") + (index + 1), 1.12, 0.15, [-0.56, 4.78, 0.52], rack);
      pipe("Mazo de datos", [[0.76, 4.65, -0.3], [0.82, 5.2, -0.35],
        [0.7, 5.65, -0.74], [0.66, 6.5, -0.95]], 0.08, rubber, rack);
    }
  }
  const holograms = createShipHolograms();
  group.add(holograms);
  const interactiveTargets = [...holograms.userData.targets, ...controlTargets];
  const planetMap = textureFactories.planetTexture();
  textures.add(planetMap);
  const planetMaterial = material({ map: planetMap, color: 0x7f999e, roughness: 1,
    emissive: 0x091c21, emissiveIntensity: 0.2 });
  const outsidePlanet = mesh("Planeta exterior", new THREE.SphereGeometry(5, 40, 28), planetMaterial, group, false);
  outsidePlanet.position.set(11, 9.5, -47);
  const starGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(900 * 3);
  let seed = 74219;
  const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
  for (let index = 0; index < 900; index += 1) {
    const y = random() * 2 - 1;
    const angle = random() * Math.PI * 2;
    const radius = 95 + random() * 45;
    const ringRadius = Math.sqrt(1 - y * y) * radius;
    positions.set([Math.cos(angle) * ringRadius, y * radius, Math.sin(angle) * ringRadius - 5], index * 3);
  }
  starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometries.add(starGeometry);
  const starMaterial = new THREE.PointsMaterial({ color: 0xb9cdd5, size: 0.14,
    transparent: true, opacity: 0.72, depthWrite: false });
  materials.add(starMaterial);
  const stars = new THREE.Points(starGeometry, starMaterial);
  stars.name = "Campo de estrellas exterior";
  group.add(stars);
  for (const [position, color, intensity, distance] of [
    [[0, 7.5, 1], 0xdadccc, 52, 27],
    [[0, 7.2, -13.5], 0xd9dfd4, 65, 24],
    [[-7.4, 3.4, -6.4], 0x6ebbaa, 8, 9],
    [[7.4, 3.6, -7.2], 0x77adcc, 8, 9]
  ]) {
    const light = new THREE.PointLight(color, intensity, distance, 2);
    light.position.set(...position);
    group.add(light);
    lights.push(light);
  }
  const projectionLights = lights.slice(-2);

  // Batch the static hull by material; moving holograms and controls keep their own meshes.
  group.updateMatrixWorld(true);
  const batches = new Map();
  for (const object of staticMeshes) {
    const bucket = batches.get(object.material) || [];
    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);
    bucket.push(geometry);
    batches.set(object.material, bucket);
    object.removeFromParent();
    geometries.delete(object.geometry);
    object.geometry.dispose();
  }
  const blockers = [];
  for (const [mat, parts] of batches) {
    const geometry = mergeGeometries(parts, false);
    parts.forEach((part) => part.dispose());
    if (!geometry) throw new Error("No se pudo construir la estructura de Space Ship");
    geometries.add(geometry);
    geometry.computeBoundingSphere();
    const object = new THREE.Mesh(geometry, mat);
    object.name = "Estructura de nave";
    object.receiveShadow = true;
    group.add(object);
    blockers.push(object);
  }
  let disposed = false;
  group.userData.holograms = holograms;
  group.userData.interactiveTargets = interactiveTargets;
  group.userData.pick = (raycaster) => {
    if (!group.visible || disposed) return null;
    group.updateMatrixWorld(true);
    const hit = raycaster.intersectObjects(interactiveTargets, false)[0];
    if (!hit) return null;
    const obstruction = raycaster.intersectObjects(blockers, false)[0];
    return obstruction && obstruction.distance < hit.distance - 0.08 ? null : hit;
  };
  group.userData.hover = (id) => holograms.userData.hover(group.visible ? id : null);
  group.userData.activate = (id) => group.visible && !disposed ? holograms.userData.activate(id) : null;
  group.userData.animate = (time, active, reduced = false) => {
    group.visible = Boolean(active && !disposed);
    holograms.userData.animate(time, group.visible, reduced);
    if (!group.visible) return;
    const seconds = time * 0.001;
    pulses.forEach(({ material: mat, phase }) => {
      mat.emissiveIntensity = 0.48 + (Math.sin(seconds * Math.PI / 4 - phase) * 0.5 + 0.5) * 0.76;
    });
    runners.forEach((runner, index) => { runner.position.z = -19.2 + ((seconds / 10 + index * 0.5) % 1) * 28.5; });
    outsidePlanet.rotation.y = seconds * 0.003;
    projectionLights.forEach((light, index) => {
      light.intensity = 7.2 + Math.sin(seconds * Math.PI / 3 + index * Math.PI / 2) * 0.8;
    });
  };
  group.userData.dispose = () => {
    if (disposed) return;
    disposed = true;
    group.visible = false;
    holograms.userData.dispose();
    group.traverse((object) => { if (object.isInstancedMesh) object.dispose(); });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((mat) => mat.dispose());
    textures.forEach((map) => map.dispose());
    lights.forEach((light) => light.dispose());
  };
  return group;
}
