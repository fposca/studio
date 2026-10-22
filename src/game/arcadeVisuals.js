import * as THREE from "three";

export const ARCADE_COLORS = {
  racing: ["#f07448", "#ffcd71"], space: ["#53bff0", "#c68aff"],
  jungle: ["#8ad879", "#e2cb71"], fighting: ["#fa667f", "#f6bc70"],
  pinball: ["#f4bc65", "#fb84bf"], horror: ["#aa78cf", "#e9698b"],
  broken: ["#6b6470", "#b1a2a4"], frequency: ["#ed5bba", "#a780f9"],
  shooter: ["#60d9c4", "#efb15e"],
};

export function arcadeCanvas(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  draw(canvas.getContext("2d"), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { canvas, texture };
}

function noise(ctx, w, h, count = 4500, strength = .08) {
  let seed = 991;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = i % 2 ? `rgba(255,245,225,${random() * strength})` : `rgba(0,0,0,${random() * strength})`;
    ctx.fillRect(random() * w, random() * h, 1 + random() * 3, 1 + random() * 2);
  }
}

function repeat(texture, x, y) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(x, y);
  return texture;
}

export function arcadeFloorMaterial() {
  const map = arcadeCanvas(1024, 1024, (ctx) => {
    ctx.fillStyle = "#17171e"; ctx.fillRect(0, 0, 1024, 1024);
    for (let y = 0; y < 1024; y += 256) for (let x = 0; x < 1024; x += 256) {
      ctx.fillStyle = (x + y) % 512 ? "#33303c" : "#292734";
      ctx.fillRect(x + 3, y + 3, 250, 250);
      ctx.strokeStyle = "#635064"; ctx.lineWidth = 3; ctx.strokeRect(x + 12, y + 12, 232, 232);
      ctx.strokeStyle = "#463343"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 20, y + 20); ctx.lineTo(x + 236, y + 236);
      ctx.moveTo(x + 236, y + 20); ctx.lineTo(x + 20, y + 236); ctx.stroke();
      ctx.fillStyle = "#8f607a";
      ctx.beginPath(); ctx.moveTo(x + 128, y + 111); ctx.lineTo(x + 145, y + 128);
      ctx.lineTo(x + 128, y + 145); ctx.lineTo(x + 111, y + 128); ctx.fill();
    }
    for (let i = 0; i < 45; i++) {
      const x = (i * 347) % 1024, y = (i * 157) % 1024;
      const wear = ctx.createRadialGradient(x, y, 0, x, y, 65);
      wear.addColorStop(0, "#b7b1a20b"); wear.addColorStop(1, "#b7b1a200");
      ctx.fillStyle = wear; ctx.fillRect(x - 65, y - 65, 130, 130);
      ctx.strokeStyle = "#a5a19516"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 10 + i % 28, .3, 1.6); ctx.stroke();
    }
    noise(ctx, 1024, 1024, 21000, .11);
  }).texture;
  const rough = arcadeCanvas(256, 256, (ctx) => {
    ctx.fillStyle = "#b7b7b7"; ctx.fillRect(0, 0, 256, 256);
    noise(ctx, 256, 256, 3000, .23);
    for (let i = 0; i < 25; i++) {
      ctx.strokeStyle = "#dddddd"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc((i * 71) % 256, (i * 33) % 256, 6 + i, 0, 2); ctx.stroke();
    }
  }).texture;
  rough.colorSpace = THREE.NoColorSpace;
  repeat(map, 5, 7); repeat(rough, 10, 14);
  return new THREE.MeshStandardMaterial({ map, roughnessMap: rough, roughness: .94, metalness: .12, bumpMap: rough, bumpScale: .012 });
}

export function arcadeWallMaterial(brick = false) {
  const map = arcadeCanvas(512, 512, (ctx) => {
    ctx.fillStyle = brick ? "#302d34" : "#494350"; ctx.fillRect(0, 0, 512, 512);
    if (brick) for (let row = 0; row < 9; row++) for (let col = -1; col < 5; col++) {
      const x = col * 144 + (row % 2) * 72, y = row * 60;
      ctx.fillStyle = ["#62404a", "#503a43", "#674a51", "#59434d"][(row * 3 + col + 4) % 4];
      ctx.fillRect(x + 3, y + 3, 137, 53);
      ctx.strokeStyle = "#8a646050"; ctx.lineWidth = 2; ctx.strokeRect(x + 6, y + 6, 131, 47);
    }
    else {
      for (let i = 0; i < 32; i++) {
        ctx.fillStyle = i % 3 ? "#bbb0a80c" : "#08071212";
        ctx.fillRect((i * 93) % 512, 0, 2 + i % 12, 512);
      }
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = "#b9b1a51a"; ctx.fillRect((i * 71) % 512, 390 + (i * 29) % 122, 3 + i % 16, 1 + i % 7);
      }
    }
    noise(ctx, 512, 512, 7000, .18);
  }).texture;
  repeat(map, brick ? 4 : 7, 1.5);
  return new THREE.MeshStandardMaterial({ map, roughness: .97, bumpMap: map, bumpScale: brick ? .045 : .008 });
}

export function arcadePoster(title, subtitle, theme = "space") {
  const [accent, secondary] = ARCADE_COLORS[theme];
  return arcadeCanvas(384, 512, (ctx) => {
    ctx.fillStyle = "#14101f"; ctx.fillRect(0, 0, 384, 512);
    const gradient = ctx.createLinearGradient(0, 60, 384, 410);
    gradient.addColorStop(0, accent); gradient.addColorStop(1, "#21152b");
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.moveTo(0, 130); ctx.lineTo(384, 66); ctx.lineTo(384, 380); ctx.lineTo(0, 450); ctx.fill();
    ctx.strokeStyle = "#fff1d38c"; ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      ctx.beginPath(); ctx.moveTo(0, 350 + i * 16); ctx.lineTo(384, 238 + i * 16); ctx.stroke();
    }
    ctx.fillStyle = "#171421"; ctx.beginPath(); ctx.arc(192, 257, 115, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = secondary; ctx.lineWidth = 7; ctx.stroke();
    ctx.fillStyle = secondary;
    if (theme === "racing") {
      ctx.fillRect(145, 206, 94, 107); ctx.fillStyle = "#171421"; ctx.fillRect(157, 221, 70, 34);
      ctx.fillRect(131, 225, 12, 25); ctx.fillRect(241, 225, 12, 25);
    } else {
      for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) if ((x * y + x + y) % 4 !== 0)
        ctx.fillRect(126 + x * 20, 190 + y * 20, 14, 14);
    }
    ctx.textAlign = "center"; ctx.fillStyle = "#ffefd2";
    ctx.font = "900 37px Arial"; ctx.fillText(title.toUpperCase(), 192, 54, 350);
    ctx.font = "900 25px Arial"; ctx.fillText(subtitle.toUpperCase(), 192, 447, 345);
    ctx.font = "700 16px monospace"; ctx.fillText("FICHINES / BUENOS AIRES / 1999", 192, 480, 346);
    ctx.strokeStyle = "#c4b8a2"; ctx.lineWidth = 5; ctx.strokeRect(9, 9, 366, 494);
    noise(ctx, 384, 512, 1800, .14);
  }).texture;
}

export function arcadeGlowTexture() {
  return arcadeCanvas(128, 128, (ctx) => {
    const gradient = ctx.createRadialGradient(64, 64, 3, 64, 64, 64);
    gradient.addColorStop(0, "#ffffffb0"); gradient.addColorStop(.4, "#ffffff45"); gradient.addColorStop(1, "#ffffff00");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
  }).texture;
}

// One low-resolution canvas per cabinet: titles, seeds and attract modes stay distinct.
export function drawArcadeScreen(ctx, prop, time, altered, pulse) {
  const { theme, label, id } = prop;
  const [accent, secondary] = ARCADE_COLORS[theme];
  const seed = [...id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
  const w = 384, h = 256;
  ctx.fillStyle = "#03060e"; ctx.fillRect(0, 0, w, h);
  if (theme === "broken" && pulse <= 0) {
    ctx.fillStyle = "#111419"; ctx.fillRect(14, 14, 356, 228);
    ctx.fillStyle = "#484a4e"; ctx.font = "16px monospace"; ctx.textAlign = "center";
    ctx.fillText("NO INPUT", 192, 132);
  } else if (theme === "frequency") {
    const awake = altered || pulse > 0;
    const glow = ctx.createRadialGradient(192, 128, 0, 192, 128, 135);
    glow.addColorStop(0, awake ? "#6b1a63" : "#201b31"); glow.addColorStop(1, "#090b17");
    ctx.fillStyle = glow; ctx.fillRect(8, 8, 368, 240);
    ctx.strokeStyle = awake ? accent : "#645373"; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.arc(192, 128, 28 + i * 19, i * .8 + time * .09, Math.PI * 2 - .2 + i * .8 + time * .09); ctx.stroke();
    }
    for (let i = 0; i < 9; i++) {
      const a = i * Math.PI * 2 / 9;
      ctx.beginPath(); ctx.moveTo(192 + Math.cos(a) * 54, 128 + Math.sin(a) * 54);
      ctx.lineTo(192 + Math.cos(a) * 74, 128 + Math.sin(a) * 74); ctx.stroke();
    }
    ctx.textAlign = "center"; ctx.fillStyle = "#f7c4e9"; ctx.font = "900 25px monospace";
    ctx.fillText(Math.floor(time / 3) % 2 ? "INSERT COIN TO REMEMBER" : "FREQUENCY 09", 192, 38, 342);
    ctx.font = "12px monospace"; ctx.fillStyle = "#bd85d0"; ctx.fillText("SIGNAL 09 / MEMORY NOT FOUND", 192, 226);
  } else if (pulse > 0) {
    for (let y = 0; y < h; y += 4) {
      ctx.fillStyle = `hsl(${(y * 11 + time * 400) % 360} 17% ${15 + (y * 7) % 45}%)`;
      ctx.fillRect((y * 31 + time * 270) % 60, y, 330, 3);
    }
    ctx.fillStyle = "#f5ccd8"; ctx.font = "900 30px monospace"; ctx.textAlign = "center"; ctx.fillText("WHO IS PLAYING?", 192, 130);
  } else {
    ctx.fillStyle = theme === "horror" ? "#191024" : "#0b1430"; ctx.fillRect(8, 8, 368, 240);
    if (theme === "racing") {
      ctx.fillStyle = "#45254c"; ctx.fillRect(10, 60, 364, 59);
      ctx.fillStyle = secondary; ctx.beginPath(); ctx.arc(192, 100, 29, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#222735"; ctx.beginPath(); ctx.moveTo(168, 104); ctx.lineTo(216, 104); ctx.lineTo(355, 227); ctx.lineTo(29, 227); ctx.fill();
      for (let i = 0; i < 6; i++) {
        const z = (i * .17 + time * .6) % 1;
        ctx.fillStyle = i % 2 ? "#e9dac0" : accent;
        ctx.fillRect(164 - z * 137, 104 + z * z * 121, 5 + z * 14, 3 + z * 8);
        ctx.fillRect(213 + z * 137, 104 + z * z * 121, 5 + z * 14, 3 + z * 8);
        ctx.fillStyle = "#e9dac0"; ctx.fillRect(190, 104 + z * z * 121, 3 + z * 4, 3 + z * 12);
      }
      const x = 154 + Math.sin(time * .9 + seed) * 28;
      ctx.fillStyle = accent; ctx.fillRect(x, 181, 61, 33); ctx.fillRect(x + 9, 168, 43, 22);
      ctx.fillStyle = "#9ac6d0"; ctx.fillRect(x + 14, 172, 33, 12);
      ctx.fillStyle = "#ffdf7a"; ctx.fillRect(x + 4, 204, 12, 4); ctx.fillRect(x + 45, 204, 12, 4);
    } else if (theme === "fighting") {
      ctx.fillStyle = "#493044";
      for (let i = 0; i < 10; i++) ctx.fillRect(i * 42, 100 - (i * 31 + seed) % 40, 32, 110);
      ctx.fillStyle = "#b08b70"; ctx.fillRect(8, 208, 368, 6);
      for (const [side, color] of [[-1, accent], [1, secondary]]) {
        const x = 180 + side * (65 + Math.sin(time * 3 + seed) * 10), y = 146 + Math.sin(time * 7) * 3;
        ctx.fillStyle = color; ctx.fillRect(x - 11, y - 26, 22, 23); ctx.fillRect(x - 16, y, 32, 34);
        ctx.fillRect(x - 22, y + 29, 14, 32); ctx.fillRect(x + 9, y + 29, 14, 32);
        ctx.fillRect(x - side * 43, y + 4, 35, 11);
      }
      ctx.fillStyle = accent; ctx.fillRect(23, 56, 129, 9); ctx.fillStyle = secondary; ctx.fillRect(231, 56, 129, 9);
    } else if (theme === "shooter") {
      ctx.strokeStyle = "#316d70"; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) ctx.strokeRect(20 + i * 27, 66 + i * 10, 344 - i * 54, 152 - i * 20);
      const x = 191 + Math.sin(time * 1.2) * 85, y = 138 + Math.cos(time) * 33;
      ctx.strokeStyle = accent; ctx.beginPath(); ctx.arc(x, y, 17, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 28, y); ctx.lineTo(x + 28, y); ctx.moveTo(x, y - 28); ctx.lineTo(x, y + 28); ctx.stroke();
      ctx.fillStyle = secondary; ctx.fillRect(150, 110, 27, 41); ctx.fillRect(266, 156, 21, 29);
    } else if (theme === "horror") {
      ctx.fillStyle = "#2d253e";
      for (let i = 0; i < 5; i++) { ctx.fillRect(42 + i * 70, 65, 12, 148); ctx.fillRect(23 + i * 70, 66, 51, 11); }
      ctx.fillStyle = "#070913"; ctx.fillRect(148, 76, 87, 141);
      ctx.fillStyle = secondary; ctx.fillRect(171 + Math.sin(time) * 3, 127, 6, 3); ctx.fillRect(200 + Math.sin(time) * 3, 127, 6, 3);
      ctx.strokeStyle = "#624966"; ctx.beginPath(); ctx.moveTo(148, 217); ctx.lineTo(75, 238); ctx.moveTo(235, 217); ctx.lineTo(311, 238); ctx.stroke();
    } else {
      for (let i = 0; i < 45; i++) {
        ctx.fillStyle = i % 3 ? secondary : "#ffffff";
        ctx.fillRect((i * 67 + seed) % 360 + 12, 60 + (i * 41 + time * 15) % 157, i % 5 ? 2 : 3, 2);
      }
      for (let row = 0; row < 3; row++) for (let col = 0; col < 6; col++) {
        const x = 48 + col * 51 + Math.sin(time + seed) * 13, y = 84 + row * 30;
        ctx.fillStyle = row % 2 ? accent : secondary; ctx.fillRect(x, y, 19, 10);
        ctx.fillRect(x - 3, y + 3, 25, 4); ctx.fillRect(x + 2, y - 3, 3, 3); ctx.fillRect(x + 13, y - 3, 3, 3);
      }
      ctx.fillStyle = accent; const x = 175 + Math.sin(time * .9) * 80;
      ctx.fillRect(x, 206, 30, 7); ctx.fillRect(x + 11, 194, 8, 14);
      ctx.fillStyle = "#fff6b6"; ctx.fillRect(x + 14, 185 - (time * 100) % 70, 2, 9);
    }
    ctx.textAlign = "center"; ctx.fillStyle = "#f9eacf"; ctx.font = "900 23px monospace"; ctx.fillText(label.toUpperCase(), 192, 35, 345);
    ctx.font = "12px monospace"; ctx.fillStyle = accent;
    ctx.fillText(`HI ${String(seed * 130).padStart(6, "0")}    1UP ${String(Math.floor(time * 10 + seed * 8)).padStart(6, "0")}`, 192, 49);
    ctx.fillStyle = secondary; ctx.font = "700 13px monospace";
    ctx.fillText(Math.floor(time / 2 + seed) % 2 ? "INSERT COIN" : "PRESIONA START", 192, 238);
  }
  if (altered && (theme === "frequency" || theme === "horror") && Math.sin(time * 1.7 + seed) > .97) {
    ctx.fillStyle = "#dc85c755"; ctx.fillRect(8, 45 + (time * 73) % 170, 368, 4);
  }
  const vignette = ctx.createRadialGradient(192, 126, 78, 192, 126, 214);
  vignette.addColorStop(0, "#00000000"); vignette.addColorStop(1, "#000000a0");
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#00000030"; for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  ctx.strokeStyle = "#b6dcff16"; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(36, 22); ctx.quadraticCurveTo(24, 84, 26, 156); ctx.stroke();
}

export function curvedCrtGeometry(width, height) {
  const geometry = new THREE.PlaneGeometry(width, height, 16, 12);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (width / 2), y = p.getY(i) / (height / 2);
    p.setZ(i, .035 * (1 - x * x) * (1 - y * y));
  }
  geometry.computeVertexNormals(); return geometry;
}

export function arcadeLaminateMaterial() {
  const map = arcadeCanvas(512, 256, (ctx) => {
    ctx.fillStyle = "#61423c"; ctx.fillRect(0,0,512,256);
    for (let i=0;i<180;i++) {
      const y=i*1.47;
      ctx.strokeStyle=i%3 ? "#b190651b" : "#170d1824";
      ctx.lineWidth=i%5===0 ? 1.6 : .65; ctx.beginPath(); ctx.moveTo(0,y);
      for(let x=0;x<=512;x+=32) ctx.lineTo(x,y+Math.sin(x*.023+i*.8)*1.6);
      ctx.stroke();
    }
    noise(ctx,512,256,3500,.15);
  }).texture;
  return new THREE.MeshStandardMaterial({ map, roughness:.68, metalness:.04, bumpMap:map, bumpScale:.008 });
}
