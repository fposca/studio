import { test, expect } from "@playwright/test";

async function openOffice(page, avatar = "fernando") {
  await page.goto("/interbanking/");
  await expect(page.locator(".office-canvas")).toHaveCount(0);
  await page.getByRole("button", { name: /Explorar demo interactiva/ }).click();
  if (avatar === "victoria") await page.getByRole("button", { name: /Victoria Avatar femenino/ }).click();
  await page.getByRole("button", { name: /Comenzar recorrido/ }).click();
  await expect(page.locator(".office-scene")).toHaveAttribute("data-status", "ready", { timeout: 90_000 });
}

test("avatar cover fits inside the embedded office without its own scrollbar", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1745, height: 960 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }, { width: 360, height: 640 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/interbanking/");
    await page.getByRole("button", { name: /Explorar demo interactiva/ }).click();
    const cover = page.locator(".office-cover");
    await expect(cover).toBeVisible();
    await expect.poll(() => cover.evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(0);
    const buttonFitsCover = await cover.evaluate(element => {
      const button = element.querySelector(".office-cover-start")?.getBoundingClientRect();
      const frame = element.getBoundingClientRect();
      return Boolean(button && button.top >= frame.top - 1 && button.bottom <= frame.bottom + 1);
    });
    expect(buttonFitsCover).toBe(true);
  }
});

test("landing loads the playable office inline and preserves the session when expanded", async ({ page }) => {
  const errors = [], voices = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => { if (request.url().includes(".mp3")) voices.push(request.url()); });
  await openOffice(page);
  await expect(page.locator(".demo-embed")).not.toHaveClass(/is-expanded/);
  await expect(page.locator(".office-canvas")).toHaveAttribute("data-models", "fernando,roxy,alfredo");
  await page.evaluate(() => { window.__officeCanvas = document.querySelector(".office-canvas"); });
  await page.keyboard.press("c");
  await expect(page.locator(".office-canvas")).toHaveAttribute("data-view", "first-person");
  await page.keyboard.down("w");
  await expect(page.getByRole("button", { name: /Hablar con Roxy/ })).toBeVisible({ timeout: 15_000 });
  await page.keyboard.up("w");
  await page.getByRole("button", { name: /Hablar con Roxy/ }).click();
  const dialogue = page.getByRole("dialog", { name: "Conversación con Roxy" });
  await expect(dialogue).toBeVisible();
  await expect.poll(() => voices.length).toBeGreaterThan(0);
  await dialogue.getByRole("button", { name: /primer día/ }).click();
  await expect(dialogue).toContainText("café, té y otras infusiones");
  await dialogue.getByRole("button", { name: /Cerrar conversaci/ }).click();
  await page.getByRole("button", { name: "Ampliar ventana" }).click();
  await expect(page.locator(".demo-embed")).toHaveClass(/is-expanded/);
  await expect.poll(async () => (await page.locator(".demo-embed").boundingBox()).width).toBeGreaterThan(1400);
  await expect.poll(() => page.evaluate(() => window.__officeCanvas === document.querySelector(".office-canvas"))).toBe(true);
  await page.getByRole("button", { name: /Volver a la p/ }).click();
  await expect(page.locator(".demo-embed")).not.toHaveClass(/is-expanded/);
  await expect.poll(() => page.evaluate(() => window.__officeCanvas === document.querySelector(".office-canvas"))).toBe(true);
  expect(errors).toEqual([]);
});

test("Victoria uses her avatar and personalized welcome", async ({ page }) => {
  await openOffice(page, "victoria");
  await expect(page.locator(".office-canvas")).toHaveAttribute("data-models", "victoria,roxy,alfredo");
  await page.keyboard.down("w");
  await expect(page.getByRole("button", { name: /Hablar con Roxy/ })).toBeVisible({ timeout: 15_000 });
  await page.keyboard.up("w");
  await page.getByRole("button", { name: /Hablar con Roxy/ }).click();
  await expect(page.getByRole("dialog", { name: "Conversación con Roxy" })).toContainText("¡Hola, Victoria! Bienvenida a la oficina.");
});

test("contact form reports the unavailable server without claiming delivery", async ({ page }) => {
  await page.goto("/interbanking/");
  await page.locator('input[name="name"]').fill("Ana Perez");
  await page.locator('input[name="company"]').fill("Ejemplo SA");
  await page.locator('input[name="email"]').fill("ana@ejemplo.com");
  await page.locator('input[name="role"]').fill("RRHH");
  await page.locator('select[name="interest"]').selectOption("Oficina virtual personalizada");
  await page.locator('textarea[name="message"]').fill("Queremos evaluar una oficina virtual para el equipo.");
  await page.getByRole("button", { name: "Enviar consulta" }).click();
  await expect(page.locator(".form-feedback")).toContainText(/no está disponible|no pudimos enviar/i);
  await expect(page.locator(".form-feedback")).toHaveClass(/is-error/);
});


test("custom avatar keeps its appearance and name after reloading", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/interbanking/");
  await page.getByRole("button", { name: /Explorar demo interactiva/ }).click();
  await page.getByRole("button", { name: /Alex Personalizable/ }).click();
  const editor = page.getByRole("complementary", { name: "Personalizar avatar" });
  await editor.getByLabel("Tu nombre").fill("Luciano");
  await editor.getByLabel("Tu nombre").blur();
  await editor.getByLabel("Pelo", { exact: true }).selectOption("long");
  await editor.getByLabel("Barba", { exact: true }).selectOption("short");
  await editor.getByLabel("Color de pelo").fill("#f023ee");
  await editor.getByLabel("Gafas", { exact: true }).selectOption("round");
  await editor.getByLabel("Color de remera").fill("#d75228");
  await editor.getByLabel(/Color de pantal/).fill("#476d49");
  await editor.getByLabel("Color de zapatillas").fill("#348dd3");
  await expect(page.getByRole("button", { name: /Luciano Personalizable/ })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("nexora.office.avatar.v1"))?.customization?.glasses)).toBe("round");
  await page.reload();
  await page.getByRole("button", { name: /Explorar demo interactiva/ }).click();
  await expect(page.getByRole("button", { name: /Luciano Personalizable/ })).toHaveAttribute("aria-pressed", "true");
  await expect(editor.getByLabel("Pelo", { exact: true })).toHaveValue("long");
  await expect(editor.getByLabel("Color de pelo")).toHaveValue("#f023ee");
  await expect(editor.getByLabel("Color de remera")).toHaveValue("#d75228");
  await page.getByRole("button", { name: /Comenzar recorrido/ }).click();
  await expect(page.locator(".office-scene")).toHaveAttribute("data-status", "ready", { timeout: 90_000 });
  await expect(page.locator(".office-canvas")).toHaveAttribute("data-models", "custom,roxy,alfredo");
  await expect(page.locator(".office-footer")).toContainText("LUCIANO");
  await page.keyboard.down("w");
  await expect(page.getByRole("button", { name: /Hablar con Roxy/ })).toBeVisible({ timeout: 15_000 });
  await page.keyboard.up("w");
  await page.getByRole("button", { name: /Hablar con Roxy/ }).click();
  await expect(page.getByRole("dialog", { name: /Roxy/ })).toContainText("Luciano! Bienvenido a la oficina.");
  expect(errors).toEqual([]);
});
