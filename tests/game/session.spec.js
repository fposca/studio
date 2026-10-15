import { chromium, test, expect } from "@playwright/test";
import { loadLevel } from "./levelHelpers.js";

async function openTitle(page) {
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await expect(page.getByRole("heading", { name: "NeonBoy", exact: true })).toBeVisible({ timeout: 15_000 });
}

async function pixels(page) {
  return page.evaluate(() => {
    const { renderer, scene, camera } = window.game.inspect();
    renderer.render(scene, camera);
    const gl = renderer.getContext(), pixels = new Uint8Array(8 * 8 * 4), rgb = [];
    for (let i = 0; i < 7; i++) {
      gl.readPixels(Math.floor(gl.drawingBufferWidth * (0.25 + i / 12)), Math.floor(gl.drawingBufferHeight * 0.5), 8, 8, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      rgb.push(...pixels.filter((_, index) => index % 4 !== 3));
    }
    return { contrast: Math.max(...rgb) - Math.min(...rgb), textures: renderer.info.memory.textures };
  });
}

test("title presents animated NeonBoy before Play, with frozen gameplay at desktop and mobile sizes", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openTitle(page);
  await expect(page.locator(".neon-game-title-brand p")).toHaveText("Ancient nightmare");
  await expect(page.locator(".neon-game-title-brand img")).toBeVisible();
  expect(await page.locator(".neon-game-title-brand img").evaluate((image) => image.naturalWidth)).toBeGreaterThan(1000);
  await expect.poll(() => page.evaluate(() => { let period; window.game.inspect().scene.traverse((object) => { if (object.userData?.period) period = object.userData.period; }); return period; })).toBe("night");
  await expect(page.getByRole("button", { name: "Cargar partida", exact: true })).toBeDisabled();
  await expect(page.getByRole("progressbar", { name: "Vida" })).toHaveCount(0);
  const before = await page.evaluate(() => window.game.inspect().scene.getObjectByName("Neonboy").getObjectByName("mixamorigHead").quaternion.toArray());
  await page.keyboard.down("w");
  await page.keyboard.press("Space");
  await page.keyboard.press("p");
  await page.waitForTimeout(900);
  await page.keyboard.up("w");
  const after = await page.evaluate(() => ({ time: window.game.inspect().world.time, z: window.game.inspect().world.player.z,
    pose: window.game.inspect().scene.getObjectByName("Neonboy").getObjectByName("mixamorigHead").quaternion.toArray() }));
  expect(after.time).toBe(0);
  expect(after.z).toBe(13);
  expect(after.pose).not.toEqual(before);
  for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 640 }, { width: 390, height: 460 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(250);
    const image = await pixels(page);
    expect(image.contrast).toBeGreaterThan(30);
    expect(image.textures).toBeGreaterThan(8);
    const heading = await page.getByRole("heading", { name: "NeonBoy", exact: true }).boundingBox();
    const play = await page.getByRole("button", { name: "Play", exact: true }).boundingBox();
    expect(heading.y + heading.height).toBeLessThan(play.y);
    expect(play.x).toBeGreaterThanOrEqual(0);
    expect(play.x + play.width).toBeLessThanOrEqual(size.width);
    const foot = await page.evaluate(() => {
      const { scene, camera } = window.game.inspect();
      const bone = scene.getObjectByName("Neonboy").getObjectByName("mixamorigLeftFoot");
      const position = bone.getWorldPosition(bone.position.clone()).project(camera);
      return { x: (position.x + 1) / 2 * innerWidth, y: (1 - position.y) / 2 * innerHeight };
    });
    expect(foot.x < play.x || foot.x > play.x + play.width || foot.y < play.y - 4).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(size.width);
    await page.screenshot({ path: testInfo.outputPath(`title-${size.width}x${size.height}.png`) });
  }
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  await expect(page.getByRole("progressbar", { name: "Vida" })).toBeVisible();
  await page.waitForFunction(() => window.game.inspect().world.time > 0.1);
  await expect.poll(() => page.evaluate(() => { let period; window.game.inspect().scene.traverse((object) => { if (object.userData?.period) period = object.userData.period; }); return period; })).toBe("night");
  await page.keyboard.press("p");
  await page.getByRole("button", { name: "Inicio", exact: true }).click();
  await page.keyboard.press("p");
  await expect(page.getByRole("heading", { name: "Volver al inicio?" })).toBeVisible();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "NeonBoy", exact: true })).toBeVisible({ timeout: 15_000 });
  expect(await page.evaluate(() => window.game.inspect().world.time)).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem("neonboy.game.save.v1"))).toBeNull();
  expect(errors).toEqual([]);
});

test("manual save survives reload and restores exterior levels, inventory, enemies, lighting and camera", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openTitle(page);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  for (const level of [1, 3]) {
    await page.evaluate(() => {
      window.game.setPaused(true);
      const { world, input } = window.game.inspect();
      world.inventory.add("sword");
      if (world.level.id === 3) world.inventory.add("axe");
      world.equip(world.level.id === 3 ? "axe" : "sword");
      world.player.health = 68;
      world.player.x = 2.1;
      world.coins[0].collected = true; world.collected = 1;
      world.enemies[0].health = 0;
      world.enemies[1].health = 27;
      Object.assign(input.orbit, { yaw: 0.52, pitch: 0.31, distance: 5.8 });
      window.game.setPeriod("sunset");
    });
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Partida guardada");
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.game.save.v1")));
    expect(saved.world.level).toBe(level);
    await page.reload();
    await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
    await expect(page.locator(".neon-game-save-meta")).toContainText(`Nivel ${level}`);
    await page.getByRole("button", { name: "Cargar partida", exact: true }).click();
    await expect(page.getByRole("heading", { name: "En pausa" })).toBeVisible();
    await page.waitForTimeout(200);
    const restored = await page.evaluate(() => window.game.exportSave());
    expect(restored.world).toEqual(saved.world);
    expect(restored.camera).toEqual(saved.camera);
    expect(restored.period).toBe(saved.period);
    expect(await page.evaluate(() => window.game.inspect().world.enemies[0].collider.isEnabled())).toBe(false);
    await page.screenshot({ path: testInfo.outputPath(`loaded-level-${level}.png`) });
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    expect((await pixels(page)).contrast).toBeGreaterThan(30);
    if (level === 1) {
      await loadLevel(page, 3);
    }
  }
  await page.getByRole("button", { name: "Cargar partida", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Cargar partida?" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.keyboard.press("p");
  await page.getByRole("button", { name: "Inicio", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  const previous = await page.evaluate(() => localStorage.getItem("neonboy.game.save.v1"));
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  expect(await page.evaluate(() => window.game.inspect().world.level.id)).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem("neonboy.game.save.v1"))).toBe(previous);
  expect(errors).toEqual([]);
});

test("invalid saves and a storage quota error do not prevent playing or destroy the slot", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("neonboy.game.save.v1", "invalid-json"));
  await openTitle(page);
  await expect(page.locator(".neon-game-save-meta")).toContainText("No se pudo leer");
  await expect(page.getByRole("button", { name: "Cargar partida", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".neon-game-level-intro")).toHaveCount(0, { timeout: 10_000 });
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException("Full", "QuotaExceededError"); }; });
  await page.getByRole("button", { name: "Guardar partida", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("No se pudo guardar");
  expect(await page.evaluate(() => localStorage.getItem("neonboy.game.save.v1"))).toBe("invalid-json");
  await page.keyboard.down("w");
  await page.waitForFunction(() => window.game.inspect().world.player.z < 12);
  await page.keyboard.up("w");
});

test("disabled WebGL reports the browser setting without loading the 3D assets", async ({}, testInfo) => {
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-webgl"] });
  try {
    const page = await browser.newPage();
    const modelRequests = [];
    page.on("request", (request) => { if (request.url().endsWith(".glb")) modelRequests.push(request.url()); });
    await page.goto("http://127.0.0.1:5173/tests/fixtures/game.html");
    await expect(page.getByRole("heading", { name: "No se pudo iniciar" })).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("WebGL 2");
    await expect(page.getByRole("alert")).toContainText("chrome://settings/system");
    expect(modelRequests).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath("webgl-disabled.png") });
    await page.getByRole("button", { name: "Reintentar" }).click();
    await expect(page.getByRole("alert")).toContainText("WebGL 2");
  } finally { await browser.close(); }
});
