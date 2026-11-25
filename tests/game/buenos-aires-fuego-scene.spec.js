import { test, expect } from "@playwright/test";

test("Fuego collection points are accessible, solid, frequency-aware and emit one ignition alert", async ({ page }) => {
  await page.goto("/discografia/");
  const result = await page.evaluate(async () => {
    const THREE = await import("/node_modules/three/build/three.module.js");
    const { createBuenosAiresFuegoScene } = await import("/src/game/buenosAiresFuegoScene.js");
    const { FUEGO_LOCATIONS, FUEGO_CLUES, FUEGO_KEY_CITIZEN } = await import("/src/game/buenosAiresFuegoLayout.js");
    const { canStandInBuenosAires } = await import("/src/game/buenosAiresLayout.js");
    const root = new THREE.Group(), events = [], synchronizations = [];
    const citizen = { root: new THREE.Group(), config: { id: FUEGO_KEY_CITIZEN, label: "transeunte" }, lod: "near", interaction: {} };
    root.add(citizen.root);
    const actors = { actors: [citizen],
      setMissionAnchor(id, point) { if (id === FUEGO_KEY_CITIZEN) citizen.root.position.set(point.x, 0, point.z); },
      triggerCollectiveSynchronization(options) { synchronizations.push(options); },
    };
    const board = new THREE.Mesh(new THREE.PlaneGeometry(3, 1), new THREE.MeshBasicMaterial()); root.add(board);
    let originalDisposed = false; board.geometry.addEventListener("dispose", () => originalDisposed = true);
    const options = { actors, flyingVehicles: { escapeReady: true, escapeParking: { x: -6 } }, signalBillboards: [board], onEvent: event => events.push(event) };
    const scene = createBuenosAiresFuegoScene(root, options), player = { x: -38, z: -4.8 };
    scene.update(.1, {}, player, false);
    const locked = !scene.group.visible && scene.interactions.every(point => point.reach === 0);
    const p = { fuegoStarted: true, vigilanteDefeated: true };
    scene.update(.1, p, player, false);
    const withoutVision = events.length;
    scene.update(.1, { ...p, visionActive: true }, player, true);
    const paused = events.length;
    for (let i = 0; i < 3; i++) scene.update(.1, { ...p, visionActive: true }, player, false);
    const revealed = events.filter(event => event === "fuego-key-discover").length;
    const accessible = scene.interactions.every(point => canStandInBuenosAires(point.x, point.z + 1.2, true));
    const solid = [FUEGO_LOCATIONS.power, FUEGO_LOCATIONS.navigation].every(point => !scene.canStand(point.x, point.z));
    const nonoverlapping = FUEGO_CLUES.every((point, i) => FUEGO_CLUES.every((other, j) => i === j || Math.hypot(point.x - other.x, point.z - other.z) > 5.4));
    Object.assign(p, { fuegoKeyTaken: true, fuegoPowerMaintenanceOpen: true, fuegoNavigationTerminalOpen: true });
    for (let i = 0; i < 90; i++) scene.update(1 / 60, p, player, false);
    const open = [scene.power, scene.navigation].every(terminal => terminal.getObjectByName("Puerta articulada").rotation.y < -2);
    const itemsRevealed = scene.cell.visible && scene.module.visible && !scene.key.visible;
    Object.assign(p, { fuegoPowerCellTaken: true, fuegoNavigationModuleTaken: true, fuegoPowered: true });
    scene.update(.1, p, player, false); scene.update(.1, p, player, false);
    const alertVisible = root.getObjectByName("Fuego / alerta de la Red").visible;
    const taken = !scene.cell.visible && !scene.module.visible;
    scene.dispose();
    const removed = !root.getObjectByName("El Ultimo Fuego / repuestos") && !root.getObjectByName("Fuego / alerta de la Red");
    const retainedOriginal = !originalDisposed;
    // A restored powered save retains screens but never replays the population event.
    const restored = createBuenosAiresFuegoScene(root, options); restored.update(.1, p, player, false); restored.dispose();
    board.geometry.dispose(); board.material.dispose();
    return { locked, withoutVision, paused, revealed, accessible, solid, nonoverlapping, open, itemsRevealed, taken, alertVisible, removed, retainedOriginal,
      synchronizationCount: synchronizations.length, duration: synchronizations[0]?.duration };
  });
  expect(result).toEqual({ locked: true, withoutVision: 0, paused: 0, revealed: 1, accessible: true, solid: true,
    nonoverlapping: true, open: true, itemsRevealed: true, taken: true, alertVisible: true, removed: true, retainedOriginal: true,
    synchronizationCount: 1, duration: 3 });
});
