import { test, expect } from "@playwright/test";

async function hold(page, key, milliseconds) {
  await page.keyboard.down(key);
  await page.waitForTimeout(milliseconds);
  await page.keyboard.up(key);
}

async function enterFromMap(page, scenario, buttonName) {
  await page.keyboard.press("m");
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: "Seleccionar " + scenario }).click();
  await map.getByRole("button", { name: buttonName }).click();
}

test("the lost master mission links Tito, Hugo, the console, and Neon Sessions", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/discografia/?direct=1");
  const shop = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(shop.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(shop.getByRole("button", { name: "NEON SESSIONS" })).toHaveCount(0);

  await page.keyboard.down("a");
  await expect(shop.locator(".record-store-nearby")).toContainText("Tito", { timeout: 12_000 });
  await page.keyboard.up("a");
  await page.keyboard.press("e");
  const tito = shop.getByRole("dialog", { name: /Tito/ });
  await tito.getByRole("button", { name: /Ten.s algo nuevo/ }).click();
  await expect(tito).toContainText("licuadora");
  await tito.getByRole("button", { name: /probaste limpiarlo/ }).click();
  await expect(tito).toContainText("problema es la mezcla");
  await page.keyboard.press("Escape");
  await expect(shop.getByLabel("Misión El máster perdido")).toContainText("Cinta de grabación de 1999");
  await expect(shop.locator(".record-store-arcade-hud")).toContainText("0/10 monedas");

  await enterFromMap(page, "Neon Recording Studio", "Entrar a Neon Recording Studio");
  const studio = page.getByRole("region", { name: "Neon Recording Studio 1999" });
  await expect(studio.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(studio.getByLabel("Misión El máster perdido")).toContainText("Hugo");
  await hold(page, "w", 2100);
  await hold(page, "a", 550);
  await expect(studio.locator("canvas")).toHaveAttribute("data-hugo-prompt", "true");
  await page.keyboard.press("e");
  const hugo = studio.getByRole("dialog", { name: "Conversación con Hugo Mendez" });
  await hugo.getByRole("button", { name: /Tito dice que mi disco/ }).click();
  await expect(hugo).toContainText("traé la grabación");
  await hugo.getByRole("button", { name: /Se puede arreglar/ }).click();
  await expect(hugo).toContainText("revisemos las pistas");
  await page.keyboard.press("Escape");

  await hold(page, "d", 550);
  await expect(studio.getByText("[E] Examinar Consola")).toBeVisible();
  await page.keyboard.press("e");
  const consoleDialog = studio.getByRole("dialog", { name: "Explorar la consola" });
  await consoleDialog.getByRole("button", { name: /Guitarra rítmica/ }).click();
  await consoleDialog.getByRole("button", { name: /Guitarra solista/ }).click();
  await expect(consoleDialog).toContainText("(1/3)");
  await consoleDialog.getByRole("button", { name: /Bajo/ }).click();
  await consoleDialog.getByRole("button", { name: /Batería/ }).click();
  await expect(consoleDialog).toContainText("(3/3)");
  await page.keyboard.press("Escape");
  await expect(studio.getByLabel("Misión El máster perdido")).toContainText("Volvé con Hugo");

  await hold(page, "a", 550);
  await expect(studio.locator("canvas")).toHaveAttribute("data-hugo-prompt", "true");
  await page.keyboard.press("e");
  await hugo.getByRole("button", { name: /cómo quedó/ }).click();
  await expect(hugo).toContainText("instrumentos tienen su lugar");
  await hugo.getByRole("button", { name: /qué hacemos con la grabación/ }).click();
  await expect(hugo).toContainText("ficha");
  await page.keyboard.press("Escape");
  await expect(studio.getByLabel("Misión El máster perdido")).toContainText("Máster restaurado de 1999");
  await expect(studio.getByLabel("Misión El máster perdido")).toContainText("FICHAS DE ESTUDIO · 1");

  await enterFromMap(page, "Tienda de Discos", "Entrar a la Tienda de Discos");
  await expect(shop).toBeVisible();
  await expect(shop.locator(".record-store-nearby")).toContainText("Tito");
  await page.keyboard.press("e");
  await tito.getByRole("button", { name: /Acá tenés el máster restaurado/ }).click();
  await expect(tito).toContainText("demasiados solos");
  await tito.getByRole("button", { name: /Nunca son demasiados/ }).click();
  await expect(tito).toContainText("NEON SESSIONS");
  await page.keyboard.press("Escape");
  await shop.getByRole("button", { name: "NEON SESSIONS" }).click();
  const sessions = shop.getByRole("dialog", { name: "Neon Sessions — Archivo de grabaciones" });
  await expect(sessions).toContainText("Archivo pendiente");
  await expect(sessions).toContainText("Fichas de estudio: 1");
  await page.keyboard.press("Escape");
  await expect(shop.getByRole("button", { name: "Reproducir Anubis Servant" })).toBeVisible();
  await expect(shop.locator(".record-store-arcade-hud")).toContainText("0/10 monedas");
  await page.reload();
  await expect(page.getByRole("button", { name: "NEON SESSIONS" })).toBeVisible();
  await expect(page.getByLabel("Misión El máster perdido")).toContainText("FICHAS DE ESTUDIO · 1");
  expect(errors).toEqual([]);
});
