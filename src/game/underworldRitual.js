import * as THREE from "three";
import { addUnderworldSigil } from "./underworldRelics.js";

const BASALT_URL = new URL("../assets/environments/basalt.chapter11.jpg", import.meta.url).href;

const COLORS = {
  memory: { stone: 0xb7bec0, light: 0x9bead9 },
  oblivion: { stone: 0xb5aebd, light: 0xc69af0 },
  rebirth: { stone: 0xc0afa4, light: 0xffbc82 },
};

function weatheredStoneTexture() {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const grain = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const fleck = grain - Math.floor(grain);
      const mottle = Math.sin(x * .14 + Math.sin(y * .07)) * Math.cos(y * .19);
      const vein = Math.abs(Math.sin(x * .095 + y * .12 + Math.sin(y * .045) * 1.7)) < .045;
      const value = Math.max(31, Math.min(127, 64 + fleck * 31 + mottle * 15 - (vein ? 38 : 0)));
      const offset = (y * size + x) * 4;
      data[offset] = value;
      data[offset + 1] = value * .93;
      data[offset + 2] = value * .99;
      data[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function mesh(parent, geometry, material, name, x = 0, y = 0, z = 0) {
  const result = new THREE.Mesh(geometry, material);
  result.name = name;
  result.position.set(x, y, z);
  parent.add(result);
  return result;
}

function horizontalRing(parent, radius, tube, material, name, y) {
  const result = mesh(parent, new THREE.TorusGeometry(radius, tube, 10, 48), material, name, 0, y, 0);
  result.rotation.x = Math.PI / 2;
  return result;
}

function createPedestal(parent, x, id, index, materials) {
  const palette = COLORS[id];
  const root = new THREE.Group();
  root.name = "Altar de " + id;
  root.position.x = x;
  parent.add(root);

  const stone = new THREE.MeshStandardMaterial({
    map: materials.stoneTexture, color: palette.stone,
    roughness: .91, metalness: .04,
    bumpMap: materials.stoneTexture, bumpScale: .058,
  });
  const inlay = new THREE.MeshPhysicalMaterial({
    color: palette.light, roughness: .24, metalness: .47,
    clearcoat: .78, clearcoatRoughness: .15,
    emissive: palette.light, emissiveIntensity: .14,
  });
  const crystalMaterial = new THREE.MeshPhysicalMaterial({
    color: palette.light, metalness: .16, roughness: .1,
    clearcoat: 1, clearcoatRoughness: .05,
    emissive: palette.light, emissiveIntensity: .19,
  });
  const lightLine = new THREE.MeshBasicMaterial({
    color: palette.light, transparent: true, opacity: .42,
    depthWrite: false, toneMapped: false,
  });
  const ringMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xa88972, metalness: .75, roughness: .27,
    clearcoat: .5, clearcoatRoughness: .2,
  });

  mesh(root, new THREE.CylinderGeometry(.6, .65, .16, 12), stone,
    "Basamento de piedra tallada", 0, .04, 0);
  horizontalRing(root, .55, .027, materials.bronze, "Borde inferior de bronce", .11);
  mesh(root, new THREE.CylinderGeometry(.39, .51, 1.01, 12), stone,
    "Columna de basalto erosionado", 0, .64, 0);
  horizontalRing(root, .415, .023, materials.bronze, "Abrazadera inferior", .27);
  horizontalRing(root, .405, .019, materials.bronze, "Abrazadera superior", 1.04);

  const corners = new THREE.InstancedMesh(new THREE.BoxGeometry(.043, .77, .026),
    materials.bronze, 12);
  corners.name = "Estrias metalicas verticales";
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    dummy.position.set(Math.sin(angle) * .424, .66, Math.cos(angle) * .424);
    dummy.rotation.y = angle;
    dummy.updateMatrix();
    corners.setMatrixAt(i, dummy.matrix);
  }
  corners.instanceMatrix.needsUpdate = true;
  root.add(corners);

  const crown = mesh(root, new THREE.CylinderGeometry(.54, .49, .17, 12),
    stone, "Corona de piedra desgastada", 0, 1.23, 0);
  crown.rotation.y = Math.PI / 12;
  horizontalRing(root, .48, .032, materials.polished,
    "Guarnicion exterior cincelada", 1.326);
  horizontalRing(root, .36, .02, inlay, "Inscripcion circular", 1.332);
  mesh(root, new THREE.CylinderGeometry(.33, .33, .01, 32),
    materials.dark, "Cuenco de obsidiana", 0, 1.328, 0);

  const runes = new THREE.InstancedMesh(new THREE.BoxGeometry(.024, .006, .088),
    materials.polished, 16);
  runes.name = "Runas hundidas en la corona";
  for (let i = 0; i < 16; i++) {
    const angle = i * Math.PI / 8;
    dummy.position.set(Math.sin(angle) * .423, 1.336, Math.cos(angle) * .423);
    dummy.rotation.set(0, angle, 0);
    dummy.updateMatrix();
    runes.setMatrixAt(i, dummy.matrix);
  }
  runes.instanceMatrix.needsUpdate = true;
  root.add(runes);

  for (const side of [-1, 1]) {
    const support = mesh(root, new THREE.CylinderGeometry(.034, .047, .49, 10),
      materials.bronze, "Soporte del astrolabio", side * .32, 1.53, -.025);
    support.rotation.z = side * .28;
    mesh(root, new THREE.SphereGeometry(.063, 10, 8), materials.polished,
      "Remache superior", side * .35, 1.75, -.025);
  }

  const facePlate = mesh(root, new THREE.CylinderGeometry(.335, .335, .058, 40),
    materials.dark, "Disco de hierro pavonado", 0, 1.76, -.045);
  facePlate.rotation.x = Math.PI / 2;

  const orbit = new THREE.Group();
  orbit.name = "Aro mecanico grabado";
  orbit.position.y = 1.76;
  root.add(orbit);
  const ring = mesh(orbit, new THREE.TorusGeometry(.39, .048, 12, 56),
    ringMaterial, "Anillo de bronce mecanizado");
  mesh(orbit, new THREE.TorusGeometry(.31, .014, 8, 48),
    lightLine, "Filete luminoso", 0, 0, .065);
  const notches = new THREE.InstancedMesh(new THREE.BoxGeometry(.018, .085, .016),
    materials.polished, 24);
  notches.name = "Marcas de precision del aro";
  for (let i = 0; i < 24; i++) {
    const angle = i * Math.PI / 12;
    dummy.position.set(Math.sin(angle) * .385, Math.cos(angle) * .385, .064);
    dummy.rotation.set(0, 0, -angle);
    dummy.updateMatrix();
    notches.setMatrixAt(i, dummy.matrix);
  }
  notches.instanceMatrix.needsUpdate = true;
  orbit.add(notches);

  const core = mesh(root, new THREE.IcosahedronGeometry(.235, 1),
    crystalMaterial, "Piedra de alma facetada", 0, 1.76, .032);
  core.scale.z = .24;
  const sigil = new THREE.Group();
  sigil.name = "Glifo tallado / " + id;
  sigil.position.set(0, 1.76, .14);
  sigil.scale.setScalar(id === "memory" ? .9 : .69);
  root.add(sigil);
  addUnderworldSigil(sigil, id, {
    metal: materials.bronze, polished: materials.polished,
    inlay, line: lightLine, dark: materials.dark,
  });

  const frontBadge = mesh(root, new THREE.BoxGeometry(.43, .17, .045),
    materials.polished, "Placa frontal de metal", 0, .75, .405);
  frontBadge.rotation.x = -.12;
  mesh(root, new THREE.BoxGeometry(.3, .025, .008), inlay,
    "Marca de la placa", 0, .75, .438);
  for (const side of [-1, 1])
    mesh(root, new THREE.SphereGeometry(.022, 8, 6), materials.dark,
      "Tornillo de la placa", side * .17, .75, .438);

  let wasActive = null;
  return {
    root, ring, core,
    update(elapsed, step, active, reducedMotion) {
      if (active !== wasActive) {
        wasActive = active;
        ringMaterial.color.setHex(active ? 0x65dccc : 0xa88972);
        crystalMaterial.emissiveIntensity = active ? .55 : .19;
        inlay.emissiveIntensity = active ? .32 : .14;
        lightLine.opacity = active ? .8 : .42;
      }
      orbit.rotation.z += step * (active ? .45 : .085);
      core.rotation.y = reducedMotion ? 0 : Math.sin(elapsed * 1.15 + index) * .18;
      sigil.position.y = 1.76 + (reducedMotion ? 0 : Math.sin(elapsed * 1.45 + index) * .012);
    },
  };
}

export function createUnderworldRitual(parent, positions, ids) {
  const root = new THREE.Group();
  root.name = "Mecanismo de las Tres Almas";
  root.position.z = -35.6;
  parent.add(root);
  const stoneTexture = typeof document === "undefined"
    ? weatheredStoneTexture()
    : new THREE.TextureLoader().load(BASALT_URL);
  stoneTexture.wrapS = stoneTexture.wrapT = THREE.RepeatWrapping;
  stoneTexture.colorSpace = THREE.SRGBColorSpace;
  const baseTexture = stoneTexture.clone();
  baseTexture.repeat.set(3, 1.5);
  baseTexture.needsUpdate = true;
  const materials = {
    stoneTexture,
    bronze: new THREE.MeshStandardMaterial({ color: 0x705646, metalness: .7, roughness: .38 }),
    polished: new THREE.MeshPhysicalMaterial({ color: 0xc8ab89, metalness: .73, roughness: .26,
      clearcoat: .38, clearcoatRoughness: .19 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x151015, metalness: .35, roughness: .62 }),
  };
  const baseStone = new THREE.MeshStandardMaterial({
    map: baseTexture, color: 0xc5b9ae, roughness: .94, metalness: .025,
    bumpMap: baseTexture, bumpScale: .055,
  });
  mesh(root, new THREE.BoxGeometry(5.8, .25, 2.8), baseStone,
    "Losa ritual de basalto", -3.25, -.105, 0);
  for (const z of [-1.35, 1.35])
    mesh(root, new THREE.BoxGeometry(5.76, .035, .045), materials.bronze,
      "Filete perimetral de bronce", -3.25, .04, z);
  for (const x of [-6.1, -.4])
    mesh(root, new THREE.BoxGeometry(.045, .035, 2.7), materials.bronze,
      "Filete lateral de bronce", x, .04, 0);
  const rings = positions.map((x, index) => createPedestal(root, x, ids[index], index, materials));
  return { root, rings, dispose() { stoneTexture.dispose(); baseTexture.dispose(); } };
}
