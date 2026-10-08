import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { mergeGeometries, mergeGroups } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { DEFAULT_CHURCH_FOG } from "./churchFog.js";

export const MAX_BIBLICAL_TEXTS = 12;

export const BIBLICAL_FONTS = [
  { id: "handwritten", name: "Manuscrita (Kalam)", regular: "kalam", bold: "kalam-bold", width: 1 },
  { id: "condensed", name: "Condensada", regular: "droid-sans", bold: "droid-sans-bold", width: 0.63 },
  { id: "modern", name: "Moderna", regular: "droid-sans", bold: "droid-sans-bold", width: 1 },
  { id: "classic", name: "Clasica", regular: "droid-serif", bold: "droid-serif-bold", width: 1 },
  { id: "humanist", name: "Humanista", regular: "gentilis", bold: "gentilis-bold", width: 1 },
  { id: "mono", name: "Monoespaciada", regular: "droid-mono", bold: "droid-mono", width: 1 }
];
export const BIBLICAL_VARIANTS = [
  { id: "regular", name: "Regular" },
  { id: "italic", name: "Cursiva" },
  { id: "bold", name: "Negrita" },
  { id: "bold-italic", name: "Negrita cursiva" }
];
export const BIBLICAL_LAYOUTS = [
  { id: "sequence", name: "Secuencia" },
  { id: "editorial", name: "Bloques" },
  { id: "contemplative", name: "Diagonal" },
  { id: "monumental", name: "Monumental" },
  { id: "mural", name: "Mural" },
  { id: "immersive", name: "Envolvente" }
];
export const BIBLICAL_LIGHTING = [
  { id: "normal", name: "Actual", ambient: 0.62, exposure: 1.12, key: 1.45, light: "#ffe8b9", ground: "#294433", environment: 0.55, fill: 24, rim: 18 },
  { id: "dark", name: "Oscura", ambient: 0.14, exposure: 0.78, key: 0.52, light: "#d8deeb", ground: "#101915", environment: 0.15, fill: 5, rim: 10 },
  { id: "eerie", name: "Tetrica", ambient: 0.09, exposure: 0.87, key: 0.62, light: "#bdc9d8", ground: "#090e14", environment: 0.08, fill: 2, rim: 24 }
];
export const DEFAULT_BIBLICAL_TYPOGRAPHY = {
  font: "condensed",
  variant: "bold",
  layout: "sequence",
  ink: "#f5f5f0",
  accent: "#ed493b",
  depth: 0.28,
  muralRows: 6,
  speed: 1,
  lighting: "normal",
  atmosphere: false,
  verses: [
    { text: "Jehov\u00e1 es mi pastor; nada me faltar\u00e1.", reference: "Salmos 23:1", emphasis: "PASTOR" },
    { text: "Y la luz en las tinieblas resplandece; mas las tinieblas no la comprendieron.", reference: "Juan 1:5", emphasis: "LUZ" },
    { text: "Todo lo puedo en Cristo que me fortalece.", reference: "Filipenses 4:13", emphasis: "CRISTO" }
  ]
};

const VERSE_SECONDS = 9;
const SEQUENCE = ["editorial", "contemplative", "monumental"];

export function biblicalCameraFraming(layout, aspect, fov) {
  const immersive = layout === "immersive";
  const wide = immersive || layout === "mural";
  const height = wide ? (immersive ? 19 : 14) : 8.5;
  const width = wide ? (immersive ? 31.6 : 26) : 10.5;
  const target = wide ? [0, immersive ? 7.1 : 6, -7] : [0, 4.2, -4.5];
  const distance = Math.max(height, width / Math.max(aspect, 0.1)) / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
  return { target, position: [0.65, wide ? target[1] - 0.6 : 3.1, target[2] + distance] };
}

export function normalizeBiblicalTypography(value = {}) {
  value ||= {};
  const choice = (list, key) => list.some((item) => item.id === value[key]) ? value[key] : DEFAULT_BIBLICAL_TYPOGRAPHY[key];
  const color = (entry, fallback) => /^#[0-9a-f]{6}$/i.test(entry || "") ? entry : fallback;
  const sourceVerses = Array.isArray(value.verses) ? value.verses.slice(0, MAX_BIBLICAL_TEXTS) : DEFAULT_BIBLICAL_TYPOGRAPHY.verses;
  if (!sourceVerses.length) sourceVerses.push({ text: "", reference: "", emphasis: "" });
  return {
    font: value.layout === "immersive" ? "handwritten" : choice(BIBLICAL_FONTS, "font"),
    variant: choice(BIBLICAL_VARIANTS, "variant"),
    layout: choice(BIBLICAL_LAYOUTS, "layout"),
    ink: value.layout === "immersive" ? "#ffffff" : color(value.ink, DEFAULT_BIBLICAL_TYPOGRAPHY.ink),
    accent: value.layout === "immersive" ? "#202020" : color(value.accent, DEFAULT_BIBLICAL_TYPOGRAPHY.accent),
    depth: THREE.MathUtils.clamp(Number(value.depth) || DEFAULT_BIBLICAL_TYPOGRAPHY.depth, 0.06, 0.65),
    muralRows: THREE.MathUtils.clamp(Math.round(Number(value.muralRows) || 6), 3, 8),
    speed: THREE.MathUtils.clamp(Number(value.speed) || 1, 0.4, 1.8),
    lighting: choice(BIBLICAL_LIGHTING, "lighting"),
    atmosphere: value.atmosphere === true,
    verses: sourceVerses.map((verse) => ({
      text: typeof verse?.text === "string" ? verse.text.slice(0, 280) : "",
      reference: typeof verse?.reference === "string" ? verse.reference.slice(0, 48) : "",
      emphasis: typeof verse?.emphasis === "string" ? verse.emphasis.slice(0, 40) : ""
    }))
  };
}

export function biblicalFrameAt(time, speed = 1, count = 3) {
  count = Math.max(1, Math.trunc(count));
  const position = Math.max(0, time * speed);
  const active = Math.floor(position / VERSE_SECONDS) % count;
  const phase = position % VERSE_SECONDS;
  const rawTransition = THREE.MathUtils.clamp((phase - (VERSE_SECONDS - 1.25)) / 1.25, 0, 1);
  return { active, next: (active + 1) % count, transition: count === 1 ? 0 : rawTransition * rawTransition * (3 - 2 * rawTransition) };
}

export function splitBiblicalEmphasis(verse) {
  const text = verse.text.trim().replace(/\s+/g, " ").toUpperCase();
  const requested = verse.emphasis.trim().toUpperCase();
  const fold = (word) => word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const index = requested ? fold(text).indexOf(fold(requested)) : -1;
  if (index >= 0) return { before: text.slice(0, index).trim(), hero: text.slice(index, index + requested.length), after: text.slice(index + requested.length).trim() };
  const words = [...text.matchAll(/[\p{L}\p{N}]+/gu)];
  const hero = words.sort((a, b) => b[0].length - a[0].length)[0];
  if (!hero) return { before: "", hero: text, after: "" };
  return { before: text.slice(0, hero.index).trim(), hero: hero[0], after: text.slice(hero.index + hero[0].length).trim() };
}

function wrapText(text, font, width) {
  const measure = (word) => Array.from(word).reduce((sum, char) => sum + (font.data.glyphs[char]?.ha ?? font.data.glyphs["?"]?.ha ?? 600), 0) / font.data.resolution;
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? line + " " + word : word;
    if (line && measure(next) > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

function disposeComposition(group) {
  const geometries = new Set();
  group.traverse((object) => { if (object.geometry) geometries.add(object.geometry); });
  geometries.forEach((geometry) => geometry.dispose());
  group.clear();
  group.userData.materials?.forEach((material) => material.dispose());
}

function createBlockGeometry(text, font, depth, bevelEnabled = true) {
  const lines = text.split("\n").map((line) => {
    const geometry = new TextGeometry(line, {
      font, size: 1, depth, curveSegments: 4,
      bevelEnabled, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1, steps: 1
    });
    geometry.computeBoundingBox();
    return geometry;
  });
  if (lines.length === 1) return mergeGroups(lines[0]);
  const leading = Math.max(...lines.map((line) => line.boundingBox.max.y - line.boundingBox.min.y)) * 1.14;
  lines.forEach((line, index) => line.translate(0, -index * leading, 0));
  // Preserve the front/side material groups when joining tightly stacked text lines.
  const merged = mergeGeometries(lines);
  let offset = 0;
  for (const line of lines) {
    for (const group of line.groups) merged.addGroup(offset + group.start, group.count, group.materialIndex);
    offset += line.index?.count ?? line.attributes.position.count;
    line.dispose();
  }
  return mergeGroups(merged);
}

function buildImmersive(group, settings, fonts) {
  disposeComposition(group);
  const font = fonts[settings.variant.startsWith("bold") ? "kalam-bold" : "kalam"].font;
  // Unlit white faces keep the ink monochrome even under the scene's colored lights.
  const front = new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false });
  const side = new THREE.MeshBasicMaterial({ color: "#303030", toneMapped: false });
  group.userData.materials = [front, side];
  group.userData.tiles = [];
  const cache = new Map();
  let seed = 73;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const geometryFor = (text, depth) => {
    const key = text + "|" + depth;
    if (cache.has(key)) return cache.get(key);
    const geometry = createBlockGeometry(text, font, depth, depth >= settings.depth * 0.8);
    if (settings.variant.endsWith("italic")) geometry.applyMatrix4(new THREE.Matrix4().makeShear(0, 0, 0.16, 0, 0, 0));
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox;
    geometry.translate(-(bounds.min.x + bounds.max.x) / 2, -(bounds.min.y + bounds.max.y) / 2, 0);
    geometry.computeBoundingBox();
    cache.set(key, geometry);
    return geometry;
  };

  const count = settings.muralRows * 6;
  // Partition the entire existing footprint. Unequal cuts keep the collage irregular
  // without reserving the large empty rectangles left by random rejection packing.
  const regions = [{ x: -14, y: -7.5, width: 28, height: 15 }];
  while (regions.length < count) {
    regions.sort((a, b) => b.width * b.height - a.width * a.height);
    const region = regions.shift();
    const ratio = 0.42 + random() * 0.16;
    if (region.width / region.height > 2.15 + random() * 0.55) {
      const width = region.width * ratio;
      regions.push({ ...region, width }, { ...region, x: region.x + width, width: region.width - width });
    } else {
      const height = region.height * ratio;
      regions.push({ ...region, height }, { ...region, y: region.y + height, height: region.height - height });
    }
  }
  regions.sort((a, b) => b.width * b.height - a.width * a.height);
  const measure = (text) => Array.from(text).reduce((sum, character) => sum + (font.data.glyphs[character]?.ha ?? font.data.glyphs["?"]?.ha ?? 600), 0) / font.data.resolution;

  for (let index = 0; index < count; index++) {
    const verseIndex = index % settings.verses.length;
    const verse = settings.verses[verseIndex];
    if (!verse.text.trim() && !verse.reference.trim()) continue;
    const tile = new THREE.Group();
    tile.name = "Caligrafia " + (verseIndex + 1);
    tile.userData.verseIndex = verseIndex;
    const region = regions[index];
    const hero = index < Math.max(3, Math.round(count / 6));
    const maxTilt = Math.min(0.12, Math.atan(region.height / region.width) * 0.32);
    const rotation = index % 7 === 0 ? maxTilt : (random() - 0.5) * maxTilt * 0.8;
    const cosine = Math.cos(rotation), sine = Math.abs(Math.sin(rotation));
    const determinant = cosine * cosine - sine * sine;
    const availableWidth = region.width - 0.10;
    const availableHeight = region.height - 0.10;
    const width = (availableWidth * cosine - availableHeight * sine) / determinant;
    const height = (availableHeight * cosine - availableWidth * sine) / determinant;
    const parts = splitBiblicalEmphasis(verse);
    const sections = hero
      ? [{ text: parts.before, role: "body" }, { text: parts.hero, role: "emphasis" }, { text: parts.after, role: "body" }]
      : [{ text: verse.text.toUpperCase(), role: "body" }];
    let lines = [], bestScore = Infinity;
    // Select line breaks that fit the region with minimal letter distortion, then
    // justify each handwritten line across it instead of centering a tiny paragraph.
    for (let wrap = 7; wrap <= 42; wrap += 1) {
      const candidate = sections.flatMap((section) => section.text.trim()
        ? wrapText(section.text, font, section.role === "emphasis" ? 24 : wrap).split("\n").map((text) => ({ text, role: section.role })) : []);
      const naturalHeight = candidate.reduce((sum, line) => sum + Math.min(0.9 * width / Math.max(measure(line.text), 0.1),
        hero ? height * (line.role === "emphasis" ? 0.52 : 0.17) : Infinity), 0);
      const score = Math.abs(Math.log(Math.max(naturalHeight, 0.01) / (height * (verse.reference ? 0.9 : 1))));
      if (score < bestScore) { bestScore = score; lines = candidate; }
    }
    if (verse.reference.trim()) lines.push({ text: verse.reference.toUpperCase(), role: "reference" });
    const metrics = lines.map((line) => {
      const geometry = geometryFor(line.text, settings.depth * (line.role === "emphasis" ? 0.85 : line.role === "reference" ? 0.12 : 0.3));
      const size = geometry.boundingBox.getSize(new THREE.Vector3());
      let scale = line.role === "reference" && lines.length > 1
        ? Math.min(width * 0.7 / Math.max(size.x, 0.01), height * 0.085 / Math.max(size.y, 0.01))
        : width / Math.max(size.x, 0.01);
      if (hero && line.role !== "reference") scale = Math.min(scale, height * (line.role === "emphasis" ? 0.52 : 0.17) / Math.max(size.y, 0.01));
      return { ...line, geometry, size, scale };
    });
    const gap = Math.min(0.045, height / (metrics.length * 12));
    const naturalHeight = metrics.reduce((sum, line) => sum + line.size.y * line.scale, 0);
    const stretch = (height - gap * (metrics.length - 1)) / Math.max(naturalHeight, 0.01);
    let top = height / 2;
    const geometries = metrics.map((line) => {
      const geometry = line.geometry.clone();
      const lineHeight = line.size.y * line.scale * stretch;
      geometry.scale(line.scale, line.scale * stretch, 1);
      geometry.translate(line.role === "reference" ? (width - line.size.x * line.scale) / 2 : 0,
        top - lineHeight / 2, line.role === "emphasis" ? 0.22 : 0);
      top -= lineHeight + gap;
      return geometry;
    });
    // Batch each complete phrase into two material groups, regardless of line count.
    const geometry = mergeGeometries(geometries);
    let offset = 0;
    for (const line of geometries) {
      for (const part of line.groups) geometry.addGroup(offset + part.start, part.count, part.materialIndex);
      offset += line.index?.count ?? line.attributes.position.count;
      line.dispose();
    }
    mergeGroups(geometry);
    geometry.computeBoundingBox();
    const mesh = new THREE.Mesh(geometry, [front, side]);
    mesh.userData.text = [verse.text, verse.reference].filter(Boolean).join("\n");
    mesh.userData.role = hero ? "emphasis" : "body";
    tile.add(mesh);
    const placement = { x: region.x + region.width / 2, y: region.y + region.height / 2,
      halfW: region.width / 2 - 0.015, halfH: region.height / 2 - 0.015, scale: 1 };
    const { x, y } = placement;
    tile.userData.footprint = placement;
    const angle = x / 25;
    tile.position.set(Math.sin(angle) * 25, y, 25 * (1 - Math.cos(angle)) + (index % 3) * 0.13);
    tile.rotation.set(0, -angle, rotation);
    group.add(tile);
    group.userData.tiles.push({ tile, y, z: tile.position.z, phase: index * 0.73 });
  }
  cache.forEach((geometry) => geometry.dispose());
  group.position.set(0, 8.2, -10);
}

function buildMural(group, settings, fonts) {
  disposeComposition(group);
  const family = BIBLICAL_FONTS.find((entry) => entry.id === settings.font);
  const font = fonts[settings.variant.startsWith("bold") ? family.bold : family.regular].font;
  const front = new THREE.MeshStandardMaterial({ color: settings.ink, roughness: 0.8, metalness: 0, emissive: settings.ink, emissiveIntensity: 0.08 });
  const side = new THREE.MeshStandardMaterial({ color: new THREE.Color(settings.ink).multiplyScalar(0.22), roughness: 0.65, metalness: 0.08 });
  group.userData.materials = [front, side];
  group.userData.tiles = [];
  const cache = new Map();
  const widths = [5.5, 6.5, 5.7, 6.3];
  const gap = 0.13;
  let left = -12;
  for (let column = 0; column < widths.length; column++) {
    const width = widths[column];
    const weights = Array.from({ length: settings.muralRows }, (_, row) => 0.82 + ((row * 7 + column * 3) % 5) * 0.13);
    const totalWeight = weights.reduce((sum, value) => sum + value, 0);
    let top = 6;
    for (let row = 0; row < settings.muralRows; row++) {
      const index = column * settings.muralRows + row;
      const verseIndex = index % settings.verses.length;
      const verse = settings.verses[verseIndex];
      const height = (12 - gap * (settings.muralRows - 1)) * weights[row] / totalWeight;
      const tile = new THREE.Group();
      tile.name = "Texto mural " + (verseIndex + 1);
      tile.userData.verseIndex = verseIndex;
      const centerX = left + width / 2;
      const centerY = top - height / 2;
      const angle = settings.layout === "immersive" ? centerX / 16 : 0;
      tile.position.set(angle ? Math.sin(angle) * 16 : centerX, centerY, angle ? 16 * (1 - Math.cos(angle)) : 0);
      tile.rotation.set(0, -angle, 0);
      group.add(tile);
      group.userData.tiles.push({ tile, y: centerY, z: tile.position.z, phase: index * 0.73 });

      const addText = (text, y, availableHeight, role = "body", wrap = 0) => {
        if (!text.trim()) return;
        const content = wrap ? wrapText(text.toUpperCase(), font, wrap) : text.toUpperCase();
        const depth = settings.depth * (role === "emphasis" ? 0.8 : 0.15);
        const key = content + "|" + depth;
        let geometry = cache.get(key);
        if (!geometry) {
          geometry = createBlockGeometry(content, font, depth);
          if (settings.variant.endsWith("italic")) geometry.applyMatrix4(new THREE.Matrix4().set(1, 0.2, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1));
          geometry.computeBoundingBox();
          const bounds = geometry.boundingBox;
          if (bounds.isEmpty()) { geometry.dispose(); return; }
          geometry.translate(-bounds.min.x, -(bounds.min.y + bounds.max.y) / 2, 0);
          geometry.computeBoundingBox();
          cache.set(key, geometry);
        }
        const bounds = geometry.boundingBox;
        const scale = Math.min((width - 0.65) / Math.max(bounds.max.x * family.width, 0.01), availableHeight / Math.max(bounds.max.y - bounds.min.y, 0.01));
        const mesh = new THREE.Mesh(geometry, [front, side]);
        mesh.name = "Mural " + role;
        mesh.userData.text = text;
        mesh.userData.role = role;
        mesh.scale.set(scale * family.width, scale, 1);
        mesh.position.set(-bounds.max.x * scale * family.width / 2, y, role === "emphasis" ? 0.12 : 0.02);
        mesh.castShadow = role === "emphasis";
        tile.add(mesh);
      };
      if (verse.text.trim() || verse.reference.trim()) {
        const halfWidth = (width - gap) / 2;
        const halfHeight = height / 2 - 0.02;
        const framePath = (w, h) => {
          const radius = Math.min(0.22, h * 0.25);
          const path = new THREE.Shape();
          path.moveTo(-w + radius, h);
          path.quadraticCurveTo(0, h - 0.05, w - radius, h - 0.015);
          path.quadraticCurveTo(w, h, w, h - radius);
          path.lineTo(w - 0.025, -h + radius);
          path.quadraticCurveTo(w, -h, w - radius, -h);
          path.quadraticCurveTo(0, -h + 0.045, -w + radius, -h + 0.015);
          path.quadraticCurveTo(-w, -h, -w, -h + radius);
          path.lineTo(-w + 0.025, h - radius);
          path.quadraticCurveTo(-w, h, -w + radius, h);
          return path;
        };
        const shape = framePath(halfWidth, halfHeight);
        shape.holes.push(framePath(halfWidth - 0.04, halfHeight - 0.04));
        const border = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false, curveSegments: 5, steps: 1 }), front);
        border.position.z = -0.04;
        tile.add(border);
      }
      const contentHeight = height - 0.46;
      const parts = splitBiblicalEmphasis(verse);
      if (index % 4 === 0 && parts.hero && contentHeight > 1.1) {
        addText(parts.before, contentHeight * 0.42 + 0.1, contentHeight * 0.16, "body", 24);
        addText(parts.hero, 0.08, contentHeight * 0.4, "emphasis");
        addText(parts.after, -contentHeight * 0.34 + 0.05, contentHeight * 0.25, "body", 24);
      } else {
        addText(verse.text, 0.1, contentHeight, "body", column % 2 ? 24 : 18);
      }
      addText(verse.reference, -height / 2 + 0.18, 0.14, "reference");
      top -= height + gap;
    }
    left += width;
  }
  group.position.set(0, 6.6, -9);
}

function buildComposition(group, verse, settings, fonts, index) {
  disposeComposition(group);
  const family = BIBLICAL_FONTS.find((entry) => entry.id === settings.font);
  const font = fonts[settings.variant.startsWith("bold") ? family.bold : family.regular].font;
  const layout = settings.layout === "sequence" ? SEQUENCE[index % SEQUENCE.length] : settings.layout;
  const front = new THREE.MeshStandardMaterial({ color: settings.ink, roughness: 0.32, metalness: 0.12, emissive: settings.ink, emissiveIntensity: 0.12 });
  const side = new THREE.MeshStandardMaterial({ color: new THREE.Color(settings.accent).multiplyScalar(0.38), roughness: 0.38, metalness: 0.3 });
  const accent = new THREE.MeshStandardMaterial({ color: settings.accent, roughness: 0.36, metalness: 0.2, emissive: settings.accent, emissiveIntensity: 0.2 });
  group.userData.materials = [front, side, accent];
  group.userData.parts = [];
  group.userData.layout = layout;
  const composition = new THREE.Group();

  const addText = (text, { x, y, z = 0, width, height, wrap = 0, rotate = 0, colored = false, role = "body" }) => {
    if (!text.trim()) return;
    const depth = settings.depth * (role === "emphasis" ? 1 : role === "reference" ? 0.1 : 0.3);
    const geometry = createBlockGeometry(wrap ? wrapText(text, font, wrap) : text, font, depth);
    if (settings.variant.endsWith("italic")) geometry.applyMatrix4(new THREE.Matrix4().set(1, 0.2, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1));
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox;
    if (bounds.isEmpty()) { geometry.dispose(); return; }
    const dimensions = bounds.getSize(new THREE.Vector3());
    const scale = Math.min(width / Math.max(0.01, dimensions.x * family.width), height / Math.max(0.01, dimensions.y));
    geometry.translate(-bounds.min.x, -(bounds.min.y + bounds.max.y) / 2, 0);
    geometry.scale(scale * family.width, scale, 1);
    geometry.computeBoundingBox();
    const mesh = new THREE.Mesh(geometry, [colored ? accent : front, side]);
    mesh.name = "Biblical " + role;
    mesh.userData.text = text;
    mesh.userData.role = role;
    mesh.position.set(x, y, z);
    mesh.rotation.z = rotate;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    composition.add(mesh);
    group.userData.parts.push({ mesh, y, z, phase: group.userData.parts.length * 0.85 });
    return mesh;
  };
  const bar = (x, y, width, height, z = -0.12) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, settings.depth * 0.6), accent);
    mesh.position.set(x + width / 2, y, z);
    composition.add(mesh);
    return mesh;
  };
  const cross = (x, y) => { bar(x - 0.16, y, 0.32, 0.045); bar(x - 0.0225, y, 0.045, 0.32); };
  const parts = splitBiblicalEmphasis(verse);
  const reference = verse.reference.toUpperCase();
  const number = String(index + 1).padStart(2, "0");

  if (layout === "monumental") {
    const hero = parts.hero.length > 5 && !parts.hero.includes(" ")
      ? parts.hero.slice(0, Math.ceil(parts.hero.length / 2)) + "\n" + parts.hero.slice(Math.ceil(parts.hero.length / 2))
      : parts.hero.replace(/ /g, "\n");
    addText(parts.before, { x: -3.8, y: 1.3, z: -0.3, width: 1.85, height: 1.3, wrap: 6 });
    addText(hero, { x: -1.6, y: 0.25, z: 0.4, width: 5.2, height: 3.8, role: "emphasis" });
    addText(parts.after, { x: -0.5, y: -2.12, z: 0.05, width: 4.1, height: 0.66, wrap: 14 });
    addText(reference, { x: -3.8, y: -0.3, z: -0.25, width: 1.7, height: 0.65, wrap: 8, colored: true, role: "reference" });
    addText(number, { x: -3.8, y: -1.7, width: 0.65, height: 0.58, colored: true });
    bar(-3.8, 2.47, 7.3, 0.035);
    bar(-3.8, -0.95, 1.0, 0.06);
    cross(3.7, -2.25);
  } else if (layout === "contemplative") {
    addText(parts.before, { x: -3.35, y: 1.53, z: -0.3, width: 5.55, height: 0.64, wrap: 17 });
    addText(parts.hero, { x: -3.35, y: 0.08, z: 0.5, width: 6.3, height: 1.82, role: "emphasis" });
    addText(parts.after, { x: -1.9, y: -1.62, z: 0.08, width: 5.3, height: 1.13, wrap: 22 });
    addText(reference, { x: -3.95, y: -1.5, z: -0.25, width: 2.45, height: 0.18, rotate: Math.PI / 2, colored: true, role: "reference" });
    addText(number + " / SAGRADA ESCRITURA", { x: -3.35, y: 2.28, width: 3.2, height: 0.18 });
    bar(-3.35, 1.04, 6.3, 0.035, -0.3);
    bar(-2.0, -2.35, 4.9, 0.07);
    cross(3.32, 1.3);
    cross(3.72, 1.3);
    composition.rotation.z = 0.14;
  } else {
    addText(number + " / " + reference, { x: -3.65, y: 2.3, width: 5.0, height: 0.2, colored: true, role: "reference" });
    addText(parts.before, { x: -3.65, y: 1.37, z: -0.24, width: 5.8, height: 0.73, wrap: 17 });
    addText(parts.hero, { x: -3.65, y: -0.13, z: 0.45, width: 7.0, height: 1.84, role: "emphasis" });
    addText(parts.after, { x: -1.3, y: -1.77, z: 0.08, width: 4.8, height: 0.88, wrap: 13 });
    bar(-3.65, 1.92, 7.0, 0.035);
    bar(-3.65, -1.52, 1.65, 0.085);
    bar(-3.65, -1.77, 0.75, 0.035);
    cross(3.4, 2.3);
  }
  // Fit the assembled design, including rotated blocks, into a stable world-space footprint.
  composition.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(composition);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = Math.min(1, 8.6 / Math.max(size.x, 0.01), 5.3 / Math.max(size.y, 0.01));
  composition.scale.setScalar(scale);
  composition.position.set(-center.x * scale, -center.y * scale, 0);
  group.add(composition);
}

export function createBiblicalTypographyScene(settings, fonts) {
  const scene = new THREE.Group();
  scene.name = "Tipografia biblica 3D";
  scene.visible = false;
  scene.userData.fonts = fonts;
  scene.userData.verses = [];
  scene.userData.mural = new THREE.Group();
  scene.userData.mural.name = "Mural tipografico 3D";
  scene.add(scene.userData.mural);
  const fill = new THREE.PointLight(0xffffff, 24, 22, 2);
  fill.position.set(-3, 7, 0);
  scene.add(fill);
  scene.userData.fill = fill;
  const rim = new THREE.PointLight(0xffffff, 18, 18, 2);
  rim.position.set(4, 5, -6);
  scene.add(rim);
  scene.userData.rim = rim;
  updateBiblicalTypographyScene(scene, settings);
  animateBiblicalTypographyScene(scene, 0);
  return scene;
}

export function updateBiblicalTypographyScene(scene, value) {
  const settings = normalizeBiblicalTypography(value);
  scene.userData.settings = settings;
  scene.userData.rim.color.set(settings.layout === "immersive" || settings.lighting !== "normal" ? "#e1e5eb" : settings.accent);
  scene.userData.fog = { ...DEFAULT_CHURCH_FOG, enabled: settings.atmosphere, intensity: 0.16, height: 1.8, coverage: 38, color: "#555d65", windSpeed: 0.32, turbulence: 0.5 };
  const muralActive = settings.layout === "mural" || settings.layout === "immersive";
  while (scene.userData.verses.length > settings.verses.length) {
    const group = scene.userData.verses.pop();
    disposeComposition(group);
    scene.remove(group);
  }
  while (scene.userData.verses.length < settings.verses.length) {
    const group = new THREE.Group();
    scene.add(group);
    scene.userData.verses.push(group);
  }
  const mural = scene.userData.mural;
  mural.visible = muralActive;
  if (muralActive) {
    scene.userData.verses.forEach((group) => {
      group.visible = false;
      if (group.children.length) { disposeComposition(group); delete group.userData.signature; }
    });
    const signature = JSON.stringify([settings.verses, settings.font, settings.variant, settings.layout, settings.ink, settings.depth, settings.muralRows]);
    if (mural.userData.signature !== signature) {
      (settings.layout === "immersive" ? buildImmersive : buildMural)(mural, settings, scene.userData.fonts);
      mural.userData.signature = signature;
    }
    return;
  }
  if (mural.children.length) { disposeComposition(mural); delete mural.userData.signature; }
  scene.userData.verses.forEach((group, index) => {
    const signature = JSON.stringify([settings.verses[index], settings.font, settings.variant, settings.layout, settings.ink, settings.accent, settings.depth]);
    if (group.userData.signature === signature) return;
    buildComposition(group, settings.verses[index], settings, scene.userData.fonts, index);
    group.userData.signature = signature;
  });
}

export function animateBiblicalTypographyScene(scene, time) {
  const settings = scene.userData.settings;
  const lighting = BIBLICAL_LIGHTING.find((entry) => entry.id === settings.lighting);
  const breathing = settings.atmosphere && settings.lighting === "eerie" ? 0.91 + Math.sin(time * 0.65) * 0.09 : 1;
  scene.userData.fill.intensity = lighting.fill * breathing;
  scene.userData.rim.intensity = lighting.rim * breathing;
  const mural = scene.userData.mural;
  if (mural.visible) {
    mural.userData.tiles.forEach(({ tile, y, z, phase }) => {
      tile.position.y = y + Math.sin(time * settings.speed * 0.4 + phase) * 0.015;
      tile.position.z = z + Math.sin(time * settings.speed * 0.5 + phase) * 0.09;
    });
    return;
  }
  const frame = biblicalFrameAt(time, settings.speed, settings.verses.length);
  scene.userData.verses.forEach((group, index) => {
    const current = index === frame.active;
    const incoming = index === frame.next;
    const opacity = current ? 1 - frame.transition : incoming ? frame.transition : 0;
    group.visible = opacity > 0.005;
    if (!group.visible) return;
    const slide = current ? -frame.transition : 1 - frame.transition;
    group.position.set(slide * 2.3, 4.4 + Math.sin(time * 0.5 + index) * 0.07, -4.5 - Math.abs(slide) * 1.3);
    group.rotation.set(0.015, -0.16 + Math.sin(time * 0.3) * 0.045 + slide * 0.22, 0);
    for (const material of group.userData.materials) {
      const transparent = opacity < 0.999;
      if (material.transparent !== transparent) { material.transparent = transparent; material.needsUpdate = true; }
      material.opacity = opacity;
      material.depthWrite = !transparent;
    }
    group.userData.parts.forEach(({ mesh, y, z, phase }) => {
      mesh.position.y = y + Math.sin(time * 0.75 + phase) * 0.018;
      mesh.position.z = z + Math.sin(time * 0.6 + phase) * 0.075;
    });
  });
}

export function disposeBiblicalTypographyScene(scene) {
  scene.userData.verses.forEach(disposeComposition);
  disposeComposition(scene.userData.mural);
  scene.clear();
}
