import { createBuenosAiresFlyingVehicles } from "./buenosAiresFlyingVehicles.js";

// The Meshy street-traffic manager owns every wheeled vehicle. This entry
// point keeps the existing flying-car setup and chapter integration intact.
export function addBuenosAiresVehicles(root, { glowMap, colliders, onEvent, tier, codeVision }) {
  return createBuenosAiresFlyingVehicles(root, { glowMap, onEvent, tier, codeVision, occluders: colliders });
}
