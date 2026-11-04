import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { findDemonVoiceUrl } from "./halloweenDemonVoices.js";

test("each demon line resolves to its descriptive recording", () => {
  const recordings = readdirSync(new URL("../../halloween/", import.meta.url))
    .filter((name) => name.startsWith("Venezolano-") && name.endsWith(".mp3"));
  const voiceUrls = Object.fromEntries(recordings.map((name) => [`../../halloween/${name}`, name]));
  assert.equal(recordings.length, 4);
  const matched = [1, 2, 3, 4].map((id) => findDemonVoiceUrl(voiceUrls, id));
  assert.equal(new Set(matched).size, 4);
  assert.ok(matched.every(Boolean));
  assert.match(matched[0], /mascara-/i);
  assert.match(matched[1], /verdadera-forma/i);
  assert.match(matched[2], /lucecita/i);
  assert.match(matched[3], /borrando-del-sistema/i);
});

test("numbered replacements take priority when provided", () => {
  const files = {
    "../../halloween/Venezolano-Ey,-mascara-line.mp3": "artist recording",
    "./voices/demon-regueton-01.mp3": "replacement",
  };
  assert.equal(findDemonVoiceUrl(files, 1), "replacement");
  assert.equal(findDemonVoiceUrl(files, 5), null);
});
