import { test, expect } from "@playwright/test";

test("running bends alternate knees and the new jump pose blends back to idle", async ({ page }, testInfo) => {
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  await page.keyboard.press("v");
  await page.evaluate(() => {
    const { world, input } = window.game.inspect();
    world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
    Object.assign(input.orbit, { yaw: 0, pitch: 0.18, distance: 4.2 });
  });
  await page.keyboard.down("s");
  await page.keyboard.down("ShiftLeft");
  await page.waitForFunction(() => window.game.inspect().world.player.mode === "run");
  const stride = await page.evaluate(() => new Promise((resolve) => {
    const values = [];
    function frame() {
      const { scene } = window.game.inspect(), model = scene.getObjectByName("Neonboy");
      const bend = (side) => {
        const bone = (name) => model.getObjectByName(`mixamorig${side}${name}`);
        const point = (name) => bone(name).getWorldPosition(bone(name).position.clone());
        const thigh = point("Leg").sub(point("UpLeg")).normalize();
        const shin = point("Foot").sub(point("Leg")).normalize();
        return Math.acos(Math.max(-1, Math.min(1, thigh.dot(shin))));
      };
      values.push([bend("Left"), bend("Right")]);
      if (values.length >= 22) resolve(values); else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }));
  expect(Math.max(...stride.flat())).toBeGreaterThan(0.7);
  for (const side of [0, 1]) expect(Math.max(...stride.map((p) => p[side])) - Math.min(...stride.map((p) => p[side]))).toBeGreaterThan(0.35);
  await page.screenshot({ path: testInfo.outputPath("run-front.png") });
  await page.keyboard.up("s");
  await page.keyboard.up("ShiftLeft");
  await page.waitForFunction(() => window.game.inspect().world.player.mode === "idle");
  await page.waitForTimeout(150);
  const idlePose = await page.evaluate(() => {
    const root = window.game.inspect().scene.getObjectByName("Neonboy");
    return ["LeftArm", "RightArm", "LeftUpLeg", "RightUpLeg"].flatMap((name) => root.getObjectByName(`mixamorig${name}`).quaternion.toArray());
  });
  await page.keyboard.press("Space");
  await page.waitForFunction(() => {
    const p = window.game.inspect().world.player;
    return p.y > 0.6 && p.velocityY > 0;
  });
  const ascent = await page.evaluate(() => {
    const root = window.game.inspect().scene.getObjectByName("Neonboy");
    return ["LeftArm", "RightArm", "LeftUpLeg", "RightUpLeg"].flatMap((name) => root.getObjectByName(`mixamorig${name}`).quaternion.toArray());
  });
  expect(Math.max(...ascent.map((v, i) => Math.abs(v - idlePose[i])))).toBeGreaterThan(0.12);
  await page.screenshot({ path: testInfo.outputPath("jump-takeoff.png") });
  await page.waitForFunction(() => window.game.inspect().world.player.velocityY < -3);
  const descent = await page.evaluate(() => {
    const root = window.game.inspect().scene.getObjectByName("Neonboy");
    return ["LeftArm", "RightArm", "LeftUpLeg", "RightUpLeg"].flatMap((name) => root.getObjectByName(`mixamorig${name}`).quaternion.toArray());
  });
  expect(Math.max(...descent.map((v, i) => Math.abs(v - idlePose[i])))).toBeGreaterThan(0.12);
  await page.screenshot({ path: testInfo.outputPath("jump-fall.png") });
  await page.waitForFunction(() => window.game.inspect().world.player.grounded);
  await page.waitForFunction(() => window.game.inspect().world.player.landing === 0);
  expect(await page.evaluate(() => window.game.inspect().world.player.mode)).toBe("idle");
  const landedPose = await page.evaluate(() => {
    const root = window.game.inspect().scene.getObjectByName("Neonboy");
    return ["LeftArm", "RightArm", "LeftUpLeg", "RightUpLeg"].flatMap((name) => root.getObjectByName(`mixamorig${name}`).quaternion.toArray());
  });
  await page.keyboard.press("Space");
  await page.waitForFunction(() => window.game.inspect().world.player.y > 0.6);
  const secondJump = await page.evaluate(() => {
    const root = window.game.inspect().scene.getObjectByName("Neonboy");
    return ["LeftArm", "RightArm", "LeftUpLeg", "RightUpLeg"].flatMap((name) => root.getObjectByName(`mixamorig${name}`).quaternion.toArray());
  });
  expect(Math.max(...secondJump.map((v, i) => Math.abs(v - landedPose[i])))).toBeGreaterThan(0.12);
  await page.waitForFunction(() => window.game.inspect().world.player.grounded);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { window.game.inspect().input.orbit.distance = 5.4; });
  await page.getByRole("button", { name: "Saltar (Espacio)", exact: true }).click();
  await page.waitForFunction(() => window.game.inspect().world.player.y > 0.6);
  await page.screenshot({ path: testInfo.outputPath("jump-mobile.png") });
});
