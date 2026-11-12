import test from "node:test";
import assert from "node:assert/strict";
import { createAdaptiveGraphicsQuality, graphicsPixelRatio, readGraphicsSettings, saveGraphicsSettings } from "./halloweenGraphicsQuality.js";

test("graphics settings persist independently of the game save and recover from invalid storage", () => {
  const items = new Map();
  const storage = { getItem: key => items.get(key), setItem: (key, value) => items.set(key, value) };
  assert.deepEqual(readGraphicsSettings(storage), { mode: "auto", showFps: false });
  assert.equal(saveGraphicsSettings({ mode: "low", showFps: true }, storage), true);
  assert.deepEqual(readGraphicsSettings(storage), { mode: "low", showFps: true });
  items.set("neonboy.halloween.graphics.v1", "broken");
  assert.deepEqual(readGraphicsSettings(storage), { mode: "auto", showFps: false });
});

test("pixel budget reduces internal resolution without depending on a phone model", () => {
  assert.ok(graphicsPixelRatio(1920, 1080, 3, "low") < 1);
  assert.ok(graphicsPixelRatio(800, 400, 3, "ultra") > graphicsPixelRatio(800, 400, 3, "medium"));
});

test("automatic quality requires sustained slow frames and does not react to a tab pause", () => {
  const adaptive = createAdaptiveGraphicsQuality("high");
  let now = 0, sample;
  for (let i = 0; i < 620; i++) { now += 33.3; sample = adaptive.frame(now, true) || sample; }
  assert.equal(adaptive.tier, "medium");
  adaptive.frame(now + 20_000, false);
  assert.equal(adaptive.tier, "medium");
  assert.ok(sample.fps >= 29 && sample.fps <= 31);
  adaptive.setMode("ultra");
  assert.equal(adaptive.tier, "ultra");
});
