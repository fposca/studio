import * as THREE from "three";

// Shared world-space interaction sign for the record shop and recording studio.
export function createInteractionPromptSprite(label = "[E] HABLAR") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#1a1022eb";
  ctx.fillRect(6, 6, 500, 116);
  ctx.strokeStyle = "#e3a3ef";
  ctx.lineWidth = 7;
  ctx.strokeRect(6, 6, 500, 116);
  ctx.fillStyle = "#ffe4b6";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '600 57px "Bahnschrift", "Segoe UI", sans-serif';
  ctx.fillText(label, 256, 66);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthTest: false }));
  sprite.scale.set(1.65, 0.42, 1);
  sprite.position.y = 2.43;
  sprite.visible = false;
  return sprite;
}
