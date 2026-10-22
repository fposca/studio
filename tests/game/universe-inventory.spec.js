import { test, expect } from "@playwright/test";

async function hold(page, key, milliseconds) {
  await page.keyboard.down(key);
  await page.waitForTimeout(milliseconds);
  await page.keyboard.up(key);
}

async function enter(map, scenario, label) {
  await map.getByRole("button", { name: "Seleccionar " + scenario }).click();
  await map.getByRole("button", { name: label }).click();
}

test("I opens the same mission inventory in store, studio and club without a load notification", async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    localStorage.setItem("neonboy.universe.master-tape.v1", JSON.stringify({ version: 1,
      progress: { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 } }));
    localStorage.setItem("neonboy.universe.club-show.v1", JSON.stringify({ version: 1,
      progress: { hugoSuggestedShow: true, credentialGranted: true } }));
  });
  await page.goto("/discografia/?direct=1");
  const store = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(store.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(store.locator(".universe-inventory-notice")).toHaveCount(0);
  await page.keyboard.press("i");
  const inventory = page.getByRole("dialog", { name: "Inventario — NeonBoy" });
  await expect(inventory).toBeVisible();
  await expect(inventory.getByRole("button", { name: /Cinta de grabación de 1999/ })).toBeVisible();
  await inventory.getByRole("button", { name: /Credencial del Club de Rock/ }).click();
  await expect(inventory).toContainText("Charly conoce a Tito");
  await inventory.getByRole("button", { name: /ACCESOS/ }).click();
  await expect(inventory.getByRole("button", { name: /Credencial del Club de Rock/ })).toBeVisible();
  await expect(inventory.getByRole("button", { name: /Cinta de grabación de 1999/ })).toHaveCount(0);
  await page.keyboard.press("m");
  await expect(page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(inventory).toHaveCount(0);

  await store.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await enter(map, "Neon Recording Studio", "Entrar a Neon Recording Studio");
  const studio = page.getByRole("region", { name: "Neon Recording Studio 1999" });
  await expect(studio.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await page.keyboard.press("i");
  await expect(inventory.getByRole("button", { name: /Credencial del Club de Rock/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await studio.getByRole("button", { name: "MAPA" }).click();
  await enter(map, "Club de Rock 1999", "Entrar a Club de Rock 1999");
  const club = page.getByRole("region", { name: "Club de Rock 1999" });
  await expect(club.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await page.keyboard.press("i");
  await expect(inventory.getByRole("button", { name: /Credencial del Club de Rock/ })).toBeVisible();
  await inventory.getByRole("button", { name: "Cerrar inventario" }).click();
  await expect(inventory).toHaveCount(0);
});

test("collected coins appear as the live rockola balance and decrease when a video plays", async ({ page }) => {
  test.setTimeout(120_000);
  await page.route("https://www.youtube.com/embed/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<title>Mock YouTube</title>" }));
  await page.goto("/discografia/?direct=1");
  const store = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(store.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await page.keyboard.press("i");
  const inventory = page.getByRole("dialog", { name: "Inventario — NeonBoy" });
  await expect(inventory.getByRole("button", { name: /Monedas \/ fichas de rockola/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await hold(page, "w", 550);
  await page.keyboard.down("d");
  await expect(store.locator(".record-store-nearby")).toContainText("Tomar monedas", { timeout: 10_000 });
  await page.keyboard.up("d");
  await page.keyboard.press("e");
  await expect(store.locator(".record-store-arcade-hud")).toContainText("10/10 monedas");
  await page.keyboard.press("i");
  await inventory.getByRole("button", { name: /Monedas \/ fichas de rockola/ }).click();
  await expect(inventory).toContainText("10 / 10 disponibles");
  await inventory.getByRole("button", { name: "Abrir rockola" }).click();
  await expect(inventory).toHaveCount(0);
  const jukebox = page.getByRole("dialog", { name: "Rockola de Neonboy" });
  await jukebox.getByRole("button", { name: "Elegir video New Born" }).click();
  await expect(jukebox.locator(".record-jukebox-wallet")).toContainText("9 / 10");
  await page.keyboard.press("Escape");
  await page.keyboard.press("i");
  await expect(inventory).toContainText("9 / 10 disponibles");
});

test("the credential can be presented from inventory near Charly only once", async ({ page }) => {
  test.setTimeout(150_000);
  await page.addInitScript(() => {
    localStorage.setItem("neonboy.universe.master-tape.v1", JSON.stringify({ version: 1,
      progress: { phase: "complete", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 } }));
    localStorage.setItem("neonboy.universe.club-show.v1", JSON.stringify({ version: 1,
      progress: { hugoSuggestedShow: true, credentialGranted: true } }));
  });
  await page.goto("/discografia/?direct=1");
  await page.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await enter(map, "Club de Rock 1999", "Entrar a Club de Rock 1999");
  const club = page.getByRole("region", { name: "Club de Rock 1999" });
  await expect(club.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await hold(page, "w", 4400);
  await hold(page, "d", 1300);
  await expect(club.getByText("[E] HABLAR CON CHARLY", { exact: false })).toBeVisible();
  await page.keyboard.press("i");
  const inventory = page.getByRole("dialog", { name: "Inventario — NeonBoy" });
  await inventory.getByRole("button", { name: /Credencial del Club de Rock/ }).click();
  await inventory.getByRole("button", { name: "Presentar a Charly" }).click();
  await expect(inventory).toHaveCount(0);
  const dialogue = club.getByRole("dialog", { name: /Charly/ });
  await expect(dialogue).toContainText("alguien con papeles");
  await page.keyboard.press("Escape");
  await page.keyboard.press("i");
  await inventory.getByRole("button", { name: /Credencial del Club de Rock/ }).click();
  await expect(inventory).toContainText("PRESENTADA");
  await expect(inventory.getByRole("button", { name: "Presentar a Charly" })).toHaveCount(0);
});


test("Escape closes inventory before pause, and I does not open it over pause", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/ }).click();
  await page.getByRole("button", { name: "Nueva partida" }).click();
  const store = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(store.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await page.keyboard.press("i");
  const inventory = page.getByRole("dialog", { name: "Inventario — NeonBoy" });
  const pause = page.getByRole("dialog", { name: /Menú de pausa/ });
  await expect(inventory).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(inventory).toHaveCount(0);
  await expect(pause).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(pause).toBeVisible();
  await page.keyboard.press("i");
  await expect(inventory).toHaveCount(0);
  await expect(pause).toBeVisible();
});

test("the tape is delivered to Hugo through inventory and becomes unavailable", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto("/discografia/?direct=1");
  const store = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(store.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await page.keyboard.down("a");
  await expect(store.locator(".record-store-nearby")).toContainText("Tito", { timeout: 12_000 });
  await page.keyboard.up("a");
  await page.keyboard.press("e");
  const tito = store.getByRole("dialog", { name: /Tito/ });
  await tito.getByRole("button", { name: /Ten.s algo nuevo/ }).click();
  await tito.getByRole("button", { name: /probaste limpiarlo/ }).click();
  await page.keyboard.press("Escape");
  await expect(store.locator(".universe-inventory-notice")).toContainText("Cinta de grabación de 1999");
  await store.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await enter(map, "Neon Recording Studio", "Entrar a Neon Recording Studio");
  const studio = page.getByRole("region", { name: "Neon Recording Studio 1999" });
  await expect(studio.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await hold(page, "w", 2100);
  await hold(page, "a", 550);
  await expect(studio.locator("canvas")).toHaveAttribute("data-hugo-prompt", "true");
  await page.keyboard.press("i");
  const inventory = page.getByRole("dialog", { name: "Inventario — NeonBoy" });
  await inventory.getByRole("button", { name: /Cinta de grabación de 1999/ }).click();
  await inventory.getByRole("button", { name: "Entregar a Hugo" }).click();
  const hugo = studio.getByRole("dialog", { name: /Hugo Mendez/ });
  await expect(hugo).toContainText("grabación");
  await hugo.getByRole("button", { name: /Se puede arreglar/ }).click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("i");
  await inventory.getByRole("button", { name: /Cinta de grabación de 1999/ }).click();
  await expect(inventory).toContainText("ENTREGADO");
  await expect(inventory.getByRole("button", { name: "Entregar a Hugo" })).toHaveCount(0);
});


test("the restored master is delivered from inventory once and remains in history", async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    localStorage.setItem("neonboy.universe.master-tape.v1", JSON.stringify({ version: 1,
      progress: { phase: "master", reviewed: ["guitar", "bass", "drums"], studioTokens: 1 } }));
  });
  await page.goto("/discografia/?direct=1");
  const store = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(store.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await page.keyboard.down("a");
  await expect(store.locator(".record-store-nearby")).toContainText("Tito", { timeout: 12_000 });
  await page.keyboard.up("a");
  await page.keyboard.press("i");
  const inventory = page.getByRole("dialog", { name: "Inventario — NeonBoy" });
  await inventory.getByRole("button", { name: /Máster restaurado/ }).click();
  await inventory.getByRole("button", { name: "Entregar a Tito" }).click();
  const tito = store.getByRole("dialog", { name: /Tito/ });
  await expect(tito).toContainText("demasiados solos");
  await tito.getByRole("button", { name: /Nunca son demasiados/ }).click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("i");
  await inventory.getByRole("button", { name: /Máster restaurado/ }).click();
  await expect(inventory).toContainText("ENTREGADO");
  await expect(inventory.getByRole("button", { name: "Entregar a Tito" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(store.getByRole("button", { name: "NEON SESSIONS" })).toBeVisible();
});


test("inventory remains usable on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await page.addInitScript(() => {
    localStorage.setItem("neonboy.universe.master-tape.v1", JSON.stringify({ version: 1,
      progress: { phase: "tape", reviewed: [], studioTokens: 0 } }));
  });
  await page.goto("/discografia/?direct=1");
  await expect(page.getByRole("region", { name: "Tienda de discos Neonboy" }).locator(".record-store-3d"))
    .toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await page.keyboard.press("i");
  const inventory = page.getByRole("dialog", { name: "Inventario — NeonBoy" });
  await expect(inventory).toBeVisible();
  const bounds = await inventory.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  await inventory.getByRole("button", { name: /Cinta de grabación de 1999/ }).click();
  await expect(inventory).toContainText("Una antigua grabación");
  await inventory.getByRole("button", { name: "Cerrar inventario" }).click();
  await expect(inventory).toHaveCount(0);
});
