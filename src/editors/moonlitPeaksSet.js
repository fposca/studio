import * as THREE from "three";
import groundTextureUrl from "../assets/environments/moonlit-peaks-ground-v1.png";
import moonTextureUrl from "../assets/environments/moonlit-disc-v1.png";
import coniferTextureUrl from "../assets/environments/moonlit-conifer-v1.png";
import { moonlitGroundHeight } from "./moonlitTerrain.js";

const GROUND_Y = -0.015;
const MOON_DIRECTION = new THREE.Vector3(-0.28, 0.18, -1).normalize();
const GROVES = [
  { x: -14, z: -12, radius: 6, count: 14 },
  { x: 15, z: -14, radius: 6, count: 14 },
  { x: -23, z: -27, radius: 7, count: 13 },
  { x: 23, z: -26, radius: 7, count: 13 },
  { x: -15, z: -42, radius: 7, count: 10 },
  { x: 16, z: -40, radius: 7, count: 10 }
];
const PROWLER_PATHS = [
  { x: -14, z: -12, dx: 2.6, dz: 1.8, phase: 0 },
  { x: 15, z: -14, dx: 2.8, dz: 1.9, phase: 1.4 },
  { x: -23, z: -27, dx: 3.1, dz: 2, phase: 2.5 },
  { x: 23, z: -26, dx: 3.2, dz: 2, phase: 4.1 },
  { x: -15, z: -42, dx: 2.6, dz: 1.8, phase: 5.3 },
  { x: 16, z: -40, dx: 2.7, dz: 1.8, phase: 3.2 }
];

function seededRandom(seed) {
  return () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function createEyeGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d");
  const glow = context.createRadialGradient(32, 32, 2, 32, 32, 31);
  glow.addColorStop(0, "rgba(255,90,82,0.9)");
  glow.addColorStop(0.25, "rgba(230,16,24,0.52)");
  glow.addColorStop(1, "rgba(210,0,0,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createMoonlitPeaksSet() {
  const group = new THREE.Group();
  group.name = "Ladera y criaturas de cumbres luna llena";
  group.userData.editorHelper = true;
  group.visible = false;
  let built = false;
  let rockTexture;
  let eyeGlowTexture;
  let moonTexture;
  let coniferTexture;
  let moonSprite;
  const prowlers = [];

  group.userData.build = () => {
    if (built) return;
    built = true;
    const random = seededRandom(38271);
    rockTexture = new THREE.TextureLoader().load(groundTextureUrl);
    rockTexture.colorSpace = THREE.SRGBColorSpace;
    rockTexture.wrapS = rockTexture.wrapT = THREE.RepeatWrapping;
    rockTexture.anisotropy = 8;
    eyeGlowTexture = createEyeGlowTexture();
    moonTexture = new THREE.TextureLoader().load(moonTextureUrl);
    moonTexture.colorSpace = THREE.SRGBColorSpace;
    coniferTexture = new THREE.TextureLoader().load(coniferTextureUrl);
    coniferTexture.colorSpace = THREE.SRGBColorSpace;
    coniferTexture.anisotropy = 8;
    const moonMaterial = new THREE.SpriteMaterial({ map: moonTexture, color: 0xcadbe8,
      transparent: true, depthWrite: false, toneMapped: false });
    moonSprite = new THREE.Sprite(moonMaterial);
    moonSprite.name = "Luna llena de cumbres";
    moonSprite.scale.set(8, 8, 1);
    moonSprite.renderOrder = -999;
    group.add(moonSprite);
    const stone = new THREE.MeshLambertMaterial({ map: rockTexture, color: 0xaab4bb });
    const darkStone = new THREE.MeshLambertMaterial({ map: rockTexture, color: 0x697984 });
    const scrub = new THREE.MeshLambertMaterial({ color: 0x3f4b4c, side: THREE.DoubleSide });
    const bark = new THREE.MeshLambertMaterial({ map: rockTexture, color: 0xa1a9a5 });
    const needles = new THREE.MeshLambertMaterial({ map: coniferTexture, color: 0xc9d9d6,
      alphaTest: 0.45, side: THREE.DoubleSide });
    const cactusMaterial = new THREE.MeshLambertMaterial({ color: 0x506a5d, flatShading: true });
    const spineMaterial = new THREE.MeshLambertMaterial({ color: 0x9da69a });
    const fur = new THREE.MeshStandardMaterial({ color: 0x151b1e, roughness: 1, flatShading: true });
    const eye = new THREE.MeshBasicMaterial({ color: 0xff242c, toneMapped: false });
    const eyeGlow = new THREE.SpriteMaterial({ map: eyeGlowTexture, color: 0xff3437,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const shardGeometry = new THREE.DodecahedronGeometry(1, 0);
    const boulderGeometry = new THREE.IcosahedronGeometry(1, 0);
    const scrubGeometry = new THREE.ConeGeometry(0.15, 0.42, 3);
    const trunkGeometry = new THREE.CylinderGeometry(0.08, 0.15, 1, 7);
    const crownGeometry = new THREE.PlaneGeometry(1, 1);
    const cactusGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1, 7);
    const spineGeometry = new THREE.ConeGeometry(0.018, 0.09, 3);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const placeBatch = (name, geometry, material, count, place) => {
      const mesh = new THREE.InstancedMesh(geometry, material, count);
      mesh.name = name;
      for (let index = 0; index < count; index += 1) {
        const shade = place(index, dummy);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
        mesh.setColorAt(index, color.setScalar(shade));
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = material !== scrub;
      mesh.receiveShadow = material !== scrub;
      mesh.computeBoundingSphere();
      group.add(mesh);
      return mesh;
    };
    const chooseSite = (radius = 7) => {
      let x, z;
      do {
        x = (random() - 0.5) * 110;
        z = (random() - 0.5) * 115 - 8;
      } while (Math.hypot(x, z) < radius);
      return [x, z];
    };
    const treeSites = GROVES.flatMap((grove) => Array.from({ length: grove.count }, (_, index) => {
      const angle = index * Math.PI * 2 / grove.count + random() * 0.45;
      const distance = grove.radius * (0.12 + Math.sqrt(random()) * 0.88);
      return {
        x: grove.x + Math.cos(angle) * distance,
        z: grove.z + Math.sin(angle) * distance,
        height: 5.8 + random() * 3.6,
        yaw: random() * Math.PI * 2,
        lean: (random() - 0.5) * 0.13,
        shade: 0.74 + random() * 0.34
      };
    }));
    placeBatch("Grava y lajas lunares", shardGeometry, darkStone, 800, (_index, object) => {
      const [x, z] = chooseSite(6.5);
      const size = 0.08 + random() * 0.3;
      object.position.set(x, GROUND_Y + moonlitGroundHeight(x, z) + size * 0.16, z);
      object.rotation.set(random() * 0.22, random() * Math.PI * 2, random() * 0.22);
      object.scale.set(size * 1.3, size * 0.35, size);
      return 0.7 + random() * 0.3;
    });
    const boulderSites = [[-8, -10], [9, -12], [-12, 3], [13, 5], [-6, -23], [7, -25], [-18, -8], [19, -12], [-24, -23], [25, -30]];
    placeBatch("Rocas de la ladera", boulderGeometry, stone, 210, (index, object) => {
      const [x, z] = index < boulderSites.length ? boulderSites[index] : chooseSite(9);
      const size = index < boulderSites.length ? 0.9 + random() * 0.65 : 0.3 + random() * 0.92;
      object.position.set(x, GROUND_Y + moonlitGroundHeight(x, z) + size * 0.22, z);
      object.rotation.set(random() * 0.24, random() * Math.PI * 2, random() * 0.24);
      object.scale.set(size * (0.85 + random() * 0.65), size * 0.55, size);
      return 0.65 + random() * 0.35;
    });
    placeBatch("Matas secas de altura", scrubGeometry, scrub, 320, (_index, object) => {
      const [x, z] = chooseSite(8);
      const size = 0.3 + random() * 0.75;
      object.position.set(x, GROUND_Y + moonlitGroundHeight(x, z) + size * 0.11, z);
      object.rotation.set(random() * 0.14, random() * Math.PI * 2, random() * 0.14);
      object.scale.set(size, size, size);
      return 0.55 + random() * 0.4;
    });
    placeBatch("Troncos de pinos lunares", trunkGeometry, bark, treeSites.length, (index, object) => {
      const tree = treeSites[index];
      object.position.set(tree.x, GROUND_Y + moonlitGroundHeight(tree.x, tree.z) + tree.height * 0.48, tree.z);
      object.rotation.set(tree.lean, tree.yaw, tree.lean * 0.6);
      object.scale.set(1, tree.height * 0.96, 1);
      return tree.shade;
    });
    placeBatch("Copas de arboleda lunar", crownGeometry, needles, treeSites.length * 2, (index, object) => {
      const tree = treeSites[Math.floor(index / 2)];
      object.position.set(tree.x, GROUND_Y + moonlitGroundHeight(tree.x, tree.z) + tree.height * 0.5, tree.z);
      object.rotation.set(0, tree.yaw + (index % 2) * Math.PI * 0.5, tree.lean);
      object.scale.set(tree.height * 0.67, tree.height, 1);
      return tree.shade;
    });
    const cactusSites = Array.from({ length: 72 }, () => {
      let x, z;
      do {
        x = (random() - 0.5) * 64;
        z = (random() - 0.5) * 60 - 8;
      } while (Math.hypot(x, z) < 7 || treeSites.some((tree) => Math.hypot(x - tree.x, z - tree.z) < 1.3));
      return { x, z, height: 0.5 + random() * 0.8, shade: 0.65 + random() * 0.4 };
    });
    placeBatch("Cactus de altura", cactusGeometry, cactusMaterial, cactusSites.length, (index, object) => {
      const cactus = cactusSites[index];
      object.position.set(cactus.x, GROUND_Y + moonlitGroundHeight(cactus.x, cactus.z) + cactus.height * 0.5, cactus.z);
      object.rotation.set(0, random() * Math.PI * 2, 0);
      object.scale.set(1, cactus.height, 1);
      return cactus.shade;
    });
    placeBatch("Brazos de cactus", cactusGeometry, cactusMaterial, cactusSites.length * 2, (index, object) => {
      const cactus = cactusSites[Math.floor(index / 2)];
      const side = index % 2 ? 1 : -1;
      object.position.set(cactus.x + side * 0.17,
        GROUND_Y + moonlitGroundHeight(cactus.x, cactus.z) + cactus.height * 0.48, cactus.z);
      object.rotation.set(0, 0, -side * 1.15);
      object.scale.set(0.58, cactus.height * 0.3, 0.58);
      return cactus.shade;
    });
    placeBatch("Puntas de cactus", cactusGeometry, cactusMaterial, cactusSites.length * 2, (index, object) => {
      const cactus = cactusSites[Math.floor(index / 2)];
      const side = index % 2 ? 1 : -1;
      object.position.set(cactus.x + side * (0.17 + cactus.height * 0.135),
        GROUND_Y + moonlitGroundHeight(cactus.x, cactus.z) + cactus.height * 0.67, cactus.z);
      object.rotation.set(0, 0, -side * 0.12);
      object.scale.set(0.5, cactus.height * 0.26, 0.5);
      return cactus.shade;
    });
    placeBatch("Espinas de cactus", spineGeometry, spineMaterial, cactusSites.length * 6, (index, object) => {
      const cactus = cactusSites[Math.floor(index / 6)];
      const side = index % 2 ? 1 : -1;
      const row = Math.floor(index % 6 / 2);
      object.position.set(cactus.x + side * 0.13,
        GROUND_Y + moonlitGroundHeight(cactus.x, cactus.z) + cactus.height * (0.27 + row * 0.22), cactus.z);
      object.rotation.set(0, 0, -side * Math.PI * 0.5);
      object.scale.set(1, 1, 1);
      return 0.7 + cactus.shade * 0.3;
    });

    for (const [x, z, lean] of [[-11, -16, -0.18], [12, -20, 0.13], [-17, 7, 0.2]]) {
      const marker = new THREE.Group();
      marker.name = "Hito de piedra lunar";
      marker.position.set(x, GROUND_Y + moonlitGroundHeight(x, z), z);
      marker.rotation.z = lean;
      group.add(marker);
      for (let level = 0; level < 3; level += 1) {
        const stoneMesh = new THREE.Mesh(boulderGeometry, stone);
        stoneMesh.position.set((random() - 0.5) * 0.22, 0.22 + level * 0.42, 0);
        stoneMesh.scale.set(0.58 - level * 0.1, 0.32, 0.48 - level * 0.07);
        stoneMesh.rotation.y = random() * Math.PI;
        stoneMesh.castShadow = true;
        stoneMesh.receiveShadow = true;
        marker.add(stoneMesh);
      }
    }

    const bodyGeometry = new THREE.IcosahedronGeometry(1, 1);
    const legGeometry = new THREE.CylinderGeometry(0.065, 0.09, 0.65, 5);
    const earGeometry = new THREE.ConeGeometry(0.15, 0.38, 4);
    const tailGeometry = new THREE.ConeGeometry(0.13, 0.7, 5);
    const eyeGeometry = new THREE.SphereGeometry(0.075, 8, 6);
    PROWLER_PATHS.forEach((path, index) => {
      const creature = new THREE.Group();
      creature.name = `Criatura nocturna ${index + 1}`;
      creature.scale.setScalar(index > 3 ? 0.9 : 0.75 + random() * 0.22);
      group.add(creature);
      const addPart = (geometry, position, scale) => {
        const mesh = new THREE.Mesh(geometry, fur);
        mesh.position.set(...position);
        mesh.scale.set(...scale);
        mesh.castShadow = true;
        creature.add(mesh);
        return mesh;
      };
      addPart(bodyGeometry, [0, 0.83, 0], [0.39, 0.32, 0.76]);
      addPart(bodyGeometry, [0, 1.08, 0.58], [0.33, 0.28, 0.35]);
      addPart(bodyGeometry, [0, 0.95, 0.91], [0.21, 0.15, 0.31]);
      for (const side of [-1, 1]) {
        const ear = addPart(earGeometry, [side * 0.22, 1.42, 0.59], [1, 1, 1]);
        ear.rotation.z = -side * 0.16;
        for (const z of [-0.45, 0.42]) {
          const leg = addPart(legGeometry, [side * 0.26, 0.36, z], [1, 1, 1]);
          leg.userData.gaitPhase = (side < 0 ? 0 : Math.PI) + (z < 0 ? Math.PI : 0);
        }
        const pupil = new THREE.Mesh(eyeGeometry, eye);
        pupil.position.set(side * 0.145, 1.16, 0.91);
        creature.add(pupil);
        const halo = new THREE.Sprite(eyeGlow);
        halo.position.set(side * 0.145, 1.16, 1.02);
        halo.scale.set(0.42, 0.42, 1);
        creature.add(halo);
      }
      const tail = addPart(tailGeometry, [0, 0.91, -0.82], [1, 1, 1]);
      tail.rotation.x = -1.15;
      prowlers.push({ creature, path });
    });
    const moonFill = new THREE.DirectionalLight(0x8caeca, 0.55);
    moonFill.name = "Luz de luna en la ladera";
    moonFill.position.set(-11, 13, -9);
    group.add(moonFill);
    group.userData.stats = { boulders: 210, shards: 800, scrub: 320, trees: treeSites.length,
      cactus: cactusSites.length, cairns: 3, creatures: PROWLER_PATHS.length };
  };

  group.userData.animate = (time, active, camera, reduced = false) => {
    group.visible = active;
    if (!active) return;
    group.userData.build();
    moonSprite.position.copy(camera.position).addScaledVector(MOON_DIRECTION, 75);
    const seconds = time * 0.001;
    prowlers.forEach(({ creature, path }, index) => {
      creature.visible = !reduced || index < 4;
      if (!creature.visible) return;
      const phase = seconds * 0.31 + path.phase;
      const x = path.x + Math.sin(phase) * path.dx;
      const z = path.z + Math.cos(phase * 0.83) * path.dz;
      creature.position.set(x, GROUND_Y + moonlitGroundHeight(x, z) + Math.sin(seconds * 5 + index) * 0.025, z);
      creature.rotation.y = Math.atan2(-x, 4 - z) + Math.sin(phase * 0.6) * 0.12;
      creature.children.forEach((part) => {
        if (part.userData.gaitPhase !== undefined) {
          part.rotation.x = Math.sin(seconds * 5.5 + part.userData.gaitPhase + index) * 0.2;
        }
      });
    });
  };

  group.userData.dispose = () => {
    const geometries = new Set();
    const materials = new Set();
    group.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    rockTexture?.dispose();
    eyeGlowTexture?.dispose();
    moonTexture?.dispose();
    coniferTexture?.dispose();
  };
  return group;
}
