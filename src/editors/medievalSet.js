import * as THREE from "three";
import stoneTextureUrl from "../assets/environments/medieval-apocalypse-floor-texture.png";
import woodTextureUrl from "../assets/environments/walnut-texture.png";

function seededRandom(seed) {
  return () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function medievalGroundHeight(x, z) {
  const away = THREE.MathUtils.smoothstep(Math.hypot(x, z), 5, 20);
  const irregular = Math.sin(x * 0.27 + Math.sin(z * 0.16)) * 0.09
    + Math.cos(z * 0.34 - x * 0.11) * 0.07
    + Math.sin(x * 0.73 + z * 0.49) * 0.025;
  const rut = Math.exp(-((Math.abs(x) - 2.5) ** 2) / 0.28) * 0.055;
  return away * (irregular - rut);
}

export function createMedievalTerrainGeometry() {
  const geometry = new THREE.PlaneGeometry(280, 280, 192, 192);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    positions.setZ(index, medievalGroundHeight(positions.getX(index), -positions.getY(index)));
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function addBlock(group, geometry, material, position, scale, rotation = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.rotation.y = rotation;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

export function createMedievalSet() {
  const group = new THREE.Group();
  group.name = "Ruinas de batalla medieval";
  group.userData.editorHelper = true;
  group.visible = false;
  let built = false;
  let stoneTexture;
  let woodTexture;
  let stone;
  let timber;
  let cloth;
  let cartWood;
  let agedWood;
  let currentVariant;
  const banners = [];

  group.userData.build = () => {
    if (built) return;
    built = true;
    const random = seededRandom(71837);
    stoneTexture = new THREE.TextureLoader().load(stoneTextureUrl);
    stoneTexture.colorSpace = THREE.SRGBColorSpace;
    stoneTexture.wrapS = stoneTexture.wrapT = THREE.RepeatWrapping;
    stoneTexture.anisotropy = 8;
    woodTexture = new THREE.TextureLoader().load(woodTextureUrl);
    woodTexture.colorSpace = THREE.SRGBColorSpace;
    woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(2, 1);
    woodTexture.anisotropy = 8;
    stone = new THREE.MeshLambertMaterial({ map: stoneTexture, bumpMap: stoneTexture,
      bumpScale: 0.04, color: 0xf1e7da });
    timber = new THREE.MeshStandardMaterial({ color: 0x624a3b, roughness: 1, metalness: 0 });
    cartWood = new THREE.MeshStandardMaterial({ map: woodTexture, bumpMap: woodTexture,
      bumpScale: 0.025, color: 0xd6c5b0, roughness: 1, metalness: 0 });
    agedWood = new THREE.MeshStandardMaterial({ map: woodTexture, bumpMap: woodTexture,
      bumpScale: 0.035, color: 0xb5a08b, roughness: 1, metalness: 0 });
    const iron = new THREE.MeshStandardMaterial({ color: 0x272522, roughness: 0.94, metalness: 0.36 });
    cloth = new THREE.MeshStandardMaterial({ color: 0x4f2424, side: THREE.DoubleSide,
      roughness: 1, metalness: 0 });
    const box = new THREE.BoxGeometry(1, 1, 1);
    const rock = new THREE.DodecahedronGeometry(1, 0);
    const stake = new THREE.CylinderGeometry(0.035, 0.09, 1.7, 5);
    const wheelRim = new THREE.TorusGeometry(0.54, 0.075, 8, 24);
    const ironTire = new THREE.TorusGeometry(0.585, 0.032, 6, 24);
    const wheelSpoke = new THREE.CylinderGeometry(0.032, 0.05, 0.5, 6);
    const wheelHub = new THREE.CylinderGeometry(0.16, 0.16, 0.2, 12);
    const axle = new THREE.CylinderGeometry(0.08, 0.08, 2.55, 8);
    const barrelBody = new THREE.LatheGeometry([
      new THREE.Vector2(0.28, 0), new THREE.Vector2(0.33, 0.09),
      new THREE.Vector2(0.38, 0.34), new THREE.Vector2(0.33, 0.59),
      new THREE.Vector2(0.28, 0.68)
    ], 12);
    const barrelHoop = new THREE.TorusGeometry(0.34, 0.025, 6, 16);
    const barrelLid = new THREE.CylinderGeometry(0.285, 0.285, 0.035, 12);
    const wallSites = [[-8, -8, 0.24], [9, -11, -0.36], [-11, 7, -0.28], [12, 7, 0.34]];
    const wallBlocks = [];
    const rubble = [];

    wallSites.forEach(([cx, cz, angle], site) => {
      const base = medievalGroundHeight(cx, cz) - 0.015;
      for (let row = 0; row < 5; row += 1) for (let column = 0; column < 5; column += 1) {
        if (row > 2 && (column + site + row) % 3 === 0) continue;
        if (row === 4 && (column + site) % 2 === 0) continue;
        const width = 0.65 + random() * 0.14;
        const localX = (column - 2) * 0.72 + (row % 2) * 0.14;
        wallBlocks.push({
          x: cx + Math.cos(angle) * localX, z: cz + Math.sin(angle) * localX,
          y: base + (row + 0.5) * 0.41, width, angle: angle + (random() - 0.5) * 0.09,
          shade: 0.85 + random() * 0.15
        });
      }
      for (let i = 0; i < 34; i += 1) {
        const x = cx + (random() - 0.5) * 6.5;
        const z = cz + (random() - 0.5) * 4;
        const size = 0.15 + random() * 0.45;
        rubble.push({ x, z, size, shade: 0.58 + random() * 0.42 });
      }
    });
    for (let i = 0; i < 235; i += 1) {
      const x = (random() - 0.5) * 94;
      const z = (random() - 0.5) * 100 - 5;
      if (Math.abs(x) < 5.5 && z > -22 && z < 22) continue;
      rubble.push({ x, z, size: 0.08 + random() * 0.26, shade: 0.52 + random() * 0.45 });
    }
    for (let i = 0; i < 90; i += 1) {
      const x = (random() < 0.5 ? -1 : 1) * (6.2 + random() * 9);
      const z = -14 + random() * 29;
      rubble.push({ x, z, size: 0.12 + random() * 0.33, shade: 0.7 + random() * 0.3 });
    }

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const masonry = new THREE.InstancedMesh(box, stone, wallBlocks.length);
    masonry.name = "Muros derruidos";
    wallBlocks.forEach((block, index) => {
      dummy.position.set(block.x, block.y, block.z);
      dummy.rotation.set(0, block.angle, 0);
      dummy.scale.set(block.width, 0.4, 0.5);
      dummy.updateMatrix();
      masonry.setMatrixAt(index, dummy.matrix);
      masonry.setColorAt(index, color.setScalar(block.shade));
    });
    masonry.instanceMatrix.needsUpdate = true;
    masonry.castShadow = masonry.receiveShadow = true;
    masonry.computeBoundingSphere();
    group.add(masonry);

    const pillarSites = [[-5.5, -8], [5.5, -9], [-6.5, 2]];
    pillarSites.forEach(([x, z], site) => {
      const pillar = new THREE.Group();
      pillar.name = "Columna medieval";
      pillar.position.set(x, medievalGroundHeight(x, z) - 0.015, z);
      pillar.rotation.y = site * 0.31;
      group.add(pillar);
      addBlock(pillar, box, stone, [0, 0.2, 0], [1.25, 0.4, 1.25]);
      for (let layer = 0; layer < 5 - (site % 2); layer += 1) {
        addBlock(pillar, box, stone, [(random() - 0.5) * 0.09, 0.7 + layer * 0.56, 0],
          [0.82 - layer * 0.025, 0.54, 0.82 - layer * 0.025], (random() - 0.5) * 0.13);
      }
      addBlock(pillar, box, stone, [0.26, 3.34 - (site % 2) * 0.56, 0.04],
        [0.72, 0.32, 0.78], site % 2 ? -0.18 : 0.13);
    });

    const stones = new THREE.InstancedMesh(rock, stone, rubble.length);
    stones.name = "Cascotes de mamposteria";
    rubble.forEach(({ x, z, size, shade }, index) => {
      dummy.position.set(x, medievalGroundHeight(x, z) + size * 0.3 - 0.015, z);
      dummy.rotation.set(random() * 0.25, random() * Math.PI * 2, random() * 0.3);
      dummy.scale.set(size, size * (0.35 + random() * 0.35), size * (0.65 + random() * 0.4));
      dummy.updateMatrix();
      stones.setMatrixAt(index, dummy.matrix);
      stones.setColorAt(index, color.setScalar(shade));
    });
    stones.instanceMatrix.needsUpdate = true;
    stones.castShadow = stones.receiveShadow = true;
    stones.computeBoundingSphere();
    group.add(stones);

    const createWheel = () => {
      const assembly = new THREE.Group();
      assembly.name = "Rueda de carro";
      const rim = new THREE.Mesh(wheelRim, agedWood);
      rim.castShadow = true;
      assembly.add(rim);
      const tire = new THREE.Mesh(ironTire, iron);
      tire.castShadow = true;
      assembly.add(tire);
      for (let spoke = 0; spoke < 8; spoke += 1) {
        const angle = spoke * Math.PI / 4;
        const ray = new THREE.Mesh(wheelSpoke, cartWood);
        ray.name = "Rayo de rueda";
        ray.position.set(Math.cos(angle) * 0.29, Math.sin(angle) * 0.29, 0);
        ray.rotation.z = angle - Math.PI / 2;
        ray.castShadow = true;
        assembly.add(ray);
      }
      const hub = new THREE.Mesh(wheelHub, agedWood);
      hub.rotation.x = Math.PI / 2;
      hub.castShadow = true;
      assembly.add(hub);
      const cap = new THREE.Mesh(wheelHub, iron);
      cap.scale.set(0.42, 0.42, 0.6);
      cap.rotation.x = Math.PI / 2;
      cap.position.z = 0.12;
      assembly.add(cap);
      return assembly;
    };

    const addCart = (x, z, angle, brokenWheel) => {
      const cart = new THREE.Group();
      cart.name = "Carro medieval";
      cart.position.set(x, medievalGroundHeight(x, z) - 0.015, z);
      cart.rotation.y = angle;
      group.add(cart);
      for (const side of [-1, 1]) {
        addBlock(cart, box, agedWood, [side * 0.84, 0.63, 0], [0.16, 0.18, 2.95]);
      }
      for (const end of [-0.84, 0.84]) {
        const axleMesh = new THREE.Mesh(axle, agedWood);
        axleMesh.position.set(0, 0.59, end);
        axleMesh.rotation.z = Math.PI / 2;
        axleMesh.castShadow = true;
        cart.add(axleMesh);
        addBlock(cart, box, agedWood, [0, 0.7, end], [2.05, 0.12, 0.15]);
      }
      for (let plank = 0; plank < 8; plank += 1) {
        const board = addBlock(cart, box, plank % 3 === 0 ? agedWood : cartWood,
          [0, 0.85 + (plank % 3) * 0.006, -1.16 + plank * 0.33], [2.05, 0.11, 0.3]);
        board.name = "Tablon de carro";
      }
      for (const side of [-1, 1]) {
        for (const height of [1.12, 1.4]) {
          addBlock(cart, box, height > 1.2 ? agedWood : cartWood,
            [side * 1.02, height, 0], [0.1, 0.18, 2.66]);
        }
        for (const post of [-1.17, 0, 1.17]) {
          addBlock(cart, box, agedWood, [side * 1.02, 1.2, post], [0.14, 0.68, 0.15]);
          const strap = addBlock(cart, box, iron, [side * 1.08, 1.2, post], [0.035, 0.43, 0.08]);
          strap.castShadow = false;
        }
        for (const end of [-0.84, 0.84]) {
          if (brokenWheel && side === 1 && end > 0) continue;
          const assembly = createWheel();
          assembly.position.set(side * 1.23, 0.6, end);
          assembly.rotation.y = Math.PI / 2;
          cart.add(assembly);
        }
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 2.45, 7), agedWood);
        shaft.position.set(side * 0.52, 0.65, 2.18);
        shaft.rotation.x = Math.PI / 2;
        shaft.castShadow = true;
        cart.add(shaft);
      }
      addBlock(cart, box, agedWood, [0, 0.65, 3.2], [1.16, 0.1, 0.12]);
      const crate = new THREE.Group();
      crate.name = "Caja de carga";
      crate.position.set(-0.42, 0.91, -0.42);
      crate.rotation.y = brokenWheel ? -0.16 : 0.12;
      cart.add(crate);
      addBlock(crate, box, agedWood, [0, 0.26, 0], [0.75, 0.5, 0.72]);
      for (let plank = 0; plank < 4; plank += 1) {
        addBlock(crate, box, cartWood, [0, 0.55, -0.27 + plank * 0.18], [0.79, 0.06, 0.16]);
      }
      for (const side of [-1, 1]) {
        addBlock(crate, box, agedWood, [side * 0.39, 0.3, 0], [0.07, 0.52, 0.08]);
        addBlock(crate, box, iron, [side * 0.41, 0.28, 0], [0.025, 0.48, 0.08]);
      }
      if (!brokenWheel) {
        const barrel = new THREE.Group();
        barrel.name = "Barril de carga";
        barrel.position.set(0.47, 0.9, 0.42);
        cart.add(barrel);
        const body = new THREE.Mesh(barrelBody, cartWood);
        body.castShadow = true;
        barrel.add(body);
        for (const height of [0.1, 0.57]) {
          const hoop = new THREE.Mesh(barrelHoop, iron);
          hoop.position.y = height;
          hoop.rotation.x = Math.PI / 2;
          barrel.add(hoop);
        }
        const lid = new THREE.Mesh(barrelLid, agedWood);
        lid.position.y = 0.67;
        barrel.add(lid);
      }
      if (brokenWheel) {
        const loose = createWheel();
        loose.position.set(1.82, 0.12, 1.3);
        loose.rotation.set(Math.PI / 2, 0.25, 0.18);
        cart.add(loose);
      }
    };
    addCart(-5.2, 3.5, -0.34, true);
    addCart(5.2, 3, 0.4, false);

    for (const [x, z, angle] of [[-8, -15, 0.25], [8, -17, -0.2], [-9, 3, 0.48],
      [10, 2, -0.4], [-18, -30, 0.2], [19, -34, -0.25]]) {
      const barrier = new THREE.Group();
      barrier.position.set(x, medievalGroundHeight(x, z) - 0.015, z);
      barrier.rotation.y = angle;
      group.add(barrier);
      addBlock(barrier, box, timber, [0, 0.62, 0], [3.3, 0.13, 0.16]);
      for (let i = -2; i <= 2; i += 1) {
        const pole = new THREE.Mesh(stake, timber);
        pole.position.set(i * 0.65, 0.85, 0);
        pole.rotation.z = i % 2 ? 0.16 : -0.15;
        pole.castShadow = true;
        barrier.add(pole);
      }
    }

    for (const [x, z, angle] of [[-9, -18, 0.15], [11, -19, -0.24]]) {
      const banner = new THREE.Group();
      banner.position.set(x, medievalGroundHeight(x, z) - 0.015, z);
      banner.rotation.y = angle;
      group.add(banner);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 3.4, 6), timber);
      pole.position.y = 1.7;
      pole.castShadow = true;
      banner.add(pole);
      const shape = new THREE.Shape();
      shape.moveTo(0.08, 2.95);
      shape.lineTo(1.25, 2.95);
      shape.lineTo(1.18, 2.2);
      shape.lineTo(0.93, 2.37);
      shape.lineTo(0.7, 1.95);
      shape.lineTo(0.47, 2.18);
      shape.lineTo(0.1, 1.85);
      shape.closePath();
      const fabric = new THREE.Mesh(new THREE.ShapeGeometry(shape), cloth);
      fabric.position.z = 0.04;
      fabric.castShadow = true;
      banner.add(fabric);
      banners.push(fabric);
    }

    group.userData.stats = { walls: wallSites.length, pillars: pillarSites.length,
      blocks: wallBlocks.length, rubble: rubble.length, carts: 2, barricades: 6, banners: banners.length };
  };
  group.userData.animate = (time, active, variant = "battle") => {
    group.visible = active;
    if (!active) return;
    group.userData.build();
    if (variant !== currentVariant) {
      const village = variant === "village";
      stone.color.set(village ? 0xe9dfcc : 0xf1e7da);
      timber.color.set(village ? 0x8a6546 : 0x624a3b);
      cartWood.color.set(village ? 0xd6c5b0 : 0x806958);
      agedWood.color.set(village ? 0xb5a08b : 0x645243);
      cloth.color.set(village ? 0x873d30 : 0x4f2424);
      currentVariant = variant;
    }
    banners.forEach((banner, index) => { banner.rotation.y = Math.sin(time * 0.0006 + index * 1.7) * 0.08; });
  };
  group.userData.dispose = () => {
    const geometries = new Set(), materials = new Set();
    group.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    stoneTexture?.dispose();
    woodTexture?.dispose();
  };
  return group;
}
