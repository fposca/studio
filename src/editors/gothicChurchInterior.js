import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import stoneTextureUrl from "../assets/environments/castle-interior-stone-v1.png";
import woodTextureUrl from "../assets/environments/gothic-pew-oak-v1.png";
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

function createDistressedTexture(base, stain, vertical, seed) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  context.fillStyle = base;
  context.fillRect(0, 0, 128, 128);
  let state = seed;
  const random = () => { state = state * 16807 % 2147483647; return (state - 1) / 2147483646; };
  for (let index = 0; index < 190; index += 1) {
    context.fillStyle = `rgba(${stain},${0.025 + random() * 0.13})`;
    const x = random() * 128;
    const y = random() * 128;
    const length = 3 + random() * 26;
    context.fillRect(x, y, vertical ? 0.4 + random() * 1.4 : length,
      vertical ? length : 0.4 + random() * 1.4);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
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
  const waxTexture = createDistressedTexture("#e7d8ba", "104,82,58", true, 2231);
  const patinaTexture = createDistressedTexture("#74624d", "28,53,47", false, 7801);
  const flameTexture = createFlameTexture();
  const stone = new THREE.MeshStandardMaterial({ color: 0xb1aaa2, map: stoneTexture,
    bumpMap: stoneTexture, bumpScale: 0.055, roughness: 1, metalness: 0 });
  const carvedStone = new THREE.MeshStandardMaterial({ color: 0x82796f, map: stoneTexture,
    bumpMap: stoneTexture, bumpScale: 0.04, roughness: 1, metalness: 0 });
  const wood = new THREE.MeshStandardMaterial({ color: 0xdccdb8, map: woodTexture,
    bumpMap: woodTexture, bumpScale: 0.055, roughness: 0.88, metalness: 0 });
  const carvedWood = new THREE.MeshStandardMaterial({ color: 0xb7a18b, map: woodTexture,
    bumpMap: woodTexture, bumpScale: 0.045, roughness: 0.92, metalness: 0 });
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x80715f, map: woodTexture,
    bumpMap: woodTexture, bumpScale: 0.035, roughness: 0.94, metalness: 0 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x716a5c, map: patinaTexture,
    bumpMap: patinaTexture, bumpScale: 0.014, roughness: 0.62, metalness: 0.58 });
  const agedBrass = new THREE.MeshStandardMaterial({ color: 0xb4a27b, map: patinaTexture,
    bumpMap: patinaTexture, bumpScale: 0.01, roughness: 0.48, metalness: 0.7 });
  const wool = new THREE.MeshStandardMaterial({ color: 0xd2b8aa, map: rugTexture,
    bumpMap: rugTexture, bumpScale: 0.013, roughness: 1, metalness: 0 });
  const woolTrim = new THREE.MeshStandardMaterial({ color: 0x91744c, roughness: 1, metalness: 0 });
  const candleWax = new THREE.MeshStandardMaterial({ color: 0xfff7e6, map: waxTexture,
    bumpMap: waxTexture, bumpScale: 0.014, roughness: 0.95, metalness: 0 });
  const candleRim = new THREE.MeshStandardMaterial({ color: 0xe9d7b7, roughness: 0.98, metalness: 0 });
  const wickMaterial = new THREE.MeshStandardMaterial({ color: 0x34251e, roughness: 1, metalness: 0 });
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

  const pewSeat = new RoundedBoxGeometry(3.6, 0.18, 0.78, 2, 0.035);
  const pewBack = new RoundedBoxGeometry(3.6, 0.9, 0.17, 2, 0.028);
  const pewEnd = new RoundedBoxGeometry(0.16, 1.05, 1.05, 2, 0.035);
  const pewLeg = new THREE.BoxGeometry(0.16, 0.63, 0.72);
  const pewRail = new RoundedBoxGeometry(3.68, 0.13, 0.25, 2, 0.03);
  const pewMoulding = new RoundedBoxGeometry(3.4, 0.055, 0.045, 2, 0.012);
  const pewPanel = new RoundedBoxGeometry(0.98, 0.65, 0.023, 2, 0.015);
  const pewPanelInner = new RoundedBoxGeometry(0.83, 0.51, 0.014, 2, 0.012);
  const pewEndPanel = new RoundedBoxGeometry(0.026, 0.72, 0.82, 2, 0.012);
  const pewEndInset = new RoundedBoxGeometry(0.012, 0.58, 0.68, 2, 0.008);
  const pewFinial = new THREE.SphereGeometry(0.105, 10, 8);
  const pewCollar = new THREE.CylinderGeometry(0.11, 0.13, 0.075, 10);
  for (const x of [-7.2, 7.2]) for (const z of [-6, -13, -20, -27]) {
    const seat = new THREE.Mesh(pewSeat, wood);
    seat.name = "Banco gotico";
    seat.position.set(x, 0.72, z);
    seat.castShadow = seat.receiveShadow = true;
    const back = new THREE.Mesh(pewBack, wood);
    back.position.set(x, 1.13, z + 0.42);
    back.rotation.x = -0.13;
    back.castShadow = back.receiveShadow = true;
    for (const side of [-1, 1]) {
      const moulding = new THREE.Mesh(pewMoulding, carvedWood);
      moulding.position.set(0, side * 0.385, 0.101);
      back.add(moulding);
    }
    for (const offset of [-1.13, 0, 1.13]) {
      const panel = new THREE.Mesh(pewPanel, darkWood);
      panel.position.set(offset, -0.015, 0.098);
      const inner = new THREE.Mesh(pewPanelInner, carvedWood);
      inner.position.z = 0.021;
      panel.add(inner);
      back.add(panel);
    }
    const rail = new THREE.Mesh(pewRail, wood);
    rail.position.set(x, 1.61, z + 0.48);
    rail.castShadow = true;
    group.add(seat, back, rail);
    for (const offset of [-1.72, 1.72]) {
      const end = new THREE.Mesh(pewEnd, wood);
      end.position.set(x + offset, 0.54, z);
      const side = Math.sign(offset);
      const endPanel = new THREE.Mesh(pewEndPanel, darkWood);
      endPanel.position.set(side * 0.091, 0.07, 0);
      const endInset = new THREE.Mesh(pewEndInset, carvedWood);
      endInset.position.x = side * 0.021;
      endPanel.add(endInset);
      end.add(endPanel);
      const leg = new THREE.Mesh(pewLeg, wood);
      leg.position.set(x + offset * 0.72, 0.32, z);
      const finial = new THREE.Mesh(pewFinial, carvedWood);
      finial.position.set(x + offset, 1.43, z + 0.38);
      const collar = new THREE.Mesh(pewCollar, darkWood);
      collar.position.set(x + offset, 1.32, z + 0.38);
      end.castShadow = leg.castShadow = finial.castShadow = true;
      group.add(end, leg, collar, finial);
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

  const standBase = new THREE.LatheGeometry([
    [0, 0], [0.27, 0], [0.35, 0.035], [0.34, 0.075], [0.22, 0.11], [0.12, 0.16]
  ].map(([radius, height]) => new THREE.Vector2(radius, height)), 20);
  const standStem = new THREE.LatheGeometry([
    [0.105, 0], [0.075, 0.08], [0.055, 0.28], [0.095, 0.42],
    [0.052, 0.54], [0.045, 0.94], [0.085, 1.12], [0.065, 1.23]
  ].map(([radius, height]) => new THREE.Vector2(radius, height)), 16);
  const candleGeometry = new THREE.CylinderGeometry(0.052, 0.063, 1, 14, 4);
  const candleLip = new THREE.TorusGeometry(0.052, 0.011, 6, 14);
  const candleWick = new THREE.CylinderGeometry(0.006, 0.009, 0.065, 6);
  const candleDrip = new THREE.CylinderGeometry(0.01, 0.016, 1, 6);
  const cupGeometry = new THREE.LatheGeometry([
    [0.035, 0], [0.087, 0.012], [0.11, 0.043], [0.096, 0.055]
  ].map(([radius, height]) => new THREE.Vector2(radius, height)), 14);
  const cupLip = new THREE.TorusGeometry(0.099, 0.009, 6, 14);
  const armGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.28, 0), new THREE.Vector3(0.15, 1.27, 0),
    new THREE.Vector3(0.28, 1.2, 0), new THREE.Vector3(0.36, 1.35, 0)
  ]), 12, 0.026, 7, false);
  const candleLights = [];
  const flames = [];
  for (const x of [-4.9, 4.9]) for (const z of [-9, -23]) {
    const stand = new THREE.Group();
    stand.name = "Candelabro gotico";
    stand.position.set(x, 0, z);
    const base = new THREE.Mesh(standBase, iron);
    const stem = new THREE.Mesh(standStem, iron);
    stem.position.y = 0.13;
    base.castShadow = stem.castShadow = true;
    stand.add(base, stem);
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(armGeometry, agedBrass);
      arm.scale.x = side;
      arm.castShadow = true;
      stand.add(arm);
    }
    for (const [index, offset] of [-0.36, 0, 0.36].entries()) {
      const height = [0.31, 0.37, 0.28][index];
      const cup = new THREE.Mesh(cupGeometry, agedBrass);
      cup.position.set(offset, 1.36, 0);
      const lip = new THREE.Mesh(cupLip, agedBrass);
      lip.rotation.x = Math.PI / 2;
      lip.position.set(offset, 1.415, 0);
      const candle = new THREE.Mesh(candleGeometry, candleWax);
      candle.scale.y = height;
      candle.position.set(offset, 1.415 + height * 0.5, 0);
      const top = 1.415 + height;
      const rim = new THREE.Mesh(candleLip, candleRim);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(offset, top, 0);
      const wick = new THREE.Mesh(candleWick, wickMaterial);
      wick.position.set(offset, top + 0.027, 0);
      const drips = [];
      for (const [angle, length] of [[0.65, 0.07], [2.9, 0.11], [4.7, 0.055]]) {
        const drip = new THREE.Mesh(candleDrip, candleRim);
        drip.scale.y = length;
        drip.position.set(offset + Math.cos(angle) * 0.055, top - length * 0.48, Math.sin(angle) * 0.055);
        drips.push(drip);
      }
      const flame = new THREE.Sprite(flameMaterial);
      flame.position.set(offset, top + 0.14, 0);
      flame.scale.set(0.15, 0.28, 1);
      cup.castShadow = candle.castShadow = true;
      stand.add(cup, lip, candle, rim, wick, ...drips, flame);
      flames.push({ flame, phase: x * 0.7 + z * 0.3 + offset * 4 });
    }
    const light = new THREE.PointLight(0xffae65, 0, 12, 2);
    light.position.y = 1.86;
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
      flame.scale.y = 0.28 * (1 + settings.flicker * Math.sin(time * 0.014 + phase) * 0.15);
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
    waxTexture.dispose();
    patinaTexture.dispose();
    flameTexture.dispose();
  };
  return group;
}
