import * as THREE from "three";

// Outdoor reflections: a blue night sky and a restrained band of urban light.
// The indoor room environment used by other chapters creates white blocks on roads.
export function createBuenosAiresReflectionMap() {
  const canvas = document.createElement("canvas"); canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext("2d"), sky = ctx.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, "#101c35"); sky.addColorStop(.37, "#385472");
  sky.addColorStop(.49, "#60748a"); sky.addColorStop(.55, "#18232c"); sky.addColorStop(1, "#080c15");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 42; i++) {
    const x = i * 25, h = 25 + (i * 19 % 90);
    ctx.fillStyle = "#162432"; ctx.fillRect(x, 260 - h, 19, h);
    for (let y = 270 - h; y < 250; y += 9) for (let col = 0; col < 3; col++) {
      ctx.fillStyle = (i + col + y) % 3 ? "#69859a" : "#d6ae76";
      ctx.fillRect(x + 3 + col * 5, y, 2, 4);
    }
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping; return texture;
}
