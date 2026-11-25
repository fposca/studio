import * as THREE from "three";
import { createFuegoArt } from "./buenosAiresFuegoArt.js";

import { FUEGO_KEY_CITIZEN, FUEGO_LOCATIONS, FUEGO_CLUES } from "./buenosAiresFuegoLayout.js";

// Reuses the city update, citizen identities and the original parked Fuego.
export function createBuenosAiresFuegoScene(root, { actors, flyingVehicles, signalBillboards, onEvent }) {
  const group = new THREE.Group(); group.name = "El Ultimo Fuego / repuestos"; root.add(group);
  const art = createFuegoArt(), textures = [], resources = [];
  const power = art.createTerminal("charge"), navigation = art.createTerminal("maintenance");
  power.position.set(FUEGO_LOCATIONS.power.x, 0, FUEGO_LOCATIONS.power.z);
  navigation.position.set(FUEGO_LOCATIONS.navigation.x, 0, FUEGO_LOCATIONS.navigation.z);
  group.add(power, navigation);
  const cell = art.createItem("fuego_power_cell"), module = art.createItem("fuego_navigation_module");
  (power.userData.itemAnchor || power).add(cell);
  (navigation.userData.itemAnchor || navigation).add(module);
  if (!power.userData.itemAnchor) cell.position.set(0, .9, .2);
  if (!navigation.userData.itemAnchor) module.position.set(0, .9, .2);
  cell.scale.setScalar(.68); module.scale.setScalar(.7);
  const key = art.createItem("fuego_key");
  key.position.set(.27, 1.02, .18); key.rotation.z = -.12; key.scale.setScalar(.65);
  const keyActor = actors.actors.find(actor => actor.config.id === FUEGO_KEY_CITIZEN);
  keyActor?.root.add(key);
  const chip = new THREE.Mesh(new THREE.RingGeometry(.1, .145, 20), new THREE.MeshBasicMaterial({
    color: 0x80f6ff, transparent: true, opacity: .9, side: THREE.DoubleSide, depthWrite: false, toneMapped: false,
  }));
  chip.position.set(.27, 1.13, .23); chip.userData.invasionVisionPreserve = true; chip.userData.cityKeep = true;
  keyActor?.root.add(chip); resources.push(chip.geometry, chip.material);
  function label(title, subtitle, color = "#88edff") {
    const canvas = document.createElement("canvas"); canvas.width = 768; canvas.height = 320;
    const ctx = canvas.getContext("2d"); ctx.fillStyle = "#071a28"; ctx.fillRect(0, 0, 768, 320);
    ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.strokeRect(9, 9, 750, 302);
    ctx.fillStyle = color; ctx.font = "600 25px Arial, sans-serif"; ctx.fillText("MEMORIA URBANA / ARCHIVO LOCAL", 35, 58);
    ctx.fillStyle = "#f0faff"; ctx.font = "700 46px Arial, sans-serif"; ctx.fillText(title, 35, 135);
    ctx.font = "400 28px Arial, sans-serif"; ctx.fillText(subtitle, 35, 220);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; textures.push(map); return map;
  }
  const clueBoards = FUEGO_CLUES.map(clue => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.08), new THREE.MeshBasicMaterial({
      map: label(clue.symbol, clue.text), side: THREE.DoubleSide, toneMapped: false,
    }));
    mesh.name = "Fuego / pista " + clue.id; mesh.position.set(clue.x, 1.55, clue.z);
    mesh.userData.cityKeep = mesh.userData.invasionVisionPreserve = true;
    group.add(mesh); resources.push(mesh.geometry, mesh.material); return mesh;
  });
  const alertMap = label("VEH\u00cdCULO NO REGISTRADO", "PROTOCOLO DE INTERCEPCI\u00d3N / OBJETIVO: NEONBOY", "#ff9fbc");
  // Fit the longer alert to its screen without clipping.
  const alertCanvas = alertMap.image, ctx = alertCanvas.getContext("2d");
  ctx.fillStyle = "#101523"; ctx.fillRect(20, 28, 728, 262); ctx.fillStyle = "#ffb7cf";
  ctx.font = "700 38px Arial, sans-serif"; ctx.fillText("VEH\u00cdCULO NO REGISTRADO", 32, 100);
  ctx.font = "600 28px Arial, sans-serif"; ctx.fillText("IDENTIDAD: NEONBOY", 32, 155);
  ctx.fillText("RUTA A\u00c9REA NO AUTORIZADA", 32, 205);
  ctx.fillStyle = "#e4faff"; ctx.font = "600 24px Arial, sans-serif"; ctx.fillText("PROTOCOLO DE INTERCEPCI\u00d3N ACTIVADO", 32, 265); alertMap.needsUpdate = true;
  const alerts = signalBillboards.map(screen => {
    const panel = new THREE.Mesh(screen.geometry, new THREE.MeshBasicMaterial({ map: alertMap, side: THREE.DoubleSide, toneMapped: false }));
    panel.name = "Fuego / alerta de la Red"; panel.position.copy(screen.position);
    panel.rotation.copy(screen.rotation); panel.scale.copy(screen.scale); panel.position.x += screen.rotation.y > 0 ? .2 : -.2;
    panel.userData.cityKeep = panel.userData.invasionVisionPreserve = true; panel.visible = false;
    root.add(panel); resources.push(panel.material); return panel;
  });
  const interactions = [
    { id: "ba-fuego-power", label: "Examinar estaci\u00f3n de carga", x: power.position.x, z: power.position.z + 1, reach: 0 },
    { id: "ba-fuego-navigation", label: "Examinar terminal de navegaci\u00f3n", x: navigation.position.x, z: navigation.position.z + 1, reach: 0 },
    ...FUEGO_CLUES.map(clue => ({ id: "ba-fuego-clue-" + clue.id, label: "Leer archivo urbano: " + clue.symbol,
      x: clue.x, z: clue.z + 1, reach: 0 })),
  ];
  let flightActive = false, flightAlert = false;
  let age = 0, keyReported = false, initialized = false, lastPowered = false, active = false;
  function update(dt, progress, player, paused) {
    const p = progress || {}; const step = paused ? 0 : Math.min(Math.max(dt, 0), .1); age += step;
    active = Boolean(p.fuegoStarted); group.visible = active;
    interactions.forEach(item => { item.reach = active ? 2.7 : 0; });
    if (active && !p.fuegoKeyTaken) actors.setMissionAnchor(FUEGO_KEY_CITIZEN, FUEGO_LOCATIONS.key);
    if (p.vigilanteDefeated && flyingVehicles.escapeReady)
      actors.setMissionAnchor("ba-disconnected", { x: flyingVehicles.escapeParking.x + 3.5, z: 24.8 });
    key.visible = active && !p.fuegoKeyTaken && keyActor?.lod === "near";
    chip.visible = key.visible && Boolean(p.visionActive);
    chip.material.opacity = .65 + .3 * Math.sin(age * 3) ** 2;
    if (keyActor?.interaction)
      keyActor.interaction.label = active && !p.fuegoKeyTaken
        ? p.fuegoKeyDiscovered ? "Recuperar llave del Fuego" : "Hablar con transe\u00fante de la confiter\u00eda"
        : "Hablar con " + keyActor.config.label;
    if (!paused && chip.visible && !p.fuegoKeyDiscovered && !keyReported &&
      Math.hypot(player.x - keyActor.root.position.x, player.z - keyActor.root.position.z) < 7) {
      keyReported = true; onEvent?.("fuego-key-discover");
    }
    power.userData.setOpen?.(Boolean(p.fuegoPowerMaintenanceOpen));
    navigation.userData.setOpen?.(Boolean(p.fuegoNavigationTerminalOpen));
    cell.visible = !p.fuegoPowerCellTaken; module.visible = !p.fuegoNavigationModuleTaken;
    alerts.forEach(mesh => { mesh.visible = Boolean(p.fuegoPowered && (!flightActive || flightAlert)); });
    if (!flightActive && initialized && !lastPowered && p.fuegoPowered)
      actors.triggerCollectiveSynchronization({ id: "fuego-unauthorized-ignition", player, radius: 30, duration: 3 });
    initialized = true; lastPowered = Boolean(p.fuegoPowered); art.update(step);
  }
  return { setFlightState(active, alert = false) { flightActive = active; flightAlert = alert; }, group, interactions, power, navigation, key, cell, module, clueBoards, update,
    canStand(x, z, fromX = x, fromZ = z) {
      if (!active) return true;
      return [FUEGO_LOCATIONS.power, FUEGO_LOCATIONS.navigation].every(point => {
        const next = Math.hypot(x - point.x, z - point.z), previous = Math.hypot(fromX - point.x, fromZ - point.z);
        return next > 1 || next > previous;
      });
    },
    dispose() { key.removeFromParent(); chip.removeFromParent(); group.removeFromParent();
      alerts.forEach(mesh => mesh.removeFromParent()); art.dispose(); resources.forEach(resource => resource.dispose()); textures.forEach(texture => texture.dispose()); },
  };
}
