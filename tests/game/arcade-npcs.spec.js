import { test, expect } from "@playwright/test";

test("Pixel's GLB loads behind the counter and his dialogue opens with E", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const data = { scene: "arcade", credits: 0,
      masterTape: { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 },
      clubQuest: { credentialGranted: true, anomalySeen: true },
      positions: { arcade: { x: -7, z: 5.4, yaw: 0, viewYaw: Math.PI } } };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const arcade = page.getByRole("region", { name: "Arcade 1999" });
  await expect(arcade.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(arcade.getByText("[E] HABLAR CON PIXEL")).toBeVisible();
  await expect(arcade.locator(".record-store-3d canvas")).toHaveAttribute("data-arcade-actors", /pixel,nico,vicky/, { timeout: 90_000 });
  await page.screenshot({ path: testInfo.outputPath("pixel-arcade.png") });
  await page.keyboard.press("e");
  const talk = arcade.getByRole("dialog", { name: "Conversación con Pixel" });
  await expect(talk).toContainText("Bienvenido al Arcade 1999");
  await talk.getByRole("button", { name: /Seguir charlando/ }).click();
  await expect(talk.getByRole("button", { name: /ORBIT DUEL/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(talk).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const [name, x, z, line] of [
  ["Nico", -4.4, 2.2, "\u00bfVen\u00eds a jugar o a mirar?"],
  ["Vicky", 5.8, -12.9, "\u00bfViste la m\u00e1quina que est\u00e1 al fondo?"],
]) {
  test(`${name} can be approached and spoken to`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.addInitScript(({ x, z }) => {
      const data = { scene: "arcade", credits: 0,
        masterTape: { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 },
        clubQuest: { credentialGranted: true, anomalySeen: true },
        positions: { arcade: { x, z, yaw: Math.PI, viewYaw: 0 } } };
      localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
        slots: { autosave: { savedAt: Date.now(), data } } }));
    }, { x, z });
    await page.goto("/discografia/");
    await page.getByRole("button", { name: /comenzar/i }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    const arcade = page.getByRole("region", { name: "Arcade 1999" });
    await expect(arcade.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
    await expect(arcade.getByText(`[E] HABLAR CON ${name.toUpperCase()}`)).toBeVisible();
    if (name === "Nico") {
      await expect(arcade.locator(".record-store-3d canvas")).toHaveAttribute("data-arcade-actors", /pixel,nico,vicky/, { timeout: 90_000 });
      await page.screenshot({ path: testInfo.outputPath("nico-arcade-idle.png") });
    }
    await page.keyboard.press("e");
    const talk = arcade.getByRole("dialog", { name: `Conversaci\u00f3n con ${name}` });
    await expect(talk).toContainText(line);
    if (name === "Nico") {
      await page.keyboard.press("Escape");
      await expect(talk).toHaveCount(0);
    }
  });
}
