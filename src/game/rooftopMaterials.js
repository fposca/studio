import * as THREE from "three";

export function roofRandom(index) {
  const value = Math.sin(index * 127.1 + 14.37) * 43758.5453;
  return value - Math.floor(value);
}
export function canvasMap(width, height, paint, color = true) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  paint(canvas.getContext("2d"), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
function concreteMap(bump = false) {
  return canvasMap(1024, 1024, (ctx, width) => {
    ctx.fillStyle = bump ? "#888888" : "#686b70"; ctx.fillRect(0, 0, width, width);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
      const value = 92 + Math.floor(roofRandom(row * 8 + col) * 17);
      ctx.fillStyle = bump ? "#888888" : "rgb(" + value + "," + (value + 3) + "," + (value + 6) + ")";
      ctx.fillRect(col * 256 + 2, row * 256 + 2, 252, 252);
      ctx.strokeStyle = bump ? "#464646" : "#44494d"; ctx.lineWidth = 2;
      ctx.strokeRect(col * 256 + 1, row * 256 + 1, 254, 254);
      ctx.strokeStyle = bump ? "#a0a0a0" : "#797b7a"; ctx.lineWidth = 1;
      ctx.strokeRect(col * 256 + 3, row * 256 + 3, 250, 250);
    }
    const image = ctx.getImageData(0, 0, width, width);
    let seed = 134937;
    for (let i = 0; i < image.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const grain = ((seed >>> 24) / 255 - .5) * (bump ? 24 : 13);
      image.data[i] += grain; image.data[i + 1] += grain; image.data[i + 2] += grain;
    }
    ctx.putImageData(image, 0, 0);
    for (let i = 0; i < 36; i++) {
      const x = roofRandom(i + 300) * width, y = roofRandom(i + 400) * width;
      const gradient = ctx.createRadialGradient(x, y, 8, x, y, 35 + roofRandom(i + 500) * 100);
      gradient.addColorStop(0, bump ? "rgba(45,45,45,.2)" : "rgba(22,31,34,.17)");
      gradient.addColorStop(1, "rgba(20,26,31,0)");
      ctx.fillStyle = gradient; ctx.fillRect(x - 140, y - 140, 280, 280);
    }
    for (let i = 0; i < 10; i++) {
      let x = roofRandom(i + 700) * width, y = roofRandom(i + 710) * width;
      ctx.strokeStyle = bump ? "#555555" : "#3d4245"; ctx.lineWidth = .7;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let j = 0; j < 6; j++) { x += (roofRandom(i * 30 + j) - .45) * 19; y += 5 + roofRandom(i + j + 730) * 13; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }, !bump);
}
export function makeRoofLabel(title, subtitle = "", accent = "#c5b592") {
  return canvasMap(768, 192, ctx => {
    ctx.fillStyle = "#111a22"; ctx.fillRect(0, 0, 768, 192);
    ctx.fillStyle = accent; ctx.fillRect(0, 0, 8, 192);
    ctx.strokeStyle = "#53616b"; ctx.lineWidth = 2; ctx.strokeRect(16, 12, 738, 168);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#e6dfce"; ctx.font = "600 45px Arial"; ctx.fillText(title, 384, subtitle ? 77 : 98, 688);
    if (subtitle) { ctx.fillStyle = accent; ctx.font = "500 23px Arial"; ctx.fillText(subtitle, 384, 132, 680); }
    for (const x of [27, 741]) for (const y of [24, 168]) {
      ctx.fillStyle = "#9ba5a5"; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    }
  });
}
export function createRooftopMaterials() {
  const map = concreteMap(), bumpMap = concreteMap(true);
  for (const texture of [map, bumpMap]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(3, 3);
  }
  const roughnessMap = canvasMap(256, 256, ctx => {
    ctx.fillStyle = "#bcbcbc"; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 22; i++) {
      const x = roofRandom(i + 800) * 256, y = roofRandom(i + 830) * 256;
      const g = ctx.createRadialGradient(x, y, 2, x, y, 35);
      g.addColorStop(0, "#555555"); g.addColorStop(1, "#bcbcbc");
      ctx.fillStyle = g; ctx.fillRect(x - 35, y - 35, 70, 70);
    }
  }, false);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping; roughnessMap.repeat.set(3, 3);
  const paintMap = canvasMap(512, 512, ctx => {
    ctx.fillStyle = "#85817b"; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 3500; i++) {
      ctx.fillStyle = i % 3 ? "rgba(30,38,42,.05)" : "rgba(225,217,202,.12)";
      ctx.fillRect(roofRandom(i) * 512, roofRandom(i + 1) * 512, 1, 1 + roofRandom(i + 2) * 4);
    }
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = "rgba(35,38,30,.10)";
      ctx.fillRect(roofRandom(i + 40) * 512, 0, 2 + roofRandom(i) * 5, 70 + roofRandom(i + 80) * 300);
    }
  });
  const metal = (color, roughness = .6, metalness = .55) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  return {
    floor: new THREE.MeshStandardMaterial({ map, bumpMap, bumpScale: .028, roughnessMap, roughness: .9, metalness: .08 }),
    plaster: new THREE.MeshStandardMaterial({ color: 0xb0aaa0, map: paintMap, roughness: .96, bumpMap: paintMap, bumpScale: .015 }),
    cap: metal(0x777b7c, .75, .15),
    dark: metal(0x18222b, .78, .2),
    steel: metal(0x6c777b, .52, .65),
    cabinet: metal(0x50616b, .64, .4),
    rubber: metal(0x10191e, .95, 0),
    brass: metal(0x95794f, .65, .55),
    ceramic: metal(0xbab7a5, .72, .05),
    rust: metal(0x604535, .95, .1),
    puddle: new THREE.MeshPhysicalMaterial({ color: 0x354555, metalness: .3, roughness: .12, clearcoat: 1, clearcoatRoughness: .08, transparent: true, opacity: .58, depthWrite: false }),
  };
}
