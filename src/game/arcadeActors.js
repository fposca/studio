import * as THREE from "three";
import { ARCADE_NPCS } from "./arcadeDialogue.js";
import { limitRockClubTextures } from "./rockClubTextureBudget.js";
import { disposeObjects } from "./disposeGameObjects.js";

function inPlaceClip(source) {
  const clip = source.clone();
  for (const track of clip.tracks) {
    if (!/Hips\.position$/.test(track.name)) continue;
    const y = track.values[1];
    for (let i = 0; i < track.values.length; i += 3) {
      track.values[i] = 0; track.values[i + 1] = y; track.values[i + 2] = 0;
    }
  }
  clip.resetDuration();
  return clip;
}

function poseNicoAtRest(actor) {
  // Nico only has a stomp clip; its opening frame gives him a grounded idle pose.
  if (!actor.action || !actor.mixer) return;
  actor.action.reset().play();
  actor.mixer.setTime(0);
  actor.action.paused = true;
}

export function createArcadeActors(arcade, loader, isAlive) {
  const actors = new Map();
  let disposed = false;
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 64;
  const ctx = shadowCanvas.getContext("2d");
  const gradient = ctx.createRadialGradient(32, 32, 3, 32, 32, 31);
  gradient.addColorStop(0, "rgba(0,0,0,.7)"); gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
  const shadowGeometry = new THREE.PlaneGeometry(1.1, .65);
  for (const npc of ARCADE_NPCS) {
    const anchor = arcade.slots.get(npc.id);
    if (!anchor) continue;
    const marker = new THREE.Mesh(new THREE.CapsuleGeometry(.28, .95, 5, 8), new THREE.MeshStandardMaterial({ color: 0x704874, roughness: .8 }));
    marker.position.y = .82; anchor.add(marker);
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = .012; shadow.renderOrder = 1; anchor.add(shadow);
    // Keep the third-person camera in front of a character when NeonBoy walks close.
    const cameraBlocker = new THREE.Mesh(new THREE.BoxGeometry(.78, 1.85, .78),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    cameraBlocker.position.y = .95; anchor.add(cameraBlocker); arcade.colliders.push(cameraBlocker);
    actors.set(npc.id, { npc, anchor, marker, model: null, mixer: null, action: null, gestured: false });
  }

  async function load() {
    const loaded = [];
    // Meshy exports are large; decode one NPC at a time to avoid a GPU spike.
    for (const actor of actors.values()) {
      if (disposed || !isAlive()) break;
      try {
        const asset = await loader.loadAsync(actor.npc.model);
        if (disposed || !isAlive()) { disposeObjects([asset.scene]); break; }
        const model = asset.scene;
        limitRockClubTextures(model, 1024);
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        if (!Number.isFinite(size.y) || size.y < .01) { disposeObjects([model]); continue; }
        const scale = actor.npc.fitHeight / size.y;
        model.scale.setScalar(scale);
        model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
        model.traverse((object) => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
        actor.anchor.add(model);
        actor.anchor.remove(actor.marker);
        actor.marker.geometry.dispose(); actor.marker.material.dispose(); actor.marker = null;
        actor.model = model;
        const clip = asset.animations.find((entry) => entry.name === actor.npc.clip);
        if (clip) {
          const mixer = new THREE.AnimationMixer(model);
          const action = mixer.clipAction(inPlaceClip(clip));
          actor.mixer = mixer; actor.action = action;
          if (actor.npc.id === "pixel") { action.timeScale = .75; action.play(); }
          if (actor.npc.id === "vicky") { action.timeScale = .5; action.play(); }
          if (actor.npc.id === "nico") {
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            poseNicoAtRest(actor);
          }
        }
        loaded.push(actor.npc.id);
      } catch { /* The labeled stand-in remains if an asset fails. */ }
    }
    return loaded;
  }

  function update(dt, activeNpc) {
    for (const actor of actors.values()) {
      actor.mixer?.update(dt);
      if (actor.npc.id === "nico") {
        if (activeNpc === "nico" && !actor.gestured) { actor.action?.reset().play(); actor.gestured = true; }
        if (activeNpc !== "nico" && actor.gestured) {
          poseNicoAtRest(actor);
          actor.gestured = false;
        }
      }
    }
  }

  function dispose() {
    disposed = true;
    for (const actor of actors.values()) actor.mixer?.stopAllAction();
    shadowGeometry.dispose(); shadowMaterial.dispose(); shadowTexture.dispose();
  }
  return { actors, load, update, dispose };
}
