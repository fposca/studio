import * as THREE from "three";

// Interior depth in a shared emissive atlas, without modeled rooms or lights.
export function createCityWindowTexture() {
  const c = document.createElement("canvas"); c.width = 128; c.height = 256;
  const ctx = c.getContext("2d"), g = ctx.createLinearGradient(0, 0, 128, 256);
  g.addColorStop(0, "#e0ddd1"); g.addColorStop(.22, "#aaa99e");
  g.addColorStop(.67, "#6a736f"); g.addColorStop(1, "#a4b1ae");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 256);
  ctx.fillStyle = "#394347"; ctx.fillRect(0, 190, 128, 6);
  ctx.fillStyle = "#34414a"; ctx.fillRect(12, 166, 29, 25); ctx.fillRect(82, 178, 30, 15);
  ctx.fillStyle = "rgba(255,255,239,.35)"; ctx.fillRect(6, 8, 116, 8);
  ctx.fillStyle = "rgba(40,48,54,.18)";
  for (let y = 23; y < 83; y += 8) ctx.fillRect(0, y, 128, 2);
  const curtain = ctx.createLinearGradient(0, 0, 32, 0);
  curtain.addColorStop(0, "#535e65"); curtain.addColorStop(.4, "#b6b4a9"); curtain.addColorStop(1, "rgba(136,139,132,.3)");
  ctx.fillStyle = curtain; ctx.fillRect(0, 0, 25, 256);
  ctx.strokeStyle = "#303b46"; ctx.lineWidth = 7; ctx.strokeRect(0, 0, 128, 256);
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
