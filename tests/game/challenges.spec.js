import { test, expect } from "@playwright/test";

test("moving platforms render, carry the player, pause together and lead to a visible final boss", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator(".neon-game-boss-gate")).toContainText("Derrota a los enemigos");
  expect(await page.evaluate(() => window.game.inspect().world.boss.active)).toBe(false);
  await page.evaluate(() => {
    const { world, input } = window.game.inspect(), player = world.player, platform = world.platforms[1];
    world.enemies.filter((enemy) => !enemy.boss).forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
    world.artifacts.forEach((artifact) => { artifact.found = true; });
    Object.assign(player, { x: platform.x, y: platform.y + 0.015, z: platform.z, velocityY: 0, velocityX: 0, velocityZ: 0, platformId: null });
    const position = { x: player.x, y: player.y + player.bodyOffset, z: player.z };
    player.body.setTranslation(position, true); player.body.setNextKinematicTranslation(position);
    world.physics.step();
    Object.assign(input.orbit, { yaw: 0.65, pitch: 0.32, distance: 11 });
  });
  await page.waitForFunction(() => window.game.inspect().world.player.platformId === "step-2");
  const platformState = () => page.evaluate(() => {
    const { world, scene } = window.game.inspect(), platform = world.platforms[1];
    return { time: world.time, z: platform.z, offset: world.player.z - platform.z,
      visualZ: scene.getObjectByName("Plataforma step-2").position.z, speed: world.player.speed };
  });
  const before = await platformState();
  await page.waitForTimeout(700);
  const after = await platformState();
  expect(Math.abs(after.z - before.z)).toBeGreaterThan(0.02);
  expect(Math.abs(after.offset - before.offset)).toBeLessThan(0.06);
  expect(Math.abs(after.visualZ - after.z)).toBeLessThan(0.03);
  expect(after.speed).toBeLessThan(0.05);
  await page.screenshot({ path: testInfo.outputPath("temple-platforms-desktop.png") });
  await page.evaluate(() => window.game.setPaused(true));
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const paused = await platformState();
  await page.waitForTimeout(300);
  expect(await platformState()).toEqual(paused);
  await page.evaluate(() => window.game.setPaused(false));
  await page.waitForFunction((time) => window.game.inspect().world.time > time, paused.time);
  await page.keyboard.press("Space");
  await page.waitForFunction(() => !window.game.inspect().world.player.grounded && window.game.inspect().world.player.y > 2.5);

  await page.evaluate(() => {
    const { world, input } = window.game.inspect(), player = world.player;
    world.coins.forEach((coin) => { coin.collected = true; }); world.collected = world.coins.length;
    Object.assign(player, { x: 0, y: 0.015, z: 5.5, velocityY: 0, velocityX: 0, velocityZ: 0, platformId: null, invulnerable: 0 });
    const position = { x: player.x, y: player.y + player.bodyOffset, z: player.z };
    player.body.setTranslation(position, true); player.body.setNextKinematicTranslation(position);
    world.physics.step(); world.step();
    world.boss.cooldown = 60;
    Object.assign(input.orbit, { yaw: 0, pitch: 0.25, distance: 8 });
  });
  await expect(page.getByRole("progressbar", { name: "Vida del jefe" })).toHaveAttribute("aria-valuemax", "360");
  await expect(page.locator(".neon-game-boss-gate")).toHaveCount(0);
  await page.waitForTimeout(700);
  const render = () => page.evaluate(() => {
    const { world, scene, renderer, camera } = window.game.inspect();
    renderer.render(scene, camera);
    const gl = renderer.getContext(), pixels = new Uint8Array(16 * 16 * 4);
    gl.readPixels(gl.drawingBufferWidth / 2, gl.drawingBufferHeight / 2, 16, 16, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return { bossVisible: scene.getObjectByName("Guardian del Partenon").visible, status: world.status,
      pixelMax: Math.max(...pixels.filter((_, i) => i % 4 !== 3)), textures: renderer.info.memory.textures };
  });
  const desktop = await render();
  expect(desktop.bossVisible).toBe(true); expect(desktop.status).toBe("playing");
  expect(desktop.pixelMax).toBeGreaterThan(30); expect(desktop.textures).toBeGreaterThan(6);
  await page.screenshot({ path: testInfo.outputPath("temple-boss-desktop.png") });
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 640 }]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(200);
    const hudBottom = await page.locator(".neon-game-vitals, .neon-game-objective, .neon-game-tools").evaluateAll((elements) =>
      Math.max(...elements.map((element) => element.getBoundingClientRect().bottom)));
    const boss = await page.locator(".neon-game-boss").boundingBox();
    const bottom = await page.locator(".neon-game-bottom").boundingBox();
    expect(boss.y).toBeGreaterThanOrEqual(hudBottom);
    expect(boss.y + boss.height).toBeLessThan(bottom.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
    expect((await render()).pixelMax).toBeGreaterThan(30);
    await page.screenshot({ path: testInfo.outputPath(`temple-boss-${viewport.width}.png`) });
  }
  await page.evaluate(() => window.unmountGame());
  expect(errors).toEqual([]);
});
