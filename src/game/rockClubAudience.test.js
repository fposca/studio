import assert from "node:assert/strict";
import test from "node:test";
import { advanceRockClubPatrol, ROCK_CLUB_AUDIENCE } from "./rockClubAudience.js";

test("the unsteady visitor walks to the end of the aisle and back", () => {
  const route = ROCK_CLUB_AUDIENCE.find((npc) => npc.id === "club-drunk").walk;
  const walk = { ...route, originX: -1.9, originZ: -4.7, progress: 0, direction: 1, pause: 0, time: 0 };
  const positions = [];
  const directions = new Set();
  for (let i = 0; i < 260; i += 1) {
    const step = advanceRockClubPatrol(walk, 0.05);
    positions.push(step);
    directions.add(walk.direction);
  }
  assert.deepEqual([...directions].sort(), [-1, 1]);
  assert.ok(Math.min(...positions.map((position) => position.z)) < -7.85);
  assert.ok(positions.slice(210).some((position) => position.z > -4.73));
  assert.ok(positions.every((position) => position.z >= -7.91 && position.z <= -4.69));
  assert.ok(positions.every((position) => Math.abs(position.x + 1.9) <= 0.086));
});
