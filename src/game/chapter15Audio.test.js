import test from "node:test";
import assert from "node:assert/strict";
import { CHAPTER15_AMBIENT_LAYERS, synthesizeChapter15Ambience, chapter15AmbientMix, createChapter15Audio } from "./chapter15Audio.js";

function fakeContext() {
  const nodes = [], sources = [], gains = [];
  const param = () => ({ value: 0, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; }, setTargetAtTime(v) { this.value = v; } });
  const node = props => { const n = { connect(target) { return target; }, disconnect() { this.disconnected = true; }, ...props }; nodes.push(n); return n; };
  return { sampleRate: 8000, currentTime: 0, state: "running", nodes, sources, gains, destination: {},
    createGain() { const n = node({ gain: param() }); gains.push(n); return n; },
    createStereoPanner: () => node({ pan: param() }),
    createBuffer(channels, length, rate) { const data = new Float32Array(length); return { length, sampleRate: rate, getChannelData: () => data, copyToChannel: values => data.set(values) }; },
    createBufferSource() { const n = node({ start() { this.started = true; }, stop() { this.stopped = true; } }); sources.push(n); return n; },
    suspend() { this.state = "suspended"; return Promise.resolve(); },
    resume() { this.state = "running"; return Promise.resolve(); },
    close() { this.state = "closed"; return Promise.resolve(); },
  };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test("ambient beds have audible energy, safe peaks, near-zero DC and soft loop seams", () => {
  for (const kind of CHAPTER15_AMBIENT_LAYERS) {
    const a = synthesizeChapter15Ambience(kind), b = synthesizeChapter15Ambience(kind);
    let peak = 0, energy = 0, mean = 0;
    for (let i = 0; i < a.length; i++) {
      assert.equal(a[i], b[i]); assert.ok(Number.isFinite(a[i]));
      peak = Math.max(peak, Math.abs(a[i])); energy += a[i] ** 2; mean += a[i];
    }
    assert.ok(peak > .06 && peak < .65, kind + " peak");
    assert.ok(Math.sqrt(energy / a.length) > .025, kind + " rms");
    assert.ok(Math.abs(mean / a.length) < .002, kind + " DC offset");
    assert.equal(Math.abs(a[0]), 0); assert.ok(Math.abs(a.at(-1)) < .001);
  }
});

test("the audible mix follows the existing puzzle, including a wrong-input reset and restored completion", () => {
  const original = chapter15AmbientMix({});
  const vision = chapter15AmbientMix({ visionActive: true });
  assert.ok(vision.anomaly > original.anomaly * 3);
  assert.equal(chapter15AmbientMix({ mixSequence: ["silence"] }).tape, 0);
  const pulse = chapter15AmbientMix({ mixSequence: ["silence", "pulse"] });
  assert.ok(pulse.pulse > original.pulse * 5);
  assert.deepEqual(chapter15AmbientMix({ mixSequence: [] }), original);
  const solved = chapter15AmbientMix({ channelIsolated: true, visionActive: true });
  assert.equal(solved.tape, 0); assert.ok(solved.anomaly < original.anomaly);
});

test("four beds are reused through state changes; dialogue ducks and pause/mute stop audio processing", async () => {
  const context = fakeContext(), input = new EventTarget(), doc = new EventTarget(); doc.hidden = false;
  const audio = createChapter15Audio({ contextFactory: () => context, interactionTarget: input, visibilityTarget: doc });
  audio.update({ progress: { arrived: true } }); assert.equal(context.sources.length, 0);
  input.dispatchEvent(new Event("pointerdown"));
  assert.equal(context.sources.length, 4); assert.ok(context.sources.every(s => s.loop && s.started));
  audio.update({ dialogue: true }); assert.equal(context.gains[0].gain.value, .24);
  audio.update({ dialogue: false, progress: { mixSequence: ["silence"] } });
  assert.equal(context.gains[2].gain.value, 0);
  for (let i = 0; i < 100; i++) audio.update({ progress: { visionActive: Boolean(i % 2) } });
  assert.equal(context.sources.length, 4);
  audio.update({ paused: true }); await settle(); assert.equal(context.state, "suspended");
  input.dispatchEvent(new Event("keydown")); assert.equal(context.state, "suspended");
  audio.update({ paused: false, muted: true }); await settle(); assert.equal(context.state, "suspended");
  audio.update({ muted: false }); await settle(); assert.equal(context.state, "running");
  doc.hidden = true; doc.dispatchEvent(new Event("visibilitychange")); await settle(); assert.equal(context.state, "suspended");
  audio.update({ paused: true }); doc.hidden = false; doc.dispatchEvent(new Event("visibilitychange"));
  await settle(); assert.equal(context.state, "suspended");
  audio.update({ paused: false, playingMedia: true }); await settle(); assert.equal(context.state, "suspended");
  audio.update({ playingMedia: false }); await settle(); assert.equal(context.state, "running");
  audio.dispose(); assert.equal(context.state, "closed");
  assert.ok(context.sources.every(s => s.stopped && s.disconnected));
  assert.ok(context.nodes.every(n => n.disconnected));
  input.dispatchEvent(new Event("pointerdown")); assert.equal(context.sources.length, 4);
});

test("saved mute prevents startup; store retains only the optional resonance with one transient at a time", () => {
  const context = fakeContext();
  const audio = createChapter15Audio({ ambient: false, contextFactory: () => context, interactionTarget: null, visibilityTarget: null });
  audio.update({ muted: true }); audio.unlock(); assert.equal(context.gains.length, 0);
  audio.update({ muted: false }); audio.unlock(); assert.equal(context.sources.length, 0);
  assert.ok(audio.play()); assert.ok(audio.play()); assert.equal(context.sources.length, 2);
  assert.ok(context.sources[0].stopped && context.sources[0].disconnected);
  context.sources[1].onended(); assert.ok(context.sources[1].disconnected);
  audio.dispose();
  const unavailable = createChapter15Audio({ contextFactory: () => { throw new Error("No device"); }, interactionTarget: null, visibilityTarget: null });
  assert.doesNotThrow(() => { unavailable.unlock(); unavailable.update({ paused: true }); unavailable.play(); unavailable.dispose(); });
});
