import * as THREE from "three";
import { createUnderworldCombat } from "../../../src/game/underworldCombat.js";

export function exerciseEnemyProjectiles() {
  const root = new THREE.Group();
  let hits = 0;
  const combat = createUnderworldCombat(root, () => { hits += 1; });
  const player = { x: 0, y: 0, z: 5 };
  const counts = {};
  const damage = {};
  for (const type of ["centinela", "gargola", "testigo"]) {
    const actor = { type, group: { position: new THREE.Vector3(0, 0, 0) }, hp: () => 5 };
    hits = 0;
    combat.fire(actor, player);
    counts[type] = combat.activeCount;
    for (let frame = 0; frame < 80; frame++) combat.update(.05, player, {});
    damage[type] = hits;
  }
  hits = 0;
  const columnActor = { type: "centinela", group: { position: new THREE.Vector3(3.9, 0, 5) }, hp: () => 5 };
  combat.fire(columnActor, { x: 3.9, y: 0, z: 11 });
  for (let frame = 0; frame < 80; frame++) combat.update(.05, { x: 3.9, y: 0, z: 11 }, {});
  const damageBehindPylon = hits;
  const actor = { type: "gargola", group: { position: new THREE.Vector3(0, 0, 0) }, hp: () => 0 };
  combat.fire(actor, player);
  combat.update(.05, player, {});
  const shotsAfterDefeat = combat.activeCount;
  combat.dispose();
  return { counts, damage, damageBehindPylon, shotsAfterDefeat };
}
