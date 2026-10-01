import * as THREE from "three";
import groundTextureUrl from "../assets/environments/moonlit-peaks-ground-v1.png";
import moonTextureUrl from "../assets/environments/moonlit-disc-v1.png";
import { moonlitGroundHeight } from "./moonlitTerrain.js";

const GROUND_Y = -0.015;
const MOON_DIRECTION = new THREE.Vector3(-0.28, 0.18, -1).normalize();

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
    const fur = new THREE.MeshStandardMaterial({ color: 0x151b1e, roughness: 1, flatShading: true });
    const eye = new THREE.MeshBasicMaterial({ color: 0xff242c, toneMapped: false });
    const eyeGlow = new THREE.SpriteMaterial({ map: eyeGlowTexture, color: 0xff3437,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const shardGeometry = new THREE.DodecahedronGeometry(1, 0);
    const boulderGeometry = new THREE.IcosahedronGeometry(1, 0);
    const scrubGeometry = new THREE.ConeGeometry(0.15, 0.42, 3);
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
    placeBatch("Grava y lajas lunares", shardGeometry, darkStone, 470, (_index, object) => {
      const [x, z] = chooseSite(6.5);
      const size = 0.08 + random() * 0.3;
      object.position.set(x, GROUND_Y + moonlitGroundHeight(x, z) + size * 0.16, z);
      object.rotation.set(random() * 0.22, random() * Math.PI * 2, random() * 0.22);
      object.scale.set(size * 1.3, size * 0.35, size);
      return 0.7 + random() * 0.3;
    });
    const boulderSites = [[-8, -10], [9, -12], [-12, 3], [13, 5], [-6, -23], [7, -25]];
    placeBatch("Rocas de la ladera", boulderGeometry, stone, 76, (index, object) => {
      const [x, z] = index < boulderSites.length ? boulderSites[index] : chooseSite(9);
      const size = index < boulderSites.length ? 0.8 + random() * 0.5 : 0.28 + random() * 0.78;
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
    const paths = [
      { x: -13, z: -11, dx: 3, dz: 1.8, phase: 0 },
      { x: 14, z: -13, dx: 3.2, dz: 2, phase: 1.4 },
      { x: -20, z: -25, dx: 4, dz: 2.4, phase: 2.5 },
      { x: 21, z: -23, dx: 4.5, dz: 2.4, phase: 4.1 },
      { x: -11, z: 11, dx: 2.2, dz: 1.4, phase: 5.3 },
      { x: 12, z: 13, dx: 2.5, dz: 1.3, phase: 3.2 }
    ];
    paths.forEach((path, index) => {
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
    group.userData.stats = { boulders: 76, shards: 470, scrub: 320, cairns: 3, creatures: paths.length };
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
  };
  return group;
}
