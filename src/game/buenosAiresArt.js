import * as THREE from "three";

// Deterministic, small tileable maps: no downloads and no per-frame canvas work.
function rng(seed = 2049) {
  return () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
}

function canvasMap(canvas, color = true) {
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;
  return map;
}

export function citySurface(kind, repeatX = 1, repeatY = repeatX) {
  const size = 512, rand = rng(kind.length * 1237);
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d"), pixels = ctx.createImageData(size, size);
  const base = kind === "asphalt" ? 83 : kind === "stone" ? 193 : kind === "grass" ? 67 : 147;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const fleck = (rand() - .5) * (kind === "asphalt" ? 55 : 23);
    const cloud = 7 * Math.sin(x * Math.PI * 8 / size) * Math.cos(y * Math.PI * 6 / size);
    const v = base + fleck + cloud;
    pixels.data.set(kind === "grass" ? [v * .55, v, v * .5, 255] : [v, v + 1, v + 2, 255], i);
  }
  ctx.putImageData(pixels, 0, 0);
  if (kind === "asphalt") {
    // Fine aggregate, repaired hairline cracks and irregular roughness.
    for (let n = 0; n < 3800; n++) {
      ctx.fillStyle = rand() > .6 ? "rgba(192,192,181,.2)" : "rgba(9,16,22,.2)";
      ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 2, 1 + rand() * 2);
    }
    ctx.strokeStyle = "rgba(15,20,24,.55)"; ctx.lineWidth = 1.8;
    for (let n = 0; n < 4; n++) {
      let x = 30 + rand() * 420, y = 30 + rand() * 200;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let j = 0; j < 12; j++) { x += (rand() - .5) * 28; y += 8 + rand() * 12; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  } else if (kind !== "grass") {
    const step = kind === "stone" ? 128 : 64;
    ctx.lineWidth = kind === "stone" ? 1.1 : 2.2;
    ctx.strokeStyle = kind === "stone" ? "rgba(83,81,74,.35)" : "rgba(47,52,57,.6)";
    for (let y = 0; y <= size; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
      for (let x = (y / step % 2) * step; x <= size; x += step * 2) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + step); ctx.stroke();
      }
    }
  }
  const map = canvasMap(canvas); map.repeat.set(repeatX, repeatY);
  const bumpMap = canvasMap(canvas, false); bumpMap.repeat.copy(map.repeat);
  const roughCanvas = document.createElement("canvas"); roughCanvas.width = roughCanvas.height = size;
  const rough = roughCanvas.getContext("2d"); rough.fillStyle = kind === "asphalt" ? "#969696" : "#e8e8e8"; rough.fillRect(0, 0, size, size);
  if (kind === "asphalt") for (let n = 0; n < 24; n++) {
    const x = rand() * size, y = rand() * size, radius = 20 + rand() * 60;
    const gradient = rough.createRadialGradient(x, y, 2, x, y, radius);
    gradient.addColorStop(0, "rgba(45,45,45,.7)"); gradient.addColorStop(1, "rgba(45,45,45,0)");
    rough.fillStyle = gradient; rough.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  const roughnessMap = canvasMap(roughCanvas, false); roughnessMap.repeat.copy(map.repeat);
  return { map, bumpMap, roughnessMap, bumpScale: kind === "asphalt" ? .045 : .025 };
}

export function cityGlowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const ctx = c.getContext("2d"), g = ctx.createRadialGradient(64, 64, 0, 64, 64, 63);
  g.addColorStop(0, "rgba(255,255,255,.9)"); g.addColorStop(.17, "rgba(255,255,255,.5)");
  g.addColorStop(.5, "rgba(255,255,255,.12)"); g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128); return canvasMap(c);
}

export function citySignTexture(label, accent = "#7ed8ef", style = "sign", pixelRatio = 2) {
  const billboard = style === "billboard", h = billboard ? 512 : 256;
  const c = document.createElement("canvas"); c.width = 1024 * pixelRatio; c.height = h * pixelRatio;
  const ctx = c.getContext("2d"); ctx.scale(pixelRatio, pixelRatio);
  const parking = label === "E", avenue = /JULIO|CORRIENTES|DESV/i.test(label);
  const category = parking ? "MOVILIDAD / AUTOPARK" : avenue ? "NAVEGACI\u00d3N URBANA" : /TEATRO|CINE|NOCHE|ESTRENO/.test(label) ? "CULTURA / LIVE" : "NEXO / RED METROPOLITANA";
  const outline = () => {
    ctx.beginPath(); ctx.moveTo(8, 38); ctx.lineTo(40, 6); ctx.lineTo(758, 6);
    ctx.lineTo(780, 23); ctx.lineTo(990, 23); ctx.lineTo(1016, 49);
    ctx.lineTo(1016, h - 39); ctx.lineTo(986, h - 9); ctx.lineTo(220, h - 9);
    ctx.lineTo(202, h - 24); ctx.lineTo(30, h - 24); ctx.lineTo(8, h - 46); ctx.closePath();
  };
  // Transparent glass, clipped silhouette and luminous circuitry. All art is
  // baked once; the radial display and moving telemetry are animated on the GPU.
  ctx.save(); outline(); ctx.clip();
  const glass = ctx.createLinearGradient(0, 0, 1024, h);
  glass.addColorStop(0, "rgba(4,18,33,.94)"); glass.addColorStop(.62, "rgba(5,29,45,.84)"); glass.addColorStop(1, "rgba(10,47,65,.44)");
  ctx.fillStyle = glass; ctx.fillRect(0, 0, 1024, h);
  const glow = ctx.createRadialGradient(850, h * .5, 5, 850, h * .5, h * .74);
  glow.addColorStop(0, accent + "45"); glow.addColorStop(1, accent + "00");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, 1024, h);
  ctx.strokeStyle = accent; ctx.globalAlpha = .13; ctx.lineWidth = 1;
  // Hexagonal sensor field replaces the flat billboard grid.
  for (let y = 10, row = 0; y < h; y += 27, row++) for (let x = 700 + row % 2 * 16; x < 1035; x += 32) {
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) { const a = i * Math.PI / 3; ctx.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18); }
    ctx.stroke();
  }
  ctx.globalAlpha = .3;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(28, h - 52 - i * 7); ctx.lineTo(164 + i * 24, h - 52 - i * 7);
    ctx.lineTo(195 + i * 24, h - 83 - i * 7); ctx.lineTo(285 + i * 24, h - 83 - i * 7); ctx.stroke();
  }
  ctx.restore();
  outline(); ctx.strokeStyle = accent; ctx.globalAlpha = .48; ctx.lineWidth = 2; ctx.stroke();
  ctx.globalAlpha = 1; ctx.shadowColor = accent; ctx.shadowBlur = 12;
  ctx.strokeStyle = "#c9f7ff"; ctx.lineWidth = 4;
  for (const points of [[[8, 94], [8, 38], [40, 6], [164, 6]], [[876, h - 9], [986, h - 9], [1016, h - 39], [1016, h - 94]]]) {
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = accent; ctx.font = "700 18px Arial, sans-serif";
  ctx.fillText(category, 55, 51);
  ctx.textAlign = "right"; ctx.font = "600 16px Arial, sans-serif"; ctx.fillText("BA / EN L\u00cdNEA", 968, h - 36); ctx.textAlign = "left";
  ctx.fillStyle = "#c6ffe9"; ctx.beginPath(); ctx.arc(33, 44, 4, 0, Math.PI * 2); ctx.fill();
  // A 3D wireframe landmark floats inside the animated radial instrument.
  const cx = 850, cy = h * .5, radius = h * .31;
  ctx.strokeStyle = accent; ctx.lineWidth = 1.4;
  for (let i = 0; i < 48; i++) {
    const a = i * Math.PI / 24, outer = radius * 1.16, inner = outer - (i % 4 ? 4 : 10);
    ctx.globalAlpha = i % 4 ? .3 : .8;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer); ctx.stroke();
  }
  ctx.globalAlpha = .7; ctx.lineWidth = 1.2;
  const point = (x, y) => [cx + x * radius, cy + y * radius];
  const wire = points => { ctx.beginPath(); points.map(([x, y]) => point(x, y)).forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); };
  wire([[-.56, .5], [0, .7], [.56, .5], [0, .3], [-.56, .5]]);
  wire([[-.15, .48], [-.11, -.55], [0, -.78], [.11, -.55], [.15, .48], [0, .56], [-.15, .48]]);
  wire([[0, -.78], [0, .56]]); wire([[-.11, -.55], [0, -.49], [.11, -.55]]);
  for (let i = 0; i < 5; i++) wire([[-.14, .3 - i * .15], [0, .37 - i * .15], [.14, .3 - i * .15]]);
  ctx.globalAlpha = .4; ctx.beginPath(); ctx.ellipse(cx, cy + radius * .57, radius * .7, radius * .18, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1; ctx.fillStyle = "#f1fcff";
  const maxWidth = billboard ? 610 : 668;
  let size = parking ? 210 : billboard ? 76 : 64; ctx.font = `700 ${size}px Arial, sans-serif`;
  let lines = [label];
  if (billboard && !parking && ctx.measureText(label).width > maxWidth) {
    lines = [""];
    for (const word of label.split(" ")) {
      const last = lines.length - 1, next = lines[last] ? `${lines[last]} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && lines[last]) lines.push(word); else lines[last] = next;
    }
  } else while (ctx.measureText(label).width > maxWidth && size > 27) ctx.font = `700 ${--size}px Arial, sans-serif`;
  ctx.textBaseline = "middle"; ctx.shadowColor = accent; ctx.shadowBlur = 5;
  lines.forEach((line, i) => ctx.fillText(line, 54, billboard ? (parking ? 250 : 190 + i * 86) : 119));
  ctx.shadowBlur = 0; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = accent; ctx.font = "500 18px Arial, sans-serif";
  ctx.fillText(parking ? "RECARGA / ACCESO AUT\u00d3NOMO" : billboard ? "BUENOS AIRES. UN FUTURO EN COM\u00daN." : "CIUDAD CONECTADA / DISTRITO CENTRAL", 55, h - (billboard ? 104 : 70));
  // The isolated bottom rail leaves space for travelling arrows in the shader.
  ctx.globalAlpha = .42; ctx.fillRect(54, h - 46, 585, 1);
  for (let i = 0; i < 20; i++) ctx.fillRect(54 + i * 29, h - 36, 15, 3);
  ctx.globalAlpha = 1;
  const map = canvasMap(c); map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping; return map;
}

// Flatten repeated static parts into instances after authoring them in local groups.
// Collision meshes and signs stay as meshes so existing camera/orb raycasts still work.
export function batchCityDetails(root, excluded = []) {
  root.updateMatrixWorld(true);
  const keep = new Set(excluded), batches = new Map();
  root.traverse(object => {
    if (!object.isMesh || object.isInstancedMesh || keep.has(object) || object.userData.cityKeep) return;
    const key = `${object.geometry.uuid}/${object.material.uuid}/${object.castShadow}`;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(object);
  });
  for (const meshes of batches.values()) {
    if (meshes.length < 2) continue;
    const first = meshes[0], batch = new THREE.InstancedMesh(first.geometry, first.material, meshes.length);
    batch.name = `Ciudad / ${first.material.name || "detalle"} / ${meshes.length} instancias`;
    batch.castShadow = first.castShadow; batch.receiveShadow = first.receiveShadow;
    meshes.forEach((mesh, i) => { batch.setMatrixAt(i, mesh.matrixWorld); mesh.removeFromParent(); });
    batch.instanceMatrix.needsUpdate = true; batch.computeBoundingSphere(); root.add(batch);
  }
}
