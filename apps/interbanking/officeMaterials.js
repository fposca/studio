import * as THREE from "three";

function seeded(seed) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}

function canvasTexture(width, height, paint, repeat = null, data = false) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  paint(canvas.getContext("2d"), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  if (repeat) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(...repeat);
  }
  return texture;
}

function grainTexture(seed, repeat, strength = 40) {
  return canvasTexture(256, 256, (ctx, width, height) => {
    const rng = seeded(seed), pixels = ctx.createImageData(width, height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const shade = 128 + (rng() - .5) * strength;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = shade;
      pixels.data[i + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
  }, repeat, true);
}

function carpetTexture() {
  return canvasTexture(1024, 1024, ctx => {
    const rng = seeded(821);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
      ctx.save();
      ctx.translate(col * 256 + 128, row * 256 + 128);
      if ((row + col) % 2) ctx.rotate(Math.PI / 2);
      const tone = 95 + Math.floor(rng() * 12);
      ctx.fillStyle = `rgb(${tone + 5},${tone + 2},${tone})`;
      ctx.fillRect(-128, -128, 256, 256);
      for (let x = -127; x < 127; x += 3) {
        const value = tone + (rng() - .5) * 22;
        ctx.fillStyle = `rgb(${value + 7},${value + 3},${value})`;
        ctx.fillRect(x, -127, 1 + rng(), 254);
        for (let y = -126; y < 125; y += 4) {
          ctx.fillStyle = rng() < .5 ? "#c9c4b91c" : "#24232020";
          ctx.fillRect(x, y + rng() * 2, 2, 1);
        }
      }
      ctx.strokeStyle = "#33312f45";
      ctx.strokeRect(-127, -127, 254, 254);
      ctx.restore();
    }
  }, [13, 14.5]);
}

function woodTexture() {
  return canvasTexture(256, 512, ctx => {
    const rng = seeded(616);
    ctx.fillStyle = "#b29674"; ctx.fillRect(0, 0, 256, 512);
    for (let x = 0; x < 256; x++) {
      ctx.strokeStyle = rng() < .55 ? `rgba(78,52,29,${.04 + rng() * .16})` : `rgba(231,208,175,${rng() * .24})`;
      ctx.lineWidth = .5 + rng(); ctx.beginPath();
      for (let y = 0; y <= 512; y += 8) {
        const offset = Math.sin(y * .012 + x * .018) * 4 + Math.sin(y * .029 + x * .08) * 1.5;
        if (!y) ctx.moveTo(x + offset, y); else ctx.lineTo(x + offset, y);
      }
      ctx.stroke();
    }
  }, [1, 1]);
}

function keyboardTexture() {
  return canvasTexture(512, 192, ctx => {
    ctx.fillStyle = "#1d232b"; ctx.fillRect(0, 0, 512, 192);
    const key = (x, y, width = 26) => {
      ctx.fillStyle = "#63707c"; ctx.fillRect(x, y + 3, width, 25);
      ctx.fillStyle = "#303b46"; ctx.fillRect(x + 1, y + 1, width - 2, 22);
      ctx.fillStyle = "#b8c3cd"; ctx.fillRect(x + 5, y + 6, Math.min(8, width - 10), 2);
    };
    for (let row = 0; row < 4; row++) for (let col = 0; col < (row === 3 ? 13 : 14); col++)
      key((row === 3 ? 34 : 20 + row * 7) + col * 34, 14 + row * 35);
    for (const x of [36, 75, 114, 348, 390, 432]) key(x, 154, 31);
    key(153, 154, 178);
  });
}

function screenTexture(variant) {
  return canvasTexture(768, 432, ctx => {
    const dark = variant === 2;
    ctx.fillStyle = dark ? "#182334" : "#e7ebf1"; ctx.fillRect(0, 0, 768, 432);
    ctx.fillStyle = "#654385"; ctx.fillRect(0, 0, 768, 36);
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif"; ctx.fillText("interbanking", 20, 24);
    ctx.fillStyle = dark ? "#202d42" : "#f9fafb"; ctx.fillRect(0, 36, 135, 396);
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i === variant ? "#a476c5" : "#94a0b1";
      ctx.fillRect(18, 71 + i * 38, 9, 9); ctx.fillRect(38, 73 + i * 38, 70, 5);
    }
    ctx.fillStyle = dark ? "#e6eaf1" : "#35435a";
    ctx.font = "bold 20px sans-serif"; ctx.fillText(["Mi espacio de trabajo", "Resumen del equipo", "Actividad del día"][variant], 162, 79);
    for (let i = 0; i < 3; i++) {
      const x = 162 + i * 195;
      ctx.fillStyle = dark ? "#26364b" : "#fff"; ctx.fillRect(x, 103, 177, 84);
      ctx.fillStyle = "#9aa4b6"; ctx.fillRect(x + 13, 119, 95, 5);
      ctx.fillStyle = "#9875b6"; ctx.fillRect(x + 13, 145, 44 + i * 22, 14);
    }
    ctx.fillStyle = dark ? "#26364b" : "#fff"; ctx.fillRect(162, 205, 570, 193);
    ctx.strokeStyle = dark ? "#3a4a5e" : "#e4e8ef";
    for (let y = 238; y <= 371; y += 27) { ctx.beginPath(); ctx.moveTo(180, y); ctx.lineTo(710, y); ctx.stroke(); }
    ctx.strokeStyle = "#9b70c0"; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const x = 185 + i * 46, y = 343 - i * 6 + Math.sin(i * 1.8 + variant) * 23;
      if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
}

export function createCityTexture() {
  return canvasTexture(2048, 1024, (ctx, width, height) => {
    const rng = seeded(327), sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#a9c1d0"); sky.addColorStop(.65, "#d1dce0"); sky.addColorStop(1, "#aebec5");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
    for (let layer = 0; layer < 3; layer++) {
      for (let x = -80; x < width;) {
        const w = 72 + rng() * 140, y = 290 + rng() * 320 + (2 - layer) * 40;
        const value = 151 - layer * 12 + Math.round(rng() * 18);
        ctx.fillStyle = `rgb(${value},${value + 13},${value + 22})`;
        ctx.fillRect(x, y, w, height - y);
        ctx.fillStyle = "#d7e1e14a"; ctx.fillRect(x, y, w * .12, height - y);
        for (let wy = y + 12; wy < height; wy += 24) for (let wx = x + 9; wx < x + w - 10; wx += 17) {
          ctx.fillStyle = rng() < .2 ? "#49677855" : rng() < .4 ? "#d7e6e27a" : "#6f94aa75";
          ctx.fillRect(wx, wy, 10, 15);
        }
        ctx.fillStyle = "#d9e4e138";
        for (let wy = y + 9; wy < height; wy += 48) ctx.fillRect(x, wy, w, 2);
        x += w + 12;
      }
    }
    const haze = ctx.createLinearGradient(0, 0, 0, height);
    haze.addColorStop(0, "#dfe7e900"); haze.addColorStop(1, "#dfe7e980");
    ctx.fillStyle = haze; ctx.fillRect(0, 0, width, height);
  });
}

export function createOfficeMaterials() {
  const standard = (color, more = {}) => new THREE.MeshStandardMaterial({ color, roughness: .65, ...more });
  const wallGrain = grainTexture(21, [5, 5], 28);
  const fabricGrain = grainTexture(33, [8, 8], 95);
  const laminateGrain = grainTexture(37, [2, 2], 22);
  const woodMap = woodTexture();
  const meshMap = canvasTexture(32, 32, ctx => {
    ctx.fillStyle = "#151515"; ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = "#f2f2f2";
    for (let i = 0; i < 32; i += 8) { ctx.fillRect(i, 0, 4, 32); ctx.fillRect(0, i, 32, 3); }
  }, [12, 19], true);
  const ceilingMap = canvasTexture(256, 256, ctx => {
    const rng = seeded(53); ctx.fillStyle = "#e4e3df"; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2800; i++) {
      ctx.fillStyle = rng() > .5 ? "#6b6c6838" : "#ffffff50";
      ctx.fillRect(rng() * 256, rng() * 256, 1, 1);
    }
  }, [18, 20]);
  const shadowMap = canvasTexture(128, 128, ctx => {
    const gradient = ctx.createRadialGradient(64, 64, 12, 64, 64, 64);
    gradient.addColorStop(0, "#00000080"); gradient.addColorStop(.4, "#0000004a"); gradient.addColorStop(1, "#00000000");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
  });
  const result = {
    wall: standard(0xe3e0d9, { bumpMap: wallGrain, bumpScale: .004, roughness: .88 }),
    trim: standard(0xc6c8c8, { metalness: .48, roughness: .4 }),
    desk: standard(0xe9e7df, { bumpMap: laminateGrain, bumpScale: .0015, roughness: .35 }),
    cabinet: standard(0xd2d5d2, { bumpMap: laminateGrain, bumpScale: .002, roughness: .48 }),
    frame: standard(0xd9dcda, { metalness: .12, roughness: .4 }),
    chair: standard(0x555b5d, { bumpMap: fabricGrain, bumpScale: .003, roughness: .96 }),
    chairMesh: standard(0x777d7d, { alphaMap: meshMap, alphaTest: .45, alphaToCoverage: true, side: THREE.DoubleSide, roughness: .9 }),
    black: standard(0x1d252c, { metalness: .1, roughness: .45 }),
    keyboard: standard(0x29323b, { roughness: .62 }),
    keyboardKeys: standard(0xffffff, { map: keyboardTexture(), roughness: .7 }),
    mousepad: standard(0x414b53, { bumpMap: fabricGrain, bumpScale: .002, roughness: .98 }),
    chrome: standard(0xa6b0b5, { metalness: .85, roughness: .3 }),
    wood: standard(0xffffff, { map: woodMap, bumpMap: woodMap, bumpScale: .003, roughness: .54 }),
    purple: standard(0x8b4bb1, { emissive: 0x502675, emissiveIntensity: .12, roughness: .45 }),
    leaf: standard(0x3c6345, { side: THREE.DoubleSide, roughness: .57 }),
    leafLight: standard(0x64825a, { side: THREE.DoubleSide, roughness: .64 }),
    stem: standard(0x647342, { roughness: .9 }),
    soil: standard(0x29241e, { bumpMap: fabricGrain, bumpScale: .014, roughness: 1 }),
    paper: standard(0xeae8df, { roughness: .93 }),
    coffee: standard(0x342319, { roughness: .25 }),
    ceramic: standard(0xe9e5de, { roughness: .25 }),
    carpet: standard(0xffffff, { map: carpetTexture(), bumpMap: grainTexture(42, [52, 58], 170), bumpScale: .008, roughness: .99 }),
    ceiling: standard(0xffffff, { map: ceilingMap, roughness: .94, emissive: 0xc7c4b9, emissiveIntensity: .12 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xb0c5cc, metalness: .1, roughness: .09, transparent: true, opacity: .14, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.2 }),
    frost: standard(0xd6dfdf, { transparent: true, opacity: .45, depthWrite: false, roughness: .65, side: THREE.DoubleSide }),
    lamp: standard(0xfff7e7, { emissive: 0xfff5df, emissiveIntensity: .8, roughness: .7 }),
    contactShadow: new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false, opacity: .62, toneMapped: false }),
  };
  result.screens = [0, 1, 2].map(variant => {
    const map = screenTexture(variant);
    return standard(0x15191d, { map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: .75, roughness: .38, metalness: .04 });
  });
  return result;
}
