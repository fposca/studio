import { test, expect } from "@playwright/test";

test("infernal duel precedes the menu, ends with a raised hammer and lightning, and leaves gameplay untouched", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await expect(page.locator(".neon-game-opening")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toHaveCount(0);
  await expect(page.locator(".neon-game-hud")).toHaveCount(0);
  expect(await page.evaluate(() => {
    const { world, opening } = window.game.inspect();
    const hammer = opening.hero.root.getObjectByName("Arma hammer");
    const sword = opening.demon.root.getObjectByName("Arma sword");
    return { time: world.time, inventory: [...world.inventory], hammer: hammer.visible, sword: sword.visible,
      hammerGrip: hammer.parent.name, swordGrip: sword.parent.name };
  })).toEqual({ time: 0, inventory: ["unarmed"], hammer: true, sword: true,
    hammerGrip: "Empunadura derecha", swordGrip: "Empunadura derecha" });
  const takes = [];
  for (const [shot, time] of [["establish", 0.7], ["villain", 1.65], ["shoulder", 2.6], ["tracking", 4], ["high", 5.6], ["finisher", 7.6]]) {
    await page.waitForFunction((time) => window.game.inspect().openingTime >= time, time);
    const take = await page.evaluate(() => {
      const { opening } = window.game.inspect();
      return { shot: opening.state.shot, position: opening.camera.position.toArray(), defeated: opening.state.defeated };
    });
    expect(take.shot).toBe(shot);
    expect(take.defeated).toBe(shot === "finisher");
    takes.push(take.position);
    await page.screenshot({ path: testInfo.outputPath(shot + ".jpg"), type: "jpeg", quality: 70 });
  }
  expect(new Set(takes.map((position) => position.map((value) => value.toFixed(1)).join())).size).toBe(6);
  expect(await page.evaluate(() => {
    const material = window.game.inspect().opening.scene.getObjectByName("Arena de obsidiana").material;
    return { texture: Boolean(material.map?.image), relief: Boolean(material.bumpMap?.image), bump: material.bumpScale, rocks: window.game.inspect().opening.scene.children.filter((child) => child.name.startsWith("Roca volcanica")).length };
  })).toEqual({ texture: true, relief: true, bump: 0.22, rocks: 0 });
  await page.waitForFunction(() => window.game.inspect().opening?.scene.getObjectByName("Rayo al martillo").visible);
  expect(await page.evaluate(() => {
    const { opening } = window.game.inspect();
    if (opening.state.shot !== "hero") return false;
    const hand = opening.hero.root.getObjectByName("Arma hammer").parent.parent;
    let head; opening.hero.root.traverse((object) => { if (object.isBone && /Head$/i.test(object.name)) head = object; });
    const handPosition = hand.position.clone(), headPosition = head.position.clone();
    hand.getWorldPosition(handPosition); head.getWorldPosition(headPosition);
    return handPosition.y > headPosition.y;
  })).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("hammer-lightning.jpg"), type: "jpeg", quality: 70 });
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible({ timeout: 10_000 });
  expect(await page.evaluate(() => {
    const { world, opening, phase } = window.game.inspect();
    return { time: world.time, health: world.player.health, equipped: world.equipped, phase, opening: Boolean(opening) };
  })).toEqual({ time: 0, health: 100, equipped: "unarmed", phase: "title", opening: false });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  await expect(page.getByRole("progressbar", { name: "Vida" })).toBeVisible();
  await page.waitForFunction(() => window.game.inspect().world.time > 0.1);
  expect(errors).toEqual([]);
});

test("opening can be skipped on mobile directly to the Parthenon menu", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.waitForFunction(() => window.game.inspect().openingTime >= 0.75);
  await page.screenshot({ path: testInfo.outputPath("infernal-duel-mobile.jpg"), type: "jpeg", quality: 65 });
  await page.getByRole("button", { name: "Omitir cinematica" }).click();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await expect(page.locator(".neon-game-opening")).toHaveCount(0);
  expect(await page.evaluate(() => window.game.inspect().world.time)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
