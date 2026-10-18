import { test, expect } from "@playwright/test";

test("NeonBoy enters the studio, examines equipment and returns to the shop", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/discografia/");

  const shop = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(shop.locator('.record-store-3d')).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await shop.getByRole("button", { name: "Disco Gloom", exact: true }).click();
  await shop.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: "Seleccionar Neon Recording Studio" }).click();
  await expect(map.getByRole("button", { name: "Entrar a Neon Recording Studio" })).toBeVisible();
  await map.getByRole("button", { name: "Entrar a Neon Recording Studio" }).click();

  const studio = page.getByRole("region", { name: "Neon Recording Studio 1999" });
  await expect(studio).toBeVisible();
  await expect(studio.locator('.record-store-3d')).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(page.locator('.record-store-3d canvas')).toHaveCount(1);
  await page.keyboard.down("w");
  await page.waitForTimeout(2100);
  await page.keyboard.up("w");
  await expect(studio.getByText("[E] Examinar Consola")).toBeVisible();
  await page.keyboard.press("e");
  await expect(studio.getByText("Esta consola tiene más canales que una televisión por cable.")).toBeVisible();

  await page.keyboard.down("d");
  await page.waitForTimeout(2200);
  await page.keyboard.up("d");
  await page.keyboard.down("w");
  await page.waitForTimeout(2000);
  await page.keyboard.up("w");
  await page.keyboard.down("d");
  await page.waitForTimeout(380);
  await page.keyboard.up("d");
  await page.keyboard.down("w");
  await page.waitForTimeout(3300);
  await page.keyboard.up("w");
  await page.keyboard.down("a");
  await page.waitForTimeout(2000);
  await page.keyboard.up("a");
  await expect(studio.getByText("[E] Examinar Micrófono")).toBeVisible();
  await page.keyboard.press("e");
  await expect(studio.getByText("Acá empiezan las canciones que después terminan en los discos.")).toBeVisible();

  await page.evaluate(() => { window.__studioCanvasBeforeMap = document.querySelector(".record-store-3d canvas"); });
  await page.keyboard.press("m");
  await expect(map).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(map).toHaveCount(0);
  expect(await page.evaluate(() => window.__studioCanvasBeforeMap === document.querySelector(".record-store-3d canvas"))).toBe(true);
  await page.keyboard.press("m");
  await expect(map).toBeVisible();
  await map.getByRole("button", { name: "Seleccionar Tienda de Discos" }).click();
  await map.getByRole("button", { name: "Entrar a la Tienda de Discos" }).click();
  await expect(shop).toBeVisible();
  await expect(shop.locator('.record-store-3d')).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(shop.getByRole("button", { name: "Disco Gloom", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('.record-store-3d canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});
