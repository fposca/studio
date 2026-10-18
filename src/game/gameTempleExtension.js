import * as THREE from "three";
import { createGameFire } from "./gameFire.js";

// These dimensions are shared by the masonry and its Rapier colliders.
export const TEMPLE_EXTENSION_COLUMNS = [
  ...[-51, -64, -77, -88].flatMap((z, row) =>
    [-13.4, 13.4].map((x, side) => [x, z, 3.8 + ((row + side) % 3) * 0.7]))
];
export const TEMPLE_EXTENSION_OBSTACLES = [
  ...[-54, -68, -81].flatMap((z) => [
    [-14.9, 0.65, z, 5.2, 1.3, 0.75],
    [14.9, 0.65, z - 2, 5.2, 1.3, 0.75]
  ]),
  [0, 0.95, -62, 2.8, 1.9, 2.8],
  [4.5, 0.55, -74, 3.7, 1.1, 1.25],
  [-4.6, 0.65, -79, 3.5, 1.3, 1.1],
  ...[-5.5, 5.5].map((x) => [x, 2.6, -89, 1.25, 5.2, 1.25]),
  [-18, 0.85, -52, 0.85, 1.7, 0.85],
  [18, 0.85, -52, 0.85, 1.7, 0.85],
  [-18, 0.85, -73, 0.85, 1.7, 0.85],
  [18, 0.85, -73, 0.85, 1.7, 0.85],
  [-18, 0.85, -88, 0.85, 1.7, 0.85],
  [18, 0.85, -88, 0.85, 1.7, 0.85]
];

export const TEMPLE_EXTENSION_DETAIL_COLLIDERS = [
  ...TEMPLE_EXTENSION_COLUMNS.flatMap(([x, z, height]) => [
    [x, 0.13, z, 1.7, 0.26, 1.7],
    [x, height + 0.11, z, 1.45, 0.22, 1.45]
  ]),
  [0, 5.25, -89, 12.4, 0.65, 1.65]
];

export function createGameTempleExtension(parent) {
  const root = new THREE.Group();
  root.name = "Patio posterior del Partenon";
  parent.add(root);
  const map = new THREE.TextureLoader().load(new URL("../assets/environments/parthenon-weathered-stone-v2.png", import.meta.url).href);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(7, 12);
  map.anisotropy = 8;
  const stone = new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: 0.07, color: 0xb4aa99, roughness: 0.94 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x655e55, roughness: 1 });
  const bronze = new THREE.MeshStandardMaterial({ color: 0x806448, metalness: 0.5, roughness: 0.58 });
  const box = new THREE.BoxGeometry(1, 1, 1);
  function block(name, material, x, y, z, width, height, depth) {
    const mesh = new THREE.Mesh(box, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  }
  block("Explanada posterior de piedra", stone, 0, -2.23, -68, 40, 4.5, 50);
  for (let z = -46; z >= -91; z -= 3.2) {
    block("Junta transversal del patio", dark, 0, 0.026, z, 39.4, 0.015, 0.035);
  }
  for (const x of [-16, -11, -6, -1, 4, 9, 14]) {
    block("Junta longitudinal del patio", dark, x, 0.026, -68, 0.035, 0.015, 49.2);
  }
  for (const [x, y, z, width, height, depth] of TEMPLE_EXTENSION_OBSTACLES) {
    block("Ruina solida del patio", stone, x, y, z, width, height, depth);
  }
  const shaft = new THREE.CylinderGeometry(0.58, 0.68, 1, 24);
  for (const [x, z, height] of TEMPLE_EXTENSION_COLUMNS) {
    const column = new THREE.Mesh(shaft, stone);
    column.name = "Columna rota solida";
    column.position.set(x, height / 2, z);
    column.scale.y = height;
    column.castShadow = column.receiveShadow = true;
    root.add(column);
    block("Base de columna", stone, x, 0.13, z, 1.7, 0.26, 1.7);
    block("Capitel erosionado", stone, x, height + 0.11, z, 1.45, 0.22, 1.45);
  }
  block("Dintel del santuario posterior", stone, 0, 5.25, -89, 12.4, 0.65, 1.65);
  for (const x of [-18, 18]) for (const z of [-52, -73, -88]) {
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.29, 0.2, 16), bronze);
    bowl.position.set(x, 1.8, z);
    bowl.castShadow = true;
    root.add(bowl);
  }
  const flames = [-52, -73, -88].flatMap((z, row) => [-18, 18].map((x, side) =>
    createGameFire(root, { x, y: 1.9, z, size: 0.72, intensity: 12, distance: 9, seed: row * 3 + side })));
  return { root, update(time) { flames.forEach((flame) => flame.update(time, 1)); } };
}
