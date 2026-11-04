import * as THREE from "three";

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

// The Club and the altered record store share these drifting smoke billboards.
export function createLowDriftingFog(parent, banks, { name = "low drifting smoke", floorHeight = () => 0 } = {}) {
  const root = new THREE.Group();
  root.name = name;
  parent.add(root);
  const texture = smokeTexture();
  const clouds = banks.map((bank, index) => {
    const material = new THREE.SpriteMaterial({
      map: texture, color: bank.color ?? 0x827a96,
      transparent: true, opacity: bank.opacity ?? .3, depthWrite: false, fog: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.name = name + " bank " + index;
    sprite.raycast = () => {};
    root.add(sprite);
    return { ...bank, phase: bank.phase ?? index * 2.39996, sprite };
  });
  let elapsed = 0;
  function update(dt, reducedMotion = false, paused = false, camera = null, opacityForBank = null) {
    if (!paused) elapsed += dt;
    const time = reducedMotion ? 0 : elapsed;
    for (const bank of clouds) {
      const { sprite, x, z, phase } = bank;
      const driftX = Math.sin(time * .13 + phase) * (bank.driftX ?? .65);
      const driftZ = Math.cos(time * .09 + phase) * (bank.driftZ ?? .6);
      sprite.position.set(x + driftX, floorHeight(x, z) + (bank.y ?? .58 + Math.sin(phase) * .16), z + driftZ);
      sprite.scale.set((bank.width ?? 6.6) + Math.sin(time * .17 + phase) * (bank.widthDrift ?? .45), bank.height ?? 1.8, 1);
      const nearFade = camera ? THREE.MathUtils.smoothstep(camera.position.distanceTo(sprite.position), 1.3, 4.3) : 1;
      sprite.material.opacity = (opacityForBank ? opacityForBank(bank) : bank.opacity ?? .3) * nearFade;
    }
  }
  update(0);
  // Textures and materials are released by the owning scene's existing disposal.
  return { root, update };
}
