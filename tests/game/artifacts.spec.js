import { test, expect } from "@playwright/test";
import { loadLevel } from "./levelHelpers.js";

async function teleportToArtifact(page, index) {
  await page.evaluate((targetIndex) => {
    const { world } = window.game.inspect();
    const artifact = world.artifacts[targetIndex], player = world.player;
    Object.assign(player, { x: artifact.x, y: artifact.y, z: artifact.z, velocityY: 0, velocityX: 0, velocityZ: 0, attack: null });
    const position = { x: artifact.x, y: artifact.y + 0.9, z: artifact.z };
    player.body.setTranslation(position, true);
    player.body.setNextKinematicTranslation(position);
    world.physics.step();
  }, index);
}

test("historical finds pause gameplay, award points and survive level change and save", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  await page.evaluate(() => window.game.inspect().world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); }));
  await page.evaluate(() => {
    const { world } = window.game.inspect(), artifact = world.artifacts[0], player = world.player;
    const position = { x: artifact.x + 1.8, y: artifact.y + 0.9, z: artifact.z };
    Object.assign(player, { x: position.x, y: artifact.y, z: position.z, velocityY: 0, velocityX: 0, velocityZ: 0 });
    player.body.setTranslation(position, true); player.body.setNextKinematicTranslation(position);
    world.physics.step();
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: testInfo.outputPath("frieze-in-world.png") });

  for (const [level, titles, totals] of [
    [1, ["Fragmento del friso", "Ostrakon ateniense"], [100, 250]],
    [3, ["Lecito funerario", "Estela de piedra"], [350, 500]]
  ]) {
    if (level === 3) {
      await loadLevel(page, 3);
      await page.evaluate(() => window.game.inspect().world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); }));
      expect(await page.evaluate(() => window.game.inspect().world.snapshot().score)).toBe(250);
    }
    for (let i = 0; i < titles.length; i++) {
      await teleportToArtifact(page, i);
      await expect(page.getByRole("heading", { name: titles[i] })).toBeVisible();
      await expect(page.getByRole("link", { name: /Fuente:/ })).toHaveAttribute("target", "_blank");
      expect(await page.evaluate(() => window.game.inspect().world.snapshot().score)).toBe(totals[i]);
      expect(await page.evaluate((title) => window.game.inspect().scene.getObjectByName(`Hallazgo ${title}`).visible, titles[i])).toBe(false);
      const before = await page.evaluate(() => window.game.inspect().world.time);
      await page.waitForTimeout(220);
      expect(await page.evaluate(() => window.game.inspect().world.time)).toBe(before);
      if (level === 1 && i === 0) {
        await page.keyboard.press("p");
        await expect(page.getByRole("heading", { name: titles[i] })).toBeVisible();
        await page.screenshot({ path: testInfo.outputPath("frieze-dialog.png") });
      }
      if (level === 3 && i === 1) {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: testInfo.outputPath("stele-dialog-mobile.png") });
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
        expect(await page.getByRole("button", { name: "Volver al juego" }).isVisible()).toBe(true);
      }
      await page.getByRole("button", { name: "Volver al juego" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await page.waitForFunction(() => !window.game.inspect().world.events.some((event) => event.type === "discovery"));
    }
  }
  const saved = await page.evaluate(() => window.game.exportSave());
  expect(saved.world.artifacts).toEqual(["lekythos", "stele"]);
  expect(saved.world.scoreBase).toBe(250);
  await page.evaluate((value) => window.game.loadSave(value), saved);
  await expect(page.getByRole("heading", { name: "En pausa" })).toBeVisible();
  expect(await page.evaluate(() => window.game.inspect().world.snapshot().score)).toBe(500);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await teleportToArtifact(page, 0);
  await page.waitForTimeout(150);
  await expect(page.getByRole("heading", { name: "Lecito funerario" })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("the imported kick moves Neonboy's legs while keeping the existing attack timing", async ({ page }, testInfo) => {
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  await page.evaluate(() => window.game.inspect().world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); }));
  const legPose = () => page.evaluate(() => {
    const root = window.game.inspect().scene.getObjectByName("Neonboy");
    return ["LeftUpLeg", "RightUpLeg", "LeftLeg", "RightLeg"].flatMap((name) => root.getObjectByName(`mixamorig${name}`).quaternion.toArray());
  });
  const idle = await legPose();
  await page.keyboard.press("k");
  await page.waitForFunction(() => window.game.inspect().world.player.attack?.kind === "kick" && window.game.inspect().world.player.attack.elapsed > 0.25);
  const active = await legPose();
  expect(Math.max(...active.map((value, i) => Math.abs(value - idle[i])))).toBeGreaterThan(0.16);
  await page.screenshot({ path: testInfo.outputPath("kick-desktop.png") });
  await page.waitForFunction(() => !window.game.inspect().world.player.attack);
  await page.waitForTimeout(220);
  await page.keyboard.press("k");
  await page.waitForFunction(() => window.game.inspect().world.player.attack?.kind === "kick" && window.game.inspect().world.player.attack.elapsed > 0.25);
  const replay = await legPose();
  expect(Math.max(...replay.map((value, i) => Math.abs(value - idle[i])))).toBeGreaterThan(0.16);
});
