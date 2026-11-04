import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const REALITY_CHEST = Object.freeze({ x: -8.5, z: -8.2, hx: .39, hz: .53, height: .69, reach: 1.65 });
export const CONTAINED_GLASSES_POSITION = Object.freeze({ x: REALITY_CHEST.x, y: .43, z: REALITY_CHEST.z });
export function chestBlocksMovement(x, z, radius = .46) {
  return Math.abs(x - REALITY_CHEST.x) < REALITY_CHEST.hx + radius && Math.abs(z - REALITY_CHEST.z) < REALITY_CHEST.hz + radius;
}

function walnutTexture() {
  const w = 512, h = 256, pixels = new Uint8Array(w * h * 4);
  let seed = 811;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h;
    const knot = Math.exp(-((u - .67) ** 2 * 55 + (v - .46) ** 2 * 90));
    const grain = v * 150 + 2.1 * Math.sin(u * 9 + v * 5) + knot * 13;
    const darkGrain = Math.pow(.5 + .5 * Math.sin(grain * 3.1), 14);
    const value = 1 + .15 * Math.sin(grain) - darkGrain * .24 - knot * .3 + (random() - .5) * .1;
    const offset = (y * w + x) * 4;
    pixels[offset] = 117 * value; pixels[offset + 1] = 67 * value; pixels[offset + 2] = 36 * value; pixels[offset + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, w, h, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true; texture.needsUpdate = true;
  return texture;
}

export function createHalloweenGlassesChest(scene) {
  const root = new THREE.Group(); root.name = "Halloween / Reality glasses chest";
  root.position.set(REALITY_CHEST.x, 0, REALITY_CHEST.z);
  // The lock faces the open side aisle at the back of the store.
  root.rotation.y = Math.PI / 2;
  scene.add(root);
  const woodMap = walnutTexture();
  const wood = new THREE.MeshStandardMaterial({ color: 0xffffff, map: woodMap, bumpMap: woodMap, bumpScale: .005, roughness: .68 });
  const brass = new THREE.MeshStandardMaterial({ color: 0x987344, metalness: .8, roughness: .4 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x302a29, metalness: .65, roughness: .58 });
  const lining = new THREE.MeshStandardMaterial({ color: 0x261d2c, roughness: 1 });
  const black = new THREE.MeshStandardMaterial({ color: 0x08070a, roughness: .9 });
  const unitBox = new RoundedBoxGeometry(1, 1, 1, 2, .035);
  const buckets = new Map();
  function part(parent, geometry, material, position, scale = [1, 1, 1], rotation = [0, 0, 0]) {
    const transform = new THREE.Object3D(); transform.position.set(...position); transform.scale.set(...scale); transform.rotation.set(...rotation); transform.updateMatrix();
    const copy = (geometry.index ? geometry.toNonIndexed() : geometry.clone()).applyMatrix4(transform.matrix);
    if (!buckets.has(parent)) buckets.set(parent, new Map());
    const materials = buckets.get(parent);
    if (!materials.has(material)) materials.set(material, []);
    materials.get(material).push(copy);
  }
  const box = (parent, material, size, position) => part(parent, unitBox, material, position, size);
  // Separate slats, mitred-looking corner posts, feet and a solid bottom; never a solid cube hiding the contents.
  box(root, wood, [1.04, .08, .72], [0, .12, 0]);
  for (const x of [-.43, .43]) for (const z of [-.27, .27]) box(root, darkMetal, [.13, .08, .13], [x, .04, z]);
  for (const y of [.23, .38, .51]) {
    for (const z of [-.32, .32]) box(root, wood, [1, .13, .065], [0, y, z]);
    for (const x of [-.47, .47]) box(root, wood, [.065, .13, .58], [x, y, 0]);
  }
  box(root, lining, [.87, .05, .55], [0, .295, 0]);
  // Velvet insert with two shallow pads cradling the lenses.
  for (const x of [-.14, .14]) box(root, lining, [.22, .075, .28], [x, .35, 0]);
  for (const x of [-.42, .42]) {
    for (const z of [-.358, .358]) box(root, darkMetal, [.09, .43, .016], [x, .35, z]);
    box(root, brass, [.12, .018, .7], [x, .145, 0]);
  }
  const lid = new THREE.Group(); lid.name = "Reality chest / Hinged lid"; lid.position.set(0, .58, -.34); root.add(lid);
  for (const z of [.09, .25, .41, .57]) box(lid, wood, [1.04, .075, .155], [0, .0375, z]);
  box(lid, lining, [.88, .018, .55], [0, -.006, .33]);
  for (const x of [-.42, .42]) box(lid, darkMetal, [.09, .018, .69], [x, .083, .33]);
  for (const x of [-.32, .32]) {
    const hinge = new THREE.CylinderGeometry(.027, .027, .15, 12);
    part(root, hinge, brass, [x, .575, -.35], [1, 1, 1], [0, 0, Math.PI / 2]); hinge.dispose();
    box(root, brass, [.12, .12, .02], [x, .51, -.358]);
  }
  box(root, brass, [.14, .18, .027], [0, .46, .365]);
  box(lid, brass, [.085, .13, .025], [0, -.015, .694]);
  const keyHole = new THREE.CylinderGeometry(.017, .017, .005, 16);
  part(root, keyHole, black, [0, .47, .381], [1, 1, 1], [Math.PI / 2, 0, 0]); keyHole.dispose();
  box(root, black, [.018, .04, .006], [0, .447, .382]);
  const stud = new THREE.SphereGeometry(.012, 8, 6);
  for (const x of [-.42, .42]) {
    for (const y of [.19, .34, .52]) for (const z of [-.37, .37]) part(root, stud, brass, [x, y, z], [1, 1, .5]);
    for (const z of [.08, .31, .58]) part(lid, stud, brass, [x, .096, z], [1, .5, 1]);
  }
  stud.dispose();
  const handle = new THREE.TorusGeometry(.08, .012, 6, 18, Math.PI);
  for (const x of [-.517, .517]) {
    part(root, handle, brass, [x, .32, 0], [1, 1, 1], [0, Math.PI / 2, Math.PI]);
    for (const z of [-.08, .08]) box(root, brass, [.02, .06, .04], [x, .32, z]);
  }
  handle.dispose();
  // A small inlaid eye on the lid links the box to the key illustration.
  const eye = new THREE.TorusGeometry(.09, .006, 6, 30);
  part(lid, eye, brass, [0, .08, .33], [1.5, .8, 1], [-Math.PI / 2, 0, 0]); eye.dispose();
  const pupil = new THREE.SphereGeometry(.024, 12, 8);
  part(lid, pupil, brass, [0, .083, .33], [1, .22, 1]); pupil.dispose();
  for (const [parent, materials] of buckets) for (const [material, geometries] of materials) {
    const mesh = new THREE.Mesh(mergeGeometries(geometries, false), material);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
    geometries.forEach((geometry) => geometry.dispose());
  }
  unitBox.dispose();
  let opening = 0;
  return {
    root, lid,
    update(dt, open) {
      const goal = open ? 1 : 0;
      opening = THREE.MathUtils.clamp(opening + Math.sign(goal - opening) * Math.min(Math.abs(goal - opening), dt / .72), 0, 1);
      const smooth = opening * opening * (3 - 2 * opening);
      lid.rotation.x = -1.85 * smooth;
      root.updateMatrixWorld(true);
    },
    get accessible() { return opening > .88; },
  };
}
