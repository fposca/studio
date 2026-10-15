import test from "node:test";
import assert from "node:assert/strict";
import { GameWorld, initializePhysics } from "./gameWorld.js";
import { INTERIOR_TORCHES } from "./gameInteriorLevel.js";
import { CEMETERY_TORCHES } from "./gameLevels.js";

await initializePhysics();

for (const [level, torches] of [[2, INTERIOR_TORCHES], [3, CEMETERY_TORCHES]]) {
  test(`level ${level} fire pillars block the player at every visible position`, (t) => {
    const world = new GameWorld({ level });
    t.after(() => world.dispose());
    world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
    for (const [x, z] of torches) {
      const actor = world.player;
      Object.assign(actor, { x, y: 0, z: z + 1.8, velocityY: 0, velocityX: 0, velocityZ: 0,
        grounded: false, platformId: null, attack: null, cooldown: 0 });
      const position = { x, y: actor.bodyOffset, z: z + 1.8 };
      actor.body.setTranslation(position, true);
      actor.body.setNextKinematicTranslation(position);
      world.physics.step();
      for (let frame = 0; frame < 150; frame++) world.step({ z: -1 });
      assert.ok(actor.z > z + 0.55, `pillar at ${x},${z} was traversed: player at ${actor.x},${actor.z}`);
    }
  });
}
