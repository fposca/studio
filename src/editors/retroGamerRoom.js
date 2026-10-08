import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import woodUrl from "../assets/environments/walnut-texture.png";
import plasterUrl from "../assets/environments/concrete-texture.png";
import plasticUrl from "../assets/environments/plastic-texture.png";
import fabricUrl from "../assets/environments/castle-runner-wool-v1.png";
import oakUrl from "../assets/environments/retro-oak-veneer-v1.png";
import curtainUrl from "../assets/environments/retro-curtain-twill-v1.png";
import metalUrl from "../assets/environments/brushed-metal-texture.png";
import postersUrl from "../assets/environments/retro-gamer-posters-v1.png";
import adventurePostersUrl from "../assets/environments/retro-adventure-posters-v1.png";
import duvetUrl from "../assets/environments/retro-monkey-island-duvet-v1.png";
import { DEFAULT_RETRO_GAMER_LIGHTING, RETRO_GAMER_LIGHTING_MODES, normalizeRetroGamerLighting } from "./retroGamerLighting.js";
import { createRetroGamerBookshelfContents } from "./retroGamerBookshelf.js";
import { createRetroGamerBedding } from "./retroGamerBedding.js";
import { drawMonkeyIslandMonitor } from "./retroGamerMonitor.js";

function disposeTree(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  root.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of [object.material].flat().filter(Boolean)) {
      materials.add(material);
      Object.values(material).forEach((value) => { if (value?.isTexture) textures.add(value); });
    }
    if (object.isLight) object.dispose?.();
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((map) => map.dispose());
}

// Keep the set separate from user objects and build it only when this room is selected.
export function createRetroGamerRoom() {
  const room = new THREE.Group();
  room.name = "Cuarto gamer 90s";
  room.userData.editorHelper = true;
  room.visible = false;
  room.userData.lighting = { ...DEFAULT_RETRO_GAMER_LIGHTING };
  let disposed = false;
  let built = false;
  let drawScreen = () => {};
  let drawTvScreen = () => {};
  let tvScreenMap;
  let updateLighting = () => {};
  let lastFrame = -1;
  let powerLed;
  const walls = [];
  const shadowCutaways = [];

  function build() {
    if (built) return;
    built = true;
    const loader = new THREE.TextureLoader();
    const texture = (url, repeat = [1, 1]) => {
      const map = loader.load(url);
      map.colorSpace = THREE.SRGBColorSpace;
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(...repeat);
      map.anisotropy = 16;
      return map;
    };
    const woodMap = texture(woodUrl, [2, 1]);
    const plasterMap = texture(plasterUrl, [4, 2]);
    const plasticMap = texture(plasticUrl, [2, 2]);
    const fabricMap = texture(fabricUrl, [2, 2]);
    const oakMap = texture(oakUrl);
    const oakRelief = oakMap.clone();
    oakRelief.colorSpace = THREE.NoColorSpace;
    const verticalOakMap = oakMap.clone();
    verticalOakMap.center.set(0.5, 0.5);
    verticalOakMap.rotation = Math.PI / 2;
    const verticalOakRelief = verticalOakMap.clone();
    verticalOakRelief.colorSpace = THREE.NoColorSpace;
    const curtainMap = texture(curtainUrl);
    const curtainRelief = curtainMap.clone();
    curtainRelief.colorSpace = THREE.NoColorSpace;
    const metalMap = texture(metalUrl, [2, 2]);
    const standard = (options) => new THREE.MeshStandardMaterial(options);
    const wood = standard({ color: 0xb49c7d, map: woodMap, roughness: 0.67, bumpMap: woodMap, bumpScale: 0.025 });
    const darkWood = standard({ color: 0x534e45, map: woodMap, roughness: 0.8 });
    const plaster = standard({ color: 0xaebeb6, roughness: 0.96, bumpMap: plasterMap, bumpScale: 0.045 });
    const trim = standard({ color: 0xc7c9bb, roughness: 0.72 });
    const beige = standard({ color: 0xc6bea7, roughness: 0.67, bumpMap: plasticMap, bumpScale: 0.008 });
    const lightPlastic = standard({ color: 0xe3ddc8, roughness: 0.6 });
    const charcoal = standard({ color: 0x252b2c, roughness: 0.78 });
    const steel = standard({ color: 0xbfc3bd, map: metalMap, metalness: 0.75, roughness: 0.38 });
    const blueFabric = standard({ color: 0x415975, roughness: 1, bumpMap: fabricMap, bumpScale: 0.03 });
    const oak = new THREE.MeshPhysicalMaterial({ color: 0xe1d6c7, map: oakMap, bumpMap: oakRelief,
      bumpScale: 0.012, roughness: 0.54, clearcoat: 0.22, clearcoatRoughness: 0.45 });
    const verticalOak = oak.clone();
    verticalOak.map = verticalOakMap;
    verticalOak.bumpMap = verticalOakRelief;
    const oakEdge = oak.clone();
    oakEdge.color.set(0xa88d6e);
    const curtainMaterial = new THREE.MeshPhysicalMaterial({ color: 0xf2d5cf, map: curtainMap,
      bumpMap: curtainRelief, bumpScale: 0.018, roughness: 0.97, sheen: 0.8,
      sheenColor: new THREE.Color(0xbe7c73), sheenRoughness: 0.88, side: THREE.DoubleSide });
    const curtainHem = curtainMaterial.clone();
    curtainHem.color.set(0x9c6b63);
    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    const box = (parent, size, position, material, rounded = false) => {
      const mesh = new THREE.Mesh(rounded ? new RoundedBoxGeometry(...size, 2, Math.min(...size) * 0.12) : unitBox, material);
      if (!rounded) mesh.scale.set(...size);
      mesh.position.set(...position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    // World-scale UVs keep veneer grain consistent across wide tops and small drawers.
    const woodPanel = (parent, size, position, material = oak, radius = 0.018) => {
      const geometry = new RoundedBoxGeometry(...size, 2, Math.min(radius, Math.min(...size) * 0.2));
      const positions = geometry.attributes.position, normals = geometry.attributes.normal, uvs = geometry.attributes.uv;
      for (let i = 0; i < positions.count; i += 1) {
        const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
        const nx = Math.abs(normals.getX(i)), ny = Math.abs(normals.getY(i)), nz = Math.abs(normals.getZ(i));
        const u = nx > ny && nx > nz ? z : x;
        const v = ny > nx && ny > nz ? z : y;
        uvs.setXY(i, u / 2.2 + 0.5, v / 2.2 + 0.5);
      }
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.castShadow = mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const cylinder = (parent, radius, height, position, material) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 20), material);
      mesh.position.set(...position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const cable = (parent, coordinates, radius = 0.018) => {
      const curve = new THREE.CatmullRomCurve3(coordinates.map((p) => new THREE.Vector3(...p)));
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 5, false), charcoal);
      parent.add(mesh);
      return mesh;
    };
    const plane = (parent, width, height, position, material) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
      mesh.position.set(...position);
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const emissive = (color, intensity = 1) => standard({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.5 });
    const shadowOnly = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false });
    const keepShadowWhenCutAway = (object, outside) => {
      const proxy = object.clone(true);
      proxy.name = `${object.name} sombra`;
      proxy.traverse((child) => {
        if (child.isMesh) {
          child.material = shadowOnly;
          child.receiveShadow = false;
        }
      });
      proxy.visible = false;
      object.parent.add(proxy);
      shadowCutaways.push({ object, proxy, outside });
    };
    const label = (parent, text, width, height, position, foreground = "#253335", background = "#d5d1b8") => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, 512, 128);
      ctx.fillStyle = foreground;
      ctx.font = "bold 54px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 256, 66, 480);
      const map = new THREE.CanvasTexture(canvas);
      map.colorSpace = THREE.SRGBColorSpace;
      return plane(parent, width, height, position, standard({ map, roughness: 0.9 }));
    };

    const floor = plane(room, 14, 14, [0, -0.005, -1], wood);
    floor.rotation.x = -Math.PI / 2;
    for (let x = -6.5; x < 7; x += 0.65) {
      box(room, [0.012, 0.003, 14], [x, -0.002, -1], darkWood);
    }
    // Single-sided walls and no front wall keep the editor camera unobstructed.
    const back = new THREE.Group();
    back.position.z = -8;
    room.add(back);
    const backSurface = new THREE.Group();
    back.add(backSurface);
    walls.push({ group: backSurface, outside: (camera) => camera.position.z < -8 });
    const left = new THREE.Group();
    left.position.set(-7, 0, -1);
    left.rotation.y = Math.PI / 2;
    room.add(left);
    const leftSurface = new THREE.Group();
    left.add(leftSurface);
    walls.push({ group: leftSurface, outside: (camera) => camera.position.x < -7 });
    const right = new THREE.Group();
    right.position.set(7, 0, -1);
    right.rotation.y = -Math.PI / 2;
    room.add(right);
    const rightSurface = new THREE.Group();
    right.add(rightSurface);
    walls.push({ group: rightSurface, outside: (camera) => camera.position.x > 7 });
    for (const wall of [backSurface, leftSurface, rightSurface]) {
      plane(wall, 14, 6.5, [0, 3.25, 0], plaster);
      box(wall, [14, 0.2, 0.12], [0, 0.1, 0.07], trim).castShadow = false;
      box(wall, [14, 0.16, 0.15], [0, 6.35, 0.08], trim).castShadow = false;
      box(wall, [14, 0.05, 0.05], [0, 1.15, 0.045], darkWood).castShadow = false;
    }
    const ceiling = plane(room, 14, 14, [0, 6.5, -1], trim);
    ceiling.rotation.x = Math.PI / 2;
    walls.push({ group: ceiling, outside: (camera) => camera.position.y > 6.5 });

    const poster = (parent, index, position, width = 2.25, angle = 0, url = postersUrl, name = "Afiche") => {
      const map = texture(url);
      map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
      map.repeat.set(0.498, 0.998);
      map.offset.set(index * 0.5 + 0.001, 0.001);
      const group = new THREE.Group();
      group.name = name;
      group.position.set(...position);
      group.rotation.z = angle;
      parent.add(group);
      const height = width * 1.5;
      box(group, [width + 0.025, height + 0.025, 0.012], [0, 0, 0], charcoal);
      plane(group, width, height, [0, 0, 0.01], standard({ map, roughness: 0.93 }));
      for (const sign of [-1, 1]) box(group, [0.25, 0.12, 0.01], [sign * width * 0.4, height * 0.49, 0.025], trim).rotation.z = sign * 0.18;
      return group;
    };
    for (const group of [
      poster(back, 0, [-3.5, 4.25, 0.035], 2.4, -0.035),
      poster(back, 1, [0.25, 4.3, 0.035], 2.2, 0.025)
    ]) keepShadowWhenCutAway(group, (camera) => camera.position.z < -8);
    for (const group of [
      poster(left, 0, [4, 4.05, 0.035], 1.8, -0.04, adventurePostersUrl, "Afiche Maniac Mansion"),
      poster(left, 1, [1.45, 4.05, 0.035], 1.9, 0.025, adventurePostersUrl, "Afiche Monkey Island")
    ]) keepShadowWhenCutAway(group, (camera) => camera.position.x < -7);

    const desk = new THREE.Group();
    desk.name = "PC retro y escritorio";
    desk.position.set(-1.6, 0, -6.25);
    room.add(desk);
    woodPanel(desk, [6.4, 0.17, 2.35], [0, 1.58, 0]).name = "Tablero de roble del escritorio";
    woodPanel(desk, [6.34, 0.035, 0.055], [0, 1.54, 1.174], oakEdge, 0.006);
    woodPanel(desk, [1.12, 1.45, 2.05], [-2.55, 0.73, 0], verticalOak);
    for (let i = 0; i < 3; i += 1) {
      box(desk, [1.045, 0.403, 0.025], [-2.55, 0.34 + i * 0.43, 1.03], charcoal);
      woodPanel(desk, [1.01, 0.374, 0.07], [-2.55, 0.34 + i * 0.43, 1.065]);
      for (const x of [-2.69, -2.41]) {
        box(desk, [0.04, 0.055, 0.09], [x, 0.4 + i * 0.43, 1.135], steel, true);
      }
      box(desk, [0.35, 0.04, 0.045], [-2.55, 0.4 + i * 0.43, 1.18], steel, true);
    }
    for (const z of [-0.85, 0.85]) {
      box(desk, [0.15, 1.5, 0.15], [2.85, 0.75, z], steel);
      box(desk, [0.18, 0.08, 0.18], [2.85, 0.04, z], charcoal, true);
    }
    woodPanel(desk, [5.1, 0.45, 0.12], [0.45, 1.15, -0.9]);
    cylinder(desk, 0.11, 0.025, [1.9, 1.677, -0.88], charcoal);
    const notebook = woodPanel(desk, [0.68, 0.055, 0.92], [-2.55, 1.7, 0.5], blueFabric, 0.012);
    notebook.rotation.y = -0.16;
    const pages = box(desk, [0.64, 0.026, 0.89], [-2.55, 1.736, 0.5], trim);
    pages.rotation.y = notebook.rotation.y;
    for (let i = 0; i < 8; i += 1) {
      const binding = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.009, 5, 10), steel);
      binding.rotation.x = Math.PI / 2;
      binding.position.set(-2.92 + i * 0.017, 1.75, 0.2 + i * 0.085);
      desk.add(binding);
    }

    const monitor = new THREE.Group();
    monitor.name = "Monitor CRT";
    monitor.position.set(-0.65, 1.69, -0.27);
    desk.add(monitor);
    box(monitor, [1.14, 0.12, 0.84], [0, 0, 0.1], beige, true);
    cylinder(monitor, 0.29, 0.18, [0, 0.12, 0.04], beige);
    box(monitor, [1.76, 1.39, 1.2], [0, 0.94, -0.08], beige, true);
    box(monitor, [1.51, 1.11, 0.085], [0, 0.97, 0.549], charcoal, true);
    const screenCanvas = document.createElement("canvas");
    screenCanvas.width = 640;
    screenCanvas.height = 480;
    const ctx = screenCanvas.getContext("2d");
    const screenMap = new THREE.CanvasTexture(screenCanvas);
    tvScreenMap = screenMap;
    screenMap.colorSpace = THREE.SRGBColorSpace;
    screenMap.anisotropy = 8;
    const monkeyCanvas = document.createElement("canvas");
    monkeyCanvas.width = 160;
    monkeyCanvas.height = 120;
    const monkeyCtx = monkeyCanvas.getContext("2d");
    const monitorCanvas = document.createElement("canvas");
    monitorCanvas.width = 640;
    monitorCanvas.height = 480;
    const monitorCtx = monitorCanvas.getContext("2d");
    const monitorMap = new THREE.CanvasTexture(monitorCanvas);
    monitorMap.colorSpace = THREE.SRGBColorSpace;
    monitorMap.anisotropy = 8;
    const screenMaterial = new THREE.MeshBasicMaterial({ map: monitorMap, toneMapped: false });
    const screenGeometry = new THREE.PlaneGeometry(1.36, 0.97, 20, 16);
    const positions = screenGeometry.attributes.position;
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i) / 0.68, y = positions.getY(i) / 0.485;
      positions.setZ(i, 0.045 * (1 - x * x) * (1 - y * y));
    }
    screenGeometry.computeVertexNormals();
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 0.99, 0.597);
    monitor.add(screen);
    label(monitor, "MULTISYNC", 0.48, 0.07, [-0.37, 0.335, 0.535]);
    box(monitor, [0.12, 0.055, 0.045], [0.65, 0.34, 0.55], charcoal);
    const greenLed = emissive(0x88e678, 1.3);
    powerLed = box(monitor, [0.035, 0.025, 0.016], [0.51, 0.34, 0.565], greenLed);
    for (let i = 0; i < 9; i += 1) box(monitor, [0.52, 0.023, 0.018], [0, 1.25 - i * 0.075, -0.691], charcoal);

    const tower = new THREE.Group();
    tower.position.set(1.22, 1.69, -0.16);
    desk.add(tower);
    box(tower, [0.8, 1.49, 1.36], [0, 0.75, 0], beige, true);
    for (const y of [1.28, 1.05]) {
      box(tower, [0.65, 0.19, 0.035], [0, y, 0.69], lightPlastic);
      box(tower, [0.49, 0.03, 0.02], [-0.02, y + 0.015, 0.712], charcoal);
      box(tower, [0.055, 0.025, 0.02], [0.25, y - 0.05, 0.716], charcoal);
    }
    label(tower, "486 DX2", 0.3, 0.09, [-0.13, 0.77, 0.707]);
    label(tower, "66", 0.15, 0.08, [0.21, 0.72, 0.708], "#a5ef93", "#182020");
    box(tower, [0.13, 0.1, 0.02], [0.2, 0.51, 0.711], lightPlastic, true);
    for (let i = 0; i < 7; i += 1) box(tower, [0.5, 0.023, 0.015], [0, 0.12 + i * 0.042, 0.708], charcoal);

    const keyboard = new THREE.Group();
    keyboard.position.set(-0.65, 1.73, 0.77);
    keyboard.rotation.x = 0.07;
    desk.add(keyboard);
    box(keyboard, [1.95, 0.12, 0.66], [0, 0, 0], beige, true);
    for (let row = 0; row < 5; row += 1) {
      for (let key = 0; key < 15; key += 1) {
        if (row === 4 && key > 2 && key < 9) continue;
        box(keyboard, [0.101, 0.046, 0.09], [-0.86 + key * 0.123, 0.081, -0.245 + row * 0.119], row === 0 || key > 11 ? beige : lightPlastic);
      }
    }
    box(keyboard, [0.72, 0.045, 0.09], [-0.12, 0.081, 0.232], lightPlastic);
    box(desk, [0.67, 0.016, 0.66], [0.96, 1.68, 0.7], blueFabric);
    box(desk, [0.25, 0.12, 0.36], [0.95, 1.76, 0.7], beige, true);
    box(desk, [0.008, 0.008, 0.13], [0.95, 1.823, 0.61], charcoal);
    cable(desk, [[0.95, 1.72, 0.51], [0.95, 1.7, 0.23], [0.55, 1.7, 0.1], [0.75, 1.7, -0.9]]);
    cable(desk, [[-0.65, 1.7, 0.4], [-1.2, 1.7, 0.12], [-1.4, 1.7, -1.1], [-1.4, 0.2, -1.2], [1.2, 0.12, -1.2]]);
    for (const x of [-2.08, 2.23]) {
      box(desk, [0.45, 0.8, 0.46], [x, 2.07, -0.18], beige, true);
      box(desk, [0.33, 0.56, 0.018], [x, 2.12, 0.059], charcoal, true);
      for (const y of [2.0, 2.25]) {
        const speaker = cylinder(desk, 0.105, 0.017, [x, y, 0.078], steel);
        speaker.rotation.x = Math.PI / 2;
      }
    }
    for (let i = 0; i < 3; i += 1) {
      const disk = new THREE.Group();
      disk.position.set(2.55 + i * 0.04, 1.68 + i * 0.024, 0.73 - i * 0.06);
      disk.rotation.y = i * 0.22;
      desk.add(disk);
      box(disk, [0.3, 0.024, 0.31], [0, 0, 0], i === 1 ? blueFabric : charcoal);
      box(disk, [0.21, 0.003, 0.12], [0, 0.014, 0.075], trim);
      box(disk, [0.17, 0.004, 0.1], [0, 0.014, -0.08], steel);
    }

    const shelf = new THREE.Group();
    shelf.name = "Biblioteca gamer";
    shelf.position.set(4.2, 0, -7.25);
    room.add(shelf);
    for (const x of [-1.35, 1.35]) woodPanel(shelf, [0.12, 4.4, 0.92], [x, 2.2, 0], verticalOak);
    box(shelf, [2.7, 4.4, 0.055], [0, 2.2, -0.43], darkWood);
    for (const y of [0.18, 1.18, 2.2, 3.22, 4.38]) woodPanel(shelf, [2.7, 0.1, 0.92], [0, y, 0]);
    shelf.add(createRetroGamerBookshelfContents({ clothMap: fabricMap, postersMap: texture(postersUrl) }));

    const wardrobe = new THREE.Group();
    wardrobe.name = "Placard de roble";
    wardrobe.position.set(-6.96, 0, 4.15);
    wardrobe.rotation.y = Math.PI / 2;
    room.add(wardrobe);
    woodPanel(wardrobe, [3.18, 4.9, 1.35], [0, 2.65, 0.78], verticalOak);
    woodPanel(wardrobe, [3.34, 0.2, 1.49], [0, 0.2, 0.8], oakEdge);
    woodPanel(wardrobe, [3.36, 0.16, 1.52], [0, 5.12, 0.8]);
    woodPanel(wardrobe, [3.27, 0.07, 1.46], [0, 4.99, 0.8], oakEdge);
    box(wardrobe, [3.05, 4.59, 0.02], [0, 2.63, 1.463], charcoal);
    for (const side of [-1, 1]) {
      const x = side * 0.768;
      woodPanel(wardrobe, [1.49, 3.53, 0.09], [x, 3.18, 1.53], verticalOak);
      woodPanel(wardrobe, [1.22, 3.24, 0.026], [x, 3.18, 1.585], verticalOak);
      for (const edge of [-1, 1]) {
        woodPanel(wardrobe, [0.085, 3.47, 0.1], [x + edge * 0.7, 3.18, 1.58], verticalOak, 0.008);
        woodPanel(wardrobe, [1.32, 0.09, 0.1], [x, 3.18 + edge * 1.72, 1.58], oak, 0.008);
      }
      const handleX = side * 0.17;
      cylinder(wardrobe, 0.027, 0.42, [handleX, 2.96, 1.78], steel);
      for (const y of [2.78, 3.14]) {
        const mount = cylinder(wardrobe, 0.026, 0.16, [handleX, y, 1.7], steel);
        mount.rotation.x = Math.PI / 2;
      }
      for (const y of [1.75, 4.57]) {
        const hinge = cylinder(wardrobe, 0.025, 0.15, [side * 1.48, y, 1.63], steel);
        hinge.name = "Bisagra del placard";
      }
    }
    for (const y of [0.59, 1.05]) {
      woodPanel(wardrobe, [2.99, 0.4, 0.095], [0, y, 1.52]);
      for (const x of [-0.9, 0.9]) {
        for (const offset of [-0.14, 0.14]) box(wardrobe, [0.035, 0.035, 0.1], [x + offset, y, 1.63], steel);
        box(wardrobe, [0.33, 0.035, 0.035], [x, y, 1.7], steel, true);
      }
    }
    woodPanel(wardrobe, [3.12, 0.08, 0.13], [0, 1.33, 1.56], oakEdge);
    keepShadowWhenCutAway(wardrobe, (camera) => camera.position.x < -7);

    const bed = new THREE.Group();
    bed.name = "Cama gamer";
    bed.position.set(5.4, 0, -1.1);
    room.add(bed);
    woodPanel(bed, [2.6, 0.6, 4.4], [0, 0.38, 0]);
    woodPanel(bed, [2.7, 1.9, 0.15], [0, 1.05, -2.15], verticalOak);
    bed.add(createRetroGamerBedding({ printMap: texture(duvetUrl), clothMap: fabricMap }));

    const tvSet = new THREE.Group();
    tvSet.name = "TV retro frente a la cama";
    tvSet.position.set(5.25, 0, 3.7);
    tvSet.rotation.y = Math.PI;
    room.add(tvSet);
    const modelLoader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const fitModel = (root, width, floorY) => {
      root.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(root);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = width / size.x;
      root.scale.multiplyScalar(scale);
      root.position.set(-center.x * scale, floorY - bounds.min.y * scale, -center.z * scale);
      root.traverse((item) => {
        if (item.isMesh) { item.castShadow = true; item.receiveShadow = true; }
      });
      return size.multiplyScalar(scale);
    };
    room.userData.tvReady = Promise.allSettled([
      import("../assets/neonboy-animaciones/mesaTv.optimized.glb?url"),
      import("../assets/neonboy-animaciones/retro-tv.optimized.glb?url")
    ].map(async (urlModule) => modelLoader.loadAsync((await urlModule).default)))
      .then((results) => {
        const roots = results.filter((result) => result.status === "fulfilled").map((result) => result.value.scene);
        if (disposed || results.some((result) => result.status === "rejected")) {
          roots.forEach(disposeTree);
          if (!disposed) console.error("No se pudo cargar la TV del cuarto", results.find((result) => result.status === "rejected").reason);
          return;
        }
        const [table, tv] = roots;
        table.name = "Mueble de TV";
        tv.name = "Televisor retro";
        const tableSize = fitModel(table, 2.9, 0);
        const tvSize = fitModel(tv, 2.15, tableSize.y + 0.02);
        tvSet.add(table, tv);
        const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(tvSize.x * 0.63, tvSize.y * 0.62),
          new THREE.MeshBasicMaterial({ map: screenMap, toneMapped: false }));
        tvScreen.name = "Pantalla TV gamer";
        tvScreen.position.set(0, tableSize.y + 0.02 + tvSize.y * 0.57, tvSize.z * 0.508);
        tvSet.add(tvScreen);
        const tvGlow = new THREE.PointLight(0x87adc7, 2, 4, 2);
        tvGlow.position.copy(tvScreen.position).add(new THREE.Vector3(0, 0, 0.2));
        tvSet.add(tvGlow);
      });

    const window = new THREE.Group();
    window.position.set(1.1, 3.7, 0.07);
    right.add(window);
    box(window, [3.3, 2.8, 0.11], [0, 0, 0], darkWood);
    const windowGlass = box(window, [3.04, 2.54, 0.035], [0, 0, 0.08], emissive(0x24445e, 0.5));
    for (const x of [-1.59, 0, 1.59]) box(window, [0.08, 2.8, 0.19], [x, 0, 0.16], trim);
    for (const y of [-1.37, 0, 1.37]) box(window, [3.28, 0.08, 0.2], [0, y, 0.16], trim);
    box(window, [3.5, 0.12, 0.5], [0, -1.45, 0.18], trim);
    for (let i = 0; i < 9; i += 1) box(window, [3.15, 0.08, 0.04], [0, 1.22 - i * 0.115, 0.28], trim).rotation.x = 0.3;
    const curtainRod = cylinder(window, 0.037, 4.85, [0, 1.78, 0.68], steel);
    curtainRod.rotation.z = Math.PI / 2;
    const ringGeometry = new THREE.TorusGeometry(0.073, 0.012, 6, 16);
    const curtainPoint = (u, v, side) => {
      const width = 0.94 + v * 0.2;
      const gather = 0.06 * Math.sin(v * Math.PI);
      const x = side * (1.72 + gather) + (u - 0.5) * width;
      const y = 1.67 - v * 3.86 + Math.sin(u * Math.PI * 9) * 0.026 * v * v;
      const z = 0.65 + Math.sin(u * Math.PI * 10 + Math.sin(v * 3) * 0.25) * (0.09 + v * 0.07);
      return new THREE.Vector3(x, y, z);
    };
    for (const side of [-1, 1]) {
      const geometry = new THREE.PlaneGeometry(1, 1, 64, 28);
      const positions = geometry.attributes.position, uvs = geometry.attributes.uv;
      for (let i = 0; i < positions.count; i += 1) {
        const u = uvs.getX(i), v = 1 - uvs.getY(i);
        const point = curtainPoint(u, v, side);
        positions.setXYZ(i, point.x, point.y, point.z);
        uvs.setXY(i, u * 1.6, (1 - v) * 5.4);
      }
      geometry.computeVertexNormals();
      const cloth = new THREE.Mesh(geometry, curtainMaterial);
      cloth.name = side < 0 ? "Cortina izquierda de tela" : "Cortina derecha de tela";
      cloth.castShadow = cloth.receiveShadow = true;
      window.add(cloth);
      const seam = (pointAt) => {
        const points = Array.from({ length: 49 }, (_, i) => pointAt(i / 48).add(new THREE.Vector3(0, 0, 0.009)));
        const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 64, 0.012, 4, false), curtainHem);
        mesh.name = "Costura de cortina";
        window.add(mesh);
      };
      for (const v of [0.026, 0.967]) seam((u) => curtainPoint(u, v, side));
      for (const u of [0.015, 0.985]) seam((v) => curtainPoint(u, v, side));
      for (let i = 0; i < 6; i += 1) {
        const ring = new THREE.Mesh(ringGeometry, steel);
        ring.position.copy(curtainPoint(i / 5, 0, side));
        ring.position.y = 1.735;
        ring.position.z = 0.68;
        ring.rotation.y = Math.PI / 2;
        window.add(ring);
      }
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.077, 12, 8), steel);
      finial.position.set(side * 2.47, 1.78, 0.68);
      window.add(finial);
      box(window, [0.07, 0.19, 0.59], [side * 2.26, 1.75, 0.385], steel, true);
    }

    const lamp = new THREE.Group();
    lamp.position.set(-4.22, 1.68, -6.7);
    desk.parent.add(lamp);
    cylinder(lamp, 0.29, 0.06, [0, 0, 0], charcoal);
    cable(lamp, [[0, 0.05, 0], [0.12, 0.55, 0], [0.45, 0.87, 0]], 0.03);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.34, 24, 1, true), standard({ color: 0x477266, roughness: 0.46, side: THREE.DoubleSide }));
    shade.position.set(0.45, 0.83, 0);
    lamp.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 8), emissive(0xffd095, 3));
    bulb.position.set(0.45, 0.73, 0);
    lamp.add(bulb);
    const lampLight = new THREE.PointLight(0xffcf8f, 12, 7, 2);
    lampLight.name = "Luz de escritorio gamer";
    lampLight.position.copy(bulb.position);
    lamp.add(lampLight);
    const crtLight = new THREE.PointLight(0x81afcd, 3.5, 5, 2);
    crtLight.position.set(-0.65, 2.65, 0.6);
    desk.add(crtLight);
    const windowLight = new THREE.PointLight(0xa9c8eb, 16, 12, 2);
    windowLight.name = "Luz de ventana gamer";
    windowLight.position.set(5.5, 4, -0.5);
    room.add(windowLight);
    const ceilingLight = new THREE.SpotLight(0xffe3b5, 32, 18, 1.15, 0.85, 2);
    ceilingLight.name = "Luz de techo gamer";
    ceilingLight.position.set(-0.5, 5.7, -2);
    ceilingLight.target.position.set(0, 0, -2);
    ceilingLight.castShadow = true;
    ceilingLight.shadow.mapSize.set(1024, 1024);
    ceilingLight.shadow.bias = -0.001;
    ceilingLight.shadow.normalBias = 0.025;
    room.add(ceilingLight, ceilingLight.target);
    const fixture = cylinder(room, 0.48, 0.12, [-0.5, 6.38, -2], emissive(0xffe9c1, 1));
    fixture.castShadow = false;

    updateLighting = (settings) => {
      const mode = RETRO_GAMER_LIGHTING_MODES.find((entry) => entry.id === settings.period);
      lampLight.intensity = settings.lights ? 12 : 0;
      ceilingLight.intensity = settings.lights ? 32 : 0;
      bulb.material.emissiveIntensity = settings.lights ? 3 : 0;
      fixture.material.emissiveIntensity = settings.lights ? 1 : 0;
      windowLight.color.set(mode.color);
      windowLight.intensity = mode.window;
      windowGlass.material.color.set(mode.color).multiplyScalar(settings.period === "night" ? 0.15 : 0.75);
      windowGlass.material.emissive.copy(windowGlass.material.color);
    };

    drawTvScreen = (seconds) => {
      ctx.fillStyle = "#172026";
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = "#424238";
      ctx.fillRect(0, 215, 640, 205);
      const drift = Math.sin(seconds * 0.28) * 22;
      for (const side of [-1, 1]) {
        ctx.fillStyle = side === -1 ? "#5c665c" : "#3c4948";
        ctx.beginPath();
        ctx.moveTo(side === -1 ? 0 : 640, 0);
        ctx.lineTo(320 + side * 78 + drift, 132);
        ctx.lineTo(320 + side * 78 + drift, 263);
        ctx.lineTo(side === -1 ? 0 : 640, 420);
        ctx.fill();
        ctx.strokeStyle = "#273231";
        ctx.lineWidth = 4;
        for (let i = 1; i < 7; i += 1) {
          ctx.beginPath();
          ctx.moveTo(side === -1 ? 0 : 640, i * 68 - 35);
          ctx.lineTo(320 + side * 78 + drift, 130 + i * 20);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "#9a472d";
      ctx.fillRect(270 + drift, 141, 102, 112);
      ctx.fillStyle = "#d2974d";
      ctx.fillRect(312 + drift, 151, 17, 56);
      const bob = Math.sin(seconds * 3) * 5;
      ctx.fillStyle = "#18232a";
      ctx.fillRect(281, 315 + bob, 80, 106);
      ctx.fillStyle = "#849194";
      ctx.fillRect(305, 283 + bob, 32, 110);
      ctx.fillStyle = "#344c51";
      ctx.fillRect(0, 420, 640, 60);
      ctx.font = "bold 22px monospace";
      ctx.fillStyle = "#e2dfc3";
      ctx.fillText("100%    DOOM     50    100%", 36, 451);
      ctx.font = "12px monospace";
      ctx.fillText("HEALTH          AMMO     ARMOR", 44, 471);
      ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
      for (let y = 0; y < 480; y += 4) ctx.fillRect(0, y, 640, 1);
      screenMap.needsUpdate = true;
    };
    drawScreen = (seconds) => {
      drawMonkeyIslandMonitor(monkeyCtx, seconds);
      monitorCtx.imageSmoothingEnabled = false;
      monitorCtx.drawImage(monkeyCanvas, 0, 0, monitorCanvas.width, monitorCanvas.height);
      monitorCtx.fillStyle = "rgba(0, 0, 0, 0.12)";
      for (let y = 0; y < monitorCanvas.height; y += 4) monitorCtx.fillRect(0, y, monitorCanvas.width, 1);
      monitorMap.needsUpdate = true;
    };
    drawScreen(0);
    drawTvScreen(0);
  }

  room.userData.animate = (time, active, camera, lighting = DEFAULT_RETRO_GAMER_LIGHTING) => {
    room.visible = Boolean(active && !disposed);
    if (!room.visible) return;
    build();
    room.userData.lighting = normalizeRetroGamerLighting(lighting);
    updateLighting(room.userData.lighting);
    for (const wall of walls) wall.group.visible = !wall.outside(camera);
    for (const cutaway of shadowCutaways) {
      const outside = cutaway.outside(camera);
      cutaway.object.visible = !outside;
      cutaway.proxy.visible = outside;
    }
    const frame = Math.floor(time / 100);
    if (frame !== lastFrame) {
      drawScreen(time * 0.001);
      drawTvScreen(time * 0.001);
      powerLed.material.emissiveIntensity = 1.1 + Math.sin(time * 0.004) * 0.15;
      lastFrame = frame;
    }
  };
  room.userData.dispose = () => {
    disposed = true;
    room.visible = false;
    const tvScreenLoaded = Boolean(room.getObjectByName("Pantalla TV gamer"));
    disposeTree(room);
    if (!tvScreenLoaded) tvScreenMap?.dispose();
  };
  return room;
}
