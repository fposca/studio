import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Box3, Color, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import helvetikerFont from "../assets/fonts/helvetiker_regular.typeface.json";
import helvetikerBoldFont from "../assets/fonts/helvetiker_bold.typeface.json";
import optimerFont from "../assets/fonts/optimer_regular.typeface.json";
import optimerBoldFont from "../assets/fonts/optimer_bold.typeface.json";
import gentilisFont from "../assets/fonts/gentilis_regular.typeface.json";
import gentilisBoldFont from "../assets/fonts/gentilis_bold.typeface.json";
import droidSansFont from "../assets/fonts/droid_sans_regular.typeface.json";
import droidSansBoldFont from "../assets/fonts/droid_sans_bold.typeface.json";
import droidSerifFont from "../assets/fonts/droid_serif_regular.typeface.json";
import droidSerifBoldFont from "../assets/fonts/droid_serif_bold.typeface.json";
import droidMonoFont from "../assets/fonts/droid_sans_mono_regular.typeface.json";
import fieldPanorama from "../assets/environments/field-panorama.png";
import cloudsPanorama from "../assets/environments/clouds-panorama.png";
import factoryPanorama from "../assets/environments/factory-panorama.png";
import grassTexture from "../assets/environments/grass-texture.png";
import dirtTexture from "../assets/environments/dirt-texture.png";
import brushedMetalTexture from "../assets/environments/brushed-metal-texture.png";
import concreteTexture from "../assets/environments/concrete-texture.png";
import ceramicTilesTexture from "../assets/environments/ceramic-tiles-texture.png";
import plasticTexture from "../assets/environments/plastic-texture.png";
import fantasyFloorTexture from "../assets/environments/fantasy-floor-texture.png";
import gasFloorTexture from "../assets/environments/gas-floor-texture.png";
import waterFloorTexture from "../assets/environments/water-floor-texture.png";
import walnutTexture from "../assets/environments/walnut-texture.png";
import marbleTexture from "../assets/environments/marble-texture.png";
import leatherTexture from "../assets/environments/leather-texture.png";
import skyDay from "../assets/environments/sky-day.png";
import skySun from "../assets/environments/sky-sun.png";
import skySunset from "../assets/environments/sky-sunset.png";
import skyNight from "../assets/environments/sky-night.png";
import skySpace from "../assets/environments/sky-space.png";
import {
  ArrowDownToLine, Box, Camera, Circle, ClipboardPaste, Combine, Cone, Copy, Cylinder, Download, Eye,
  EyeOff, Flashlight, Focus, Grid3X3, ImageDown, Lightbulb, LocateFixed,
  Group, Hammer, MousePointer2, Move3D, Palette, Redo2, Rotate3D, Scale3D, Sparkles, Square,
  Sun, Trash2, Type, Undo2, Ungroup, Upload
} from "lucide-react";
import { getProject, putProject } from "../storage/projectDb.js";
import ThreeAnimationPanel from "./ThreeAnimationPanel.jsx";

const THREE_PROJECT_ID = "three";
const CAMERA_TRACK_ID = "__camera__";
const DEFAULT_BACKGROUND = "#17191d";
const ENVIRONMENT_BACKGROUNDS = [
  { id: "solid", name: "Color", image: "" },
  { id: "field", name: "Campo", image: fieldPanorama },
  { id: "clouds", name: "Nubes", image: cloudsPanorama },
  { id: "factory", name: "Fabrica", image: factoryPanorama }
];
const SKY_BACKGROUNDS = [
  { id: "sky-clouds", name: "Nubes", image: cloudsPanorama, ambient: 1.05, exposure: 1.02, key: 2.1, light: "#e8f2ff", ground: "#8ba0ba", environment: 0.8 },
  { id: "sky-space", name: "Espacio", image: skySpace, ambient: 0.18, exposure: 1.3, key: 0.45, light: "#9ba8ff", ground: "#090414", environment: 0.95 },
  { id: "sky-sun", name: "Sol", image: skySun, ambient: 0.85, exposure: 1.08, key: 4.2, light: "#fff1c4", ground: "#7e91a4", environment: 0.85 },
  { id: "sky-night", name: "Noche", image: skyNight, ambient: 0.16, exposure: 1.2, key: 0.32, light: "#9cbcff", ground: "#050914", environment: 0.7 },
  { id: "sky-day", name: "Dia", image: skyDay, ambient: 1, exposure: 1, key: 2.6, light: "#fff8e8", ground: "#7892a6", environment: 0.82 },
  { id: "sky-sunset", name: "Atardecer", image: skySunset, ambient: 0.48, exposure: 1.13, key: 2.4, light: "#ffad66", ground: "#50345e", environment: 0.9 }
];
const FLOOR_SURFACES = [
  { id: "shadow", name: "Solo sombra", color: "#20242a" },
  { id: "grass", name: "Pasto", color: "#4f7f32" },
  { id: "metal", name: "Metal", color: "#87929a" },
  { id: "dirt", name: "Tierra", color: "#79543a" },
  { id: "plastic", name: "Plastico", color: "#59636f" },
  { id: "concrete", name: "Cemento", color: "#777a78" },
  { id: "tiles", name: "Ceramicos", color: "#d8dde0" },
  { id: "glass", name: "Vidrio", color: "#bdefff" },
  { id: "fantasy", name: "Fantasia", color: "#b54cff" },
  { id: "gas", name: "Gases", color: "#5442d6" },
  { id: "water", name: "Agua", color: "#34c4e8" }
];
const REALISTIC_FLOOR_TEXTURES = {
  grass: grassTexture,
  dirt: dirtTexture,
  metal: brushedMetalTexture,
  concrete: concreteTexture,
  tiles: ceramicTilesTexture,
  plastic: plasticTexture,
  fantasy: fantasyFloorTexture,
  gas: gasFloorTexture,
  water: waterFloorTexture
};
const FONT_LOADER = new FontLoader();
const THREE_FONTS = {
  helvetiker: { name: "Helvetiker", font: FONT_LOADER.parse(helvetikerFont) },
  "helvetiker-bold": { name: "Helvetiker Bold", font: FONT_LOADER.parse(helvetikerBoldFont) },
  optimer: { name: "Optimer", font: FONT_LOADER.parse(optimerFont) },
  "optimer-bold": { name: "Optimer Bold", font: FONT_LOADER.parse(optimerBoldFont) },
  gentilis: { name: "Gentilis", font: FONT_LOADER.parse(gentilisFont) },
  "gentilis-bold": { name: "Gentilis Bold", font: FONT_LOADER.parse(gentilisBoldFont) },
  "droid-sans": { name: "Droid Sans", font: FONT_LOADER.parse(droidSansFont) },
  "droid-sans-bold": { name: "Droid Sans Bold", font: FONT_LOADER.parse(droidSansBoldFont) },
  "droid-serif": { name: "Droid Serif", font: FONT_LOADER.parse(droidSerifFont) },
  "droid-serif-bold": { name: "Droid Serif Bold", font: FONT_LOADER.parse(droidSerifBoldFont) },
  "droid-mono": { name: "Droid Mono", font: FONT_LOADER.parse(droidMonoFont) }
};
const MATERIAL_PRESETS = [
  { id: "plastic", name: "Plastico", color: "#8b5cf6", metalness: 0.02, roughness: 0.3, clearcoat: 0.25, bumpTexture: plasticTexture, bumpScale: 0.015 },
  { id: "chrome", name: "Cromo", color: "#f4f7f8", metalness: 1, roughness: 0.1 },
  { id: "gold", name: "Oro", color: "#d8a83e", metalness: 1, roughness: 0.17 },
  { id: "glass", name: "Vidrio", color: "#d9f6ff", metalness: 0, roughness: 0.04, transmission: 0.96, opacity: 0.62, ior: 1.5, thickness: 0.65 },
  { id: "neon", name: "Neon", color: "#063d32", metalness: 0, roughness: 0.32, emissive: "#00f5ad", emissiveIntensity: 1.05, toneMapped: false },
  { id: "matte", name: "Mate", color: "#ef476f", metalness: 0, roughness: 0.94 },
  { id: "steel", name: "Acero", color: "#ffffff", metalness: 0.88, roughness: 0.26, texture: brushedMetalTexture, bumpScale: 0.01 },
  { id: "wood", name: "Madera", color: "#ffffff", metalness: 0, roughness: 0.48, texture: walnutTexture, bumpScale: 0.025 },
  { id: "marble", name: "Marmol", color: "#ffffff", metalness: 0, roughness: 0.2, clearcoat: 0.45, texture: marbleTexture, bumpScale: 0.012 },
  { id: "leather", name: "Cuero", color: "#ffffff", metalness: 0, roughness: 0.7, texture: leatherTexture, bumpScale: 0.045 },
  { id: "concrete", name: "Cemento", color: "#ffffff", metalness: 0, roughness: 0.9, texture: concreteTexture, bumpScale: 0.04 },
  { id: "ceramic", name: "Ceramica", color: "#ffffff", metalness: 0, roughness: 0.2, clearcoat: 0.4, texture: ceramicTilesTexture, bumpScale: 0.02 }
];
const makeId = () => crypto.randomUUID?.() || `object-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const round = (value) => Math.round(value * 100) / 100;

function createFloorTexture(surface) {
  if (["shadow", "glass"].includes(surface)) return null;
  if (REALISTIC_FLOOR_TEXTURES[surface]) {
    const texture = new THREE.TextureLoader().load(REALISTIC_FLOOR_TEXTURES[surface]);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    const repeats = { grass: 14, dirt: 12, metal: 8, concrete: 10, tiles: 8, plastic: 12, fantasy: 7, gas: 5, water: 10 };
    texture.repeat.set(repeats[surface], repeats[surface]);
    texture.anisotropy = 8;
    return texture;
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  const colors = { grass: "#527d35", metal: "#89939a", dirt: "#76523a", concrete: "#777a78", tiles: "#d9dde0" };
  context.fillStyle = colors[surface] || "#777a78";
  context.fillRect(0, 0, 256, 256);
  let seed = 9187;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  if (surface === "tiles") {
    context.strokeStyle = "#737b80";
    context.lineWidth = 5;
    for (let value = 0; value <= 256; value += 64) { context.beginPath(); context.moveTo(value, 0); context.lineTo(value, 256); context.stroke(); context.beginPath(); context.moveTo(0, value); context.lineTo(256, value); context.stroke(); }
  } else if (surface === "metal") {
    for (let x = 0; x < 256; x += 3) { context.fillStyle = x % 12 ? "rgba(255,255,255,.08)" : "rgba(20,28,34,.16)"; context.fillRect(x, 0, 1, 256); }
  } else {
    const count = surface === "grass" ? 1800 : 950;
    for (let index = 0; index < count; index += 1) {
      const alpha = 0.08 + random() * 0.2;
      context.fillStyle = random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
      const size = surface === "grass" ? 1 + random() * 2 : 1 + random() * 4;
      context.fillRect(random() * 256, random() * 256, size, size);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(surface === "tiles" ? 18 : 26, surface === "tiles" ? 18 : 26);
  texture.anisotropy = 8;
  return texture;
}

function createFloorMaterial(surface, color) {
  if (surface === "shadow") return new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.32, transparent: true });
  const map = createFloorTexture(surface);
  const settings = {
    grass: { color: 0xffffff, roughness: 0.95, metalness: 0 },
    metal: { color: 0xffffff, roughness: 0.28, metalness: 0.9 },
    dirt: { color: 0xffffff, roughness: 1, metalness: 0 },
    concrete: { color: 0xffffff, roughness: 0.88, metalness: 0 },
    tiles: { color: 0xffffff, roughness: 0.24, metalness: 0.05 },
    plastic: { color, roughness: 0.32, metalness: 0.04 }
  }[surface];
  if (surface === "glass") return new THREE.MeshPhysicalMaterial({ color: 0xbdefff, roughness: 0.08, metalness: 0, transmission: 0.72, opacity: 0.48, transparent: true, side: THREE.DoubleSide });
  if (surface === "fantasy") return new THREE.MeshPhysicalMaterial({
    color: 0xffffff, map, bumpMap: map, bumpScale: 0.035, roughness: 0.18, metalness: 0.12,
    clearcoat: 0.72, clearcoatRoughness: 0.08, iridescence: 0.78, iridescenceIOR: 1.3
  });
  if (surface === "gas") return new THREE.MeshPhysicalMaterial({
    color: 0xffffff, map, emissiveMap: map, emissive: 0x171050, emissiveIntensity: 0.42,
    roughness: 0.48, metalness: 0, transparent: true, opacity: 0.9, side: THREE.DoubleSide
  });
  if (surface === "water") return new THREE.MeshPhysicalMaterial({
    color: 0xe5fbff, map, bumpMap: map, bumpScale: 0.065, roughness: 0.055, metalness: 0,
    transmission: 0.62, transparent: true, opacity: 0.82, ior: 1.333, thickness: 0.5,
    clearcoat: 1, clearcoatRoughness: 0.035, side: THREE.DoubleSide
  });
  if (surface === "plastic") return new THREE.MeshStandardMaterial({ ...settings, map: null, bumpMap: map, bumpScale: 0.018 });
  const relief = ["grass", "dirt", "metal", "concrete", "tiles"].includes(surface);
  const bumpScale = { grass: 0.09, dirt: 0.06, metal: 0.012, concrete: 0.035, tiles: 0.025 }[surface] || 0;
  return new THREE.MeshStandardMaterial({ ...settings, map, bumpMap: relief ? map : null, bumpScale });
}

function createTextGeometry(value, depth, fontId = "helvetiker") {
  const geometry = new TextGeometry(value, {
    font: THREE_FONTS[fontId]?.font || THREE_FONTS.helvetiker.font,
    size: 1,
    depth,
    curveSegments: 10,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.025,
    bevelSegments: 3
  });
  geometry.computeBoundingBox();
  const width = geometry.boundingBox?.getSize(new Vector3()).x || 0;
  geometry.translate(-width / 2, 0, 0);
  return geometry;
}

async function fileToTextureDataUrl(file) {
  if (file.size > 12 * 1024 * 1024) throw new Error("La textura supera el limite de 12 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const outputType = file.type === "image/jpeg" ? "image/jpeg" : "image/png";
  return canvas.toDataURL(outputType, 0.9);
}

function animationFramePair(frames, time) {
  const ordered = [...frames].sort((a, b) => a.time - b.time);
  let before = ordered[0];
  let after = ordered[ordered.length - 1];
  for (let index = 0; index < ordered.length - 1; index += 1) {
    if (time >= ordered[index].time && time <= ordered[index + 1].time) {
      before = ordered[index];
      after = ordered[index + 1];
      break;
    }
  }
  if (time <= ordered[0].time) after = before = ordered[0];
  if (time >= ordered[ordered.length - 1].time) after = before = ordered[ordered.length - 1];
  const span = Math.max(after.time - before.time, 0.0001);
  return { before, after, alpha: before === after ? 0 : THREE.MathUtils.clamp((time - before.time) / span, 0, 1) };
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function disposeObject(root) {
  root.traverse((item) => {
    item.geometry?.dispose?.();
    if (Array.isArray(item.material)) item.material.forEach((material) => material.dispose?.());
    else item.material?.dispose?.();
  });
}

function iconForType(type) {
  if (type === "sphere") return Circle;
  if (type === "cylinder") return Cylinder;
  if (type === "cone") return Cone;
  if (type === "light") return Lightbulb;
  if (type === "text") return Type;
  if (type === "svg") return Palette;
  if (type === "model") return Sparkles;
  return Box;
}

export default function ThreeDEditor({ active = false, onRequestProjectSave, openProjectSignal = 0 }) {
  const hostRef = useRef(null);
  const runtimeRef = useRef(null);
  const selectedRef = useRef(null);
  const selectedIdsRef = useRef(new Set());
  const historyRef = useRef({ undo: [], redo: [], restoring: false });
  const clipboardRef = useRef(null);
  const modeRef = useRef("translate");
  const sculptingRef = useRef(false);
  const sculptSettingsRef = useRef({ brush: "inflate", radius: 0.65, strength: 0.3 });
  const animationTracksRef = useRef({});
  const rotationDragRef = useRef(null);
  const cameraOrbitRef = useRef({ lastTheta: null, theta: 0 });
  const applyingAnimationRef = useRef(false);
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [mode, setMode] = useState("translate");
  const [background, setBackground] = useState(DEFAULT_BACKGROUND);
  const [environmentBackground, setEnvironmentBackground] = useState("solid");
  const [gridVisible, setGridVisible] = useState(true);
  const [ambientIntensity, setAmbientIntensity] = useState(0.7);
  const [exposure, setExposure] = useState(1.15);
  const [floorVisible, setFloorVisible] = useState(true);
  const [floorColor, setFloorColor] = useState("#24272d");
  const [floorSurface, setFloorSurface] = useState("plastic");
  const [renderResolution, setRenderResolution] = useState("1920x1080");
  const [transparentPng, setTransparentPng] = useState(false);
  const [selection, setSelection] = useState(null);
  const [status, setStatus] = useState("");
  const [textDraft, setTextDraft] = useState("Studio");
  const [extrudeDepth, setExtrudeDepth] = useState(0.35);
  const [textFont, setTextFont] = useState("helvetiker");
  const [animationDuration, setAnimationDuration] = useState(5);
  const [animationTime, setAnimationTime] = useState(0);
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [animationTracks, setAnimationTracks] = useState({});
  const [animationFps, setAnimationFps] = useState(30);
  const [animationExporting, setAnimationExporting] = useState(false);
  const [propertyTab, setPropertyTab] = useState("object");
  const [historyCounts, setHistoryCounts] = useState({ undo: 0, redo: 0 });
  const [hasClipboard, setHasClipboard] = useState(false);
  const [deformAmount, setDeformAmount] = useState(0.25);
  const [sculptBrush, setSculptBrush] = useState("inflate");
  const [sculptRadius, setSculptRadius] = useState(0.65);
  const [sculptStrength, setSculptStrength] = useState(0.3);

  function applySculptStroke(hit) {
    const mesh = hit?.object;
    const positions = mesh?.geometry?.attributes?.position;
    if (!mesh?.isMesh || !positions) return false;
    const { brush, radius, strength } = sculptSettingsRef.current;
    const worldScale = mesh.getWorldScale(new Vector3());
    const localRadius = radius / Math.max(worldScale.x, worldScale.y, worldScale.z, 0.001);
    const localPoint = mesh.worldToLocal(hit.point.clone());
    const point = new Vector3();
    const affected = [];
    const centroid = new Vector3();
    const sharedNormals = new Map();
    const vertexKey = (value) => `${value.x.toFixed(5)}:${value.y.toFixed(5)}:${value.z.toFixed(5)}`;
    for (let index = 0; index < positions.count; index += 1) {
      point.fromBufferAttribute(positions, index);
      const distance = point.distanceTo(localPoint);
      if (distance > localRadius) continue;
      const falloff = Math.pow(1 - distance / localRadius, 2);
      const key = vertexKey(point);
      affected.push({ index, falloff, key, point: point.clone() });
      centroid.add(point);
      if (mesh.geometry.attributes.normal) {
        const normal = new Vector3().fromBufferAttribute(mesh.geometry.attributes.normal, index);
        if (sharedNormals.has(key)) sharedNormals.get(key).add(normal);
        else sharedNormals.set(key, normal);
      }
    }
    if (!affected.length) return false;
    centroid.multiplyScalar(1 / affected.length);
    const normals = mesh.geometry.attributes.normal;
    const displacement = localRadius * strength * 0.075;
    sharedNormals.forEach((normal) => normal.normalize());
    affected.forEach(({ index, falloff, key, point: vertex }) => {
      if (brush === "smooth") {
        vertex.lerp(centroid, Math.min(0.35, strength * falloff * 0.22));
      } else if (brush === "pinch") {
        const direction = localPoint.clone().sub(vertex);
        vertex.addScaledVector(direction, strength * falloff * 0.08);
      } else {
        const normal = sharedNormals.get(key) || (normals ? new Vector3().fromBufferAttribute(normals, index).normalize() : vertex.clone().sub(localPoint).normalize());
        vertex.addScaledVector(normal, displacement * falloff * (brush === "dent" ? -1 : 1));
      }
      positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
    });
    positions.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
    mesh.userData.sculpted = true;
    mesh.userData.sculptId ||= makeId();
    return true;
  }

  function objectSummary(object) {
    const material = object.material && !Array.isArray(object.material) ? object.material : null;
    return {
      id: object.userData.editorId,
      name: object.name,
      type: object.userData.editorType || "model",
      visible: object.visible,
      color: material?.color ? `#${material.color.getHexString()}` : "#8b5cf6"
    };
  }

  function refreshObjects() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    syncLightMarkers();
    setObjects(runtime.content.children.map(objectSummary));
  }

  function syncLightMarkers() {
    const runtime = runtimeRef.current;
    if (!runtime?.lightMarkers) return;
    const lights = runtime.content.children.filter((object) => object.isLight);
    const ids = new Set(lights.map((light) => light.userData.editorId));
    runtime.lightMarkers.forEach((marker, id) => {
      if (ids.has(id)) return;
      runtime.scene.remove(marker);
      marker.geometry.dispose();
      marker.material.dispose();
      runtime.lightMarkers.delete(id);
    });
    lights.forEach((light) => {
      const id = light.userData.editorId;
      if (runtime.lightMarkers.has(id)) return;
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 12),
        new THREE.MeshBasicMaterial({ color: light.color, depthTest: false, transparent: true, opacity: 0.92 })
      );
      marker.renderOrder = 999;
      marker.userData.editorLightId = id;
      runtime.lightMarkers.set(id, marker);
      runtime.scene.add(marker);
    });
  }

  function setLightMarkersVisible(visible) {
    runtimeRef.current?.lightMarkers?.forEach((marker) => { marker.visible = visible; });
  }

  function syncSelection(object = selectedRef.current) {
    if (!object) {
      setSelection(null);
      return;
    }
    const material = materialsForObject(object)[0] || null;
    setSelection({
      name: object.name,
      position: object.position.toArray().map(round),
      rotation: (object.userData.animationRotation || object.rotation.toArray().slice(0, 3)).map((value) => round(THREE.MathUtils.radToDeg(value))),
      scale: object.scale.toArray().map(round),
      color: material?.color ? `#${material.color.getHexString()}` : "#8b5cf6",
      metalness: round(material?.metalness ?? 0),
      roughness: round(material?.roughness ?? 0.5),
      isLight: Boolean(object.isLight),
      lightColor: object.isLight ? `#${object.color.getHexString()}` : "#ffffff",
      intensity: object.isLight ? round(object.intensity) : 1,
      distance: object.isPointLight || object.isSpotLight ? round(object.distance) : 0,
      angle: object.isSpotLight ? round(THREE.MathUtils.radToDeg(object.angle)) : 30,
      textureName: object.userData.textureName || "",
      textureRepeat: material?.map ? [round(material.map.repeat.x), round(material.map.repeat.y)] : [1, 1],
      spin: {
        enabled: Boolean(object.userData.spin?.enabled),
        axis: object.userData.spin?.axis || "y",
        speed: object.userData.spin?.speed ?? 30
      }
    });
  }

  function selectObject(object, additive = false) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    if (runtime.lightHelper) {
      runtime.scene.remove(runtime.lightHelper);
      runtime.lightHelper.dispose?.();
      runtime.lightHelper = null;
    }
    if (additive && object) {
      const next = new Set(selectedIdsRef.current);
      if (next.has(object.userData.editorId)) next.delete(object.userData.editorId);
      else next.add(object.userData.editorId);
      selectedIdsRef.current = next;
      setSelectedIds([...next]);
      object = next.has(object.userData.editorId) ? object : runtime.content.children.find((item) => next.has(item.userData.editorId)) || null;
    } else {
      selectedIdsRef.current = new Set(object ? [object.userData.editorId] : []);
      setSelectedIds(object ? [object.userData.editorId] : []);
    }
    selectedRef.current = object || null;
    setSelectedId(object?.userData.editorId || "");
    if (object && modeRef.current !== "sculpt") runtime.transform.attach(object);
    else runtime.transform.detach();
    if (object?.isPointLight) runtime.lightHelper = new THREE.PointLightHelper(object, 0.35, object.color);
    if (object?.isDirectionalLight) runtime.lightHelper = new THREE.DirectionalLightHelper(object, 0.7, object.color);
    if (object?.isSpotLight) runtime.lightHelper = new THREE.SpotLightHelper(object, object.color);
    if (runtime.lightHelper) runtime.scene.add(runtime.lightHelper);
    if (object?.userData.editorType === "text") {
      setTextDraft(object.userData.text || object.name || "");
      setExtrudeDepth(object.userData.depth ?? 0.35);
      setTextFont(object.userData.font || "helvetiker");
    }
    syncSelection(object);
  }

  function serializeScene() {
    const runtime = runtimeRef.current;
    if (!runtime) return null;
    const geometryOverrides = {};
    runtime.content.traverse((item) => {
      const positions = item.geometry?.attributes?.position;
      if (!item.userData?.sculpted || !positions) return;
      item.userData.sculptId ||= makeId();
      item.geometry.computeVertexNormals();
      item.geometry.computeBoundingBox();
      item.geometry.computeBoundingSphere();
      geometryOverrides[item.userData.sculptId] = {
        itemSize: positions.itemSize,
        positions: Array.from(positions.array)
      };
    });
    return {
      schemaVersion: 2,
      background,
      environmentBackground,
      gridVisible,
      ambientIntensity,
      exposure,
      floorVisible,
      floorColor,
      floorSurface,
      renderResolution,
      transparentPng,
      keyLightIntensity: runtime.keyLight?.intensity ?? 1.8,
      keyLightColor: `#${runtime.keyLight.color.getHexString()}`,
      ambientColor: `#${runtime.ambient.color.getHexString()}`,
      ambientGroundColor: `#${runtime.ambient.groundColor.getHexString()}`,
      content: runtime.content.toJSON(),
      geometryOverrides,
      camera: {
        position: runtime.camera.position.toArray(),
        target: runtime.orbit.target.toArray()
      },
      animationDuration,
      animationTracks,
      editor: { mode, propertyTab, deformAmount, sculptBrush, sculptRadius, sculptStrength, selectedId }
    };
  }

  function pushHistory() {
    if (historyRef.current.restoring) return;
    const snapshot = serializeScene();
    if (!snapshot) return;
    historyRef.current.undo.push(snapshot);
    if (historyRef.current.undo.length > 40) historyRef.current.undo.shift();
    historyRef.current.redo = [];
    setHistoryCounts({ undo: historyRef.current.undo.length, redo: 0 });
  }

  function loadSceneState(state) {
    const runtime = runtimeRef.current;
    if (!runtime || !state) return;
    selectObject(null);
    runtime.content.children.slice().forEach((child) => {
      runtime.content.remove(child);
      disposeObject(child);
    });
    const loaded = new THREE.ObjectLoader().parse(state.content);
    loaded.traverse((item) => {
      const override = state.geometryOverrides?.[item.userData?.sculptId];
      const positions = item.geometry?.attributes?.position;
      if (!override || !positions || override.positions.length !== positions.array.length) return;
      positions.array.set(override.positions);
      positions.needsUpdate = true;
      item.geometry.computeVertexNormals();
      item.geometry.computeBoundingBox();
      item.geometry.computeBoundingSphere();
    });
    loaded.children.slice().forEach((child) => runtime.content.add(child));
    runtime.camera.position.fromArray(state.camera?.position || [7, 5, 8]);
    runtime.orbit.target.fromArray(state.camera?.target || [0, 1, 0]);
    runtime.orbit.update();
    const loadedOrbit = new THREE.Spherical().setFromVector3(runtime.camera.position.clone().sub(runtime.orbit.target));
    cameraOrbitRef.current = { lastTheta: loadedOrbit.theta, theta: loadedOrbit.theta };
    setBackground(state.background || DEFAULT_BACKGROUND);
    setEnvironmentBackground(state.environmentBackground || "solid");
    setGridVisible(state.gridVisible !== false);
    setAmbientIntensity(state.ambientIntensity ?? 0.7);
    setExposure(state.exposure ?? 1.15);
    setFloorVisible(state.floorVisible !== false);
    setFloorColor(state.floorColor || "#24272d");
    setFloorSurface(state.floorSurface || (state.environmentBackground && state.environmentBackground !== "solid" ? "shadow" : "plastic"));
    setRenderResolution(state.renderResolution || "1920x1080");
    setTransparentPng(Boolean(state.transparentPng));
    runtime.keyLight.intensity = state.keyLightIntensity ?? 1.8;
    runtime.keyLight.color.set(state.keyLightColor || "#ffffff");
    runtime.ambient.color.set(state.ambientColor || "#ffffff");
    runtime.ambient.groundColor.set(state.ambientGroundColor || "#384152");
    setAnimationDuration(state.animationDuration || 5);
    setAnimationTracks(state.animationTracks || {});
    setAnimationTime(0);
    setAnimationPlaying(false);
    refreshObjects();
    setPropertyTab(state.editor?.propertyTab || "object");
    setDeformAmount(state.editor?.deformAmount ?? 0.25);
    setSculptBrush(state.editor?.sculptBrush || "inflate");
    setSculptRadius(state.editor?.sculptRadius ?? 0.65);
    setSculptStrength(state.editor?.sculptStrength ?? 0.3);
    setMode(state.editor?.mode || "translate");
    const restoredSelection = runtime.content.children.find((item) => item.userData.editorId === state.editor?.selectedId);
    selectObject(restoredSelection || null);
  }

  function undo() {
    const previous = historyRef.current.undo.pop();
    if (!previous) return;
    historyRef.current.redo.push(serializeScene());
    historyRef.current.restoring = true;
    loadSceneState(previous);
    historyRef.current.restoring = false;
    setHistoryCounts({ undo: historyRef.current.undo.length, redo: historyRef.current.redo.length });
  }

  function redo() {
    const next = historyRef.current.redo.pop();
    if (!next) return;
    historyRef.current.undo.push(serializeScene());
    historyRef.current.restoring = true;
    loadSceneState(next);
    historyRef.current.restoring = false;
    setHistoryCounts({ undo: historyRef.current.undo.length, redo: historyRef.current.redo.length });
  }

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    scene.background = new Color(DEFAULT_BACKGROUND);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 1000);
    camera.position.set(7, 5, 8);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    host.appendChild(renderer.domElement);

    const environmentGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnvironment = new RoomEnvironment();
    const environmentTexture = environmentGenerator.fromScene(roomEnvironment, 0.04).texture;
    scene.environment = environmentTexture;
    environmentGenerator.dispose();
    roomEnvironment.dispose();

    const content = new THREE.Group();
    content.name = "Studio 3D";
    scene.add(content);
    scene.environmentIntensity = 0.65;
    const ambient = new THREE.HemisphereLight(0xffffff, 0x384152, 0.7);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(5, 8, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    scene.add(keyLight);
    const grid = new THREE.GridHelper(40, 40, 0x65707d, 0x353b43);
    scene.add(grid);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x24272d, metalness: 0, roughness: 0.92 })
    );
    floor.name = "Piso de estudio";
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.015;
    floor.receiveShadow = true;
    scene.add(floor);

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.target.set(0, 1, 0);
    const trackCameraOrbit = () => {
      if (applyingAnimationRef.current) return;
      const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(orbit.target));
      const memory = cameraOrbitRef.current;
      if (memory.lastTheta === null) memory.theta = spherical.theta;
      else memory.theta += Math.atan2(Math.sin(spherical.theta - memory.lastTheta), Math.cos(spherical.theta - memory.lastTheta));
      memory.lastTheta = spherical.theta;
    };
    orbit.addEventListener("change", trackCameraOrbit);
    trackCameraOrbit();
    const transform = new TransformControls(camera, renderer.domElement);
    const transformHelper = transform.getHelper();
    scene.add(transformHelper);
    transform.addEventListener("dragging-changed", (event) => { orbit.enabled = !event.value; });
    transform.addEventListener("mouseDown", () => {
      pushHistory();
      const object = selectedRef.current;
      if (!object || modeRef.current !== "rotate") return;
      const current = [object.rotation.x, object.rotation.y, object.rotation.z];
      const accumulated = object.userData.animationRotation || current;
      rotationDragRef.current = { object, last: current, accumulated: [...accumulated] };
    });
    transform.addEventListener("objectChange", () => {
      const drag = rotationDragRef.current;
      if (drag?.object === selectedRef.current && modeRef.current === "rotate") {
        const current = [drag.object.rotation.x, drag.object.rotation.y, drag.object.rotation.z];
        current.forEach((value, index) => {
          drag.accumulated[index] += Math.atan2(Math.sin(value - drag.last[index]), Math.cos(value - drag.last[index]));
        });
        drag.last = current;
        drag.object.userData.animationRotation = [...drag.accumulated];
      }
      updateLightDirection(selectedRef.current);
      runtimeRef.current?.lightHelper?.update?.();
      syncSelection();
    });
    transform.addEventListener("mouseUp", () => {
      rotationDragRef.current = null;
      refreshObjects();
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const brushCursor = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xd86cff, wireframe: true, transparent: true, opacity: 0.72, depthTest: false })
    );
    brushCursor.visible = false;
    brushCursor.renderOrder = 1000;
    scene.add(brushCursor);
    const setPointerRay = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
    };
    const sculptHit = (event) => {
      const object = selectedRef.current;
      if (!object || object.isLight) return null;
      setPointerRay(event);
      return raycaster.intersectObject(object, true).find((hit) => hit.object?.isMesh && hit.object.geometry?.attributes?.position) || null;
    };
    const onSculptPointerDown = (event) => {
      if (modeRef.current !== "sculpt") return;
      const hit = sculptHit(event);
      if (!hit) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      pushHistory();
      sculptingRef.current = true;
      orbit.enabled = false;
      transform.detach();
      renderer.domElement.setPointerCapture?.(event.pointerId);
      brushCursor.position.copy(hit.point);
      brushCursor.scale.setScalar(sculptSettingsRef.current.radius);
      brushCursor.visible = true;
      applySculptStroke(hit);
    };
    const onSelectionPointerDown = (event) => {
      if (modeRef.current === "sculpt" || transform.dragging) return;
      setPointerRay(event);
      const markers = [...(runtimeRef.current?.lightMarkers?.values() || [])];
      const hits = raycaster.intersectObjects([...content.children, ...markers], true);
      let object = hits[0]?.object || null;
      let marker = object;
      while (marker && !marker.userData?.editorLightId && marker.parent) marker = marker.parent;
      if (marker?.userData?.editorLightId) {
        object = content.children.find((item) => item.userData.editorId === marker.userData.editorLightId) || null;
      }
      while (object?.parent && object.parent !== content) object = object.parent;
      selectObject(object?.parent === content ? object : null, event.shiftKey);
    };
    const onPointerMove = (event) => {
      if (modeRef.current !== "sculpt") return;
      const hit = sculptHit(event);
      brushCursor.visible = Boolean(hit);
      if (!hit) return;
      brushCursor.position.copy(hit.point);
      brushCursor.scale.setScalar(sculptSettingsRef.current.radius);
      if (sculptingRef.current) applySculptStroke(hit);
    };
    const onPointerUp = (event) => {
      if (!sculptingRef.current) return;
      sculptingRef.current = false;
      orbit.enabled = true;
      renderer.domElement.releasePointerCapture?.(event.pointerId);
      selectedRef.current?.traverse((item) => {
        if (!item.geometry?.attributes?.position) return;
        item.geometry.computeBoundingBox();
        item.geometry.computeBoundingSphere();
      });
      if (selectedRef.current && modeRef.current !== "sculpt") transform.attach(selectedRef.current);
      syncSelection();
      setStatus("Trazo de escultura aplicado");
    };
    const onPointerLeave = () => {
      if (!sculptingRef.current) brushCursor.visible = false;
    };
    renderer.domElement.addEventListener("pointerdown", onSculptPointerDown, true);
    renderer.domElement.addEventListener("pointerdown", onSelectionPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    runtimeRef.current = { scene, camera, renderer, content, ambient, floor, grid, keyLight, orbit, transform, transformHelper, brushCursor, lightHelper: null, lightMarkers: new Map(), backgroundTexture: null, baseEnvironment: environmentTexture };
    let frame = 0;
    let previousRenderTime = 0;
    const render = (time = 0) => {
      frame = requestAnimationFrame(render);
      orbit.update();
      const delta = previousRenderTime ? Math.min((time - previousRenderTime) / 1000, 0.05) : 0;
      previousRenderTime = time;
      content.traverse((object) => {
        const spin = object.userData?.spin;
        if (!spin?.enabled || !object.rotation) return;
        if (animationTracksRef.current[object.userData?.editorId]?.length) return;
        if (modeRef.current === "sculpt" && (object === selectedRef.current || selectedRef.current?.getObjectById(object.id))) return;
        object.rotation[spin.axis || "y"] += THREE.MathUtils.degToRad((spin.speed ?? 30) * delta);
      });
      const activeFloor = runtimeRef.current?.floor;
      const floorTexture = activeFloor?.material?.map;
      if (floorTexture && activeFloor.userData.surface === "water") {
        floorTexture.offset.set((time * 0.000012) % 1, (time * 0.000008) % 1);
      } else if (floorTexture && activeFloor.userData.surface === "gas") {
        floorTexture.offset.set((time * 0.000004) % 1, (time * 0.000006) % 1);
      }
      runtimeRef.current?.lightMarkers?.forEach((marker, id) => {
        const light = content.children.find((item) => item.userData.editorId === id);
        if (!light) return;
        marker.position.copy(light.position);
        marker.material.color.copy(light.color);
      });
      renderer.render(scene, camera);
    };
    render();

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2, 12, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.15, roughness: 0.35 })
    );
    cube.name = "Cubo";
    cube.position.y = 1;
    cube.castShadow = true;
    cube.receiveShadow = true;
    cube.userData = { editorId: makeId(), editorType: "box" };
    content.add(cube);
    refreshObjects();
    selectObject(cube);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onSculptPointerDown, true);
      renderer.domElement.removeEventListener("pointerdown", onSelectionPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      brushCursor.geometry.dispose();
      brushCursor.material.dispose();
      transform.dispose();
      runtimeRef.current?.lightHelper?.dispose?.();
      runtimeRef.current?.lightMarkers?.forEach((marker) => {
        scene.remove(marker);
        marker.geometry.dispose();
        marker.material.dispose();
      });
      runtimeRef.current?.backgroundTexture?.dispose?.();
      orbit.dispose();
      orbit.removeEventListener("change", trackCameraOrbit);
      disposeObject(content);
      floor.geometry.dispose();
      floor.material.map?.dispose?.();
      if (floor.material.bumpMap !== floor.material.map) floor.material.bumpMap?.dispose?.();
      floor.material.dispose();
      environmentTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    modeRef.current = mode;
    if (!runtime) return;
    runtime.brushCursor.visible = false;
    if (mode === "sculpt") {
      runtime.orbit.enabled = true;
      runtime.transform.enabled = false;
      runtime.transform.detach();
    }
    else {
      runtime.orbit.enabled = true;
      runtime.transform.enabled = true;
      runtime.transform.setMode(mode);
      if (selectedRef.current) runtime.transform.attach(selectedRef.current);
    }
  }, [mode]);

  useEffect(() => {
    sculptSettingsRef.current = { brush: sculptBrush, radius: sculptRadius, strength: sculptStrength };
    const cursor = runtimeRef.current?.brushCursor;
    if (cursor) cursor.scale.setScalar(sculptRadius);
  }, [sculptBrush, sculptRadius, sculptStrength]);

  useEffect(() => {
    animationTracksRef.current = animationTracks;
  }, [animationTracks]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return undefined;
    runtime.scene.environment = runtime.baseEnvironment;
    runtime.scene.environmentIntensity = 1;
    runtime.backgroundTexture?.dispose?.();
    runtime.backgroundTexture = null;
    const preset = [...ENVIRONMENT_BACKGROUNDS, ...SKY_BACKGROUNDS].find((item) => item.id === environmentBackground);
    if (!preset?.image) {
      runtime.scene.background = new Color(background);
      return undefined;
    }
    let cancelled = false;
    new THREE.TextureLoader().load(preset.image, (texture) => {
      if (cancelled || runtimeRef.current !== runtime) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.repeat.x = 2;
      texture.needsUpdate = true;
      runtime.backgroundTexture = texture;
      runtime.scene.background = texture;
      runtime.scene.environment = texture;
      runtime.scene.environmentIntensity = preset.environment ?? 0.65;
    }, undefined, () => setStatus("No se pudo cargar el entorno 3D"));
    return () => { cancelled = true; };
  }, [background, environmentBackground]);

  useEffect(() => {
    if (runtimeRef.current) runtimeRef.current.grid.visible = gridVisible;
  }, [gridVisible]);

  useEffect(() => {
    if (runtimeRef.current) runtimeRef.current.ambient.intensity = ambientIntensity;
  }, [ambientIntensity]);

  useEffect(() => {
    if (runtimeRef.current) runtimeRef.current.renderer.toneMappingExposure = exposure;
  }, [exposure]);

  useEffect(() => {
    if (runtimeRef.current) runtimeRef.current.floor.visible = floorVisible;
  }, [floorVisible]);

  useEffect(() => {
    const floor = runtimeRef.current?.floor;
    if (!floor) return;
    floor.material.map?.dispose?.();
    if (floor.material.bumpMap !== floor.material.map) floor.material.bumpMap?.dispose?.();
    floor.material.dispose();
    floor.material = createFloorMaterial(floorSurface, floorColor);
    floor.userData.surface = floorSurface;
    floor.receiveShadow = true;
  }, [floorSurface]);

  useEffect(() => {
    const material = runtimeRef.current?.floor.material;
    if (material?.color && floorSurface === "plastic") material.color.set(floorColor);
  }, [floorColor, floorSurface]);

  function applyAnimationAt(time) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    Object.entries(animationTracks).forEach(([objectId, frames]) => {
      if (!frames.length) return;
      const { before, after, alpha } = animationFramePair(frames, time);
      if (objectId === CAMERA_TRACK_ID) {
        applyingAnimationRef.current = true;
        const target = new Vector3().fromArray(before.target).lerp(new Vector3().fromArray(after.target), alpha);
        runtime.orbit.target.copy(target);
        if (before.orbit && after.orbit) {
          const radius = THREE.MathUtils.lerp(before.orbit.radius, after.orbit.radius, alpha);
          const phi = THREE.MathUtils.lerp(before.orbit.phi, after.orbit.phi, alpha);
          const thetaDelta = before.continuousOrbit && after.continuousOrbit
            ? after.orbit.theta - before.orbit.theta
            : Math.atan2(Math.sin(after.orbit.theta - before.orbit.theta), Math.cos(after.orbit.theta - before.orbit.theta));
          const theta = before.orbit.theta + thetaDelta * alpha;
          runtime.camera.position.copy(target).add(new Vector3().setFromSpherical(new THREE.Spherical(radius, phi, theta)));
          if (before.up && after.up) runtime.camera.up.fromArray(before.up).lerp(new Vector3().fromArray(after.up), alpha).normalize();
          runtime.camera.fov = THREE.MathUtils.lerp(before.fov ?? 45, after.fov ?? 45, alpha);
          runtime.camera.updateProjectionMatrix();
          cameraOrbitRef.current.theta = theta;
          cameraOrbitRef.current.lastTheta = new THREE.Spherical().setFromVector3(runtime.camera.position.clone().sub(target)).theta;
        } else {
          runtime.camera.position.fromArray(before.position).lerp(new Vector3().fromArray(after.position), alpha);
        }
        runtime.camera.lookAt(runtime.orbit.target);
        runtime.orbit.update();
        applyingAnimationRef.current = false;
        return;
      }
      const object = runtime.content.children.find((item) => item.userData.editorId === objectId);
      if (!object) return;
      object.position.fromArray(before.position).lerp(new Vector3().fromArray(after.position), alpha);
      if (before.rotation && after.rotation) {
        object.rotation.set(
          THREE.MathUtils.lerp(before.rotation[0], after.rotation[0], alpha),
          THREE.MathUtils.lerp(before.rotation[1], after.rotation[1], alpha),
          THREE.MathUtils.lerp(before.rotation[2], after.rotation[2], alpha),
          before.rotationOrder || after.rotationOrder || "XYZ"
        );
        object.userData.animationRotation = [
          THREE.MathUtils.lerp(before.rotation[0], after.rotation[0], alpha),
          THREE.MathUtils.lerp(before.rotation[1], after.rotation[1], alpha),
          THREE.MathUtils.lerp(before.rotation[2], after.rotation[2], alpha)
        ];
      } else {
        object.quaternion.fromArray(before.quaternion).slerp(new THREE.Quaternion().fromArray(after.quaternion), alpha);
      }
      object.scale.fromArray(before.scale).lerp(new Vector3().fromArray(after.scale), alpha);
    });
    syncSelection();
  }

  function seekAnimation(time) {
    const next = THREE.MathUtils.clamp(time, 0, animationDuration);
    setAnimationTime(next);
    applyAnimationAt(next);
  }

  useEffect(() => {
    if (!animationPlaying) return undefined;
    let frame;
    let previous = performance.now();
    const tick = (now) => {
      const delta = (now - previous) / 1000;
      previous = now;
      setAnimationTime((current) => {
        const next = (current + delta) % animationDuration;
        applyAnimationAt(next);
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animationPlaying, animationDuration, animationTracks]);

  useEffect(() => {
    if (!active) return undefined;
    const onKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
      const command = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (!command && key === "w") setMode("translate");
      if (!command && key === "e") setMode("rotate");
      if (!command && key === "r") setMode("scale");
      if (!command && key === "b") setMode("sculpt");
      if (event.key === "Delete") removeSelected();
      if (event.key === "Escape") selectObject(null);
      if (event.key.startsWith("Arrow") && selectedRef.current) {
        event.preventDefault();
        const step = event.shiftKey ? 1 : 0.1;
        if (event.key === "ArrowLeft") nudgeSelected(-step, 0, 0);
        if (event.key === "ArrowRight") nudgeSelected(step, 0, 0);
        if (event.key === "ArrowUp") nudgeSelected(0, 0, -step);
        if (event.key === "ArrowDown") nudgeSelected(0, 0, step);
      }
      if (command && key === "c") { event.preventDefault(); copySelected(); }
      if (command && key === "v") { event.preventDefault(); pasteClipboard(); }
      if (command && key === "d") {
        event.preventDefault();
        duplicateSelected();
      }
      if (command && key === "g") {
        event.preventDefault();
        event.shiftKey ? ungroupSelected() : groupSelected();
      }
      if (command && key === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      if (command && key === "y") { event.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useEffect(() => {
    const save = (event) => event.detail.tasks.push((async () => {
      const state = serializeScene();
      if (!state) return null;
      await putProject(`workspace:${event.detail.projectId}:${THREE_PROJECT_ID}`, state);
      return { kind: THREE_PROJECT_ID, thumbnail: runtimeRef.current.renderer.domElement.toDataURL("image/jpeg", 0.75) };
    })());
    const load = (event) => event.detail.tasks.push((async () => {
      const state = await getProject(`workspace:${event.detail.projectId}:${THREE_PROJECT_ID}`);
      if (state) loadSceneState(state);
    })());
    window.addEventListener("studio:workspace-save", save);
    window.addEventListener("studio:workspace-load", load);
    return () => {
      window.removeEventListener("studio:workspace-save", save);
      window.removeEventListener("studio:workspace-load", load);
    };
  }, [background, environmentBackground, gridVisible, ambientIntensity, exposure, floorVisible, floorColor, floorSurface, renderResolution, transparentPng, animationDuration, animationTracks, mode, propertyTab, deformAmount, sculptBrush, sculptRadius, sculptStrength, selectedId]);

  useEffect(() => {
    if (openProjectSignal) setStatus("Selecciona un proyecto desde Inicio");
  }, [openProjectSignal]);

  function addPrimitive(type) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    pushHistory();
    const geometries = {
      box: () => new THREE.BoxGeometry(2, 2, 2, 12, 12, 12),
      sphere: () => new THREE.SphereGeometry(1.25, 48, 32),
      cylinder: () => new THREE.CylinderGeometry(1, 1, 2.4, 48, 18),
      cone: () => new THREE.ConeGeometry(1.2, 2.5, 48, 18)
    };
    const labels = { box: "Cubo", sphere: "Esfera", cylinder: "Cilindro", cone: "Cono" };
    const object = new THREE.Mesh(
      geometries[type](),
      new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.1, roughness: 0.4 })
    );
    object.name = `${labels[type]} ${objects.length + 1}`;
    object.position.set((((objects.length + 1) % 3) - 1) * 2.8, 1.25, 0);
    object.castShadow = true;
    object.receiveShadow = true;
    object.userData = { editorId: makeId(), editorType: type };
    runtime.content.add(object);
    refreshObjects();
    selectObject(object);
  }

  function addLight(type = "point") {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    pushHistory();
    let light;
    if (type === "directional") {
      light = new THREE.DirectionalLight(0xffffff, 4);
      light.name = `Luz solar ${objects.length + 1}`;
    } else if (type === "spot") {
      light = new THREE.SpotLight(0xffffff, 1200, 35, THREE.MathUtils.degToRad(32), 0.35, 1.5);
      light.name = `Foco ${objects.length + 1}`;
    } else {
      light = new THREE.PointLight(0xffffff, 700, 30, 2);
      light.name = `Luz puntual ${objects.length + 1}`;
    }
    light.position.set(3, 5, 3);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    light.shadow.bias = -0.0002;
    light.shadow.normalBias = 0.025;
    light.userData = { editorId: makeId(), editorType: "light", lightType: type };
    updateLightDirection(light);
    runtime.content.add(light);
    refreshObjects();
    selectObject(light);
  }

  function updateLight(key, value) {
    const light = selectedRef.current;
    if (!light?.isLight) return;
    pushHistory();
    if (key === "color") light.color.set(value);
    else if (key === "angle" && light.isSpotLight) light.angle = THREE.MathUtils.degToRad(Number(value));
    else light[key] = Number(value);
    updateLightDirection(light);
    runtimeRef.current?.lightHelper?.update?.();
    syncSelection(light);
  }

  function updateLightDirection(light) {
    if (!light || (!light.isDirectionalLight && !light.isSpotLight)) return;
    const direction = new Vector3(0, 0, -1).applyQuaternion(light.quaternion).normalize();
    light.target.position.copy(light.position).add(direction.multiplyScalar(5));
    light.target.updateMatrixWorld();
  }

  function applyScenePreset(preset) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    pushHistory();
    const presets = {
      studio: { background: "#17191d", floor: "#24272d", ambient: 0.7, exposure: 1.15, key: 1.8, light: "#ffffff", ground: "#384152" },
      product: { background: "#d9dde2", floor: "#f1f3f5", ambient: 1.05, exposure: 0.95, key: 2.8, light: "#fff7e8", ground: "#8b949d" },
      night: { background: "#030609", floor: "#091016", ambient: 0.16, exposure: 1.25, key: 0.45, light: "#9bbcff", ground: "#050914" }
    };
    const values = presets[preset];
    if (environmentBackground === "solid") setBackground(values.background);
    if (floorSurface === "plastic") setFloorColor(values.floor);
    setAmbientIntensity(values.ambient);
    setExposure(values.exposure);
    runtime.keyLight.intensity = values.key;
    runtime.keyLight.color.set(values.light);
    runtime.ambient.color.set(values.light);
    runtime.ambient.groundColor.set(values.ground);
    setStatus(`Iluminacion ${preset === "product" ? "Producto" : preset === "night" ? "Nocturna" : "Estudio"} aplicada`);
  }

  function applySkyPreset(preset) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    pushHistory();
    setEnvironmentBackground(preset.id);
    setAmbientIntensity(preset.ambient);
    setExposure(preset.exposure);
    runtime.keyLight.intensity = preset.key;
    runtime.keyLight.color.set(preset.light);
    runtime.ambient.color.set(preset.light);
    runtime.ambient.groundColor.set(preset.ground);
    setStatus(`Cielo ${preset.name} aplicado`);
  }

  function setCameraView(view) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const bounds = new Box3().setFromObject(runtime.content);
    const empty = bounds.isEmpty();
    const center = empty ? new Vector3(0, 1, 0) : bounds.getCenter(new Vector3());
    const size = empty ? 4 : Math.max(bounds.getSize(new Vector3()).length(), 3);
    const directions = {
      front: new Vector3(0, 0.15, 1),
      top: new Vector3(0, 1, 0.001),
      side: new Vector3(1, 0.12, 0),
      iso: new Vector3(1, 0.72, 1)
    };
    runtime.orbit.target.copy(center);
    runtime.camera.position.copy(center).add(directions[view].normalize().multiplyScalar(size * 1.45));
    runtime.camera.up.set(0, 1, 0);
    runtime.orbit.update();
  }

  function addAnimationKeyframe() {
    const object = selectedRef.current;
    if (!object) return;
    const objectId = object.userData.editorId;
    const keyframe = {
      id: makeId(),
      time: round(animationTime),
      position: object.position.toArray(),
      rotation: [...(object.userData.animationRotation || [object.rotation.x, object.rotation.y, object.rotation.z])],
      rotationOrder: object.rotation.order,
      quaternion: object.quaternion.toArray(),
      scale: object.scale.toArray()
    };
    setAnimationTracks((current) => {
      const existing = (current[objectId] || []).filter((frame) => Math.abs(frame.time - keyframe.time) > 0.02);
      return { ...current, [objectId]: [...existing, keyframe].sort((a, b) => a.time - b.time) };
    });
    setStatus(`Keyframe agregado en ${keyframe.time.toFixed(2)} s`);
  }

  function addCameraKeyframe() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const spherical = new THREE.Spherical().setFromVector3(runtime.camera.position.clone().sub(runtime.orbit.target));
    const keyframe = {
      id: makeId(),
      time: round(animationTime),
      position: runtime.camera.position.toArray(),
      target: runtime.orbit.target.toArray(),
      orbit: { radius: spherical.radius, phi: spherical.phi, theta: cameraOrbitRef.current.theta },
      continuousOrbit: true,
      up: runtime.camera.up.toArray(),
      fov: runtime.camera.fov
    };
    const currentFrames = animationTracks[CAMERA_TRACK_ID] || [];
    const replacing = currentFrames.some((frame) => Math.abs(frame.time - keyframe.time) <= 0.02);
    const nextCount = replacing ? currentFrames.length : currentFrames.length + 1;
    setAnimationTracks((current) => {
      const existing = (current[CAMERA_TRACK_ID] || []).filter((frame) => Math.abs(frame.time - keyframe.time) > 0.02);
      return { ...current, [CAMERA_TRACK_ID]: [...existing, keyframe].sort((a, b) => a.time - b.time) };
    });
    setStatus(nextCount === 1
      ? "Vista inicial guardada. Avanza el tiempo, gira la camara y guarda otra Vista."
      : `Vista ${nextCount} guardada en ${keyframe.time.toFixed(2)} s`);
  }

  function clearSelectedAnimation() {
    const objectId = selectedRef.current?.userData.editorId;
    if (!objectId) return;
    setAnimationTracks((current) => {
      const next = { ...current };
      delete next[objectId];
      return next;
    });
  }

  function clearCameraAnimation() {
    setAnimationTracks((current) => {
      const next = { ...current };
      delete next[CAMERA_TRACK_ID];
      return next;
    });
  }

  function deleteAnimationMarker(kind, markerId) {
    const trackId = kind === "camera" ? CAMERA_TRACK_ID : selectedRef.current?.userData.editorId;
    if (!trackId) return;
    setAnimationTracks((current) => {
      const remaining = (current[trackId] || []).filter((frame) => frame.id !== markerId);
      const next = { ...current };
      if (remaining.length) next[trackId] = remaining;
      else delete next[trackId];
      return next;
    });
    setStatus(kind === "camera" ? "Vista eliminada" : "Keyframe eliminado");
  }

  function prepareRenderOutput({ transparent = false } = {}) {
    const runtime = runtimeRef.current;
    const [width, height] = renderResolution.split("x").map(Number);
    const previousSize = runtime.renderer.getSize(new THREE.Vector2());
    const previousPixelRatio = runtime.renderer.getPixelRatio();
    const previousAspect = runtime.camera.aspect;
    const previousBackground = runtime.scene.background;
    const floorWasVisible = runtime.floor.visible;
    runtime.renderer.setPixelRatio(1);
    runtime.renderer.setSize(width, height, false);
    runtime.camera.aspect = width / height;
    runtime.camera.updateProjectionMatrix();
    if (transparent) {
      runtime.scene.background = null;
      runtime.floor.visible = false;
    }
    return () => {
      runtime.renderer.setPixelRatio(previousPixelRatio);
      runtime.renderer.setSize(previousSize.x, previousSize.y, false);
      runtime.camera.aspect = previousAspect;
      runtime.camera.updateProjectionMatrix();
      runtime.scene.background = previousBackground;
      runtime.floor.visible = floorWasVisible;
    };
  }

  async function exportAnimation() {
    const runtime = runtimeRef.current;
    if (!runtime || animationExporting) return;
    if (!Object.values(animationTracks).some((frames) => frames.length > 1)) {
      setStatus("Agrega al menos dos keyframes para exportar una animacion");
      return;
    }
    if (!runtime.renderer.domElement.captureStream || typeof MediaRecorder === "undefined") {
      setStatus("Este navegador no permite exportar video desde el canvas");
      return;
    }

    const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
      .find((type) => MediaRecorder.isTypeSupported(type));
    if (!mimeType) {
      setStatus("No hay un codificador WebM disponible");
      return;
    }

    setAnimationExporting(true);
    setAnimationPlaying(false);
    seekAnimation(0);
    runtime.transformHelper.visible = false;
    if (runtime.lightHelper) runtime.lightHelper.visible = false;
    setLightMarkersVisible(false);
    const gridWasVisible = runtime.grid.visible;
    runtime.grid.visible = false;
    const restoreOutput = prepareRenderOutput();

    try {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const stream = runtime.renderer.domElement.captureStream(animationFps);
      const chunks = [];
      const [outputWidth] = renderResolution.split("x").map(Number);
      const baseBitrate = outputWidth >= 3840 ? 24_000_000 : outputWidth >= 1920 ? 12_000_000 : 7_000_000;
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: animationFps === 60 ? baseBitrate * 1.5 : baseBitrate });
      recorder.addEventListener("dataavailable", (event) => { if (event.data.size) chunks.push(event.data); });
      const stopped = new Promise((resolve, reject) => {
        recorder.addEventListener("stop", resolve, { once: true });
        recorder.addEventListener("error", reject, { once: true });
      });
      recorder.start(250);
      setAnimationPlaying(true);
      await new Promise((resolve) => setTimeout(resolve, animationDuration * 1000));
      setAnimationPlaying(false);
      recorder.stop();
      await stopped;
      stream.getTracks().forEach((track) => track.stop());
      downloadBlob(new Blob(chunks, { type: mimeType }), "studio-3d-animation.webm");
      setStatus("Animacion WebM exportada");
    } catch (error) {
      console.error(error);
      setStatus("No se pudo exportar la animacion");
    } finally {
      runtime.transformHelper.visible = true;
      if (runtime.lightHelper) runtime.lightHelper.visible = true;
      setLightMarkersVisible(true);
      runtime.grid.visible = gridWasVisible;
      restoreOutput();
      setAnimationExporting(false);
      seekAnimation(0);
    }
  }

  function removeSelected() {
    const runtime = runtimeRef.current;
    const object = selectedRef.current;
    if (!runtime || !object) return;
    pushHistory();
    runtime.content.remove(object);
    setAnimationTracks((current) => {
      const next = { ...current };
      delete next[object.userData.editorId];
      return next;
    });
    disposeObject(object);
    selectObject(null);
    refreshObjects();
  }

  function duplicateSelected() {
    const runtime = runtimeRef.current;
    const source = selectedRef.current;
    if (!runtime || !source) return;
    pushHistory();
    const duplicate = cloneEditorObject(source);
    duplicate.name = `${source.name} copia`;
    duplicate.position.x += 1.25;
    runtime.content.add(duplicate);
    if (animationTracks[source.userData.editorId]) {
      setAnimationTracks((current) => ({
        ...current,
        [duplicate.userData.editorId]: current[source.userData.editorId].map((frame) => ({ ...frame, id: makeId() }))
      }));
    }
    refreshObjects();
    selectObject(duplicate);
  }

  function cloneEditorObject(source) {
    const clone = source.clone(true);
    clone.userData = { ...source.userData, editorId: makeId() };
    clone.traverse((item) => {
      if (item.geometry) item.geometry = item.geometry.clone();
      if (Array.isArray(item.material)) item.material = item.material.map((material) => material.clone());
      else if (item.material) item.material = item.material.clone();
    });
    return clone;
  }

  function copySelected() {
    if (!selectedRef.current) return;
    clipboardRef.current = cloneEditorObject(selectedRef.current);
    setHasClipboard(true);
  }

  function pasteClipboard() {
    const runtime = runtimeRef.current;
    if (!runtime || !clipboardRef.current) return;
    pushHistory();
    const pasted = cloneEditorObject(clipboardRef.current);
    pasted.name = `${clipboardRef.current.name} copia`;
    pasted.position.x += 0.6;
    pasted.position.z += 0.6;
    runtime.content.add(pasted);
    refreshObjects();
    selectObject(pasted);
  }

  function selectedObjects() {
    const runtime = runtimeRef.current;
    if (!runtime) return [];
    return runtime.content.children.filter((object) => selectedIdsRef.current.has(object.userData.editorId));
  }

  function groupSelected() {
    const runtime = runtimeRef.current;
    const chosen = selectedObjects();
    if (!runtime || chosen.length < 2) return;
    pushHistory();
    const group = new THREE.Group();
    group.name = `Grupo ${objects.length + 1}`;
    group.userData = { editorId: makeId(), editorType: "group" };
    const center = new Box3().setFromObject(chosen[0]);
    chosen.slice(1).forEach((object) => center.expandByObject(object));
    group.position.copy(center.getCenter(new Vector3()));
    runtime.content.add(group);
    group.updateMatrixWorld(true);
    chosen.forEach((object) => group.attach(object));
    refreshObjects();
    selectObject(group);
    setStatus(`${chosen.length} objetos agrupados`);
  }

  function ungroupSelected() {
    const runtime = runtimeRef.current;
    const group = selectedRef.current;
    if (!runtime || !group?.isGroup || !group.children.length) return;
    pushHistory();
    const children = [...group.children];
    children.forEach((child) => {
      runtime.content.attach(child);
      child.userData.editorId ||= makeId();
    });
    runtime.content.remove(group);
    refreshObjects();
    selectObject(children[0] || null);
    setStatus(`${children.length} objetos desagrupados`);
  }

  function mergeSelected() {
    const runtime = runtimeRef.current;
    const chosen = selectedObjects();
    if (!runtime || chosen.length < 2) return;
    const geometries = [];
    let sourceMaterial = null;
    runtime.content.updateMatrixWorld(true);
    const inverseContent = runtime.content.matrixWorld.clone().invert();
    chosen.forEach((root) => root.traverse((item) => {
      if (!item.isMesh || !item.geometry?.attributes?.position) return;
      item.updateWorldMatrix(true, false);
      let geometry = item.geometry.clone();
      geometry.applyMatrix4(inverseContent.clone().multiply(item.matrixWorld));
      if (geometry.index) geometry = geometry.toNonIndexed();
      Object.keys(geometry.attributes).forEach((key) => {
        if (!["position", "normal", "uv"].includes(key)) geometry.deleteAttribute(key);
      });
      if (!geometry.attributes.normal) geometry.computeVertexNormals();
      if (!geometry.attributes.uv) geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
      geometries.push(geometry);
      sourceMaterial ||= Array.isArray(item.material) ? item.material[0] : item.material;
    }));
    if (geometries.length < 2) {
      geometries.forEach((geometry) => geometry.dispose());
      setStatus("Selecciona al menos dos objetos con geometria");
      return;
    }
    const mergedGeometry = mergeGeometries(geometries, false);
    geometries.forEach((geometry) => geometry.dispose());
    if (!mergedGeometry) {
      setStatus("Estas geometrías no se pueden fusionar");
      return;
    }
    pushHistory();
    const merged = new THREE.Mesh(mergedGeometry, sourceMaterial?.clone?.() || new THREE.MeshStandardMaterial({ color: 0x8b5cf6 }));
    merged.name = `Fusion ${objects.length + 1}`;
    merged.castShadow = true;
    merged.receiveShadow = true;
    merged.userData = { editorId: makeId(), editorType: "merged" };
    chosen.forEach((object) => {
      runtime.content.remove(object);
      disposeObject(object);
    });
    runtime.content.add(merged);
    refreshObjects();
    selectObject(merged);
    setStatus(`${chosen.length} objetos fusionados en una malla`);
  }

  function deformSelected(kind, amount) {
    const object = selectedRef.current;
    if (!object || object.isLight) return;
    const strength = Number(amount);
    if (!Number.isFinite(strength) || strength === 0) return;
    pushHistory();
    let changed = false;
    object.traverse((item) => {
      const geometry = item.geometry;
      const positions = geometry?.attributes?.position;
      if (!positions) return;
      geometry.computeBoundingBox();
      const center = geometry.boundingBox.getCenter(new Vector3());
      const size = geometry.boundingBox.getSize(new Vector3());
      const radius = Math.max(size.length() * 0.5, 0.001);
      const point = new Vector3();
      for (let index = 0; index < positions.count; index += 1) {
        point.fromBufferAttribute(positions, index);
        const local = point.clone().sub(center);
        if (kind === "inflate" || kind === "dent") {
          const direction = local.clone().normalize();
          const falloff = 0.25 + 0.75 * (1 - Math.min(local.length() / radius, 1));
          point.addScaledVector(direction, strength * falloff * (kind === "dent" ? -1 : 1));
        } else if (kind === "twist") {
          const angle = (local.y / Math.max(size.y, 0.001)) * strength * Math.PI;
          const x = local.x * Math.cos(angle) - local.z * Math.sin(angle);
          const z = local.x * Math.sin(angle) + local.z * Math.cos(angle);
          point.x = center.x + x;
          point.z = center.z + z;
        } else if (kind === "stretch") {
          point.y = center.y + local.y * (1 + strength);
          point.x = center.x + local.x * Math.max(0.15, 1 - strength * 0.22);
          point.z = center.z + local.z * Math.max(0.15, 1 - strength * 0.22);
        }
        positions.setXYZ(index, point.x, point.y, point.z);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      item.userData.sculpted = true;
      item.userData.sculptId ||= makeId();
      changed = true;
    });
    if (changed) {
      syncSelection(object);
      setStatus("Deformacion aplicada. Puedes deshacerla con Ctrl+Z");
    }
  }

  function updateSpin(key, value) {
    const object = selectedRef.current;
    if (!object) return;
    object.userData.spin = { enabled: false, axis: "y", speed: 30, ...object.userData.spin, [key]: value };
    syncSelection(object);
  }

  function nudgeSelected(dx, dy, dz) {
    const object = selectedRef.current;
    if (!object) return;
    pushHistory();
    object.position.x += dx;
    object.position.y += dy;
    object.position.z += dz;
    syncSelection(object);
  }

  function renameSelected(name) {
    const object = selectedRef.current;
    if (!object) return;
    object.name = name;
    setSelection((current) => current ? { ...current, name } : current);
    refreshObjects();
  }

  function toggleObjectVisibility(id) {
    const object = runtimeRef.current?.content.children.find((item) => item.userData.editorId === id);
    if (!object) return;
    pushHistory();
    object.visible = !object.visible;
    if (!object.visible && selectedRef.current === object) selectObject(null);
    refreshObjects();
  }

  function centerSelected() {
    const object = selectedRef.current;
    if (!object) return;
    pushHistory();
    object.position.x = 0;
    object.position.z = 0;
    syncSelection(object);
  }

  function placeOnFloor() {
    const object = selectedRef.current;
    if (!object || object.isLight) return;
    pushHistory();
    const bounds = new Box3().setFromObject(object);
    object.position.y -= bounds.min.y;
    syncSelection(object);
  }

  function focusSelected() {
    const runtime = runtimeRef.current;
    const object = selectedRef.current;
    if (!runtime || !object) return;
    const box = new Box3().setFromObject(object);
    const center = box.getCenter(new Vector3());
    const size = Math.max(box.getSize(new Vector3()).length(), 2);
    runtime.orbit.target.copy(center);
    runtime.camera.position.copy(center).add(new Vector3(size, size * 0.65, size));
    runtime.orbit.update();
  }

  function updateTransform(group, index, value) {
    const object = selectedRef.current;
    if (!object) return;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    const axes = ["x", "y", "z"];
    const axis = axes[index];
    if (group === "rotation") {
      object.rotation[axis] = THREE.MathUtils.degToRad(numeric);
      const continuous = object.userData.animationRotation || [object.rotation.x, object.rotation.y, object.rotation.z];
      continuous[index] = THREE.MathUtils.degToRad(numeric);
      object.userData.animationRotation = continuous;
    } else object[group][axis] = numeric;
    updateLightDirection(object);
    runtimeRef.current?.lightHelper?.update?.();
    syncSelection(object);
  }

  function updateMaterial(key, value) {
    const object = selectedRef.current;
    const materials = materialsForObject(object);
    if (!materials.length) return;
    pushHistory();
    materials.forEach((material) => {
      if (key === "color") material.color?.set(value);
      else material[key] = Number(value);
      material.needsUpdate = true;
    });
    syncSelection(object);
    refreshObjects();
  }

  function materialsForObject(object) {
    const materials = [];
    object?.traverse((item) => {
      const itemMaterials = Array.isArray(item.material) ? item.material : item.material ? [item.material] : [];
      itemMaterials.forEach((material) => {
        if (!materials.includes(material)) materials.push(material);
      });
    });
    return materials;
  }

  async function applyTexture(event) {
    const file = event.target.files?.[0];
    const object = selectedRef.current;
    const materials = materialsForObject(object);
    if (!file || !object || !materials.length) return;
    try {
      setStatus("Cargando textura...");
      const dataUrl = await fileToTextureDataUrl(file);
      const texture = await new THREE.TextureLoader().loadAsync(dataUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.flipY = object.userData.editorType === "model" ? false : true;
      pushHistory();
      materials.forEach((material) => {
        material.map?.dispose?.();
        material.map = texture.clone();
        material.map.needsUpdate = true;
        material.color?.set("#ffffff");
        material.needsUpdate = true;
      });
      texture.dispose();
      object.userData.textureName = file.name;
      syncSelection(object);
      setStatus(`${file.name} aplicada`);
    } catch (error) {
      console.error(error);
      setStatus(error?.message || "No se pudo cargar la textura");
    } finally {
      event.target.value = "";
    }
  }

  function updateTextureRepeat(axis, value) {
    const object = selectedRef.current;
    const numeric = Math.max(0.1, Number(value));
    materialsForObject(object).forEach((material) => {
      if (!material.map) return;
      material.map.repeat[axis] = numeric;
      material.map.needsUpdate = true;
    });
    syncSelection(object);
  }

  function removeTexture() {
    const object = selectedRef.current;
    if (!object) return;
    pushHistory();
    materialsForObject(object).forEach((material) => {
      material.map?.dispose?.();
      material.map = null;
      material.needsUpdate = true;
    });
    delete object.userData.textureName;
    syncSelection(object);
  }

  async function applyMaterialPreset(preset) {
    const object = selectedRef.current;
    if (!object) return;
    let sourceTexture = null;
    const textureUrl = preset.texture || preset.bumpTexture;
    if (textureUrl) {
      sourceTexture = await new THREE.TextureLoader().loadAsync(textureUrl);
      sourceTexture.colorSpace = THREE.SRGBColorSpace;
      sourceTexture.wrapS = sourceTexture.wrapT = THREE.RepeatWrapping;
      const repeat = preset.id === "ceramic" ? 1.5 : preset.id === "wood" ? 1.2 : 2.2;
      sourceTexture.repeat.set(repeat, repeat);
      sourceTexture.anisotropy = 8;
      sourceTexture.flipY = object.userData.editorType !== "model";
    }
    pushHistory();
    const replaceMaterial = (material) => {
      if (!material) return material;
      const texture = sourceTexture?.clone() || null;
      if (texture) texture.needsUpdate = true;
      const next = new THREE.MeshPhysicalMaterial({
        color: preset.color,
        metalness: preset.metalness,
        roughness: preset.roughness,
        map: preset.texture ? texture : null,
        bumpMap: texture,
        bumpScale: preset.bumpScale || 0,
        clearcoat: preset.clearcoat || 0,
        clearcoatRoughness: 0.12,
        transmission: preset.transmission || 0,
        ior: preset.ior || 1.5,
        thickness: preset.thickness || 0,
        transparent: Boolean(preset.transmission || preset.opacity < 1),
        opacity: preset.opacity ?? 1,
        emissive: preset.emissive || "#000000",
        emissiveIntensity: preset.emissiveIntensity || 0,
        toneMapped: preset.toneMapped !== false,
        side: material.side,
        vertexColors: material.vertexColors
      });
      material.map?.dispose?.();
      if (material.bumpMap !== material.map) material.bumpMap?.dispose?.();
      material.dispose?.();
      return next;
    };
    object.traverse((item) => {
      if (!item.material) return;
      item.material = Array.isArray(item.material) ? item.material.map(replaceMaterial) : replaceMaterial(item.material);
    });
    sourceTexture?.dispose();
    object.userData.textureName = preset.texture || preset.bumpTexture ? preset.name : "";
    const previousGlow = object.getObjectByName("__studioNeonGlow");
    if (preset.id === "neon") {
      const glow = previousGlow || new THREE.PointLight(0x00f5ad, 5, 7, 2);
      glow.name = "__studioNeonGlow";
      glow.userData.editorHelper = true;
      if (!previousGlow) object.add(glow);
      const center = new Box3().setFromObject(object).getCenter(new Vector3());
      object.worldToLocal(center);
      glow.position.copy(center);
    } else if (previousGlow) {
      object.remove(previousGlow);
      previousGlow.dispose?.();
    }
    syncSelection(object);
    refreshObjects();
  }

  function addText() {
    const runtime = runtimeRef.current;
    const value = textDraft.trim();
    if (!runtime || !value) return;
    pushHistory();
    const object = new THREE.Mesh(
      createTextGeometry(value, extrudeDepth, textFont),
      new THREE.MeshPhysicalMaterial({ color: 0x8b5cf6, metalness: 0.2, roughness: 0.3 })
    );
    object.name = value;
    object.position.set(0, 0.05, 1.4);
    object.castShadow = true;
    object.receiveShadow = true;
    object.userData = { editorId: makeId(), editorType: "text", text: value, depth: extrudeDepth, font: textFont };
    runtime.content.add(object);
    refreshObjects();
    selectObject(object);
    focusSelected();
  }

  function updateSelectedText(value = textDraft, depth = extrudeDepth, fontId = textFont) {
    const object = selectedRef.current;
    const normalized = value.trim();
    if (object?.userData.editorType !== "text" || !normalized) return;
    const previousGeometry = object.geometry;
    object.geometry = createTextGeometry(normalized, depth, fontId);
    previousGeometry?.dispose();
    object.name = normalized;
    object.userData.text = normalized;
    object.userData.depth = depth;
    object.userData.font = fontId;
    syncSelection(object);
    refreshObjects();
  }

  function changeTextDraft(value) {
    setTextDraft(value);
    updateSelectedText(value, extrudeDepth);
  }

  function changeTextDepth(value) {
    const depth = Number(value);
    setExtrudeDepth(depth);
    updateSelectedText(textDraft, depth);
  }

  function changeTextFont(fontId) {
    setTextFont(fontId);
    if (selectedRef.current?.userData.editorType === "text") {
      pushHistory();
      updateSelectedText(textDraft, extrudeDepth, fontId);
    }
  }

  async function importSvg(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setStatus("Convirtiendo SVG...");
      const svgText = await file.text();
      const data = new SVGLoader().parse(svgText);
      const group = new THREE.Group();
      const material = new THREE.MeshPhysicalMaterial({ color: 0x8b5cf6, metalness: 0.15, roughness: 0.34, side: THREE.DoubleSide });
      data.paths.forEach((path) => {
        SVGLoader.createShapes(path).forEach((shape) => {
          const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: extrudeDepth,
            bevelEnabled: true,
            bevelThickness: 0.025,
            bevelSize: 0.018,
            bevelSegments: 2,
            curveSegments: 10
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          group.add(mesh);
        });
      });
      if (!group.children.length) throw new Error("El SVG no contiene formas cerradas.");
      pushHistory();
      group.name = file.name.replace(/\.svg$/i, "");
      group.userData = { editorId: makeId(), editorType: "svg" };
      group.scale.y = -1;
      const bounds = new Box3().setFromObject(group);
      const center = bounds.getCenter(new Vector3());
      const size = bounds.getSize(new Vector3());
      const fitScale = 4 / Math.max(size.x, size.y, 1);
      group.scale.multiplyScalar(fitScale);
      group.position.set(-center.x * fitScale, center.y * fitScale, 0);
      new Box3().setFromObject(group).getCenter(center);
      group.position.sub(center);
      group.position.y -= new Box3().setFromObject(group).min.y;
      runtimeRef.current.content.add(group);
      refreshObjects();
      selectObject(group);
      focusSelected();
      setStatus(`${file.name} convertido a 3D`);
    } catch (error) {
      console.error(error);
      setStatus(error?.message || "No se pudo convertir el SVG");
    } finally {
      event.target.value = "";
    }
  }

  async function importModel(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setStatus("Importando modelo...");
      const url = URL.createObjectURL(file);
      const gltf = await new GLTFLoader().loadAsync(url);
      URL.revokeObjectURL(url);
      pushHistory();
      const model = gltf.scene;
      model.name = file.name.replace(/\.(glb|gltf)$/i, "");
      model.userData = { ...model.userData, editorId: makeId(), editorType: "model" };
      model.traverse((item) => {
        if (item.isMesh) { item.castShadow = true; item.receiveShadow = true; }
      });
      const bounds = new Box3().setFromObject(model);
      const size = bounds.getSize(new Vector3());
      const scale = 4 / Math.max(size.x, size.y, size.z, 1);
      model.scale.multiplyScalar(scale);
      bounds.setFromObject(model);
      model.position.y -= bounds.min.y;
      runtimeRef.current.content.add(model);
      refreshObjects();
      selectObject(model);
      focusSelected();
      setStatus(`${file.name} importado`);
    } catch (error) {
      console.error(error);
      setStatus("No se pudo importar el modelo");
    } finally {
      event.target.value = "";
    }
  }

  function exportPng() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const gridWasVisible = runtime.grid.visible;
    runtime.grid.visible = false;
    runtime.transformHelper.visible = false;
    if (runtime.lightHelper) runtime.lightHelper.visible = false;
    setLightMarkersVisible(false);
    const restoreOutput = prepareRenderOutput({ transparent: transparentPng });
    runtime.renderer.render(runtime.scene, runtime.camera);
    runtime.renderer.domElement.toBlob((blob) => {
      if (blob) downloadBlob(blob, "studio-3d.png");
      restoreOutput();
      runtime.grid.visible = gridWasVisible;
      runtime.transformHelper.visible = true;
      if (runtime.lightHelper) runtime.lightHelper.visible = true;
      setLightMarkersVisible(true);
    }, "image/png");
  }

  function exportGlb() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    new GLTFExporter().parse(
      runtime.content,
      (result) => downloadBlob(new Blob([result], { type: "model/gltf-binary" }), "studio-3d.glb"),
      (error) => { console.error(error); setStatus("No se pudo exportar el modelo"); },
      { binary: true, onlyVisible: true }
    );
  }

  return (
    <section className="three-editor">
      <div className="three-toolbar" aria-label="Herramientas 3D">
        <div className="three-tool-group">
          <button data-tooltip="Seleccionar" onClick={() => setMode("translate")} type="button"><MousePointer2 size={18} /></button>
          <button className={mode === "translate" ? "active" : ""} data-tooltip="Mover (W)" onClick={() => setMode("translate")} type="button"><Move3D size={18} /></button>
          <button className={mode === "rotate" ? "active" : ""} data-tooltip="Rotar (E)" onClick={() => setMode("rotate")} type="button"><Rotate3D size={18} /></button>
          <button className={mode === "scale" ? "active" : ""} data-tooltip="Escalar (R)" onClick={() => setMode("scale")} type="button"><Scale3D size={18} /></button>
          <button className={mode === "sculpt" ? "active" : ""} disabled={!selectedId || selectedRef.current?.isLight} data-tooltip="Esculpir como arcilla (B)" onClick={() => { setMode("sculpt"); setPropertyTab("model"); }} type="button"><Hammer size={18} /></button>
        </div>
        <div className="three-tool-group three-camera-tools">
          <Camera size={16} />
          <button data-tooltip="Vista frontal" onClick={() => setCameraView("front")} type="button">F</button>
          <button data-tooltip="Vista superior" onClick={() => setCameraView("top")} type="button">S</button>
          <button data-tooltip="Vista lateral" onClick={() => setCameraView("side")} type="button">L</button>
          <button data-tooltip="Vista isometrica" onClick={() => setCameraView("iso")} type="button">I</button>
        </div>
        <div className="three-tool-group">
          <button disabled={!historyCounts.undo} data-tooltip="Deshacer (Ctrl+Z)" onClick={undo} type="button"><Undo2 size={18} /></button>
          <button disabled={!historyCounts.redo} data-tooltip="Rehacer (Ctrl+Y)" onClick={redo} type="button"><Redo2 size={18} /></button>
          <button disabled={!selectedId} data-tooltip="Enfocar objeto" onClick={focusSelected} type="button"><Focus size={18} /></button>
          <button disabled={!selectedId} data-tooltip="Copiar (Ctrl+C)" onClick={copySelected} type="button"><Copy size={18} /></button>
          <button disabled={!hasClipboard} data-tooltip="Pegar (Ctrl+V)" onClick={pasteClipboard} type="button"><ClipboardPaste size={18} /></button>
          <button disabled={!selectedId} data-tooltip="Centrar en la escena" onClick={centerSelected} type="button"><LocateFixed size={18} /></button>
          <button disabled={!selectedId || selectedRef.current?.isLight} data-tooltip="Apoyar sobre el piso" onClick={placeOnFloor} type="button"><ArrowDownToLine size={18} /></button>
          <button disabled={selectedIds.length < 2} data-tooltip="Agrupar seleccion (Ctrl+G)" onClick={groupSelected} type="button"><Group size={18} /></button>
          <button disabled={!selectedRef.current?.isGroup} data-tooltip="Desagrupar (Ctrl+Shift+G)" onClick={ungroupSelected} type="button"><Ungroup size={18} /></button>
          <button disabled={selectedIds.length < 2} data-tooltip="Fusionar mallas" onClick={mergeSelected} type="button"><Combine size={18} /></button>
          <button disabled={!selectedId} data-tooltip="Eliminar objeto" onClick={removeSelected} type="button"><Trash2 size={18} /></button>
        </div>
        <div className="three-toolbar-spacer" />
        <button className="three-action" onClick={onRequestProjectSave} type="button"><Download size={17} /> Guardar</button>
        <button className="three-action" onClick={exportPng} type="button"><ImageDown size={17} /> PNG</button>
        <button className="three-action" onClick={exportGlb} type="button"><Download size={17} /> GLB</button>
      </div>

      <div className="three-workspace">
        <aside className="three-library" data-wizard="three-objects">
          <div className="three-panel-heading"><span>CREAR</span><strong>Objetos</strong></div>
          <div className="three-add-grid">
            <button onClick={() => addPrimitive("box")} type="button"><Box size={22} /><span>Cubo</span></button>
            <button onClick={() => addPrimitive("sphere")} type="button"><Circle size={22} /><span>Esfera</span></button>
            <button onClick={() => addPrimitive("cylinder")} type="button"><Cylinder size={22} /><span>Cilindro</span></button>
            <button onClick={() => addPrimitive("cone")} type="button"><Cone size={22} /><span>Cono</span></button>
            <button onClick={() => addLight("point")} type="button"><Lightbulb size={22} /><span>Puntual</span></button>
            <button onClick={() => addLight("directional")} type="button"><Sun size={22} /><span>Solar</span></button>
            <button onClick={() => addLight("spot")} type="button"><Flashlight size={22} /><span>Foco</span></button>
            <label className="three-import"><Upload size={22} /><span>Modelo</span><input accept=".glb,.gltf,model/gltf-binary,model/gltf+json" onChange={importModel} type="file" /></label>
            <label className="three-import"><Palette size={22} /><span>SVG 3D</span><input accept=".svg,image/svg+xml" onChange={importSvg} type="file" /></label>
          </div>
          <div className="three-create-text">
            <label><span>Texto 3D</span><input maxLength="42" onChange={(event) => changeTextDraft(event.target.value)} onFocus={pushHistory} value={textDraft} /></label>
            <label><span>Tipografia</span><select onChange={(event) => changeTextFont(event.target.value)} value={textFont}>{Object.entries(THREE_FONTS).map(([id, entry]) => <option key={id} value={id}>{entry.name}</option>)}</select></label>
            <label><span>Profundidad</span><input max="1.5" min="0.05" onChange={(event) => changeTextDepth(event.target.value)} onFocus={pushHistory} step="0.05" type="number" value={extrudeDepth} /></label>
            <button disabled={!textDraft.trim()} onClick={selectedRef.current?.userData.editorType === "text" ? () => updateSelectedText() : addText} type="button"><Type size={16} /> {selectedRef.current?.userData.editorType === "text" ? "Aplicar cambios" : "Agregar texto"}</button>
          </div>
          <div className="three-panel-heading three-scene-heading"><span>ESCENA</span><strong>Objetos</strong></div>
          <div className="three-outliner">
            {objects.map((item) => {
              const ItemIcon = iconForType(item.type);
              return <div className={`three-outliner-row ${selectedIds.includes(item.id) ? "active" : ""}`} key={item.id}>
                <button className="three-outliner-select" onClick={(event) => selectObject(runtimeRef.current?.content.children.find((object) => object.userData.editorId === item.id), event.shiftKey)} type="button"><ItemIcon size={16} /><span>{item.name}</span></button>
                <button className="three-outliner-visibility" data-tooltip={item.visible ? "Ocultar" : "Mostrar"} onClick={() => toggleObjectVisibility(item.id)} type="button">{item.visible ? <Eye size={15} /> : <EyeOff size={15} />}</button>
              </div>;
            })}
          </div>
        </aside>

        <div className="three-viewport-wrap" data-wizard="three-viewport">
          <div className="three-viewport" ref={hostRef} />
          <div className="three-viewport-label"><Circle size={8} fill="currentColor" /> Perspectiva</div>
          {status && <div className="three-status">{status}</div>}
        </div>

        <aside className="three-properties" data-tab={propertyTab} data-wizard="three-properties">
          <div className="three-panel-heading"><span>PROPIEDADES</span><strong>{selection?.name || "Escena"}</strong></div>
          <nav aria-label="Panel de propiedades 3D" className="three-property-tabs">
            <button className={propertyTab === "object" ? "active" : ""} onClick={() => setPropertyTab("object")} type="button">Objeto</button>
            <button className={propertyTab === "model" ? "active" : ""} onClick={() => setPropertyTab("model")} type="button">Modelar</button>
            <button className={propertyTab === "material" ? "active" : ""} onClick={() => setPropertyTab("material")} type="button">Material</button>
            <button className={propertyTab === "scene" ? "active" : ""} onClick={() => setPropertyTab("scene")} type="button">Escena</button>
            <button className={propertyTab === "output" ? "active" : ""} onClick={() => setPropertyTab("output")} type="button">Salida</button>
          </nav>
          {selection ? (
            <>
              <fieldset className="three-tab-object">
                <legend>Objeto</legend>
                <label><span>Nombre</span><input maxLength="80" onChange={(event) => renameSelected(event.target.value)} onFocus={pushHistory} value={selection.name} /></label>
              </fieldset>
              {["position", "rotation", "scale"].map((group) => (
                <fieldset className="three-tab-object" key={group}>
                  <legend>{group === "position" ? "Posicion" : group === "rotation" ? "Rotacion" : "Escala"}</legend>
                  <div className="three-vector-inputs">
                    {["X", "Y", "Z"].map((axis, index) => <label key={axis}><span>{axis}</span><input onBlur={() => pushHistory()} onChange={(event) => updateTransform(group, index, event.target.value)} step="0.1" type="number" value={selection[group][index]} /></label>)}
                  </div>
                </fieldset>
              ))}
              {selection.isLight && (
                <fieldset className="three-tab-object">
                  <legend>Iluminacion</legend>
                  <label className="three-color-field"><span>Color</span><input onChange={(event) => updateLight("color", event.target.value)} type="color" value={selection.lightColor} /></label>
                  <label><span>Intensidad</span><input max={selectedRef.current?.isDirectionalLight ? 10 : 2000} min="0" onChange={(event) => updateLight("intensity", event.target.value)} step={selectedRef.current?.isDirectionalLight ? 0.1 : 10} type="range" value={selection.intensity} /></label>
                  <label><span>Valor</span><input max={selectedRef.current?.isDirectionalLight ? 10 : 5000} min="0" onChange={(event) => updateLight("intensity", event.target.value)} step={selectedRef.current?.isDirectionalLight ? 0.1 : 10} type="number" value={selection.intensity} /></label>
                  {(selectedRef.current?.isPointLight || selectedRef.current?.isSpotLight) && <label><span>Alcance</span><input max="100" min="0" onChange={(event) => updateLight("distance", event.target.value)} step="1" type="number" value={selection.distance} /></label>}
                  {selectedRef.current?.isSpotLight && <label><span>Apertura</span><input max="80" min="5" onChange={(event) => updateLight("angle", event.target.value)} step="1" type="range" value={selection.angle} /></label>}
                </fieldset>
              )}
              {!selection.isLight && (
                <>
                  <fieldset className="three-tab-model">
                    <legend>Rotacion automatica</legend>
                    <label className="three-check"><input checked={selection.spin.enabled} onChange={(event) => updateSpin("enabled", event.target.checked)} type="checkbox" /><Rotate3D size={16} /> Girar sobre si mismo</label>
                    <label><span>Eje</span><select onChange={(event) => updateSpin("axis", event.target.value)} value={selection.spin.axis}><option value="x">X</option><option value="y">Y</option><option value="z">Z</option></select></label>
                    <label><span>Velocidad</span><input max="360" min="-360" onChange={(event) => updateSpin("speed", Number(event.target.value))} step="5" type="range" value={selection.spin.speed} /></label>
                    <label><span>Grados/seg</span><input max="360" min="-360" onChange={(event) => updateSpin("speed", Number(event.target.value))} step="5" type="number" value={selection.spin.speed} /></label>
                  </fieldset>
                  <fieldset className="three-tab-model">
                    <legend>Moldear como masilla</legend>
                    <label><span>Intensidad</span><input max="1" min="0.02" onChange={(event) => setDeformAmount(Number(event.target.value))} step="0.02" type="range" value={deformAmount} /></label>
                    <div className="three-model-actions">
                      <button onClick={() => deformSelected("inflate", deformAmount)} type="button"><Sparkles size={15} /> Inflar</button>
                      <button onClick={() => deformSelected("dent", deformAmount)} type="button"><Hammer size={15} /> Hundir</button>
                      <button onClick={() => deformSelected("twist", deformAmount)} type="button"><Rotate3D size={15} /> Retorcer</button>
                      <button onClick={() => deformSelected("stretch", deformAmount)} type="button"><Scale3D size={15} /> Estirar</button>
                    </div>
                  </fieldset>
                  <fieldset className="three-tab-model">
                    <legend>Esculpir con el mouse</legend>
                    <div className="three-sculpt-brushes">
                      <button className={sculptBrush === "inflate" ? "active" : ""} onClick={() => setSculptBrush("inflate")} type="button">Volumen</button>
                      <button className={sculptBrush === "dent" ? "active" : ""} onClick={() => setSculptBrush("dent")} type="button">Hundir</button>
                      <button className={sculptBrush === "smooth" ? "active" : ""} onClick={() => setSculptBrush("smooth")} type="button">Suavizar</button>
                      <button className={sculptBrush === "pinch" ? "active" : ""} onClick={() => setSculptBrush("pinch")} type="button">Pinzar</button>
                    </div>
                    <label><span>Radio</span><input max="3" min="0.1" onChange={(event) => setSculptRadius(Number(event.target.value))} step="0.05" type="range" value={sculptRadius} /></label>
                    <label><span>Intensidad</span><input max="1" min="0.02" onChange={(event) => setSculptStrength(Number(event.target.value))} step="0.02" type="range" value={sculptStrength} /></label>
                    <button className={mode === "sculpt" ? "three-sculpt-toggle active" : "three-sculpt-toggle"} onClick={() => setMode(mode === "sculpt" ? "translate" : "sculpt")} type="button"><Hammer size={16} /> {mode === "sculpt" ? "Salir de esculpir" : "Esculpir en el objeto"}</button>
                    <p className="three-model-hint">Mantene el clic y arrastra sobre la superficie.</p>
                  </fieldset>
                  <fieldset className="three-tab-model">
                    <legend>Combinar</legend>
                    <p className="three-model-hint">Selecciona varios objetos con Shift.</p>
                    <div className="three-model-actions">
                      <button disabled={selectedIds.length < 2} onClick={groupSelected} type="button"><Group size={15} /> Agrupar</button>
                      <button disabled={!selectedRef.current?.isGroup} onClick={ungroupSelected} type="button"><Ungroup size={15} /> Desagrupar</button>
                      <button disabled={selectedIds.length < 2} onClick={mergeSelected} type="button"><Combine size={15} /> Fusionar</button>
                    </div>
                  </fieldset>
                </>
              )}
              {materialsForObject(selectedRef.current).length > 0 && (
                <fieldset className="three-tab-material">
                  <legend>Material</legend>
                  <label className="three-color-field"><span>Color</span><input onChange={(event) => updateMaterial("color", event.target.value)} type="color" value={selection.color} /></label>
                  <label><span>Metal</span><input max="1" min="0" onChange={(event) => updateMaterial("metalness", event.target.value)} step="0.05" type="range" value={selection.metalness} /></label>
                  <label><span>Rugosidad</span><input max="1" min="0" onChange={(event) => updateMaterial("roughness", event.target.value)} step="0.05" type="range" value={selection.roughness} /></label>
                  <div className="three-texture-control">
                    <label className="three-texture-upload"><Upload size={15} /><span>{selection.textureName || "Cargar textura"}</span><input accept="image/png,image/jpeg,image/webp" onChange={applyTexture} type="file" /></label>
                    {selection.textureName && <button data-tooltip="Quitar textura" onClick={removeTexture} type="button"><Trash2 size={15} /></button>}
                  </div>
                  {selection.textureName && <div className="three-texture-repeat">
                    <label><span>Repetir X</span><input min="0.1" onChange={(event) => updateTextureRepeat("x", event.target.value)} onFocus={pushHistory} step="0.1" type="number" value={selection.textureRepeat[0]} /></label>
                    <label><span>Repetir Y</span><input min="0.1" onChange={(event) => updateTextureRepeat("y", event.target.value)} onFocus={pushHistory} step="0.1" type="number" value={selection.textureRepeat[1]} /></label>
                  </div>}
                </fieldset>
              )}
              <fieldset className="three-tab-material">
                <legend>Biblioteca de materiales</legend>
                <div className="three-material-presets">
                  {MATERIAL_PRESETS.map((preset) => <button data-tooltip={preset.name} key={preset.id} onClick={() => applyMaterialPreset(preset)} style={{ "--material-color": preset.color }} type="button"><span />{preset.name}</button>)}
                </div>
              </fieldset>
            </>
          ) : (
            <p className="three-empty-selection three-tab-selection">Selecciona un objeto en la escena para editarlo.</p>
          )}
          <fieldset className="three-tab-scene">
            <legend>Entorno</legend>
            <div className="three-background-presets">
              {ENVIRONMENT_BACKGROUNDS.map((preset) => <button className={environmentBackground === preset.id ? "active" : ""} key={preset.id} onClick={() => { pushHistory(); setEnvironmentBackground(preset.id); if (preset.id !== "solid") { setFloorVisible(true); setFloorSurface("shadow"); } }} style={preset.image ? { backgroundImage: `url(${preset.image})` } : { background: background }} type="button"><span>{preset.name}</span></button>)}
            </div>
            <div className="three-sublegend">Cielo e iluminacion</div>
            <div className="three-sky-presets">
              {SKY_BACKGROUNDS.map((preset) => <button className={environmentBackground === preset.id ? "active" : ""} key={preset.id} onClick={() => applySkyPreset(preset)} style={{ backgroundImage: `url(${preset.image})` }} type="button"><span>{preset.name}</span></button>)}
            </div>
            <div className="three-environment-presets">
              <button onClick={() => applyScenePreset("studio")} type="button">Estudio</button>
              <button onClick={() => applyScenePreset("product")} type="button">Producto</button>
              <button onClick={() => applyScenePreset("night")} type="button">Nocturno</button>
            </div>
            <label className="three-color-field"><span>Fondo</span><input disabled={environmentBackground !== "solid"} onChange={(event) => setBackground(event.target.value)} type="color" value={background} /></label>
            <label><span>Exposicion</span><input max="2.5" min="0.25" onChange={(event) => setExposure(Number(event.target.value))} step="0.05" type="range" value={exposure} /></label>
            <label><span>Luz ambiente</span><input max="3" min="0" onChange={(event) => setAmbientIntensity(Number(event.target.value))} step="0.1" type="range" value={ambientIntensity} /></label>
            <div className="three-floor-surfaces">
              {FLOOR_SURFACES.map((surface) => <button className={floorSurface === surface.id ? "active" : ""} key={surface.id} onClick={() => { pushHistory(); setFloorSurface(surface.id); setFloorVisible(true); }} style={{ "--floor-swatch": surface.color }} type="button"><span />{surface.name}</button>)}
            </div>
            <label className="three-color-field"><span>Color piso</span><input disabled={!floorVisible || floorSurface !== "plastic"} onChange={(event) => setFloorColor(event.target.value)} type="color" value={floorColor} /></label>
            <label className="three-check"><input checked={floorVisible} onChange={(event) => setFloorVisible(event.target.checked)} type="checkbox" /><Square size={16} /> Mostrar piso</label>
            <label className="three-check"><input checked={gridVisible} onChange={(event) => setGridVisible(event.target.checked)} type="checkbox" /><Grid3X3 size={16} /> Mostrar grilla</label>
          </fieldset>
          <fieldset className="three-tab-output">
            <legend>Salida</legend>
            <label><span>Resolucion</span><select onChange={(event) => setRenderResolution(event.target.value)} value={renderResolution}>
              <option value="1280x720">HD 1280 x 720</option>
              <option value="1920x1080">Full HD 1920 x 1080</option>
              <option value="1080x1080">Cuadrada 1080 x 1080</option>
              <option value="1080x1920">Vertical 1080 x 1920</option>
              <option value="3840x2160">4K 3840 x 2160</option>
            </select></label>
            <label className="three-check"><input checked={transparentPng} onChange={(event) => setTransparentPng(event.target.checked)} type="checkbox" /><ImageDown size={16} /> PNG transparente</label>
          </fieldset>
        </aside>
      </div>
      <ThreeAnimationPanel
        cameraKeyframes={animationTracks[CAMERA_TRACK_ID] || []}
        currentTime={animationTime}
        duration={animationDuration}
        keyframes={animationTracks[selectedId] || []}
        onAddKeyframe={addAnimationKeyframe}
        onAddCameraKeyframe={addCameraKeyframe}
        onClear={clearSelectedAnimation}
        onClearCamera={clearCameraAnimation}
        onDurationChange={(value) => {
          const nextDuration = Math.max(1, value);
          setAnimationDuration(nextDuration);
          seekAnimation(Math.min(animationTime, nextDuration));
        }}
        onDeleteMarker={deleteAnimationMarker}
        onPlayingChange={setAnimationPlaying}
        onExport={exportAnimation}
        onFpsChange={setAnimationFps}
        onSeek={seekAnimation}
        exporting={animationExporting}
        fps={animationFps}
        playing={animationPlaying}
        selectedName={selection?.name || ""}
      />
    </section>
  );
}
