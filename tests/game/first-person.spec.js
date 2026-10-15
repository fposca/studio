import { test, expect } from "@playwright/test";

test("first-person camera shows all weapons, aims with the mouse and restores third-person", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Nivel 4: Las catacumbas" }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("button", { name: "Omitir intro" }).click();
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.evaluate(() => {
    const { world } = window.game.inspect();
    for (const kind of ["sword", "hammer", "axe", "crossbow"]) world.inventory.add(kind);
    world.player.invulnerable = 1000;
  });
  await expect(page.getByRole("button", { name: "Ver en primera persona (V)" })).toBeVisible();
  expect(await page.evaluate(() => window.game.inspect().scene.getObjectByName("Neonboy").visible)).toBe(true);
  await page.getByRole("button", { name: "Ver en primera persona (V)" }).click();
  await expect(page.getByRole("button", { name: "Ver en tercera persona (V)" })).toBeVisible();
  const camera = await page.evaluate(() => {
    const { world, scene, camera } = window.game.inspect();
    return { eyeHeight: camera.position.y - world.player.y, hidden: !scene.getObjectByName("Neonboy").visible,
      gap: Math.hypot(camera.position.x - world.player.x, camera.position.z - world.player.z) };
  });
  expect(camera.eyeHeight).toBeCloseTo(1.62, 1);
  expect(camera.gap).toBeLessThan(0.02);
  expect(camera.hidden).toBe(true);
  for (const kind of ["unarmed", "sword", "hammer", "axe", "crossbow"]) {
    await page.evaluate((kind) => window.game.equip(kind), kind);
    await page.waitForFunction((kind) => window.game.inspect().world.equipped === kind, kind);
    await page.waitForTimeout(300);
    const visible = await page.evaluate(() => {
      const view = window.game.inspect().firstPersonView;
      const result = [];
      view.scene.traverse((object) => { if (object.name.startsWith("Arma ") && object.visible) result.push(object.name); });
      return { weapons: result, hands: view.scene.getObjectByName("Guante derecho").visible };
    });
    expect(visible.weapons).toEqual(kind === "unarmed" ? [] : [`Arma ${kind}`]);
    expect(visible.hands).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`first-person-${kind}.png`) });
    if (kind !== "crossbow") {
      const gloves = () => page.evaluate(() => {
        const scene = window.game.inspect().firstPersonView.scene;
        return ["Guante derecho", "Guante izquierdo"].flatMap((name) => {
          const hand = scene.getObjectByName(name);
          return [...hand.position.toArray(), ...hand.quaternion.toArray()];
        });
      });
      const resting = await gloves();
      await page.keyboard.press("j");
      await page.waitForFunction(() => window.game.inspect().world.player.attack?.elapsed > 0.05);
      expect(await gloves()).not.toEqual(resting);
      await page.waitForFunction(() => !window.game.inspect().world.player.attack && window.game.inspect().world.player.cooldown === 0);
    }
  }
  await expect(page.getByLabel("Mira de ballesta")).toContainText("10 / 10");
  const canvas = page.getByLabel("Escenario 3D de Neonboy");
  // Mouse look is ready immediately after entering, before clicking the background.
  const before = await page.evaluate(() => ({ ...window.game.inspect().input.orbit }));
  await page.mouse.move(700, 400);
  await page.waitForFunction((before) => window.game.inspect().input.orbit.lookPitch !== before.lookPitch, before);
  const aimed = await page.evaluate(() => ({ ...window.game.inspect().input.orbit }));
  expect(aimed.yaw).not.toBe(before.yaw);
  await canvas.click({ position: { x: 650, y: 450 } });
  await page.waitForFunction(() => document.pointerLockElement?.tagName === "CANVAS");
  await expect(page.getByLabel("Mira de ballesta")).toContainText("9 / 10");
  await page.keyboard.press("p");
  await expect(page.getByRole("heading", { name: "En pausa", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement === null)).toBe(true);
  const saved = await page.evaluate(() => window.game.exportSave());
  expect(saved.camera.firstPerson).toBe(true);
  expect(Number.isFinite(saved.camera.lookPitch)).toBe(true);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.keyboard.press("v");
  await expect(page.getByRole("button", { name: "Ver en primera persona (V)" })).toBeVisible();
  expect(await page.evaluate(() => window.game.inspect().scene.getObjectByName("Neonboy").visible)).toBe(true);
  await page.getByRole("button", { name: "Ver en primera persona (V)" }).click();
  await page.evaluate((saved) => window.game.loadSave(saved), saved);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  expect(await page.evaluate(() => window.game.inspect().input.orbit.firstPerson)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: testInfo.outputPath("first-person-mobile.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.evaluate(() => window.unmountGame());
  expect(await page.evaluate(() => document.pointerLockElement === null)).toBe(true);
  expect(errors).toEqual([]);
});
