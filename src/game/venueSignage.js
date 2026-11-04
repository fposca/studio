import * as THREE from "three";

const SIGN_FONT = '"Bahnschrift", "Segoe UI", Arial, sans-serif';

// Fit the font, never stretch the glyphs to fit a different physical sign.
function lettering(ctx, text, x, y, maxWidth, size, color, { spacing = .04, weight = 600, align = "left" } = {}) {
  const chars = [...text];
  const measure = () => {
    ctx.font = weight + " " + size + "px " + SIGN_FONT;
    return chars.reduce((total, char) => total + ctx.measureText(char).width, 0) + Math.max(0, chars.length - 1) * size * spacing;
  };
  let width = measure();
  if (width > maxWidth) { size *= maxWidth / width; width = measure(); }
  let cursor = align === "center" ? x - width / 2 : x;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (const char of chars) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + size * spacing;
  }
}

function emblem(ctx, x, y, radius, style, accent) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#12111c";
  ctx.strokeStyle = accent;
  ctx.lineWidth = radius * .035;
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (style === "vinyl") {
    for (const scale of [.84, .72, .62]) {
      ctx.strokeStyle = "#9b818b66";
      ctx.beginPath(); ctx.arc(0, 0, radius * scale, -.65, Math.PI * 1.55); ctx.stroke();
    }
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(0, 0, radius * .32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f1dfc0";
    ctx.beginPath(); ctx.arc(0, 0, radius * .07, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = "#ecdfc8";
    ctx.fillRect(-radius * .49, radius * .19, radius * .98, radius * .12);
    ctx.fillRect(-radius * .12, -radius * .25, radius * .1, radius * .45);
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(-radius * .07, -radius * .32, radius * .18, 0, Math.PI * 2); ctx.fill();
    for (const x of [.21, .40]) {
      ctx.beginPath(); ctx.arc(radius * x, radius * .03, radius * .065, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

export function createVenueSignTexture(title, {
  aspect = 4, pixelWidth = 1024, subtitle = "", hero = false, symbol = "arcade",
  kicker = "", badgeKicker = "EST.", badgeText = "1999", accent = "#cf7dad", background = "#17131f", color = "#f6e6ca",
} = {}) {
  const canvas = document.createElement("canvas");
  const width = Math.min(2048, Math.max(256, pixelWidth));
  canvas.width = Math.round(width);
  canvas.height = Math.max(32, Math.round(width / aspect));
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);
  const sheen = ctx.createLinearGradient(0, 0, w, h);
  sheen.addColorStop(0, "#ffffff0b"); sheen.addColorStop(.45, "#ffffff00"); sheen.addColorStop(1, "#0000002b");
  ctx.fillStyle = sheen; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = hero ? "#c8b4a16b" : color + "50";
  ctx.lineWidth = Math.max(1, h * .007);
  ctx.strokeRect(h * .065, h * .065, w - h * .13, h * .87);
  ctx.fillStyle = accent;
  ctx.fillRect(h * .065, h * .065, hero ? h * .65 : h * .3, h * .012);
  ctx.fillRect(w - h * .365, h * .923, h * .3, h * .012);

  if (hero) {
    const left = h * 1.25, available = w - left - h * 1.3;
    emblem(ctx, h * .64, h * .51, h * .32, symbol, accent);
    ctx.strokeStyle = "#d4b9c336"; ctx.lineWidth = h * .006;
    ctx.beginPath(); ctx.moveTo(h * 1.08, h * .23); ctx.lineTo(h * 1.08, h * .78); ctx.stroke();
    lettering(ctx, kicker, left, h * .23, available, h * .092, accent, { spacing: .15, weight: 600 });
    lettering(ctx, title, left, h * .49, available, h * .43, color, { spacing: .025, weight: 700 });
    lettering(ctx, subtitle, left, h * .77, available, h * .115, "#c7b8bd", { spacing: .12 });
    const badgeX = w - h * .7;
    ctx.strokeStyle = "#d4b9c336";
    ctx.beginPath(); ctx.moveTo(w - h * 1.14, h * .23); ctx.lineTo(w - h * 1.14, h * .78); ctx.stroke();
    lettering(ctx, badgeKicker, badgeX, h * .36, h * .66, h * .085, accent, { align: "center", spacing: .17 });
    lettering(ctx, badgeText, badgeX, h * .56, h * .66, h * .19, color, { align: "center", spacing: .04 });
    for (const x of [h * .13, w - h * .13]) for (const y of [h * .13, h * .87]) {
      ctx.fillStyle = "#9a8d8b"; ctx.beginPath(); ctx.arc(x, y, h * .012, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#332932"; ctx.beginPath(); ctx.moveTo(x - h * .008, y); ctx.lineTo(x + h * .008, y); ctx.stroke();
    }
  } else {
    const padding = h * .22;
    lettering(ctx, title.toUpperCase(), w / 2, h * (subtitle ? .4 : .51), w - padding * 2,
      h * (subtitle ? .39 : .5), color, { align: "center", spacing: .035, weight: 600 });
    if (subtitle) lettering(ctx, subtitle.toUpperCase(), w / 2, h * .74, w - padding * 2,
      h * .16, accent, { align: "center", spacing: .1 });
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.name = "venue-sign:" + title;
  return texture;
}

export function createVenueSign(title, width, height, options = {}) {
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: createVenueSignTexture(title, { ...options, aspect: width / height }),
      side: THREE.DoubleSide, toneMapped: false,
    }));
  face.name = "venue-sign:" + title;
  if (options.hero) {
    const edge = Math.min(.025, height * .024);
    const metal = new THREE.MeshStandardMaterial({ color: 0x756474, roughness: .39, metalness: .65 });
    const backing = new THREE.Mesh(new THREE.BoxGeometry(width + .08, height + .08, .1),
      new THREE.MeshStandardMaterial({ color: 0x19151f, roughness: .58, metalness: .25 }));
    backing.position.z = -.058; face.add(backing);
    for (const [w, h, x, y] of [
      [width + .08, edge, 0, height / 2 + .025], [width + .08, edge, 0, -height / 2 - .025],
      [edge, height + .05, -width / 2 - .025, 0], [edge, height + .05, width / 2 + .025, 0],
    ]) {
      const rim = new THREE.Mesh(new THREE.BoxGeometry(w, h, .035), metal);
      rim.position.set(x, y, -.003); face.add(rim);
    }
  }
  return face;
}


// Double-sided 90s lightbox. The halo is baked, so it needs no extra lights or bloom pass.
export function createHangingNeonSign(title, width = 3.05, height = .62, {
  accent = "#76e6ff", secondary = "#bc85ff",
} = {}) {
  const group = new THREE.Group();
  group.name = "hanging-neon-sign:" + title;
  const panel = document.createElement("canvas");
  panel.width = 1024; panel.height = Math.round(1024 * (height - .06) / (width - .06));
  const ctx = panel.getContext("2d"), w = panel.width, h = panel.height;
  const enamel = ctx.createLinearGradient(0, 0, 0, h);
  enamel.addColorStop(0, "#1c1a30"); enamel.addColorStop(.45, "#0c0b17"); enamel.addColorStop(1, "#171127");
  ctx.fillStyle = enamel; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = secondary + "80"; ctx.lineWidth = h * .012;
  ctx.strokeRect(h * .17, h * .18, w - h * .34, h * .64);
  ctx.save();
  ctx.shadowColor = accent; ctx.shadowBlur = h * .095;
  lettering(ctx, title, w / 2, h * .46, w - h * .67, h * .40, "#f4f5ff",
    { align: "center", spacing: .055, weight: 600 });
  ctx.shadowBlur = h * .035;
  lettering(ctx, "NEONBOY MUSIC / EST. 1999", w / 2, h * .73, w - h, h * .095, accent,
    { align: "center", spacing: .18, weight: 500 });
  ctx.restore();
  const panelMap = new THREE.CanvasTexture(panel);
  panelMap.colorSpace = THREE.SRGBColorSpace; panelMap.anisotropy = 4;
  panelMap.name = "neon-lightbox:" + title;
  const faceGeometry = new THREE.PlaneGeometry(width - .06, height - .06);
  const faceMaterial = new THREE.MeshBasicMaterial({ map: panelMap, toneMapped: false });

  const casing = new THREE.Mesh(new THREE.BoxGeometry(width + .035, height + .035, .14),
    new THREE.MeshStandardMaterial({ color: 0x171320, metalness: .55, roughness: .37 }));
  group.add(casing);

  const roundedPath = new THREE.Path();
  const a = width / 2 - .018, b = height / 2 - .018, r = .07;
  roundedPath.moveTo(-a + r, -b);
  roundedPath.lineTo(a - r, -b); roundedPath.quadraticCurveTo(a, -b, a, -b + r);
  roundedPath.lineTo(a, b - r); roundedPath.quadraticCurveTo(a, b, a - r, b);
  roundedPath.lineTo(-a + r, b); roundedPath.quadraticCurveTo(-a, b, -a, b - r);
  roundedPath.lineTo(-a, -b + r); roundedPath.quadraticCurveTo(-a, -b, -a + r, -b);
  const points = roundedPath.getPoints(8).map(p => new THREE.Vector3(p.x, p.y, 0));
  const tubePath = new THREE.CurvePath();
  for (let i = 1; i < points.length; i++) tubePath.add(new THREE.LineCurve3(points[i - 1], points[i]));
  const tubeGeometry = new THREE.TubeGeometry(tubePath, 128, .009, 6, true);
  const tubeMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(accent).lerp(new THREE.Color("#ffffff"), .55), toneMapped: false,
  });

  const haloWidth = width + .48, haloHeight = height + .48;
  const haloCanvas = document.createElement("canvas");
  haloCanvas.width = 1024; haloCanvas.height = Math.round(1024 * haloHeight / haloWidth);
  const halo = haloCanvas.getContext("2d"), unit = haloCanvas.width / haloWidth;
  halo.translate(haloCanvas.width / 2, haloCanvas.height / 2);
  halo.strokeStyle = accent; halo.lineWidth = unit * .018;
  halo.shadowColor = accent; halo.shadowBlur = unit * .09;
  // Screen-aligned halos keep the glow soft while the actual tube supplies depth.
  halo.beginPath(); halo.roundRect(-a * unit, -b * unit, a * 2 * unit, b * 2 * unit, r * unit); halo.stroke();
  const haloMap = new THREE.CanvasTexture(haloCanvas);
  haloMap.colorSpace = THREE.SRGBColorSpace;
  const haloGeometry = new THREE.PlaneGeometry(haloWidth, haloHeight);
  const haloMaterial = new THREE.MeshBasicMaterial({
    map: haloMap, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, toneMapped: false, opacity: .8,
  });
  for (const side of [1, -1]) {
    const face = new THREE.Mesh(faceGeometry, faceMaterial);
    face.position.z = side * .071; face.rotation.y = side < 0 ? Math.PI : 0; group.add(face);
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.position.z = side * .085; group.add(tube);
    const glow = new THREE.Mesh(haloGeometry, haloMaterial);
    glow.position.z = side * .083; glow.rotation.y = face.rotation.y; group.add(glow);
  }
  return group;
}
