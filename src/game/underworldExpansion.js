import * as THREE from "three";
import { createUnderworldCraft } from "./underworldCraft.js";
import { createUnderworldRelic } from "./underworldRelics.js";
import { createUnderworldRitual } from "./underworldRitual.js";

const FLAMES = [
  [-2.35, 5.4], [2.35, 5.4], [-2.35, -1.1],
  [2.35, -1.1], [-2.35, -7.6], [2.35, -7.6],
];
const BRIDGE_ROWS = [
  { z: -16.5, safe: -0.82 }, { z: -19.0, safe: 0.82 },
  { z: -21.5, safe: 0.82 }, { z: -24.0, safe: -0.82 },
  { z: -26.5, safe: 0.82 }, { z: -29.0, safe: -0.82 },
];
const BOAT_START = { x: 4.28, z: -11.3 };
const BOAT_END = { x: 4.55, z: -33.2 };
const SYMBOLS = [
  { id: "memory", x: -1.3, z: 9.5, color: 0x98f2da },
  { id: "oblivion", x: -0.6, z: -9.25, color: 0xc07dff },
  { id: "rebirth", x: -0.15, z: -12.4, color: 0xffa96d },
];
const RUNES = [
  { x: -2.85, z: -44.7 }, { x: 2.75, z: -43.9 }, { x: 0, z: -43.4 },
];
const RING_X = [-4.7, -3.25, -1.8];
const RING_IDS = ["memory", "oblivion", "rebirth"];

function torus(radius, tube, color, opacity = 1) {
  return new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 28),
    new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity,
      depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
}

export function createUnderworldExpansion(root, onEvent, onDamage) {
  const group = new THREE.Group();
  group.name = "Capítulo 11 / pruebas del puente, barca y escudo";
  root.add(group);
  const stone = new THREE.MeshStandardMaterial({ color: 0x292128, roughness: .88, metalness: .1 });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x5cf0e8, transparent: true, opacity: .74, depthWrite: false, toneMapped: false });
  const red = new THREE.MeshBasicMaterial({ color: 0xff493f, transparent: true, opacity: .65, depthWrite: false, toneMapped: false });
  const violet = new THREE.MeshBasicMaterial({ color: 0xa373f2, transparent: true, opacity: .32, depthWrite: false, toneMapped: false });
  const craft = createUnderworldCraft(group, FLAMES);
  const { boat } = craft;
  const rows = BRIDGE_ROWS.map(({ z, safe }, index) => {
    const row = new THREE.Group();
    row.name = "Puente inestable / sección " + (index + 1);
    row.position.z = z;
    const safeMark = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 2.2), cyan);
    safeMark.rotation.x = -Math.PI / 2; safeMark.position.set(safe, .045, 0); row.add(safeMark);
    const danger = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.2), index % 3 === 2 ? violet : red);
    danger.rotation.x = -Math.PI / 2; danger.position.set(-safe, .045, 0); row.add(danger);
    const crack = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.3, .025, 2.05)),
      new THREE.LineBasicMaterial({ color: index % 3 === 2 ? 0xbf76ff : 0xff3f30, transparent: true, opacity: .7 }));
    crack.position.set(-safe, .07, 0); row.add(crack);
    group.add(row);
    return { row, safeMark, danger, crack, safe, z };
  });
  const shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(.12, 0),
    new THREE.MeshBasicMaterial({ color: 0xff7155, transparent: true, opacity: .42, toneMapped: false }), 12);
  shards.name = "Fragmentos de las grietas";
  shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(shards);
  const shardDummy = new THREE.Object3D();
  const symbols = SYMBOLS.map((config, index) => {
    const relic = createUnderworldRelic(config, index);
    group.add(relic.root);
    return { ...config, relic };
  });
  boat.position.set(BOAT_START.x, .12, BOAT_START.z);
  const ritualCraft = createUnderworldRitual(group, RING_X, RING_IDS);
  const ritual = ritualCraft.root;
  const rings = ritualCraft.rings;
  const mistakePulse = torus(1.15, .045, 0xff5148, .34);
  mistakePulse.name = "Pulso rojo / secuencia incorrecta";
  mistakePulse.rotation.x = Math.PI / 2;
  mistakePulse.position.set(-3.25, .09, 0);
  mistakePulse.visible = false;
  ritual.add(mistakePulse);
  const energyBridge = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 15),
    new THREE.MeshBasicMaterial({ color: 0x54e6ed, transparent: true, opacity: .22, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  energyBridge.name = "Puente de energía / regreso";
  energyBridge.rotation.x = -Math.PI / 2;
  energyBridge.position.set(0, .1, -23);
  energyBridge.visible = false; group.add(energyBridge);
  const shield = new THREE.Mesh(new THREE.SphereGeometry(1.65, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xa83441, transparent: true, opacity: .075,
      depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  shield.name = "Escudo del Testigo";
  const shieldShell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.68, 2),
    new THREE.MeshBasicMaterial({ color: 0xff8870, wireframe: true,
      transparent: true, opacity: .27, depthWrite: false, toneMapped: false }));
  shieldShell.name = "Malla fracturable / escudo";
  shield.add(shieldShell);
  const shieldBand = torus(1.46, .018, 0xff9177, .33);
  shieldBand.rotation.x = .55;
  shield.add(shieldBand);
  shield.visible = false; group.add(shield);
  const groundWarning = torus(1.3, .045, 0xff4d3a, .45);
  groundWarning.name = "Onda de advertencia / Testigo";
  groundWarning.rotation.x = Math.PI / 2;
  groundWarning.visible = false; group.add(groundWarning);
  const runes = RUNES.map((config, index) => {
    const rune = new THREE.Group();
    rune.name = "Runa del Testigo " + (index + 1);
    const rim = torus(.34, .045, 0xff8d76, .9);
    const inner = torus(.2, .023, 0xffd4bc, .8);
    inner.rotation.z = Math.PI / 4;
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(.115, 0),
      new THREE.MeshBasicMaterial({ color: 0xffb6a1, toneMapped: false }));
    rune.add(rim, inner, core);
    rune.position.set(config.x, 1.25, config.z); rune.visible = false; group.add(rune);
    return { ...config, rune, rim, index };
  });
  const boatObstacle = { x: BOAT_START.x, z: BOAT_START.z, hx: .88, hz: 2.1 };
  const obstacles = [
    ...FLAMES.map(([x, z]) => ({ x, z, radius: .34 })),
    ...RING_X.map((x) => ({ x, z: -35.6, radius: .52 })),
    boatObstacle,
  ];
  const interactions = [
    ...FLAMES.map(([x, z], index) => ({ id: "flame-" + index, label: "Activar llama " + (index + 1), x, z, reach: 0 })),
    { id: "memory-inscription", label: "Examinar inscripción de la Memoria", x: SYMBOLS[0].x, z: SYMBOLS[0].z, reach: 0 },
    { id: "memory-symbol", label: "Recoger símbolo de la Memoria", x: SYMBOLS[0].x, z: SYMBOLS[0].z, reach: 0 },
    { id: "oblivion-symbol", label: "Recoger símbolo del Olvido", x: SYMBOLS[1].x, z: SYMBOLS[1].z, reach: 0 },
    { id: "ferry", label: "Abordar la barca infernal", x: 2.55, z: -11.3, reach: 0 },
    { id: "ritual-inscription", label: "Leer inscripción de las Tres Almas", x: -3.25, z: -34.55, reach: 0 },
    ...RING_IDS.map((id, index) => ({ id: "ring-" + id, label: "Activar anillo del " + ({ memory: "Memoria", oblivion: "Olvido", rebirth: "Renacimiento" }[id]), x: RING_X[index], z: -35.6, reach: 0 })),
    { id: "rebirth-seal", label: "Examinar s\u00edmbolo del Renacimiento", x: SYMBOLS[2].x, z: SYMBOLS[2].z, reach: 0 },
  ];
  let boatAge = 0, hazardAge = 0, hazardCooldown = 0, lastSafe = { x: 0, z: -15.1 };
  let lastFerryStarted = false, shieldWasActive = false, shieldBreakAge = 0;
  let ringMistakesSeen = null, mistakePulseAge = 0;

  function getTargets(progress) {
    const targets = [];
    if (progress?.ferrymanTrialStarted && !progress.memorySymbols.includes("rebirth"))
      targets.push({ id: "underworld-rebirth", position: new THREE.Vector3(SYMBOLS[2].x, 1.8, SYMBOLS[2].z), radius: .75 });
    if (progress?.shieldActive && progress.visionActive)
      for (const { x, z, index } of runes) if (!progress.witnessRunes.includes(index))
        targets.push({ id: "underworld-rune-" + index, position: new THREE.Vector3(x, 1.25, z), radius: .48 });
    return targets;
  }
  function registerImpact(target) {
    if (target?.id === "underworld-rebirth") onEvent?.("symbol-rebirth");
    if (target?.id?.startsWith("underworld-rune-")) onEvent?.("witness-rune-hit", Number(target.id.at(-1)));
  }
  function update(dt, elapsed, progress, player, paused, actorPosition, reducedMotion = false, frameSeconds = dt) {
    if (!progress || !player) return;
    const step = paused ? 0 : Math.min(dt, .05);
    const travelStep = paused ? 0 : Math.min(Math.max(frameSeconds, 0), .25);
    const ready = progress.flames.length === 6;
    FLAMES.forEach((_, index) => {
      interactions[index].reach = !progress.flames.includes(index) ? 1.65 : 0;
    });
    rows.forEach(({ row, safeMark, danger, crack }, index) => {
      row.visible = ready && !progress.bridgeTrialComplete;
      safeMark.visible = progress.visionActive;
      danger.material.opacity = progress.visionActive ? .5 : .14;
      crack.material.opacity = .46 + Math.sin(elapsed * 3 + index) * .15;
    });
    shards.visible = ready && !progress.bridgeTrialComplete;
    if (shards.visible) {
      for (let i = 0; i < 12; i++) {
        const row = rows[Math.floor(i / 2)];
        shardDummy.position.set(-row.safe + (i % 2 ? .31 : -.31),
          .13 + (reducedMotion ? 0 : Math.sin(elapsed * 1.8 + i) * .055),
          row.z + (i % 2 ? .65 : -.65));
        shardDummy.rotation.set(i * .37, reducedMotion ? 0 : elapsed * .25 + i, 0);
        shardDummy.scale.setScalar(.75 + (i % 3) * .18);
        shardDummy.updateMatrix();
        shards.setMatrixAt(i, shardDummy.matrix);
      }
      shards.instanceMatrix.needsUpdate = true;
    }
    const symbolReady = progress.ferrymanTrialStarted;
    symbols.forEach(({ id, relic }) => {
      relic.root.visible = symbolReady && !progress.memorySymbols.includes(id)
        && (id !== "oblivion" || progress.visionActive);
      if (relic.root.visible) relic.update(elapsed, reducedMotion);
    });
    interactions[6].reach = symbolReady && !progress.memoryClueRead ? 1.8 : 0;
    interactions[7].reach = symbolReady && progress.memoryClueRead && !progress.memorySymbols.includes("memory") ? 1.8 : 0;
    interactions[8].reach = symbolReady && progress.visionActive && !progress.memorySymbols.includes("oblivion") ? 1.8 : 0;
    interactions[14].reach = symbolReady && !progress.memorySymbols.includes("rebirth") ? 2.1 : 0;
    interactions[9].reach = progress.memorySymbols.length === 3 && !progress.ferryCompleted && !progress.ferryStarted ? 2.1 : 0;
    interactions[10].reach = progress.ferryCompleted ? 1.6 : 0;
    for (let i = 0; i < 3; i++) {
      interactions[11 + i].reach = progress.ferryCompleted && !progress.mechanismSolved ? 1.55 : 0;
      rings[i].update(elapsed, step, progress.mechanismSolved || i < progress.ringSequence.length, reducedMotion);
    }
    if (ringMistakesSeen === null) ringMistakesSeen = progress.ringMistakeCount;
    else if (progress.ringMistakeCount !== ringMistakesSeen) {
      ringMistakesSeen = progress.ringMistakeCount;
      mistakePulseAge = .65;
    }
    mistakePulseAge = Math.max(0, mistakePulseAge - Math.min(dt, .05));
    mistakePulse.visible = mistakePulseAge > 0;
    mistakePulse.scale.setScalar(1 + (1 - mistakePulseAge / .65) * 1.25);
    mistakePulse.material.opacity = .4 * mistakePulseAge / .65;
    energyBridge.visible = progress.mechanismSolved;
    if (progress.ferryStarted && !progress.ferryCompleted) {
      if (!lastFerryStarted) { boatAge = 0; lastFerryStarted = true; }
      boatAge = Math.min(11, boatAge + travelStep);
      const t = boatAge / 11;
      const eased = t * t * (3 - 2 * t);
      boat.position.x = THREE.MathUtils.lerp(BOAT_START.x, BOAT_END.x, eased) + Math.sin(t * Math.PI) * .65;
      boat.position.z = THREE.MathUtils.lerp(BOAT_START.z, BOAT_END.z, eased);
      boat.position.y = .12 + (reducedMotion ? 0 : Math.sin(craft.time * 2) * .025);
      boat.rotation.y = Math.sin(t * Math.PI) * -.09;
      const disembark = Math.max(0, (t - .88) / .12);
      player.x = boat.position.x + disembark * 1.15;
      player.z = boat.position.z - disembark * 2.7;
      player.y = .22 * (1 - disembark);
      player.grounded = true;
      player.velocityY = 0;
      if (t >= 1) {
        player.x = BOAT_END.x + 1.15; player.z = BOAT_END.z - 2.7; player.y = 0;
        onEvent?.("ferry-complete");
      }
    } else {
      lastFerryStarted = false;
      boat.position.set(progress.ferryCompleted ? BOAT_END.x : BOAT_START.x, .12 + (reducedMotion ? 0 : Math.sin(craft.time * 2) * .018),
        progress.ferryCompleted ? BOAT_END.z : BOAT_START.z);
    }
    boat.rotation.z = reducedMotion ? 0 : Math.sin(craft.time * 1.25) * .009;
    craft.update(frameSeconds, progress, player, paused, reducedMotion);
    boatObstacle.x = boat.position.x;
    boatObstacle.z = boat.position.z;
    if (shieldWasActive && !progress.shieldActive) shieldBreakAge = .65;
    shieldWasActive = progress.shieldActive;
    shieldBreakAge = Math.max(0, shieldBreakAge - Math.min(dt, .05));
    shield.visible = progress.shieldActive || shieldBreakAge > 0;
    groundWarning.visible = progress.shieldActive;
    if (shield.visible) {
      const witness = actorPosition?.("underworld-testigo");
      if (witness) {
        shield.position.set(witness.x, 1.42, witness.z);
        groundWarning.position.set(witness.x, .065, witness.z);
      }
      shield.material.opacity = progress.shieldActive
        ? .075 + (reducedMotion ? 0 : Math.sin(elapsed * 3.3) * .012)
        : .13 * shieldBreakAge / .65;
      shieldShell.material.opacity = progress.shieldActive
        ? .23 + (reducedMotion ? 0 : Math.sin(elapsed * 2.1) * .035)
        : .4 * shieldBreakAge / .65;
      shieldShell.rotation.z += step * .21;
      shieldBand.rotation.z += step * .17;
      shield.scale.setScalar(progress.shieldActive ? 1 : 1 + (1 - shieldBreakAge / .65) * .42);
      shield.rotation.y += step * .3;
      groundWarning.scale.setScalar(reducedMotion ? 1 : 1 + Math.sin(elapsed * 2.3) * .15);
    }
    runes.forEach(({ rune, rim, index }) => {
      rune.visible = progress.shieldActive && progress.visionActive && !progress.witnessRunes.includes(index);
      rune.rotation.z += step * .75;
      rim.material.opacity = .68 + (reducedMotion ? 0 : Math.sin(elapsed * 2.4 + index) * .15);
    });
    if (!paused && ready && !progress.bridgeTrialComplete && player.z < -15.2 && player.z > -30.3) {
      const row = rows.find(({ z }) => Math.abs(player.z - z) < 1.16);
      if (row) {
        if (Math.abs(player.x - row.safe) < .72) {
          lastSafe = { x: row.safe, z: Math.max(row.z + 1.22, -29.6) };
          hazardAge = 0;
        } else {
          hazardAge += step;
          if (hazardAge > .22 && hazardCooldown <= 0) {
            onDamage?.(1);
            player.x = lastSafe.x; player.z = lastSafe.z; player.y = 0;
            hazardCooldown = 1.35; hazardAge = 0;
          }
        }
      }
    } else hazardAge = 0;
    hazardCooldown = Math.max(0, hazardCooldown - step);
    if (!progress.bridgeTrialComplete && ready && player.z < -29.6 && Math.abs(player.x + .82) < .73)
      onEvent?.("bridge-trial-complete");
  }
  function dispose() {
    symbols.forEach(({ relic }) => relic.dispose());
    ritualCraft.dispose();
    craft.dispose();
    const geometries = new Set(), materials = new Set();
    group.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    group.removeFromParent();
  }
  return { interactions, obstacles, getTargets, registerImpact, update, dispose, loadAssets: craft.loadAssets,
    get transporting() { return lastFerryStarted; },
    get boatPosition() { return boat.position; },
  };
}
