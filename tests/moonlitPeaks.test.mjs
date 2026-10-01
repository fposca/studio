import assert from "node:assert/strict";
import test from "node:test";
import { createMoonlitTerrainGeometry, moonlitGroundHeight } from "../src/editors/moonlitTerrain.js";

test("moonlit ground keeps the actor area level and adds relief farther out", () => {
  assert.equal(moonlitGroundHeight(0, 0), 0);
  assert.equal(moonlitGroundHeight(3, 3), 0);
  const geometry = createMoonlitTerrainGeometry();
  try {
    const heights = geometry.attributes.position.array.filter((_, index) => index % 3 === 2);
    assert.ok(Math.max(...heights) - Math.min(...heights) > 0.5);
    assert.ok(geometry.attributes.normal.count === geometry.attributes.position.count);
  } finally {
    geometry.dispose();
  }
});
