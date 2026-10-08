import { test, expect } from "@playwright/test";

async function teleport(page, target) {
  await page.evaluate((destination) => {
    const { world } = window.game.inspect(), player = world.player;
    const position = { x: destination.x, y: destination.y + 0.9, z: destination.z };
    Object.assign(player, destination, { velocityY: 0, velocityX: 0, velocityZ: 0, attack: null, cooldown: 0 });
    player.body.setTranslation(position, true); player.body.setNextKinematicTranslation(position);
    world.physics.step(); world.step();
  }, target);
}

async function finishLevel(page) {
  await page.evaluate(() => {
    const { world } = window.game.inspect();
    world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
    world.player.attack = null;
    for (const coin of world.coins) {
      const p = { x: coin.x, y: coin.y + 0.9, z: coin.z };
      Object.assign(world.player, coin, { velocityY: 0, velocityX: 0, velocityZ: 0 });
      world.player.body.setTranslation(p, true); world.player.body.setNextKinematicTranslation(p);
      world.physics.step(); world.step();
    }
  });
  await expect(page.getByRole("heading", { name: "Tesoro recuperado" })).toBeVisible();
}

test("jump raises both hands; pickups, hotkeys, cemetery and checkpoint inventory work", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${message.text()} ${message.location().url}`); });
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.waitForFunction(() => window.game.inspect().world.player.grounded);
  await page.keyboard.press("2");
  expect(await page.evaluate(() => window.game.inspect().world.equipped)).toBe("unarmed");
  await page.keyboard.press("Space");
  await page.waitForFunction(() => window.game.inspect().world.player.y > 0.7);
  const raised = await page.evaluate(async () => {
    const THREE = await import("/node_modules/three/build/three.module.js");
    const root = window.game.inspect().scene.getObjectByName("Neonboy");
    const positions = {};
    root.updateMatrixWorld(true);
    root.traverse((object) => {
      if (object.isBone && /(?:LeftHand|RightHand|Head)$/.test(object.name)) positions[object.name.replace(/^mixamorig:?/, "")] = object.getWorldPosition(new THREE.Vector3()).y;
    });
    return positions;
  });
  expect(raised.LeftHand).toBeGreaterThan(raised.Head);
  expect(raised.RightHand).toBeGreaterThan(raised.Head);
  await page.waitForFunction(() => window.game.inspect().world.player.grounded);
  const pickup = await page.evaluate(() => ({ ...window.game.inspect().world.pickups[0] }));
  await teleport(page, { x: pickup.x, y: pickup.y, z: pickup.z });
  await expect(page.getByRole("button", { name: "Espada (2)", exact: true })).toBeEnabled();
  await page.keyboard.press("2");
  await expect(page.getByRole("button", { name: "Espada (2)", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.waitForFunction(() => window.game.inspect().scene.getObjectByName("Neonboy").getObjectByName("Arma sword").visible);
  await page.keyboard.down("j");
  await page.waitForFunction(() => window.game.inspect().world.player.attack?.kind === "sword");
  await page.screenshot({ path: testInfo.outputPath("sword.png") });
  await page.keyboard.up("j");
  await page.waitForFunction(() => !window.game.inspect().world.player.attack);
  await page.keyboard.press("1");
  await expect(page.getByRole("button", { name: "Punos (1)", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("2");
  await expect(page.getByRole("button", { name: "Espada (2)", exact: true })).toHaveAttribute("aria-pressed", "true");
  await finishLevel(page);
  await page.getByRole("button", { name: "Nivel 2: Cementerio", exact: true }).click();
  await page.waitForFunction(() => window.game.inspect().world.level.id === 2);
  await page.waitForTimeout(600);
  const level = await page.evaluate(() => {
    const { world, scene, renderer, camera } = window.game.inspect();
    renderer.render(scene, camera);
    const gl = renderer.getContext(), pixels = new Uint8Array(12 * 12 * 4);
    gl.readPixels(gl.drawingBufferWidth / 2, gl.drawingBufferHeight / 2, 12, 12, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return { ...world.snapshot(), demons: scene.children.filter((child) => child.name === "Demonio").length,
      pixelMax: Math.max(...pixels.filter((_, i) => i % 4 !== 3)), textures: renderer.info.memory.textures };
  });
  expect(level.inventory).toContain("sword"); expect(level.equipped).toBe("sword");
  expect(level.health).toBe(100); expect(level.demons).toBe(5);
  expect(level.pixelMax).toBeGreaterThan(25); expect(level.textures).toBeGreaterThan(6);
  await page.screenshot({ path: testInfo.outputPath("cemetery-desktop.png") });
  await teleport(page, { x: 0, y: 0, z: 1.5 });
  await page.keyboard.press("3");
  await expect(page.getByRole("button", { name: "Martillo (3)", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.down("j");
  await page.waitForFunction(() => window.game.inspect().world.player.attack?.kind === "hammer" && window.game.inspect().world.player.attack.elapsed > 0.3);
  await page.screenshot({ path: testInfo.outputPath("hammer-demon.png") });
  await page.keyboard.up("j");
  await page.waitForFunction(() => !window.game.inspect().world.player.attack);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Punos (1)", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.game.inspect().world.equipped)).toBe("unarmed");
  await page.getByRole("button", { name: "Martillo (3)", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.game.inspect().world.equipped)).toBe("hammer");
  await page.screenshot({ path: testInfo.outputPath("cemetery-mobile.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole("button", { name: "Reiniciar partida", exact: true }).click();
  await expect(page.getByRole("button", { name: "Espada (2)", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Martillo: sin recoger", exact: true })).toBeDisabled();
  await finishLevel(page);
  await expect(page.getByRole("button", { name: "Nivel 2: Cementerio", exact: true })).toHaveCount(0);
  await page.evaluate(() => window.unmountGame());
  expect(errors).toEqual([]);
});
