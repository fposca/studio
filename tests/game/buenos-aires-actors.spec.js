import { test, expect } from "@playwright/test";

test("Chapter 14 loads all Meshy citizens, moves them safely and reveals the frequency signal", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/city-actors-harness", route => route.fulfill({ contentType: "text/html", body: "<html><body></body></html>" }));
  await page.goto("/city-actors-harness");
  const result = await page.evaluate(async () => {
    const THREE = await import("/node_modules/three/build/three.module.js");
    const { GLTFLoader } = await import("/node_modules/three/examples/jsm/loaders/GLTFLoader.js");
    const { MeshoptDecoder } = await import("/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js");
    const { buildBuenosAires } = await import("/src/game/buenosAiresScenery.js");
    const events = [], scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight());
    const city = buildBuenosAires(scene, { tier: "high", onEvent: event => events.push(event) });
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const loaded = await city.actors.load(loader);
    const male = city.actors.actors.find(actor => actor.config.id === "ba-man-1");
    const startingPosition = male.root.position.clone();
    for (let i = 0; i < 40; i++) city.update(.1, i * .1, {}, { x: 0, z: 42 }, false);
    const moved = male.root.position.distanceTo(startingPosition);
    const animated = city.actors.actors.filter(actor => actor.lod === "near").every(actor => actor.model && actor.mixer && actor.currentAction);
    city.update(.1, 5, { citizens: ["ba-man-1", "ba-woman-1", "ba-executive-1"], visionActive: true },
      { x: 0, z: 20 }, false);
    const signal = events.includes("signal-found");
    const billboard = scene.getObjectByName("Visión de frecuencia / SEGUÍ MIRANDO")?.visible;
    const disconnected = city.actors.actors.find(actor => actor.config.id === "ba-disconnected");
    city.actors.react("ba-disconnected", { x: -36, z: -19 });
    const talkBefore = disconnected.mixer.time;
    city.update(.1, 5.1, { signalFound: true, citizens: [], visionActive: false },
      { x: -36, z: -19 }, true);
    const talkAnimated = disconnected.mixer.time > talkBefore;
    city.applyQuality("low");
    city.update(.1, 6, { citizens: [], visionActive: false }, { x: 0, z: 42 }, false);
    const lowVisible = city.actors.getStats().skeletons;
    city.dispose();
    return { loaded, moved, animated, signal, billboard, talkAnimated, lowVisible };
  });
  expect(result.loaded).toHaveLength(11);
  expect(result.moved).toBeGreaterThan(1);
  expect(result.animated).toBe(true);
  expect(result.signal).toBe(true);
  expect(result.billboard).toBe(true);
  expect(result.talkAnimated).toBe(true);
  expect(result.lowVisible).toBeLessThanOrEqual(7);
  expect(errors).toEqual([]);
});


test("talking to a distinct citizen with E advances NADIE ESCUCHA and autosaves", async ({ page }) => {
  await page.addInitScript(() => {
    const data = {
      scene: "buenos-aires-2049",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1,
        enemies: [0, 0], gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { completed: true },
      throneProgress: { entered: true, inscriptionRead: true, vows: ["memoria", "voluntad", "libertad"],
        hallOpen: true, coreInspected: ["origen", "eco", "enlace"],
        conductors: ["origen", "eco", "enlace"], throneOpen: true,
        bossIntro: true, bossHealth: 0, bossDefeated: true,
        transmissionExamined: true, completed: true },
      cityProgress: { entered: true, introSeen: true },
      positions: { "buenos-aires-2049": { x: -4, z: 37, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const city = page.locator(".neon-buenos-aires");
  await expect(city.locator("canvas")).toHaveAttribute("data-city-actors", /ba-man-1/, { timeout: 90_000 });
  await expect(city.locator(".studio-examine-cue")).toContainText("Transeúnte", { timeout: 10_000 });
  await page.keyboard.press("e");
  const dialogue = city.getByRole("dialog", { name: /Conversación en Buenos Aires/ });
  await expect(dialogue).toBeVisible();
  await expect(dialogue).toContainText("Disculpame");
  await dialogue.getByRole("button", { name: /Continuar/ }).click();
  await expect(dialogue).toContainText("Actualizando perfil");
  await dialogue.getByRole("button", { name: /Continuar/ }).click();
  await dialogue.getByRole("button", { name: /Terminar/ }).click();
  await expect(city.getByText("CIUDADANOS / 1 DE 3")).toBeVisible();
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.cityProgress.citizens.length),
    { timeout: 10_000 }).toBe(1);
});


test("the Desconectada reveals the Red and leaves Chapter 14 open", async ({ page }) => {
  await page.addInitScript(() => {
    const data = {
      scene: "buenos-aires-2049",
      chapter10Progress: { coreAnalyzed: true, signalDetected: true, hugoConsulted: true,
        signalReconstructed: true, underworldUnlocked: true, chapterCompleted: true },
      underworldProgress: { bridgeCrossed: true, completed: true, combatVersion: 1,
        enemies: [0, 0], gargolaHealth: 0, testigoHealth: 0, testigoDefeatLineSeen: true },
      cathedralProgress: { completed: true },
      throneProgress: { entered: true, inscriptionRead: true, vows: ["memoria", "voluntad", "libertad"],
        hallOpen: true, coreInspected: ["origen", "eco", "enlace"],
        conductors: ["origen", "eco", "enlace"], throneOpen: true,
        bossIntro: true, bossHealth: 0, bossDefeated: true,
        transmissionExamined: true, completed: true },
      cityProgress: { entered: true, introSeen: true, citizens: ["ba-man-1", "ba-woman-1", "ba-executive-1"],
        visionActive: true, signalFound: true },
      positions: { "buenos-aires-2049": { x: -36, z: -19, yaw: Math.PI, viewYaw: 0 } },
    };
    localStorage.setItem("neonboy.universe.saves.v1", JSON.stringify({ version: 1,
      slots: { autosave: { savedAt: Date.now(), data } } }));
  });
  await page.goto("/discografia/");
  await page.getByRole("button", { name: /comenzar/i }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  const city = page.locator(".neon-buenos-aires");
  await expect(city.locator("canvas")).toHaveAttribute("data-city-actors", /ba-disconnected/, { timeout: 90_000 });
  await expect(city.locator(".studio-examine-cue")).toContainText("Desconectada");
  await page.keyboard.press("e");
  const dialogue = city.getByRole("dialog", { name: /Conversación en Buenos Aires/ });
  await expect(dialogue).toContainText("No sigas intentando hablarles");
  for (let i = 0; i < 8; i++) await dialogue.getByRole("button", { name: /Continuar/ }).click();
  await expect(dialogue).toContainText("origen de la transmisión");
  await dialogue.getByRole("button", { name: /Terminar/ }).click();
  await expect(city.getByText(/Seguí la señal hasta el Obelisco/)).toBeVisible();
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem("neonboy.universe.saves.v1")).slots.autosave.data.cityProgress.disconnectedMet),
    { timeout: 10_000 }).toBe(true);
});

