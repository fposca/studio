import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { GROUND_CAR_LAYOUT, GROUND_CAR_LOOPS } from "./buenosAiresGroundVehicles.js";
import { canStandInBuenosAires, OBELISK } from "./buenosAiresLayout.js";

function curves() {
  return GROUND_CAR_LOOPS.map(loop => {
    const curve = new THREE.CatmullRomCurve3(loop.points.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, "centripetal");
    curve.arcLengthDivisions = 512;
    return { curve, length: curve.getLength() };
  });
}
test("four copies of each new vehicle circulate on the avenue circuit", () => {
  assert.equal(GROUND_CAR_LAYOUT.length, 16);
  for (let modelIndex = 0; modelIndex < 4; modelIndex++)
    assert.equal(GROUND_CAR_LAYOUT.filter(car => car.modelIndex === modelIndex).length, 4);
  const routes = curves();
  const starts = GROUND_CAR_LAYOUT.map(car => car.offset * routes[0].length).sort((a, b) => a - b);
  const gaps = starts.map((value, i) => (starts[(i + 1) % starts.length] - value + routes[0].length) % routes[0].length);
  assert.ok(gaps.every(gap => gap > 17), `cars too close: ${gaps}`);
});
test("the car footprints stay on asphalt and clear of the Obelisk and planted medians", () => {
  for (const [index, { curve }] of curves().entries()) for (let i = 0; i < 1200; i++) {
    const t = i / 1200, p = curve.getPointAt(t), tangent = curve.getTangentAt(t);
    const nx = tangent.z, nz = -tangent.x;
    for (const forward of [-2.55, 2.55]) for (const side of [-1.3, 1.3]) {
      const x = p.x + tangent.x * forward + nx * side;
      const z = p.z + tangent.z * forward + nz * side;
      assert.ok(Math.abs(x) < 30, `loop ${index} leaves avenue at ${x},${z}`);
      assert.ok(canStandInBuenosAires(x, z), `loop ${index} hits scenery at ${x},${z}`);
      assert.ok(Math.hypot(x - OBELISK.x, z - OBELISK.z) > 5, `loop ${index} hits Obelisk`);
      assert.ok(!(Math.abs(x) < 2.5 && (z >= 58 && z <= 70 || z >= -70 && z <= -49)),
        `loop ${index} enters a planted median at ${x},${z}`);
      if (Math.abs(x) < 16) assert.ok(z > 55 || z < -45.2,
        `loop ${index} enters the BA garden at ${x},${z}`);
    }
  }
});
