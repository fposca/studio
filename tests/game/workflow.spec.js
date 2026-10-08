import { test, expect } from "@playwright/test";

async function openGame(page) {
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await expect(page.getByLabel("Cargando partida")).toHaveCount(0);
}

async function inspect(page) {
  return page.evaluate(() => {
    const { world, renderer, scene, camera } = window.game.inspect();
    renderer.render(scene, camera);
    const gl = renderer.getContext(), pixels = new Uint8Array(4 * 64);
    const samples = [];
    for (let i = 0; i < 8; i++) {
      gl.readPixels(Math.floor(gl.drawingBufferWidth * (i + 1) / 9), Math.floor(gl.drawingBufferHeight * 0.55), 8, 8, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      samples.push(...pixels.filter((_, index) => index % 4 !== 3));
    }
    return { ...world.snapshot(), x: world.player.x, y: world.player.y, z: world.player.z, mode: world.player.mode,
      grounded: world.player.grounded, pixelMax: Math.max(...samples), pixelMin: Math.min(...samples),
      loadedMaps: renderer.info.memory.textures, triangles: renderer.info.render.triangles };
  });
}

test("Neonboy moves, idles, jumps, attacks, pauses and restarts in a rendered temple", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openGame(page);
  await page.waitForTimeout(600);
  const initial = await inspect(page);
  expect(initial.pixelMax - initial.pixelMin).toBeGreaterThan(30);
  expect(initial.loadedMaps).toBeGreaterThan(8);
  expect(initial.triangles).toBeGreaterThan(10_000);
  await page.screenshot({ path: testInfo.outputPath("desktop-day.png") });
  await page.keyboard.down("w");
  await page.waitForFunction(() => window.game.inspect().world.player.z < 9);
  await page.keyboard.up("w");
  await expect.poll(async () => (await inspect(page)).mode).toBe("idle");
  expect((await inspect(page)).coins).toBeGreaterThan(0);
  await page.keyboard.press("Space");
  await page.waitForFunction(() => window.game.inspect().world.player.y > 0.4);
  await page.screenshot({ path: testInfo.outputPath("jump.png") });
  await page.waitForFunction(() => window.game.inspect().world.player.grounded);
  await page.keyboard.down("j");
  await page.waitForFunction(() => window.game.inspect().world.player.attack?.elapsed > 0.17);
  await page.screenshot({ path: testInfo.outputPath("punch.png") });
  await page.keyboard.up("j");
  await page.waitForFunction(() => !window.game.inspect().world.player.attack);
  await page.keyboard.down("k");
  await page.waitForFunction(() => window.game.inspect().world.player.attack?.elapsed > 0.3);
  await page.screenshot({ path: testInfo.outputPath("kick.png") });
  await page.keyboard.up("k");
  await page.getByRole("button", { name: "Pausar (P)", exact: true }).click();
  const paused = await inspect(page);
  await page.keyboard.down("w");
  await page.waitForTimeout(300);
  await page.keyboard.up("w");
  expect((await inspect(page)).z).toBe(paused.z);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Noche", exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath("desktop-night.png") });
  await page.getByRole("button", { name: "Atardecer", exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath("desktop-sunset.png") });
  await page.getByRole("button", { name: "Reiniciar partida", exact: true }).click();
  await expect.poll(async () => (await inspect(page)).coins).toBe(0);
  expect((await inspect(page)).health).toBe(100);
  await page.evaluate(() => window.unmountGame());
  expect(errors).toEqual([]);
});

test("mobile scene renders and touch controls move Neonboy without overflowing", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openGame(page);
  await page.waitForTimeout(500);
  const initial = await inspect(page);
  expect(initial.pixelMax - initial.pixelMin).toBeGreaterThan(30);
  const joystick = await page.getByRole("group", { name: "Mover Neonboy" }).boundingBox();
  await page.mouse.move(joystick.x + joystick.width / 2, joystick.y + joystick.height / 2);
  await page.mouse.down();
  await page.mouse.move(joystick.x + joystick.width / 2, joystick.y + 4);
  await page.waitForFunction(() => window.game.inspect().world.player.z < 11.5);
  await page.mouse.up();
  await expect.poll(async () => (await inspect(page)).mode).toBe("idle");
  await page.getByRole("button", { name: "Saltar (Espacio)", exact: true }).click();
  await page.waitForFunction(() => window.game.inspect().world.player.y > 0.4);
  await page.waitForFunction(() => window.game.inspect().world.player.grounded);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  await page.screenshot({ path: testInfo.outputPath("mobile.png") });
  const toolbar = await page.locator(".neon-game-tools").boundingBox();
  expect(toolbar.y + toolbar.height).toBeLessThan(175);
  await page.setViewportSize({ width: 320, height: 640 });
  await page.screenshot({ path: testInfo.outputPath("mobile-small.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test("combat changes life, defeat and victory dialogs reset cleanly, blur pauses input", async ({ page }, testInfo) => {
  await openGame(page);
  await page.evaluate(() => {
    const { world } = window.game.inspect();
    const enemy = world.enemies[0], player = world.player;
    const position = { x: player.x, y: 0.9, z: player.z - 1.1 };
    Object.assign(enemy, { x: position.x, y: 0, z: position.z, yaw: 0, health: 40, cooldown: 3 });
    enemy.body.setTranslation(position, true);
    enemy.body.setNextKinematicTranslation(position);
    world.physics.step();
  });
  await page.keyboard.press("k");
  await page.waitForFunction(() => window.game.inspect().world.enemies[0].health === 0);
  expect((await inspect(page)).defeated).toBe(1);
  await page.screenshot({ path: testInfo.outputPath("combat.png") });
  await page.keyboard.down("w");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.getByRole("heading", { name: "En pausa" })).toBeVisible();
  await page.keyboard.up("w");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect.poll(async () => (await inspect(page)).mode).toBe("idle");
  await page.evaluate(() => {
    const { world } = window.game.inspect();
    world.damage(world.player, world.enemies[1], { damage: 100, knockback: 1 });
  });
  await expect(page.getByRole("heading", { name: "Neonboy ha caido" })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Vida" })).toHaveAttribute("aria-valuenow", "0");
  await page.getByRole("button", { name: "Volver a empezar" }).click();
  await expect(page.getByRole("progressbar", { name: "Vida" })).toHaveAttribute("aria-valuenow", "100");
  await page.evaluate(() => {
    const { world } = window.game.inspect();
    world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
    for (const coin of world.coins) {
      const position = { x: coin.x, y: coin.y + 0.9, z: coin.z };
      Object.assign(world.player, { x: coin.x, y: coin.y, z: coin.z, velocityY: 0 });
      world.player.body.setTranslation(position, true);
      world.player.body.setNextKinematicTranslation(position);
      world.physics.step();
      world.step();
    }
  });
  await expect(page.getByRole("heading", { name: "Tesoro recuperado" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("victory.png") });
});
