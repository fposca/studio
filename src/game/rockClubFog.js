import * as THREE from "three";
import { rockClubFloorHeight } from "./rockClubLayout.js";

// Shared, small smoke texture. No post-processing pass or volumetric ray marching.
function smokeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  for (let i = 0; i < 20; i++) {
    const angle = i * 2.39996;
    const radius = 16 + (i % 5) * 12;
    const x = 128 + Math.cos(angle) * radius, y = 128 + Math.sin(angle) * radius * 0.6;
    const gradient = context.createRadialGradient(x, y, 0, x, y, 58 + (i % 4) * 9);
    gradient.addColorStop(0, "rgba(255,255,255,.13)");
    gradient.addColorStop(0.45, "rgba(255,255,255,.07)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createRockClubFog(scene) {
  const fog = new THREE.FogExp2(0x39313f, 0.052);
  scene.fog = fog;
  const root = new THREE.Group();
  root.name = "club low drifting smoke";
  scene.add(root);
  const texture = smokeTexture(), clouds = [];
  // More smoke on the stage; lower banks also drift between the audience tables.
  for (let i = 0; i < 30; i++) {
    const stage = i < 18, column = i % 6;
    const row = Math.floor((stage ? i : i - 18) / 6);
    const x = -7 + column * 2.8;
    const z = stage ? -17.4 + row * 2.8 : -5.8 + row * 7.5;
    const material = new THREE.SpriteMaterial({
      map: texture, color: stage ? 0xa99cb8 : 0x827a96,
      transparent: true, opacity: 0.3, depthWrite: false, fog: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.name = "club smoke bank " + i;
    sprite.raycast = () => {};
    root.add(sprite);
    clouds.push({ sprite, x, z, stage, phase: i * 2.39996, width: 6.6 + (i % 3) * 0.6 });
  }
  let elapsed = 0, concertActive = false;
  function update(dt, reducedMotion = false, paused = false, camera = null) {
    if (!paused) elapsed += dt;
    const time = reducedMotion ? 0 : elapsed;
    const targetDensity = concertActive ? 0.065 : 0.052;
    if (!paused) fog.density = THREE.MathUtils.damp(fog.density, targetDensity, 1.2, dt);
    for (const { sprite, x, z, stage, phase, width } of clouds) {
      const driftX = Math.sin(time * 0.13 + phase) * 0.65;
      const driftZ = Math.cos(time * 0.09 + phase) * 0.6;
      sprite.position.set(x + driftX, rockClubFloorHeight(x, z) + 0.58 + Math.sin(phase) * 0.16, z + driftZ);
      sprite.scale.set(width + Math.sin(time * 0.17 + phase) * 0.45, stage ? 2.3 : 1.8, 1);
      // Fade nearby billboards so close-ups and first-person walking stay readable.
      const nearFade = camera ? THREE.MathUtils.smoothstep(camera.position.distanceTo(sprite.position), 1.3, 4.3) : 1;
      sprite.material.opacity = (stage ? (concertActive ? 0.48 : 0.36) : 0.3) * nearFade;
    }
  }
  update(0);
  // All textures/materials belong to the scene and are released by its existing disposal.
  return { update, setConcertActive(active) { concertActive = Boolean(active); } };
}
