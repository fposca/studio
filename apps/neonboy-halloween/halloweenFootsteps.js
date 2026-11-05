// Footsteps belong to the standalone Halloween scene. Decode the two short
// recordings once, then play a step only after the character actually moves.
export function createHalloweenFootsteps(urls) {
  let context = null;
  let buffers = null;
  let moving = false;
  let travelled = 0;
  let stepIndex = 0;
  let disposed = false;
  const samples = Promise.all(urls.map(async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Footstep audio: ${response.status}`);
    return response.arrayBuffer();
  })).catch(() => null);

  function unlock() {
    if (disposed) return;
    if (!context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      context = new AudioContextClass();
      samples.then(async (encoded) => {
        if (!encoded || disposed || !context) return;
        try { buffers = await Promise.all(encoded.map((data) => context.decodeAudioData(data))); }
        catch { buffers = null; }
      });
    }
    if (context.state === "suspended") context.resume().catch(() => {});
  }

  function playStep(running) {
    if (!buffers?.length || context?.state !== "running") return;
    const source = context.createBufferSource();
    source.buffer = buffers[stepIndex % buffers.length];
    source.playbackRate.value = (running ? 1.08 : 1) * (stepIndex % 2 ? .97 : 1.03);
    const gain = context.createGain();
    // The second recording is about 15 dB quieter; balance it at playback.
    gain.gain.value = (running ? .52 : .42) * (stepIndex % 2 ? 5.7 : 1);
    source.connect(gain).connect(context.destination);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start();
    stepIndex++;
  }

  return {
    unlock,
    update(distance, grounded, running) {
      if (disposed || !grounded || distance < .001) {
        moving = false;
        travelled = 0;
        return;
      }
      const stride = running ? 1.35 : 1.15;
      if (!moving) { moving = true; travelled = stride * .35; }
      travelled += distance;
      if (travelled >= stride) {
        travelled %= stride;
        playStep(running);
      }
    },
    reset() { moving = false; travelled = 0; },
    dispose() {
      disposed = true;
      buffers = null;
      if (context && context.state !== "closed") context.close().catch(() => {});
      context = null;
    },
  };
}
