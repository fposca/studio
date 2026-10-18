import { test, expect } from "@playwright/test";

test("the universe map keeps the 3D store mounted and only enters the record shop", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/discografia/");

  const shop = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  const scene = shop.locator(".record-store-3d");
  await expect(scene).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await shop.getByRole("button", { name: "Disco Gloom", exact: true }).click();
  await page.evaluate(() => { window.__storeCanvasBeforeMap = document.querySelector(".record-store-3d canvas"); });

  await shop.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await expect(map).toBeVisible();
  await expect(map.locator(".universe-map-image img")).toHaveJSProperty("naturalWidth", 1619);
  await expect(map.locator(".universe-map-marker")).toHaveCount(6);
  await expect(map.getByText("DISPONIBLE", { exact: true })).toBeVisible();

  await map.getByRole("button", { name: "Seleccionar Arcade 1999" }).click();
  await expect(map.getByText("BLOQUEADO", { exact: true })).toBeVisible();
  await expect(map.getByRole("button", { name: "Entrar a la Tienda de Discos" })).toHaveCount(0);
  await map.getByRole("button", { name: "Seleccionar Inframundo" }).click();
  await expect(map.getByText("SECRETO", { exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(map).toHaveCount(0);
  await expect(shop.getByRole("button", { name: "Disco Gloom", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => window.__storeCanvasBeforeMap === document.querySelector(".record-store-3d canvas"))).toBe(true);

  await page.keyboard.press("m");
  await expect(map).toBeVisible();
  await map.getByRole("button", { name: "Seleccionar Tienda de Discos" }).click();
  await map.getByRole("button", { name: "Entrar a la Tienda de Discos" }).click();
  await expect(map).toHaveCount(0);
  expect(await page.evaluate(() => window.__storeCanvasBeforeMap === document.querySelector(".record-store-3d canvas"))).toBe(true);
  expect(errors).toEqual([]);
});

test("map markers stay aligned with the image at different viewport sizes", async ({ page }) => {
  await page.goto("/discografia/");
  await page.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  const image = map.locator(".universe-map-image");
  const marker = map.getByRole("button", { name: "Seleccionar Neon Recording Studio" });

  for (const size of [{ width: 1440, height: 900 }, { width: 390, height: 700 }]) {
    await page.setViewportSize(size);
    const imageBox = await image.boundingBox();
    const markerBox = await marker.boundingBox();
    expect(imageBox).toBeTruthy();
    expect(markerBox).toBeTruthy();
    expect((markerBox.x + markerBox.width / 2 - imageBox.x) / imageBox.width).toBeCloseTo(0.438, 2);
    expect((markerBox.y + markerBox.height / 2 - imageBox.y) / imageBox.height).toBeCloseTo(0.172, 2);
    expect(imageBox.width / imageBox.height).toBeCloseTo(1619 / 971, 2);
  }
});


test("the embedded game shop opens and closes the same map", async ({ page }) => {
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: /Omitir cinem/ }).click();
  await page.getByRole("group", { name: "Elegir escenario" }).getByRole("button", { name: "Escenario extra: Tienda de discos" }).click();
  await page.getByRole("button", { name: "Entrar a la tienda" }).click();

  const shop = page.getByRole("dialog", { name: "Tienda de discos Neonboy" });
  await shop.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await expect(map).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(map).toHaveCount(0);
  await expect(shop).toBeVisible();
  await page.evaluate(() => window.unmountGame?.());
});
