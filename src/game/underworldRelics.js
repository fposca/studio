import * as THREE from "three";

const PALETTES = {
  memory: { metal: 0x6e7778, edge: 0xb6c7c5, light: 0x98f2da, dark: 0x173a3b },
  oblivion: { metal: 0x4d4258, edge: 0xa493ba, light: 0xc07dff, dark: 0x1b1227 },
  rebirth: { metal: 0x765443, edge: 0xd3a56e, light: 0xffa96d, dark: 0x4c1b13 },
};

function patinaTexture(seed) {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = Math.sin((x + seed * 13) * 12.9898 + y * 78.233) * 43758.5453;
      const grain = n - Math.floor(n);
      const wear = Math.sin(x * .21 + seed) * Math.cos(y * .17 - seed);
      const scratch = (x * 7 + y * 11 + seed * 3) % 29 === 0 ? 35 : 0;
      const value = Math.max(68, Math.min(245, 157 + grain * 52 + wear * 18 + scratch));
      const index = (y * size + x) * 4;
      data[index] = data[index + 1] = data[index + 2] = value;
      data[index + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function glowTexture() {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const distance = Math.hypot((x + .5) / size * 2 - 1, (y + .5) / size * 2 - 1);
      const index = (y * size + x) * 4;
      data[index] = data[index + 1] = data[index + 2] = 255;
      data[index + 3] = Math.round(255 * Math.pow(Math.max(0, 1 - distance), 2.4));
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function mesh(parent, geometry, material, name, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.name = name;
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}

function torus(parent, radius, tube, material, name, z = 0) {
  return mesh(parent, new THREE.TorusGeometry(radius, tube, 10, 56), material, name, 0, 0, z);
}

function addBook(face, pageMaterial, inkMaterial) {
  for (const side of [-1, 1]) {
    const leaf = new THREE.Group();
    leaf.position.x = side * .108;
    leaf.rotation.y = side * -.13;
    face.add(leaf);
    mesh(leaf, new THREE.BoxGeometry(.2, .31, .024), pageMaterial, "Folio de metal grabado", 0, 0, .055);
    for (let line = 0; line < 3; line++)
      mesh(leaf, new THREE.BoxGeometry(.12, .011, .005), inkMaterial,
        "Linea inscrita", 0, .085 - line * .085, .072);
  }
  mesh(face, new THREE.CylinderGeometry(.018, .018, .34, 8), inkMaterial,
    "Lomo del libro", 0, 0, .09);
}

function crescentGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(.2, -.37);
  shape.bezierCurveTo(-.23, -.39, -.44, -.1, -.37, .16);
  shape.bezierCurveTo(-.3, .42, -.03, .49, .2, .36);
  shape.bezierCurveTo(-.12, .28, -.22, -.09, .2, -.37);
  return new THREE.ExtrudeGeometry(shape, {
    depth: .04, bevelEnabled: true, bevelThickness: .014, bevelSize: .012,
    bevelSegments: 2, curveSegments: 14,
  });
}

function addVoid(face, shellMaterial, lightMaterial) {
  mesh(face, new THREE.SphereGeometry(.265, 24, 16), shellMaterial,
    "Nucleo de obsidiana", 0, 0, .065);
  mesh(face, crescentGeometry(), lightMaterial,
    "Luna vacia tallada", 0, 0, .24);
  mesh(face, new THREE.IcosahedronGeometry(.045, 1), lightMaterial,
    "Ultima memoria", .1, .02, .32);
}

function flameGeometry(scale = 1) {
  const shape = new THREE.Shape();
  shape.moveTo(0, -.32 * scale);
  shape.bezierCurveTo(-.24 * scale, -.2 * scale, -.34 * scale, .05 * scale, -.11 * scale, .27 * scale);
  shape.bezierCurveTo(-.12 * scale, .08 * scale, .035 * scale, .16 * scale, .07 * scale, .4 * scale);
  shape.bezierCurveTo(.32 * scale, .12 * scale, .33 * scale, -.16 * scale, 0, -.32 * scale);
  return new THREE.ExtrudeGeometry(shape, {
    depth: .035, bevelEnabled: true, bevelThickness: .012, bevelSize: .012,
    bevelSegments: 1, curveSegments: 10,
  });
}

function addFlame(face, copperMaterial, emberMaterial) {
  mesh(face, flameGeometry(1.25), copperMaterial, "Fenix tallado", 0, -.015, .035);
  mesh(face, flameGeometry(.68), emberMaterial, "Corazon de brasa", 0, -.085, .105);
  mesh(face, new THREE.IcosahedronGeometry(.075, 1), emberMaterial,
    "Semilla del renacimiento", 0, -.12, .17);
}

export function addUnderworldSigil(face, id, materials) {
  if (id === "memory") addBook(face, materials.polished, materials.line);
  else if (id === "oblivion") addVoid(face, materials.dark, materials.inlay);
  else addFlame(face, materials.metal, materials.inlay);
}

export function createUnderworldRelic(config, index) {
  const palette = PALETTES[config.id];
  const patina = patinaTexture(index + 1);
  const glow = glowTexture();
  const metal = new THREE.MeshStandardMaterial({
    color: palette.metal, metalness: .64, roughness: .39,
    bumpMap: patina, bumpScale: .018, side: THREE.DoubleSide,
  });
  const polished = new THREE.MeshStandardMaterial({
    color: palette.edge, metalness: .53, roughness: .25,
    emissive: palette.dark, emissiveIntensity: .22,
    bumpMap: patina, bumpScale: .006,
  });
  const blackened = new THREE.MeshStandardMaterial({
    color: palette.dark, metalness: .36, roughness: .57,
    bumpMap: patina, bumpScale: .025,
  });
  const crystal = new THREE.MeshPhysicalMaterial({
    color: palette.light, metalness: .13, roughness: .13,
    clearcoat: 1, clearcoatRoughness: .06,
    emissive: palette.light, emissiveIntensity: .34,
  });
  const inlay = new THREE.MeshPhysicalMaterial({
    color: palette.light, metalness: .55, roughness: .25,
    clearcoat: .68, clearcoatRoughness: .14,
    bumpMap: patina, bumpScale: .008,
    emissive: palette.light, emissiveIntensity: .12,
  });
  const lineMaterial = new THREE.MeshBasicMaterial({
    color: palette.light, transparent: true, opacity: .8,
    depthWrite: false, toneMapped: false,
  });
  const groundMaterial = new THREE.MeshBasicMaterial({
    color: palette.light, transparent: true, opacity: .48,
    depthWrite: false, blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide, toneMapped: false,
  });

  const root = new THREE.Group();
  root.name = "Relic / " + config.id;
  root.position.set(config.x, 0, config.z);
  root.visible = false;

  mesh(root, new THREE.CylinderGeometry(.68, .74, .055, 16),
    blackened, "Zocalo de basalto", 0, .027, 0);
  const floorRing = mesh(root, new THREE.RingGeometry(.72, .81, 48),
    groundMaterial, "Halo de lectura", 0, .065, 0);
  floorRing.rotation.x = -Math.PI / 2;
  const floorLine = mesh(root, new THREE.RingGeometry(.52, .545, 48),
    lineMaterial, "Sello interior", 0, .07, 0);
  floorLine.rotation.x = -Math.PI / 2;

  const beam = mesh(root, new THREE.CylinderGeometry(.025, .095, 1.52, 12, 1, true),
    new THREE.MeshBasicMaterial({
      color: palette.light, transparent: true, opacity: .09,
      depthWrite: false, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide, toneMapped: false,
    }), "Luz entre la reliquia y el suelo", 0, .83, 0);

  const hover = new THREE.Group();
  hover.name = "Relicario suspendido";
  hover.position.y = 1.8;
  root.add(hover);

  const aura = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glow, color: palette.light, transparent: true, opacity: .58,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  aura.name = "Resplandor suave";
  aura.scale.set(1.9, 1.9, 1);
  aura.position.z = -.16;
  hover.add(aura);

  const backing = mesh(hover, new THREE.CylinderGeometry(.47, .47, .105, 48),
    blackened, "Medallon de hierro envejecido", 0, 0, -.025);
  backing.rotation.x = Math.PI / 2;
  torus(hover, .56, .063, metal, "Borde exterior cincelado");
  torus(hover, .465, .023, polished, "Filete de metal pulido", .075);
  torus(hover, .367, .015, lineMaterial, "Filamento de energia", .085);

  const dummy = new THREE.Object3D();
  const stud = new THREE.InstancedMesh(new THREE.SphereGeometry(.027, 8, 6), polished, 24);
  stud.name = "Remaches de metal";
  for (let i = 0; i < 24; i++) {
    const angle = (i % 12) * Math.PI / 6;
    dummy.position.set(Math.cos(angle) * .506, Math.sin(angle) * .506, i < 12 ? .073 : -.073);
    dummy.updateMatrix();
    stud.setMatrixAt(i, dummy.matrix);
  }
  stud.instanceMatrix.needsUpdate = true;
  hover.add(stud);

  const engraving = new THREE.InstancedMesh(new THREE.BoxGeometry(.013, .061, .009),
    polished, 40);
  engraving.name = "Marcas radiales grabadas";
  for (let i = 0; i < 40; i++) {
    const angle = (i % 20) * Math.PI / 10;
    dummy.position.set(Math.cos(angle) * .412, Math.sin(angle) * .412, i < 20 ? .095 : -.095);
    dummy.rotation.z = angle - Math.PI / 2;
    dummy.updateMatrix();
    engraving.setMatrixAt(i, dummy.matrix);
  }
  engraving.instanceMatrix.needsUpdate = true;
  hover.add(engraving);

  const gem = mesh(hover, new THREE.IcosahedronGeometry(.235, 1), crystal,
    "Cristal tallado", 0, 0, .045);
  gem.scale.z = .18;
  gem.rotation.set(.02, .04, .12);

  for (const direction of [1, -1]) {
    const face = new THREE.Group();
    face.name = direction === 1 ? "Cara frontal" : "Cara posterior";
    face.position.z = direction * .105;
    if (direction === -1) face.rotation.y = Math.PI;
    hover.add(face);
    addUnderworldSigil(face, config.id, { metal, polished, inlay, line: lineMaterial, dark: blackened });
  }

  return {
    root,
    update(elapsed, reducedMotion = false) {
      hover.position.y = 1.8 + (reducedMotion ? 0 : Math.sin(elapsed * 1.65 + index) * .085);
      hover.rotation.y = reducedMotion ? 0 : Math.sin(elapsed * .58 + index) * .23;
      gem.rotation.z = reducedMotion ? .12 : .12 + Math.sin(elapsed * .9 + index) * .08;
      groundMaterial.opacity = reducedMotion ? .48 : .43 + Math.sin(elapsed * 2.1 + index) * .08;
      beam.material.opacity = reducedMotion ? .09 : .075 + Math.sin(elapsed * 2.1 + index) * .02;
      aura.material.opacity = reducedMotion ? .58 : .52 + Math.sin(elapsed * 1.7 + index) * .08;
    },
    dispose() {
      patina.dispose();
      glow.dispose();
    },
  };
}
