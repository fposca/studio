import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Box3, Color, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
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
import diskTextureUrl from "../assets/neonboy-animaciones/disk.png";
import retroTvVideoUrl from "../assets/neonboy-animaciones/video.mp4?url";
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
import skySpace from "../assets/environments/sky-space-nebula-v3.png";
import spaceShipPreview from "../assets/environments/space-ship-preview.jpg";
import skyInfernal from "../assets/environments/sky-infernal-sharp.png";
import skyApocalypse from "../assets/environments/sky-apocalypse-sharp.png";
import apocalypseSoilTexture from "../assets/environments/apocalypse-soil-texture.png";
import skyCemetery from "../assets/environments/sky-cemetery-v2.png";
import infernalFloorTexture from "../assets/environments/infernal-floor-texture.png";
import volcanicBlackEarthTexture from "../assets/environments/volcanic-black-earth-v1.png";
import cemeteryFloorTexture from "../assets/environments/cemetery-soil-v3.png";
import skyMedievalApocalypse from "../assets/environments/sky-medieval-apocalypse.png";
import medievalApocalypseFloorTexture from "../assets/environments/medieval-apocalypse-floor-texture.png";
import skyGothicChurch from "../assets/environments/sky-gothic-church.png";
import gothicChurchFloorTexture from "../assets/environments/gothic-church-floor-v2.png";
import skyNightSwamp from "../assets/environments/sky-night-swamp-v2.png";
import nightSwampFloorTexture from "../assets/environments/night-swamp-mud-v2.png";
import skyRuinedGothicChurch from "../assets/environments/sky-ruined-gothic-church-sharp.png";
import ruinedGothicChurchFloorTexture from "../assets/environments/ruined-gothic-church-floor-texture-v2.png";
import skyCastleInterior from "../assets/environments/sky-castle-interior-v2.png";
import castleStoneTexture from "../assets/environments/castle-interior-stone-v1.png";
import skyMedievalVillage from "../assets/environments/sky-medieval-village.png";
import skyMoonlitPeaks from "../assets/environments/sky-moonlit-peaks-v4.png";
import moonlitZenithTextureUrl from "../assets/environments/moonlit-zenith-v1.png";
import moonlitPeaksGroundTexture from "../assets/environments/moonlit-peaks-ground-v1.png";
import skySpiderwebRuins from "../assets/environments/sky-spiderweb-ruins.png";
import neonboyModelUrl from "../assets/Meshy_AI_Midnight_Jester_Axe_Breathe_and_Look_.glb?url";
import neonboyLogoModelUrl from "../assets/logo.glb?url";
import {
  ArrowDownToLine, Box, Camera, Circle, CircleDot, ClipboardPaste, CloudFog, CloudLightning, CloudRain, Combine, Cone, Copy, Cylinder, Download, Eye,
  EyeOff, Film, Flashlight, FlipHorizontal2, Focus, Grid3X3, ImageDown, Lightbulb, LocateFixed,
  Flame, Gauge, Group, Hammer, Link2, Lock, MousePointer2, Move3D, Music, Palette, Pause, Pill, Play, Redo2, Rotate3D, RotateCcw, Scale3D, Sparkles, Square,
  Search, Sun, Trash2, Type, Undo2, Ungroup, Unlink2, Unlock, Upload, Wind, ZoomIn, ZoomOut
} from "lucide-react";
import { getProject, putProject } from "../storage/projectDb.js";
import ThreeAnimationPanel from "./ThreeAnimationPanel.jsx";
import { createRuinedChurchDebrisSystem, createRuinedChurchBedMaterial } from "./ruinedChurchFloor.js";
import { createArcaneMagic, DEFAULT_MAGIC_SETTINGS, normalizeMagicSettings } from "./arcaneMagic.js";
import { createChurchLighting, DEFAULT_CHURCH_LIGHTING, normalizeChurchLighting } from "./churchLighting.js";
import { createChurchFog, DEFAULT_CHURCH_FOG, CHURCH_FOG_BACKGROUNDS, normalizeChurchFog } from "./churchFog.js";
import { createRealisticRain, DEFAULT_RAIN, normalizeRain } from "./realisticRain.js";
import { createRealisticStorm, DEFAULT_STORM, normalizeStorm } from "./realisticStorm.js";
import { createChurchPanorama } from "./churchPanorama.js";
import { createPanoramaBackdrop } from "./panoramaBackdrop.js";
import { createCastleBackdrop, createGothicChurchBackdrop } from "./interiorBackdrop.js";
import { createGothicChurchInterior, DEFAULT_GOTHIC_LIGHTING, normalizeGothicLighting } from "./gothicChurchInterior.js";
import { createSwampSet, createSwampTerrainGeometry } from "./swampSet.js";
import { createMedievalSet, createMedievalTerrainGeometry } from "./medievalSet.js";
import { createMoonlitPeaksSet } from "./moonlitPeaksSet.js";
import { createMoonlitTerrainGeometry } from "./moonlitTerrain.js";
import { createApocalypseDebrisSystem } from "./apocalypseDebris.js";
import { createCemeteryDetails, createCemeteryTerrainGeometry } from "./cemeteryGround.js";
import { createCemeteryBats } from "./cemeteryBats.js";
import { createCemeteryLighting, DEFAULT_CEMETERY_LIGHTING, normalizeCemeteryLighting } from "./cemeteryLighting.js";
import { createCastleInteriorSet, DEFAULT_CASTLE_LIGHTING, normalizeCastleLighting } from "./castleInterior.js";
import { HD_WALK_GAIT_UNITS_PER_SECOND, speedForAnimationChange, syncedGaitRate } from "./walkGait.js";
import { DEFAULT_MASK_NEON, normalizeMaskNeon, updateMaskNeon } from "./maskNeon.js";
import { createApocalypseLighting, DEFAULT_APOCALYPSE_LIGHTING } from "./apocalypseLighting.js";
import { createApocalypseFires, DEFAULT_APOCALYPSE_FIRES, MAX_APOCALYPSE_FIRES, normalizeApocalypseFires } from "./apocalypseFires.js";
import { createSpaceScene, createNebulaFloorGeometry, createNebulaFloorMaterial, DEFAULT_SPACE_SETTINGS, normalizeSpaceSettings } from "./spaceScene.js";
import { createSpaceShipSet } from "./spaceShipSet.js";
import {
  CINEMATIC_SHOTS, CINEMATIC_ANGLES, CINEMATIC_PRESETS, DEFAULT_CINEMATIC_CAMERA,
  frameCinematicSubjects
} from "./cinematicCamera.js";

const THREE_PROJECT_ID = "three";
const THREE_AUTOSAVE_ID = "autosave:three";
const THREE_CLIPBOARD_ID = "clipboard:three";
const CAMERA_TRACK_ID = "__camera__";
const DEFAULT_BACKGROUND = "#17191d";
const DEFAULT_FREEZE_SEGMENTS = [];
const DEFAULT_GRASS_SETTINGS = { styleVersion: 4, enabled: true, density: 0.98, height: 0.4, windStrength: 0.46, windSpeed: 0.82 };
const DEFAULT_LAVA_SETTINGS = {
  styleVersion: 2,
  enabled: true,
  jetCount: 12,
  interval: 8,
  height: 1,
  gasEnabled: true,
  gasCount: 8,
  gasSpeed: 1,
  gasHeight: 1,
  gasDensity: 0.8
};
const DEFAULT_REALISTIC_SKY = { styleVersion: 2, enabled: true, cloudCover: 0.62, cloudAmount: 0.78, cloudSpeed: 0.16, sunElevation: 18, sunAzimuth: -165, sunIntensity: 3.6 };
const REALISTIC_SKY_BACKGROUNDS = new Set(["field", "clouds", "sky-clouds", "sky-sun", "sky-day", "sky-sunset", "sky-medieval-village"]);
const BUNDLED_GLTF_CACHE = new Map();
const SHARED_GEOMETRY_ROOTS = new WeakSet();
const SHARED_GEOMETRIES = new WeakSet();
const SHARED_TEXTURES = new WeakSet();
const TV_VIDEO_ELEMENTS = new WeakMap();
const NEON_FACE_MATERIALS = new WeakMap();
const NEON_FACE_SHADERS = new WeakMap();

function createGLTFLoader() {
  return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
}

function materialTextures(material) {
  if (!material) return [];
  return Object.values(material).filter((value) => value?.isTexture);
}

function enableObjectShadows(root) {
  root?.traverse((item) => {
    if (!item.isMesh) return;
    item.castShadow = true;
    item.receiveShadow = true;
  });
}

async function loadBundledModel(modelUrl) {
  if (!BUNDLED_GLTF_CACHE.has(modelUrl)) {
    const request = createGLTFLoader().loadAsync(modelUrl).catch((error) => {
      BUNDLED_GLTF_CACHE.delete(modelUrl);
      throw error;
    });
    BUNDLED_GLTF_CACHE.set(modelUrl, request);
  }
  const gltf = await BUNDLED_GLTF_CACHE.get(modelUrl);
  gltf.scene.traverse((item) => {
    if (item.geometry) SHARED_GEOMETRIES.add(item.geometry);
    const materials = Array.isArray(item.material) ? item.material : [item.material];
    materials.forEach((material) => materialTextures(material).forEach((texture) => SHARED_TEXTURES.add(texture)));
  });
  const scene = cloneSkeleton(gltf.scene);
  scene.traverse((item) => {
    if (Array.isArray(item.material)) item.material = item.material.map((material) => material.clone());
    else if (item.material) item.material = item.material.clone();
  });
  enableObjectShadows(scene);
  SHARED_GEOMETRY_ROOTS.add(scene);
  return { scene, animations: gltf.animations };
}

function freezeMotionFactorAt(time, segments) {
  return segments.reduce((factor, segment) => {
    if (time >= segment.start && time <= segment.end) return 0;
    if (segment.resume !== "smooth" || time <= segment.end) return factor;
    const duration = Math.max(segment.resumeDuration, 0.1);
    if (time >= segment.end + duration) return factor;
    const progress = THREE.MathUtils.clamp((time - segment.end) / duration, 0, 1);
    return Math.min(factor, progress * progress * (3 - 2 * progress));
  }, 1);
}

function prepareModelAnimationClips(object, clips) {
  const isHdWalk = object?.userData?.bundledModel === "neonBoy-walking-alta";
  const playable = isHdWalk ? clips.filter((clip) => clip.duration >= 0.25) : clips;
  return playable.map((source) => {
    const clip = source.clone();
    if (isHdWalk) {
      const trackDurations = clip.tracks.map((track) => {
        const times = track.times;
        return times?.length ? times[times.length - 1] - times[0] : 0;
      });
      const cycleDuration = Math.max(...trackDurations, 0.001);
      clip.tracks.forEach((track) => {
        const firstKeyTime = track.times?.[0] || 0;
        if (firstKeyTime > 0) track.shift(-firstKeyTime);
        const trackDuration = track.times?.length ? track.times[track.times.length - 1] : 0;
        if (trackDuration > 0 && Math.abs(trackDuration - cycleDuration) > 0.0001) track.scale(cycleDuration / trackDuration);
      });
      clip.resetDuration();
      clip.optimize();
    }
    return clip;
  });
}

function freezeAdjustedTime(time, segments) {
  return segments.reduce((adjusted, segment) => {
    if (time <= segment.start) return adjusted;
    adjusted -= Math.min(time, segment.end) - segment.start;
    if (segment.resume === "smooth" && time > segment.end) {
      const duration = Math.max(segment.resumeDuration, 0.1);
      const elapsed = Math.min(time - segment.end, duration);
      const progress = elapsed / duration;
      const travelled = duration * (progress ** 3 - 0.5 * progress ** 4);
      adjusted -= elapsed - travelled;
    }
    return adjusted;
  }, time);
}
const API = window.location.port === "5173" ? "http://127.0.0.1:5174" : window.location.origin;
const CAMERA_SHOTS = [
  { id: "general", name: "General", crop: 0, fill: 0.72, fov: 45 },
  { id: "full", name: "Entero", crop: 0, fill: 0.86, fov: 42 },
  { id: "american", name: "Americano", crop: 0.22, fill: 0.88, fov: 38 },
  { id: "medium", name: "Medio", crop: 0.48, fill: 0.9, fov: 35 },
  { id: "close", name: "Primer plano", crop: 0.7, fill: 0.88, fov: 32 },
  { id: "american-front", name: "Americano frontal", crop: 0.22, fill: 0.76, fov: 41, angle: 0, elevation: 2 },
  { id: "medium-close", name: "Medio corto", crop: 0.6, fill: 0.78, fov: 40, angle: 0, elevation: 2 },
  { id: "close-neutral", name: "Primer plano clasico", crop: 0.73, fill: 0.72, fov: 43, angle: 0, elevation: 2, focus: "face" },
  { id: "detail-face", name: "Detalle rostro", crop: 0.85, fill: 0.68, fov: 45, angle: 0, elevation: 1, focus: "face" },
  { id: "three-quarter-left", name: "3/4 izquierda", crop: 0.42, fill: 0.88, fov: 36, angle: 38, elevation: 4 },
  { id: "three-quarter-right", name: "3/4 derecha", crop: 0.42, fill: 0.88, fov: 36, angle: -38, elevation: 4 },
  { id: "profile", name: "Perfil", crop: 0.28, fill: 0.86, fov: 38, angle: 86, elevation: 2 },
  { id: "hero", name: "Heroe", crop: 0.18, fill: 0.9, fov: 30, angle: -28, elevation: -11 },
  { id: "low-angle", name: "Contrapicado", crop: 0.12, fill: 0.84, fov: 34, angle: 18, elevation: -22 },
  { id: "high-angle", name: "Picado", crop: 0.3, fill: 0.86, fov: 38, angle: -18, elevation: 30 },
  { id: "dutch", name: "Plano holandes", crop: 0.38, fill: 0.84, fov: 35, angle: 30, elevation: 3, roll: -12 },
  { id: "drone", name: "Drone aereo", crop: 0.02, fill: 0.68, fov: 48, angle: -28, elevation: 62 },
  { id: "youtube-establishing", name: "YouTube - Apertura general", crop: 0, fill: 0.62, fov: 45, angle: -12, elevation: 13 },
  { id: "youtube-overhead", name: "YouTube - Vista desde arriba", crop: 0, fill: 0.62, fov: 48, angle: -12, elevation: 72 },
  { id: "youtube-medium", name: "YouTube - Plano medio", crop: 0.45, fill: 0.78, fov: 40, angle: 0, elevation: 3 },
  { id: "youtube-interview", name: "YouTube - Entrevista 3/4", crop: 0.52, fill: 0.78, fov: 42, angle: 22, elevation: 2 },
  { id: "youtube-face", name: "YouTube - Primer plano rostro", crop: 0.76, fill: 0.78, fov: 42, angle: 0, elevation: 2, focus: "face" },
  { id: "youtube-face-side", name: "YouTube - Rostro lateral", crop: 0.7, fill: 0.75, fov: 45, angle: -28, elevation: 3, focus: "face" }
];
const POSE_BONES = [
  { id: "LeftShoulder", name: "Hombro izquierdo" },
  { id: "LeftArm", name: "Brazo izquierdo" },
  { id: "LeftForeArm", name: "Antebrazo izquierdo" },
  { id: "RightShoulder", name: "Hombro derecho" },
  { id: "RightArm", name: "Brazo derecho" },
  { id: "RightForeArm", name: "Antebrazo derecho" },
  { id: "LeftHand", name: "Mano izquierda" },
  { id: "RightHand", name: "Mano derecha" },
  { id: "Head", name: "Cabeza" },
  { id: "Spine", name: "Torso" }
];
const ATTACHMENT_POINTS = ["LeftHand", "RightHand", "Spine", "Hips"];

function attachmentPointFromBoneName(boneName) {
  const normalized = String(boneName || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return ATTACHMENT_POINTS.find((point) => normalized.endsWith(point.toLowerCase())) || "";
}
const NEONBOY_ANIMATION_URLS = import.meta.glob([
  "../assets/neonboy-animaciones/*.glb",
  "!../assets/neonboy-animaciones/altar.glb",
  "!../assets/neonboy-animaciones/banco.glb",
  "!../assets/neonboy-animaciones/bateria.glb",
  "!../assets/neonboy-animaciones/ciberdemonio-alado.glb",
  "!../assets/neonboy-animaciones/edificio.glb",
  "!../assets/neonboy-animaciones/mesaTv.glb",
  "!../assets/neonboy-animaciones/retro-tv.glb",
  "!../assets/neonboy-animaciones/silla.glb",
  "!../assets/neonboy-animaciones/zombie-rock.glb"
], { import: "default", query: "?url" });
const GUITAR_MODEL_LOADER = NEONBOY_ANIMATION_URLS["../assets/neonboy-animaciones/guitar.glb"];
const PROFESSOR_GUITAR_MODEL_LOADER = NEONBOY_ANIMATION_URLS["../assets/neonboy-animaciones/guitarra-profe.glb"];
const DEMON_GUITAR_MODEL_LOADER = NEONBOY_ANIMATION_URLS["../assets/neonboy-animaciones/demon-guitar.glb"];
const ZOMBIE_GUITAR_MODEL_LOADER = NEONBOY_ANIMATION_URLS["../assets/neonboy-animaciones/zombie-guitar.glb"];
const DRUMSTICKS_MODEL_LOADER = NEONBOY_ANIMATION_URLS["../assets/neonboy-animaciones/palos.glb"];
const DRUMKIT_MODEL_LOADER = NEONBOY_ANIMATION_URLS["../assets/neonboy-animaciones/bateria.optimized.glb"];
const BUILDING_MODEL_LOADER = NEONBOY_ANIMATION_URLS["../assets/neonboy-animaciones/edificio.optimized.glb"];
const TV_TABLE_MODEL_LOADER = NEONBOY_ANIMATION_URLS["../assets/neonboy-animaciones/mesaTv.optimized.glb"];
const RETRO_TV_MODEL_LOADER = NEONBOY_ANIMATION_URLS["../assets/neonboy-animaciones/retro-tv.optimized.glb"];
const CHAIR_MODEL_LOADER = NEONBOY_ANIMATION_URLS["../assets/neonboy-animaciones/silla.optimized.glb"];
const ALTAR_MODEL_LOADER = NEONBOY_ANIMATION_URLS["../assets/neonboy-animaciones/altar.optimized.glb"];
const BENCH_MODEL_LOADER = NEONBOY_ANIMATION_URLS["../assets/neonboy-animaciones/banco.optimized.glb"];
const CHARACTER_ASSET_FILES = new Set(["guitar.glb", "guitarra-profe.glb", "demon-guitar.glb", "zombie-guitar.glb", "palos.glb", "bateria.glb", "bateria.optimized.glb", "edificio.glb", "edificio.optimized.glb", "mesaTv.optimized.glb", "retro-tv.optimized.glb", "silla.optimized.glb", "altar.optimized.glb", "banco.optimized.glb"]);
const STATIC_MODEL_URLS = import.meta.glob([
  "../assets/3destatic/*.glb",
  "!../assets/3destatic/Meshy_AI_Midnight_Jester_Chair_Sit_Idle_M.glb",
  "!../assets/3destatic/Meshy_AI_Crimson_Cross_Citadel_0923010852_texture.glb"
], { import: "default", query: "?url" });
const OPTIMIZED_STATIC_MODEL_IDS = new Set(Object.keys(STATIC_MODEL_URLS)
  .filter((path) => path.endsWith(".optimized.glb"))
  .map((path) => path.split("/").pop().replace(/\.optimized\.glb$/i, "")));
const ENVIRONMENT_THUMBNAIL_URLS = import.meta.glob("../assets/environments/thumbnails/*.jpg", { eager: true, import: "default", query: "?url" });
const ENVIRONMENT_THUMBNAILS = Object.fromEntries(Object.entries(ENVIRONMENT_THUMBNAIL_URLS).map(([path, url]) => [path.split("/").pop().replace(/\.jpg$/i, ""), url]));
const CHARACTER_ANIMATION_NAMES = {
  "Meshy_AI_Midnight_Jester_Chair_Sit_Idle_M": { character: "Neoncruzader", animation: "Sentado", order: 2 },
  "Meshy_AI_Midnight_Jester_Long_Breathe_and_Look": { character: "Neoncruzader", animation: "Respirando", order: 1 },
  "Meshy_AI_Midnight_Jester_Walk_Slowly_and_Look_": { character: "Neoncruzader", animation: "Caminando", order: 3 },
  "neon-stand": { character: "Neonboy", animation: "Hablando", order: 10 },
  "neonBoy-Sit-alta": { character: "Neonboy", animation: "Sentado HD", order: 11 },
  "neon-sit-chair": { character: "Neonboy", animation: "Sentado", order: 11 },
  "neon-hablando": { character: "Neonboy", animation: "Respirando", order: 12 },
  "neonBoy-walking-alta": {
    character: "Neonboy",
    animation: "Caminando HD",
    order: 13,
    locomotion: { speed: 1.45, acceleration: 4.2, deceleration: 5.5, gaitUnitsPerSecond: HD_WALK_GAIT_UNITS_PER_SECOND }
  },
  "Neonboy-playGuitarHD": { character: "Neonboy", animation: "Guitarrista HD", order: 14 },
  "neon-hablando-mano": { character: "Neonboy", animation: "Hablando con manos", order: 13 },
  "neon-guitar": { character: "Neonboy", animation: "Guitarrista", order: 14 },
  "neon-guitar-3": { character: "Neonboy", animation: "Guitarrista 2", order: 15 },
  "neon-guitar-4": { character: "Neonboy", animation: "Guitarrista 3", order: 16 },
  "calm-guitar": { character: "Neonboy", animation: "Guitarrista calmo", order: 17 },
  "neon-rock": { character: "Neonboy", animation: "Neon Rock", order: 18 },
  "neonrock6": { character: "Neonboy", animation: "Neon Rock 6", order: 19 },
  "neonHead": { character: "Neonboy", animation: "Neon Head", order: 20 },
  "baterista": { character: "Neonboy", animation: "Baterista", order: 21 },
  "neon-stand-disk": { character: "Neonboy", animation: "Con disco", order: 22 },
  "profe": { character: "Profe", animation: "Tocando guitarra", order: 30 },
  "demon-rock": { character: "Demon", animation: "Tocando guitarra", order: 40 },
  "demonio-alado-2": { character: "Demon", animation: "Demonio alado", order: 41, legacyIds: ["ciberdemonio-alado"] },
  "cura-sentado": { character: "Cura", animation: "Sentado", order: 45 },
  "cura-2": { character: "Cura", animation: "Sentado 2", order: 46 },
  "zombie-breath": { character: "Zombie", animation: "Respirando", order: 42 },
  "zombieGuitarr": { character: "Zombie", animation: "Tocando guitarra", order: 43 },
  "angel": { character: "Angel", animation: "Base", order: 55 },
  "reptiliano-walk": { character: "Reptiliano", animation: "Caminando", order: 50, locomotion: true }
};
const isGuitaristModel = (id) => id?.startsWith("neon-guitar") || ["Neonboy-playGuitarHD", "calm-guitar", "neon-rock", "neonrock6", "neonHead", "profe", "demon-rock", "zombieGuitarr"].includes(id);

async function createDiskPlane() {
  const texture = await new THREE.TextureLoader().loadAsync(diskTextureUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  const aspect = texture.image?.width && texture.image?.height ? texture.image.width / texture.image.height : 1;
  const geometry = new THREE.PlaneGeometry(aspect, 1);
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, toneMapped: false });
  return new THREE.Mesh(geometry, material);
}

async function loadStaticPreset(preset) {
  if (preset.create) return { scene: await preset.create(), animations: [] };
  const modelUrl = preset.url || await preset.loadUrl();
  return loadBundledModel(modelUrl);
}

function configureNeonFaceEmission(model) {
  if (NEON_FACE_MATERIALS.has(model)) return;
  const materials = new Set();
  model.traverse((item) => {
    if (!item.isMesh) return;
    const itemMaterials = Array.isArray(item.material) ? item.material : [item.material];
    itemMaterials.filter((material) => material?.map).forEach((material) => materials.add(material));
  });
  materials.forEach((material) => {
    material.onBeforeCompile = (shader) => {
      const pulse = model.userData.maskPulse;
      shader.uniforms.uNeonFaceColor = { value: new Color(pulse?.color || "#ff176b") };
      shader.uniforms.uNeonFaceIntensity = { value: pulse?.enabled === false ? 0 : (pulse?.intensity ?? 4.5) * 0.45 };
      shader.fragmentShader = `uniform vec3 uNeonFaceColor;\nuniform float uNeonFaceIntensity;\n${shader.fragmentShader}`;
      shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
        #include <map_fragment>
        float neonMaxRB = max(diffuseColor.r, diffuseColor.b);
        float neonMinRB = min(diffuseColor.r, diffuseColor.b);
        float neonChroma = neonMaxRB - diffuseColor.g;
        float neonFaceMask = smoothstep(0.12, 0.38, neonChroma)
          * smoothstep(0.1, 0.35, neonMinRB)
          * smoothstep(0.3, 0.75, neonMaxRB);
        vec3 neonFaceGlow = mix(diffuseColor.rgb, uNeonFaceColor, 0.68);
        totalEmissiveRadiance += neonFaceGlow * neonFaceMask * uNeonFaceIntensity;
      `);
      NEON_FACE_SHADERS.set(material, shader);
    };
    material.customProgramCacheKey = () => "neon-face-emission-v1";
    material.needsUpdate = true;
  });
  NEON_FACE_MATERIALS.set(model, [...materials]);
}

function ensureNeonMaskPulse(model) {
  const preset = findCharacterPreset(model?.userData?.bundledModel);
  if (!preset || !["Neonboy", "Neoncruzader"].includes(preset.character)) return;
  if (NEON_FACE_MATERIALS.has(model)) return;
  model.userData.maskPulse = {
    enabled: true,
    color: "#ff176b",
    intensity: 4.5,
    speed: 3.2,
    pattern: "flicker",
    position: [0, 0.06, 0.13],
    ...DEFAULT_MASK_NEON,
    ...(model.userData.maskPulse || {})
  };
  model.userData.maskPulse = normalizeMaskNeon(model.userData.maskPulse);
  configureNeonFaceEmission(model);
}

function ensureDemonEyePulse(model) {
  const preset = findCharacterPreset(model?.userData?.bundledModel);
  if (preset?.id !== "demonio-alado-2") return;
  model.userData.eyePulse = {
    enabled: true,
    color: "#ffd21c",
    intensity: 5.5,
    speed: 2.8,
    ...(model.userData.eyePulse || {})
  };
  const existing = model.getObjectByName("DemonEyePulse");
  if (existing) {
    existing.children.filter((child) => child.isMesh).forEach((child) => {
      existing.remove(child);
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    });
    return;
  }
  const head = model.getObjectByName("mixamorig:Head") || model.getObjectByName("headfront");
  if (!head) return;
  const group = new THREE.Group();
  group.name = "DemonEyePulse";
  group.userData.editorHelper = true;
  [-0.038, 0.038].forEach((x, index) => {
    const light = new THREE.PointLight(model.userData.eyePulse.color, 0, 0.8, 2);
    light.name = `DemonEyeGlowLight${index + 1}`;
    light.position.set(x, 0.075, 0.16);
    group.add(light);
  });
  head.add(group);
}

function ensureAngelHalo(model) {
  if (model?.userData?.bundledModel !== "angel") return;
  const head = model.getObjectByName("mixamorigHead") || model.getObjectByName("mixamorig:Head");
  if (!head || head.getObjectByName("AngelHalo")) return;

  const halo = new THREE.Group();
  halo.name = "AngelHalo";
  halo.userData.editorHelper = true;
  halo.position.set(0, 0.23, 0);
  halo.rotation.x = 1.1;

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 160;
  const context = canvas.getContext("2d");
  const glow = context.createRadialGradient(80, 80, 34, 80, 80, 78);
  glow.addColorStop(0, "rgba(255, 241, 190, 0)");
  glow.addColorStop(0.22, "rgba(255, 234, 174, 0.08)");
  glow.addColorStop(0.43, "rgba(255, 225, 145, 0.48)");
  glow.addColorStop(0.65, "rgba(255, 213, 115, 0.18)");
  glow.addColorStop(1, "rgba(255, 205, 110, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 160, 160);
  const glowTexture = new THREE.CanvasTexture(canvas);
  const aura = new THREE.Mesh(
    new THREE.PlaneGeometry(0.68, 0.68),
    new THREE.MeshBasicMaterial({
      map: glowTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false
    })
  );
  aura.name = "AngelHaloGlow";
  aura.userData.editorHelper = true;
  halo.add(aura);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.19, 0.012, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0xfff0c0, toneMapped: false, side: THREE.DoubleSide })
  );
  ring.name = "AngelHaloRing";
  ring.userData.editorHelper = true;
  halo.add(ring);

  const light = new THREE.PointLight(0xffe3a0, 2.2, 2.6, 2);
  light.name = "AngelHaloLight";
  light.userData.editorHelper = true;
  head.add(halo);
  head.add(light);
  light.position.set(0, 0.2, 0.04);
}

function ensureRetroTvScreen(model) {
  if (model?.userData?.bundledStaticModel !== "retro-tv") return null;
  model.userData.tvScreen = {
    scale: [1, 1],
    offset: [0, 0, 0],
    ...(model.userData.tvScreen || {})
  };
  const existing = model.getObjectByName("RetroTvVideoScreen");
  if (existing) {
    existing.scale.set(model.userData.tvScreen.scale[0], model.userData.tvScreen.scale[1], 1);
    if (existing.userData.basePosition) {
      existing.position.fromArray(existing.userData.basePosition).add(new Vector3().fromArray(model.userData.tvScreen.offset));
    }
    return TV_VIDEO_ELEMENTS.get(model) || existing.material?.map?.image || null;
  }
  model.updateWorldMatrix(true, true);
  const inverseRoot = model.matrixWorld.clone().invert();
  const bounds = new Box3().makeEmpty();
  model.traverse((item) => {
    if (!item.isMesh || item.name === "RetroTvVideoScreen") return;
    item.geometry.computeBoundingBox();
    const localMatrix = inverseRoot.clone().multiply(item.matrixWorld);
    bounds.union(item.geometry.boundingBox.clone().applyMatrix4(localMatrix));
  });
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  const video = document.createElement("video");
  video.src = retroTvVideoUrl;
  video.loop = true;
  video.preload = "auto";
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(size.x * 0.57, size.y * 0.38),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, side: THREE.DoubleSide })
  );
  screen.name = "RetroTvVideoScreen";
  screen.position.set(center.x, center.y + size.y * 0.055, bounds.max.z + size.z * 0.008);
  screen.userData.editorHelper = true;
  screen.userData.basePosition = screen.position.toArray();
  screen.scale.set(model.userData.tvScreen.scale[0], model.userData.tvScreen.scale[1], 1);
  screen.position.add(new Vector3().fromArray(model.userData.tvScreen.offset));
  model.add(screen);
  TV_VIDEO_ELEMENTS.set(model, video);
  return video;
}
const CHARACTER_MODELS = [
  { id: "breathe-look", character: "Neoncruzader", animation: "Base", name: "Neoncruzader - Base", order: 0, url: neonboyModelUrl },
  ...Object.entries(NEONBOY_ANIMATION_URLS).filter(([path]) => !CHARACTER_ASSET_FILES.has(path.split("/").pop())).map(([path, loadUrl]) => {
    const filename = path.split("/").pop().replace(/\.glb$/i, "");
    const metadata = CHARACTER_ANIMATION_NAMES[filename] || {
      character: filename.startsWith("neon-") ? "Neonboy" : "Neoncruzader",
      animation: filename.replace(/^Meshy_AI_Midnight_Jester_/i, "").replace(/^neon-/i, "").replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      order: 99
    };
    return { id: filename, ...metadata, name: `${metadata.character} - ${metadata.animation}`, loadUrl };
  })
].sort((left, right) => left.order - right.order);
const findCharacterPreset = (id) => CHARACTER_MODELS.find((entry) => entry.id === id || entry.legacyIds?.includes(id));
const STATIC_MODELS = [
  { id: "neonboy-logo", name: "Logo Neonboy", url: neonboyLogoModelUrl },
  { id: "disk", name: "Disco", create: createDiskPlane },
  { id: "guitar", name: "Guitarra", loadUrl: GUITAR_MODEL_LOADER },
  { id: "professor-guitar", name: "Guitarra Profe", loadUrl: PROFESSOR_GUITAR_MODEL_LOADER },
  { id: "demon-guitar", name: "Guitarra Demon", loadUrl: DEMON_GUITAR_MODEL_LOADER },
  { id: "zombie-guitar", name: "Guitarra Zombie", loadUrl: ZOMBIE_GUITAR_MODEL_LOADER },
  { id: "drumstick", name: "Palillo de bateria", loadUrl: DRUMSTICKS_MODEL_LOADER },
  { id: "drumkit", name: "Bateria", loadUrl: DRUMKIT_MODEL_LOADER },
  { id: "edificio", name: "Edificio optimizado", loadUrl: BUILDING_MODEL_LOADER },
  { id: "mesa-tv", name: "Mesa TV", loadUrl: TV_TABLE_MODEL_LOADER },
  { id: "retro-tv", name: "Retro TV con video", loadUrl: RETRO_TV_MODEL_LOADER },
  { id: "silla", name: "Silla", loadUrl: CHAIR_MODEL_LOADER },
  { id: "altar", name: "Altar", loadUrl: ALTAR_MODEL_LOADER },
  { id: "banco", name: "Banco de iglesia", loadUrl: BENCH_MODEL_LOADER },
  ...Object.entries(STATIC_MODEL_URLS).filter(([path]) => {
    const filename = path.split("/").pop().replace(/\.glb$/i, "");
    return filename.endsWith(".optimized") || !OPTIMIZED_STATIC_MODEL_IDS.has(filename);
  }).map(([path, loadUrl]) => {
    const filename = path.split("/").pop().replace(/\.optimized\.glb$/i, "").replace(/\.glb$/i, "");
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
  fog: DEFAULT_CHURCH_FOG,
  fire: { enabled: false, intensity: 0.6 },
  rain: DEFAULT_RAIN,
  particles: { enabled: false, intensity: 0.5, color: "#d875ff" },
  storm: DEFAULT_STORM,
  magic: DEFAULT_MAGIC_SETTINGS,
  churchLighting: DEFAULT_CHURCH_LIGHTING,
  cemeteryLighting: DEFAULT_CEMETERY_LIGHTING,
  castleLighting: DEFAULT_CASTLE_LIGHTING,
  gothicLighting: DEFAULT_GOTHIC_LIGHTING,
  space: DEFAULT_SPACE_SETTINGS,
  apocalypseLighting: DEFAULT_APOCALYPSE_LIGHTING,
  apocalypseFires: DEFAULT_APOCALYPSE_FIRES
};
const ENVIRONMENT_BACKGROUNDS = [
  { id: "solid", name: "Color", image: "" },
  { id: "field", name: "Campo", image: fieldPanorama },
  { id: "clouds", name: "Nubes", image: cloudsPanorama },
  { id: "factory", name: "Fabrica", image: factoryPanorama }
];
const SKY_BACKGROUNDS = [
  { id: "sky-clouds", name: "Nubes", image: cloudsPanorama, ambient: 1.05, exposure: 1.02, key: 2.1, light: "#e8f2ff", ground: "#8ba0ba", environment: 0.8 },
  { id: "sky-space", name: "Espacio", image: skySpace, ambient: 0.5, exposure: 1.14, key: 1.2, light: "#b7d9e2", ground: "#14212b", environment: 0.72, backgroundIntensity: 1.06 },
  { id: "sky-sun", name: "Sol", image: skySun, ambient: 0.85, exposure: 1.08, key: 4.2, light: "#fff1c4", ground: "#7e91a4", environment: 0.85 },
  { id: "sky-night", name: "Noche", image: skyNight, ambient: 0.16, exposure: 1.2, key: 0.32, light: "#9cbcff", ground: "#050914", environment: 0.7 },
  { id: "sky-day", name: "Dia", image: skyDay, ambient: 1, exposure: 1, key: 2.6, light: "#fff8e8", ground: "#7892a6", environment: 0.82 },
  { id: "sky-sunset", name: "Atardecer", image: skySunset, ambient: 0.48, exposure: 1.13, key: 2.4, light: "#ffad66", ground: "#50345e", environment: 0.9 },
  { id: "sky-infernal", name: "Infernal", image: skyInfernal, ambient: 0.42, exposure: 1.18, key: 3.8, light: "#ff4a1c", ground: "#180302", environment: 0.85 },
  { id: "sky-apocalypse", name: "Apocalipsis", image: skyApocalypse, ambient: 0.5, exposure: 1.05, key: 2.3, light: "#ffb06a", ground: "#302a28", environment: 0.72 },
  { id: "sky-cemetery", name: "Cementerio", image: skyCemetery, ambient: 0.72, exposure: 1.18, key: 1.9, light: "#b8cadd", ground: "#354139", environment: 0.76, backgroundIntensity: 0.86 },
  { id: "sky-medieval-apocalypse", name: "Medieval", image: skyMedievalApocalypse, ambient: 0.5, exposure: 1.06, key: 2.35, light: "#ffab79", ground: "#292321", environment: 0.68 },
  { id: "sky-gothic-church", name: "Iglesia", image: skyGothicChurch, ambient: 0.68, exposure: 1.09, key: 1.9, light: "#c5d3e6", ground: "#302a2c", environment: 0.68, backgroundIntensity: 0.94 },
  { id: "sky-night-swamp", name: "Pantano", image: skyNightSwamp, ambient: 0.55, exposure: 1.38, key: 1.2, light: "#a6c4cd", ground: "#273329", environment: 0.6 },
  { id: "sky-ruined-gothic-church", name: "Iglesia en ruinas", image: skyRuinedGothicChurch, ambient: 0.38, exposure: 1.06, key: 1.2, light: "#9bbcff", ground: "#100d18", environment: 0.72, backgroundIntensity: 0.68, backgroundRotationX: 0 },
  { id: "sky-castle-interior", name: "Interior castillo", image: skyCastleInterior, ambient: 0.56, exposure: 1.08, key: 1.75, light: "#c6d8e8", ground: "#312921", environment: 0.56, backgroundIntensity: 0.88 },
  { id: "sky-space-ship", name: "Space Ship", image: skySpace, ambient: 0.48, exposure: 1.1, key: 1.45, light: "#e1e3d4", ground: "#252924", environment: 0.52, backgroundIntensity: 0.045 },
  { id: "sky-medieval-village", name: "Aldea medieval", image: skyMedievalVillage, ambient: 0.66, exposure: 1.08, key: 1.85, light: "#ffd8a3", ground: "#4a4640", environment: 0.82 },
  { id: "sky-moonlit-peaks", name: "Cumbres luna llena", image: skyMoonlitPeaks, ambient: 0.48, exposure: 1.12, key: 1.85, light: "#a9c8e0", ground: "#17232a", environment: 0.64 },
  { id: "sky-spiderweb-ruins", name: "Ruinas de telaranas", image: skySpiderwebRuins, ambient: 0.2, exposure: 1.24, key: 1.15, light: "#bed5f2", ground: "#0c1115", environment: 0.88 }
];

function environmentThumbnail(preset) {
  if (preset.id === "sky-space-ship") return spaceShipPreview;
  if (preset.id === "sky-gothic-church") return skyGothicChurch;
  if (preset.id === "sky-ruined-gothic-church") return skyRuinedGothicChurch;
  if (preset.id === "sky-castle-interior") return skyCastleInterior;
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
  { id: "castle-interior", name: "Interior castillo", sky: "sky-castle-interior", floor: "castle-stone", image: skyCastleInterior },
  { id: "space-ship", name: "Space Ship", sky: "sky-space-ship", floor: "ship-deck", image: skySpace },
  { id: "medieval-village", name: "Aldea medieval", sky: "sky-medieval-village", floor: "medieval-apocalypse", image: skyMedievalVillage },
  { id: "moonlit-peaks", name: "Cumbres luna llena", sky: "sky-moonlit-peaks", floor: "moonlit-peaks", image: skyMoonlitPeaks },
  { id: "spiderweb-ruins", name: "Ruinas de telaranas", sky: "sky-spiderweb-ruins", floor: "night-swamp", image: skySpiderwebRuins }
];
const FLOOR_SURFACES = [
  { id: "shadow", name: "Solo sombra", color: "#20242a" },
  { id: "grass", name: "Pasto", color: "#4f7f32" },
  { id: "metal", name: "Metal", color: "#87929a" },
  { id: "ship-deck", name: "Cubierta nave", color: "#52636a" },
  { id: "dirt", name: "Tierra", color: "#79543a" },
  { id: "plastic", name: "Plastico", color: "#59636f" },
  { id: "concrete", name: "Cemento", color: "#777a78" },
  { id: "tiles", name: "Ceramicos", color: "#d8dde0" },
  { id: "glass", name: "Vidrio", color: "#bdefff" },
  { id: "fantasy", name: "Fantasia", color: "#b54cff" },
  { id: "space-nebula", name: "Nebulosa", color: "#d9e0e2" },
  { id: "gas", name: "Gases", color: "#5442d6" },
  { id: "water", name: "Agua", color: "#34c4e8" },
  { id: "infernal", name: "Lava", color: "#ff3b0a" },
  { id: "apocalypse", name: "Ruinas", color: "#aca49a" },
  { id: "cemetery", name: "Cementerio", color: "#c0b9a6" },
  { id: "medieval-apocalypse", name: "Medieval", color: "#ada69d" },
  { id: "gothic-church", name: "Iglesia", color: "#d1cac1" },
  { id: "castle-stone", name: "Castillo", color: "#bcb7ad" },
  { id: "night-swamp", name: "Pantano", color: "#f1eee2" },
  { id: "moonlit-peaks", name: "Cumbres luna llena", color: "#b6c1c7" },
  { id: "ruined-gothic-church", name: "Iglesia en ruinas", color: "#34343e" }
];
function defaultFloorColor(surface) {
  return FLOOR_SURFACES.find((preset) => preset.id === surface)?.color || "#59636f";
}
function ruinedChurchFloorTint(color) {
  return new Color(color).lerp(new Color("#92969c"), 0.65);
}
function infernalFloorTint(color) {
  return new Color(color).lerp(new Color("#d7cfc6"), 0.86);
}
const REALISTIC_FLOOR_TEXTURES = {
  grass: grassTexture,
  dirt: dirtTexture,
  metal: brushedMetalTexture,
  "ship-deck": brushedMetalTexture,
  concrete: concreteTexture,
  tiles: ceramicTilesTexture,
  plastic: plasticTexture,
  fantasy: fantasyFloorTexture,
  gas: gasFloorTexture,
  water: waterFloorTexture,
  infernal: infernalFloorTexture,
  apocalypse: apocalypseSoilTexture,
  cemetery: cemeteryFloorTexture,
  "medieval-apocalypse": medievalApocalypseFloorTexture,
  "gothic-church": gothicChurchFloorTexture,
  "castle-stone": castleStoneTexture,
  "night-swamp": nightSwampFloorTexture,
  "moonlit-peaks": moonlitPeaksGroundTexture,
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
    const texture = new THREE.TextureLoader().load(surface === "ruined-gothic-church" ? concreteTexture : REALISTIC_FLOOR_TEXTURES[surface]);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    const repeats = { grass: 14, dirt: 12, metal: 8, "ship-deck": 22, concrete: 10, tiles: 8, plastic: 12, fantasy: 7, gas: 5, water: 10, infernal: 16, apocalypse: 42, cemetery: 36, "medieval-apocalypse": 26, "gothic-church": 52, "castle-stone": 48, "night-swamp": 38, "moonlit-peaks": 54, "ruined-gothic-church": 16 };
    texture.repeat.set(repeats[surface], repeats[surface]);
    if (surface === "ruined-gothic-church") texture.repeat.set(392, 392);
    texture.anisotropy = ["ruined-gothic-church", "apocalypse", "cemetery", "castle-stone", "gothic-church", "night-swamp", "medieval-apocalypse", "moonlit-peaks"].includes(surface) ? 16 : 8;
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
  if (surface === "space-nebula") return createNebulaFloorMaterial(color);
  const map = createFloorTexture(surface);
  const settings = {
    grass: { color, roughness: 1, metalness: 0 },
    metal: { color, roughness: 0.28, metalness: 0.9 },
    "ship-deck": { color, roughness: 0.42, metalness: 0.7 },
    dirt: { color, roughness: 1, metalness: 0 },
    concrete: { color, roughness: 0.88, metalness: 0 },
    tiles: { color, roughness: 0.24, metalness: 0.05 },
    plastic: { color, roughness: 0.32, metalness: 0.04 }
  }[surface];
  if (surface === "glass") return new THREE.MeshPhysicalMaterial({ color, roughness: 0.08, metalness: 0, transmission: 0.72, opacity: 0.48, transparent: true, side: THREE.DoubleSide });
  if (surface === "fantasy") return new THREE.MeshPhysicalMaterial({
    color, map, bumpMap: map, bumpScale: 0.035, roughness: 0.18, metalness: 0.12,
    clearcoat: 0.72, clearcoatRoughness: 0.08, iridescence: 0.78, iridescenceIOR: 1.3
  });
  if (surface === "gas") return new THREE.MeshPhysicalMaterial({
    color, map, emissiveMap: map, emissive: 0x171050, emissiveIntensity: 0.42,
    roughness: 0.48, metalness: 0, transparent: true, opacity: 0.9, side: THREE.DoubleSide
  });
  if (surface === "water") return new THREE.MeshPhysicalMaterial({
    color, map, bumpMap: map, bumpScale: 0.065, roughness: 0.055, metalness: 0,
    transmission: 0.62, transparent: true, opacity: 0.82, ior: 1.333, thickness: 0.5,
    clearcoat: 1, clearcoatRoughness: 0.035, side: THREE.DoubleSide
  });
  if (surface === "infernal") {
    const material = new THREE.MeshStandardMaterial({
      color: infernalFloorTint(color), map, bumpMap: map, bumpScale: 0.13,
      displacementMap: map, displacementScale: 0.2, displacementBias: -0.075,
      roughness: 0.94, metalness: 0
    });
    material.userData.lavaTime = 0;
    material.userData.lavaContacts = Array.from({ length: 6 }, () => new THREE.Vector2(10000, 10000));
    material.userData.lavaContactCount = 0;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uLavaTime = { value: material.userData.lavaTime };
      shader.uniforms.uLavaContacts = { value: material.userData.lavaContacts };
      shader.uniforms.uLavaContactCount = { value: material.userData.lavaContactCount };
      shader.vertexShader = shader.vertexShader.replace("#include <common>", `
        #include <common>
        uniform float uLavaTime;
        uniform vec2 uLavaContacts[6];
        uniform int uLavaContactCount;
        varying float vLavaBoil;
        varying float vLavaContact;
        float lavaHash(vec2 point) {
          return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
        }
      `).replace("#include <displacementmap_vertex>", `
        #ifdef USE_DISPLACEMENTMAP
          vec2 lavaTexel = vec2(0.0045);
          float lavaHeight = texture2D(displacementMap, vDisplacementMapUv).x * 4.0;
          lavaHeight += texture2D(displacementMap, vDisplacementMapUv + vec2(lavaTexel.x, 0.0)).x * 2.0;
          lavaHeight += texture2D(displacementMap, vDisplacementMapUv - vec2(lavaTexel.x, 0.0)).x * 2.0;
          lavaHeight += texture2D(displacementMap, vDisplacementMapUv + vec2(0.0, lavaTexel.y)).x * 2.0;
          lavaHeight += texture2D(displacementMap, vDisplacementMapUv - vec2(0.0, lavaTexel.y)).x * 2.0;
          lavaHeight += texture2D(displacementMap, vDisplacementMapUv + lavaTexel).x;
          lavaHeight += texture2D(displacementMap, vDisplacementMapUv - lavaTexel).x;
          lavaHeight += texture2D(displacementMap, vDisplacementMapUv + vec2(lavaTexel.x, -lavaTexel.y)).x;
          lavaHeight += texture2D(displacementMap, vDisplacementMapUv + vec2(-lavaTexel.x, lavaTexel.y)).x;
          lavaHeight /= 16.0;
          transformed += normalize(objectNormal) * (lavaHeight * displacementScale + displacementBias);
        #endif
        vec2 lavaCell = floor(position.xy / 15.0);
        vec2 lavaRandom = vec2(lavaHash(lavaCell), lavaHash(lavaCell + 19.31));
        vec2 lavaCenter = (lavaCell + 0.18 + lavaRandom * 0.64) * 15.0;
        float lavaPhase = fract(uLavaTime * mix(0.095, 0.16, lavaRandom.x) + lavaHash(lavaCell + 7.7));
        float lavaLife = pow(max(0.0, sin(lavaPhase * PI)), 3.0);
        float lavaRadius = mix(2.8, 5.2, lavaRandom.y);
        float lavaDistance = distance(position.xy, lavaCenter);
        float lavaDome = pow(smoothstep(lavaRadius, 0.0, lavaDistance), 1.3) * lavaLife;
        float lavaRing = smoothstep(0.28, 0.0, abs(lavaDistance - lavaRadius * (0.72 + lavaPhase * 0.24))) * lavaLife;
        float lavaWave = sin(position.x * 0.16 + uLavaTime * 0.82)
          * cos(position.y * 0.11 - uLavaTime * 0.58) * 0.04;
        transformed.z += lavaWave + lavaDome * 0.34 + lavaRing * 0.035;
        float lavaContact = 0.0;
        float lavaContactRim = 0.0;
        for (int contactIndex = 0; contactIndex < 6; contactIndex++) {
          if (contactIndex >= uLavaContactCount) break;
          float contactDistance = distance(position.xy, uLavaContacts[contactIndex]);
          lavaContact = max(lavaContact, smoothstep(1.8, 0.0, contactDistance));
          lavaContactRim = max(lavaContactRim, smoothstep(0.3, 0.0, abs(contactDistance - 1.48)));
        }
        transformed.z += lavaContactRim * 0.085 - lavaContact * 0.11;
        vLavaBoil = clamp(lavaDome + lavaRing * 0.45, 0.0, 1.0);
        vLavaContact = max(lavaContact * 0.4, lavaContactRim);
      `);
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `
        #include <common>
        uniform float uLavaTime;
        varying float vLavaBoil;
        varying float vLavaContact;
        float lavaCrustMask = 0.0;
        float lavaFissureHeat = 0.0;
        float lavaCrustHash(vec2 point) {
          return fract(sin(dot(point, vec2(41.73, 289.11))) * 45758.5453);
        }
        float lavaCrustNoise(vec2 point) {
          vec2 cell = floor(point);
          vec2 fraction = fract(point);
          fraction = fraction * fraction * (3.0 - 2.0 * fraction);
          return mix(
            mix(lavaCrustHash(cell), lavaCrustHash(cell + vec2(1.0, 0.0)), fraction.x),
            mix(lavaCrustHash(cell + vec2(0.0, 1.0)), lavaCrustHash(cell + 1.0), fraction.x),
            fraction.y
          );
        }
      `).replace("#include <map_fragment>", `
        #include <map_fragment>
        #ifdef USE_MAP
          vec2 crustUv = vMapUv * 5.2 + vec2(uLavaTime * 0.008, -uLavaTime * 0.004);
          float crustLarge = lavaCrustNoise(crustUv) * 0.68 + lavaCrustNoise(crustUv * 2.17 + 13.7) * 0.32;
          float crustBreak = abs(lavaCrustNoise(crustUv * 3.6 - uLavaTime * 0.012) - 0.5) * 2.0;
          lavaCrustMask = smoothstep(0.54, 0.7, crustLarge) * smoothstep(0.12, 0.36, crustBreak);
          vec3 lavaTexel = texture2D(map, vMapUv).rgb;
          lavaFissureHeat = smoothstep(0.14, 0.66, lavaTexel.r - lavaTexel.g * 0.62);
          float slowPulse = 0.77 + 0.23 * lavaCrustNoise(vMapUv * 51.0 - vec2(uLavaTime * 0.09, uLavaTime * 0.04));
          lavaFissureHeat *= slowPulse * (1.0 - lavaCrustMask * 0.8);
          diffuseColor.rgb = mix(diffuseColor.rgb * 0.58, vec3(0.17, 0.016, 0.003), lavaFissureHeat * 0.42);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.025, 0.018, 0.015), lavaCrustMask * 0.76);
        #endif
      `).replace("#include <emissivemap_fragment>", `
        #include <emissivemap_fragment>
        totalEmissiveRadiance += vec3(1.0, 0.115, 0.012) * lavaFissureHeat * 0.78;
        totalEmissiveRadiance += vec3(0.73, 0.065, 0.006) * vLavaBoil * 0.42;
        totalEmissiveRadiance += vec3(0.82, 0.08, 0.008) * vLavaContact * 0.52;
      `);
      material.userData.lavaShader = shader;
    };
    material.customProgramCacheKey = () => "infernal-floor-fissures-v4";
    return material;
  }
  if (surface === "apocalypse") return new THREE.MeshLambertMaterial({ color, map, bumpMap: map, bumpScale: 0.105 });
  if (surface === "cemetery") return new THREE.MeshLambertMaterial({ color, map, bumpMap: map, bumpScale: 0.05 });
  if (surface === "medieval-apocalypse") return new THREE.MeshLambertMaterial({ color, map, bumpMap: map, bumpScale: 0.07 });
  if (surface === "gothic-church") return new THREE.MeshLambertMaterial({ color, map, bumpMap: map, bumpScale: 0.06 });
  if (surface === "castle-stone") return new THREE.MeshLambertMaterial({ color, map, bumpMap: map, bumpScale: 0.08 });
  if (surface === "night-swamp") return new THREE.MeshLambertMaterial({ color, map, bumpMap: map, bumpScale: 0.085,
    emissive: 0x171c16, emissiveIntensity: 0.42 });
  if (surface === "moonlit-peaks") return new THREE.MeshLambertMaterial({ color, map, bumpMap: map, bumpScale: 0.075 });
  if (surface === "ruined-gothic-church") return createRuinedChurchBedMaterial(map, ruinedChurchFloorTint(color));
  if (surface === "plastic") return new THREE.MeshStandardMaterial({ ...settings, map: null, bumpMap: map, bumpScale: 0.018 });
  const relief = ["grass", "dirt", "metal", "concrete", "tiles"].includes(surface);
  const bumpScale = { grass: 0.035, dirt: 0.06, metal: 0.012, concrete: 0.035, tiles: 0.025 }[surface] || 0;
  return new THREE.MeshStandardMaterial({ ...settings, map, bumpMap: relief ? map : null, bumpScale });
}


function createProceduralGrass(maxBlades = 1800000, fieldSize = 120, distantFieldSize = 280) {
  const positions = [
    -0.5, 0, 0,
    0.5, 0, 0,
    0.08, 1, 0
  ];

  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const offsets = new Float32Array(maxBlades * 3);
  const scales = new Float32Array(maxBlades * 2);
  const rotations = new Float32Array(maxBlades);
  const phases = new Float32Array(maxBlades);
  const shades = new Float32Array(maxBlades);
  let seed = 7411;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const distantRatio = 0.28;
  const distantInnerHalfSize = fieldSize * 0.38;
  const gridSize = Math.ceil(Math.sqrt(maxBlades));
  const cells = new Uint32Array(maxBlades);
  for (let index = 0; index < maxBlades; index += 1) cells[index] = index;
  for (let index = maxBlades - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const cell = cells[index];
    cells[index] = cells[swapIndex];
    cells[swapIndex] = cell;
  }
  for (let index = 0; index < maxBlades; index += 1) {
    const cell = cells[index];
    const column = cell % gridSize;
    const row = Math.floor(cell / gridSize);
    const distant = random() < distantRatio;
    let offsetX = ((column + random()) / gridSize - 0.5) * fieldSize;
    let offsetZ = ((row + random()) / gridSize - 0.5) * fieldSize;
    if (distant) {
      do {
        offsetX = (random() - 0.5) * distantFieldSize;
        offsetZ = (random() - 0.5) * distantFieldSize;
      } while (Math.abs(offsetX) <= distantInnerHalfSize && Math.abs(offsetZ) <= distantInnerHalfSize);
    }
    offsets[index * 3] = offsetX;
    offsets[index * 3 + 1] = random() * 0.018;
    offsets[index * 3 + 2] = offsetZ;
    scales[index * 2] = (distant ? 0.022 : 0.014) + random() * (distant ? 0.02 : 0.016);
    scales[index * 2 + 1] = (distant ? 0.95 : 0.7) + random() * (distant ? 0.55 : 0.62);
    rotations[index] = random() * Math.PI;
    phases[index] = random() * Math.PI * 2;
    shades[index] = random();
  }
  geometry.setAttribute("instanceOffset", new THREE.InstancedBufferAttribute(offsets, 3));
  geometry.setAttribute("instanceScale", new THREE.InstancedBufferAttribute(scales, 2));
  geometry.setAttribute("instanceRotation", new THREE.InstancedBufferAttribute(rotations, 1));
  geometry.setAttribute("instancePhase", new THREE.InstancedBufferAttribute(phases, 1));
  geometry.setAttribute("instanceShade", new THREE.InstancedBufferAttribute(shades, 1));
  geometry.instanceCount = Math.round(maxBlades * DEFAULT_GRASS_SETTINGS.density);
  geometry.boundingSphere = new THREE.Sphere(new Vector3(0, 0.5, 0), distantFieldSize * 0.72);

  const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    lights: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, {
      uTime: { value: 0 },
      uHeight: { value: DEFAULT_GRASS_SETTINGS.height },
      uWidthScale: { value: 1 },
      uWindStrength: { value: DEFAULT_GRASS_SETTINGS.windStrength },
      uWindSpeed: { value: DEFAULT_GRASS_SETTINGS.windSpeed },
      uBaseColor: { value: new Color("#244526") },
      uTipColor: { value: new Color("#638746") },
      uLightColor: { value: new Color("#fff3d4") },
      uAmbient: { value: 0.72 },
      uInteractor: { value: new Vector3(10000, 0, 10000) },
      uFadeStart: { value: distantFieldSize * 0.4 },
      uFadeEnd: { value: distantFieldSize * 0.58 }
    }]),
    vertexShader: `
      #include <common>
      #include <shadowmap_pars_vertex>
      attribute vec3 instanceOffset;
      attribute vec2 instanceScale;
      attribute float instanceRotation;
      attribute float instancePhase;
      attribute float instanceShade;
      uniform float uTime;
      uniform float uHeight;
      uniform float uWidthScale;
      uniform float uWindStrength;
      uniform float uWindSpeed;
      uniform vec3 uInteractor;
      varying float vHeight;
      varying float vShade;
      varying float vDistance;
      void main() {
        float c = cos(instanceRotation);
        float s = sin(instanceRotation);
        vec3 blade = vec3(position.x * instanceScale.x * uWidthScale, position.y * instanceScale.y * uHeight, position.z * instanceScale.x * uWidthScale);
        blade.xz = mat2(c, -s, s, c) * blade.xz;
        float heightFactor = position.y * position.y;
        float region = instanceOffset.x * 0.12 + instanceOffset.z * 0.09;
        float gust = 0.55 + 0.45 * sin(uTime * uWindSpeed * 0.43 + region * 0.35);
        float wave = sin(uTime * uWindSpeed * 1.85 + region + instancePhase);
        float turbulence = sin(uTime * uWindSpeed * 2.7 - region * 0.63 + instancePhase * 1.7);
        blade.x += sin(instancePhase) * 0.045 * heightFactor;
        blade.z += cos(instancePhase * 1.37) * 0.035 * heightFactor;
        blade.x += (wave * 0.22 + turbulence * 0.055) * uWindStrength * gust * heightFactor;
        blade.z += (wave * 0.11 - turbulence * 0.035) * uWindStrength * gust * heightFactor;
        vec4 worldBase = modelMatrix * vec4(instanceOffset, 1.0);
        vec2 interactionDelta = worldBase.xz - uInteractor.xz;
        float interactionDistance = length(interactionDelta);
        float interaction = 1.0 - smoothstep(0.2, 0.9, interactionDistance);
        blade.xz += interactionDelta / max(interactionDistance, 0.08) * interaction * heightFactor * 0.16;
        vec4 worldPosition = modelMatrix * vec4(blade + instanceOffset, 1.0);
        vHeight = position.y;
        vShade = instanceShade;
        vDistance = distance(worldPosition.xz, cameraPosition.xz);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
        #include <shadowmap_vertex>
      }
    `,
    fragmentShader: `
      #include <common>
      #include <bsdfs>
      #include <lights_pars_begin>
      #include <shadowmap_pars_fragment>
      #include <shadowmask_pars_fragment>
      uniform vec3 uBaseColor;
      uniform vec3 uTipColor;
      uniform vec3 uLightColor;
      uniform float uAmbient;
      uniform float uFadeStart;
      uniform float uFadeEnd;
      varying float vHeight;
      varying float vShade;
      varying float vDistance;
      float hash(vec2 point) { return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        float fade = 1.0 - smoothstep(uFadeStart, uFadeEnd, vDistance);
        if (fade <= 0.0 || hash(gl_FragCoord.xy) > fade) discard;
        vec3 color = mix(uBaseColor, uTipColor, smoothstep(0.0, 1.0, vHeight));
        color *= mix(0.76, 1.16, vShade) * uLightColor * uAmbient;
        color *= mix(0.32, 1.0, getShadowMask());
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const grass = new THREE.Mesh(geometry, material);
  grass.name = "Pasto procedural";
  grass.userData.maxBlades = maxBlades;
  grass.userData.fieldSize = distantFieldSize;
  grass.receiveShadow = true;
  grass.frustumCulled = true;
  grass.renderOrder = 1;
  return grass;
}

function createRealisticSkyDome() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uCloudCover: { value: DEFAULT_REALISTIC_SKY.cloudCover },
      uCloudAmount: { value: DEFAULT_REALISTIC_SKY.cloudAmount },
      uCloudSpeed: { value: DEFAULT_REALISTIC_SKY.cloudSpeed },
      uSunDirection: { value: new Vector3(0.4, 0.55, 0.72).normalize() },
      uSunIntensity: { value: DEFAULT_REALISTIC_SKY.sunIntensity },
      uZenithColor: { value: new Color("#034f9a") },
      uHorizonColor: { value: new Color("#5595c3") },
      uSunColor: { value: new Color("#fff1c7") }
    },
    vertexShader: `
      varying vec3 vSkyDirection;
      void main() {
        vSkyDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uCloudCover;
      uniform float uCloudAmount;
      uniform float uCloudSpeed;
      uniform vec3 uSunDirection;
      uniform float uSunIntensity;
      uniform vec3 uZenithColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uSunColor;
      varying vec3 vSkyDirection;

      float hash(vec2 point) {
        point = fract(point * vec2(123.34, 456.21));
        point += dot(point, point + 45.32);
        return fract(point.x * point.y);
      }
      float noise(vec2 point) {
        vec2 cell = floor(point);
        vec2 local = fract(point);
        local = local * local * (3.0 - 2.0 * local);
        float a = hash(cell);
        float b = hash(cell + vec2(1.0, 0.0));
        float c = hash(cell + vec2(0.0, 1.0));
        float d = hash(cell + vec2(1.0, 1.0));
        return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
      }
      float fbm(vec2 point) {
        float value = 0.0;
        float amplitude = 0.52;
        mat2 rotation = mat2(0.82, -0.57, 0.57, 0.82);
        for (int octave = 0; octave < 5; octave++) {
          value += noise(point) * amplitude;
          point = rotation * point * 2.03 + 11.7;
          amplitude *= 0.5;
        }
        return value;
      }
      void main() {
        vec3 direction = normalize(vSkyDirection);
        float elevation = clamp(direction.y, 0.0, 1.0);
        float horizon = pow(1.0 - elevation, 3.2);
        vec3 sky = mix(uHorizonColor, uZenithColor, smoothstep(-0.03, 0.82, direction.y));
        sky = mix(sky, vec3(0.92, 0.72, 0.5), horizon * 0.08);
        float broadNoise = fbm(direction.xz * 2.6 + vec2(8.4, 3.1));
        float directionalBlue = 0.5 + 0.5 * sin(atan(direction.z, direction.x) * 2.0 + 0.8);
        float deepBluePatch = smoothstep(0.36, 0.68, broadNoise * 0.58 + directionalBlue * 0.42);
        sky = mix(sky, vec3(0.008, 0.12, 0.34), deepBluePatch * (0.25 + elevation * 0.25));

        float sunDot = max(dot(direction, uSunDirection), 0.0);
        float sunDisc = smoothstep(0.99948, 0.99982, sunDot);
        float innerGlow = pow(sunDot, 180.0);
        float outerGlow = pow(sunDot, 18.0) * 0.14;
        sky += uSunColor * (innerGlow * 0.75 + outerGlow) * uSunIntensity * 0.32;
        sky = mix(sky, uSunColor * (2.1 + uSunIntensity * 0.24), sunDisc);

        float cloudHorizon = smoothstep(0.015, 0.14, direction.y);
        vec2 perspective = direction.xz / max(direction.y + 0.24, 0.08);
        vec2 wind = vec2(uTime * uCloudSpeed * 0.032, uTime * uCloudSpeed * 0.011);
        float broad = fbm(perspective * 0.62 + wind);
        float detail = fbm(perspective * 1.72 - wind * 0.57 + 19.4);
        float formation = broad * 0.76 + detail * 0.24;
        float clouds = smoothstep(uCloudCover, uCloudCover + 0.16, formation) * cloudHorizon;
        float wisps = smoothstep(0.62, 0.82, fbm(perspective * 3.4 + wind * 1.8 + 37.0));
        clouds = clamp(clouds + wisps * 0.16 * cloudHorizon, 0.0, 1.0) * uCloudAmount;

        float cloudLight = clamp(0.52 + formation * 0.72 + pow(sunDot, 8.0) * 0.28, 0.0, 1.25);
        vec3 cloudShadow = mix(vec3(0.50, 0.58, 0.63), vec3(0.72, 0.76, 0.77), elevation);
        vec3 cloudBright = mix(vec3(0.92, 0.94, 0.93), uSunColor, pow(sunDot, 5.0) * 0.34);
        vec3 cloudColor = mix(cloudShadow, cloudBright, cloudLight);
        float silverLining = smoothstep(0.50, 0.72, formation) * (1.0 - smoothstep(0.72, 0.9, formation)) * pow(sunDot, 10.0);
        cloudColor += uSunColor * silverLining * 0.45;
        vec3 color = mix(sky, cloudColor, clouds * 0.9);
        color = mix(color, uHorizonColor, horizon * 0.18);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(460, 64, 32), material);
  dome.name = "Cielo atmosferico";
  dome.frustumCulled = false;
  dome.renderOrder = -1000;
  return dome;
}

function createParticleTexture(type) {
  const canvas = document.createElement("canvas");
  const textureSize = type === "fog" ? 128 : 64;
  canvas.width = canvas.height = textureSize;
  const context = canvas.getContext("2d");
  if (type === "fire") {
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
  } else if (type === "fog") {
    let seed = 7261;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    context.globalCompositeOperation = "lighter";
    for (let index = 0; index < 30; index += 1) {
      const x = 12 + random() * 104;
      const y = 42 + random() * 45;
      const radiusX = 16 + random() * 30;
      const radiusY = 4 + random() * 10;
      const gradient = context.createRadialGradient(x, y, 0, x, y, radiusX);
      gradient.addColorStop(0, `rgba(255,255,255,${0.035 + random() * 0.055})`);
      gradient.addColorStop(0.48, `rgba(255,255,255,${0.018 + random() * 0.035})`);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.save();
      context.translate(x, y);
      context.scale(1, radiusY / radiusX);
      context.translate(-x, -y);
      context.fillStyle = gradient;
      context.fillRect(x - radiusX, y - radiusX, radiusX * 2, radiusX * 2);
      context.restore();
    }
    context.globalCompositeOperation = "destination-out";
    for (let index = 0; index < 12; index += 1) {
      const x = 18 + random() * 92;
      const y = 42 + random() * 48;
      const radius = 5 + random() * 13;
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(0,0,0,${0.12 + random() * 0.18})`);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = gradient;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
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

function createVolcanicSmokeTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  let seed = 4817;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  // Many soft, offset puffs form a broken silhouette instead of a circular sprite.
  context.globalCompositeOperation = "lighter";
  for (let index = 0; index < 34; index += 1) {
    const vertical = random();
    const x = 64 + (random() - 0.5) * (30 + vertical * 26);
    const y = 103 - vertical * 83 + (random() - 0.5) * 15;
    const radiusX = 9 + random() * 21 + vertical * 7;
    const radiusY = radiusX * (0.62 + random() * 0.72);
    const gradient = context.createRadialGradient(x, y, 0, x, y, Math.max(radiusX, radiusY));
    gradient.addColorStop(0, `rgba(255,255,255,${0.1 + random() * 0.13})`);
    gradient.addColorStop(0.42, `rgba(255,255,255,${0.055 + random() * 0.07})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.save();
    context.translate(x, y);
    context.scale(1, radiusY / radiusX);
    context.translate(-x, -y);
    context.fillStyle = gradient;
    context.fillRect(x - radiusX, y - radiusX, radiusX * 2, radiusX * 2);
    context.restore();
  }

  // Transparent pockets keep overlapping particles fibrous and smoky.
  context.globalCompositeOperation = "destination-out";
  for (let index = 0; index < 13; index += 1) {
    const x = 30 + random() * 68;
    const y = 20 + random() * 88;
    const radius = 5 + random() * 14;
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(0,0,0,${0.1 + random() * 0.18})`);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
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
      const horizontalSpread = type === "fog" ? 28 : 18;
      positions[offset] = (Math.random() - 0.5) * horizontalSpread;
      positions[offset + 1] = type === "fog" ? Math.random() * 2.1 - 0.35 : type === "storm" ? 6.5 + Math.random() * 3.2 : Math.random() * 4;
      positions[offset + 2] = (Math.random() - 0.5) * horizontalSpread;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    if (type === "fire") geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3).fill(1), 3));
    const material = new THREE.PointsMaterial({
      color: type === "fire" ? 0xffffff : color,
      depthTest: true,
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
    points.renderOrder = type === "fog" ? 3 : 0;
    points.userData.effectType = type;
    group.add(points);
    systems[type] = points;
  };
  createPoints("fog", 120, 0x8b98a8, 4.4, 0.08);
  createPoints("fire", 380, 0xff5a12, 0.3, 0.9, true);
  createPoints("particles", 260, 0xd875ff, 0.13, 0.85, true);
  const fireLights = [
    new THREE.PointLight(0xff4a12, 0, 8, 2),
    new THREE.PointLight(0xff9a24, 0, 7, 2)
  ];
  fireLights[0].position.set(-2.6, 1.2, 1.5);
  fireLights[1].position.set(2.7, 1, -1.8);
  fireLights.forEach((light) => { light.visible = false; group.add(light); });
  const lavaJets = createLavaJetSystem();
  const lavaGas = createLavaGasSystem();
  const lavaFootsteps = createLavaFootstepSystem();
  const lavaAtmosphere = createLavaAtmosphereSystem();
  const magic = createArcaneMagic();
  const churchLighting = createChurchLighting();
  const apocalypseLighting = createApocalypseLighting();
  const apocalypseFires = createApocalypseFires();
  const churchFog = createChurchFog();
  const rain = createRealisticRain();
  const storm = createRealisticStorm();
  group.add(lavaJets.group, lavaGas.points, lavaFootsteps.group, lavaAtmosphere.group, magic, churchLighting, apocalypseLighting, apocalypseFires, churchFog, rain, storm);
  return { group, systems, fireLights, lavaJets, lavaGas, lavaFootsteps, lavaAtmosphere, magic, churchLighting, apocalypseLighting, apocalypseFires, churchFog, rain, storm };
}

function createLavaJetSystem(count = 24) {
  const group = new THREE.Group();
  group.name = "Chorros de lava";
  group.visible = false;
  const material = new THREE.MeshStandardMaterial({
    color: 0x7d210d,
    emissive: 0xff3809,
    emissiveIntensity: 0.44,
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uJetTime = { value: 0 };
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `
      #include <common>
      varying vec3 vJetWorld;
    `).replace("#include <begin_vertex>", `
      #include <begin_vertex>
      vJetWorld = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;
    `);
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `
      #include <common>
      uniform float uJetTime;
      varying vec3 vJetWorld;
    `).replace("#include <color_fragment>", `
      #include <color_fragment>
      float flow = sin(vJetWorld.x * 7.0 + vJetWorld.y * 5.2 - uJetTime * 2.4) *
        sin(vJetWorld.z * 6.3 - vJetWorld.y * 3.8 + uJetTime * 1.2);
      float crust = sin(vJetWorld.x * 11.0 + vJetWorld.z * 9.0 +
        sin(vJetWorld.y * 4.1) * 1.7);
      float heat = smoothstep(-0.55, 0.65, flow * 0.72 + crust * 0.28);
      diffuseColor.rgb *= mix(vec3(0.56, 0.4, 0.31), vec3(0.92, 0.74, 0.52), heat);
    `).replace("#include <emissivemap_fragment>", `
      #include <emissivemap_fragment>
      totalEmissiveRadiance *= 0.22 + heat * 0.52;
    `);
    material.userData.jetShader = shader;
  };
  material.customProgramCacheKey = () => "flowing-lava-jets-v2";
  const splashMaterial = new THREE.MeshBasicMaterial({
    color: 0xb9330b, transparent: true, opacity: 0.42,
    depthWrite: false, side: THREE.DoubleSide
  });
  const dropsPerJet = 7;
  const impactDropsPerJet = 10;
  const streamsPerJet = 3;
  const stemGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 10, 18);
  const stemPositions = stemGeometry.attributes.position;
  for (let vertex = 0; vertex < stemPositions.count; vertex += 1) {
    const x = stemPositions.getX(vertex);
    const y = stemPositions.getY(vertex);
    const z = stemPositions.getZ(vertex);
    const progress = y + 0.5;
    const ripple = 0.77 + Math.sin(progress * 15.2) * 0.13 +
      Math.sin(progress * 31.4 + Math.atan2(z, x) * 2.0) * 0.09;
    stemPositions.setXYZ(vertex,
      x * ripple + Math.sin(progress * 5.7) * progress * 0.15,
      y,
      z * ripple + Math.cos(progress * 6.2) * progress * 0.13);
  }
  stemPositions.needsUpdate = true;
  stemGeometry.computeVertexNormals();
  const stems = new THREE.InstancedMesh(stemGeometry, material, count * streamsPerJet);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 11, 8), material, count);
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 9, 7), material, count * dropsPerJet);
  const impactDrops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 7, 5), material, count * impactDropsPerJet);
  const splashes = new THREE.InstancedMesh(new THREE.RingGeometry(0.34, 0.62, 18), splashMaterial, count);
  stems.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  heads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  impactDrops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  splashes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  stems.frustumCulled = false;
  heads.frustumCulled = false;
  drops.frustumCulled = false;
  impactDrops.frustumCulled = false;
  splashes.frustumCulled = false;
  stems.castShadow = false;
  heads.castShadow = false;
  drops.castShadow = true;
  group.add(stems, heads, drops, impactDrops, splashes);
  let seed = 4831;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const jets = Array.from({ length: count }, (_, index) => {
    const angle = random() * Math.PI * 2;
    const distance = index < 7 ? 5 + random() * 13 : 18 + random() * 48;
    return {
      x: Math.cos(angle) * distance,
      z: Math.sin(angle) * distance,
      phase: random(),
      rate: 0.75 + random() * 0.55,
      height: 1.2 + random() * 1.65,
      width: 0.7 + random() * 0.7,
      rotation: random() * Math.PI * 2,
      driftX: (random() - 0.5) * 1.5,
      driftZ: (random() - 0.5) * 1.5,
      streamTiltX: (random() - 0.5) * 0.65,
      streamTiltZ: (random() - 0.5) * 0.65
    };
  });
  return { group, stems, heads, drops, impactDrops, splashes, material, splashMaterial, jets, streamsPerJet, dropsPerJet, impactDropsPerJet, matrixHelper: new THREE.Object3D() };
}

function animateLavaJets(system, enabled, time, settings = DEFAULT_LAVA_SETTINGS) {
  if (!system) return;
  const visibleCount = THREE.MathUtils.clamp(Math.round(settings.jetCount ?? DEFAULT_LAVA_SETTINGS.jetCount), 0, system.jets.length);
  const active = enabled && settings.enabled !== false && visibleCount > 0;
  system.group.visible = active;
  if (!active) return;
  system.stems.count = visibleCount * system.streamsPerJet;
  system.heads.count = visibleCount;
  system.drops.count = visibleCount * system.dropsPerJet;
  system.impactDrops.count = visibleCount * system.impactDropsPerJet;
  system.splashes.count = visibleCount;
  const seconds = time * 0.001;
  if (system.material.userData.jetShader) system.material.userData.jetShader.uniforms.uJetTime.value = seconds;
  const interval = THREE.MathUtils.clamp(Number(settings.interval) || DEFAULT_LAVA_SETTINGS.interval, 2, 14);
  const heightScale = THREE.MathUtils.clamp(Number(settings.height) || DEFAULT_LAVA_SETTINGS.height, 0.4, 1.8);
  const helper = system.matrixHelper;
  system.jets.slice(0, visibleCount).forEach((jet, index) => {
    const cycle = (seconds / interval * jet.rate + jet.phase) % 1;
    const jetProgress = cycle / 0.42;
    const active = jetProgress >= 0 && jetProgress <= 1;
    const growth = active ? Math.min(1, jetProgress / 0.24) : 0;
    const release = active ? 1 - Math.max(0, (jetProgress - 0.7) / 0.3) : 0;
    const envelope = growth * release;
    const height = Math.max(0.001, envelope * jet.height * heightScale);
    const streamActive = active && envelope > 0.02;
    for (let strand = 0; strand < system.streamsPerJet; strand += 1) {
      const angle = jet.rotation + strand * 2.399;
      const strandHeight = height * (strand === 0 ? 1 : 0.68 + strand * 0.07);
      const spread = strand === 0 ? 0 : jet.width * 0.17;
      const sway = Math.sin(seconds * 5.2 + index * 1.7 + strand * 2.4) * 0.07;
      helper.position.set(jet.x + Math.cos(angle) * spread +
        jet.streamTiltX * strandHeight * 0.23 + sway,
        streamActive ? 0.04 + strandHeight * 0.5 : -10,
        jet.z + Math.sin(angle) * spread +
        jet.streamTiltZ * strandHeight * 0.23 - sway * 0.5);
      const width = strand === 0 ? 0.48 : 0.26;
      const pulse = 0.93 + Math.sin(seconds * 9 + index * 1.7 + strand) * 0.07;
      helper.scale.set(streamActive ? jet.width * width * pulse : 0.001,
        streamActive ? strandHeight : 0.001,
        streamActive ? jet.width * width * pulse : 0.001);
      helper.rotation.set(jet.streamTiltZ * 0.2,
        angle, -jet.streamTiltX * 0.2);
      helper.updateMatrix();
      system.stems.setMatrixAt(index * system.streamsPerJet + strand, helper.matrix);
    }

    helper.position.set(
      jet.x + jet.streamTiltX * 0.48 * height,
      streamActive ? 0.04 + height : -10,
      jet.z + jet.streamTiltZ * 0.48 * height
    );
    const headScale = streamActive ? jet.width * (0.13 + Math.sin(seconds * 8.3 + index) * 0.025) : 0.001;
    helper.scale.set(headScale, headScale * 1.25, headScale);
    helper.rotation.set(0, jet.rotation, 0);
    helper.updateMatrix();
    system.heads.setMatrixAt(index, helper.matrix);
    const splashScale = active ? (0.35 + Math.sin(Math.min(jetProgress * 1.7, 1) * Math.PI) * 0.9) * jet.width : 0.001;
    helper.position.set(jet.x, 0.035, jet.z);
    helper.scale.set(splashScale, splashScale, splashScale);
    helper.rotation.set(Math.PI / 2, 0, jet.rotation);
    helper.updateMatrix();
    system.splashes.setMatrixAt(index, helper.matrix);
    for (let dropIndex = 0; dropIndex < system.dropsPerJet; dropIndex += 1) {
      const instanceIndex = index * system.dropsPerJet + dropIndex;
      const dropProgress = (cycle - 0.075 - dropIndex * 0.018) / 0.48;
      const dropActive = dropProgress >= 0 && dropProgress <= 1;
      const arc = dropActive ? Math.sin(dropProgress * Math.PI) : 0;
      const dropAngle = jet.rotation + dropIndex * 2.399;
      const spread = 0.32 + (dropIndex % 3) * 0.18;
      helper.position.set(
        jet.x + (jet.driftX * 0.38 + Math.cos(dropAngle) * spread) * dropProgress,
        0.12 + arc * jet.height * heightScale * (0.7 + (dropIndex % 4) * 0.055),
        jet.z + (jet.driftZ * 0.38 + Math.sin(dropAngle) * spread) * dropProgress
      );
      const dropScale = dropActive ? (0.16 + arc * 0.2 + (dropIndex % 2) * 0.035) * jet.width : 0.001;
      helper.scale.set(dropScale, dropScale * (1.45 + arc * 0.45), dropScale);
      helper.rotation.set(0, dropAngle, Math.cos(dropAngle) * 0.16);
      helper.updateMatrix();
      system.drops.setMatrixAt(instanceIndex, helper.matrix);
    }
    for (let dropIndex = 0; dropIndex < system.impactDropsPerJet; dropIndex += 1) {
      const instanceIndex = index * system.impactDropsPerJet + dropIndex;
      const impactProgress = (cycle - 0.29 - dropIndex * 0.0025) / 0.13;
      const impactActive = impactProgress >= 0 && impactProgress <= 1;
      const angle = jet.rotation + dropIndex * 2.399 + Math.sin(index * 7.13) * 0.4;
      const radius = impactProgress * (0.55 + (dropIndex % 4) * 0.18) * jet.width;
      const lift = impactActive ? Math.sin(impactProgress * Math.PI) * (0.24 + (dropIndex % 3) * 0.13) : 0;
      helper.position.set(
        jet.x + Math.cos(angle) * radius,
        impactActive ? 0.07 + lift : -10,
        jet.z + Math.sin(angle) * radius
      );
      const impactScale = impactActive ? (0.42 + (dropIndex % 3) * 0.12) * (1 - impactProgress * 0.35) * jet.width : 0.001;
      helper.scale.set(impactScale, impactScale * 1.45, impactScale);
      helper.rotation.set(0, angle, Math.cos(angle) * 0.35);
      helper.updateMatrix();
      system.impactDrops.setMatrixAt(instanceIndex, helper.matrix);
    }
  });
  system.stems.instanceMatrix.needsUpdate = true;
  system.heads.instanceMatrix.needsUpdate = true;
  system.drops.instanceMatrix.needsUpdate = true;
  system.impactDrops.instanceMatrix.needsUpdate = true;
  system.splashes.instanceMatrix.needsUpdate = true;
}

function createLavaGasSystem(maxVents = 24, particlesPerVent = 58) {
  const positions = new Float32Array(maxVents * particlesPerVent * 3);
  const colors = new Float32Array(maxVents * particlesPerVent * 3);
  const particles = [];
  const vents = [];
  let seed = 7919;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let ventIndex = 0; ventIndex < maxVents; ventIndex += 1) {
    const angle = random() * Math.PI * 2;
    const distance = ventIndex < 9 ? 4 + random() * 15 : 19 + random() * 46;
    const leanAngle = random() * Math.PI * 2;
    const leanAmount = 0.35 + random() * 1.35;
    vents.push({
      x: Math.cos(angle) * distance,
      z: Math.sin(angle) * distance,
      heightScale: 0.58 + random() * 0.82,
      widthScale: 0.72 + random() * 0.7,
      leanX: Math.cos(leanAngle) * leanAmount,
      leanZ: Math.sin(leanAngle) * leanAmount,
      pulseRate: 0.32 + random() * 0.68,
      pulsePhase: random() * Math.PI * 2
    });
    for (let particleIndex = 0; particleIndex < particlesPerVent; particleIndex += 1) {
      particles.push({
        phase: random(),
        rate: 0.72 + random() * 0.58,
        angle: random() * Math.PI * 2,
        radius: 0.16 + random() * 0.92,
        curl: 0.55 + random() * 1.2,
        wobble: 0.45 + random() * 1.1
      });
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    depthWrite: false,
    map: createVolcanicSmokeTexture(),
    opacity: 0.23,
    size: 1.35,
    sizeAttenuation: true,
    transparent: true,
    vertexColors: true
  });
  const points = new THREE.Points(geometry, material);
  points.name = "Gas volcanico";
  points.visible = false;
  points.frustumCulled = false;
  return { points, vents, particles, particlesPerVent, maxVents };
}

function animateLavaGas(system, enabled, time, settings = DEFAULT_LAVA_SETTINGS, quality = 1) {
  if (!system) return;
  const ventCount = THREE.MathUtils.clamp(Math.round(settings.gasCount ?? DEFAULT_LAVA_SETTINGS.gasCount), 0, system.maxVents);
  const active = enabled && settings.gasEnabled !== false && ventCount > 0;
  system.points.visible = active;
  if (!active) return;
  const speed = THREE.MathUtils.clamp(Number(settings.gasSpeed) || DEFAULT_LAVA_SETTINGS.gasSpeed, 0.2, 3);
  const height = THREE.MathUtils.clamp(Number(settings.gasHeight) || DEFAULT_LAVA_SETTINGS.gasHeight, 0.5, 2);
  const density = THREE.MathUtils.clamp(Number(settings.gasDensity) || DEFAULT_LAVA_SETTINGS.gasDensity, 0.2, 1.5);
  const seconds = time * 0.001;
  const positions = system.points.geometry.attributes.position;
  const colors = system.points.geometry.attributes.color;
  const fullCount = ventCount * system.particlesPerVent;
  const visibleCount = Math.max(1, Math.round(fullCount * quality));
  system.points.geometry.setDrawRange(0, visibleCount);
  system.points.material.opacity = 0.08 + density * 0.16;
  system.points.material.size = 0.82 + density * 0.92;
  for (let index = 0; index < visibleCount; index += 1) {
    const ventIndex = Math.floor(index / system.particlesPerVent);
    const vent = system.vents[ventIndex];
    const particle = system.particles[index];
    const rise = (seconds * speed * 0.16 * particle.rate + particle.phase) % 1;
    const flow = 0.68 + Math.sin(seconds * speed * vent.pulseRate + vent.pulsePhase) * 0.24;
    const spread = particle.radius * (0.08 + rise * 1.58) * density * vent.widthScale * flow;
    const curl = seconds * speed * particle.curl + particle.angle + rise * (4.6 + particle.wobble);
    const turbulence = Math.sin(rise * 17 + seconds * particle.wobble + particle.angle) * rise * 0.34;
    const bend = rise * rise * flow;
    positions.setXYZ(
      index,
      vent.x + Math.cos(curl) * spread + Math.sin(seconds * 0.37 + ventIndex) * rise * 0.38 + turbulence + vent.leanX * bend,
      0.06 + Math.pow(rise, 0.88) * (2.1 + height * 3.5) * vent.heightScale * (0.82 + flow * 0.2),
      vent.z + Math.sin(curl) * spread + Math.cos(seconds * 0.31 + ventIndex * 1.4) * rise * 0.32 - turbulence * 0.55 + vent.leanZ * bend
    );
    const heat = Math.max(0, 1 - rise * 5.2);
    colors.setXYZ(index, 0.16 + heat * 0.84, 0.14 + heat * 0.14, 0.14 - heat * 0.11);
  }
  positions.needsUpdate = true;
  colors.needsUpdate = true;
}

function createLavaFootstepSystem(maxImpacts = 32, dropsPerImpact = 5) {
  const group = new THREE.Group();
  group.name = "Impactos sobre lava";
  group.visible = false;
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexColors: true,
    blending: THREE.AdditiveBlending
  });
  const dropMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending
  });
  const rings = new THREE.InstancedMesh(new THREE.RingGeometry(0.32, 0.42, 28), ringMaterial, maxImpacts);
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 7, 5), dropMaterial, maxImpacts * dropsPerImpact);
  rings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rings.frustumCulled = false;
  drops.frustumCulled = false;
  rings.renderOrder = 3;
  drops.renderOrder = 3;
  group.add(rings, drops);
  const impacts = Array.from({ length: maxImpacts }, () => ({ active: false, start: -100, x: 0, z: 0, strength: 1, seed: 0 }));
  return { group, rings, drops, impacts, dropsPerImpact, cursor: 0, helper: new THREE.Object3D(), color: new THREE.Color() };
}

function spawnLavaFootstep(system, position, time, strength = 1) {
  if (!system) return;
  const impact = system.impacts[system.cursor];
  system.cursor = (system.cursor + 1) % system.impacts.length;
  impact.active = true;
  impact.start = time * 0.001;
  impact.x = position.x;
  impact.z = position.z;
  impact.strength = THREE.MathUtils.clamp(strength, 0.65, 1.4);
  impact.seed = Math.random() * Math.PI * 2;
}

function animateLavaFootsteps(system, enabled, time) {
  if (!system) return;
  const seconds = time * 0.001;
  system.group.visible = enabled;
  const helper = system.helper;
  const color = system.color;
  system.impacts.forEach((impact, impactIndex) => {
    const age = seconds - impact.start;
    const active = enabled && impact.active && age >= 0 && age < 1.15;
    if (!active && impact.active && age >= 1.15) impact.active = false;
    const progress = active ? age / 1.15 : 1;
    const fade = active ? Math.pow(1 - progress, 1.45) : 0;
    const ringScale = active ? (0.28 + Math.sin(progress * Math.PI * 0.86) * 1.55) * impact.strength : 0.001;
    helper.position.set(impact.x, 0.045 + progress * 0.035, impact.z);
    helper.rotation.set(-Math.PI / 2, 0, impact.seed);
    helper.scale.set(ringScale, ringScale, ringScale);
    helper.updateMatrix();
    system.rings.setMatrixAt(impactIndex, helper.matrix);
    color.setRGB(fade, fade * (0.16 + progress * 0.16), fade * 0.015);
    system.rings.setColorAt(impactIndex, color);

    for (let dropIndex = 0; dropIndex < system.dropsPerImpact; dropIndex += 1) {
      const instanceIndex = impactIndex * system.dropsPerImpact + dropIndex;
      const angle = impact.seed + dropIndex * 2.399;
      const dropAge = age - dropIndex * 0.018;
      const dropActive = active && dropAge >= 0 && dropAge < 0.58;
      const velocity = (0.72 + (dropIndex % 3) * 0.18) * impact.strength;
      const horizontal = dropAge * velocity;
      const dropHeight = 0.1 + dropAge * (1.35 + (dropIndex % 2) * 0.32) - 2.55 * dropAge * dropAge;
      helper.position.set(
        impact.x + Math.cos(angle) * horizontal,
        dropActive ? Math.max(0.055, dropHeight) : -10,
        impact.z + Math.sin(angle) * horizontal
      );
      const dropScale = dropActive ? (0.72 + dropIndex * 0.055) * impact.strength : 0.001;
      helper.rotation.set(0, angle, 0);
      helper.scale.set(dropScale, dropScale * 1.55, dropScale);
      helper.updateMatrix();
      system.drops.setMatrixAt(instanceIndex, helper.matrix);
      const dropFade = dropActive ? Math.max(0, 1 - dropAge / 0.58) : 0;
      color.setRGB(dropFade, dropFade * 0.19, dropFade * 0.02);
      system.drops.setColorAt(instanceIndex, color);
    }
  });
  system.rings.instanceMatrix.needsUpdate = true;
  system.drops.instanceMatrix.needsUpdate = true;
  if (system.rings.instanceColor) system.rings.instanceColor.needsUpdate = true;
  if (system.drops.instanceColor) system.drops.instanceColor.needsUpdate = true;
}

function createLavaCrustPlateSystem(maxPlates = 64) {
  const group = new THREE.Group();
  group.name = "Placas flotantes de lava";
  const crustTexture = new THREE.TextureLoader().load(volcanicBlackEarthTexture);
  crustTexture.colorSpace = THREE.SRGBColorSpace;
  crustTexture.wrapS = crustTexture.wrapT = THREE.RepeatWrapping;
  crustTexture.repeat.set(1.5, 1.5);
  crustTexture.anisotropy = 16;
  const plateGeometry = new THREE.CylinderGeometry(1, 1, 0.17, 18, 3, false);
  const platePositions = plateGeometry.attributes.position;
  for (let index = 0; index < platePositions.count; index += 1) {
    const x = platePositions.getX(index);
    const y = platePositions.getY(index);
    const z = platePositions.getZ(index);
    const radius = Math.hypot(x, z);
    if (radius > 0.01) {
      const angle = Math.atan2(z, x);
      const irregularity = 1 + Math.sin(angle * 3 + 0.7) * 0.13 + Math.sin(angle * 7 - 1.2) * 0.065;
      platePositions.setXYZ(index, x * irregularity, y + Math.sin(angle * 4.0) * 0.018 * radius, z * irregularity);
    }
  }
  platePositions.needsUpdate = true;
  plateGeometry.computeVertexNormals();
  const plateMaterial = new THREE.MeshStandardMaterial({
    color: 0x686b6d,
    map: crustTexture,
    bumpMap: crustTexture,
    bumpScale: 0.13,
    roughness: 1,
    metalness: 0
  });
  const ashTopMaterial = new THREE.MeshStandardMaterial({
    color: 0x808184,
    map: crustTexture,
    bumpMap: crustTexture,
    bumpScale: 0.16,
    roughness: 1,
    metalness: 0
  });
  const rimGeometry = new THREE.RingGeometry(0.92, 1.01, 14, 1);
  const rimPositions = rimGeometry.attributes.position;
  for (let index = 0; index < rimPositions.count; index += 1) {
    const x = rimPositions.getX(index);
    const y = rimPositions.getY(index);
    const angle = Math.atan2(y, x);
    const irregularity = 1 + Math.sin(angle * 3 + 0.7) * 0.13 + Math.sin(angle * 7 - 1.2) * 0.065;
    rimPositions.setXY(index, x * irregularity, y * irregularity);
  }
  rimPositions.needsUpdate = true;
  const rimMaterial = new THREE.MeshBasicMaterial({
    color: 0x481006,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const plates = new THREE.InstancedMesh(plateGeometry, plateMaterial, maxPlates);
  const ashPlates = new THREE.InstancedMesh(plateGeometry, [plateMaterial, ashTopMaterial, plateMaterial], maxPlates);
  const rims = new THREE.InstancedMesh(rimGeometry, rimMaterial, maxPlates);
  plates.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  ashPlates.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rims.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  plates.frustumCulled = false;
  ashPlates.frustumCulled = false;
  rims.frustumCulled = false;
  plates.castShadow = true;
  plates.receiveShadow = true;
  ashPlates.castShadow = true;
  ashPlates.receiveShadow = true;
  rims.renderOrder = 2;
  group.add(rims, plates, ashPlates);
  let seed = 6329;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const plateData = Array.from({ length: maxPlates }, (_, index) => {
    const angle = random() * Math.PI * 2;
    const distance = index < 24 ? 3.5 + random() * 20 : 22 + random() * 48;
    return {
      x: Math.cos(angle) * distance,
      z: Math.sin(angle) * distance,
      size: 0.48 + random() * 1.35,
      aspect: 0.68 + random() * 0.72,
      phase: random() * Math.PI * 2,
      drift: (random() - 0.5) * 0.24,
      flowRadius: 0.62 + random() * 0.92,
      flowSpeed: 0.055 + random() * 0.075,
      rotation: random() * Math.PI * 2,
      bob: 0.022 + random() * 0.04,
      ashTop: random() < 0.38
    };
  });
  return {
    group,
    plates,
    ashPlates,
    rims,
    plateData,
    crustTexture,
    ashTopMaterial,
    helper: new THREE.Object3D(),
    avoidanceBounds: new THREE.Box3(),
    avoidanceSize: new THREE.Vector3(),
    avoidancePosition: new THREE.Vector3(),
    avoidanceRadii: new WeakMap(),
    lastTime: null
  };
}

function animateLavaCrustPlates(system, time, content, quality = 1) {
  if (!system) return;
  const seconds = time * 0.001;
  const delta = system.lastTime === null ? 1 / 60 : THREE.MathUtils.clamp(seconds - system.lastTime, 0, 0.08);
  system.lastTime = seconds;
  const avoiders = [];
  content.children.forEach((object) => {
    if (!object.visible || !object.userData?.modelAnimation) return;
    object.getWorldPosition(system.avoidancePosition);
    let radius = system.avoidanceRadii.get(object);
    if (!radius) {
      system.avoidanceBounds.setFromObject(object);
      system.avoidanceBounds.getSize(system.avoidanceSize);
      radius = THREE.MathUtils.clamp(Math.max(system.avoidanceSize.x, system.avoidanceSize.z) * 0.48 + 0.58, 0.9, 3.2);
      system.avoidanceRadii.set(object, radius);
    }
    avoiders.push({ x: system.avoidancePosition.x, z: system.avoidancePosition.z, radius });
  });
  const visibleCount = Math.max(28, Math.round(system.plateData.length * quality));
  system.rims.count = visibleCount;
  const helper = system.helper;
  let rockyCount = 0;
  let ashCount = 0;
  for (let index = 0; index < visibleCount; index += 1) {
    const plate = system.plateData[index];
    const bob = Math.sin(seconds * (0.42 + Math.abs(plate.drift) * 2) + plate.phase) * plate.bob;
    const flowPhase = seconds * plate.flowSpeed + plate.phase;
    const driftX = Math.sin(flowPhase) * plate.flowRadius + Math.sin(flowPhase * 2.3) * 0.18;
    const driftZ = Math.cos(flowPhase * 0.83) * plate.flowRadius * 0.72 + Math.cos(flowPhase * 1.9) * 0.16;
    let targetX = plate.x + driftX;
    let targetZ = plate.z + driftZ;
    let avoiding = false;
    avoiders.forEach((avoider) => {
      let offsetX = targetX - avoider.x;
      let offsetZ = targetZ - avoider.z;
      let distance = Math.hypot(offsetX, offsetZ);
      const safeDistance = avoider.radius + plate.size * 0.92;
      if (distance >= safeDistance) return;
      if (distance < 0.001) {
        offsetX = Math.cos(plate.phase);
        offsetZ = Math.sin(plate.phase);
        distance = 1;
      }
      const push = safeDistance - distance + 0.24;
      targetX += offsetX / distance * push;
      targetZ += offsetZ / distance * push;
      avoiding = true;
    });
    plate.currentX ??= targetX;
    plate.currentZ ??= targetZ;
    plate.currentX = THREE.MathUtils.damp(plate.currentX, targetX, avoiding ? 9 : 1.8, delta);
    plate.currentZ = THREE.MathUtils.damp(plate.currentZ, targetZ, avoiding ? 9 : 1.8, delta);
    avoiders.forEach((avoider) => {
      let offsetX = plate.currentX - avoider.x;
      let offsetZ = plate.currentZ - avoider.z;
      let distance = Math.hypot(offsetX, offsetZ);
      const safeDistance = avoider.radius + plate.size * 0.92;
      if (distance >= safeDistance) return;
      if (distance < 0.001) {
        offsetX = Math.cos(plate.phase);
        offsetZ = Math.sin(plate.phase);
        distance = 1;
      }
      plate.currentX = avoider.x + offsetX / distance * safeDistance;
      plate.currentZ = avoider.z + offsetZ / distance * safeDistance;
    });
    const rotation = plate.rotation + seconds * plate.drift;
    helper.position.set(plate.currentX, 0.14 + bob, plate.currentZ);
    helper.scale.set(plate.size * plate.aspect * 0.93, 0.68 + plate.size * 0.08, plate.size / plate.aspect * 0.93);
    helper.rotation.set(Math.sin(seconds * 0.31 + plate.phase) * 0.018, rotation, Math.cos(seconds * 0.27 + plate.phase) * 0.016);
    helper.updateMatrix();
    if (plate.ashTop) {
      system.ashPlates.setMatrixAt(ashCount, helper.matrix);
      ashCount += 1;
    } else {
      system.plates.setMatrixAt(rockyCount, helper.matrix);
      rockyCount += 1;
    }

    helper.position.set(plate.currentX, 0.098 + bob, plate.currentZ);
    helper.scale.set(plate.size * plate.aspect, plate.size / plate.aspect, 1);
    helper.rotation.set(-Math.PI / 2, 0, rotation);
    helper.updateMatrix();
    system.rims.setMatrixAt(index, helper.matrix);
  }
  system.plates.count = rockyCount;
  system.ashPlates.count = ashCount;
  system.plates.instanceMatrix.needsUpdate = true;
  system.ashPlates.instanceMatrix.needsUpdate = true;
  system.rims.instanceMatrix.needsUpdate = true;
}

function createLavaAtmosphereSystem() {
  const group = new THREE.Group();
  group.name = "Calor e iluminacion de lava";
  group.visible = false;
  const lights = [
    [-5.5, 0.65, 2.5, 0xff2a05],
    [5.5, 0.55, 1.8, 0xff6a16],
    [-1.5, 0.45, -6, 0xe91800],
    [2.5, 0.6, 6.5, 0xff8a24]
  ].map(([x, y, z, color]) => {
     const light = new THREE.PointLight(color, 0, 15, 1.8);
    light.position.set(x, y, z);
    group.add(light);
    return light;
  });
  const heatMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 } },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 animated = position;
        animated.x += sin(uv.y * 11.0 + uTime * 1.9 + position.y * 2.0) * uv.y * 0.13;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(animated, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uOpacity;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
      }
      void main() {
        vec2 p = vUv;
        float drift = noise(vec2(p.y * 5.5 - uTime * 0.55, uTime * 0.16));
        float filament = sin((p.x + drift * 0.2) * 19.0 + p.y * 8.0 - uTime * 2.1) * 0.5 + 0.5;
        float body = smoothstep(0.02, 0.24, p.y) * (1.0 - smoothstep(0.52, 1.0, p.y));
        float sides = smoothstep(0.0, 0.3, p.x) * (1.0 - smoothstep(0.7, 1.0, p.x));
        float alpha = body * sides * smoothstep(0.5, 0.92, filament) * (0.022 + drift * 0.025) * uOpacity;
        gl_FragColor = vec4(1.0, 0.28, 0.055, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const heatPanels = [];
  const offsets = [[-4, 1], [0, -2], [4, 2.5], [-7, -4], [7, -3], [-2, 6], [3, -7], [8, 6]];
  offsets.forEach(([x, z], index) => {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.4 + index % 3, 4.4 + (index % 2) * 1.2, 8, 14), heatMaterial);
    panel.position.set(x, 2, z);
    panel.renderOrder = 2;
    panel.frustumCulled = false;
    group.add(panel);
    heatPanels.push(panel);
  });
  const emberCount = 420;
  const emberPositions = new Float32Array(emberCount * 3);
  const emberColors = new Float32Array(emberCount * 3);
  const emberSeeds = [];
  let emberSeed = 3253;
  const emberRandom = () => { emberSeed = (emberSeed * 16807) % 2147483647; return (emberSeed - 1) / 2147483646; };
  for (let index = 0; index < emberCount; index += 1) {
    const warm = emberRandom();
    emberColors[index * 3] = 1;
    emberColors[index * 3 + 1] = 0.08 + warm * 0.42;
    emberColors[index * 3 + 2] = warm * 0.055;
    emberSeeds.push({
      x: (emberRandom() - 0.5) * 58,
      z: (emberRandom() - 0.5) * 58,
      phase: emberRandom(),
      rate: 0.035 + emberRandom() * 0.09,
      drift: 0.35 + emberRandom() * 1.2,
      angle: emberRandom() * Math.PI * 2
    });
  }
  const emberGeometry = new THREE.BufferGeometry();
  emberGeometry.setAttribute("position", new THREE.BufferAttribute(emberPositions, 3));
  emberGeometry.setAttribute("color", new THREE.BufferAttribute(emberColors, 3));
  const emberMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    map: createParticleTexture("fire"),
    size: 0.16,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending
  });
  const embers = new THREE.Points(emberGeometry, emberMaterial);
  embers.name = "Brasas infernales";
  embers.frustumCulled = false;
  group.add(embers);
  const crustPlates = createLavaCrustPlateSystem();
  group.add(crustPlates.group);
  const shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(280, 280),
    new THREE.ShadowMaterial({ color: 0x080000, opacity: 0.62, transparent: true, depthWrite: false })
  );
  shadowCatcher.name = "Sombras proyectadas sobre lava";
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = 0.055;
  shadowCatcher.receiveShadow = true;
  shadowCatcher.renderOrder = 3;
  group.add(shadowCatcher);
  const infernalFog = new THREE.Fog(0x2a0704, 42, 158);
  return {
    group,
    lights,
    heatPanels,
    heatMaterial,
    embers,
    emberSeeds,
    crustPlates,
    shadowCatcher,
    infernalFog
  };
}

function animateLavaAtmosphere(system, enabled, time, center, camera, scene, sceneEffects, content, quality = 1) {
  if (!system) return;
  system.group.visible = enabled;
  if (!enabled) return;
  const seconds = time * 0.001;
  if (!sceneEffects.fog.enabled) {
    system.infernalFog.near = 38 + quality * 4;
    system.infernalFog.far = 138 + quality * 20;
    scene.fog = system.infernalFog;
  }
  system.lights.forEach((light, index) => {
    light.intensity = (12 + quality * 11) * (0.77 + Math.sin(seconds * (4.1 + index * 0.37) + index * 1.9) * 0.13 + Math.sin(seconds * 10.7 + index) * 0.06);
    light.position.x = center.x + [-5.5, 5.5, -1.5, 2.5][index];
    light.position.z = center.z + [2.5, 1.8, -6, 6.5][index];
  });
  system.heatMaterial.uniforms.uTime.value = seconds;
  system.heatMaterial.uniforms.uOpacity.value = quality;
  system.heatPanels.forEach((panel, index) => {
    panel.position.x = center.x + [-4, 0, 4, -7, 7, -2, 3, 8][index];
    panel.position.z = center.z + [1, -2, 2.5, -4, -3, 6, -7, 6][index];
    panel.quaternion.copy(camera.quaternion);
  });
  const emberPositions = system.embers.geometry.attributes.position;
  const visibleEmbers = Math.max(80, Math.round(system.emberSeeds.length * quality));
  system.embers.geometry.setDrawRange(0, visibleEmbers);
  for (let index = 0; index < visibleEmbers; index += 1) {
    const ember = system.emberSeeds[index];
    const rise = (ember.phase + seconds * ember.rate) % 1;
    const curl = ember.angle + seconds * ember.drift * 0.34 + rise * 2.8;
    emberPositions.setXYZ(
      index,
      center.x + ember.x + Math.sin(curl) * rise * 1.2,
      0.18 + rise * (5.5 + ember.drift * 3.6),
      center.z + ember.z + Math.cos(curl) * rise * 0.85
    );
  }
  emberPositions.needsUpdate = true;
  system.embers.material.opacity = 0.58 + quality * 0.24;
  animateLavaCrustPlates(system.crustPlates, time, content, quality);
}

function animateSceneEffects(scene, effectSystem, settings, delta, time, quality = 1, churchFogActive = false) {
  if (!effectSystem) return;
  const fogIntensity = settings.fog.intensity;
  if (settings.fog.enabled && !churchFogActive) {
    if (!scene.fog?.isFogExp2) scene.fog = new THREE.FogExp2(settings.fog.color, 0.0035 + fogIntensity * 0.018);
    else {
      scene.fog.color.set(settings.fog.color);
      scene.fog.density = (0.0035 + fogIntensity * 0.018) * (0.96 + Math.sin(time * 0.00032) * 0.04);
    }
  } else scene.fog = null;
  Object.entries(effectSystem.systems).forEach(([type, points]) => {
    const config = settings[type];
    points.visible = config.enabled && !(type === "fog" && churchFogActive);
    if (!points.visible) return;
    if (type === "fog") points.material.color.set(settings.fog.color);
    if (type === "particles") points.material.color.set(config.color || DEFAULT_SCENE_EFFECTS.particles.color);
    const visibleCount = Math.max(1, Math.round(points.geometry.attributes.position.count * quality));
    points.geometry.setDrawRange(0, visibleCount);
    points.material.opacity = type === "fog" ? 0.022 + config.intensity * 0.085 : 0.35 + config.intensity * 0.6;
    const positions = points.geometry.attributes.position;
    const colors = points.geometry.attributes.color;
    for (let index = 0; index < visibleCount; index += 1) {
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
  const tvVideo = TV_VIDEO_ELEMENTS.get(root);
  if (tvVideo) {
    tvVideo.pause();
    tvVideo.removeAttribute("src");
    tvVideo.load();
    TV_VIDEO_ELEMENTS.delete(root);
  }
  const disposedTextures = new Set();
  root.traverse((item) => {
    if (item.geometry && !SHARED_GEOMETRIES.has(item.geometry)) item.geometry.dispose?.();
    const materials = Array.isArray(item.material) ? item.material : [item.material];
    materials.filter(Boolean).forEach((material) => {
      materialTextures(material).forEach((texture) => {
        if (SHARED_TEXTURES.has(texture) || disposedTextures.has(texture)) return;
        disposedTextures.add(texture);
        texture.dispose?.();
      });
      material.dispose?.();
    });
  });
}

function cloneContentForHistory(content) {
  const snapshot = new THREE.Group();
  snapshot.name = content.name;
  content.children.forEach((child) => {
    const clone = cloneSkeleton(child);
    const sharesGeometry = SHARED_GEOMETRY_ROOTS.has(child);
    clone.traverse((item) => {
      if (item.geometry && !sharesGeometry) item.geometry = item.geometry.clone();
      if (Array.isArray(item.material)) item.material = item.material.map((material) => material.clone());
      else if (item.material) item.material = item.material.clone();
    });
    if (sharesGeometry) SHARED_GEOMETRY_ROOTS.add(clone);
    snapshot.add(clone);
  });
  return snapshot;
}

function iconForType(type) {
  if (type === "group") return Group;
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
  const activeRef = useRef(active);
  const selectedRef = useRef(null);
  const selectedIdsRef = useRef(new Set());
  const historyRef = useRef({ undo: [], redo: [], restoring: false });
  const clipboardRef = useRef(null);
  const modeRef = useRef("translate");
  const sculptingRef = useRef(false);
  const sculptSettingsRef = useRef({ brush: "inflate", radius: 0.65, strength: 0.3 });
  const animationTracksRef = useRef({});
  const animationTimeRef = useRef(0);
  const animationPlayingRef = useRef(false);
  const scenePlaybackRef = useRef({ paused: false, elapsed: 0 });
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
  const freezeMotionRef = useRef(DEFAULT_FREEZE_SEGMENTS);
  const lightingRigBaselineRef = useRef(null);
  const autosaveReadyRef = useRef(false);
  const workspaceLoadVersionRef = useRef(0);
  const autosaveInFlightRef = useRef(false);
  const autosaveQueuedRef = useRef(false);
  const performanceSampleRef = useRef({ startedAt: 0, frames: 0, reduced: false });
  const performanceModeRef = useRef("auto");
  const modelLoadInFlightRef = useRef(false);
  const soundtrackAudioRef = useRef(null);
  const soundtrackBufferRef = useRef(null);
  const soundtrackRef = useRef(null);
  const animationDurationRef = useRef(5);
  const grassSettingsRef = useRef(DEFAULT_GRASS_SETTINGS);
  const lavaSettingsRef = useRef(DEFAULT_LAVA_SETTINGS);
  const realisticSkyRef = useRef(DEFAULT_REALISTIC_SKY);
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
  const churchLightingSettings = sceneEffects.churchLighting || DEFAULT_CHURCH_LIGHTING;
  const cemeteryLightingSettings = sceneEffects.cemeteryLighting || DEFAULT_CEMETERY_LIGHTING;
  const castleLightingSettings = sceneEffects.castleLighting || DEFAULT_CASTLE_LIGHTING;
  const gothicLightingSettings = sceneEffects.gothicLighting || DEFAULT_GOTHIC_LIGHTING;
  const spaceSettings = sceneEffects.space || DEFAULT_SPACE_SETTINGS;
  const fogSettings = normalizeChurchFog(sceneEffects.fog);
  const rainSettings = normalizeRain(sceneEffects.rain);
  const stormSettings = normalizeStorm(sceneEffects.storm);
  const [gridVisible, setGridVisible] = useState(true);
  const [ambientIntensity, setAmbientIntensity] = useState(0.7);
  const [exposure, setExposure] = useState(1.15);
  const [floorVisible, setFloorVisible] = useState(true);
  const [floorColor, setFloorColor] = useState("#24272d");
  const [floorSurface, setFloorSurface] = useState("plastic");
  const apocalypseLightingSettings = sceneEffects.apocalypseLighting || {
    ...DEFAULT_APOCALYPSE_LIGHTING, enabled: floorSurface === "apocalypse"
  };
  const apocalypseFireSettings = sceneEffects.apocalypseFires || DEFAULT_APOCALYPSE_FIRES;
  const [selectedApocalypseFire, setSelectedApocalypseFire] = useState(0);
  const selectedApocalypseFireIndex = Math.min(selectedApocalypseFire, Math.max(0, apocalypseFireSettings.count - 1));
  const [grassSettings, setGrassSettings] = useState(DEFAULT_GRASS_SETTINGS);
  const [lavaSettings, setLavaSettings] = useState(DEFAULT_LAVA_SETTINGS);
  const [realisticSky, setRealisticSky] = useState(DEFAULT_REALISTIC_SKY);
  const [renderResolution, setRenderResolution] = useState("1920x1080");
  const [transparentPng, setTransparentPng] = useState(false);
  const [selection, setSelection] = useState(null);
  const [status, setStatus] = useState("");
  const [webglError, setWebglError] = useState("");
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
  const [freezeMotion, setFreezeMotion] = useState(DEFAULT_FREEZE_SEGMENTS);
  const [activeLightingRig, setActiveLightingRig] = useState("");
  const [propertyTab, setPropertyTab] = useState("object");
  const [historyCounts, setHistoryCounts] = useState({ undo: 0, redo: 0 });
  const [hasClipboard, setHasClipboard] = useState(false);

  useEffect(() => {
    animationDurationRef.current = animationDuration;
  }, [animationDuration]);

  useEffect(() => {
    let cancelled = false;
    getProject(THREE_CLIPBOARD_ID).then((saved) => {
      if (cancelled || !saved) return;
      clipboardRef.current = saved;
      setHasClipboard(true);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const [deformAmount, setDeformAmount] = useState(0.25);
  const [sculptBrush, setSculptBrush] = useState("inflate");
  const [sculptRadius, setSculptRadius] = useState(0.65);
  const [sculptStrength, setSculptStrength] = useState(0.3);
  const [scaleLinked, setScaleLinked] = useState(true);
  const [viewportRecording, setViewportRecording] = useState(false);
  const [viewportRecordingBlob, setViewportRecordingBlob] = useState(null);
  const [viewportConverting, setViewportConverting] = useState(false);
  const [recordingCountdown, setRecordingCountdown] = useState(null);
  const [cinematicCamera, setCinematicCamera] = useState(() => ({ ...DEFAULT_CINEMATIC_CAMERA }));
  const [directorPreset, setDirectorPreset] = useState("hollywood");
  const [libraryTab, setLibraryTab] = useState("objects");
  const [sceneSearch, setSceneSearch] = useState("");
  const [environmentIsolated, setEnvironmentIsolated] = useState(false);
  const [attachmentHand, setAttachmentHand] = useState("LeftHand");
  const [attachmentPrecision, setAttachmentPrecision] = useState(false);
  const [attachmentOwnerPaused, setAttachmentOwnerPaused] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState("Preparando autosave");
  const [autosaveRevision, setAutosaveRevision] = useState(0);
  const [performanceReduced, setPerformanceReduced] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(() => localStorage.getItem("neon:three-quality") || "auto");
  const [performanceStats, setPerformanceStats] = useState({ fps: 0, triangles: 0, geometries: 0, textures: 0 });
  const [modelLoading, setModelLoading] = useState("");
  const [rigStage, setRigStage] = useState("");
  const [soundtrack, setSoundtrack] = useState(null);
  const [poseBone, setPoseBone] = useState("LeftArm");
  const [poseVersion, setPoseVersion] = useState(0);

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => {
    performanceModeRef.current = performanceMode;
    localStorage.setItem("neon:three-quality", performanceMode);
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const reduced = performanceMode === "performance";
    if (performanceMode !== "auto") {
      performanceSampleRef.current.reduced = reduced;
      runtime.renderer.setPixelRatio(reduced ? 1 : Math.min(window.devicePixelRatio, 2));
      runtime.renderer.shadowMap.enabled = true;
      runtime.renderer.shadowMap.needsUpdate = true;
      setPerformanceReduced(reduced);
    }
  }, [performanceMode]);

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

  function objectSummary(object, { depth = 0, parentGroupId = "" } = {}) {
    const material = object.material && !Array.isArray(object.material) ? object.material : null;
    const category = object.userData?.editorType === "group" || parentGroupId
      ? "groups"
      : object.isLight ? "lights" : object.userData?.bundledModel ? "characters" : "objects";
    return {
      id: object.userData.editorId,
      name: object.name,
      type: object.userData.editorType || "model",
      visible: object.visible,
      locked: Boolean(object.userData.locked),
      category,
      depth,
      parentGroupId,
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
    const expected = String(boneId || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
    let match = null;
    character?.traverse((object) => {
      const normalized = String(object.name || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
      if (!match && object.isBone && normalized.endsWith(expected)) match = object;
    });
    return match;
  }

  function poseBoneOptions(character) {
    const semantic = POSE_BONES.filter((entry) => findRigBone(character, entry.id));
    const seen = new Set(semantic.map((entry) => findRigBone(character, entry.id)?.uuid));
    const other = [];
    character?.traverse((item) => {
      if (item.isBone && !seen.has(item.uuid)) other.push({ id: item.name, name: item.name });
    });
    return [...semantic, ...other];
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
    setStatus(`${POSE_BONES.find((entry) => entry.id === poseBone)?.name || bone.name} ajustado`);
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
        effectsVisible: runtime.sceneEffectSystem.group.visible,
        spaceVisible: runtime.spaceScene.visible,
        spaceShipVisible: runtime.spaceShipSet.visible,
        spacePanoramaVisible: runtime.spacePanorama.visible,
        cloudsPanoramaVisible: runtime.cloudsPanoramaBackdrop.visible,
        medievalVillagePanoramaVisible: runtime.medievalVillagePanorama.visible,
        spiderwebRuinsPanoramaVisible: runtime.spiderwebRuinsPanorama.visible
      };
      runtime.scene.background = new Color("#111318");
      runtime.scene.environment = null;
      runtime.scene.environmentIntensity = 0;
      runtime.floor.visible = false;
      runtime.sceneEffectSystem.group.visible = false;
      runtime.spaceScene.visible = false;
      runtime.spaceShipSet.visible = false;
      runtime.spacePanorama.visible = false;
      runtime.cloudsPanoramaBackdrop.visible = false;
      runtime.medievalVillagePanorama.visible = false;
      runtime.spiderwebRuinsPanorama.visible = false;
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
    runtime.spaceScene.visible = saved.spaceVisible;
    runtime.spaceShipSet.visible = saved.spaceShipVisible;
    runtime.spacePanorama.visible = saved.spacePanoramaVisible;
    runtime.cloudsPanoramaBackdrop.visible = saved.cloudsPanoramaVisible;
    runtime.medievalVillagePanorama.visible = saved.medievalVillagePanoramaVisible;
    runtime.spiderwebRuinsPanorama.visible = saved.spiderwebRuinsPanoramaVisible;
    environmentIsolationRef.current = null;
    setEnvironmentIsolated(false);
    setStatus("Fondo, piso y efectos restaurados");
  }

  function attachSelectedToHand(targetPoint = attachmentHand) {
    const runtime = runtimeRef.current;
    const object = selectedRef.current;
    if (!runtime || !object || object.isLight) return;
    const validPoints = new Set(ATTACHMENT_POINTS);
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
    const wasAttached = Boolean(object.userData?.editableAttachment);
    target.hand.attach(object);
    if (!wasAttached) object.position.set(0, 0, 0);
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
    const editable = [];
    const listed = new Set();
    const addEditable = (object, depth = 0, parentGroupId = "") => {
      if (!object.userData?.editorId || listed.has(object)) return;
      editable.push(objectSummary(object, { depth, parentGroupId }));
      listed.add(object);
      if (object.userData?.editorType === "group") {
        object.children.forEach((child) => addEditable(child, depth + 1, object.userData.editorId));
      }
    };
    runtime.content.children.forEach((object) => addEditable(object));
    runtime.content.traverse((object) => {
      if (object.userData?.editableAttachment) addEditable(object);
    });
    setObjects(editable);
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
      beatLight: object.isLight ? { enabled: false, amount: 1.5, colorA: "#ff176b", colorB: "#28d7ff", ...(object.userData.beatLight || {}) } : null,
      textureName: object.userData.textureName || "",
      textureRepeat: material?.map ? [round(material.map.repeat.x), round(material.map.repeat.y)] : [1, 1],
      spin: {
        enabled: Boolean(object.userData.spin?.enabled),
        axis: object.userData.spin?.axis || "y",
        speed: object.userData.spin?.speed ?? 30
      },
      modelAnimation: object.userData.modelAnimation ? { ...object.userData.modelAnimation } : null,
      locomotion: object.userData.locomotion ? { ...object.userData.locomotion } : null,
      maskPulse: object.userData.maskPulse ? { ...object.userData.maskPulse, position: [...object.userData.maskPulse.position] } : null,
      tvScreen: object.userData.tvScreen ? { scale: [...object.userData.tvScreen.scale], offset: [...object.userData.tvScreen.offset] } : null
    });
  }

  function registerModelAnimations(object, clips = object?.animations || []) {
    const runtime = runtimeRef.current;
    if (!runtime || !object?.userData?.editorId || !clips.length) return;
    if (object.userData.bundledModel === "neonBoy-walking-alta" && object.userData.locomotion) {
      object.userData.locomotion.gaitUnitsPerSecond ||= HD_WALK_GAIT_UNITS_PER_SECOND;
    }
    const preparedClips = prepareModelAnimationClips(object, clips);
    if (!preparedClips.length) return;
    runtime.mixers.get(object.userData.editorId)?.mixer.stopAllAction();
    const mixer = new THREE.AnimationMixer(object);
    const actions = new Map(preparedClips.map((clip) => [clip.name || "Animacion", mixer.clipAction(clip)]));
    const saved = object.userData.modelAnimation || {};
    const activeName = actions.has(saved.clip) ? saved.clip : actions.keys().next().value;
    const active = actions.get(activeName);
    const playing = saved.playing !== false;
    const speed = saved.speed ?? 1;
    active.reset().play();
    active.paused = !playing;
    mixer.timeScale = speed;
    object.animations = preparedClips;
    object.userData.modelAnimation = { clip: activeName, clips: [...actions.keys()], playing, speed };
    runtime.mixers.set(object.userData.editorId, { mixer, actions, active, object, performanceVisible: true });
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
    const availableBones = poseBoneOptions(object);
    if (availableBones.length && !availableBones.some((entry) => entry.id === poseBone)) setPoseBone(availableBones[0].id);
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
    const attachmentPoint = attachmentPointFromBoneName(object?.userData?.attachmentBone);
    if (attachmentPoint) setAttachmentHand(attachmentPoint);
    syncSelection(object);
  }

  function serializeBundledDescriptor(object) {
    const attachments = [];
    object.traverse((item) => {
      if (!item.userData?.editableAttachment || item === object) return;
      attachments.push({
        assetId: item.userData.bundledStaticModel,
        name: item.name,
        position: item.position.toArray(),
        quaternion: item.quaternion.toArray(),
        scale: item.scale.toArray(),
        visible: item.visible,
        userData: structuredClone(item.userData)
      });
    });
    return {
      kind: object.userData.bundledModel ? "character" : "static",
      assetId: object.userData.bundledModel || object.userData.bundledStaticModel,
      name: object.name,
      position: object.position.toArray(),
      quaternion: object.quaternion.toArray(),
      scale: object.scale.toArray(),
      visible: object.visible,
      userData: structuredClone(object.userData),
      attachments
    };
  }

  function canReferenceBundledObject(object) {
    if (!object.userData?.bundledModel && !object.userData?.bundledStaticModel) return false;
    let hasEditedGeometry = false;
    object.traverse((item) => { hasEditedGeometry ||= Boolean(item.userData?.sculpted); });
    return !hasEditedGeometry;
  }

  function serializeScene({ forHistory = false, forAutosave = false } = {}) {
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
      schemaVersion: forAutosave ? 3 : 2,
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
      floorColorVersion: 1,
      floorSurface,
      grassSettings,
      lavaSettings,
      realisticSky,
      renderResolution,
      transparentPng,
      keyLightIntensity: runtime.keyLight?.intensity ?? 1.8,
      keyLightColor: `#${runtime.keyLight.color.getHexString()}`,
      ambientColor: `#${runtime.ambient.color.getHexString()}`,
      ambientGroundColor: `#${runtime.ambient.groundColor.getHexString()}`,
      content: forHistory || forAutosave ? null : runtime.content.toJSON(),
      historyContent: forHistory ? cloneContentForHistory(runtime.content) : null,
      contentItems: forAutosave ? runtime.content.children.map((child) => (
        canReferenceBundledObject(child)
          ? { bundled: serializeBundledDescriptor(child) }
          : { json: child.toJSON() }
      )) : null,
      geometryOverrides,
      camera: {
        position: runtime.camera.position.toArray(),
        target: runtime.orbit.target.toArray(),
        up: runtime.camera.up.toArray(),
        fov: runtime.camera.fov,
        near: runtime.camera.near,
        cinematic: cinematicCamera
      },
      animationDuration,
      animationTracks,
      animationLoop,
      cameraShake,
      cameraFollow,
      slowMotion,
      freezeMotion,
      activeLightingRig,
      lightingRigBaseline: lightingRigBaselineRef.current,
      editor: { mode, propertyTab, directorPreset, deformAmount, sculptBrush, sculptRadius, sculptStrength, selectedId }
    };
  }

  function pushHistory() {
    if (historyRef.current.restoring) return;
    const snapshot = serializeScene({ forHistory: true });
    if (!snapshot) return;
    historyRef.current.undo.push(snapshot);
    let vertices = 0;
    runtimeRef.current?.content.traverse((item) => { vertices += item.geometry?.attributes?.position?.count || 0; });
    const historyLimit = vertices > 1_000_000 ? 3 : vertices > 350_000 ? 6 : 15;
    while (historyRef.current.undo.length > historyLimit) historyRef.current.undo.shift();
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
    const loaded = state.historyContent || new THREE.ObjectLoader().parse(state.content);
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
    runtime.camera.up.fromArray(state.camera?.up || [0, 1, 0]);
    runtime.camera.fov = state.camera?.fov ?? 45;
    runtime.camera.near = state.camera?.near ?? 0.05;
    runtime.camera.updateProjectionMatrix();
    runtime.orbit.update();
    setCinematicCamera({ ...DEFAULT_CINEMATIC_CAMERA, ...(state.camera?.cinematic || {}) });
    const loadedOrbit = new THREE.Spherical().setFromVector3(runtime.camera.position.clone().sub(runtime.orbit.target));
    cameraOrbitRef.current = { lastTheta: loadedOrbit.theta, theta: loadedOrbit.theta };
    setBackground(state.background || DEFAULT_BACKGROUND);
    const legacyShip = state.environmentBackground === "sky-castle-courtyard";
    setEnvironmentBackground(legacyShip ? "sky-space-ship" : state.environmentBackground || "solid");
    setSkyMotionEnabled(state.skyMotionEnabled !== false);
    setSkyMotionSpeed(state.skyMotionSpeed ?? 0.35);
    setSceneEffects(Object.fromEntries(Object.entries(DEFAULT_SCENE_EFFECTS).map(([key, defaults]) => [key,
      key === "apocalypseLighting" ? {
        ...defaults, ...state.sceneEffects?.apocalypseLighting,
        enabled: state.sceneEffects?.apocalypseLighting?.enabled ?? (state.floorSurface === "apocalypse")
      } : key === "apocalypseFires" ? normalizeApocalypseFires(state.sceneEffects?.apocalypseFires || {
        enabled: state.floorSurface === "apocalypse"
      }) : key === "magic" ? normalizeMagicSettings(state.sceneEffects?.magic || {
        enabled: state.environmentBackground === "sky-ruined-gothic-church"
      }) : key === "churchLighting" ? normalizeChurchLighting(state.sceneEffects?.churchLighting || {
        enabled: state.environmentBackground === "sky-ruined-gothic-church" && !state.activeLightingRig
      }) : key === "cemeteryLighting" ? normalizeCemeteryLighting(state.sceneEffects?.cemeteryLighting)
        : key === "castleLighting" ? normalizeCastleLighting(state.sceneEffects?.castleLighting || {
          enabled: state.environmentBackground === "sky-castle-interior"
        })
        : key === "gothicLighting" ? normalizeGothicLighting(state.sceneEffects?.gothicLighting || {
          enabled: state.environmentBackground === "sky-gothic-church"
        })
        : key === "space" ? normalizeSpaceSettings(state.sceneEffects?.space)
        : key === "fog" ? normalizeChurchFog(legacyShip
          && state.sceneEffects?.fog?.intensity === 0.12 && state.sceneEffects?.fog?.color === "#9aa69e"
          ? DEFAULT_SCENE_EFFECTS.fog
          : state.environmentBackground === "sky-gothic-church"
          && state.sceneEffects?.fog?.intensity === 0.18 && state.sceneEffects?.fog?.color === "#75849a"
          ? { ...state.sceneEffects.fog, intensity: 0.035, height: 1.1, coverage: 24, color: "#41424d" }
          : state.environmentBackground === "sky-night-swamp" && state.sceneEffects?.fog?.intensity === 0.58
            && state.sceneEffects?.fog?.color === "#41665f"
            ? { ...state.sceneEffects.fog, intensity: 0.14, height: 1.7, coverage: 46, color: "#263c3b" }
            : state.environmentBackground === "sky-medieval-apocalypse" && state.sceneEffects?.fog?.intensity === 0.34
              && state.sceneEffects?.fog?.color === "#6b4038"
              ? { ...state.sceneEffects.fog, intensity: 0.1, height: 2.8, coverage: 38,
                  color: "#4c3938", windSpeed: 0.48, windDirection: 42 }
            : state.sceneEffects?.fog)
        : key === "rain" ? normalizeRain(state.sceneEffects?.rain)
          : key === "storm" ? normalizeStorm(state.sceneEffects?.storm)
            : key === "particles" && legacyShip && state.sceneEffects?.particles?.intensity === 0.2
              && state.sceneEffects?.particles?.color === "#e6c98d"
              ? { ...defaults, enabled: true, intensity: 0.06, color: "#8ce5e2" }
              : { ...defaults, ...state.sceneEffects?.[key] }
    ])));
    setGridVisible(legacyShip ? false : state.gridVisible !== false);
    setAmbientIntensity(state.ambientIntensity ?? 0.7);
    setExposure(state.exposure ?? 1.15);
    setFloorVisible(state.floorVisible !== false);
    const oldGothicFloorColor = !state.floorColor || String(state.floorColor).toLowerCase() === "#443f3c";
    const legacyCastleFloor = state.environmentBackground === "sky-castle-interior" && state.floorSurface === "gothic-church" && oldGothicFloorColor;
    const legacyGothicFloor = state.environmentBackground === "sky-gothic-church" && state.floorSurface === "gothic-church" && oldGothicFloorColor;
    const legacySwampFloor = state.environmentBackground === "sky-night-swamp" && state.floorSurface === "night-swamp"
      && String(state.floorColor).toLowerCase() === "#193c35";
    const legacyMedievalFloor = state.environmentBackground === "sky-medieval-apocalypse"
      && state.floorSurface === "medieval-apocalypse" && String(state.floorColor).toLowerCase() === "#5d4436";
    const legacySpaceFloor = state.environmentBackground === "sky-space" && state.floorSurface === "fantasy";
    const legacyShipFloor = legacyShip && state.floorSurface === "ruined-gothic-church";
    const restoredFloorSurface = legacyShipFloor ? "ship-deck" : legacyCastleFloor ? "castle-stone" : legacySpaceFloor ? "space-nebula"
      : state.floorSurface || (state.environmentBackground && state.environmentBackground !== "solid" ? "shadow" : "plastic");
    setFloorColor(legacyCastleFloor ? defaultFloorColor("castle-stone") : legacyGothicFloor ? defaultFloorColor("gothic-church")
      : legacySwampFloor ? defaultFloorColor("night-swamp")
      : legacyMedievalFloor ? defaultFloorColor("medieval-apocalypse")
      : state.floorColorVersion === 1 || restoredFloorSurface === "plastic"
        ? (state.floorColor || defaultFloorColor(restoredFloorSurface)) : defaultFloorColor(restoredFloorSurface));
    setFloorSurface(restoredFloorSurface);
    const savedGrass = state.grassSettings || {};
    const restoredGrass = savedGrass.styleVersion === DEFAULT_GRASS_SETTINGS.styleVersion
      ? { ...DEFAULT_GRASS_SETTINGS, ...savedGrass }
      : {
          ...DEFAULT_GRASS_SETTINGS,
          enabled: savedGrass.enabled ?? DEFAULT_GRASS_SETTINGS.enabled,
          windStrength: savedGrass.windStrength ?? DEFAULT_GRASS_SETTINGS.windStrength,
          windSpeed: savedGrass.windSpeed ?? DEFAULT_GRASS_SETTINGS.windSpeed
        };
    grassSettingsRef.current = restoredGrass;
    setGrassSettings(restoredGrass);
    const restoredLava = { ...DEFAULT_LAVA_SETTINGS, ...(state.lavaSettings || {}) };
    lavaSettingsRef.current = restoredLava;
    setLavaSettings(restoredLava);
    const savedSky = state.realisticSky || {};
    const restoredSky = savedSky.styleVersion === DEFAULT_REALISTIC_SKY.styleVersion
      ? { ...DEFAULT_REALISTIC_SKY, ...savedSky }
      : { ...DEFAULT_REALISTIC_SKY, enabled: savedSky.enabled ?? DEFAULT_REALISTIC_SKY.enabled };
    realisticSkyRef.current = restoredSky;
    setRealisticSky(restoredSky);
    setRenderResolution(state.renderResolution || "1920x1080");
    setTransparentPng(Boolean(state.transparentPng));
    runtime.keyLight.intensity = state.keyLightIntensity ?? 1.8;
    runtime.keyLight.color.set(state.keyLightColor || "#ffffff");
    runtime.ambient.color.set(state.ambientColor || "#ffffff");
    runtime.ambient.groundColor.set(state.ambientGroundColor || "#384152");
    animationDurationRef.current = state.animationDuration || 5;
    setAnimationDuration(animationDurationRef.current);
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
    const legacyFreeze = state.freezeMotion && !Array.isArray(state.freezeMotion) && state.freezeMotion.enabled
      ? [{ id: crypto.randomUUID(), ...state.freezeMotion }]
      : [];
    const restoredFreezeMotion = (Array.isArray(state.freezeMotion) ? state.freezeMotion : legacyFreeze)
      .map((segment) => ({ id: segment.id || crypto.randomUUID(), resume: "smooth", resumeDuration: 1.5, ...segment }));
    freezeMotionRef.current = restoredFreezeMotion;
    setFreezeMotion(restoredFreezeMotion);
    let restoredLightingRig = state.activeLightingRig || "";
    if (!restoredLightingRig) runtime.content.traverse((item) => { restoredLightingRig ||= item.userData?.lightRig || ""; });
    lightingRigBaselineRef.current = state.lightingRigBaseline || null;
    setActiveLightingRig(restoredLightingRig);
    animationTimeRef.current = 0;
    setAnimationTime(0);
    setAnimationPlaying(false);
    refreshObjects();
    setPropertyTab(state.editor?.propertyTab || "object");
    setDirectorPreset(state.editor?.directorPreset || (state.camera?.cinematic?.preset ? "selected-camera" : "hollywood"));
    setDeformAmount(state.editor?.deformAmount ?? 0.25);
    setSculptBrush(state.editor?.sculptBrush || "inflate");
    setSculptRadius(state.editor?.sculptRadius ?? 0.65);
    setSculptStrength(state.editor?.sculptStrength ?? 0.3);
    setMode(state.editor?.mode || "translate");
    const restoredSelection = findEditorObject(state.editor?.selectedId);
    selectObject(restoredSelection || null);
  }

  async function loadAutosaveState(state) {
    const runtime = runtimeRef.current;
    if (!runtime || !state?.contentItems) return;
    const emptyContent = new THREE.Group().toJSON();
    loadSceneState({ ...state, content: emptyContent, contentItems: null });
    for (const item of state.contentItems) {
      if (item.json) {
        const restored = new THREE.ObjectLoader().parse(item.json);
        runtime.content.add(restored);
        registerModelAnimations(restored);
        continue;
      }
      const descriptor = item.bundled;
      const preset = descriptor.kind === "character"
        ? findCharacterPreset(descriptor.assetId)
        : STATIC_MODELS.find((entry) => entry.id === descriptor.assetId);
      if (!preset) continue;
      const gltf = await loadStaticPreset(preset);
      const object = gltf.scene;
      object.name = descriptor.name;
      object.position.fromArray(descriptor.position);
      object.quaternion.fromArray(descriptor.quaternion);
      object.scale.fromArray(descriptor.scale);
      object.visible = descriptor.visible !== false;
      object.userData = { ...object.userData, ...descriptor.userData };
      object.animations = gltf.animations;
      ensureNeonMaskPulse(object);
      ensureDemonEyePulse(object);
      ensureAngelHalo(object);
      ensureRetroTvScreen(object);
      runtime.content.add(object);
      registerModelAnimations(object, gltf.animations);
      for (const attachment of descriptor.attachments || []) {
        const attachmentPreset = STATIC_MODELS.find((entry) => entry.id === attachment.assetId);
        const bone = object.getObjectByName(attachment.userData?.attachmentBone);
        if (!attachmentPreset || !bone) continue;
        const attachmentGltf = await loadStaticPreset(attachmentPreset);
        const attachedObject = attachmentGltf.scene;
        attachedObject.name = attachment.name;
        attachedObject.position.fromArray(attachment.position);
        attachedObject.quaternion.fromArray(attachment.quaternion);
        attachedObject.scale.fromArray(attachment.scale);
        attachedObject.visible = attachment.visible !== false;
        attachedObject.userData = { ...attachedObject.userData, ...attachment.userData };
        bone.add(attachedObject);
      }
    }
    refreshObjects();
    const restoredSelection = findEditorObject(state.editor?.selectedId);
    selectObject(restoredSelection || null);
  }

  function undo() {
    const previous = historyRef.current.undo.pop();
    if (!previous) return;
    historyRef.current.redo.push(serializeScene({ forHistory: true }));
    historyRef.current.restoring = true;
    loadSceneState(previous);
    historyRef.current.restoring = false;
    setHistoryCounts({ undo: historyRef.current.undo.length, redo: historyRef.current.redo.length });
  }

  function redo() {
    const next = historyRef.current.redo.pop();
    if (!next) return;
    historyRef.current.undo.push(serializeScene({ forHistory: true }));
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
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: false, stencil: false });
      setWebglError("");
    } catch (error) {
      console.error(error);
      setWebglError("Chrome no pudo iniciar WebGL. Cierra todas las ventanas de Chrome y vuelve a abrir la aplicacion.");
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    let contextLost = false;
    const handleContextLost = (event) => {
      event.preventDefault();
      contextLost = true;
      setWebglError("La GPU interrumpio el motor 3D. Esperando recuperacion automatica...");
      setStatus("Contexto grafico perdido");
    };
    const handleContextRestored = () => {
      contextLost = false;
      renderer.resetState();
      renderer.shadowMap.needsUpdate = true;
      setWebglError("");
      setStatus("Motor 3D recuperado");
    };
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost, false);
    renderer.domElement.addEventListener("webglcontextrestored", handleContextRestored, false);
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
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 120;
    keyLight.shadow.camera.left = -32;
    keyLight.shadow.camera.right = 32;
    keyLight.shadow.camera.top = 32;
    keyLight.shadow.camera.bottom = -32;
    keyLight.shadow.bias = -0.00015;
    keyLight.shadow.normalBias = 0.025;
    keyLight.shadow.radius = 2;
    keyLight.shadow.camera.updateProjectionMatrix();
    scene.add(keyLight);
    const cemeteryFill = new THREE.DirectionalLight(0xc1d8e8, 1.0);
    cemeteryFill.position.set(-7, 9, 11);
    cemeteryFill.visible = false;
    scene.add(cemeteryFill);
    const cemeteryMoonLights = [
      { position: [-13, 15, 1], target: [-12, 0, -15], intensity: 210 },
      { position: [18, 14, -4], target: [16, 0, -20], intensity: 155 }
    ].map(({ position, target, intensity }, index) => {
      const light = new THREE.SpotLight(0xa8c4dd, intensity, 40, 0.58, 0.86, 2);
      light.name = `Luz lunar de cementerio ${index + 1}`;
      light.position.set(...position);
      light.target.position.set(...target);
      light.visible = false;
      scene.add(light, light.target);
      return light;
    });
    const grid = new THREE.GridHelper(40, 40, 0x65707d, 0x353b43);
    scene.add(grid);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(280, 280),
      new THREE.MeshStandardMaterial({ color: 0x24272d, metalness: 0, roughness: 0.92 })
    );
    floor.name = "Piso de estudio";
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.015;
    floor.receiveShadow = true;
    scene.add(floor);
    const grass = createProceduralGrass();
    grass.visible = false;
    scene.add(grass);
    const realisticSkyDome = createRealisticSkyDome();
    realisticSkyDome.visible = false;
    scene.add(realisticSkyDome);
    const sceneEffectSystem = createSceneEffectSystem();
    scene.add(sceneEffectSystem.group);
    const spaceScene = createSpaceScene();
    scene.add(spaceScene);
    const spaceShipSet = createSpaceShipSet();
    scene.add(spaceShipSet);
    const spacePanorama = createPanoramaBackdrop({
      name: "Panorama nitido espacial", horizontalRepeat: 3.8, horizontalOffset: -0.68, horizontalMirror: true,
      horizonCompression: 1.5, verticalScale: 1.55
    });
    scene.add(spacePanorama);
    const ruinedChurchDebris = createRuinedChurchDebrisSystem();
    scene.add(ruinedChurchDebris);
    const apocalypseDebris = createApocalypseDebrisSystem();
    scene.add(apocalypseDebris);
    const medievalSet = createMedievalSet();
    scene.add(medievalSet);
    const moonlitPeaksSet = createMoonlitPeaksSet();
    scene.add(moonlitPeaksSet);
    const cemeteryDetails = createCemeteryDetails();
    scene.add(cemeteryDetails);
    const cemeteryBats = createCemeteryBats();
    scene.add(cemeteryBats);
    const swampBats = createCemeteryBats({
      name: "Murcielagos del pantano",
      flocks: [
        { x: -12, z: -17, height: 7, range: 8 },
        { x: 13, z: -21, height: 8, range: 9 },
        { x: 0, z: -34, height: 10, range: 15 }
      ], sizeScale: 1.55, batColor: 0x35443d
    });
    scene.add(swampBats);
    const swampSet = createSwampSet();
    scene.add(swampSet);
    const castleInterior = createCastleInteriorSet();
    scene.add(castleInterior);
    const gothicInterior = createGothicChurchInterior();
    scene.add(gothicInterior);
    const churchPanorama = createChurchPanorama();
    scene.add(churchPanorama);
    const infernalPanorama = createPanoramaBackdrop({
      name: "Panorama nitido infernal", horizontalRepeat: 2.7, horizontalMirror: true, horizonCompression: 2.5
    });
    scene.add(infernalPanorama);
    const apocalypsePanorama = createPanoramaBackdrop({
      name: "Panorama nitido de apocalipsis", horizontalRepeat: 3.6, horizonCompression: 2.5
    });
    scene.add(apocalypsePanorama);
    const medievalPanorama = createPanoramaBackdrop({
      name: "Panorama nitido medieval", horizontalRepeat: 4.6, horizontalOffset: -0.13,
      horizonCompression: 1.7, verticalOffset: 0.03, verticalScale: 2.05,
      seamBlend: 0.08, zenithCap: 1
    });
    scene.add(medievalPanorama);
    const cemeteryPanorama = createPanoramaBackdrop({
      name: "Panorama nitido de cementerio", horizontalRepeat: 3, horizonCompression: 1.5,
      verticalOffset: -0.3, verticalScale: 2.2, horizonFade: 0.065,
      horizonColor: "#2c3942", seamBlend: 0.09
    });
    scene.add(cemeteryPanorama);
    const moonlitPanorama = createPanoramaBackdrop({
      name: "Panorama nitido de cumbres luna llena", horizontalRepeat: 2,
      horizontalOffset: 0.72, horizonCompression: 1.25, verticalOffset: -0.28,
      verticalScale: 2.7, horizontalMirror: true, zenithCap: 1
    });
    scene.add(moonlitPanorama);
    const castlePanorama = createCastleBackdrop();
    scene.add(castlePanorama);
    const gothicPanorama = createGothicChurchBackdrop();
    scene.add(gothicPanorama);
    const swampPanorama = createPanoramaBackdrop({
      name: "Panorama nitido de pantano", horizontalRepeat: 2.6, horizontalOffset: 0.84,
      horizonCompression: 1.8, verticalOffset: 0.13, verticalScale: 1.32,
      horizonFade: 0, seamBlend: 0.08, zenithCap: 1
    });
    scene.add(swampPanorama);
    const cloudsPanoramaBackdrop = createPanoramaBackdrop({
      name: "Panorama nitido de nubes", horizontalMirror: true,
      horizonCompression: 1.7, verticalScale: 1.3
    });
    scene.add(cloudsPanoramaBackdrop);
    const medievalVillagePanorama = createPanoramaBackdrop({
      name: "Panorama nitido de aldea medieval", horizontalRepeat: 4.3,
      horizontalOffset: -1.65, horizontalMirror: true,
      horizonCompression: 3, verticalScale: 3.1, verticalOffset: -0.19
    });
    scene.add(medievalVillagePanorama);
    const spiderwebRuinsPanorama = createPanoramaBackdrop({
      name: "Panorama nitido de ruinas de telaranas", horizontalRepeat: 4.3,
      horizontalOffset: -1.6, horizontalMirror: true,
      horizonCompression: 3, verticalScale: 3.1, verticalOffset: -0.19
    });
    scene.add(spiderwebRuinsPanorama);

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
    let shipPointerStart = null;
    let shipHover = null;
    const canvasCursor = renderer.domElement.style.cursor;
    const canvasTitle = renderer.domElement.title;
    const setShipHover = (hit) => {
      const id = hit?.object.userData.shipInteraction || null;
      if (id === shipHover) return;
      shipHover = id;
      spaceShipSet.userData.hover(id);
      renderer.domElement.style.cursor = id ? "pointer" : canvasCursor;
      const names = { anatomy: "anatomia", orbit: "orbitas", navigation: "navegacion" };
      renderer.domElement.title = id ? "Cambiar holograma: " + names[id] : canvasTitle;
    };
    const visibleShipHit = (contentHits) => {
      const hit = spaceShipSet.userData.pick(raycaster);
      if (!hit) return null;
      const foreground = (contentHits || raycaster.intersectObjects(content.children, true))[0];
      return foreground && foreground.distance < hit.distance ? null : hit;
    };
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
      const shipHit = event.button === 0 && !event.shiftKey && !transform.axis ? visibleShipHit(hits) : null;
      if (shipHit) {
        shipPointerStart = { id: shipHit.object.userData.shipInteraction, pointerId: event.pointerId,
          x: event.clientX, y: event.clientY };
        return;
      }
      shipPointerStart = null;
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
      if (shipPointerStart && Math.hypot(event.clientX - shipPointerStart.x, event.clientY - shipPointerStart.y) > 5) {
        shipPointerStart = null;
      }
      const navigationStart = cameraNavigationRef.current;
      if (navigationStart?.canvas && !transform.dragging && Math.hypot(event.clientX - navigationStart.x, event.clientY - navigationStart.y) > 5) {
        releaseCameraForManualNavigation();
        cameraNavigationRef.current = null;
      }
      if (modeRef.current !== "sculpt") {
        if (!event.buttons && !transform.dragging && !transform.axis) {
          setPointerRay(event);
          setShipHover(visibleShipHit());
        } else setShipHover(null);
        return;
      }
      setShipHover(null);
      const hit = sculptHit(event);
      brushCursor.visible = Boolean(hit);
      if (!hit) return;
      brushCursor.position.copy(hit.point);
      brushCursor.scale.setScalar(sculptSettingsRef.current.radius);
      if (sculptingRef.current) applySculptStroke(hit);
    };
    const onPointerUp = (event) => {
      if (cameraNavigationRef.current?.canvas) cameraNavigationRef.current = null;
      const shipStart = shipPointerStart;
      shipPointerStart = null;
      if (shipStart && event.type === "pointerup" && event.pointerId === shipStart.pointerId
        && !transform.dragging && Math.hypot(event.clientX - shipStart.x, event.clientY - shipStart.y) <= 5) {
        setPointerRay(event);
        const hit = visibleShipHit();
        if (hit?.object.userData.shipInteraction === shipStart.id) {
          const message = spaceShipSet.userData.activate(shipStart.id);
          if (message) setStatus(message);
        }
      }
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
      shipPointerStart = null;
      setShipHover(null);
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

    const runtime = { scene, camera, renderer, content, ambient, floor, grass, realisticSkyDome, churchPanorama, infernalPanorama, apocalypsePanorama, medievalPanorama, cemeteryPanorama, moonlitPanorama, castlePanorama, gothicPanorama, swampPanorama, spacePanorama, cloudsPanoramaBackdrop, medievalVillagePanorama, spiderwebRuinsPanorama, castleInterior, gothicInterior, swampSet, medievalSet, moonlitPeaksSet, spaceScene, spaceShipSet, grid, keyLight, cemeteryFill, cemeteryMoonLights, orbit, transform, transformHelper, brushCursor, sceneEffectSystem, ruinedChurchDebris, apocalypseDebris, cemeteryDetails, cemeteryBats, swampBats, lightHelper: null, lightMarkers: new Map(), mixers: new Map(), poseApplications: new Map(), poseBoneCache: new WeakMap(), poseRotationCache: new WeakMap(), backgroundTexture: null, baseEnvironment: environmentTexture };
    runtimeRef.current = runtime;
    sceneEffectSystem.churchLighting.userData.bind(scene, { ambient, keyLight, ruins: ruinedChurchDebris, panorama: churchPanorama });
    const cemeteryLighting = createCemeteryLighting(scene, { ambient, keyLight, fill: cemeteryFill, moonLights: cemeteryMoonLights, panorama: cemeteryPanorama });
    castleInterior.userData.bind(scene, { ambient, keyLight, panorama: castlePanorama });
    let frame = 0;
    let renderCount = 0;
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
    const beatLightColorA = new Color();
    const beatLightColorB = new Color();
    const performanceObjectPosition = new Vector3();
    const locomotionDirection = new Vector3();
    const poseInverseRotation = new THREE.Quaternion();
    const render = (time = 0) => {
      frame = requestAnimationFrame(render);
      if (!activeRef.current || contextLost) {
        previousRenderTime = time;
        return;
      }
      if (!cameraShotRef.current?.frame) orbit.update();
      renderCount += 1;
      const delta = previousRenderTime ? Math.min((time - previousRenderTime) / 1000, 0.05) : 0;
      previousRenderTime = time;
      const performanceSample = performanceSampleRef.current;
      performanceSample.startedAt ||= time;
      performanceSample.frames += 1;
      if (time - performanceSample.startedAt >= 1500) {
        const fps = performanceSample.frames * 1000 / (time - performanceSample.startedAt);
        const triangles = renderer.info.render.triangles;
        setPerformanceStats({
          fps: Math.round(fps),
          triangles,
          geometries: renderer.info.memory.geometries,
          textures: renderer.info.memory.textures
        });
        const mode = performanceModeRef.current;
        const shouldReduce = mode === "performance" || (mode === "auto" && (performanceSample.reduced ? fps < 52 : fps < 34));
        if (shouldReduce !== performanceSample.reduced) {
          performanceSample.reduced = shouldReduce;
          renderer.setPixelRatio(shouldReduce ? 1 : Math.min(window.devicePixelRatio, 2));
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.needsUpdate = true;
          setPerformanceReduced(shouldReduce);
        }
        performanceSample.startedAt = time;
        performanceSample.frames = 0;
      }
      const timelineTime = animationTimeRef.current;
      const sceneMotionFactor = freezeMotionFactorAt(timelineTime, freezeMotionRef.current);
      const sceneDelta = scenePlaybackRef.current.paused ? 0 : delta * sceneMotionFactor;
      scenePlaybackRef.current.elapsed += sceneDelta * 1000;
      const sceneTime = scenePlaybackRef.current.elapsed;
      const infernalFloorActive = Boolean(runtime.floor.visible && runtime.floor.userData.surface === "infernal");
      ruinedChurchDebris.visible = Boolean(runtime.floor.visible && runtime.floor.userData.surface === "ruined-gothic-church");
      apocalypseDebris.visible = Boolean(runtime.floor.visible && runtime.floor.userData.surface === "apocalypse");
      const sceneSky = skyMotionRef.current.preset;
      spaceShipSet.userData.animate(sceneTime, Boolean(runtime.floor.visible && runtime.floor.userData.surface === "ship-deck"
        && sceneSky === "sky-space-ship" && !environmentIsolationRef.current), performanceSampleRef.current.reduced);
      if (!spaceShipSet.visible && shipHover) setShipHover(null);
      medievalSet.userData.animate(sceneTime, Boolean(runtime.floor.visible && runtime.floor.userData.surface === "medieval-apocalypse"
        && (sceneSky === "sky-medieval-apocalypse" || sceneSky === "sky-medieval-village")),
      sceneSky === "sky-medieval-village" ? "village" : "battle");
      moonlitPeaksSet.userData.animate(sceneTime, Boolean(runtime.floor.visible && runtime.floor.userData.surface === "moonlit-peaks"
        && sceneSky === "sky-moonlit-peaks"), camera, performanceSampleRef.current.reduced);
      cemeteryDetails.visible = Boolean(runtime.floor.visible && runtime.floor.userData.surface === "cemetery");
      const castleActive = Boolean(runtime.floor.visible && runtime.floor.userData.surface === "castle-stone" && skyMotionRef.current.preset === "sky-castle-interior");
      castleInterior.userData.animate(sceneEffectsRef.current.castleLighting, sceneTime, castleActive, performanceSampleRef.current.reduced);
      const gothicActive = Boolean(runtime.floor.visible && runtime.floor.userData.surface === "gothic-church" && skyMotionRef.current.preset === "sky-gothic-church");
      gothicInterior.userData.animate(sceneEffectsRef.current.gothicLighting, sceneTime, gothicActive, performanceSampleRef.current.reduced);
      if (cemeteryDetails.visible) cemeteryDetails.userData.animate(sceneTime, performanceSampleRef.current.reduced);
      cemeteryBats.visible = cemeteryDetails.visible && skyMotionRef.current.preset === "sky-cemetery";
      if (cemeteryBats.visible) cemeteryBats.userData.animate(sceneTime, camera, performanceSampleRef.current.reduced);
      const swampActive = Boolean(runtime.floor.visible && runtime.floor.userData.surface === "night-swamp" && skyMotionRef.current.preset === "sky-night-swamp");
      swampSet.userData.animate(sceneTime, swampActive, performanceSampleRef.current.reduced);
      swampBats.visible = swampActive;
      if (swampBats.visible) swampBats.userData.animate(sceneTime, camera, performanceSampleRef.current.reduced);
      cemeteryFill.visible = skyMotionRef.current.preset === "sky-cemetery";
      cemeteryMoonLights.forEach((light) => { light.visible = cemeteryFill.visible && cemeteryDetails.visible; });
      cemeteryLighting.update(sceneEffectsRef.current.cemeteryLighting, cemeteryFill.visible && cemeteryDetails.visible);
      ruinedChurchDebris.userData.animate(sceneTime);
      runtime.poseApplications.forEach(({ bone, rotation }) => bone.quaternion.multiply(poseInverseRotation.copy(rotation).invert()));
      runtime.poseApplications.clear();
      const slow = slowMotionRef.current;
      const slowActive = slow.enabled && animationTimeRef.current >= slow.start && animationTimeRef.current <= slow.end;
      const motionDelta = sceneDelta * (slowActive ? slow.speed : 1);
      const reducedPreview = performanceSampleRef.current.reduced;
      const locomotionPreviewActive = !scenePlaybackRef.current.paused && content.children.some((object) => object.userData?.locomotion?.enabled && object.userData?.modelAnimation?.playing);
      runtimeRef.current?.mixers?.forEach((entry) => {
        if (reducedPreview && renderCount % 12 === 0) {
          entry.object.getWorldPosition(performanceObjectPosition);
          const distance = performanceObjectPosition.distanceTo(camera.position);
          performanceObjectPosition.project(camera);
          entry.performanceVisible = entry.object === selectedRef.current || entry.object.userData?.locomotion?.enabled || (distance < 45
            && performanceObjectPosition.z > -1.2 && performanceObjectPosition.z < 1.2
            && Math.abs(performanceObjectPosition.x) < 1.35 && Math.abs(performanceObjectPosition.y) < 1.35);
        }
        if (!reducedPreview || entry.performanceVisible) entry.mixer.update(motionDelta);
      });
      content.children.forEach((object) => {
        const locomotion = object.userData?.locomotion;
        if (!locomotion?.enabled || !object.userData?.modelAnimation?.playing || motionDelta <= 0) return;
        locomotion.origin ||= object.position.toArray();
        const targetSpeed = object.userData.modelAnimation.speed <= 0 ? 0 : Math.max(0, locomotion.speed || 0);
        const currentSpeed = Math.max(0, locomotion.currentSpeed || 0);
        const response = targetSpeed >= currentSpeed ? (locomotion.acceleration || 4.2) : (locomotion.deceleration || 5.5);
        const easedSpeed = THREE.MathUtils.damp(currentSpeed, targetSpeed, response, motionDelta);
        locomotion.currentSpeed = Math.abs(easedSpeed - targetSpeed) < 0.005 ? targetSpeed : easedSpeed;
        const stepDistance = locomotion.currentSpeed * motionDelta;
        locomotion.travelled = (locomotion.travelled || 0) + stepDistance;
        locomotion.baseRotationY ??= object.rotation.y - THREE.MathUtils.degToRad(locomotion.direction ?? 0);
        const angle = locomotion.baseRotationY + THREE.MathUtils.degToRad(locomotion.direction ?? 0);
        if (locomotion.faceDirection !== false) object.rotation.y = angle;
        locomotionDirection.set(Math.sin(angle), 0, Math.cos(angle));
        object.position.addScaledVector(locomotionDirection, stepDistance);
        if (infernalFloorActive && locomotion.currentSpeed > 0.08) {
          locomotion.lavaStepTravel = (locomotion.lavaStepTravel || 0) + stepDistance;
          const strideDistance = THREE.MathUtils.clamp(0.62 + locomotion.currentSpeed * 0.08, 0.62, 0.92);
          if (locomotion.lavaStepTravel >= strideDistance) {
            locomotion.lavaStepTravel %= strideDistance;
            locomotion.lavaStepSide = -(locomotion.lavaStepSide || 1);
            object.getWorldPosition(linkedLightPosition);
            linkedLightPosition.x += Math.cos(angle) * locomotion.lavaStepSide * 0.23 + Math.sin(angle) * 0.12;
            linkedLightPosition.z += -Math.sin(angle) * locomotion.lavaStepSide * 0.23 + Math.cos(angle) * 0.12;
            spawnLavaFootstep(sceneEffectSystem.lavaFootsteps, linkedLightPosition, sceneTime, 0.82 + Math.min(locomotion.currentSpeed, 4) * 0.08);
          }
        } else if (!infernalFloorActive) {
          locomotion.lavaStepTravel = 0;
        }
        const mixerEntry = runtime.mixers.get(object.userData.editorId);
        if (mixerEntry && locomotion.syncAnimation !== false) {
          if (locomotion.gaitUnitsPerSecond) {
            mixerEntry.mixer.timeScale = syncedGaitRate(locomotion.currentSpeed, object.scale.z, locomotion.gaitUnitsPerSecond);
          } else {
            const baseSpeed = Math.max(0.01, locomotion.speed || 1);
            const gaitSpeed = targetSpeed <= 0 ? 0 : THREE.MathUtils.clamp(locomotion.currentSpeed / baseSpeed, 0.35, 1.15);
            mixerEntry.mixer.timeScale = (object.userData.modelAnimation.speed ?? 1) * gaitSpeed;
          }
        }
        if (locomotion.loop && locomotion.distance > 0 && locomotion.travelled >= locomotion.distance) {
          const lavaSinkOffset = locomotion.lavaSinkOffset || 0;
          object.position.fromArray(locomotion.origin);
          object.position.y += lavaSinkOffset;
          locomotion.travelled = 0;
        }
      });
      content.children.forEach((object) => {
        const locomotion = object.userData?.locomotion;
        if (!locomotion?.enabled) return;
        const currentSink = locomotion.lavaSinkOffset || 0;
        const shouldSink = infernalFloorActive && object.userData?.modelAnimation?.playing;
        const nextSink = THREE.MathUtils.damp(currentSink, shouldSink ? -0.11 : 0, shouldSink ? 7.5 : 10, sceneDelta);
        object.position.y += nextSink - currentSink;
        locomotion.lavaSinkOffset = Math.abs(nextSink) < 0.0001 ? 0 : nextSink;
      });
      content.children.forEach((object) => {
        ensureNeonMaskPulse(object);
        ensureDemonEyePulse(object);
        const pulse = object.userData?.maskPulse;
        const faceMaterials = NEON_FACE_MATERIALS.get(object);
        if (!pulse) return;
        const phase = sceneTime / 1000 * (pulse.speed || 3.2);
        const wave = Math.sin(phase * Math.PI * 2);
        const amount = !pulse.enabled ? 0 : pulse.pattern === "smooth"
          ? 0.3 + (wave + 1) * 0.35
          : pulse.pattern === "heartbeat"
            ? 0.22 + Math.max(0, Math.sin(phase * Math.PI * 2) ** 9) * 0.78
            : (0.38 + Math.max(0, wave) * 0.62) * (Math.sin(phase * 17.31) > 0.9 ? 0.35 : 1);
        faceMaterials?.forEach((material) => {
          const shader = NEON_FACE_SHADERS.get(material);
          if (!shader) return;
          shader.uniforms.uNeonFaceColor.value.set(pulse.color || "#ff176b");
          shader.uniforms.uNeonFaceIntensity.value = (pulse.intensity ?? 4.5) * amount * 0.7;
        });
        updateMaskNeon(object, pulse, amount, camera);
      });
      content.children.forEach((object) => {
        const pulse = object.userData?.eyePulse;
        const group = pulse ? object.getObjectByName("DemonEyePulse") : null;
        if (!group) return;
        const phase = sceneTime / 1000 * (pulse.speed || 2.8);
        const wave = 0.32 + Math.max(0, Math.sin(phase * Math.PI * 2)) * 0.68;
        const glitch = Math.sin(phase * 19.7) > 0.88 ? 0.18 : 1;
        const amount = pulse.enabled ? wave * glitch : 0;
        group.children.forEach((child) => {
          child.material?.color?.set(pulse.color || "#ffd21c");
          if (child.material) child.material.opacity = amount;
          if (child.isLight) {
            child.color.set(pulse.color || "#ffd21c");
            child.intensity = (pulse.intensity || 5.5) * amount;
          }
        });
      });
      content.children.forEach((character) => {
        Object.entries(character.userData?.poseOffsets || {}).forEach(([boneName, values]) => {
          let boneCache = runtime.poseBoneCache.get(character);
          if (!boneCache) {
            boneCache = new Map();
            runtime.poseBoneCache.set(character, boneCache);
          }
          let bone = boneCache.get(boneName);
          if (!bone) {
            bone = character.getObjectByName(boneName) || findRigBone(character, boneName);
            if (bone) boneCache.set(boneName, bone);
          }
          if (!bone) return;
          let rotationCache = runtime.poseRotationCache.get(character);
          if (!rotationCache) {
            rotationCache = new Map();
            runtime.poseRotationCache.set(character, rotationCache);
          }
          const rotationKey = values.join(",");
          let cachedRotation = rotationCache.get(boneName);
          if (!cachedRotation || cachedRotation.key !== rotationKey) {
            cachedRotation = { key: rotationKey, rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(...values, "XYZ")) };
            rotationCache.set(boneName, cachedRotation);
          }
          const rotation = cachedRotation.rotation;
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
      const churchFogActive = CHURCH_FOG_BACKGROUNDS.has(skyMotionRef.current.preset);
      animateSceneEffects(scene, sceneEffectSystem, sceneEffectsRef.current, sceneDelta, sceneTime, performanceSampleRef.current.reduced ? 0.35 : 1, churchFogActive);
      spaceScene.userData.animate(sceneEffectsRef.current.space, sceneTime,
        skyMotionRef.current.preset === "sky-space" && !environmentIsolationRef.current,
        floor.visible && floor.userData.surface === "space-nebula",
        performanceSampleRef.current.reduced ? 0.6 : 1);
      if (floor.userData.surface === "space-nebula" && floor.material.userData.nebulaShader) {
        floor.material.userData.nebulaShader.uniforms.uNebulaTime.value = sceneTime * 0.001;
      }
      if (skyMotionRef.current.preset === "sky-cemetery" && sceneEffectsRef.current.fog.enabled) {
        const fog = sceneEffectsRef.current.fog;
        if (!scene.fog?.isFogExp2) scene.fog = new THREE.FogExp2(fog.color, 0.006 + fog.intensity * 0.008);
        else {
          scene.fog.color.set(fog.color);
          scene.fog.density = 0.006 + fog.intensity * 0.008;
        }
      }
      sceneEffectSystem.apocalypseLighting.userData.animate(
        sceneEffectsRef.current.apocalypseLighting || { ...DEFAULT_APOCALYPSE_LIGHTING, enabled: true },
        sceneTime, floor.userData.surface === "apocalypse", sceneEffectsRef.current.apocalypseFires
      );
      sceneEffectSystem.apocalypseFires.userData.animate(
        sceneEffectsRef.current.apocalypseFires, sceneTime,
        floor.visible && floor.userData.surface === "apocalypse"
      );
      sceneEffectSystem.churchFog.userData.animate(sceneEffectsRef.current.fog, sceneTime, churchFogActive,
        performanceSampleRef.current.reduced ? 0.35 : 1, floor.visible);
      sceneEffectSystem.rain.userData.animate(sceneEffectsRef.current.rain, sceneTime, performanceSampleRef.current.reduced ? 0.55 : 1, {
        visible: floor.visible, y: floor.position.y, surface: floor.userData.surface,
        terrain: ruinedChurchDebris.visible ? ruinedChurchDebris : null
      });
      sceneEffectSystem.storm.userData.animate(sceneEffectsRef.current.storm, sceneTime,
        performanceSampleRef.current.reduced ? 0.55 : 1);
      sceneEffectSystem.magic.userData.animate(sceneEffectsRef.current.magic, sceneTime, camera, floor.visible);
      sceneEffectSystem.churchLighting.userData.animate(sceneEffectsRef.current.churchLighting, sceneTime,
        skyMotionRef.current.preset === "sky-ruined-gothic-church", floor.visible);
      animateLavaJets(sceneEffectSystem.lavaJets, infernalFloorActive, sceneTime, lavaSettingsRef.current);
      animateLavaGas(sceneEffectSystem.lavaGas, infernalFloorActive, sceneTime, lavaSettingsRef.current, performanceSampleRef.current.reduced ? 0.55 : 1);
      animateLavaFootsteps(sceneEffectSystem.lavaFootsteps, infernalFloorActive, sceneTime);
      animateLavaAtmosphere(sceneEffectSystem.lavaAtmosphere, infernalFloorActive, sceneTime, orbit.target, camera, scene, sceneEffectsRef.current, content, performanceSampleRef.current.reduced ? 0.58 : 1);
      content.children.forEach((object) => {
        const spin = object.userData?.spin;
        if (!spin?.enabled || !object.rotation) return;
        if (animationTracksRef.current[object.userData?.editorId]?.length) return;
        if (modeRef.current === "sculpt" && (object === selectedRef.current || selectedRef.current?.getObjectById(object.id))) return;
        object.rotation[spin.axis || "y"] += THREE.MathUtils.degToRad((spin.speed ?? 30) * sceneDelta);
      });
      const activeFloor = runtimeRef.current?.floor;
      const floorTexture = activeFloor?.material?.map;
      if (floorTexture && activeFloor.userData.surface === "water") {
        floorTexture.offset.set((sceneTime * 0.000012) % 1, (sceneTime * 0.000008) % 1);
      } else if (floorTexture && activeFloor.userData.surface === "gas") {
        floorTexture.offset.set((sceneTime * 0.000004) % 1, (sceneTime * 0.000006) % 1);
      } else if (floorTexture && activeFloor.userData.surface === "infernal") {
        floorTexture.offset.set((sceneTime * 0.000005) % 1, (sceneTime * 0.0000025) % 1);
        activeFloor.material.userData.lavaTime = sceneTime * 0.001;
        const lavaContacts = activeFloor.material.userData.lavaContacts;
        let lavaContactCount = 0;
        content.children.forEach((object) => {
          const locomotion = object.userData?.locomotion;
          if (!locomotion?.enabled || !object.userData?.modelAnimation?.playing || lavaContactCount >= lavaContacts.length) return;
          object.getWorldPosition(performanceObjectPosition);
          const angle = object.rotation.y;
          const stride = Math.sin(sceneTime * 0.009 * (object.userData.modelAnimation.speed || 1)) * 0.32;
          for (const side of [-1, 1]) {
            if (lavaContactCount >= lavaContacts.length) break;
            linkedLightPosition.copy(performanceObjectPosition);
            linkedLightPosition.x += Math.cos(angle) * side * 0.24 + Math.sin(angle) * stride * side;
            linkedLightPosition.z += -Math.sin(angle) * side * 0.24 + Math.cos(angle) * stride * side;
            activeFloor.worldToLocal(linkedLightPosition);
            lavaContacts[lavaContactCount].set(linkedLightPosition.x, linkedLightPosition.y);
            lavaContactCount += 1;
          }
        });
        activeFloor.material.userData.lavaContactCount = lavaContactCount;
        const lavaShader = activeFloor.material.userData.lavaShader;
        if (lavaShader) {
          lavaShader.uniforms.uLavaTime.value = activeFloor.material.userData.lavaTime;
          lavaShader.uniforms.uLavaContactCount.value = lavaContactCount;
        }
      } else if (floorTexture && activeFloor.userData.surface === "cemetery") {
        floorTexture.offset.set(0, 0);
      } else if (floorTexture && activeFloor.userData.surface === "medieval-apocalypse") {
        floorTexture.offset.set(0, 0);
      } else if (floorTexture && activeFloor.userData.surface === "gothic-church") {
        floorTexture.offset.set(0, 0);
      } else if (floorTexture && activeFloor.userData.surface === "night-swamp") {
        floorTexture.offset.set(0, 0);
      } else if (floorTexture && activeFloor.userData.surface === "ruined-gothic-church") {
        floorTexture.offset.set(0, 0);
      }
      const activeGrass = runtimeRef.current?.grass;
      if (activeGrass) {
        const settings = grassSettingsRef.current;
        activeGrass.visible = Boolean(settings.enabled && activeFloor?.visible && activeFloor.userData.surface === "grass");
        const grassDensity = THREE.MathUtils.clamp(Number(settings.density) || DEFAULT_GRASS_SETTINGS.density, 0.2, 1);
        const previewDensity = reducedPreview ? (locomotionPreviewActive ? 0.52 : 0.72) : 1;
        activeGrass.geometry.instanceCount = Math.round(activeGrass.userData.maxBlades * grassDensity * previewDensity);
        activeGrass.material.uniforms.uTime.value = sceneTime * 0.001;
        activeGrass.material.uniforms.uHeight.value = settings.height;
        activeGrass.material.uniforms.uWidthScale.value = locomotionPreviewActive && reducedPreview ? 1.08 : 1;
        activeGrass.material.uniforms.uWindStrength.value = settings.windStrength;
        activeGrass.material.uniforms.uWindSpeed.value = settings.windSpeed;
        activeGrass.material.uniforms.uLightColor.value.copy(keyLight.color).lerp(ambient.color, 0.35);
        activeGrass.material.uniforms.uAmbient.value = THREE.MathUtils.clamp(0.58 + ambient.intensity * 0.22, 0.58, 1.25);
        const grassInteractor = activeGrass.material.uniforms.uInteractor.value;
        if (selectedRef.current && !selectedRef.current.isLight) selectedRef.current.getWorldPosition(grassInteractor);
        else grassInteractor.set(10000, 0, 10000);
      }
      const skySettings = realisticSkyRef.current;
      const skyPreset = skyMotionRef.current.preset;
      const realisticSkyActive = skySettings.enabled && REALISTIC_SKY_BACKGROUNDS.has(skyPreset) && !environmentIsolationRef.current;
      realisticSkyDome.visible = realisticSkyActive;
      if (realisticSkyActive) {
        const uniforms = realisticSkyDome.material.uniforms;
        const elevation = THREE.MathUtils.degToRad(skySettings.sunElevation);
        const azimuth = THREE.MathUtils.degToRad(skySettings.sunAzimuth);
        uniforms.uSunDirection.value.set(
          Math.cos(elevation) * Math.sin(azimuth),
          Math.sin(elevation),
          Math.cos(elevation) * Math.cos(azimuth)
        ).normalize();
        uniforms.uTime.value = sceneTime * 0.001;
        uniforms.uCloudCover.value = skySettings.cloudCover;
        uniforms.uCloudAmount.value = skySettings.cloudAmount;
        uniforms.uCloudSpeed.value = skySettings.cloudSpeed;
        uniforms.uSunIntensity.value = skySettings.sunIntensity;
        const sunset = skyPreset === "sky-sunset";
        uniforms.uZenithColor.value.set(sunset ? "#385f91" : "#034f9a");
        uniforms.uHorizonColor.value.set(sunset ? "#efad78" : "#5595c3");
        uniforms.uSunColor.value.set(sunset ? "#ffd0a1" : "#fff1c7");
        realisticSkyDome.position.copy(camera.position);
        keyLight.position.copy(uniforms.uSunDirection.value).multiplyScalar(48);
        keyLight.color.set(sunset ? "#ffd0a1" : "#fff1d2");
      }
      const skyTexture = runtimeRef.current?.backgroundTexture;
      const skyMotion = skyMotionRef.current;
      if (skyTexture && skyMotion.enabled && skyMotion.preset.startsWith("sky-")) {
        const presetRate = { "sky-clouds": 1, "sky-space": 0.4, "sky-sun": 0.65, "sky-night": 0.5, "sky-day": 0.8, "sky-sunset": 0.7, "sky-infernal": 0.82, "sky-apocalypse": 0.04, "sky-cemetery": 0.42, "sky-medieval-apocalypse": 0, "sky-gothic-church": 0.025, "sky-night-swamp": 0, "sky-ruined-gothic-church": 0.08, "sky-castle-interior": 0, "sky-space-ship": 0.025, "sky-medieval-village": 0, "sky-moonlit-peaks": 0, "sky-spiderweb-ruins": 0 }[skyMotion.preset] ?? 0.7;
        const rotationStep = sceneDelta * skyMotion.speed * presetRate * 0.6;
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
      const beats = soundtrackRef.current?.beats || [];
      content.children.forEach((light) => {
        const beat = light.isLight ? light.userData.beatLight : null;
        if (!beat?.enabled) return;
        let beatIndex = -1;
        for (let index = beats.length - 1; index >= 0; index -= 1) {
          if (beats[index].time <= animationTimeRef.current) { beatIndex = index; break; }
        }
        const elapsed = beatIndex >= 0 ? animationTimeRef.current - beats[beatIndex].time : Infinity;
        const pulse = animationPlayingRef.current && sceneMotionFactor > 0 && elapsed <= 0.4 ? Math.exp(-elapsed * 9) * sceneMotionFactor : 0;
        light.intensity = (beat.baseIntensity ?? light.intensity) * (1 + pulse * (beat.amount ?? 1.5));
        if (beatIndex < 0) {
          light.color.set(beat.baseColor || "#ffffff");
          return;
        }
        beatLightColorA.set(beat.colorA || "#ff176b");
        beatLightColorB.set(beat.colorB || "#28d7ff");
        light.color.copy(beatIndex % 2 === 0 ? beatLightColorA : beatLightColorB);
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
        const phase = sceneTime * 0.001 * Math.max(shake.speed, 0.1);
        const amount = shake.intensity;
        camera.translateX((Math.sin(phase * 7.1) + Math.sin(phase * 13.7) * 0.45) * amount * 0.018);
        camera.translateY((Math.sin(phase * 8.9 + 1.7) + Math.sin(phase * 17.3) * 0.35) * amount * 0.012);
        camera.rotateZ(Math.sin(phase * 5.3 + 0.8) * amount * 0.004);
        camera.rotateX(Math.sin(phase * 6.7 + 2.1) * amount * 0.0025);
      }
      const throttlePreviewShadows = locomotionPreviewActive && reducedPreview && !cleanRenderRef.current;
      renderer.shadowMap.autoUpdate = !throttlePreviewShadows;
      if (throttlePreviewShadows) renderer.shadowMap.needsUpdate = renderCount % 2 === 0;
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
      setShipHover(null);
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
      runtimeRef.current?.moonlitZenithTexture?.dispose?.();
      runtimeRef.current?.mixers?.forEach(({ mixer }) => mixer.stopAllAction());
      Object.values(sceneEffectSystem.systems).forEach((points) => {
        points.geometry.dispose();
        points.material.map?.dispose?.();
        points.material.dispose();
      });
      sceneEffectSystem.magic.userData.dispose();
      sceneEffectSystem.apocalypseFires.userData.dispose();
      cemeteryLighting.dispose();
      castleInterior.userData.dispose();
      gothicInterior.userData.dispose();
      swampSet.userData.dispose();
      medievalSet.userData.dispose();
      sceneEffectSystem.churchLighting.userData.dispose();
      sceneEffectSystem.churchFog.userData.dispose();
      sceneEffectSystem.rain.userData.dispose();
      sceneEffectSystem.storm.userData.dispose();
      sceneEffectSystem.lavaJets.stems.geometry.dispose();
      sceneEffectSystem.lavaJets.heads.geometry.dispose();
      sceneEffectSystem.lavaJets.drops.geometry.dispose();
      sceneEffectSystem.lavaJets.impactDrops.geometry.dispose();
      sceneEffectSystem.lavaJets.splashes.geometry.dispose();
      sceneEffectSystem.lavaJets.splashMaterial.dispose();
      sceneEffectSystem.lavaJets.material.dispose();
      sceneEffectSystem.lavaGas.points.geometry.dispose();
      sceneEffectSystem.lavaGas.points.material.map?.dispose?.();
      sceneEffectSystem.lavaGas.points.material.dispose();
      sceneEffectSystem.lavaFootsteps.rings.geometry.dispose();
      sceneEffectSystem.lavaFootsteps.rings.material.dispose();
      sceneEffectSystem.lavaFootsteps.drops.geometry.dispose();
      sceneEffectSystem.lavaFootsteps.drops.material.dispose();
      sceneEffectSystem.lavaAtmosphere.heatPanels.forEach((panel) => panel.geometry.dispose());
      sceneEffectSystem.lavaAtmosphere.heatMaterial.dispose();
      sceneEffectSystem.lavaAtmosphere.embers.geometry.dispose();
      sceneEffectSystem.lavaAtmosphere.embers.material.map?.dispose?.();
      sceneEffectSystem.lavaAtmosphere.embers.material.dispose();
      sceneEffectSystem.lavaAtmosphere.crustPlates.plates.geometry.dispose();
      sceneEffectSystem.lavaAtmosphere.crustPlates.crustTexture.dispose();
      sceneEffectSystem.lavaAtmosphere.crustPlates.plates.material.dispose();
      sceneEffectSystem.lavaAtmosphere.crustPlates.ashTopMaterial.dispose();
      sceneEffectSystem.lavaAtmosphere.crustPlates.rims.geometry.dispose();
      sceneEffectSystem.lavaAtmosphere.crustPlates.rims.material.dispose();
      sceneEffectSystem.lavaAtmosphere.shadowCatcher.geometry.dispose();
      sceneEffectSystem.lavaAtmosphere.shadowCatcher.material.dispose();
      scene.remove(sceneEffectSystem.group);
      spaceScene.userData.dispose();
      scene.remove(spaceScene);
      spaceShipSet.userData.dispose();
      scene.remove(spaceShipSet);
      scene.remove(spacePanorama);
      scene.remove(cloudsPanoramaBackdrop);
      scene.remove(medievalVillagePanorama);
      scene.remove(spiderwebRuinsPanorama);
      ruinedChurchDebris.userData.dispose?.();
      scene.remove(ruinedChurchDebris);
      apocalypseDebris.userData.dispose?.();
      scene.remove(apocalypseDebris);
      scene.remove(medievalSet);
      moonlitPeaksSet.userData.dispose();
      scene.remove(moonlitPeaksSet);
      cemeteryDetails.userData.dispose?.();
      scene.remove(cemeteryDetails);
      cemeteryBats.userData.dispose?.();
      scene.remove(cemeteryBats);
      swampBats.userData.dispose?.();
      scene.remove(swampBats);
      scene.remove(swampSet);
      scene.remove(cemeteryFill);
      cemeteryMoonLights.forEach((light) => {
        scene.remove(light, light.target);
        light.dispose();
      });
      orbit.dispose();
      orbit.removeEventListener("change", trackCameraOrbit);
      disposeObject(content);
      floor.geometry.dispose();
      floor.material.map?.dispose?.();
      if (floor.material.bumpMap !== floor.material.map) floor.material.bumpMap?.dispose?.();
      floor.material.dispose();
      grass.geometry.dispose();
      grass.material.dispose();
      realisticSkyDome.geometry.dispose();
      realisticSkyDome.material.dispose();
      churchPanorama.userData.dispose();
      infernalPanorama.userData.dispose();
      apocalypsePanorama.userData.dispose();
      medievalPanorama.userData.dispose();
      cemeteryPanorama.userData.dispose();
      moonlitPanorama.userData.dispose();
      castlePanorama.userData.dispose();
      gothicPanorama.userData.dispose();
      swampPanorama.userData.dispose();
      spacePanorama.userData.dispose();
      cloudsPanoramaBackdrop.userData.dispose();
      medievalVillagePanorama.userData.dispose();
      spiderwebRuinsPanorama.userData.dispose();
      environmentTexture.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", handleContextRestored);
      renderer.dispose();
      renderer.forceContextLoss();
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
    runtimeRef.current?.ruinedChurchDebris.userData.setArchitectureEnabled(environmentBackground === "sky-ruined-gothic-church");
  }, [environmentBackground]);

  useEffect(() => {
    sceneEffectsRef.current = sceneEffects;
  }, [sceneEffects]);

  useEffect(() => {
    grassSettingsRef.current = grassSettings;
  }, [grassSettings]);

  useEffect(() => {
    lavaSettingsRef.current = lavaSettings;
  }, [lavaSettings]);

  useEffect(() => {
    realisticSkyRef.current = realisticSky;
  }, [realisticSky]);

  useEffect(() => {
    if (realisticSky.styleVersion === DEFAULT_REALISTIC_SKY.styleVersion) return;
    setRealisticSky((current) => ({ ...DEFAULT_REALISTIC_SKY, enabled: current.enabled ?? DEFAULT_REALISTIC_SKY.enabled }));
  }, [realisticSky]);

  useEffect(() => {
    if (grassSettings.styleVersion === DEFAULT_GRASS_SETTINGS.styleVersion) return;
    setGrassSettings((current) => ({
      ...DEFAULT_GRASS_SETTINGS,
      enabled: current.enabled ?? DEFAULT_GRASS_SETTINGS.enabled,
      windStrength: current.windStrength ?? DEFAULT_GRASS_SETTINGS.windStrength,
      windSpeed: current.windSpeed ?? DEFAULT_GRASS_SETTINGS.windSpeed
    }));
  }, [grassSettings]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return undefined;
    runtime.scene.environment = runtime.baseEnvironment;
    runtime.scene.environmentIntensity = 1;
    runtime.churchPanorama.userData.setTexture(null);
    runtime.infernalPanorama.userData.setTexture(null);
    runtime.apocalypsePanorama.userData.setTexture(null);
    runtime.medievalPanorama.userData.setTexture(null);
    runtime.cemeteryPanorama.userData.setTexture(null);
    runtime.moonlitPanorama.userData.setTexture(null);
    runtime.castlePanorama.userData.setTexture(null);
    runtime.gothicPanorama.userData.setTexture(null);
    runtime.swampPanorama.userData.setTexture(null);
    runtime.spacePanorama.userData.setTexture(null);
    runtime.cloudsPanoramaBackdrop.userData.setTexture(null);
    runtime.medievalVillagePanorama.userData.setTexture(null);
    runtime.spiderwebRuinsPanorama.userData.setTexture(null);
    runtime.scene.backgroundBlurriness = 0;
    runtime.backgroundTexture?.dispose?.();
    runtime.backgroundTexture = null;
    const preset = [...ENVIRONMENT_BACKGROUNDS, ...SKY_BACKGROUNDS].find((item) => item.id === environmentBackground);
    if (!preset?.image) {
      runtime.scene.background = new Color(background);
      runtime.scene.backgroundIntensity = 1;
      runtime.scene.backgroundRotation.x = 0;
      runtime.scene.environmentRotation.x = 0;
      return undefined;
    }
    const isSpacePanorama = preset.id === "sky-space" || preset.id === "sky-space-ship";
    let cancelled = false;
    new THREE.TextureLoader().load(preset.image, (texture) => {
      if (cancelled || runtimeRef.current !== runtime) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.repeat.x = 2;
      if (isSpacePanorama || preset.id === "clouds" || preset.id === "sky-clouds"
        || preset.id === "sky-medieval-village" || preset.id === "sky-spiderweb-ruins") {
        texture.wrapS = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
      }
      if (["sky-ruined-gothic-church", "sky-apocalypse", "sky-cemetery", "sky-castle-interior", "sky-gothic-church", "sky-night-swamp", "sky-medieval-apocalypse", "sky-moonlit-peaks"].includes(preset.id)) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
      }
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = runtime.renderer.capabilities.getMaxAnisotropy();
      if (isSpacePanorama || preset.id === "clouds" || preset.id === "sky-clouds"
        || preset.id === "sky-medieval-village" || preset.id === "sky-spiderweb-ruins") {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
      }
      texture.needsUpdate = true;
      runtime.backgroundTexture = texture;
      runtime.scene.background = texture;
      runtime.scene.backgroundIntensity = preset.backgroundIntensity ?? 1;
      runtime.scene.backgroundRotation.x = preset.backgroundRotationX ?? 0;
      runtime.scene.environment = preset.id === "sky-space-ship" ? runtime.baseEnvironment : texture;
      runtime.scene.environmentIntensity = preset.environment ?? 0.65;
      runtime.scene.environmentRotation.x = preset.backgroundRotationX ?? 0;
      if (isSpacePanorama) {
        runtime.spacePanorama.userData.setTexture(texture, preset.backgroundIntensity ?? 1);
        runtime.scene.background = new Color("#03070d");
      } else if (preset.id === "clouds" || preset.id === "sky-clouds") {
        runtime.cloudsPanoramaBackdrop.userData.setTexture(texture, preset.backgroundIntensity ?? 1);
        runtime.scene.background = new Color("#87b8d9");
      } else if (preset.id === "sky-medieval-village") {
        runtime.scene.backgroundRotation.y = 0;
        runtime.scene.environmentRotation.y = 0;
        runtime.medievalVillagePanorama.userData.setTexture(texture, preset.backgroundIntensity ?? 1);
        runtime.scene.background = new Color("#493d32");
      } else if (preset.id === "sky-spiderweb-ruins") {
        runtime.scene.backgroundRotation.y = 0;
        runtime.scene.environmentRotation.y = 0;
        runtime.spiderwebRuinsPanorama.userData.setTexture(texture, preset.backgroundIntensity ?? 1);
        runtime.scene.background = new Color("#182026");
      } else if (preset.id === "sky-ruined-gothic-church") {
        runtime.churchPanorama.userData.setTexture(texture, 0.8);
        runtime.scene.background = new Color("#0d1724");
      } else if (preset.id === "sky-infernal") {
        runtime.infernalPanorama.userData.setTexture(texture, preset.backgroundIntensity ?? 1);
        runtime.scene.background = new Color("#210603");
      } else if (preset.id === "sky-apocalypse") {
        runtime.apocalypsePanorama.userData.setTexture(texture, preset.backgroundIntensity ?? 1);
        runtime.scene.background = new Color("#2b1913");
      } else if (preset.id === "sky-medieval-apocalypse") {
        runtime.scene.backgroundRotation.y = 0;
        runtime.scene.environmentRotation.y = 0;
        runtime.medievalPanorama.userData.setTexture(texture, preset.backgroundIntensity ?? 1);
        runtime.scene.background = new Color("#211916");
      } else if (preset.id === "sky-cemetery") {
        runtime.cemeteryPanorama.userData.setTexture(texture, preset.backgroundIntensity ?? 1);
        runtime.scene.background = new Color("#0b1420");
      } else if (preset.id === "sky-moonlit-peaks") {
        runtime.scene.backgroundRotation.y = 0;
        runtime.scene.environmentRotation.y = 0;
        if (!runtime.moonlitZenithTexture) {
          runtime.moonlitZenithTexture = new THREE.TextureLoader().load(moonlitZenithTextureUrl);
          runtime.moonlitZenithTexture.colorSpace = THREE.SRGBColorSpace;
          runtime.moonlitZenithTexture.anisotropy = 8;
        }
        runtime.moonlitPanorama.userData.setZenithTexture(runtime.moonlitZenithTexture);
        runtime.moonlitPanorama.userData.setTexture(texture, preset.backgroundIntensity ?? 1);
        runtime.scene.background = new Color("#0b1520");
      } else if (preset.id === "sky-castle-interior") {
        runtime.castlePanorama.userData.setTexture(texture, preset.backgroundIntensity ?? 1);
        runtime.scene.background = new Color("#28231f");
      } else if (preset.id === "sky-gothic-church") {
        runtime.gothicPanorama.userData.setTexture(texture, preset.backgroundIntensity ?? 1);
        runtime.scene.background = new Color("#1d1b21");
      } else if (preset.id === "sky-night-swamp") {
        runtime.scene.backgroundRotation.y = 0;
        runtime.scene.environmentRotation.y = 0;
        runtime.swampPanorama.userData.setTexture(texture, preset.backgroundIntensity ?? 1);
        runtime.scene.background = new Color("#0c1719");
      }
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
    const runtime = runtimeRef.current;
    if (!runtime) return;
    enableObjectShadows(runtime.content);
    runtime.renderer.shadowMap.needsUpdate = true;
  }, [objects]);

  useEffect(() => {
    const floor = runtimeRef.current?.floor;
    if (!floor) return;
    floor.material.map?.dispose?.();
    if (floor.material.bumpMap !== floor.material.map) floor.material.bumpMap?.dispose?.();
    floor.material.dispose();
    floor.material = createFloorMaterial(floorSurface, floorColor);
    const geometrySurface = ["infernal", "cemetery", "night-swamp", "medieval-apocalypse", "moonlit-peaks", "space-nebula", "ship-deck"].includes(floorSurface) ? floorSurface : "flat";
    if (floor.userData.geometrySurface !== geometrySurface) {
      floor.geometry.dispose();
      floor.geometry = floorSurface === "infernal"
        ? new THREE.PlaneGeometry(280, 280, 256, 256)
        : floorSurface === "cemetery" ? createCemeteryTerrainGeometry()
          : floorSurface === "night-swamp" ? createSwampTerrainGeometry()
            : floorSurface === "medieval-apocalypse" ? createMedievalTerrainGeometry()
              : floorSurface === "moonlit-peaks" ? createMoonlitTerrainGeometry()
                : floorSurface === "space-nebula" ? createNebulaFloorGeometry()
                  : floorSurface === "ship-deck" ? new THREE.PlaneGeometry(27, 32).translate(0, 5, 0) : new THREE.PlaneGeometry(280, 280);
      floor.userData.geometrySurface = geometrySurface;
    }
    floor.userData.surface = floorSurface;
    floor.renderOrder = floorSurface === "space-nebula" ? -1 : 0;
    floor.position.y = floorSurface === "ruined-gothic-church" ? -0.19 : -0.015;
    const ruins = runtimeRef.current.ruinedChurchDebris;
    if (floorSurface === "ruined-gothic-church") ruins.userData.build();
    ruins.visible = floor.visible && floorSurface === "ruined-gothic-church";
    const apocalypse = runtimeRef.current.apocalypseDebris;
    if (floorSurface === "apocalypse") apocalypse.userData.build();
    apocalypse.visible = floor.visible && floorSurface === "apocalypse";
    const cemetery = runtimeRef.current.cemeteryDetails;
    if (floorSurface === "cemetery") cemetery.userData.build();
    cemetery.visible = floor.visible && floorSurface === "cemetery";
    floor.receiveShadow = true;
  }, [floorSurface]);

  useEffect(() => {
    const material = runtimeRef.current?.floor.material;
    if (material?.color && floorSurface !== "shadow") {
      if (floorSurface === "ruined-gothic-church") {
        material.color.copy(ruinedChurchFloorTint(floorColor));
        runtimeRef.current.ruinedChurchDebris.userData.setTint(material.color);
      }
      else if (floorSurface === "infernal") material.color.copy(infernalFloorTint(floorColor));
      else material.color.set(floorColor);
    }
    if (floorSurface === "grass") {
      const uniforms = runtimeRef.current?.grass?.material?.uniforms;
      if (uniforms) {
        const tint = new Color(floorColor);
        uniforms.uBaseColor.value.copy(tint).multiplyScalar(0.52);
        uniforms.uTipColor.value.copy(tint).lerp(new Color("#c7d89b"), 0.34);
      }
    }
  }, [floorColor, floorSurface]);

  function applyAnimationAt(time, syncUi = true) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const objectTime = Math.max(0, freezeAdjustedTime(time, freezeMotionRef.current));
    Object.entries(animationTracks).forEach(([objectId, frames]) => {
      if (!frames.length) return;
      const { before, after, alpha } = animationFramePair(frames, objectId === CAMERA_TRACK_ID ? time : objectTime);
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
        let followDelta = null;
        const followFrame = after.followSubjectId ? after : before;
        if (followFrame.followSubjectId && followFrame.followOrigin) {
          const followSubject = findEditorObject(followFrame.followSubjectId);
          if (followSubject) {
            followDelta = followSubject.getWorldPosition(new Vector3()).sub(new Vector3().fromArray(followFrame.followOrigin));
            target.add(followDelta);
          }
        }
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
          if (followDelta) runtime.camera.position.add(followDelta);
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
      if (before.poseOffsets || after.poseOffsets) {
        const names = new Set([...Object.keys(before.poseOffsets || {}), ...Object.keys(after.poseOffsets || {})]);
        object.userData.poseOffsets = Object.fromEntries([...names].map((name) => [name, [0, 1, 2].map((axis) =>
          THREE.MathUtils.lerp(before.poseOffsets?.[name]?.[axis] || 0, after.poseOffsets?.[name]?.[axis] || 0, alpha)
        )]));
      }
    });
    if (syncUi) { syncSelection(); setPoseVersion((version) => version + 1); }
  }

  function seekAnimation(time) {
    const next = THREE.MathUtils.clamp(time, 0, animationDuration);
    if (next <= 0.001) {
      runtimeRef.current?.content.children.forEach((object) => {
        const locomotion = object.userData?.locomotion;
        if (!locomotion?.origin) return;
        object.position.fromArray(locomotion.origin);
        locomotion.travelled = 0;
        locomotion.currentSpeed = 0;
      });
    }
    animationTimeRef.current = next;
    setAnimationTime(next);
    applyAnimationAt(next);
    if (soundtrackAudioRef.current) soundtrackAudioRef.current.currentTime = Math.min(next, soundtrackAudioRef.current.duration || next);
    runtimeRef.current?.content.children.forEach((object) => {
      const video = TV_VIDEO_ELEMENTS.get(object);
      if (video?.duration) video.currentTime = next % video.duration;
    });
  }

  function captureWorkspaceThumbnail() {
    const runtime = runtimeRef.current;
    if (!runtime) return "";
    const hiddenObjects = [runtime.grid, runtime.transformHelper, runtime.brushCursor, runtime.lightHelper]
      .filter(Boolean)
      .map((object) => [object, object.visible]);
    const markerVisibility = [...runtime.lightMarkers.values()].map((marker) => [marker, marker.visible]);
    hiddenObjects.forEach(([object]) => { object.visible = false; });
    markerVisibility.forEach(([marker]) => { marker.visible = false; });
    const sourceCanvas = runtime.renderer.domElement;
    const width = 320;
    const height = Math.max(1, Math.round(width * sourceCanvas.height / Math.max(1, sourceCanvas.width)));
    const target = new THREE.WebGLRenderTarget(width, height, { depthBuffer: true });
    const previousTarget = runtime.renderer.getRenderTarget();
    try {
      runtime.renderer.setRenderTarget(target);
      runtime.renderer.render(runtime.scene, runtime.camera);
      const pixels = new Uint8Array(width * height * 4);
      runtime.renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      const image = context.createImageData(width, height);
      for (let row = 0; row < height; row += 1) {
        const sourceStart = (height - row - 1) * width * 4;
        image.data.set(pixels.subarray(sourceStart, sourceStart + width * 4), row * width * 4);
      }
      context.putImageData(image, 0, 0);
      return canvas.toDataURL("image/jpeg", 0.78);
    } finally {
      runtime.renderer.setRenderTarget(previousTarget);
      target.dispose();
      hiddenObjects.forEach(([object, visible]) => { object.visible = visible; });
      markerVisibility.forEach(([marker, visible]) => { marker.visible = visible; });
    }
  }

  function setGlobalPlayback(playing) {
    if (playing && animationTimeRef.current >= animationDuration - 0.001) seekAnimation(0);
    scenePlaybackRef.current.paused = !playing;
    animationPlayingRef.current = playing;
    setAnimationPlaying(playing);
    runtimeRef.current?.content.children.forEach((object) => {
      const video = TV_VIDEO_ELEMENTS.get(object);
      if (!video) return;
      if (playing) {
        if (video.duration) video.currentTime = animationTimeRef.current % video.duration;
        video.play().catch(() => {});
      } else video.pause();
    });
  }

  function stopGlobalPlayback() {
    scenePlaybackRef.current.paused = true;
    scenePlaybackRef.current.elapsed = 0;
    animationPlayingRef.current = false;
    setAnimationPlaying(false);
    seekAnimation(0);
    runtimeRef.current?.mixers?.forEach(({ mixer }) => mixer.setTime(0));
    runtimeRef.current?.content.children.forEach((object) => {
      const video = TV_VIDEO_ELEMENTS.get(object);
      if (!video) return;
      video.pause();
      video.currentTime = 0;
    });
    setStatus("Todas las animaciones detenidas");
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
      const nextSoundtrack = { name: file.name, url, duration: buffer.duration, beats };
      soundtrackRef.current = nextSoundtrack;
      setSoundtrack(nextSoundtrack);
      animationDurationRef.current = Math.max(1, Math.min(300, Math.ceil(buffer.duration)));
      setAnimationDuration(animationDurationRef.current);
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
    soundtrackRef.current = null;
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
      classic: [byId.general, byId.full, byId["american-front"], byId.medium, byId["medium-close"], byId["close-neutral"]],
      "youtube-reveal": [byId["youtube-overhead"], byId["youtube-medium"], byId["youtube-face"]],
      "youtube-documentary": [byId["youtube-establishing"], byId["youtube-medium"], byId["youtube-interview"], byId["youtube-face"], byId["youtube-face-side"]],
      "youtube-interview": [byId["youtube-medium"], byId["youtube-interview"], byId["youtube-face"]],
      rock: [byId.general, byId["three-quarter-left"], byId.medium, byId.profile, byId.hero, byId.close],
      "hard-rock": [byId["low-angle"], byId.dutch, byId.close, byId.profile, byId.hero, byId["three-quarter-right"]],
      metal: [byId.dutch, byId["low-angle"], byId.close, byId["high-angle"], byId.profile, byId.hero]
    };
    const shots = styles[preset] || styles.rock;
    const duration = Math.min(300, soundtrack.duration);
    const beatTimes = soundtrack.beats
      .filter((beat) => beat.time <= duration)
      .reduce((times, beat) => (!times.length || beat.time - times.at(-1) >= 0.55 ? [...times, beat.time] : times), [])
      .slice(0, 30);
    const times = [...new Set([0, ...beatTimes, duration].map((time) => round(time)))];
    const followOrigin = subject.getWorldPosition(new Vector3()).toArray();
    const frames = times.map((time, index) => {
      const source = shots[index % shots.length];
      const variation = index % 2 ? -1 : 1;
      const shot = preset === "classic" ? source : { ...source, angle: (source.angle || 0) + variation * ((index * 17) % 24) };
      const pose = calculateCameraShotPose(shot, subject);
      const spherical = new THREE.Spherical().setFromVector3(pose.position.clone().sub(pose.target));
      return { id: makeId(), time, position: pose.position.toArray(), target: pose.target.toArray(), orbit: { radius: spherical.radius, phi: spherical.phi, theta: spherical.theta }, continuousOrbit: false, up: pose.up.toArray(), fov: pose.fov, transition: preset === "classic" ? "cut" : transition, shotName: source.name, followSubjectId: preset === "classic" ? null : subject.userData.editorId, followOrigin: preset === "classic" ? null : followOrigin };
    });
    setAnimationPlaying(false);
    animationDurationRef.current = duration;
    setAnimationDuration(duration);
    setAnimationTracks((current) => ({ ...current, [CAMERA_TRACK_ID]: frames }));
    seekAnimation(0);
    setStatus(`Director al ritmo creado: ${frames.length} tomas ${preset}`);
  }

  useEffect(() => {
    animationPlayingRef.current = animationPlaying;
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
    let lastUiUpdate = previous;
    const tick = (now) => {
      const delta = (now - previous) / 1000;
      previous = now;
      const shouldLoop = animationLoop && !animationExporting;
      const next = shouldLoop
        ? (animationTimeRef.current + delta) % animationDuration
        : Math.min(animationTimeRef.current + delta, animationDuration);
      animationTimeRef.current = next;
      applyAnimationAt(next, false);
      if (now - lastUiUpdate >= 50 || (!shouldLoop && next >= animationDuration)) {
        lastUiUpdate = now;
        syncSelection();
        setAnimationTime(next);
      }
      if (!shouldLoop && next >= animationDuration) {
        scenePlaybackRef.current.paused = true;
        animationPlayingRef.current = false;
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
      const state = serializeScene({ forAutosave: true });
      if (!state) return null;
      await putProject(`workspace:${event.detail.projectId}:${THREE_PROJECT_ID}`, state);
      return { kind: THREE_PROJECT_ID, thumbnail: captureWorkspaceThumbnail() };
    })());
    const load = (event) => event.detail.tasks.push((async () => {
      const loadVersion = ++workspaceLoadVersionRef.current;
      autosaveReadyRef.current = true;
      setAutosaveStatus("Cargando proyecto...");
      const state = await getProject(`workspace:${event.detail.projectId}:${THREE_PROJECT_ID}`);
      if (state && loadVersion === workspaceLoadVersionRef.current) {
        if (state.contentItems) await loadAutosaveState(state);
        else loadSceneState(state);
        setAutosaveStatus("Autosave activo");
        setAutosaveRevision((revision) => revision + 1);
      }
    })());
    window.addEventListener("studio:workspace-save", save);
    window.addEventListener("studio:workspace-load", load);
    return () => {
      window.removeEventListener("studio:workspace-save", save);
      window.removeEventListener("studio:workspace-load", load);
    };
  }, [background, environmentBackground, skyMotionEnabled, skyMotionSpeed, sceneEffects, gridVisible, ambientIntensity, exposure, floorVisible, floorColor, floorSurface, grassSettings, lavaSettings, realisticSky, renderResolution, transparentPng, animationDuration, animationTracks, animationLoop, cameraShake, cameraFollow, cinematicCamera, directorPreset, slowMotion, freezeMotion, activeLightingRig, mode, propertyTab, deformAmount, sculptBrush, sculptRadius, sculptStrength, selectedId]);

  useEffect(() => {
    if (!active || autosaveReadyRef.current || !runtimeRef.current) return;
    let cancelled = false;
    const loadVersion = workspaceLoadVersionRef.current;
    (async () => {
      try {
        const saved = await getProject(THREE_AUTOSAVE_ID);
        if (cancelled || loadVersion !== workspaceLoadVersionRef.current || autosaveReadyRef.current) return;
        if (saved?.content || saved?.contentItems) {
          historyRef.current.restoring = true;
          if (saved.contentItems) await loadAutosaveState(saved);
          else loadSceneState(saved);
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
        if (!cancelled && loadVersion === workspaceLoadVersionRef.current) autosaveReadyRef.current = true;
      }
    })();
    return () => { cancelled = true; };
  }, [active]);

  useEffect(() => {
    if (!active || !autosaveReadyRef.current || viewportRecording || animationExporting) return undefined;
    setAutosaveStatus("Cambios pendientes");
    const timer = setTimeout(async () => {
      if (autosaveInFlightRef.current) {
        autosaveQueuedRef.current = true;
        return;
      }
      autosaveInFlightRef.current = true;
      const state = serializeScene({ forAutosave: true });
      if (!state) {
        autosaveInFlightRef.current = false;
        return;
      }
      try {
        setAutosaveStatus("Guardando...");
        const autosavedAt = new Date().toISOString();
        await putProject(THREE_AUTOSAVE_ID, { ...state, autosavedAt });
        const savedTime = new Date(autosavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setAutosaveStatus(`Guardado ${savedTime}`);
      } catch (error) {
        console.error(error);
        setAutosaveStatus("Error de autosave");
      } finally {
        autosaveInFlightRef.current = false;
        if (autosaveQueuedRef.current) {
          autosaveQueuedRef.current = false;
          setAutosaveRevision((revision) => revision + 1);
        }
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [active, autosaveRevision, objects, selection, background, environmentBackground, skyMotionEnabled, skyMotionSpeed, sceneEffects, gridVisible, ambientIntensity, exposure, floorVisible, floorColor, floorSurface, grassSettings, lavaSettings, realisticSky, renderResolution, transparentPng, animationDuration, animationTracks, animationLoop, cameraShake, cameraFollow, cinematicCamera, directorPreset, slowMotion, freezeMotion, activeLightingRig, mode, propertyTab, deformAmount, sculptBrush, sculptRadius, sculptStrength, poseVersion, viewportRecording, animationExporting]);

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

  function applyLightingRig(rigId) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const rigs = {
      recital: {
        ambient: 0.38, exposure: 1.2, lights: [
          { type: "spot", name: "Recital magenta", color: 0xff176b, intensity: 1450, position: [-4, 7, 4], target: [0, 1.5, 0], beat: ["#ff176b", "#7b2cff"] },
          { type: "spot", name: "Recital cyan", color: 0x28d7ff, intensity: 1250, position: [4, 6, 3], target: [0, 1.4, 0], beat: ["#28d7ff", "#ffffff"] },
          { type: "point", name: "Contraluz recital", color: 0xffffff, intensity: 650, position: [0, 4, -4] }
        ]
      },
      metal: {
        ambient: 0.2, exposure: 1.28, lights: [
          { type: "spot", name: "Metal rojo", color: 0xff1b16, intensity: 1700, position: [-3.5, 5, 2], target: [0, 1.2, 0], beat: ["#ff1b16", "#ff7a00"] },
          { type: "spot", name: "Metal azul", color: 0x245dff, intensity: 1350, position: [3.5, 6, 1], target: [0, 1.5, 0], beat: ["#245dff", "#b900ff"] },
          { type: "point", name: "Metal trasera", color: 0xff174f, intensity: 900, position: [0, 2.5, -3.5] }
        ]
      },
      terror: {
        ambient: 0.12, exposure: 1.05, lights: [
          { type: "spot", name: "Terror inferior", color: 0x78ff82, intensity: 900, position: [0, 0.5, 2], target: [0, 1.8, 0] },
          { type: "point", name: "Terror sangre", color: 0xaa0018, intensity: 700, position: [-3, 2, -2] }
        ]
      },
      moon: {
        ambient: 0.3, exposure: 1.08, lights: [
          { type: "directional", name: "Luna principal", color: 0xaec8ff, intensity: 3.6, position: [-5, 9, 4], target: [0, 1, 0] },
          { type: "point", name: "Luna ambiente", color: 0x526dff, intensity: 260, position: [3, 4, -3] }
        ]
      },
      fire: {
        ambient: 0.18, exposure: 1.2, lights: [
          { type: "point", name: "Fuego izquierdo", color: 0xff4a0a, intensity: 1050, position: [-3, 1.2, 2] },
          { type: "point", name: "Fuego derecho", color: 0xffa21a, intensity: 850, position: [3, 1, 1] },
          { type: "spot", name: "Fuego cenital", color: 0xff3515, intensity: 900, position: [0, 6, -1], target: [0, 1, 0] }
        ]
      }
    };
    const rig = rigs[rigId];
    if (!rig) return;
    if (activeLightingRig === rigId) {
      clearLightingRig();
      return;
    }
    pushHistory();
    updateSceneEffect("churchLighting", "enabled", false);
    if (!lightingRigBaselineRef.current) {
      lightingRigBaselineRef.current = {
        ambient: ambientIntensity,
        exposure,
        keyIntensity: runtime.keyLight.intensity,
        keyColor: `#${runtime.keyLight.color.getHexString()}`,
        ambientColor: `#${runtime.ambient.color.getHexString()}`,
        ambientGroundColor: `#${runtime.ambient.groundColor.getHexString()}`
      };
    }
    runtime.content.children.filter((item) => item.isLight && item.userData.lightRig).forEach((light) => {
      runtime.content.remove(light);
      disposeObject(light);
    });
    const baseline = lightingRigBaselineRef.current;
    runtime.keyLight.intensity = baseline.keyIntensity ?? runtime.keyLight.intensity;
    runtime.keyLight.color.set(baseline.keyColor || "#ffffff");
    runtime.ambient.color.set(baseline.ambientColor || "#ffffff");
    runtime.ambient.groundColor.set(baseline.ambientGroundColor || "#384152");
    rig.lights.forEach((config, index) => {
      const light = config.type === "spot"
        ? new THREE.SpotLight(config.color, config.intensity, 40, THREE.MathUtils.degToRad(35), 0.38, 1.5)
        : config.type === "directional"
          ? new THREE.DirectionalLight(config.color, config.intensity)
          : new THREE.PointLight(config.color, config.intensity, 35, 2);
      light.name = config.name;
      light.position.fromArray(config.position);
      light.castShadow = index === 0;
      if (light.shadow) light.shadow.mapSize.set(2048, 2048);
      if (config.target && light.target) {
        light.target.position.fromArray(config.target);
        light.target.updateMatrixWorld(true);
      }
      light.userData = { editorId: makeId(), editorType: "light", lightType: config.type, lightRig: rigId };
      if (config.beat) light.userData.beatLight = { enabled: true, amount: 1.4, colorA: config.beat[0], colorB: config.beat[1], baseIntensity: config.intensity, baseColor: `#${light.color.getHexString()}` };
      runtime.content.add(light);
    });
    setAmbientIntensity(rig.ambient);
    setExposure(rig.exposure);
    setActiveLightingRig(rigId);
    syncLightMarkers();
    refreshObjects();
    selectObject(null);
    setStatus(`Iluminacion ${rigId} aplicada`);
  }

  function clearLightingRig({ recordHistory = true } = {}) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    if (recordHistory) pushHistory();
    updateSceneEffect("churchLighting", "enabled", false);
    const rigLights = runtime.content.children.filter((item) => item.isLight && item.userData.lightRig);
    rigLights.forEach((light) => {
      runtime.content.remove(light);
      disposeObject(light);
    });
    const baseline = lightingRigBaselineRef.current;
    if (baseline) {
      setAmbientIntensity(baseline.ambient);
      setExposure(baseline.exposure);
      runtime.keyLight.intensity = baseline.keyIntensity ?? runtime.keyLight.intensity;
      runtime.keyLight.color.set(baseline.keyColor || "#ffffff");
      runtime.ambient.color.set(baseline.ambientColor || "#ffffff");
      runtime.ambient.groundColor.set(baseline.ambientGroundColor || "#384152");
    }
    if (rigLights.includes(selectedRef.current)) selectObject(null);
    lightingRigBaselineRef.current = null;
    setActiveLightingRig("");
    syncLightMarkers();
    refreshObjects();
    setStatus("Rig de iluminacion quitado");
  }

  function clearPerformanceCaches() {
    historyRef.current.undo = [];
    historyRef.current.redo = [];
    setHistoryCounts({ undo: 0, redo: 0 });
    BUNDLED_GLTF_CACHE.clear();
    runtimeRef.current?.renderer.renderLists.dispose();
    setStatus("Cache e historial liberados");
  }

  function updateLight(key, value) {
    const light = selectedRef.current;
    if (!light?.isLight) return;
    pushHistory();
    if (key === "color") light.color.set(value);
    else if (key === "angle" && light.isSpotLight) light.angle = THREE.MathUtils.degToRad(Number(value));
    else light[key] = Number(value);
    if (light.userData.beatLight?.enabled && key === "intensity") light.userData.beatLight.baseIntensity = Number(value);
    if (light.userData.beatLight?.enabled && key === "color") light.userData.beatLight.baseColor = value;
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

  function updateBeatLight(patch) {
    const light = selectedRef.current;
    if (!light?.isLight) return;
    pushHistory();
    const current = { enabled: false, amount: 1.5, colorA: "#ff176b", colorB: "#28d7ff", ...(light.userData.beatLight || {}) };
    const next = { ...current, ...patch };
    if (patch.enabled && !current.enabled) {
      next.baseIntensity = light.intensity;
      next.baseColor = `#${light.color.getHexString()}`;
    }
    if (patch.enabled === false) {
      light.intensity = current.baseIntensity ?? light.intensity;
      light.color.set(current.baseColor || "#ffffff");
    }
    light.userData.beatLight = next;
    syncSelection(light);
    setStatus(next.enabled ? "Luz sincronizada con los beats" : "Ritmo de luz desactivado");
  }

  function applyScenePreset(preset) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const lightingId = `preset:${preset}`;
    if (activeLightingRig === lightingId) {
      clearLightingRig();
      return;
    }
    pushHistory();
    updateSceneEffect("churchLighting", "enabled", false);
    const presets = {
      studio: { background: "#17191d", floor: "#24272d", ambient: 0.7, exposure: 1.15, key: 1.8, light: "#ffffff", ground: "#384152" },
      product: { background: "#d9dde2", floor: "#f1f3f5", ambient: 1.05, exposure: 0.95, key: 2.8, light: "#fff7e8", ground: "#8b949d" },
      night: { background: "#030609", floor: "#091016", ambient: 0.16, exposure: 1.25, key: 0.45, light: "#9bbcff", ground: "#050914" }
    };
    const values = presets[preset];
    if (!lightingRigBaselineRef.current) {
      lightingRigBaselineRef.current = {
        ambient: ambientIntensity,
        exposure,
        keyIntensity: runtime.keyLight.intensity,
        keyColor: `#${runtime.keyLight.color.getHexString()}`,
        ambientColor: `#${runtime.ambient.color.getHexString()}`,
        ambientGroundColor: `#${runtime.ambient.groundColor.getHexString()}`
      };
    }
    runtime.content.children.filter((item) => item.isLight && item.userData.lightRig).forEach((light) => {
      runtime.content.remove(light);
      disposeObject(light);
    });
    if (environmentBackground === "solid") setBackground(values.background);
    if (floorSurface === "plastic") setFloorColor(values.floor);
    setAmbientIntensity(values.ambient);
    setExposure(values.exposure);
    runtime.keyLight.intensity = values.key;
    runtime.keyLight.color.set(values.light);
    runtime.ambient.color.set(values.light);
    runtime.ambient.groundColor.set(values.ground);
    setActiveLightingRig(lightingId);
    syncLightMarkers();
    refreshObjects();
    selectObject(null);
    setStatus(`Iluminacion ${preset === "product" ? "Producto" : preset === "night" ? "Nocturna" : "Estudio"} aplicada`);
  }

  function applyEnvironmentPreset(preset) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const environments = {
      solid: { floor: "plastic", ambient: 0.7, exposure: 1.15, key: 1.8, light: "#ffffff", ground: "#384152", effects: {} },
      field: {
        floor: "grass", ambient: 1, exposure: 1, key: 2.6, light: "#fff5dd", ground: "#66805a",
        effects: { particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.08, color: "#f7efd2" } }
      },
      clouds: {
        floor: "grass", ambient: 0.96, exposure: 1.03, key: 2.05, light: "#e8f2ff", ground: "#7e929c",
        effects: {
          fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.1, color: "#c4d3dc" },
          particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.12, color: "#ffffff" }
        }
      },
      factory: {
        floor: "concrete", ambient: 0.62, exposure: 1.08, key: 2.15, light: "#dbe8f0", ground: "#343b40",
        effects: {
          fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.09, color: "#707b82" },
          particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.2, color: "#a9a49a" }
        }
      }
    };
    const environment = environments[preset.id];
    if (!environment) return;
    pushHistory();
    setEnvironmentBackground(preset.id);
    if (preset.id === "clouds") setRealisticSky((current) => ({ ...current, enabled: false }));
    setFloorSurface(environment.floor);
    setFloorColor(defaultFloorColor(environment.floor));
    setFloorVisible(true);
    setSceneEffects({ ...structuredClone(DEFAULT_SCENE_EFFECTS), ...environment.effects });
    setAmbientIntensity(environment.ambient);
    setExposure(environment.exposure);
    runtime.keyLight.intensity = environment.key;
    runtime.keyLight.color.set(environment.light);
    runtime.ambient.color.set(environment.light);
    runtime.ambient.groundColor.set(environment.ground);
    setStatus(`Entorno ${preset.name} aplicado con piso y atmosfera`);
  }

  function applySkyPreset(preset) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const matchingScene = THEMED_SCENES.find((scenePreset) => scenePreset.sky === preset.id);
    if (matchingScene) {
      applyThemedScene(matchingScene);
      return;
    }
    pushHistory();
    const skyScenes = {
      "sky-clouds": {
        floor: "grass",
        effects: {
          fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.08, color: "#c9d9e5" },
          particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.12, color: "#ffffff" }
        }
      },
      "sky-space": {
        floor: "space-nebula",
        effects: {
          space: { ...DEFAULT_SPACE_SETTINGS },
          fog: { ...DEFAULT_CHURCH_FOG, enabled: true, intensity: 0.18, height: 2.1,
            coverage: 48, color: "#203449", windSpeed: 0.36, windDirection: 22, turbulence: 0.72 }
        }
      },
      "sky-sun": {
        floor: "grass",
        effects: { particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.18, color: "#fff0b5" } }
      },
      "sky-night": {
        floor: "concrete",
        effects: {
          fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.3, color: "#26344a" },
          particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.34, color: "#aac8ff" }
        }
      },
      "sky-day": {
        floor: "grass",
        effects: { particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.08, color: "#ffffff" } }
      },
      "sky-sunset": {
        floor: "dirt",
        effects: {
          fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.16, color: "#9c6254" },
          particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.3, color: "#ffc37c" }
        }
      }
    };
    const skyScene = skyScenes[preset.id];
    setEnvironmentBackground(preset.id);
    if (preset.id === "sky-clouds") setRealisticSky((current) => ({ ...current, enabled: false }));
    const nextFloorSurface = skyScene?.floor || "shadow";
    setFloorSurface(nextFloorSurface);
    setFloorColor(defaultFloorColor(nextFloorSurface));
    setFloorVisible(true);
    if (preset.id === "sky-space") setGridVisible(false);
    setSkyMotionEnabled(true);
    setSceneEffects({
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      ...(skyScene?.effects || {})
    });
    setAmbientIntensity(preset.ambient);
    setExposure(preset.exposure);
    runtime.keyLight.intensity = preset.key;
    runtime.keyLight.color.set(preset.light);
    runtime.ambient.color.set(preset.light);
    runtime.ambient.groundColor.set(preset.ground);
    setStatus(`Ambiente ${preset.name} aplicado con piso y efectos`);
  }

  function applyThemedScene(scenePreset) {
    const skyPreset = SKY_BACKGROUNDS.find((preset) => preset.id === scenePreset.sky);
    if (!skyPreset || !runtimeRef.current) return;
    pushHistory();
    if (["ruined-gothic-church", "gothic-church", "castle-interior", "space-ship"].includes(scenePreset.id) && activeLightingRig) clearLightingRig({ recordHistory: false });
    setEnvironmentBackground(skyPreset.id);
    if (scenePreset.id === "medieval-village") setRealisticSky((current) => ({ ...current, enabled: false }));
    setFloorSurface(scenePreset.floor);
    setFloorColor(defaultFloorColor(scenePreset.floor));
    setFloorVisible(true);
    if (scenePreset.id === "moonlit-peaks" || scenePreset.id === "space-ship") setGridVisible(false);
    setSkyMotionEnabled(true);
    setAmbientIntensity(skyPreset.ambient);
    setExposure(skyPreset.exposure);
    runtimeRef.current.keyLight.intensity = skyPreset.key;
    runtimeRef.current.keyLight.color.set(skyPreset.light);
  runtimeRef.current.ambient.color.set(skyPreset.light);
  runtimeRef.current.ambient.groundColor.set(skyPreset.ground);

  const themedEffects = {
    cemetery: {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      fog: { ...DEFAULT_CHURCH_FOG, enabled: true, intensity: 0.16, color: "#2c3942", height: 2.5, coverage: 45, windSpeed: 0.55, windDirection: 28 },
      particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.13, color: "#92a7ad" },
    },
    apocalypse: {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      apocalypseLighting: { ...DEFAULT_APOCALYPSE_LIGHTING, enabled: true },
      apocalypseFires: { ...DEFAULT_APOCALYPSE_FIRES, enabled: true },
    },
    "medieval-apocalypse": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      fog: { ...DEFAULT_CHURCH_FOG, enabled: true, intensity: 0.1, height: 2.8,
        coverage: 38, color: "#4c3938", windSpeed: 0.48, windDirection: 42 },
      fire: { ...DEFAULT_SCENE_EFFECTS.fire, enabled: true, intensity: 0.62 },
      particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.55 },
    },
    "gothic-church": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.035, height: 1.1, coverage: 24, color: "#41424d" },
      gothicLighting: { ...DEFAULT_GOTHIC_LIGHTING, enabled: true },
    },
    "night-swamp": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      fog: { ...DEFAULT_CHURCH_FOG, enabled: true, intensity: 0.14, height: 1.7, coverage: 46, color: "#263c3b", windSpeed: 0.42 },
      particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.18, color: "#849f77" },
    },
    "space-nebula": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      space: { ...DEFAULT_SPACE_SETTINGS },
      fog: { ...DEFAULT_CHURCH_FOG, enabled: true, intensity: 0.18, height: 2.1,
        coverage: 48, color: "#203449", windSpeed: 0.36, windDirection: 22, turbulence: 0.72 },
      particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.18, color: "#b7e6ff" },
    },
    "ruined-gothic-church": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.12, color: "#354151" },
      particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.14, color: "#7f8ea3" },
      storm: { ...DEFAULT_SCENE_EFFECTS.storm, enabled: false, intensity: 0.22 },
      magic: { ...DEFAULT_MAGIC_SETTINGS, enabled: true },
      churchLighting: { ...DEFAULT_CHURCH_LIGHTING, enabled: true },
    },
    "castle-interior": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.06, color: "#53453c" },
      castleLighting: { ...DEFAULT_CASTLE_LIGHTING, enabled: true },
    },
    "space-ship": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: false, intensity: 0.06, color: "#8ce5e2" },
    },
    "medieval-village": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: true, intensity: 0.22, color: "#7f8583" },
      rain: { ...DEFAULT_SCENE_EFFECTS.rain, enabled: true, intensity: 0.38, directionX: 0.16, directionZ: 0.04, color: "#b9d7e4" },
      particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.12, color: "#d5bf96" },
    },
    "moonlit-peaks": {
      ...structuredClone(DEFAULT_SCENE_EFFECTS),
      fog: { ...DEFAULT_CHURCH_FOG, enabled: true, intensity: 0.1, height: 1.45,
        coverage: 44, color: "#26323d", windSpeed: 0.22, windDirection: 35 },
      particles: { ...DEFAULT_SCENE_EFFECTS.particles, enabled: true, intensity: 0.08, color: "#a9bfcc" },
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
  }

  function calculateCameraShotPose(shot, subject, framingBounds = null) {
    const runtime = runtimeRef.current;
    if (!runtime || !subject) return null;
    const bounds = framingBounds?.clone() || new Box3().setFromObject(subject);
    if (bounds.isEmpty()) return null;

    const size = bounds.getSize(new Vector3());
    const subjectHeight = Math.max(size.y, 0.01);
    const framedHeight = Math.max(subjectHeight * (1 - shot.crop), 0.25);
    const target = bounds.getCenter(new Vector3());
    target.y = bounds.min.y + subjectHeight * (shot.crop + (1 - shot.crop) / 2);
    if (shot.focus === "face") {
      const head = findRigBone(subject, "Head");
      if (head) {
        head.getWorldPosition(target);
      } else {
        target.y = bounds.min.y + subjectHeight * 0.86;
      }
    }

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
    const framedWidth = shot.focus === "face" ? Math.min(size.x, subjectHeight * 0.26) : size.x;
    const horizontalDistance = (Math.max(framedWidth, 0.25) / 0.9 / 2) / Math.tan(horizontalFov / 2);
    const distance = Math.max(verticalDistance, horizontalDistance, 0.35);
    const position = target.clone().add(direction.multiplyScalar(distance));
    const up = new Vector3(0, 1, 0).applyAxisAngle(direction, THREE.MathUtils.degToRad(shot.roll || 0));
    return { fov: shot.fov, position, target, up };
  }


  function selectedCinematicSubjects(settings) {
    const orderedSelection = [...selectedIdsRef.current].map(findEditorObject);
    return [
      ...(settings.shot === "ots" && orderedSelection.length > 1 ? orderedSelection : [selectedRef.current, ...orderedSelection])
    ]
      .filter((object, index, all) => object && object.visible && !object.isLight && all.indexOf(object) === index)
      .slice(0, 2);
  }

  function applyCinematicCamera(next, { instant = false, recordHistory = true, label = "cinematografico" } = {}) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const subjects = selectedCinematicSubjects(next);
    if (!subjects.length) {
      setStatus("Selecciona un objeto o personaje para encuadrar");
      return;
    }
    const pose = frameCinematicSubjects(subjects, runtime.camera, next);
    if (!pose) {
      setStatus("El objeto seleccionado no tiene geometria visible");
      return;
    }
    if (recordHistory) pushHistory();
    releaseCameraForManualNavigation();
    setCinematicCamera(next);
    setDirectorPreset("selected-camera");
    const { camera, orbit } = runtime;
    const finish = () => {
      camera.position.copy(pose.position);
      camera.quaternion.copy(pose.quaternion);
      camera.up.copy(pose.up);
      camera.fov = pose.fov;
      camera.near = pose.near;
      camera.updateProjectionMatrix();
      orbit.target.copy(pose.target);
      orbit.enabled = true;
      orbit.update();
      const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(orbit.target));
      cameraOrbitRef.current = { lastTheta: spherical.theta, theta: spherical.theta };
      cameraShotRef.current = null;
      setStatus("Plano " + label + " listo");
    };
    if (instant || next.transition === "instant") {
      finish();
      return;
    }

    const fromPosition = camera.position.clone();
    const fromTarget = orbit.target.clone();
    const fromUp = camera.up.clone();
    const fromQuaternion = camera.quaternion.clone();
    const fromFov = camera.fov;
    const fromNear = camera.near;
    const startedAt = performance.now();
    const duration = THREE.MathUtils.clamp(next.duration, 0.2, 3) * 1000;
    orbit.enabled = false;
    const animate = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = progress * progress * (3 - 2 * progress);
      camera.position.lerpVectors(fromPosition, pose.position, eased);
      camera.quaternion.copy(fromQuaternion).slerp(pose.quaternion, eased);
      camera.up.lerpVectors(fromUp, pose.up, eased).normalize();
      camera.fov = THREE.MathUtils.lerp(fromFov, pose.fov, eased);
      camera.near = THREE.MathUtils.lerp(fromNear, pose.near, eased);
      camera.updateProjectionMatrix();
      orbit.target.lerpVectors(fromTarget, pose.target, eased);
      if (progress < 1) {
        cameraShotRef.current.frame = requestAnimationFrame(animate);
      } else {
        finish();
      }
    };
    cameraShotRef.current = { frame: requestAnimationFrame(animate) };
  }

  function applyShotPreset(type) {
    const shot = CINEMATIC_SHOTS.find((entry) => entry.id === type);
    if (!shot) return;
    applyCinematicCamera({
      ...cinematicCamera, shot: type, lens: shot.lens, lookAt: shot.lookAt,
      distance: 1, composition: 0, faceOff: false, preset: ""
    }, { label: shot.name });
  }

  function applyCameraAngle(type) {
    const angle = CINEMATIC_ANGLES.find((entry) => entry.id === type);
    if (!angle) return;
    applyCinematicCamera({
      ...cinematicCamera, angle: type, azimuth: angle.azimuth,
      elevation: angle.elevation, roll: angle.roll, height: 0,
      faceOff: false, preset: ""
    }, { label: angle.name });
  }

  function applyCinematicPreset(type) {
    const preset = CINEMATIC_PRESETS.find((entry) => entry.id === type);
    if (!preset) return;
    const angle = CINEMATIC_ANGLES.find((entry) => entry.id === preset.angle);
    applyCinematicCamera({
      ...cinematicCamera, shot: preset.shot, angle: preset.angle,
      lens: preset.lens, lookAt: preset.lookAt,
      azimuth: preset.azimuth ?? angle.azimuth,
      elevation: preset.elevation ?? angle.elevation,
      roll: preset.roll ?? angle.roll,
      height: 0, distance: preset.distance ?? 1,
      composition: preset.composition ?? 0,
      faceOff: Boolean(preset.faceOff), preset: type
    }, { label: preset.name });
  }

  function updateCinematicControl(patch, label, instant = true) {
    applyCinematicCamera({ ...cinematicCamera, ...patch, preset: "" }, { label, instant, recordHistory: false });
  }

  function createSelectedCameraDirection(transition) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const subjects = selectedCinematicSubjects(cinematicCamera);
    if (!subjects.length) {
      setStatus("Selecciona un objeto o personaje para animar el plano");
      return;
    }
    const startPose = frameCinematicSubjects(subjects, runtime.camera, {
      ...cinematicCamera,
      distance: cinematicCamera.distance * 1.18,
      azimuth: cinematicCamera.azimuth - 6
    });
    const endPose = frameCinematicSubjects(subjects, runtime.camera, cinematicCamera);
    if (!startPose || !endPose) {
      setStatus("No se puede encuadrar el objeto seleccionado");
      return;
    }
    releaseCameraForManualNavigation();
    const duration = Math.max(6, Math.min(animationDuration, 20));
    const followOrigin = subjects[0].getWorldPosition(new Vector3()).toArray();
    const shotName = CINEMATIC_PRESETS.find((item) => item.id === cinematicCamera.preset)?.name
      || CINEMATIC_SHOTS.find((item) => item.id === cinematicCamera.shot)?.name
      || "Plano del panel";
    const frames = [startPose, endPose].map((pose, index) => {
      const spherical = new THREE.Spherical().setFromVector3(pose.position.clone().sub(pose.target));
      return {
        id: makeId(),
        time: index * duration,
        position: pose.position.toArray(),
        target: pose.target.toArray(),
        orbit: { radius: spherical.radius, phi: spherical.phi, theta: spherical.theta },
        continuousOrbit: false,
        up: pose.up.toArray(),
        fov: pose.fov,
        transition,
        shotName,
        followSubjectId: subjects[0].userData.editorId,
        followOrigin
      };
    });
    runtime.camera.position.copy(startPose.position);
    runtime.orbit.target.copy(startPose.target);
    runtime.camera.up.copy(startPose.up);
    runtime.camera.fov = startPose.fov;
    runtime.camera.near = startPose.near;
    runtime.camera.updateProjectionMatrix();
    runtime.orbit.update();
    cameraOrbitRef.current = { lastTheta: frames[0].orbit.theta, theta: frames[0].orbit.theta };
    animationDurationRef.current = duration;
    setAnimationDuration(duration);
    animationTimeRef.current = 0;
    setAnimationTime(0);
    setAnimationTracks((current) => ({ ...current, [CAMERA_TRACK_ID]: frames }));
    const retainedFreezes = freezeMotionRef.current.filter((segment) => !segment.autoDirector);
    freezeMotionRef.current = retainedFreezes;
    setFreezeMotion(retainedFreezes);
    setStatus("Plano " + shotName + " en reproduccion");
    setTimeout(() => setGlobalPlayback(true), 0);
  }

  function createAutomaticDirection(preset = "hollywood", transition = "cinematic") {
    if (preset === "selected-camera") {
      createSelectedCameraDirection(transition);
      return;
    }
    const runtime = runtimeRef.current;
    const subject = selectedRef.current;
    const automaticScenePreset = ["tv-priest-orbit", "tv-first-person"].includes(preset);
    if (!runtime || (!automaticScenePreset && (!subject || subject.isLight))) {
      setStatus("Selecciona un personaje u objeto para crear la direccion");
      return;
    }
    const byId = Object.fromEntries(CAMERA_SHOTS.map((shot) => [shot.id, shot]));
    const presets = {
      classic: {
        name: "Clasico - planos fijos", duration: 24, forceTransition: "cut", followSubject: false,
        shots: [
          { ...byId.general, angle: 0, elevation: 3, time: 0 },
          { ...byId.full, angle: 0, elevation: 2, time: 4 },
          { ...byId["american-front"], time: 8 },
          { ...byId.medium, angle: 0, elevation: 2, time: 12 },
          { ...byId["medium-close"], time: 16 },
          { ...byId["close-neutral"], time: 20 },
          { ...byId["close-neutral"], time: 24 }
        ]
      },
      "youtube-reveal": {
        name: "YouTube - Descenso al rostro", duration: 10, forceTransition: "smooth", shots: [
          { ...byId["youtube-overhead"], time: 0, angle: -16, elevation: 72 },
          { ...byId["youtube-establishing"], name: "YouTube - Descenso general", time: 3, angle: -9, elevation: 48, crop: 0.08 },
          { ...byId["youtube-medium"], name: "YouTube - Descenso plano medio", time: 6.5, angle: -4, elevation: 20, crop: 0.44 },
          { ...byId["youtube-face"], time: 10, angle: 0, elevation: 3 }
        ]
      },
      "youtube-documentary": {
        name: "YouTube - Documental", duration: 18, shots: [
          { ...byId["youtube-establishing"], time: 0 },
          { ...byId["youtube-medium"], time: 3.5 },
          { ...byId["youtube-interview"], time: 7 },
          { ...byId["youtube-face"], time: 10 },
          { ...byId["youtube-face-side"], time: 13 },
          { ...byId["youtube-establishing"], name: "YouTube - Cierre general", time: 18, angle: 12 }
        ]
      },
      "youtube-interview": {
        name: "YouTube - Entrevista", duration: 12, forceTransition: "smooth", shots: [
          { ...byId["youtube-medium"], time: 0, fill: 0.7 },
          { ...byId["youtube-interview"], time: 4 },
          { ...byId["youtube-face"], time: 8, angle: 10 },
          { ...byId["youtube-medium"], name: "YouTube - Cierre plano medio", time: 12, angle: -8 }
        ]
      },
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
      "dialogue-push": {
        name: "Dialogo - Acercamiento", duration: 10, forceTransition: "smooth", shots: [
          { ...byId.medium, angle: 0, elevation: 3, crop: 0.42, fill: 0.78, fov: 39, time: 0 },
          { ...byId.close, angle: 0, elevation: 4, crop: 0.7, fill: 0.9, fov: 29, time: 10 }
        ]
      },
      "dialogue-push-left": {
        name: "Dialogo - Acercamiento izquierdo", duration: 11, forceTransition: "smooth", shots: [
          { ...byId.medium, angle: 34, elevation: 3, crop: 0.4, fill: 0.78, fov: 40, time: 0 },
          { ...byId.close, angle: 28, elevation: 4, crop: 0.72, fill: 0.9, fov: 29, time: 11 }
        ]
      },
      "dialogue-push-right": {
        name: "Dialogo - Acercamiento derecho", duration: 11, forceTransition: "smooth", shots: [
          { ...byId.medium, angle: -34, elevation: 3, crop: 0.4, fill: 0.78, fov: 40, time: 0 },
          { ...byId.close, angle: -28, elevation: 4, crop: 0.72, fill: 0.9, fov: 29, time: 11 }
        ]
      },
      "dialogue-profile-push": {
        name: "Dialogo - Perfil lento", duration: 12, forceTransition: "smooth", shots: [
          { ...byId.profile, angle: 82, elevation: 2, crop: 0.32, fill: 0.76, fov: 40, time: 0 },
          { ...byId.close, angle: 76, elevation: 4, crop: 0.73, fill: 0.9, fov: 28, time: 12 }
        ]
      },
      "dialogue-pull": {
        name: "Dialogo - Alejamiento", duration: 10, forceTransition: "smooth", shots: [
          { ...byId.close, angle: 0, elevation: 4, crop: 0.72, fill: 0.9, fov: 29, time: 0 },
          { ...byId.american, angle: 0, elevation: 2, crop: 0.2, fill: 0.78, fov: 39, time: 10 }
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
      "tv-priest-orbit": {
        name: "Orbita TV + Cura", duration: 14, forceTransition: "linear", continuousOrbit: true,
        shots: [0, 45, 90, 135, 180, 225, 270, 315, 360].map((angle, index) => ({
          ...byId.general,
          angle,
          elevation: 7,
          crop: 0,
          fill: 0.64,
          fov: 42,
          time: index * 1.75
        }))
      },
      "tv-first-person": {
        name: "TV primera persona", duration: 15, adaptToTimeline: true, forceTransition: "smooth",
        shots: [
          { ...byId.general, angle: 0, elevation: 1, crop: 0, fill: 0.7, fov: 46, time: 0 },
          { ...byId.general, angle: 0, elevation: 1, crop: 0.08, fill: 0.82, fov: 40, time: 6.75 },
          { ...byId.medium, angle: 0, elevation: 0, crop: 0, fill: 0.9, fov: 34, time: 15, tvOnly: true }
        ]
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
      drone: {
        name: "Drone aereo", duration: 14, forceTransition: "smooth", shots: [
          { ...byId.drone, angle: -72, elevation: 54, fill: 0.62, fov: 50, time: 0, railOffset: -0.8 },
          { ...byId.drone, angle: -48, elevation: 60, fill: 0.66, fov: 48, time: 3.5, railOffset: -0.35 },
          { ...byId.drone, angle: -12, elevation: 68, fill: 0.7, fov: 46, time: 7, railOffset: 0 },
          { ...byId.drone, angle: 34, elevation: 62, fill: 0.66, fov: 48, time: 10.5, railOffset: 0.35 },
          { ...byId.drone, angle: 72, elevation: 54, fill: 0.62, fov: 50, time: 14, railOffset: 0.8 }
        ]
      },
      "freeze-360": {
        name: "360 congelado", duration: 12, forceTransition: "linear", continuousOrbit: true,
        shots: [0, 60, 120, 180, 240, 300, 360].map((angle, index) => ({
          ...byId.american,
          angle,
          elevation: 5,
          fill: 0.82,
          fov: 36,
          time: index * 2
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
    let directionSubject = subject;
    let directionBounds = null;
    let tvFocusBounds = null;
    if (preset === "tv-priest-orbit") {
      const sceneObjects = runtime.content.children.filter((item) => item.visible !== false);
      const tv = sceneObjects.find((item) => item.userData?.bundledStaticModel === "retro-tv");
      const priests = sceneObjects.filter((item) => ["cura-sentado", "cura-2"].includes(item.userData?.bundledModel));
      if (!tv || !priests.length) {
        setStatus("Agrega una Retro TV y un Cura para crear esta toma");
        return;
      }
      const tvPosition = tv.getWorldPosition(new Vector3());
      directionSubject = priests.reduce((nearest, candidate) => {
        if (!nearest) return candidate;
        const candidateDistance = candidate.getWorldPosition(new Vector3()).distanceToSquared(tvPosition);
        const nearestDistance = nearest.getWorldPosition(new Vector3()).distanceToSquared(tvPosition);
        return candidateDistance < nearestDistance ? candidate : nearest;
      }, null);
      directionBounds = new Box3().setFromObject(tv).union(new Box3().setFromObject(directionSubject));
      const combinedSize = directionBounds.getSize(new Vector3());
      const center = directionBounds.getCenter(new Vector3());
      const horizontalSpan = Math.max(combinedSize.x, combinedSize.z) * 1.18;
      directionBounds.min.x = center.x - horizontalSpan / 2;
      directionBounds.max.x = center.x + horizontalSpan / 2;
    }
    if (preset === "tv-first-person") {
      const sceneObjects = runtime.content.children.filter((item) => item.visible !== false);
      const tv = sceneObjects.find((item) => item.userData?.bundledStaticModel === "retro-tv");
      if (!tv) {
        setStatus("Agrega una Retro TV para crear esta toma");
        return;
      }
      const tvPosition = tv.getWorldPosition(new Vector3());
      const tables = sceneObjects.filter((item) => item.userData?.bundledStaticModel === "mesa-tv");
      const table = tables.reduce((nearest, candidate) => {
        if (!nearest) return candidate;
        return candidate.getWorldPosition(new Vector3()).distanceToSquared(tvPosition)
          < nearest.getWorldPosition(new Vector3()).distanceToSquared(tvPosition) ? candidate : nearest;
      }, null);
      directionSubject = tv;
      tvFocusBounds = new Box3().setFromObject(tv);
      directionBounds = tvFocusBounds.clone();
      if (table) directionBounds.union(new Box3().setFromObject(table));
    }
    const sequence = direction.shots;
    const duration = direction.adaptToTimeline ? Math.max(animationDuration, direction.duration) : direction.duration;
    const directionTimeScale = duration / direction.duration;
    const subjectSize = (directionBounds || new Box3().setFromObject(directionSubject)).getSize(new Vector3());
    const railUnit = Math.max(subjectSize.x, subjectSize.y * 0.45, 1);
    const followOrigin = directionSubject.getWorldPosition(new Vector3()).toArray();
    const frames = sequence.map((shot, index) => {
      const pose = calculateCameraShotPose(shot, directionSubject, shot.tvOnly ? tvFocusBounds : directionBounds);
      if (shot.railOffset) {
        const backward = pose.position.clone().sub(pose.target).normalize();
        const right = new Vector3().crossVectors(pose.up, backward).normalize();
        pose.position.addScaledVector(right, shot.railOffset * railUnit);
      }
      const spherical = new THREE.Spherical().setFromVector3(pose.position.clone().sub(pose.target));
      return {
        id: makeId(),
        time: round(shot.time != null ? shot.time * directionTimeScale : (duration * index) / (sequence.length - 1)),
        position: pose.position.toArray(),
        target: pose.target.toArray(),
        orbit: { radius: spherical.radius, phi: spherical.phi, theta: spherical.theta },
        continuousOrbit: Boolean(direction.continuousOrbit),
        up: pose.up.toArray(),
        fov: pose.fov,
        transition: direction.forceTransition || transition,
        shotName: shot.name,
        followSubjectId: direction.followSubject === false ? null : directionSubject.userData.editorId,
        followOrigin: direction.followSubject === false ? null : followOrigin
      };
    });
    if (direction.continuousOrbit) {
      for (let index = 1; index < frames.length; index += 1) {
        const previousTheta = frames[index - 1].orbit.theta;
        const rawTheta = frames[index].orbit.theta;
        const shortestDelta = Math.atan2(Math.sin(rawTheta - previousTheta), Math.cos(rawTheta - previousTheta));
        frames[index].orbit.theta = previousTheta + shortestDelta;
      }
    }
    const first = frames[0];
    runtime.camera.position.fromArray(first.position);
    runtime.orbit.target.fromArray(first.target);
    runtime.camera.up.fromArray(first.up);
    runtime.camera.fov = first.fov;
    runtime.camera.updateProjectionMatrix();
    runtime.orbit.update();
    cameraOrbitRef.current = { lastTheta: first.orbit.theta, theta: first.orbit.theta };
    setAnimationPlaying(false);
    animationDurationRef.current = duration;
    setAnimationDuration(duration);
    animationTimeRef.current = 0;
    setAnimationTime(0);
    setAnimationTracks((current) => ({ ...current, [CAMERA_TRACK_ID]: frames }));
    const retainedFreezes = freezeMotionRef.current.filter((segment) => !segment.autoDirector);
    const nextFreezes = preset === "freeze-360"
      ? [...retainedFreezes, { id: makeId(), start: 0, end: duration, resume: "quick", resumeDuration: 0.1, autoDirector: true }]
      : retainedFreezes;
    freezeMotionRef.current = nextFreezes;
    setFreezeMotion(nextFreezes);
    if (preset === "matrix") {
      const matrixSlowMotion = { enabled: true, start: 3.2, end: 9.8, speed: 0.25 };
      slowMotionRef.current = matrixSlowMotion;
      setSlowMotion(matrixSlowMotion);
    }
    setStatus(`Direccion ${direction.name} en reproduccion`);
    setTimeout(() => setGlobalPlayback(true), 0);
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
  }

  function zoomCamera(factor) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    releaseCameraForManualNavigation();
    if (factor < 1) runtime.orbit.dollyIn(factor);
    else runtime.orbit.dollyOut(1 / factor);
  }

  function releaseCameraForManualNavigation() {
    const runtime = runtimeRef.current;
    scenePlaybackRef.current.paused = true;
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
      scale: object.scale.toArray(),
      poseOffsets: poseBoneOptions(object).length ? structuredClone(object.userData.poseOffsets || {}) : undefined
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
      fov: runtime.camera.fov,
      shotName: ""
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
    const previousShadowState = runtime.renderer.shadowMap.enabled;
    const previousReducedState = performanceSampleRef.current.reduced;
    const previousAspect = runtime.camera.aspect;
    const previousBackground = runtime.scene.background;
    const floorWasVisible = runtime.floor.visible;
    const ruinsWereVisible = runtime.ruinedChurchDebris.visible;
    const apocalypseDebrisWasVisible = runtime.apocalypseDebris.visible;
    const medievalSetWasVisible = runtime.medievalSet.visible;
    const moonlitPeaksSetWasVisible = runtime.moonlitPeaksSet.visible;
    const cemeteryDetailsWereVisible = runtime.cemeteryDetails.visible;
    const cemeteryBatsWereVisible = runtime.cemeteryBats.visible;
    const swampBatsWereVisible = runtime.swampBats.visible;
    const swampSetWasVisible = runtime.swampSet.visible;
    const castleInteriorWasVisible = runtime.castleInterior.visible;
    const spaceShipWasVisible = runtime.spaceShipSet.visible;
    const gothicInteriorWasVisible = runtime.gothicInterior.visible;
    const skyWasVisible = runtime.realisticSkyDome.visible;
    const churchPanoramaWasVisible = runtime.churchPanorama.visible;
    const infernalPanoramaWasVisible = runtime.infernalPanorama.visible;
    const apocalypsePanoramaWasVisible = runtime.apocalypsePanorama.visible;
    const medievalPanoramaWasVisible = runtime.medievalPanorama.visible;
    const cemeteryPanoramaWasVisible = runtime.cemeteryPanorama.visible;
    const moonlitPanoramaWasVisible = runtime.moonlitPanorama.visible;
    const castlePanoramaWasVisible = runtime.castlePanorama.visible;
    const gothicPanoramaWasVisible = runtime.gothicPanorama.visible;
    const swampPanoramaWasVisible = runtime.swampPanorama.visible;
    const spacePanoramaWasVisible = runtime.spacePanorama.visible;
    const cloudsPanoramaWasVisible = runtime.cloudsPanoramaBackdrop.visible;
    const medievalVillagePanoramaWasVisible = runtime.medievalVillagePanorama.visible;
    const spiderwebRuinsPanoramaWasVisible = runtime.spiderwebRuinsPanorama.visible;
    const apocalypseFiresWereVisible = runtime.sceneEffectSystem.apocalypseFires.visible;
    const magicSeal = runtime.sceneEffectSystem.magic.getObjectByName("Sello arcano");
    const magicSealWasVisible = magicSeal.visible;
    const churchFogWasVisible = runtime.sceneEffectSystem.churchFog.visible;
    const rainImpacts = runtime.sceneEffectSystem.rain.getObjectByName("Salpicaduras de lluvia");
    const rainImpactsWereVisible = rainImpacts.visible;
    const stormClouds = runtime.sceneEffectSystem.storm.getObjectByName("Nubes volumetricas de tormenta");
    const stormCloudsWereVisible = stormClouds.visible;
    const churchBeamVisibility = runtime.sceneEffectSystem.churchLighting.children.filter((object) => object.isMesh)
      .map((beam) => [beam, beam.visible]);
    const gridWasVisible = runtime.grid.visible;
    const transformWasVisible = runtime.transformHelper.visible;
    const transformWasEnabled = runtime.transform.enabled;
    const cleanRenderWasActive = cleanRenderRef.current;
    const lightHelperWasVisible = runtime.lightHelper?.visible;
    const markerVisibility = [...runtime.lightMarkers.values()].map((marker) => [marker, marker.visible]);
    runtime.renderer.setPixelRatio(1);
    runtime.renderer.shadowMap.enabled = true;
    runtime.renderer.shadowMap.needsUpdate = true;
    performanceSampleRef.current.reduced = false;
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
      runtime.ruinedChurchDebris.visible = false;
      runtime.apocalypseDebris.visible = false;
      runtime.medievalSet.visible = false;
      runtime.moonlitPeaksSet.visible = false;
      runtime.cemeteryDetails.visible = false;
      runtime.cemeteryBats.visible = false;
      runtime.swampBats.visible = false;
      runtime.swampSet.visible = false;
      runtime.castleInterior.visible = false;
      runtime.spaceShipSet.visible = false;
      runtime.gothicInterior.visible = false;
      runtime.realisticSkyDome.visible = false;
      runtime.churchPanorama.visible = false;
      runtime.infernalPanorama.visible = false;
      runtime.apocalypsePanorama.visible = false;
      runtime.medievalPanorama.visible = false;
      runtime.cemeteryPanorama.visible = false;
      runtime.moonlitPanorama.visible = false;
      runtime.castlePanorama.visible = false;
      runtime.gothicPanorama.visible = false;
      runtime.swampPanorama.visible = false;
      runtime.spacePanorama.visible = false;
      runtime.cloudsPanoramaBackdrop.visible = false;
      runtime.medievalVillagePanorama.visible = false;
      runtime.spiderwebRuinsPanorama.visible = false;
      runtime.sceneEffectSystem.apocalypseFires.visible = false;
      magicSeal.visible = false;
      runtime.sceneEffectSystem.churchFog.visible = false;
      rainImpacts.visible = false;
      stormClouds.visible = false;
      churchBeamVisibility.forEach(([beam]) => { beam.visible = false; });
    }
    return () => {
      runtime.renderer.setPixelRatio(previousPixelRatio);
      runtime.renderer.shadowMap.enabled = previousShadowState;
      runtime.renderer.shadowMap.needsUpdate = true;
      performanceSampleRef.current.reduced = previousReducedState;
      runtime.renderer.setSize(previousSize.x, previousSize.y, false);
      runtime.camera.aspect = previousAspect;
      runtime.camera.updateProjectionMatrix();
      runtime.scene.background = previousBackground;
      runtime.floor.visible = floorWasVisible;
      runtime.ruinedChurchDebris.visible = ruinsWereVisible;
      runtime.apocalypseDebris.visible = apocalypseDebrisWasVisible;
      runtime.medievalSet.visible = medievalSetWasVisible;
      runtime.moonlitPeaksSet.visible = moonlitPeaksSetWasVisible;
      runtime.cemeteryDetails.visible = cemeteryDetailsWereVisible;
      runtime.cemeteryBats.visible = cemeteryBatsWereVisible;
      runtime.swampBats.visible = swampBatsWereVisible;
      runtime.swampSet.visible = swampSetWasVisible;
      runtime.castleInterior.visible = castleInteriorWasVisible;
      runtime.spaceShipSet.visible = spaceShipWasVisible;
      runtime.gothicInterior.visible = gothicInteriorWasVisible;
      runtime.realisticSkyDome.visible = skyWasVisible;
      runtime.churchPanorama.visible = churchPanoramaWasVisible;
      runtime.infernalPanorama.visible = infernalPanoramaWasVisible;
      runtime.apocalypsePanorama.visible = apocalypsePanoramaWasVisible;
      runtime.medievalPanorama.visible = medievalPanoramaWasVisible;
      runtime.cemeteryPanorama.visible = cemeteryPanoramaWasVisible;
      runtime.moonlitPanorama.visible = moonlitPanoramaWasVisible;
      runtime.castlePanorama.visible = castlePanoramaWasVisible;
      runtime.gothicPanorama.visible = gothicPanoramaWasVisible;
      runtime.swampPanorama.visible = swampPanoramaWasVisible;
      runtime.spacePanorama.visible = spacePanoramaWasVisible;
      runtime.cloudsPanoramaBackdrop.visible = cloudsPanoramaWasVisible;
      runtime.medievalVillagePanorama.visible = medievalVillagePanoramaWasVisible;
      runtime.spiderwebRuinsPanorama.visible = spiderwebRuinsPanoramaWasVisible;
      runtime.sceneEffectSystem.apocalypseFires.visible = apocalypseFiresWereVisible;
      magicSeal.visible = magicSealWasVisible;
      runtime.sceneEffectSystem.churchFog.visible = churchFogWasVisible;
      rainImpacts.visible = rainImpactsWereVisible;
      stormClouds.visible = stormCloudsWereVisible;
      churchBeamVisibility.forEach(([beam, visible]) => { beam.visible = visible; });
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
    const exportDuration = Math.max(1, animationDurationRef.current);
    if (!Object.values(animationTracks).some((frames) => frames.length > 1)) {
      setStatus("Agrega al menos dos keyframes para exportar una animacion");
      return;
    }
    if (!runtime.renderer.domElement.captureStream || typeof MediaRecorder === "undefined") {
      setStatus("Este navegador no permite exportar video desde el canvas");
      return;
    }

    const tvVideos = runtime.content.children.map((object) => TV_VIDEO_ELEMENTS.get(object)).filter(Boolean);
    const hasExportAudio = Boolean(soundtrackBufferRef.current || tvVideos.length);
    const mimeCandidates = hasExportAudio
      ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
      : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
    const mimeType = mimeCandidates
      .find((type) => MediaRecorder.isTypeSupported(type));
    if (!mimeType) {
      setStatus("No hay un codificador WebM disponible");
      return;
    }

    setAnimationExporting(true);
    setStatus(`Exportando ${exportDuration.toFixed(0)} segundos...`);
    setGlobalPlayback(false);
    seekAnimation(0);
    const restoreOutput = prepareRenderOutput({ clean: true });

    try {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      // Request every frame explicitly so a slow render cannot skip camera positions.
      let stream = runtime.renderer.domElement.captureStream(0);
      let videoTrack = stream.getVideoTracks()[0];
      if (typeof videoTrack?.requestFrame !== "function") {
        stream.getTracks().forEach((track) => track.stop());
        stream = runtime.renderer.domElement.captureStream(animationFps);
        videoTrack = stream.getVideoTracks()[0];
      }
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
      tvVideos.forEach((video) => {
        video.currentTime = 0;
        video.play().catch(() => {});
        const mediaStream = video.captureStream?.() || video.mozCaptureStream?.();
        mediaStream?.getAudioTracks().forEach((track) => stream.addTrack(track));
      });
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
      exportAudioSource?.start(0);
      scenePlaybackRef.current.paused = false;
      animationPlayingRef.current = true;

      if (typeof videoTrack?.requestFrame === "function") {
        const frameDuration = 1000 / animationFps;
        const totalFrames = Math.max(1, Math.ceil(exportDuration * animationFps));
        const startedAt = performance.now();
        for (let frameIndex = 0; frameIndex <= totalFrames; frameIndex += 1) {
          const frameTime = Math.min(frameIndex / animationFps, exportDuration);
          animationTimeRef.current = frameTime;
          applyAnimationAt(frameTime, false);
          runtime.renderer.render(runtime.scene, runtime.camera);
          videoTrack.requestFrame();

          const delay = startedAt + (frameIndex + 1) * frameDuration - performance.now();
          if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
          else await new Promise((resolve) => requestAnimationFrame(resolve));
        }
      } else {
        // Older browsers do not expose requestFrame; retain the realtime fallback.
        setGlobalPlayback(true);
        await new Promise((resolve) => setTimeout(resolve, exportDuration * 1000));
        setGlobalPlayback(false);
      }

      scenePlaybackRef.current.paused = true;
      animationPlayingRef.current = false;
      recorder.stop();
      await stopped;
      exportAudioSource?.stop();
      await exportAudioContext?.close();
      stream.getTracks().forEach((track) => track.stop());
      tvVideos.forEach((video) => video.pause());
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
      tvVideos.forEach((video) => video.pause());
      setGlobalPlayback(false);
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
      if (item !== clone && item.userData?.editorId) item.userData = { ...item.userData, editorId: makeId() };
      if (item.geometry) item.geometry = item.geometry.clone();
      if (Array.isArray(item.material)) item.material = item.material.map((material) => material.clone());
      else if (item.material) item.material = item.material.clone();
    });
    return clone;
  }

  async function copySelected() {
    if (!selectedRef.current) return;
    const source = selectedRef.current;
    const payload = canReferenceBundledObject(source)
      ? { bundled: serializeBundledDescriptor(source) }
      : { json: source.toJSON() };
    clipboardRef.current = payload;
    await putProject(THREE_CLIPBOARD_ID, payload);
    setHasClipboard(true);
    setStatus(`${source.name} copiado. Podes pegarlo en otro proyecto`);
  }

  async function pasteClipboard() {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const payload = clipboardRef.current || await getProject(THREE_CLIPBOARD_ID);
    if (!payload) return;
    try {
      setStatus("Pegando objeto 3D...");
      let pasted;
      let animations = [];
      if (payload.bundled) {
        const descriptor = payload.bundled;
        const preset = descriptor.kind === "character"
          ? findCharacterPreset(descriptor.assetId)
          : STATIC_MODELS.find((entry) => entry.id === descriptor.assetId);
        if (!preset) throw new Error("El recurso original ya no esta disponible");
        const loaded = await loadStaticPreset(preset);
        pasted = loaded.scene;
        animations = loaded.animations || [];
        pasted.position.fromArray(descriptor.position);
        pasted.quaternion.fromArray(descriptor.quaternion);
        pasted.scale.fromArray(descriptor.scale);
        pasted.visible = descriptor.visible !== false;
        pasted.userData = { ...pasted.userData, ...structuredClone(descriptor.userData), editorId: makeId() };
        pasted.animations = animations;
        ensureNeonMaskPulse(pasted);
        ensureDemonEyePulse(pasted);
        ensureAngelHalo(pasted);
        ensureRetroTvScreen(pasted);
        for (const attachment of descriptor.attachments || []) {
          const attachmentPreset = STATIC_MODELS.find((entry) => entry.id === attachment.assetId);
          const bone = pasted.getObjectByName(attachment.userData?.attachmentBone);
          if (!attachmentPreset || !bone) continue;
          const loadedAttachment = await loadStaticPreset(attachmentPreset);
          const object = loadedAttachment.scene;
          object.name = attachment.name;
          object.position.fromArray(attachment.position);
          object.quaternion.fromArray(attachment.quaternion);
          object.scale.fromArray(attachment.scale);
          object.visible = attachment.visible !== false;
          object.userData = {
            ...object.userData,
            ...structuredClone(attachment.userData),
            editorId: makeId(),
            attachmentOwner: pasted.userData.editorId
          };
          bone.add(object);
        }
      } else {
        pasted = new THREE.ObjectLoader().parse(payload.json);
        pasted.traverse((item) => {
          if (item === pasted || item.userData?.editorId) item.userData = { ...item.userData, editorId: makeId() };
        });
      }
      pushHistory();
      pasted.name = `${pasted.name || "Objeto"} copia`;
      pasted.position.x += 0.6;
      pasted.position.z += 0.6;
      if (pasted.userData?.modelAnimation) {
        pasted.userData.modelAnimation = {
          ...pasted.userData.modelAnimation,
          playing: true
        };
      }
      if (pasted.userData?.locomotion) {
        pasted.userData.locomotion = {
          ...pasted.userData.locomotion,
          origin: pasted.position.toArray(),
          travelled: 0
        };
      }
      runtime.content.add(pasted);
      if (animations.length) registerModelAnimations(pasted, animations);
      refreshObjects();
      selectObject(pasted);
      setStatus(`${pasted.name} pegado desde el portapapeles`);
    } catch (error) {
      console.error(error);
      setStatus("No se pudo pegar el objeto copiado");
    }
  }

  function selectedObjects() {
    const runtime = runtimeRef.current;
    if (!runtime) return [];
    const chosen = [];
    runtime.content.traverse((object) => {
      if (selectedIdsRef.current.has(object.userData?.editorId)) chosen.push(object);
    });
    const chosenSet = new Set(chosen);
    return chosen.filter((object) => {
      let parent = object.parent;
      while (parent && parent !== runtime.content) {
        if (chosenSet.has(parent)) return false;
        parent = parent.parent;
      }
      return true;
    });
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
      [effect]: effect === "magic" ? normalizeMagicSettings({ ...current.magic, [key]: value })
        : effect === "space" ? normalizeSpaceSettings({ ...current.space, [key]: value })
        : effect === "churchLighting" ? normalizeChurchLighting({ ...current.churchLighting, [key]: value })
          : effect === "cemeteryLighting" ? normalizeCemeteryLighting({ ...current.cemeteryLighting, [key]: value })
            : effect === "castleLighting" ? normalizeCastleLighting({ ...current.castleLighting, [key]: value })
              : effect === "gothicLighting" ? normalizeGothicLighting({ ...current.gothicLighting, [key]: value })
          : effect === "apocalypseFires" ? normalizeApocalypseFires({ ...current.apocalypseFires, [key]: value })
          : effect === "fog" ? normalizeChurchFog({ ...current.fog, [key]: value })
            : effect === "rain" ? normalizeRain({ ...current.rain, [key]: value })
              : effect === "storm" ? normalizeStorm({ ...current.storm, [key]: value })
          : { ...current[effect], [key]: value }
    }));
  }

  function updateApocalypseFirePosition(index, axis, value) {
    setSceneEffects((current) => {
      const fires = normalizeApocalypseFires(current.apocalypseFires);
      fires.positions[index] = { ...fires.positions[index], [axis]: value };
      return { ...current, apocalypseFires: normalizeApocalypseFires(fires) };
    });
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
      spaceShip: {
        fog: { ...DEFAULT_SCENE_EFFECTS.fog, enabled: false },
        fire: { enabled: false, intensity: 0.6 },
        rain: { ...DEFAULT_SCENE_EFFECTS.rain, enabled: false },
        particles: { enabled: true, intensity: 0.06, color: "#8ce5e2" },
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
    setSceneEffects({ ...structuredClone(DEFAULT_SCENE_EFFECTS), ...presets[preset] });
    const names = { castleInterior: "Interior del castillo", spaceShip: "Space Ship", medievalVillage: "Aldea humeda", moonlitPeaks: "Cumbres luna llena", spiderwebRuins: "Ruinas de telaranas" };
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

  function updateMaskPulse(patch) {
    const object = selectedRef.current;
    if (!object?.userData.maskPulse) return;
    object.userData.maskPulse = normalizeMaskNeon({ ...object.userData.maskPulse, ...patch });
    syncSelection(object);
  }

  function updateTvScreen(key, index, value) {
    const object = selectedRef.current;
    const screen = object?.getObjectByName("RetroTvVideoScreen");
    if (!object?.userData.tvScreen || !screen) return;
    const values = [...object.userData.tvScreen[key]];
    values[index] = Number(value);
    object.userData.tvScreen = { ...object.userData.tvScreen, [key]: values };
    if (key === "scale") screen.scale.set(values[0], values[1], 1);
    else if (screen.userData.basePosition) screen.position.fromArray(screen.userData.basePosition).add(new Vector3().fromArray(values));
    syncSelection(object);
  }

  function setModelAnimationSpeed(speed) {
    const object = selectedRef.current;
    const entry = runtimeRef.current?.mixers.get(object?.userData.editorId);
    if (!object?.userData.modelAnimation || !entry) return;
    const nextSpeed = Number(speed);
    const locomotion = object.userData.locomotion;
    if (locomotion?.enabled && locomotion.syncAnimation !== false && locomotion.gaitUnitsPerSecond) {
      locomotion.speed = speedForAnimationChange(locomotion.speed, object.userData.modelAnimation.speed, nextSpeed);
      entry.mixer.timeScale = syncedGaitRate(locomotion.currentSpeed || 0, object.scale.z, locomotion.gaitUnitsPerSecond);
    } else entry.mixer.timeScale = nextSpeed;
    object.userData.modelAnimation.speed = nextSpeed;
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

  function updateLocomotion(patch) {
    const object = selectedRef.current;
    if (!object?.userData.locomotion || object.userData?.locked) return;
    const locomotion = object.userData.locomotion;
    Object.assign(locomotion, patch);
    if (patch.enabled === false) {
      locomotion.currentSpeed = 0;
      const entry = runtimeRef.current?.mixers.get(object.userData.editorId);
      if (entry) entry.mixer.timeScale = object.userData.modelAnimation?.speed ?? 1;
    }
    if (patch.enabled === true && !locomotion.origin) {
      locomotion.origin = object.position.toArray();
      locomotion.travelled = 0;
    }
    syncSelection(object);
  }

  function setLocomotionOrigin() {
    const object = selectedRef.current;
    if (!object?.userData.locomotion || object.userData?.locked) return;
    pushHistory();
    object.userData.locomotion.origin = object.position.toArray();
    object.userData.locomotion.baseRotationY = object.rotation.y - THREE.MathUtils.degToRad(object.userData.locomotion.direction ?? 0);
    object.userData.locomotion.travelled = 0;
    syncSelection(object);
    setStatus("Inicio del recorrido actualizado");
  }

  function resetLocomotion() {
    const object = selectedRef.current;
    const locomotion = object?.userData?.locomotion;
    if (!object || !locomotion?.origin || object.userData?.locked) return;
    pushHistory();
    object.position.fromArray(locomotion.origin);
    locomotion.travelled = 0;
    locomotion.currentSpeed = 0;
    syncSelection(object);
    setStatus("Personaje devuelto al inicio del recorrido");
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

  function toggleSceneCategoryVisibility(category) {
    const entries = objects.filter((item) => item.category === category);
    if (!entries.length) return;
    pushHistory();
    const visible = !entries.every((item) => item.visible);
    entries.forEach((item) => {
      const object = findEditorObject(item.id);
      if (object) object.visible = visible;
    });
    if (!visible && entries.some((item) => item.id === selectedId)) selectObject(null);
    refreshObjects();
    setStatus(`${visible ? "Mostrando" : "Ocultando"} ${entries.length} elementos`);
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
    if (modelLoadInFlightRef.current) {
      setStatus(`Espera a que termine de cargar ${modelLoading || "el modelo actual"}`);
      event.target.value = "";
      return;
    }
    const runtime = runtimeRef.current;
    if (!runtime) return;
    modelLoadInFlightRef.current = true;
    setModelLoading(file.name);
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
      const gltf = await createGLTFLoader().loadAsync(url);
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
      modelLoadInFlightRef.current = false;
      setModelLoading("");
      if (url) URL.revokeObjectURL(url);
      event.target.value = "";
    }
  }

  async function rigSelectedModel() {
    const original = selectedRef.current;
    if (!original || rigStage || original.userData.locked) return;
    setRigStage("Preparando malla");
    try {
      const source = cloneSkeleton(original);
      source.position.set(0, 0, 0);
      source.quaternion.identity();
      source.scale.set(1, 1, 1);
      const binary = await new GLTFExporter().parseAsync(source, { binary: true, onlyVisible: true });
      const body = new FormData();
      body.append("model", new File([binary], "model.glb", { type: "model/gltf-binary" }));
      const response = await fetch(`${API}/api/three/local-rig3d`, { method: "POST", body });
      const submitted = await response.json();
      if (!response.ok) throw new Error(submitted.error || "No se pudo iniciar el esqueleto.");
      for (;;) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const progressResponse = await fetch(`${API}/api/three/local-rig3d/${submitted.id}`);
        const progress = await progressResponse.json();
        if (!progressResponse.ok || progress.status === "failed") {
          throw new Error(progress.error || "No se pudo crear el esqueleto.");
        }
        setRigStage(progress.stage || "Creando esqueleto");
        if (progress.status !== "done") continue;
        const gltf = await createGLTFLoader().loadAsync(progress.url);
        const runtime = runtimeRef.current;
        if (!runtime || !original.parent || findEditorObject(original.userData.editorId) !== original) {
          throw new Error("El modelo original ya no esta en la escena.");
        }
        pushHistory();
        const rigged = gltf.scene;
        rigged.name = original.name;
        rigged.userData = { ...original.userData, editorType: "model", locallyRigged: true };
        rigged.position.copy(original.position);
        rigged.quaternion.copy(original.quaternion);
        rigged.scale.copy(original.scale);
        rigged.traverse((item) => {
          if (item.isMesh) { item.castShadow = true; item.receiveShadow = true; }
        });
        runtime.mixers.get(original.userData.editorId)?.mixer.stopAllAction();
        runtime.mixers.delete(original.userData.editorId);
        original.parent.remove(original);
        runtime.content.add(rigged);
        disposeObject(original);
        refreshObjects();
        selectObject(rigged);
        setStatus(`${rigged.name} tiene esqueleto`);
        break;
      }
    } catch (error) {
      console.error(error);
      setStatus(error.message || "No se pudo crear el esqueleto.");
    } finally {
      setRigStage("");
    }
  }

  async function addNeonboy(modelPreset = CHARACTER_MODELS[0]) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    if (modelLoadInFlightRef.current) {
      setStatus(`Espera a que termine de cargar ${modelLoading || "el modelo actual"}`);
      return;
    }
    modelLoadInFlightRef.current = true;
    setModelLoading(modelPreset.name);
    try {
      setStatus(`Cargando ${modelPreset.name}...`);
      const modelUrl = modelPreset.url || await modelPreset.loadUrl();
      const gltf = await loadBundledModel(modelUrl);
      pushHistory();
      const model = gltf.scene;
      model.name = modelPreset.name;
      model.userData = { ...model.userData, editorId: makeId(), editorType: "model", bundledModel: modelPreset.id };
      ensureNeonMaskPulse(model);
      ensureDemonEyePulse(model);
      if (modelPreset.locomotion) {
        const locomotionPreset = typeof modelPreset.locomotion === "object" ? modelPreset.locomotion : {};
        model.userData.locomotion = {
          enabled: true,
          speed: 1.2,
          acceleration: 4.2,
          deceleration: 5.5,
          syncAnimation: true,
          direction: 0,
          distance: 12,
          loop: false,
          faceDirection: true,
          travelled: 0,
          currentSpeed: 0,
          ...locomotionPreset
        };
      }
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
      ensureAngelHalo(model);
      registerModelAnimations(model, gltf.animations);
      let selectedObject = model;
      const guitarConfig = modelPreset.id === "profe"
        ? { loader: PROFESSOR_GUITAR_MODEL_LOADER, staticId: "professor-guitar", name: "Guitarra del Profe" }
        : modelPreset.id === "demon-rock"
          ? { loader: DEMON_GUITAR_MODEL_LOADER, staticId: "demon-guitar", name: "Guitarra de Demon" }
          : modelPreset.id === "zombieGuitarr"
            ? { loader: ZOMBIE_GUITAR_MODEL_LOADER, staticId: "zombie-guitar", name: "Guitarra de Zombie" }
            : { loader: GUITAR_MODEL_LOADER, staticId: "guitar", name: modelPreset.id === "Neonboy-playGuitarHD" ? "Guitarra de Neonboy HD" : "Guitarra del guitarrista" };
      const guitarModelLoader = guitarConfig.loader;
      if (isGuitaristModel(modelPreset.id) && guitarModelLoader) {
        const guitarAtWaist = modelPreset.id === "Neonboy-playGuitarHD";
        setStatus(guitarAtWaist ? "Colocando la guitarra sobre la cintura..." : "Colocando la guitarra en la mano...");
        const guitarUrl = await guitarModelLoader();
        const guitarGltf = await loadBundledModel(guitarUrl);
        const guitar = guitarGltf.scene;
        const anchor = guitarAtWaist
          ? findCharacterHand(model, "Hips") || findCharacterHand(model, "Spine")
          : findCharacterHand(model, "LeftHand") || findCharacterHand(model, "RightHand");
        if (anchor) {
          const characterHeight = new Box3().setFromObject(model).getSize(new Vector3()).y;
          guitar.name = guitarConfig.name;
          guitar.userData = {
            ...guitar.userData,
            editorId: makeId(),
            editorType: "model",
            bundledStaticModel: guitarConfig.staticId,
            editableAttachment: true,
            attachmentBone: anchor.name,
            attachmentOwner: model.userData.editorId
          };
          guitar.traverse((item) => {
            if (item.isMesh) { item.castShadow = true; item.receiveShadow = true; }
          });
          anchor.add(guitar);
          guitar.position.set(0, guitarAtWaist ? -0.03 : 0, guitarAtWaist ? 0.19 : 0);
          guitar.rotation.set(0, 0, guitarAtWaist ? -0.16 : 0);
          guitar.updateWorldMatrix(true, true);
          const guitarSize = new Box3().setFromObject(guitar).getSize(new Vector3());
          const guitarLength = Math.max(guitarSize.x, guitarSize.y, guitarSize.z, 0.001);
          guitar.scale.multiplyScalar((characterHeight * (guitarAtWaist ? 0.58 : 0.62)) / guitarLength);
          if (guitarAtWaist) {
            guitar.userData.savedAttachmentTransform = {
              position: guitar.position.toArray(),
              quaternion: guitar.quaternion.toArray(),
              scale: guitar.scale.toArray()
            };
          }
          selectedObject = guitarAtWaist ? model : guitar;
        }
      }
      if (modelPreset.id === "baterista" && DRUMSTICKS_MODEL_LOADER) {
        setStatus("Colocando un palillo en cada mano...");
        const sticksUrl = await DRUMSTICKS_MODEL_LOADER();
        const sticksGltf = await loadBundledModel(sticksUrl);
        const characterHeight = new Box3().setFromObject(model).getSize(new Vector3()).y;
        [
          { point: "LeftHand", name: "Palillo izquierdo" },
          { point: "RightHand", name: "Palillo derecho" }
        ].forEach(({ point, name }) => {
          const hand = findCharacterHand(model, point);
          if (!hand) return;
          const stick = cloneSkeleton(sticksGltf.scene);
          stick.traverse((item) => {
            if (Array.isArray(item.material)) item.material = item.material.map((material) => material.clone());
            else if (item.material) item.material = item.material.clone();
          });
          SHARED_GEOMETRY_ROOTS.add(stick);
          stick.name = name;
          stick.userData = {
            ...stick.userData,
            editorId: makeId(),
            editorType: "model",
            bundledStaticModel: "drumstick",
            editableAttachment: true,
            attachmentBone: hand.name,
            attachmentOwner: model.userData.editorId
          };
          stick.traverse((item) => {
            if (item.isMesh) { item.castShadow = true; item.receiveShadow = true; }
          });
          hand.add(stick);
          stick.position.set(0, 0, 0);
          stick.rotation.set(0, 0, 0);
          stick.updateWorldMatrix(true, true);
          const stickSize = new Box3().setFromObject(stick).getSize(new Vector3());
          const stickLength = Math.max(stickSize.x, stickSize.y, stickSize.z, 0.001);
          stick.scale.multiplyScalar((characterHeight * 0.28) / stickLength);
        });
      }
      if (modelPreset.id === "neon-stand-disk") {
        setStatus("Colocando el disco en la mano...");
        const hand = findCharacterHand(model, "LeftHand") || findCharacterHand(model, "RightHand");
        if (hand) {
          const disk = await createDiskPlane();
          const characterHeight = new Box3().setFromObject(model).getSize(new Vector3()).y;
          disk.name = "Disco de Neonboy";
          disk.userData = {
            ...disk.userData,
            editorId: makeId(),
            editorType: "model",
            bundledStaticModel: "disk",
            editableAttachment: true,
            attachmentBone: hand.name,
            attachmentOwner: model.userData.editorId
          };
          hand.add(disk);
          disk.position.set(0, 0, 0);
          disk.rotation.set(0, 0, 0);
          disk.updateWorldMatrix(true, true);
          const diskSize = new Box3().setFromObject(disk).getSize(new Vector3());
          const diskLength = Math.max(diskSize.x, diskSize.y, 0.001);
          disk.scale.multiplyScalar((characterHeight * 0.2) / diskLength);
          selectedObject = disk;
        }
      }
      refreshObjects();
      selectObject(selectedObject);
      setMode("translate");
      setStatus(modelPreset.id === "Neonboy-playGuitarHD"
        ? "Guitarrista HD agregado con mascara animada y guitarra vinculada a la cintura"
        : isGuitaristModel(modelPreset.id)
          ? "Guitarrista agregado. Acomoda la guitarra: seguira la mano durante la animacion"
        : modelPreset.id === "baterista"
          ? "Baterista agregado con un palillo editable en cada mano"
          : modelPreset.id === "neon-stand-disk"
            ? "Neonboy agregado con el disco vinculado a la mano"
          : `${modelPreset.name} agregado con su animacion`);
    } catch (error) {
      console.error(error);
      setStatus(`No se pudo cargar ${modelPreset.character}`);
    } finally {
      modelLoadInFlightRef.current = false;
      setModelLoading("");
    }
  }

  async function addStaticModel(modelPreset) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    if (modelLoadInFlightRef.current) {
      setStatus(`Espera a que termine de cargar ${modelLoading || "el modelo actual"}`);
      return;
    }
    modelLoadInFlightRef.current = true;
    setModelLoading(modelPreset.name);
    try {
      setStatus(`Cargando ${modelPreset.name}...`);
      const gltf = await loadStaticPreset(modelPreset);
      pushHistory();
      const model = gltf.scene;
      model.name = modelPreset.name;
      model.userData = { ...model.userData, editorId: makeId(), editorType: "model", bundledStaticModel: modelPreset.id };
      model.animations = [];
      ensureRetroTvScreen(model);
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
    } finally {
      modelLoadInFlightRef.current = false;
      setModelLoading("");
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

  const normalizedSceneSearch = sceneSearch.trim().toLocaleLowerCase("es");
  const sceneGroups = [
    { id: "groups", name: "Grupos", icon: Group },
    { id: "characters", name: "Personajes", icon: Sparkles },
    { id: "objects", name: "Objetos", icon: Box },
    { id: "lights", name: "Luces", icon: Lightbulb }
  ].map((group) => ({
    ...group,
    items: objects.filter((item) => item.category === group.id && (!normalizedSceneSearch || item.name.toLocaleLowerCase("es").includes(normalizedSceneSearch)))
  })).filter((group) => group.items.length);
  const canFrameSelected = objects.some((item) => selectedIds.includes(item.id) && item.visible && item.type !== "light");

  return (
    <section className="three-editor">
      {webglError && <div className="three-webgl-error"><strong>El motor 3D no esta disponible</strong><span>{webglError}</span><button onClick={() => window.location.reload()} type="button">Recuperar escena</button></div>}
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
        <div className="three-performance-control" title={`${performanceStats.triangles.toLocaleString()} triangulos · ${performanceStats.geometries} geometrias · ${performanceStats.textures} texturas`}>
          <Gauge size={15} />
          <strong>{performanceStats.fps || "--"} FPS</strong>
          <select aria-label="Calidad de previsualizacion" onChange={(event) => setPerformanceMode(event.target.value)} value={performanceMode}>
            <option value="auto">Auto</option>
            <option value="performance">Rendimiento</option>
            <option value="quality">Calidad</option>
          </select>
          <button data-tooltip="Liberar cache e historial" onClick={clearPerformanceCaches} type="button"><Trash2 size={15} /></button>
        </div>
        {performanceReduced && <span className="three-performance-status">Vista optimizada</span>}
        <span className="three-autosave-status">{autosaveStatus}</span>
        <button className="three-action" onClick={onRequestProjectSave} type="button"><Download size={17} /> Guardar</button>
        <button className="three-action" onClick={exportPng} type="button"><ImageDown size={17} /> PNG</button>
        <button className="three-action" onClick={exportGlb} type="button"><Download size={17} /> GLB</button>
      </div>

      <div className="three-workspace">
        <aside className="three-library" data-wizard="three-objects">
          <div className="three-panel-heading"><span>CREAR</span><strong>Biblioteca</strong></div>
          {modelLoading && <div className="three-library-loading"><RotateCcw className="spin" size={14} /><span>Cargando {modelLoading}</span></div>}
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
              {STATIC_MODELS.map((model) => <button disabled={Boolean(modelLoading)} key={model.id} onClick={() => addStaticModel(model)} type="button"><Box size={22} /><span>{model.name}</span></button>)}
              <button onClick={() => addLight("point")} type="button"><Lightbulb size={22} /><span>Luz puntual</span></button>
              <button onClick={() => addLight("directional")} type="button"><Sun size={22} /><span>Luz solar</span></button>
              <button onClick={() => addLight("spot")} type="button"><Flashlight size={22} /><span>Foco</span></button>
              <label className={`three-import ${modelLoading ? "disabled" : ""}`}><Upload size={22} /><span>Importar modelo</span><input accept=".glb,.gltf,model/gltf-binary,model/gltf+json" disabled={Boolean(modelLoading)} onChange={importModel} type="file" /></label>
              <label className="three-import"><Palette size={22} /><span>Importar SVG</span><input accept=".svg,image/svg+xml" onChange={importSvg} type="file" /></label>
            </div>
            <div className="three-create-text">
              <label><span>Texto 3D</span><input maxLength="42" onChange={(event) => changeTextDraft(event.target.value)} onFocus={pushHistory} value={textDraft} /></label>
              <label><span>Tipografia</span><select onChange={(event) => changeTextFont(event.target.value)} value={textFont}>{Object.entries(THREE_FONTS).map(([id, entry]) => <option key={id} value={id}>{entry.name}</option>)}</select></label>
              <label><span>Profundidad</span><input max="1.5" min="0.05" onChange={(event) => changeTextDepth(event.target.value)} onFocus={pushHistory} step="0.05" type="number" value={extrudeDepth} /></label>
              <button disabled={!textDraft.trim()} onClick={selectedRef.current?.userData.editorType === "text" ? () => updateSelectedText() : addText} type="button"><Type size={16} /> {selectedRef.current?.userData.editorType === "text" ? "Aplicar cambios" : "Agregar texto"}</button>
            </div>
          </> : <div className="three-character-library">
            {["Neonboy", "Neoncruzader", "Demon", "Zombie", "Reptiliano", "Angel", "Profe", "Cura"].map((character) => <section key={character}>
              <div className="three-library-section-title"><strong>{character}</strong><span>{CHARACTER_MODELS.filter((model) => model.character === character).length}</span></div>
              <div className="three-add-grid">
                {CHARACTER_MODELS.filter((model) => model.character === character).map((model) => <button disabled={Boolean(modelLoading)} key={model.id} onClick={() => addNeonboy(model)} type="button"><Sparkles size={22} /><span>{model.animation}</span></button>)}
              </div>
            </section>)}
          </div>}
          <div className="three-panel-heading three-scene-heading"><span>ESCENA</span><strong>Objetos</strong></div>
          <label className="three-outliner-search">
            <Search size={15} />
            <input aria-label="Buscar en la escena" onChange={(event) => setSceneSearch(event.target.value)} placeholder="Buscar objeto" type="search" value={sceneSearch} />
            <span>{objects.length}</span>
          </label>
          {selection && <div className="three-outliner-actions">
            <span title={selection.name}>{selection.name}</span>
            <button data-tooltip="Enfocar" onClick={focusSelected} type="button"><Focus size={15} /></button>
            <button data-tooltip="Duplicar" onClick={duplicateSelected} type="button"><Copy size={15} /></button>
            <button data-tooltip={selection.locked ? "Desbloquea para eliminar" : "Eliminar"} disabled={selection.locked} onClick={removeSelected} type="button"><Trash2 size={15} /></button>
          </div>}
          <div className="three-outliner">
            {sceneGroups.map((group) => {
              const GroupIcon = group.icon;
              const allVisible = objects.filter((item) => item.category === group.id).every((item) => item.visible);
              return <section className="three-outliner-group" key={group.id}>
                <div className="three-outliner-group-heading">
                  <GroupIcon size={14} /><strong>{group.name}</strong><span>{group.items.length}</span>
                  <button data-tooltip={allVisible ? `Ocultar ${group.name.toLowerCase()}` : `Mostrar ${group.name.toLowerCase()}`} onClick={() => toggleSceneCategoryVisibility(group.id)} type="button">{allVisible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                </div>
                {group.items.map((item) => {
                  const ItemIcon = iconForType(item.type);
                  return <div className={`three-outliner-row ${selectedIds.includes(item.id) ? "active" : ""} ${item.visible ? "" : "hidden"}`} key={item.id}>
                    <button className="three-outliner-select" onClick={(event) => selectObject(findEditorObject(item.id), event.shiftKey)} style={{ paddingLeft: `${8 + item.depth * 14}px` }} type="button"><ItemIcon size={16} /><span>{item.name}</span></button>
                    <button className="three-outliner-lock" data-tooltip={item.locked ? "Desbloquear" : "Bloquear"} onClick={() => toggleObjectLock(item.id)} type="button">{item.locked ? <Lock size={14} /> : <Unlock size={14} />}</button>
                    <button className="three-outliner-visibility" data-tooltip={item.visible ? "Ocultar" : "Mostrar"} onClick={() => toggleObjectVisibility(item.id)} type="button">{item.visible ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                  </div>;
                })}
              </section>;
            })}
            {!sceneGroups.length && <div className="three-outliner-empty">No hay coincidencias</div>}
          </div>
        </aside>

        <div className="three-viewport-wrap" data-wizard="three-viewport">
          <div className="three-viewport" ref={hostRef} />
          <div className="three-viewport-label"><Circle size={8} fill="currentColor" /> Perspectiva</div>
          {recordingCountdown !== null && <div className="three-recording-countdown" key={recordingCountdown}>{recordingCountdown}</div>}
          {status && <div className="three-status">{status}</div>}
        </div>

        <aside className="three-properties" data-tab={propertyTab} data-wizard="three-properties">
          <nav aria-label="Panel de propiedades 3D" className="three-property-tabs">
            <button className={propertyTab === "object" ? "active" : ""} onClick={() => setPropertyTab("object")} type="button"><Box size={15} /><span>Objeto</span></button>
            <button className={propertyTab === "model" ? "active" : ""} onClick={() => setPropertyTab("model")} type="button"><Hammer size={15} /><span>Modelar</span></button>
            <button className={propertyTab === "material" ? "active" : ""} onClick={() => setPropertyTab("material")} type="button"><Palette size={15} /><span>Material</span></button>
            <button className={propertyTab === "camera" ? "active" : ""} onClick={() => setPropertyTab("camera")} type="button"><Camera size={15} /><span>Camara</span></button>
            <button className={propertyTab === "scene" ? "active" : ""} onClick={() => setPropertyTab("scene")} type="button"><Sun size={15} /><span>Escena</span></button>
            <button className={propertyTab === "effects" ? "active" : ""} onClick={() => setPropertyTab("effects")} type="button"><Sparkles size={15} /><span>Efectos</span></button>
            <button className={propertyTab === "output" ? "active" : ""} onClick={() => setPropertyTab("output")} type="button"><Download size={15} /><span>Salida</span></button>
          </nav>
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
          <div className="three-camera-recording three-recording-controls">
            <button aria-label="Grabar render" className={viewportRecording ? "recording" : ""} disabled={viewportRecording || recordingCountdown !== null || viewportConverting} onClick={startViewportRecording} type="button"><Circle fill="currentColor" size={15} /><span>REC</span></button>
            <button aria-label="Detener grabacion" disabled={!viewportRecording && recordingCountdown === null} onClick={stopViewportRecording} type="button"><Square fill="currentColor" size={14} /><span>STOP</span></button>
            <button aria-label="Descargar grabacion WebM" disabled={!viewportRecordingBlob || viewportRecording || recordingCountdown !== null || viewportConverting} onClick={() => downloadViewportRecording("webm")} type="button"><Download size={16} /><span>WebM</span></button>
            <button aria-label="Descargar grabacion MP4 H.264" disabled={!viewportRecordingBlob || viewportRecording || recordingCountdown !== null || viewportConverting} onClick={() => downloadViewportRecording("h264")} type="button"><Film size={16} /><span>{viewportConverting ? "Procesando" : "H.264"}</span></button>
          </div>
          <fieldset className="three-tab-camera three-cinematic-section">
            <legend>CINEMATIC CAMERA</legend>
            <div className="three-cinematic-grid">
              {CINEMATIC_SHOTS.map((shot) => <button
                className={cinematicCamera.shot === shot.id ? "active" : ""}
                disabled={!canFrameSelected}
                key={shot.id}
                onClick={() => applyShotPreset(shot.id)}
                type="button"
              >{shot.name}</button>)}
            </div>
          </fieldset>
          <fieldset className="three-tab-camera three-cinematic-section">
            <legend>CAMERA ANGLES</legend>
            <div className="three-cinematic-grid">
              {CINEMATIC_ANGLES.map((angle) => <button
                className={cinematicCamera.angle === angle.id ? "active" : ""}
                disabled={!canFrameSelected}
                key={angle.id}
                onClick={() => applyCameraAngle(angle.id)}
                type="button"
              >{angle.name}</button>)}
            </div>
          </fieldset>
          <fieldset className="three-tab-camera three-cinematic-section">
            <legend>CINEMATIC PRESETS</legend>
            <div className="three-cinematic-grid">
              {CINEMATIC_PRESETS.map((preset) => <button
                className={cinematicCamera.preset === preset.id ? "active" : ""}
                disabled={!canFrameSelected}
                key={preset.id}
                onClick={() => applyCinematicPreset(preset.id)}
                type="button"
              >{preset.name}</button>)}
            </div>
          </fieldset>
          <fieldset className="three-tab-camera three-cinematic-section">
            <legend>LENS &amp; FRAMING</legend>
            <div className="three-cinematic-lenses">
              {[18, 24, 28, 35, 50, 70, 85, 100, 135].map((lens) => <button
                className={cinematicCamera.lens === lens ? "active" : ""}
                disabled={!canFrameSelected}
                key={lens}
                onClick={() => applyCinematicCamera({ ...cinematicCamera, lens, preset: "" }, { label: "de " + lens + " mm" })}
                type="button"
              >{lens}mm</button>)}
            </div>
            <label><span>Lens ({cinematicCamera.lens} mm)</span><input
              aria-label="Lens"
              disabled={!canFrameSelected}
              max="135" min="18"
              onChange={(event) => updateCinematicControl({ lens: Number(event.target.value) }, "manual")}
              onPointerDown={pushHistory}
              step="1" type="range" value={cinematicCamera.lens}
            /></label>
            <label><span>CAMERA HEIGHT ({Math.round(cinematicCamera.height * 100)}%)</span><input
              aria-label="Camera Height"
              disabled={!canFrameSelected}
              max="1" min="-1"
              onChange={(event) => updateCinematicControl({ height: Number(event.target.value) }, "manual")}
              onPointerDown={pushHistory}
              step="0.05" type="range" value={cinematicCamera.height}
            /></label>
            <label><span>CAMERA DISTANCE ({cinematicCamera.distance.toFixed(2)}x)</span><input
              aria-label="Camera Distance"
              disabled={!canFrameSelected}
              max="3" min="0.6"
              onChange={(event) => updateCinematicControl({ distance: Number(event.target.value) }, "manual")}
              onPointerDown={pushHistory}
              step="0.05" type="range" value={cinematicCamera.distance}
            /></label>
            <label><span>CAMERA ANGLE ({Math.round(cinematicCamera.azimuth)}°)</span><input
              aria-label="Camera Angle"
              disabled={!canFrameSelected}
              max="180" min="-180"
              onChange={(event) => updateCinematicControl({ angle: "custom", azimuth: Number(event.target.value), faceOff: false }, "manual")}
              onPointerDown={pushHistory}
              step="1" type="range" value={cinematicCamera.azimuth}
            /></label>
            <label><span>LOOK AT</span><select
              disabled={!canFrameSelected}
              onChange={(event) => applyCinematicCamera({ ...cinematicCamera, lookAt: event.target.value, preset: "" }, { label: "de enfoque" })}
              value={cinematicCamera.lookAt}
            >
              <option value="head">Head</option>
              <option value="chest">Chest</option>
              <option value="center">Center</option>
              <option value="feet">Feet</option>
            </select></label>
            <div className="three-cinematic-transition">
              <span>TRANSITION</span>
              <div>
                <button className={cinematicCamera.transition === "instant" ? "active" : ""} onClick={() => setCinematicCamera({ ...cinematicCamera, transition: "instant" })} type="button">Instant</button>
                <button className={cinematicCamera.transition === "smooth" ? "active" : ""} onClick={() => setCinematicCamera({ ...cinematicCamera, transition: "smooth" })} type="button">Smooth</button>
              </div>
            </div>
            <label><span>Duration ({cinematicCamera.duration.toFixed(1)} s)</span><input
              aria-label="Transition Duration"
              disabled={cinematicCamera.transition !== "smooth"}
              max="3" min="0.2"
              onChange={(event) => setCinematicCamera({ ...cinematicCamera, duration: Number(event.target.value) })}
              step="0.1" type="range" value={cinematicCamera.duration}
            /></label>
          </fieldset>
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
                    <option value="LeftHand">Mano izquierda</option>
                    <option value="RightHand">Mano derecha</option>
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
              {selection.isLight && (
                <fieldset className="three-tab-object">
                  <legend>Ritmo musical</legend>
                  <label className="three-check"><input checked={selection.beatLight.enabled} onChange={(event) => updateBeatLight({ enabled: event.target.checked })} type="checkbox" /><Music size={16} /> Reaccionar a los beats</label>
                  <label><span>Potencia</span><input disabled={!selection.beatLight.enabled} max="4" min="0.1" onChange={(event) => updateBeatLight({ amount: Number(event.target.value) })} step="0.1" type="range" value={selection.beatLight.amount} /></label>
                  <label className="three-color-field"><span>Color A</span><input disabled={!selection.beatLight.enabled} onChange={(event) => updateBeatLight({ colorA: event.target.value })} type="color" value={selection.beatLight.colorA} /></label>
                  <label className="three-color-field"><span>Color B</span><input disabled={!selection.beatLight.enabled} onChange={(event) => updateBeatLight({ colorB: event.target.value })} type="color" value={selection.beatLight.colorB} /></label>
                  {!soundtrack && <small>Carga musica en la linea de tiempo para detectar los beats.</small>}
                </fieldset>
              )}
              {!selection.isLight && (
                <>
                  {selection.tvScreen && (
                    <fieldset className="three-tab-model">
                      <legend>Pantalla de video</legend>
                      <label><span>Ancho</span><input max="2" min="0.2" onChange={(event) => updateTvScreen("scale", 0, event.target.value)} onPointerDown={pushHistory} step="0.01" type="range" value={selection.tvScreen.scale[0]} /></label>
                      <label><span>Alto</span><input max="2" min="0.2" onChange={(event) => updateTvScreen("scale", 1, event.target.value)} onPointerDown={pushHistory} step="0.01" type="range" value={selection.tvScreen.scale[1]} /></label>
                      <span>Posicion sobre la TV</span>
                      <div className="three-vector-inputs">
                        {["X", "Y", "Z"].map((axis, index) => <label key={axis}><span>{axis}</span><input onChange={(event) => updateTvScreen("offset", index, event.target.value)} onFocus={pushHistory} step="0.01" type="number" value={selection.tvScreen.offset[index]} /></label>)}
                      </div>
                    </fieldset>
                  )}
                  {selectedRef.current?.userData?.editorType === "model" && !poseBoneOptions(selectedRef.current).length && !selection.modelAnimation && (
                    <fieldset className="three-tab-model">
                      <legend>Esqueleto</legend>
                      <button className="three-sculpt-toggle" disabled={Boolean(rigStage) || selection.locked} onClick={rigSelectedModel} type="button"><Sparkles size={16} /> Crear esqueleto</button>
                      {rigStage && <small role="status">{rigStage}</small>}
                    </fieldset>
                  )}
                  {selection.modelAnimation && (
                    <fieldset className="three-tab-model">
                      <legend>Animacion del modelo</legend>
                      <label><span>Clip</span><select onChange={(event) => selectModelAnimation(event.target.value)} value={selection.modelAnimation.clip}>{selection.modelAnimation.clips.map((clip) => <option key={clip} value={clip}>{clip}</option>)}</select></label>
                      <button className="three-sculpt-toggle" onClick={toggleModelAnimation} type="button">{selection.modelAnimation.playing ? <Pause size={16} /> : <Play size={16} />} {selection.modelAnimation.playing ? "Pausar" : "Reproducir"}</button>
                      <label><span>Velocidad</span><input max="2.5" min="0" onChange={(event) => setModelAnimationSpeed(event.target.value)} step="0.05" type="range" value={selection.modelAnimation.speed} /></label>
                    </fieldset>
                  )}
                  {selection.maskPulse && (
                    <fieldset className="three-tab-model">
                      <legend>Brillo de mascara</legend>
                      <label className="three-check"><input checked={selection.maskPulse.enabled} onChange={(event) => { pushHistory(); updateMaskPulse({ enabled: event.target.checked }); }} type="checkbox" /><Lightbulb size={16} /> Titileo activo</label>
                      <label className="three-color-field"><span>Color</span><input disabled={!selection.maskPulse.enabled} onChange={(event) => updateMaskPulse({ color: event.target.value })} onFocus={pushHistory} type="color" value={selection.maskPulse.color} /></label>
                      <label><span>Forma</span><select disabled={!selection.maskPulse.enabled} onChange={(event) => { pushHistory(); updateMaskPulse({ pattern: event.target.value }); }} value={selection.maskPulse.pattern}>
                        <option value="flicker">Titileo electronico</option>
                        <option value="smooth">Pulso suave</option>
                        <option value="heartbeat">Doble golpe</option>
                      </select></label>
                      <label><span>Intensidad</span><input disabled={!selection.maskPulse.enabled} max="20" min="0" onChange={(event) => updateMaskPulse({ intensity: Number(event.target.value) })} onPointerDown={pushHistory} step="0.1" type="range" value={selection.maskPulse.intensity} /></label>
                      <label><span>Velocidad</span><input disabled={!selection.maskPulse.enabled} max="10" min="0.1" onChange={(event) => updateMaskPulse({ speed: Number(event.target.value) })} onPointerDown={pushHistory} step="0.1" type="range" value={selection.maskPulse.speed} /></label>
                      <label className="three-check"><input checked={Boolean(selection.maskPulse.neonEnabled)} disabled={!selection.maskPulse.enabled} onChange={(event) => { pushHistory(); updateMaskPulse({ neonEnabled: event.target.checked }); }} type="checkbox" /><Sparkles size={16} /> Halo neon</label>
                      <label><span>Resplandor</span><input aria-label="Mascara: Resplandor" disabled={!selection.maskPulse.enabled || !selection.maskPulse.neonEnabled} max="2" min="0" onChange={(event) => updateMaskPulse({ neonIntensity: Number(event.target.value) })} onPointerDown={pushHistory} step="0.05" type="range" value={selection.maskPulse.neonIntensity ?? DEFAULT_MASK_NEON.neonIntensity} /></label>
                      <label><span>Alcance</span><input aria-label="Mascara: Alcance" disabled={!selection.maskPulse.enabled || !selection.maskPulse.neonEnabled} max="8" min="0.5" onChange={(event) => updateMaskPulse({ neonRadius: Number(event.target.value) })} onPointerDown={pushHistory} step="0.1" type="range" value={selection.maskPulse.neonRadius ?? DEFAULT_MASK_NEON.neonRadius} /></label>
                    </fieldset>
                  )}
                  {selection.locomotion && (
                    <fieldset className="three-tab-model">
                      <legend>Desplazamiento al caminar</legend>
                      <label className="three-check"><input checked={selection.locomotion.enabled} disabled={selection.locked} onChange={(event) => { pushHistory(); updateLocomotion({ enabled: event.target.checked }); }} type="checkbox" /><Move3D size={16} /> Avanzar por la superficie</label>
                      <label><span>Velocidad</span><input disabled={selection.locked || !selection.locomotion.enabled} max="6" min="0" onChange={(event) => updateLocomotion({ speed: Number(event.target.value) })} onPointerDown={pushHistory} step="0.1" type="range" value={selection.locomotion.speed} /></label>
                      <label><span>Metros/seg</span><input disabled={selection.locked || !selection.locomotion.enabled} max="20" min="0" onChange={(event) => updateLocomotion({ speed: Number(event.target.value) })} onFocus={pushHistory} step="0.1" type="number" value={selection.locomotion.speed} /></label>
                      <label><span>Direccion</span><input disabled={selection.locked || !selection.locomotion.enabled} max="180" min="-180" onChange={(event) => updateLocomotion({ direction: Number(event.target.value) })} onPointerDown={pushHistory} step="1" type="range" value={selection.locomotion.direction} /></label>
                      <label><span>Angulo</span><input disabled={selection.locked || !selection.locomotion.enabled} max="180" min="-180" onChange={(event) => updateLocomotion({ direction: Number(event.target.value) })} onFocus={pushHistory} step="1" type="number" value={selection.locomotion.direction} /></label>
                      <label className="three-check"><input checked={selection.locomotion.faceDirection !== false} disabled={selection.locked || !selection.locomotion.enabled} onChange={(event) => { pushHistory(); updateLocomotion({ faceDirection: event.target.checked }); }} type="checkbox" /><Rotate3D size={16} /> Orientar hacia el recorrido</label>
                      <label><span>Recorrido</span><input disabled={selection.locked || !selection.locomotion.enabled || !selection.locomotion.loop} max="100" min="1" onChange={(event) => updateLocomotion({ distance: Number(event.target.value) })} onFocus={pushHistory} step="1" type="number" value={selection.locomotion.distance} /></label>
                      <label className="three-check"><input checked={selection.locomotion.loop} disabled={selection.locked || !selection.locomotion.enabled} onChange={(event) => { pushHistory(); updateLocomotion({ loop: event.target.checked }); }} type="checkbox" /><RotateCcw size={16} /> Repetir recorrido</label>
                      <div className="three-model-actions">
                        <button disabled={selection.locked} onClick={setLocomotionOrigin} type="button"><LocateFixed size={15} /> Marcar inicio</button>
                        <button disabled={selection.locked || !selection.locomotion.origin} onClick={resetLocomotion} type="button"><RotateCcw size={15} /> Volver al inicio</button>
                      </div>
                    </fieldset>
                  )}
                  {poseBoneOptions(selectedRef.current).length > 0 && (
                    <fieldset className="three-tab-model" key={`pose:${poseVersion}`}>
                      <legend>Pose del personaje</legend>
                      <label><span>Parte</span><select onChange={(event) => { if (poseGizmoRef.current) closeBoneGizmo(); setPoseBone(event.target.value); }} value={poseBone}>
                        {poseBoneOptions(selectedRef.current).map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
                      </select></label>
                      {['X', 'Y', 'Z'].map((axis, index) => {
                        const bone = findRigBone(selectedRef.current, poseBone);
                        const value = THREE.MathUtils.radToDeg(selectedRef.current?.userData?.poseOffsets?.[bone?.name]?.[index] || 0);
                        return <label key={axis}><span>Rotacion {axis}</span><input disabled={selection.locked} max="180" min="-180" onChange={(event) => updateBonePose(index, event.target.value)} onPointerDown={pushHistory} step="1" type="range" value={value} /></label>;
                      })}
                      <button disabled={selection.locked} onClick={resetBonePose} type="button"><RotateCcw size={16} /> Restaurar parte</button>
                      <button disabled={selection.locked} onClick={addAnimationKeyframe} type="button"><Film size={16} /> Guardar keyframe</button>
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
            {environmentBackground === "sky-ruined-gothic-church" && <div className="three-church-lighting-controls">
              <div className="three-sublegend">Iluminacion tetrica</div>
              <label className="three-check"><input checked={churchLightingSettings.enabled} onChange={(event) => {
                pushHistory();
                if (event.target.checked && activeLightingRig) clearLightingRig({ recordHistory: false });
                updateSceneEffect("churchLighting", "enabled", event.target.checked);
                setStatus(event.target.checked ? "Iluminacion tetrica activada" : "Iluminacion tetrica apagada");
              }} type="checkbox" /><Lightbulb size={16} /> Activar luces tetricas</label>
              {[
                ["intensity", "Intensidad", 2], ["moon", "Luz lunar", 2], ["fill", "Relleno", 1.5],
                ["candles", "Velas", 3], ["beams", "Haces", 1], ["flicker", "Oscilacion", 1], ["speed", "Velocidad", 2]
              ].map(([key, label, max]) => <label key={key}><span>{label} ({churchLightingSettings[key].toFixed(2)})</span>
                <input aria-label={`Iluminacion tetrica: ${label}`} disabled={!churchLightingSettings.enabled} max={max} min="0"
                  onChange={(event) => updateSceneEffect("churchLighting", key, Number(event.target.value))} onPointerDown={pushHistory}
                  step="0.05" type="range" value={churchLightingSettings[key]} />
              </label>)}
            </div>}
            {environmentBackground === "sky-cemetery" && <div className="three-church-lighting-controls">
              <div className="three-sublegend">Luz del cementerio</div>
              <label className="three-check"><input checked={cemeteryLightingSettings.enabled} onChange={(event) => {
                pushHistory();
                updateSceneEffect("cemeteryLighting", "enabled", event.target.checked);
                setStatus(event.target.checked ? "Luz tetrica del cementerio activada" : "Luz tetrica del cementerio apagada");
              }} type="checkbox" /><Lightbulb size={16} /> Luz tetrica</label>
              {[
                ["darkness", "Oscuridad", 1], ["moon", "Luz lunar", 2], ["rim", "Contraluz", 2]
              ].map(([key, label, max]) => <label key={key}><span>{label} ({cemeteryLightingSettings[key].toFixed(2)})</span>
                <input aria-label={`Cementerio: ${label}`} disabled={!cemeteryLightingSettings.enabled} max={max} min="0"
                  onChange={(event) => updateSceneEffect("cemeteryLighting", key, Number(event.target.value))} onPointerDown={pushHistory}
                  step="0.05" type="range" value={cemeteryLightingSettings[key]} />
              </label>)}
              <label className="three-color-field"><span>Color lunar</span><input aria-label="Cementerio: Color lunar" disabled={!cemeteryLightingSettings.enabled}
                onChange={(event) => updateSceneEffect("cemeteryLighting", "color", event.target.value)} onPointerDown={pushHistory}
                type="color" value={cemeteryLightingSettings.color} /></label>
            </div>}
            {environmentBackground === "sky-castle-interior" && <div className="three-church-lighting-controls">
              <div className="three-sublegend">Iluminacion del castillo</div>
              <label className="three-check"><input checked={castleLightingSettings.enabled} onChange={(event) => {
                pushHistory();
                if (event.target.checked && activeLightingRig) clearLightingRig({ recordHistory: false });
                updateSceneEffect("castleLighting", "enabled", event.target.checked);
                setStatus(event.target.checked ? "Luces del castillo activadas" : "Luces del castillo apagadas");
              }} type="checkbox" /><Flame size={16} /> Luces del castillo</label>
              {[
                ["fire", "Braseros", 2], ["moon", "Luz de ventana", 2],
                ["flicker", "Titileo", 1], ["dust", "Polvo en el aire", 1]
              ].map(([key, label, max]) => <label key={key}><span>{label} ({castleLightingSettings[key].toFixed(2)})</span>
                <input aria-label={`Castillo: ${label}`} disabled={!castleLightingSettings.enabled} max={max} min="0"
                  onChange={(event) => updateSceneEffect("castleLighting", key, Number(event.target.value))} onPointerDown={pushHistory}
                  step="0.05" type="range" value={castleLightingSettings[key]} />
              </label>)}
            </div>}
            {environmentBackground === "sky-gothic-church" && <div className="three-church-lighting-controls">
              <div className="three-sublegend">Luz de iglesia gotica</div>
              <label className="three-check"><input checked={gothicLightingSettings.enabled} onChange={(event) => {
                pushHistory();
                if (event.target.checked && activeLightingRig) clearLightingRig({ recordHistory: false });
                updateSceneEffect("gothicLighting", "enabled", event.target.checked);
                setStatus(event.target.checked ? "Luz de iglesia gotica activada" : "Luz de iglesia gotica apagada");
              }} type="checkbox" /><Lightbulb size={16} /> Luz de vitrales y velas</label>
              {[
                ["candles", "Velas", 2], ["glass", "Vitrales", 2],
                ["flicker", "Titileo", 1], ["dust", "Polvo en el aire", 1]
              ].map(([key, label, max]) => <label key={key}><span>{label} ({gothicLightingSettings[key].toFixed(2)})</span>
                <input aria-label={`Iglesia gotica: ${label}`} disabled={!gothicLightingSettings.enabled} max={max} min="0"
                  onChange={(event) => updateSceneEffect("gothicLighting", key, Number(event.target.value))} onPointerDown={pushHistory}
                  step="0.05" type="range" value={gothicLightingSettings[key]} />
              </label>)}
            </div>}
            {environmentBackground === "sky-space" && <div className="three-church-lighting-controls three-space-controls">
              <div className="three-sublegend">Espacio profundo</div>
              <label className="three-check"><input checked={spaceSettings.starsEnabled} onChange={(event) => { pushHistory(); updateSceneEffect("space", "starsEnabled", event.target.checked); }} type="checkbox" /><Sparkles size={16} /> Estrellas titilantes</label>
              <label><span>Intensidad ({spaceSettings.starIntensity.toFixed(2)})</span><input aria-label="Espacio: Intensidad del titilo" disabled={!spaceSettings.starsEnabled} max="2" min="0" onChange={(event) => updateSceneEffect("space", "starIntensity", Number(event.target.value))} onPointerDown={pushHistory} step="0.05" type="range" value={spaceSettings.starIntensity} /></label>
              <label><span>Duracion del titilo ({spaceSettings.twinkleDuration.toFixed(1)} s)</span><input aria-label="Espacio: Duracion del titilo" disabled={!spaceSettings.starsEnabled} max="12" min="0.5" onChange={(event) => updateSceneEffect("space", "twinkleDuration", Number(event.target.value))} onPointerDown={pushHistory} step="0.5" type="range" value={spaceSettings.twinkleDuration} /></label>
              <label><span>Gas nebuloso ({spaceSettings.nebulaIntensity.toFixed(2)})</span><input aria-label="Espacio: Intensidad de nebulosa" max="1.5" min="0" onChange={(event) => updateSceneEffect("space", "nebulaIntensity", Number(event.target.value))} onPointerDown={pushHistory} step="0.05" type="range" value={spaceSettings.nebulaIntensity} /></label>
              <label className="three-check"><input checked={spaceSettings.coreEnabled} onChange={(event) => { pushHistory(); updateSceneEffect("space", "coreEnabled", event.target.checked); }} type="checkbox" /><Sun size={16} /> Estrella 3D</label>
              <label><span>Giro ({spaceSettings.rotationSpeed.toFixed(2)})</span><input aria-label="Espacio: Velocidad de giro" disabled={!spaceSettings.coreEnabled} max="1.5" min="0" onChange={(event) => updateSceneEffect("space", "rotationSpeed", Number(event.target.value))} onPointerDown={pushHistory} step="0.05" type="range" value={spaceSettings.rotationSpeed} /></label>
              <label><span>Brillo estrella ({spaceSettings.glowIntensity.toFixed(2)})</span><input aria-label="Espacio: Brillo de estrella" disabled={!spaceSettings.coreEnabled} max="2" min="0" onChange={(event) => updateSceneEffect("space", "glowIntensity", Number(event.target.value))} onPointerDown={pushHistory} step="0.05" type="range" value={spaceSettings.glowIntensity} /></label>
              <label className="three-check"><input checked={spaceSettings.lightingEnabled} onChange={(event) => { pushHistory(); updateSceneEffect("space", "lightingEnabled", event.target.checked); }} type="checkbox" /><Lightbulb size={16} /> Luz astral</label>
              <label><span>Fuerza de luz ({spaceSettings.lightIntensity.toFixed(2)})</span><input aria-label="Espacio: Fuerza de luz" disabled={!spaceSettings.lightingEnabled} max="2" min="0" onChange={(event) => updateSceneEffect("space", "lightIntensity", Number(event.target.value))} onPointerDown={pushHistory} step="0.05" type="range" value={spaceSettings.lightIntensity} /></label>
            </div>}
            <div className="three-background-presets">
              {ENVIRONMENT_BACKGROUNDS.map((preset) => <button className={environmentBackground === preset.id ? "active" : ""} key={preset.id} onClick={() => applyEnvironmentPreset(preset)} style={preset.image ? { backgroundImage: `url(${environmentThumbnail(preset)})` } : { background: background }} type="button"><span>{preset.name}</span></button>)}
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
            <div className="three-sky-realism">
              <div className="three-sublegend">Atmosfera realista</div>
              <label className="three-check"><input checked={realisticSky.enabled} disabled={!REALISTIC_SKY_BACKGROUNDS.has(environmentBackground)} onChange={(event) => { pushHistory(); setRealisticSky((current) => ({ ...current, enabled: event.target.checked })); }} type="checkbox" /><Sun size={16} /> Sol y nubes fisicas</label>
              <label><span>Cobertura</span><input disabled={!realisticSky.enabled || !REALISTIC_SKY_BACKGROUNDS.has(environmentBackground)} max="0.75" min="0.2" onChange={(event) => setRealisticSky((current) => ({ ...current, cloudCover: 1 - Number(event.target.value) }))} onPointerDown={pushHistory} step="0.01" type="range" value={1 - realisticSky.cloudCover} /></label>
              <label><span>Volumen nubes</span><input disabled={!realisticSky.enabled || !REALISTIC_SKY_BACKGROUNDS.has(environmentBackground)} max="1" min="0" onChange={(event) => setRealisticSky((current) => ({ ...current, cloudAmount: Number(event.target.value) }))} onPointerDown={pushHistory} step="0.05" type="range" value={realisticSky.cloudAmount} /></label>
              <label><span>Movimiento</span><input disabled={!realisticSky.enabled || !REALISTIC_SKY_BACKGROUNDS.has(environmentBackground)} max="1" min="0" onChange={(event) => setRealisticSky((current) => ({ ...current, cloudSpeed: Number(event.target.value) }))} onPointerDown={pushHistory} step="0.02" type="range" value={realisticSky.cloudSpeed} /></label>
              <label><span>Altura solar</span><input disabled={!realisticSky.enabled || !REALISTIC_SKY_BACKGROUNDS.has(environmentBackground)} max="80" min="5" onChange={(event) => setRealisticSky((current) => ({ ...current, sunElevation: Number(event.target.value) }))} onPointerDown={pushHistory} step="1" type="range" value={realisticSky.sunElevation} /></label>
              <label><span>Direccion sol</span><input disabled={!realisticSky.enabled || !REALISTIC_SKY_BACKGROUNDS.has(environmentBackground)} max="180" min="-180" onChange={(event) => setRealisticSky((current) => ({ ...current, sunAzimuth: Number(event.target.value) }))} onPointerDown={pushHistory} step="1" type="range" value={realisticSky.sunAzimuth} /></label>
              <label><span>Brillo solar</span><input disabled={!realisticSky.enabled || !REALISTIC_SKY_BACKGROUNDS.has(environmentBackground)} max="6" min="0.5" onChange={(event) => setRealisticSky((current) => ({ ...current, sunIntensity: Number(event.target.value) }))} onPointerDown={pushHistory} step="0.1" type="range" value={realisticSky.sunIntensity} /></label>
            </div>
            <div className="three-environment-presets">
              <button className={activeLightingRig === "preset:studio" ? "active" : ""} onClick={() => applyScenePreset("studio")} type="button">Estudio</button>
              <button className={activeLightingRig === "preset:product" ? "active" : ""} onClick={() => applyScenePreset("product")} type="button">Producto</button>
              <button className={activeLightingRig === "preset:night" ? "active" : ""} onClick={() => applyScenePreset("night")} type="button">Nocturno</button>
            </div>
            <div className="three-sublegend">Rigs de iluminacion</div>
            <div className="three-effects-presets">
              <button className={activeLightingRig === "recital" ? "active" : ""} onClick={() => applyLightingRig("recital")} type="button"><Lightbulb size={15} /> Recital</button>
              <button className={activeLightingRig === "metal" ? "active" : ""} onClick={() => applyLightingRig("metal")} type="button"><Flame size={15} /> Metal</button>
              <button className={activeLightingRig === "terror" ? "active" : ""} onClick={() => applyLightingRig("terror")} type="button"><Flashlight size={15} /> Terror</button>
              <button className={activeLightingRig === "moon" ? "active" : ""} onClick={() => applyLightingRig("moon")} type="button"><Sparkles size={15} /> Luna</button>
              <button className={activeLightingRig === "fire" ? "active" : ""} onClick={() => applyLightingRig("fire")} type="button"><Flame size={15} /> Fuego</button>
              <button disabled={!activeLightingRig && !(environmentBackground === "sky-ruined-gothic-church" && churchLightingSettings.enabled)} onClick={() => clearLightingRig()} type="button"><Trash2 size={15} /> Quitar luces</button>
            </div>
            <label className="three-color-field"><span>Fondo</span><input disabled={environmentBackground !== "solid"} onChange={(event) => setBackground(event.target.value)} type="color" value={background} /></label>
            <label><span>Exposicion</span><input max="2.5" min="0.25" onChange={(event) => setExposure(Number(event.target.value))} step="0.05" type="range" value={exposure} /></label>
            <label><span>Luz ambiente</span><input max="3" min="0" onChange={(event) => setAmbientIntensity(Number(event.target.value))} step="0.1" type="range" value={ambientIntensity} /></label>
            <div className="three-floor-surfaces">
              {FLOOR_SURFACES.map((surface) => <button className={floorSurface === surface.id ? "active" : ""} key={surface.id} onClick={() => { pushHistory(); setFloorSurface(surface.id); setFloorColor(surface.color); setFloorVisible(true); }} style={{ "--floor-swatch": surface.color }} type="button"><span />{surface.name}</button>)}
            </div>
            {floorSurface === "grass" && <div className="three-grass-controls">
              <div className="three-sublegend">Pasto 3D</div>
              <label className="three-check"><input checked={grassSettings.enabled} onChange={(event) => { pushHistory(); setGrassSettings((current) => ({ ...current, enabled: event.target.checked })); }} type="checkbox" /><Wind size={16} /> Briznas con viento</label>
              <label><span>Densidad</span><input disabled={!grassSettings.enabled} max="1" min="0.2" onChange={(event) => setGrassSettings((current) => ({ ...current, density: Number(event.target.value) }))} onPointerDown={pushHistory} step="0.05" type="range" value={grassSettings.density} /></label>
              <label><span>Altura</span><input disabled={!grassSettings.enabled} max="1.2" min="0.2" onChange={(event) => setGrassSettings((current) => ({ ...current, height: Number(event.target.value) }))} onPointerDown={pushHistory} step="0.05" type="range" value={grassSettings.height} /></label>
              <label><span>Fuerza del viento</span><input disabled={!grassSettings.enabled} max="1.5" min="0" onChange={(event) => setGrassSettings((current) => ({ ...current, windStrength: Number(event.target.value) }))} onPointerDown={pushHistory} step="0.05" type="range" value={grassSettings.windStrength} /></label>
              <label><span>Velocidad del viento</span><input disabled={!grassSettings.enabled || grassSettings.windStrength === 0} max="3" min="0.1" onChange={(event) => setGrassSettings((current) => ({ ...current, windSpeed: Number(event.target.value) }))} onPointerDown={pushHistory} step="0.1" type="range" value={grassSettings.windSpeed} /></label>
            </div>}
            {floorSurface === "infernal" && <div className="three-lava-controls">
              <div className="three-sublegend">Lava activa</div>
              <label className="three-check"><input checked={lavaSettings.enabled} onChange={(event) => { pushHistory(); setLavaSettings((current) => ({ ...current, enabled: event.target.checked })); }} type="checkbox" /><Flame size={16} /> Chorros y salpicaduras</label>
              <label><span>Cantidad ({lavaSettings.jetCount})</span><input disabled={!lavaSettings.enabled} max="24" min="0" onChange={(event) => setLavaSettings((current) => ({ ...current, jetCount: Number(event.target.value) }))} onPointerDown={pushHistory} step="1" type="range" value={lavaSettings.jetCount} /></label>
              <label><span>Intervalo ({lavaSettings.interval}s)</span><input disabled={!lavaSettings.enabled} max="14" min="2" onChange={(event) => setLavaSettings((current) => ({ ...current, interval: Number(event.target.value) }))} onPointerDown={pushHistory} step="0.5" type="range" value={lavaSettings.interval} /></label>
              <label><span>Altura ({lavaSettings.height.toFixed(1)}x)</span><input disabled={!lavaSettings.enabled} max="1.8" min="0.4" onChange={(event) => setLavaSettings((current) => ({ ...current, height: Number(event.target.value) }))} onPointerDown={pushHistory} step="0.1" type="range" value={lavaSettings.height} /></label>
              <div className="three-sublegend">Gas volcanico</div>
              <label className="three-check"><input checked={lavaSettings.gasEnabled} onChange={(event) => { pushHistory(); setLavaSettings((current) => ({ ...current, gasEnabled: event.target.checked })); }} type="checkbox" /><CloudFog size={16} /> Chorros de gas</label>
              <label><span>Cantidad ({lavaSettings.gasCount})</span><input disabled={!lavaSettings.gasEnabled} max="24" min="0" onChange={(event) => setLavaSettings((current) => ({ ...current, gasCount: Number(event.target.value) }))} onPointerDown={pushHistory} step="1" type="range" value={lavaSettings.gasCount} /></label>
              <label><span>Velocidad ({lavaSettings.gasSpeed.toFixed(1)}x)</span><input disabled={!lavaSettings.gasEnabled} max="3" min="0.2" onChange={(event) => setLavaSettings((current) => ({ ...current, gasSpeed: Number(event.target.value) }))} onPointerDown={pushHistory} step="0.1" type="range" value={lavaSettings.gasSpeed} /></label>
              <label><span>Altura gas ({lavaSettings.gasHeight.toFixed(1)}x)</span><input disabled={!lavaSettings.gasEnabled} max="2" min="0.5" onChange={(event) => setLavaSettings((current) => ({ ...current, gasHeight: Number(event.target.value) }))} onPointerDown={pushHistory} step="0.1" type="range" value={lavaSettings.gasHeight} /></label>
              <label><span>Densidad ({lavaSettings.gasDensity.toFixed(1)}x)</span><input disabled={!lavaSettings.gasEnabled} max="1.5" min="0.2" onChange={(event) => setLavaSettings((current) => ({ ...current, gasDensity: Number(event.target.value) }))} onPointerDown={pushHistory} step="0.1" type="range" value={lavaSettings.gasDensity} /></label>
            </div>}
            <label className="three-color-field"><span>Color piso</span><input disabled={!floorVisible || floorSurface === "shadow"} onChange={(event) => setFloorColor(event.target.value)} onPointerDown={pushHistory} type="color" value={floorColor} /></label>
            <label className="three-check"><input checked={floorVisible} onChange={(event) => setFloorVisible(event.target.checked)} type="checkbox" /><Square size={16} /> Mostrar piso</label>
            <label className="three-check"><input checked={gridVisible} onChange={(event) => setGridVisible(event.target.checked)} type="checkbox" /><Grid3X3 size={16} /> Mostrar grilla</label>
          </fieldset>
          <fieldset className="three-tab-effects three-magic-controls">
            <legend>Magia arcana</legend>
            <label className="three-check"><input checked={sceneEffects.magic.enabled} onChange={(event) => { pushHistory(); updateSceneEffect("magic", "enabled", event.target.checked); }} type="checkbox" /><Sparkles size={16} /> Activar magia</label>
            <label className="three-check"><input checked={sceneEffects.magic.runes} disabled={!sceneEffects.magic.enabled} onChange={(event) => { pushHistory(); updateSceneEffect("magic", "runes", event.target.checked); }} type="checkbox" /> Runas y sello</label>
            <label className="three-check"><input checked={sceneEffects.magic.particles} disabled={!sceneEffects.magic.enabled} onChange={(event) => { pushHistory(); updateSceneEffect("magic", "particles", event.target.checked); }} type="checkbox" /> Polvo luminoso</label>
            <label className="three-color-field"><span>Color magico</span><input disabled={!sceneEffects.magic.enabled} onPointerDown={pushHistory} onChange={(event) => updateSceneEffect("magic", "color", event.target.value)} type="color" value={sceneEffects.magic.color} /></label>
            {[
              ["intensity", "Brillo", 0, 2, 0.05], ["count", "Cantidad", 0, 160, 1],
              ["speed", "Velocidad", 0, 3, 0.05], ["radius", "Radio", 1, 12, 0.25],
              ["height", "Altura", 0.3, 8, 0.1]
            ].map(([key, label, min, max, step]) => <label key={key}><span>{label} ({sceneEffects.magic[key]})</span><input aria-label={`Magia: ${label}`} disabled={!sceneEffects.magic.enabled} max={max} min={min} onChange={(event) => updateSceneEffect("magic", key, Number(event.target.value))} onPointerDown={pushHistory} step={step} type="range" value={sceneEffects.magic[key]} /></label>)}
            <label><span>Posicion X</span><input disabled={!sceneEffects.magic.enabled} max="30" min="-30" onFocus={pushHistory} onChange={(event) => updateSceneEffect("magic", "x", Number(event.target.value))} step="0.5" type="number" value={sceneEffects.magic.x} /></label>
            <label><span>Posicion Z</span><input disabled={!sceneEffects.magic.enabled} max="30" min="-30" onFocus={pushHistory} onChange={(event) => updateSceneEffect("magic", "z", Number(event.target.value))} step="0.5" type="number" value={sceneEffects.magic.z} /></label>
          </fieldset>
          {floorSurface === "apocalypse" && <fieldset className="three-tab-effects three-apocalypse-lighting-controls">
            <legend>Luz de incendios</legend>
            <label className="three-check"><input checked={apocalypseLightingSettings.enabled} onChange={(event) => { pushHistory(); updateSceneEffect("apocalypseLighting", "enabled", event.target.checked); }} type="checkbox" /><Flame size={16} /> Activar resplandor</label>
            <label><span>Intensidad ({apocalypseLightingSettings.intensity})</span><input aria-label="Luz de incendios: Intensidad" disabled={!apocalypseLightingSettings.enabled} max="1.5" min="0" onChange={(event) => updateSceneEffect("apocalypseLighting", "intensity", Number(event.target.value))} onPointerDown={pushHistory} step="0.05" type="range" value={apocalypseLightingSettings.intensity} /></label>
          </fieldset>}
          {floorSurface === "apocalypse" && <fieldset className="three-tab-effects three-apocalypse-fires-controls">
            <legend>Incendios y humo</legend>
            <label className="three-check"><input checked={apocalypseFireSettings.enabled} onChange={(event) => { pushHistory(); updateSceneEffect("apocalypseFires", "enabled", event.target.checked); }} type="checkbox" /><Flame size={16} /> Activar incendios</label>
            {[
              ["count", "Focos", 0, MAX_APOCALYPSE_FIRES, 1],
              ["flameSize", "Tamano del fuego", 0.4, 2, 0.05],
              ["smokeDensity", "Densidad del humo", 0, 1.5, 0.05],
              ["smokeHeight", "Altura del humo", 2, 14, 0.5],
              ["smokeSpeed", "Velocidad del humo", 0, 2.5, 0.05],
              ["wind", "Viento X", -1.5, 1.5, 0.05]
            ].map(([key, label, min, max, step]) => <label key={key}><span>{label} ({apocalypseFireSettings[key]})</span><input aria-label={`Incendios: ${label}`} disabled={!apocalypseFireSettings.enabled} max={max} min={min} onChange={(event) => updateSceneEffect("apocalypseFires", key, Number(event.target.value))} onPointerDown={pushHistory} step={step} type="range" value={apocalypseFireSettings[key]} /></label>)}
            <label className="three-color-field"><span>Color del humo</span><input aria-label="Color del humo" disabled={!apocalypseFireSettings.enabled} onChange={(event) => updateSceneEffect("apocalypseFires", "smokeColor", event.target.value)} onPointerDown={pushHistory} type="color" value={apocalypseFireSettings.smokeColor} /></label>
            {apocalypseFireSettings.count > 0 && <>
              <label><span>Foco</span><select aria-label="Foco de incendio" disabled={!apocalypseFireSettings.enabled} onChange={(event) => setSelectedApocalypseFire(Number(event.target.value))} value={selectedApocalypseFireIndex}>
                {Array.from({ length: apocalypseFireSettings.count }, (_, index) => <option key={index} value={index}>Foco {index + 1}</option>)}
              </select></label>
              {["x", "z"].map((axis) => <label key={axis}><span>Posicion {axis.toUpperCase()}</span><input aria-label={`Incendio: Posicion ${axis.toUpperCase()}`} disabled={!apocalypseFireSettings.enabled} max="60" min="-60" onChange={(event) => updateApocalypseFirePosition(selectedApocalypseFireIndex, axis, Number(event.target.value))} onFocus={pushHistory} step="0.5" type="number" value={apocalypseFireSettings.positions[selectedApocalypseFireIndex]?.[axis] ?? 0} /></label>)}
            </>}
          </fieldset>}
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
              <button onClick={() => applyEffectsPreset("spaceShip")} type="button"><Sparkles size={15} /> Space Ship</button>
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
            <fieldset className={`three-tab-effects${id === "fog" ? " three-fog-controls" : id === "rain" ? " three-rain-controls" : id === "storm" ? " three-storm-controls" : ""}`} key={id}>
              <legend>{label}</legend>
              <label className="three-check"><input checked={sceneEffects[id].enabled} onChange={(event) => { pushHistory(); updateSceneEffect(id, "enabled", event.target.checked); }} type="checkbox" /><EffectIcon size={16} /> Activar</label>
              <label><span>{id === "fog" ? "Densidad" : "Intensidad"}</span><input disabled={!sceneEffects[id].enabled} max={id === "rain" ? 1.8 : 1} min={id === "rain" || (id === "fog" && CHURCH_FOG_BACKGROUNDS.has(environmentBackground)) ? 0 : 0.05} onChange={(event) => updateSceneEffect(id, "intensity", Number(event.target.value))} onPointerDown={pushHistory} step="0.05" type="range" value={sceneEffects[id].intensity} /></label>
              {id === "fog" && <>
                <label className="three-color-field"><span>Color</span><input aria-label="Color de niebla" disabled={!fogSettings.enabled} onPointerDown={pushHistory} onChange={(event) => updateSceneEffect("fog", "color", event.target.value)} type="color" value={fogSettings.color} /></label>
                {CHURCH_FOG_BACKGROUNDS.has(environmentBackground) && <>
                  {[["height", "Altura", 0.3, 10, 0.1], ["coverage", "Cobertura", 8, 70, 1]].map(([key, label, min, max, step]) => <label key={key}>
                    <span>{label} ({fogSettings[key]})</span><input aria-label={`Niebla: ${label}`} disabled={!fogSettings.enabled} min={min} max={max} step={step} type="range" value={fogSettings[key]} onPointerDown={pushHistory} onChange={(event) => updateSceneEffect("fog", key, Number(event.target.value))} />
                  </label>)}
                  <label className="three-check"><input checked={fogSettings.windEnabled} disabled={!fogSettings.enabled} type="checkbox" onChange={(event) => { pushHistory(); updateSceneEffect("fog", "windEnabled", event.target.checked); }} /><Wind size={16} /> Viento en la niebla</label>
                  {[["windSpeed", "Velocidad del viento", 3, 0.05], ["windDirection", "Direccion del viento", 360, 5], ["turbulence", "Turbulencia", 1, 0.05]].map(([key, label, max, step]) => <label key={key}>
                    <span>{label} ({fogSettings[key]})</span><input aria-label={`Niebla: ${label}`} disabled={!fogSettings.enabled || !fogSettings.windEnabled} min="0" max={max} step={step} type="range" value={fogSettings[key]} onPointerDown={pushHistory} onChange={(event) => updateSceneEffect("fog", key, Number(event.target.value))} />
                  </label>)}
                </>}
              </>}
              {id === "rain" && <>
                <label className="three-color-field"><span>Color</span><input aria-label="Color de lluvia" disabled={!rainSettings.enabled} onPointerDown={pushHistory} onChange={(event) => updateSceneEffect("rain", "color", event.target.value)} type="color" value={rainSettings.color} /></label>
                {[["speed", "Velocidad", 0, 2.5], ["dropSize", "Tamano de gota", 0.5, 2], ["directionX", "Viento X", -1, 1],
                  ["directionZ", "Viento Z", -1, 1], ["gusts", "Rafagas", 0, 1]].map(([key, label, min, max]) => <label key={key}>
                  <span>{label} ({rainSettings[key]})</span><input aria-label={`Lluvia: ${label}`} disabled={!rainSettings.enabled} min={min} max={max} step="0.05" type="range" value={rainSettings[key]} onPointerDown={pushHistory} onChange={(event) => updateSceneEffect("rain", key, Number(event.target.value))} />
                </label>)}
                <label className="three-check"><input checked={rainSettings.splashes} disabled={!rainSettings.enabled} type="checkbox" onChange={(event) => { pushHistory(); updateSceneEffect("rain", "splashes", event.target.checked); }} /> Salpicaduras</label>
                <label><span>Impacto ({rainSettings.splashIntensity})</span><input aria-label="Lluvia: Impacto" disabled={!rainSettings.enabled || !rainSettings.splashes} min="0" max="1" step="0.05" type="range" value={rainSettings.splashIntensity} onPointerDown={pushHistory} onChange={(event) => updateSceneEffect("rain", "splashIntensity", Number(event.target.value))} /></label>
              </>}
              {id === "storm" && <>
                <label className="three-color-field"><span>Color rayo</span><input aria-label="Color de rayos" disabled={!stormSettings.enabled} onPointerDown={pushHistory} onChange={(event) => updateSceneEffect("storm", "lightningColor", event.target.value)} type="color" value={stormSettings.lightningColor} /></label>
                {[["cloudDensity", "Densidad de nubes", 0, 1, 0.05], ["cloudSpeed", "Velocidad de nubes", 0, 2, 0.05],
                  ["windDirection", "Direccion del viento", 0, 360, 5], ["lightningFrequency", "Frecuencia de rayos", 0, 1, 0.05],
                  ["branching", "Ramificaciones", 0, 1, 0.05], ["flash", "Destello", 0, 1, 0.05]].map(([key, label, min, max, step]) => <label key={key}>
                  <span>{label} ({stormSettings[key]})</span><input aria-label={`Tormenta: ${label}`} disabled={!stormSettings.enabled} min={min} max={max} step={step} type="range" value={stormSettings[key]} onPointerDown={pushHistory} onChange={(event) => updateSceneEffect("storm", key, Number(event.target.value))} />
                </label>)}
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
        cinematicSelectionName={CINEMATIC_PRESETS.find((item) => item.id === cinematicCamera.preset)?.name || CINEMATIC_SHOTS.find((item) => item.id === cinematicCamera.shot)?.name || "Plano actual"}
        directorPreset={directorPreset}
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
          const nextDuration = Math.max(1, Math.min(300, value));
          animationDurationRef.current = nextDuration;
          setAnimationDuration(nextDuration);
          seekAnimation(Math.min(animationTime, nextDuration));
        }}
        onDirectorPresetChange={setDirectorPreset}
        onDeleteMarker={deleteAnimationMarker}
        onDuplicateMarker={duplicateAnimationMarker}
        onUpdateMarker={updateAnimationMarker}
        onPlayingChange={(playing) => {
          setGlobalPlayback(playing);
        }}
        onStop={stopGlobalPlayback}
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
        freezeMotion={freezeMotion}
        onFreezeMotionChange={(id, patch) => {
          const next = freezeMotionRef.current.map((segment) => {
            if (segment.id !== id) return segment;
            const updated = { ...segment, ...patch };
            updated.start = THREE.MathUtils.clamp(Number(updated.start), 0, animationDuration);
            updated.end = THREE.MathUtils.clamp(Number(updated.end), updated.start, animationDuration);
            updated.resumeDuration = THREE.MathUtils.clamp(Number(updated.resumeDuration), 0.1, 5);
            return updated;
          });
          freezeMotionRef.current = next;
          setFreezeMotion(next);
        }}
        onFreezeMotionAdd={() => {
          const start = THREE.MathUtils.clamp(animationTimeRef.current, 0, Math.max(0, animationDuration - 0.1));
          const next = [...freezeMotionRef.current, { id: crypto.randomUUID(), start, end: Math.min(animationDuration, start + 1), resume: "smooth", resumeDuration: 1.5 }];
          freezeMotionRef.current = next;
          setFreezeMotion(next);
          return next.at(-1).id;
        }}
        onFreezeMotionDelete={(id) => {
          const next = freezeMotionRef.current.filter((segment) => segment.id !== id);
          freezeMotionRef.current = next;
          setFreezeMotion(next);
        }}
        selectedName={selection?.name || ""}
      />
      {soundtrack && <audio loop={animationLoop} ref={soundtrackAudioRef} src={soundtrack.url} />}
    </section>
  );
}
