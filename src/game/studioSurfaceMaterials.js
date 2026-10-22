import * as THREE from "three";
import walnutUrl from "../assets/environments/walnut-texture.png";
import leatherUrl from "../assets/environments/leather-texture.png";

function canvas(width, height = width) {
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  return element;
}

function texture(image, repeatX = 1, repeatY = 1, color = true) {
  const result = new THREE.CanvasTexture(image);
  result.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  result.wrapS = result.wrapT = THREE.RepeatWrapping;
  result.repeat.set(repeatX, repeatY);
  result.anisotropy = 4;
  return result;
}

function random(seed) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}

function weave() {
  const image = canvas(256);
  const ctx = image.getContext("2d");
  const pixels = ctx.createImageData(256, 256);
  const noise = random(72);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const value = 124 + ((x % 4 < 2) !== (y % 4 < 2) ? 15 : -15) + noise() * 22;
    const index = (y * 256 + x) * 4;
    pixels.data[index] = pixels.data[index + 1] = pixels.data[index + 2] = value;
    pixels.data[index + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  return image;
}

function rugArtwork() {
  const image = canvas(1024, 768), ctx = image.getContext("2d"), noise = random(1999);
  ctx.fillStyle = "#342d3b";
  ctx.fillRect(0, 0, 1024, 768);
  const borders = [[12, "#746156"], [19, "#b09976"], [25, "#453440"], [61, "#947a67"], [67, "#b29b7b"], [73, "#392e3d"]];
  for (const [inset, color] of borders) {
    ctx.fillStyle = color;
    ctx.fillRect(inset, inset, 1024 - inset * 2, 768 - inset * 2);
  }
  function diamond(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x, y - radius); ctx.lineTo(x + radius, y);
    ctx.lineTo(x, y + radius); ctx.lineTo(x - radius, y); ctx.closePath(); ctx.fill();
  }
  for (let x = 100; x < 1000; x += 48) for (const y of [43, 725]) {
    diamond(x, y, 11, "#c0a989"); diamond(x, y, 5, "#5e4050");
  }
  for (let y = 92; y < 710; y += 48) for (const x of [43, 981]) {
    diamond(x, y, 11, "#c0a989"); diamond(x, y, 5, "#5e4050");
  }
  for (let y = 105; y < 690; y += 44) for (let x = 110; x < 940; x += 44) {
    diamond(x + (Math.round(y / 44) % 2) * 12, y, 3, "#6f5961");
  }
  for (const x of [312, 512, 712]) {
    diamond(x, 384, x === 512 ? 145 : 96, "#8f7665");
    diamond(x, 384, x === 512 ? 132 : 85, "#b29a7c");
    diamond(x, 384, x === 512 ? 118 : 71, "#513d4b");
    diamond(x, 384, 42, "#957b68"); diamond(x, 384, 32, "#342d3b");
  }
  // Individual fibres and slight wear break up flat fills without more meshes.
  for (let n = 0; n < 85000; n++) {
    ctx.fillStyle = n % 2 ? "rgba(232,214,185,.075)" : "rgba(15,9,21,.07)";
    ctx.fillRect(noise() * 1024, noise() * 768, 1, 1 + noise() * 2);
  }
  ctx.strokeStyle = "rgba(235,215,192,.045)";
  ctx.lineWidth = 1;
  for (let y = 1; y < 768; y += 3) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke(); }
  return image;
}

function floorMaps(woodImage) {
  const color = canvas(1024), height = canvas(1024), rough = canvas(1024);
  const ink = color.getContext("2d"), relief = height.getContext("2d"), finish = rough.getContext("2d");
  function draw(source) {
    const noise = random(91);
    ink.fillStyle = "#332b27"; ink.fillRect(0, 0, 1024, 1024);
    relief.fillStyle = "#666666"; relief.fillRect(0, 0, 1024, 1024);
    finish.fillStyle = "#dddddd"; finish.fillRect(0, 0, 1024, 1024);
    for (let row = 0; row < 16; row++) for (let column = -1; column < 4; column++) {
      const x = column * 342 + (row % 3) * 114, y = row * 64;
      const value = 0.07 + noise() * 0.17;
      ink.fillStyle = "#796354"; ink.fillRect(x + 1, y + 1, 340, 62);
      if (source) {
        const cropY = Math.floor(noise() * source.height * 0.75);
        ink.drawImage(source, 0, cropY, source.width, source.height * 0.22, x + 1, y + 1, 340, 62);
      }
      ink.fillStyle = "rgba(209,192,166," + value + ")"; ink.fillRect(x + 1, y + 1, 340, 62);
      ink.fillStyle = "rgba(231,216,191,.17)"; ink.fillRect(x + 2, y + 1, 338, 1);
      ink.fillStyle = "rgba(21,14,12,.25)"; ink.fillRect(x + 1, y + 62, 340, 1);
      relief.fillStyle = "#b0b0b0"; relief.fillRect(x + 2, y + 2, 338, 60);
      const sheen = Math.floor(167 + noise() * 34);
      finish.fillStyle = "rgb(" + sheen + "," + sheen + "," + sheen + ")";
      finish.fillRect(x + 2, y + 2, 338, 60);
      for (let grain = 0; grain < 15; grain++) {
        const gy = y + 4 + noise() * 56;
        ink.strokeStyle = "rgba(40,24,17,.07)"; ink.lineWidth = 0.5;
        ink.beginPath(); ink.moveTo(x + 4, gy); ink.bezierCurveTo(x + 80, gy - 2, x + 240, gy + 2, x + 337, gy); ink.stroke();
      }
    }
  }
  draw(woodImage);
  const map = texture(color, 4, 7), bumpMap = texture(height, 4, 7, false), roughnessMap = texture(rough, 4, 7, false);
  return { map, bumpMap, roughnessMap, draw(source) { draw(source); map.needsUpdate = bumpMap.needsUpdate = roughnessMap.needsUpdate = true; } };
}

// Six faceplates share one atlas. Labels, screws and meter scales do not add draw calls.
function rackAtlas() {
  const image = canvas(1024, 768), ctx = image.getContext("2d"), noise = random(76);
  const names = ["FET LIMITER", "OPTICAL COMPRESSOR", "PARAMETRIC EQ", "DIGITAL REVERB", "MIC PREAMPLIFIER", "STEREO MASTER"];
  const colors = ["#31424b", "#9c9a8e", "#373943", "#202b35", "#65513a", "#383b3b"];
  for (let row = 0; row < 6; row++) {
    const y = row * 128;
    ctx.fillStyle = colors[row]; ctx.fillRect(0, y, 1024, 128);
    for (let i = 0; i < 80; i++) { ctx.fillStyle = "rgba(255,255,255,.035)"; ctx.fillRect(0, y + noise() * 128, 1024, 0.6); }
    ctx.fillStyle = "rgba(255,255,255,.26)"; ctx.fillRect(0, y, 1024, 2);
    ctx.fillStyle = "#111418"; ctx.fillRect(0, y + 125, 1024, 3);
    for (const x of [20, 1004]) for (const sy of [17, 110]) {
      ctx.fillStyle = "#141719"; ctx.beginPath(); ctx.arc(x, y + sy, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#8e9699"; ctx.beginPath(); ctx.moveTo(x - 3, y + sy - 2); ctx.lineTo(x + 3, y + sy + 2); ctx.stroke();
    }
    ctx.fillStyle = row === 1 ? "#22282b" : "#ddd8c4";
    ctx.font = "bold 22px Arial"; ctx.fillText(names[row], 52, y + 31);
    ctx.font = "12px Arial"; ctx.fillText("NEON / STUDIO SERIES   " + (1994 + row), 52, y + 52);
    for (let meter = 0; meter < 2; meter++) {
      const x = 58 + meter * 133;
      ctx.fillStyle = "#101519"; ctx.fillRect(x, y + 64, 119, 49);
      ctx.fillStyle = row === 3 ? "#426d68" : "#c5af7e"; ctx.fillRect(x + 5, y + 69, 109, 39);
      ctx.strokeStyle = "#493d2e"; ctx.lineWidth = 1;
      for (let tick = 0; tick < 11; tick++) { ctx.beginPath(); ctx.moveTo(x + 12 + tick * 9, y + 75); ctx.lineTo(x + 12 + tick * 9, y + 80 + (tick % 5 === 0 ? 5 : 0)); ctx.stroke(); }
      ctx.strokeStyle = "#7c342a"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 58, y + 107); ctx.lineTo(x + 38 + meter * 24, y + 78); ctx.stroke();
      ctx.fillStyle = "#2f342e"; ctx.font = "10px Arial"; ctx.fillText(meter ? "OUTPUT" : "INPUT", x + 39, y + 99);
    }
    ctx.fillStyle = "#10161c"; ctx.fillRect(358, y + 55, 125, 48);
    ctx.fillStyle = row === 3 ? "#a4bdb0" : "#c5a878"; ctx.font = "24px monospace";
    ctx.fillText(row === 3 ? "HALL 2" : "-12.4", 365, y + 87);
    for (let knob = 0; knob < 3; knob++) {
      const x = 595 + knob * 139;
      ctx.strokeStyle = "#aeb3b0"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y + 68, 30, 0.7, 5.6); ctx.stroke();
      ctx.fillStyle = row === 1 ? "#22282b" : "#ddd8c4"; ctx.font = "12px Arial";
      ctx.fillText(["INPUT", row === 2 ? "FREQ" : "RATIO", "OUTPUT"][knob], x - 21, y + 116);
    }
    ctx.fillStyle = "#d1cab6"; ctx.font = "11px Arial"; ctx.fillText("POWER", 929, y + 111);
  }
  return texture(image);
}

export function createStudioSurfaceMaterials() {
  const floor = floorMaps();
  const loader = new THREE.TextureLoader();
  const wood = loader.load(walnutUrl, (loaded) => floor.draw(loaded.image));
  wood.colorSpace = THREE.SRGBColorSpace;
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.anisotropy = 4;
  const leather = loader.load(leatherUrl);
  leather.colorSpace = THREE.SRGBColorSpace;
  leather.wrapS = leather.wrapT = THREE.RepeatWrapping; leather.repeat.set(2, 2); leather.anisotropy = 4;
  const cloth = weave();
  const clothColor = texture(cloth, 3, 5), clothBump = texture(cloth, 3, 5, false);
  const rugBump = texture(cloth, 22, 18, false);
  const leatherBump = leather.clone(); leatherBump.colorSpace = THREE.NoColorSpace;
  // Both variants share the same image source and are released with the scene.
  const materials = {
    walnut: new THREE.MeshStandardMaterial({ map: wood, color: 0xcab8a5, roughness: 0.48 }),
    timber: new THREE.MeshStandardMaterial({ map: wood, color: 0x9d8876, roughness: 0.65 }),
    timberLight: new THREE.MeshStandardMaterial({ map: wood, color: 0xe0cbb1, roughness: 0.54 }),
    felt: new THREE.MeshStandardMaterial({ map: clothColor, bumpMap: clothBump, bumpScale: 0.006, color: 0x4e3b50, roughness: 1 }),
    acousticFabric: new THREE.MeshStandardMaterial({ map: clothColor, bumpMap: clothBump, bumpScale: 0.005, color: 0x45474c, roughness: 1 }),
    leather: new THREE.MeshStandardMaterial({ map: leather, bumpMap: leatherBump, bumpScale: 0.012, color: 0xb5aaa3, roughness: 0.62 }),
    leatherHighlight: new THREE.MeshStandardMaterial({ map: leather, bumpMap: leatherBump, bumpScale: 0.009, color: 0xd1bbb0, roughness: 0.58 }),
    piping: new THREE.MeshStandardMaterial({ color: 0x554139, roughness: 0.86 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x171a1d, roughness: 0.95 }),
    rug: new THREE.MeshStandardMaterial({ map: texture(rugArtwork()), bumpMap: rugBump, bumpScale: 0.008, roughness: 0.98 }),
    floor: new THREE.MeshStandardMaterial({ map: floor.map, bumpMap: floor.bumpMap, bumpScale: 0.008, roughnessMap: floor.roughnessMap, roughness: 0.83, metalness: 0 }),
    rackFace: new THREE.MeshStandardMaterial({ map: rackAtlas(), roughness: 0.46, metalness: 0.38 }),
    amberLed: new THREE.MeshBasicMaterial({ color: 0xdfa55c }),
  };
  Object.entries(materials).forEach(([name, material]) => { material.name = "studio:" + name; });
  return materials;
}
