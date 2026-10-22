import { test, expect } from "@playwright/test";

async function hold(page, key, milliseconds) {
  await page.keyboard.down(key);
  await page.waitForTimeout(milliseconds);
  await page.keyboard.up(key);
}

test("Hugo's albums are available from the PC without mission progress", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/discografia/?direct=1");
  await expect(page.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 60000 });
  await page.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: "Seleccionar Neon Recording Studio" }).click();
  await map.getByRole("button", { name: "Entrar a Neon Recording Studio" }).click();
  const studio = page.getByRole("region", { name: "Neon Recording Studio 1999" });
  await expect(studio.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 60000 });
  await hold(page, "w", 2100);
  await hold(page, "a", 550);
  await hold(page, "d", 2500);
  await hold(page, "w", 1750);
  await expect(studio.getByText("[E] Examinar Computadora")).toBeVisible();
  await page.keyboard.press("e");
  const pc = studio.getByRole("dialog", { name: "Archivo de sesiones" });
  await expect(pc.getByText("Hugo está trabajando en las sesiones de NeonBoy")).toBeVisible();
  await pc.getByRole("button", { name: /HUGO MENDEZ.*DISCOGRAFÍA/ }).click();
  await expect(pc.getByRole("heading", { name: "Hugo Mendez · Discografía" })).toBeVisible();
  await expect(pc.getByRole("img", { name: "Portada de El ternero, la vaca y el cosmos" })).toBeVisible();
  await expect(pc.getByRole("navigation", { name: "Canciones de El ternero, la vaca y el cosmos" }).getByRole("button")).toHaveCount(11);
  await pc.getByRole("button", { name: /Purple Moon/ }).click();
  await expect(pc.locator("iframe")).toHaveAttribute("src", /lsPBYmDfpoo/);
  await expect(pc.getByRole("slider", { name: "Volumen de la canción" })).toBeVisible();
  await expect(pc.getByRole("slider", { name: "Progreso de la canción" })).toBeVisible();
  await pc.getByRole("button", { name: "Tema siguiente" }).click();
  await expect(pc.locator("iframe")).toHaveAttribute("src", /VOt7wCFFR0g/);
  await pc.getByRole("button", { name: "BS AS Overdrive" }).click();
  await expect(pc.getByText("La portada está disponible; todavía no se recibieron enlaces")).toBeVisible();
  await expect(pc.locator("iframe")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(pc).toHaveCount(0);
  await hold(page, "d", 1650);
  await expect(studio.getByText("[E] Examinar Disco")).toBeVisible();
  await page.keyboard.press("e");
  const wallAlbum = studio.getByRole("dialog", { name: "Discografía de Hugo Mendez" });
  await expect(wallAlbum).toBeVisible();
  await expect(wallAlbum.getByRole("img", { name: /Portada de/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(wallAlbum).toHaveCount(0);
  expect(errors).toEqual([]);
});
