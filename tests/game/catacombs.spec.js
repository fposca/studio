import { test, expect } from "@playwright/test";

test.afterEach(async ({ page }) => { await page.evaluate(() => window.unmountGame?.()); });

test("level 4 shows Plato, equips the crossbow, and renders the chief's scythe", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/fixtures/game.html");
  await page.waitForFunction(() => Boolean(window.game), null, { timeout: 90_000 });
  await page.getByRole("button", { name: "Nivel 4: Las catacumbas" }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("button", { name: "Omitir intro" }).click();
  await expect(page.getByRole("dialog")).toContainText("diez flechas");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.keyboard.press("v");
  await page.evaluate(() => {
    const world = window.game.inspect().world, player = world.player;
    player.x = 0; player.z = 10.4;
    const position = { x: 0, y: player.bodyOffset, z: 10.4 };
    player.body.setTranslation(position, true); player.body.setNextKinematicTranslation(position);
    world.physics.step();
  });
  await expect(page.getByRole("button", { name: "Ballesta (5)" })).toBeEnabled();
  await page.getByRole("button", { name: "Ballesta (5)" }).click();
  await expect(page.getByLabel("Mira de ballesta")).toBeVisible();
  await expect(page.getByLabel("Mira de ballesta")).toContainText("10 / 10");
  async function heldCrossbow() {
    return page.evaluate(async () => {
      const THREE = await import("/node_modules/three/build/three.module.js");
      const neonboy = window.game.inspect().scene.getObjectByName("Neonboy");
      const weapon = neonboy.getObjectByName("Arma crossbow");
      const hand = neonboy.getObjectByName("mixamorigRightHand");
      neonboy.updateMatrixWorld(true);
      const size = new THREE.Box3().setFromObject(weapon).getSize(new THREE.Vector3());
      const grip = hand.worldToLocal(weapon.getWorldPosition(new THREE.Vector3()));
      return { visible: weapon.visible, maxSize: Math.max(size.x, size.y, size.z),
        gripGap: grip.distanceTo(new THREE.Vector3(0, 0.11, -0.055)) };
    });
  }
  const aiming = await heldCrossbow();
  expect(aiming.visible).toBe(true);
  expect(aiming.maxSize).toBeGreaterThan(0.5);
  expect(aiming.maxSize).toBeLessThan(1.1);
  expect(aiming.gripGap).toBeLessThan(0.001);
  await page.getByRole("button", { name: "Ballesta (J o clic)" }).click();
  await expect(page.getByLabel("Mira de ballesta")).toContainText("9 / 10");
  expect((await heldCrossbow()).gripGap).toBeLessThan(0.001);
  expect(await page.evaluate(() => {
    const scene = window.game.inspect().scene;
    const scythe = scene.getObjectsByProperty("name", "Arma scythe")[0];
    return { chief: scene.getObjectByName("Momia jefe")?.name,
      scythe: scythe?.parent?.name, plato: scene.getObjectByName("Platon")?.name };
  })).toEqual({ chief: "Momia jefe", scythe: "Empunadura derecha", plato: "Platon" });
  expect(errors).toEqual([]);
});
