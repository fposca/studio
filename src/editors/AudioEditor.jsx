import React, { useEffect, useRef, useState } from "react";
import { ClipboardPaste, Copy, Download, FileAudio, Loader2, Mic, MousePointer2, Music2, Pause, Play, Plus, Redo2, RotateCcw, Save, Scissors, Square, Trash2, Undo2, Upload, Volume2 } from "lucide-react";
import { getProject, putProject } from "../storage/projectDb";

const API = window.location.port === "5173" ? "http://127.0.0.1:5174" : window.location.origin;
const EQ_BANDS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const FLAT_EQ = Object.fromEntries(EQ_BANDS.map((frequency) => [frequency, 0]));
const EQ_PRESETS = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  rock: [-1, 2, 4, 5, 2, -1, -2, 0, 3, 4],
  jazz: [3, 2, 1, 2, -1, -1, 0, 1, 3, 4],
  classical: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4],
  pop: [-1, 2, 4, 5, 3, 0, -1, -1, 0, 1],
  vocal: [-3, -2, 0, 3, 5, 5, 3, 1, 0, -2],
  bass: [7, 6, 5, 3, 1, -1, -2, -3, -3, -3],
  electronic: [4, 3, 0, -2, -1, 2, 4, 5, 4, 3]
};

function formatTime(value) {
  const numeric = Number(value);
  const seconds = Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}.${Math.floor((seconds % 1) * 10)}`;
}

function clipDuration(clip) {
  const finish = Number(clip?.end || clip?.duration || 0);
  const startAt = Number(clip?.start || 0);
  return Number.isFinite(finish) && Number.isFinite(startAt) ? Math.max(0.1, finish - startAt) : 0.1;
}

function delayPreviewSettings(preset) {
  return {
    slapback: { wet: 0.26, feedback: 0.12 },
    vocal: { wet: 0.34, feedback: 0.26 },
    dub: { wet: 0.48, feedback: 0.52 },
    long: { wet: 0.42, feedback: 0.64 }
  }[preset] || { wet: 0.34, feedback: 0.26 };
}

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

export default function AudioEditor({ active = false, onRequestProjectSave }) {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const pendingSettingsRef = useRef(null);
  const waveformDragRef = useRef("");
  const undoRef = useRef([]);
  const redoRef = useRef([]);
  const audioContextRef = useRef(null);
  const audioNodesRef = useRef(null);
  const reverbPresetRef = useRef("");
  const recorderRef = useRef(null);
  const recordingStartedAtRef = useRef(0);
  const recordingChunksRef = useRef([]);
  const clipClipboardRef = useRef(null);
  const draggedClipRef = useRef("");
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [peaks, setPeaks] = useState([]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [volume, setVolume] = useState(100);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [normalize, setNormalize] = useState(false);
  const [effects, setEffects] = useState({ delay: 0, delayPreset: "vocal", reverb: 0, reverbPreset: "room", distortion: 0, lowpass: 20000, highpass: 0 });
  const [equalizer, setEqualizer] = useState(FLAT_EQ);
  const [eqPreset, setEqPreset] = useState("flat");
  const [format, setFormat] = useState("mp3");
  const [bitrate, setBitrate] = useState("192k");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [panelTab, setPanelTab] = useState("edit");
  const [historyCounts, setHistoryCounts] = useState({ undo: 0, redo: 0 });
  const [clips, setClips] = useState([]);
  const [selectedClipId, setSelectedClipId] = useState("");
  const [trackCount, setTrackCount] = useState(2);
  const [recording, setRecording] = useState(false);
  const [hasClipboard, setHasClipboard] = useState(false);
  const [waveformTool, setWaveformTool] = useState("select");
  const [waveformHoverTime, setWaveformHoverTime] = useState(null);

  function editSnapshot() {
    return { start, end, volume, fadeIn, fadeOut, normalize, effects: { ...effects }, equalizer: { ...equalizer }, eqPreset, format, bitrate };
  }

  function syncHistory() {
    setHistoryCounts({ undo: undoRef.current.length, redo: redoRef.current.length });
  }

  function pushHistory() {
    undoRef.current.push(editSnapshot());
    if (undoRef.current.length > 80) undoRef.current.shift();
    redoRef.current = [];
    syncHistory();
  }

  function restoreEdit(snapshot) {
    if (!snapshot) return;
    setStart(snapshot.start); setEnd(snapshot.end); setVolume(snapshot.volume);
    setFadeIn(snapshot.fadeIn); setFadeOut(snapshot.fadeOut); setNormalize(snapshot.normalize);
    setEffects({ ...snapshot.effects }); setEqualizer({ ...snapshot.equalizer }); setEqPreset(snapshot.eqPreset || "custom"); setFormat(snapshot.format); setBitrate(snapshot.bitrate);
  }

  function undoEdit() {
    const previous = undoRef.current.pop();
    if (!previous) return;
    redoRef.current.push(editSnapshot());
    restoreEdit(previous);
    syncHistory();
  }

  function redoEdit() {
    const next = redoRef.current.pop();
    if (!next) return;
    undoRef.current.push(editSnapshot());
    restoreEdit(next);
    syncHistory();
  }

  function activateClip(clip) {
    if (!clip) return;
    pendingSettingsRef.current = { start: clip.start || 0, end: clip.end || clip.duration || 0 };
    if (url) URL.revokeObjectURL(url);
    const nextUrl = URL.createObjectURL(clip.file);
    setFile(clip.file);
    setUrl(nextUrl);
    setSelectedClipId(clip.id);
    setCurrentTime(clip.start || 0);
    setPlaying(false);
    setError("");
    setResult("");
  }

  function loadAudio(nextFile, options = {}) {
    if (!nextFile) return;
    const clip = {
      id: crypto.randomUUID(),
      name: options.name || nextFile.name || `Grabacion ${clips.length + 1}`,
      file: nextFile,
      start: 0,
      end: options.duration || 0,
      duration: options.duration || 0,
      offset: options.offset || 0,
      track: options.track ?? 0
    };
    setClips((current) => [...current, clip]);
    activateClip(clip);
    undoRef.current = [];
    redoRef.current = [];
    syncHistory();
  }

  function selectClip(clip) {
    activateClip(clip);
  }

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  useEffect(() => () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    if (audioContextRef.current && audioContextRef.current.state !== "closed") audioContextRef.current.close();
  }, []);

  function distortionCurve(amount) {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const strength = Math.max(0, amount) * 4;
    for (let index = 0; index < samples; index += 1) {
      const x = index * 2 / samples - 1;
      curve[index] = amount ? ((3 + strength) * x * 20 * Math.PI / 180) / (Math.PI + strength * Math.abs(x)) : x;
    }
    return curve;
  }

  function reverbImpulse(context, preset = "room") {
    const settings = {
      room: { seconds: 0.7, decay: 3.8 },
      studio: { seconds: 1.1, decay: 3.2 },
      plate: { seconds: 1.7, decay: 2.4 },
      hall: { seconds: 2.8, decay: 2.1 },
      cathedral: { seconds: 4.2, decay: 1.7 }
    }[preset] || { seconds: 0.7, decay: 3.8 };
    const length = Math.floor(context.sampleRate * settings.seconds);
    const impulse = context.createBuffer(2, length, context.sampleRate);
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * ((1 - index / length) ** settings.decay);
    }
    return impulse;
  }

  function ensureAudioGraph() {
    if (audioNodesRef.current || !audioRef.current) return audioNodesRef.current;
    const context = new AudioContext();
    const source = context.createMediaElementSource(audioRef.current);
    const gain = context.createGain();
    const lowpass = context.createBiquadFilter(); lowpass.type = "lowpass";
    const highpass = context.createBiquadFilter(); highpass.type = "highpass";
    const eqNodes = EQ_BANDS.map((frequency) => {
      const filter = context.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.value = frequency;
      filter.Q.value = 1.15;
      filter.gain.value = equalizer[frequency] || 0;
      return filter;
    });
    const distortion = context.createWaveShaper(); distortion.oversample = "4x";
    const dry = context.createGain();
    const delay = context.createDelay(1); const delayWet = context.createGain(); const feedback = context.createGain();
    const convolver = context.createConvolver(); const reverbWet = context.createGain();
    convolver.buffer = reverbImpulse(context, effects.reverbPreset);
    reverbPresetRef.current = effects.reverbPreset;
    source.connect(gain).connect(lowpass).connect(highpass);
    let eqTail = highpass;
    eqNodes.forEach((filter) => { eqTail.connect(filter); eqTail = filter; });
    eqTail.connect(distortion);
    distortion.connect(dry).connect(context.destination);
    distortion.connect(delay).connect(delayWet).connect(context.destination);
    delay.connect(feedback).connect(delay);
    distortion.connect(convolver).connect(reverbWet).connect(context.destination);
    audioContextRef.current = context;
    audioNodesRef.current = { gain, lowpass, highpass, eqNodes, distortion, dry, delay, delayWet, feedback, convolver, reverbWet };
    return audioNodesRef.current;
  }

  function previewEnvelope(time = currentTime) {
    let envelope = volume / 100;
    if (fadeIn > 0) envelope *= Math.min(1, Math.max(0, (time - start) / fadeIn));
    if (fadeOut > 0) envelope *= Math.min(1, Math.max(0, (end - time) / fadeOut));
    return envelope;
  }

  function updatePreviewGain(time = currentTime) {
    const nodes = audioNodesRef.current;
    const context = audioContextRef.current;
    if (!nodes || !context) return;
    nodes.gain.gain.setTargetAtTime(previewEnvelope(time), context.currentTime, 0.01);
  }

  useEffect(() => {
    if (!file) { setPeaks([]); return; }
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const context = new AudioContext();
        const buffer = await context.decodeAudioData(reader.result.slice(0));
        const decodedDuration = Number.isFinite(buffer.duration) ? buffer.duration : 0;
        const samples = buffer.getChannelData(0);
        const count = 640;
        const block = Math.max(1, Math.floor(samples.length / count));
        const nextPeaks = Array.from({ length: count }, (_, index) => {
          let peak = 0;
          const offset = index * block;
          for (let sample = offset; sample < Math.min(samples.length, offset + block); sample += 1) peak = Math.max(peak, Math.abs(samples[sample]));
          return peak;
        });
        if (!cancelled) {
          setPeaks(nextPeaks);
          if (decodedDuration > 0) {
            setDuration(decodedDuration);
            setClips((current) => current.map((clip) => {
              if (clip.id !== selectedClipId) return clip;
              const safeStart = Number.isFinite(clip.start) ? clip.start : 0;
              const safeEnd = Number.isFinite(clip.end) && clip.end > safeStart ? Math.min(clip.end, decodedDuration) : decodedDuration;
              setStart(safeStart);
              setEnd(safeEnd);
              return { ...clip, start: safeStart, end: safeEnd, duration: decodedDuration };
            }));
          }
        }
        await context.close();
      } catch {
        if (!cancelled) setError("No se pudo analizar la forma de onda de este audio.");
      }
    };
    reader.readAsArrayBuffer(file);
    return () => { cancelled = true; };
  }, [file, selectedClipId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth || 900;
    const height = canvas.clientHeight || 260;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#11161b";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#2e3741";
    ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2); ctx.stroke();
    if (!peaks.length) return;
    const segmentDuration = Math.max(0.001, end - start);
    const startX = 0;
    const endX = width;
    ctx.fillStyle = "rgba(161, 0, 255, 0.12)";
    ctx.fillRect(0, 0, width, height);
    const visiblePeaks = peaks.map((peak, index) => ({ peak, time: index / Math.max(1, peaks.length - 1) * duration })).filter(({ time }) => time >= start && time <= end);
    const barWidth = width / Math.max(1, visiblePeaks.length);
    visiblePeaks.forEach(({ peak, time }, index) => {
      const x = index * barWidth;
      let envelope = volume / 100;
      if (fadeIn > 0) envelope *= Math.min(1, Math.max(0, (time - start) / fadeIn));
      if (fadeOut > 0) envelope *= Math.min(1, Math.max(0, (end - time) / fadeOut));
      const barHeight = Math.max(2, Math.min(height - 10, peak * (height - 34) * envelope));
      ctx.fillStyle = "#b932ff";
      ctx.fillRect(x, (height - barHeight) / 2, Math.max(1, barWidth - 1), barHeight);
    });
    ctx.strokeStyle = "#ecb6ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, height / 2);
    ctx.lineTo(Math.min(endX, fadeIn / segmentDuration * width), 12);
    ctx.lineTo(Math.max(startX, endX - fadeOut / segmentDuration * width), 12);
    ctx.lineTo(endX, height / 2);
    ctx.stroke();
    ctx.fillStyle = "#d77cff";
    ctx.fillRect(startX, 0, 2, height);
    ctx.fillRect(endX - 2, 0, 2, height);
    const handles = [
      { x: startX, y: height - 12, color: "#ffffff" },
      { x: endX, y: height - 12, color: "#ffffff" },
      { x: fadeIn / segmentDuration * width, y: 12, color: "#ecb6ff" },
      { x: endX - fadeOut / segmentDuration * width, y: 12, color: "#ecb6ff" }
    ];
    handles.forEach((handle) => {
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = handle.color;
      ctx.fill();
      ctx.strokeStyle = "#6200a0";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    const playX = (currentTime - start) / segmentDuration * width;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(playX - 1, 0, 2, height);
    if (waveformTool === "scissors" && Number.isFinite(waveformHoverTime)) {
      const cutX = (waveformHoverTime - start) / segmentDuration * width;
      ctx.strokeStyle = "#ff4f73";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(cutX, 0); ctx.lineTo(cutX, height); ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [currentTime, duration, end, fadeIn, fadeOut, peaks, start, volume, waveformHoverTime, waveformTool]);

  useEffect(() => {
    if (!active && audioRef.current) audioRef.current.pause();
  }, [active]);

  useEffect(() => {
    function handleHistoryKeys(event) {
      const target = event.target;
      const isEditing = target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
      if (!active || isEditing) return;
      if (event.key === "Escape") { setWaveformTool("select"); setWaveformHoverTime(null); return; }
      if (event.code === "Space" && !target?.closest?.("button, a, label")) {
        event.preventDefault();
        togglePlayback();
        return;
      }
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "c" && selectedClipId) { event.preventDefault(); copyClip(); return; }
      if (key === "v" && clipClipboardRef.current) { event.preventDefault(); pasteClip(); return; }
      if (key === "z" && !event.shiftKey) { event.preventDefault(); undoEdit(); }
      if (key === "y" || (key === "z" && event.shiftKey)) { event.preventDefault(); redoEdit(); }
    }
    window.addEventListener("keydown", handleHistoryKeys);
    return () => window.removeEventListener("keydown", handleHistoryKeys);
  });

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = 1;
    updatePreviewGain();
  }, [volume, fadeIn, fadeOut, start, end]);

  useEffect(() => {
    const nodes = audioNodesRef.current;
    const context = audioContextRef.current;
    if (!nodes || !context) return;
    const now = context.currentTime;
    const delaySettings = delayPreviewSettings(effects.delayPreset);
    nodes.delay.delayTime.setTargetAtTime(effects.delay / 1000, now, 0.02);
    nodes.delayWet.gain.setTargetAtTime(effects.delay > 0 ? delaySettings.wet : 0, now, 0.02);
    nodes.feedback.gain.setTargetAtTime(effects.delay > 0 ? delaySettings.feedback : 0, now, 0.02);
    nodes.reverbWet.gain.setTargetAtTime(effects.reverb / 100 * 0.72, now, 0.02);
    if (reverbPresetRef.current !== effects.reverbPreset) {
      nodes.convolver.buffer = reverbImpulse(context, effects.reverbPreset);
      reverbPresetRef.current = effects.reverbPreset;
    }
    nodes.distortion.curve = distortionCurve(effects.distortion / 100);
    nodes.lowpass.frequency.setTargetAtTime(effects.lowpass, now, 0.02);
    nodes.highpass.frequency.setTargetAtTime(Math.max(10, effects.highpass), now, 0.02);
  }, [effects]);

  useEffect(() => {
    const nodes = audioNodesRef.current;
    const context = audioContextRef.current;
    if (!nodes || !context) return;
    nodes.eqNodes.forEach((filter, index) => filter.gain.setTargetAtTime(equalizer[EQ_BANDS[index]] || 0, context.currentTime, 0.015));
  }, [equalizer]);

  function handleMetadata(event) {
    const value = Number(event.currentTarget.duration);
    if (!Number.isFinite(value) || value <= 0) return;
    setDuration(value);
    const pending = pendingSettingsRef.current;
    const nextStart = Math.min(value, pending?.start || 0);
    const nextEnd = Math.min(value, pending?.end || value);
    setStart(nextStart);
    setEnd(nextEnd);
    setClips((current) => current.map((clip) => clip.id === selectedClipId ? { ...clip, duration: value, start: nextStart, end: nextEnd } : clip));
    pendingSettingsRef.current = null;
  }

  useEffect(() => {
    if (!selectedClipId || !duration) return;
    setClips((current) => current.map((clip) => clip.id === selectedClipId ? { ...clip, start, end, duration } : clip));
  }, [duration, end, selectedClipId, start]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) { audio.pause(); return; }
    const nodes = ensureAudioGraph();
    const context = audioContextRef.current;
    if (context?.state === "suspended") await context.resume();
    if (nodes && context) {
      const now = context.currentTime;
      const delaySettings = delayPreviewSettings(effects.delayPreset);
      nodes.delay.delayTime.setValueAtTime(effects.delay / 1000, now);
      nodes.delayWet.gain.setValueAtTime(effects.delay > 0 ? delaySettings.wet : 0, now);
      nodes.feedback.gain.setValueAtTime(effects.delay > 0 ? delaySettings.feedback : 0, now);
      nodes.reverbWet.gain.setValueAtTime(effects.reverb / 100 * 0.72, now);
      nodes.distortion.curve = distortionCurve(effects.distortion / 100);
      nodes.lowpass.frequency.setValueAtTime(effects.lowpass, now);
      nodes.highpass.frequency.setValueAtTime(Math.max(10, effects.highpass), now);
    }
    if (audio.currentTime < start || audio.currentTime >= end) audio.currentTime = start;
    updatePreviewGain(audio.currentTime);
    audio.play();
  }

  function handleTimeUpdate(event) {
    const audio = event.currentTarget;
    if (audio.currentTime >= end) { audio.pause(); audio.currentTime = start; }
    setCurrentTime(audio.currentTime);
    updatePreviewGain(audio.currentTime);
  }

  function waveformTime(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    return start + ratio * Math.max(0, end - start);
  }

  function beginWaveformEdit(event) {
    if (!duration || !audioRef.current) return;
    if (waveformTool === "scissors") {
      const cutTime = waveformTime(event);
      audioRef.current.currentTime = cutTime;
      setCurrentTime(cutTime);
      splitClipAtCursor(cutTime);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const segmentDuration = Math.max(0.001, end - start);
    const positions = {
      start: { x: 0, y: rect.height - 12 },
      end: { x: rect.width, y: rect.height - 12 },
      fadeIn: { x: fadeIn / segmentDuration * rect.width, y: 12 },
      fadeOut: { x: rect.width - fadeOut / segmentDuration * rect.width, y: 12 }
    };
    const distance = (handle) => Math.hypot(handle.x - pointerX, handle.y - pointerY);
    const nearest = Object.entries(positions).sort(([, first], [, second]) => distance(first) - distance(second))[0];
    if (nearest && distance(nearest[1]) <= 20) {
      pushHistory();
      waveformDragRef.current = nearest[0];
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    const time = Math.max(start, Math.min(end, waveformTime(event)));
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }

  function moveWaveformEdit(event) {
    if (waveformTool === "scissors") {
      setWaveformHoverTime(waveformTime(event));
      return;
    }
    const mode = waveformDragRef.current;
    if (!mode || !duration) return;
    const time = waveformTime(event);
    if (mode === "start") {
      const next = Math.min(time, end - 0.05);
      setStart(next);
      setFadeIn((current) => Math.min(current, Math.max(0, end - next) / 2));
    } else if (mode === "end") {
      const next = Math.max(time, start + 0.05);
      setEnd(next);
      setFadeOut((current) => Math.min(current, Math.max(0, next - start) / 2));
    } else if (mode === "fadeIn") {
      setFadeIn(Math.max(0, Math.min((end - start) / 2, time - start)));
    } else if (mode === "fadeOut") {
      setFadeOut(Math.max(0, Math.min((end - start) / 2, end - time)));
    }
  }

  function endWaveformEdit(event) {
    if (waveformDragRef.current && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    waveformDragRef.current = "";
  }

  function resetEdits() {
    pushHistory();
    setStart(0); setEnd(duration); setVolume(100); setFadeIn(0); setFadeOut(0); setNormalize(false);
    setEffects({ delay: 0, delayPreset: "vocal", reverb: 0, reverbPreset: "room", distortion: 0, lowpass: 20000, highpass: 0 });
    setEqualizer(FLAT_EQ);
    setEqPreset("flat");
  }

  function setTrimAtCursor(edge) {
    if (!duration) return;
    pushHistory();
    if (edge === "start") {
      const next = Math.min(currentTime, end - 0.05);
      setStart(Math.max(0, next));
      if (audioRef.current && audioRef.current.currentTime < next) audioRef.current.currentTime = next;
      return;
    }
    setEnd(Math.max(start + 0.05, currentTime));
  }

  function splitClipAtCursor(atTime = currentTime) {
    const clip = clips.find((item) => item.id === selectedClipId);
    if (!clip || atTime <= start + 0.05 || atTime >= end - 0.05) return;
    const splitAt = atTime;
    const right = {
      ...clip,
      id: crypto.randomUUID(),
      name: `${clip.name} B`,
      start: splitAt,
      offset: clip.offset + (splitAt - start)
    };
    const left = { ...clip, name: `${clip.name} A`, end: splitAt };
    setClips((current) => current.flatMap((item) => item.id === clip.id ? [left, right] : [item]));
    activateClip(right);
  }

  function copyClip() {
    const clip = clips.find((item) => item.id === selectedClipId);
    if (clip) {
      clipClipboardRef.current = { ...clip };
      setHasClipboard(true);
    }
  }

  function pasteClip() {
    const source = clipClipboardRef.current;
    if (!source) return;
    const copy = { ...source, id: crypto.randomUUID(), name: `${source.name} copia`, offset: Math.max(0, currentTime) };
    setClips((current) => [...current, copy]);
    activateClip(copy);
  }

  function deleteClip() {
    if (!selectedClipId) return;
    const remaining = clips.filter((clip) => clip.id !== selectedClipId);
    setClips(remaining);
    setSelectedClipId("");
    setFile(null);
    setUrl("");
    setPlaying(false);
    if (remaining[0]) activateClip(remaining[0]);
  }

  function dropClip(event, track) {
    event.preventDefault();
    const id = draggedClipRef.current;
    if (!id) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const length = Math.max(10, ...clips.map((clip) => (Number.isFinite(clip.offset) ? clip.offset : 0) + clipDuration(clip)));
    const offset = Math.max(0, (event.clientX - rect.left) / rect.width * length);
    setClips((current) => current.map((clip) => clip.id === id ? { ...clip, track, offset } : clip));
    draggedClipRef.current = "";
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      recordingChunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) recordingChunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const recordedDuration = Math.max(0.1, (performance.now() - recordingStartedAtRef.current) / 1000);
        const blob = new Blob(recordingChunksRef.current, { type: mimeType });
        const recordedFile = new File([blob], `grabacion-${Date.now()}.webm`, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        loadAudio(recordedFile, { duration: recordedDuration, name: "Grabacion de microfono", offset: currentTime, track: Math.min(trackCount - 1, 1) });
      };
      recorderRef.current = recorder;
      recordingStartedAtRef.current = performance.now();
      recorder.start(200);
      setRecording(true);
    } catch {
      setError("No se pudo acceder al microfono. Revisa el permiso del navegador.");
    }
  }

  function resetEffects() {
    pushHistory();
    setEffects({ delay: 0, delayPreset: "vocal", reverb: 0, reverbPreset: "room", distortion: 0, lowpass: 20000, highpass: 0 });
  }

  function resetEqualizer() {
    pushHistory();
    setEqualizer(FLAT_EQ);
    setEqPreset("flat");
  }

  function applyEqualizerPreset(preset) {
    const values = EQ_PRESETS[preset];
    if (!values) return;
    pushHistory();
    setEqPreset(preset);
    setEqualizer(Object.fromEntries(EQ_BANDS.map((frequency, index) => [frequency, values[index]])));
  }

  function applyDelayPreset(preset) {
    const delays = { slapback: 90, vocal: 180, dub: 380, long: 650 };
    pushHistory();
    setEffects((current) => ({ ...current, delayPreset: preset, delay: delays[preset] || 0 }));
  }

  function applyReverbPreset(preset) {
    const amounts = { room: 28, studio: 34, plate: 42, hall: 52, cathedral: 65 };
    pushHistory();
    setEffects((current) => ({ ...current, reverbPreset: preset, reverb: current.reverb || amounts[preset] }));
  }

  async function exportAudio() {
    if (!file) return;
    setBusy("Procesando audio"); setError(""); setResult("");
    try {
      const form = new FormData();
      form.append("audio", file);
      form.append("start", String(start));
      form.append("end", String(end));
      form.append("volume", String(volume));
      form.append("fadeIn", String(fadeIn));
      form.append("fadeOut", String(fadeOut));
      form.append("normalize", String(normalize));
      form.append("format", format);
      form.append("bitrate", bitrate);
      Object.entries(effects).forEach(([key, value]) => form.append(key, String(value)));
      form.append("equalizer", JSON.stringify(equalizer));
      const response = await fetch(`${API}/api/audio/export`, { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudo exportar el audio.");
      setResult(payload.url);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy("");
    }
  }

  async function saveWorkspace({ projectId }) {
    await putProject(`workspace:${projectId}:audio`, { file, clips, selectedClipId, trackCount, start, end, volume, fadeIn, fadeOut, normalize, effects, equalizer, eqPreset, format, bitrate });
    return { kind: "audio", thumbnail: "" };
  }

  async function loadWorkspace({ projectId }) {
    const saved = await getProject(`workspace:${projectId}:audio`);
    if (!saved) return;
    if (saved.clips?.length) {
      setClips(saved.clips);
      setTrackCount(saved.trackCount || 2);
      activateClip(saved.clips.find((clip) => clip.id === saved.selectedClipId) || saved.clips[0]);
    } else if (saved.file) {
      pendingSettingsRef.current = saved;
      loadAudio(saved.file);
    }
    setVolume(saved.volume ?? 100);
    setFadeIn(saved.fadeIn || 0); setFadeOut(saved.fadeOut || 0); setNormalize(Boolean(saved.normalize));
    setEffects({ delay: 0, delayPreset: "vocal", reverb: 0, reverbPreset: "room", distortion: 0, lowpass: 20000, highpass: 0, ...saved.effects });
    setEqualizer({ ...FLAT_EQ, ...saved.equalizer });
    setEqPreset(saved.eqPreset || "custom");
    setFormat(saved.format || "mp3"); setBitrate(saved.bitrate || "192k");
  }

  useWorkspacePersistence(saveWorkspace, loadWorkspace);

  const timelineDuration = Math.max(10, ...clips.map((clip) => (Number.isFinite(clip.offset) ? clip.offset : 0) + clipDuration(clip)));

  return (
    <section className="audio-workspace">
      <header className="audio-toolbar" data-wizard="audio-tools">
        <label className="audio-upload"><Upload size={17} /> Abrir audio<input accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac" onChange={(event) => loadAudio(event.target.files?.[0])} type="file" /></label>
        <button className={recording ? "is-recording" : ""} onClick={toggleRecording} type="button">{recording ? <Square size={15} /> : <Mic size={17} />} {recording ? "Detener" : "Grabar"}</button>
        <button className={waveformTool === "select" ? "tool-active" : ""} data-tooltip="Seleccionar y editar" onClick={() => setWaveformTool("select")} type="button"><MousePointer2 size={17} /></button>
        <button className={waveformTool === "scissors" ? "tool-active" : ""} data-tooltip="Tijera: hace clic sobre la onda para cortar" disabled={!file} onClick={() => setWaveformTool("scissors")} type="button"><Scissors size={17} /></button>
        <button data-tooltip="Copiar clip" disabled={!selectedClipId} onClick={copyClip} type="button"><Copy size={17} /></button>
        <button data-tooltip="Pegar clip" disabled={!hasClipboard} onClick={pasteClip} type="button"><ClipboardPaste size={17} /></button>
        <button data-tooltip="Eliminar clip" disabled={!selectedClipId} onClick={deleteClip} type="button"><Trash2 size={17} /></button>
        <button onClick={() => setTrackCount((count) => count + 1)} type="button"><Plus size={17} /> Pista</button>
        <button data-tooltip="Deshacer" disabled={!historyCounts.undo} onClick={undoEdit} type="button"><Undo2 size={17} /></button>
        <button data-tooltip="Rehacer" disabled={!historyCounts.redo} onClick={redoEdit} type="button"><Redo2 size={17} /></button>
        <button disabled={!file} onClick={resetEdits} type="button"><RotateCcw size={17} /> Restablecer</button>
        <button disabled={!file} onClick={onRequestProjectSave} type="button"><Save size={17} /> Guardar</button>
      </header>
      <main className="audio-stage" data-wizard="audio-waveform">
        {!clips.length ? <div className="audio-empty"><Music2 size={52} /><strong>Abri un audio o graba una pista</strong><span>Archivos de audio o microfono</span></div> : <>
          <div className="audio-timeline">
            <div className="audio-ruler"><span>0:00</span><span>{formatTime(timelineDuration / 2)}</span><span>{formatTime(timelineDuration)}</span></div>
            {Array.from({ length: trackCount }, (_, track) => <div className="audio-track" key={track}>
              <div className="audio-track-label"><strong>{track + 1}</strong><span>Audio</span></div>
              <div className="audio-track-lane" onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropClip(event, track)}>
                {clips.filter((clip) => clip.track === track).map((clip) => {
                  const clipLength = clipDuration(clip);
                  const clipOffset = Number.isFinite(clip.offset) ? clip.offset : 0;
                  return <button className={`audio-clip ${clip.id === selectedClipId ? "selected" : ""}`} draggable key={clip.id} onClick={() => selectClip(clip)} onDragStart={() => { draggedClipRef.current = clip.id; }} style={{ left: `${clipOffset / timelineDuration * 100}%`, width: `${Math.max(0.8, clipLength / timelineDuration * 100)}%` }} type="button"><span>{clip.name}</span><small>{formatTime(clipLength)}</small></button>;
                })}
              </div>
            </div>)}
          </div>
          {file && <>
          <div className="audio-file-heading"><FileAudio size={24} /><div><strong>{file.name}</strong><span>{formatTime(duration)} · {(file.size / 1024 / 1024).toFixed(1)} MB</span></div></div>
          <canvas className={`audio-waveform ${waveformTool === "scissors" ? "using-scissors" : ""}`} onPointerCancel={endWaveformEdit} onPointerDown={beginWaveformEdit} onPointerLeave={() => setWaveformHoverTime(null)} onPointerMove={moveWaveformEdit} onPointerUp={endWaveformEdit} ref={canvasRef} />
          <div className="audio-transport">
            <button className="audio-play" onClick={togglePlayback} type="button">{playing ? <Pause size={22} /> : <Play size={22} />}</button>
            <strong>{formatTime(currentTime)}</strong><span>/ {formatTime(duration)}</span>
            <input max={duration || 1} min="0" onChange={(event) => { const time = Number(event.target.value); audioRef.current.currentTime = time; setCurrentTime(time); }} step="0.01" type="range" value={currentTime} />
          </div>
          <div className="audio-cut-actions">
            <button disabled={currentTime >= end} onClick={() => setTrimAtCursor("start")} type="button"><Scissors size={16} /> Inicio aqui</button>
            <button disabled={currentTime <= start} onClick={() => setTrimAtCursor("end")} type="button"><Scissors size={16} /> Final aqui</button>
            <span>Seleccion: {formatTime(Math.max(0, end - start))}</span>
          </div>
          <audio onEnded={() => setPlaying(false)} onLoadedMetadata={handleMetadata} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} onTimeUpdate={handleTimeUpdate} ref={audioRef} src={url} />
          </>}
        </>}
      </main>
      <aside className="audio-controls" data-wizard="audio-export">
        <h2>Audio</h2>
        <nav className="image-panel-tabs audio-panel-tabs" aria-label="Panel de audio">
          <button className={panelTab === "edit" ? "active" : ""} onClick={() => setPanelTab("edit")} type="button">Editar</button>
          <button className={panelTab === "effects" ? "active" : ""} onClick={() => setPanelTab("effects")} type="button">Efectos</button>
          <button className={panelTab === "equalizer" ? "active" : ""} onClick={() => setPanelTab("equalizer")} type="button">EQ</button>
          <button className={panelTab === "export" ? "active" : ""} onClick={() => setPanelTab("export")} type="button">Exportar</button>
        </nav>
        {panelTab === "edit" && <div className="audio-panel-section">
        <section><h3>Recorte</h3><label>Inicio <span>{formatTime(start)}</span><input disabled={!file} max={Math.max(0, end - 0.05)} min="0" onChange={(event) => setStart(Number(event.target.value))} onPointerDown={pushHistory} step="0.01" type="range" value={start} /></label><label>Final <span>{formatTime(end)}</span><input disabled={!file} max={duration || 1} min={Math.min(duration, start + 0.05)} onChange={(event) => setEnd(Number(event.target.value))} onPointerDown={pushHistory} step="0.01" type="range" value={end} /></label></section>
        <section><h3>Nivel</h3><label><Volume2 size={14} /> Volumen <span>{volume}%</span><input disabled={!file} max="200" min="0" onChange={(event) => setVolume(Number(event.target.value))} onPointerDown={pushHistory} type="range" value={volume} /></label><label className="check-row"><input checked={normalize} disabled={!file} onChange={(event) => { pushHistory(); setNormalize(event.target.checked); }} type="checkbox" /> Normalizar volumen</label></section>
        <section><h3>Fundidos</h3><label>Entrada <span>{fadeIn.toFixed(1)}s</span><input disabled={!file} max={Math.max(0, Math.min(10, (end - start) / 2))} min="0" onChange={(event) => setFadeIn(Number(event.target.value))} onPointerDown={pushHistory} step="0.1" type="range" value={fadeIn} /></label><label>Salida <span>{fadeOut.toFixed(1)}s</span><input disabled={!file} max={Math.max(0, Math.min(10, (end - start) / 2))} min="0" onChange={(event) => setFadeOut(Number(event.target.value))} onPointerDown={pushHistory} step="0.1" type="range" value={fadeOut} /></label></section>
        </div>}
        {panelTab === "effects" && <div className="audio-panel-section">
        <section><div className="audio-effects-heading"><h3>Efectos</h3><button data-tooltip="Restablecer efectos" disabled={!file} onClick={resetEffects} type="button"><RotateCcw size={14} /></button></div>
          <label>Tipo de delay<select disabled={!file} onChange={(event) => applyDelayPreset(event.target.value)} value={effects.delayPreset}><option value="slapback">Slapback</option><option value="vocal">Vocal</option><option value="dub">Dub</option><option value="long">Eco largo</option></select></label>
          <label>Delay <span>{effects.delay} ms</span><input disabled={!file} max="800" min="0" onChange={(event) => setEffects((current) => ({ ...current, delay: Number(event.target.value) }))} onPointerDown={pushHistory} step="10" type="range" value={effects.delay} /></label>
          <label>Tipo de reverb<select disabled={!file} onChange={(event) => applyReverbPreset(event.target.value)} value={effects.reverbPreset}><option value="room">Room</option><option value="studio">Studio</option><option value="plate">Plate</option><option value="hall">Hall</option><option value="cathedral">Cathedral</option></select></label>
          <label>Reverb <span>{effects.reverb}%</span><input disabled={!file} max="100" min="0" onChange={(event) => setEffects((current) => ({ ...current, reverb: Number(event.target.value) }))} onPointerDown={pushHistory} type="range" value={effects.reverb} /></label>
          <label>Distorsion <span>{effects.distortion}%</span><input disabled={!file} max="100" min="0" onChange={(event) => setEffects((current) => ({ ...current, distortion: Number(event.target.value) }))} onPointerDown={pushHistory} type="range" value={effects.distortion} /></label>
          <label>Filtro grave <span>{effects.lowpass >= 20000 ? "Off" : `${effects.lowpass} Hz`}</span><input disabled={!file} max="20000" min="500" onChange={(event) => setEffects((current) => ({ ...current, lowpass: Number(event.target.value) }))} onPointerDown={pushHistory} step="100" type="range" value={effects.lowpass} /></label>
          <label>Filtro agudo <span>{effects.highpass <= 20 ? "Off" : `${effects.highpass} Hz`}</span><input disabled={!file} max="5000" min="0" onChange={(event) => setEffects((current) => ({ ...current, highpass: Number(event.target.value) }))} onPointerDown={pushHistory} step="50" type="range" value={effects.highpass} /></label>
        </section>
        </div>}
        {panelTab === "equalizer" && <div className="audio-panel-section">
        <section className="audio-eq-section">
          <div className="audio-eq-console">
            <div className="audio-eq-display"><span>INTER GRAPHIC EQ</span><strong>{eqPreset === "custom" ? "CUSTOM" : eqPreset.toUpperCase()}</strong></div>
            <div className="audio-eq-toolbar">
              <label>Preset<select disabled={!file} onChange={(event) => applyEqualizerPreset(event.target.value)} value={eqPreset}><option disabled value="custom">Personalizado</option><option value="flat">Flat</option><option value="rock">Rock</option><option value="jazz">Jazz</option><option value="classical">Clasica</option><option value="pop">Pop</option><option value="vocal">Vocal</option><option value="bass">Bass boost</option><option value="electronic">Electronica</option></select></label>
              <button data-tooltip="Restablecer ecualizador" disabled={!file} onClick={resetEqualizer} type="button"><RotateCcw size={14} /></button>
            </div>
            <div className="audio-eq-rack">
              <div className="audio-eq-scale"><span>+12</span><span>0</span><span>-12</span></div>
              <div className="audio-equalizer">
                {EQ_BANDS.map((frequency) => (
                  <label key={frequency}>
                    <span>{equalizer[frequency] > 0 ? "+" : ""}{equalizer[frequency] || 0}</span>
                    <input disabled={!file} max="12" min="-12" onChange={(event) => { setEqPreset("custom"); setEqualizer((current) => ({ ...current, [frequency]: Number(event.target.value) })); }} onPointerDown={pushHistory} orient="vertical" step="1" type="range" value={equalizer[frequency] || 0} />
                    <strong>{frequency >= 1000 ? `${frequency / 1000}k` : frequency}</strong>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>
        </div>}
        {panelTab === "export" && <div className="audio-panel-section">
        <section><h3>Exportar</h3><div className="field-grid"><label>Formato<select onChange={(event) => { pushHistory(); setFormat(event.target.value); }} value={format}><option value="mp3">MP3</option><option value="wav">WAV</option></select></label><label>Calidad<select disabled={format === "wav"} onChange={(event) => { pushHistory(); setBitrate(event.target.value); }} value={bitrate}><option value="128k">128 kbps</option><option value="192k">192 kbps</option><option value="256k">256 kbps</option><option value="320k">320 kbps</option></select></label></div><button className="primary-button" disabled={!file || Boolean(busy)} onClick={exportAudio} type="button">{busy ? <Loader2 className="spin" size={17} /> : <Download size={17} />} Exportar audio</button>{result && <a className="download-link" download href={result}><Download size={16} /> Descargar resultado</a>}{error && <p className="panel-error">{error}</p>}</section>
        </div>}
      </aside>
    </section>
  );
}
