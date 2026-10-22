import assert from "node:assert/strict";
import test from "node:test";
import { NEON_UNIVERSE_SCENARIOS, getScenarioStatus } from "./neonUniverseScenarios.js";

const studio = NEON_UNIVERSE_SCENARIOS.find((scenario) => scenario.id === "recording-studio");
const club = NEON_UNIVERSE_SCENARIOS.find((scenario) => scenario.id === "rock-club");
const arcade = NEON_UNIVERSE_SCENARIOS.find((scenario) => scenario.id === "arcade-1999");
const production = { DEV: false };

test("the mission opens the studio first and the club after the master is delivered", () => {
  assert.equal(getScenarioStatus(studio, [], production), "locked");
  assert.equal(getScenarioStatus(club, [], production), "locked");
  assert.equal(getScenarioStatus(studio, ["recording-studio"], production), "available");
  assert.equal(getScenarioStatus(club, ["recording-studio"], production), "locked");
  assert.equal(getScenarioStatus(club, ["recording-studio", "rock-club"], production), "available");
});

test("Arcade 1999 opens after the anomaly and has an explicit preview flag", () => {
  assert.equal(getScenarioStatus(arcade, [], production), "locked");
  assert.equal(getScenarioStatus(arcade, ["rock-club"], production), "locked");
  assert.equal(getScenarioStatus(arcade, ["arcade-1999"], production), "available");
  assert.equal(getScenarioStatus(arcade, [], { DEV: true }), "locked");
  assert.equal(getScenarioStatus(arcade, [], { VITE_ARCADE_1999_PREVIEW: "true" }), "available");
});

test("preview flags can expose the scenes without changing saved unlocks", () => {
  assert.equal(getScenarioStatus(studio, [], { DEV: true }), "available");
  assert.equal(getScenarioStatus(club, [], { DEV: true }), "available");
  assert.equal(getScenarioStatus(club, [], { DEV: true, VITE_ROCK_CLUB_PREVIEW: "false" }), "locked");
  assert.equal(getScenarioStatus(club, [], { DEV: false, VITE_ROCK_CLUB_PREVIEW: "true" }), "available");
});
