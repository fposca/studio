import * as THREE from "three";
import asphaltTextureUrl from "../assets/environments/apocalypse-floor-texture.png";

function seededRandom(seed) {
  return () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function fracturedSlab() {
  const outline = [
    [-0.55, -0.37], [-0.34, -0.48], [0.18, -0.44], [0.49, -0.23],
    [0.55, 0.29], [0.21, 0.47], [-0.31, 0.42], [-0.52, 0.13]
  ];
  const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, -z)));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.13, steps: 1, bevelEnabled: true, bevelSize: 0.018,
    bevelThickness: 0.012, bevelSegments: 1
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeBoundingBox();
  geometry.translate(0, -geometry.boundingBox.min.y, 0);
  return geometry;
}

export function createApocalypseDebrisSystem() {
  const group = new THREE.Group();
  group.name = "Escombros de apocalipsis";
  group.userData.editorHelper = true;
  group.visible = false;
  let built = false;
  let texture;
  const geometries = [];
  const materials = [];

  group.userData.build = () => {
    if (built) return;
    built = true;
    const random = seededRandom(7919);
    texture = new THREE.TextureLoader().load(asphaltTextureUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 8;
    const asphalt = new THREE.MeshStandardMaterial({
      map: texture, bumpMap: texture, bumpScale: 0.025,
      color: 0xb4aba3, roughness: 1, metalness: 0
    });
    const concrete = new THREE.MeshStandardMaterial({
      map: texture, bumpMap: texture, bumpScale: 0.035,
      color: 0xe0d5c7, roughness: 1, metalness: 0
    });
    const metal = new THREE.MeshStandardMaterial({
      color: 0x392e29, roughness: 0.9, metalness: 0.38
    });
    materials.push(asphalt, concrete, metal);
    const slab = fracturedSlab();
    const rubble = new THREE.DodecahedronGeometry(1, 0);
    const girder = new THREE.BoxGeometry(1, 1, 1);
    geometries.push(slab, rubble, girder);
    const batches = [[], [], []];
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const place = (batch, x, z, sx, sy, sz, angle, shade) => {
      dummy.position.set(x, -0.005, z);
      dummy.rotation.set(0, angle, 0);
      dummy.scale.set(sx, sy, sz);
      if (batch === 1) dummy.position.y += sy * 0.95;
      if (batch === 2) dummy.position.y += sy * 0.52;
      dummy.updateMatrix();
      batches[batch].push({ matrix: dummy.matrix.clone(), shade });
    };

    const clusters = [
      [-7.5, 7], [8.5, 6], [-12, 17], [13, 17],
      [-9, -9], [10, -13], [-15, -27], [16, -34]
    ];
    for (const [cx, cz] of clusters) {
      for (let i = 0; i < 15; i += 1) {
        const x = cx + (random() - 0.5) * 5.6;
        const z = cz + (random() - 0.5) * 5.2;
        const size = 0.55 + random() * 1.35;
        place(0, x, z, size, 0.55 + random() * 1.1, size * (0.65 + random() * 0.65),
          random() * Math.PI * 2, 0.78 + random() * 0.3);
        if (i % 2 === 0) {
          const rock = 0.13 + random() * 0.34;
          place(1, x + 0.55, z - 0.4, rock, rock * 0.45, rock * 0.8,
            random() * Math.PI * 2, 0.82 + random() * 0.3);
        }
      }
      for (let i = 0; i < 3; i += 1) {
        place(2, cx + (random() - 0.5) * 4, cz + (random() - 0.5) * 4,
          0.05 + random() * 0.05, 0.045, 0.9 + random() * 1.7,
          random() * Math.PI * 2, 0.75 + random() * 0.25);
      }
    }
    for (let i = 0; i < 210; i += 1) {
      const x = (random() - 0.5) * 92;
      const z = (random() - 0.5) * 90 - 8;
      if (Math.abs(x) < 4.6 && z > -12 && z < 15) continue;
      const size = 0.08 + random() * 0.25;
      place(1, x, z, size, size * (0.35 + random() * 0.35), size * (0.55 + random()),
        random() * Math.PI * 2, 0.56 + random() * 0.45);
    }
    batches.forEach((instances, index) => {
      const mesh = new THREE.InstancedMesh([slab, rubble, girder][index],
        [asphalt, concrete, metal][index], instances.length);
      mesh.name = ["Losas de asfalto rotas", "Cascotes de hormigon", "Vigas y varillas caidas"][index];
      instances.forEach(({ matrix, shade }, i) => {
        mesh.setMatrixAt(i, matrix);
        mesh.setColorAt(i, color.setScalar(shade));
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = index !== 1;
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      group.add(mesh);
    });
    group.userData.stats = { slabs: batches[0].length, rubble: batches[1].length, metal: batches[2].length };
  };
  group.userData.dispose = () => {
    group.children.forEach((mesh) => mesh.dispose());
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    texture?.dispose();
  };
  return group;
}
