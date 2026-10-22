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

test("Club de Rock 1999 is explorable and returns to the other scenes without losing progress", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/discografia/?direct=1");
  const shop = page.getByRole("region", { name: "Tienda de discos Neonboy" });
  await expect(shop.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await shop.getByRole("button", { name: "Disco Gloom", exact: true }).click();
  await shop.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await enter(map, "Club de Rock 1999", "Entrar a Club de Rock 1999");

  const club = page.getByRole("region", { name: "Club de Rock 1999" });
  await expect(club).toBeVisible();
  await expect(club.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(club.locator(".record-store-3d")).toHaveAttribute("data-view", "tercera");
  await expect(club.locator("canvas")).toHaveAttribute("data-club-models", /drums,drum-bench,amp-left,amp-right,microphone,bass,guitar/);
  await expect(page.locator(".record-store-3d canvas")).toHaveCount(1);

  await hold(page, "w", 3000);
  await hold(page, "d", 1900);
  await expect(club.getByText("[E] Examinar Barra")).toBeVisible();
  await page.keyboard.press("e");
  await expect(club.getByText("Todavía no hay nadie atendiendo.")).toBeVisible();
  await page.keyboard.press("Escape");

  await hold(page, "a", 1900);
  await hold(page, "w", 1800);
  await expect(club.getByText("[E] Examinar Escenario")).toBeVisible();
  await page.keyboard.press("e");
  await expect(club.getByText("Acá empieza el próximo recital de NeonBoy.")).toBeVisible();
  await page.keyboard.press("Escape");
  await hold(page, "w", 1750);
  await expect(club.getByText("[E] Examinar Micrófono")).toBeVisible();
  await page.keyboard.press("e");
  await expect(club.getByText("NEONBOY EXAMINA / Micrófono")).toBeVisible();
  await page.keyboard.press("Escape");
  await hold(page, "d", 620);
  await hold(page, "w", 600);
  await expect(club.getByText("[E] Examinar Batería")).toBeVisible();
  await page.keyboard.press("e");
  await expect(club.getByText("Lista para hacer temblar el club.")).toBeVisible();
  await page.keyboard.press("Escape");
  // Go behind John Zool and his guitar stand before approaching the amp.
  await hold(page, "s", 600);
  await hold(page, "a", 2000);
  await hold(page, "w", 950);
  await hold(page, "a", 850);
  await expect(club.getByText("[E] Examinar Amplificador")).toBeVisible();
  await page.keyboard.press("e");
  await expect(club.getByText("El amplificador principal necesita una revisión antes del show.")).toBeVisible();
  await page.keyboard.press("Escape");

  const canvasBeforeMap = await club.locator("canvas").evaluate((canvas) => { window.__clubCanvasBeforeMap = canvas; return true; });
  expect(canvasBeforeMap).toBe(true);
  await page.keyboard.press("m");
  await expect(map).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(map).toHaveCount(0);
  expect(await page.evaluate(() => window.__clubCanvasBeforeMap === document.querySelector(".record-store-3d canvas"))).toBe(true);
  await page.keyboard.press("m");
  await enter(map, "Tienda de Discos", "Entrar a la Tienda de Discos");
  await expect(shop.getByRole("button", { name: "Disco Gloom", exact: true })).toHaveAttribute("aria-pressed", "true");
  await shop.getByRole("button", { name: "MAPA" }).click();
  await enter(map, "Neon Recording Studio", "Entrar a Neon Recording Studio");
  const studio = page.getByRole("region", { name: "Neon Recording Studio 1999" });
  await expect(studio.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await studio.getByRole("button", { name: "MAPA" }).click();
  await enter(map, "Club de Rock 1999", "Entrar a Club de Rock 1999");
  await expect(club.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(page.locator(".record-store-3d canvas")).toHaveCount(1);
  expect(errors).toEqual([]);
});


test("the backstage aisle remains reachable and its door is closed", async ({ page }) => {
  test.setTimeout(100_000);
  await page.goto("/discografia/?direct=1");
  await page.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await enter(map, "Club de Rock 1999", "Entrar a Club de Rock 1999");
  const club = page.getByRole("region", { name: "Club de Rock 1999" });
  await expect(club.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await hold(page, "d", 4500);
  const backstagePrompt = club.getByText("[E] Examinar Puerta backstage");
  for (let step = 0; step < 28 && !(await backstagePrompt.isVisible()); step += 1) {
    await hold(page, "w", 400);
  }
  await expect(backstagePrompt).toBeVisible();
  await page.keyboard.press("e");
  await expect(club.getByText("Todavía no tengo permiso para entrar.")).toBeVisible();
});


test("the club band loads and its model adjustments persist only in the club", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = [];
  const revenantRequests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("revenant-pose1.glb")) revenantRequests.push(request.url());
  });
  await page.goto("/discografia/?direct=1");
  await page.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await enter(map, "Club de Rock 1999", "Entrar a Club de Rock 1999");
  const club = page.getByRole("region", { name: "Club de Rock 1999" });
  const canvas = club.locator("canvas");
  await expect(canvas).toHaveAttribute("data-club-actors", /charly,club-rulo,club-roxy,riky,john-zool,lilith-9,revenant,lujan/, { timeout: 90_000 });
  await expect(canvas).toHaveAttribute("data-club-actors", /club-spectator-1,club-drunk/, { timeout: 90_000 });
  expect(revenantRequests.length).toBeGreaterThan(0);
  await club.getByRole("button", { name: "Ajustar modelos" }).click();
  const editor = club.getByRole("complementary", { name: "Ajustar modelos del club" });
  await editor.getByLabel("Objeto").selectOption("john-zool");
  const x = editor.getByRole("group", { name: "Posición" }).getByLabel("X");
  await x.fill("-3.25");
  await editor.getByLabel("Objeto").selectOption("guitar-stand");
  await editor.getByRole("group", { name: "Posición" }).getByLabel("X").fill("-5.15");
  await editor.getByRole("button", { name: "Guardar aquí" }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("neonboy-rock-club-actor-transforms-v1"))["john-zool"].position[0])).toBe(-3.25);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("neonboy-rock-club-actor-transforms-v1"))["guitar-stand"].position[0])).toBe(-5.15);
  await club.getByRole("button", { name: "MAPA" }).click();
  await enter(map, "Tienda de Discos", "Entrar a la Tienda de Discos");
  await page.getByRole("region", { name: "Tienda de discos Neonboy" }).getByRole("button", { name: "MAPA" }).click();
  await enter(map, "Club de Rock 1999", "Entrar a Club de Rock 1999");
  await club.getByRole("button", { name: "Ajustar modelos" }).click();
  await club.getByRole("complementary", { name: "Ajustar modelos del club" }).getByLabel("Objeto").selectOption("john-zool");
  await expect(club.getByRole("complementary", { name: "Ajustar modelos del club" }).getByRole("group", { name: "Posición" }).getByLabel("X")).toHaveValue("-3.25");
  await club.getByRole("complementary", { name: "Ajustar modelos del club" }).getByLabel("Objeto").selectOption("guitar-stand");
  await expect(club.getByRole("complementary", { name: "Ajustar modelos del club" }).getByRole("group", { name: "Posición" }).getByLabel("X")).toHaveValue("-5.15");
  expect(errors).toEqual([]);
});


test("the extra club audience loads without losing the scene", async ({ page }) => {
  test.setTimeout(150_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/discografia/?direct=1");
  await page.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await enter(map, "Club de Rock 1999", "Entrar a Club de Rock 1999");
  const club = page.getByRole("region", { name: "Club de Rock 1999" });
  const scene = club.locator(".record-store-3d");
  const canvas = scene.locator("canvas");
  await expect(scene).toHaveAttribute("data-ready", "true", { timeout: 90_000 });
  await expect(canvas).toHaveAttribute("data-club-actors", /club-audience-9/, { timeout: 120_000 });
  const actors = (await canvas.getAttribute("data-club-actors")).split(",");
  expect(actors).toEqual(expect.arrayContaining([
    "club-spectator-1", "club-drunk", "club-audience-1", "club-audience-2",
    "club-audience-3", "club-audience-5", "club-audience-6", "club-audience-7",
    "club-audience-8", "club-audience-9",
  ]));
  await expect(club.locator(".record-store-webgl-error")).toHaveCount(0);
  await hold(page, "w", 800);
  await expect(scene).toHaveAttribute("data-ready", "true");
  if (process.env.NEON_CAPTURE_CLUB) await page.screenshot({ path: "test-results/club-crowd.png" });
  expect(errors).toEqual([]);
});
