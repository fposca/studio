export function createStudioSignalBuffer(context, reverse, interference) {
  const length = Math.floor(context.sampleRate * 3);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < length; index++) {
    const time = index / context.sampleRate;
    const pulse = [.43, 1.05, 1.69, 2.31].reduce((sum, beat) =>
      sum + Math.exp(-Math.pow((time - beat) * 15, 2)), 0);
    const carrier = Math.sin(time * Math.PI * 2 * 110) * .13 +
      Math.sin(time * Math.PI * 2 * 220) * .07;
    const staticNoise = Math.sin(index * 1.721) * Math.sin(index * .337) * .11 * interference;
    samples[reverse ? length - 1 - index : index] = (carrier + pulse * .18 + staticNoise) * .72;
  }
  return buffer;
}

// Short, optional playback. The existing studio signal is reused at low volume.
export function createOriginInterferenceAudio() {
  let context = null, source = null, gain = null, disposed = false;
  function unlock() {
    if (disposed) return;
    try {
      const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Context) return;
      context ||= new Context();
      if (context.state === 'suspended') context.resume().catch(() => {});
    } catch { /* Audio availability never blocks the mission. */ }
  }
  function stop() {
    if (source) { source.onended = null; try { source.stop(); } catch {} source.disconnect(); source = null; }
    gain?.disconnect(); gain = null;
  }
  return {
    unlock,
    play() {
      if (disposed || !context || context.state !== 'running') return false;
      stop(); source = context.createBufferSource(); gain = context.createGain();
      source.buffer = createStudioSignalBuffer(context, false, 1);
      const now = context.currentTime;
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.16, now + .15);
      gain.gain.setValueAtTime(.16, now + 2.6); gain.gain.linearRampToValueAtTime(0, now + 3);
      source.connect(gain).connect(context.destination); source.start();
      source.onended = stop; return true;
    },
    setPaused(paused) {
      if (!context || context.state === 'closed') return;
      if (paused && context.state === 'running') context.suspend().catch(() => {});
      else if (!paused && context.state === 'suspended') context.resume().catch(() => {});
    },
    stop,
    dispose() { if (disposed) return; disposed = true; stop(); context?.close().catch(() => {}); context = null; },
  };
}
