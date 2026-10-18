import test from "node:test";
import assert from "node:assert/strict";
import { advanceGuestPatrol, createGuestPatrol, GUEST_WAYPOINTS } from "./recordStoreGuestMotion.js";
import { STORE_OBSTACLES } from "./recordStoreLayout.js";

test("Freddy and Jason patrol separate open aisles, pause and look without entering furniture", () => {
  for (const id of ["freddy", "jason"]) {
    let patrol = createGuestPatrol(id);
    const modes = new Set();
    let furthest = 0;
    for (let frame = 0; frame < 1300; frame++) {
      patrol = advanceGuestPatrol(patrol, 0.05, { x: 0, z: 13 }, false);
      modes.add(patrol.mode);
      furthest = Math.max(furthest, Math.hypot(patrol.x - GUEST_WAYPOINTS[id][0].x, patrol.z - GUEST_WAYPOINTS[id][0].z));
      assert(STORE_OBSTACLES.every(({ x, z, hx, hz }) =>
        Math.abs(patrol.x - x) >= hx + 0.34 || Math.abs(patrol.z - z) >= hz + 0.34), `${id} crossed furniture`);
    }
    assert(modes.has("walk"));
    assert(modes.has("idle"));
    assert(furthest > 2.5, `${id} did not explore the aisle`);
    const nearPlayer = { x: patrol.x + 1, z: patrol.z };
    const paused = advanceGuestPatrol(patrol, 0.05, nearPlayer, false);
    assert.equal(paused.mode, "idle");
    assert.deepEqual({ x: paused.x, z: paused.z }, { x: patrol.x, z: patrol.z });
    assert.equal(advanceGuestPatrol(patrol, 0.05, null, true).mode, "talking");
  }
});
