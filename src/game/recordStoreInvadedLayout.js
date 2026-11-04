import { STORE_OBSTACLES } from "./recordStoreLayout.js";
import { STORE_NPCS } from "./recordStoreDialogue.js";

// These overrides belong to the invaded scene instance. Never mutate the shared layout.
export const INVASION_NPC_PLACEMENTS = Object.freeze({
  tito: Object.freeze({ x: -6.35, z: 10.65, yaw: Math.PI * .85 }),
  rulo: Object.freeze({ x: 6.65, z: 10.05, yaw: Math.PI * 1.13 }),
  roxy: Object.freeze({ x: 4.1, z: 12.25, yaw: Math.PI * 1.1 }),
});
export const INVASION_BIN_BOUNDS = Object.freeze([
  { hx: 1.45, hz: 1.25, height: .84 }, { hx: 1.45, hz: 1.25, height: .84 },
  { hx: 1.58, hz: 1.32, height: 1.96 }, { hx: 1.58, hz: 1.32, height: 1.96 },
]);
export const INVASION_STATIC_COUNT = STORE_OBSTACLES.length - STORE_NPCS.filter(({ id }) => !["roxy", "freddy", "jason"].includes(id)).length;
export function invadedStoreObstacles() {
  const stationary = STORE_NPCS.filter(({ id }) => !["roxy", "freddy", "jason"].includes(id));
  const furnitureCount = STORE_OBSTACLES.length - stationary.length;
  return STORE_OBSTACLES.map((obstacle, index) => {
    if (index < INVASION_BIN_BOUNDS.length) return { ...obstacle, ...INVASION_BIN_BOUNDS[index] };
    const npc = stationary[index - furnitureCount];
    const position = npc && INVASION_NPC_PLACEMENTS[npc.id];
    return position ? { ...obstacle, x: position.x, z: position.z } : { ...obstacle };
  });
}
