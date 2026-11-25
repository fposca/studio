import { createStudioSignalBuffer } from "./studioSignalAudio.js";

export const CHAPTER15_AMBIENT_LAYERS = Object.freeze(["room", "tape", "pulse", "anomaly"]);
export const CHAPTER15_AUDIO_MUTE_KEY = "neonboy.chapter15.ambient-muted.v1";

// Original, deterministic sound design. Mono beds are synthesized once at 24 kHz
// and gently spread in stereo. No downloads, audio worklets or frame callbacks.
export function synthesizeChapter15Ambience(kind, sampleRate = 24000) {
  if (!CHAPTER15_AMBIENT_LAYERS.includes(kind)) return new Float32Array(0);
  const duration = kind === "pulse" ? 8 : 12;
  const samples = new Float32Array(Math.round(sampleRate * duration));
  let seed = 19992049, low = 0, deep = 0;
  const lowAlpha = 1 - Math.exp(-2 * Math.PI * 1250 / sampleRate);
  const deepAlpha = 1 - Math.exp(-2 * Math.PI * 180 / sampleRate);
  const sine = (hz, t) => Math.sin(2 * Math.PI * hz * t);
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    low += (noise - low) * lowAlpha;
    deep += (noise - deep) * deepAlpha;
    const seam = Math.min(1, t / .10, (duration - t) / .10);
    let sound = 0;
    if (kind === "room") {
      // Mains transformer, warm ventilation, the almost inaudible capstan motor.
      sound = sine(50, t) * .15 + sine(100, t) * .065 + sine(150, t) * .025;
      sound += deep * .42 + low * .065;
      sound *= .86 + .14 * Math.cos(2 * Math.PI * t / 12);
    } else if (kind === "tape") {
      const flutter = .78 + .13 * Math.sin(t * 2.1) + .09 * Math.sin(t * 7.3);
      sound = (low - deep) * .65 * flutter + noise * .045;
      // Soft analog dropouts/rustles, never startling impact sounds.
      for (const at of [2.9, 7.2, 10.1]) sound += low * .30 * Math.exp(-(((t - at) / .18) ** 2));
      sound += sine(300, t + Math.sin(t * .7) * .0002) * .016;
    } else if (kind === "pulse") {
      const beat = (t + .55) % 2;
      const envelope = (1 - Math.exp(-beat * 30)) * Math.exp(-beat * 6);
      sound = (sine(110, t) * .48 + sine(220, t) * .19 + sine(330, t) * .06) * envelope;
      sound += sine(55, t) * .045;
    } else {
      // A slow, unstable harmonic beating, like a signal behind the glass.
      const swell = .50 + .50 * Math.sin(Math.PI * t / 6) ** 2;
      const drift = Math.sin(2 * Math.PI * t / 12) * .0018;
      sound = (sine(146.833333, t + drift) + sine(148.083333, t - drift) * .65) * .13 * swell;
      sound += sine(293.666667, t) * .035 + deep * .13;
    }
    samples[i] = Math.tanh(sound) * seam;
  }
  return samples;
}

export function chapter15AmbientMix(progress = {}) {
  const isolated = Boolean(progress.channelIsolated);
  const silenced = isolated || progress.mixSequence?.[0] === "silence";
  const pulsing = isolated || progress.mixSequence?.[1] === "pulse";
  return {
    room: .105,
    tape: silenced ? 0 : .22,
    pulse: isolated ? .065 : pulsing ? .21 : .016,
    anomaly: isolated ? .012 : progress.visionActive ? .14 : .028,
  };
}

export function createChapter15Audio({ ambient = true, contextFactory,
  visibilityTarget = globalThis.document, interactionTarget = globalThis.window } = {}) {
  let context = null, master = null, disposed = false, transitioning = false;
  let options = { progress: {}, paused: false, muted: false, dialogue: false, playingMedia: false };
  let transient = null, resonanceBuffer = null;
  const beds = new Map();
  const blocked = () => options.paused || options.muted || options.playingMedia || Boolean(visibilityTarget?.hidden);
  const setGain = (param, value, seconds = .35) => param.setTargetAtTime(value, context.currentTime, seconds);

  function reconcile() {
    if (!context || disposed || transitioning || context.state === "closed") return;
    const operation = blocked() && context.state === "running" ? "suspend"
      : !blocked() && ["suspended", "interrupted"].includes(context.state) ? "resume" : null;
    if (!operation) return;
    transitioning = true;
    Promise.resolve(context[operation]()).then(() => {
      transitioning = false;
      if (!disposed) reconcile();
    }, () => { transitioning = false; });
  }
  function applyMix() {
    if (!context || disposed) return;
    setGain(master.gain, blocked() ? 0 : options.dialogue ? .24 : .65, .16);
    const mix = chapter15AmbientMix(options.progress);
    for (const [kind, bed] of beds) setGain(bed.gain.gain, mix[kind]);
    reconcile();
  }
  function unlock() {
    if (disposed || blocked()) return;
    try {
      if (!context) {
        const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!contextFactory && !Context) return;
        context = contextFactory ? contextFactory() : new Context();
        master = context.createGain(); master.gain.value = 0;
        master.connect(context.destination);
        if (ambient) for (const [index, kind] of CHAPTER15_AMBIENT_LAYERS.entries()) {
          const samples = synthesizeChapter15Ambience(kind);
          const buffer = context.createBuffer(1, samples.length, 24000);
          buffer.copyToChannel(samples, 0);
          const source = context.createBufferSource(), gain = context.createGain();
          const pan = context.createStereoPanner?.();
          source.buffer = buffer; source.loop = true; gain.gain.value = 0;
          if (pan) { pan.pan.value = [-.12, .20, 0, -.30][index]; source.connect(gain).connect(pan).connect(master); }
          else source.connect(gain).connect(master);
          beds.set(kind, { source, gain, pan }); source.start();
        }
      }
      applyMix();
    } catch { /* Missing/denied audio must never block exploration or the puzzle. */ }
  }
  const visibilityChanged = () => applyMix();
  visibilityTarget?.addEventListener("visibilitychange", visibilityChanged);
  interactionTarget?.addEventListener("pointerdown", unlock, true);
  interactionTarget?.addEventListener("keydown", unlock, true);
  function stopResonance() {
    if (!transient) return;
    const { source, gain } = transient; transient = null;
    source.onended = null;
    try { source.stop(); } catch { /* Already ended. */ }
    source.disconnect(); gain.disconnect();
  }
  return {
    unlock,
    update(next) { options = { ...options, ...next }; applyMix(); },
    play() {
      if (disposed || blocked() || context?.state !== "running") return false;
      stopResonance();
      resonanceBuffer ||= createStudioSignalBuffer(context, false, .35);
      const source = context.createBufferSource(), gain = context.createGain(), now = context.currentTime;
      source.buffer = resonanceBuffer;
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.16, now + .15);
      gain.gain.setValueAtTime(.16, now + 2.6); gain.gain.linearRampToValueAtTime(0, now + 3);
      source.connect(gain).connect(master); transient = { source, gain };
      source.onended = stopResonance; source.start(); return true;
    },
    dispose() {
      if (disposed) return; disposed = true;
      visibilityTarget?.removeEventListener("visibilitychange", visibilityChanged);
      interactionTarget?.removeEventListener("pointerdown", unlock, true);
      interactionTarget?.removeEventListener("keydown", unlock, true);
      stopResonance();
      for (const { source, gain, pan } of beds.values()) {
        try { source.stop(); } catch { /* Already stopped. */ }
        source.disconnect(); gain.disconnect(); pan?.disconnect();
      }
      beds.clear(); resonanceBuffer = null;
      master?.disconnect(); context?.close().catch(() => {}); context = null;
    },
  };
}
