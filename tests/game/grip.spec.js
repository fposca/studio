import { test, expect } from "@playwright/test";

test("sword stays in the palm during Shift running, J attacks and jump on desktop and mobile", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.evaluate(() => {
    const { world } = window.game.inspect();
    world.enemies.forEach((enemy) => { enemy.health = 0; enemy.collider.setEnabled(false); });
    const pickup = world.pickups[0];
    pickup.x = world.player.x; pickup.z = world.player.z;
  });
  await expect(page.getByRole("button", { name: "Espada (2)", exact: true })).toBeEnabled();
  await page.keyboard.press("2");
  await expect(page.getByRole("button", { name: "Espada (2)", exact: true })).toHaveAttribute("aria-pressed", "true");
  async function checkGrip() {
    const state = await page.evaluate(async () => {
      const T = await import("/node_modules/three/build/three.module.js");
      const { scene, renderer, camera } = window.game.inspect(), root = scene.getObjectByName("Neonboy");
      root.updateMatrixWorld(true);
      const sword = root.getObjectByName("Arma sword"), hand = root.getObjectByName("mixamorigRightHand");
      const local = hand.worldToLocal(sword.getWorldPosition(new T.Vector3()));
      const palm = new T.Vector3(0, 0.11, -0.055);
      const transforms = sword.parent.matrix.elements.slice();
      renderer.render(scene, camera);
      const gl = renderer.getContext(), pixels = new Uint8Array(8 * 8 * 4);
      gl.readPixels(gl.drawingBufferWidth / 2, gl.drawingBufferHeight / 2, 8, 8, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      let gripWeight = 0;
      root.traverse((mesh) => { if (mesh.isSkinnedMesh) gripWeight = Math.max(gripWeight, mesh.morphTargetInfluences?.[0] || 0); });
      return { gap: local.distanceTo(palm), parent: sword.parent.parent.name, visible: sword.visible, gripWeight, transforms,
        pixels: Math.max(...pixels.filter((_, i) => i % 4 !== 3)) };
    });
    expect(state.gap).toBeLessThan(0.001);
    expect(state.parent).toBe("mixamorigRightHand"); expect(state.visible).toBe(true);
    expect(state.gripWeight).toBe(1); expect(state.pixels).toBeGreaterThan(10);
    return state.transforms;
  }
  const attached = await checkGrip();
  await page.keyboard.down("d");
  await page.waitForFunction(() => window.game.inspect().world.player.mode === "walk");
  const walking = await page.evaluate(() => window.game.inspect().world.player.speed);
  await page.keyboard.down("ShiftLeft");
  await page.waitForFunction(() => window.game.inspect().world.player.mode === "run");
  expect(await page.evaluate(() => window.game.inspect().world.player.speed)).toBeGreaterThan(walking * 1.45);
  expect(await checkGrip()).toEqual(attached);
  await page.screenshot({ path: testInfo.outputPath("sword-running.png") });
  await page.keyboard.up("ShiftLeft");
  await page.waitForFunction(() => window.game.inspect().world.player.mode === "walk");
  await page.keyboard.up("d");
  await page.waitForFunction(() => window.game.inspect().world.player.mode === "idle");
  await page.evaluate(() => { const { input, world } = window.game.inspect(); input.orbit.yaw = world.player.yaw + 0.25; input.orbit.distance = 3.6; input.orbit.pitch = 0.16; });
  await page.waitForTimeout(100);
  await page.screenshot({ path: testInfo.outputPath("sword-grip-desktop.png") });
  await page.keyboard.down("j");
  await page.waitForFunction(() => window.game.inspect().world.player.attack?.elapsed > 0.23);
  expect(await checkGrip()).toEqual(attached);
  await page.screenshot({ path: testInfo.outputPath("sword-strike.png") });
  await page.keyboard.up("j");
  await page.waitForFunction(() => !window.game.inspect().world.player.attack);
  await page.keyboard.press("Space");
  await page.waitForFunction(() => window.game.inspect().world.player.y > 0.6);
  expect(await checkGrip()).toEqual(attached);
  await page.waitForFunction(() => window.game.inspect().world.player.grounded);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { window.game.inspect().input.orbit.distance = 5.6; });
  await page.waitForTimeout(400);
  await checkGrip();
  await page.screenshot({ path: testInfo.outputPath("sword-grip-mobile.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  const pausedPose = await page.evaluate(() => {
    window.game.setPaused(true);
    const pose = [];
    window.game.inspect().scene.getObjectByName("Neonboy").traverse((o) => { if (o.isBone) pose.push(...o.quaternion.toArray()); });
    return pose;
  });
  await page.waitForTimeout(200);
  const drift = await page.evaluate((before) => {
    const pose = [];
    window.game.inspect().scene.getObjectByName("Neonboy").traverse((o) => { if (o.isBone) pose.push(...o.quaternion.toArray()); });
    return Math.max(...pose.map((v, i) => Math.abs(v - before[i])));
  }, pausedPose);
  expect(drift).toBeLessThan(0.00001);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Punos (1)", exact: true }).click();
  await page.waitForFunction(() => !window.game.inspect().scene.getObjectByName("Neonboy").getObjectByName("Arma sword").visible);
  expect(await page.evaluate(() => {
    let weight = 0;
    window.game.inspect().scene.getObjectByName("Neonboy").traverse((o) => { if (o.isSkinnedMesh) weight += o.morphTargetInfluences?.[0] || 0; });
    return weight;
  })).toBe(0);
  await page.evaluate(() => window.unmountGame());
  expect(errors).toEqual([]);
});
