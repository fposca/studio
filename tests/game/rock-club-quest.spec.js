import { test, expect } from "@playwright/test";

async function hold(page, key, milliseconds) {
  await page.keyboard.down(key);
  await page.waitForTimeout(milliseconds);
  await page.keyboard.up(key);
}

async function enterClub(page) {
  await page.goto("/discografia/?direct=1");
  await page.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: "Seleccionar Club de Rock 1999" }).click();
  await map.getByRole("button", { name: "Entrar a Club de Rock 1999" }).click();
  const club = page.getByRole("region", { name: "Club de Rock 1999" });
  await expect(club.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await hold(page, "w", 4400);
  await hold(page, "d", 1300);
  await expect(club.getByText("[E] HABLAR CON CHARLY", { exact: false })).toBeVisible();
  return club;
}

test("Charly is reachable, requires Tito's credential and releases movement after Escape", async ({ page }) => {
  test.setTimeout(150_000);
  const club = await enterClub(page);
  await expect(club.locator("canvas")).toHaveAttribute("data-club-actors", /charly,club-rulo,club-roxy/);
  await page.keyboard.press("e");
  const dialogue = club.getByRole("dialog", { name: /Charly/ });
  await expect(dialogue).toBeVisible();
  await expect(dialogue).toContainText("Si venís a probar sonido");
  await dialogue.getByRole("button", { name: /Vengo de parte de Tito/ }).click();
  await expect(dialogue).toContainText("primero pedile la credencial");
  await page.keyboard.press("Escape");
  await expect(dialogue).toHaveCount(0);
  await hold(page, "s", 1100);
  await expect(club.getByText("[E] HABLAR CON CHARLY", { exact: false })).toHaveCount(0);
});

test("club authorization and its inventory survive a trip through the map", async ({ page }) => {
  test.setTimeout(150_000);
  await page.addInitScript(() => {
    localStorage.setItem("neonboy.universe.master-tape.v1", JSON.stringify({ version: 1,
      progress: { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 } }));
    localStorage.setItem("neonboy.universe.club-show.v1", JSON.stringify({ version: 1,
      progress: { hugoSuggestedShow: true, credentialGranted: true } }));
  });
  const club = await enterClub(page);
  await expect(club.getByLabel("Misión La credencial del show")).toContainText("CREDENCIAL DEL CLUB DE ROCK");
  await page.keyboard.press("e");
  const dialogue = club.getByRole("dialog", { name: /Charly/ });
  await dialogue.getByRole("button", { name: /Vengo de parte de Tito/ }).click();
  await expect(dialogue).toContainText("esta vez mandó a alguien con papeles");
  await page.keyboard.press("Escape");
  await expect(club.getByLabel("Misión La credencial del show")).toContainText("Revisá mesa, amplificador y micrófono");
  await club.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: "Seleccionar Tienda de Discos" }).click();
  await map.getByRole("button", { name: "Entrar a la Tienda de Discos" }).click();
  const store = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(store.getByLabel("Misión La credencial del show")).toContainText("CREDENCIAL DEL CLUB DE ROCK");
  await store.getByRole("button", { name: "MAPA" }).click();
  await map.getByRole("button", { name: "Seleccionar Club de Rock 1999" }).click();
  await map.getByRole("button", { name: "Entrar a Club de Rock 1999" }).click();
  await expect(club.getByLabel("Misión La credencial del show")).toContainText("Revisá mesa, amplificador y micrófono");
  await hold(page, "s", 2200);
  await hold(page, "a", 2400);
  await expect(club.getByText("[E] Examinar Mesa de sonido")).toBeVisible();
  await page.keyboard.press("e");
  await expect(club.getByLabel(/credencial del show/i)).toContainText("1/3 revisado");
  await expect(club.getByText(/Los canales de sonido necesitan una revisi.n/)).toBeVisible();
});


test("Hugo's show suggestion leads to Tito's credential and the club", async ({ page }) => {
  test.setTimeout(150_000);
  await page.addInitScript(() => {
    localStorage.setItem("neonboy.universe.master-tape.v1", JSON.stringify({ version: 1,
      progress: { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 } }));
  });
  await page.goto("/discografia/?direct=1");
  const store = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await store.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: "Seleccionar Neon Recording Studio" }).click();
  await map.getByRole("button", { name: "Entrar a Neon Recording Studio" }).click();
  const studio = page.getByRole("region", { name: "Neon Recording Studio 1999" });
  await expect(studio.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await hold(page, "w", 2100);
  await hold(page, "a", 550);
  await expect(studio.locator("canvas")).toHaveAttribute("data-hugo-prompt", "true");
  await page.keyboard.press("e");
  const hugo = studio.getByRole("dialog", { name: /Hugo Mendez/ });
  await hugo.getByRole("button", { name: /ahora qu.*hacemos con el m.ster/ }).click();
  await expect(hugo).toContainText("hablar con Tito");
  await page.keyboard.press("Escape");

  await studio.getByRole("button", { name: "MAPA" }).click();
  await map.getByRole("button", { name: "Seleccionar Tienda de Discos" }).click();
  await map.getByRole("button", { name: "Entrar a la Tienda de Discos" }).click();
  await expect(store.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await page.keyboard.down("a");
  await expect(store.locator(".record-store-nearby")).toContainText("Tito", { timeout: 12_000 });
  await page.keyboard.up("a");
  await page.keyboard.press("e");
  const tito = store.getByRole("dialog", { name: /Tito/ });
  await tito.getByRole("button", { name: /Hugo dice que tengo que salir a tocar/ }).click();
  await expect(tito).toContainText("Con esta credencial");
  await page.keyboard.press("Escape");
  await expect(store.getByLabel(/credencial del show/i)).toContainText("CREDENCIAL DEL CLUB DE ROCK");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.club-show.v1"))?.progress?.credentialGranted)).toBe(true);

  await store.getByRole("button", { name: "MAPA" }).click();
  await map.getByRole("button", { name: "Seleccionar Club de Rock 1999" }).click();
  await expect(map.locator(".universe-map-detail")).toContainText("DISPONIBLE");
  await map.getByRole("button", { name: "Entrar a Club de Rock 1999" }).click();
  const club = page.getByRole("region", { name: "Club de Rock 1999" });
  await expect(club.getByLabel(/credencial del show/i)).toContainText("CREDENCIAL DEL CLUB DE ROCK");
});
