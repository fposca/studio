import { test, expect } from "@playwright/test";

async function hold(page, key, milliseconds) {
  await page.keyboard.down(key);
  await page.waitForTimeout(milliseconds);
  await page.keyboard.up(key);
}

test("Riky appears beside the bar, remembers a chat, and reveals the optional frequency clue", async ({ page }) => {
  test.setTimeout(150_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("neonboy.universe.master-tape.v1", JSON.stringify({
      version: 1, progress: { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 }
    }));
    localStorage.setItem("neonboy.universe.club-show.v1", JSON.stringify({
      version: 1, progress: { hugoSuggestedShow: true, credentialGranted: true }
    }));
  });
  await page.goto("/discografia/?direct=1");
  await page.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: "Seleccionar Club de Rock 1999" }).click();
  await map.getByRole("button", { name: "Entrar a Club de Rock 1999" }).click();
  const club = page.getByRole("region", { name: "Club de Rock 1999" });
  await expect(club.locator("canvas")).toHaveAttribute("data-club-actors", /riky/, { timeout: 100_000 });
  await hold(page, "w", 3500);
  await hold(page, "d", 1600);
  await expect(club.getByText("[E] HABLAR CON RIKY")).toBeVisible();
  await page.keyboard.press("e");
  const dialogue = club.getByRole("dialog", { name: "Conversación con Riky" });
  await expect(dialogue).toContainText("¿y si todo esto fuera una simulación?");
  await dialogue.getByRole("button", { name: /Matrix y realidad/ }).click();
  await expect(dialogue).toContainText("¿quién programó al programador?");
  await dialogue.getByRole("button", { name: /cómo saldríamos de una simulación/ }).click();
  await expect(dialogue).toContainText("discos del futuro");
  await dialogue.getByRole("button", { name: "Seguir hablando" }).click();
  await dialogue.getByRole("button", { name: /Tiempo y espacio/ }).click();
  await dialogue.getByRole("button", { name: "Seguir hablando" }).click();
  await dialogue.getByRole("button", { name: /La frecuencia perdida/ }).click();
  await expect(dialogue).toContainText("yo compararía lo que aparece en los discos");
  await expect(club.locator(".club-unlock-notice")).toContainText("NUEVA PISTA DESCUBIERTA");
  await page.keyboard.press("Escape");
  await expect(dialogue).toHaveCount(0);
  await expect(club.getByText(/PISTA · Comparar las señales/)).toBeVisible();
  await page.keyboard.press("e");
  await expect(dialogue).toContainText("¿Seguimos con las guitarras o hoy toca hablar del universo?");
  expect(errors).toEqual([]);
});
