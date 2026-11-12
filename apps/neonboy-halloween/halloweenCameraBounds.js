import { STORE_LAYOUT } from "../../src/game/recordStoreLayout.js";

// Keep the third-person camera inside the room even when the player hugs a wall.
export function clampHalloweenCamera(position, layout = STORE_LAYOUT, clearance = 0.55) {
  position.x = Math.max(-layout.sideWallX + clearance, Math.min(layout.sideWallX - clearance, position.x));
  position.z = Math.max(layout.backWallZ + clearance, Math.min(layout.frontWallZ - clearance, position.z));
  return position;
}

