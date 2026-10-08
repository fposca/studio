const LENGTHS = { coin: 0.45, pickup: 1.05, victory: 1.8, punch: 0.23, kick: 0.33,
  sword: 0.4, hammer: 0.55, enemy: 0.5, demon: 0.62, hit: 0.38, metal: 0.48,
  heavy: 0.6, defeat: 0.66, jump: 0.2, land: 0.26 };

// Short layered Foley: filtered air, a low impact body and damped metallic partials.
// Buffers are generated once, with deterministic variations instead of repeated beeps.
export function synthesizeEffect(kind, sampleRate = 44100, variation = 0) {
  const length = LENGTHS[kind];
  if (!length) return new Float32Array(0);
  const samples = new Float32Array(Math.ceil(sampleRate * length));
  let seed = 173 + variation * 7919, low = 0, body = 0;
  const pitch = 1 + (variation - 1) * 0.045;
  const sine = (frequency, t) => Math.sin(2 * Math.PI * frequency * pitch * t);
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate, u = t / length;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    low += (noise - low) * 0.085;
    body += (noise - body) * 0.009;
    const air = noise - low, onset = Math.min(1, t / 0.004);
    let sample = 0;
    if (["coin", "pickup", "victory"].includes(kind)) {
      const notes = kind === "coin" ? [0] : kind === "pickup" ? [0, 4, 7] : [0, 4, 7, 12];
      notes.forEach((note, index) => {
        const elapsed = t - index * (kind === "victory" ? 0.16 : 0.095);
        if (elapsed < 0) return;
        const frequency = (kind === "coin" ? 1450 : 620) * 2 ** (note / 12);
        const envelope = Math.min(1, elapsed / 0.002) * Math.exp(-elapsed * (kind === "coin" ? 12 : 5));
        sample += (sine(frequency, elapsed) * 0.25 + sine(frequency * 2.71, elapsed) * 0.12 + sine(frequency * 4.13, elapsed) * 0.05) * envelope;
      });
      sample += air * Math.exp(-t * 110) * 0.08;
    } else if (["hit", "metal", "heavy", "defeat", "land"].includes(kind)) {
      sample = (sine(kind === "heavy" ? 53 : 82, t + 0.025 * (1 - Math.exp(-t * 25))) * 0.8 + low * 2.4) * Math.exp(-t * 19);
      sample += air * 0.32 * Math.exp(-t * 65);
      sample += body * 3 * Math.exp(-t * 7);
      if (kind === "metal") sample += (sine(870, t) + sine(2137, t) * 0.45) * Math.exp(-t * 14) * 0.13;
      if (kind === "heavy" || kind === "defeat") sample += sine(46, t) * 0.5 * Math.exp(-t * 8);
      if (kind === "land") sample *= 0.48;
    } else if (kind === "enemy" || kind === "demon") {
      const pitchBase = kind === "demon" ? 63 : 105;
      sample = (sine(pitchBase, t) + sine(pitchBase * 2.03, t) * 0.5 + low * 3) *
        Math.sin(Math.PI * u) ** 2 * (0.55 + 0.25 * Math.sin(t * 91));
    } else {
      const swell = Math.sin(Math.PI * u) ** 2;
      sample = (air * 0.18 + low * 2.6) * swell;
      if (kind === "sword") sample += sine(530 - 230 * u, t) * 0.07 * swell;
      if (kind === "hammer") sample += body * 5 * swell;
      if (kind === "jump") sample *= 0.4;
    }
    const tail = Math.min(1, (length - t) / 0.04);
    samples[i] = Math.tanh(sample * 1.15) * 0.45 * onset * tail;
  }
  return samples;
}

export function createGameSound() {
  let context, master, muted = false, suspended = false;
  const buffers = new Map(), voices = new Set();
  const silence = () => { for (const voice of voices) voice.stop(); voices.clear(); };
  const unlock = () => {
    try {
      if (!context) {
        context = new (window.AudioContext || window.webkitAudioContext)();
        master = context.createGain();
        master.gain.value = muted || suspended ? 0 : 0.62;
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -12; compressor.ratio.value = 5;
        master.connect(compressor).connect(context.destination);
      }
      if (context.state === "suspended") context.resume().catch(() => {});
    } catch { /* Gameplay remains available without an audio device. */ }
  };
  const setGain = () => { if (master) master.gain.setTargetAtTime(muted || suspended ? 0 : 0.62, context.currentTime, 0.015); };
  return {
    unlock,
    setMuted(value) { muted = value; if (value) silence(); setGain(); },
    setPaused(value) { suspended = value; if (value) silence(); setGain(); },
    play(event, player, yaw = 0) {
      if (muted || suspended || context?.state !== "running") return;
      const dx = (event.x ?? player.x) - player.x, dz = (event.z ?? player.z) - player.z;
      const distance = Math.hypot(dx, dz);
      if (distance > 18 || voices.size >= 16) return;
      let kind = event.type;
      if (kind === "attack") kind = event.kind;
      if (kind === "hit") kind = event.kind === "sword" ? "metal" : event.kind === "hammer" ? "heavy" : "hit";
      const variation = Math.floor(Math.random() * 3), key = `${kind}:${variation}`;
      if (!buffers.has(key)) {
        const samples = synthesizeEffect(kind, context.sampleRate, variation);
        if (!samples.length) return;
        const buffer = context.createBuffer(1, samples.length, context.sampleRate);
        buffer.copyToChannel(samples, 0); buffers.set(key, buffer);
      }
      const source = context.createBufferSource(), gain = context.createGain(), pan = context.createStereoPanner();
      source.buffer = buffers.get(key);
      gain.gain.value = 1 / (1 + distance * 0.16);
      pan.pan.value = Math.max(-0.8, Math.min(0.8, (dx * Math.cos(yaw) - dz * Math.sin(yaw)) / 9));
      source.connect(gain).connect(pan).connect(master);
      voices.add(source);
      source.onended = () => { voices.delete(source); source.disconnect(); gain.disconnect(); pan.disconnect(); };
      source.start();
    },
    dispose() { silence(); buffers.clear(); context?.close().catch(() => {}); }
  };
}
