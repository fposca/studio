import { JUNGLE_DURATION } from "./junglePulseLogic.js";

// Original 120 BPM synth-rock loop. Every event is scheduled against AudioContext.currentTime.
export function createJunglePulseAudio(volume = .55) {
  const Constructor = window.AudioContext || window.webkitAudioContext;
  if (!Constructor) return { start() {}, time: () => 0, tick() {}, pause() {}, resume() {}, hit() {}, close() {} };
  const context = new Constructor();
  const master = context.createGain();
  master.gain.value = .12 * volume;
  master.connect(context.destination);
  let startAt = 0, nextStep = 0, closed = false;
  function tone(frequency, at, duration, kind = "square", gain = .2, ending = frequency) {
    if (closed || at > startAt + JUNGLE_DURATION + .2) return;
    const osc = context.createOscillator(), env = context.createGain();
    osc.type = kind;
    osc.frequency.setValueAtTime(frequency, at);
    if (ending !== frequency) osc.frequency.exponentialRampToValueAtTime(Math.max(20, ending), at + duration);
    env.gain.setValueAtTime(.001, at);
    env.gain.linearRampToValueAtTime(gain, at + .006);
    env.gain.exponentialRampToValueAtTime(.001, at + duration);
    osc.connect(env).connect(master);
    osc.start(at); osc.stop(at + duration + .01);
  }
  const bass = [82.41, 82.41, 98, 110, 73.42, 73.42, 98, 123.47];
  const melody = [329.63, 392, 440, 392, 293.66, 329.63, 392, 493.88];
  function schedule(step) {
    const at = startAt + step * .25;
    if (step % 2 === 0) {
      const beat = step / 2;
      tone(bass[Math.floor(beat / 4) % bass.length], at, .33, "sawtooth", .19);
      if (beat % 2 === 0) tone(130, at, .15, "sine", .55, 45);
      else tone(205, at, .1, "triangle", .18, 80);
      if (beat % 4 !== 1) tone(melody[beat % melody.length], at + .02, .19, "square", .11);
    }
    tone(2200, at, .025, "triangle", .045, 1200);
  }
  return {
    start() { startAt = context.currentTime + .12; nextStep = 0; void context.resume().catch(() => {}); },
    time() { return Math.max(0, context.currentTime - startAt); },
    tick() {
      if (closed || context.state !== "running") return;
      const horizon = context.currentTime + .18;
      while (nextStep * .25 < JUNGLE_DURATION && startAt + nextStep * .25 < horizon) schedule(nextStep++);
    },
    hit(rating) {
      if (closed || context.state !== "running") return;
      const now = context.currentTime;
      tone(rating === "perfect" ? 880 : rating === "good" ? 660 : 180, now, .09, "square", .13);
    },
    pause() { if (!closed && context.state === "running") void context.suspend().catch(() => {}); },
    resume() { if (!closed && context.state === "suspended") void context.resume().catch(() => {}); },
    close() { if (closed) return; closed = true; master.disconnect(); void context.close().catch(() => {}); },
  };
}
