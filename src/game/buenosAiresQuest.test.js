import test from "node:test";
import * as THREE from "three";
import assert from "node:assert/strict";
import { normalizeUniverseGame } from "./neonUniverseSaves.js";
import { advanceBuenosAires, normalizeBuenosAiresProgress, buenosAiresObjective } from "./buenosAiresQuest.js";
import {
  BUENOS_AIRES_BUILDINGS, BUENOS_AIRES_PEDESTRIAN_ROUTES,
  BA_GARDEN_LETTERS, OBELISK, OBELISK_FIELD, OBELISK_APPROACH, BUENOS_AIRES_FLIGHT_ROUTES, canStandInBuenosAires, safeBuenosAiresSpawn,
} from "./buenosAiresLayout.js";

test("Chapter 14 progress requires completion of Chapter 13 and stays open after exploration", () => {
  assert.equal(normalizeBuenosAiresProgress({ entered: true, obeliskExplored: true }, false).entered, false);
  let progress = advanceBuenosAires(null, "enter", true);
  assert.equal(progress.entered, true);
  assert.match(buenosAiresObjective(progress), /tres ciudadanos/);
  progress = advanceBuenosAires(progress, "obelisk-explored", true);
  assert.equal(progress.obeliskExplored, true);
  assert.match(buenosAiresObjective(progress), /tres ciudadanos/);
  assert.equal(normalizeBuenosAiresProgress(progress, true).obeliskExplored, true);
  assert.equal(progress.completed, false);
});

test("the Obelisk, buildings and scene edges are solid", () => {
  assert.equal(OBELISK.height, 67.5);
  assert.equal(canStandInBuenosAires(0, 42), true);
  assert.equal(canStandInBuenosAires(OBELISK.x, OBELISK.z), false);
  for (const building of BUENOS_AIRES_BUILDINGS)
    assert.equal(canStandInBuenosAires(building.x, building.z), false, building.name);
  assert.equal(canStandInBuenosAires(77, 0), false);
  assert.deepEqual(safeBuenosAiresSpawn({ x: 0, z: OBELISK.z }),
    { x: 0, z: 42, yaw: Math.PI, viewYaw: 0 });
});

test("all pedestrian routes stay clear along entire sidewalk and crossing segments", () => {
  assert.equal(BUENOS_AIRES_PEDESTRIAN_ROUTES.length, 6);
  for (const route of BUENOS_AIRES_PEDESTRIAN_ROUTES)
    for (let index = 0; index < route.points.length; index++) {
      const [x, z] = route.points[index], [endX, endZ] = route.points[(index + 1) % route.points.length];
      for (let t = 0; t <= 1; t += .025)
        assert.equal(canStandInBuenosAires(x + (endX - x) * t, z + (endZ - z) * t),
          true, route.id + ": segment " + index + " at " + t.toFixed(2));
    }
});

test("an edited save cannot open 2049 before completing the previous chapter", () => {
  const normalized = normalizeUniverseGame({ scene: "buenos-aires-2049",
    cityProgress: { entered: true, obeliskExplored: true },
    mapUnlocks: ["buenos-aires-2049"] });
  assert.equal(normalized.scene, "store");
  assert.equal(normalized.cityProgress.obeliskExplored, false);
  assert.equal(normalized.mapUnlocks.includes("buenos-aires-2049"), false);
});


test("the planted BA letters are solid but leave the route to the Obelisk open", () => {
  for (const letter of BA_GARDEN_LETTERS) {
    assert.equal(canStandInBuenosAires(letter.x, letter.z), false, letter.id);
    assert.equal(canStandInBuenosAires(letter.x, letter.z + 2), true, `${letter.id}: approach`);
  }
  for (let z = OBELISK_APPROACH.z; z <= 54; z += .25)
    assert.equal(canStandInBuenosAires(0, z), true, `central promenade at ${z}`);
  for (let x = -13; x <= 13; x += .5)
    assert.equal(canStandInBuenosAires(x, 21), true, `crossing at ${x}`);
});

test("all three flying corridors stay clear of buildings, the Obelisk and one another", () => {
  assert.equal(BUENOS_AIRES_FLIGHT_ROUTES.length, 3);
  const sampled = BUENOS_AIRES_FLIGHT_ROUTES.map(route => {
    const curve = new THREE.CatmullRomCurve3(route.points.map(point => new THREE.Vector3(...point)), true, "centripetal");
    const positions = Array.from({ length: 401 }, (_, i) => curve.getPointAt(i / 400));
    for (const position of positions) {
      assert.ok(position.y > 4.5, `${route.id}: flight height`);
      assert.ok(Math.abs(position.x) < 30, `${route.id}: inside avenue`);
      for (const building of BUENOS_AIRES_BUILDINGS)
        assert.ok(Math.abs(position.x - building.x) > building.hx + 3.5 ||
          Math.abs(position.z - building.z) > building.hz + 3.5 ||
          position.y > building.height + 3.5, `${route.id}: ${building.name}`);
      // The square shaft tapers with height; include the vehicle footprint.
      const shaftHalfWidth = (4.525 - (4.525 - 2.55) * Math.min(1, Math.max(0, position.y - .5) / 59.8)) * OBELISK.widthScale / Math.sqrt(2);
      assert.ok(Math.max(Math.abs(position.x - OBELISK.x), Math.abs(position.z - OBELISK.z)) > shaftHalfWidth + 3.5,
        `${route.id}: widened Obelisk clearance at ${position.toArray()}`);
    }
    return positions;
  });
  for (const a of sampled[0]) for (const b of sampled[1])
    assert.ok(a.distanceTo(b) > 7, "independent cars keep a 7 m separation");
  assert.ok(BUENOS_AIRES_FLIGHT_ROUTES[1].speed > BUENOS_AIRES_FLIGHT_ROUTES[0].speed);
  assert.ok(BUENOS_AIRES_FLIGHT_ROUTES[1].startDelay > BUENOS_AIRES_FLIGHT_ROUTES[0].startDelay);
});

test("yellow car reaction is saved once without changing the city mission", () => {
  const before = advanceBuenosAires(null, "enter", true);
  const after = advanceBuenosAires(before, "yellow-car-seen", true);
  assert.equal(after.yellowCarSeen, true);
  assert.equal(after.obeliskExplored, false);
  assert.deepEqual(advanceBuenosAires(after, "yellow-car-seen", true), after);
  assert.equal(normalizeBuenosAiresProgress(after, true).yellowCarSeen, true);
  assert.equal(normalizeBuenosAiresProgress({}, true).yellowCarSeen, false);
});

test("three distinct citizens reveal the signal and the Desconectada without completing Chapter 14", () => {
  let progress = advanceBuenosAires(null, "enter", true);
  progress = advanceBuenosAires(progress, "citizen:ba-man-1", true);
  progress = advanceBuenosAires(progress, "citizen:ba-man-1", true);
  assert.equal(progress.citizens.length, 1);
  progress = advanceBuenosAires(progress, "citizen:ba-woman-1", true);
  progress = advanceBuenosAires(progress, "citizen:ba-executive-1", true);
  assert.equal(progress.citizens.length, 3);
  assert.match(buenosAiresObjective(progress), /Visi/);
  assert.equal(advanceBuenosAires(progress, "signal-found", true).signalFound, false);
  progress = advanceBuenosAires(progress, "vision-toggle", true);
  progress = advanceBuenosAires(progress, "signal-found", true);
  assert.equal(progress.signalFound, true);
  assert.match(buenosAiresObjective(progress), /Desconectada/);
  progress = advanceBuenosAires(progress, "disconnected-met", true);
  assert.equal(progress.disconnectedMet, true);
  assert.match(buenosAiresObjective(progress), /TRANSMISORES/);
  assert.equal(progress.completed, false);
  assert.deepEqual(normalizeBuenosAiresProgress(progress, true), progress);
});


test("the force field blocks all sides while its interaction and old saves remain reachable", () => {
  const h = OBELISK_FIELD.halfExtent;
  for (const side of [-1, 1]) {
    assert.equal(canStandInBuenosAires(side * (h - .1), OBELISK.z), false);
    assert.equal(canStandInBuenosAires(0, OBELISK.z + side * (h - .1)), false);
    assert.equal(canStandInBuenosAires(side * (h + .8), OBELISK.z), true);
    assert.equal(canStandInBuenosAires(0, OBELISK.z + side * (h + .8)), true);
  }
  assert.equal(canStandInBuenosAires(OBELISK_APPROACH.x, OBELISK_APPROACH.z), true);
  assert.deepEqual(safeBuenosAiresSpawn({ x: 8, z: -5 }), { x: 0, z: 42, yaw: Math.PI, viewYaw: 0 });
});

test("the three transmitters require investigation, vision and a reflected orb without erasing earlier stages", () => {
  let p = advanceBuenosAires(null, "enter", true);
  for (const id of ["ba-man-1", "ba-woman-1", "ba-executive-1"]) p = advanceBuenosAires(p, "citizen:" + id, true);
  p = advanceBuenosAires(p, "vision-toggle", true);
  p = advanceBuenosAires(p, "signal-found", true);
  p = advanceBuenosAires(p, "disconnected-met", true);
  p = advanceBuenosAires(p, "advert-activate:mirar", true);
  assert.equal(p.advertSequence.length, 0);
  for (const id of ["desear", "mirar", "consumir"]) p = advanceBuenosAires(p, "advert-inspect:" + id, true);
  for (const id of ["mirar", "consumir"]) p = advanceBuenosAires(p, "advert-activate:" + id, true);
  assert.equal(p.advertSequence.length, 0, "a wrong advertisement restarts only that sequence");
  for (const id of ["mirar", "desear", "consumir"]) p = advanceBuenosAires(p, "advert-activate:" + id, true);
  assert.equal(p.advertisingComplete, true);
  p = advanceBuenosAires(p, "traffic-hit:senal:0", true);
  p = advanceBuenosAires(p, "traffic-hit:ruta:0", true);
  assert.equal(p.trafficSequence.length, 0, "direct fire cannot bypass the reflector");
  p = advanceBuenosAires(p, "traffic-align", true);
  for (const [id, bounces] of [["senal", 0], ["ruta", 1], ["control", 0]]) p = advanceBuenosAires(p, "traffic-hit:" + id + ":" + bounces, true);
  assert.equal(p.trafficComplete, true);
  p = advanceBuenosAires(p, "core-align", true);
  for (const [id, bounces] of [["origen", 0], ["enlace", 1], ["nucleo", 0]]) p = advanceBuenosAires(p, "core-hit:" + id + ":" + bounces, true);
  assert.equal(p.coreComplete, true);
  assert.equal(p.advertisingComplete, true);
  assert.equal(p.citizens.length, 3);
  assert.equal(p.completed, false);
  p = advanceBuenosAires(p, "synchronization-seen", true);
  assert.equal(p.refugeUnlocked, true);
  assert.deepEqual(normalizeBuenosAiresProgress(JSON.parse(JSON.stringify(p)), true), p);
});

test("old city saves migrate without replaying citizens or the Desconectada", () => {
  const oldSave = { entered: true, introSeen: true, citizens: ["ba-man-1", "ba-woman-1", "ba-executive-1"], signalFound: true, disconnectedMet: true, visionActive: true };
  const p = normalizeBuenosAiresProgress(oldSave, true);
  assert.equal(p.citizens.length, 3);
  assert.equal(p.disconnectedMet, true);
  assert.equal(p.advertisingComplete, false);
  assert.deepEqual(p.advertInspected, []);
  assert.match(buenosAiresObjective(p), /TRANSMISORES/);
  const laterSave = normalizeBuenosAiresProgress({ ...oldSave, advertisingComplete: true, trafficComplete: true,
    coreComplete: true, synchronizationSeen: true }, true);
  assert.equal(laterSave.refugeUnlocked, true);
  assert.match(buenosAiresObjective(laterSave), /Vigilante/);
});

test("a save inside the opened force field returns there after the central transmitter is complete", () => {
  const position = { x: 0, z: 7, yaw: 0, viewYaw: 0 };
  assert.deepEqual(safeBuenosAiresSpawn(position, true), position);
  assert.notDeepEqual(safeBuenosAiresSpawn(position, false), position);
});
