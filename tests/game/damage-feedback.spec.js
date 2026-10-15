import { test, expect } from "@playwright/test";

test("mouse aim needs no click or pointer lock, and damage updates HUD, red flash, shake and pain audio", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    // Exercise the no-capture path used when a browser denies or cannot request pointer lock.
    HTMLCanvasElement.prototype.requestPointerLock = () => Promise.reject(new Error("No pointer lock"));
    window.playedSounds = [];
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      window.playedSounds.push(this.buffer?.duration);
      return start.apply(this, args);
    };
  });
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Nivel 4: Las catacumbas" }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("button", { name: "Omitir intro" }).click();
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.evaluate(() => {
    const { world } = window.game.inspect();
    world.enemies.forEach((enemy) => { enemy.active = false; enemy.collider.setEnabled(false); });
    world.inventory.add("crossbow"); world.equip("crossbow");
  });
  await page.getByRole("button", { name: "Ver en primera persona (V)" }).click();
  await page.mouse.move(650, 450);
  const before = await page.evaluate(() => ({ ...window.game.inspect().input.orbit }));
  await page.mouse.move(710, 410);
  const aimed = await page.evaluate(() => ({ ...window.game.inspect().input.orbit }));
  expect(aimed.yaw).not.toBe(before.yaw); expect(aimed.lookPitch).not.toBe(before.lookPitch);
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
  await page.mouse.click(710, 410);
  await expect(page.getByLabel("Mira de ballesta")).toContainText("9 / 10");
  await page.keyboard.press("p");
  const pausedAim = await page.evaluate(() => ({ ...window.game.inspect().input.orbit }));
  await page.mouse.move(760, 440);
  expect(await page.evaluate(() => window.game.inspect().input.orbit.yaw)).toBe(pausedAim.yaw);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.mouse.move(760, 480);
  expect(await page.evaluate(() => window.game.inspect().input.orbit.lookPitch)).not.toBe(pausedAim.lookPitch);
  const hurtCount = () => page.evaluate(() => window.playedSounds.filter((duration) => Math.abs(duration - 0.52) < 0.001).length);
  const hurt = (amount) => page.evaluate((amount) => {
    const { world } = window.game.inspect();
    world.player.invulnerable = 0;
    world.damage(world.player, world.enemies[0], { damage: amount, knockback: 0 });
  }, amount);
  await hurt(28);
  await expect(page.getByRole("progressbar", { name: "Vida", exact: true })).toHaveAttribute("aria-valuenow", "72");
  await expect(page.getByLabel("Vida perdida")).toHaveText("-28");
  await expect(page.locator(".neon-game-damage")).toBeVisible();
  expect(await page.locator("canvas").evaluate((node) => getComputedStyle(node).animationName)).toBe("neon-damage-shake");
  expect(await hurtCount()).toBe(1);
  await page.screenshot({ path: testInfo.outputPath("damage-flash.png") });
  await expect(page.locator(".neon-game-damage")).toHaveCount(0);
  await expect(page.locator("canvas")).not.toHaveClass(/is-hit/);
  await page.evaluate(() => {
    const { world } = window.game.inspect();
    world.damage(world.enemies[0], world.player, { damage: 10, kind: "sword", knockback: 0 });
  });
  await page.waitForTimeout(150);
  expect(await hurtCount()).toBe(1);
  await expect(page.locator(".neon-game-damage")).toHaveCount(0);
  await page.keyboard.press("v");
  await hurt(52);
  await expect(page.getByRole("progressbar", { name: "Vida", exact: true })).toHaveAttribute("aria-valuenow", "20");
  await expect(page.locator(".neon-game-damage")).toBeVisible();
  await expect.poll(hurtCount).toBe(2);
  await expect(page.locator(".neon-game-health-status")).toHaveText("VIDA CRITICA");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath("critical-health-mobile.png") });
  const panel = await page.locator(".neon-game-vitals").boundingBox();
  expect(panel.x).toBeGreaterThanOrEqual(0); expect(panel.x + panel.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.evaluate(() => window.game.setMuted(true));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await hurt(5);
  await expect(page.getByRole("progressbar", { name: "Vida", exact: true })).toHaveAttribute("aria-valuenow", "15");
  expect(await hurtCount()).toBe(2);
  expect(await page.locator("canvas").evaluate((node) => getComputedStyle(node).animationName)).toBe("none");
  await page.evaluate(() => window.unmountGame());
  expect(errors).toEqual([]);
});
