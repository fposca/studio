import { test, expect } from "@playwright/test";

async function hold(page, key, milliseconds) {
  await page.keyboard.down(key);
  await page.waitForTimeout(milliseconds);
  await page.keyboard.up(key);
}

test("the friends table opens a group dialogue, individual friends remain selectable, and movement resumes", async ({ page }) => {
  test.setTimeout(240_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/discografia/?direct=1");
  await page.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: "Seleccionar Club de Rock 1999" }).click();
  await map.getByRole("button", { name: "Entrar a Club de Rock 1999" }).click();
  const club = page.getByRole("region", { name: "Club de Rock 1999" });
  const canvas = club.locator("canvas");
  await expect(club.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 100_000 });
  await expect(canvas).toHaveAttribute("data-club-actors", /diego,maxi,gera,pablito,claudia/, { timeout: 180_000 });

  await hold(page, "a", 1850);
  await hold(page, "w", 850);
  const groupCue = club.getByText("[E] HABLAR CON LOS AMIGOS");
  for (let step = 0; step < 6 && !(await groupCue.isVisible()); step += 1) await hold(page, "w", 180);
  await expect(groupCue).toBeVisible();
  await page.keyboard.press("e");
  const group = club.getByRole("dialog", { name: "Conversaci\u00f3n con Los amigos" });
  await expect(group).toContainText("Esperando el recital");
  await group.getByRole("button", { name: /9th Revelation/ }).click();
  await expect(group).toContainText("perra baterista");
  await group.getByRole("button", { name: "Seguir hablando" }).click();
  await group.getByRole("button", { name: /mejores gustos musicales/ }).click();
  await expect(group).toContainText("Yo pongo cumbia");
  await page.keyboard.press("Escape");
  await expect(group).toHaveCount(0);

  await hold(page, "s", 380);
  const maxiCue = club.getByText("[E] HABLAR CON MAXI");
  for (let step = 0; step < 8 && !(await maxiCue.isVisible()); step += 1) await hold(page, "s", 180);
  await expect(maxiCue).toBeVisible();
  await page.keyboard.press("e");
  const maxi = club.getByRole("dialog", { name: "Conversaci\u00f3n con Maxi" });
  await expect(maxi).toContainText("Tremendo escenario");
  await maxi.getByRole("button", { name: /doble bombo/ }).click();
  await expect(maxi).toContainText("Bien metalero");
  await page.keyboard.press("Escape");
  await expect(maxi).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("neonboy.universe.club-friends.v1")).progress.met)).toEqual(["maxi"]);
  await hold(page, "s", 700);
  await expect(club.getByText("[E] HABLAR CON MAXI")).toHaveCount(0);
  await club.getByRole("button", { name: "Ajustar modelos" }).click();
  const editor = club.getByRole("complementary", { name: "Ajustar modelos del club" });
  await editor.getByLabel("Objeto").selectOption("diego");
  const reach = editor.getByLabel(/Distancia de interacci/);
  await expect(reach).toHaveValue("2");
  await reach.fill("2.3");
  await editor.getByRole("button", { name: /Guardar aqu/ }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("neonboy-rock-club-actor-transforms-v1")).diego.reach)).toBe(2.3);
  await editor.getByRole("button", { name: "Restablecer objeto" }).click();
  await expect(reach).toHaveValue("2");
  expect(errors).toEqual([]);
});




test("the five friends finish loading while NeonBoy keeps moving", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto("/discografia/?direct=1");
  await page.getByRole("button", { name: "MAPA" }).click();
  const map = page.getByRole("dialog", { name: "Mapa de NeonBoy Universe" });
  await map.getByRole("button", { name: "Seleccionar Club de Rock 1999" }).click();
  await map.getByRole("button", { name: "Entrar a Club de Rock 1999" }).click();
  const club = page.getByRole("region", { name: "Club de Rock 1999" });
  const canvas = club.locator("canvas");
  await expect(club.locator(".record-store-3d")).toHaveAttribute("data-ready", "true", { timeout: 100_000 });
  await page.keyboard.down("w");
  try {
    await expect(canvas).toHaveAttribute("data-club-actors", /diego,maxi,gera,pablito,claudia/, { timeout: 45_000 });
  } finally {
    await page.keyboard.up("w");
  }
});
