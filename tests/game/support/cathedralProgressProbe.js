import * as THREE from "three";
import { buildCathedral } from "../../../src/game/cathedralScenery.js";

export function runCathedralProgressProbe() {
  const scene = new THREE.Scene(), events = [];
    const progress = { archiveOpen: true, memories: [], altarOpen: false };
    const cathedral = buildCathedral(scene, { initialProgress: progress, onFeedback: event => events.push(event) });
    const camera = new THREE.PerspectiveCamera(44, 1.5, .1, 100);
    camera.position.set(0, 4, -20); camera.lookAt(0, 2, -35);
    const player = { x: 0, z: -24 };
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(640, 400);
    const tick = () => { cathedral.update(.05, 1, progress, player, false, camera); renderer.render(scene, camera); };
    const gate = scene.getObjectByName("Umbral de la Primera Voz").getObjectByName("reja ritual");
    const badges = scene.getObjectByName("Sello / tres recuerdos");
    const counts = [];
    const states = [];
    for (let i = 0; i <= 3; i++) {
      progress.memories = ["nave", "partenon", "fracturada"].slice(0, i);
      progress.altarOpen = i === 3;
      tick();
      states.push({ lit: badges.children.filter(mesh => mesh.material.emissiveIntensity > .5).length,
        visible: gate.visible, open: gate.userData.openFraction });
    }
    const burst = scene.getObjectByName("Activación / recuerdo 2");
    for (const tier of ["high", "medium", "low"]) {
      cathedral.setQuality(tier); tick();
      const particles = burst.children.find(child => child.isPoints);
      counts.push(particles.geometry.drawRange.count);
    }
    for (let i = 0; i < 65; i++) cathedral.update(.05, 1, progress, player, false, camera);
    const open = !gate.visible && gate.userData.openFraction === 1;
    player.z = -50.7;
    camera.position.set(0, 4, -44); camera.lookAt(0, 2, -53.6);
    const baseline = [...camera.position.toArray(), ...camera.quaternion.toArray()];
    progress.altarActivated = true;
    for (let i = 0; i < 20; i++) cathedral.update(.05, 1, progress, player, false, camera);
    cathedral.applyCamera(camera, player, {});
    const decorated = camera.position.distanceTo(new THREE.Vector3(...baseline.slice(0, 3))) > .01;
    cathedral.restoreCamera(camera);
    const restored = JSON.stringify([...camera.position.toArray(), ...camera.quaternion.toArray()]) === JSON.stringify(baseline);
    cathedral.update(.05, 1, progress, player, false, camera, false, null, { skip: 1 });
    cathedral.applyCamera(camera, player, {});
    const skipped = JSON.stringify([...camera.position.toArray(), ...camera.quaternion.toArray()]) === JSON.stringify(baseline);
    cathedral.dispose();
    const loadedEvents = [];
    const loaded = buildCathedral(new THREE.Scene(), { initialProgress: progress, onFeedback: event => loadedEvents.push(event) });
    loaded.update(.05, 1, progress, player, false, camera);
    const noReplay = loadedEvents.length === 0 && loaded.presentationState.seal === Infinity;
    loaded.dispose(); renderer.dispose(); renderer.forceContextLoss();
    return { states, counts, open, decorated, restored, skipped, noReplay, memoryEvents: events.filter(e => e.type === "memory").length };
}
