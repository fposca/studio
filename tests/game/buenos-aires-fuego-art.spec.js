import { test, expect } from "@playwright/test";

// Isolated WebGL coverage. Low is a browser renderer profile, not an Android device claim.
for (const quality of ["high", "low"]) {
  test(`Fuego procedural art renders, opens and releases resources (${quality})`, async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/discografia/");
    const initial = await page.evaluate(async quality => {
      const THREE = await import("/node_modules/three/build/three.module.js");
      const { createFuegoArt } = await import("/src/game/buenosAiresFuegoArt.js");
      const { FUEGO_ITEM_ICONS } = await import("/src/game/buenosAiresFuegoIcons.js");
      const art = createFuegoArt(), scene = new THREE.Scene();
      scene.background = new THREE.Color(0x09121e);
      const camera = new THREE.OrthographicCamera(-5.5, 5.5, 3.8, -3.8, .1, 40);
      camera.position.set(0, 3.8, 12); camera.lookAt(0, 1.8, 0);
      const renderer = new THREE.WebGLRenderer({ antialias: quality === "high", preserveDrawingBuffer: true });
      renderer.setPixelRatio(quality === "high" ? 1.5 : 1);
      renderer.setSize(1100, 760); renderer.shadowMap.enabled = false;
      renderer.domElement.id = "fuego-art-preview";
      Object.assign(renderer.domElement.style, { position: "fixed", inset: "0", zIndex: "99999" });
      document.body.append(renderer.domElement);
      scene.add(new THREE.HemisphereLight(0xe7f6ff, 0x3b3157, 2));
      const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(-3, 6, 7); scene.add(light);
      // Three retains an internal DFG lookup texture after any StandardMaterial render.
      // Warm it before measuring the baseline so only art-owned GPU resources are counted.
      const warmup = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
      scene.add(warmup); renderer.render(scene, camera); scene.remove(warmup);
      warmup.geometry.dispose(); warmup.material.dispose(); renderer.render(scene, camera);
      const baseline = { geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures };
      const ids = Object.keys(FUEGO_ITEM_ICONS);
      const counts = [], itemBounds = [];
      const standalone = ids.map((id, i) => {
        const object = art.createItem(id);
        const bounds = new THREE.Box3().setFromObject(object); itemBounds.push(bounds.getSize(new THREE.Vector3()).toArray());
        let meshes = 0;
        object.traverse(child => { if (child.isMesh) { meshes++; if (!child.userData.cityKeep || !child.userData.invasionVisionPreserve) throw new Error("Item lost city/frequency preservation"); } });
        counts.push(meshes); object.scale.setScalar(2.2); object.position.set(-3.7 + i * 1.8, 3.55, 0); object.rotation.y = -.22; scene.add(object); return object;
      });
      const terminals = [art.createTerminal("charge"), art.createTerminal("maintenance")];
      const socketBounds = [];
      terminals.forEach((terminal, i) => {
        const item = art.createItem(ids[i + 1]);
        terminal.userData.itemAnchor.add(item);
        terminal.userData.setProgress(.75);
        terminal.updateMatrixWorld(true);
        // Bounds in terminal-local coordinates: object fits behind the door and inside the cavity.
        const bounds = new THREE.Box3().setFromObject(item);
        socketBounds.push({ min: bounds.min.toArray(), max: bounds.max.toArray() });
        terminal.position.set(-3.4 + i * 2.2, .0, 0); scene.add(terminal);
      });
      const systems = art.createVehicleSystems(); systems.position.set(2.8, 1.8, 0); scene.add(systems);
      const find = prefix => systems.children.find(child => child.name.startsWith(prefix));
      systems.userData.setState({ keyInstalled: true, powerInstalled: true, navigationInstalled: true });
      const lightsBeforeIgnition = find("Faros").visible;
      const dashboardPosition = find("Tablero").position.toArray();
      const navigationPosition = find("Navegacion").position.toArray();
      const thrusterPositions = find("Propulsion").children.map(mesh => mesh.position.toArray());
      const render = () => renderer.render(scene, camera);
      render();
      window.fuegoArtPreview = {
        open() {
          terminals.forEach(terminal => terminal.userData.setOpen(true));
          systems.userData.setState({ keyInstalled: true, powerInstalled: true, navigationInstalled: true, powered: true });
          for (let i = 0; i < 90; i++) art.update(1 / 60);
          render();
          return { angles: terminals.map(terminal => terminal.children.find(child => child.name === "Puerta articulada").rotation.y), headlights: find("Faros").visible, drawCalls: renderer.info.render.calls };
        },
        dispose() {
          art.dispose(); art.dispose(); render();
          const memory = { geometries: renderer.info.memory.geometries - baseline.geometries, textures: renderer.info.memory.textures - baseline.textures };
          renderer.dispose(); renderer.domElement.remove(); delete window.fuegoArtPreview;
          return memory;
        },
      };
      return { counts, itemBounds, socketBounds, lightsBeforeIgnition, dashboardPosition, navigationPosition, thrusterPositions, iconCount: ids.filter(id => FUEGO_ITEM_ICONS[id].startsWith("data:image/svg+xml")).length };
    }, quality);
    expect(initial.iconCount).toBe(3);
    expect(initial.counts.every(count => count > 5 && count <= 32)).toBe(true);
    for (const dimensions of initial.itemBounds) expect(dimensions.every(value => value > 0 && value < .7)).toBe(true);
    for (const bounds of initial.socketBounds) {
      expect(bounds.min[0]).toBeGreaterThan(-.4); expect(bounds.max[0]).toBeLessThan(.4);
      expect(bounds.min[1]).toBeGreaterThan(.4); expect(bounds.max[1]).toBeLessThan(1.09);
      expect(bounds.min[2]).toBeGreaterThan(-.22); expect(bounds.max[2]).toBeLessThan(.34);
    }
    expect(initial.dashboardPosition).toEqual([0, -.10, .30]);
    expect(initial.navigationPosition).toEqual([.55, .28, .35]);
    expect(initial.thrusterPositions.every(position => Math.abs(position[0]) === .65 && position[1] < -1.6 && position[1] > -1.9)).toBe(true);
    expect(initial.lightsBeforeIgnition).toBe(false);
    const canvas = page.locator("#fuego-art-preview");
    await canvas.screenshot({ path: testInfo.outputPath(`fuego-${quality}-closed.png`) });
    const opened = await page.evaluate(() => window.fuegoArtPreview.open());
    expect(opened.angles.every(angle => angle < -2)).toBe(true);
    expect(opened.headlights).toBe(true);
    expect(opened.drawCalls).toBeLessThan(160);
    await canvas.screenshot({ path: testInfo.outputPath(`fuego-${quality}-open.png`) });
    expect(await page.evaluate(() => window.fuegoArtPreview.dispose())).toEqual({ geometries: 0, textures: 0 });
    expect(errors).toEqual([]);
  });
}
