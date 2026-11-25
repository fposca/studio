import test from "node:test";
import assert from "node:assert/strict";
import { createCityPopulation, CITY_WALK_ROUTES, sampleCityRoute, isCitizenSpawnSafe,
  CITY_POPULATION_PROFILES, crossingIsRed } from "./buenosAiresPopulation.js";
import { advanceBuenosAires } from "./buenosAiresQuest.js";

test("population keeps eleven logical identities and unique Desconectada, never spawns in traffic", () => {
  const roster = createCityPopulation();
  assert.equal(roster.length, 64);
  assert.equal(new Set(roster.map(a => a.id)).size, 64);
  assert.equal(roster.filter(a => a.type === "disconnected").length, 1);
  assert.equal(roster.filter(a => !a.ambient).length, 11);
  assert.deepEqual(roster, createCityPopulation());
  const positions = roster.map(a => a.route == null ? a : sampleCityRoute(a.route, a.offset * CITY_WALK_ROUTES[a.route].length, a.direction, a.lane));
  positions.forEach((p, i) => assert.ok(isCitizenSpawnSafe(p.x, p.z), roster[i].id));
  for (let i = 0; i < positions.length; i++) for (let j = i + 1; j < positions.length; j++)
    assert.ok(Math.hypot(positions[i].x - positions[j].x, positions[i].z - positions[j].z) > 1.2, roster[i].id + "/" + roster[j].id);
  assert.equal(new Set(roster.filter(a => a.ambient).map(a => a.type)).size, 7);
  for (const type of ["fatman", "oldman", "parrotman"])
    assert.ok(roster.some(a => a.ambient && a.type === type), type);
  assert.equal(new Set(roster.filter(a => a.ambient).map(a => a.direction)).size, 2);
});
test("budgets scale down for Android without duplicating skeletons for distant citizens", () => {
  assert.deepEqual(Object.values(CITY_POPULATION_PROFILES).map(p => [p.near, p.middle, p.far]),
    [[14, 22, 28], [10, 16, 22], [6, 10, 14]]);
});
test("citizens wait before stepping into a red-light crossing", () => {
  assert.equal(crossingIsRed(-31.7, -24, -31.4, -24, 3), true);
  assert.equal(crossingIsRed(-31.7, -24, -31.4, -24, 15), false);
  assert.equal(crossingIsRed(39, -26.4, 39, -26.8, 3), true);
  assert.equal(crossingIsRed(39, -42, 39, -41.4, 3), true);
  assert.equal(crossingIsRed(-20, -24, -19, -24, 3), false);
});
test("environmental clones cannot advance the three-distinct-citizens quest", () => {
  let p = advanceBuenosAires(null, "citizen:ba-man-1");
  for (let i = 0; i < 53; i++) p = advanceBuenosAires(p, "citizen:ba-crowd-" + i);
  p = advanceBuenosAires(p, "citizen:ba-man-1");
  assert.deepEqual(p.citizens, ["ba-man-1"]);
  p = advanceBuenosAires(p, "citizen:ba-woman-1"); p = advanceBuenosAires(p, "citizen:ba-executive-1");
  assert.equal(p.citizens.length, 3);
});
