import * as THREE from "three";
import { createInteractionPromptSprite } from "./recordStoreInteractionPrompt.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { STORE_NPCS } from "./recordStoreDialogue.js";
import { advanceRoxyPatrol, createRoxyPatrol } from "./recordStoreRoxyMotion.js";
import { advanceGuestPatrol, createGuestPatrol } from "./recordStoreGuestMotion.js";

const ROXY_WALK_URL = new URL("../assets/neonboy-animaciones/mujer-caminando.anim.glb", import.meta.url).href;
const ROXY_GUITAR_URL = new URL("../assets/neonboy-animaciones/mujer-tocando-guitarra.anim.glb", import.meta.url).href;
const GUEST_WALK_URLS = {
  freddy: new URL("../assets/neonboy-animaciones/freddy-caminar.anim.glb", import.meta.url).href,
  jason: new URL("../assets/neonboy-animaciones/jason-walk.anim.glb", import.meta.url).href
};
const SKELETON_DANCE_URL = new URL("../assets/neonboy-animaciones/esuqeleto-bailando.store.glb", import.meta.url).href;
const SKELETON_IDLE_URL = new URL("../assets/neonboy-animaciones/esqueleto-sosteniendo-disco-holyFire.anim.glb", import.meta.url).href;
function inPlaceClip(source) {
  if (!source) return null;
  const clip = source.clone();
  for (const track of clip.tracks) {
    if (!/Hips\.position$/.test(track.name)) continue;
    const y = track.values[1];
    for (let i = 0; i < track.values.length; i += 3) {
      track.values[i] = 0;
      track.values[i + 1] = y;
      track.values[i + 2] = 0;
    }
  }
  clip.resetDuration();
  return clip;
}

export function createRecordStoreNpcActors(scene, loader, clickable, disposeLoaded, { deferLoad = false } = {}) {
  const actors = new Map();
  const pending = [];
  let alive = true;
  let danceTemplatePromise = null;
  let skeletonIdleClipPromise = null;

  function mountModel(actor, asset) {
    const bounds = new THREE.Box3().setFromObject(asset.scene);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 1.86 / Math.max(size.y, 0.001);
    asset.scene.scale.setScalar(scale);
    asset.scene.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    asset.scene.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      object.userData.shopAction = "npc";
      object.userData.npcId = actor.npc.id;
      clickable.push(object);
    });
    actor.root.add(asset.scene);
    actor.root.remove(actor.marker);
    const index = clickable.indexOf(actor.marker);
    if (index !== -1) clickable.splice(index, 1);
    actor.marker.geometry.dispose();
    actor.marker.material.dispose();
    actor.marker = null;
    actor.model = asset.scene;
    actor.mixer = new THREE.AnimationMixer(asset.scene);
    return scale;
  }

  async function loadRoxy(actor) {
    const idle = await loader.loadAsync(actor.npc.model);
    if (!alive) { disposeLoaded([idle.scene]); return; }
    actor.modelScale = mountModel(actor, idle);
    const idleClip = inPlaceClip(idle.animations[0]);
    if (idleClip) {
      actor.actions.idle = actor.mixer.clipAction(idleClip);
      actor.actions.idle.play();
      actor.currentAction = actor.actions.idle;
    }

    for (const [mode, url] of [["walk", ROXY_WALK_URL], ["guitar", ROXY_GUITAR_URL]]) {
      try {
        const asset = await loader.loadAsync(url);
        if (alive) {
          const clip = inPlaceClip(asset.animations[0]);
          if (clip) actor.actions[mode] = actor.mixer.clipAction(clip);
        }
        disposeLoaded([asset.scene]);
        if (!alive) return;
      } catch { /* Idle animation remains usable if one recording cannot load. */ }
    }
  }

  async function loadSkeleton(actor) {
    // Los dos esqueletos comparten una sola geometr?a y las mismas texturas.
    // La espera y el baile animan el mismo modelo para no duplicar la memoria de video.
    danceTemplatePromise ||= loader.loadAsync(SKELETON_DANCE_URL);
    const template = await danceTemplatePromise;
    if (!alive) return;
    actor.modelScale = mountModel(actor, { scene: cloneSkinned(template.scene) });
    const danceClip = inPlaceClip(template.animations[0]);
    if (danceClip) actor.actions.dance = actor.mixer.clipAction(danceClip);
    try {
      skeletonIdleClipPromise ||= loader.loadAsync(SKELETON_IDLE_URL).then((asset) => {
        const clip = inPlaceClip(asset.animations[0]);
        disposeLoaded([asset.scene]);
        return clip;
      });
      const idleClip = await skeletonIdleClipPromise;
      if (!alive) return;
      if (idleClip) {
        actor.actions.idle = actor.mixer.clipAction(idleClip);
        actor.actions.idle.play();
        actor.currentAction = actor.actions.idle;
        actor.mixer.update(0);
      }
    } catch { /* El esqueleto conserva su pose si falla la animaci?n de espera. */ }
  }

  async function loadGuest(actor) {
    const idle = await loader.loadAsync(actor.npc.model);
    if (!alive) { disposeLoaded([idle.scene]); return; }
    mountModel(actor, idle);
    const idleClip = inPlaceClip(idle.animations[0]);
    if (idleClip) {
      actor.actions.idle = actor.mixer.clipAction(idleClip);
      actor.actions.idle.play();
      actor.currentAction = actor.actions.idle;
    }
    try {
      const walk = await loader.loadAsync(GUEST_WALK_URLS[actor.npc.id]);
      if (alive) {
        const clip = inPlaceClip(walk.animations[0]);
        if (clip) actor.actions.walk = actor.mixer.clipAction(clip);
      }
      disposeLoaded([walk.scene]);
    } catch { /* El personaje conserva la animación de espera. */ }
  }

  for (const npc of STORE_NPCS) {
    const root = new THREE.Group();
    root.name = npc.name;
    root.position.set(npc.x, 0, npc.z);
    root.rotation.y = npc.yaw;
    scene.add(root);

    const marker = new THREE.Mesh(new THREE.CapsuleGeometry(0.33, 0.88, 8, 12),
      new THREE.MeshStandardMaterial({ color: npc.id === "tito" ? 0x715066 : npc.id === "roxy" ? 0x7b3d68 : 0x342f3e, roughness: 0.8 }));
    marker.position.y = 0.88;
    marker.castShadow = true;
    marker.userData.shopAction = "npc";
    marker.userData.npcId = npc.id;
    root.add(marker);
    clickable.push(marker);
    const prompt = createInteractionPromptSprite(npc.id === "jason" ? "[E] INSISTIR" : "[E] HABLAR");
    root.add(prompt);
    const actor = { npc, root, marker, prompt, model: null, mixer: null, actions: {}, currentAction: null,
      patrol: npc.id === "roxy" ? createRoxyPatrol() : GUEST_WALK_URLS[npc.id] ? createGuestPatrol(npc.id) : null,
      lookTime: 0, state: "idle" };
    actors.set(npc.id, actor);

    if (npc.id === "roxy") {
      pending.push(() => loadRoxy(actor).catch(() => { /* Keep the labeled marker if the model cannot load. */ }));
      continue;
    }
    if (npc.id.startsWith("skeleton-")) {
      pending.push(() => loadSkeleton(actor).catch(() => { /* Se conserva el marcador si no carga el modelo. */ }));
      continue;
    }
    if (GUEST_WALK_URLS[npc.id]) {
      pending.push(() => loadGuest(actor).catch(() => { /* Se conserva el marcador si falla el modelo. */ }));
      continue;
    }
    pending.push(() => loader.loadAsync(npc.model).then((asset) => {
      if (!alive) { disposeLoaded([asset.scene]); return; }
      mountModel(actor, asset);
      if (asset.animations.length) actor.mixer.clipAction(asset.animations[0]).play();
    }).catch(() => { /* Keep the labeled marker if this model cannot load. */ }));
  }

  function setActorAction(actor, mode) {
    const next = actor.actions[mode] || actor.actions.idle;
    if (!next || actor.currentAction === next) return;
    actor.currentAction?.fadeOut(0.22);
    next.reset().fadeIn(0.22).play();
    actor.currentAction = next;
  }


  function getPosition(id) {
    return actors.get(id)?.root.position ?? null;
  }

  function update(dt, player, activeNpc, nearbyNpc, musicPlaying = false, dancingSkeleton = null) {
    for (const actor of actors.values()) {
      let desired = actor.npc.yaw;
      if (actor.npc.id === "roxy") {
        const previousX = actor.root.position.x;
        const previousZ = actor.root.position.z;
        actor.patrol = advanceRoxyPatrol(actor.patrol, dt, player, musicPlaying, activeNpc === "roxy");
        actor.root.position.set(actor.patrol.x, 0, actor.patrol.z);
        actor.state = actor.patrol.mode;
        setActorAction(actor, actor.state === "walk" || actor.state === "guitar" ? actor.state : "idle");
        if (actor.state === "walk") desired = Math.atan2(actor.root.position.x - previousX, actor.root.position.z - previousZ);
        else if (actor.state === "guitar") desired = -Math.PI / 4;
        else if (activeNpc === "roxy" || nearbyNpc === "roxy") desired = Math.atan2(player.x - actor.root.position.x, player.z - actor.root.position.z);
      } else if (GUEST_WALK_URLS[actor.npc.id]) {
        actor.lookTime += dt;
        actor.patrol = advanceGuestPatrol(actor.patrol, dt, player, activeNpc === actor.npc.id);
        actor.root.position.set(actor.patrol.x, 0, actor.patrol.z);
        actor.state = actor.patrol.mode;
        setActorAction(actor, actor.state === "walk" ? "walk" : "idle");
        desired = actor.state === "walk" ? actor.patrol.heading : actor.patrol.heading + Math.sin(actor.lookTime * 1.6 + (actor.npc.id === "jason" ? 1.8 : 0)) * 0.48;
        if (activeNpc === actor.npc.id || nearbyNpc === actor.npc.id) desired = Math.atan2(player.x - actor.root.position.x, player.z - actor.root.position.z);
      } else {
        const dancing = actor.npc.id.startsWith("skeleton-") && dancingSkeleton === actor.npc.id;
        if (actor.npc.id.startsWith("skeleton-")) {
          setActorAction(actor, dancing ? "dance" : "idle");
        }
        actor.state = dancing ? "dance" : activeNpc === actor.npc.id ? "talking" : nearbyNpc === actor.npc.id ? "looking" : "idle";
        if (activeNpc === actor.npc.id) desired = Math.atan2(player.x - actor.root.position.x, player.z - actor.root.position.z);
      }
      actor.mixer?.update(dt);
      actor.prompt.visible = nearbyNpc === actor.npc.id && !activeNpc;
      const difference = Math.atan2(Math.sin(desired - actor.root.rotation.y), Math.cos(desired - actor.root.rotation.y));
      actor.root.rotation.y += difference * Math.min(1, dt * 4);
    }
  }

  // Cargar modelos pesados de a uno evita picos de decodificaci?n y memoria GPU en Chrome.
  let loadPromise = null;
  const load = () => {
    loadPromise ||= pending.reduce((previous, loadActor) => previous.then(() => alive ? loadActor() : undefined), Promise.resolve());
    return loadPromise;
  };
  return { actors, ready: deferLoad ? null : load(), load, getPosition, update, dispose: () => { alive = false; danceTemplatePromise?.then((asset) => disposeLoaded([asset.scene])).catch(() => {}); } };
}
