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
import skyInfernal from "../assets/environments/sky-infernal.png";
import skyApocalypse from "../assets/environments/sky-apocalypse.png";
import skyCemetery from "../assets/environments/sky-cemetery.png";
import infernalFloorTexture from "../assets/environments/infernal-floor-texture.png";
import apocalypseFloorTexture from "../assets/environments/apocalypse-floor-texture.png";
import cemeteryFloorTexture from "../assets/environments/cemetery-floor-texture.png";
import skyMedievalApocalypse from "../assets/environments/sky-medieval-apocalypse.png";
import medievalApocalypseFloorTexture from "../assets/environments/medieval-apocalypse-floor-texture.png";
import skyGothicChurch from "../assets/environments/sky-gothic-church.png";
import gothicChurchFloorTexture from "../assets/environments/gothic-church-floor-texture.png";
import skyNightSwamp from "../assets/environments/sky-night-swamp.png";
import nightSwampFloorTexture from "../assets/environments/night-swamp-floor-texture.png";
import skyRuinedGothicChurch from "../assets/environments/sky-ruined-gothic-church.png";
import ruinedGothicChurchFloorTexture from "../assets/environments/ruined-gothic-church-floor-texture.png";
import skyCastleInterior from "../assets/environments/sky-castle-interior.png";
import skyCastleCourtyard from "../assets/environments/sky-castle-courtyard.png";
import skyMedievalVillage from "../assets/environments/sky-medieval-village.png";
import skyMoonlitPeaks from "../assets/environments/sky-moonlit-peaks.png";
import skySpiderwebRuins from "../assets/environments/sky-spiderweb-ruins.png";
import neonboyModelUrl from "../assets/Meshy_AI_Midnight_Jester_Axe_Breathe_and_Look_.glb?url";
import neonboyLogoModelUrl from "../assets/logo.glb?url";
import {
  ArrowDownToLine, Box, Camera, Circle, CircleDot, ClipboardPaste, CloudFog, CloudLightning, CloudRain, Combine, Cone, Copy, Cylinder, Download, Eye,
  EyeOff, Film, Flashlight, FlipHorizontal2, Focus, Grid3X3, ImageDown, Lightbulb, LocateFixed,
  Flame, Group, Hammer, Link2, Lock, MousePointer2, Move3D, Palette, Pause, Pill, Play, Redo2, Rotate3D, RotateCcw, Scale3D, Sparkles, Square,
  Sun, Trash2, Type, Undo2, Ungroup, Unlink2, Unlock, Upload, ZoomIn, ZoomOut
} from "lucide-react";
import { getProject, putProject } from "../storage/projectDb.js";
import ThreeAnimationPanel from "./ThreeAnimationPanel.jsx";

const THREE_PROJECT_ID = "three";
const THREE_AUTOSAVE_ID = "autosave:three";
const CAMERA_TRACK_ID = "__camera__";
const DEFAULT_BACKGROUND = "#17191d";
const API = window.location.port === "5173" ? "http://127.0.0.1:5174" : window.location.origin;
const CAMERA_SHOTS = [
  { id: "general", name: "General", crop: 0, fill: 0.72, fov: 45 },
  { id: "full", name: "Entero", crop: 0, fill: 0.86, fov: 42 },
  { id: "american", name: "Americano", crop: 0.22, fill: 0.88, fov: 38 },
  { id: "medium", name: "Medio", crop: 0.48, fill: 0.9, fov: 35 },
  { id: "close", name: "Primer plano", crop: 0.7, fill: 0.88, fov: 32 },
  { id: "three-quarter-left", name: "3/4 izquierda", crop: 0.42, fill: 0.88, fov: 36, angle: 38, elevation: 4 },
  { id: "three-quarter-right", name: "3/4 derecha", crop: 0.42, fill: 0.88, fov: 36, angle: -38, elevation: 4 },
  { id: "profile", name: "Perfil", crop: 0.28, fill: 0.86, fov: 38, angle: 86, elevation: 2 },
  { id: "hero", name: "Heroe", crop: 0.18, fill: 0.9, fov: 30, angle: -28, elevation: -11 },
  { id: "low-angle", name: "Contrapicado", crop: 0.12, fill: 0.84, fov: 34, angle: 18, elevation: -22 },
  { id: "high-angle", name: "Picado", crop: 0.3, fill: 0.86, fov: 38, angle: -18, elevation: 30 },
  { id: "dutch", name: "Plano holandes", crop: 0.38, fill: 0.84, fov: 35, angle: 30, elevation: 3, roll: -12 }
];
const POSE_BONES = [
  { id: "LeftShoulder", name: "Hombro izquierdo" },
  { id: "LeftArm", name: "Brazo izquierdo" },
  { id: "LeftForeArm", name: "Antebrazo izquierdo" },
  { id: "RightShoulder", name: "Hombro derecho" },
  { id: "RightArm", name: "Brazo derecho" },
  { id: "RightForeArm", name: "Antebrazo derecho" },
  { id: "Head", name: "Cabeza" },
  { id: "Spine", name: "Torso" }
];
const NEONBOY_ANIMATION_URLS = import.meta.glob("../assets/neonboy-animaciones/*.glb", { import: "default", query: "?url" });
const GUITAR_MODEL_LOADER = NEONBOY_ANIMATION_URLS["../assets/neonboy-animaciones/guitar.glb"];
const STATIC_MODEL_URLS = import.meta.glob("../assets/3destatic/*.glb", { import: "default", query: "?url" });
const ENVIRONMENT_THUMBNAIL_URLS = import.meta.glob("../assets/environments/thumbnails/*.jpg", { eager: true, import: "default", query: "?url" });
const ENVIRONMENT_THUMBNAILS = Object.fromEntries(Object.entries(ENVIRONMENT_THUMBNAIL_URLS).map(([path, url]) => [path.split("/").pop().replace(/\.jpg$/i, ""), url]));
const CHARACTER_ANIMATION_NAMES = {
  "Meshy_AI_Midnight_Jester_Chair_Sit_Idle_M": { character: "Neoncruzader", animation: "Sentado", order: 2 },
  "Meshy_AI_Midnight_Jester_Long_Breathe_and_Look": { character: "Neoncruzader", animation: "Respirando", order: 1 },
  "Meshy_AI_Midnight_Jester_Walk_Slowly_and_Look_": { character: "Neoncruzader", animation: "Caminando", order: 3 },
  "neon-stand": { character: "Neonboy", animation: "Hablando", order: 10 },
  "neon-sit-chair": { character: "Neonboy", animation: "Sentado", order: 11 },
  "neon-hablando": { character: "Neonboy", animation: "Respirando", order: 12 },
  "neon-hablando-mano": { character: "Neonboy", animation: "Hablando con manos", order: 13 },
  "neon-guitar": { character: "Neonboy", animation: "Guitarrista", order: 14 },
  "neon-guitar-3": { character: "Neonboy", animation: "Guitarrista 2", order: 15 },
  "neon-guitar-4": { character: "Neonboy", animation: "Guitarrista 3", order: 16 },
  "calm-guitar": { character: "Neonboy", animation: "Guitarrista calmo", order: 17 },
  "neon-rock": { character: "Neonboy", animation: "Neon Rock", order: 18 },
  "neonrock6": { character: "Neonboy", animation: "Neon Rock 6", order: 19 },
  "neonHead": { character: "Neonboy", animation: "Neon Head", order: 20 }
};
const isGuitaristModel = (id) => id?.startsWith("neon-guitar") || ["calm-guitar", "neon-rock", "neonrock6", "neonHead"].includes(id);
const CHARACTER_MODELS = [
  { id: "breathe-look", character: "Neoncruzader", animation: "Base", name: "Neoncruzader - Base", order: 0, url: neonboyModelUrl },
  ...Object.entries(NEONBOY_ANIMATION_URLS).filter(([path]) => !path.endsWith("/guitar.glb")).map(([path, loadUrl]) => {
    const filename = path.split("/").pop().replace(/\.glb$/i, "");
    const metadata = CHARACTER_ANIMATION_NAMES[filename] || {
      character: filename.startsWith("neon-") ? "Neonboy" : "Neoncruzader",
      animation: filename.replace(/^Meshy_AI_Midnight_Jester_/i, "").replace(/^neon-/i, "").replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      order: 99
    };
    return { id: filename, ...metadata, name: `${metadata.character} - ${metadata.animation}`, loadUrl };
  })
].sort((left, right) => left.order - right.order);
const STATIC_MODELS = [
  { id: "neonboy-logo", name: "Logo Neonboy", url: neonboyLogoModelUrl },
  { id: "guitar", name: "Guitarra", loadUrl: GUITAR_MODEL_LOADER },
  ...Object.entries(STATIC_MODEL_URLS).map(([path, loadUrl]) => {
    const filename = path.split("/").pop().replace(/\.glb$/i, "");
    const cleanName = filename
      .replace(/^Meshy_AI_/i, "")
      .replace(/_texture$/i, "")
      .replace(/_\d{10,}.*$/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
    return { id: filename, name: cleanName, loadUrl };
  })
];
const DEFAULT_SCENE_EFFECTS = {
  fog: { enabled: false, intensity: 0.5, color: "#768291" },
  fire: { enabled: false, intensity: 0.6 },
  rain: { enabled: false, intensity: 0.8, directionX: 0.15, directionZ: 0, color: "#9bdcff" },
  particles: { enabled: false, intensity: 0.5, color: "#d875ff" },
  storm: { enabled: false, intensity: 0.6 }
};
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
  { id: "sky-sunset", name: "Atardecer", image: skySunset, ambient: 0.48, exposure: 1.13, key: 2.4, light: "#ffad66", ground: "#50345e", environment: 0.9 },
  { id: "sky-infernal", name: "Infernal", image: skyInfernal, ambient: 0.42, exposure: 1.18, key: 3.8, light: "#ff4a1c", ground: "#180302", environment: 0.85 },
  { id: "sky-apocalypse", name: "Apocalipsis", image: skyApocalypse, ambient: 0.5, exposure: 1.05, key: 2.3, light: "#ffb06a", ground: "#302a28", environment: 0.72 },
  { id: "sky-cemetery", name: "Cementerio", image: skyCemetery, ambient: 0.24, exposure: 1.2, key: 1.25, light: "#a9c8ff", ground: "#080b12", environment: 0.78 },
  { id: "sky-medieval-apocalypse", name: "Medieval", image: skyMedievalApocalypse, ambient: 0.38, exposure: 1.12, key: 3.1, light: "#ff693c", ground: "#21100b", environment: 0.82 },
  { id: "sky-gothic-church", name: "Iglesia", image: skyGothicChurch, ambient: 0.4, exposure: 1.08, key: 1.7, light: "#a9c8ff", ground: "#1a1411", environment: 0.88 },
  { id: "sky-night-swamp", name: "Pantano", image: skyNightSwamp, ambient: 0.2, exposure: 1.28, key: 1.15, light: "#8fcfff", ground: "#06110f", environment: 0.8 },
  { id: "sky-ruined-gothic-church", name: "Iglesia en ruinas", image: skyRuinedGothicChurch, ambient: 0.22, exposure: 1.18, key: 1.35, light: "#9bbcff", ground: "#100d18", environment: 0.9 },
  { id: "sky-castle-interior", name: "Interior castillo", image: skyCastleInterior, ambient: 0.38, exposure: 1.08, key: 1.25, light: "#ffd7a0", ground: "#261b15", environment: 0.74 },
  { id: "sky-castle-courtyard", name: "Patio del castillo", image: skyCastleCourtyard, ambient: 0.82, exposure: 1.02, key: 2.35, light: "#fff0cf", ground: "#667068", environment: 0.8 },
  { id: "sky-medieval-village", name: "Aldea medieval", image: skyMedievalVillage, ambient: 0.66, exposure: 1.08, key: 1.85, light: "#ffd8a3", ground: "#4a4640", environment: 0.82 },
  { id: "sky-moonlit-peaks", name: "Cumbres luna llena", image: skyMoonlitPeaks, ambient: 0.28, exposure: 1.18, key: 1.7, light: "#c7dcff", ground: "#101721", environment: 0.92 },
  { id: "sky-spiderweb-ruins", name: "Ruinas de telaranas", image: skySpiderwebRuins, ambient: 0.2, exposure: 1.24, key: 1.15, light: "#bed5f2", ground: "#0c1115", environment: 0.88 }
];

function environmentThumbnail(preset) {
  const aliases = { field: "field-panorama", clouds: "clouds-panorama", factory: "factory-panorama" };
  return ENVIRONMENT_THUMBNAILS[aliases[preset.id] || preset.id] || preset.image;
}
const THEMED_SCENES = [
  { id: "infernal", name: "Infernal", sky: "sky-infernal", floor: "infernal", image: skyInfernal },
  { id: "apocalypse", name: "Apocalipsis", sky: "sky-apocalypse", floor: "apocalypse", image: skyApocalypse },
  { id: "cemetery", name: "Cementerio", sky: "sky-cemetery", floor: "cemetery", image: skyCemetery },
  { id: "medieval-apocalypse", name: "Medieval", sky: "sky-medieval-apocalypse", floor: "medieval-apocalypse", image: skyMedievalApocalypse },
  { id: "gothic-church", name: "Iglesia gotica", sky: "sky-gothic-church", floor: "gothic-church", image: skyGothicChurch },
  { id: "night-swamp", name: "Pantano", sky: "sky-night-swamp", floor: "night-swamp", image: skyNightSwamp },
  { id: "ruined-gothic-church", name: "Iglesia en ruinas", sky: "sky-ruined-gothic-church", floor: "ruined-gothic-church", image: skyRuinedGothicChurch },
  { id: "castle-interior", name: "Interior castillo", sky: "sky-castle-interior", floor: "gothic-church", image: skyCastleInterior },
  { id: "castle-courtyard", name: "Patio del castillo", sky: "sky-castle-courtyard", floor: "ruined-gothic-church", image: skyCastleCourtyard },
  { id: "medieval-village", name: "Aldea medieval", sky: "sky-medieval-village", floor: "medieval-apocalypse", image: skyMedievalVillage },
  { id: "moonlit-peaks", name: "Cumbres luna llena", sky: "sky-moonlit-peaks", floor: "ruined-gothic-church", image: skyMoonlitPeaks },
  { id: "spiderweb-ruins", name: "Ruinas de telaranas", sky: "sky-spiderweb-ruins", floor: "night-swamp", image: skySpiderwebRuins }
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
  { id: "water", name: "Agua", color: "#34c4e8" },
  { id: "infernal", name: "Lava", color: "#ff3b0a" },
  { id: "apocalypse", name: "Ruinas", color: "#68605a" },
  { id: "cemetery", name: "Cementerio", color: "#344139" },
  { id: "medieval-apocalypse", name: "Medieval", color: "#5d4436" },
  { id: "gothic-church", name: "Iglesia", color: "#443f3c" },
  { id: "night-swamp", name: "Pantano", color: "#193c35" },
  { id: "ruined-gothic-church", name: "Iglesia en ruinas", color: "#34343e" }
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
  water: waterFloorTexture,
  infernal: infernalFloorTexture,
  apocalypse: apocalypseFloorTexture,
  cemetery: cemeteryFloorTexture,
  "medieval-apocalypse": medievalApocalypseFloorTexture,
  "gothic-church": gothicChurchFloorTexture,
  "night-swamp": nightSwampFloorTexture,
  "ruined-gothic-church": ruinedGothicChurchFloorTexture
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
    const repeats = { grass: 14, dirt: 12, metal: 8, concrete: 10, tiles: 8, plastic: 12, fantasy: 7, gas: 5, water: 10, infernal: 7, apocalypse: 8, cemetery: 7, "medieval-apocalypse": 8, "gothic-church": 7, "night-swamp": 7, "ruined-gothic-church": 7 };
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
  if (surface === "infernal") return new THREE.MeshStandardMaterial({
    color: 0xffffff, map, bumpMap: map, bumpScale: 0.075, emissiveMap: map,
    emissive: 0x8a1200, emissiveIntensity: 0.72, roughness: 0.82, metalness: 0.05
  });
  if (surface === "apocalypse") return new THREE.MeshStandardMaterial({ color: 0xffffff, map, bumpMap: map, bumpScale: 0.055, roughness: 0.94, metalness: 0.02 });
  if (surface === "cemetery") return new THREE.MeshStandardMaterial({ color: 0xdbe5df, map, bumpMap: map, bumpScale: 0.065, roughness: 0.98, metalness: 0 });
  if (surface === "medieval-apocalypse") return new THREE.MeshStandardMaterial({ color: 0xffffff, map, bumpMap: map, bumpScale: 0.06, emissiveMap: map, emissive: 0x2b0802, emissiveIntensity: 0.16, roughness: 0.94, metalness: 0.02 });
  if (surface === "gothic-church") return new THREE.MeshPhysicalMaterial({ color: 0xffffff, map, bumpMap: map, bumpScale: 0.035, roughness: 0.34, metalness: 0.06, clearcoat: 0.28, clearcoatRoughness: 0.4 });
  if (surface === "night-swamp") return new THREE.MeshPhysicalMaterial({ color: 0xd7ebe5, map, bumpMap: map, bumpScale: 0.07, roughness: 0.3, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.22 });
  if (surface === "ruined-gothic-church") return new THREE.MeshPhysicalMaterial({ color: 0xe2e5ef, map, bumpMap: map, bumpScale: 0.055, roughness: 0.38, metalness: 0.04, clearcoat: 0.42, clearcoatRoughness: 0.28 });
  if (surface === "plastic") return new THREE.MeshStandardMaterial({ ...settings, map: null, bumpMap: map, bumpScale: 0.018 });
  const relief = ["grass", "dirt", "metal", "concrete", "tiles"].includes(surface);
  const bumpScale = { grass: 0.09, dirt: 0.06, metal: 0.012, concrete: 0.035, tiles: 0.025 }[surface] || 0;
  return new THREE.MeshStandardMaterial({ ...settings, map, bumpMap: relief ? map : null, bumpScale });
}

function createParticleTexture(type) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d");
  if (type === "rain") {
    const gradient = context.createLinearGradient(32, 4, 32, 60);
    gradient.addColorStop(0, "rgba(210,240,255,0)");
    gradient.addColorStop(0.35, "rgba(210,240,255,.9)");
    gradient.addColorStop(1, "rgba(120,190,255,0)");
    context.fillStyle = gradient;
    context.fillRect(29, 3, 6, 58);
  } else if (type === "fire") {
    const gradient = context.createRadialGradient(32, 42, 1, 32, 34, 29);
    gradient.addColorStop(0, "rgba(255,255,210,1)");
    gradient.addColorStop(0.18, "rgba(255,220,45,1)");
    gradient.addColorStop(0.52, "rgba(255,80,5,.9)");
    gradient.addColorStop(1, "rgba(120,0,0,0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(32, 2);
    context.bezierCurveTo(50, 27, 57, 48, 32, 63);
    context.bezierCurveTo(7, 48, 16, 25, 32, 2);
    context.fill();
  } else {
    const blobs = ["fog", "storm"].includes(type) ? [[20, 35, 24], [42, 30, 25], [32, 43, 27]] : [[32, 32, 30]];
    blobs.forEach(([x, y, radius]) => {
      const gradient = context.createRadialGradient(x, y, 1, x, y, radius);
      gradient.addColorStop(0, "rgba(255,255,255,.9)");
      gradient.addColorStop(["fog", "storm"].includes(type) ? 0.42 : 0.22, "rgba(255,255,255,.55)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 64, 64);
    });
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSceneEffectSystem() {
  const group = new THREE.Group();
  group.name = "Efectos de escena";
  group.userData.editorHelper = true;
  const systems = {};
  const createPoints = (type, count, color, size, opacity, additive = false) => {
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      positions[offset] = (Math.random() - 0.5) * 18;
      positions[offset + 1] = type === "rain" ? Math.random() * 12 : type === "fog" ? Math.random() * 3.2 - 0.9 : type === "storm" ? 6.5 + Math.random() * 3.2 : Math.random() * 4;
      positions[offset + 2] = (Math.random() - 0.5) * 18;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    if (type === "fire") geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3).fill(1), 3));
    const material = new THREE.PointsMaterial({
      color: type === "fire" ? 0xffffff : color,
      depthTest: type !== "fog",
      depthWrite: false,
      map: createParticleTexture(type),
      opacity,
      size,
      sizeAttenuation: true,
      transparent: true,
      vertexColors: type === "fire",
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    const points = new THREE.Points(geometry, material);
    points.visible = false;
    points.frustumCulled = false;
    points.renderOrder = type === "fog" ? 20 : 0;
    points.userData.effectType = type;
    group.add(points);
    systems[type] = points;
  };
  createPoints("fog", 220, 0xd6e1eb, 2.8, 0.14);
  createPoints("fire", 380, 0xff5a12, 0.3, 0.9, true);
  createPoints("rain", 1200, 0x9bdcff, 0.16, 0.72);
  createPoints("particles", 260, 0xd875ff, 0.13, 0.85, true);
  createPoints("storm", 110, 0x566174, 4.8, 0.58);
  const fireLights = [
    new THREE.PointLight(0xff4a12, 0, 8, 2),
    new THREE.PointLight(0xff9a24, 0, 7, 2)
  ];
  fireLights[0].position.set(-2.6, 1.2, 1.5);
  fireLights[1].position.set(2.7, 1, -1.8);
  fireLights.forEach((light) => { light.visible = false; group.add(light); });
  const lightningLight = new THREE.PointLight(0xdce8ff, 0, 35, 1.2);
  lightningLight.position.set(0, 9, 0);
  lightningLight.visible = false;
  group.add(lightningLight);
  const lightningGeometry = new THREE.BufferGeometry();
  lightningGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(30), 3));
  const lightningBolt = new THREE.Line(
    lightningGeometry,
    new THREE.LineBasicMaterial({ color: 0xe9f2ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending })
  );
  lightningBolt.visible = false;
  lightningBolt.frustumCulled = false;
  group.add(lightningBolt);
  return { group, systems, fireLights, lightningLight, lightningBolt, nextLightning: 0, lightningUntil: 0 };
}

function animateSceneEffects(scene, effectSystem, settings, delta, time) {
  if (!effectSystem) return;
  const fogIntensity = settings.fog.intensity;
  if (settings.fog.enabled) {
    if (!scene.fog?.isFogExp2) scene.fog = new THREE.FogExp2(settings.fog.color, 0.012 + fogIntensity * 0.045);
    else {
      scene.fog.color.set(settings.fog.color);
      scene.fog.density = (0.012 + fogIntensity * 0.045) * (0.94 + Math.sin(time * 0.00045) * 0.06);
    }
  } else scene.fog = null;
  Object.entries(effectSystem.systems).forEach(([type, points]) => {
    const config = settings[type];
    points.visible = config.enabled;
    if (!config.enabled) return;
    if (type === "fog") points.material.color.set(settings.fog.color);
    if (type === "rain") points.material.color.set(config.color || DEFAULT_SCENE_EFFECTS.rain.color);
    if (type === "particles") points.material.color.set(config.color || DEFAULT_SCENE_EFFECTS.particles.color);
    if (type === "rain") points.geometry.setDrawRange(0, Math.round(points.geometry.attributes.position.count * Math.min(1, 0.28 + config.intensity * 0.5)));
    points.material.opacity = type === "fog" ? 0.06 + config.intensity * 0.2 : 0.35 + config.intensity * 0.6;
    const positions = points.geometry.attributes.position;
    const colors = points.geometry.attributes.color;
    for (let index = 0; index < positions.count; index += 1) {
      let x = positions.getX(index);
      let y = positions.getY(index);
      let z = positions.getZ(index);
      if (type === "fog") {
        x += delta * (0.18 + config.intensity * 0.45);
        z += Math.sin(time * 0.00035 + index) * delta * 0.08;
        if (x > 10) x = -10;
      } else if (type === "fire") {
        y += delta * (0.75 + config.intensity * 2.2);
        x += Math.sin(time * 0.004 + index * 1.7) * delta * 0.35;
        if (y > 4.2) { y = 0.02; x = (Math.random() - 0.5) * 8; z = (Math.random() - 0.5) * 8; }
        const heat = Math.max(0, 1 - y / 4.2);
        colors.setXYZ(index, 1, 0.12 + heat * 0.72, 0.015 + heat * 0.12);
      } else if (type === "rain") {
        y -= delta * (9 + config.intensity * 15);
        x += delta * config.directionX * (5 + config.intensity * 4);
        z += delta * config.directionZ * (5 + config.intensity * 4);
        if (y < 0) { y = 12; x = (Math.random() - 0.5) * 18; z = (Math.random() - 0.5) * 18; }
      } else if (type === "storm") {
        x += delta * (0.22 + config.intensity * 0.35);
        z += Math.sin(time * 0.00022 + index) * delta * 0.12;
        if (x > 12) x = -12;
      } else {
        y += delta * (0.35 + config.intensity * 1.1);
        x += Math.sin(time * 0.002 + index) * delta * 0.22;
        z += Math.cos(time * 0.0017 + index) * delta * 0.18;
        if (y > 6) { y = 0.05; x = (Math.random() - 0.5) * 12; z = (Math.random() - 0.5) * 12; }
      }
      positions.setXYZ(index, x, y, z);
    }
    positions.needsUpdate = true;
    if (colors) colors.needsUpdate = true;
  });
  effectSystem.fireLights.forEach((light, index) => {
    light.visible = settings.fire.enabled;
    light.intensity = settings.fire.enabled
      ? (22 + settings.fire.intensity * 55) * (0.82 + Math.sin(time * 0.014 + index * 2.1) * 0.18)
      : 0;
  });
  const storm = settings.storm;
  if (storm.enabled && time >= effectSystem.nextLightning) {
    const positions = effectSystem.lightningBolt.geometry.attributes.position;
    const originX = (Math.random() - 0.5) * 12;
    const originZ = (Math.random() - 0.5) * 8;
    for (let index = 0; index < positions.count; index += 1) {
      const progress = index / (positions.count - 1);
      positions.setXYZ(index, originX + (Math.random() - 0.5) * progress * 1.4, 10 - progress * 9, originZ + (Math.random() - 0.5) * progress * 1.2);
    }
    positions.needsUpdate = true;
    effectSystem.lightningLight.position.set(originX, 7, originZ);
    effectSystem.lightningUntil = time + 90 + Math.random() * 90;
    effectSystem.nextLightning = time + 900 + Math.random() * (2600 - storm.intensity * 1200);
  }
  const lightningVisible = storm.enabled && time < effectSystem.lightningUntil;
  effectSystem.lightningBolt.visible = lightningVisible;
  effectSystem.lightningLight.visible = lightningVisible;
  effectSystem.lightningLight.intensity = lightningVisible ? 180 + storm.intensity * 420 : 0;
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
  if (type === "plane") return Square;
  if (type === "torus") return CircleDot;
  if (type === "capsule") return Pill;
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
  const animationTimeRef = useRef(0);
  const skyMotionRef = useRef({ enabled: true, speed: 0.35, preset: "solid" });
  const sceneEffectsRef = useRef(DEFAULT_SCENE_EFFECTS);
  const rotationDragRef = useRef(null);
  const cameraOrbitRef = useRef({ lastTheta: null, theta: 0 });
  const cameraNavigationRef = useRef(null);
  const cameraZoomHoldRef = useRef(null);
  const cameraShotRef = useRef(null);
  const viewportRecordingRef = useRef(null);
  const recordingCountdownTimerRef = useRef(null);
  const applyingAnimationRef = useRef(false);
  const environmentIsolationRef = useRef(null);
  const cleanRenderRef = useRef(false);
  const cameraShakeRef = useRef({ enabled: false, intensity: 0.35, speed: 1 });
  const cameraFollowRef = useRef({ enabled: false, strength: 0.85, subject: null, localTarget: new Vector3() });
  const slowMotionRef = useRef({ enabled: false, start: 3, end: 8, speed: 0.25 });
  const autosaveReadyRef = useRef(false);
  const soundtrackAudioRef = useRef(null);
  const soundtrackBufferRef = useRef(null);
  const poseGizmoRef = useRef(null);
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [mode, setMode] = useState("translate");
  const [background, setBackground] = useState(DEFAULT_BACKGROUND);
  const [environmentBackground, setEnvironmentBackground] = useState("solid");
  const [skyMotionEnabled, setSkyMotionEnabled] = useState(true);
  const [skyMotionSpeed, setSkyMotionSpeed] = useState(0.35);
  const [sceneEffects, setSceneEffects] = useState(() => structuredClone(DEFAULT_SCENE_EFFECTS));
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
  const [animationLoop, setAnimationLoop] = useState(false);
  const [cameraShake, setCameraShake] = useState({ enabled: false, intensity: 0.35, speed: 1 });
  const [cameraFollow, setCameraFollow] = useState({ enabled: false, strength: 0.85 });
  const [slowMotion, setSlowMotion] = useState({ enabled: false, start: 3, end: 8, speed: 0.25 });
  const [propertyTab, setPropertyTab] = useState("object");
  const [historyCounts, setHistoryCounts] = useState({ undo: 0, redo: 0 });
  const [hasClipboard, setHasClipboard] = useState(false);
  const [deformAmount, setDeformAmount] = useState(0.25);
  const [sculptBrush, setSculptBrush] = useState("inflate");
  const [sculptRadius, setSculptRadius] = useState(0.65);
  const [sculptStrength, setSculptStrength] = useState(0.3);
  const [scaleLinked, setScaleLinked] = useState(true);
  const [viewportRecording, setViewportRecording] = useState(false);
  const [viewportRecordingBlob, setViewportRecordingBlob] = useState(null);
  const [viewportConverting, setViewportConverting] = useState(false);
  const [recordingCountdown, setRecordingCountdown] = useState(null);
  const [activeCameraShot, setActiveCameraShot] = useState("");
  const [cameraShotSelection, setCameraShotSelection] = useState("general");
  const [libraryTab, setLibraryTab] = useState("objects");
  const [environmentIsolated, setEnvironmentIsolated] = useState(false);
  const [attachmentHand, setAttachmentHand] = useState("LeftHand");
  const [attachmentPrecision, setAttachmentPrecision] = useState(false);
  const [attachmentOwnerPaused, setAttachmentOwnerPaused] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState("Preparando autosave");
  const [soundtrack, setSoundtrack] = useState(null);
  const [poseBone, setPoseBone] = useState("LeftArm");
  const [poseVersion, setPoseVersion] = useState(0);

  useEffect(() => () => {
    if (cameraZoomHoldRef.current) cancelAnimationFrame(cameraZoomHoldRef.current);
    if (cameraShotRef.current?.frame) cancelAnimationFrame(cameraShotRef.current.frame);
    if (recordingCountdownTimerRef.current) clearTimeout(recordingCountdownTimerRef.current);
    const recording = viewportRecordingRef.current;
    if (recording?.recorder && recording.recorder.state !== "inactive") {
      recording.recorder.onstop = null;
      recording.recorder.stop();
    }
    recording?.restoreOutput?.();
    recording?.stream?.getTracks().forEach((track) => track.stop());
  }, []);

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
      locked: Boolean(object.userData.locked),
      color: material?.color ? `#${material.color.getHexString()}` : "#8b5cf6"
    };
  }

  function findEditorObject(id) {
    let match = null;
    runtimeRef.current?.content.traverse((object) => {
      if (!match && object.userData?.editorId === id) match = object;
    });
    return match;
  }

  function findCharacterHand(character, side = "LeftHand") {
    const expected = typeof side === "string" ? side.toLowerCase() : "lefthand";
    let fallback = null;
    let match = null;
    character?.traverse((object) => {
      const normalized = String(object.name || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
      if (!normalized.endsWith(expected)) return;
      if (object.isBone && !match) match = object;
      else fallback ||= object;
    });
    return match || fallback;
  }

  function findRigBone(character, boneId) {
    const expected = String(boneId || "").toLowerCase();
    let match = null;
    character?.traverse((object) => {
      const normalized = String(object.name || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
      if (!match && object.isBone && normalized.endsWith(expected)) match = object;
    });
    return match;
  }

  function updateBonePose(axis, degrees) {
    const character = selectedRef.current;
    const bone = findRigBone(character, poseBone);
    if (!character || !bone || character.userData?.locked) return;
    const offsets = { ...(character.userData.poseOffsets || {}) };
    const current = [...(offsets[bone.name] || [0, 0, 0])];
    current[axis] = THREE.MathUtils.degToRad(Number(degrees));
    offsets[bone.name] = current;
    character.userData.poseOffsets = offsets;
    setPoseVersion((version) => version + 1);
    setStatus(`${POSE_BONES.find((entry) => entry.id === poseBone)?.name || "Hueso"} ajustado`);
  }

  function resetBonePose() {
    const character = selectedRef.current;
    const bone = findRigBone(character, poseBone);
    if (!character || !bone || character.userData?.locked) return;
    pushHistory();
    const offsets = { ...(character.userData.poseOffsets || {}) };
    delete offsets[bone.name];
    character.userData.poseOffsets = offsets;
    setPoseVersion((version) => version + 1);
    setStatus("Ajuste del hueso restablecido");
  }

  function closeBoneGizmo() {
    const runtime = runtimeRef.current;
    const gizmo = poseGizmoRef.current;
    if (!runtime || !gizmo) return;
    runtime.transform.detach();
    runtime.scene.remove(gizmo.proxy);
    poseGizmoRef.current = null;
    setPoseVersion((version) => version + 1);
    if (selectedRef.current && !selectedRef.current.userData?.locked && modeRef.current !== "sculpt") runtime.transform.attach(selectedRef.current);
    setStatus("Manipulador de hueso cerrado");
  }

  function openBoneGizmo() {
    const runtime = runtimeRef.current;
    const character = selectedRef.current;
    const bone = findRigBone(character, poseBone);
    if (!runtime || !character || !bone || character.userData?.locked) return;
    closeBoneGizmo();
    const proxy = new THREE.Object3D();
    proxy.name = `Pose ${bone.name}`;
    bone.getWorldPosition(proxy.position);
    bone.getWorldQuaternion(proxy.quaternion);
    runtime.scene.add(proxy);
    const values = character.userData?.poseOffsets?.[bone.name] || [0, 0, 0];
    poseGizmoRef.current = {
      proxy,
      bone,
      character,
      dragging: false,
      baseWorldQuaternion: proxy.quaternion.clone(),
      baseOffset: new THREE.Quaternion().setFromEuler(new THREE.Euler(...values, "XYZ"))
    };
    setPoseVersion((version) => version + 1);
    setMode("rotate");
    requestAnimationFrame(() => {
      if (poseGizmoRef.current?.proxy !== proxy || !runtimeRef.current) return;
      runtime.transform.setMode("rotate");
      runtime.transform.setSpace("local");
      runtime.transform.setSize(0.82);
      runtime.transform.attach(proxy);
    });
    setStatus(`Rotador activo sobre ${POSE_BONES.find((entry) => entry.id === poseBone)?.name || bone.name}`);
  }

  function toggleEnvironmentIsolation() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    if (!environmentIsolationRef.current) {
      environmentIsolationRef.current = {
        background: runtime.scene.background,
        environment: runtime.scene.environment,
        environmentIntensity: runtime.scene.environmentIntensity,
        floorVisible: runtime.floor.visible,
        effectsVisible: runtime.sceneEffectSystem.group.visible
      };
      runtime.scene.background = new Color("#111318");
      runtime.scene.environment = null;
      runtime.scene.environmentIntensity = 0;
      runtime.floor.visible = false;
      runtime.sceneEffectSystem.group.visible = false;
      setEnvironmentIsolated(true);
      setStatus("Modo personajes activo");
      return;
    }
    const saved = environmentIsolationRef.current;
    runtime.scene.background = saved.background;
    runtime.scene.environment = saved.environment;
    runtime.scene.environmentIntensity = saved.environmentIntensity;
    runtime.floor.visible = saved.floorVisible;
    runtime.sceneEffectSystem.group.visible = saved.effectsVisible;
    environmentIsolationRef.current = null;
    setEnvironmentIsolated(false);
    setStatus("Fondo, piso y efectos restaurados");
  }

  function attachSelectedToHand(targetPoint = attachmentHand) {
    const runtime = runtimeRef.current;
    const object = selectedRef.current;
    if (!runtime || !object || object.isLight) return;
    const validPoints = new Set(["LeftHand", "RightHand", "Spine", "Hips"]);
    const resolvedPoint = validPoints.has(targetPoint) ? targetPoint : attachmentHand;
    const objectWorldPosition = object.getWorldPosition(new Vector3());
    const candidates = runtime.content.children
      .filter((candidate) => candidate !== object && !candidate.userData?.editableAttachment)
      .map((candidate) => ({ candidate, hand: findCharacterHand(candidate, resolvedPoint) }))
      .filter((entry) => entry.hand)
      .sort((left, right) => left.hand.getWorldPosition(new Vector3()).distanceToSquared(objectWorldPosition)
        - right.hand.getWorldPosition(new Vector3()).distanceToSquared(objectWorldPosition));
    const target = candidates[0];
    if (!target) {
      const targetLabel = { LeftHand: "mano izquierda", RightHand: "mano derecha", Spine: "centro/ombligo", Hips: "cadera" }[resolvedPoint];
      setStatus(`No encontre un personaje con el punto ${targetLabel}`);
      return;
    }
    pushHistory();
    target.hand.attach(object);
    object.position.set(0, 0, 0);
    object.userData.editableAttachment = true;
    object.userData.attachmentBone = target.hand.name;
    object.userData.attachmentOwner = target.candidate.userData.editorId;
    refreshObjects();
    selectObject(object);
    setMode("translate");
    const targetLabel = { LeftHand: "mano izquierda", RightHand: "mano derecha", Spine: "centro/ombligo", Hips: "cadera" }[resolvedPoint];
    setStatus(`Objeto vinculado a ${targetLabel}`);
  }

  function detachSelectedFromHand() {
    const runtime = runtimeRef.current;
    const object = selectedRef.current;
    if (!runtime || !object?.userData?.editableAttachment) return;
    pushHistory();
    runtime.content.attach(object);
    delete object.userData.editableAttachment;
    delete object.userData.attachmentBone;
    delete object.userData.attachmentOwner;
    refreshObjects();
    selectObject(object);
    setStatus("Objeto desvinculado de la mano");
  }

  function setAttachmentTransformMode(nextMode) {
    const runtime = runtimeRef.current;
    const object = selectedRef.current;
    if (!runtime || !object || object.userData?.locked) return;
    setMode(nextMode);
    runtime.transform.enabled = true;
    runtime.transform.setMode(nextMode);
    runtime.transform.setSpace(object.userData?.editableAttachment ? "local" : "world");
    runtime.transform.setSize(object.userData?.editableAttachment ? 1.2 : 1);
    runtime.transform.attach(object);
    setStatus(nextMode === "rotate"
      ? "Arrastra los aros de color para rotar"
      : nextMode === "scale" ? "Arrastra los controles para escalar" : "Arrastra las flechas para mover");
  }

  function toggleAttachmentPrecision() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const enabled = !attachmentPrecision;
    runtime.transform.setTranslationSnap(enabled ? 0.05 : null);
    runtime.transform.setRotationSnap(enabled ? THREE.MathUtils.degToRad(15) : null);
    runtime.transform.setScaleSnap(enabled ? 0.05 : null);
    setAttachmentPrecision(enabled);
    setStatus(enabled ? "Ajuste preciso activo: rotacion cada 15 grados" : "Ajuste libre activo");
  }

  function toggleAttachmentOwnerAnimation() {
    const object = selectedRef.current;
    const ownerId = object?.userData?.attachmentOwner;
    const entry = runtimeRef.current?.mixers.get(ownerId);
    const owner = findEditorObject(ownerId);
    if (!entry || !owner?.userData?.modelAnimation) {
      setStatus("Este personaje no tiene una animacion controlable");
      return;
    }
    const paused = !entry.active.paused;
    entry.active.paused = paused;
    owner.userData.modelAnimation.playing = !paused;
    setAttachmentOwnerPaused(paused);
    setStatus(paused ? "Personaje pausado para acomodar el accesorio" : "Animacion del personaje reanudada");
  }

  function centerAttachmentOnAnchor() {
    const object = selectedRef.current;
    if (!object?.userData?.editableAttachment) return;
    pushHistory();
    object.position.set(0, 0, 0);
    syncSelection(object);
    setStatus("Accesorio centrado en el punto de anclaje");
  }

  function straightenAttachment() {
    const object = selectedRef.current;
    if (!object?.userData?.editableAttachment) return;
    pushHistory();
    object.rotation.set(0, 0, 0);
    object.userData.animationRotation = [0, 0, 0];
    syncSelection(object);
    setStatus("Rotacion local restablecida");
  }

  function saveAttachmentPose() {
    const object = selectedRef.current;
    if (!object?.userData?.editableAttachment) return;
    object.userData.savedAttachmentTransform = {
      position: object.position.toArray(),
      quaternion: object.quaternion.toArray(),
      scale: object.scale.toArray()
    };
    syncSelection(object);
    setStatus("Pose de guitarra guardada");
  }

  function restoreAttachmentPose() {
    const object = selectedRef.current;
    const saved = object?.userData?.savedAttachmentTransform;
    if (!object?.userData?.editableAttachment || !saved) return;
    pushHistory();
    object.position.fromArray(saved.position);
    object.quaternion.fromArray(saved.quaternion);
    object.scale.fromArray(saved.scale);
    object.userData.animationRotation = [object.rotation.x, object.rotation.y, object.rotation.z];
    syncSelection(object);
    setStatus("Pose de guitarra restaurada");
  }

  function refreshObjects() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    syncLightMarkers();
    const editable = [...runtime.content.children];
    runtime.content.traverse((object) => {
      if (object.userData?.editableAttachment && !editable.includes(object)) editable.push(object);
    });
    setObjects(editable.map(objectSummary));
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
      locked: Boolean(object.userData.locked),
      lightColor: object.isLight ? `#${object.color.getHexString()}` : "#ffffff",
      intensity: object.isLight ? round(object.intensity) : 1,
      distance: object.isPointLight || object.isSpotLight ? round(object.distance) : 0,
      angle: object.isSpotLight ? round(THREE.MathUtils.radToDeg(object.angle)) : 30,
      lightLink: object.isLight ? { targetId: "", follow: true, aim: true, offset: [0, 3, 2], ...(object.userData.lightLink || {}) } : null,
      textureName: object.userData.textureName || "",
      textureRepeat: material?.map ? [round(material.map.repeat.x), round(material.map.repeat.y)] : [1, 1],
      spin: {
        enabled: Boolean(object.userData.spin?.enabled),
        axis: object.userData.spin?.axis || "y",
        speed: object.userData.spin?.speed ?? 30
      },
      modelAnimation: object.userData.modelAnimation ? { ...object.userData.modelAnimation } : null
    });
  }

  function registerModelAnimations(object, clips = object?.animations || []) {
    const runtime = runtimeRef.current;
    if (!runtime || !object?.userData?.editorId || !clips.length) return;
    runtime.mixers.get(object.userData.editorId)?.mixer.stopAllAction();
    const mixer = new THREE.AnimationMixer(object);
    const actions = new Map(clips.map((clip) => [clip.name || "Animacion", mixer.clipAction(clip)]));
    const saved = object.userData.modelAnimation || {};
    const activeName = actions.has(saved.clip) ? saved.clip : actions.keys().next().value;
    const active = actions.get(activeName);
    const playing = saved.playing !== false;
    const speed = saved.speed ?? 1;
    active.reset().play();
    active.paused = !playing;
    mixer.timeScale = speed;
    object.animations = clips;
    object.userData.modelAnimation = { clip: activeName, clips: [...actions.keys()], playing, speed };
    runtime.mixers.set(object.userData.editorId, { mixer, actions, active });
  }

  function selectObject(object, additive = false) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    if (poseGizmoRef.current && object !== selectedRef.current) closeBoneGizmo();
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
      object = next.has(object.userData.editorId) ? object : [...next].map(findEditorObject).find(Boolean) || null;
    } else {
      selectedIdsRef.current = new Set(object ? [object.userData.editorId] : []);
      setSelectedIds(object ? [object.userData.editorId] : []);
    }
    selectedRef.current = object || null;
    setSelectedId(object?.userData.editorId || "");
    if (object && !object.userData?.locked && modeRef.current !== "sculpt") {
      runtime.transform.setSpace(object.userData?.editableAttachment ? "local" : "world");
      runtime.transform.setSize(object.userData?.editableAttachment ? 1.2 : 1);
      runtime.transform.attach(object);
    } else runtime.transform.detach();
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
      skyMotionEnabled,
      skyMotionSpeed,
      sceneEffects,
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
      animationLoop,
      cameraShake,
      cameraFollow,
      slowMotion,
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
    runtime.mixers.forEach(({ mixer }) => mixer.stopAllAction());
    runtime.mixers.clear();
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
    loaded.children.slice().forEach((child) => {
      runtime.content.add(child);
      registerModelAnimations(child);
    });
    runtime.camera.position.fromArray(state.camera?.position || [7, 5, 8]);
    runtime.orbit.target.fromArray(state.camera?.target || [0, 1, 0]);
    runtime.orbit.update();
    const loadedOrbit = new THREE.Spherical().setFromVector3(runtime.camera.position.clone().sub(runtime.orbit.target));
    cameraOrbitRef.current = { lastTheta: loadedOrbit.theta, theta: loadedOrbit.theta };
    setBackground(state.background || DEFAULT_BACKGROUND);
    setEnvironmentBackground(state.environmentBackground || "solid");
    setSkyMotionEnabled(state.skyMotionEnabled !== false);
    setSkyMotionSpeed(state.skyMotionSpeed ?? 0.35);
    setSceneEffects(Object.fromEntries(Object.entries(DEFAULT_SCENE_EFFECTS).map(([key, defaults]) => [key, { ...defaults, ...state.sceneEffects?.[key] }])));
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
    setAnimationLoop(Boolean(state.animationLoop));
    const restoredCameraShake = { enabled: false, intensity: 0.35, speed: 1, ...(state.cameraShake || {}) };
    cameraShakeRef.current = restoredCameraShake;
    setCameraShake(restoredCameraShake);
    const restoredCameraFollow = { enabled: false, strength: 0.85, ...(state.cameraFollow || {}) };
    cameraFollowRef.current = { ...cameraFollowRef.current, ...restoredCameraFollow, subject: null };
    setCameraFollow(restoredCameraFollow);
    const restoredSlowMotion = { enabled: false, start: 3, end: 8, speed: 0.25, ...(state.slowMotion || {}) };
    slowMotionRef.current = restoredSlowMotion;
    setSlowMotion(restoredSlowMotion);
    animationTimeRef.current = 0;
    setAnimationTime(0);
    setAnimationPlaying(false);
    refreshObjects();
    setPropertyTab(state.editor?.propertyTab || "object");
    setDeformAmount(state.editor?.deformAmount ?? 0.25);
    setSculptBrush(state.editor?.sculptBrush || "inflate");
    setSculptRadius(state.editor?.sculptRadius ?? 0.65);
    setSculptStrength(state.editor?.sculptStrength ?? 0.3);
    setMode(state.editor?.mode || "translate");
    const restoredSelection = findEditorObject(state.editor?.selectedId);
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
    const sceneEffectSystem = createSceneEffectSystem();
    scene.add(sceneEffectSystem.group);

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
    transform.addEventListener("dragging-changed", (event) => {
      orbit.enabled = !event.value;
      if (poseGizmoRef.current) poseGizmoRef.current.dragging = event.value;
    });
    transform.addEventListener("mouseDown", () => {
      pushHistory();
      const object = selectedRef.current;
      if (!object || modeRef.current !== "rotate") return;
      const current = [object.rotation.x, object.rotation.y, object.rotation.z];
      const accumulated = object.userData.animationRotation || current;
      rotationDragRef.current = { object, last: current, accumulated: [...accumulated] };
    });
    transform.addEventListener("objectChange", () => {
      const poseGizmo = poseGizmoRef.current;
      if (poseGizmo && transform.object === poseGizmo.proxy) {
        const delta = poseGizmo.baseWorldQuaternion.clone().invert().multiply(poseGizmo.proxy.quaternion);
        const offset = poseGizmo.baseOffset.clone().multiply(delta);
        const euler = new THREE.Euler().setFromQuaternion(offset, "XYZ");
        poseGizmo.character.userData.poseOffsets = {
          ...(poseGizmo.character.userData.poseOffsets || {}),
          [poseGizmo.bone.name]: [euler.x, euler.y, euler.z]
        };
        return;
      }
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
      const poseGizmo = poseGizmoRef.current;
      if (poseGizmo && transform.object === poseGizmo.proxy) {
        const values = poseGizmo.character.userData?.poseOffsets?.[poseGizmo.bone.name] || [0, 0, 0];
        poseGizmo.baseWorldQuaternion.copy(poseGizmo.proxy.quaternion);
        poseGizmo.baseOffset.setFromEuler(new THREE.Euler(...values, "XYZ"));
        setPoseVersion((version) => version + 1);
        setStatus("Pose del hueso ajustada");
      }
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
      cameraNavigationRef.current = { x: event.clientX, y: event.clientY, canvas: true };
      setPointerRay(event);
      const markers = [...(runtimeRef.current?.lightMarkers?.values() || [])];
      const hits = raycaster.intersectObjects([...content.children, ...markers], true);
      let object = hits[0]?.object || null;
      let marker = object;
      while (marker && !marker.userData?.editorLightId && marker.parent) marker = marker.parent;
      if (marker?.userData?.editorLightId) {
        object = content.children.find((item) => item.userData.editorId === marker.userData.editorLightId) || null;
      }
      while (object?.parent && object.parent !== content && !object.userData?.editorId) object = object.parent;
      selectObject(object?.userData?.editorId ? object : null, event.shiftKey);
    };
    const onPointerMove = (event) => {
      const navigationStart = cameraNavigationRef.current;
      if (navigationStart?.canvas && !transform.dragging && Math.hypot(event.clientX - navigationStart.x, event.clientY - navigationStart.y) > 5) {
        releaseCameraForManualNavigation();
        cameraNavigationRef.current = null;
      }
      if (modeRef.current !== "sculpt") return;
      const hit = sculptHit(event);
      brushCursor.visible = Boolean(hit);
      if (!hit) return;
      brushCursor.position.copy(hit.point);
      brushCursor.scale.setScalar(sculptSettingsRef.current.radius);
      if (sculptingRef.current) applySculptStroke(hit);
    };
    const onPointerUp = (event) => {
      if (cameraNavigationRef.current?.canvas) cameraNavigationRef.current = null;
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
      if (cameraNavigationRef.current?.canvas) cameraNavigationRef.current = null;
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

    const runtime = { scene, camera, renderer, content, ambient, floor, grid, keyLight, orbit, transform, transformHelper, brushCursor, sceneEffectSystem, lightHelper: null, lightMarkers: new Map(), mixers: new Map(), poseApplications: new Map(), backgroundTexture: null, baseEnvironment: environmentTexture };
    runtimeRef.current = runtime;
    let frame = 0;
    let previousRenderTime = 0;
    const cameraPositionBeforeShake = new Vector3();
    const cameraQuaternionBeforeShake = new THREE.Quaternion();
    const cameraFollowBounds = new Box3();
    const cameraFollowTarget = new Vector3();
    const cameraFollowQuaternion = new THREE.Quaternion();
    const linkedLightBounds = new Box3();
    const linkedLightTarget = new Vector3();
    const linkedLightPosition = new Vector3();
    const linkedLightOffset = new Vector3();
    const render = (time = 0) => {
      frame = requestAnimationFrame(render);
      orbit.update();
      const delta = previousRenderTime ? Math.min((time - previousRenderTime) / 1000, 0.05) : 0;
      previousRenderTime = time;
      runtime.poseApplications.forEach(({ bone, rotation }) => bone.quaternion.multiply(rotation.clone().invert()));
      runtime.poseApplications.clear();
      const slow = slowMotionRef.current;
      const slowActive = slow.enabled && animationTimeRef.current >= slow.start && animationTimeRef.current <= slow.end;
      runtimeRef.current?.mixers?.forEach(({ mixer }) => mixer.update(delta * (slowActive ? slow.speed : 1)));
      content.children.forEach((character) => {
        Object.entries(character.userData?.poseOffsets || {}).forEach(([boneName, values]) => {
          const bone = character.getObjectByName(boneName) || findRigBone(character, boneName);
          if (!bone) return;
          const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(...values, "XYZ"));
          bone.quaternion.multiply(rotation);
          runtime.poseApplications.set(bone.uuid, { bone, rotation });
        });
      });
      const poseGizmo = poseGizmoRef.current;
      if (poseGizmo && !poseGizmo.dragging) {
        poseGizmo.bone.getWorldPosition(poseGizmo.proxy.position);
        poseGizmo.bone.getWorldQuaternion(poseGizmo.proxy.quaternion);
        poseGizmo.baseWorldQuaternion.copy(poseGizmo.proxy.quaternion);
        const values = poseGizmo.character.userData?.poseOffsets?.[poseGizmo.bone.name] || [0, 0, 0];
        poseGizmo.baseOffset.setFromEuler(new THREE.Euler(...values, "XYZ"));
      }
      animateSceneEffects(scene, sceneEffectSystem, sceneEffectsRef.current, delta, time);
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
      } else if (floorTexture && activeFloor.userData.surface === "infernal") {
        floorTexture.offset.set((time * 0.000005) % 1, (time * 0.0000025) % 1);
      } else if (floorTexture && activeFloor.userData.surface === "apocalypse") {
        floorTexture.offset.set((time * 0.0000012) % 1, (time * 0.0000006) % 1);
      } else if (floorTexture && activeFloor.userData.surface === "cemetery") {
        floorTexture.offset.set((time * 0.0000018) % 1, (time * 0.0000028) % 1);
      } else if (floorTexture && activeFloor.userData.surface === "medieval-apocalypse") {
        floorTexture.offset.set((time * 0.0000016) % 1, (time * 0.0000007) % 1);
      } else if (floorTexture && activeFloor.userData.surface === "gothic-church") {
        floorTexture.offset.set((time * 0.00000008) % 1, 0);
      } else if (floorTexture && activeFloor.userData.surface === "night-swamp") {
        floorTexture.offset.set((time * 0.0000028) % 1, (time * 0.0000019) % 1);
      } else if (floorTexture && activeFloor.userData.surface === "ruined-gothic-church") {
        floorTexture.offset.set((time * 0.00000012) % 1, (time * 0.00000004) % 1);
      }
      const skyTexture = runtimeRef.current?.backgroundTexture;
      const skyMotion = skyMotionRef.current;
      if (skyTexture && skyMotion.enabled && skyMotion.preset.startsWith("sky-")) {
        const presetRate = { "sky-clouds": 1, "sky-space": 0.4, "sky-sun": 0.65, "sky-night": 0.5, "sky-day": 0.8, "sky-sunset": 0.7, "sky-infernal": 0.82, "sky-apocalypse": 0.56, "sky-cemetery": 0.42, "sky-medieval-apocalypse": 0.5, "sky-gothic-church": 0.025, "sky-night-swamp": 0.36, "sky-ruined-gothic-church": 0.08, "sky-castle-interior": 0, "sky-castle-courtyard": 0.035, "sky-medieval-village": 0.025, "sky-moonlit-peaks": 0.12, "sky-spiderweb-ruins": 0.07 }[skyMotion.preset] ?? 0.7;
        const rotationStep = delta * skyMotion.speed * presetRate * 0.6;
        scene.backgroundRotation.y = (scene.backgroundRotation.y + rotationStep) % (Math.PI * 2);
        scene.environmentRotation.y = scene.backgroundRotation.y;
      }
      runtimeRef.current?.lightMarkers?.forEach((marker, id) => {
        const light = content.children.find((item) => item.userData.editorId === id);
        if (!light) return;
        marker.position.copy(light.position);
        marker.material.color.copy(light.color);
      });
      content.children.forEach((light) => {
        const link = light.isLight ? light.userData.lightLink : null;
        if (!link?.targetId) return;
        const target = findEditorObject(link.targetId);
        if (!target || target === light) return;
        linkedLightBounds.setFromObject(target).getCenter(linkedLightTarget);
        if (link.follow) {
          linkedLightOffset.fromArray(link.offset || [0, 3, 2]);
          linkedLightPosition.copy(linkedLightTarget).add(linkedLightOffset);
          light.position.copy(content.worldToLocal(linkedLightPosition));
        }
        if (link.aim && (light.isSpotLight || light.isDirectionalLight)) {
          light.target.position.copy(linkedLightTarget);
          light.target.updateMatrixWorld(true);
        }
        if (selectedRef.current === light) runtime.lightHelper?.update?.();
      });
      if (cleanRenderRef.current) {
        transformHelper.visible = false;
        if (runtime.lightHelper) runtime.lightHelper.visible = false;
        runtime.lightMarkers.forEach((marker) => { marker.visible = false; });
      }
      const shake = cameraShakeRef.current;
      cameraPositionBeforeShake.copy(camera.position);
      cameraQuaternionBeforeShake.copy(camera.quaternion);
      const follow = cameraFollowRef.current;
      const followSubject = selectedRef.current;
      if (follow.enabled && followSubject && !followSubject.isLight) {
        if (follow.subject !== followSubject) {
          cameraFollowBounds.setFromObject(followSubject).getCenter(cameraFollowTarget);
          follow.localTarget.copy(followSubject.worldToLocal(cameraFollowTarget));
          follow.subject = followSubject;
        }
        cameraFollowTarget.copy(follow.localTarget);
        followSubject.localToWorld(cameraFollowTarget);
        camera.lookAt(cameraFollowTarget);
        cameraFollowQuaternion.copy(camera.quaternion);
        camera.quaternion.copy(cameraQuaternionBeforeShake).slerp(cameraFollowQuaternion, follow.strength);
      }
      if (shake.enabled && shake.intensity > 0) {
        const phase = time * 0.001 * Math.max(shake.speed, 0.1);
        const amount = shake.intensity;
        camera.translateX((Math.sin(phase * 7.1) + Math.sin(phase * 13.7) * 0.45) * amount * 0.018);
        camera.translateY((Math.sin(phase * 8.9 + 1.7) + Math.sin(phase * 17.3) * 0.35) * amount * 0.012);
        camera.rotateZ(Math.sin(phase * 5.3 + 0.8) * amount * 0.004);
        camera.rotateX(Math.sin(phase * 6.7 + 2.1) * amount * 0.0025);
      }
      renderer.render(scene, camera);
      camera.position.copy(cameraPositionBeforeShake);
      camera.quaternion.copy(cameraQuaternionBeforeShake);
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
      runtimeRef.current?.mixers?.forEach(({ mixer }) => mixer.stopAllAction());
      Object.values(sceneEffectSystem.systems).forEach((points) => {
        points.geometry.dispose();
        points.material.map?.dispose?.();
        points.material.dispose();
      });
      sceneEffectSystem.lightningBolt.geometry.dispose();
      sceneEffectSystem.lightningBolt.material.dispose();
      scene.remove(sceneEffectSystem.group);
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
      runtime.transform.setSpace(selectedRef.current?.userData?.editableAttachment ? "local" : "world");
      runtime.transform.setSize(selectedRef.current?.userData?.editableAttachment ? 1.2 : 1);
      if (selectedRef.current && !selectedRef.current.userData?.locked) runtime.transform.attach(selectedRef.current);
      else runtime.transform.detach();
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
    skyMotionRef.current = { enabled: skyMotionEnabled, speed: skyMotionSpeed, preset: environmentBackground };
  }, [environmentBackground, skyMotionEnabled, skyMotionSpeed]);

  useEffect(() => {
    sceneEffectsRef.current = sceneEffects;
  }, [sceneEffects]);

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
        const transition = after.transition || "linear";
        const cameraAlpha = transition === "cut"
          ? (alpha >= 1 ? 1 : 0)
          : transition === "cinematic"
            ? alpha * alpha * alpha * (alpha * (alpha * 6 - 15) + 10)
            : transition === "smooth"
              ? alpha * alpha * (3 - 2 * alpha)
              : alpha;
        const target = new Vector3().fromArray(before.target).lerp(new Vector3().fromArray(after.target), cameraAlpha);
        runtime.orbit.target.copy(target);
        if (before.orbit && after.orbit) {
          const radius = THREE.MathUtils.lerp(before.orbit.radius, after.orbit.radius, cameraAlpha);
          const phi = THREE.MathUtils.lerp(before.orbit.phi, after.orbit.phi, cameraAlpha);
          const thetaDelta = before.continuousOrbit && after.continuousOrbit
            ? after.orbit.theta - before.orbit.theta
            : Math.atan2(Math.sin(after.orbit.theta - before.orbit.theta), Math.cos(after.orbit.theta - before.orbit.theta));
          const theta = before.orbit.theta + thetaDelta * cameraAlpha;
          runtime.camera.position.copy(target).add(new Vector3().setFromSpherical(new THREE.Spherical(radius, phi, theta)));
          if (before.up && after.up) runtime.camera.up.fromArray(before.up).lerp(new Vector3().fromArray(after.up), cameraAlpha).normalize();
          runtime.camera.fov = THREE.MathUtils.lerp(before.fov ?? 45, after.fov ?? 45, cameraAlpha);
          runtime.camera.updateProjectionMatrix();
          cameraOrbitRef.current.theta = theta;
          cameraOrbitRef.current.lastTheta = new THREE.Spherical().setFromVector3(runtime.camera.position.clone().sub(target)).theta;
        } else {
          runtime.camera.position.fromArray(before.position).lerp(new Vector3().fromArray(after.position), cameraAlpha);
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
    animationTimeRef.current = next;
    setAnimationTime(next);
    applyAnimationAt(next);
    if (soundtrackAudioRef.current) soundtrackAudioRef.current.currentTime = Math.min(next, soundtrackAudioRef.current.duration || next);
  }

  async function importSoundtrack(file) {
    if (!file) return;
    try {
      setStatus("Analizando ritmo...");
      const data = await file.arrayBuffer();
      const context = new AudioContext();
      const buffer = await context.decodeAudioData(data.slice(0));
      await context.close();
      const samples = buffer.getChannelData(0);
      const sampleRate = buffer.sampleRate;
      const windowSize = Math.max(512, Math.floor(sampleRate * 0.045));
      const energies = [];
      for (let offset = 0; offset < samples.length; offset += windowSize) {
        let energy = 0;
        const end = Math.min(samples.length, offset + windowSize);
        for (let index = offset; index < end; index += 4) energy += samples[index] * samples[index];
        energies.push(energy / Math.max(1, Math.ceil((end - offset) / 4)));
      }
      const candidates = [];
      for (let index = 8; index < energies.length - 1; index += 1) {
        const local = energies.slice(Math.max(0, index - 8), index).reduce((sum, value) => sum + value, 0) / 8;
        if (energies[index] > local * 1.55 && energies[index] > energies[index - 1] && energies[index] >= energies[index + 1]) {
          candidates.push({ time: (index * windowSize) / sampleRate, strength: energies[index] / Math.max(local, 0.000001) });
        }
      }
      const beats = [];
      candidates.forEach((beat) => {
        const previous = beats.at(-1);
        if (!previous || beat.time - previous.time >= 0.32) beats.push(beat);
        else if (beat.strength > previous.strength) beats[beats.length - 1] = beat;
      });
      if (soundtrack?.url) URL.revokeObjectURL(soundtrack.url);
      const url = URL.createObjectURL(file);
      soundtrackBufferRef.current = buffer;
      setSoundtrack({ name: file.name, url, duration: buffer.duration, beats });
      setAnimationDuration(Math.max(1, Math.min(60, Math.ceil(buffer.duration))));
      animationTimeRef.current = 0;
      setAnimationTime(0);
      setStatus(`${beats.length} golpes detectados en ${file.name}`);
    } catch (error) {
      console.error(error);
      setStatus("No se pudo analizar el audio");
    }
  }

  function removeSoundtrack() {
    soundtrackAudioRef.current?.pause();
    if (soundtrack?.url) URL.revokeObjectURL(soundtrack.url);
    soundtrackBufferRef.current = null;
    setSoundtrack(null);
    setStatus("Audio eliminado de la linea de tiempo");
  }

  function createBeatDirection(preset = "rock", transition = "cut") {
    const runtime = runtimeRef.current;
    const subject = selectedRef.current;
    if (!runtime || !subject || subject.isLight || !soundtrack?.beats.length) {
      setStatus("Selecciona un personaje y carga una cancion con beats");
      return;
    }
    const byId = Object.fromEntries(CAMERA_SHOTS.map((shot) => [shot.id, shot]));
    const styles = {
      rock: [byId.general, byId["three-quarter-left"], byId.medium, byId.profile, byId.hero, byId.close],
      "hard-rock": [byId["low-angle"], byId.dutch, byId.close, byId.profile, byId.hero, byId["three-quarter-right"]],
      metal: [byId.dutch, byId["low-angle"], byId.close, byId["high-angle"], byId.profile, byId.hero]
    };
    const shots = styles[preset] || styles.rock;
    const duration = Math.min(60, soundtrack.duration);
    const beatTimes = soundtrack.beats
      .filter((beat) => beat.time <= duration)
      .reduce((times, beat) => (!times.length || beat.time - times.at(-1) >= 0.55 ? [...times, beat.time] : times), [])
      .slice(0, 30);
    const times = [...new Set([0, ...beatTimes, duration].map((time) => round(time)))];
    const frames = times.map((time, index) => {
      const source = shots[index % shots.length];
      const variation = index % 2 ? -1 : 1;
      const shot = { ...source, angle: (source.angle || 0) + variation * ((index * 17) % 24) };
      const pose = calculateCameraShotPose(shot, subject);
      const spherical = new THREE.Spherical().setFromVector3(pose.position.clone().sub(pose.target));
      return { id: makeId(), time, position: pose.position.toArray(), target: pose.target.toArray(), orbit: { radius: spherical.radius, phi: spherical.phi, theta: spherical.theta }, continuousOrbit: false, up: pose.up.toArray(), fov: pose.fov, transition };
    });
    setAnimationPlaying(false);
    setAnimationDuration(duration);
    setAnimationTracks((current) => ({ ...current, [CAMERA_TRACK_ID]: frames }));
    seekAnimation(0);
    setStatus(`Director al ritmo creado: ${frames.length} tomas ${preset}`);
  }

  useEffect(() => {
    const audio = soundtrackAudioRef.current;
    if (!audio) return;
    if (!animationPlaying) {
      audio.pause();
      return;
    }
    audio.currentTime = Math.min(animationTime, audio.duration || animationTime);
    audio.play().catch(() => {});
  }, [animationPlaying, soundtrack?.url]);

  useEffect(() => () => {
    if (soundtrack?.url) URL.revokeObjectURL(soundtrack.url);
  }, [soundtrack?.url]);

  useEffect(() => {
    if (!animationPlaying) return undefined;
    let frame;
    let previous = performance.now();
    const tick = (now) => {
      const delta = (now - previous) / 1000;
      previous = now;
      const shouldLoop = animationLoop && !animationExporting;
      const next = shouldLoop
        ? (animationTimeRef.current + delta) % animationDuration
        : Math.min(animationTimeRef.current + delta, animationDuration);
      animationTimeRef.current = next;
      applyAnimationAt(next);
      setAnimationTime(next);
      if (!shouldLoop && next >= animationDuration) {
        setAnimationPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animationPlaying, animationDuration, animationTracks, animationLoop, animationExporting]);

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
  }, [background, environmentBackground, skyMotionEnabled, skyMotionSpeed, sceneEffects, gridVisible, ambientIntensity, exposure, floorVisible, floorColor, floorSurface, renderResolution, transparentPng, animationDuration, animationTracks, animationLoop, cameraShake, cameraFollow, slowMotion, mode, propertyTab, deformAmount, sculptBrush, sculptRadius, sculptStrength, selectedId]);

  useEffect(() => {
    if (!active || autosaveReadyRef.current || !runtimeRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const saved = await getProject(THREE_AUTOSAVE_ID);
        if (cancelled) return;
        if (saved?.content) {
          historyRef.current.restoring = true;
          loadSceneState(saved);
          historyRef.current.restoring = false;
          historyRef.current.undo = [];
          historyRef.current.redo = [];
          setHistoryCounts({ undo: 0, redo: 0 });
          setStatus("Ultimo borrador recuperado");
          const savedTime = saved.autosavedAt ? new Date(saved.autosavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
          setAutosaveStatus(savedTime ? `Recuperado ${savedTime}` : "Borrador recuperado");
        } else setAutosaveStatus("Autosave activo");
      } catch (error) {
        console.error(error);
        setAutosaveStatus("Autosave no disponible");
      } finally {
        if (!cancelled) autosaveReadyRef.current = true;
      }
    })();
    return () => { cancelled = true; };
  }, [active]);

  useEffect(() => {
    if (!active || !autosaveReadyRef.current || viewportRecording || animationExporting) return undefined;
    setAutosaveStatus("Cambios pendientes");
    const timer = setTimeout(async () => {
      const state = serializeScene();
      if (!state) return;
      try {
        setAutosaveStatus("Guardando...");
        const autosavedAt = new Date().toISOString();
        await putProject(THREE_AUTOSAVE_ID, { ...state, autosavedAt });
        const savedTime = new Date(autosavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setAutosaveStatus(`Guardado ${savedTime}`);
      } catch (error) {
        console.error(error);
        setAutosaveStatus("Error de autosave");
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [active, objects, selection, background, environmentBackground, skyMotionEnabled, skyMotionSpeed, sceneEffects, gridVisible, ambientIntensity, exposure, floorVisible, floorColor, floorSurface, renderResolution, transparentPng, animationDuration, animationTracks, mode, propertyTab, deformAmount, sculptBrush, sculptRadius, sculptStrength, viewportRecording, animationExporting]);

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
      cone: () => new THREE.ConeGeometry(1.2, 2.5, 48, 18),
      plane: () => new THREE.PlaneGeometry(3.2, 3.2, 24, 24),
      torus: () => new THREE.TorusGeometry(1.15, 0.36, 24, 64),
      capsule: () => new THREE.CapsuleGeometry(0.72, 1.5, 12, 32)
    };
    const labels = { box: "Cubo", sphere: "Esfera", cylinder: "Cilindro", cone: "Cono", plane: "Plano", torus: "Toroide", capsule: "Capsula" };
    const object = new THREE.Mesh(
      geometries[type](),
      new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.1, roughness: 0.4, side: type === "plane" ? THREE.DoubleSide : THREE.FrontSide })
    );
    object.name = `${labels[type]} ${objects.length + 1}`;
    object.position.set((((objects.length + 1) % 3) - 1) * 2.8, type === "plane" ? 0.02 : 1.25, 0);
    if (type === "plane") object.rotation.x = -Math.PI / 2;
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

  function updateLightLink(patch) {
    const runtime = runtimeRef.current;
    const light = selectedRef.current;
    if (!runtime || !light?.isLight) return;
    pushHistory();
    const current = { targetId: "", follow: true, aim: true, offset: [0, 3, 2], ...(light.userData.lightLink || {}) };
    const next = { ...current, ...patch };
    if (patch.targetId) {
      const target = findEditorObject(patch.targetId);
      if (target) {
        const lightWorld = light.getWorldPosition(new Vector3());
        const targetCenter = new Box3().setFromObject(target).getCenter(new Vector3());
        next.offset = lightWorld.sub(targetCenter).toArray().map(round);
      }
    }
    light.userData.lightLink = next;
    syncSelection(light);
    setStatus(next.targetId ? "Luz vinculada al objetivo" : "Vinculo de luz eliminado");
  }

  function updateLightLinkOffset(index, value) {
    const light = selectedRef.current;
    if (!light?.isLight) return;
    const link = { targetId: "", follow: true, aim: true, offset: [0, 3, 2], ...(light.userData.lightLink || {}) };
    link.offset = [...link.offset];
    link.offset[index] = Number(value) || 0;
    light.userData.lightLink = link;
    syncSelection(light);
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
    const matchingScene = THEMED_SCENES.find((scenePreset) => scenePreset.sky === preset.id);
    setEnvironmentBackground(preset.id);
    setFloorSurface(matchingScene?.floor || "shadow");
    setFloorVisible(true);
    setAmbientIntensity(preset.ambient);
    setExposure(preset.exposure);
    runtime.keyLight.intensity = preset.key;
    runtime.keyLight.color.set(preset.light);
    runtime.ambient.color.set(preset.light);
    runtime.ambient.groundColor.set(preset.ground);
    setStatus(`Cielo ${preset.name} aplicado`);
  }

  function applyThemedScene(scenePreset) {
    const skyPreset = SKY_BACKGROUNDS.find((preset) => preset.id === scenePreset.sky);
    if (!skyPreset || !runtimeRef.current) return;
    pushHistory();
    setEnvironmentBackground(skyPreset.id);
    setFloorSurface(scenePreset.floor);
    setFloorVisible(true);
    setSkyMotionEnabled(true);
    setAmbientIntensity(skyPreset.ambient);
    setExposure(skyPreset.exposure);
    runtimeRef.current.keyLight.intensity = skyPreset.key;
    runtimeRef.current.keyLight.color.set(skyPreset.light);
  runtimeRef.current.ambient.color.set(skyPreset.light);
  runtimeRef.current.ambient.groundColor.set(skyPreset.ground);

  const themedEffects = {
    "medieval-apocalypse": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.34, color: "#6b4038" },
      fire: { ...DEFAULT_SCENE_EFFECTS.fire, enabled: true, intensity: 0.62 },
      particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.55 },
    },
    "gothic-church": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.18, color: "#75849a" },
      particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.18 },
    },
    "night-swamp": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.58, color: "#41665f" },
      particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.72 },
    },
    "ruined-gothic-church": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.3, color: "#59637d" },
      particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.42 },
      storm: { ...DEFAULT_SCENE_EFFECTS.storm, enabled: true, intensity: 0.45 },
    },
    "castle-interior": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.1, color: "#8a6b52" },
      fire: { ...DEFAULT_SCENE_EFFECTS.fire, enabled: true, intensity: 0.34 },
      particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.28, color: "#ffd08a" },
    },
    "castle-courtyard": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.12, color: "#9aa69e" },
      particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.2, color: "#e6c98d" },
    },
    "medieval-village": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.22, color: "#7f8583" },
      rain: { ...DEFAULT_SCENE_EFFECTS.rain, enabled: true, intensity: 0.38, directionX: 0.16, directionZ: 0.04, color: "#b9d7e4" },
      particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.12, color: "#d5bf96" },
    },
    "moonlit-peaks": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.48, color: "#65758a" },
      rain: { ...DEFAULT_SCENE_EFFECTS.rain, enabled: true, intensity: 0.82, directionX: 0.3, directionZ: -0.08, color: "#b7d8f4" },
      particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.16, color: "#d3e5ff" },
      storm: { ...DEFAULT_SCENE_EFFECTS.storm, enabled: true, intensity: 0.38 },
    },
    "spiderweb-ruins": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.5, color: "#647180" },
      particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.58, color: "#d9e8f2" },
      storm: { ...DEFAULT_SCENE_EFFECTS.storm, enabled: true, intensity: 0.22 },
    },
  };

  if (themedEffects[scenePreset.id]) {
    setSceneEffects(themedEffects[scenePreset.id]);
  }
  setStatus(`Escenario ${scenePreset.name} aplicado`);
}

  function setCameraView(view) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    releaseCameraForManualNavigation();
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
    setActiveCameraShot("");
  }

  function calculateCameraShotPose(shot, subject) {
    const runtime = runtimeRef.current;
    if (!runtime || !subject) return null;
    const bounds = new Box3().setFromObject(subject);
    if (bounds.isEmpty()) return null;

    const size = bounds.getSize(new Vector3());
    const subjectHeight = Math.max(size.y, 0.01);
    const framedHeight = Math.max(subjectHeight * (1 - shot.crop), 0.25);
    const target = bounds.getCenter(new Vector3());
    target.y = bounds.min.y + subjectHeight * (shot.crop + (1 - shot.crop) / 2);

    const direction = runtime.camera.position.clone().sub(runtime.orbit.target);
    if (Number.isFinite(shot.angle)) {
      const subjectRotation = subject.getWorldQuaternion(new THREE.Quaternion());
      direction.set(0, 0, 1).applyQuaternion(subjectRotation);
      direction.y = 0;
      if (direction.lengthSq() < 0.0001) direction.set(0, 0, 1);
      direction.normalize().applyAxisAngle(new Vector3(0, 1, 0), THREE.MathUtils.degToRad(shot.angle));
      direction.y = Math.tan(THREE.MathUtils.degToRad(shot.elevation || 0));
    }
    direction.normalize();

    const verticalFov = THREE.MathUtils.degToRad(shot.fov);
    const verticalDistance = (framedHeight / shot.fill / 2) / Math.tan(verticalFov / 2);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(runtime.camera.aspect, 0.1));
    const horizontalDistance = (Math.max(size.x, 0.25) / 0.9 / 2) / Math.tan(horizontalFov / 2);
    const distance = Math.max(verticalDistance, horizontalDistance, 0.35);
    const position = target.clone().add(direction.multiplyScalar(distance));
    const up = new Vector3(0, 1, 0).applyAxisAngle(direction, THREE.MathUtils.degToRad(shot.roll || 0));
    return { fov: shot.fov, position, target, up };
  }

  function applyCameraShot(shot) {
    const runtime = runtimeRef.current;
    if (!runtime || !shot) return;
    const subject = selectedRef.current && !selectedRef.current.isLight ? selectedRef.current : runtime.content;
    const pose = calculateCameraShotPose(shot, subject);
    if (!pose) {
      setStatus("Selecciona un objeto para aplicar el plano");
      return;
    }

    if (cameraShotRef.current?.frame) cancelAnimationFrame(cameraShotRef.current.frame);
    const startPosition = runtime.camera.position.clone();
    const startTarget = runtime.orbit.target.clone();
    const startUp = runtime.camera.up.clone();
    const startFov = runtime.camera.fov;
    const startedAt = performance.now();
    const duration = 900;
    runtime.orbit.enabled = false;
    setActiveCameraShot(shot.id);
    setStatus(`Aplicando plano ${shot.name.toLowerCase()}`);

    const animate = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      runtime.camera.position.lerpVectors(startPosition, pose.position, eased);
      runtime.orbit.target.lerpVectors(startTarget, pose.target, eased);
      runtime.camera.up.lerpVectors(startUp, pose.up, eased).normalize();
      runtime.camera.fov = THREE.MathUtils.lerp(startFov, pose.fov, eased);
      runtime.camera.updateProjectionMatrix();
      runtime.camera.lookAt(runtime.orbit.target);

      if (progress < 1) {
        cameraShotRef.current.frame = requestAnimationFrame(animate);
        return;
      }
      runtime.orbit.enabled = true;
      runtime.orbit.update();
      const spherical = new THREE.Spherical().setFromVector3(runtime.camera.position.clone().sub(runtime.orbit.target));
      cameraOrbitRef.current = { lastTheta: spherical.theta, theta: spherical.theta };
      cameraShotRef.current = null;
      setStatus(`Plano ${shot.name.toLowerCase()} listo`);
    };

    cameraShotRef.current = { frame: requestAnimationFrame(animate) };
  }

  function createAutomaticDirection(preset = "hollywood", transition = "cinematic") {
    const runtime = runtimeRef.current;
    const subject = selectedRef.current;
    if (!runtime || !subject || subject.isLight) {
      setStatus("Selecciona un personaje u objeto para crear la direccion");
      return;
    }
    const byId = Object.fromEntries(CAMERA_SHOTS.map((shot) => [shot.id, shot]));
    const presets = {
      hollywood: {
        name: "Hollywood", duration: 14, shots: [
          { ...byId.general, angle: 0, elevation: 4 },
          { ...byId.full, angle: 18, elevation: 3 },
          byId["three-quarter-right"],
          { ...byId.medium, angle: -12, elevation: 2 },
          { ...byId.profile, angle: -88, elevation: 1 },
          { ...byId.close, angle: 32, elevation: 5 },
          byId.hero,
          { ...byId["three-quarter-left"], crop: 0.55, fov: 33 },
          { ...byId.close, angle: -28, elevation: 3, fov: 29 },
          { ...byId.american, angle: 0, elevation: -4, fov: 36 }
        ]
      },
      dialogue: {
        name: "Dialogo", duration: 12, shots: [
          { ...byId.general, angle: 0, elevation: 4 },
          { ...byId.medium, angle: -30, elevation: 3 },
          { ...byId.close, angle: -24, elevation: 4 },
          { ...byId.medium, angle: 30, elevation: 3 },
          { ...byId.close, angle: 24, elevation: 4 },
          { ...byId["three-quarter-left"], angle: 42, elevation: 2 },
          { ...byId["three-quarter-right"], angle: -42, elevation: 2 },
          { ...byId.close, angle: 0, elevation: 2, fov: 30 },
          { ...byId.american, angle: 0, elevation: 3 }
        ]
      },
      action: {
        name: "Accion", duration: 10, shots: [
          { ...byId.general, angle: 25, elevation: 10, fov: 48 },
          byId.hero,
          byId["low-angle"],
          { ...byId.profile, angle: -82, elevation: 0 },
          byId.dutch,
          { ...byId.american, angle: 55, elevation: -5, fov: 34 },
          { ...byId.profile, angle: 88, elevation: 2, fov: 32 },
          { ...byId["high-angle"], angle: -35, elevation: 24 },
          { ...byId.close, angle: -20, elevation: -6 },
          { ...byId.hero, angle: 0, elevation: -12, fov: 31 }
        ]
      },
      suspense: {
        name: "Suspenso", duration: 16, shots: [
          { ...byId.general, angle: 68, elevation: 8 },
          { ...byId.full, angle: 58, elevation: 7, fov: 40 },
          { ...byId.american, angle: 48, elevation: 5 },
          { ...byId.medium, angle: 28, elevation: 4 },
          { ...byId.profile, angle: 88, elevation: 2, fov: 32 },
          { ...byId.close, angle: 12, elevation: 5, fov: 29 },
          { ...byId.dutch, angle: -18, roll: -9, crop: 0.72, fov: 27 },
          { ...byId.close, angle: -38, elevation: 1, fov: 26 },
          { ...byId["high-angle"], angle: 20, elevation: 22, fov: 34 },
          { ...byId.dutch, angle: 8, roll: 7, crop: 0.76, fov: 25 }
        ]
      },
      orbit: {
        name: "Orbita", duration: 14, shots: [0, 40, 80, 120, 160, 200, 240, 280, 320, 360].map((angle, index) => ({
          ...byId.american,
          angle,
          elevation: index < 5 ? 5 + index * 2 : 13 - (index - 5) * 2,
          fov: index === 0 || index === 9 ? 38 : 35
        }))
      },
      matrix: {
        name: "Matrix", duration: 12, shots: [
          { ...byId.general, angle: 0, elevation: 5, fov: 45, time: 0 },
          { ...byId.general, angle: 0, elevation: 5, fov: 45, time: 1.4 },
          { ...byId.american, angle: 8, elevation: 3, fov: 38, time: 3.2 },
          { ...byId.medium, angle: 24, elevation: 2, fov: 33, time: 5.2 },
          { ...byId.close, angle: 48, elevation: 1, crop: 0.76, fov: 27, time: 7.1 },
          { ...byId.close, angle: 55, elevation: 3, crop: 0.78, fov: 26, time: 8 },
          { ...byId.medium, angle: 24, elevation: 3, fov: 34, time: 9.8 },
          { ...byId.general, angle: 0, elevation: 5, fov: 45, time: 12 }
        ]
      },
      "rail-lateral": {
        name: "Travelling lateral", duration: 10, shots: [-1.5, -1, -0.5, 0, 0.5, 1, 1.5].map((railOffset) => ({
          ...byId.american,
          angle: 0,
          elevation: 3,
          fov: 37,
          railOffset
        }))
      },
      "rail-arc": {
        name: "Arco", duration: 11, shots: [-62, -42, -22, 0, 22, 42, 62].map((angle, index) => ({
          ...byId.american,
          angle,
          elevation: 2 + Math.sin((index / 6) * Math.PI) * 5,
          fov: 36
        }))
      },
      rock: {
        name: "Rock", duration: 14, shots: [
          { ...byId.general, angle: 0, elevation: 6, fov: 46 },
          { ...byId.full, angle: -24, elevation: 2, fov: 40 },
          { ...byId.american, angle: 32, elevation: 1, fov: 36 },
          { ...byId.profile, angle: -86, elevation: 2, fov: 37 },
          { ...byId.medium, angle: 18, elevation: -4, fov: 34 },
          { ...byId.close, angle: -28, elevation: 3, fov: 30 },
          { ...byId["three-quarter-left"], angle: 45, elevation: 5 },
          { ...byId.hero, angle: -18, elevation: -10, fov: 31 },
          { ...byId.profile, angle: 88, elevation: 0, fov: 35 },
          { ...byId.general, angle: 0, elevation: 8, fov: 43 }
        ]
      },
      "hard-rock": {
        name: "Hard Rock", duration: 12, shots: [
          { ...byId.general, angle: 30, elevation: 12, fov: 49 },
          { ...byId["low-angle"], angle: -22, elevation: -24, fov: 32 },
          { ...byId.dutch, angle: 38, elevation: -5, roll: -14, fov: 34 },
          { ...byId.close, angle: -42, elevation: 0, fov: 28 },
          { ...byId.profile, angle: 90, elevation: -7, fov: 33 },
          { ...byId.american, angle: -58, elevation: -10, fov: 34 },
          { ...byId.dutch, angle: -28, elevation: 8, roll: 12, fov: 30 },
          { ...byId.hero, angle: 24, elevation: -16, fov: 29 },
          { ...byId.close, angle: 12, elevation: -8, crop: 0.74, fov: 27 },
          { ...byId.full, angle: -36, elevation: 4, fov: 38 },
          { ...byId["low-angle"], angle: 0, elevation: -26, fov: 31 }
        ]
      },
      metal: {
        name: "Metal", duration: 13, shots: [
          { ...byId.dutch, angle: -55, elevation: 16, roll: 16, fov: 42 },
          { ...byId["low-angle"], angle: 18, elevation: -30, fov: 30 },
          { ...byId.close, angle: 48, elevation: -12, crop: 0.76, fov: 25 },
          { ...byId.profile, angle: -92, elevation: -4, fov: 31 },
          { ...byId["high-angle"], angle: 35, elevation: 34, fov: 36 },
          { ...byId.dutch, angle: 12, elevation: -18, roll: -18, fov: 27 },
          { ...byId.american, angle: 72, elevation: -8, fov: 32 },
          { ...byId.close, angle: -58, elevation: 7, crop: 0.78, fov: 24 },
          { ...byId.profile, angle: 94, elevation: 8, fov: 29 },
          { ...byId.hero, angle: -34, elevation: -22, fov: 27 },
          { ...byId.dutch, angle: 44, elevation: 4, roll: 14, crop: 0.62, fov: 28 },
          { ...byId.general, angle: 0, elevation: 10, fov: 45 }
        ]
      }
    };
    const direction = presets[preset] || presets.hollywood;
    const sequence = direction.shots;
    const duration = direction.duration;
    const subjectSize = new Box3().setFromObject(subject).getSize(new Vector3());
    const railUnit = Math.max(subjectSize.x, subjectSize.y * 0.45, 1);
    const frames = sequence.map((shot, index) => {
      const pose = calculateCameraShotPose(shot, subject);
      if (shot.railOffset) {
        const backward = pose.position.clone().sub(pose.target).normalize();
        const right = new Vector3().crossVectors(pose.up, backward).normalize();
        pose.position.addScaledVector(right, shot.railOffset * railUnit);
      }
      const spherical = new THREE.Spherical().setFromVector3(pose.position.clone().sub(pose.target));
      return {
        id: makeId(),
        time: round(shot.time ?? (duration * index) / (sequence.length - 1)),
        position: pose.position.toArray(),
        target: pose.target.toArray(),
        orbit: { radius: spherical.radius, phi: spherical.phi, theta: spherical.theta },
        continuousOrbit: false,
        up: pose.up.toArray(),
        fov: pose.fov,
        transition
      };
    });
    const first = frames[0];
    runtime.camera.position.fromArray(first.position);
    runtime.orbit.target.fromArray(first.target);
    runtime.camera.up.fromArray(first.up);
    runtime.camera.fov = first.fov;
    runtime.camera.updateProjectionMatrix();
    runtime.orbit.update();
    cameraOrbitRef.current = { lastTheta: first.orbit.theta, theta: first.orbit.theta };
    setAnimationPlaying(false);
    setAnimationDuration(duration);
    animationTimeRef.current = 0;
    setAnimationTime(0);
    setAnimationTracks((current) => ({ ...current, [CAMERA_TRACK_ID]: frames }));
    if (preset === "matrix") {
      const matrixSlowMotion = { enabled: true, start: 3.2, end: 9.8, speed: 0.25 };
      slowMotionRef.current = matrixSlowMotion;
      setSlowMotion(matrixSlowMotion);
    }
    setStatus(`Direccion ${direction.name} en reproduccion`);
    setTimeout(() => setAnimationPlaying(true), 0);
  }

  function orbitCamera(deltaX, deltaY) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    releaseCameraForManualNavigation();
    const viewportHeight = Math.max(runtime.renderer.domElement.clientHeight, 1);
    const rotationScale = (Math.PI * 2 * runtime.orbit.rotateSpeed) / viewportHeight;
    runtime.orbit._rotateLeft(deltaX * rotationScale);
    runtime.orbit._rotateUp(deltaY * rotationScale);
    runtime.orbit.update();
    setActiveCameraShot("");
  }

  function zoomCamera(factor) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    releaseCameraForManualNavigation();
    if (factor < 1) runtime.orbit.dollyIn(factor);
    else runtime.orbit.dollyOut(1 / factor);
    setActiveCameraShot("");
  }

  function releaseCameraForManualNavigation() {
    const runtime = runtimeRef.current;
    setAnimationPlaying(false);
    if (cameraShotRef.current?.frame) cancelAnimationFrame(cameraShotRef.current.frame);
    cameraShotRef.current = null;
    stopContinuousZoom();
    if (runtime) {
      runtime.orbit.enabled = true;
      runtime.transform.dragging = false;
    }
    if (!cameraFollowRef.current.enabled) return;
    const next = { enabled: false, strength: cameraFollowRef.current.strength };
    cameraFollowRef.current = { ...cameraFollowRef.current, ...next };
    setCameraFollow(next);
  }

  function stopContinuousZoom() {
    if (cameraZoomHoldRef.current) cancelAnimationFrame(cameraZoomHoldRef.current);
    cameraZoomHoldRef.current = null;
  }

  function startContinuousZoom(event, direction) {
    event.currentTarget.setPointerCapture(event.pointerId);
    stopContinuousZoom();
    const step = () => {
      zoomCamera(direction === "in" ? 0.99 : 1 / 0.99);
      cameraZoomHoldRef.current = requestAnimationFrame(step);
    };
    step();
  }

  function startCameraNavigation(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    cameraNavigationRef.current = { x: event.clientX, y: event.clientY };
  }

  function moveCameraNavigation(event) {
    const previous = cameraNavigationRef.current;
    if (!previous) return;
    orbitCamera(event.clientX - previous.x, event.clientY - previous.y);
    cameraNavigationRef.current = { x: event.clientX, y: event.clientY };
  }

  function stopCameraNavigation() {
    cameraNavigationRef.current = null;
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

  function updateAnimationMarker(kind, markerId, patch) {
    const trackId = kind === "camera" ? CAMERA_TRACK_ID : selectedRef.current?.userData.editorId;
    if (!trackId) return;
    const nextPatch = { ...patch };
    if (Object.hasOwn(nextPatch, "time")) nextPatch.time = round(THREE.MathUtils.clamp(Number(nextPatch.time), 0, animationDuration));
    setAnimationTracks((current) => ({
      ...current,
      [trackId]: (current[trackId] || [])
        .map((frame) => frame.id === markerId ? { ...frame, ...nextPatch } : frame)
        .sort((a, b) => a.time - b.time)
    }));
    if (Object.hasOwn(nextPatch, "time")) seekAnimation(nextPatch.time);
    setStatus(kind === "camera" ? "Toma actualizada" : "Keyframe actualizado");
  }

  function duplicateAnimationMarker(kind, markerId) {
    const trackId = kind === "camera" ? CAMERA_TRACK_ID : selectedRef.current?.userData.editorId;
    if (!trackId) return;
    setAnimationTracks((current) => {
      const source = (current[trackId] || []).find((frame) => frame.id === markerId);
      if (!source) return current;
      const copyTime = source.time + 0.25 <= animationDuration ? source.time + 0.25 : Math.max(0, source.time - 0.25);
      const copy = { ...source, id: makeId(), time: round(copyTime) };
      return { ...current, [trackId]: [...(current[trackId] || []), copy].sort((a, b) => a.time - b.time) };
    });
    setStatus(kind === "camera" ? "Toma duplicada" : "Keyframe duplicado");
  }

  function prepareRenderOutput({ clean = false, transparent = false } = {}) {
    const runtime = runtimeRef.current;
    const [width, height] = renderResolution.split("x").map(Number);
    const previousSize = runtime.renderer.getSize(new THREE.Vector2());
    const previousPixelRatio = runtime.renderer.getPixelRatio();
    const previousAspect = runtime.camera.aspect;
    const previousBackground = runtime.scene.background;
    const floorWasVisible = runtime.floor.visible;
    const gridWasVisible = runtime.grid.visible;
    const transformWasVisible = runtime.transformHelper.visible;
    const transformWasEnabled = runtime.transform.enabled;
    const cleanRenderWasActive = cleanRenderRef.current;
    const lightHelperWasVisible = runtime.lightHelper?.visible;
    const markerVisibility = [...runtime.lightMarkers.values()].map((marker) => [marker, marker.visible]);
    runtime.renderer.setPixelRatio(1);
    runtime.renderer.setSize(width, height, false);
    runtime.camera.aspect = width / height;
    runtime.camera.updateProjectionMatrix();
    if (clean) {
      cleanRenderRef.current = true;
      runtime.transform.enabled = false;
      runtime.grid.visible = false;
      runtime.transformHelper.visible = false;
      if (runtime.lightHelper) runtime.lightHelper.visible = false;
      markerVisibility.forEach(([marker]) => { marker.visible = false; });
    }
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
      runtime.grid.visible = gridWasVisible;
      runtime.transform.enabled = transformWasEnabled;
      runtime.transformHelper.visible = transformWasVisible;
      cleanRenderRef.current = cleanRenderWasActive;
      if (runtime.lightHelper) runtime.lightHelper.visible = lightHelperWasVisible;
      markerVisibility.forEach(([marker, visible]) => { marker.visible = visible; });
    };
  }

  async function convertToH264(blob, fileName) {
    const body = new FormData();
    body.append("video", blob, "studio-3d-source.webm");
    const response = await fetch(`${API}/api/three/export-h264`, { method: "POST", body });
    if (!response.ok) {
      const details = await response.json().catch(() => null);
      throw new Error(details?.error || "No se pudo codificar el video H.264");
    }
    downloadBlob(await response.blob(), fileName);
  }

  async function exportAnimation(format = "h264") {
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

    const mimeCandidates = soundtrackBufferRef.current
      ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
      : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
    const mimeType = mimeCandidates
      .find((type) => MediaRecorder.isTypeSupported(type));
    if (!mimeType) {
      setStatus("No hay un codificador WebM disponible");
      return;
    }

    setAnimationExporting(true);
    setAnimationPlaying(false);
    seekAnimation(0);
    const restoreOutput = prepareRenderOutput({ clean: true });

    try {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const stream = runtime.renderer.domElement.captureStream(animationFps);
      let exportAudioContext = null;
      let exportAudioSource = null;
      if (soundtrackBufferRef.current) {
        exportAudioContext = new AudioContext();
        const destination = exportAudioContext.createMediaStreamDestination();
        exportAudioSource = exportAudioContext.createBufferSource();
        exportAudioSource.buffer = soundtrackBufferRef.current;
        exportAudioSource.connect(destination);
        destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
      }
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
      exportAudioSource?.stop();
      await exportAudioContext?.close();
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks, { type: mimeType });
      if (format === "h264") {
        setStatus("Codificando MP4 H.264 en alta calidad...");
        await convertToH264(blob, "studio-3d-animation-h264.mp4");
        setStatus("Animacion MP4 H.264 exportada");
      } else {
        downloadBlob(blob, "studio-3d-animation.webm");
        setStatus("Animacion WebM exportada");
      }
    } catch (error) {
      console.error(error);
      setStatus("No se pudo exportar la animacion");
    } finally {
      restoreOutput();
      setAnimationExporting(false);
      seekAnimation(0);
    }
  }

  function removeSelected() {
    const runtime = runtimeRef.current;
    const object = selectedRef.current;
    if (!runtime || !object) return;
    if (object.userData?.locked) {
      setStatus("Desbloquea el objeto antes de eliminarlo");
      return;
    }
    pushHistory();
    runtime.mixers.get(object.userData.editorId)?.mixer.stopAllAction();
    runtime.mixers.delete(object.userData.editorId);
    object.parent?.remove(object);
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

  function updateSceneEffect(effect, key, value) {
    setSceneEffects((current) => ({
      ...current,
      [effect]: { ...current[effect], [key]: value }
    }));
  }

  function applyEffectsPreset(preset) {
    pushHistory();
    const presets = {
      infernal: {
        fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.38, color: "#6b3330" },
        fire: { enabled: true, intensity: 0.9 },
        rain: { ...DEFAULT_SCENE_EFFECTS.rain, enabled: false }, particles: { enabled: true, intensity: 0.72 },
        storm: { enabled: false, intensity: 0.6 }
      },
      storm: {
        fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.62, color: "#687887" },
        fire: { enabled: false, intensity: 0.6 },
        rain: { ...DEFAULT_SCENE_EFFECTS.rain, enabled: true, intensity: 1.45, directionX: 0.38 },
        particles: { enabled: false, intensity: 0.5 }, storm: { enabled: true, intensity: 0.8 }
      },
      mystic: {
        fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.45, color: "#74598f" },
        fire: { enabled: false, intensity: 0.6 },
        rain: { ...DEFAULT_SCENE_EFFECTS.rain, enabled: false }, particles: { enabled: true, intensity: 0.9 },
        storm: { enabled: false, intensity: 0.6 }
      },
      downpour: {
        fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.7, color: "#536575" },
        fire: { enabled: false, intensity: 0.6 },
        rain: { ...DEFAULT_SCENE_EFFECTS.rain, enabled: true, intensity: 1.8, directionX: 0.9, directionZ: 0.35, color: "#a9dcff" },
        particles: { enabled: false, intensity: 0.5 },
        storm: { enabled: true, intensity: 1 }
      },
      acidRain: {
        fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.58, color: "#426b32" },
        fire: { enabled: false, intensity: 0.6 },
        rain: { ...DEFAULT_SCENE_EFFECTS.rain, enabled: true, intensity: 1.35, directionX: 0.42, directionZ: -0.22, color: "#78ff32" },
        particles: { enabled: true, intensity: 0.62 },
        storm: { enabled: true, intensity: 0.52 }
      },
      spectralEclipse: {
        fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.72, color: "#382958" },
        fire: { enabled: true, intensity: 0.28 },
        rain: { ...DEFAULT_SCENE_EFFECTS.rain, enabled: false },
        particles: { enabled: true, intensity: 1 },
        storm: { enabled: true, intensity: 0.7 }
      },
      castleInterior: {
        fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.1, color: "#8a6b52" },
        fire: { enabled: true, intensity: 0.34 },
        rain: { ...DEFAULT_SCENE_EFFECTS.rain, enabled: false },
        particles: { enabled: true, intensity: 0.28, color: "#ffd08a" },
        storm: { enabled: false, intensity: 0.6 }
      },
      castleCourtyard: {
        fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.12, color: "#9aa69e" },
        fire: { enabled: false, intensity: 0.6 },
        rain: { ...DEFAULT_SCENE_EFFECTS.rain, enabled: false },
        particles: { enabled: true, intensity: 0.2, color: "#e6c98d" },
        storm: { enabled: false, intensity: 0.6 }
      },
      medievalVillage: {
        fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.22, color: "#7f8583" },
        fire: { enabled: false, intensity: 0.6 },
        rain: { ...DEFAULT_SCENE_EFFECTS.rain, enabled: true, intensity: 0.38, directionX: 0.16, directionZ: 0.04, color: "#b9d7e4" },
        particles: { enabled: true, intensity: 0.12, color: "#d5bf96" },
        storm: { enabled: false, intensity: 0.6 }
      },
      moonlitPeaks: {
        fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.48, color: "#65758a" },
        fire: { enabled: false, intensity: 0.6 },
        rain: { ...DEFAULT_SCENE_EFFECTS.rain, enabled: true, intensity: 0.82, directionX: 0.3, directionZ: -0.08, color: "#b7d8f4" },
        particles: { enabled: true, intensity: 0.16, color: "#d3e5ff" },
        storm: { enabled: true, intensity: 0.38 }
      },
      spiderwebRuins: {
        fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.5, color: "#647180" },
        fire: { enabled: false, intensity: 0.6 },
        rain: { ...DEFAULT_SCENE_EFFECTS.rain, enabled: false },
        particles: { enabled: true, intensity: 0.58, color: "#d9e8f2" },
        storm: { enabled: true, intensity: 0.22 }
      },
      clear: structuredClone(DEFAULT_SCENE_EFFECTS)
    };
    setSceneEffects(presets[preset]);
    const names = { castleInterior: "Interior del castillo", castleCourtyard: "Patio medieval", medievalVillage: "Aldea humeda", moonlitPeaks: "Cumbres luna llena", spiderwebRuins: "Ruinas de telaranas" };
    setStatus(`Efectos ${names[preset] || preset} aplicados`);
  }

  function toggleModelAnimation() {
    const object = selectedRef.current;
    const entry = runtimeRef.current?.mixers.get(object?.userData.editorId);
    if (!object?.userData.modelAnimation || !entry) return;
    const playing = !object.userData.modelAnimation.playing;
    entry.active.paused = !playing;
    object.userData.modelAnimation.playing = playing;
    syncSelection(object);
  }

  function setModelAnimationSpeed(speed) {
    const object = selectedRef.current;
    const entry = runtimeRef.current?.mixers.get(object?.userData.editorId);
    if (!object?.userData.modelAnimation || !entry) return;
    entry.mixer.timeScale = Number(speed);
    object.userData.modelAnimation.speed = Number(speed);
    syncSelection(object);
  }

  function selectModelAnimation(clipName) {
    const object = selectedRef.current;
    const entry = runtimeRef.current?.mixers.get(object?.userData.editorId);
    const next = entry?.actions.get(clipName);
    if (!object?.userData.modelAnimation || !entry || !next) return;
    entry.active.stop();
    entry.active = next;
    next.reset().play();
    next.paused = !object.userData.modelAnimation.playing;
    object.userData.modelAnimation.clip = clipName;
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
    const object = findEditorObject(id);
    if (!object) return;
    pushHistory();
    object.visible = !object.visible;
    if (!object.visible && selectedRef.current === object) selectObject(null);
    refreshObjects();
  }

  function toggleObjectLock(id) {
    const runtime = runtimeRef.current;
    const object = findEditorObject(id);
    if (!runtime || !object) return;
    pushHistory();
    object.userData.locked = !object.userData.locked;
    if (selectedRef.current === object) {
      if (object.userData.locked) runtime.transform.detach();
      else if (modeRef.current !== "sculpt") runtime.transform.attach(object);
      syncSelection(object);
    }
    refreshObjects();
    setStatus(object.userData.locked ? `${object.name} bloqueado` : `${object.name} desbloqueado`);
  }

  function centerSelected() {
    const object = selectedRef.current;
    if (!object || object.userData?.locked) return;
    pushHistory();
    object.position.x = 0;
    object.position.z = 0;
    syncSelection(object);
  }

  function mirrorSelected() {
    const object = selectedRef.current;
    if (!object || object.isLight || object.userData?.locked) return;
    pushHistory();
    object.scale.x *= -1;
    object.userData.mirrored = object.scale.x < 0;
    const objectId = object.userData.editorId;
    setAnimationTracks((current) => {
      if (!current[objectId]?.length) return current;
      return {
        ...current,
        [objectId]: current[objectId].map((frame) => ({
          ...frame,
          scale: [-frame.scale[0], frame.scale[1], frame.scale[2]]
        }))
      };
    });
    object.updateWorldMatrix(true, true);
    syncSelection(object);
    setStatus(object.userData.mirrored ? `${object.name} espejado` : `Espejado quitado de ${object.name}`);
  }

  function placeOnFloor() {
    const object = selectedRef.current;
    if (!object || object.isLight || object.userData?.locked) return;
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
    if (!object || object.userData?.locked) return;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    const axes = ["x", "y", "z"];
    const axis = axes[index];
    if (group === "rotation") {
      object.rotation[axis] = THREE.MathUtils.degToRad(numeric);
      const continuous = object.userData.animationRotation || [object.rotation.x, object.rotation.y, object.rotation.z];
      continuous[index] = THREE.MathUtils.degToRad(numeric);
      object.userData.animationRotation = continuous;
    } else if (group === "scale" && scaleLinked) {
      const previous = object.scale[axis];
      if (Math.abs(previous) > 0.000001) {
        object.scale.multiplyScalar(numeric / previous);
      } else {
        object.scale.setScalar(numeric);
      }
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
      placeObjectInFreeSpot(group, runtimeRef.current.content);
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

  function placeObjectInFreeSpot(object, content) {
    object.updateWorldMatrix(true, true);
    const bounds = new Box3().setFromObject(object);
    if (bounds.isEmpty()) return;
    const size = bounds.getSize(new Vector3());
    const step = Math.max(size.x, size.z, 1.5) + 0.75;
    const margin = 0.35;
    const occupied = content.children
      .filter((item) => item !== object && item.visible && !item.isLight)
      .map((item) => new Box3().setFromObject(item))
      .filter((itemBounds) => !itemBounds.isEmpty());
    const origin = object.position.clone();

    for (let radius = 0; radius <= 12; radius += 1) {
      for (let gridZ = -radius; gridZ <= radius; gridZ += 1) {
        for (let gridX = -radius; gridX <= radius; gridX += 1) {
          if (radius && Math.max(Math.abs(gridX), Math.abs(gridZ)) !== radius) continue;
          const offsetX = gridX * step;
          const offsetZ = gridZ * step;
          const candidate = bounds.clone().translate(new Vector3(offsetX, 0, offsetZ));
          const overlaps = occupied.some((itemBounds) => !(
            candidate.max.x + margin < itemBounds.min.x
            || candidate.min.x - margin > itemBounds.max.x
            || candidate.max.z + margin < itemBounds.min.z
            || candidate.min.z - margin > itemBounds.max.z
          ));
          if (overlaps) continue;
          object.position.set(origin.x + offsetX, origin.y, origin.z + offsetZ);
          object.updateWorldMatrix(true, true);
          return;
        }
      }
    }
  }

  async function importModel(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const isHeavyModel = file.size > 80 * 1024 * 1024;
    let url = "";
    try {
      if (isHeavyModel) {
        runtime.renderer.setPixelRatio(1);
        setStatus(`Preparando modelo pesado (${Math.round(file.size / 1024 / 1024)} MB)...`);
        await new Promise((resolve) => requestAnimationFrame(resolve));
      } else {
        setStatus("Importando modelo...");
      }
      url = URL.createObjectURL(file);
      const gltf = await new GLTFLoader().loadAsync(url);
      pushHistory();
      const model = gltf.scene;
      model.name = file.name.replace(/\.(glb|gltf)$/i, "");
      model.userData = { ...model.userData, editorId: makeId(), editorType: "model" };
      model.animations = gltf.animations;
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
      placeObjectInFreeSpot(model, runtimeRef.current.content);
      registerModelAnimations(model, gltf.animations);
      refreshObjects();
      selectObject(model);
      focusSelected();
      setStatus(`${file.name} importado`);
    } catch (error) {
      console.error(error);
      setStatus(isHeavyModel ? "No hay memoria suficiente para importar este GLB" : "No se pudo importar el modelo");
    } finally {
      if (url) URL.revokeObjectURL(url);
      event.target.value = "";
    }
  }

  async function addNeonboy(modelPreset = CHARACTER_MODELS[0]) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    try {
      setStatus(`Cargando ${modelPreset.name}...`);
      const modelUrl = modelPreset.url || await modelPreset.loadUrl();
      const gltf = await new GLTFLoader().loadAsync(modelUrl);
      pushHistory();
      const model = gltf.scene;
      model.name = modelPreset.name;
      model.userData = { ...model.userData, editorId: makeId(), editorType: "model", bundledModel: modelPreset.id };
      model.animations = gltf.animations;
      model.traverse((item) => {
        if (item.isMesh) { item.castShadow = true; item.receiveShadow = true; }
      });
      const bounds = new Box3().setFromObject(model);
      const size = bounds.getSize(new Vector3());
      model.scale.multiplyScalar(4.8 / Math.max(size.x, size.y, size.z, 1));
      bounds.setFromObject(model);
      model.position.y -= bounds.min.y;
      runtime.content.add(model);
      placeObjectInFreeSpot(model, runtime.content);
      registerModelAnimations(model, gltf.animations);
      let selectedObject = model;
      if (isGuitaristModel(modelPreset.id) && GUITAR_MODEL_LOADER) {
        setStatus("Colocando la guitarra en la mano...");
        const guitarUrl = await GUITAR_MODEL_LOADER();
        const guitarGltf = await new GLTFLoader().loadAsync(guitarUrl);
        const guitar = guitarGltf.scene;
        const hand = findCharacterHand(model, "LeftHand") || findCharacterHand(model, "RightHand");
        if (hand) {
          const characterHeight = new Box3().setFromObject(model).getSize(new Vector3()).y;
          guitar.name = "Guitarra del guitarrista";
          guitar.userData = {
            ...guitar.userData,
            editorId: makeId(),
            editorType: "model",
            bundledStaticModel: "guitar",
            editableAttachment: true,
            attachmentBone: hand.name,
            attachmentOwner: model.userData.editorId
          };
          guitar.traverse((item) => {
            if (item.isMesh) { item.castShadow = true; item.receiveShadow = true; }
          });
          hand.add(guitar);
          guitar.position.set(0, 0, 0);
          guitar.rotation.set(0, 0, 0);
          guitar.updateWorldMatrix(true, true);
          const guitarSize = new Box3().setFromObject(guitar).getSize(new Vector3());
          const guitarLength = Math.max(guitarSize.x, guitarSize.y, guitarSize.z, 0.001);
          guitar.scale.multiplyScalar((characterHeight * 0.62) / guitarLength);
          selectedObject = guitar;
        }
      }
      refreshObjects();
      selectObject(selectedObject);
      setMode("translate");
      setStatus(isGuitaristModel(modelPreset.id)
        ? "Guitarrista agregado. Acomoda la guitarra: seguira la mano durante la animacion"
        : `${modelPreset.name} agregado con su animacion`);
    } catch (error) {
      console.error(error);
      setStatus(`No se pudo cargar ${modelPreset.character}`);
    }
  }

  async function addStaticModel(modelPreset) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    try {
      setStatus(`Cargando ${modelPreset.name}...`);
      const modelUrl = modelPreset.url || await modelPreset.loadUrl();
      const gltf = await new GLTFLoader().loadAsync(modelUrl);
      pushHistory();
      const model = gltf.scene;
      model.name = modelPreset.name;
      model.userData = { ...model.userData, editorId: makeId(), editorType: "model", bundledStaticModel: modelPreset.id };
      model.animations = [];
      model.traverse((item) => {
        if (item.isMesh) { item.castShadow = true; item.receiveShadow = true; }
      });
      const bounds = new Box3().setFromObject(model);
      const size = bounds.getSize(new Vector3());
      model.scale.multiplyScalar(4.8 / Math.max(size.x, size.y, size.z, 1));
      bounds.setFromObject(model);
      model.position.y -= bounds.min.y;
      runtime.content.add(model);
      placeObjectInFreeSpot(model, runtime.content);
      refreshObjects();
      selectObject(model);
      focusSelected();
      setStatus(`${modelPreset.name} agregado`);
    } catch (error) {
      console.error(error);
      setStatus(`No se pudo cargar ${modelPreset.name}`);
    }
  }

  function startViewportRecordingNow() {
    const runtime = runtimeRef.current;
    const canvas = runtime?.renderer?.domElement;
    if (!canvas || viewportRecording || typeof canvas.captureStream !== "function" || typeof MediaRecorder === "undefined") {
      setStatus("Este navegador no permite grabar el render 3D");
      return;
    }
    let restoreOutput = null;
    try {
      const [width, height] = renderResolution.split("x").map(Number);
      const pixels = width * height;
      const bitrateMbps = Math.min(60, Math.max(16, (pixels / (1920 * 1080)) * 24));
      restoreOutput = prepareRenderOutput({ clean: true });
      const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const stream = canvas.captureStream(30);
      const recorderOptions = { videoBitsPerSecond: Math.round(bitrateMbps * 1_000_000) };
      if (mimeType) recorderOptions.mimeType = mimeType;
      const recorder = new MediaRecorder(stream, recorderOptions);
      const chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop());
        restoreOutput?.();
        viewportRecordingRef.current = null;
        setViewportRecording(false);
        setStatus("No se pudo completar la grabacion");
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
        stream.getTracks().forEach((track) => track.stop());
        restoreOutput?.();
        viewportRecordingRef.current = null;
        setViewportRecording(false);
        setViewportRecordingBlob(blob);
        setStatus("Grabacion lista para descargar");
      };
      viewportRecordingRef.current = { recorder, stream, restoreOutput };
      setViewportRecordingBlob(null);
      setViewportRecording(true);
      recorder.start(250);
      exportAudioSource?.start(0, 0, Math.min(animationDuration, soundtrackBufferRef.current.duration));
      setStatus(`Grabando ${width} x ${height} a ${Math.round(bitrateMbps)} Mbps...`);
    } catch (error) {
      console.error(error);
      restoreOutput?.();
      setStatus("No se pudo iniciar la grabacion");
    }
  }

  function startViewportRecording() {
    if (viewportRecording || recordingCountdown !== null) return;
    let count = 3;
    setRecordingCountdown(count);
    setStatus("Preparando grabacion...");
    const tick = () => {
      count -= 1;
      setRecordingCountdown(count);
      if (count > 0) {
        recordingCountdownTimerRef.current = setTimeout(tick, 1000);
      } else {
        recordingCountdownTimerRef.current = setTimeout(() => {
          recordingCountdownTimerRef.current = null;
          setRecordingCountdown(null);
          startViewportRecordingNow();
        }, 650);
      }
    };
    recordingCountdownTimerRef.current = setTimeout(tick, 1000);
  }

  function stopViewportRecording() {
    if (recordingCountdownTimerRef.current) {
      clearTimeout(recordingCountdownTimerRef.current);
      recordingCountdownTimerRef.current = null;
      setRecordingCountdown(null);
      setStatus("Grabacion cancelada");
      return;
    }
    const recorder = viewportRecordingRef.current?.recorder;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
  }

  async function downloadViewportRecording(format = "webm") {
    if (!viewportRecordingBlob || viewportConverting) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    if (format === "webm") {
      downloadBlob(viewportRecordingBlob, `neonboy-3d-${timestamp}.webm`);
      return;
    }
    setViewportConverting(true);
    setStatus("Codificando MP4 H.264 en alta calidad...");
    try {
      await convertToH264(viewportRecordingBlob, `neonboy-3d-${timestamp}-h264.mp4`);
      setStatus("Video MP4 H.264 exportado");
    } catch (error) {
      console.error(error);
      setStatus("No se pudo exportar H.264");
    } finally {
      setViewportConverting(false);
    }
  }

  function exportPng() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const restoreOutput = prepareRenderOutput({ clean: true, transparent: transparentPng });
    runtime.renderer.render(runtime.scene, runtime.camera);
    runtime.renderer.domElement.toBlob((blob) => {
      if (blob) downloadBlob(blob, "studio-3d.png");
      restoreOutput();
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
          <button disabled={!selectedId || selectedRef.current?.userData?.locked} data-tooltip="Centrar en la escena" onClick={centerSelected} type="button"><LocateFixed size={18} /></button>
          <button disabled={!selectedId || selectedRef.current?.isLight || selectedRef.current?.userData?.locked} data-tooltip="Apoyar sobre el piso" onClick={placeOnFloor} type="button"><ArrowDownToLine size={18} /></button>
          <button disabled={selectedIds.length < 2} data-tooltip="Agrupar seleccion (Ctrl+G)" onClick={groupSelected} type="button"><Group size={18} /></button>
          <button disabled={!selectedRef.current?.isGroup} data-tooltip="Desagrupar (Ctrl+Shift+G)" onClick={ungroupSelected} type="button"><Ungroup size={18} /></button>
          <button disabled={selectedIds.length < 2} data-tooltip="Fusionar mallas" onClick={mergeSelected} type="button"><Combine size={18} /></button>
          <button disabled={!selectedId || selectedRef.current?.userData?.locked} data-tooltip="Eliminar objeto" onClick={removeSelected} type="button"><Trash2 size={18} /></button>
        </div>
        <div className="three-tool-group">
          <button className={environmentIsolated ? "active" : ""} data-tooltip={environmentIsolated ? "Restaurar ambiente" : "Ocultar fondo, piso y efectos"} onClick={toggleEnvironmentIsolation} type="button">
            {environmentIsolated ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
        <div className="three-toolbar-spacer" />
        <span className="three-autosave-status">{autosaveStatus}</span>
        <button className="three-action" onClick={onRequestProjectSave} type="button"><Download size={17} /> Guardar</button>
        <button className="three-action" onClick={exportPng} type="button"><ImageDown size={17} /> PNG</button>
        <button className="three-action" onClick={exportGlb} type="button"><Download size={17} /> GLB</button>
      </div>

      <div className="three-workspace">
        <aside className="three-library" data-wizard="three-objects">
          <div className="three-panel-heading"><span>CREAR</span><strong>Biblioteca</strong></div>
          <nav aria-label="Biblioteca 3D" className="three-library-tabs">
            <button className={libraryTab === "objects" ? "active" : ""} onClick={() => setLibraryTab("objects")} type="button"><Box size={15} /> Objetos 3D</button>
            <button className={libraryTab === "characters" ? "active" : ""} onClick={() => setLibraryTab("characters")} type="button"><Sparkles size={15} /> Personajes</button>
          </nav>
          {libraryTab === "objects" ? <>
            <div className="three-add-grid">
              <button onClick={() => addPrimitive("box")} type="button"><Box size={22} /><span>Cubo</span></button>
              <button onClick={() => addPrimitive("sphere")} type="button"><Circle size={22} /><span>Esfera</span></button>
              <button onClick={() => addPrimitive("cylinder")} type="button"><Cylinder size={22} /><span>Cilindro</span></button>
              <button onClick={() => addPrimitive("cone")} type="button"><Cone size={22} /><span>Cono</span></button>
              <button onClick={() => addPrimitive("plane")} type="button"><Square size={22} /><span>Plano</span></button>
              <button onClick={() => addPrimitive("torus")} type="button"><CircleDot size={22} /><span>Toroide</span></button>
              <button onClick={() => addPrimitive("capsule")} type="button"><Pill size={22} /><span>Capsula</span></button>
              {STATIC_MODELS.map((model) => <button key={model.id} onClick={() => addStaticModel(model)} type="button"><Box size={22} /><span>{model.name}</span></button>)}
              <button onClick={() => addLight("point")} type="button"><Lightbulb size={22} /><span>Luz puntual</span></button>
              <button onClick={() => addLight("directional")} type="button"><Sun size={22} /><span>Luz solar</span></button>
              <button onClick={() => addLight("spot")} type="button"><Flashlight size={22} /><span>Foco</span></button>
              <label className="three-import"><Upload size={22} /><span>Importar modelo</span><input accept=".glb,.gltf,model/gltf-binary,model/gltf+json" onChange={importModel} type="file" /></label>
              <label className="three-import"><Palette size={22} /><span>Importar SVG</span><input accept=".svg,image/svg+xml" onChange={importSvg} type="file" /></label>
            </div>
            <div className="three-create-text">
              <label><span>Texto 3D</span><input maxLength="42" onChange={(event) => changeTextDraft(event.target.value)} onFocus={pushHistory} value={textDraft} /></label>
              <label><span>Tipografia</span><select onChange={(event) => changeTextFont(event.target.value)} value={textFont}>{Object.entries(THREE_FONTS).map(([id, entry]) => <option key={id} value={id}>{entry.name}</option>)}</select></label>
              <label><span>Profundidad</span><input max="1.5" min="0.05" onChange={(event) => changeTextDepth(event.target.value)} onFocus={pushHistory} step="0.05" type="number" value={extrudeDepth} /></label>
              <button disabled={!textDraft.trim()} onClick={selectedRef.current?.userData.editorType === "text" ? () => updateSelectedText() : addText} type="button"><Type size={16} /> {selectedRef.current?.userData.editorType === "text" ? "Aplicar cambios" : "Agregar texto"}</button>
            </div>
          </> : <div className="three-character-library">
            {["Neonboy", "Neoncruzader"].map((character) => <section key={character}>
              <div className="three-library-section-title"><strong>{character}</strong><span>{CHARACTER_MODELS.filter((model) => model.character === character).length}</span></div>
              <div className="three-add-grid">
                {CHARACTER_MODELS.filter((model) => model.character === character).map((model) => <button key={model.id} onClick={() => addNeonboy(model)} type="button"><Sparkles size={22} /><span>{model.animation}</span></button>)}
              </div>
            </section>)}
          </div>}
          <div className="three-panel-heading three-scene-heading"><span>ESCENA</span><strong>Objetos</strong></div>
          <div className="three-outliner">
            {objects.map((item) => {
              const ItemIcon = iconForType(item.type);
              return <div className={`three-outliner-row ${selectedIds.includes(item.id) ? "active" : ""}`} key={item.id}>
                <button className="three-outliner-select" onClick={(event) => selectObject(findEditorObject(item.id), event.shiftKey)} type="button"><ItemIcon size={16} /><span>{item.name}</span></button>
                <button className="three-outliner-lock" data-tooltip={item.locked ? "Desbloquear" : "Bloquear"} onClick={() => toggleObjectLock(item.id)} type="button">{item.locked ? <Lock size={14} /> : <Unlock size={14} />}</button>
                <button className="three-outliner-visibility" data-tooltip={item.visible ? "Ocultar" : "Mostrar"} onClick={() => toggleObjectVisibility(item.id)} type="button">{item.visible ? <Eye size={15} /> : <EyeOff size={15} />}</button>
              </div>;
            })}
          </div>
        </aside>

        <div className="three-viewport-wrap" data-wizard="three-viewport">
          <div className="three-viewport" ref={hostRef} />
          <div className="three-viewport-label"><Circle size={8} fill="currentColor" /> Perspectiva</div>
          {recordingCountdown !== null && <div className="three-recording-countdown" key={recordingCountdown}>{recordingCountdown}</div>}
          {status && <div className="three-status">{status}</div>}
        </div>

        <aside className="three-properties" data-tab={propertyTab} data-wizard="three-properties">
          <div className="three-panel-heading"><span>PROPIEDADES</span><strong>{selection?.name || "Escena"}</strong></div>
          <div className="three-camera-navigation">
            <div
              aria-label="Orbitar camara"
              className="three-camera-trackpad"
              onPointerCancel={stopCameraNavigation}
              onPointerDown={startCameraNavigation}
              onPointerMove={moveCameraNavigation}
              onPointerUp={stopCameraNavigation}
              role="button"
              tabIndex="0"
            ><Move3D size={20} /></div>
            <button aria-label="Acercar" onClick={(event) => event.detail === 0 && zoomCamera(0.92)} onPointerCancel={stopContinuousZoom} onPointerDown={(event) => startContinuousZoom(event, "in")} onPointerLeave={stopContinuousZoom} onPointerUp={stopContinuousZoom} type="button"><ZoomIn size={18} /></button>
            <button aria-label="Alejar" onClick={(event) => event.detail === 0 && zoomCamera(1.09)} onPointerCancel={stopContinuousZoom} onPointerDown={(event) => startContinuousZoom(event, "out")} onPointerLeave={stopContinuousZoom} onPointerUp={stopContinuousZoom} type="button"><ZoomOut size={18} /></button>
          </div>
          <div className="three-camera-shots">
            <div className="three-camera-shots-title"><Film size={15} /><span>PLANOS</span></div>
            <div className="three-camera-shot-picker">
              <select onChange={(event) => setCameraShotSelection(event.target.value)} value={cameraShotSelection}>
                <optgroup label="Encuadres clasicos">
                  {CAMERA_SHOTS.slice(0, 5).map((shot) => <option key={shot.id} value={shot.id}>{shot.name}</option>)}
                </optgroup>
                <optgroup label="Angulos cinematograficos">
                  {CAMERA_SHOTS.slice(5).map((shot) => <option key={shot.id} value={shot.id}>{shot.name}</option>)}
                </optgroup>
              </select>
              <button className={activeCameraShot === cameraShotSelection ? "active" : ""} data-tooltip="Aplicar plano" onClick={() => applyCameraShot(CAMERA_SHOTS.find((shot) => shot.id === cameraShotSelection))} type="button"><Camera size={16} /></button>
            </div>
          </div>
          <div className="three-camera-recording three-recording-controls">
            <button aria-label="Grabar render" className={viewportRecording ? "recording" : ""} disabled={viewportRecording || recordingCountdown !== null || viewportConverting} onClick={startViewportRecording} type="button"><Circle fill="currentColor" size={15} /><span>REC</span></button>
            <button aria-label="Detener grabacion" disabled={!viewportRecording && recordingCountdown === null} onClick={stopViewportRecording} type="button"><Square fill="currentColor" size={14} /><span>STOP</span></button>
            <button aria-label="Descargar grabacion WebM" disabled={!viewportRecordingBlob || viewportRecording || recordingCountdown !== null || viewportConverting} onClick={() => downloadViewportRecording("webm")} type="button"><Download size={16} /><span>WebM</span></button>
            <button aria-label="Descargar grabacion MP4 H.264" disabled={!viewportRecordingBlob || viewportRecording || recordingCountdown !== null || viewportConverting} onClick={() => downloadViewportRecording("h264")} type="button"><Film size={16} /><span>{viewportConverting ? "Procesando" : "H.264"}</span></button>
          </div>
          <nav aria-label="Panel de propiedades 3D" className="three-property-tabs">
            <button className={propertyTab === "object" ? "active" : ""} onClick={() => setPropertyTab("object")} type="button">Objeto</button>
            <button className={propertyTab === "model" ? "active" : ""} onClick={() => setPropertyTab("model")} type="button">Modelar</button>
            <button className={propertyTab === "material" ? "active" : ""} onClick={() => setPropertyTab("material")} type="button">Material</button>
            <button className={propertyTab === "scene" ? "active" : ""} onClick={() => setPropertyTab("scene")} type="button">Escena</button>
            <button className={propertyTab === "effects" ? "active" : ""} onClick={() => setPropertyTab("effects")} type="button">Efectos</button>
            <button className={propertyTab === "output" ? "active" : ""} onClick={() => setPropertyTab("output")} type="button">Salida</button>
          </nav>
          {selection ? (
            <>
              <fieldset className="three-tab-object">
                <legend>Objeto</legend>
                <label><span>Nombre</span><input maxLength="80" onChange={(event) => renameSelected(event.target.value)} onFocus={pushHistory} value={selection.name} /></label>
                <label className="three-check"><input checked={selection.locked} onChange={() => toggleObjectLock(selectedId)} type="checkbox" />{selection.locked ? <Lock size={16} /> : <Unlock size={16} />} Bloquear transformaciones</label>
                {!selection.isLight && <button className={selectedRef.current?.userData?.mirrored ? "active" : ""} disabled={selection.locked} onClick={mirrorSelected} type="button"><FlipHorizontal2 size={16} /> {selectedRef.current?.userData?.mirrored ? "Quitar espejo" : "Espejar horizontal"}</button>}
              </fieldset>
              {!selection.isLight && (
                <fieldset className="three-tab-object">
                  <legend>Vincular a personaje</legend>
                  <label><span>Punto</span><select onChange={(event) => {
                    const point = event.target.value;
                    setAttachmentHand(point);
                    if (selectedRef.current?.userData?.editableAttachment) attachSelectedToHand(point);
                  }} value={attachmentHand}>
                    <option value="LeftHand">Izquierda</option>
                    <option value="RightHand">Derecha</option>
                    <option value="Spine">Centro / ombligo</option>
                    <option value="Hips">Cadera</option>
                  </select></label>
                  {selectedRef.current?.userData?.editableAttachment
                    ? <>
                      <div className="three-model-actions">
                        <button className={mode === "translate" ? "active" : ""} onClick={() => setAttachmentTransformMode("translate")} type="button"><Move3D size={16} /> Mover</button>
                        <button className={mode === "rotate" ? "active" : ""} onClick={() => setAttachmentTransformMode("rotate")} type="button"><Rotate3D size={16} /> Rotar</button>
                        <button className={mode === "scale" ? "active" : ""} onClick={() => setAttachmentTransformMode("scale")} type="button"><Scale3D size={16} /> Escalar</button>
                        <button className={attachmentPrecision ? "active" : ""} onClick={toggleAttachmentPrecision} type="button"><Focus size={16} /> Precision</button>
                      </div>
                      <div className="three-model-actions">
                        <button className={attachmentOwnerPaused ? "active" : ""} onClick={toggleAttachmentOwnerAnimation} type="button">{attachmentOwnerPaused ? <Play size={16} /> : <Pause size={16} />} {attachmentOwnerPaused ? "Reanudar" : "Pausar"}</button>
                        <button onClick={centerAttachmentOnAnchor} type="button"><LocateFixed size={16} /> Centrar</button>
                        <button onClick={straightenAttachment} type="button"><RotateCcw size={16} /> Enderezar</button>
                        <button disabled={!historyCounts.undo} onClick={undo} type="button"><Undo2 size={16} /> Deshacer ajuste</button>
                        <button disabled={!historyCounts.redo} onClick={redo} type="button"><Redo2 size={16} /> Rehacer ajuste</button>
                        <button onClick={saveAttachmentPose} type="button"><Download size={16} /> Guardar pose</button>
                        <button disabled={!selectedRef.current?.userData?.savedAttachmentTransform} onClick={restoreAttachmentPose} type="button"><RotateCcw size={16} /> Restaurar pose</button>
                      </div>
                      <button onClick={detachSelectedFromHand} type="button"><Unlink2 size={16} /> Desvincular</button>
                    </>
                    : <button onClick={() => attachSelectedToHand()} type="button"><Link2 size={16} /> Vincular</button>}
                </fieldset>
              )}
              {["position", "rotation", "scale"].map((group) => (
                <fieldset className="three-tab-object" key={group}>
                  <legend className={group === "scale" ? "three-transform-legend" : undefined}>
                    <span>{group === "position" ? "Posicion" : group === "rotation" ? "Rotacion" : "Escala"}</span>
                    {group === "scale" && <button className={scaleLinked ? "active" : ""} data-tooltip={scaleLinked ? "Escala proporcional" : "Escala por eje"} onClick={() => setScaleLinked((linked) => !linked)} type="button">{scaleLinked ? <Link2 size={14} /> : <Unlink2 size={14} />}</button>}
                  </legend>
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
              {selection.isLight && (
                <fieldset className="three-tab-object">
                  <legend>Vincular luz</legend>
                  <label><span>Objetivo</span><select onChange={(event) => updateLightLink({ targetId: event.target.value })} value={selection.lightLink.targetId}>
                    <option value="">Sin vincular</option>
                    {objects.filter((item) => item.type !== "light").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select></label>
                  <label className="three-check"><input checked={selection.lightLink.follow} disabled={!selection.lightLink.targetId} onChange={(event) => updateLightLink({ follow: event.target.checked })} type="checkbox" /><Move3D size={16} /> Seguir posicion</label>
                  {(selectedRef.current?.isSpotLight || selectedRef.current?.isDirectionalLight) && <label className="three-check"><input checked={selection.lightLink.aim} disabled={!selection.lightLink.targetId} onChange={(event) => updateLightLink({ aim: event.target.checked })} type="checkbox" /><Focus size={16} /> Apuntar al objetivo</label>}
                  <div className="three-vector-inputs">
                    {["X", "Y", "Z"].map((axis, index) => <label key={axis}><span>{axis}</span><input disabled={!selection.lightLink.targetId || !selection.lightLink.follow} onBlur={pushHistory} onChange={(event) => updateLightLinkOffset(index, event.target.value)} step="0.1" type="number" value={selection.lightLink.offset[index]} /></label>)}
                  </div>
                </fieldset>
              )}
              {!selection.isLight && (
                <>
                  {selection.modelAnimation && (
                    <fieldset className="three-tab-model">
                      <legend>Animacion del modelo</legend>
                      <label><span>Clip</span><select onChange={(event) => selectModelAnimation(event.target.value)} value={selection.modelAnimation.clip}>{selection.modelAnimation.clips.map((clip) => <option key={clip} value={clip}>{clip}</option>)}</select></label>
                      <button className="three-sculpt-toggle" onClick={toggleModelAnimation} type="button">{selection.modelAnimation.playing ? <Pause size={16} /> : <Play size={16} />} {selection.modelAnimation.playing ? "Pausar" : "Reproducir"}</button>
                      <label><span>Velocidad</span><input max="2.5" min="0" onChange={(event) => setModelAnimationSpeed(event.target.value)} step="0.05" type="range" value={selection.modelAnimation.speed} /></label>
                    </fieldset>
                  )}
                  {POSE_BONES.some((entry) => findRigBone(selectedRef.current, entry.id)) && (
                    <fieldset className="three-tab-model" key={`pose:${poseVersion}`}>
                      <legend>Pose del personaje</legend>
                      <label><span>Parte</span><select onChange={(event) => { if (poseGizmoRef.current) closeBoneGizmo(); setPoseBone(event.target.value); }} value={poseBone}>
                        {POSE_BONES.filter((entry) => findRigBone(selectedRef.current, entry.id)).map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
                      </select></label>
                      {['X', 'Y', 'Z'].map((axis, index) => {
                        const bone = findRigBone(selectedRef.current, poseBone);
                        const value = THREE.MathUtils.radToDeg(selectedRef.current?.userData?.poseOffsets?.[bone?.name]?.[index] || 0);
                        return <label key={axis}><span>Rotacion {axis}</span><input disabled={selection.locked} max="180" min="-180" onChange={(event) => updateBonePose(index, event.target.value)} onPointerDown={pushHistory} step="1" type="range" value={value} /></label>;
                      })}
                      <button disabled={selection.locked} onClick={resetBonePose} type="button"><RotateCcw size={16} /> Restaurar parte</button>
                      <button className={poseGizmoRef.current ? "active" : ""} disabled={selection.locked} onClick={poseGizmoRef.current ? closeBoneGizmo : openBoneGizmo} type="button"><Rotate3D size={16} /> {poseGizmoRef.current ? "Cerrar rotador" : "Rotar sobre el personaje"}</button>
                    </fieldset>
                  )}
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
              {ENVIRONMENT_BACKGROUNDS.map((preset) => <button className={environmentBackground === preset.id ? "active" : ""} key={preset.id} onClick={() => { pushHistory(); setEnvironmentBackground(preset.id); if (preset.id !== "solid") { setFloorVisible(true); setFloorSurface("shadow"); } }} style={preset.image ? { backgroundImage: `url(${environmentThumbnail(preset)})` } : { background: background }} type="button"><span>{preset.name}</span></button>)}
            </div>
            <div className="three-sublegend">Escenarios animados</div>
            <div className="three-scene-presets">
              {THEMED_SCENES.map((preset) => <button className={environmentBackground === preset.sky && floorSurface === preset.floor ? "active" : ""} key={preset.id} onClick={() => applyThemedScene(preset)} style={{ backgroundImage: `url(${environmentThumbnail({ id: preset.sky, image: preset.image })})` }} type="button"><span>{preset.name}</span></button>)}
            </div>
            <div className="three-sublegend">Cielo e iluminacion</div>
            <div className="three-sky-presets">
              {SKY_BACKGROUNDS.map((preset) => <button className={environmentBackground === preset.id ? "active" : ""} key={preset.id} onClick={() => applySkyPreset(preset)} style={{ backgroundImage: `url(${environmentThumbnail(preset)})` }} type="button"><span>{preset.name}</span></button>)}
            </div>
            <label className="three-check"><input checked={skyMotionEnabled} disabled={!environmentBackground.startsWith("sky-")} onChange={(event) => { pushHistory(); setSkyMotionEnabled(event.target.checked); }} type="checkbox" /><Sparkles size={16} /> Animar cielo</label>
            <label><span>Velocidad cielo</span><input disabled={!environmentBackground.startsWith("sky-") || !skyMotionEnabled} max="1.5" min="0.05" onChange={(event) => setSkyMotionSpeed(Number(event.target.value))} onPointerDown={pushHistory} step="0.05" type="range" value={skyMotionSpeed} /></label>
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
          <fieldset className="three-tab-effects">
            <legend>Combinaciones</legend>
            <div className="three-effects-presets">
              <button onClick={() => applyEffectsPreset("infernal")} type="button"><Flame size={15} /> Infernal</button>
              <button onClick={() => applyEffectsPreset("storm")} type="button"><CloudRain size={15} /> Tormenta</button>
              <button onClick={() => applyEffectsPreset("mystic")} type="button"><Sparkles size={15} /> Mistico</button>
              <button onClick={() => applyEffectsPreset("downpour")} type="button"><CloudRain size={15} /> Diluvio</button>
              <button onClick={() => applyEffectsPreset("acidRain")} type="button"><CloudRain size={15} /> Lluvia acida</button>
              <button onClick={() => applyEffectsPreset("spectralEclipse")} type="button"><CloudLightning size={15} /> Eclipse</button>
              <button onClick={() => applyEffectsPreset("castleInterior")} type="button"><Flame size={15} /> Castillo interior</button>
              <button onClick={() => applyEffectsPreset("castleCourtyard")} type="button"><Sparkles size={15} /> Patio medieval</button>
              <button onClick={() => applyEffectsPreset("medievalVillage")} type="button"><CloudRain size={15} /> Aldea humeda</button>
              <button onClick={() => applyEffectsPreset("moonlitPeaks")} type="button"><CloudLightning size={15} /> Cumbres luna</button>
              <button onClick={() => applyEffectsPreset("spiderwebRuins")} type="button"><Sparkles size={15} /> Telaranas nocturnas</button>
              <button onClick={() => applyEffectsPreset("clear")} type="button">Limpiar</button>
            </div>
          </fieldset>
          {[
            { id: "fog", label: "Niebla", icon: CloudFog },
            { id: "fire", label: "Fuego y brasas", icon: Flame },
            { id: "rain", label: "Agua / lluvia", icon: CloudRain },
            { id: "particles", label: "Particulas", icon: Sparkles },
            { id: "storm", label: "Nubes y rayos", icon: CloudLightning }
          ].map(({ id, label, icon: EffectIcon }) => (
            <fieldset className="three-tab-effects" key={id}>
              <legend>{label}</legend>
              <label className="three-check"><input checked={sceneEffects[id].enabled} onChange={(event) => { pushHistory(); updateSceneEffect(id, "enabled", event.target.checked); }} type="checkbox" /><EffectIcon size={16} /> Activar</label>
              <label><span>Intensidad</span><input disabled={!sceneEffects[id].enabled} max={id === "rain" ? 1.8 : 1} min="0.05" onChange={(event) => updateSceneEffect(id, "intensity", Number(event.target.value))} onPointerDown={pushHistory} step="0.05" type="range" value={sceneEffects[id].intensity} /></label>
              {id === "fog" && <label className="three-color-field"><span>Color</span><input disabled={!sceneEffects.fog.enabled} onChange={(event) => updateSceneEffect("fog", "color", event.target.value)} type="color" value={sceneEffects.fog.color} /></label>}
              {id === "rain" && <>
                <label className="three-color-field"><span>Color</span><input disabled={!sceneEffects.rain.enabled} onChange={(event) => updateSceneEffect("rain", "color", event.target.value)} type="color" value={sceneEffects.rain.color || DEFAULT_SCENE_EFFECTS.rain.color} /></label>
                <label><span>Direccion X</span><input disabled={!sceneEffects.rain.enabled} max="1" min="-1" onChange={(event) => updateSceneEffect("rain", "directionX", Number(event.target.value))} onPointerDown={pushHistory} step="0.05" type="range" value={sceneEffects.rain.directionX} /></label>
                <label><span>Direccion Z</span><input disabled={!sceneEffects.rain.enabled} max="1" min="-1" onChange={(event) => updateSceneEffect("rain", "directionZ", Number(event.target.value))} onPointerDown={pushHistory} step="0.05" type="range" value={sceneEffects.rain.directionZ} /></label>
              </>}
            </fieldset>
          ))}
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
        cameraFollow={cameraFollow}
        cameraShake={cameraShake}
        cameraKeyframes={animationTracks[CAMERA_TRACK_ID] || []}
        animationLoop={animationLoop}
        currentTime={animationTime}
        duration={animationDuration}
        keyframes={animationTracks[selectedId] || []}
        onAddKeyframe={addAnimationKeyframe}
        onAddCameraKeyframe={addCameraKeyframe}
        onAudioImport={importSoundtrack}
        onAnimationLoopChange={setAnimationLoop}
        onAutoDirect={createAutomaticDirection}
        onBeatDirect={createBeatDirection}
        onClear={clearSelectedAnimation}
        onClearCamera={clearCameraAnimation}
        onCameraFollowChange={(patch) => {
          const next = { ...cameraFollow, ...patch };
          cameraFollowRef.current = { ...cameraFollowRef.current, ...next, subject: patch.enabled ? null : cameraFollowRef.current.subject };
          setCameraFollow(next);
        }}
        onCameraShakeChange={(patch) => {
          const next = { ...cameraShakeRef.current, ...patch };
          cameraShakeRef.current = next;
          setCameraShake(next);
        }}
        onDurationChange={(value) => {
          const nextDuration = Math.max(1, value);
          setAnimationDuration(nextDuration);
          seekAnimation(Math.min(animationTime, nextDuration));
        }}
        onDeleteMarker={deleteAnimationMarker}
        onDuplicateMarker={duplicateAnimationMarker}
        onUpdateMarker={updateAnimationMarker}
        onPlayingChange={(playing) => {
          if (playing && animationTimeRef.current >= animationDuration - 0.001) seekAnimation(0);
          setAnimationPlaying(playing);
        }}
        onRemoveAudio={removeSoundtrack}
        onExport={exportAnimation}
        onFpsChange={setAnimationFps}
        onSeek={seekAnimation}
        exporting={animationExporting}
        fps={animationFps}
        playing={animationPlaying}
        soundtrack={soundtrack}
        slowMotion={slowMotion}
        onSlowMotionChange={(patch) => {
          const next = { ...slowMotionRef.current, ...patch };
          next.start = THREE.MathUtils.clamp(Number(next.start), 0, animationDuration);
          next.end = THREE.MathUtils.clamp(Number(next.end), next.start, animationDuration);
          next.speed = THREE.MathUtils.clamp(Number(next.speed), 0.05, 1);
          slowMotionRef.current = next;
          setSlowMotion(next);
        }}
        selectedName={selection?.name || ""}
      />
      {soundtrack && <audio loop={animationLoop} ref={soundtrackAudioRef} src={soundtrack.url} />}
    </section>
  );
}
