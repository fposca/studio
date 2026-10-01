import * as THREE from "three";
import stoneTextureUrl from "../assets/environments/castle-interior-stone-v1.png";
import woodTextureUrl from "../assets/environments/walnut-texture.png";
import rugTextureUrl from "../assets/environments/castle-runner-wool-v1.png";
import { createFlameTexture } from "./castleInterior.js";

export const DEFAULT_GOTHIC_LIGHTING = Object.freeze({
  enabled: false, candles: 0.85, glass: 0.7, flicker: 0.3, dust: 0.24
});

export function normalizeGothicLighting(value = {}) {
  const result = { ...DEFAULT_GOTHIC_LIGHTING, ...value };
  result.enabled = Boolean(result.enabled);
  for (const [key, max] of [["candles", 2], ["glass", 2], ["flicker", 1], ["dust", 1]]) {
    const number = Number(result[key]);
    result[key] = Number.isFinite(number) ? THREE.MathUtils.clamp(number, 0, max) : DEFAULT_GOTHIC_LIGHTING[key];
  }
  return result;
}

export function createGothicChurchInterior() {
  const group = new THREE.Group();
  group.name = "Interior de iglesia gotica";
  group.userData.editorHelper = true;
  group.visible = false;
  const loader = new THREE.TextureLoader();
  const stoneTexture = loader.load(stoneTextureUrl);
  const woodTexture = loader.load(woodTextureUrl);
  const rugTexture = loader.load(rugTextureUrl);
  for (const texture of [stoneTexture, woodTexture, rugTexture]) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 16;
  }
  stoneTexture.repeat.set(1, 2);
  woodTexture.repeat.set(2, 1);
  rugTexture.repeat.set(1, 5);
  const flameTexture = createFlameTexture();
  const stone = new THREE.MeshStandardMaterial({ color: 0xb1aaa2, map: stoneTexture,
    bumpMap: stoneTexture, bumpScale: 0.055, roughness: 1, metalness: 0 });
  const carvedStone = new THREE.MeshStandardMaterial({ color: 0x82796f, map: stoneTexture,
    bumpMap: stoneTexture, bumpScale: 0.04, roughness: 1, metalness: 0 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x786b60, map: woodTexture,
    bumpMap: woodTexture, bumpScale: 0.02, roughness: 0.92, metalness: 0 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x493d33, roughness: 0.82, metalness: 0.48 });
  const wool = new THREE.MeshStandardMaterial({ color: 0xd2b8aa, map: rugTexture,
    bumpMap: rugTexture, bumpScale: 0.013, roughness: 1, metalness: 0 });
  const woolTrim = new THREE.MeshStandardMaterial({ color: 0x91744c, roughness: 1, metalness: 0 });
  const candleWax = new THREE.MeshStandardMaterial({ color: 0xe6d4ae, roughness: 0.92, metalness: 0 });
  const flameMaterial = new THREE.SpriteMaterial({ map: flameTexture, color: 0xffc377,
    toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });

  const shaftGeometry = new THREE.CylinderGeometry(0.48, 0.55, 8.4, 12);
  const baseGeometry = new THREE.CylinderGeometry(0.8, 0.86, 0.32, 12);
  const capitalGeometry = new THREE.CylinderGeometry(0.86, 0.54, 0.52, 12);
  for (const x of [-12, 12]) for (const z of [-8, -20, -32]) {
    const base = new THREE.Mesh(baseGeometry, carvedStone);
    base.position.set(x, 0.16, z);
    const shaft = new THREE.Mesh(shaftGeometry, stone);
    shaft.position.set(x, 4.52, z);
    const capital = new THREE.Mesh(capitalGeometry, carvedStone);
    capital.position.set(x, 8.96, z);
    for (const piece of [base, shaft, capital]) {
      piece.castShadow = true;
      piece.receiveShadow = true;
      group.add(piece);
    }
  }

  const pewSeat = new THREE.BoxGeometry(3.6, 0.17, 0.78);
  const pewBack = new THREE.BoxGeometry(3.6, 0.9, 0.15);
  const pewEnd = new THREE.BoxGeometry(0.16, 1.05, 1.05);
  const pewLeg = new THREE.BoxGeometry(0.16, 0.63, 0.72);
  const pewRail = new THREE.BoxGeometry(3.64, 0.12, 0.21);
  const pewFinial = new THREE.ConeGeometry(0.11, 0.35, 8);
  for (const x of [-7.2, 7.2]) for (const z of [-6, -13, -20, -27]) {
    const seat = new THREE.Mesh(pewSeat, wood);
    seat.position.set(x, 0.72, z);
    const back = new THREE.Mesh(pewBack, wood);
    back.position.set(x, 1.13, z + 0.42);
    back.rotation.x = -0.13;
    const rail = new THREE.Mesh(pewRail, wood);
    rail.position.set(x, 1.61, z + 0.48);
    group.add(seat, back, rail);
    for (const offset of [-1.72, 1.72]) {
      const end = new THREE.Mesh(pewEnd, wood);
      end.position.set(x + offset, 0.54, z);
      const leg = new THREE.Mesh(pewLeg, wood);
      leg.position.set(x + offset * 0.72, 0.32, z);
      const finial = new THREE.Mesh(pewFinial, wood);
      finial.position.set(x + offset, 1.24, z + 0.38);
      group.add(end, leg, finial);
    }
  }

  const runner = new THREE.Group();
  runner.name = "Pasillo de alfombra gotica";
  runner.position.z = -9;
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 32), wool);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.y = 0.013;
  carpet.receiveShadow = true;
  runner.add(carpet);
  for (const side of [-1, 1]) {
    const trim = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 32), woolTrim);
    trim.rotation.x = -Math.PI / 2;
    trim.position.set(side * 1.86, 0.017, 0);
    runner.add(trim);
  }
  group.add(runner);

  const dais = [
    [8.2, 0.16, 6, 0.08, -34],
    [6.6, 0.16, 4.6, 0.24, -34.7],
    [5, 0.16, 3.2, 0.4, -35.3]
  ];
  for (const [width, height, depth, y, z] of dais) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), carvedStone);
    step.position.set(0, y, z);
    step.receiveShadow = true;
    group.add(step);
  }
  const altarBase = new THREE.Mesh(new THREE.BoxGeometry(3.7, 1.15, 1.45), stone);
  altarBase.position.set(0, 1.12, -36.1);
  const altarTop = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.17, 1.8), carvedStone);
  altarTop.position.set(0, 1.8, -36.1);
  altarBase.castShadow = altarTop.castShadow = true;
  group.add(altarBase, altarTop);
  const crossPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, 0.12), iron);
  crossPost.position.set(0, 2.63, -36.1);
  const crossBar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.12), iron);
  crossBar.position.set(0, 2.8, -36.1);
  group.add(crossPost, crossBar);

  const standBase = new THREE.CylinderGeometry(0.34, 0.38, 0.1, 10);
  const standStem = new THREE.CylinderGeometry(0.045, 0.06, 1.25, 8);
  const candleGeometry = new THREE.CylinderGeometry(0.055, 0.06, 0.29, 8);
  const candleLights = [];
  const flames = [];
  for (const x of [-4.9, 4.9]) for (const z of [-9, -23]) {
    const stand = new THREE.Group();
    stand.position.set(x, 0, z);
    const base = new THREE.Mesh(standBase, iron);
    base.position.y = 0.05;
    const stem = new THREE.Mesh(standStem, iron);
    stem.position.y = 0.72;
    stand.add(base, stem);
    for (const offset of [-0.36, 0, 0.36]) {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.05, 0.06, 8), iron);
      cup.position.set(offset, 1.36, 0);
      const candle = new THREE.Mesh(candleGeometry, candleWax);
      candle.position.set(offset, 1.53, 0);
      const flame = new THREE.Sprite(flameMaterial);
      flame.position.set(offset, 1.76, 0);
      flame.scale.set(0.25, 0.42, 1);
      stand.add(cup, candle, flame);
      flames.push({ flame, phase: x * 0.7 + z * 0.3 + offset * 4 });
    }
    const light = new THREE.PointLight(0xffae65, 0, 12, 2);
    light.position.y = 1.78;
    stand.add(light);
    candleLights.push(light);
    group.add(stand);
  }
  const glassLights = [
    { color: 0x6b9ed5, position: [-13, 14, -8], target: [0, 0, -10] },
    { color: 0xb66883, position: [13, 14, -23], target: [0, 0, -24] }
  ].map(({ color, position, target }) => {
    const light = new THREE.SpotLight(color, 0, 45, 0.5, 0.8, 2);
    light.position.set(...position);
    light.target.position.set(...target);
    group.add(light, light.target);
    return light;
  });

  const dustCount = 96;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dustMaterial = new THREE.PointsMaterial({ color: 0xded4b8, size: 0.045,
    sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.name = "Polvo iluminado de iglesia gotica";
  dust.frustumCulled = false;
  group.add(dust);

  group.userData.stats = { columns: 6, pews: 8, altar: 1, candelabras: 4, runner: 1 };
  group.userData.animate = (value, time, inChurch, reduced = false) => {
    const settings = normalizeGothicLighting(value);
    group.visible = Boolean(inChurch);
    const active = group.visible && settings.enabled;
    candleLights.forEach((light, index) => {
      const pulse = 1 + settings.flicker * (Math.sin(time * 0.009 + index * 1.7) * 0.13 + Math.sin(time * 0.021 + index) * 0.05);
      light.intensity = active ? 65 * settings.candles * pulse : 0;
    });
    flames.forEach(({ flame, phase }) => {
      flame.visible = active && settings.candles > 0;
      flame.scale.y = 0.42 * (1 + settings.flicker * Math.sin(time * 0.014 + phase) * 0.15);
    });
    glassLights.forEach((light, index) => { light.intensity = active ? (index ? 155 : 190) * settings.glass : 0; });
    dust.visible = active && settings.dust > 0;
    dustMaterial.opacity = settings.dust * 0.32;
    dustGeometry.setDrawRange(0, reduced ? 48 : dustCount);
    if (!dust.visible) return;
    for (let index = 0; index < dustCount; index += 1) {
      const offset = index * 3;
      dustPositions[offset] = Math.sin(index * 12.9898) * 9 + Math.sin(time * 0.0003 + index) * 0.18;
      dustPositions[offset + 1] = 0.4 + (index * 0.67 + time * 0.00013) % 7;
      dustPositions[offset + 2] = -31 + ((index * 7.13) % 37);
    }
    dustGeometry.attributes.position.needsUpdate = true;
  };
  group.userData.dispose = () => {
    const geometries = new Set(), materials = new Set();
    group.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
      if (object.isLight) object.dispose?.();
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    stoneTexture.dispose();
    woodTexture.dispose();
    rugTexture.dispose();
    flameTexture.dispose();
  };
  return group;
}
