import test from "node:test";
import assert from "node:assert/strict";
import {
  ROCK_CLUB_EXAMINE, ROCK_CLUB_LAYOUT, ROCK_CLUB_OBSTACLES,
  ROCK_CLUB_STAGE_HEIGHT, rockClubFloorHeight
} from "./rockClubLayout.js";

const radius = 0.46;
function walkable(x, z) {
  return Math.abs(x) < ROCK_CLUB_LAYOUT.playerLimitX &&
    z > ROCK_CLUB_LAYOUT.playerBackZ && z < ROCK_CLUB_LAYOUT.playerFrontZ &&
    !ROCK_CLUB_OBSTACLES.some((item) =>
      Math.abs(x - item.x) < item.hx + radius && Math.abs(z - item.z) < item.hz + radius);
}

test("the central ramp reaches the stage without crossing a solid obstacle", () => {
  for (let z = ROCK_CLUB_LAYOUT.spawnZ; z >= -14.2; z -= 0.15)
    assert.equal(walkable(0, z), true, `center aisle blocked at z=${z}`);
  assert.equal(rockClubFloorHeight(0, -9.7), 0);
  assert.ok(rockClubFloorHeight(0, -10.6) > 0);
  assert.equal(rockClubFloorHeight(0, -11.5), ROCK_CLUB_STAGE_HEIGHT);
  assert.equal(rockClubFloorHeight(0, -14.2), ROCK_CLUB_STAGE_HEIGHT);
  assert.equal(walkable(4.7, -11.5), false, "stage front should block entry away from ramp");
});

test("the side aisle reaches backstage and all seven club interactions exist", () => {
  for (let z = -8.4; z >= -16; z -= 0.15)
    assert.equal(walkable(8.55, z), true, `backstage aisle blocked at z=${z}`);
  const backstage = ROCK_CLUB_EXAMINE.find((item) => item.id === "backstage");
  assert.ok(backstage);
  assert.ok(Math.hypot(8.55 - backstage.x, -15.9 - backstage.z) < backstage.reach);
  assert.deepEqual(ROCK_CLUB_EXAMINE.map((item) => item.id),
    ["stage", "microphone", "drums", "amplifier", "mixer", "bar", "backstage"]);
});
