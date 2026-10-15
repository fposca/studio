import { test, expect } from "@playwright/test";

test("neon-fist moves both arms during an unarmed punch", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  await page.keyboard.press("v");
  const strike = await page.evaluate(async () => {
    const game = window.game;
    const { world, scene, input } = game.inspect();
    world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
    input.orbit.distance = 3.6;
    const root = scene.getObjectByName("Neonboy");
    const arms = ["mixamorigLeftArm", "mixamorigRightArm"].map((name) => root.getObjectByName(name));
    const idle = arms.map((bone) => bone.quaternion.toArray());
    game.action("punch");
    return new Promise((resolve, reject) => {
      let frames = 0;
      const sample = () => {
        const attack = game.inspect().world.player.attack;
        if (attack?.elapsed >= 0.18) {
          game.setPaused(true);
          resolve({ kind: attack.kind, armChanges: arms.map((bone, index) =>
            Math.max(...bone.quaternion.toArray().map((value, part) => Math.abs(value - idle[index][part])))) });
        } else if (++frames > 120) reject(new Error("El punetazo no comenzo"));
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
  });
  expect(strike.kind).toBe("punch");
  expect(strike.armChanges[0]).toBeGreaterThan(0.1);
  expect(strike.armChanges[1]).toBeGreaterThan(0.1);
  await page.screenshot({ path: testInfo.outputPath("neon-fist.png") });
  expect(errors).toEqual([]);
});
