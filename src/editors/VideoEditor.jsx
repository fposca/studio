import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, ArrowDownToLine, ArrowUpToLine, Captions, Check, ChevronDown, ChevronUp, Copy, Download, Eye, EyeOff, FileAudio, Film, Languages, Loader2, Maximize2, Merge, Minimize2, Minus, Music2, Pause, Play, Plus, Redo2, Save, Scaling, Scissors, SkipBack, SkipForward, SlidersHorizontal, Square, Trash2, Type, Undo2, Upload, VolumeX } from "lucide-react";
import { deleteProject, getProject, putProject } from "../storage/projectDb";

const API = window.location.port === "5173" ? "http://127.0.0.1:5174" : window.location.origin;
const MAX_VIDEO_MB = 100;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
const VIDEO_PROJECT_ID = "video";
const VIDEO_CANVAS_PRESETS = [
  { id: "1080:1920", name: "Historia / Reel", ratio: "9 / 16" },
  { id: "1080:1350", name: "Publicacion", ratio: "4 / 5" },
  { id: "1080:1080", name: "Cuadrado", ratio: "1 / 1" },
  { id: "1920:1080", name: "Horizontal", ratio: "16 / 9" }
];
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
const FONT_WEIGHT_LABELS = { 100: "Hairline", 200: "Thin", 300: "Light", 400: "Regular", 500: "Medium", 600: "Semi bold", 700: "Bold", 800: "Heavy", 900: "Black" };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const subtitleTime = (value = "") => {
  const match = String(value).trim().match(/(?:(\d+):)?(\d{1,2}):(\d{2})[,.](\d{1,3})/);
  if (!match) return null;
  return Number(match[1] || 0) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4].padEnd(3, "0")) / 1000;
};
const parseSubtitleFile = (source = "") => String(source)
  .replace(/^WEBVTT[^\n]*\n+/i, "")
  .split(/\r?\n\s*\r?\n/)
  .map((block) => {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex < 0) return null;
    const [rawStart, rawEnd] = lines[timingIndex].split("-->").map((part) => part.trim().split(/\s+/)[0]);
    const start = subtitleTime(rawStart);
    const end = subtitleTime(rawEnd);
    const text = lines.slice(timingIndex + 1).join("\n").replace(/<[^>]+>/g, "").trim();
    return start === null || end === null || end <= start || !text ? null : { start, end, text };
  })
  .filter(Boolean);

function subtitleText(item, mode = "es") {
  if (!item?.subtitle) return item?.text || "";
  const spanish = String(item.textEs || "").trim();
  const english = String(item.textEn || "").trim();
  if (mode === "en") return english || spanish;
  if (mode === "bilingual") return [spanish, english].filter(Boolean).join("\n");
  return spanish || english;
}

function wrapTextForExport(value, fontSize, boxWidth, width, height, fontFamily, fontWeight, italic) {
  const pixelSize = Math.max(10, fontSize * height / 1080);
  const maxWidth = width * boxWidth / 100;
  const context = document.createElement("canvas").getContext("2d");
  context.font = `${italic ? "italic " : ""}${fontWeight || 400} ${pixelSize}px ${fontFamily || "Arial, sans-serif"}`;
  const lines = String(value || "").split(/\r?\n/).flatMap((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [""];
    const paragraphLines = [];
    let line = "";
    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) {
        paragraphLines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });
    if (line) paragraphLines.push(line);
    return paragraphLines;
  });
  return { text: lines.join("\n"), lines: Math.max(1, lines.length) };
}

function formatElapsed(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function formatSubtitleTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const wholeSeconds = Math.floor(safe % 60);
  const milliseconds = Math.round((safe - Math.floor(safe)) * 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")},${String(milliseconds).padStart(3, "0")}`;
}
function useWorkspacePersistence(saveHandler, loadHandler) {
  const handlersRef = useRef({ saveHandler, loadHandler });
  handlersRef.current = { saveHandler, loadHandler };
  useEffect(() => {
    const save = (event) => event.detail.tasks.push(Promise.resolve(handlersRef.current.saveHandler(event.detail)));
    const load = (event) => event.detail.tasks.push(Promise.resolve(handlersRef.current.loadHandler(event.detail)));
    window.addEventListener("studio:workspace-save", save);
    window.addEventListener("studio:workspace-load", load);
    return () => { window.removeEventListener("studio:workspace-save", save); window.removeEventListener("studio:workspace-load", load); };
  }, []);
}

export default function VideoEditor({ active = false, openProjectSignal = 0, templateRequest = null, onRequestProjectSave, onShowProjects }) {
  const previewRef = useRef(null);
  const externalAudioRef = useRef(null);
  const pixelCanvasRef = useRef(null);
  const trimRef = useRef(null);
  const clipDragRef = useRef(null);
  const playheadDragRef = useRef(false);
  const timelineTimeRef = useRef(0);
  const activeClipRef = useRef("");
  const previewSwitchRef = useRef(0);
  const previewTransformRef = useRef(null);
  const textDragRef = useRef(null);
  const timelineTextDragRef = useRef(null);
  const pendingAudioRetimingRef = useRef(null);
  const undoHistoryRef = useRef([]);
  const redoHistoryRef = useRef([]);
  const lastHistoryStateRef = useRef(null);
  const restoringHistoryRef = useRef(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [clips, setClips] = useState([]);
  const [selectedClipId, setSelectedClipId] = useState("");
  const [textOverlays, setTextOverlays] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState("");
  const [subtitleDisplay, setSubtitleDisplay] = useState("bilingual");
  const [subtitleImportLanguage, setSubtitleImportLanguage] = useState("en");
  const [subtitleScript, setSubtitleScript] = useState("");
  const [audioDuration, setAudioDuration] = useState(0);
  const [subtitleStyle, setSubtitleStyle] = useState({ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: 44, color: "#ffffff", shadowColor: "#000000", boxWidth: 80, italic: false, translationFontFamily: "Georgia, serif", translationFontWeight: 400, translationFontSize: 30, translationColor: "#8fe7ff", translationItalic: true });
  const [selectedEffectId, setSelectedEffectId] = useState("");
  const [effectDraft, setEffectDraft] = useState({ type: "grayscale", amount: 100, fadeIn: 0.3, fadeOut: 0.3, start: null, end: null });
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const [muteOriginal, setMuteOriginal] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineTime, setTimelineTime] = useState(0);
  const [timelinePlaying, setTimelinePlaying] = useState(false);
  const [videoTool, setVideoTool] = useState("select");
  const [videoPropertyTab, setVideoPropertyTab] = useState("canvas");
  const [videoDragging, setVideoDragging] = useState(false);
  const [timelineScale, setTimelineScale] = useState(90);
  const [videoTrackCount, setVideoTrackCount] = useState(3);
  const [textTrackCount, setTextTrackCount] = useState(1);
  const [busy, setBusy] = useState("");
  const [exportElapsed, setExportElapsed] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [previewTransformMode, setPreviewTransformMode] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [exportPreview, setExportPreview] = useState(false);
  const [previewSwitchFrame, setPreviewSwitchFrame] = useState("");
  const [historyVersion, setHistoryVersion] = useState(0);
  const [settings, setSettings] = useState({
    start: 0,
    duration: 8,
    codec: "h265",
    format: "mp4",
    resolution: "source",
    fps: 30,
    crf: 24
  });

  const selectedClip = clips.find((clip) => clip.id === selectedClipId) || clips[0];
  const selectedTimedEffect = selectedClip?.effects?.find((effect) => effect.id === selectedEffectId);
  const visibleEffectStart = effectDraft.start ?? selectedTimedEffect?.start ?? null;
  const visibleEffectEnd = effectDraft.start !== null ? effectDraft.end : selectedTimedEffect?.end ?? null;
  const timelineDuration = Math.max(10, ...clips.map((clip) => clip.start + Math.max(0.1, clip.out - clip.in)), ...textOverlays.map((item) => item.start + item.duration));
  const timelineWidth = Math.max(760, timelineDuration * timelineScale);
  const previewResolution = useMemo(() => {
    if (settings.resolution === "source") {
      return {
        w: selectedClip?.sourceWidth || 1280,
        h: selectedClip?.sourceHeight || 720,
        label: selectedClip?.sourceWidth ? `${selectedClip.sourceWidth} x ${selectedClip.sourceHeight}` : "Original"
      };
    }
    const [rawW, rawH] = String(settings.resolution).split(":").map(Number);
    const sourceRatio = (selectedClip?.sourceWidth || 16) / (selectedClip?.sourceHeight || 9);
    const h = rawH === -2 ? Math.max(2, Math.round(rawW / sourceRatio / 2) * 2) : rawH;
    return { w: rawW || 1280, h: h || 720, label: `${rawW || 1280} x ${h || 720}` };
  }, [settings.resolution, selectedClip?.sourceWidth, selectedClip?.sourceHeight]);
  const activeTextOverlays = textOverlays.filter((item) => timelineTime >= item.start && timelineTime <= item.start + item.duration);

  useEffect(() => {
    if (busy !== "Exportando timeline") {
      setExportElapsed(0);
      return undefined;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(() => setExportElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [busy]);

  useEffect(() => {
    if (!previewExpanded) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setPreviewExpanded(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [previewExpanded]);

  useEffect(() => {
    setAudioDuration(0);
    if (!audioFile) {
      setAudioPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(audioFile);
    setAudioPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioFile]);

  useEffect(() => {
    if (!audioPreviewUrl || !externalAudioRef.current) return;
    externalAudioRef.current.load();
  }, [audioPreviewUrl]);

  function fitSelectedClip(mode) {
    if (!selectedClip) return;
    const sourceRatio = (selectedClip.sourceWidth || 16) / (selectedClip.sourceHeight || 9);
    const canvasRatio = previewResolution.w / previewResolution.h;
    const coverScale = sourceRatio > canvasRatio ? sourceRatio / canvasRatio : canvasRatio / sourceRatio;
    updateSelectedClipTransform({
      positionX: 0,
      positionY: 0,
      scale: mode === "cover" ? clamp(coverScale, 0.1, 4) : 1
    });
  }

  function historySnapshot() {
    return { clips, textOverlays, audioFile, muteOriginal, settings };
  }

  function restoreHistory(snapshot) {
    if (!snapshot) return;
    restoringHistoryRef.current = true;
    setClips(snapshot.clips);
    setTextOverlays(snapshot.textOverlays);
    setAudioFile(snapshot.audioFile);
    setMuteOriginal(snapshot.muteOriginal);
    setSettings(snapshot.settings);
    const nextSelected = snapshot.clips.find((clip) => clip.id === selectedClipId) || snapshot.clips[0];
    setSelectedClipId(nextSelected?.id || "");
    pickVideo(nextSelected?.file || null);
    setHistoryVersion((value) => value + 1);
  }

  function undoVideoChange() {
    const previous = undoHistoryRef.current.pop();
    if (!previous) return;
    redoHistoryRef.current.push(historySnapshot());
    restoreHistory(previous);
  }

  function redoVideoChange() {
    const next = redoHistoryRef.current.pop();
    if (!next) return;
    undoHistoryRef.current.push(historySnapshot());
    restoreHistory(next);
  }

  useEffect(() => {
    const current = historySnapshot();
    if (!lastHistoryStateRef.current) {
      lastHistoryStateRef.current = current;
      return;
    }
    if (restoringHistoryRef.current) {
      restoringHistoryRef.current = false;
      lastHistoryStateRef.current = current;
      return;
    }
    undoHistoryRef.current.push(lastHistoryStateRef.current);
    if (undoHistoryRef.current.length > 60) undoHistoryRef.current.shift();
    redoHistoryRef.current = [];
    lastHistoryStateRef.current = current;
    setHistoryVersion((value) => value + 1);
  }, [clips, textOverlays, audioFile, muteOriginal, settings]);

  function maskProgress(clip) {
    if (!clip || !clip.maskType || clip.maskType === "none") return 1;
    const localTime = clamp(timelineTime - clip.start, 0, Math.max(0.1, clip.out - clip.in));
    const clipDuration = Math.max(0.1, clip.out - clip.in);
    const intro = clip.maskInDuration > 0 ? clamp(localTime / clip.maskInDuration, 0, 1) : 1;
    const outro = clip.maskOutDuration > 0 ? clamp((clipDuration - localTime) / clip.maskOutDuration, 0, 1) : 1;
    return Math.min(intro, outro);
  }

  function previewMaskStyle(clip) {
    const progress = maskProgress(clip);
    if (!clip?.maskType || clip.maskType === "none") return {};
    if (clip.maskType === "fade") return { opacity: progress };
    if (clip.maskType === "circle") return { clipPath: `circle(${progress * 72}% at 50% 50%)` };
    if (clip.maskType === "rect") {
      const inset = (1 - progress) * 50;
      return { clipPath: `inset(${inset}% ${inset}% ${inset}% ${inset}%)` };
    }
    if (clip.maskType === "diamond") {
      const reach = progress * 100;
      return { clipPath: `polygon(50% ${50 - reach}%, ${50 + reach}% 50%, 50% ${50 + reach}%, ${50 - reach}% 50%)` };
    }
    if (clip.maskType === "wipe-right") return { clipPath: `inset(0 0 0 ${(1 - progress) * 100}%)` };
    if (clip.maskType === "wipe-up") return { clipPath: `inset(${(1 - progress) * 100}% 0 0 0)` };
    return { clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` };
  }

  function addTextOverlay() {
    const item = {
      id: `text-overlay-${Date.now()}`,
      text: "Nuevo texto",
      start: Math.round(timelineTime * 10) / 10,
      duration: 3,
      x: 50,
      y: 82,
      fontSize: 54,
      color: "#ffffff",
      fontFamily: "Arial, sans-serif",
      fontWeight: 700,
      italic: false,
      letterSpacing: 0,
      shadow: true,
      shadowColor: "#000000",
      shadowBlur: 8,
      shadowX: 3,
      shadowY: 3
    };
    setTextOverlays((current) => [...current, item]);
    setSelectedTextId(item.id);
  }

  function addSubtitle() {
    const item = {
      id: `subtitle-${Date.now()}`,
      subtitle: true,
      text: "Nuevo subtitulo",
      textEs: "Nuevo subtitulo",
      textEn: "",
      textTrack: 0,
      start: Math.round(timelineTime * 10) / 10,
      duration: 3,
      x: 50,
      y: 88,
      fontSize: 44,
      boxWidth: 80,
      color: "#ffffff",
      fontFamily: "Arial, sans-serif",
      fontWeight: 700,
      italic: false,
      letterSpacing: 0,
      shadow: true,
      shadowColor: "#000000",
      shadowBlur: 10,
      shadowX: 2,
      shadowY: 2
    };
    setTextOverlays((current) => [...current, item]);
    setSelectedTextId(item.id);
  }

  function buildSubtitlesFromScript(duration) {
    const decoder = document.createElement("textarea");
    decoder.innerHTML = subtitleScript;
    const normalized = decoder.value.replace(/\\\s*(?:\r?\n|$)/g, "\n").replace(/\r/g, "").trim();
    let phrases = normalized.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    if (phrases.length === 1) phrases = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((line) => line.trim()).filter(Boolean) || phrases;
    if (!phrases.length) return [];

    const weights = phrases.map((phrase) => Math.max(2, phrase.split(/\s+/).filter(Boolean).length + (phrase.match(/[,;:]/g) || []).length * 0.8));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let cursor = 0;
    return phrases.map((phrase, index) => {
      const end = index === phrases.length - 1 ? duration : cursor + duration * weights[index] / totalWeight;
      const item = {
        id: `subtitle-auto-${Date.now()}-${index}`,
        subtitle: true,
        text: phrase,
        textEs: subtitleImportLanguage === "es" ? phrase : "",
        textEn: subtitleImportLanguage === "en" ? phrase : "",
        start: Math.round(cursor * 100) / 100,
        duration: Math.round(Math.max(0.15, end - cursor) * 100) / 100,
        x: 50, y: 88, ...subtitleStyle,
        letterSpacing: 0, shadow: true, shadowBlur: 10, shadowX: 2, shadowY: 2
      };
      cursor = end;
      return item;
    });
  }

  function distributeScriptOverAudio() {
    const duration = audioDuration || externalAudioRef.current?.duration || 0;
    if (!subtitleScript.trim() || !Number.isFinite(duration) || duration <= 0) {
      setError("Carga un audio y pega el texto antes de generar los subtitulos");
      return;
    }
    if (textOverlays.some((item) => item.subtitle) && !window.confirm("Reemplazar los subtitulos actuales por los generados desde el texto?")) return;
    const generated = buildSubtitlesFromScript(duration);
    if (!generated.length) return;
    setTextOverlays((current) => [...current.filter((item) => !item.subtitle), ...generated]);
    setSelectedTextId(generated[0]?.id || "");
    setError("");
    setProjectStatus(`${generated.length} subtitulos distribuidos en ${duration.toFixed(1)} segundos`);
  }

  function replaceExternalAudio(file) {
    if (!file) {
      pendingAudioRetimingRef.current = null;
      setAudioFile(null);
      return;
    }
    const subtitles = textOverlays.filter((item) => item.subtitle);
    if (subtitles.length) {
      const subtitleEnd = Math.max(...subtitles.map((item) => item.start + item.duration), 0);
      pendingAudioRetimingRef.current = {
        oldDuration: audioDuration || externalAudioRef.current?.duration || subtitleEnd,
        count: subtitles.length
      };
    } else pendingAudioRetimingRef.current = null;
    setAudioFile(file);
    setProjectStatus(subtitles.length ? `Cargando ${file.name} y actualizando subtitulos...` : `Audio reemplazado por ${file.name}`);
  }

  function removeExternalAudio() {
    pendingAudioRetimingRef.current = null;
    externalAudioRef.current?.pause();
    setAudioFile(null);
    setAudioDuration(0);
    setProjectStatus("Audio externo eliminado. Los subtitulos se conservaron.");
  }

  function retimeSubtitlesForAudio(newDuration) {
    const pending = pendingAudioRetimingRef.current;
    pendingAudioRetimingRef.current = null;
    if (!pending || !Number.isFinite(newDuration) || newDuration <= 0) return;
    const oldDuration = Number(pending.oldDuration);
    if (!Number.isFinite(oldDuration) || oldDuration <= 0) return;
    const scale = newDuration / oldDuration;
    setTextOverlays((current) => current.map((item) => item.subtitle ? {
      ...item,
      start: Math.round(item.start * scale * 100) / 100,
      duration: Math.round(Math.max(0.15, item.duration * scale) * 100) / 100
    } : item));
    setProjectStatus(`${pending.count} subtitulos ajustados al audio de ${newDuration.toFixed(1)} segundos`);
  }

  function applySubtitleStyleToAll() {
    setTextOverlays((current) => current.map((item) => item.subtitle ? { ...item, ...subtitleStyle } : item));
    setProjectStatus("Estilo aplicado a todos los subtitulos");
  }

  function updateTranslationStyle(patch) {
    setSubtitleStyle((current) => ({ ...current, ...patch }));
    setTextOverlays((current) => current.map((item) => item.subtitle ? { ...item, ...patch } : item));
  }

  function moveCurrentSubtitlesToEnglish() {
    setTextOverlays((current) => current.map((item) => item.subtitle && !String(item.textEn || "").trim() && String(item.textEs || "").trim()
      ? { ...item, textEn: item.textEs, textEs: "" }
      : item));
    setSubtitleDisplay("bilingual");
    setProjectStatus("Los subtitulos actuales quedaron como original en ingles");
  }

  async function importSubtitles(file) {
    if (!file) return;
    try {
      const parsed = parseSubtitleFile(await file.text());
      if (!parsed.length) throw new Error("El archivo no contiene subtitulos validos");
      setTextOverlays((current) => {
        const next = [...current];
        parsed.forEach((entry, index) => {
          const matchIndex = next.findIndex((item) => item.subtitle
            && Math.abs(item.start - entry.start) < 0.15
            && Math.abs(item.start + item.duration - entry.end) < 0.2);
          const languagePatch = subtitleImportLanguage === "en" ? { textEn: entry.text } : { textEs: entry.text };
          if (matchIndex >= 0) {
            const updated = { ...next[matchIndex], ...languagePatch };
            next[matchIndex] = { ...updated, text: subtitleText(updated, subtitleDisplay) };
            return;
          }
          next.push({
            id: `subtitle-${Date.now()}-${index}`,
            subtitle: true,
            text: entry.text,
            textEs: subtitleImportLanguage === "es" ? entry.text : "",
            textEn: subtitleImportLanguage === "en" ? entry.text : "",
            start: entry.start,
            duration: entry.end - entry.start,
            x: 50, y: 88, fontSize: 44, boxWidth: 80, color: "#ffffff", fontFamily: "Arial, sans-serif", fontWeight: 700,
            italic: false, letterSpacing: 0, shadow: true, shadowColor: "#000000", shadowBlur: 10, shadowX: 2, shadowY: 2
          });
        });
        return next.sort((left, right) => left.start - right.start);
      });
      setProjectStatus(`${parsed.length} subtitulos importados en ${subtitleImportLanguage === "en" ? "ingles" : "castellano"}`);
    } catch (caught) {
      setError(caught.message || "No se pudieron importar los subtitulos");
    }
  }

  function exportSubtitles() {
    const subtitles = textOverlays.filter((item) => item.subtitle).sort((left, right) => left.start - right.start);
    if (!subtitles.length) return;
    const content = subtitles.map((item, index) => `${index + 1}\n${formatSubtitleTime(item.start)} --> ${formatSubtitleTime(item.start + item.duration)}\n${subtitleText(item, subtitleDisplay)}\n`).join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "application/x-subrip;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `subtitulos-${subtitleDisplay}.srt`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function updateTextOverlay(id, patch) {
    setTextOverlays((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function alignTextToCanvas(item, horizontal, vertical) {
    const patch = {};
    const halfWidth = (item.boxWidth ?? (item.subtitle ? 80 : 60)) / 2;
    if (horizontal === "left") patch.x = Math.min(50, halfWidth + 3);
    if (horizontal === "center") patch.x = 50;
    if (horizontal === "right") patch.x = Math.max(50, 97 - halfWidth);
    if (vertical === "top") patch.y = 10;
    if (vertical === "center") patch.y = 50;
    if (vertical === "bottom") patch.y = 88;
    updateTextOverlay(item.id, patch);
  }

  function removeTextOverlay(id) {
    setTextOverlays((current) => current.filter((item) => item.id !== id));
    setSelectedTextId((current) => current === id ? "" : current);
  }

  function beginTextDrag(event, item, mode = "move", handle = "") {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const frame = event.currentTarget.closest(".preview-frame")?.getBoundingClientRect();
    if (!frame) return;
    setSelectedTextId(item.id);
    textDragRef.current = {
      id: item.id,
      mode,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      x: item.x,
      y: item.y,
      fontSize: item.fontSize,
      boxWidth: item.boxWidth ?? (item.subtitle ? 80 : 60),
      textRect: event.currentTarget.closest(".video-text-overlay")?.getBoundingClientRect(),
      frame
    };
  }

  function moveTextDrag(event) {
    const drag = textDragRef.current;
    if (!drag) return;
    if (drag.mode === "scale") {
      const dx = (drag.handle.includes("e") ? 1 : -1) * (event.clientX - drag.startX);
      const dy = (drag.handle.includes("s") ? 1 : -1) * (event.clientY - drag.startY);
      const dominantDelta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      const reference = Math.max(30, drag.textRect?.width || 100);
      updateTextOverlay(drag.id, { fontSize: Math.round(clamp(drag.fontSize * (1 + dominantDelta / reference), 10, 300)) });
      return;
    }
    if (drag.mode === "width") {
      const direction = drag.handle === "e" ? 1 : -1;
      const delta = direction * (event.clientX - drag.startX) / drag.frame.width * 200;
      updateTextOverlay(drag.id, { boxWidth: Math.round(clamp(drag.boxWidth + delta, 15, 96) * 10) / 10 });
      return;
    }
    updateTextOverlay(drag.id, {
      x: Math.round(clamp(drag.x + (event.clientX - drag.startX) / drag.frame.width * 100, 0, 100) * 10) / 10,
      y: Math.round(clamp(drag.y + (event.clientY - drag.startY) / drag.frame.height * 100, 0, 100) * 10) / 10
    });
  }

  function endTextDrag(event) {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    textDragRef.current = null;
  }

  function beginTimelineTextDrag(event, item) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedTextId(item.id);
    timelineTextDragRef.current = { id: item.id, startX: event.clientX, start: item.start, track: item.textTrack || 0, moved: false };
  }

  function moveTimelineTextDrag(event) {
    const drag = timelineTextDragRef.current;
    if (!drag) return;
    const delta = Math.round((event.clientX - drag.startX) / timelineScale * 10) / 10;
    const lane = document.elementsFromPoint(event.clientX, event.clientY).find((element) => element.dataset?.textTrack !== undefined);
    const nextTrack = lane ? Number(lane.dataset.textTrack) : drag.track;
    drag.moved = drag.moved || Math.abs(event.clientX - drag.startX) > 3;
    updateTextOverlay(drag.id, { start: Math.max(0, Math.round((drag.start + delta) * 10) / 10), textTrack: nextTrack });
  }

  function endTimelineTextDrag(event) {
    const drag = timelineTextDragRef.current;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag) {
      const item = textOverlays.find((text) => text.id === drag.id);
      if (item) syncTimelinePreview(item.start);
    }
    timelineTextDragRef.current = null;
  }

  function swapVideoTracks(track, direction) {
    const other = track + direction;
    if (other < 0 || other >= videoTrackCount) return;
    setClips((current) => current.map((clip) => clip.track === track ? { ...clip, track: other } : clip.track === other ? { ...clip, track } : clip));
  }

  function removeVideoTrack(track) {
    if (videoTrackCount <= 1) return;
    if (clips.some((clip) => clip.track === track) && !window.confirm("Esta pista tiene clips. Moverlos a la pista anterior?")) return;
    setClips((current) => current.map((clip) => ({ ...clip, track: clip.track === track ? Math.max(0, track - 1) : clip.track > track ? clip.track - 1 : clip.track })));
    setVideoTrackCount((count) => count - 1);
  }

  function swapTextTracks(track, direction) {
    const other = track + direction;
    if (other < 0 || other >= textTrackCount) return;
    setTextOverlays((current) => current.map((item) => (item.textTrack || 0) === track ? { ...item, textTrack: other } : (item.textTrack || 0) === other ? { ...item, textTrack: track } : item));
  }

  function removeTextTrack(track) {
    if (textTrackCount <= 1) return;
    setTextOverlays((current) => current.map((item) => ({ ...item, textTrack: (item.textTrack || 0) === track ? Math.max(0, track - 1) : (item.textTrack || 0) > track ? (item.textTrack || 0) - 1 : (item.textTrack || 0) })));
    setTextTrackCount((count) => count - 1);
  }

  function clipEffectStyle(effect = "none", amount = 100) {
    const strength = clamp(Number(amount) || 0, 0, 200) / 100;
    const effects = {
      grayscale: `grayscale(${Math.min(1, strength)})`,
      warm: `sepia(${0.28 * strength}) saturate(${1 + 0.22 * strength}) brightness(${1 + 0.05 * strength})`,
      bright: `brightness(${1 + 0.18 * strength}) contrast(${1 + 0.08 * strength})`,
      blur: `blur(${2 * strength}px)`,
      sharpen: `contrast(${1 + 0.2 * strength}) saturate(${1 + 0.08 * strength})`,
      cool: `hue-rotate(${190 * strength}deg) saturate(${1 + 0.12 * strength}) brightness(${1 + 0.03 * strength})`,
      vintage: `sepia(${0.45 * strength}) contrast(${1 + 0.08 * strength}) saturate(${Math.max(0.35, 1 - 0.18 * strength)})`,
      contrast: `contrast(${1 + 0.35 * strength}) saturate(${1 + 0.08 * strength})`,
      invert: `invert(${Math.min(1, strength)})`,
      vignette: `contrast(${1 + 0.12 * strength}) brightness(${Math.max(0.45, 1 - 0.08 * strength)})`,
      mirror: "none"
    };
    return {
      filter: effects[effect] || "none",
      imageRendering: effect === "pixel-art" ? "pixelated" : "auto",
      transform: effect === "mirror" ? "scaleX(-1)" : "none"
    };
  }

  function combinedClipEffectStyle(clip) {
    if (!clip) return {};
    const localTime = timelineTime - clip.start;
    const activeEffects = (clip.effects || []).filter((effect) => localTime >= effect.start && localTime <= effect.end);
    const styles = [clipEffectStyle(clip.effect, clip.effectAmount), ...activeEffects.map((effect) => {
      const fadeIn = Math.max(0, Number(effect.fadeIn ?? 0.3));
      const fadeOut = Math.max(0, Number(effect.fadeOut ?? 0.3));
      const inMix = fadeIn ? clamp((localTime - effect.start) / fadeIn, 0, 1) : 1;
      const outMix = fadeOut ? clamp((effect.end - localTime) / fadeOut, 0, 1) : 1;
      return clipEffectStyle(effect.type, effect.amount * Math.min(inMix, outMix));
    })];
    return {
      filter: styles.map((style) => style.filter).filter((filter) => filter && filter !== "none").join(" ") || "none",
      imageRendering: styles.some((style) => style.imageRendering === "pixelated") ? "pixelated" : "auto",
      transform: styles.some((style) => style.transform === "scaleX(-1)") ? "scaleX(-1)" : "none"
    };
  }

  function timedZoomScale(clip) {
    if (!clip) return 1;
    const localTime = timelineTime - clip.start;
    let zoom = (clip.effects || []).reduce((scale, effect) => {
      if (effect.type !== "zoom-in" && effect.type !== "zoom-out") return scale;
      const progress = clamp((localTime - effect.start) / Math.max(0.1, effect.end - effect.start), 0, 1);
      const delta = clamp(Number(effect.amount) || 0, 0, 200) / 100;
      return scale + (effect.type === "zoom-in" ? delta * progress : -delta * progress);
    }, 1);
    if (clip.id === selectedClip?.id && effectDraft.type.startsWith("zoom-") && effectDraft.start !== null && effectDraft.end !== null) {
      const start = Math.min(effectDraft.start, effectDraft.end);
      const end = Math.max(effectDraft.start, effectDraft.end);
      const progress = clamp((localTime - start) / Math.max(0.1, end - start), 0, 1);
      const delta = clamp(Number(effectDraft.amount) || 0, 0, 200) / 100;
      zoom += effectDraft.type === "zoom-in" ? delta * progress : -delta * progress;
    }
    return clamp(zoom, 0.25, 4);
  }

  function markEffectPoint(edge) {
    if (!selectedClip) return;
    const local = Math.round(clamp(timelineTime - selectedClip.start, 0, selectedClip.out - selectedClip.in) * 10) / 10;
    setEffectDraft((current) => ({ ...current, [edge]: local }));
  }

  function addTimedEffect() {
    if (!selectedClip || effectDraft.start === null || effectDraft.end === null) return;
    const start = Math.min(effectDraft.start, effectDraft.end);
    const end = Math.max(effectDraft.start, effectDraft.end);
    if (end - start < 0.1) return;
    const maxFade = (end - start) / 2;
    const effect = {
      id: `clip-effect-${Date.now()}`,
      type: effectDraft.type,
      amount: effectDraft.amount,
      fadeIn: Math.min(effectDraft.fadeIn, maxFade),
      fadeOut: Math.min(effectDraft.fadeOut, maxFade),
      start,
      end
    };
    setClips((current) => current.map((clip) => clip.id === selectedClip.id ? { ...clip, effects: [...(clip.effects || []), effect] } : clip));
    setSelectedEffectId(effect.id);
    setEffectDraft((current) => ({ ...current, start: null, end: null }));
  }

  function removeTimedEffect(clipId, effectId) {
    setClips((current) => current.map((clip) => clip.id === clipId ? { ...clip, effects: (clip.effects || []).filter((effect) => effect.id !== effectId) } : clip));
    setSelectedEffectId((current) => current === effectId ? "" : current);
  }

  useEffect(() => {
    if (selectedEffectId && !(selectedClip?.effects || []).some((effect) => effect.id === selectedEffectId)) {
      setSelectedEffectId("");
    }
  }, [selectedClip, selectedEffectId]);

  useEffect(() => {
    if (selectedClip?.effect !== "pixel-art") return undefined;
    let frameId;
    const renderPixelFrame = () => {
      const video = previewRef.current;
      const canvas = pixelCanvasRef.current;
      if (video && canvas && video.readyState >= 2) {
        const pixelSize = clamp(Number(selectedClip.pixelSize) || 12, 2, 64);
        const displayWidth = Math.max(1, canvas.clientWidth);
        const displayHeight = Math.max(1, canvas.clientHeight);
        const width = Math.max(2, Math.round(displayWidth / pixelSize));
        const height = Math.max(2, Math.round(displayHeight / pixelSize));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, width, height);
        const ratio = Math.min(width / video.videoWidth, height / video.videoHeight);
        const drawWidth = video.videoWidth * ratio;
        const drawHeight = video.videoHeight * ratio;
        ctx.drawImage(video, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
      }
      frameId = requestAnimationFrame(renderPixelFrame);
    };
    frameId = requestAnimationFrame(renderPixelFrame);
    return () => cancelAnimationFrame(frameId);
  }, [selectedClip?.id, selectedClip?.effect, selectedClip?.pixelSize]);

  function updateSelectedClipTransform(patch) {
    if (!selectedClip) return;
    setClips((current) => current.map((clip) => clip.id === selectedClip.id ? { ...clip, ...patch } : clip));
  }

  function beginPreviewTransform(event, mode, handle = "") {
    if (!selectedClip || !previewTransformMode) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const frame = event.currentTarget.closest(".preview-frame")?.getBoundingClientRect();
    if (!frame) return;
    previewTransformRef.current = {
      mode,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      frame,
      x: selectedClip.positionX || 0,
      y: selectedClip.positionY || 0,
      scale: selectedClip.scale || 1
    };
  }

  function movePreviewTransform(event) {
    const drag = previewTransformRef.current;
    if (!drag || !selectedClip) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (drag.mode === "move") {
      updateSelectedClipTransform({
        positionX: Math.round((drag.x + dx / drag.frame.width * 100) * 10) / 10,
        positionY: Math.round((drag.y + dy / drag.frame.height * 100) * 10) / 10
      });
      return;
    }
    const horizontal = (drag.handle.includes("e") ? dx : -dx) / drag.frame.width;
    const vertical = (drag.handle.includes("s") ? dy : -dy) / drag.frame.height;
    const delta = Math.abs(horizontal) > Math.abs(vertical) ? horizontal : vertical;
    updateSelectedClipTransform({ scale: Math.round(clamp(drag.scale + delta * 2, 0.1, 4) * 100) / 100 });
  }

  function endPreviewTransform(event) {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    previewTransformRef.current = null;
  }

  function pickVideo(file) {
    setVideoFile(file || null);
    setResult("");
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(file ? URL.createObjectURL(file) : "");
  }

  function seekVideo(video, time) {
    return new Promise((resolve) => {
      const done = () => {
        video.removeEventListener("seeked", done);
        resolve();
      };
      video.addEventListener("seeked", done, { once: true });
      video.currentTime = time;
    });
  }

  async function makeThumbnails(file, count = 14) {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;

    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = reject;
    });

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const canvas = document.createElement("canvas");
    canvas.width = 144;
    canvas.height = 82;
    const ctx = canvas.getContext("2d");
    const frames = [];

    for (let index = 0; index < count; index += 1) {
      const time = duration ? Math.min(duration - 0.05, (duration / count) * index + 0.05) : 0;
      await seekVideo(video, Math.max(0, time));
      ctx.fillStyle = "#050607";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const ratio = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
      const width = video.videoWidth * ratio;
      const height = video.videoHeight * ratio;
      ctx.drawImage(video, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      frames.push({ image: canvas.toDataURL("image/jpeg", 0.74), time });
    }

    URL.revokeObjectURL(url);
    return { frames, duration, sourceWidth: video.videoWidth, sourceHeight: video.videoHeight };
  }

  function selectClipAt(clip, time = 0) {
    setSelectedClipId(clip.id);
    const boundedClipTime = clamp(time, clip.in, clip.out);
    const nextTimelineTime = clip.start + Math.max(0, boundedClipTime - clip.in);
    timelineTimeRef.current = nextTimelineTime;
    setTimelineTime(nextTimelineTime);
    activeClipRef.current = clip.id;
    pickVideo(clip.file);
    window.requestAnimationFrame(() => {
      if (previewRef.current) {
        previewRef.current.currentTime = boundedClipTime;
        setPreviewTime(previewRef.current.currentTime);
        previewRef.current.play().catch(() => {});
      }
    });
  }

  function playPreview() {
    if (previewRef.current && selectedClip) {
      if (previewRef.current.currentTime < selectedClip.in || previewRef.current.currentTime >= selectedClip.out) {
        previewRef.current.currentTime = selectedClip.in;
      }
    }
    previewRef.current?.play().catch(() => {});
  }

  function pausePreview() {
    previewRef.current?.pause();
  }

  function stopPreview() {
    if (!previewRef.current) return;
    previewRef.current.pause();
    previewRef.current.currentTime = selectedClip?.in || 0;
    setPreviewTime(previewRef.current.currentTime);
    setIsPlaying(false);
  }

  function jumpPreview(amount) {
    if (!previewRef.current || !selectedClip) return;
    const nextTime = clamp(previewRef.current.currentTime + amount, selectedClip.in, selectedClip.out);
    previewRef.current.currentTime = nextTime;
    setPreviewTime(nextTime);
  }

  function clipAtTime(time) {
    return [...clips]
      .filter((clip) => time >= clip.start && time < clip.start + clip.out - clip.in)
      .sort((a, b) => b.track - a.track || b.start - a.start)[0];
  }

  function framesForClip(clip) {
    const sourceFrames = clip.frames || [];
    const frames = sourceFrames.filter((frame) => frame.time >= clip.in && frame.time <= clip.out);
    if (frames.length) return frames;
    return sourceFrames.slice(0, 1);
  }

  function timelineFramesForClip(clip, count = 14) {
    const frames = framesForClip(clip);
    if (!frames.length) return [];
    return Array.from({ length: count }, (_, index) => {
      const sourceIndex = Math.min(frames.length - 1, Math.floor(index * frames.length / count));
      return frames[sourceIndex];
    });
  }

  function nearestFrameForClip(clip, sourceTime) {
    return (clip?.frames || []).reduce((nearest, frame) => (
      !nearest || Math.abs(frame.time - sourceTime) < Math.abs(nearest.time - sourceTime) ? frame : nearest
    ), null);
  }

  function handlePreviewTimeUpdate(event) {
    const video = event.currentTarget;
    if (!selectedClip) {
      setPreviewTime(video.currentTime);
      return;
    }

    if (video.currentTime < selectedClip.in) {
      video.currentTime = selectedClip.in;
      setPreviewTime(selectedClip.in);
      return;
    }

    if (video.currentTime >= selectedClip.out) {
      video.currentTime = selectedClip.out;
      setPreviewTime(selectedClip.out);
      if (!timelinePlaying) {
        video.pause();
        setIsPlaying(false);
      }
      return;
    }

    setPreviewTime(video.currentTime);
    if (!timelinePlaying) {
      const nextTimelineTime = selectedClip.start + Math.max(0, video.currentTime - selectedClip.in);
      timelineTimeRef.current = nextTimelineTime;
      setTimelineTime(nextTimelineTime);
    }
  }

  function syncTimelinePreview(time) {
    const activeClip = clipAtTime(time);
    timelineTimeRef.current = time;
    setTimelineTime(time);
    const externalAudio = externalAudioRef.current;
    if (externalAudio?.readyState >= 1) {
      const audioTime = Math.min(time, Number.isFinite(externalAudio.duration) ? externalAudio.duration : time);
      if (Math.abs(externalAudio.currentTime - audioTime) > 0.25) externalAudio.currentTime = audioTime;
    }
    if (!activeClip || !previewRef.current) {
      previewRef.current?.pause();
      setSelectedClipId("");
      activeClipRef.current = "";
      return false;
    }

    const clipTime = activeClip.in + (time - activeClip.start);
    const boundedTime = clamp(clipTime, activeClip.in, activeClip.out);
    setSelectedClipId(activeClip.id);
    const changedClip = activeClipRef.current !== activeClip.id;
    if (changedClip) {
      const switchId = ++previewSwitchRef.current;
      activeClipRef.current = activeClip.id;
      const transitionFrame = nearestFrameForClip(activeClip, boundedTime);
      setPreviewSwitchFrame(transitionFrame?.image || "");
      previewRef.current.dataset.clipId = activeClip.id;
      if (previewRef.current.src !== activeClip.previewUrl) {
        previewRef.current.src = activeClip.previewUrl;
        previewRef.current.load();
      }
      const revealVideo = () => {
        if (switchId !== previewSwitchRef.current || activeClipRef.current !== activeClip.id) return;
        setPreviewSwitchFrame("");
        if (timelinePlaying) previewRef.current?.play().catch(() => {});
      };
      previewRef.current.addEventListener("seeked", revealVideo, { once: true });
      previewRef.current.addEventListener("canplay", revealVideo, { once: true });
    }
    previewRef.current.muted = muteOriginal || activeClip.muted;

    const drift = Math.abs(previewRef.current.currentTime - boundedTime);
    if (changedClip || drift > 0.35 || previewRef.current.currentTime < activeClip.in || previewRef.current.currentTime > activeClip.out) {
      previewRef.current.currentTime = boundedTime;
    }
    setPreviewTime(previewRef.current.currentTime);
    return true;
  }

  function playTimeline() {
    if (!clips.length) return;
    syncTimelinePreview(timelineTimeRef.current);
    setTimelinePlaying(true);
    externalAudioRef.current?.play().catch(() => {});
  }

  function pauseTimeline() {
    setTimelinePlaying(false);
    previewRef.current?.pause();
    externalAudioRef.current?.pause();
  }

  function toggleTimelinePlayback() {
    if (timelinePlaying) pauseTimeline();
    else playTimeline();
  }

  function stopTimeline() {
    setTimelinePlaying(false);
    previewRef.current?.pause();
    externalAudioRef.current?.pause();
    if (externalAudioRef.current) externalAudioRef.current.currentTime = 0;
    timelineTimeRef.current = 0;
    activeClipRef.current = "";
    syncTimelinePreview(0);
  }

  function jumpTimeline(amount) {
    syncTimelinePreview(clamp(timelineTimeRef.current + amount, 0, timelineDuration));
  }

  function timeFromTimelineEvent(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    return clamp(((event.clientX - rect.left - 54) / timelineScale), 0, timelineDuration);
  }

  function isTimelineInteractiveTarget(event) {
    return Boolean(event.target.closest(".timeline-clip") || event.target.closest("button") || event.target.closest("select"));
  }

  function seekTimelineFromEvent(event) {
    if (isTimelineInteractiveTarget(event)) return false;
    const nextTime = Math.round(timeFromTimelineEvent(event) * 10) / 10;
    const hasActiveClip = syncTimelinePreview(nextTime);
    if (timelinePlaying && hasActiveClip) {
      previewRef.current?.play().catch(() => {});
    }
    return true;
  }

  function beginPlayheadDrag(event) {
    if (!seekTimelineFromEvent(event)) return;
    playheadDragRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function movePlayheadDrag(event) {
    if (!playheadDragRef.current) return;
    seekTimelineFromEvent(event);
  }

  function endPlayheadDrag(event) {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    playheadDragRef.current = false;
  }

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.muted = muteOriginal || Boolean(selectedClip?.muted);
    }
  }, [muteOriginal, selectedClip?.muted, selectedClip?.id]);

  useEffect(() => {
    if (!timelinePlaying) return undefined;
    let frame = 0;
    let last = performance.now();
    const tick = (now) => {
      const delta = (now - last) / 1000;
      last = now;
      const next = Math.min(timelineDuration, timelineTimeRef.current + delta);
      const hasActiveClip = syncTimelinePreview(next);
      if (next >= timelineDuration) {
        setTimelinePlaying(false);
        externalAudioRef.current?.pause();
        return;
      }
      if (hasActiveClip) previewRef.current?.play().catch(() => {});
      if (audioFile && externalAudioRef.current?.paused && next < externalAudioRef.current.duration) externalAudioRef.current.play().catch(() => {});
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [timelinePlaying, timelineDuration, clips, audioFile]);

  useEffect(() => {
    if (!active) return undefined;
    function handleKeyDown(event) {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;
      if (isTyping || event.code !== "Space") return;
      event.preventDefault();
      toggleTimelinePlayback();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, timelinePlaying, clips]);

  useEffect(() => {
    if (!active) return undefined;
    function handleHistoryKey(event) {
      const target = event.target;
      const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
      if (isTyping || !(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === "z" && event.shiftKey) {
        event.preventDefault();
        redoVideoChange();
      } else if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        undoVideoChange();
      } else if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        redoVideoChange();
      }
    }
    window.addEventListener("keydown", handleHistoryKey);
    return () => window.removeEventListener("keydown", handleHistoryKey);
  }, [active, clips, textOverlays, audioFile, muteOriginal, settings]);

  useEffect(() => {
    if (!active) return undefined;
    function handleDelete(event) {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;
      if (isTyping || (event.key !== "Delete" && event.key !== "Backspace")) return;
      if (selectedEffectId) {
        const owner = clips.find((clip) => (clip.effects || []).some((effect) => effect.id === selectedEffectId));
        if (owner) {
          event.preventDefault();
          removeTimedEffect(owner.id, selectedEffectId);
          return;
        }
      }
      if (selectedTextId) {
        event.preventDefault();
        removeTextOverlay(selectedTextId);
        return;
      }
      if (!selectedClipId) return;
      event.preventDefault();
      removeClip(selectedClipId);
    }

    window.addEventListener("keydown", handleDelete);
    return () => window.removeEventListener("keydown", handleDelete);
  }, [active, clips, selectedClipId, selectedEffectId, selectedTextId]);

  async function addTimelineFiles(fileList) {
    const videoFiles = Array.from(fileList || []).filter((file) => file.type.startsWith("video/") || /\.(mkv|mov|avi|webm|mp4)$/i.test(file.name));
    const oversized = videoFiles.filter((file) => file.size > MAX_VIDEO_BYTES);
    const files = videoFiles.filter((file) => file.size <= MAX_VIDEO_BYTES);
    if (oversized.length) {
      setError(`No se subieron ${oversized.length} video(s): maximo ${MAX_VIDEO_MB} MB por archivo.`);
    }
    if (!files.length) return;
    setVideoDragging(false);
    setBusy("Generando fotogramas");
    if (!oversized.length) setError("");
    try {
      const nextClips = [];
      for (const file of files) {
        const previewUrl = URL.createObjectURL(file);
        const { frames, duration, sourceWidth, sourceHeight } = await makeThumbnails(file);
        const currentEnd = [...clips, ...nextClips].reduce((max, clip) => Math.max(max, clip.start + clip.out - clip.in), 0);
        nextClips.push({
          id: `${Date.now()}-${file.name}-${Math.random().toString(16).slice(2)}`,
          file,
          name: file.name,
          previewUrl,
          frames,
          duration,
          sourceWidth,
          sourceHeight,
          start: currentEnd,
          in: 0,
          out: Math.max(0.1, duration || 1),
          track: 0,
          muted: false,
          effect: "none",
          effectAmount: 100,
          effects: [],
          pixelSize: 12,
          positionX: 0,
          positionY: 0,
          scale: 1,
          maskType: "none",
          maskInDuration: 0.8,
          maskOutDuration: 0
        });
      }
      setClips((current) => {
        const next = [...current, ...nextClips];
        setSelectedClipId(nextClips[0]?.id || next[0]?.id || "");
        if (!videoFile && nextClips[0]) pickVideo(nextClips[0].file);
        return next;
      });
    } catch (caught) {
      setError(caught.message || "No se pudieron crear los fotogramas.");
    } finally {
      setBusy("");
    }
  }

  function handleVideoDragOver(event) {
    event.preventDefault();
    if (Array.from(event.dataTransfer?.types || []).includes("Files")) {
      setVideoDragging(true);
    }
  }

  function handleVideoDragLeave(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setVideoDragging(false);
  }

  async function saveVideoProject() {
    setBusy("Guardando proyecto video");
    setError("");
    try {
      await putProject(VIDEO_PROJECT_ID, {
        savedAt: new Date().toISOString(),
        clips: clips.map(({ previewUrl, ...clip }) => clip),
        textOverlays,
        subtitleDisplay,
        selectedTextId,
        selectedClipId,
        audioFile,
        muteOriginal,
        timelineScale,
        videoTrackCount,
        textTrackCount,
        settings
      });
      setProjectStatus("Proyecto video guardado");
    } catch (caught) {
      setError(caught.message || "No se pudo guardar el proyecto video.");
    } finally {
      setBusy("");
    }
  }

  async function loadVideoProject() {
    setBusy("Abriendo proyecto video");
    setError("");
    try {
      const saved = await getProject(VIDEO_PROJECT_ID);
      if (!saved) {
        setProjectStatus("");
        setError("No hay proyecto video guardado.");
        return;
      }

      clips.forEach((clip) => URL.revokeObjectURL(clip.previewUrl));
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      const restoredClips = (saved.clips || []).map((clip) => ({
        ...clip,
        previewUrl: URL.createObjectURL(clip.file)
      }));
      setClips(restoredClips);
      const nextSelectedId = saved.selectedClipId && restoredClips.some((clip) => clip.id === saved.selectedClipId)
        ? saved.selectedClipId
        : restoredClips[0]?.id || "";
      const nextSelected = restoredClips.find((clip) => clip.id === nextSelectedId);
      setSelectedClipId(nextSelectedId);
      setTextOverlays(saved.textOverlays || []);
      setSubtitleDisplay(saved.subtitleDisplay || "bilingual");
      setSelectedTextId(saved.selectedTextId || "");
      setAudioFile(saved.audioFile || null);
      setMuteOriginal(Boolean(saved.muteOriginal));
      setTimelineScale(saved.timelineScale || 90);
      setVideoTrackCount(saved.videoTrackCount || Math.max(3, ...restoredClips.map((clip) => (clip.track || 0) + 1)));
      setTextTrackCount(saved.textTrackCount || Math.max(1, ...(saved.textOverlays || []).map((item) => (item.textTrack || 0) + 1)));
      setSettings(saved.settings ? { ...saved.settings, fps: saved.settings.fps || 30 } : {
        start: 0,
        duration: 8,
        codec: "h265",
        format: "mp4",
        resolution: "source",
        fps: 30,
        crf: 24
      });
      setVideoFile(nextSelected?.file || null);
      setVideoUrl("");
      setTimelinePlaying(false);
      timelineTimeRef.current = nextSelected ? nextSelected.start : 0;
      setTimelineTime(timelineTimeRef.current);
      activeClipRef.current = "";
      setResult("");
      setProjectStatus("Proyecto video abierto");
    } catch (caught) {
      setError(caught.message || "No se pudo abrir el proyecto video.");
    } finally {
      setBusy("");
    }
  }

  async function clearVideoProject() {
    await deleteProject(VIDEO_PROJECT_ID);
    setProjectStatus("Proyecto video eliminado");
  }

  async function saveVideoWorkspace({ projectId }) {
    await putProject(`workspace:${projectId}:video`, {
      savedAt: new Date().toISOString(),
      clips: clips.map(({ previewUrl, ...clip }) => clip),
      selectedClipId,
      textOverlays,
      subtitleDisplay,
      selectedTextId,
      audioFile,
      muteOriginal,
      timelineScale,
      videoTrackCount,
      textTrackCount,
      settings
    });
    return { kind: "video", thumbnail: createVideoWorkspaceThumbnail() };
  }

  function createVideoWorkspaceThumbnail() {
    const video = previewRef.current;
    if (video?.readyState >= 2 && video.videoWidth && video.videoHeight) {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 180;
      const context = canvas.getContext("2d");
      context.fillStyle = "#080a0d";
      context.fillRect(0, 0, canvas.width, canvas.height);
      const ratio = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
      const width = video.videoWidth * ratio;
      const height = video.videoHeight * ratio;
      context.drawImage(video, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      return canvas.toDataURL("image/jpeg", 0.82);
    }
    const clip = selectedClip || clips[0];
    const frames = clip?.frames || [];
    return frames[Math.floor(frames.length / 2)]?.image || frames[0]?.image || "";
  }

  async function loadVideoWorkspace({ projectId }) {
    const saved = await getProject(`workspace:${projectId}:video`);
    if (!saved) return;
    await putProject(VIDEO_PROJECT_ID, saved);
    await loadVideoProject();
  }

  useWorkspacePersistence(saveVideoWorkspace, loadVideoWorkspace);

  useEffect(() => {
    if (openProjectSignal) loadVideoProject();
  }, [openProjectSignal]);

  useEffect(() => {
    if (!templateRequest) return;
    setSettings((current) => ({
      ...current,
      resolution: templateRequest.resolution || current.resolution,
      codec: templateRequest.codec || current.codec,
      format: templateRequest.format || current.format,
      fps: templateRequest.fps || current.fps || 30,
      crf: templateRequest.crf || current.crf
    }));
    setTimelineScale(templateRequest.timelineScale || 90);
    setProjectStatus(`Plantilla ${templateRequest.name} lista`);
  }, [templateRequest?.id]);

  function removeClip(id) {
    setClips((current) => {
      const clip = current.find((item) => item.id === id);
      const next = current.filter((item) => item.id !== id);
      if (clip && !next.some((item) => item.previewUrl === clip.previewUrl)) URL.revokeObjectURL(clip.previewUrl);
      if (selectedClipId === id) setSelectedClipId(next[0]?.id || "");
      if (videoFile === clip?.file) pickVideo(next[0]?.file || null);
      return next;
    });
  }

  function moveClip(id, direction) {
    setClips((current) => {
      const index = current.findIndex((clip) => clip.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function updateClip(id, key, value) {
    setClips((current) =>
      current.map((clip) => {
        if (clip.id !== id) return clip;
        const next = { ...clip, [key]: Number(value) || 0 };
        next.track = clamp(Math.round(next.track), 0, videoTrackCount - 1);
        next.start = Math.max(0, next.start);
        next.in = clamp(next.in, 0, Math.max(0, clip.duration - 0.1));
        next.out = clamp(next.out, next.in + 0.1, clip.duration || next.in + 0.1);
        return next;
      })
    );
  }

  function updateClipProperty(id, patch) {
    setClips((current) => current.map((clip) => (clip.id === id ? { ...clip, ...patch } : clip)));
  }

  function toggleClipMuted(id) {
    const clip = clips.find((item) => item.id === id);
    const nextMuted = !clip?.muted;
    if (previewRef.current && selectedClip?.id === id) previewRef.current.muted = muteOriginal || nextMuted;
    setClips((current) => current.map((item) => (item.id === id ? { ...item, muted: nextMuted } : item)));
  }

  function splitSelectedClip() {
    if (!selectedClip) return;
    splitClipAtLocalTime(selectedClip, selectedClip.in + (timelineTimeRef.current - selectedClip.start));
  }

  function splitClipAtLocalTime(clipToSplit, localTime) {
    if (!clipToSplit) return;
    if (localTime <= clipToSplit.in + 0.1 || localTime >= clipToSplit.out - 0.1) return;
    const rightClip = {
      ...clipToSplit,
      id: `${Date.now()}-${clipToSplit.name}-split-${Math.random().toString(16).slice(2)}`,
      start: clipToSplit.start + (localTime - clipToSplit.in),
      in: localTime
    };
    setClips((current) =>
      current.flatMap((clip) => (clip.id === clipToSplit.id ? [{ ...clip, out: localTime }, rightClip] : [clip]))
    );
    setSelectedClipId(rightClip.id);
    setVideoTool("select");
  }

  function splitClipFromPointer(event, clip) {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const localTime = clip.in + (clip.out - clip.in) * ratio;
    const timelineTimeAtCut = clip.start + (localTime - clip.in);
    timelineTimeRef.current = timelineTimeAtCut;
    setTimelineTime(timelineTimeAtCut);
    splitClipAtLocalTime(clip, localTime);
  }

  function trimSelectedToPlayhead(edge) {
    if (!selectedClip) return;
    const playhead = timelineTimeRef.current;
    if (playhead <= selectedClip.start || playhead >= selectedClip.start + selectedClip.out - selectedClip.in) return;
    if (edge === "start") {
      updateClipProperty(selectedClip.id, {
        in: selectedClip.in + (playhead - selectedClip.start),
        start: playhead
      });
      return;
    }
    updateClipProperty(selectedClip.id, {
      out: selectedClip.in + (playhead - selectedClip.start)
    });
  }

  function duplicateSelectedClip() {
    if (!selectedClip) return;
    const duration = selectedClip.out - selectedClip.in;
    const copy = {
      ...selectedClip,
      id: `${Date.now()}-${selectedClip.name}-copy-${Math.random().toString(16).slice(2)}`,
      start: selectedClip.start + duration + 0.2
    };
    setClips((current) => [...current, copy]);
    setSelectedClipId(copy.id);
  }

  function moveClipTo(id, track, start) {
    setClips((current) =>
      current.map((clip) =>
        clip.id === id
          ? {
              ...clip,
              track: clamp(Math.round(track), 0, videoTrackCount - 1),
              start: Math.max(0, Number(start) || 0)
            }
          : clip
      )
    );
  }

  function trimClip(id, edge, deltaSeconds) {
    setClips((current) =>
      current.map((clip) => {
        if (clip.id !== id) return clip;
        if (edge === "start") {
          const nextIn = clamp(clip.in + deltaSeconds, 0, clip.out - 0.1);
          return {
            ...clip,
            start: Math.max(0, clip.start + (nextIn - clip.in)),
            in: nextIn
          };
        }
        return {
          ...clip,
          out: clamp(clip.out + deltaSeconds, clip.in + 0.1, clip.duration || clip.out)
        };
      })
    );
  }

  function beginTrim(event, clip, edge) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    trimRef.current = { clip, edge, startX: event.clientX };
  }

  function moveTrim(event) {
    const trim = trimRef.current;
    if (!trim) return;
    const delta = Math.round(((event.clientX - trim.startX) / timelineScale) * 10) / 10;
    setClips((current) =>
      current.map((clip) => {
        if (clip.id !== trim.clip.id) return clip;
        if (trim.edge === "start") {
          const nextIn = clamp(trim.clip.in + delta, 0, trim.clip.out - 0.1);
          return {
            ...clip,
            start: Math.max(0, trim.clip.start + (nextIn - trim.clip.in)),
            in: nextIn
          };
        }
        return {
          ...clip,
          out: clamp(trim.clip.out + delta, trim.clip.in + 0.1, trim.clip.duration || trim.clip.out)
        };
      })
    );
  }

  function endTrim(event) {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    trimRef.current = null;
  }

  function beginClipDrag(event, clip) {
    if (videoTool === "cut") return;
    if (event.target.closest("button") || event.target.closest(".trim-handle")) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    clipDragRef.current = {
      id: clip.id,
      startX: event.clientX,
      startY: event.clientY,
      start: clip.start,
      track: clip.track,
      moved: false
    };
    setSelectedClipId(clip.id);
  }

  function moveClipDrag(event) {
    const drag = clipDragRef.current;
    if (!drag) return;
    const deltaSeconds = Math.round(((event.clientX - drag.startX) / timelineScale) * 10) / 10;
    const lane = document.elementsFromPoint(event.clientX, event.clientY).find((element) => element.classList?.contains("clip-lane"));
    const nextTrack = lane ? Number(lane.dataset.track || 0) : undefined;
    drag.moved = drag.moved || Math.abs(event.clientX - drag.startX) > 3 || Math.abs(event.clientY - drag.startY) > 3;
    setClips((current) =>
      current.map((clip) =>
        clip.id === drag.id
          ? {
              ...clip,
              start: Math.max(0, drag.start + deltaSeconds),
              track: nextTrack === undefined ? drag.track : clamp(Math.round(nextTrack), 0, videoTrackCount - 1)
            }
          : clip
      )
    );
  }

  function endClipDrag(event) {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    window.setTimeout(() => {
      clipDragRef.current = null;
    }, 0);
  }

  async function send(endpoint, field, files) {
    const selected = Array.isArray(files) ? files : [files];
    if (!selected.filter(Boolean).length) return;
    setBusy("Procesando video");
    setError("");
    setResult("");
    try {
      const form = new FormData();
      for (const file of selected) form.append(field, file);
      Object.entries(settings).forEach(([key, value]) => form.append(key, value));
      const response = await fetch(`${API}${endpoint}`, { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudo procesar el video.");
      setResult(payload.url);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy("");
    }
  }

  async function exportTimeline() {
    if (!clips.length) return;
    let overlaysForExport = textOverlays;
    if (!textOverlays.some((item) => item.subtitle) && subtitleScript.trim()) {
      const duration = audioDuration || externalAudioRef.current?.duration || 0;
      const generated = duration > 0 ? buildSubtitlesFromScript(duration) : [];
      if (generated.length) {
        overlaysForExport = [...textOverlays.filter((item) => !item.subtitle), ...generated];
        setTextOverlays(overlaysForExport);
        setSelectedTextId(generated[0].id);
        setProjectStatus(`${generated.length} subtitulos restaurados antes de exportar`);
      }
    }
    setBusy("Exportando timeline");
    setExportProgress(0);
    setError("");
    setResult("");
    try {
      const form = new FormData();
      clips.forEach((clip) => form.append("videos", clip.file));
      form.append(
        "clips",
        JSON.stringify(clips.map(({ name, start, in: clipIn, out, track, muted, effect, effectAmount, effects, pixelSize, positionX, positionY, scale, maskType, maskInDuration, maskOutDuration }) => ({ name, start, in: clipIn, out, track, muted, effect, effectAmount, effects, pixelSize, positionX, positionY, scale, maskType, maskInDuration, maskOutDuration })))
      );
      const composedTexts = overlaysForExport.flatMap((item) => {
        const boxWidth = item.boxWidth ?? (item.subtitle ? 80 : 60);
        if (!item.subtitle || subtitleDisplay !== "bilingual") {
          const wrapped = wrapTextForExport(subtitleText(item, subtitleDisplay), item.fontSize || 54, boxWidth, previewResolution.w, previewResolution.h, item.fontFamily, item.fontWeight, item.italic);
          return [{ ...item, text: wrapped.text, preWrapped: true, exportLineHeight: 1.1 }];
        }
        const primary = String(item.textEn || "").trim();
        const translation = String(item.textEs || "").trim();
        const primarySize = item.fontSize || 44;
        const translationSize = item.translationFontSize || 30;
        const wrappedPrimary = wrapTextForExport(primary || translation, primarySize, boxWidth, previewResolution.w, previewResolution.h, item.fontFamily, item.fontWeight, item.italic);
        if (!primary || !translation) return [{ ...item, text: wrappedPrimary.text, preWrapped: true, exportLineHeight: 1.1 }];
        const translationFamily = item.translationFontFamily || "Georgia, serif";
        const translationWeight = item.translationFontWeight || 400;
        const translationItalic = item.translationItalic !== false;
        const wrappedTranslation = wrapTextForExport(translation, translationSize, boxWidth, previewResolution.w, previewResolution.h, translationFamily, translationWeight, translationItalic);
        const primaryHeight = wrappedPrimary.lines * primarySize * previewResolution.h / 1080 * 1.1;
        const translationHeight = wrappedTranslation.lines * translationSize * previewResolution.h / 1080 * 1.2;
        const gap = translationSize * previewResolution.h / 1080 * 0.28;
        const totalHeight = primaryHeight + gap + translationHeight;
        const top = item.y * previewResolution.h / 100 - totalHeight / 2;
        const primaryY = (top + primaryHeight / 2) / previewResolution.h * 100;
        const translationY = (top + primaryHeight + gap + translationHeight / 2) / previewResolution.h * 100;
        return [
          { ...item, text: wrappedPrimary.text, y: clamp(primaryY, 0, 100), preWrapped: true, exportLineHeight: 1.1 },
          {
            ...item,
            id: `${item.id}-translation`,
            text: wrappedTranslation.text,
            y: clamp(translationY, 0, 100),
            fontFamily: translationFamily,
            fontWeight: translationWeight,
            fontSize: translationSize,
            color: item.translationColor || "#8fe7ff",
            italic: translationItalic,
            preWrapped: true,
            exportLineHeight: 1.2
          }
        ];
      });
      const exportTexts = composedTexts.flatMap((item) => {
        const lines = String(item.text || "").split("\n");
        if (lines.length === 1) return [item];
        const lineStep = (item.fontSize || 54) / 10.8 * (item.exportLineHeight || 1.1);
        const firstY = item.y - (lines.length - 1) * lineStep / 2;
        return lines.map((line, index) => ({
          ...item,
          id: `${item.id}-line-${index}`,
          text: line,
          y: clamp(firstY + index * lineStep, lineStep / 2, 100 - lineStep / 2)
        }));
      });
      form.append("textOverlays", JSON.stringify(exportTexts));
      if (audioFile) form.append("audio", audioFile);
      form.append("muteOriginal", String(muteOriginal));
      Object.entries(settings).forEach(([key, value]) => form.append(key, value));
      const response = await fetch(`${API}/api/video/timeline`, { method: "POST", body: form });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "No se pudo exportar la timeline.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed = false;
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        lines.filter(Boolean).forEach((line) => {
          const event = JSON.parse(line);
          if (event.type === "progress") setExportProgress(event.progress);
          if (event.type === "complete") {
            completed = true;
            setExportProgress(100);
            setResult(event.url);
          }
          if (event.type === "error") throw new Error(event.error);
        });
        if (done) break;
      }
      if (!completed) throw new Error("La exportacion termino sin generar el archivo.");
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="video-board">
      <audio
        key={audioPreviewUrl || "sin-audio"}
        onCanPlay={(event) => { if (timelinePlaying) event.currentTarget.play().catch(() => {}); }}
        onLoadedMetadata={(event) => {
          const nextDuration = Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0;
          setAudioDuration(nextDuration);
          retimeSubtitlesForAudio(nextDuration);
          event.currentTarget.currentTime = Math.min(timelineTimeRef.current, event.currentTarget.duration || timelineTimeRef.current);
        }}
        preload="auto"
        ref={externalAudioRef}
        src={audioPreviewUrl}
      />
      <div className="video-left">
        <div
          className={`video-preview${videoDragging || busy ? " is-loading" : ""}${previewExpanded ? " is-expanded" : ""}${exportPreview ? " is-export-preview" : ""}`}
          data-wizard="video-preview"
          onDragLeave={handleVideoDragLeave}
          onDragOver={handleVideoDragOver}
          onDrop={(event) => {
            event.preventDefault();
            setVideoDragging(false);
            addTimelineFiles(event.dataTransfer.files);
          }}
        >
          <div className="preview-display-actions">
            <button
              className={previewTransformMode ? "active" : ""}
              data-tooltip={previewTransformMode ? "Finalizar transformacion" : "Mover y cambiar tamano del video"}
              disabled={!selectedClip}
              onClick={() => { setExportPreview(false); setPreviewTransformMode((current) => !current); }}
              type="button"
            >
              <Scaling size={17} />
            </button>
            <button
              data-tooltip="Achicar video"
              disabled={!selectedClip || (selectedClip.scale || 1) <= 0.1}
              onClick={() => updateSelectedClipTransform({ scale: Math.round(clamp((selectedClip.scale || 1) - 0.1, 0.1, 4) * 100) / 100 })}
              type="button"
            >
              <Minus size={17} />
            </button>
            <button
              data-tooltip="Agrandar video"
              disabled={!selectedClip || (selectedClip.scale || 1) >= 4}
              onClick={() => updateSelectedClipTransform({ scale: Math.round(clamp((selectedClip.scale || 1) + 0.1, 0.1, 4) * 100) / 100 })}
              type="button"
            >
              <Plus size={17} />
            </button>
            <button
              className={exportPreview ? "active" : ""}
              data-tooltip={exportPreview ? "Volver a edicion" : "Vista de exportacion"}
              onClick={() => { setExportPreview((current) => !current); setPreviewTransformMode(false); setSelectedTextId(""); }}
              type="button"
            >
              {exportPreview ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
            <button
              data-tooltip={previewExpanded ? "Restaurar preview" : "Maximizar preview"}
              onClick={() => setPreviewExpanded((current) => !current)}
              type="button"
            >
              {previewExpanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>
          </div>
          {(videoDragging || busy) && (
            <div className="video-loader">
              <Loader2 size={28} />
              <strong>{busy === "Exportando timeline" ? `${busy} · ${formatElapsed(exportElapsed)}` : busy || "Solta el video"}</strong>
            </div>
          )}
          <div
            className={previewTransformMode ? "preview-frame is-transforming" : "preview-frame"}
            onDoubleClick={() => !exportPreview && selectedClip && setPreviewTransformMode((current) => !current)}
            style={{ "--preview-ratio": previewResolution.w / previewResolution.h, aspectRatio: `${previewResolution.w} / ${previewResolution.h}` }}
          >
            {!exportPreview && <span className="preview-resolution-badge">{previewResolution.label}</span>}
            {selectedClip ? (
              <div
                className="preview-video-object"
                data-tooltip={previewTransformMode ? "Arrastra para mover. Usa las esquinas para cambiar el tamano." : "Doble click para transformar el video"}
                onPointerCancel={endPreviewTransform}
                onPointerDown={(event) => beginPreviewTransform(event, "move")}
                onPointerMove={movePreviewTransform}
                onPointerUp={endPreviewTransform}
                style={{
                  left: `${50 + (selectedClip.positionX || 0)}%`,
                  top: `${50 + (selectedClip.positionY || 0)}%`,
                  transform: `translate(-50%, -50%) scale(${(selectedClip.scale || 1) * timedZoomScale(selectedClip)})`
                }}
              >
                <video
                  className={selectedClip.effect === "pixel-art" ? "pixel-source-video" : ""}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onTimeUpdate={handlePreviewTimeUpdate}
                  muted={muteOriginal || Boolean(selectedClip?.muted)}
                  ref={previewRef}
                  src={selectedClip.previewUrl}
                  style={{ ...combinedClipEffectStyle(selectedClip), ...previewMaskStyle(selectedClip) }}
                />
                {previewSwitchFrame && <img alt="" className="preview-switch-frame" src={previewSwitchFrame} />}
                {selectedClip.effect === "pixel-art" && (
                  <canvas
                    className="pixel-art-preview"
                    ref={pixelCanvasRef}
                    style={previewMaskStyle(selectedClip)}
                  />
                )}
                {!exportPreview && previewTransformMode && ["nw", "ne", "sw", "se"].map((handle) => (
                  <span
                    className={`preview-transform-handle is-${handle}`}
                    key={handle}
                    onPointerCancel={endPreviewTransform}
                    onPointerDown={(event) => beginPreviewTransform(event, "scale", handle)}
                    onPointerMove={movePreviewTransform}
                    onPointerUp={endPreviewTransform}
                  />
                ))}
              </div>
            ) : (
              <Film size={54} />
            )}
            {activeTextOverlays.map((item) => (
              <div
                className={!exportPreview && item.id === selectedTextId ? "video-text-overlay selected" : "video-text-overlay"}
                key={item.id}
                onClick={(event) => { event.stopPropagation(); setSelectedTextId(item.id); }}
                onDoubleClick={(event) => event.stopPropagation()}
                onPointerCancel={endTextDrag}
                onPointerDown={(event) => { if (!exportPreview) beginTextDrag(event, item); }}
                onPointerMove={moveTextDrag}
                onPointerUp={endTextDrag}
                style={{
                  color: item.color,
                  fontFamily: item.fontFamily || "Arial, sans-serif",
                  fontSize: `${Math.max(1.2, item.fontSize / 10.8)}cqh`,
                  fontStyle: item.italic ? "italic" : "normal",
                  fontWeight: item.fontWeight || 700,
                  left: `${item.x}%`,
                  letterSpacing: `${item.letterSpacing || 0}px`,
                  top: `${item.y}%`,
                  width: `${item.boxWidth ?? (item.subtitle ? 80 : 60)}%`
                }}
              >
                {item.subtitle && subtitleDisplay === "bilingual" ? <>
                  <span className="video-text-content" style={{ filter: item.shadow ? `drop-shadow(${item.shadowX || 0}px ${item.shadowY || 0}px ${item.shadowBlur || 0}px ${item.shadowColor || "#000000"})` : "none" }}>{item.textEn || item.textEs}</span>
                  {item.textEs && item.textEn && <span className="video-text-translation" style={{ color: item.translationColor || "#8fe7ff", fontFamily: item.translationFontFamily || "Georgia, serif", fontSize: `${Math.max(0.8, (item.translationFontSize || 30) / 10.8)}cqh`, fontStyle: item.translationItalic !== false ? "italic" : "normal", fontWeight: item.translationFontWeight || 400 }}>{item.textEs}</span>}
                </> : <span className="video-text-content" style={{ filter: item.shadow ? `drop-shadow(${item.shadowX || 0}px ${item.shadowY || 0}px ${item.shadowBlur || 0}px ${item.shadowColor || "#000000"})` : "none" }}>{subtitleText(item, subtitleDisplay)}</span>}
                {!exportPreview && item.id === selectedTextId && ["nw", "ne", "sw", "se"].map((handle) => (
                  <span
                    className={`video-text-handle is-${handle}`}
                    key={handle}
                    onPointerCancel={endTextDrag}
                    onPointerDown={(event) => beginTextDrag(event, item, "scale", handle)}
                    onPointerMove={moveTextDrag}
                    onPointerUp={endTextDrag}
                  />
                ))}
                {!exportPreview && item.id === selectedTextId && ["w", "e"].map((handle) => (
                  <span
                    className={`video-text-handle is-${handle}`}
                    key={handle}
                    onPointerCancel={endTextDrag}
                    onPointerDown={(event) => beginTextDrag(event, item, "width", handle)}
                    onPointerMove={moveTextDrag}
                    onPointerUp={endTextDrag}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="transport-bar">
            <button disabled={!clips.length} onClick={() => jumpTimeline(-5)} data-tooltip="Retroceder timeline 5s" type="button">
              <SkipBack size={17} />
            </button>
            <button disabled={!clips.length} onClick={playTimeline} data-tooltip="Play timeline" type="button">
              <Play size={17} />
            </button>
            <button disabled={!clips.length} onClick={pauseTimeline} data-tooltip="Pausa timeline" type="button">
              <Pause size={17} />
            </button>
            <button disabled={!clips.length} onClick={stopTimeline} data-tooltip="Stop timeline" type="button">
              <Square size={17} />
            </button>
            <button disabled={!clips.length} onClick={() => jumpTimeline(5)} data-tooltip="Avanzar timeline 5s" type="button">
              <SkipForward size={17} />
            </button>
            <span>{timelineTime.toFixed(1)}s</span>
          </div>
        </div>

        <div
          className="timeline"
          data-wizard="video-timeline"
          onDragLeave={handleVideoDragLeave}
          onDragOver={handleVideoDragOver}
          onDrop={(event) => {
            event.preventDefault();
            setVideoDragging(false);
            addTimelineFiles(event.dataTransfer.files);
          }}
        >
          <div className="timeline-header">
            <strong>Timeline</strong>
            <span>{clips.length} clips - {timelineDuration.toFixed(1)}s</span>
          </div>
          <div className="video-toolstrip">
            <button disabled={!undoHistoryRef.current.length} onClick={undoVideoChange} data-tooltip="Deshacer (Ctrl+Z)" type="button">
              <Undo2 size={16} />
            </button>
            <button disabled={!redoHistoryRef.current.length} onClick={redoVideoChange} data-tooltip="Rehacer (Ctrl+Shift+Z)" type="button">
              <Redo2 size={16} />
            </button>
            <button disabled={!selectedClip} onClick={() => trimSelectedToPlayhead("start")} data-tooltip="Recortar inicio hasta el playhead" type="button">
              <Scissors size={16} />
              In
            </button>
            <button disabled={!selectedClip} onClick={() => trimSelectedToPlayhead("end")} data-tooltip="Recortar final desde el playhead" type="button">
              <Scissors size={16} />
              Out
            </button>
            <button className={videoTool === "cut" ? "active-tool" : ""} onClick={() => setVideoTool((tool) => (tool === "cut" ? "select" : "cut"))} data-tooltip="Herramienta cortar sobre clip" type="button">
              <Scissors size={16} />
              Cortar
            </button>
            <button disabled={!selectedClip} onClick={duplicateSelectedClip} data-tooltip="Duplicar clip" type="button">
              <Copy size={16} />
            </button>
            <button aria-pressed={Boolean(selectedClip?.muted)} className={selectedClip?.muted ? "active-tool" : ""} disabled={!selectedClip} onClick={() => selectedClip && toggleClipMuted(selectedClip.id)} data-tooltip={selectedClip?.muted ? "Restaurar audio del clip" : "Sacar audio del clip"} type="button">
              <VolumeX size={16} />
            </button>
            <button disabled={!selectedClip} onClick={() => selectedClip && removeClip(selectedClip.id)} data-tooltip="Borrar clip" type="button">
              <Trash2 size={16} />
            </button>
            <label className="effect-picker">
              <SlidersHorizontal size={16} />
              <select
                disabled={!selectedClip}
                onChange={(event) => selectedClip && updateClipProperty(selectedClip.id, { effect: event.target.value })}
                value={selectedClip?.effect || "none"}
              >
                <option value="none">Sin efecto</option>
                <option value="grayscale">Blanco y negro</option>
                <option value="warm">Calido</option>
                <option value="bright">Mas luz</option>
                <option value="blur">Blur</option>
                <option value="sharpen">Enfoque</option>
                <option value="cool">Frio</option>
                <option value="vintage">Vintage</option>
                <option value="contrast">Alto contraste</option>
                <option value="vignette">Vineta</option>
                <option value="mirror">Espejo</option>
                <option value="invert">Negativo</option>
                <option value="pixel-art">Pixel Art</option>
              </select>
            </label>
            {selectedClip?.effect === "pixel-art" && (
              <label className="pixel-size-control">
                Pixel
                <input
                  max="64"
                  min="2"
                  onChange={(event) => updateClipProperty(selectedClip.id, { pixelSize: Number(event.target.value) })}
                  step="1"
                  type="range"
                  value={selectedClip.pixelSize || 12}
                />
                <span>{selectedClip.pixelSize || 12}px</span>
              </label>
            )}
            {selectedClip && !["none", "mirror", "pixel-art"].includes(selectedClip.effect) && (
              <label className="pixel-size-control">
                Intensidad
                <input
                  max="200"
                  min="0"
                  onChange={(event) => updateClipProperty(selectedClip.id, { effectAmount: Number(event.target.value) })}
                  step="5"
                  type="range"
                  value={selectedClip.effectAmount ?? 100}
                />
                <span>{selectedClip.effectAmount ?? 100}%</span>
              </label>
            )}
            <label className="timeline-zoom" data-tooltip="Zoom de timeline">
              Zoom
              <input
                max="360"
                min="45"
                onChange={(event) => setTimelineScale(Number(event.target.value))}
                step="5"
                type="range"
                value={timelineScale}
              />
              <span>{Math.round(timelineScale / 90 * 100)}%</span>
            </label>
          </div>
          <div className="timed-effect-toolbar">
            <strong><SlidersHorizontal size={16} /> Efecto por tramo</strong>
            <label><span className="step-number">1</span>
              <select disabled={!selectedClip} value={effectDraft.type} onChange={(event) => setEffectDraft((current) => ({ ...current, type: event.target.value }))}>
                <option value="grayscale">Blanco y negro</option><option value="warm">Calido</option><option value="bright">Mas luz</option>
                <option value="blur">Blur</option><option value="sharpen">Enfoque</option><option value="cool">Frio</option>
                <option value="vintage">Vintage</option><option value="contrast">Alto contraste</option><option value="vignette">Vineta</option><option value="invert">Negativo</option>
                <option value="zoom-in">Zoom in</option><option value="zoom-out">Zoom out</option>
              </select>
            </label>
            <button className={effectDraft.start !== null ? "is-marked" : ""} disabled={!selectedClip} onClick={() => markEffectPoint("start")} type="button">
              <span className="step-number">2</span>{effectDraft.start === null ? "Marcar inicio" : `Inicio ${effectDraft.start.toFixed(1)}s`}
            </button>
            <button className={effectDraft.end !== null ? "is-marked" : ""} disabled={!selectedClip || effectDraft.start === null} onClick={() => markEffectPoint("end")} type="button">
              <span className="step-number">3</span>{effectDraft.end === null ? "Marcar fin" : `Fin ${effectDraft.end.toFixed(1)}s`}
            </button>
            <label className="timed-effect-setting">{effectDraft.type.startsWith("zoom-") ? "Zoom" : "Intensidad"}
              <input max="200" min="0" onChange={(event) => setEffectDraft((current) => ({ ...current, amount: Number(event.target.value) }))} step="5" type="range" value={effectDraft.amount} />
              <span>{effectDraft.type.startsWith("zoom-") ? `${(1 + effectDraft.amount / 100).toFixed(1)}x` : `${effectDraft.amount}%`}</span>
            </label>
            {!effectDraft.type.startsWith("zoom-") && <>
              <label className="timed-effect-setting compact">Fade in
                <input max="5" min="0" onChange={(event) => setEffectDraft((current) => ({ ...current, fadeIn: Number(event.target.value) }))} step="0.1" type="number" value={effectDraft.fadeIn} />
              </label>
              <label className="timed-effect-setting compact">Fade out
                <input max="5" min="0" onChange={(event) => setEffectDraft((current) => ({ ...current, fadeOut: Number(event.target.value) }))} step="0.1" type="number" value={effectDraft.fadeOut} />
              </label>
            </>}
            <button className="apply-timed-effect" disabled={!selectedClip || effectDraft.start === null || effectDraft.end === null} onClick={addTimedEffect} type="button"><Check size={15} /> Aplicar efecto</button>
            {(effectDraft.start !== null || effectDraft.end !== null) && <button onClick={() => setEffectDraft((current) => ({ ...current, start: null, end: null }))} type="button">Cancelar</button>}
            <span className="timed-effect-help">{!selectedClip ? "Selecciona un clip" : effectDraft.start === null ? "Mueve la linea roja al comienzo" : effectDraft.end === null ? "Ahora mueve la linea roja al final" : "El tramo esta listo"}</span>
          </div>
          <div
            className={videoTool === "cut" ? "multi-tracks tool-cut" : "multi-tracks"}
            onPointerCancel={endPlayheadDrag}
            onPointerDown={beginPlayheadDrag}
            onPointerMove={movePlayheadDrag}
            onPointerUp={endPlayheadDrag}
          >
            <div className="time-ruler" style={{ width: timelineWidth }}>
              {Array.from({ length: Math.ceil(timelineDuration) + 1 }).map((_, second) => (
                <span key={second} style={{ left: second * timelineScale }}>{second}s</span>
              ))}
            </div>
            <div className="playhead" style={{ left: 54 + timelineTime * timelineScale }} />
            {clips.flatMap((clip, clipIndex) => (clip.effects || []).flatMap((effect, effectIndex) => {
              const color = ["#16c5d6", "#c13cff", "#f2b84b", "#49d17d", "#ff7188"][(clipIndex + effectIndex) % 5];
              const selected = effect.id === selectedEffectId ? " selected" : "";
              return [
                <span className={`effect-range-marker is-start${selected}`} data-label="IN" key={`${effect.id}-in`} style={{ "--marker-color": color, left: 54 + (clip.start + effect.start) * timelineScale, top: 13 + ((clipIndex + effectIndex) % 4) * 9 }} />,
                <span className={`effect-range-marker is-end${selected}`} data-label="OUT" key={`${effect.id}-out`} style={{ "--marker-color": color, left: 54 + (clip.start + effect.end) * timelineScale, top: 13 + ((clipIndex + effectIndex) % 4) * 9 }} />
              ];
            }))}
            {selectedClip && effectDraft.start !== null && (
              <span
                className="effect-range-marker is-start is-draft"
                data-label="NEW"
                style={{ left: 54 + (selectedClip.start + effectDraft.start) * timelineScale }}
              />
            )}
            {selectedClip && effectDraft.end !== null && (
              <span
                className="effect-range-marker is-end is-draft"
                data-label="NEW"
                style={{ left: 54 + (selectedClip.start + effectDraft.end) * timelineScale }}
              />
            )}
            <div className="timeline-track-actions">
              <button disabled={videoTrackCount >= 8} onClick={() => setVideoTrackCount((count) => Math.min(8, count + 1))} type="button"><Plus size={14} /> Video</button>
              <button onClick={addSubtitle} type="button"><Captions size={14} /> Subtitulo</button>
              <button disabled={textTrackCount >= 4} onClick={() => setTextTrackCount((count) => Math.min(4, count + 1))} type="button"><Plus size={14} /> Pista de texto</button>
            </div>
            {Array.from({ length: videoTrackCount }, (_, track) => (
              <div className="track video-track" key={track}>
                <div className="track-label track-label-tools"><strong>V{track + 1}</strong><span><button data-tooltip="Subir pista" disabled={track === 0} onClick={() => swapVideoTracks(track, -1)} type="button"><ChevronUp size={13} /></button><button data-tooltip="Bajar pista" disabled={track === videoTrackCount - 1} onClick={() => swapVideoTracks(track, 1)} type="button"><ChevronDown size={13} /></button><button data-tooltip="Eliminar pista" disabled={videoTrackCount <= 1} onClick={() => removeVideoTrack(track)} type="button"><Trash2 size={12} /></button></span></div>
                <div
                  className="clip-lane"
                  data-track={track}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const id = event.dataTransfer.getData("text/clip-id");
                    if (!id) return;
                    const rect = event.currentTarget.getBoundingClientRect();
                    const start = Math.round(((event.clientX - rect.left + event.currentTarget.scrollLeft) / timelineScale) * 10) / 10;
                    moveClipTo(id, track, start);
                  }}
                  style={{ width: timelineWidth }}
                >
                  {clips.filter((clip) => clip.track === track).map((clip) => (
                    <div
                      className={clip.id === selectedClip?.id ? "timeline-clip selected" : "timeline-clip"}
                      key={clip.id}
                      onClick={(event) => {
                        if (clipDragRef.current?.moved) return;
                        if (videoTool === "cut") {
                          event.stopPropagation();
                          splitClipFromPointer(event, clip);
                          return;
                        }
                        selectClipAt(clip, clip.in);
                      }}
                      onPointerCancel={endClipDrag}
                      onPointerDown={(event) => beginClipDrag(event, clip)}
                      onPointerMove={moveClipDrag}
                      onPointerUp={endClipDrag}
                      role="button"
                      style={{ left: clip.start * timelineScale, width: Math.max(54, (clip.out - clip.in) * timelineScale) }}
                      tabIndex="0"
                    >
                      <span
                        className="trim-handle trim-start"
                        onPointerCancel={endTrim}
                        onPointerDown={(event) => beginTrim(event, clip, "start")}
                        onPointerMove={moveTrim}
                        onPointerUp={endTrim}
                        data-tooltip="Comer inicio"
                      />
                      <span
                        className="trim-handle trim-end"
                        onPointerCancel={endTrim}
                        onPointerDown={(event) => beginTrim(event, clip, "end")}
                        onPointerMove={moveTrim}
                        onPointerUp={endTrim}
                        data-tooltip="Cortar final"
                      />
                      <img alt="" src={framesForClip(clip)[0]?.image} />
                      <span>{clip.name}</span>
                      <small>{clip.start.toFixed(1)}s - {(clip.start + clip.out - clip.in).toFixed(1)}s | {clip.effect === "none" ? "normal" : clip.effect}{clip.muted ? " | sin audio" : ""}</small>
                      <div className="filmstrip">
                        {timelineFramesForClip(clip).map((frame, frameIndex) => (
                          <button
                            key={`${clip.id}-${frameIndex}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              selectClipAt(clip, clamp(frame.time, clip.in, clip.out));
                            }}
                            data-tooltip={`${frame.time.toFixed(1)}s`}
                            type="button"
                          >
                            <img alt="" src={frame.image} style={clipEffectStyle(clip.effect, clip.effectAmount)} />
                          </button>
                        ))}
                      </div>
                      <div className="clip-actions">
                        <button onClick={(event) => { event.stopPropagation(); updateClip(clip.id, "start", clip.start - 0.5); }} type="button">-0.5</button>
                        <button onClick={(event) => { event.stopPropagation(); updateClip(clip.id, "start", clip.start + 0.5); }} type="button">+0.5</button>
                        <button onClick={(event) => { event.stopPropagation(); trimClip(clip.id, "start", 0.5); }} type="button">In +</button>
                        <button onClick={(event) => { event.stopPropagation(); trimClip(clip.id, "start", -0.5); }} type="button">In -</button>
                        <button className={clip.muted ? "clip-muted" : ""} onClick={(event) => { event.stopPropagation(); toggleClipMuted(clip.id); }} type="button">
                          <VolumeX size={14} />
                        </button>
                        <button onClick={(event) => { event.stopPropagation(); updateClip(clip.id, "track", clip.track - 1); }} type="button">V-</button>
                        <button onClick={(event) => { event.stopPropagation(); updateClip(clip.id, "track", clip.track + 1); }} type="button">V+</button>
                        <button onClick={(event) => { event.stopPropagation(); removeClip(clip.id); }} type="button">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {!clips.length && track === 0 ? <div className="timeline-empty">Arrastra videos aca</div> : null}
                </div>
              </div>
            ))}
          </div>
          <div className="track audio-track">
            <span className="track-label">A1</span>
            <div className={audioFile ? "audio-pill active" : "audio-pill"}>
              <Music2 size={16} />
              {audioFile ? audioFile.name : "Sin audio externo"}
              {audioFile && <button data-tooltip="Eliminar audio externo" onClick={removeExternalAudio} type="button"><Trash2 size={14} /></button>}
            </div>
          </div>
          {Array.from({ length: textTrackCount }, (_, track) => <div className="track text-track" key={`text-track-${track}`}>
            <div className="track-label track-label-tools"><strong>T{track + 1}</strong><span><button data-tooltip="Subir pista" disabled={track === 0} onClick={() => swapTextTracks(track, -1)} type="button"><ChevronUp size={13} /></button><button data-tooltip="Bajar pista" disabled={track === textTrackCount - 1} onClick={() => swapTextTracks(track, 1)} type="button"><ChevronDown size={13} /></button><button data-tooltip="Eliminar pista" disabled={textTrackCount <= 1} onClick={() => removeTextTrack(track)} type="button"><Trash2 size={12} /></button></span></div>
            <div className="clip-lane text-clip-lane" data-text-track={track} style={{ width: timelineWidth }}>
              {textOverlays.filter((item) => (item.textTrack || 0) === track).map((item) => (
                <button
                  className={item.id === selectedTextId ? "text-timeline-clip selected" : "text-timeline-clip"}
                  key={item.id}
                  onPointerCancel={endTimelineTextDrag}
                  onPointerDown={(event) => beginTimelineTextDrag(event, item)}
                  onPointerMove={moveTimelineTextDrag}
                  onPointerUp={endTimelineTextDrag}
                  style={{ left: item.start * timelineScale, width: Math.max(54, item.duration * timelineScale) }}
                  type="button"
                >
                  {item.subtitle ? <Captions size={13} /> : <Type size={13} />} {subtitleText(item, subtitleDisplay)}
                </button>
              ))}
              {!textOverlays.some((item) => (item.textTrack || 0) === track) && track === 0 && (
                <button className="timeline-empty" onClick={(event) => { event.stopPropagation(); addSubtitle(); }} type="button"><Captions size={14} /> Agregar subtitulo</button>
              )}
            </div>
          </div>)}
          <div className="track effect-track">
            <span className="track-label">E1</span>
            <div className="clip-lane effect-clip-lane" style={{ width: timelineWidth }}>
              {selectedClip && effectDraft.start !== null && (
                <div className="effect-timeline-draft" style={{ left: (selectedClip.start + Math.min(effectDraft.start, effectDraft.end ?? effectDraft.start)) * timelineScale, width: Math.max(8, Math.abs((effectDraft.end ?? effectDraft.start) - effectDraft.start) * timelineScale) }}>
                  {effectDraft.end === null ? "Inicio" : "Nuevo efecto"}
                </div>
              )}
              {clips.flatMap((clip) => (clip.effects || []).map((effect) => (
                <button
                  className={effect.id === selectedEffectId ? "effect-timeline-clip selected" : "effect-timeline-clip"}
                  key={effect.id}
                  onClick={() => {
                    setSelectedClipId(clip.id);
                    setSelectedEffectId(effect.id);
                    syncTimelinePreview(clip.start + effect.start);
                  }}
                  style={{ left: (clip.start + effect.start) * timelineScale, width: Math.max(48, (effect.end - effect.start) * timelineScale) }}
                  type="button"
                >
                  <SlidersHorizontal size={12} /> {effect.type}
                </button>
              )))}
            </div>
          </div>
        </div>
      </div>

      <div className="video-controls" data-tab={videoPropertyTab} data-wizard="video-export">
        <div className="video-panel-heading">
          <span>VIDEO</span>
          <strong>Lienzo y propiedades</strong>
        </div>
        <nav className="video-section-nav">
          <button className={videoPropertyTab === "canvas" ? "active" : ""} onClick={() => setVideoPropertyTab("canvas")} type="button"><Square size={15} /> Lienzo</button>
          <button className={videoPropertyTab === "clip" ? "active" : ""} onClick={() => setVideoPropertyTab("clip")} type="button"><Film size={15} /> Clip</button>
          <button className={videoPropertyTab === "subtitles" ? "active" : ""} onClick={() => setVideoPropertyTab("subtitles")} type="button"><Captions size={15} /> Subtitulos</button>
          <button className={videoPropertyTab === "output" ? "active" : ""} onClick={() => setVideoPropertyTab("output")} type="button"><Download size={15} /> Salida</button>
        </nav>

        <div className="video-tab-content video-tab-canvas">
        <section className="video-control-section" id="video-section-canvas">
          <h3>Lienzo</h3>
          <div className="video-canvas-presets">
            {VIDEO_CANVAS_PRESETS.map((preset) => (
              <button className={settings.resolution === preset.id ? "active" : ""} key={preset.id} onClick={() => setSettings((current) => ({ ...current, resolution: preset.id }))} type="button">
                <span style={{ aspectRatio: preset.ratio }} />
                <strong>{preset.name}</strong>
              </button>
            ))}
          </div>
          <label>
            Tamano
            <select value={settings.resolution} onChange={(event) => setSettings((current) => ({ ...current, resolution: event.target.value }))}>
              <option value="source">Original del video</option>
              <option value="1920:1080">Horizontal 1080p - 1920 x 1080</option>
              <option value="1280:720">Horizontal 720p - 1280 x 720</option>
              <option value="1080:1920">Historia / Reel - 1080 x 1920</option>
              <option value="1080:1350">Publicacion vertical - 1080 x 1350</option>
              <option value="1080:1080">Cuadrado - 1080 x 1080</option>
              <option value="854:480">480p - 854 x 480</option>
            </select>
          </label>
          {selectedClip && (
            <div className="video-fit-controls">
              <button onClick={() => fitSelectedClip("contain")} type="button"><Square size={15} /> Ajustar</button>
              <button onClick={() => fitSelectedClip("cover")} type="button"><Film size={15} /> Rellenar</button>
            </div>
          )}
        </section>

        <h3>Medios</h3>
        <label className="drop-zone">
          <Upload size={18} />
          Videos
          <input multiple accept="video/*,.mkv,.mov,.avi,.webm,.mp4" onChange={(event) => addTimelineFiles(event.target.files)} type="file" />
        </label>
        <label className="drop-zone compact">
          <FileAudio size={18} />
          Audio externo
          <input accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg" onChange={(event) => {
            replaceExternalAudio(event.target.files?.[0] || null);
            event.target.value = "";
          }} type="file" />
        </label>
        {audioFile && <div className="button-row">
          <p className="file-hint">Audio activo: {audioFile.name}</p>
          <button data-tooltip="Eliminar audio externo" onClick={removeExternalAudio} type="button"><Trash2 size={15} /> Eliminar audio</button>
        </div>}
        <label className="check-row">
          <input checked={muteOriginal} onChange={(event) => setMuteOriginal(event.target.checked)} type="checkbox" />
          <VolumeX size={16} />
          Sacar sonido original
        </label>

        <h3>Proyecto</h3>
        <div className="button-row project-actions">
          <button onClick={onRequestProjectSave} disabled={!clips.length && !audioFile && !textOverlays.length}>
            <Save size={16} />
            Guardar proyecto
          </button>
          <button onClick={onShowProjects}>
            <Upload size={16} />
            Ver proyectos
          </button>
        </div>
        {projectStatus && <p className="file-hint">{projectStatus}</p>}
        </div>

        <div className="video-tab-content video-tab-clip">
        {selectedClip && (
          <>
            <h3 id="video-section-clip">Clip</h3>
            <div className="field-grid">
              <label>
                Inicio TL
                <input value={selectedClip.start} onChange={(event) => updateClip(selectedClip.id, "start", event.target.value)} step="0.1" type="number" />
              </label>
              <label>
                Pista
                <select value={selectedClip.track} onChange={(event) => updateClip(selectedClip.id, "track", event.target.value)}>{Array.from({ length: videoTrackCount }, (_, track) => <option key={track} value={track}>V{track + 1}</option>)}</select>
              </label>
              <label>
                Entrada
                <input value={selectedClip.in} onChange={(event) => updateClip(selectedClip.id, "in", event.target.value)} step="0.1" type="number" />
              </label>
              <label>
                Salida
                <input value={selectedClip.out} onChange={(event) => updateClip(selectedClip.id, "out", event.target.value)} step="0.1" type="number" />
              </label>
              <label>
                Posicion X
                <input value={selectedClip.positionX || 0} onChange={(event) => updateSelectedClipTransform({ positionX: Number(event.target.value) || 0 })} step="1" type="number" />
              </label>
              <label>
                Posicion Y
                <input value={selectedClip.positionY || 0} onChange={(event) => updateSelectedClipTransform({ positionY: Number(event.target.value) || 0 })} step="1" type="number" />
              </label>
              <label>
                Escala
                <input max="4" min="0.1" value={selectedClip.scale || 1} onChange={(event) => updateSelectedClipTransform({ scale: clamp(Number(event.target.value) || 1, 0.1, 4) })} step="0.05" type="number" />
              </label>
            </div>
            <button className="secondary-button" onClick={() => updateSelectedClipTransform({ positionX: 0, positionY: 0, scale: 1 })} type="button">
              Restablecer encuadre
            </button>
            <h3>Mascara animada</h3>
            <div className="field-grid">
              <label>
                Forma
                <select value={selectedClip.maskType || "none"} onChange={(event) => updateSelectedClipTransform({ maskType: event.target.value })}>
                  <option value="none">Sin mascara</option>
                  <option value="fade">Fundido</option>
                  <option value="circle">Circular</option>
                  <option value="rect">Rectangular</option>
                  <option value="diamond">Rombo</option>
                  <option value="wipe">Barrido izquierda a derecha</option>
                  <option value="wipe-right">Barrido derecha a izquierda</option>
                  <option value="wipe-up">Barrido de abajo hacia arriba</option>
                </select>
              </label>
              <label>
                Entrada
                <input min="0" step="0.1" type="number" value={selectedClip.maskInDuration ?? 0.8} onChange={(event) => updateSelectedClipTransform({ maskInDuration: Math.max(0, Number(event.target.value) || 0) })} />
              </label>
              <label>
                Salida
                <input min="0" step="0.1" type="number" value={selectedClip.maskOutDuration || 0} onChange={(event) => updateSelectedClipTransform({ maskOutDuration: Math.max(0, Number(event.target.value) || 0) })} />
              </label>
            </div>
            <h3>Efectos por tiempo</h3>
            <div className="field-grid">
              <label>Efecto
                <select value={effectDraft.type} onChange={(event) => setEffectDraft((current) => ({ ...current, type: event.target.value }))}>
                  <option value="grayscale">Blanco y negro</option>
                  <option value="warm">Calido</option>
                  <option value="bright">Mas luz</option>
                  <option value="blur">Blur</option>
                  <option value="sharpen">Enfoque</option>
                  <option value="cool">Frio</option>
                  <option value="vintage">Vintage</option>
                  <option value="contrast">Alto contraste</option>
                  <option value="vignette">Vineta</option>
                  <option value="invert">Negativo</option>
                  <option value="zoom-in">Zoom in</option>
                  <option value="zoom-out">Zoom out</option>
                </select>
              </label>
              <label>Intensidad<input max="200" min="0" step="5" type="range" value={effectDraft.amount} onChange={(event) => setEffectDraft((current) => ({ ...current, amount: Number(event.target.value) }))} /></label>
              <label>Inicio<input readOnly value={effectDraft.start === null ? "-" : `${effectDraft.start.toFixed(1)}s`} /></label>
              <label>Fin<input readOnly value={effectDraft.end === null ? "-" : `${effectDraft.end.toFixed(1)}s`} /></label>
            </div>
            <div className="button-row">
              <button onClick={() => markEffectPoint("start")} type="button">Marcar inicio</button>
              <button onClick={() => markEffectPoint("end")} type="button">Marcar fin</button>
              <button disabled={effectDraft.start === null || effectDraft.end === null} onClick={addTimedEffect} type="button"><Check size={15} /> Aplicar</button>
            </div>
            {(selectedClip.effects || []).length ? (
              <div className="timed-effect-list">
                {selectedClip.effects.map((effect) => (
                  <div className={effect.id === selectedEffectId ? "timed-effect-item selected" : "timed-effect-item"} key={effect.id}>
                    <button onClick={() => { setSelectedEffectId(effect.id); syncTimelinePreview(selectedClip.start + effect.start); }} type="button">
                      <strong>{effect.type}</strong>
                      <span>{effect.start.toFixed(1)}s - {effect.end.toFixed(1)}s | {effect.amount}% | fades {effect.fadeIn ?? 0.3}s/{effect.fadeOut ?? 0.3}s</span>
                    </button>
                    <button data-tooltip="Eliminar efecto" onClick={() => removeTimedEffect(selectedClip.id, effect.id)} type="button"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            ) : <p className="file-hint">Marca dos puntos sobre el clip para aplicar un efecto.</p>}
          </>
        )}
        {!selectedClip && <p className="video-tab-empty">Selecciona un clip de la timeline para editarlo.</p>}
        </div>

        <div className="video-tab-content video-tab-subtitles">
        <h3 id="video-section-subtitles">Subtitulos</h3>
        <div className="subtitle-script-panel">
          <label>
            Texto completo
            <textarea onChange={(event) => setSubtitleScript(event.target.value)} placeholder="Pega el guion, una frase por linea..." rows="7" value={subtitleScript} />
          </label>
          <button className="secondary-button" disabled={!audioFile || !subtitleScript.trim()} onClick={distributeScriptOverAudio} type="button"><Captions size={16} /> Distribuir durante el audio</button>
          <span>{audioDuration > 0 ? `Audio: ${audioDuration.toFixed(1)} s` : "Carga un audio externo para medir su duracion"}</span>
        </div>
        <div className="subtitle-style-panel">
          <strong>Estilo de todos los subtitulos</strong>
          <div className="field-grid">
            <label>Fuente<select value={subtitleStyle.fontFamily} onChange={(event) => {
              const font = VIDEO_FONTS.find((candidate) => candidate.value === event.target.value) || VIDEO_FONTS[0];
              setSubtitleStyle((current) => ({ ...current, fontFamily: font.value, fontWeight: font.weights.includes(current.fontWeight) ? current.fontWeight : font.weights[0] }));
            }}>{VIDEO_FONTS.map((font) => <option key={font.name} value={font.value}>{font.name}</option>)}</select></label>
            <label>Peso<select value={subtitleStyle.fontWeight} onChange={(event) => setSubtitleStyle((current) => ({ ...current, fontWeight: Number(event.target.value) }))}>{(VIDEO_FONTS.find((font) => font.value === subtitleStyle.fontFamily)?.weights || VIDEO_FONTS[0].weights).map((weight) => <option key={weight} value={weight}>{FONT_WEIGHT_LABELS[weight]}</option>)}</select></label>
            <label>Tamano<input min="10" type="number" value={subtitleStyle.fontSize} onChange={(event) => setSubtitleStyle((current) => ({ ...current, fontSize: Math.max(10, Number(event.target.value) || 10) }))} /></label>
            <label>Ancho<input max="96" min="15" type="number" value={subtitleStyle.boxWidth} onChange={(event) => setSubtitleStyle((current) => ({ ...current, boxWidth: clamp(Number(event.target.value) || 80, 15, 96) }))} /></label>
            <label>Texto<input type="color" value={subtitleStyle.color} onChange={(event) => setSubtitleStyle((current) => ({ ...current, color: event.target.value }))} /></label>
            <label>Sombra<input type="color" value={subtitleStyle.shadowColor} onChange={(event) => setSubtitleStyle((current) => ({ ...current, shadowColor: event.target.value }))} /></label>
          </div>
          <label className="check-row"><input checked={subtitleStyle.italic} onChange={(event) => setSubtitleStyle((current) => ({ ...current, italic: event.target.checked }))} type="checkbox" /> Cursiva</label>
          <strong><Languages size={14} /> Estilo de traduccion</strong>
          <div className="field-grid">
            <label>Fuente<select value={subtitleStyle.translationFontFamily} onChange={(event) => {
              const font = VIDEO_FONTS.find((candidate) => candidate.value === event.target.value) || VIDEO_FONTS[0];
              const nextWeight = font.weights.includes(subtitleStyle.translationFontWeight) ? subtitleStyle.translationFontWeight : font.weights[0];
              updateTranslationStyle({ translationFontFamily: font.value, translationFontWeight: nextWeight });
            }}>{VIDEO_FONTS.map((font) => <option key={font.name} value={font.value}>{font.name}</option>)}</select></label>
            <label>Peso<select value={subtitleStyle.translationFontWeight} onChange={(event) => updateTranslationStyle({ translationFontWeight: Number(event.target.value) })}>{(VIDEO_FONTS.find((font) => font.value === subtitleStyle.translationFontFamily)?.weights || VIDEO_FONTS[0].weights).map((weight) => <option key={weight} value={weight}>{FONT_WEIGHT_LABELS[weight]}</option>)}</select></label>
            <label>Tamano<input min="10" type="number" value={subtitleStyle.translationFontSize} onChange={(event) => updateTranslationStyle({ translationFontSize: Math.max(10, Number(event.target.value) || 10) })} /></label>
            <label>Color<input type="color" value={subtitleStyle.translationColor} onChange={(event) => updateTranslationStyle({ translationColor: event.target.value })} /></label>
          </div>
          <label className="check-row"><input checked={subtitleStyle.translationItalic} onChange={(event) => updateTranslationStyle({ translationItalic: event.target.checked })} type="checkbox" /> Traduccion en cursiva</label>
          <button className="secondary-button" disabled={!textOverlays.some((item) => item.subtitle)} onClick={applySubtitleStyleToAll} type="button">Aplicar a todos</button>
        </div>
        <div className="field-grid">
          <label>Vista
            <select value={subtitleDisplay} onChange={(event) => setSubtitleDisplay(event.target.value)}>
              <option value="bilingual">Ingles + castellano</option>
              <option value="en">Solo original (English)</option>
              <option value="es">Solo traduccion (Castellano)</option>
            </select>
          </label>
          <label>Idioma del texto
            <select value={subtitleImportLanguage} onChange={(event) => setSubtitleImportLanguage(event.target.value)}>
              <option value="en">English (original)</option>
              <option value="es">Castellano (traduccion)</option>
            </select>
          </label>
        </div>
        <label className="drop-zone compact">
          <Captions size={18} />
          Importar SRT / VTT
          <input accept=".srt,.vtt,text/vtt,application/x-subrip" onChange={(event) => { importSubtitles(event.target.files?.[0]); event.target.value = ""; }} type="file" />
        </label>
        <div className="button-row">
          <button onClick={addSubtitle} type="button"><Captions size={16} /> Agregar subtitulo</button>
          <button disabled={!textOverlays.some((item) => item.subtitle)} onClick={exportSubtitles} type="button"><Download size={16} /> SRT</button>
          <button disabled={!textOverlays.some((item) => item.subtitle && item.textEs && !item.textEn)} onClick={moveCurrentSubtitlesToEnglish} type="button"><Languages size={16} /> Pasar actual a English</button>
        </div>

        <h3>Textos</h3>
        <button className="secondary-button" onClick={addTextOverlay} type="button"><Type size={16} /> Agregar texto</button>
        {textOverlays.map((item) => item.id === selectedTextId ? (
          <div className="video-text-controls" key={item.id}>
            {item.subtitle ? <>
              <label>Original (English)<textarea rows="2" value={item.textEn || ""} onChange={(event) => updateTextOverlay(item.id, { textEn: event.target.value })} /></label>
              <label>Traduccion (Castellano)<textarea rows="2" value={item.textEs || ""} onChange={(event) => updateTextOverlay(item.id, { textEs: event.target.value })} /></label>
              {!item.textEn && item.textEs && <button className="subtitle-language-fix" onClick={moveCurrentSubtitlesToEnglish} type="button"><Languages size={16} /> Corregir todos: este texto es English</button>}
            </> : <label>Texto<input value={item.text} onChange={(event) => updateTextOverlay(item.id, { text: event.target.value })} /></label>}
            <div className="field-grid">
              <label>Inicio<input min="0" step="0.1" type="number" value={item.start} onChange={(event) => updateTextOverlay(item.id, { start: Math.max(0, Number(event.target.value) || 0) })} /></label>
              <label>Duracion<input min="0.1" step="0.1" type="number" value={item.duration} onChange={(event) => updateTextOverlay(item.id, { duration: Math.max(0.1, Number(event.target.value) || 0.1) })} /></label>
              <label>X<input max="100" min="0" type="number" value={item.x} onChange={(event) => updateTextOverlay(item.id, { x: clamp(Number(event.target.value) || 0, 0, 100) })} /></label>
              <label>Y<input max="100" min="0" type="number" value={item.y} onChange={(event) => updateTextOverlay(item.id, { y: clamp(Number(event.target.value) || 0, 0, 100) })} /></label>
              <label>Pista<select value={item.textTrack || 0} onChange={(event) => updateTextOverlay(item.id, { textTrack: Number(event.target.value) })}>{Array.from({ length: textTrackCount }, (_, track) => <option key={track} value={track}>T{track + 1}</option>)}</select></label>
              <label>Tamano<input min="10" type="number" value={item.fontSize} onChange={(event) => updateTextOverlay(item.id, { fontSize: Math.max(10, Number(event.target.value) || 10) })} /></label>
              <label>Ancho<input max="96" min="15" type="number" value={item.boxWidth ?? (item.subtitle ? 80 : 60)} onChange={(event) => updateTextOverlay(item.id, { boxWidth: clamp(Number(event.target.value) || 80, 15, 96) })} /></label>
              <label>Color<input type="color" value={item.color} onChange={(event) => updateTextOverlay(item.id, { color: event.target.value })} /></label>
              <label>Fuente
                <select value={item.fontFamily || VIDEO_FONTS[0].value} onChange={(event) => {
                  const font = VIDEO_FONTS.find((candidate) => candidate.value === event.target.value) || VIDEO_FONTS[0];
                  updateTextOverlay(item.id, {
                    fontFamily: font.value,
                    fontWeight: font.weights.includes(item.fontWeight) ? item.fontWeight : font.weights.includes(400) ? 400 : font.weights[0]
                  });
                }}>
                  {VIDEO_FONTS.map((font) => <option key={font.name} value={font.value}>{font.name}</option>)}
                </select>
              </label>
              <label>Peso
                <select value={item.fontWeight || 700} onChange={(event) => updateTextOverlay(item.id, { fontWeight: Number(event.target.value) })}>
                  {(VIDEO_FONTS.find((font) => font.value === item.fontFamily)?.weights || VIDEO_FONTS[0].weights).map((weight) => (
                    <option key={weight} value={weight}>{FONT_WEIGHT_LABELS[weight]}</option>
                  ))}
                </select>
              </label>
              <label>Tracking<input step="0.5" type="number" value={item.letterSpacing || 0} onChange={(event) => updateTextOverlay(item.id, { letterSpacing: Number(event.target.value) || 0 })} /></label>
              <label className="check-row"><input checked={Boolean(item.italic)} onChange={(event) => updateTextOverlay(item.id, { italic: event.target.checked })} type="checkbox" /> Cursiva</label>
            </div>
            <div className="subtitle-align-panel">
              <strong>Alinear con el lienzo</strong>
              <div>
                <button data-tooltip="Alinear a la izquierda" onClick={() => alignTextToCanvas(item, "left")} type="button"><AlignLeft size={16} /></button>
                <button data-tooltip="Centrar horizontalmente" onClick={() => alignTextToCanvas(item, "center")} type="button"><AlignCenter size={16} /></button>
                <button data-tooltip="Alinear a la derecha" onClick={() => alignTextToCanvas(item, "right")} type="button"><AlignRight size={16} /></button>
              </div>
              <div>
                <button data-tooltip="Alinear arriba" onClick={() => alignTextToCanvas(item, undefined, "top")} type="button"><ArrowUpToLine size={16} /></button>
                <button data-tooltip="Centrar verticalmente" onClick={() => alignTextToCanvas(item, undefined, "center")} type="button"><Minus size={16} /></button>
                <button data-tooltip="Alinear abajo" onClick={() => alignTextToCanvas(item, undefined, "bottom")} type="button"><ArrowDownToLine size={16} /></button>
              </div>
            </div>
            {item.subtitle && <div className="subtitle-translation-controls">
              <strong><Languages size={14} /> Traduccion</strong>
              <div className="field-grid">
                <label>Fuente<select value={item.translationFontFamily || "Georgia, serif"} onChange={(event) => {
                  const font = VIDEO_FONTS.find((candidate) => candidate.value === event.target.value) || VIDEO_FONTS[0];
                  const currentWeight = item.translationFontWeight || 400;
                  updateTranslationStyle({ translationFontFamily: font.value, translationFontWeight: font.weights.includes(currentWeight) ? currentWeight : font.weights[0] });
                }}>{VIDEO_FONTS.map((font) => <option key={font.name} value={font.value}>{font.name}</option>)}</select></label>
                <label>Peso<select value={item.translationFontWeight || 400} onChange={(event) => updateTranslationStyle({ translationFontWeight: Number(event.target.value) })}>{(VIDEO_FONTS.find((font) => font.value === item.translationFontFamily)?.weights || [400, 700]).map((weight) => <option key={weight} value={weight}>{FONT_WEIGHT_LABELS[weight]}</option>)}</select></label>
                <label>Tamano<input min="10" type="number" value={item.translationFontSize || 30} onChange={(event) => updateTranslationStyle({ translationFontSize: Math.max(10, Number(event.target.value) || 10) })} /></label>
                <label>Color<input type="color" value={item.translationColor || "#8fe7ff"} onChange={(event) => updateTranslationStyle({ translationColor: event.target.value })} /></label>
              </div>
              <label className="check-row"><input checked={item.translationItalic !== false} onChange={(event) => updateTranslationStyle({ translationItalic: event.target.checked })} type="checkbox" /> Cursiva</label>
            </div>}
            <label className="check-row"><input checked={Boolean(item.shadow)} onChange={(event) => updateTextOverlay(item.id, { shadow: event.target.checked })} type="checkbox" /> Sombra</label>
            {item.shadow && (
              <div className="field-grid">
                <label>Color sombra<input type="color" value={item.shadowColor || "#000000"} onChange={(event) => updateTextOverlay(item.id, { shadowColor: event.target.value })} /></label>
                <label>Blur<input max="40" min="0" type="range" value={item.shadowBlur || 0} onChange={(event) => updateTextOverlay(item.id, { shadowBlur: Number(event.target.value) })} /></label>
                <label>Sombra X<input step="1" type="number" value={item.shadowX || 0} onChange={(event) => updateTextOverlay(item.id, { shadowX: Number(event.target.value) || 0 })} /></label>
                <label>Sombra Y<input step="1" type="number" value={item.shadowY || 0} onChange={(event) => updateTextOverlay(item.id, { shadowY: Number(event.target.value) || 0 })} /></label>
              </div>
            )}
            <button onClick={() => removeTextOverlay(item.id)} type="button"><Trash2 size={15} /> Borrar texto</button>
          </div>
        ) : null)}
        </div>

        <div className="video-tab-content video-tab-output">
        <h3 id="video-section-output">Exportacion</h3>
        <div className="field-grid">
          <label>
            Inicio
            <input value={settings.start} onChange={(event) => setSettings((s) => ({ ...s, start: event.target.value }))} type="number" />
          </label>
          <label>
            Duracion
            <input value={settings.duration} onChange={(event) => setSettings((s) => ({ ...s, duration: event.target.value }))} type="number" />
          </label>
          <label>
            Codec
            <select value={settings.codec} onChange={(event) => setSettings((s) => ({ ...s, codec: event.target.value }))}>
              <option value="h265">H.265 / HEVC</option>
              <option value="h264">H.264</option>
            </select>
          </label>
          <label>
            Formato
            <select value={settings.format} onChange={(event) => setSettings((s) => ({ ...s, format: event.target.value }))}>
              <option value="mp4">MP4</option>
              <option value="mov">MOV</option>
            </select>
          </label>
          <label>
            Fotogramas
            <select value={settings.fps || 30} onChange={(event) => setSettings((s) => ({ ...s, fps: Number(event.target.value) }))}>
              <option value="30">30 FPS</option>
              <option value="60">60 FPS</option>
            </select>
          </label>
          <label>
            Calidad
            <input min="18" max="34" value={settings.crf} onChange={(event) => setSettings((s) => ({ ...s, crf: event.target.value }))} type="number" />
          </label>
        </div>

        <button className="secondary-button" onClick={exportTimeline} disabled={!clips.length || Boolean(busy)}>
          <Merge size={16} />
          Exportar timeline
        </button>

        {busy && <div className="video-export-progress" role="status">
          <div className="video-export-progress-track"><span style={{ width: `${exportProgress}%` }} /></div>
          <strong>{busy} · {exportProgress}% · {formatElapsed(exportElapsed)}</strong>
          <small>{settings.codec === "h265" && Number(settings.fps) === 60 ? "HEVC a 60 FPS requiere mas procesamiento." : "Procesando el video y los subtitulos."}</small>
        </div>}
        {error && <p className="panel-error">{error}</p>}
        {result && (
          <a className="download-link" href={result} download>
            Descargar video exportado
          </a>
        )}
        </div>
      </div>
    </section>
  );
}
