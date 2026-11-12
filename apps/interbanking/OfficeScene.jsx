import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildOffice } from "./officeScene.js";
import { canStandInOffice, OFFICE_LIMITS } from "./officeNavigation.js";
import { disposeObjects } from "../../src/game/disposeGameObjects.js";
import { createInteractionPromptSprite } from "../../src/game/recordStoreInteractionPrompt.js";

const MODELS = {
  fernandoIdle: new URL("./models/fernando-respira.office.glb", import.meta.url).href,
  fernandoWalk: new URL("./models/fernando-camina.office.glb", import.meta.url).href,
  victoriaIdle: new URL("./models/victoria-respira.office.glb", import.meta.url).href,
  victoriaWalk: new URL("./models/victoria-camina.office.glb", import.meta.url).href,
  roxy: new URL("./models/roxy.office.glb", import.meta.url).href,
  alfredo: new URL("./models/alfredo.office.glb", import.meta.url).href,
};

function positionModel(model, height) {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = height / Math.max(.01, size.y);
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  model.traverse(part => {
    if (!part.isMesh) return;
    part.castShadow = true;
    part.receiveShadow = true;
    part.frustumCulled = false;
  });
}

function inPlaceClip(source, { idle = false } = {}) {
  if (!source) return null;
  const clip = source.clone();
  for (const track of clip.tracks) {
    // Keep the rig's root fixed. Movement through the room comes from the controller.
    if (/Hips\.position$/i.test(track.name)) {
      const first = track.values.slice(0, 3);
      for (let i = 0; i < track.values.length; i += 3) {
        track.values[i] = first[0];
        track.values[i + 1] = first[1];
        track.values[i + 2] = first[2];
      }
    }
    // Idle clips include leg and hip motion that makes planted feet slide.
    if (idle && /(?:Hips|(?:Left|Right)(?:UpLeg|Leg|Foot|ToeBase))\.quaternion$/i.test(track.name)) {
      const first = track.values.slice(0, 4);
      for (let i = 0; i < track.values.length; i += 4) track.values.set(first, i);
    }
  }
  clip.resetDuration();
  return clip;
}

export default function OfficeScene({ avatar = "fernando", firstPerson = false, locked, onInteract, onNearby, onViewChange }) {
  const canvasRef = useRef(null);
  const callbacksRef = useRef({ onInteract, onNearby, onViewChange, firstPerson, locked });
  callbacksRef.current = { onInteract, onNearby, onViewChange, firstPerson, locked };
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); }
    catch { setStatus("error"); return undefined; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .93;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const environmentGenerator = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = environmentGenerator.fromScene(room);
    room.dispose();
    environmentGenerator.dispose();
    scene.environment = environment.texture;
    scene.environmentIntensity = .32;
    const office = buildOffice(scene);
    const playerShadow = office.createContactShadow(0, 8.4);
    playerShadow.visible = false;
    const roxyShadow = office.createContactShadow(office.roxyPosition.x, office.roxyPosition.z);
    roxyShadow.visible = false;
    const alfredoShadow = office.createContactShadow(office.alfredoPosition.x, office.alfredoPosition.z);
    alfredoShadow.visible = false;
    const camera = new THREE.PerspectiveCamera(60, 1, .09, 100);
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const player = { x: 0, z: 8.4, yaw: Math.PI, vx: 0, vz: 0 };
    const view = { yaw: 0, pitch: .15, distance: 4.6, firstPerson };
    // Start behind Fernando before the first render. Fast cached models must
    // never reveal the camera's default origin inside the character.
    camera.position.set(player.x, 2.35 + view.pitch,
      Math.min(OFFICE_LIMITS.maxZ + 1.75, player.z + view.distance));
    camera.lookAt(player.x, 1.37, player.z - .45);
    canvas.dataset.view = view.firstPerson ? "first-person" : "third-person";
    const targetCamera = new THREE.Vector3(), targetLook = new THREE.Vector3();
    const keys = new Set();
    let live = true, frameId = 0, lastFrame = performance.now(), nearId = null;
    let dragging = false, lastX = 0, lastY = 0;
    let fernando = null, roxy = null, alfredo = null;
    let fernandoMixer = null, roxyMixer = null, alfredoMixer = null;
    let idleAction = null, walkAction = null, walkingWeight = 0;

    const roxyPrompt = createInteractionPromptSprite("Hablar", { subject: "Roxy · Recursos Humanos" });
    const logoPrompt = createInteractionPromptSprite("Inspeccionar", { subject: "Interbanking" });
    const alfredoPrompt = createInteractionPromptSprite("Hablar", { subject: "Alfredo · Seguridad" });
    roxyPrompt.position.y = 2.0;
    logoPrompt.position.y = 2.78;
    alfredoPrompt.position.y = 2.02;
    const roxyAnchor = new THREE.Group();
    roxyAnchor.position.copy(office.roxyPosition);
    roxyAnchor.add(roxyPrompt);
    scene.add(roxyAnchor);
    const logoAnchor = new THREE.Group();
    logoAnchor.position.copy(office.logoPosition);
    logoAnchor.position.y = 0;
    logoAnchor.add(logoPrompt);
    scene.add(logoAnchor);
    const alfredoAnchor = new THREE.Group();
    alfredoAnchor.position.copy(office.alfredoPosition);
    alfredoAnchor.add(alfredoPrompt);
    scene.add(alfredoAnchor);

    function mountNpc(asset, position, height, yaw) {
      const root = new THREE.Group();
      root.position.copy(position);
      root.rotation.y = yaw;
      positionModel(asset.scene, height);
      root.add(asset.scene);
      scene.add(root);
      const mixer = new THREE.AnimationMixer(asset.scene);
      const clip = inPlaceClip(asset.animations.find(animation => animation.duration > .1), { idle: true });
      if (clip) mixer.clipAction(clip).play();
      return { root, mixer };
    }

    const avatarModels = avatar === "victoria"
      ? [MODELS.victoriaIdle, MODELS.victoriaWalk]
      : [MODELS.fernandoIdle, MODELS.fernandoWalk];
    Promise.all([
      loader.loadAsync(avatarModels[0]),
      loader.loadAsync(avatarModels[1]),
      loader.loadAsync(MODELS.roxy),
      loader.loadAsync(MODELS.alfredo),
    ]).then(([idle, walk, roxyAsset, alfredoAsset]) => {
      if (!live) {
        disposeObjects([idle.scene, walk.scene, roxyAsset.scene, alfredoAsset.scene]);
        return;
      }
      const baseClip = inPlaceClip(idle.animations.find(clip => clip.duration > .1), { idle: true });
      const walkingClip = inPlaceClip(walk.animations.find(clip => clip.duration > .1));
      if (!baseClip || !walkingClip) throw new Error("Faltan las animaciones del avatar seleccionado.");
      positionModel(idle.scene, 1.82);
      fernando = new THREE.Group();
      fernando.name = avatar === "victoria" ? "Victoria" : "Fernando";
      fernando.add(idle.scene);
      scene.add(fernando);
      fernandoMixer = new THREE.AnimationMixer(idle.scene);
      idleAction = fernandoMixer.clipAction(baseClip).play();
      walkAction = fernandoMixer.clipAction(walkingClip).play();
      walkAction.setEffectiveWeight(0);
      disposeObjects([walk.scene]);
      const roxyActor = mountNpc(roxyAsset, office.roxyPosition, 1.75, .25);
      roxy = roxyActor.root; roxyMixer = roxyActor.mixer;
      const alfredoActor = mountNpc(alfredoAsset, office.alfredoPosition, 1.79, -.2);
      alfredo = alfredoActor.root; alfredo.name = "Alfredo · Seguridad";
      alfredoMixer = alfredoActor.mixer;
      playerShadow.visible = roxyShadow.visible = alfredoShadow.visible = true;
      canvas.dataset.models = `${avatar},roxy,alfredo`;
      canvas.dataset.ready = "true";
      setStatus("ready");
    }).catch(error => {
      if (live) { console.error("No se pudo preparar la oficina:", error); setStatus("error"); }
    });

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width)), height = Math.max(1, Math.round(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    function onKeyDown(event) {
      if (event.code === "KeyC" && !event.repeat && !callbacksRef.current.locked &&
        !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        callbacksRef.current.onViewChange?.(!callbacksRef.current.firstPerson);
        return;
      }
      if (event.code === "KeyE" && !event.repeat && nearId && !callbacksRef.current.locked) {
        event.preventDefault();
        callbacksRef.current.onInteract?.(nearId);
        keys.clear();
        return;
      }
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"].includes(event.code)) {
        if (event.code.startsWith("Arrow")) event.preventDefault();
        keys.add(event.code);
      }
    }
    const onKeyUp = event => keys.delete(event.code);
    const onBlur = () => keys.clear();
    const onPointerDown = event => {
      if (event.button !== 0) return;
      dragging = true; lastX = event.clientX; lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = event => {
      if (!dragging) return;
      view.yaw += (event.clientX - lastX) * (view.firstPerson ? -.004 : .004);
      view.pitch = THREE.MathUtils.clamp(view.pitch + (event.clientY - lastY) * .0025,
        view.firstPerson ? -.72 : -.1, view.firstPerson ? .72 : .36);
      lastX = event.clientX; lastY = event.clientY;
    };
    const onPointerUp = () => { dragging = false; };
    const onWheel = event => {
      event.preventDefault();
      if (!view.firstPerson) view.distance = THREE.MathUtils.clamp(view.distance + event.deltaY * .003, 3.2, 6.2);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    function animate(now) {
      if (!live) return;
      frameId = requestAnimationFrame(animate);
      const dt = Math.min(.05, (now - lastFrame) / 1000);
      lastFrame = now;
      if (callbacksRef.current.locked) keys.clear();
      if (view.firstPerson !== callbacksRef.current.firstPerson) {
        view.firstPerson = callbacksRef.current.firstPerson;
        if (!view.firstPerson) {
          view.pitch = THREE.MathUtils.clamp(view.pitch, -.1, .36);
          camera.position.set(player.x + Math.sin(view.yaw) * view.distance,
            THREE.MathUtils.clamp(2.35 + view.pitch, 2.2, 2.85),
            player.z + Math.cos(view.yaw) * view.distance);
          camera.position.x = THREE.MathUtils.clamp(camera.position.x, OFFICE_LIMITS.minX + .25, OFFICE_LIMITS.maxX - .25);
          camera.position.z = THREE.MathUtils.clamp(camera.position.z, OFFICE_LIMITS.minZ + .15, OFFICE_LIMITS.maxZ + 1.75);
        }
        canvas.dataset.view = view.firstPerson ? "first-person" : "third-person";
      }
      const forward = Number(keys.has("KeyW") || keys.has("ArrowUp")) - Number(keys.has("KeyS") || keys.has("ArrowDown"));
      const side = Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft"));
      const inputLength = Math.max(1, Math.hypot(forward, side));
      const running = keys.has("ShiftLeft") || keys.has("ShiftRight");
      const speed = running ? 3.8 : 2.35;
      const desiredX = (side * Math.cos(view.yaw) - forward * Math.sin(view.yaw)) / inputLength * speed;
      const desiredZ = (-side * Math.sin(view.yaw) - forward * Math.cos(view.yaw)) / inputLength * speed;
      player.vx = THREE.MathUtils.damp(player.vx, desiredX, 9, dt);
      player.vz = THREE.MathUtils.damp(player.vz, desiredZ, 9, dt);
      const oldX = player.x, oldZ = player.z;
      if (canStandInOffice(player.x + player.vx * dt, player.z)) player.x += player.vx * dt;
      if (canStandInOffice(player.x, player.z + player.vz * dt)) player.z += player.vz * dt;
      const actualSpeed = dt ? Math.hypot(player.x - oldX, player.z - oldZ) / dt : 0;
      if (view.firstPerson) player.yaw = view.yaw + Math.PI;
      else if (actualSpeed > .08) {
        const desiredYaw = Math.atan2(player.x - oldX, player.z - oldZ);
        const turn = Math.atan2(Math.sin(desiredYaw - player.yaw), Math.cos(desiredYaw - player.yaw));
        player.yaw += THREE.MathUtils.clamp(turn, -dt * 9, dt * 9);
      }
      if (fernando) {
        fernando.position.set(player.x, 0, player.z);
        playerShadow.position.set(player.x, .019, player.z);
        fernando.rotation.y = player.yaw;
        fernando.visible = !view.firstPerson;
        playerShadow.visible = !view.firstPerson;
        walkingWeight = THREE.MathUtils.damp(walkingWeight, actualSpeed > .08 ? 1 : 0, 11, dt);
        idleAction.setEffectiveWeight(1 - walkingWeight);
        walkAction.setEffectiveWeight(walkingWeight);
        walkAction.setEffectiveTimeScale(Math.max(.55, actualSpeed / 2.3));
        fernandoMixer.update(dt);
      }
      roxyMixer?.update(dt);
      alfredoMixer?.update(dt);
      if (roxy && Math.hypot(player.x - office.roxyPosition.x, player.z - office.roxyPosition.z) < 3.5) {
        const turn = Math.atan2(player.x - roxy.position.x, player.z - roxy.position.z);
        roxy.rotation.y += Math.atan2(Math.sin(turn - roxy.rotation.y), Math.cos(turn - roxy.rotation.y)) * Math.min(1, dt * 2.5);
      }
      if (alfredo && Math.hypot(player.x - office.alfredoPosition.x, player.z - office.alfredoPosition.z) < 3.5) {
        const turn = Math.atan2(player.x - alfredo.position.x, player.z - alfredo.position.z);
        alfredo.rotation.y += Math.atan2(Math.sin(turn - alfredo.rotation.y), Math.cos(turn - alfredo.rotation.y)) * Math.min(1, dt * 2.5);
      }
      if (view.firstPerson) {
        const eyeY = avatar === "victoria" ? 1.58 : 1.66;
        const level = Math.cos(view.pitch);
        camera.position.set(player.x, eyeY, player.z);
        targetLook.set(player.x - Math.sin(view.yaw) * level,
          eyeY - Math.sin(view.pitch), player.z - Math.cos(view.yaw) * level);
        camera.lookAt(targetLook);
      } else {
        targetLook.set(player.x, 1.37, player.z - .45);
        targetCamera.set(player.x + Math.sin(view.yaw) * view.distance,
          THREE.MathUtils.clamp(2.35 + view.pitch, 2.2, 2.85),
          player.z + Math.cos(view.yaw) * view.distance);
        targetCamera.x = THREE.MathUtils.clamp(targetCamera.x, OFFICE_LIMITS.minX + .25, OFFICE_LIMITS.maxX - .25);
        targetCamera.z = THREE.MathUtils.clamp(targetCamera.z, OFFICE_LIMITS.minZ + .15, OFFICE_LIMITS.maxZ + 1.75);
        camera.position.lerp(targetCamera, 1 - Math.exp(-dt * 8));
        camera.lookAt(targetLook);
      }
      const alfredoDistance = Math.hypot(player.x - office.alfredoPosition.x, player.z - office.alfredoPosition.z);
      const roxyDistance = Math.hypot(player.x - office.roxyPosition.x, player.z - office.roxyPosition.z);
      const logoDistance = Math.hypot(player.x, player.z + 13.6);
      const lookingAtLogo = -Math.cos(player.yaw) > .28;
      const coffeeDistance = Math.hypot(player.x - office.coffeePosition.x, player.z - office.coffeePosition.z);
      const candidate = alfredo && alfredoDistance < 2.4 ? "alfredo"
        : roxy && roxyDistance < 2.4 ? "roxy"
        : logoDistance < 3.35 && lookingAtLogo ? "logo"
          : coffeeDistance < 2.15 ? "coffee" : null;
      roxyPrompt.visible = candidate === "roxy";
      alfredoPrompt.visible = candidate === "alfredo";
      logoPrompt.visible = candidate === "logo";
      if (candidate !== nearId) { nearId = candidate; callbacksRef.current.onNearby?.(candidate); }
      renderer.render(scene, camera);
    }
    frameId = requestAnimationFrame(animate);
    return () => {
      live = false;
      cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      fernandoMixer?.stopAllAction(); roxyMixer?.stopAllAction(); alfredoMixer?.stopAllAction();
      scene.traverse(object => {
        if (object.isInstancedMesh || object.isLight) object.dispose?.();
      });
      disposeObjects([scene]);
      environment.dispose();
      renderer.dispose();
    };
  }, [avatar]);

  return <div className="office-scene" data-status={status}>
    <canvas ref={canvasRef} className="office-canvas" aria-label="Oficina 3D de Interbanking" />
    {status !== "ready" && <div className="office-loading" role="status">
      {status === "error" ? "No se pudieron cargar los modelos de la oficina." : "Preparando la oficina y sus personajes…"}
    </div>}
  </div>;
}

