import { test, expect } from "@playwright/test";

async function hold(page, key, milliseconds) {
  await page.keyboard.down(key);
  await page.waitForTimeout(milliseconds);
  await page.keyboard.up(key);
}

test("Hugo stands by the console and the educational mission persists", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/discografia/?direct=1");
  await expect(page.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 60000 });
  await page.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: "Seleccionar Neon Recording Studio" }).click();
  await map.getByRole("button", { name: "Entrar a Neon Recording Studio" }).click();
  const studio = page.getByRole("region", { name: "Neon Recording Studio 1999" });
  await expect(studio.locator("canvas")).toHaveAttribute("data-hugo-ready", "true", { timeout: 60000 });
  await expect(studio.locator("canvas")).toHaveAttribute("data-studio-models", /drum-bench/);
  await hold(page, "w", 2100);
  await hold(page, "a", 550);
  await expect(studio.locator("canvas")).toHaveAttribute("data-hugo-prompt", "true");
  await page.keyboard.press("e");
  const talk = studio.getByRole("dialog", { name: "Conversación con Hugo Mendez" });
  await expect(talk).toContainText("Justo estaba escuchando las pistas");
  await talk.getByRole("button", { name: /discos propios/ }).click();
  await expect(talk).toContainText("Fijate en los cuadros");
  await talk.getByRole("button", { name: "Seguir preguntando" }).click();
  await talk.getByRole("button", { name: /El ternero, la vaca y el cosmos/ }).click();
  await expect(talk).toContainText("trece temas");
  await talk.getByRole("button", { name: "Seguir preguntando" }).click();
  await talk.getByRole("button", { name: /escuchar m.s de tu m.sica/ }).click();
  await expect(talk).toContainText("mis grabaciones");
  await talk.getByRole("button", { name: "Seguir preguntando" }).click();
  await talk.getByRole("button", { name: /Wake Up/ }).click();
  await expect(talk).toContainText("incluido un solo");
  await talk.getByRole("button", { name: "Seguir preguntando" }).click();
  await talk.getByRole("button", { name: /Jesus is King/ }).click();
  await expect(talk).toContainText("aportar guitarras");
  await talk.getByRole("button", { name: "Seguir preguntando" }).click();
  await talk.getByRole("button", { name: /New Born/ }).click();
  await expect(talk).toContainText("También participé con guitarras");
  await talk.getByRole("button", { name: "Seguir preguntando" }).click();
  await talk.getByRole("button", { name: /sesiones en la computadora/ }).click();
  await expect(talk).toContainText("No me vayas a borrar la sesión");
  await page.keyboard.press("Escape");
  await expect(talk).toHaveCount(0);

  await hold(page, "d", 2500);
  await hold(page, "w", 1750);
  await expect(studio.getByText("[E] Examinar Computadora")).toBeVisible();
  await page.keyboard.press("e");
  const computer = studio.getByRole("dialog", { name: "Archivo de sesiones" });
  await expect(computer).toBeVisible();
  await computer.getByRole("button", { name: /Wake Up/ }).click();
  await expect(computer).toContainText("Hugo grabó partes de guitarra, incluido un solo");
  await computer.getByRole("button", { name: /New Born/ }).click();
  await expect(computer.getByRole("link", { name: /Ver video de New Born/ })).toHaveAttribute("href", "https://www.youtube.com/watch?v=bPp4YoSrbmo");
  await page.keyboard.press("Escape");

  await hold(page, "s", 1750);
  await hold(page, "a", 2050);
  await hold(page, "w", 1000);
  await expect(studio.getByText("[E] Examinar Consola")).toBeVisible();
  await page.keyboard.press("e");
  const consoleDialog = studio.getByRole("dialog", { name: "Explorar la consola" });
  await consoleDialog.getByRole("button", { name: /Guitarra solista/ }).click();
  await expect(consoleDialog).toContainText("melodías y solos");
  await page.keyboard.press("Escape");

  await hold(page, "a", 550);
  await expect(studio.locator("canvas")).toHaveAttribute("data-hugo-prompt", "true");
  await page.keyboard.press("e");
  await expect(talk).toContainText("Ahora entiendo mejor todo lo que pasa después de grabar las guitarras");
  await talk.getByRole("button", { name: "Guardar el archivo especial" }).click();
  await expect(talk).toContainText("MISIÓN COMPLETADA");
  await page.keyboard.press("Escape");
  await studio.getByRole("button", { name: /Archivo/ }).click();
  await expect(studio.getByRole("dialog", { name: "Archivo del estudio" })).toContainText("Cómo se produce la música de NeonBoy");
  await expect(studio.getByRole("dialog", { name: "Archivo del estudio" })).toContainText("Dock Sud, Avellaneda");
  await page.keyboard.press("Escape");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.recording-studio.progress.v1")).progress);
  expect(saved).toMatchObject({ hugoMet: true, studioComputerUnlocked: true, computerExplored: true, consoleExplored: true, missionComplete: true,
    wakeUpInfo: true, jesusIsKingInfo: true, newBornInfo: true });
  await page.keyboard.press("m");
  await map.getByRole("button", { name: "Seleccionar Tienda de Discos" }).click();
  await map.getByRole("button", { name: "Entrar a la Tienda de Discos" }).click();
  await expect(page.getByRole("region", { name: "Tienda de discos Neonboy" })).toBeVisible();
  await page.getByRole("button", { name: "MAPA" }).click();
  await map.getByRole("button", { name: "Seleccionar Neon Recording Studio" }).click();
  await map.getByRole("button", { name: "Entrar a Neon Recording Studio" }).click();
  await expect(studio.locator("canvas")).toHaveAttribute("data-hugo-ready", "true", { timeout: 60000 });
  await expect(studio.getByText("Misión completada")).toBeVisible();
  expect(errors).toEqual([]);
});
