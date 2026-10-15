import { test, expect } from "@playwright/test";

async function place(page, x, z, yaw = Math.PI) {
  await page.evaluate(({ x, z, yaw }) => {
    const { world } = window.game.inspect(), actor = world.player;
    Object.assign(actor, { x, y: 0, z, yaw, velocityY: 0, velocityX: 0, velocityZ: 0, attack: null, cooldown: 0, stun: 0, invulnerable: 100 });
    const position = { x, y: 0.9, z };
    actor.body.setTranslation(position, true); actor.body.setNextKinematicTranslation(position); world.physics.step();
  }, { x, z, yaw });
}
async function pixels(page) {
  return page.evaluate(() => {
    const { renderer, scene, camera } = window.game.inspect(); renderer.render(scene, camera);
    const gl = renderer.getContext(), values = [], buffer = new Uint8Array(16 * 16 * 4);
    for (const x of [0.2, 0.4, 0.6, 0.8]) for (const y of [0.25, 0.5, 0.75]) {
      gl.readPixels(Math.floor(gl.drawingBufferWidth * x), Math.floor(gl.drawingBufferHeight * y), 16, 16, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
      values.push(...buffer.filter((_, i) => i % 4 !== 3));
    }
    return { contrast: Math.max(...values) - Math.min(...values), lit: values.filter((v) => v > 20).length / values.length,
      lost: gl.isContextLost(), textures: renderer.info.memory.textures };
  });
}

test("sanctuary quest, animated guardians, hammer secrets and saved progress lead to cemetery", async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  await page.evaluate(() => {
    const { world } = window.game.inspect(); world.inventory.add("sword"); world.equip("sword"); world.status = "won";
  });
  await page.getByRole("button", { name: "Nivel 2: El santuario de Atenea", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Una peticion en la oscuridad" })).toBeVisible({ timeout: 90_000 });
  await expect(page.getByRole("img", { name: "Retrato de Platon" })).toBeVisible();
  const before = await page.evaluate(() => window.game.inspect().world.time);
  await page.keyboard.press("p"); await page.keyboard.press("w");
  expect(await page.evaluate(() => window.game.inspect().world.time)).toBe(before);
  await page.screenshot({ path: testInfo.outputPath("plato-dialogue.jpg") });
  await page.getByRole("button", { name: "Aceptar mision", exact: true }).click();
  await expect(page.locator(".neon-game-mission:not(.neon-game-boss-gate)")).toContainText("Recupera el Sello de Atenea");
  const models = await page.evaluate(() => {
    const { scene, world } = window.game.inspect();
    return { inventory: [...world.inventory], enemies: world.enemies.map((enemy) => enemy.species),
      models: ["Platon", "Hoplita", "Estatua guardiana", "Medusa"].map((name) => {
        const root = scene.getObjectByName(name); let textured = 0, bones = 0;
        root.traverse((object) => { if (object.isBone) bones++; if (object.material?.map) textured++; });
        return { name, textured, bones };
      }) };
  });
  expect(models.inventory).toContain("sword");
  expect(models.enemies.filter((s) => s === "hoplite")).toHaveLength(4);
  expect(models.enemies.filter((s) => s === "statue")).toHaveLength(2);
  for (const model of models.models) { expect(model.bones).toBeGreaterThan(40); expect(model.textured).toBeGreaterThan(0); }
  const image = await pixels(page);
  expect(image.lost).toBe(false); expect(image.contrast).toBeGreaterThan(40); expect(image.lit).toBeGreaterThan(0.2);
  await page.screenshot({ path: testInfo.outputPath("sanctuary-desktop.jpg") });
  await place(page, 3, 4);
  await expect(page.getByRole("button", { name: "Martillo (3)", exact: true })).toBeEnabled();
  await page.keyboard.press("3");
  await expect(page.getByRole("button", { name: "Martillo (3)", exact: true })).toHaveAttribute("aria-pressed", "true");

  // Check the imported stationary slash, including unchanged collision position.
  await place(page, -3.6, -5.9);
  await page.waitForFunction(() => window.game.inspect().world.enemies.some((enemy) => enemy.species === "statue" && enemy.attack));
  const pose = () => page.evaluate(() => {
    const values = []; window.game.inspect().scene.getObjectByName("Estatua guardiana").traverse((o) => { if (o.isBone) values.push(...o.quaternion.toArray()); }); return values;
  });
  const firstPose = await pose(); await page.waitForTimeout(400); const nextPose = await pose();
  expect(Math.max(...nextPose.map((v, i) => Math.abs(v - firstPose[i])))).toBeGreaterThan(0.05);
  expect(await page.evaluate(() => {
    const statue = window.game.inspect().world.enemies.find((enemy) => enemy.stationary);
    return Math.hypot(statue.x - statue.spawn.x, statue.z - statue.spawn.z);
  })).toBeLessThan(0.02);
  await page.evaluate(() => {
    const { world } = window.game.inspect();
    world.enemies.filter((enemy) => !enemy.boss).forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
  });
  await place(page, -7.5, -6, -Math.PI / 2);
  await page.keyboard.press("j");
  await page.waitForFunction(() => window.game.inspect().world.secretDoors[0].broken);
  await page.waitForFunction(() => !window.game.inspect().scene.getObjectByName("Muro agrietado west-vault").visible);
  await page.screenshot({ path: testInfo.outputPath("secret-wall.jpg") });
  await place(page, -14, -6);
  await expect(page.getByRole("heading", { name: "La ofrenda oculta" })).toBeVisible();
  await page.getByRole("button", { name: "Volver al juego" }).click();
  await page.evaluate(() => window.game.setPaused(true));
  const saved = await page.evaluate(() => window.game.exportSave());
  expect(saved.world.secretDoors).toEqual(["west-vault"]); expect(saved.world.questStage).toBe("searching");
  await page.evaluate((value) => window.game.loadSave(value), saved);
  await expect(page.getByRole("heading", { name: "En pausa" })).toBeVisible();
  expect(await page.evaluate(() => window.game.exportSave().world)).toEqual(saved.world);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();

  await place(page, 0, -27);
  await page.waitForFunction(() => window.game.inspect().world.boss.active);
  await expect(page.getByRole("progressbar", { name: "Vida del jefe" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("medusa-desktop.jpg") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  expect((await pixels(page)).contrast).toBeGreaterThan(40);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  const mission = await page.locator(".neon-game-mission:not(.neon-game-boss-gate)").boundingBox(), boss = await page.locator(".neon-game-boss").boundingBox();
  expect(mission.y + mission.height).toBeLessThanOrEqual(boss.y);
  await page.screenshot({ path: testInfo.outputPath("sanctuary-mobile.jpg") });
  await page.evaluate(() => { const { world } = window.game.inspect(); world.boss.health = 0; world.boss.collider.setEnabled(false); });
  await place(page, 0, -39);
  await expect(page.getByRole("heading", { name: "El Sello de Atenea" })).toBeVisible();
  await page.getByRole("button", { name: "Volver al juego" }).click();
  await expect(page.locator(".neon-game-mission:not(.neon-game-boss-gate)")).toContainText("Regresa con Platon");
  await place(page, 0, 12);
  await expect(page.getByRole("button", { name: "Entregar sello" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("plato-return-mobile.jpg") });
  await page.getByRole("button", { name: "Entregar sello" }).click();
  await expect(page.getByRole("heading", { name: "Tesoro recuperado" })).toBeVisible();
  expect(await page.evaluate(() => window.game.inspect().world.snapshot().score)).toBe(950);
  await page.getByRole("button", { name: "Nivel 3: El cementerio", exact: true }).click();
  await page.waitForFunction(() => window.game.inspect().world.level.id === 3);
  expect(await page.evaluate(() => [...window.game.inspect().world.inventory])).toEqual(["unarmed", "sword", "hammer"]);
  expect(await page.evaluate(() => window.game.inspect().world.equipped)).toBe("hammer");
  expect(await page.evaluate(() => Boolean(window.game.inspect().scene.getObjectByName("Platon")))).toBe(false);
  await page.evaluate(() => window.unmountGame());
  expect(errors).toEqual([]);
});
