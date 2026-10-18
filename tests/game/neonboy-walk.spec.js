import { test, expect } from "@playwright/test";

test("NeonBoy uses the new walk cycle while moving", async ({ page }) => {
  const walkRequests = [];
  page.on("requestfinished", (request) => {
    if (request.url().includes("neonboy-new-walk.anim.glb")) walkRequests.push(request.url());
  });

  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  await page.evaluate(() => {
    const { world } = window.game.inspect();
    world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
    const actor = world.player;
    Object.assign(actor, { x: 0, y: 0, z: 13, yaw: Math.PI, velocityX: 0, velocityY: 0, velocityZ: 0, speed: 0, grounded: true });
    actor.body.setTranslation({ x: 0, y: 0.9, z: 13 }, true);
    actor.body.setNextKinematicTranslation({ x: 0, y: 0.9, z: 13 });
    world.physics.step();
  });

  await page.keyboard.down("d");
  await page.waitForTimeout(350);
  const movement = await page.evaluate(() => new Promise((resolve) => {
    const { world, scene } = window.game.inspect();
    const startingX = world.player.x;
    let leg = null;
    scene.getObjectByName("Neonboy")?.traverse((node) => {
      if (node.isBone && /LeftUpLeg$/.test(node.name)) leg = node;
    });
    if (!leg) { resolve({ missingLeg: true }); return; }
    const initial = leg.quaternion.clone();
    let largestAngle = 0;
    let frames = 0;
    const sample = () => {
      const dot = Math.min(1, Math.abs(initial.dot(leg.quaternion)));
      largestAngle = Math.max(largestAngle, 2 * Math.acos(dot));
      if (++frames < 45) requestAnimationFrame(sample);
      else resolve({ distance: Math.abs(world.player.x - startingX), largestAngle });
    };
    requestAnimationFrame(sample);
  }));
  await page.keyboard.up("d");

  expect(walkRequests.length).toBeGreaterThan(0);
  expect(movement.missingLeg).toBeUndefined();
  expect(movement.distance).toBeGreaterThan(1);
  expect(movement.largestAngle).toBeGreaterThan(0.1);
});

test("NeonBoy uses the new backflip during a jump", async ({ page }) => {
  const jumpRequests = [];
  page.on("requestfinished", (request) => {
    if (request.url().includes("neonboy-new-jump.anim.glb")) jumpRequests.push(request.url());
  });

  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  await page.evaluate(() => {
    const { world } = window.game.inspect();
    world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
    const actor = world.player;
    Object.assign(actor, { x: 0, y: 0, z: 13, yaw: Math.PI, velocityX: 0, velocityY: 0, velocityZ: 0, speed: 0, grounded: true });
    actor.body.setTranslation({ x: 0, y: 0.9, z: 13 }, true);
    actor.body.setNextKinematicTranslation({ x: 0, y: 0.9, z: 13 });
    world.physics.step();
  });

  await page.keyboard.press("Space");
  const jump = await page.evaluate(() => new Promise((resolve) => {
    const { world, scene } = window.game.inspect();
    let hips = null;
    scene.getObjectByName("Neonboy")?.traverse((node) => {
      if (node.isBone && /Hips$/.test(node.name)) hips = node;
    });
    if (!hips) { resolve({ missingHips: true }); return; }
    const initial = hips.quaternion.clone();
    let maxHeight = 0;
    let maxRotation = 0;
    let frames = 0;
    const sample = () => {
      maxHeight = Math.max(maxHeight, world.player.y);
      const dot = Math.min(1, Math.abs(initial.dot(hips.quaternion)));
      maxRotation = Math.max(maxRotation, 2 * Math.acos(dot));
      if (++frames < 60) requestAnimationFrame(sample);
      else resolve({ maxHeight, maxRotation });
    };
    requestAnimationFrame(sample);
  }));

  expect(jumpRequests.length).toBeGreaterThan(0);
  expect(jump.missingHips).toBeUndefined();
  expect(jump.maxHeight).toBeGreaterThan(0.2);
  expect(jump.maxRotation).toBeGreaterThan(0.5);
});
