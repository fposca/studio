import { test, expect } from "@playwright/test";

test("hablar en la tienda no crea un segundo WebGL ni pierde el piso", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.storeContextEvents = [];
    document.addEventListener("webglcontextlost", (event) => window.storeContextEvents.push(event.target?.outerHTML?.slice(0, 120) || "canvas"), true);
  });
  await page.goto("/tests/fixtures/store-with-editor.html");
  const shop = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  const scene = shop.locator(".record-store-3d");
  const canvas = scene.locator("canvas");
  await expect(scene).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(page.locator(".three-viewport canvas")).toHaveCount(0);
  await page.evaluate(() => { window.initialStoreCanvas = document.querySelector(".record-store-3d canvas"); });

  await page.keyboard.down("a");
  await expect(shop.locator(".record-store-nearby")).toContainText("Tito", { timeout: 15_000 });
  await page.keyboard.up("a");
  await page.keyboard.press("e");
  const dialog = shop.getByRole("dialog", { name: /Tito/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /discos de NeonBoy/ }).click();
  await expect(dialog).toContainText("colecci");
  await page.waitForTimeout(7000);
  await expect(page.locator(".three-viewport canvas")).toHaveCount(0);
  const state = await page.evaluate(() => ({
    sameCanvas: document.querySelector(".record-store-3d canvas") === window.initialStoreCanvas,
    lost: window.initialStoreCanvas.getContext("webgl2").isContextLost(),
    contextEvents: window.storeContextEvents
  }));
  expect(state).toEqual({ sameCanvas: true, lost: false, contextEvents: [] });
  await page.keyboard.press("Escape");
  for (let visit = 0; visit < 4; visit++) {
    await page.keyboard.press("e");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /discos de NeonBoy/ }).click();
    await page.waitForTimeout(1000);
    expect(await canvas.evaluate((node) => node.getContext("webgl2").isContextLost())).toBe(false);
    await page.keyboard.press("Escape");
  }
  expect(await page.evaluate(() => window.storeContextEvents)).toEqual([]);
  expect(errors).toEqual([]);
});


test("al pasar de Studio 3D a Discograf?a se libera el contexto antes de conversar", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto("/tests/fixtures/store-with-editor.html?start=editor");
  const editorCanvas = page.locator(".three-viewport canvas");
  await expect(editorCanvas).toBeVisible({ timeout: 90_000 });
  await page.waitForFunction(() => {
    const canvas = document.querySelector(".three-viewport canvas");
    return canvas?.width > 100 && !canvas.getContext("webgl2")?.isContextLost();
  });
  await page.evaluate(() => window.enterStore());
  const shop = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  const scene = shop.locator(".record-store-3d");
  await expect(scene).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  expect(await editorCanvas.evaluate((canvas) => canvas.getContext("webgl2").isContextLost())).toBe(true);
  const canvas = scene.locator("canvas");
  expect(await canvas.evaluate((node) => node.getContext("webgl2").isContextLost())).toBe(false);
  await page.keyboard.down("a");
  await expect(shop.locator(".record-store-nearby")).toContainText("Tito", { timeout: 15_000 });
  await page.keyboard.up("a");
  await page.keyboard.press("e");
  await expect(shop.getByRole("dialog", { name: /Tito/ })).toBeVisible();
  await page.waitForTimeout(5000);
  expect(await canvas.evaluate((node) => node.getContext("webgl2").isContextLost())).toBe(false);
});


test("la tienda permite recuperar la escena si se pierde WebGL", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/tests/fixtures/store-with-editor.html");
  const scene = page.locator(".record-store-3d");
  await expect(scene).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  const canvas = scene.locator("canvas");
  const oldCanvas = await canvas.elementHandle();
  await canvas.evaluate((node) => node.getContext("webgl2").getExtension("WEBGL_lose_context").loseContext());
  await expect(scene.getByRole("alert")).toContainText("Recuperar escena");
  await scene.getByRole("button", { name: "Recuperar escena" }).click();
  await expect(scene).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  expect(await oldCanvas.evaluate((node) => node.isConnected)).toBe(false);
  expect(await canvas.evaluate((node) => node.getContext("webgl2").isContextLost())).toBe(false);
  await expect(scene.getByRole("alert")).toHaveCount(0);
});
