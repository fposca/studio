import React, { useEffect, useMemo, useRef, useState } from "react";
import logo from "./assets/logo.png";
import { Dashboard as DashboardView, isAllowedEmail, Login as LoginView, ProjectSaveDialog as ProjectSaveDialogView } from "./components/AppInterfaces";
import { CustomTooltip, Wizard } from "./components/Guidance";
import VideoEditor from "./editors/VideoEditor";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Copy,
  Crop,
  Download,
  Eraser,
  Film,
  FileAudio,
  FileText,
  FlipHorizontal,
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Circle,
  Image as ImageIcon,
  Loader2,
  LogOut,
  Merge,
  Minus,
  MousePointer2,
  Music2,
  Palette,
  Pause,
  Play,
  RotateCw,
  Save,
  Scissors,
  SlidersHorizontal,
  Redo2,
  SkipBack,
  SkipForward,
  Stamp,
  Square,
  Type,
  Trash2,
  Undo2,
  Upload,
  VolumeX,
  Wand2,
  X
} from "lucide-react";

const API = "http://127.0.0.1:5174";
const MAX_VIDEO_MB = 100;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
const IMAGE_PROJECT_KEY = "studio:image-project:v1";
const IMAGE_WORKSPACE_ID = "image-workspace";
const PROJECT_DB_NAME = "interbanking-studio-projects";
const PROJECT_STORE = "projects";
const VIDEO_PROJECT_ID = "video";
const PDF_PROJECT_ID = "pdf";
const DESIGN_PROJECT_ID = "design";
const WORKSPACE_META_KEY = "studio:workspace-meta:v1";
const WORKSPACE_PROJECTS_KEY = "studio:workspace-projects:v1";
const WIZARD_SEEN_PREFIX = "studio:wizard-seen:";

const WIZARD_STEPS = {
  home: [
    { title: "Inicio", body: "Desde aca elegis si vas a trabajar con imagenes, diseno, PDF o video." },
    { title: "Recientes", body: "Si guardaste un proyecto, podes abrirlo directo desde la seccion Recientes." },
    { title: "Plantillas", body: "Las plantillas preparan tamanos y ajustes comunes para empezar rapido." }
  ],
  image: [
    { title: "Lienzo e imagen", body: "Subi una imagen, movela en el canvas y ajusta su tamano con las manijas." },
    { title: "Herramientas", body: "Tenes seleccion, borrar, clonar, cortar por formas, varita y quitar fondo." },
    { title: "Exportar y proyecto", body: "Podes exportar PNG/JPG/WebP o guardar el proyecto para volver despues." }
  ],
  design: [
    { title: "Diseño vectorial", body: "Combina foto de fondo, textos y formas sobre un lienzo editable." },
    { title: "Texto", body: "Agrega textos, elegi fuente, color, alineacion y tamano desde el panel derecho." },
    { title: "Exportar", body: "Exporta como SVG para seguir editando o PNG para usar como imagen final." }
  ],
  pdf: [
    { title: "Cargar hojas", body: "Arrastra JPG, PNG o WebP sobre esta pantalla para sumarlos al PDF." },
    { title: "Ordenar", body: "Reordena las hojas arrastrandolas, o usa subir/bajar en la lista lateral." },
    { title: "Preparar salida", body: "Rota, duplica, optimiza y elegi tamano de pagina antes de crear el PDF." }
  ],
  video: [
    { title: "Importar clips", body: "Arrastra videos a la preview o timeline. Cada archivo tiene limite de 100 MB." },
    { title: "Timeline", body: "Move clips entre pistas, recorta inicio/fin y usa zoom para cortes finos." },
    { title: "Exportacion", body: "El play general reproduce la timeline y exporta todos los clips juntos." }
  ]
};

const WIZARD_TARGETS = {
  home: ["home-create", "home-recents", "home-templates"],
  image: ["image-canvas", "image-tools", "image-properties"],
  design: ["design-canvas", "design-add", "design-properties"],
  pdf: ["pdf-pages", "pdf-properties", "pdf-properties"],
  video: ["video-preview", "video-timeline", "video-export"]
};

const VIDEO_FONTS = [
  { name: "Arial", value: "Arial, sans-serif", weights: [400, 700, 900] },
  { name: "Segoe UI", value: "'Segoe UI', sans-serif", weights: [300, 400, 600, 700, 900] },
  { name: "Lato", value: "Lato, sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: "Calibri", value: "Calibri, sans-serif", weights: [300, 400, 700] },
  { name: "Bahnschrift", value: "Bahnschrift, sans-serif", weights: [300, 400, 500, 600, 700] },
  { name: "Candara", value: "Candara, sans-serif", weights: [300, 400, 700] },
  { name: "Corbel", value: "Corbel, sans-serif", weights: [300, 400, 700] },
  { name: "Georgia", value: "Georgia, serif", weights: [400, 700] },
  { name: "Cambria", value: "Cambria, serif", weights: [400, 700] },
  { name: "Palatino", value: "'Palatino Linotype', serif", weights: [400, 700] },
  { name: "Times New Roman", value: "'Times New Roman', serif", weights: [400, 700] },
  { name: "Tahoma", value: "Tahoma, sans-serif", weights: [400, 700] },
  { name: "Trebuchet MS", value: "'Trebuchet MS', sans-serif", weights: [400, 700] },
  { name: "Verdana", value: "Verdana, sans-serif", weights: [400, 700] },
  { name: "Courier New", value: "'Courier New', monospace", weights: [400, 700] },
  { name: "Consolas", value: "Consolas, monospace", weights: [400, 700] },
  { name: "Source Code Pro", value: "'Source Code Pro', monospace", weights: [200, 300, 400, 500, 600, 700, 900] },
  { name: "Academico", value: "Academico, serif", weights: [400, 700] },
  { name: "Impact", value: "Impact, sans-serif", weights: [900] }
];

const FONT_WEIGHT_LABELS = {
  100: "Hairline",
  200: "Thin",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "Semi bold",
  700: "Bold",
  800: "Heavy",
  900: "Black"
};

function useWorkspacePersistence(saveHandler, loadHandler) {
  const handlersRef = useRef({ saveHandler, loadHandler });
  handlersRef.current = { saveHandler, loadHandler };

  useEffect(() => {
    const save = (event) => event.detail.tasks.push(Promise.resolve(handlersRef.current.saveHandler(event.detail)));
    const load = (event) => event.detail.tasks.push(Promise.resolve(handlersRef.current.loadHandler(event.detail)));
    window.addEventListener("studio:workspace-save", save);
    window.addEventListener("studio:workspace-load", load);
    return () => {
      window.removeEventListener("studio:workspace-save", save);
      window.removeEventListener("studio:workspace-load", load);
    };
  }, []);
}

function canvasThumbnail(canvas) {
  if (!canvas) return "";
  const out = document.createElement("canvas");
  const scale = Math.min(1, 320 / Math.max(canvas.width, canvas.height));
  out.width = Math.max(1, Math.round(canvas.width * scale));
  out.height = Math.max(1, Math.round(canvas.height * scale));
  out.getContext("2d").drawImage(canvas, 0, 0, out.width, out.height);
  return out.toDataURL("image/jpeg", 0.72);
}

function openProjectDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PROJECT_DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(PROJECT_STORE);
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function putProject(id, value) {
  const db = await openProjectDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECT_STORE, "readwrite");
    tx.objectStore(PROJECT_STORE).put(value, id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function getProject(id) {
  const db = await openProjectDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECT_STORE, "readonly");
    const request = tx.objectStore(PROJECT_STORE).get(id);
    request.onsuccess = () => resolve(request.result);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function deleteProject(id) {
  const db = await openProjectDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECT_STORE, "readwrite");
    tx.objectStore(PROJECT_STORE).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

function blobFromCanvas(canvas, type = "image/png", quality = 0.92) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function bytesFromBlob(blob) {
  return new Uint8Array(await blob.arrayBuffer());
}

async function loadPdfRenderer() {
  const [pdfjsLib, worker] = await Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.mjs?url")]);
  pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjsLib;
}

function textBytes(value) {
  return new TextEncoder().encode(value);
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pointInRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function canvasWithWhiteBackground(canvas, maxEdge = 0) {
  const scale = maxEdge && Math.max(canvas.width, canvas.height) > maxEdge ? maxEdge / Math.max(canvas.width, canvas.height) : 1;
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(canvas.width * scale));
  out.height = Math.max(1, Math.round(canvas.height * scale));
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
}

async function imageFileToCanvas(file, maxEdge = 0) {
  const image = new Image();
  const url = URL.createObjectURL(file);
  try {
    image.src = url;
    await image.decode();
    const source = document.createElement("canvas");
    source.width = image.naturalWidth || image.width;
    source.height = image.naturalHeight || image.height;
    source.getContext("2d").drawImage(image, 0, 0);
    return canvasWithWhiteBackground(source, maxEdge);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function rotateCanvas(canvas, degrees = 0) {
  const normalized = ((degrees % 360) + 360) % 360;
  if (!normalized) return canvas;
  const out = document.createElement("canvas");
  const quarterTurn = normalized === 90 || normalized === 270;
  out.width = quarterTurn ? canvas.height : canvas.width;
  out.height = quarterTurn ? canvas.width : canvas.height;
  const ctx = out.getContext("2d");
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((normalized * Math.PI) / 180);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  return out;
}

async function pdfPageToCanvas(page, maxEdge = 0) {
  const canvas = await imageFileToCanvas(page.file, maxEdge);
  return rotateCanvas(canvas, page.rotation || 0);
}

function pdfPageRect(mode, canvas) {
  if (mode === "a4-landscape") return { w: 842, h: 595 };
  if (mode === "square") return { w: 720, h: 720 };
  if (mode === "source") return { w: canvas.width, h: canvas.height };
  return { w: 595, h: 842 };
}

async function createPdfFromCanvases(canvases, options) {
  const chunks = [];
  const offsets = [0];
  let length = 0;
  let objectId = 1;
  const pages = [];
  const images = [];
  const contents = [];

  function append(chunk) {
    chunks.push(chunk);
    length += chunk.length;
  }

  function appendText(value) {
    append(textBytes(value));
  }

  function addObject(body) {
    const id = objectId;
    objectId += 1;
    offsets[id] = length;
    appendText(`${id} 0 obj\n${body}\nendobj\n`);
    return id;
  }

  async function addImageObject(canvas) {
    const jpegCanvas = canvasWithWhiteBackground(canvas, options.maxEdge);
    const blob = await blobFromCanvas(jpegCanvas, "image/jpeg", options.quality);
    const bytes = await bytesFromBlob(blob);
    const id = objectId;
    objectId += 1;
    offsets[id] = length;
    appendText(`${id} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${jpegCanvas.width} /Height ${jpegCanvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);
    append(bytes);
    appendText("\nendstream\nendobj\n");
    return { id, canvas: jpegCanvas };
  }

  appendText("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const catalogId = objectId++;
  const pagesId = objectId++;

  for (const canvas of canvases) {
    const image = await addImageObject(canvas);
    const page = pdfPageRect(options.pageSize, image.canvas);
    const scale = options.fit === "cover" ? Math.max(page.w / image.canvas.width, page.h / image.canvas.height) : Math.min(page.w / image.canvas.width, page.h / image.canvas.height);
    const drawW = image.canvas.width * scale;
    const drawH = image.canvas.height * scale;
    const x = (page.w - drawW) / 2;
    const y = (page.h - drawH) / 2;
    const content = `q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im${image.id} Do\nQ`;
    const contentId = addObject(`<< /Length ${textBytes(content).length} >>\nstream\n${content}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${page.w} ${page.h}] /Resources << /XObject << /Im${image.id} ${image.id} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pages.push(pageId);
    images.push(image.id);
    contents.push(contentId);
  }

  offsets[pagesId] = length;
  appendText(`${pagesId} 0 obj\n<< /Type /Pages /Kids [${pages.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj\n`);
  offsets[catalogId] = length;
  appendText(`${catalogId} 0 obj\n<< /Type /Catalog /Pages ${pagesId} 0 R >>\nendobj\n`);

  const startXref = length;
  const totalObjects = objectId;
  appendText(`xref\n0 ${totalObjects}\n0000000000 65535 f \n`);
  for (let id = 1; id < totalObjects; id += 1) {
    appendText(`${String(offsets[id] || 0).padStart(10, "0")} 00000 n \n`);
  }
  appendText(`trailer\n<< /Size ${totalObjects} /Root ${catalogId} 0 R >>\nstartxref\n${startXref}\n%%EOF`);

  return new Blob(chunks, { type: "application/pdf" });
}

function ImageEditor({ openProjectSignal = 0, templateRequest = null }) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const historyRef = useRef([]);
  const redoRef = useRef([]);
  const sourceRef = useRef(null);
  const [name, setName] = useState("imagen");
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [vectorUrl, setVectorUrl] = useState("");
  const [clipboard, setClipboard] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    blur: 0
  });
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, w: 600, h: 360 });
  const [exportSize, setExportSize] = useState({ w: 0, h: 0 });
  const [boardSize, setBoardSize] = useState({ w: 960, h: 540 });
  const [imageBox, setImageBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [imageSelected, setImageSelected] = useState(false);
  const [imageVisible, setImageVisible] = useState(false);
  const [imageLayers, setImageLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [canvasBackground, setCanvasBackground] = useState("checker");
  const [dragging, setDragging] = useState("");
  const [activeTool, setActiveTool] = useState("select");
  const [selectionShape, setSelectionShape] = useState("rect");
  const [freePath, setFreePath] = useState([]);
  const [brushSize, setBrushSize] = useState(28);
  const [colorTolerance, setColorTolerance] = useState(42);
  const [clonePoint, setClonePoint] = useState(null);
  const [historyCounts, setHistoryCounts] = useState({ undo: 0, redo: 0 });
  const selectedLayer = imageLayers.find((layer) => layer.id === selectedLayerId);
  const editableImageBox = selectedLayer || imageBox;

  const filterString = useMemo(
    () =>
      `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) grayscale(${filters.grayscale}%) blur(${filters.blur}px)`,
    [filters]
  );

  useEffect(() => {
    const source = sourceRef.current;
    const canvas = canvasRef.current;
    if (!source || !canvas) return;
    canvas.width = boardSize.w;
    canvas.height = boardSize.h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paintCanvasBackground(ctx, canvas.width, canvas.height);
    if (imageVisible) {
      ctx.filter = filterString;
      ctx.drawImage(source, imageBox.x, imageBox.y, imageBox.w, imageBox.h);
      ctx.filter = "none";
    }
    imageLayers.forEach((layer) => {
      ctx.drawImage(layer.source, layer.x, layer.y, layer.w, layer.h);
    });
    drawSelection(ctx);
    const selectedBox = selectedLayer || (imageSelected && imageVisible ? imageBox : null);
    if (selectedBox) {
      const handleSize = Math.max(8, Math.round(canvas.width / 120));
      ctx.setLineDash([]);
      ctx.strokeStyle = "#f4f6f8";
      ctx.lineWidth = Math.max(1, Math.round(canvas.width / 720));
      ctx.strokeRect(selectedBox.x, selectedBox.y, selectedBox.w, selectedBox.h);
      ctx.fillStyle = "#a100ff";
      selectionHandles(selectedBox, handleSize).forEach((handle) => {
        ctx.fillRect(handle.x, handle.y, handle.size, handle.size);
        ctx.strokeStyle = "#08050d";
        ctx.strokeRect(handle.x, handle.y, handle.size, handle.size);
      });
    }
  }, [filterString, cropBox, freePath, selectionShape, boardSize, imageBox, imageSelected, imageVisible, imageLayers, selectedLayerId, canvasBackground, version]);

  function paintCanvasBackground(ctx, width, height) {
    if (canvasBackground === "checker") return;
    ctx.fillStyle = canvasBackground === "white" ? "#ffffff" : "#000000";
    ctx.fillRect(0, 0, width, height);
  }

  function composeCanvas(area = { x: 0, y: 0, w: boardSize.w, h: boardSize.h }) {
    const source = sourceRef.current;
    if (!source) return null;
    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(area.w));
    out.height = Math.max(1, Math.round(area.h));
    const ctx = out.getContext("2d");
    paintCanvasBackground(ctx, out.width, out.height);
    if (imageVisible) {
      ctx.filter = filterString;
      ctx.drawImage(source, imageBox.x - area.x, imageBox.y - area.y, imageBox.w, imageBox.h);
      ctx.filter = "none";
    }
    imageLayers.forEach((layer) => {
      ctx.drawImage(layer.source, layer.x - area.x, layer.y - area.y, layer.w, layer.h);
    });
    return out;
  }

  function selectionBounds() {
    if (selectionShape === "free" && freePath.length > 1) {
      const xs = freePath.map((point) => point.x);
      const ys = freePath.map((point) => point.y);
      const x1 = clamp(Math.min(...xs), 0, boardSize.w - 1);
      const y1 = clamp(Math.min(...ys), 0, boardSize.h - 1);
      const x2 = clamp(Math.max(...xs), x1 + 1, boardSize.w);
      const y2 = clamp(Math.max(...ys), y1 + 1, boardSize.h);
      return {
        x: Math.floor(x1),
        y: Math.floor(y1),
        w: Math.max(1, Math.ceil(x2 - x1)),
        h: Math.max(1, Math.ceil(y2 - y1))
      };
    }
    return cropBox;
  }

  function buildSelectionPath(ctx, offset = { x: 0, y: 0 }, scale = { x: 1, y: 1 }) {
    ctx.beginPath();
    if (selectionShape === "free") {
      if (freePath.length < 2) return false;
      freePath.forEach((point, index) => {
        const x = (point.x - offset.x) * scale.x;
        const y = (point.y - offset.y) * scale.y;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      return true;
    }

    const rect = selectionBounds();
    const x = (rect.x - offset.x) * scale.x;
    const y = (rect.y - offset.y) * scale.y;
    const w = rect.w * scale.x;
    const h = rect.h * scale.y;
    if (selectionShape === "round") {
      ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w) / 2, Math.abs(h) / 2, 0, 0, Math.PI * 2);
    } else {
      ctx.rect(x, y, w, h);
    }
    return true;
  }

  function drawSelection(ctx) {
    ctx.save();
    ctx.strokeStyle = "#a100ff";
    ctx.lineWidth = Math.max(2, Math.round(ctx.canvas.width / 360));
    ctx.setLineDash([12, 8]);
    if (buildSelectionPath(ctx)) ctx.stroke();
    ctx.restore();
  }

  function composeSelectionCanvas() {
    const bounds = selectionBounds();
    const piece = composeCanvas(bounds);
    if (!piece) return null;
    if (selectionShape === "rect") return piece;

    const ctx = piece.getContext("2d");
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    if (!buildSelectionPath(ctx, { x: bounds.x, y: bounds.y })) {
      ctx.restore();
      return null;
    }
    ctx.fill();
    ctx.restore();
    return piece;
  }

  function clipSelectionOnSource(ctx, source) {
    const scaleX = source.width / imageBox.w;
    const scaleY = source.height / imageBox.h;
    return buildSelectionPath(ctx, imageBox, { x: scaleX, y: scaleY });
  }

  function clearSelectionFromSource() {
    const source = sourceRef.current;
    if (!source || !imageVisible) return;
    const bounds = selectionBounds();
    const scaleX = source.width / imageBox.w;
    const scaleY = source.height / imageBox.h;
    const sx = (bounds.x - imageBox.x) * scaleX;
    const sy = (bounds.y - imageBox.y) * scaleY;
    const clearX = clamp(Math.floor(sx), 0, source.width);
    const clearY = clamp(Math.floor(sy), 0, source.height);
    const clearW = clamp(Math.ceil(bounds.w * scaleX - Math.max(0, -sx)), 0, source.width - clearX);
    const clearH = clamp(Math.ceil(bounds.h * scaleY - Math.max(0, -sy)), 0, source.height - clearY);
    if (!clearW || !clearH) return;

    const ctx = source.getContext("2d");
    ctx.save();
    if (!clipSelectionOnSource(ctx, source)) {
      ctx.restore();
      return;
    }
    ctx.clip();
    ctx.clearRect(clearX, clearY, clearW, clearH);
    ctx.restore();
  }

  function snapshot() {
    const source = sourceRef.current;
    return {
      savedAt: new Date().toISOString(),
      name,
      sourceData: source ? source.toDataURL("image/png") : "",
      boardSize,
      imageBox,
      cropBox,
      selectionShape,
      freePath,
      exportSize,
      filters,
      canvasBackground,
      imageSelected,
      imageVisible,
      selectedLayerId,
      imageLayers: imageLayers.map((layer) => ({ ...layer, source: undefined, sourceData: layer.source.toDataURL("image/png") }))
    };
  }

  function syncHistoryCounts() {
    setHistoryCounts({ undo: historyRef.current.length, redo: redoRef.current.length });
  }

  function pushHistory() {
    historyRef.current = [...historyRef.current.slice(-39), snapshot()];
    redoRef.current = [];
    syncHistoryCounts();
  }

  async function restoreSnapshot(state) {
    if (state.sourceData) {
      const image = new Image();
      image.src = state.sourceData;
      await image.decode();
      const source = document.createElement("canvas");
      source.width = image.width;
      source.height = image.height;
      source.getContext("2d").drawImage(image, 0, 0);
      sourceRef.current = source;
    } else {
      sourceRef.current = null;
    }

    setName(state.name || "imagen");
    setBoardSize(state.boardSize);
    setImageBox(state.imageBox);
    setCropBox(state.cropBox);
    setSelectionShape(state.selectionShape || "rect");
    setFreePath(state.freePath || []);
    setExportSize(state.exportSize);
    setFilters(state.filters);
    setCanvasBackground(state.canvasBackground);
    setImageSelected(state.imageSelected);
    setImageVisible(state.imageVisible);
    const restoredLayers = await Promise.all((state.imageLayers || []).map(async (layer) => {
      const image = new Image();
      image.src = layer.sourceData;
      await image.decode();
      const source = document.createElement("canvas");
      source.width = image.width;
      source.height = image.height;
      source.getContext("2d").drawImage(image, 0, 0);
      return { id: layer.id, x: layer.x, y: layer.y, w: layer.w, h: layer.h, source };
    }));
    setImageLayers(restoredLayers);
    setSelectedLayerId(state.selectedLayerId || "");
    setVersion((value) => value + 1);
  }

  function saveImageProject() {
    try {
      localStorage.setItem(IMAGE_PROJECT_KEY, JSON.stringify(snapshot()));
      setProjectStatus("Proyecto guardado");
      setError("");
    } catch {
      setError("No se pudo guardar. La imagen puede ser demasiado grande para el guardado local.");
    }
  }

  async function loadImageProject() {
    const saved = localStorage.getItem(IMAGE_PROJECT_KEY);
    if (!saved) {
      setProjectStatus("");
      setError("No hay proyecto de imagen guardado.");
      return;
    }

    try {
      pushHistory();
      await restoreSnapshot(JSON.parse(saved));
      redoRef.current = [];
      syncHistoryCounts();
      setVectorUrl("");
      setProjectStatus("Proyecto abierto");
      setError("");
    } catch {
      setError("No se pudo abrir el proyecto guardado.");
    }
  }

  function clearImageProject() {
    localStorage.removeItem(IMAGE_PROJECT_KEY);
    setProjectStatus("Proyecto guardado eliminado");
  }

  async function saveImageWorkspace({ projectId = IMAGE_WORKSPACE_ID } = {}) {
    await putProject(`workspace:${projectId}:image`, snapshot());
    setProjectStatus("Imagen guardada en el espacio de trabajo");
    return { kind: "image", thumbnail: canvasThumbnail(composeCanvas()) };
  }

  async function loadImageWorkspace({ projectId = IMAGE_WORKSPACE_ID } = {}) {
    const saved = await getProject(`workspace:${projectId}:image`);
    if (!saved) return;
    await restoreSnapshot(saved);
    setProjectStatus("Imagen restaurada");
  }

  useWorkspacePersistence(saveImageWorkspace, loadImageWorkspace);

  function createBlankImageTemplate(template) {
    if (!template) return;
    pushHistory();
    const source = document.createElement("canvas");
    source.width = template.w;
    source.height = template.h;
    const ctx = source.getContext("2d");
    if (template.background === "white" || template.background === "black") {
      ctx.fillStyle = template.background === "white" ? "#ffffff" : "#000000";
      ctx.fillRect(0, 0, source.width, source.height);
    }
    sourceRef.current = source;
    setName(template.name || "imagen");
    setBoardSize({ w: template.w, h: template.h });
    setImageBox({ x: 0, y: 0, w: template.w, h: template.h });
    setCropBox({ x: 0, y: 0, w: template.w, h: template.h });
    setExportSize({ w: template.w, h: template.h });
    setCanvasBackground(template.background || "checker");
    setSelectionShape("rect");
    setFreePath([]);
    setImageSelected(true);
    setImageVisible(true);
    setImageLayers([]);
    setSelectedLayerId("");
    setVectorUrl("");
    setProjectStatus(`Plantilla ${template.name} creada`);
    setVersion((value) => value + 1);
  }

  useEffect(() => {
    if (openProjectSignal) loadImageProject();
  }, [openProjectSignal]);

  useEffect(() => {
    if (templateRequest) createBlankImageTemplate(templateRequest);
  }, [templateRequest?.id]);

  async function undo() {
    const previous = historyRef.current.pop();
    if (!previous) return;
    redoRef.current.push(snapshot());
    syncHistoryCounts();
    await restoreSnapshot(previous);
  }

  async function redo() {
    const next = redoRef.current.pop();
    if (!next) return;
    historyRef.current.push(snapshot());
    syncHistoryCounts();
    await restoreSnapshot(next);
  }

  function selectionHandles(rect, size = 10) {
    const half = size / 2;
    const points = {
      nw: [rect.x, rect.y],
      n: [rect.x + rect.w / 2, rect.y],
      ne: [rect.x + rect.w, rect.y],
      e: [rect.x + rect.w, rect.y + rect.h / 2],
      se: [rect.x + rect.w, rect.y + rect.h],
      s: [rect.x + rect.w / 2, rect.y + rect.h],
      sw: [rect.x, rect.y + rect.h],
      w: [rect.x, rect.y + rect.h / 2]
    };
    return Object.entries(points).map(([name, [x, y]]) => ({
      name,
      x: x - half,
      y: y - half,
      size
    }));
  }

  function hitHandle(point, box = imageBox) {
    const size = Math.max(10, Math.round(boardSize.w / 120));
    return selectionHandles(box, size).find((handle) =>
      point.x >= handle.x && point.x <= handle.x + handle.size && point.y >= handle.y && point.y <= handle.y + handle.size
    );
  }

  function resizedBoxFromDrag(handle, startBox, startPoint, point, keepRatio) {
    let left = startBox.x;
    let top = startBox.y;
    let right = startBox.x + startBox.w;
    let bottom = startBox.y + startBox.h;
    const dx = point.x - startPoint.x;
    const dy = point.y - startPoint.y;

    if (handle.includes("w")) left += dx;
    if (handle.includes("e")) right += dx;
    if (handle.includes("n")) top += dy;
    if (handle.includes("s")) bottom += dy;

    let nextW = Math.max(12, right - left);
    let nextH = Math.max(12, bottom - top);

    if (keepRatio) {
      const ratio = startBox.w / startBox.h;
      if (handle === "n" || handle === "s") {
        nextW = nextH * ratio;
      } else if (handle === "e" || handle === "w") {
        nextH = nextW / ratio;
      } else if (Math.abs(dx) > Math.abs(dy)) {
        nextH = nextW / ratio;
      } else {
        nextW = nextH * ratio;
      }

      if (handle.includes("w")) left = startBox.x + startBox.w - nextW;
      else right = startBox.x + nextW;
      if (handle.includes("n")) top = startBox.y + startBox.h - nextH;
      else bottom = startBox.y + nextH;
      if (handle === "n" || handle === "s") left = startBox.x + (startBox.w - nextW) / 2;
      if (handle === "e" || handle === "w") top = startBox.y + (startBox.h - nextH) / 2;
    }

    return {
      x: Math.round(handle.includes("w") || handle === "n" || handle === "s" ? left : startBox.x),
      y: Math.round(handle.includes("n") || handle === "e" || handle === "w" ? top : startBox.y),
      w: Math.round(nextW),
      h: Math.round(nextH)
    };
  }

  function pointFromEvent(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height
    };
  }

  function sourcePointFromCanvas(point) {
    const source = sourceRef.current;
    if (!source || !imageBox.w || !imageBox.h) return null;
    return {
      x: ((point.x - imageBox.x) / imageBox.w) * source.width,
      y: ((point.y - imageBox.y) / imageBox.h) * source.height
    };
  }

  function eraseAt(point) {
    const source = sourceRef.current;
    const sourcePoint = sourcePointFromCanvas(point);
    if (!source || !sourcePoint) return;
    const ctx = source.getContext("2d");
    const radiusX = Math.max(1, (brushSize / imageBox.w) * source.width) / 2;
    const radiusY = Math.max(1, (brushSize / imageBox.h) * source.height) / 2;

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.ellipse(sourcePoint.x, sourcePoint.y, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    setVersion((value) => value + 1);
  }

  function cloneAt(point, drag) {
    const source = sourceRef.current;
    const target = sourcePointFromCanvas(point);
    if (!source || !target || !drag?.cloneCanvas) return;

    const radiusX = Math.max(1, (brushSize / imageBox.w) * source.width) / 2;
    const radiusY = Math.max(1, (brushSize / imageBox.h) * source.height) / 2;
    const sampleX = drag.origin.x + target.x - drag.startTarget.x;
    const sampleY = drag.origin.y + target.y - drag.startTarget.y;
    if (
      sampleX - radiusX < 0 ||
      sampleY - radiusY < 0 ||
      sampleX + radiusX > source.width ||
      sampleY + radiusY > source.height
    ) {
      return;
    }
    const ctx = source.getContext("2d");

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(target.x, target.y, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      drag.cloneCanvas,
      sampleX - radiusX,
      sampleY - radiusY,
      radiusX * 2,
      radiusY * 2,
      target.x - radiusX,
      target.y - radiusY,
      radiusX * 2,
      radiusY * 2
    );
    ctx.restore();
    setVersion((value) => value + 1);
  }

  function sourceCanvasCopy() {
    const source = sourceRef.current;
    if (!source) return null;
    const copy = document.createElement("canvas");
    copy.width = source.width;
    copy.height = source.height;
    copy.getContext("2d").drawImage(source, 0, 0);
    return copy;
  }

  function colorDistance(a, b) {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
  }

  function removeColorAt(point) {
    const source = sourceRef.current;
    const sourcePoint = sourcePointFromCanvas(point);
    if (!source || !sourcePoint) return false;
    const x = Math.floor(clamp(sourcePoint.x, 0, source.width - 1));
    const y = Math.floor(clamp(sourcePoint.y, 0, source.height - 1));
    const ctx = source.getContext("2d");
    const imageData = ctx.getImageData(0, 0, source.width, source.height);
    const data = imageData.data;
    const index = (y * source.width + x) * 4;
    const target = [data[index], data[index + 1], data[index + 2]];
    let changed = false;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] && colorDistance([data[i], data[i + 1], data[i + 2]], target) <= colorTolerance) {
        data[i + 3] = 0;
        changed = true;
      }
    }

    if (!changed) return false;
    ctx.putImageData(imageData, 0, 0);
    setVersion((value) => value + 1);
    return true;
  }

  function removeBackground() {
    const source = sourceRef.current;
    if (!source) return;
    pushHistory();
    const ctx = source.getContext("2d");
    const imageData = ctx.getImageData(0, 0, source.width, source.height);
    const data = imageData.data;
    const cornerPoints = [
      [0, 0],
      [source.width - 1, 0],
      [0, source.height - 1],
      [source.width - 1, source.height - 1]
    ];
    const target = cornerPoints.reduce(
      (sum, [x, y]) => {
        const index = (y * source.width + x) * 4;
        return [sum[0] + data[index], sum[1] + data[index + 1], sum[2] + data[index + 2]];
      },
      [0, 0, 0]
    ).map((value) => value / cornerPoints.length);
    const visited = new Uint8Array(source.width * source.height);
    const stack = [];
    for (let x = 0; x < source.width; x += 1) {
      stack.push([x, 0], [x, source.height - 1]);
    }
    for (let y = 1; y < source.height - 1; y += 1) {
      stack.push([0, y], [source.width - 1, y]);
    }

    let changed = false;
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= source.width || y >= source.height) continue;
      const pixel = y * source.width + x;
      if (visited[pixel]) continue;
      visited[pixel] = 1;
      const index = pixel * 4;
      if (!data[index + 3] || colorDistance([data[index], data[index + 1], data[index + 2]], target) > colorTolerance) continue;
      data[index + 3] = 0;
      changed = true;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    if (changed) {
      ctx.putImageData(imageData, 0, 0);
      setVersion((value) => value + 1);
    } else {
      historyRef.current.pop();
      syncHistoryCounts();
    }
  }

  function normalizedCrop(start, end) {
    const x1 = clamp(Math.min(start.x, end.x), 0, boardSize.w - 1);
    const y1 = clamp(Math.min(start.y, end.y), 0, boardSize.h - 1);
    const x2 = clamp(Math.max(start.x, end.x), x1 + 1, boardSize.w);
    const y2 = clamp(Math.max(start.y, end.y), y1 + 1, boardSize.h);
    return {
      x: Math.round(x1),
      y: Math.round(y1),
      w: Math.round(x2 - x1),
      h: Math.round(y2 - y1)
    };
  }

  function normalizedCircleCrop(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const size = Math.max(1, Math.max(Math.abs(dx), Math.abs(dy)));
    const signedX = dx < 0 ? -size : size;
    const signedY = dy < 0 ? -size : size;
    return normalizedCrop(start, { x: start.x + signedX, y: start.y + signedY });
  }

  function normalizedSelectionCrop(start, end) {
    return selectionShape === "round" ? normalizedCircleCrop(start, end) : normalizedCrop(start, end);
  }

  function handlePointerDown(event) {
    if (!sourceRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    const selectedBox = selectedLayer || (imageSelected && imageVisible ? imageBox : null);
    const handle = selectedBox ? hitHandle(point, selectedBox) : null;
    const hitLayer = [...imageLayers].reverse().find((layer) => pointInRect(point, layer));
    const insideImage = imageVisible && pointInRect(point, imageBox);

    if (activeTool === "cut") {
      setImageSelected(false);
      if (selectionShape === "free") {
        dragRef.current = { mode: "free-select" };
        setDragging("cut");
        setFreePath([point]);
      } else {
        dragRef.current = { mode: "crop", start: point, lockCircle: selectionShape === "round" };
        setDragging("crop");
        setCropBox(normalizedSelectionCrop(point, point));
        setFreePath([]);
      }
      return;
    }

    if (activeTool === "magic" && insideImage) {
      pushHistory();
      setImageSelected(false);
      if (!removeColorAt(point)) {
        historyRef.current.pop();
        syncHistoryCounts();
      }
      return;
    }

    if (activeTool === "erase" && insideImage) {
      pushHistory();
      setImageSelected(false);
      dragRef.current = { mode: "erase" };
      setDragging("erase");
      eraseAt(point);
      return;
    }

    if (activeTool === "clone" && insideImage) {
      const sourcePoint = sourcePointFromCanvas(point);
      if (!sourcePoint) return;
      if (!clonePoint || event.altKey) {
        setClonePoint(sourcePoint);
        setImageSelected(false);
        return;
      }
      pushHistory();
      setImageSelected(false);
      dragRef.current = {
        mode: "clone",
        origin: clonePoint,
        startTarget: sourcePoint,
        cloneCanvas: sourceCanvasCopy()
      };
      setDragging("clone");
      cloneAt(point, dragRef.current);
      return;
    }

    if (handle) {
      pushHistory();
      dragRef.current = {
        mode: selectedLayer ? "resize-layer" : "resize-image",
        layerId: selectedLayer?.id,
        handle: handle.name,
        start: point,
        box: selectedBox
      };
      setDragging("resize");
      return;
    }

    if (activeTool === "select" && hitLayer) {
      setSelectedLayerId(hitLayer.id);
      setImageSelected(false);
      pushHistory();
      dragRef.current = { mode: "move-layer", layerId: hitLayer.id, start: point, box: hitLayer };
      setDragging("move");
      return;
    }

    if (event.shiftKey && !insideImage) {
      pushHistory();
      dragRef.current = { mode: "crop", start: point };
      setDragging("crop");
      setImageSelected(false);
      setCropBox(normalizedCrop(point, point));
      return;
    }

    if (insideImage) {
      setImageSelected(true);
      setSelectedLayerId("");
      pushHistory();
      dragRef.current = { mode: "move-image", start: point, box: imageBox };
      setDragging("move");
      return;
    }

    setImageSelected(false);
    setSelectedLayerId("");
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;
    if (!drag) return;
    const point = pointFromEvent(event);
    if (drag.mode === "crop") {
      setCropBox(drag.lockCircle ? normalizedCircleCrop(drag.start, point) : normalizedCrop(drag.start, point));
      return;
    }
    if (drag.mode === "free-select") {
      setFreePath((path) => {
        const last = path[path.length - 1];
        if (last && Math.hypot(point.x - last.x, point.y - last.y) < 3) return path;
        return [...path, point];
      });
      return;
    }
    if (drag.mode === "move-image") {
      setImageBox({
        ...drag.box,
        x: Math.round(drag.box.x + point.x - drag.start.x),
        y: Math.round(drag.box.y + point.y - drag.start.y)
      });
      return;
    }
    if (drag.mode === "resize-image") {
      setImageBox(resizedBoxFromDrag(drag.handle, drag.box, drag.start, point, event.shiftKey));
      return;
    }
    if (drag.mode === "move-layer") {
      setImageLayers((current) => current.map((layer) => layer.id === drag.layerId ? {
        ...layer,
        x: Math.round(drag.box.x + point.x - drag.start.x),
        y: Math.round(drag.box.y + point.y - drag.start.y)
      } : layer));
      return;
    }
    if (drag.mode === "resize-layer") {
      const box = resizedBoxFromDrag(drag.handle, drag.box, drag.start, point, event.shiftKey);
      setImageLayers((current) => current.map((layer) => layer.id === drag.layerId ? { ...layer, ...box } : layer));
      return;
    }
    if (drag.mode === "erase") {
      eraseAt(point);
      return;
    }
    if (drag.mode === "clone") {
      cloneAt(point, drag);
    }
  }

  function endPointerDrag(event) {
    if (event?.currentTarget?.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDragging("");
  }

  async function loadImage(file) {
    if (!file) return;
    const bitmap = await createImageBitmap(file);
    const source = document.createElement("canvas");
    source.width = bitmap.width;
    source.height = bitmap.height;
    source.getContext("2d").drawImage(bitmap, 0, 0);
    sourceRef.current = source;
    historyRef.current = [];
    redoRef.current = [];
    syncHistoryCounts();
    setName(file.name.replace(/\.[^.]+$/, "") || "imagen");
    setBoardSize({ w: bitmap.width, h: bitmap.height });
    setImageBox({ x: 0, y: 0, w: bitmap.width, h: bitmap.height });
    setImageSelected(true);
    setImageVisible(true);
    setImageLayers([]);
    setSelectedLayerId("");
    setCropBox({ x: 0, y: 0, w: bitmap.width, h: bitmap.height });
    setSelectionShape("rect");
    setFreePath([]);
    setExportSize({ w: bitmap.width, h: bitmap.height });
    setVectorUrl("");
    setClonePoint(null);
    setVersion((value) => value + 1);
  }

  function updateCrop(key, value) {
    if (!sourceRef.current) return;
    pushHistory();
    setCropBox((current) => {
      const next = { ...current, [key]: Math.max(0, Number(value) || 0) };
      next.x = Math.min(next.x, boardSize.w - 1);
      next.y = Math.min(next.y, boardSize.h - 1);
      next.w = Math.min(Math.max(1, next.w), boardSize.w - next.x);
      next.h = Math.min(Math.max(1, next.h), boardSize.h - next.y);
      return next;
    });
  }

  function updateImageBox(key, value) {
    if (!sourceRef.current) return;
    pushHistory();
    const nextValue = key === "w" || key === "h" ? Math.max(1, Number(value) || 1) : Number(value) || 0;
    if (selectedLayerId) {
      setImageLayers((current) => current.map((layer) => layer.id === selectedLayerId ? { ...layer, [key]: nextValue } : layer));
      return;
    }
    setImageBox((current) => ({
      ...current,
      [key]: nextValue
    }));
    setImageSelected(true);
  }

  function updateBoard(key, value) {
    const nextValue = clamp(Number(value) || 1, 1, 12000);
    pushHistory();
    setBoardSize((current) => {
      const next = { ...current, [key]: nextValue };
      setCropBox((crop) => ({
        x: Math.min(crop.x, next.w - 1),
        y: Math.min(crop.y, next.h - 1),
        w: Math.min(crop.w, next.w - Math.min(crop.x, next.w - 1)),
        h: Math.min(crop.h, next.h - Math.min(crop.y, next.h - 1))
      }));
      return next;
    });
  }

  function resizeBoardToImage() {
    const source = sourceRef.current;
    if (!source) return;
    pushHistory();
    setBoardSize({ w: source.width, h: source.height });
    setImageBox({ x: 0, y: 0, w: source.width, h: source.height });
    setCropBox({ x: 0, y: 0, w: source.width, h: source.height });
  }

  function setCropToBoard() {
    pushHistory();
    setCropBox({ x: 0, y: 0, w: boardSize.w, h: boardSize.h });
  }

  function alignImage(horizontal = "center", vertical = "middle") {
    const source = sourceRef.current;
    if (!source) return;
    pushHistory();
    const xPositions = {
      left: 0,
      center: Math.round((boardSize.w - imageBox.w) / 2),
      right: boardSize.w - imageBox.w,
      current: imageBox.x
    };
    const yPositions = {
      top: 0,
      middle: Math.round((boardSize.h - imageBox.h) / 2),
      bottom: boardSize.h - imageBox.h,
      current: imageBox.y
    };
    setImageBox((current) => ({
      ...current,
      x: xPositions[horizontal],
      y: yPositions[vertical]
    }));
    setImageSelected(true);
  }

  function fitImageToBoard(mode = "contain") {
    const source = sourceRef.current;
    if (!source) return;
    pushHistory();
    const ratio =
      mode === "cover"
        ? Math.max(boardSize.w / source.width, boardSize.h / source.height)
        : Math.min(boardSize.w / source.width, boardSize.h / source.height);
    const nextW = Math.max(1, Math.round(source.width * ratio));
    const nextH = Math.max(1, Math.round(source.height * ratio));
    const resized = document.createElement("canvas");
    resized.width = nextW;
    resized.height = nextH;
    resized.getContext("2d").drawImage(source, 0, 0, nextW, nextH);
    sourceRef.current = resized;
    setImageBox({
      x: Math.round((boardSize.w - nextW) / 2),
      y: Math.round((boardSize.h - nextH) / 2),
      w: nextW,
      h: nextH
    });
    setExportSize({ w: nextW, h: nextH });
    setImageSelected(true);
    setVersion((value) => value + 1);
  }

  function applyResize() {
    const source = sourceRef.current;
    if (!source || !exportSize.w || !exportSize.h) return;
    pushHistory();
    const resized = document.createElement("canvas");
    resized.width = Number(exportSize.w);
    resized.height = Number(exportSize.h);
    resized.getContext("2d").drawImage(source, 0, 0, resized.width, resized.height);
    sourceRef.current = resized;
    setBoardSize({ w: resized.width, h: resized.height });
    setImageBox({ x: 0, y: 0, w: resized.width, h: resized.height });
    setCropBox({ x: 0, y: 0, w: resized.width, h: resized.height });
    setVersion((value) => value + 1);
  }

  function rotate() {
    const source = sourceRef.current;
    if (!source) return;
    pushHistory();
    const rotated = document.createElement("canvas");
    rotated.width = source.height;
    rotated.height = source.width;
    const ctx = rotated.getContext("2d");
    ctx.translate(rotated.width / 2, rotated.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(source, -source.width / 2, -source.height / 2);
    sourceRef.current = rotated;
    setBoardSize({ w: rotated.width, h: rotated.height });
    setImageBox({ x: 0, y: 0, w: rotated.width, h: rotated.height });
    setCropBox({ x: 0, y: 0, w: rotated.width, h: rotated.height });
    setExportSize({ w: rotated.width, h: rotated.height });
    setVersion((value) => value + 1);
  }

  function flip() {
    const source = sourceRef.current;
    if (!source) return;
    pushHistory();
    const flipped = document.createElement("canvas");
    flipped.width = source.width;
    flipped.height = source.height;
    const ctx = flipped.getContext("2d");
    ctx.translate(source.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(source, 0, 0);
    sourceRef.current = flipped;
    setVersion((value) => value + 1);
  }

  function cutSelection() {
    const source = sourceRef.current;
    if (!source || !imageVisible) return;
    const piece = composeSelectionCanvas();
    if (!piece) return;
    pushHistory();
    setClipboard(piece.toDataURL("image/png"));
    clearSelectionFromSource();
    setActiveTool("select");
    setImageSelected(true);
    setSelectedLayerId("");
    setVersion((value) => value + 1);
  }

  function cropImageToSelection() {
    const cropped = composeSelectionCanvas();
    if (!cropped) return;
    pushHistory();
    sourceRef.current = cropped;
    setBoardSize({ w: cropped.width, h: cropped.height });
    setImageBox({ x: 0, y: 0, w: cropped.width, h: cropped.height });
    setCropBox({ x: 0, y: 0, w: cropped.width, h: cropped.height });
    setSelectionShape("rect");
    setFreePath([]);
    setExportSize({ w: cropped.width, h: cropped.height });
    setImageSelected(true);
    setImageVisible(true);
    setClonePoint(null);
    setVersion((value) => value + 1);
  }

  async function pasteSelection() {
    if (!sourceRef.current || !clipboard) return;
    pushHistory();
    const image = new Image();
    image.src = clipboard;
    await image.decode();
    const layerSource = document.createElement("canvas");
    layerSource.width = image.width;
    layerSource.height = image.height;
    layerSource.getContext("2d").drawImage(image, 0, 0);
    const layer = {
      id: `image-layer-${Date.now()}`,
      source: layerSource,
      x: cropBox.x,
      y: cropBox.y,
      w: image.width,
      h: image.height
    };
    setImageLayers((current) => [...current, layer]);
    setSelectedLayerId(layer.id);
    setImageSelected(false);
  }

  function copySelectedImage() {
    if (selectedLayer) {
      setClipboard(selectedLayer.source.toDataURL("image/png"));
      return;
    }
    const source = sourceRef.current;
    if (!source || !imageVisible || !imageSelected) return;
    const copy = document.createElement("canvas");
    copy.width = Math.max(1, Math.round(imageBox.w));
    copy.height = Math.max(1, Math.round(imageBox.h));
    copy.getContext("2d").drawImage(source, 0, 0, source.width, source.height, 0, 0, copy.width, copy.height);
    setClipboard(copy.toDataURL("image/png"));
  }

  async function pasteClipboardAsImage() {
    if (!clipboard) return;
    pushHistory();
    const image = new Image();
    image.src = clipboard;
    await image.decode();
    const source = document.createElement("canvas");
    source.width = image.width;
    source.height = image.height;
    source.getContext("2d").drawImage(image, 0, 0);
    const layer = {
      id: `image-layer-${Date.now()}`,
      source,
      x: Math.round((boardSize.w - image.width) / 2),
      y: Math.round((boardSize.h - image.height) / 2),
      w: image.width,
      h: image.height
    };
    setImageLayers((current) => [...current, layer]);
    setSelectedLayerId(layer.id);
    setImageSelected(false);
  }

  function deleteSelectedImage() {
    if (selectedLayerId) {
      pushHistory();
      setImageLayers((current) => current.filter((layer) => layer.id !== selectedLayerId));
      setSelectedLayerId("");
      return;
    }
    if (!sourceRef.current || !imageVisible || !imageSelected) return;
    pushHistory();
    setImageSelected(false);
    setImageVisible(false);
  }

  useEffect(() => {
    function handleKeyDown(event) {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;
      const key = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && key === "z" && !isTyping) {
        event.preventDefault();
        undo();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && (key === "y" || (event.shiftKey && key === "z")) && !isTyping) {
        event.preventDefault();
        redo();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === "c" && !isTyping) {
        event.preventDefault();
        copySelectedImage();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && key === "v" && !isTyping) {
        event.preventDefault();
        pasteClipboardAsImage();
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && !isTyping) {
        event.preventDefault();
        if (activeTool === "cut") {
          cutSelection();
          return;
        }
        deleteSelectedImage();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTool, boardSize, imageBox, cropBox, selectionShape, freePath, exportSize, filters, canvasBackground, imageSelected, imageVisible, imageLayers, selectedLayerId, clipboard]);

  async function exportImage(type) {
    const out = composeCanvas({ x: 0, y: 0, w: boardSize.w, h: boardSize.h });
    if (!out) return;
    const blob = await blobFromCanvas(out, type, 0.92);
    downloadBlob(blob, `${name}.${type.split("/")[1]}`);
  }

  async function vectorize() {
    const source = sourceRef.current;
    if (!source) return;
    setBusy("Vectorizando");
    setError("");
    setVectorUrl("");
    try {
      const fullBoard = composeCanvas({ x: 0, y: 0, w: boardSize.w, h: boardSize.h });
      const blob = await blobFromCanvas(fullBoard, "image/png");
      const form = new FormData();
      form.append("image", blob, `${name}.png`);
      form.append("threshold", "180");
      form.append("turdSize", "80");
      form.append("color", "#101828");
      const response = await fetch(`${API}/api/vectorize`, { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudo vectorizar.");
      setVectorUrl(payload.url);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="workspace">
      <aside className="tool-rail" data-wizard="image-tools">
        <label className="file-button">
          <Upload size={18} />
          <span className="sr-only">Imagen</span>
          <input accept="image/*" onChange={(event) => loadImage(event.target.files?.[0])} type="file" />
        </label>
        <button data-tooltip="Deshacer" onClick={undo} disabled={!historyCounts.undo}>
          <Undo2 size={18} />
        </button>
        <button data-tooltip="Rehacer" onClick={redo} disabled={!historyCounts.redo}>
          <Redo2 size={18} />
        </button>
        <button className={activeTool === "select" ? "active-tool" : ""} data-tooltip="Seleccionar y mover" onClick={() => setActiveTool("select")}>
          <MousePointer2 size={18} />
        </button>
        <button className={activeTool === "erase" ? "active-tool" : ""} data-tooltip="Borrador" onClick={() => setActiveTool("erase")}>
          <Eraser size={18} />
        </button>
        <button className={activeTool === "clone" ? "active-tool" : ""} data-tooltip="Clonar" onClick={() => setActiveTool("clone")}>
          <Stamp size={18} />
        </button>
        <button className={activeTool === "cut" ? "active-tool" : ""} data-tooltip="Seleccion de corte" onClick={() => setActiveTool("cut")}>
          <Scissors size={18} />
        </button>
        <button className={activeTool === "magic" ? "active-tool" : ""} data-tooltip="Varita por color" onClick={() => setActiveTool("magic")}>
          <Wand2 size={18} />
        </button>
        <button data-tooltip="Quitar fondo" onClick={removeBackground}>
          <Palette size={18} />
        </button>
        <button data-tooltip="Rotar" onClick={rotate}>
          <RotateCw size={18} />
        </button>
        <button data-tooltip="Voltear" onClick={flip}>
          <FlipHorizontal size={18} />
        </button>
        <button data-tooltip="Aplicar corte" onClick={cutSelection}>
          <Check size={18} />
        </button>
        <button data-tooltip="Recortar imagen al crop" onClick={cropImageToSelection}>
          <ImageIcon size={18} />
        </button>
        <button data-tooltip="Pegar seleccion" onClick={pasteSelection} disabled={!clipboard}>
          <Crop size={18} />
        </button>
        <button data-tooltip="Vectorizar a SVG" onClick={vectorize}>
          <Wand2 size={18} />
        </button>
      </aside>

      <div className="stage" data-wizard="image-canvas">
        {sourceRef.current ? (
          <canvas
            className={[dragging ? `is-${dragging}` : "", activeTool === "cut" ? "is-cut-tool" : "", activeTool === "magic" ? "is-magic-tool" : ""]
              .filter(Boolean)
              .join(" ")}
            onPointerCancel={endPointerDrag}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endPointerDrag}
            ref={canvasRef}
            data-tooltip="Click para seleccionar. Arrastra para mover. Tijera dibuja el area de corte. Shift mantiene proporcion al escalar."
          />
        ) : (
          <div className="empty-state">
            <ImageIcon size={42} />
            <span>Subi una imagen para empezar</span>
          </div>
        )}
      </div>

      <aside className="control-panel" data-wizard="image-properties">
        <h2>Imagen</h2>
        <div className="tool-status">
          <strong>
            {activeTool === "erase"
              ? "Borrador"
              : activeTool === "clone"
                ? "Clonar"
                : activeTool === "cut"
                  ? "Corte"
                  : activeTool === "magic"
                    ? "Varita"
                    : "Seleccion"}
          </strong>
          {activeTool === "clone" && <span>{clonePoint ? "Origen listo" : "Primer click: origen"}</span>}
          {activeTool === "cut" && <span>Arrastra para marcar el area</span>}
          {activeTool === "magic" && <span>Click sobre un color para borrarlo</span>}
        </div>
        <div className="field-grid">
          <label>
            X
            <input value={editableImageBox.x} onChange={(event) => updateImageBox("x", event.target.value)} type="number" />
          </label>
          <label>
            Y
            <input value={editableImageBox.y} onChange={(event) => updateImageBox("y", event.target.value)} type="number" />
          </label>
          <label>
            Ancho
            <input value={editableImageBox.w} onChange={(event) => updateImageBox("w", event.target.value)} type="number" />
          </label>
          <label>
            Alto
            <input value={editableImageBox.h} onChange={(event) => updateImageBox("h", event.target.value)} type="number" />
          </label>
        </div>

        <h3>Herramienta</h3>
        <div className="button-row shape-tools">
          <button className={selectionShape === "rect" ? "active-tool" : ""} onClick={() => setSelectionShape("rect")} type="button">
            Cuadrado
          </button>
          <button className={selectionShape === "round" ? "active-tool" : ""} onClick={() => setSelectionShape("round")} type="button">
            Circulo
          </button>
          <button className={selectionShape === "free" ? "active-tool" : ""} onClick={() => setSelectionShape("free")} type="button">
            Libre
          </button>
        </div>
        <div className="button-row">
          <button className="secondary-button" onClick={cutSelection} type="button">
            Cortar seleccion
          </button>
          <button className="secondary-button" onClick={removeBackground} type="button">
            Quitar fondo
          </button>
        </div>
        <label className="range-row">
          Pincel
          <input
            max="160"
            min="4"
            onChange={(event) => setBrushSize(Number(event.target.value))}
            type="range"
            value={brushSize}
          />
          <span>{brushSize}</span>
        </label>
        <label className="range-row">
          Tolerancia
          <input
            max="120"
            min="1"
            onChange={(event) => setColorTolerance(Number(event.target.value))}
            type="range"
            value={colorTolerance}
          />
          <span>{colorTolerance}</span>
        </label>

        <h3>Retoque</h3>
        {Object.entries(filters).map(([key, value]) => (
          <label className="range-row" key={key}>
            {key}
            <input
              max={key === "blur" ? 12 : 200}
              min={0}
              onChange={(event) => setFilters((current) => ({ ...current, [key]: Number(event.target.value) }))}
              type="range"
              value={value}
            />
            <span>{value}</span>
          </label>
        ))}

        <h3>Resolucion</h3>
        <div className="field-grid">
          <label>
            Ancho
            <input value={exportSize.w} onChange={(event) => setExportSize((s) => ({ ...s, w: event.target.value }))} type="number" />
          </label>
          <label>
            Alto
            <input value={exportSize.h} onChange={(event) => setExportSize((s) => ({ ...s, h: event.target.value }))} type="number" />
          </label>
        </div>
        <button className="secondary-button" onClick={applyResize}>Aplicar resolucion</button>

        <h3>Lienzo</h3>
        <div className="field-grid">
          <label>
            Ancho
            <input value={boardSize.w} onChange={(event) => updateBoard("w", event.target.value)} type="number" />
          </label>
          <label>
            Alto
            <input value={boardSize.h} onChange={(event) => updateBoard("h", event.target.value)} type="number" />
          </label>
          <label>
            Img X
            <input value={imageBox.x} onChange={(event) => setImageBox((s) => ({ ...s, x: Number(event.target.value) || 0 }))} type="number" />
          </label>
          <label>
            Img Y
            <input value={imageBox.y} onChange={(event) => setImageBox((s) => ({ ...s, y: Number(event.target.value) || 0 }))} type="number" />
          </label>
        </div>
        <div className="button-row align-grid">
          <button data-tooltip="Alinear arriba" onClick={() => alignImage("current", "top")}>Arriba</button>
          <button data-tooltip="Centrar vertical" onClick={() => alignImage("current", "middle")}>Medio</button>
          <button data-tooltip="Alinear abajo" onClick={() => alignImage("current", "bottom")}>Abajo</button>
          <button data-tooltip="Alinear izquierda" onClick={() => alignImage("left", "current")}>Izq</button>
          <button data-tooltip="Centrar imagen" onClick={() => alignImage("center", "middle")}>Centro</button>
          <button data-tooltip="Alinear derecha" onClick={() => alignImage("right", "current")}>Der</button>
        </div>
        <div className="button-row">
          <button onClick={() => fitImageToBoard("contain")}>Ajustar</button>
          <button onClick={() => fitImageToBoard("cover")}>Cubrir</button>
          <button onClick={resizeBoardToImage}>Lienzo = img</button>
          <button onClick={setCropToBoard}>Crop = lienzo</button>
        </div>

        <h3>Fondo</h3>
        <div className="background-picker">
          <button className={canvasBackground === "checker" ? "active" : ""} onClick={() => setCanvasBackground("checker")} data-tooltip="Fondo transparente">
            <Palette size={16} />
            Actual
          </button>
          <button className={canvasBackground === "white" ? "active" : ""} onClick={() => setCanvasBackground("white")} data-tooltip="Fondo blanco">
            <span className="swatch white" />
            Blanco
          </button>
          <button className={canvasBackground === "black" ? "active" : ""} onClick={() => setCanvasBackground("black")} data-tooltip="Fondo negro">
            <span className="swatch black" />
            Negro
          </button>
        </div>

        <h3>Proyecto</h3>
        <div className="button-row project-actions">
          <button onClick={saveImageProject} disabled={!sourceRef.current}>
            <Download size={16} />
            Guardar
          </button>
          <button onClick={loadImageProject}>
            <Upload size={16} />
            Abrir
          </button>
          <button onClick={clearImageProject}>
            <Trash2 size={16} />
            Borrar
          </button>
        </div>
        {projectStatus && <p className="file-hint">{projectStatus}</p>}

        <h3>Exportar</h3>
        <div className="button-row">
          <button onClick={() => exportImage("image/png")}>
            <Download size={16} /> PNG
          </button>
          <button onClick={() => exportImage("image/jpeg")}>
            <Download size={16} /> JPG
          </button>
          <button onClick={() => exportImage("image/webp")}>
            <Download size={16} /> WebP
          </button>
        </div>

        {busy && <p className="status">{busy}...</p>}
        {error && <p className="panel-error">{error}</p>}
        {vectorUrl && (
          <a className="download-link" href={vectorUrl} download>
            Descargar SVG
          </a>
        )}
      </aside>
    </section>
  );
}

function DesignEditor({ templateRequest = null }) {
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const designFonts = [
    { name: "Inter", value: "Inter, Arial, sans-serif" },
    { name: "Arial", value: "Arial, sans-serif" },
    { name: "Helvetica", value: "Helvetica, Arial, sans-serif" },
    { name: "Montserrat", value: "Montserrat, Arial, sans-serif" },
    { name: "Poppins", value: "Poppins, Arial, sans-serif" },
    { name: "Roboto", value: "Roboto, Arial, sans-serif" },
    { name: "Georgia", value: "Georgia, serif" },
    { name: "Times", value: "'Times New Roman', serif" },
    { name: "Courier", value: "'Courier New', monospace" },
    { name: "Impact", value: "Impact, sans-serif" }
  ];
  const [board, setBoard] = useState({ w: 1080, h: 1080 });
  const [background, setBackground] = useState("#ffffff");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const selected = elements.find((item) => item.id === selectedId);

  useEffect(() => {
    if (!templateRequest) return;
    setBoard({ w: templateRequest.w || 1080, h: templateRequest.h || 1080 });
    setBackground(templateRequest.backgroundColor || "#ffffff");
    setBackgroundImage("");
    setElements([]);
    setSelectedId("");
  }, [templateRequest?.id]);

  useEffect(() => {
    function handleKeyDown(event) {
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault();
        deleteSelected();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  function pointFromDesignEvent(event) {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * board.w,
      y: ((event.clientY - rect.top) / rect.height) * board.h
    };
  }

  function updateSelected(patch) {
    if (!selectedId) return;
    setElements((current) => current.map((item) => (item.id === selectedId ? { ...item, ...patch } : item)));
  }

  function addText() {
    const item = {
      id: `text-${Date.now()}`,
      type: "text",
      x: Math.round(board.w * 0.18),
      y: Math.round(board.h * 0.22),
      text: "Texto",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: 72,
      fontWeight: 800,
      italic: false,
      letterSpacing: 0,
      lineHeight: 1.16,
      fill: "#a100ff",
      fill2: "#ff6a00",
      fillType: "solid",
      stroke: "none",
      strokeWidth: 0,
      opacity: 1,
      shadow: false,
      shadowColor: "#000000",
      shadowBlur: 18,
      shadowX: 10,
      shadowY: 10,
      rotation: 0,
      align: "left"
    };
    setElements((current) => [...current, item]);
    setSelectedId(item.id);
  }

  function addShape(type) {
    const item = {
      id: `${type}-${Date.now()}`,
      type,
      x: Math.round(board.w * 0.28),
      y: Math.round(board.h * 0.28),
      w: Math.round(board.w * 0.34),
      h: Math.round(board.h * 0.24),
      fill: type === "circle" ? "#a100ff" : "#111318",
      fill2: "#ff6a00",
      fillType: type === "line" || type === "curve" ? "none" : "solid",
      stroke: "#a100ff",
      strokeWidth: type === "line" || type === "curve" ? 10 : 4,
      opacity: 1,
      points: 5,
      innerRatio: 0.46,
      radius: 8,
      shadow: false,
      shadowColor: "#000000",
      shadowBlur: 18,
      shadowX: 10,
      shadowY: 10,
      curveBend: 0.65,
      rotation: 0,
      labelText: "",
      labelMode: "inside",
      labelFontFamily: "Inter, Arial, sans-serif",
      labelFontSize: 34,
      labelColor: "#ffffff",
      labelWeight: 700,
      labelSpacing: 0,
      labelOffset: 50,
      labelPathSide: "outside",
      labelPathDistance: 12
    };
    if (type === "circle") {
      const diameter = Math.round(Math.min(board.w, board.h) * 0.28);
      item.w = diameter;
      item.h = diameter;
    }
    if (type === "line") item.h = Math.round(board.h * 0.08);
    if (type === "curve") item.h = Math.round(board.h * 0.18);
    if (type === "star") item.fill = "#a100ff";
    setElements((current) => [...current, item]);
    setSelectedId(item.id);
  }

  function deleteSelected() {
    if (!selectedId) return;
    setElements((current) => current.filter((item) => item.id !== selectedId));
    setSelectedId("");
  }

  function duplicateSelected() {
    if (!selected) return;
    const copy = { ...selected, id: `${selected.type}-${Date.now()}`, x: selected.x + 32, y: selected.y + 32 };
    setElements((current) => [...current, copy]);
    setSelectedId(copy.id);
  }

  async function loadDesignBackground(file) {
    if (!file) return;
    setBackgroundImage(await fileToDataUrl(file));
  }

  function beginElementDrag(event, item) {
    event.stopPropagation();
    setSelectedId(item.id);
    const point = pointFromDesignEvent(event);
    dragRef.current = { id: item.id, mode: "move", start: point, item: { ...item }, x: item.x, y: item.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function beginDesignHandle(event, item, handle) {
    event.stopPropagation();
    setSelectedId(item.id);
    const box = selectionBox(item);
    const center = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
    const start = pointFromDesignEvent(event);
    dragRef.current = {
      id: item.id,
      mode: "handle",
      handle,
      start,
      startLocal: rotateDesignPoint(start, center, -(item.rotation || 0)),
      startAngle: Math.atan2(start.y - center.y, start.x - center.x) * 180 / Math.PI,
      center,
      item: { ...item },
      box
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function rotateDesignPoint(point, center, degrees) {
    const angle = degrees * Math.PI / 180;
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + dx * Math.cos(angle) - dy * Math.sin(angle),
      y: center.y + dx * Math.sin(angle) + dy * Math.cos(angle)
    };
  }

  function transformDesignItem(drag, point, preserveRatio = false) {
    const item = drag.item;
    if (drag.handle === "rotate") {
      const angle = Math.atan2(point.y - drag.center.y, point.x - drag.center.x) * 180 / Math.PI;
      let rotation = (item.rotation || 0) + angle - drag.startAngle;
      if (Math.abs(rotation) < 0.5) rotation = 0;
      return { rotation: Math.round(rotation * 10) / 10 };
    }

    const localPoint = rotateDesignPoint(point, drag.center, -(item.rotation || 0));
    const dx = localPoint.x - drag.startLocal.x;
    const dy = localPoint.y - drag.startLocal.y;

    if (item.type === "line") {
      if (drag.handle === "line-start") {
        const endX = item.x + item.w;
        const endY = item.y + item.h;
        return { x: Math.round(localPoint.x), y: Math.round(localPoint.y), w: Math.round(endX - localPoint.x), h: Math.round(endY - localPoint.y) };
      }
      return { w: Math.round(localPoint.x - item.x), h: Math.round(localPoint.y - item.y) };
    }

    if (item.type === "curve" && drag.handle === "curve-bend") {
      return { curveBend: clamp((localPoint.y - (item.y + item.h / 2)) / Math.max(1, item.h), -1.4, 1.4) };
    }

    if (item.type === "curve" && drag.handle === "line-start") {
      const endX = item.x + item.w;
      const endY = item.y;
      return { x: Math.round(localPoint.x), y: Math.round(endY), w: Math.round(endX - localPoint.x), h: Math.round(localPoint.y - endY) };
    }

    if (item.type === "curve" && drag.handle === "line-end") {
      const startY = item.y + item.h;
      return { y: Math.round(localPoint.y), w: Math.round(localPoint.x - item.x), h: Math.round(startY - localPoint.y) };
    }

    if (item.type === "text") {
      const scale = Math.max(0.2, Math.max((drag.box.w + dx) / Math.max(1, drag.box.w), (drag.box.h + dy) / Math.max(1, drag.box.h)));
      return { fontSize: Math.max(6, Math.round(item.fontSize * scale)) };
    }

    if (preserveRatio || item.type === "circle") {
      const horizontalChange = drag.handle.includes("e") ? dx : -dx;
      const verticalChange = drag.handle.includes("s") ? dy : -dy;
      const scaleX = (item.w + horizontalChange) / Math.max(1, item.w);
      const scaleY = (item.h + verticalChange) / Math.max(1, item.h);
      const scale = Math.max(12 / Math.max(1, item.w), 12 / Math.max(1, item.h), Math.abs(scaleX - 1) > Math.abs(scaleY - 1) ? scaleX : scaleY);
      const size = item.type === "circle" ? Math.max(12, Math.round(Math.min(item.w, item.h) * scale)) : null;
      const w = size ?? Math.max(12, Math.round(item.w * scale));
      const h = size ?? Math.max(12, Math.round(item.h * scale));
      return {
        x: drag.handle.includes("w") ? Math.round(item.x + item.w - w) : item.x,
        y: drag.handle.includes("n") ? Math.round(item.y + item.h - h) : item.y,
        w,
        h
      };
    }

    const left = drag.handle.includes("w") ? item.x + dx : item.x;
    const top = drag.handle.includes("n") ? item.y + dy : item.y;
    const right = drag.handle.includes("e") ? item.x + item.w + dx : item.x + item.w;
    const bottom = drag.handle.includes("s") ? item.y + item.h + dy : item.y + item.h;
    const nextLeft = Math.min(left, right - 12);
    const nextTop = Math.min(top, bottom - 12);
    return {
      x: Math.round(nextLeft),
      y: Math.round(nextTop),
      w: Math.max(12, Math.round(right - nextLeft)),
      h: Math.max(12, Math.round(bottom - nextTop))
    };
  }

  function moveElementDrag(event) {
    const drag = dragRef.current;
    if (!drag) return;
    const point = pointFromDesignEvent(event);
    setElements((current) =>
      current.map((item) =>
        item.id === drag.id
          ? drag.mode === "handle"
            ? { ...item, ...transformDesignItem(drag, point, event.shiftKey) }
            : { ...item, x: Math.round(drag.x + point.x - drag.start.x), y: Math.round(drag.y + point.y - drag.start.y) }
          : item
      )
    );
  }

  function endElementDrag(event) {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  }

  function renderText(item) {
    const anchor = item.align === "center" ? "middle" : item.align === "right" ? "end" : "start";
    const lines = String(item.text || "").split("\n");
    return (
      <text
        fill={item.fill}
        fontFamily={item.fontFamily}
        fontSize={item.fontSize}
        fontStyle={item.italic ? "italic" : "normal"}
        fontWeight={item.fontWeight}
        letterSpacing={item.letterSpacing || 0}
        textAnchor={anchor}
        x={item.x}
        y={item.y}
      >
        {lines.map((line, index) => (
          <tspan dy={index === 0 ? 0 : item.fontSize * (item.lineHeight || 1.16)} key={`${item.id}-${index}`} x={item.x}>
            {line}
          </tspan>
        ))}
      </text>
    );
  }

  function fillFor(item) {
    if (item.fillType === "none" || item.type === "line" || item.type === "curve") return "none";
    if (item.fillType === "linear") return `url(#fill-linear-${item.id})`;
    if (item.fillType === "radial") return `url(#fill-radial-${item.id})`;
    return item.fill || "#a100ff";
  }

  function strokeFor(item) {
    return item.stroke || "none";
  }

  function filterFor(item) {
    return item.shadow ? `url(#shadow-${item.id})` : undefined;
  }

  function starPath(item) {
    const cx = item.x + item.w / 2;
    const cy = item.y + item.h / 2;
    const outer = Math.min(item.w, item.h) / 2;
    const inner = outer * (item.innerRatio || 0.46);
    const points = Math.max(3, Number(item.points) || 5);
    return Array.from({ length: points * 2 }).map((_, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI) / points;
      const radius = index % 2 === 0 ? outer : inner;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ") + " Z";
  }

  function curvePath(item) {
    const x1 = item.x;
    const y1 = item.y + item.h;
    const x2 = item.x + item.w;
    const y2 = item.y;
    const bend = item.curveBend ?? 0.65;
    return `M ${x1} ${y1} C ${item.x + item.w * 0.28} ${item.y - item.h * bend}, ${item.x + item.w * 0.72} ${item.y + item.h * (1 + bend)}, ${x2} ${y2}`;
  }

  function shapeTextPath(item) {
    if (item.type === "circle") {
      const cx = item.x + item.w / 2;
      const cy = item.y + item.h / 2;
      const rx = Math.max(1, item.w / 2 - 8);
      const ry = Math.max(1, item.h / 2 - 8);
      return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy}`;
    }
    if (item.type === "star") return starPath(item);
    if (item.type === "line") return `M ${item.x} ${item.y} L ${item.x + item.w} ${item.y + item.h}`;
    if (item.type === "curve") return curvePath(item);
    const radius = Math.max(0, Math.min(item.radius || 0, item.w / 2, item.h / 2));
    return `M ${item.x + radius} ${item.y} H ${item.x + item.w - radius} Q ${item.x + item.w} ${item.y} ${item.x + item.w} ${item.y + radius} V ${item.y + item.h - radius} Q ${item.x + item.w} ${item.y + item.h} ${item.x + item.w - radius} ${item.y + item.h} H ${item.x + radius} Q ${item.x} ${item.y + item.h} ${item.x} ${item.y + item.h - radius} V ${item.y + radius} Q ${item.x} ${item.y} ${item.x + radius} ${item.y}`;
  }

  function renderShapeLabel(item, box) {
    if (!item.labelText) return null;
    const common = {
      fill: item.labelColor || "#ffffff",
      fontFamily: item.labelFontFamily || "Inter, Arial, sans-serif",
      fontSize: item.labelFontSize || 34,
      fontWeight: item.labelWeight || 700,
      letterSpacing: item.labelSpacing || 0,
      pointerEvents: "none"
    };
    if (item.labelMode === "path") {
      const pathDistance = Math.max(0, Number(item.labelPathDistance) || 0);
      const pathShift = item.labelPathSide === "inside" ? pathDistance : -pathDistance;
      return (
        <text {...common} dominantBaseline="central" dy={pathShift} textAnchor="middle">
          <textPath href={`#shape-text-path-${item.id}`} startOffset={`${item.labelOffset ?? 50}%`}>{item.labelText}</textPath>
        </text>
      );
    }
    return <text {...common} dominantBaseline="middle" textAnchor="middle" x={box.x + box.w / 2} y={box.y + box.h / 2}>{item.labelText}</text>;
  }

  function designHandles(item, box) {
    const rotateHandle = { id: "rotate", x: box.x + box.w / 2, y: box.y - 42, kind: "rotate" };
    if (item.type === "line") {
      return [
        { id: "line-start", x: item.x, y: item.y, kind: "round" },
        { id: "line-end", x: item.x + item.w, y: item.y + item.h, kind: "round" },
        rotateHandle
      ];
    }
    if (item.type === "curve") {
      return [
        { id: "line-start", x: item.x, y: item.y + item.h, kind: "round" },
        { id: "line-end", x: item.x + item.w, y: item.y, kind: "round" },
        { id: "curve-bend", x: item.x + item.w / 2, y: item.y + item.h / 2 + (item.curveBend || 0) * item.h * 0.3, kind: "diamond" },
        rotateHandle
      ];
    }
    return [
      { id: "nw", x: box.x, y: box.y },
      { id: "ne", x: box.x + box.w, y: box.y },
      { id: "sw", x: box.x, y: box.y + box.h },
      { id: "se", x: box.x + box.w, y: box.y + box.h },
      rotateHandle
    ];
  }

  function selectionBox(item) {
    if (item.type === "text") {
      const lines = String(item.text || "").split("\n");
      const longest = Math.max(...lines.map((line) => line.length), 1);
      const w = Math.max(160, longest * item.fontSize * 0.5);
      return {
        x: item.align === "center" ? item.x - w / 2 : item.align === "right" ? item.x - w : item.x,
        y: item.y - item.fontSize,
        w,
        h: Math.max(item.fontSize * 1.25, lines.length * item.fontSize * (item.lineHeight || 1.16))
      };
    }
    return {
      x: item.x,
      y: Math.min(item.y, item.y + item.h),
      w: Math.abs(item.w || 1),
      h: Math.abs(item.h || 1)
    };
  }

  function exportDesignSvg() {
    const svg = svgRef.current.cloneNode(true);
    svg.querySelectorAll(".design-selection").forEach((node) => node.remove());
    const source = new XMLSerializer().serializeToString(svg);
    downloadBlob(new Blob([source], { type: "image/svg+xml" }), "diseno.svg");
  }

  async function exportDesignPng() {
    const svg = svgRef.current.cloneNode(true);
    svg.querySelectorAll(".design-selection").forEach((node) => node.remove());
    const source = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }));
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = board.w;
    canvas.height = board.h;
    canvas.getContext("2d").drawImage(image, 0, 0);
    URL.revokeObjectURL(url);
    const blob = await blobFromCanvas(canvas, "image/png");
    downloadBlob(blob, "diseno.png");
  }

  async function saveDesignProject({ projectId = DESIGN_PROJECT_ID } = {}) {
    await putProject(`workspace:${projectId}:design`, {
      savedAt: new Date().toISOString(),
      board,
      background,
      backgroundImage,
      elements,
      selectedId
    });
    setProjectStatus("Diseno guardado");
    const svg = svgRef.current?.cloneNode(true);
    if (!svg) return { kind: "design", thumbnail: "" };
    svg.querySelectorAll(".design-selection").forEach((node) => node.remove());
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = board.w;
    canvas.height = board.h;
    canvas.getContext("2d").drawImage(image, 0, 0);
    URL.revokeObjectURL(url);
    return { kind: "design", thumbnail: canvasThumbnail(canvas) };
  }

  async function loadDesignProject({ projectId = DESIGN_PROJECT_ID } = {}) {
    const saved = await getProject(`workspace:${projectId}:design`);
    if (!saved) return;
    setBoard(saved.board || { w: 1080, h: 1080 });
    setBackground(saved.background || "#ffffff");
    setBackgroundImage(saved.backgroundImage || "");
    setElements(saved.elements || []);
    setSelectedId(saved.selectedId || "");
    setProjectStatus("Diseno abierto");
  }

  useWorkspacePersistence(saveDesignProject, loadDesignProject);

  return (
    <section className="design-workspace">
      <div className="design-stage" data-wizard="design-canvas">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${board.w} ${board.h}`}
          xmlns="http://www.w3.org/2000/svg"
          onPointerMove={moveElementDrag}
          onPointerUp={endElementDrag}
          onPointerCancel={endElementDrag}
          onPointerDown={() => setSelectedId("")}
        >
          <defs>
            {elements.map((item) => (
              <React.Fragment key={`defs-${item.id}`}>
                <linearGradient id={`fill-linear-${item.id}`} x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor={item.fill || "#a100ff"} />
                  <stop offset="100%" stopColor={item.fill2 || "#ff6a00"} />
                </linearGradient>
                <radialGradient id={`fill-radial-${item.id}`} cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor={item.fill || "#a100ff"} />
                  <stop offset="100%" stopColor={item.fill2 || "#ff6a00"} />
                </radialGradient>
                <filter id={`shadow-${item.id}`} x="-40%" y="-40%" width="180%" height="180%">
                  <feDropShadow dx={item.shadowX || 0} dy={item.shadowY || 0} stdDeviation={item.shadowBlur || 0} floodColor={item.shadowColor || "#000000"} floodOpacity="0.55" />
                </filter>
                {item.type !== "text" && <path d={shapeTextPath(item)} fill="none" id={`shape-text-path-${item.id}`} />}
              </React.Fragment>
            ))}
          </defs>
          <rect width={board.w} height={board.h} fill={background} />
          {backgroundImage && <image href={backgroundImage} width={board.w} height={board.h} preserveAspectRatio="xMidYMid meet" />}
          {elements.map((item) => {
            const box = selectionBox(item);
            return (
              <g key={item.id} onPointerDown={(event) => beginElementDrag(event, item)} className="design-item" filter={filterFor(item)} opacity={item.opacity ?? 1} transform={`rotate(${item.rotation || 0} ${box.x + box.w / 2} ${box.y + box.h / 2})`}>
                {item.type === "text" && React.cloneElement(renderText(item), { fill: fillFor(item), stroke: strokeFor(item), strokeWidth: item.strokeWidth || 0 })}
                {item.type === "rect" && <rect x={item.x} y={item.y} width={item.w} height={item.h} rx={item.radius || 0} fill={fillFor(item)} stroke={strokeFor(item)} strokeWidth={item.strokeWidth || 0} />}
                {item.type === "circle" && <ellipse cx={item.x + item.w / 2} cy={item.y + item.h / 2} rx={item.w / 2} ry={item.h / 2} fill={fillFor(item)} stroke={strokeFor(item)} strokeWidth={item.strokeWidth || 0} />}
                {item.type === "star" && <path d={starPath(item)} fill={fillFor(item)} stroke={strokeFor(item)} strokeLinejoin="round" strokeWidth={item.strokeWidth || 0} />}
                {item.type === "line" && <line x1={item.x} y1={item.y} x2={item.x + item.w} y2={item.y + item.h} stroke={strokeFor(item)} strokeLinecap="round" strokeWidth={item.strokeWidth || 8} />}
                {item.type === "curve" && <path d={curvePath(item)} fill="none" stroke={strokeFor(item)} strokeLinecap="round" strokeWidth={item.strokeWidth || 8} />}
                {item.type !== "text" && renderShapeLabel(item, box)}
                {selectedId === item.id && (
                  <>
                    <rect className="design-selection" x={box.x - 6} y={box.y - 6} width={box.w + 12} height={box.h + 12} fill="none" stroke="#a100ff" strokeDasharray="6 4" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                    <line className="design-selection" x1={box.x + box.w / 2} y1={box.y - 6} x2={box.x + box.w / 2} y2={box.y - 42} stroke="#a100ff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                    {designHandles(item, box).map((handle) => (
                      handle.kind === "rotate" ? (
                        <circle
                          className="design-selection design-handle design-rotate-handle"
                          cx={handle.x}
                          cy={handle.y}
                          fill="#ffffff"
                          key={handle.id}
                          onPointerDown={(event) => beginDesignHandle(event, item, handle.id)}
                          r="7"
                          stroke="#a100ff"
                          strokeWidth="2"
                          vectorEffect="non-scaling-stroke"
                        />
                      ) : handle.kind === "round" ? (
                        <circle
                          className="design-selection design-handle"
                          cx={handle.x}
                          cy={handle.y}
                          fill="#ffffff"
                          key={handle.id}
                          onPointerDown={(event) => beginDesignHandle(event, item, handle.id)}
                          r="6"
                          stroke="#a100ff"
                          strokeWidth="2"
                          vectorEffect="non-scaling-stroke"
                        />
                      ) : handle.kind === "diamond" ? (
                        <rect
                          className="design-selection design-handle"
                          fill="#ffffff"
                          height="12"
                          key={handle.id}
                          onPointerDown={(event) => beginDesignHandle(event, item, handle.id)}
                          stroke="#a100ff"
                          strokeWidth="2"
                          transform={`translate(${handle.x - 6} ${handle.y - 6}) rotate(45 6 6)`}
                          vectorEffect="non-scaling-stroke"
                          width="12"
                        />
                      ) : (
                        <rect
                          className="design-selection design-handle"
                          fill="#ffffff"
                          height="12"
                          key={handle.id}
                          onPointerDown={(event) => beginDesignHandle(event, item, handle.id)}
                          stroke="#a100ff"
                          strokeWidth="2"
                          vectorEffect="non-scaling-stroke"
                          width="12"
                          x={handle.x - 6}
                          y={handle.y - 6}
                        />
                      )
                    ))}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <aside className="control-panel" data-wizard="design-properties">
        <h2>Diseno</h2>
        <label className="drop-zone compact">
          <Upload size={18} />
          Foto de fondo
          <input accept="image/*" onChange={(event) => loadDesignBackground(event.target.files?.[0])} type="file" />
        </label>
        <div className="button-row" data-wizard="design-add">
          <button onClick={addText}><Type size={16} /> Texto</button>
          <button onClick={() => addShape("rect")}><Square size={16} /> Rectangulo</button>
          <button onClick={() => addShape("circle")}><Circle size={16} /> Circulo</button>
          <button onClick={() => addShape("line")}><Minus size={16} /> Linea</button>
          <button onClick={() => addShape("curve")}><Scissors size={16} /> Curva</button>
          <button onClick={() => addShape("star")}><Wand2 size={16} /> Estrella</button>
        </div>

        <h3>Lienzo</h3>
        <div className="field-grid">
          <label>Ancho<input value={board.w} onChange={(event) => setBoard((current) => ({ ...current, w: Number(event.target.value) || 1 }))} type="number" /></label>
          <label>Alto<input value={board.h} onChange={(event) => setBoard((current) => ({ ...current, h: Number(event.target.value) || 1 }))} type="number" /></label>
          <label>Fondo<input value={background} onChange={(event) => setBackground(event.target.value)} type="color" /></label>
        </div>

        {selected && (
          <>
            <h3>Elemento</h3>
            <div className="field-grid">
              <label>X<input value={selected.x} onChange={(event) => updateSelected({ x: Number(event.target.value) || 0 })} type="number" /></label>
              <label>Y<input value={selected.y} onChange={(event) => updateSelected({ y: Number(event.target.value) || 0 })} type="number" /></label>
              {selected.type !== "text" && (
                <>
                  <label>Ancho<input value={selected.w} onChange={(event) => {
                    const value = Number(event.target.value) || 1;
                    updateSelected(selected.type === "circle" ? { w: value, h: value } : { w: value });
                  }} type="number" /></label>
                  <label>Alto<input value={selected.h} onChange={(event) => {
                    const value = Number(event.target.value) || 1;
                    updateSelected(selected.type === "circle" ? { w: value, h: value } : { h: value });
                  }} type="number" /></label>
                </>
              )}
              <label>Rotacion<input value={selected.rotation || 0} onChange={(event) => updateSelected({ rotation: Number(event.target.value) || 0 })} step="1" type="number" /></label>
            </div>
            {selected.type === "text" && (
              <>
                <label>Texto<textarea value={selected.text} onChange={(event) => updateSelected({ text: event.target.value })} rows="3" /></label>
                <div className="field-grid">
                  <label>Fuente
                    <select value={selected.fontFamily} onChange={(event) => updateSelected({ fontFamily: event.target.value })}>
                      {designFonts.map((font) => <option key={font.name} value={font.value}>{font.name}</option>)}
                    </select>
                  </label>
                  <label>Tamano<input value={selected.fontSize} onChange={(event) => updateSelected({ fontSize: Number(event.target.value) || 1 })} type="number" /></label>
                  <label>Peso
                    <select value={selected.fontWeight || 400} onChange={(event) => updateSelected({ fontWeight: Number(event.target.value) })}>
                      <option value="200">Thin</option>
                      <option value="300">Light</option>
                      <option value="400">Regular</option>
                      <option value="600">Semi bold</option>
                      <option value="800">Bold</option>
                      <option value="900">Black</option>
                    </select>
                  </label>
                  <label>Tracking<input value={selected.letterSpacing || 0} onChange={(event) => updateSelected({ letterSpacing: Number(event.target.value) || 0 })} type="number" /></label>
                  <label>Interlinea<input value={selected.lineHeight || 1.16} onChange={(event) => updateSelected({ lineHeight: Number(event.target.value) || 1 })} step="0.05" type="number" /></label>
                  <label className="check-row"><input checked={Boolean(selected.italic)} onChange={(event) => updateSelected({ italic: event.target.checked })} type="checkbox" /> Italica</label>
                </div>
                <div className="button-row align-grid">
                  <button onClick={() => updateSelected({ align: "left" })}><AlignLeft size={16} /></button>
                  <button onClick={() => updateSelected({ align: "center" })}><AlignCenter size={16} /></button>
                  <button onClick={() => updateSelected({ align: "right" })}><AlignRight size={16} /></button>
                </div>
              </>
            )}
            {(selected.type === "rect" || selected.type === "star") && (
              <div className="field-grid">
                {selected.type === "rect" && <label>Radio<input value={selected.radius || 0} onChange={(event) => updateSelected({ radius: Number(event.target.value) || 0 })} type="number" /></label>}
                {selected.type === "star" && <label>Puntas<input min="3" value={selected.points || 5} onChange={(event) => updateSelected({ points: Number(event.target.value) || 5 })} type="number" /></label>}
                {selected.type === "star" && <label>Centro<input max="0.9" min="0.1" step="0.05" value={selected.innerRatio || 0.46} onChange={(event) => updateSelected({ innerRatio: Number(event.target.value) || 0.46 })} type="range" /></label>}
              </div>
            )}
            {selected.type === "curve" && (
              <label className="range-row">
                Curvatura
                <input max="1.4" min="-1.4" onChange={(event) => updateSelected({ curveBend: Number(event.target.value) })} step="0.05" type="range" value={selected.curveBend ?? 0.65} />
                <span>{Number(selected.curveBend ?? 0.65).toFixed(2)}</span>
              </label>
            )}
            {selected.type !== "text" && (
              <>
                <h3>Texto en figura</h3>
                <label>Contenido<textarea value={selected.labelText || ""} onChange={(event) => updateSelected({ labelText: event.target.value })} placeholder="Escribi sobre la figura" rows="2" /></label>
                <div className="field-grid">
                  <label>Disposicion
                    <select value={selected.labelMode || "inside"} onChange={(event) => updateSelected({ labelMode: event.target.value })}>
                      <option value="inside">Dentro</option>
                      <option value="path">Seguir contorno</option>
                    </select>
                  </label>
                  <label>Fuente
                    <select value={selected.labelFontFamily || designFonts[0].value} onChange={(event) => updateSelected({ labelFontFamily: event.target.value })}>
                      {designFonts.map((font) => <option key={`shape-${font.name}`} value={font.value}>{font.name}</option>)}
                    </select>
                  </label>
                  <label>Tamano<input min="6" value={selected.labelFontSize || 34} onChange={(event) => updateSelected({ labelFontSize: Number(event.target.value) || 6 })} type="number" /></label>
                  <label>Peso
                    <select value={selected.labelWeight || 700} onChange={(event) => updateSelected({ labelWeight: Number(event.target.value) })}>
                      <option value="300">Light</option>
                      <option value="400">Regular</option>
                      <option value="600">Semi bold</option>
                      <option value="700">Bold</option>
                      <option value="900">Black</option>
                    </select>
                  </label>
                  <label>Color<input value={selected.labelColor || "#ffffff"} onChange={(event) => updateSelected({ labelColor: event.target.value })} type="color" /></label>
                  <label>Tracking<input value={selected.labelSpacing || 0} onChange={(event) => updateSelected({ labelSpacing: Number(event.target.value) || 0 })} type="number" /></label>
                  {selected.labelMode === "path" && (
                    <>
                      <label>Lado del contorno
                        <select value={selected.labelPathSide || "outside"} onChange={(event) => updateSelected({ labelPathSide: event.target.value })}>
                          <option value="inside">Interior</option>
                          <option value="outside">Exterior</option>
                        </select>
                      </label>
                      <label>Distancia<input max="100" min="0" value={selected.labelPathDistance ?? 12} onChange={(event) => updateSelected({ labelPathDistance: Number(event.target.value) })} type="range" /></label>
                      <label>Posicion<input max="100" min="0" value={selected.labelOffset ?? 50} onChange={(event) => updateSelected({ labelOffset: Number(event.target.value) })} type="range" /></label>
                    </>
                  )}
                </div>
              </>
            )}
            <h3>Apariencia</h3>
            <div className="field-grid">
              <label>Relleno
                <select value={selected.fillType || "solid"} onChange={(event) => updateSelected({ fillType: event.target.value })}>
                  <option value="solid">Solido</option>
                  <option value="linear">Degrade lineal</option>
                  <option value="radial">Degrade radial</option>
                  <option value="none">Sin relleno</option>
                </select>
              </label>
              <label>Color 1<input value={selected.fill?.startsWith("#") ? selected.fill : "#a100ff"} onChange={(event) => updateSelected({ fill: event.target.value })} type="color" /></label>
              <label>Color 2<input value={selected.fill2?.startsWith("#") ? selected.fill2 : "#ff6a00"} onChange={(event) => updateSelected({ fill2: event.target.value })} type="color" /></label>
              <label>Opacidad<input max="1" min="0" onChange={(event) => updateSelected({ opacity: Number(event.target.value) })} step="0.05" type="range" value={selected.opacity ?? 1} /></label>
              <label>Trazo<input value={selected.stroke?.startsWith("#") ? selected.stroke : "#a100ff"} onChange={(event) => updateSelected({ stroke: event.target.value })} type="color" /></label>
              <label>Grosor<input value={selected.strokeWidth || 0} onChange={(event) => updateSelected({ strokeWidth: Number(event.target.value) || 0 })} type="number" /></label>
            </div>
            <h3>Sombra</h3>
            <label className="check-row"><input checked={Boolean(selected.shadow)} onChange={(event) => updateSelected({ shadow: event.target.checked })} type="checkbox" /> Sombra paralela</label>
            {selected.shadow && (
              <div className="field-grid">
                <label>Color<input value={selected.shadowColor || "#000000"} onChange={(event) => updateSelected({ shadowColor: event.target.value })} type="color" /></label>
                <label>Blur<input value={selected.shadowBlur || 0} onChange={(event) => updateSelected({ shadowBlur: Number(event.target.value) || 0 })} type="number" /></label>
                <label>X<input value={selected.shadowX || 0} onChange={(event) => updateSelected({ shadowX: Number(event.target.value) || 0 })} type="number" /></label>
                <label>Y<input value={selected.shadowY || 0} onChange={(event) => updateSelected({ shadowY: Number(event.target.value) || 0 })} type="number" /></label>
              </div>
            )}
            <div className="button-row">
              <button onClick={duplicateSelected}><Copy size={16} /> Duplicar</button>
              <button onClick={deleteSelected}><Trash2 size={16} /> Borrar</button>
            </div>
          </>
        )}

        <h3>Exportar</h3>
        <div className="button-row">
          <button onClick={exportDesignPng}><Download size={16} /> PNG</button>
          <button onClick={exportDesignSvg}><Download size={16} /> SVG</button>
        </div>
        {projectStatus && <p className="file-hint">{projectStatus}</p>}
      </aside>
    </section>
  );
}

function PdfEditor({ openProjectSignal = 0, templateRequest = null }) {
  const converterPagesRef = useRef([]);
  const [converterPages, setConverterPages] = useState([]);
  const [converterPdf, setConverterPdf] = useState(null);
  const [pdfToFormat, setPdfToFormat] = useState("png");
  const [pdfPageSize, setPdfPageSize] = useState("a4");
  const [pdfFit, setPdfFit] = useState("contain");
  const [pdfQuality, setPdfQuality] = useState(0.82);
  const [pdfMaxEdge, setPdfMaxEdge] = useState(1600);
  const [pdfScale, setPdfScale] = useState(1.5);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [draggedPageIndex, setDraggedPageIndex] = useState(null);
  const [pdfDragging, setPdfDragging] = useState(false);

  useEffect(() => {
    converterPagesRef.current = converterPages;
  }, [converterPages]);

  useEffect(() => () => converterPagesRef.current.forEach((page) => URL.revokeObjectURL(page.url)), []);

  useEffect(() => {
    const clearDragState = () => {
      setPdfDragging(false);
      setDraggedPageIndex(null);
    };
    window.addEventListener("dragend", clearDragState);
    window.addEventListener("drop", clearDragState);
    window.addEventListener("blur", clearDragState);
    return () => {
      window.removeEventListener("dragend", clearDragState);
      window.removeEventListener("drop", clearDragState);
      window.removeEventListener("blur", clearDragState);
    };
  }, []);

  function updatePdfPreset(value) {
    if (value === "print") {
      setPdfQuality(0.94);
      setPdfMaxEdge(2400);
    } else if (value === "small") {
      setPdfQuality(0.62);
      setPdfMaxEdge(1100);
    } else {
      setPdfQuality(0.82);
      setPdfMaxEdge(1600);
    }
  }

  function imageFilesFromList(files) {
    return Array.from(files || []).filter((file) => file.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(file.name));
  }

  function pagesFromFiles(files, offset = 0) {
    return imageFilesFromList(files).map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${offset + index}-${crypto.randomUUID?.() || Date.now()}`,
      file,
      rotation: 0,
      url: URL.createObjectURL(file)
    }));
  }

  function loadConverterImages(files) {
    const nextFiles = Array.from(files || []);
    setConverterPages((current) => {
      current.forEach((page) => URL.revokeObjectURL(page.url));
      return pagesFromFiles(nextFiles);
    });
  }

  function appendConverterImages(files) {
    const pages = pagesFromFiles(files, converterPagesRef.current.length);
    if (!pages.length) return;
    setConverterPages((current) => [...current, ...pages]);
    setProjectStatus(`${pages.length} hoja(s) agregadas`);
    setError("");
  }

  function handlePdfDragOver(event) {
    event.preventDefault();
    const types = Array.from(event.dataTransfer?.types || []);
    if (types.includes("application/x-studio-pdf-page") || draggedPageIndex !== null) {
      setPdfDragging(false);
      return;
    }
    if (types.includes("Files")) {
      setPdfDragging(true);
    }
  }

  function handlePdfDragLeave(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setPdfDragging(false);
  }

  function handlePdfDrop(event) {
    event.preventDefault();
    setPdfDragging(false);
    appendConverterImages(event.dataTransfer.files);
  }

  function moveConverterPage(index, direction) {
    setConverterPages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function moveConverterPageTo(fromIndex, toIndex) {
    if (fromIndex === null || fromIndex === toIndex) return;
    setConverterPages((current) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= current.length || toIndex >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function beginPageDrag(event, index) {
    if (event.target.closest("button")) {
      event.preventDefault();
      return;
    }
    event.stopPropagation();
    setDraggedPageIndex(index);
    setPdfDragging(false);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
    event.dataTransfer.setData("application/x-studio-pdf-page", String(index));
  }

  function endPageDrag() {
    setDraggedPageIndex(null);
    setPdfDragging(false);
  }

  function dropPage(event, index) {
    event.preventDefault();
    event.stopPropagation();
    const from = draggedPageIndex ?? Number(event.dataTransfer.getData("text/plain"));
    moveConverterPageTo(from, index);
    endPageDrag();
  }

  function removeConverterPage(index) {
    setConverterPages((current) => {
      const removed = current[index];
      if (removed) URL.revokeObjectURL(removed.url);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  function rotateConverterPage(index) {
    setConverterPages((current) =>
      current.map((page, itemIndex) =>
        itemIndex === index ? { ...page, rotation: ((page.rotation || 0) + 90) % 360 } : page
      )
    );
  }

  function duplicateConverterPage(index) {
    setConverterPages((current) => {
      const page = current[index];
      if (!page) return current;
      const copy = {
        ...page,
        id: `${page.file.name}-${page.file.lastModified}-copy-${crypto.randomUUID?.() || Date.now()}`,
        url: URL.createObjectURL(page.file)
      };
      const next = [...current];
      next.splice(index + 1, 0, copy);
      return next;
    });
  }

  async function savePdfProject() {
    setBusy("Guardando proyecto PDF");
    setError("");
    try {
      await putProject(PDF_PROJECT_ID, {
        savedAt: new Date().toISOString(),
        pages: converterPages.map(({ file, rotation }) => ({ file, rotation })),
        converterPdf,
        pdfToFormat,
        pdfPageSize,
        pdfFit,
        pdfQuality,
        pdfMaxEdge,
        pdfScale
      });
      setProjectStatus("Proyecto PDF guardado");
    } catch (caught) {
      setError(caught.message || "No se pudo guardar el proyecto PDF.");
    } finally {
      setBusy("");
    }
  }

  async function loadPdfProject() {
    setBusy("Abriendo proyecto PDF");
    setError("");
    try {
      const saved = await getProject(PDF_PROJECT_ID);
      if (!saved) {
        setProjectStatus("");
        setError("No hay proyecto PDF guardado.");
        return;
      }
      setConverterPages((current) => {
        current.forEach((page) => URL.revokeObjectURL(page.url));
        return (saved.pages || []).map(({ file, rotation }, index) => ({
          id: `${file.name}-${file.lastModified}-${index}-${crypto.randomUUID?.() || Date.now()}`,
          file,
          rotation: rotation || 0,
          url: URL.createObjectURL(file)
        }));
      });
      setConverterPdf(saved.converterPdf || null);
      setPdfToFormat(saved.pdfToFormat || "png");
      setPdfPageSize(saved.pdfPageSize || "a4");
      setPdfFit(saved.pdfFit || "contain");
      setPdfQuality(saved.pdfQuality || 0.82);
      setPdfMaxEdge(saved.pdfMaxEdge || 1600);
      setPdfScale(saved.pdfScale || 1.5);
      setProjectStatus("Proyecto PDF abierto");
    } catch (caught) {
      setError(caught.message || "No se pudo abrir el proyecto PDF.");
    } finally {
      setBusy("");
    }
  }

  async function clearPdfProject() {
    await deleteProject(PDF_PROJECT_ID);
    converterPagesRef.current.forEach((page) => URL.revokeObjectURL(page.url));
    setConverterPages([]);
    setConverterPdf(null);
    setDraggedPageIndex(null);
    setPdfDragging(false);
    setProjectStatus("Proyecto PDF eliminado");
  }

  async function savePdfWorkspace({ projectId }) {
    await putProject(`workspace:${projectId}:pdf`, {
      savedAt: new Date().toISOString(),
      pages: converterPages.map(({ file, rotation }) => ({ file, rotation })),
      converterPdf, pdfToFormat, pdfPageSize, pdfFit, pdfQuality, pdfMaxEdge, pdfScale
    });
    const previewCanvas = converterPages[0] ? await pdfPageToCanvas(converterPages[0], 320) : null;
    return { kind: "pdf", thumbnail: canvasThumbnail(previewCanvas) };
  }

  async function loadPdfWorkspace({ projectId }) {
    const saved = await getProject(`workspace:${projectId}:pdf`);
    if (!saved) return;
    setConverterPages((current) => {
      current.forEach((page) => URL.revokeObjectURL(page.url));
      return (saved.pages || []).map(({ file, rotation }, index) => ({
        id: `${file.name}-${file.lastModified}-${index}-${crypto.randomUUID?.() || Date.now()}`,
        file, rotation: rotation || 0, url: URL.createObjectURL(file)
      }));
    });
    setConverterPdf(saved.converterPdf || null);
    setPdfToFormat(saved.pdfToFormat || "png");
    setPdfPageSize(saved.pdfPageSize || "a4");
    setPdfFit(saved.pdfFit || "contain");
    setPdfQuality(saved.pdfQuality || 0.82);
    setPdfMaxEdge(saved.pdfMaxEdge || 1600);
    setPdfScale(saved.pdfScale || 1.5);
  }

  useWorkspacePersistence(savePdfWorkspace, loadPdfWorkspace);

  useEffect(() => {
    if (openProjectSignal) loadPdfProject();
  }, [openProjectSignal]);

  useEffect(() => {
    if (!templateRequest) return;
    setPdfPageSize(templateRequest.pageSize || "a4");
    setPdfFit(templateRequest.fit || "contain");
    setPdfQuality(templateRequest.quality || 0.82);
    setPdfMaxEdge(templateRequest.maxEdge || 1600);
    setProjectStatus(`Plantilla ${templateRequest.name} lista`);
  }, [templateRequest?.id]);

  async function convertImagesToPdf() {
    if (!converterPages.length) return;
    setBusy("Armando PDF");
    setError("");
    try {
      const canvases = [];
      for (const page of converterPages) {
        canvases.push(await pdfPageToCanvas(page, pdfMaxEdge));
      }
      const pdf = await createPdfFromCanvases(canvases, {
        fit: pdfFit,
        maxEdge: pdfMaxEdge,
        pageSize: pdfPageSize,
        quality: pdfQuality
      });
      downloadBlob(pdf, `imagenes-${converterPages.length}-paginas.pdf`);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy("");
    }
  }

  async function convertPdfToImages() {
    if (!converterPdf) return;
    setBusy("Renderizando PDF");
    setError("");
    try {
      const pdfjsLib = await loadPdfRenderer();
      const data = await converterPdf.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      const mime = pdfToFormat === "jpg" ? "image/jpeg" : "image/png";
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: pdfScale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        const blob = await blobFromCanvas(canvas, mime, pdfQuality);
        downloadBlob(blob, `${converterPdf.name.replace(/\.pdf$/i, "")}-pagina-${pageNumber}.${pdfToFormat}`);
      }
    } catch (caught) {
      setError(caught.message || "No se pudo convertir el PDF.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section
      className={pdfDragging ? "pdf-workspace is-dropping" : "pdf-workspace"}
      onDragLeave={handlePdfDragLeave}
      onDragOver={handlePdfDragOver}
      onDrop={handlePdfDrop}
    >
      {pdfDragging && (
        <div className="pdf-drop-overlay">
          <Upload size={28} />
          <strong>Solta las imagenes para sumarlas al PDF</strong>
        </div>
      )}
      <div className="pdf-preview-stage" data-wizard="pdf-pages">
        <div className="pdf-stage-heading">
          <div>
            <h2>Organizar paginas</h2>
            <span>{converterPages.length ? `${converterPages.length} hojas - arrastra para reordenar` : "Agrega imagenes para comenzar"}</span>
          </div>
          <label className="pdf-add-pages">
            <Upload size={16} /> Agregar imagenes
            <input multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => loadConverterImages(event.target.files)} type="file" />
          </label>
        </div>
        {converterPages.length ? (
          <div className="pdf-sheet-grid">
            {converterPages.map((page, index) => (
              <div
                className={draggedPageIndex === index ? "pdf-sheet is-dragging" : "pdf-sheet"}
                draggable
                key={page.id}
                onDragEnd={endPageDrag}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={(event) => beginPageDrag(event, index)}
                onDrop={(event) => dropPage(event, index)}
              >
                <span>{index + 1}</span>
                <img alt="" src={page.url} style={{ transform: `rotate(${page.rotation || 0}deg)` }} />
                <strong>{page.file.name}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={46} />
            <span>Carga imagenes para ordenar las hojas del PDF</span>
          </div>
        )}
      </div>

      <aside className="control-panel" data-wizard="pdf-properties">
        <h2>PDF</h2>
        <label className="drop-zone compact">
          <Upload size={18} />
          Imagenes a PDF
          <input multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => loadConverterImages(event.target.files)} type="file" />
        </label>
        {converterPages.length ? (
          <div className="pdf-page-preview">
            {converterPages.map((page, index) => (
              <div
                className={draggedPageIndex === index ? "pdf-page-item is-dragging" : "pdf-page-item"}
                draggable
                key={page.id}
                onDragEnd={endPageDrag}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={(event) => beginPageDrag(event, index)}
                onDrop={(event) => dropPage(event, index)}
              >
                <img alt="" src={page.url} style={{ transform: `rotate(${page.rotation || 0}deg)` }} />
                <div>
                  <strong>Hoja {index + 1}</strong>
                  <span>{page.file.name}</span>
                </div>
                <div className="pdf-page-actions" onPointerDown={(event) => event.stopPropagation()}>
                  <button disabled={index === 0} onClick={(event) => { event.stopPropagation(); moveConverterPage(index, -1); }} data-tooltip="Mover antes" type="button"><ChevronLeft size={16} /></button>
                  <button disabled={index === converterPages.length - 1} onClick={(event) => { event.stopPropagation(); moveConverterPage(index, 1); }} data-tooltip="Mover despues" type="button"><ChevronRight size={16} /></button>
                  <button onClick={(event) => { event.stopPropagation(); rotateConverterPage(index); }} data-tooltip="Rotar hoja" type="button"><RotateCw size={15} /></button>
                  <button onClick={(event) => { event.stopPropagation(); duplicateConverterPage(index); }} data-tooltip="Duplicar hoja" type="button"><Copy size={15} /></button>
                  <button onClick={(event) => { event.stopPropagation(); removeConverterPage(index); }} data-tooltip="Quitar hoja" type="button"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {converterPages.length ? <p className="file-hint">{converterPages.length} hojas listas para el PDF</p> : null}

        <h3>Salida</h3>
        <div className="field-grid">
          <label>
            Optimizacion
            <select onChange={(event) => updatePdfPreset(event.target.value)} defaultValue="balanced">
              <option value="balanced">Equilibrado</option>
              <option value="print">Alta calidad</option>
              <option value="small">Archivo chico</option>
            </select>
          </label>
          <label>
            Pagina
            <select value={pdfPageSize} onChange={(event) => setPdfPageSize(event.target.value)}>
              <option value="a4">A4 vertical</option>
              <option value="a4-landscape">A4 horizontal</option>
              <option value="square">Cuadrada</option>
              <option value="source">Tamano imagen</option>
            </select>
          </label>
          <label>
            Ajuste
            <select value={pdfFit} onChange={(event) => setPdfFit(event.target.value)}>
              <option value="contain">Entrar completa</option>
              <option value="cover">Cubrir pagina</option>
            </select>
          </label>
        </div>
        <label className="range-row">
          Calidad
          <input max="0.98" min="0.35" onChange={(event) => setPdfQuality(Number(event.target.value))} step="0.01" type="range" value={pdfQuality} />
          <span>{Math.round(pdfQuality * 100)}</span>
        </label>
        <label className="range-row">
          Max px
          <input max="3200" min="600" onChange={(event) => setPdfMaxEdge(Number(event.target.value))} step="100" type="range" value={pdfMaxEdge} />
          <span>{pdfMaxEdge}</span>
        </label>
        <button className="secondary-button" onClick={convertImagesToPdf} disabled={!converterPages.length}>
          <Download size={16} />
          Crear PDF multipagina
        </button>

        <h3>PDF a imagenes</h3>
        <div className="field-grid">
          <label>
            Convertir a
            <select value={pdfToFormat} onChange={(event) => setPdfToFormat(event.target.value)}>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
          </label>
          <label>
            Escala
            <input max="3" min="0.75" onChange={(event) => setPdfScale(Number(event.target.value))} step="0.25" type="number" value={pdfScale} />
          </label>
        </div>
        <label className="drop-zone compact">
          <Upload size={18} />
          PDF a imagenes
          <input accept="application/pdf,.pdf" onChange={(event) => setConverterPdf(event.target.files?.[0] || null)} type="file" />
        </label>
        {converterPdf ? <p className="file-hint">{converterPdf.name}</p> : null}
        <button className="secondary-button" onClick={convertPdfToImages} disabled={!converterPdf}>
          <Download size={16} />
          Convertir PDF
        </button>
        {busy && <p className="status">{busy}...</p>}
        {error && <p className="panel-error">{error}</p>}
      </aside>
    </section>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("studio:user") || "";
    return isAllowedEmail(saved) ? saved : "";
  });
  const [tab, setTab] = useState("home");
  const [openSignals, setOpenSignals] = useState({ image: 0, pdf: 0, video: 0 });
  const [imageTemplate, setImageTemplate] = useState(null);
  const [designTemplate, setDesignTemplate] = useState(null);
  const [pdfTemplate, setPdfTemplate] = useState(null);
  const [videoTemplate, setVideoTemplate] = useState(null);
  const [wizardScreen, setWizardScreen] = useState("");
  const [workspaceStatus, setWorkspaceStatus] = useState("");
  const [projects, setProjects] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(WORKSPACE_PROJECTS_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [currentProjectId, setCurrentProjectId] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!localStorage.getItem(`${WIZARD_SEEN_PREFIX}${tab}`)) {
      setWizardScreen(tab);
    }
  }, [tab, user]);

  useEffect(() => {
    if (!workspaceStatus || workspaceStatus.endsWith("...")) return undefined;
    const timer = setTimeout(() => setWorkspaceStatus(""), 2800);
    return () => clearTimeout(timer);
  }, [workspaceStatus]);

  if (!user) return <LoginView onLogin={setUser} />;

  function openRecent(kind) {
    setTab(kind);
    setOpenSignals((current) => ({ ...current, [kind]: current[kind] + 1 }));
  }

  function createProject(kind) {
    setTab(kind);
  }

  function useTemplate(kind, template) {
    const nextTemplate = { ...template, id: Date.now() };
    setTab(kind);
    if (kind === "image") setImageTemplate(nextTemplate);
    if (kind === "design") setDesignTemplate(nextTemplate);
    if (kind === "pdf") setPdfTemplate(nextTemplate);
    if (kind === "video") setVideoTemplate(nextTemplate);
  }

  function storeProjects(next) {
    const sorted = [...next].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    setProjects(sorted);
    localStorage.setItem(WORKSPACE_PROJECTS_KEY, JSON.stringify(sorted));
  }

  async function saveWorkspace(name, existingId = "") {
    setWorkspaceStatus("Guardando espacio de trabajo...");
    const projectId = existingId || crypto.randomUUID?.() || `project-${Date.now()}`;
    const detail = { tasks: [], projectId };
    window.dispatchEvent(new CustomEvent("studio:workspace-save", { detail }));
    const results = await Promise.allSettled(detail.tasks);
    const failed = results.find((result) => result.status === "rejected");
    if (failed) {
      setWorkspaceStatus(`No se pudo guardar: ${failed.reason?.message || "error de almacenamiento"}`);
      return;
    }
    const previews = results.filter((result) => result.status === "fulfilled").map((result) => result.value).filter(Boolean);
    const thumbnail = previews.find((result) => result.kind === tab)?.thumbnail || previews.find((result) => result.thumbnail)?.thumbnail || "";
    const project = { id: projectId, name, tab, savedAt: new Date().toISOString(), thumbnail };
    storeProjects([...projects.filter((item) => item.id !== projectId), project]);
    setCurrentProjectId(projectId);
    setSaveDialogOpen(false);
    setWorkspaceStatus(existingId ? "Proyecto actualizado" : "Proyecto guardado");
  }

  async function loadWorkspace(project) {
    setWorkspaceStatus("Abriendo espacio de trabajo...");
    const detail = { tasks: [], projectId: project.id };
    window.dispatchEvent(new CustomEvent("studio:workspace-load", { detail }));
    const results = await Promise.allSettled(detail.tasks);
    const failed = results.find((result) => result.status === "rejected");
    if (failed) {
      setWorkspaceStatus(`No se pudo abrir: ${failed.reason?.message || "error de almacenamiento"}`);
      return;
    }
    setCurrentProjectId(project.id);
    setTab(project.tab || "home");
    setWorkspaceStatus(`Proyecto ${project.name} abierto`);
  }

  function renameWorkspace(project) {
    const name = window.prompt("Nuevo nombre del proyecto", project.name)?.trim();
    if (!name) return;
    storeProjects(projects.map((item) => item.id === project.id ? { ...item, name } : item));
  }

  async function duplicateWorkspace(project) {
    const id = crypto.randomUUID?.() || `project-${Date.now()}`;
    await Promise.all(["image", "design", "pdf", "video"].map(async (kind) => {
      const value = await getProject(`workspace:${project.id}:${kind}`);
      if (value) await putProject(`workspace:${id}:${kind}`, value);
    }));
    storeProjects([...projects, { ...project, id, name: `${project.name} copia`, savedAt: new Date().toISOString() }]);
    setWorkspaceStatus("Proyecto duplicado");
  }

  async function deleteWorkspace(project) {
    if (!window.confirm(`Eliminar el proyecto "${project.name}"?`)) return;
    await Promise.all(["image", "design", "pdf", "video"].map((kind) => deleteProject(`workspace:${project.id}:${kind}`)));
    storeProjects(projects.filter((item) => item.id !== project.id));
    if (currentProjectId === project.id) setCurrentProjectId("");
    setWorkspaceStatus("Proyecto eliminado");
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <strong className="header-brand">
            <img alt="" src={logo} />
            Interbanking Studio
          </strong>
          <span>{user}</span>
        </div>
        <nav className="tabs">
          <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")}>
            <Square size={17} /> Inicio
          </button>
          <button className={tab === "image" ? "active" : ""} onClick={() => setTab("image")}>
            <ImageIcon size={17} /> Imagen
          </button>
          <button className={tab === "design" ? "active" : ""} onClick={() => setTab("design")}>
            <Type size={17} /> Diseno
          </button>
          <button className={tab === "pdf" ? "active" : ""} onClick={() => setTab("pdf")}>
            <FileText size={17} /> PDF
          </button>
          <button className={tab === "video" ? "active" : ""} onClick={() => setTab("video")}>
            <Film size={17} /> Video
          </button>
        </nav>
        <div className="header-actions">
          <button className="icon-button" data-tooltip="Guardar proyecto" onClick={() => setSaveDialogOpen(true)}>
            <Save size={18} />
          </button>
          <button className="icon-button" data-tooltip="Ver proyectos guardados" onClick={() => setTab("home")}>
            <Upload size={18} />
          </button>
          <button
            className="icon-button"
            data-tooltip="Ver wizard"
            onClick={() => setWizardScreen(tab)}
          >
            <CircleHelp size={18} />
          </button>
          <button
            className="icon-button"
            data-tooltip="Salir"
            onClick={() => {
              localStorage.removeItem("studio:user");
              setUser("");
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      {workspaceStatus && <div className="workspace-status" role="status">{workspaceStatus}</div>}
      <div className="editor-stack">
        <div className={tab === "home" ? "editor-pane" : "editor-pane is-hidden"}>
          <DashboardView
            onCreate={createProject}
            onDeleteProject={deleteWorkspace}
            onDuplicateProject={duplicateWorkspace}
            onOpenProject={loadWorkspace}
            onRenameProject={renameWorkspace}
            onTemplate={useTemplate}
            projects={projects}
          />
        </div>
        <div className={tab === "image" ? "editor-pane" : "editor-pane is-hidden"}>
          <ImageEditor openProjectSignal={openSignals.image} templateRequest={imageTemplate} />
        </div>
        <div className={tab === "design" ? "editor-pane" : "editor-pane is-hidden"}>
          <DesignEditor templateRequest={designTemplate} />
        </div>
        <div className={tab === "pdf" ? "editor-pane" : "editor-pane is-hidden"}>
          <PdfEditor openProjectSignal={openSignals.pdf} templateRequest={pdfTemplate} />
        </div>
        <div className={tab === "video" ? "editor-pane" : "editor-pane is-hidden"}>
          <VideoEditor
            active={tab === "video"}
            onRequestProjectSave={() => setSaveDialogOpen(true)}
            onShowProjects={() => setTab("home")}
            openProjectSignal={openSignals.video}
            templateRequest={videoTemplate}
          />
        </div>
      </div>
      <CustomTooltip />
      {saveDialogOpen && (
        <ProjectSaveDialogView
          canUpdate={Boolean(currentProjectId)}
          defaultName={projects.find((project) => project.id === currentProjectId)?.name || `Proyecto ${projects.length + 1}`}
          onClose={() => setSaveDialogOpen(false)}
          onSave={(name) => saveWorkspace(name)}
          onUpdate={(name) => saveWorkspace(name, currentProjectId)}
        />
      )}
      {wizardScreen && <Wizard screen={wizardScreen} onClose={() => setWizardScreen("")} />}
    </main>
  );
}
