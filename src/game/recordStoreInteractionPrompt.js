import * as THREE from "three";
import { interactionPromptText } from "./interactionPromptText.js";

function rounded(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

// Shared by the shop (including Halloween), the studio and the rock club.
export function createInteractionPromptSprite(label = "Hablar", { subject = "" } = {}) {
  const { action, detail } = interactionPromptText(label, subject);
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 224;
  const ctx = canvas.getContext("2d");
  const background = ctx.createLinearGradient(0, 0, 768, 194);
  background.addColorStop(0, "#271d35f5");
  background.addColorStop(1, "#100e19f5");
  rounded(ctx, 12, 12, 744, 182, 26);
  ctx.fillStyle = background; ctx.fill();
  ctx.strokeStyle = "#b893c184"; ctx.lineWidth = 2; ctx.stroke();
  rounded(ctx, 12, 50, 5, 106, 2);
  ctx.fillStyle = "#e5b5e7"; ctx.fill();
  rounded(ctx, 39, 39, 124, 128, 18);
  ctx.fillStyle = "#dfc2e9"; ctx.fill();
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = '700 66px "Bahnschrift", "Segoe UI", sans-serif';
  ctx.fillStyle = "#211629"; ctx.fillText("E", 101, 108);
  ctx.textAlign = "left";
  ctx.font = '600 56px "Bahnschrift", "Segoe UI", sans-serif';
  ctx.fillStyle = "#fff0df"; ctx.fillText(action, 201, detail ? 80 : 104, 430);
  if (detail) {
    ctx.font = '500 37px "Bahnschrift", "Segoe UI", sans-serif';
    let name = detail;
    while (name.length > 1 && ctx.measureText(name).width > 420) name = name.slice(0, -1);
    if (name !== detail) name = name.trimEnd() + "…";
    ctx.fillStyle = "#c9b5d0"; ctx.fillText(name, 203, 137, 430);
  }
  // A small speech mark, not another panel competing with the character.
  ctx.strokeStyle = "#c6a0d4"; ctx.lineWidth = 4;
  rounded(ctx, 667, 76, 51, 39, 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(677, 115); ctx.lineTo(677, 128); ctx.lineTo(690, 115); ctx.stroke();
  ctx.fillStyle = "#c6a0d4";
  for (const x of [680, 692, 704]) { ctx.beginPath(); ctx.arc(x, 95, 2, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = "#b893c18c"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(384, 195); ctx.lineTo(384, 212); ctx.stroke();
  ctx.beginPath(); ctx.arc(384, 216, 3, 0, Math.PI * 2); ctx.fill();

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.minFilter = THREE.LinearFilter;
  map.generateMipmaps = false;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map, transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
  }));
  sprite.name = "interaction-prompt";
  sprite.scale.set(1.05, 1.05 * canvas.height / canvas.width, 1);
  sprite.position.y = 2.26;
  sprite.center.set(.5, 0);
  sprite.visible = false;
  sprite.frustumCulled = false;
  sprite.renderOrder = 100;
  const viewSize = new THREE.Vector2(), viewPosition = new THREE.Vector3(), parentScale = new THREE.Vector3();
  sprite.onBeforeRender = (renderer, scene, camera) => {
    renderer.getSize(viewSize);
    sprite.getWorldPosition(viewPosition).applyMatrix4(camera.matrixWorldInverse);
    const widthPx = viewSize.y < 500 ? 168 : 190;
    const depth = camera.isPerspectiveCamera ? Math.max(.1, -viewPosition.z) : 1;
    const height = (widthPx * canvas.height / canvas.width) * 2 * depth / (Math.max(1, viewSize.y) * camera.projectionMatrix.elements[5]);
    if (sprite.parent) sprite.parent.getWorldScale(parentScale); else parentScale.set(1, 1, 1);
    sprite.scale.set(height * canvas.width / canvas.height / Math.max(.001, parentScale.x), height / Math.max(.001, parentScale.y), 1);
    sprite.updateMatrixWorld(true);
  };
  return sprite;
}
