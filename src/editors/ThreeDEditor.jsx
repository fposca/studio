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
import helvetikerFont from "../assets/fonts/helvetiker_regular.typeface.json";
import {
  ArrowDownToLine, Box, Camera, Circle, Cone, Copy, Cylinder, Download, Eye,
  EyeOff, Flashlight, Focus, Grid3X3, ImageDown, Lightbulb, LocateFixed,
  MousePointer2, Move3D, Palette, Redo2, Rotate3D, Scale3D, Sparkles, Square,
  Sun, Trash2, Type, Undo2, Upload
} from "lucide-react";
import { getProject, putProject } from "../storage/projectDb.js";
import ThreeAnimationPanel from "./ThreeAnimationPanel.jsx";

const THREE_PROJECT_ID = "three";
const CAMERA_TRACK_ID = "__camera__";
const DEFAULT_BACKGROUND = "#17191d";
const THREE_FONT = new FontLoader().parse(helvetikerFont);
const MATERIAL_PRESETS = [
  { id: "plastic", name: "Plastico", color: "#8b5cf6", metalness: 0.05, roughness: 0.34 },
  { id: "chrome", name: "Cromo", color: "#eef4f7", metalness: 0.92, roughness: 0.2 },
  { id: "gold", name: "Oro", color: "#d9a441", metalness: 0.92, roughness: 0.2 },
  { id: "glass", name: "Vidrio", color: "#bdefff", metalness: 0, roughness: 0.08, transmission: 0.88, opacity: 0.72 },
  { id: "neon", name: "Neon", color: "#063d32", metalness: 0, roughness: 0.32, emissive: "#00f5ad", emissiveIntensity: 1.05, toneMapped: false },
  { id: "matte", name: "Mate", color: "#ef476f", metalness: 0, roughness: 0.92 }
];
const makeId = () => crypto.randomUUID?.() || `object-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const round = (value) => Math.round(value * 100) / 100;

function createTextGeometry(value, depth) {
  const geometry = new TextGeometry(value, {
    font: THREE_FONT,
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
  const historyRef = useRef({ undo: [], redo: [], restoring: false });
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState("translate");
  const [background, setBackground] = useState(DEFAULT_BACKGROUND);
  const [gridVisible, setGridVisible] = useState(true);
  const [ambientIntensity, setAmbientIntensity] = useState(0.7);
  const [exposure, setExposure] = useState(1.15);
  const [floorVisible, setFloorVisible] = useState(true);
  const [floorColor, setFloorColor] = useState("#24272d");
  const [renderResolution, setRenderResolution] = useState("1920x1080");
  const [transparentPng, setTransparentPng] = useState(false);
  const [selection, setSelection] = useState(null);
  const [status, setStatus] = useState("");
  const [textDraft, setTextDraft] = useState("Studio");
  const [extrudeDepth, setExtrudeDepth] = useState(0.35);
  const [animationDuration, setAnimationDuration] = useState(5);
  const [animationTime, setAnimationTime] = useState(0);
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [animationTracks, setAnimationTracks] = useState({});
  const [animationFps, setAnimationFps] = useState(30);
  const [animationExporting, setAnimationExporting] = useState(false);

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
    setObjects(runtime.content.children.map(objectSummary));
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
      rotation: object.rotation.toArray().slice(0, 3).map((value) => round(THREE.MathUtils.radToDeg(value))),
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
      textureRepeat: material?.map ? [round(material.map.repeat.x), round(material.map.repeat.y)] : [1, 1]
    });
  }

  function selectObject(object) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    if (runtime.lightHelper) {
      runtime.scene.remove(runtime.lightHelper);
      runtime.lightHelper.dispose?.();
      runtime.lightHelper = null;
    }
    selectedRef.current = object || null;
    setSelectedId(object?.userData.editorId || "");
    if (object) runtime.transform.attach(object);
    else runtime.transform.detach();
    if (object?.isPointLight) runtime.lightHelper = new THREE.PointLightHelper(object, 0.35, object.color);
    if (object?.isDirectionalLight) runtime.lightHelper = new THREE.DirectionalLightHelper(object, 0.7, object.color);
    if (object?.isSpotLight) runtime.lightHelper = new THREE.SpotLightHelper(object, object.color);
    if (runtime.lightHelper) runtime.scene.add(runtime.lightHelper);
    if (object?.userData.editorType === "text") {
      setTextDraft(object.userData.text || object.name || "");
      setExtrudeDepth(object.userData.depth ?? 0.35);
    }
    syncSelection(object);
  }

  function serializeScene() {
    const runtime = runtimeRef.current;
    if (!runtime) return null;
    return {
      background,
      gridVisible,
      ambientIntensity,
      exposure,
      floorVisible,
      floorColor,
      renderResolution,
      transparentPng,
      keyLightIntensity: runtime.keyLight?.intensity ?? 1.8,
      content: runtime.content.toJSON(),
      camera: {
        position: runtime.camera.position.toArray(),
        target: runtime.orbit.target.toArray()
      },
      animationDuration,
      animationTracks
    };
  }

  function pushHistory() {
    if (historyRef.current.restoring) return;
    const snapshot = serializeScene();
    if (!snapshot) return;
    historyRef.current.undo.push(snapshot);
    if (historyRef.current.undo.length > 40) historyRef.current.undo.shift();
    historyRef.current.redo = [];
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
    loaded.children.slice().forEach((child) => runtime.content.add(child));
    runtime.camera.position.fromArray(state.camera?.position || [7, 5, 8]);
    runtime.orbit.target.fromArray(state.camera?.target || [0, 1, 0]);
    runtime.orbit.update();
    setBackground(state.background || DEFAULT_BACKGROUND);
    setGridVisible(state.gridVisible !== false);
    setAmbientIntensity(state.ambientIntensity ?? 0.7);
    setExposure(state.exposure ?? 1.15);
    setFloorVisible(state.floorVisible !== false);
    setFloorColor(state.floorColor || "#24272d");
    setRenderResolution(state.renderResolution || "1920x1080");
    setTransparentPng(Boolean(state.transparentPng));
    runtime.keyLight.intensity = state.keyLightIntensity ?? 1.8;
    setAnimationDuration(state.animationDuration || 5);
    setAnimationTracks(state.animationTracks || {});
    setAnimationTime(0);
    setAnimationPlaying(false);
    refreshObjects();
  }

  function undo() {
    const previous = historyRef.current.undo.pop();
    if (!previous) return;
    historyRef.current.redo.push(serializeScene());
    historyRef.current.restoring = true;
    loadSceneState(previous);
    historyRef.current.restoring = false;
  }

  function redo() {
    const next = historyRef.current.redo.pop();
    if (!next) return;
    historyRef.current.undo.push(serializeScene());
    historyRef.current.restoring = true;
    loadSceneState(next);
    historyRef.current.restoring = false;
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
    const transform = new TransformControls(camera, renderer.domElement);
    const transformHelper = transform.getHelper();
    scene.add(transformHelper);
    transform.addEventListener("dragging-changed", (event) => { orbit.enabled = !event.value; });
    transform.addEventListener("mouseDown", pushHistory);
    transform.addEventListener("objectChange", () => {
      updateLightDirection(selectedRef.current);
      runtimeRef.current?.lightHelper?.update?.();
      syncSelection();
    });
    transform.addEventListener("mouseUp", refreshObjects);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerDown = (event) => {
      if (transform.dragging) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(content.children, true);
      let object = hits[0]?.object || null;
      while (object?.parent && object.parent !== content) object = object.parent;
      selectObject(object?.parent === content ? object : null);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

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

    runtimeRef.current = { scene, camera, renderer, content, ambient, floor, grid, keyLight, orbit, transform, transformHelper, lightHelper: null };
    let frame = 0;
    const render = () => {
      frame = requestAnimationFrame(render);
      orbit.update();
      renderer.render(scene, camera);
    };
    render();

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
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
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      transform.dispose();
      runtimeRef.current?.lightHelper?.dispose?.();
      orbit.dispose();
      disposeObject(content);
      floor.geometry.dispose();
      floor.material.dispose();
      environmentTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (runtime) runtime.transform.setMode(mode);
  }, [mode]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (runtime) runtime.scene.background = new Color(background);
  }, [background]);

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
    if (runtimeRef.current) runtimeRef.current.floor.material.color.set(floorColor);
  }, [floorColor]);

  function applyAnimationAt(time) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    Object.entries(animationTracks).forEach(([objectId, frames]) => {
      if (!frames.length) return;
      const { before, after, alpha } = animationFramePair(frames, time);
      if (objectId === CAMERA_TRACK_ID) {
        runtime.camera.position.fromArray(before.position).lerp(new Vector3().fromArray(after.position), alpha);
        runtime.orbit.target.fromArray(before.target).lerp(new Vector3().fromArray(after.target), alpha);
        runtime.camera.lookAt(runtime.orbit.target);
        runtime.orbit.update();
        return;
      }
      const object = runtime.content.children.find((item) => item.userData.editorId === objectId);
      if (!object) return;
      object.position.fromArray(before.position).lerp(new Vector3().fromArray(after.position), alpha);
      object.quaternion.fromArray(before.quaternion).slerp(new THREE.Quaternion().fromArray(after.quaternion), alpha);
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
      if (event.key.toLowerCase() === "w") setMode("translate");
      if (event.key.toLowerCase() === "e") setMode("rotate");
      if (event.key.toLowerCase() === "r") setMode("scale");
      if (event.key === "Delete") removeSelected();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelected();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") event.shiftKey ? redo() : undo();
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
  }, [background, gridVisible, ambientIntensity, exposure, floorVisible, floorColor, renderResolution, transparentPng, animationDuration, animationTracks]);

  useEffect(() => {
    if (openProjectSignal) setStatus("Selecciona un proyecto desde Inicio");
  }, [openProjectSignal]);

  function addPrimitive(type) {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    pushHistory();
    const geometries = {
      box: () => new THREE.BoxGeometry(2, 2, 2),
      sphere: () => new THREE.SphereGeometry(1.25, 48, 32),
      cylinder: () => new THREE.CylinderGeometry(1, 1, 2.4, 48),
      cone: () => new THREE.ConeGeometry(1.2, 2.5, 48)
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
      studio: { background: "#17191d", floor: "#24272d", ambient: 0.7, exposure: 1.15, key: 1.8 },
      product: { background: "#d9dde2", floor: "#f1f3f5", ambient: 1.05, exposure: 0.95, key: 2.8 },
      night: { background: "#030609", floor: "#091016", ambient: 0.16, exposure: 1.25, key: 0.45 }
    };
    const values = presets[preset];
    setBackground(values.background);
    setFloorColor(values.floor);
    setAmbientIntensity(values.ambient);
    setExposure(values.exposure);
    setFloorVisible(true);
    runtime.keyLight.intensity = values.key;
    setStatus(`Entorno ${preset === "product" ? "Producto" : preset === "night" ? "Nocturno" : "Estudio"} aplicado`);
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
    const keyframe = {
      id: makeId(),
      time: round(animationTime),
      position: runtime.camera.position.toArray(),
      target: runtime.orbit.target.toArray()
    };
    setAnimationTracks((current) => {
      const existing = (current[CAMERA_TRACK_ID] || []).filter((frame) => Math.abs(frame.time - keyframe.time) > 0.02);
      return { ...current, [CAMERA_TRACK_ID]: [...existing, keyframe].sort((a, b) => a.time - b.time) };
    });
    setStatus(`Camara guardada en ${keyframe.time.toFixed(2)} s`);
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
    const duplicate = source.clone(true);
    duplicate.name = `${source.name} copia`;
    duplicate.userData = { ...source.userData, editorId: makeId() };
    duplicate.position.x += 1.25;
    duplicate.traverse((item) => {
      if (item.geometry) item.geometry = item.geometry.clone();
      if (Array.isArray(item.material)) item.material = item.material.map((material) => material.clone());
      else if (item.material) item.material = item.material.clone();
    });
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
    if (group === "rotation") object.rotation[axis] = THREE.MathUtils.degToRad(numeric);
    else object[group][axis] = numeric;
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

  function applyMaterialPreset(preset) {
    const object = selectedRef.current;
    if (!object) return;
    pushHistory();
    const materials = materialsForObject(object);
    materials.forEach((material) => {
      if (!(material instanceof THREE.MeshStandardMaterial) && !(material instanceof THREE.MeshPhysicalMaterial)) return;
      material.color.set(preset.color);
      material.metalness = preset.metalness;
      material.roughness = preset.roughness;
      material.transparent = Boolean(preset.transmission || preset.opacity < 1);
      material.opacity = preset.opacity ?? 1;
      if ("transmission" in material) material.transmission = preset.transmission ?? 0;
      if (material.emissive) material.emissive.set(preset.emissive || "#000000");
      material.emissiveIntensity = preset.emissiveIntensity || 0;
      material.toneMapped = preset.toneMapped !== false;
      material.needsUpdate = true;
    });
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
      createTextGeometry(value, extrudeDepth),
      new THREE.MeshPhysicalMaterial({ color: 0x8b5cf6, metalness: 0.2, roughness: 0.3 })
    );
    object.name = value;
    object.position.set(0, 0.05, 1.4);
    object.castShadow = true;
    object.receiveShadow = true;
    object.userData = { editorId: makeId(), editorType: "text", text: value, depth: extrudeDepth };
    runtime.content.add(object);
    refreshObjects();
    selectObject(object);
    focusSelected();
  }

  function updateSelectedText(value = textDraft, depth = extrudeDepth) {
    const object = selectedRef.current;
    const normalized = value.trim();
    if (object?.userData.editorType !== "text" || !normalized) return;
    const previousGeometry = object.geometry;
    object.geometry = createTextGeometry(normalized, depth);
    previousGeometry?.dispose();
    object.name = normalized;
    object.userData.text = normalized;
    object.userData.depth = depth;
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
    const restoreOutput = prepareRenderOutput({ transparent: transparentPng });
    runtime.renderer.render(runtime.scene, runtime.camera);
    runtime.renderer.domElement.toBlob((blob) => {
      if (blob) downloadBlob(blob, "studio-3d.png");
      restoreOutput();
      runtime.grid.visible = gridWasVisible;
      runtime.transformHelper.visible = true;
      if (runtime.lightHelper) runtime.lightHelper.visible = true;
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
        </div>
        <div className="three-tool-group three-camera-tools">
          <Camera size={16} />
          <button data-tooltip="Vista frontal" onClick={() => setCameraView("front")} type="button">F</button>
          <button data-tooltip="Vista superior" onClick={() => setCameraView("top")} type="button">S</button>
          <button data-tooltip="Vista lateral" onClick={() => setCameraView("side")} type="button">L</button>
          <button data-tooltip="Vista isometrica" onClick={() => setCameraView("iso")} type="button">I</button>
        </div>
        <div className="three-tool-group">
          <button disabled={!historyRef.current.undo.length} data-tooltip="Deshacer" onClick={undo} type="button"><Undo2 size={18} /></button>
          <button disabled={!historyRef.current.redo.length} data-tooltip="Rehacer" onClick={redo} type="button"><Redo2 size={18} /></button>
          <button disabled={!selectedId} data-tooltip="Enfocar objeto" onClick={focusSelected} type="button"><Focus size={18} /></button>
          <button disabled={!selectedId} data-tooltip="Duplicar objeto" onClick={duplicateSelected} type="button"><Copy size={18} /></button>
          <button disabled={!selectedId} data-tooltip="Centrar en la escena" onClick={centerSelected} type="button"><LocateFixed size={18} /></button>
          <button disabled={!selectedId || selectedRef.current?.isLight} data-tooltip="Apoyar sobre el piso" onClick={placeOnFloor} type="button"><ArrowDownToLine size={18} /></button>
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
            <label><span>Profundidad</span><input max="1.5" min="0.05" onChange={(event) => changeTextDepth(event.target.value)} onFocus={pushHistory} step="0.05" type="number" value={extrudeDepth} /></label>
            <button disabled={!textDraft.trim()} onClick={selectedRef.current?.userData.editorType === "text" ? () => updateSelectedText() : addText} type="button"><Type size={16} /> {selectedRef.current?.userData.editorType === "text" ? "Aplicar cambios" : "Agregar texto"}</button>
          </div>
          <div className="three-panel-heading three-scene-heading"><span>ESCENA</span><strong>Objetos</strong></div>
          <div className="three-outliner">
            {objects.map((item) => {
              const ItemIcon = iconForType(item.type);
              return <div className={`three-outliner-row ${selectedId === item.id ? "active" : ""}`} key={item.id}>
                <button className="three-outliner-select" onClick={() => selectObject(runtimeRef.current?.content.children.find((object) => object.userData.editorId === item.id))} type="button"><ItemIcon size={16} /><span>{item.name}</span></button>
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

        <aside className="three-properties" data-wizard="three-properties">
          <div className="three-panel-heading"><span>PROPIEDADES</span><strong>{selection?.name || "Escena"}</strong></div>
          {selection ? (
            <>
              <fieldset>
                <legend>Objeto</legend>
                <label><span>Nombre</span><input maxLength="80" onChange={(event) => renameSelected(event.target.value)} onFocus={pushHistory} value={selection.name} /></label>
              </fieldset>
              {["position", "rotation", "scale"].map((group) => (
                <fieldset key={group}>
                  <legend>{group === "position" ? "Posicion" : group === "rotation" ? "Rotacion" : "Escala"}</legend>
                  <div className="three-vector-inputs">
                    {["X", "Y", "Z"].map((axis, index) => <label key={axis}><span>{axis}</span><input onBlur={() => pushHistory()} onChange={(event) => updateTransform(group, index, event.target.value)} step="0.1" type="number" value={selection[group][index]} /></label>)}
                  </div>
                </fieldset>
              ))}
              {selection.isLight && (
                <fieldset>
                  <legend>Iluminacion</legend>
                  <label className="three-color-field"><span>Color</span><input onChange={(event) => updateLight("color", event.target.value)} type="color" value={selection.lightColor} /></label>
                  <label><span>Intensidad</span><input max={selectedRef.current?.isDirectionalLight ? 10 : 2000} min="0" onChange={(event) => updateLight("intensity", event.target.value)} step={selectedRef.current?.isDirectionalLight ? 0.1 : 10} type="range" value={selection.intensity} /></label>
                  <label><span>Valor</span><input max={selectedRef.current?.isDirectionalLight ? 10 : 5000} min="0" onChange={(event) => updateLight("intensity", event.target.value)} step={selectedRef.current?.isDirectionalLight ? 0.1 : 10} type="number" value={selection.intensity} /></label>
                  {(selectedRef.current?.isPointLight || selectedRef.current?.isSpotLight) && <label><span>Alcance</span><input max="100" min="0" onChange={(event) => updateLight("distance", event.target.value)} step="1" type="number" value={selection.distance} /></label>}
                  {selectedRef.current?.isSpotLight && <label><span>Apertura</span><input max="80" min="5" onChange={(event) => updateLight("angle", event.target.value)} step="1" type="range" value={selection.angle} /></label>}
                </fieldset>
              )}
              {materialsForObject(selectedRef.current).length > 0 && (
                <fieldset>
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
              <fieldset>
                <legend>Biblioteca de materiales</legend>
                <div className="three-material-presets">
                  {MATERIAL_PRESETS.map((preset) => <button data-tooltip={preset.name} key={preset.id} onClick={() => applyMaterialPreset(preset)} style={{ "--material-color": preset.color }} type="button"><span />{preset.name}</button>)}
                </div>
              </fieldset>
            </>
          ) : (
            <p className="three-empty-selection">Selecciona un objeto en la escena para editarlo.</p>
          )}
          <fieldset>
            <legend>Entorno</legend>
            <div className="three-environment-presets">
              <button onClick={() => applyScenePreset("studio")} type="button">Estudio</button>
              <button onClick={() => applyScenePreset("product")} type="button">Producto</button>
              <button onClick={() => applyScenePreset("night")} type="button">Nocturno</button>
            </div>
            <label className="three-color-field"><span>Fondo</span><input onChange={(event) => setBackground(event.target.value)} type="color" value={background} /></label>
            <label><span>Exposicion</span><input max="2.5" min="0.25" onChange={(event) => setExposure(Number(event.target.value))} step="0.05" type="range" value={exposure} /></label>
            <label><span>Luz ambiente</span><input max="3" min="0" onChange={(event) => setAmbientIntensity(Number(event.target.value))} step="0.1" type="range" value={ambientIntensity} /></label>
            <label className="three-color-field"><span>Piso</span><input disabled={!floorVisible} onChange={(event) => setFloorColor(event.target.value)} type="color" value={floorColor} /></label>
            <label className="three-check"><input checked={floorVisible} onChange={(event) => setFloorVisible(event.target.checked)} type="checkbox" /><Square size={16} /> Mostrar piso</label>
            <label className="three-check"><input checked={gridVisible} onChange={(event) => setGridVisible(event.target.checked)} type="checkbox" /><Grid3X3 size={16} /> Mostrar grilla</label>
          </fieldset>
          <fieldset>
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
