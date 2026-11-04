import { createHolographicGroundRing } from './holographicGroundRing.js';
import * as THREE from "three";
import { createOrbGlowTexture, createPlasmaOrb } from "./neonOrbVisuals.js";

const NODE_POSITIONS = [
  [11.35, 1.6, -14.92],
  [15.55, 1.65, -17.5],
  [10.35, 1.65, -20.21],
];

// The trial is part of the ship scene. Its targets expose a small hit contract
// so the same orb can be used by future scenes without depending on ship state.
export function buildLostShipOrbTrial(root, { box, wall, floor, obstacles, onCombatDamage }) {
  floor("resonance deck", 12.5, -18.7, 7, 8.6);
  wall("resonance entrance", 12.5, -14.4, 7, .36);
  wall("resonance outer", 16, -18.7, .36, 8.6);
  wall("resonance stern", 12.5, -23, 7, .36);
  wall("resonance partition left", 10, -20.6, 2, .3);
  wall("resonance partition right", 15, -20.6, 2, .3);

  const trialLight = new THREE.PointLight(0xe679e0, 8, 9, 2);
  trialLight.position.set(12.5, 3, -18.2);
  root.add(trialLight);
  const metal = new THREE.MeshStandardMaterial({ color: 0x17263b, metalness: .78, roughness: .3 });
  const pink = new THREE.MeshBasicMaterial({ color: 0xe138b0, toneMapped: false });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x83f5ff, toneMapped: false });
  const enemyMat = new THREE.MeshStandardMaterial({ color: 0x43215b, emissive: 0x9c2298, emissiveIntensity: .65, transparent: true, opacity: .9, roughness: .32 });
  const glowTexture = createOrbGlowTexture();
  const housingMaterial = new THREE.MeshStandardMaterial({ color: 0x182535, metalness: .82, roughness: .38 });
  const bezelMaterial = new THREE.MeshStandardMaterial({ color: 0x637688, metalness: .88, roughness: .27 });
  const recessMaterial = new THREE.MeshStandardMaterial({ color: 0x060d1a, metalness: .5, roughness: .26 });
  const housingGeometry = new THREE.CylinderGeometry(.57, .57, .13, 64);
  const recessGeometry = new THREE.CylinderGeometry(.385, .385, .025, 64);
  const bezelGeometry = new THREE.TorusGeometry(.525, .028, 8, 64);
  const innerBezelGeometry = new THREE.TorusGeometry(.33, .012, 6, 64);
  const boltGeometry = new THREE.CylinderGeometry(.021, .021, .022, 6);
  boltGeometry.rotateX(Math.PI / 2);
  const tickGeometry = new THREE.BoxGeometry(.023, .063, .018);
  const pulseGeometry = new THREE.TorusGeometry(.35, .012, 6, 64);
  const labelGeometry = new THREE.PlaneGeometry(.9, .18);
  const matrix = new THREE.Matrix4();
  const nodes = NODE_POSITIONS.map(([x, y, z], index) => {
    const group = new THREE.Group();
    group.name = "orb-frequency-node-" + (index + 1);
    group.position.set(x, y, z);
    group.rotation.y = index === 0 ? Math.PI : index === 1 ? -Math.PI / 2 : 0;
    const housing = new THREE.Mesh(housingGeometry, housingMaterial);
    housing.rotation.x = Math.PI / 2;
    housing.position.z = -.19;
    housing.castShadow = housing.receiveShadow = true;
    const recess = new THREE.Mesh(recessGeometry, recessMaterial);
    recess.rotation.x = Math.PI / 2;
    recess.position.z = -.108;
    const bezel = new THREE.Mesh(bezelGeometry, bezelMaterial);
    bezel.position.z = -.115;
    const innerBezel = new THREE.Mesh(innerBezelGeometry, bezelMaterial);
    innerBezel.position.z = -.06;
    const bolts = new THREE.InstancedMesh(boltGeometry, bezelMaterial, 8);
    for (let i = 0; i < 8; i += 1) {
      const angle = i * Math.PI / 4 + Math.PI / 8;
      matrix.makeTranslation(Math.sin(angle) * .52, Math.cos(angle) * .52, -.09);
      bolts.setMatrixAt(i, matrix);
    }
    const indicators = new THREE.MeshStandardMaterial({
      color: 0xc77bca, emissive: 0xa82bc4, emissiveIntensity: .6, roughness: .28, metalness: .3,
    });
    const ticks = new THREE.InstancedMesh(tickGeometry, indicators, 24);
    for (let i = 0; i < 24; i += 1) {
      const angle = i * Math.PI / 12;
      matrix.makeRotationZ(-angle);
      matrix.setPosition(Math.sin(angle) * .438, Math.cos(angle) * .438, -.103);
      ticks.setMatrixAt(i, matrix);
    }
    const plasma = createPlasmaOrb({ radius: .215, texture: glowTexture, phase: index * 1.7 });
    plasma.root.position.z = .025;
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: 0x9cfaff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    });
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.position.z = .06;
    pulse.visible = false;
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 102;
    const context = canvas.getContext("2d");
    context.fillStyle = "#0c1723"; context.fillRect(0, 0, 512, 102);
    context.strokeStyle = "#526b80"; context.lineWidth = 4; context.strokeRect(2, 2, 508, 98);
    context.fillStyle = "#b7d3de"; context.font = "bold 24px sans-serif";
    context.fillText("FREQUENCY / 09", 20, 40);
    context.fillStyle = "#7b97a7"; context.font = "18px monospace";
    context.fillText("RECEPTOR DE RESONANCIA", 20, 76);
    context.fillStyle = "#ead5ec"; context.font = "bold 50px sans-serif";
    context.fillText(String(index + 1).padStart(2, "0"), 423, 70);
    const labelTexture = new THREE.CanvasTexture(canvas);
    labelTexture.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Mesh(labelGeometry, new THREE.MeshBasicMaterial({ map: labelTexture }));
    label.position.set(0, -.67, -.09);
    group.add(housing, recess, bezel, innerBezel, bolts, ticks, plasma.root, pulse, label);
    root.add(group);
    return { group, plasma, indicators, pulse, pulseAge: 0, activated: false, position: group.position.clone() };
  });
  const door = box("resonance bulkhead", 3, 3.5, .28, 12.5, 1.75, -20.6, metal, true);
  const doorObstacle = obstacles.at(-1);
  box("resonance lintel", 3.4, .18, .43, 12.5, 3.55, -20.6, pink);
  box("resonance threshold", 3.4, .09, .45, 12.5, .05, -20.6, cyan);
  for (const x of [-1.3, 0, 1.3]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(.055, 2.6, .06), pink);
    line.position.set(x, .05, .17);
    door.add(line);
  }
  const receiver = new THREE.Group();
  receiver.position.set(12.5, 1.36, -22.1);
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(.56, 0), cyan);
  const receiverRing = new THREE.Mesh(new THREE.TorusGeometry(.72, .045, 8, 28), pink);
  receiverRing.rotation.x = Math.PI / 2.8;
  receiver.add(crystal, receiverRing);
  root.add(receiver);
  box("receiver pedestal", 1.2, .72, 1.2, 12.5, .36, -22.1, metal, true);
  const portal = new THREE.Mesh(new THREE.TorusGeometry(1.05, .11, 8, 28), pink);
  portal.position.set(12.5, 2, -22.78);
  root.add(portal);

  const enemy = new THREE.Group();
  enemy.name = "frequency-echo";
  enemy.position.set(13.25, 0, -17.4);
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(.57, 1), enemyMat);
  body.position.y = 1.25;
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.11, 8, 6), cyan);
  eye.position.set(0, 1.34, .49);
  const haloVisual = createHolographicGroundRing({ radius: .75, color: 0xe967bf, secondary: 0xffb9ec });
  const halo = haloVisual.mesh;
  halo.position.y = 1.25;
  enemy.add(body, eye, halo);
  root.add(enemy);
  let invulnerable = 0, burst = 0, attackWindup = 0, attackCooldown = 0;
  const temp = new THREE.Vector3();
  function getTargets(progress) {
    if (!progress?.orbUnlocked) return [];
    const targets = nodes.flatMap((node, index) => progress.orbNodes?.[index] ? [] :
      [{ kind: "orb-node", index, position: node.position, radius: .34 }]);
    if (!progress.orbEnemyDefeated && invulnerable <= 0)
      targets.push({ kind: "orb-enemy", position: temp.set(enemy.position.x, 1.25, enemy.position.z).clone(), radius: .58 });
    if (progress.orbDoorOpen && progress.orbEnemyDefeated && !progress.orbReceiverActivated)
      targets.push({ kind: "orb-receiver", position: receiver.position, radius: .62 });
    return targets;
  }
  function registerImpact(target) {
    if (target.kind === "orb-enemy") { invulnerable = .34; burst = .3; attackWindup = 0; attackCooldown = .9; }
    if (target.kind === "orb-node") nodes[target.index].pulseAge = .65;
    if (target.kind === "orb-receiver") crystal.material = pink;
  }
  function update(dt, elapsed, progress, player) {
    const unlocked = Boolean(progress?.orbUnlocked);
    trialLight.intensity = unlocked ? 7.5 + Math.sin(elapsed * 2.2) * .7 : 2;
    nodes.forEach((node, index) => {
      node.group.visible = unlocked;
      const activated = Boolean(progress?.orbNodes?.[index]);
      if (node.activated !== activated) {
        node.activated = activated;
        node.plasma.setActive(activated);
        node.indicators.color.set(activated ? 0x8bdeec : 0xc77bca);
        node.indicators.emissive.set(activated ? 0x2acadd : 0xa82bc4);
      }
      node.indicators.emissiveIntensity = activated ? 1.15 : .45 + Math.sin(elapsed * 2 + index) * .1;
      node.plasma.update(elapsed, activated ? 1.15 : .65);
      node.pulseAge = Math.max(0, node.pulseAge - dt);
      node.pulse.visible = node.pulseAge > 0;
      node.pulse.scale.setScalar(1 + (1 - node.pulseAge / .65) * 1.3);
      node.pulse.material.opacity = node.pulseAge / .65 * .7;
    });
    const open = Boolean(progress?.orbDoorOpen);
    door.visible = !open;
    doorObstacle.x = open ? 999 : 12.5;
    receiver.visible = open;
    portal.visible = Boolean(progress?.orbReceiverActivated);
    crystal.rotation.y += dt * .8;
    receiverRing.rotation.z += dt * .3;
    const alive = unlocked && !progress?.orbEnemyDefeated;
    enemy.visible = alive || burst > 0;
    invulnerable = Math.max(0, invulnerable - dt);
    burst = Math.max(0, burst - dt);
    attackCooldown = Math.max(0, attackCooldown - dt);
    if (alive) {
      const dx = player.x - enemy.position.x, dz = player.z - enemy.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 4.2 && distance > 1.25 && player.x > 9.15 && player.z < -14.7 && player.z > -20.2) {
        enemy.position.x = THREE.MathUtils.clamp(enemy.position.x + dx / distance * dt * .46, 10.5, 15.15);
        enemy.position.z = THREE.MathUtils.clamp(enemy.position.z + dz / distance * dt * .46, -19.7, -15.15);
      }
      if (invulnerable <= 0 && distance < 1.55 && attackCooldown <= 0 && attackWindup <= 0) attackWindup = .8;
      if (attackWindup > 0) {
        attackWindup = Math.max(0, attackWindup - dt);
        if (attackWindup === 0) {
          if (distance < 1.8) onCombatDamage?.();
          attackCooldown = 2.2;
        }
      }
      body.position.y = 1.25 + Math.sin(elapsed * 2.8) * .13;
      haloVisual.update(dt, { color: attackWindup > 0 ? 0xff635b : 0xe967bf, alert: attackWindup > 0 ? 1 : 0 });
    }
    enemyMat.emissiveIntensity = attackWindup > 0 ? 1.5 + Math.sin(elapsed * 24) * .5 : .65;
    enemyMat.opacity = !alive ? burst / .3 : invulnerable > 0 ? .35 + Math.sin(elapsed * 48) * .25 : .9;
    enemy.scale.setScalar(!alive ? 1 + (1 - burst / .3) * .7 : 1);
    portal.scale.setScalar(1 + Math.sin(elapsed * 3) * .035);
  }
  return { getTargets, registerImpact, update };
}
