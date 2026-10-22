import * as THREE from "three";

function canvas(w, h = w) {
  const image = document.createElement("canvas"); image.width = w; image.height = h;
  return image;
}
function random(seed) {
  let n = seed;
  return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
}
function texture(image, x = 1, y = 1, color = true) {
  const map = new THREE.CanvasTexture(image);
  map.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(x, y); map.anisotropy = 4;
  return map;
}
function wood() {
  const diffuse = canvas(1024), height = canvas(1024), rough = canvas(1024);
  const c = diffuse.getContext("2d"), b = height.getContext("2d"), r = rough.getContext("2d"), rng = random(1999);
  b.fillStyle = "#969696"; b.fillRect(0, 0, 1024, 1024);
  r.fillStyle = "#999999"; r.fillRect(0, 0, 1024, 1024);
  for (let row = 0; row < 8; row++) {
    const y = row * 128;
    for (let col = -1; col < 3; col++) {
      const x = col * 420 + (row % 3) * 140;
      const tone = 23 + rng() * 9;
      c.fillStyle = "hsl(22, 25%, " + tone + "%)"; c.fillRect(x, y, 420, 128);
      for (let grain = 0; grain < 90; grain++) {
        const gy = y + rng() * 126, wobble = 2 + rng() * 6;
        c.strokeStyle = grain % 3 ? "rgba(28,16,11,0.13)" : "rgba(196,148,100,0.12)";
        c.lineWidth = 0.5 + rng();
        c.beginPath(); c.moveTo(x, gy); c.bezierCurveTo(x + 130, gy + wobble, x + 300, gy - wobble, x + 420, gy); c.stroke();
      }
      c.fillStyle = "rgba(17,11,10,.8)"; c.fillRect(x, y, 2, 128); c.fillRect(x, y, 420, 3);
      c.fillStyle = "rgba(215,177,132,.2)"; c.fillRect(x + 2, y + 3, 417, 1);
      b.fillStyle = "#313131"; b.fillRect(x, y, 2, 128); b.fillRect(x, y, 420, 3);
      const wear = 135 + Math.round(rng() * 45);
      r.fillStyle = "rgb(" + wear + "," + wear + "," + wear + ")";
      r.fillRect(x + 3, y + 4, 414, 122);
      // Subtle scuffs in the varnish, with no extra scene geometry.
      for (let mark = 0; mark < 8; mark++) {
        const sx = x + rng() * 400, sy = y + 5 + rng() * 116, len = 8 + rng() * 60;
        c.fillStyle = "rgba(217,183,145,.065)"; c.fillRect(sx, sy, len, 1);
        r.fillStyle = "#d0d0d0"; r.fillRect(sx, sy, len, 1);
      }
    }
    for (let nail = 0; nail < 5; nail++) {
      c.fillStyle = "#342621"; c.beginPath(); c.arc(30 + nail * 230, y + 10, 1.5, 0, Math.PI * 2); c.fill();
    }
  }
  return { diffuse, height, rough };
}
function brick() {
  const image = canvas(512, 256), bump = canvas(512, 256);
  const c = image.getContext("2d"), b = bump.getContext("2d"), rng = random(77);
  c.fillStyle = "#403937"; c.fillRect(0, 0, 512, 256); b.fillStyle = "#252525"; b.fillRect(0, 0, 512, 256);
  for (let row = 0; row < 4; row++) for (let col = -1; col < 5; col++) {
    const x = col * 128 + (row % 2) * 64, y = row * 64;
    c.fillStyle = "hsl(" + (14 + rng() * 9) + ", 24%, " + (21 + rng() * 9) + "%)";
    c.fillRect(x + 3, y + 3, 122, 58); b.fillStyle = "#bbbbbb"; b.fillRect(x + 4, y + 4, 120, 56);
    for (let speck = 0; speck < 450; speck++) {
      const sx = x + 4 + rng() * 119, sy = y + 4 + rng() * 55;
      c.fillStyle = rng() > 0.5 ? "rgba(204,161,129,.16)" : "rgba(17,12,10,.2)";
      c.fillRect(sx, sy, 1 + rng() * 3, 1 + rng() * 2);
      b.fillStyle = rng() > 0.5 ? "#8b8b8b" : "#cecece"; b.fillRect(sx, sy, 2, 1);
    }
    c.strokeStyle = "rgba(209,161,125,.13)"; c.strokeRect(x + 4, y + 4, 119, 55);
  }
  return { image, bump };
}
function fabric() {
  const image = canvas(128), c = image.getContext("2d"), rng = random(48);
  const pixels = c.createImageData(128, 128);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const x = (i / 4) % 128, y = Math.floor(i / 512);
    const v = 75 + rng() * 40 + ((x % 3 === 0 || y % 3 === 0) ? 22 : 0);
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = v; pixels.data[i + 3] = 255;
  }
  c.putImageData(pixels, 0, 0); return image;
}
export function clubLabel(title, subtitle = "", color = "#d8c9ad", background = "#17191d") {
  const image = canvas(512, 128), c = image.getContext("2d");
  c.fillStyle = background; c.fillRect(0, 0, 512, 128);
  c.strokeStyle = color; c.lineWidth = 3; c.strokeRect(7, 7, 498, 114);
  c.textAlign = "center"; c.fillStyle = color; c.font = "bold 40px Arial"; c.fillText(title, 256, 58);
  c.font = "20px Arial"; c.fillText(subtitle, 256, 94);
  return texture(image);
}
export function createRockClubMaterials() {
  const boards = wood(), bricks = brick(), weave = fabric();
  const woodMaterial = (x, y, color, roughness) => new THREE.MeshStandardMaterial({
    map: texture(boards.diffuse, x, y), bumpMap: texture(boards.height, x, y, false), bumpScale: 0.018,
    roughnessMap: texture(boards.rough, x, y, false), color, roughness,
  });
  const brickMaterial = (x) => new THREE.MeshStandardMaterial({
    map: texture(bricks.image, x, 5.5), bumpMap: texture(bricks.bump, x, 5.5, false),
    bumpScale: 0.035, roughness: 0.97,
  });
  const perforations = canvas(64), g = perforations.getContext("2d");
  g.fillStyle = "#35383e"; g.fillRect(0, 0, 64, 64);
  g.globalCompositeOperation = "destination-out";
  for (let row = -1; row < 9; row++) for (let col = -1; col < 9; col++) {
    g.beginPath(); g.arc(col * 8 + (row % 2) * 4, row * 8, 2.6, 0, Math.PI * 2); g.fill();
  }
  const upholstery = texture(weave, 3, 3, false);
  // Furniture shares one smaller wood map rather than duplicating floor-sized maps.
  const furnitureCanvas = canvas(512);
  furnitureCanvas.getContext("2d").drawImage(boards.diffuse, 0, 0, 512, 512);
  const furnitureMap = texture(furnitureCanvas);
  const furniture = (color, roughness) => new THREE.MeshStandardMaterial({map: furnitureMap, color, roughness});
  return {
    floor: woodMaterial(5, 14, 0xc5b8a8, 0.79),
    stageFloor: woodMaterial(4, 3.5, 0x9b8075, 0.88),
    wood: furniture(0xb59679, 0.65),
    stage: furniture(0x725245, 0.81),
    barTop: furniture(0x6e4b39, 0.48),
    brick: brickMaterial(10), sideBrick: brickMaterial(14),
    black: new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.84, bumpMap: upholstery, bumpScale: 0.012 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x575a60, roughness: 0.37, metalness: 0.78 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xaf8958, roughness: 0.38, metalness: 0.76 }),
    burgundy: new THREE.MeshStandardMaterial({ color: 0x421c2c, roughness: 0.98, bumpMap: upholstery, bumpScale: 0.009 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x090b0f, roughness: 0.99 }),
    cone: new THREE.MeshStandardMaterial({ color: 0x45474a, roughness: 0.88, bumpMap: upholstery, bumpScale: 0.005 }),
    grille: new THREE.MeshStandardMaterial({ map: texture(perforations, 4, 6), metalness: 0.6, roughness: 0.6, transparent: true, opacity: 0.68, alphaTest: 0.04, depthWrite: false }),
    red: new THREE.MeshBasicMaterial({ color: 0xe24758, toneMapped: false }),
    violet: new THREE.MeshBasicMaterial({ color: 0xb66de1, toneMapped: false }),
    green: new THREE.MeshBasicMaterial({ color: 0x50db9c, toneMapped: false }),
    blue: new THREE.MeshBasicMaterial({ color: 0x558fff, toneMapped: false }),
    screen: new THREE.MeshBasicMaterial({ color: 0xf5d6a2, toneMapped: false }),
    glass: new THREE.MeshStandardMaterial({ color: 0x436750, roughness: 0.18, metalness: 0.28 }),
  };
}
