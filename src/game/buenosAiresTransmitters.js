import * as THREE from "three";
import { citySignTexture } from "./buenosAiresArt.js";
import { createBuenosAiresReceiverArt } from "./buenosAiresReceiverArt.js";

// The city owns these few reusable meshes. No extra render loop, NPC, or light.
export function createBuenosAiresTransmitters(root, { sign, onEvent, forceField, signalBillboards }) {
  const receiverArt = createBuenosAiresReceiverArt(root);
  const panelGeo = new THREE.PlaneGeometry(3.5, 1.75);
  const textures = [];
  const nodes = [];
  const interactions = [];
  const adX = [-42, -53, -64];
  const adIds = ["mirar", "desear", "consumir"];
  const adPanels = adIds.map((id, index) => {
    const x = adX[index], z = -25.55;
    const mesh = sign(["RED / ATENCI\u00d3N", "RED / EXPERIENCIA", "RED / ELECCI\u00d3N"][index], x, 3.6, z, 3.8, "south", "#7ed8ef", true, 1);
    const texture = citySignTexture(id.toUpperCase(), "#c7a3ff", "billboard", .5); textures.push(texture);
    const glyph = new THREE.Mesh(panelGeo, new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: .92, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    glyph.name = "Anomal\u00eda publicitaria / " + id; glyph.position.copy(mesh.position); glyph.position.z += .08; glyph.userData.baseX = glyph.position.x;
    glyph.scale.set(1.05, 1.05, 1); glyph.visible = false; glyph.userData.cityKeep = true; root.add(glyph);
    interactions.push({ id: "ba-advert-" + id, label: "Examinar anuncio de Corrientes", x, z: -23.9, reach: 2.8 });
    return glyph;
  });
  const clue = sign("OJOS / DESEO / CONSUMO", -53, 6.2, -25.55, 8.5, "south", "#b88bed", true, 1);
  const inscriptionCanvas = document.createElement("canvas");
  inscriptionCanvas.width = 1024; inscriptionCanvas.height = 512;
  const ctx = inscriptionCanvas.getContext("2d");
  const ink = ctx.createLinearGradient(0, 0, 1024, 512);
  ink.addColorStop(0, "#071624"); ink.addColorStop(1, "#281b3c");
  ctx.fillStyle = ink; ctx.fillRect(0, 0, 1024, 512);
  ctx.strokeStyle = "#b88bed"; ctx.lineWidth = 7; ctx.strokeRect(16, 16, 992, 480);
  ctx.fillStyle = "#c99bee"; ctx.font = "700 28px Arial, sans-serif"; ctx.fillText("RED / PRINCIPIO DE ATENCI\u00d3N", 62, 78);
  ctx.fillStyle = "#f2e8fc"; ctx.font = "600 46px Arial, sans-serif";
  ctx.fillText("Primero capturamos tus ojos.", 62, 190);
  ctx.fillText("Despu\u00e9s despertamos el deseo.", 62, 287);
  ctx.fillText("Finalmente decid\u00eds consumir.", 62, 384);
  ctx.fillStyle = "#a2dce8"; ctx.font = "500 24px Arial, sans-serif"; ctx.fillText("CORRIENTES / ENLACE PUBLICITARIO", 62, 458);
  const inscriptionTexture = new THREE.CanvasTexture(inscriptionCanvas); inscriptionTexture.colorSpace = THREE.SRGBColorSpace;
  textures.push(inscriptionTexture);
  const inscription = new THREE.Mesh(panelGeo, new THREE.MeshBasicMaterial({ map: inscriptionTexture, toneMapped: false }));
  inscription.position.copy(clue.position); inscription.position.z += .09; inscription.scale.set(8.15 / 3.5, 3.95 / 1.75, 1);
  inscription.userData.cityKeep = true; inscription.name = "Pista digital / publicidad de Corrientes"; root.add(inscription);
  interactions.push({ id: "ba-advert-clue", label: "Leer inscripci\u00f3n digital", x: -53, z: -21, reach: 2.8 });
  const anomalyCanvas = document.createElement("canvas");
  anomalyCanvas.width = 1024; anomalyCanvas.height = 512;
  const warning = anomalyCanvas.getContext("2d");
  warning.fillStyle = "#120c20"; warning.fillRect(0, 0, 1024, 512);
  warning.strokeStyle = "#b77ae7"; warning.lineWidth = 6; warning.strokeRect(18, 18, 988, 476);
  warning.fillStyle = "#d3a8fb"; warning.font = "700 24px Arial, sans-serif";
  warning.fillText("RED / ALERTA DE IDENTIDAD", 62, 84);
  warning.fillStyle = "#fff0ff"; warning.font = "800 57px Arial, sans-serif";
  warning.fillText("USUARIO NO REGISTRADO", 62, 176);
  warning.font = "700 51px Arial, sans-serif"; warning.fillText("IDENTIDAD: NEONBOY", 62, 286);
  warning.font = "700 38px Arial, sans-serif"; warning.fillText("PROTOCOLO DE CONTENCI\u00d3N INICIADO", 62, 382);
  warning.fillStyle = "#b2dded"; warning.font = "500 22px Arial, sans-serif";
  warning.fillText("BUENOS AIRES / SISTEMA CENTRAL", 62, 462);
  const anomalyTexture = new THREE.CanvasTexture(anomalyCanvas);
  anomalyTexture.colorSpace = THREE.SRGBColorSpace;
  textures.push(anomalyTexture);
  const adAlertTexture = citySignTexture("USUARIO NO REGISTRADO", "#cf9dff", "billboard", .5); textures.push(adAlertTexture);
  const anomalyPanels = signalBillboards.map(screen => {
    const mesh = new THREE.Mesh(screen.geometry, new THREE.MeshBasicMaterial({ map: anomalyTexture, transparent: true, opacity: .94, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    mesh.position.copy(screen.position); mesh.rotation.copy(screen.rotation); mesh.scale.copy(screen.scale); mesh.position.x += screen.rotation.y > 0 ? .13 : -.13;
    mesh.visible = false; mesh.userData.cityKeep = true; mesh.name = "Red / usuario no registrado"; root.add(mesh); return mesh;
  });

  function node(stage, id, x, z) {
    const art = receiverArt.create(x, z);
    const { group } = art; group.name = "Transmisor " + stage + " / " + id;
    const labelTexture = citySignTexture(({ senal: "SE\u00d1AL", nucleo: "N\u00daCLEO" })[id] || id.toUpperCase(), "#c9a7ff", "sign", .5); textures.push(labelTexture);
    const label = new THREE.Mesh(panelGeo, new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    label.name = "Frecuencia decodificada / " + id;
    label.position.set(0, 2.15, .12); label.scale.set(.52, .34, 1); label.visible = false;
    label.userData.cityKeep = true; group.add(label);
    const item = { stage, id, group, art, label, position: new THREE.Vector3(x, 1.32, z), radius: .55 };
    nodes.push(item); return item;
  }
  node("traffic", "senal", -32.4, -28);
  const trafficRoute = node("traffic", "ruta", -25, -17);
  node("traffic", "control", -32.4, -6);
  node("core", "origen", 0, 9);
  const coreLink = node("core", "enlace", 10, 8.45);
  node("core", "nucleo", -10, 8.45);
  function reflector(stage, x, z, normal) {
    const item = node(stage, "reflector", x, z);
    item.reflect = true; item.normal = new THREE.Vector3(...normal).normalize();
    item.panel = receiverArt.makeReflector(item.art);
    interactions.push({ id: "ba-" + stage + "-reflector", label: "Orientar reflector de frecuencia", x, z: z + 1.3, reach: 3 });
    return item;
  }
  const trafficMirror = reflector("traffic", -32.4, -17, [1, 0, -1]);
  const coreMirror = reflector("core", 17, 8.45, [1, 0, -1]);

  // The ring marks the BA side of the mirror. The second line shows the real
  // reflected direction toward the next receiver; both share existing scene time.
  function bounceGuide(stage, mirror, destination, approachZ) {
    const group = new THREE.Group(); group.name = "Guia del rebote / " + stage;
    group.visible = false; group.userData.cityKeep = true; root.add(group);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.7, .85, 48), new THREE.MeshBasicMaterial({
      color: 0x8cecff, transparent: true, opacity: .78,
      side: THREE.DoubleSide, depthWrite: false, depthTest: false,
    }));
    ring.name = "Posicion de lanzamiento / lado BA";
    ring.rotation.x = -Math.PI / 2; ring.position.set(mirror.position.x, .085, approachZ);
    ring.renderOrder = 102; ring.userData.cityKeep = true; group.add(ring);
    const incoming = new THREE.Vector3(mirror.position.x, 1.32, approachZ);
    const lines = [
      [incoming, mirror.position, "Entrada al reflector"],
      [mirror.position, destination.position, "Rebote hacia " + destination.id.toUpperCase()],
    ].map(([from, to, name], index) => {
      const line = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(from, to), 1, .038, 6, false),
        new THREE.MeshBasicMaterial({ color: index ? 0xff9ce9 : 0x8cecff,
          transparent: true, opacity: .8, depthTest: false, depthWrite: false }));
      line.name = name; line.renderOrder = 102;
      line.userData.cityKeep = true; group.add(line); return line;
    });
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(.15, .34, 6), new THREE.MeshBasicMaterial({
      color: 0xd7faff, depthTest: false, depthWrite: false,
    }));
    arrow.name = "Flecha del rebote";
    arrow.position.copy(mirror.position).lerp(destination.position, .62);
    arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1, 0, 0));
    arrow.renderOrder = 103; arrow.userData.cityKeep = true; group.add(arrow);
    const pulseOrb = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), new THREE.MeshBasicMaterial({
      color: 0xffc5f1, depthTest: false, depthWrite: false,
    }));
    pulseOrb.name = "Pulso hacia " + destination.id.toUpperCase();
    pulseOrb.renderOrder = 104; pulseOrb.userData.cityKeep = true; group.add(pulseOrb);
    const labelMap = citySignTexture("LANZ\u00c1 DESDE AC\u00c1", "#8cecff", "sign", .5);
    textures.push(labelMap);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({
      map: labelMap, transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    }));
    label.name = "Guia / lanza desde BA";
    label.position.set(mirror.position.x + 1.8, 1.65, approachZ);
    label.scale.set(2.3, .61, 1); label.renderOrder = 103; group.add(label);
    return { group, ring, lines, arrow, pulseOrb, mirror, destination, label };
  }
  const bounceGuides = {
    traffic: bounceGuide("traffic", trafficMirror, trafficRoute, -23),
    core: bounceGuide("core", coreMirror, coreLink, 14.5),
  };
  interactions.push(
    { id: "ba-traffic-clue", label: "Examinar gabinete de tr\u00e1nsito", x: -32.4, z: -28, reach: 3 },
    { id: "ba-core-clue", label: "Examinar campo del Obelisco", x: 0, z: 10.7, reach: 3 }
  );
  receiverArt.finalize();
  const exposedCore = receiverArt.exposed();
  exposedCore.name = "N\u00facleo de la Red expuesto"; exposedCore.position.set(0, 2.2, 8.5);
  exposedCore.visible = false; root.add(exposedCore);
  const waveMaterial = new THREE.MeshBasicMaterial({ color: 0xac77f4, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide });
  const waveGeometry = new THREE.RingGeometry(.92, 1, 48);
  const wave = new THREE.Mesh(waveGeometry, waveMaterial);
  wave.rotation.x = -Math.PI / 2; wave.position.set(0, .13, 8.5); wave.visible = false; wave.userData.cityKeep = true; root.add(wave);
  let pulse = 0, sync = false, distortion = 0, waveAge = 99, lastCompletion = null, fieldInitialized = false;
  function flash() { distortion = 1; }
  function stageAvailable(stage, progress) {
    return progress?.visionActive && (stage === "traffic" ? progress.advertisingComplete && !progress.trafficComplete :
      progress.trafficComplete && !progress.coreComplete);
  }
  function getTargets(progress) {
    return nodes.filter(item => stageAvailable(item.stage, progress)).map(item => ({
      id: "ba-" + item.stage + "-" + item.id, stage: item.stage, nodeId: item.id,
      position: item.position, radius: item.radius, reflect: Boolean(item.reflect), normal: item.normal,
    }));
  }
  function registerImpact(target, progress) {
    if (!target?.stage || !stageAvailable(target.stage, progress) || target.returning) return null;
    if (target.reflect) {
      const aligned = target.stage === "traffic" ? progress.trafficReflectorAligned : progress.coreReflectorAligned;
      if (aligned && target.incoming) {
        const next = target.stage === "traffic" ? trafficRoute.position : coreLink.position;
        const bounced = target.incoming.clone().reflect(target.normal).normalize();
        const expected = next.clone().sub(target.position).normalize();
        if (bounced.dot(expected) < .92) onEvent?.(target.stage + "-reflector-misdirected");
      }
      return { reflect: aligned };
    }
    onEvent?.(target.stage + "-hit:" + target.nodeId + ":" + (target.ricochets || 0));
    return null;
  }
  function update(dt, elapsed, progress, syncing = false, player = { x: 0, z: 0 }) {
    pulse += dt; receiverArt.update(pulse);
    if (sync !== syncing) {
      sync = syncing;
      adPanels.forEach((panel, index) => { panel.material.map = syncing ? adAlertTexture : textures[index]; panel.material.needsUpdate = true; });
    }
    const completed = [Boolean(progress?.advertisingComplete), Boolean(progress?.trafficComplete), Boolean(progress?.coreComplete)];
    if (lastCompletion && completed.some((value, i) => value && !lastCompletion[i])) {
      const stage = completed.findIndex((value, i) => value && !lastCompletion[i]);
      wave.position.set(stage === 0 ? -53 : stage === 1 ? -32.4 : 0, .13, stage === 0 ? -25.55 : stage === 1 ? -17 : 8.5);
      waveAge = 0; distortion = .7;
    }
    lastCompletion = completed;
    distortion = Math.max(0, distortion - dt * 1.6);
    waveAge += dt;
    wave.visible = waveAge < 1.5;
    if (wave.visible) { wave.scale.setScalar(1 + waveAge * 5); waveMaterial.opacity = .58 * (1 - waveAge / 1.5); }
    adPanels.forEach((panel, index) => {
      panel.visible = syncing || Boolean(progress?.visionActive && progress?.disconnectedMet && !progress?.advertisingComplete);
      panel.material.opacity = .82 + Math.sin(pulse * 2 + index) * .09;
      panel.position.x = panel.userData.baseX + Math.sin(pulse * 24 + index * 4) * distortion * .06;
    });
    for (const item of nodes) {
      const active = stageAvailable(item.stage, progress);
      const completed = item.stage === "traffic" ? progress?.trafficComplete : progress?.coreComplete;
      const charged = completed || (item.stage === "traffic" ? progress?.trafficSequence : progress?.coreSequence)?.includes(item.id);
      const distanceSq = (item.position.x - player.x) ** 2 + (item.position.z - player.z) ** 2;
      receiverArt.updateDevice(item.art, { active, charged, nearby: distanceSq < 65 ** 2, phase: item.position.x });
      item.label.visible = Boolean(active);
      if (item.panel) {
        const aligned = item.stage === "traffic" ? progress?.trafficReflectorAligned : progress?.coreReflectorAligned;
        const angle = aligned ? Math.PI * .75 : Math.PI * .5;
        item.panel.rotation.y = !item.poseInitialized ? angle : THREE.MathUtils.damp(item.panel.rotation.y, angle, 5, Math.max(0, dt));
        item.poseInitialized = true;
      }
    }
    for (const [stage, guide] of Object.entries(bounceGuides)) {
      const sequence = stage === "traffic" ? progress?.trafficSequence : progress?.coreSequence;
      const aligned = stage === "traffic" ? progress?.trafficReflectorAligned : progress?.coreReflectorAligned;
      guide.group.visible = Boolean(stageAvailable(stage, progress) && sequence?.length === 1);
      guide.lines[1].visible = guide.arrow.visible = guide.pulseOrb.visible = Boolean(aligned);
      if (aligned) guide.pulseOrb.position.copy(guide.mirror.position)
        .lerp(guide.destination.position, (pulse * .36) % 1);
      guide.ring.material.opacity = .62 + .16 * Math.sin(pulse * 3);
    }
    exposedCore.visible = Boolean(progress?.coreComplete);
    exposedCore.rotation.y += dt * .25;
    anomalyPanels.forEach(mesh => { mesh.visible = syncing; mesh.material.opacity = .83 + .1 * Math.sin(pulse * 2); });
    if (forceField?.surface) {
      const strength = forceField.surface.material.uniforms.uStrength;
      if (strength) {
        if (!fieldInitialized && progress?.coreComplete) strength.value = .03;
        else strength.value = THREE.MathUtils.damp(strength.value, progress?.coreComplete ? .03 : 1, 2.4, Math.max(0, dt));
      }
      fieldInitialized = true;
      forceField.surface.visible = !progress?.coreComplete || (strength?.value ?? 1) > .05;
      forceField.root.visible = forceField.surface.visible;
    }
  }
  return { interactions, getTargets, registerImpact, update, exposedCore, flash, applyQuality: receiverArt.applyQuality,
    dispose() { receiverArt.dispose(); textures.forEach(texture => texture.dispose()); panelGeo.dispose(); waveGeometry.dispose(); waveMaterial.dispose(); } };
}
