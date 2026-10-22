import { test, expect } from "@playwright/test";

async function enterStudio(page) {
  await page.goto("/discografia/?direct=1");
  await expect(page.locator('.record-store-3d')).toHaveAttribute("data-ready", "true", { timeout: 60000 });
  await page.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: "Seleccionar Neon Recording Studio" }).click();
  await map.getByRole("button", { name: "Entrar a Neon Recording Studio" }).click();
  const studio = page.getByRole("region", { name: "Neon Recording Studio 1999" });
  await expect(studio.locator('.record-store-3d')).toHaveAttribute("data-ready", "true", { timeout: 60000 });
  return studio;
}

test("Meshy models load once and transform edits persist locally", async ({ page }) => {
  const studio = await enterStudio(page);
  await expect(studio.locator("canvas")).toHaveAttribute("data-studio-models", "console,crt,monitor-left,monitor-right,chair,hugo,amplifier,microphone,drumkit,drum-bench,guitar,guitar-2,guitar-3");
  await studio.getByRole("button", { name: "Ajustar modelos" }).click();
  const panel = studio.getByRole("complementary", { name: "Ajustar modelos del estudio" });
  await panel.getByLabel("Objeto").selectOption("monitor-right");
  await panel.locator("fieldset").first().getByRole("spinbutton", { name: "X" }).fill("0.25");
  await panel.getByRole("button", { name: "Guardar aquí" }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("neonboy-recording-studio-transforms-v1"))["monitor-right"].position[0])).toBe(0.25);
  await panel.getByLabel("Objeto").selectOption("drumkit");
  await panel.locator("fieldset").first().getByRole("spinbutton", { name: "X" }).fill("0.4");
  await panel.getByRole("button", { name: "Restablecer objeto" }).click();
  await expect(panel.locator("fieldset").first().getByRole("spinbutton", { name: "X" })).toHaveValue("0");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("neonboy-recording-studio-transforms-v1"))["monitor-right"].position[0])).toBe(0.25);
  await enterStudio(page);
  await page.getByRole("button", { name: "Ajustar modelos" }).click();
  await page.getByLabel("Objeto").selectOption("monitor-right");
  await expect(page.locator(".studio-dev-content fieldset").first().getByRole("spinbutton", { name: "X" })).toHaveValue("0.25");
});

test("missing Meshy file keeps its provisional object", async ({ page }) => {
  await page.route("**/studio_vocal_mic*.glb", (route) => route.abort());
  const studio = await enterStudio(page);
  await expect(studio.locator("canvas")).not.toHaveAttribute("data-studio-models", /microphone/);
  await expect(studio.locator("canvas")).toHaveAttribute("data-studio-models", /console/);
});


test("missing Hugo model does not leave an invisible conversation target", async ({ page }) => {
  await page.route("**/hugo-parado*.glb", (route) => route.abort());
  const studio = await enterStudio(page);
  await expect(studio.locator("canvas")).toHaveAttribute("data-hugo-ready", "false");
  await page.keyboard.down("w");
  await page.waitForTimeout(2100);
  await page.keyboard.up("w");
  await page.keyboard.down("a");
  await page.waitForTimeout(550);
  await page.keyboard.up("a");
  await expect(studio.getByRole("button", { name: "Hablar con Hugo Mendez (E)" })).toHaveCount(0);
});
