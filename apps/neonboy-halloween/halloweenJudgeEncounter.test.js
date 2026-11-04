import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createHalloweenJudgeEncounter, JUDGE_BACK_STAGE, JUDGE_REAR_LOCATIONS } from "./halloweenJudgeEncounter.js";
import { JUDGE_MAX_HEALTH, JUDGE_FURY_HEALTH, JUDGE_QUESTIONS, judgeCombatTuning, judgeAnswer, judgeHit } from "./halloweenJudgeLogic.js";
import { STORE_LAYOUT, STORE_OBSTACLES } from "../../src/game/recordStoreLayout.js";
import { STORE_NPCS } from "../../src/game/recordStoreDialogue.js";

test("the Judge asks five questions and either result proceeds to combat", () => {
  assert.equal(JUDGE_QUESTIONS.length, 5);
  assert.deepEqual(JUDGE_QUESTIONS.map((question) => question.options.length), [3, 3, 3, 3, 3]);
  assert.deepEqual(JUDGE_QUESTIONS.map((question) => question.preferred), [1, 1, 2, 1, 1]);
  assert.equal(judgeAnswer(0, 1).correct, true);
  assert.equal(judgeAnswer(0, 0).correct, false);
  assert.equal(judgeAnswer(5, 0), null);
});

test("the Judge appears and starts combat in the clear rear aisle", () => {
  const judge = createHalloweenJudgeEncounter(new THREE.Scene());
  judge.setPhase("spawning");
  assert.deepEqual([judge.position.x, judge.position.z], [JUDGE_BACK_STAGE.x, JUDGE_BACK_STAGE.z]);
  judge.setPhase("outcome");
  judge.setPhase("combat");
  assert.deepEqual([judge.position.x, judge.position.z], [JUDGE_BACK_STAGE.x, JUDGE_BACK_STAGE.z]);
  assert.equal(judge.getTarget()?.kind, "judge-of-abyss");
  judge.dispose();
});

test("every Judge teleport location has room for his body and avoids the shop characters", () => {
  for (const [x, z] of JUDGE_REAR_LOCATIONS) {
    assert.ok(Math.abs(x) < STORE_LAYOUT.playerLimitX - .8);
    assert.ok(z > STORE_LAYOUT.playerBackZ + .7 && z < -8.5);
    assert.equal(STORE_OBSTACLES.some((obstacle) =>
      Math.abs(x - obstacle.x) < obstacle.hx + 1.15 &&
      Math.abs(z - obstacle.z) < obstacle.hz + 1.15), false);
    assert.equal(STORE_NPCS.some((npc) => Math.hypot(x - npc.x, z - npc.z) < 2.1), false);
  }
});

test("one orb shot removes one of seven health points and fury begins once", () => {
  const scene = new THREE.Scene();
  const hits = [], events = [];
  const judge = createHalloweenJudgeEncounter(scene, { onHit: (health) => hits.push(health), onEvent: (event) => events.push(event) });
  assert.equal(judge.getTarget(), null);
  judge.setPhase("combat");
  assert.equal(judge.getTarget()?.kind, "judge-of-abyss");
  for (let health = JUDGE_MAX_HEALTH - 1; health >= 0; health--) {
    judge.armShot();
    assert.equal(judge.hit(1000 + (JUDGE_MAX_HEALTH - health) * 400), health);
    assert.equal(judge.hit(2000 + (JUDGE_MAX_HEALTH - health) * 400), null);
  }
  assert.deepEqual(hits, [6, 5, 4, 3, 2, 1, 0]);
  assert.equal(events.filter((event) => event === "fury").length, 1);
  assert.equal(judge.getTarget(), null);
  assert.equal(judgeHit(0), null);
  judge.dispose();
});

test("combat keeps attacking after teleport and still announces a close-range wave", () => {
  const events = [];
  const player = { x: 0, y: 0, z: -7.8 };
  let judge;
  judge = createHalloweenJudgeEncounter(new THREE.Scene(), {
    onEvent(event) {
      events.push(event);
      if (event === "teleport-out") {
        assert.equal(judge.root.visible, false, "the Judge actually disappears");
        assert.equal(judge.getTarget(), null, "an invisible Judge cannot be hit");
        judge.armShot();
        assert.equal(judge.hit(5000), null, "a shot cannot damage him during a vanish");
      }
      if (event === "teleport-in") {
        assert.ok(judge.position.z < -8.5 && Math.abs(judge.position.x) <= 3, "teleports stay in the rear aisle");
        assert.equal(judge.root.visible, true);
        player.x = judge.position.x; player.z = judge.position.z + 2;
      }
    },
    onDamage: () => events.push("damage"),
  });
  judge.setPhase("combat");
  for (let frame = 0; frame < 400; frame++) judge.update(.05, frame * .05, player);
  assert.deepEqual(events.slice(0, 5), ["orb", "damage", "teleport-out", "teleport-in", "orb"]);
  assert.ok(events.filter((event) => event === "orb" || event === "wave").length >= 8, "the Judge keeps pressure over twenty seconds");
  assert.ok(events.filter((event) => event === "teleport-out").length >= 3, "the Judge vanishes repeatedly");
  assert.equal(events.filter((event) => event === "teleport-out").length, events.filter((event) => event === "teleport-in").length);
  const wave = events.indexOf("wave");
  assert.ok(wave > 4, "the third turn reaches a wave");
  assert.equal(events[wave + 1], "damage", "a nearby player receives one wave hit");
  judge.dispose();
});

test("fury speeds up attacks but keeps a readable warning and matching wave reach", () => {
  const normal = judgeCombatTuning(JUDGE_FURY_HEALTH + 1);
  const fury = judgeCombatTuning(JUDGE_FURY_HEALTH);
  assert.ok(fury.attackInterval < normal.attackInterval);
  assert.ok(normal.attackSpeed > 1, "the Judge's combo is faster than the source animation");
  assert.ok(fury.attackSpeed > normal.attackSpeed);
  assert.ok(fury.vanishTime < normal.vanishTime);
  assert.ok(fury.orbSpeed > normal.orbSpeed);
  assert.ok(fury.chaseSpeed > normal.chaseSpeed);
  assert.ok(fury.orbWindup >= .6);
  assert.ok(fury.waveWindup >= 1);
  assert.ok(fury.waveRadius > normal.waveRadius);
});

test("the Judge pursues a distant player through the clear aisle", () => {
  const judge = createHalloweenJudgeEncounter(new THREE.Scene(), { isSafe: () => true });
  judge.setPhase("combat");
  const start = judge.position.z;
  for (let frame = 0; frame < 22; frame++) judge.update(.1, frame * .1, { x: 0, y: 0, z: 3 });
  assert.ok(judge.position.z > start + .4, "the boss closes distance beyond the former 7.5-unit cutoff");
  judge.dispose();
});

test("the new attack is animation-only, small, and matches the Judge skeleton", async () => {
  const { readFile } = await import("node:fs/promises");
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const bytes = await readFile(new URL("./models/demonFinal-attack.anim.mobile.glb", import.meta.url));
  const attack = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  assert.equal(attack.animations[0].name, "Punch_Combo");
  assert.equal(attack.animations[0].tracks.length, 192);
  let meshes = 0;
  attack.scene.traverse((object) => { if (object.isMesh) meshes++; });
  assert.equal(meshes, 0);
  assert.ok(bytes.length < 350000);
  const bodyBytes = await readFile(new URL("./models/demonioFinal.mobile.glb", import.meta.url));
  const json = (buffer) => JSON.parse(buffer.toString("utf8", 20, 20 + buffer.readUInt32LE(12)));
  assert.deepEqual(json(bytes).nodes.map((node) => node.name), json(bodyBytes).nodes.map((node) => node.name));
});

test("the Judge holds the attack pose past the orb release instead of cutting the new combo short", () => {
  const scene = new THREE.Scene();
  const body = new THREE.Group();
  const hips = new THREE.Object3D(); hips.name = "Hips"; body.add(hips);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshBasicMaterial()); body.add(mesh);
  const idle = new THREE.AnimationClip("idle", 1, [
    new THREE.NumberKeyframeTrack("Hips.position[y]", [0, 1], [0, 0]),
  ]);
  const attack = new THREE.AnimationClip("attack", 2.46, [
    new THREE.NumberKeyframeTrack("Hips.position[y]", [0, 1, 2.46], [0, 1, 0]),
  ]);
  const events = [];
  const judge = createHalloweenJudgeEncounter(scene, { onEvent: (event) => events.push(event) });
  judge.mount({ scene: body, animations: [idle] }, null, { scene: new THREE.Group(), animations: [attack] }, null);
  judge.setPhase("combat");
  const player = { x: 0, y: 0, z: -7.8 };
  for (let frame = 0; frame < 60 && !events.includes("orb"); frame++) judge.update(.05, frame * .05, player);
  assert.ok(events.includes("orb"));
  for (let frame = 0; frame < 20; frame++) judge.update(.05, 3 + frame * .05, player);
  assert.ok(hips.position.y > .45, "the combo continues after the projectile is released");
  judge.dispose(); mesh.geometry.dispose(); mesh.material.dispose();
});

test("death plays once, holds its final pose and completes after the fade even while controls are locked", async () => {
  const { readFile } = await import("node:fs/promises");
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const bytes = await readFile(new URL("./models/demonDieFinal.anim.mobile.glb", import.meta.url));
  const animation = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  assert.equal(animation.animations[0].name, "Dead");
  assert.equal(animation.animations[0].tracks.length, 192);
  let meshes = 0;
  animation.scene.traverse(object => { if (object.isMesh) meshes++; });
  assert.equal(meshes, 0, "the death asset must not duplicate the character or textures");
  assert.ok(bytes.length < 350000);
  const body = new THREE.Group();
  const hips = new THREE.Object3D(); hips.name = "Hips"; body.add(hips);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshBasicMaterial()); body.add(mesh);
  const clip = new THREE.AnimationClip("fall", 3, [new THREE.NumberKeyframeTrack("Hips.position[y]", [0, 1, 3], [1, .5, 0])]);
  let completions = 0;
  const events = [];
  const judge = createHalloweenJudgeEncounter(new THREE.Scene(), { onDeathComplete: () => completions++, onEvent: (event) => events.push(event) });
  judge.mount({ scene: body, animations: [] }, null, null, { scene: new THREE.Group(), animations: [clip] });
  judge.setPhase("combat");
  for (let hit = 0; hit < JUDGE_MAX_HEALTH; hit++) { judge.armShot(); judge.hit(1000 + hit * 400); }
  assert.equal(events.filter(event => event === "death").length, 0, "the disappearance sound must wait for the visual fade");
  const player = { x: 0, y: 0, z: 0 };
  judge.update(1.5, 1.5, player, true);
  assert.ok(hips.position.y > 0 && hips.position.y < .5, "the fall must advance while input is locked");
  judge.setPhase("gone");
  assert.equal(judge.phase, "dying", "cannot truncate the animation");
  judge.update(1.6, 3.1, player, true);
  assert.equal(hips.position.y, 0, "the last pose must be clamped, not looped");
  assert.equal(completions, 0);
  for (let frame = 0; frame < 50; frame++) judge.update(.05, 3.1 + frame * .05, player, true);
  assert.equal(completions, 1);
  assert.equal(events.filter(event => event === "death").length, 1);
  assert.equal(body.visible, false);
  assert.equal(hips.position.y, 0);
  judge.setPhase("gone");
  assert.equal(judge.root.visible, false);
  judge.dispose(); mesh.geometry.dispose(); mesh.material.dispose();
});

test("a hostile orb bursts on furniture before damaging a player behind it", () => {
  const scene = new THREE.Scene();
  let hits = 0;
  const judge = createHalloweenJudgeEncounter(scene, {
    isSafe: () => false,
    isProjectileBlocked: (x, z) => z > -9.55 && z < -9.35,
    onDamage: () => hits++,
  });
  judge.setPhase("combat");
  const player = { x: 0, y: 0, z: -8.1 };
  for (let frame = 0; frame < 70; frame++) judge.update(.05, frame * .05, player);
  assert.equal(hits, 0);
  assert.equal(scene.getObjectByName("Juez / orbe hostil").visible, false);
  judge.dispose();
});
