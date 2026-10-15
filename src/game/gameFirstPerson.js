import * as THREE from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { createHandGrip } from "./gameGrip.js";
import { createWeaponModel } from "./gameWeapons.js";
import { ATTACKS, attackEnvelope } from "./gameRules.js";
import { hammerMotion } from "./gameHammerMotion.js";

// Bake the textured limbs from NeonBoy's skinned model for the weapon camera.
function bakeLimb(model, toOrigin, bonePattern) {
  const result = new THREE.Group(), point = new THREE.Vector3();
  model.traverse((mesh) => {
    if (!mesh.isSkinnedMesh) return;
    const source = mesh.geometry, skin = source.attributes.skinIndex, weight = source.attributes.skinWeight;
    const limbBones = new Set(mesh.skeleton.bones.map((bone, i) => bonePattern.test(bone.name) ? i : -1));
    limbBones.delete(-1);
    const selected = new Uint8Array(skin.count);
    for (let i = 0; i < skin.count; i++) {
      let influence = 0;
      for (let j = 0; j < 4; j++) if (limbBones.has(skin.getComponent(i, j))) influence += weight.getComponent(i, j);
      selected[i] = influence > 0.5 ? 1 : 0;
    }
    const indices = source.index?.array || Array.from({ length: skin.count }, (_, i) => i);
    const positions = [], uvs = [], triangles = [], vertices = new Map();
    mesh.skeleton.update();
    const transform = toOrigin.clone().multiply(mesh.matrixWorld);
    for (let i = 0; i < indices.length; i += 3) {
      if (!selected[indices[i]] || !selected[indices[i + 1]] || !selected[indices[i + 2]]) continue;
      for (let j = 0; j < 3; j++) {
        const index = indices[i + j];
        if (!vertices.has(index)) {
          vertices.set(index, positions.length / 3);
          mesh.getVertexPosition(index, point).applyMatrix4(transform);
          positions.push(point.x, point.y, point.z);
          if (source.attributes.uv) uvs.push(source.attributes.uv.getX(index), source.attributes.uv.getY(index));
        }
        triangles.push(vertices.get(index));
      }
    }
    if (!positions.length) return;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    if (uvs.length) geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(triangles);
    geometry.computeVertexNormals();
    const limb = new THREE.Mesh(geometry, mesh.material);
    limb.userData.sharedFirstPersonMaterial = true;
    limb.frustumCulled = false; result.add(limb);
  });
  return result;
}

function scaledAvatar(asset) {
  const model = clone(asset.scene);
  model.scale.multiplyScalar(1.85 / new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).y);
  model.updateMatrixWorld(true);
  return model;
}

function disposeAvatarSkeletons(model) {
  const skeletons = new Set();
  model.traverse((mesh) => { if (mesh.skeleton) skeletons.add(mesh.skeleton); });
  skeletons.forEach((skeleton) => skeleton.dispose());
}

function createArmTemplate(asset) {
  const model = scaledAvatar(asset);
  const grip = createHandGrip(model, model.getObjectByName("mixamorigRightHand"));
  grip.update(1); model.updateMatrixWorld(true);
  const result = bakeLimb(model, grip.socket.matrixWorld.clone().invert(), /Right(?:Hand|ForeArm)$/);
  grip.dispose();
  disposeAvatarSkeletons(model);
  return result;
}

function createKickTemplate(asset) {
  const model = scaledAvatar(asset);
  const foot = model.getObjectByName("mixamorigRightFoot");
  const footPosition = foot.getWorldPosition(new THREE.Vector3());
  // Flip the standing shin below the camera while keeping the toe aimed forward.
  const toFoot = new THREE.Matrix4().makeRotationZ(Math.PI).multiply(
    new THREE.Matrix4().makeTranslation(-footPosition.x, -footPosition.y, -footPosition.z));
  const result = bakeLimb(model, toFoot, /Right(?:Leg|Foot|ToeBase|Toe_End)$/);
  disposeAvatarSkeletons(model);
  return result;
}

// Render the held equipment separately so nearby walls cannot cut through the hands.
// World geometry still determines collisions and every projectile hit.
export function createFirstPersonView(templates, environment, playerAsset) {
  const scene = new THREE.Scene();
  scene.name = "Armas en primera persona";
  scene.environment = environment;
  scene.environmentIntensity = 0.4;
  const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 10);
  const rig = new THREE.Group(); scene.add(rig);
  scene.add(new THREE.HemisphereLight(0xcbd9eb, 0x514239, 1.8));
  const key = new THREE.DirectionalLight(0xffe7c6, 3.2); key.position.set(-2, 3, 2); scene.add(key);
  const rim = new THREE.DirectionalLight(0xab9dcc, 1.6); rim.position.set(2, 1, -3); scene.add(rim);
  const armTemplate = createArmTemplate(playerAsset);
  function hand(side) {
    const group = new THREE.Group(); group.name = "Guante " + side;
    const arm = armTemplate.clone(true);
    if (side === "izquierdo") arm.scale.x = -1;
    arm.rotation.y = side === "izquierdo" ? -Math.PI / 2 : Math.PI / 2;
    group.add(arm); rig.add(group); return group;
  }
  const right = hand("derecho"), left = hand("izquierdo");
  const weapons = {};
  for (const [kind, template] of Object.entries(templates)) {
    if (!["sword", "hammer", "axe", "crossbow"].includes(kind)) continue;
    const model = createWeaponModel(kind, template);
    model.scale.setScalar(kind === "crossbow" ? 1 : 0.54);
    if (kind === "crossbow") { model.rotation.y = -Math.PI / 2; model.position.set(0, 0.035, -0.16); }
    model.traverse((mesh) => { if (mesh.isMesh) { mesh.castShadow = mesh.receiveShadow = false; mesh.frustumCulled = false; } });
    model.visible = false; right.add(model); weapons[kind] = model;
  }
  const boot = createKickTemplate(playerAsset);
  boot.name = "Patada en primera persona"; rig.add(boot);
  const smooth = (value) => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t); };
  let equipped = null, switchTime = 1, stride = 0, sway = 0, lastYaw = null;
  const reduceMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return {
    scene, camera, rig,
    update(player, dt, yaw, aspect) {
      const framing = Math.max(1, 1.25 / aspect);
      const fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(27.5)) * framing));
      if (camera.aspect !== aspect || camera.fov !== fov) {
        camera.aspect = aspect;
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      if (equipped !== player.equipped) { equipped = player.equipped; switchTime = 0; }
      switchTime = Math.min(1, switchTime + dt * 5);
      stride += dt * (player.running ? 12 : 8);
      const walking = player.grounded ? Math.min(1, (player.speed || 0) / 2.8) : 0;
      const turn = lastYaw === null || !dt ? 0 : THREE.MathUtils.clamp((yaw - lastYaw) / dt, -2, 2);
      lastYaw = yaw;
      sway = THREE.MathUtils.lerp(sway, turn * 0.016, 1 - Math.exp(-12 * dt));
      rig.position.set(reduceMotion ? 0 : Math.sin(stride) * 0.012 * walking + sway,
        -0.12 * (framing - 1) - ((1 - switchTime) ** 2) * 0.25 + (reduceMotion ? 0 : Math.cos(stride * 2) * 0.008 * walking), 0);
      rig.rotation.z = 0;
      const ranged = equipped === "crossbow", unarmed = equipped === "unarmed";
      right.position.set(ranged ? 0.13 : unarmed ? 0.23 : 0.26, ranged ? -0.25 : -0.28, ranged ? -0.55 : -0.66);
      right.rotation.set(unarmed ? -0.2 : 0.04, unarmed ? -0.16 : 0, ranged ? -0.1 : -0.22);
      left.position.set(ranged ? 0.025 : -0.25, ranged ? -0.28 : -0.3, ranged ? -0.87 : -0.68);
      left.rotation.set(ranged ? 0.08 : -0.2, 0.16, ranged ? 0.15 : 0.25);
      left.visible = unarmed || ranged;
      for (const [kind, model] of Object.entries(weapons)) model.visible = kind === equipped;
      const attack = player.attack;
      boot.visible = attack?.kind === "kick";
      if (!attack) return;
      const power = attackEnvelope(attack.kind, attack.elapsed);
      if (attack.kind === "hammer") {
        const { windup, slam, jolt } = hammerMotion(attack.elapsed);
        right.position.x += windup * 0.16 - slam * 0.28;
        right.position.y += windup * 0.31 + slam * 0.32;
        right.position.z += windup * 0.08 - slam * 0.26;
        right.rotation.x -= windup * 0.95;
        right.rotation.x += slam * 1.55;
        right.rotation.z -= windup * 0.33;
        right.rotation.z += slam * 0.5;
        rig.position.y -= slam * 0.045 + jolt * 0.035;
        rig.rotation.z = jolt * -0.025;
      } else if (attack.kind === "crossbow") {
        const recoil = Math.max(0, 1 - Math.max(0, attack.elapsed - ATTACKS.crossbow.impact) / 0.28);
        if (attack.elapsed >= ATTACKS.crossbow.impact) { right.position.z += recoil * 0.1; right.rotation.x += recoil * 0.16; left.position.z += recoil * 0.06; }
      } else if (attack.kind === "kick") {
        const windup = smooth(attack.elapsed / 0.14) * (1 - smooth((attack.elapsed - 0.17) / 0.16));
        const drive = smooth((attack.elapsed - 0.17) / (ATTACKS.kick.impact - 0.17)) *
          (1 - smooth((attack.elapsed - ATTACKS.kick.impact) / (ATTACKS.kick.duration - ATTACKS.kick.impact)));
        boot.position.set(0.075 + drive * 0.045, -0.84 + windup * 0.2 + drive * 0.78,
          -0.42 + windup * 0.1 - drive * 0.68);
        boot.rotation.set(-0.55 - windup * 0.4 + drive * 0.15, -0.42 * drive, 0.08 * drive);
        right.position.x += 0.05 * drive; left.position.x -= 0.05 * drive;
        right.position.y -= 0.1 * drive; left.position.y -= 0.1 * drive;
        rig.position.y -= drive * 0.055;
        rig.rotation.z = -drive * 0.018;
      } else if (attack.kind === "punch") {
        const windup = smooth(attack.elapsed / 0.075) * (1 - smooth((attack.elapsed - 0.105) / 0.085));
        const drive = smooth((attack.elapsed - 0.1) / (ATTACKS.punch.impact - 0.1)) *
          (1 - smooth((attack.elapsed - ATTACKS.punch.impact) / (ATTACKS.punch.duration - ATTACKS.punch.impact)));
        const isLeft = attack.side === "Left";
        const fist = isLeft ? left : right, guard = isLeft ? right : left;
        fist.position.x += (isLeft ? -1 : 1) * windup * 0.1 - fist.position.x * drive * 0.84;
        fist.position.y += windup * 0.035 + drive * 0.22;
        fist.position.z += windup * 0.16 - drive * 0.69;
        fist.rotation.x -= windup * 0.28;
        fist.rotation.x += drive * 0.15;
        fist.rotation.z += (isLeft ? -1 : 1) * drive * 0.24;
        guard.position.z += windup * 0.06;
        rig.position.z -= drive * 0.045;
        rig.rotation.z = (isLeft ? 1 : -1) * drive * 0.018;
      } else {
        const strike = ATTACKS[attack.kind];
        const windup = Math.sin(Math.min(1, attack.elapsed / strike.impact) * Math.PI);
        right.position.x += windup * 0.09 - power * 0.16;
        right.position.y += windup * 0.12;
        right.rotation.x -= power * 1.25;
        right.rotation.z += windup * 0.4 + power * 0.8;
        right.position.z -= power * 0.08;
      }
    },
    render(renderer) {
      const autoClear = renderer.autoClear;
      renderer.autoClear = false; renderer.clearDepth(); renderer.render(scene, camera); renderer.autoClear = autoClear;
    },
    dispose() {
      const geometries = new Set(), materials = new Set(), skeletons = new Set();
      scene.traverse((object) => {
        if (object.skeleton) skeletons.add(object.skeleton);
        if (object.userData.sharedGameAsset) return;
        if (object.geometry) geometries.add(object.geometry);
        if (object.userData.sharedFirstPersonMaterial) return;
        for (const material of [object.material].flat().filter(Boolean)) materials.add(material);
      });
      skeletons.forEach((value) => value.dispose());
      geometries.forEach((value) => value.dispose());
      materials.forEach((value) => value.dispose());
      scene.clear();
    }
  };
}
