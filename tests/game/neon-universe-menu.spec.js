test("the intro video reveals the title at two seconds and holds its last frame", async ({ page }) => {
  await page.goto("/discografia/");
  const video = page.locator(".universe-intro-video");
  const intro = page.locator(".universe-intro");
  const start = page.getByRole("button", { name: /comenzar/ });

  await expect(video).toHaveCount(1);
  await expect(start).toBeDisabled();
  await expect(intro).not.toHaveClass(/is-revealed/);
  await expect.poll(() => video.evaluate((element) => element.currentTime), { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
  await expect(intro).toHaveClass(/is-revealed/);
  await expect(start).toBeEnabled();
  await expect.poll(() => video.evaluate((element) => element.ended), { timeout: 10_000 }).toBe(true);
  const finalFrame = await video.evaluate((element) => ({ time: element.currentTime, duration: element.duration, paused: element.paused }));
  expect(finalFrame.duration).toBeGreaterThan(5);
  expect(finalFrame.time).toBeCloseTo(finalFrame.duration, 1);
  expect(finalFrame.paused).toBe(true);
  await page.waitForTimeout(350);
  expect(await video.evaluate((element) => element.currentTime)).toBeCloseTo(finalFrame.time, 2);
});

import { test, expect } from "@playwright/test";

test("the universe starts at its title and can save, load, pause and resume", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/discografia/");
  await expect(page.getByAltText("NEONBOY")).toBeVisible();
  await expect(page.getByText("UNIVERSE")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /comenzar/ })).toBeEnabled({ timeout: 15_000 });
  await page.keyboard.press("Enter");
  const menu = page.getByLabel("Menú principal NeonBoy Universe");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("button", { name: "Continuar" })).toBeDisabled();

  await menu.getByRole("button", { name: "Créditos" }).click();
  await expect(menu).toContainText("Hugo Mendez");
  await menu.getByRole("button", { name: "Volver" }).click();
  await menu.getByRole("button", { name: "Opciones" }).click();
  await expect(menu).toContainText("Animación del menú");
  await menu.getByRole("button", { name: "Volver" }).click();

  await menu.getByRole("button", { name: "Nueva partida" }).click();
  const shop = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(shop.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await shop.getByRole("button", { name: "Disco Gloom", exact: true }).click();
  await page.keyboard.press("Escape");
  const pause = page.getByRole("dialog", { name: "Menú de pausa" });
  await expect(pause).toBeVisible();
  await pause.getByRole("button", { name: "Guardar partida" }).click();
  await pause.getByRole("button", { name: /Partida 1/ }).click();
  await expect(pause.getByRole("button", { name: "Menú principal" })).toBeVisible();
  await pause.getByRole("button", { name: "Menú principal" }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(menu.getByRole("button", { name: "Continuar" })).toBeEnabled();

  await menu.getByRole("button", { name: "Nueva partida" }).click();
  const confirm = page.getByRole("alertdialog", { name: "¿Empezar una partida nueva?" });
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: "Cancelar" }).click();
  await expect(menu).toBeVisible();
  await menu.getByRole("button", { name: "Nueva partida" }).click();
  await confirm.getByRole("button", { name: "Confirmar" }).click();
  await expect(shop.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(shop.getByRole("button", { name: "Disco Glowshine", exact: true })).toHaveAttribute("aria-pressed", "true");

  await page.keyboard.press("Escape");
  await pause.getByRole("button", { name: "Cargar partida" }).click();
  await pause.getByRole("button", { name: /Partida 1/ }).click();
  await expect(shop.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(shop.getByRole("button", { name: "Disco Gloom", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await page.getByRole("button", { name: /comenzar/ }).click();
  await menu.getByRole("button", { name: "Continuar" }).click();
  await expect(shop.getByRole("button", { name: "Disco Gloom", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

test("pause opens the map and keeps the club scene mounted until a destination is chosen", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /Presioná Enter/ }).click();
  await page.getByRole("button", { name: "Nueva partida" }).click();
  const shop = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(shop.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await shop.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: "Seleccionar Club de Rock 1999" }).click();
  await map.getByRole("button", { name: "Entrar a Club de Rock 1999" }).click();
  const club = page.getByRole("region", { name: "Club de Rock 1999" });
  await expect(club.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  const canvas = await club.locator("canvas").evaluate((element) => { window.__clubCanvas = element; return true; });
  expect(canvas).toBe(true);
  await page.keyboard.press("Escape");
  const pause = page.getByRole("dialog", { name: "Menú de pausa" });
  await pause.getByRole("button", { name: "Ir al mapa" }).click();
  await expect(map).toBeVisible();
  expect(await page.evaluate(() => window.__clubCanvas === document.querySelector(".record-store-3d canvas"))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(map).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(pause).toBeVisible();
  await pause.getByRole("button", { name: "Menú principal" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(club.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
});


test("Escape closes a conversation before opening pause", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/ }).click();
  await page.getByRole("button", { name: "Nueva partida" }).click();
  const shop = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(shop.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.keyboard.down("a");
  await expect(shop.locator(".record-store-nearby")).toContainText("Tito", { timeout: 12_000 });
  await page.keyboard.up("a");
  await page.keyboard.press("e");
  await expect(shop.getByRole("dialog", { name: /Tito/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(shop.getByRole("dialog", { name: /Tito/ })).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: /pausa/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /pausa/ })).toBeVisible();
});
