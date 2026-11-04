import * as THREE from "three";
import { rockClubFloorHeight } from "./rockClubLayout.js";
import { createLowDriftingFog } from "./lowDriftingFog.js";

export function createRockClubFog(scene) {
  const fog = new THREE.FogExp2(0x39313f, 0.052);
  scene.fog = fog;
  // Preserve the Club's stage/audience layout and concert density.
  const banks = Array.from({ length: 30 }, (_, i) => {
    const stage = i < 18, column = i % 6;
    const row = Math.floor((stage ? i : i - 18) / 6);
    return {
      x: -7 + column * 2.8,
      z: stage ? -17.4 + row * 2.8 : -5.8 + row * 7.5,
      stage, phase: i * 2.39996, width: 6.6 + (i % 3) * .6,
      height: stage ? 2.3 : 1.8, color: stage ? 0xa99cb8 : 0x827a96,
    };
  });
  const smoke = createLowDriftingFog(scene, banks, { name: "club low drifting smoke", floorHeight: rockClubFloorHeight });
  let concertActive = false;
  function update(dt, reducedMotion = false, paused = false, camera = null) {
    const targetDensity = concertActive ? .065 : .052;
    if (!paused) fog.density = THREE.MathUtils.damp(fog.density, targetDensity, 1.2, dt);
    smoke.update(dt, reducedMotion, paused, camera,
      ({ stage }) => stage ? (concertActive ? .48 : .36) : .3);
  }
  update(0);
  return { update, setConcertActive(active) { concertActive = Boolean(active); } };
}
