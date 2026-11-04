import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { NEONBOY_VOICES, chooseExplorationCue, chooseDemonVictoryCue, resolveCombatCue } from "./halloweenNeonboyVoices.js";

test("every configured recording exists, and the missing combat line is explicit", () => {
  for (const [id, cue] of Object.entries(NEONBOY_VOICES)) {
    if (id === "neonboy-combat-01") {
      assert.equal(cue.file, null);
      continue;
    }
    assert.ok(existsSync(fileURLToPath(new URL(`./audio/neonboy/${cue.file}`, import.meta.url))), `${id} has its recording`);
  }
  assert.equal(resolveCombatCue({ "neonboy-combat-02.mp3": "found" }), "neonboy-combat-02");
});

test("exploration lines alternate and the special victory stays occasional", () => {
  assert.equal(chooseExplorationCue("neonboy-random-04", () => 0), "neonboy-random-07");
  assert.equal(chooseExplorationCue("neonboy-random-07", () => 0), "neonboy-random-04");
  assert.equal(chooseDemonVictoryCue(() => 0.14), "neonboy-special-01");
  assert.equal(chooseDemonVictoryCue(() => 0.15), "neonboy-victory-03");
});

test("damage voice is tied to a lost heart and has a 20 second cooldown", () => {
  const damage = NEONBOY_VOICES["neonboy-damage-02"];
  assert.equal(damage.event, "heart-lost");
  assert.equal(damage.cooldownMs, 20000);
});
