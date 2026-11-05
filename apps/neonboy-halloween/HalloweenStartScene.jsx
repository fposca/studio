import React, { useEffect, useRef, useState } from "react";
import { Pause, Play, Sparkles } from "lucide-react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createOrbGlowTexture, createPlasmaOrb, createOrbTrail } from "../../src/game/neonOrbVisuals.js";
import { createHolographicGroundRing } from "../../src/game/holographicGroundRing.js";
import { disposeObjects } from "../../src/game/disposeGameObjects.js";

const IDLE_URL = new URL("./models/neon-inactivo-hd.mobile.glb", import.meta.url).href;
const POWER_URL = new URL("../../src/assets/neonboy-animaciones/neonboy-power.anim.glb", import.meta.url).href;

function stationaryClip(source, name) {
  if (!source) return null;
  const clip = source.clone();
  clip.name = name;
  const start = Math.min(...clip.tracks.map((track) => track.times[0]));
  for (const track of clip.tracks) {
    track.shift(-start);
    if (!/Hips\.position$/.test(track.name)) continue;
    for (let i = 0; i < track.values.length; i += 3) {
      track.values[i] = 0;
      track.values[i + 2] = 0;
    }
  }
  clip.resetDuration();
  return clip;
}

function floatingRecord(radius, labelColor) {
  const record = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x10101c, roughness: .34, metalness: .65 });
  const face = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, .018, 48), material);
  face.rotation.x = Math.PI / 2;
  record.add(face);
  const grooves = new THREE.MeshBasicMaterial({ color: 0x685277, transparent: true, opacity: .38 });
  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * (.48 + i * .08), .0017, 3, 48), grooves);
    ring.position.z = .011;
    record.add(ring);
  }
  const label = new THREE.Mesh(new THREE.RingGeometry(.018, radius * .32, 32),
    new THREE.MeshBasicMaterial({ color: labelColor, side: THREE.DoubleSide }));
  label.position.z = .012;
  record.add(label);
  return record;
}

export default function HalloweenStartScene() {
  const canvasRef = useRef(null);
  const controls = useRef({ paused: false, cast: false });
  const [paused, setPaused] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [status, setStatus] = useState("loading");
  controls.current.paused = paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      setStatus("unavailable");
      return;
    }
    const mobile = window.matchMedia("(pointer: coarse)").matches;
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 25);
    camera.position.set(1.9, 1.7, 4.45);
    camera.lookAt(0, 1.13, 0);
    scene.add(new THREE.HemisphereLight(0xd8e5ff, 0x472143, 1.6));
    const key = new THREE.DirectionalLight(0xffd9ed, 3.2);
    key.position.set(-2, 3, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x59eaff, 5);
    rim.position.set(2, 2, -2);
    scene.add(rim);
    const magenta = new THREE.PointLight(0xf64cba, 9, 6, 2);
    magenta.position.set(-1.4, 1.2, .4);
    scene.add(magenta);
    function createEnvironment() {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const target = pmrem.fromScene(room, .08);
      room.dispose();
      pmrem.dispose();
      scene.environment = target.texture;
      return target;
    }
    let environment = createEnvironment();
    scene.environmentIntensity = .45;

    const stage = new THREE.Group();
    scene.add(stage);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.22, .13, 64),
      new THREE.MeshStandardMaterial({ color: 0x181529, metalness: .8, roughness: .3 }));
    plinth.position.y = -.085;
    stage.add(plinth);
    const groundRing = createHolographicGroundRing({ radius: 1.12, color: 0x60e4db, secondary: 0xfba0dd, opacity: .85 });
    stage.add(groundRing.mesh);
    const glowTexture = createOrbGlowTexture();
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2),
      new THREE.MeshBasicMaterial({ color: 0x000000, map: glowTexture, transparent: true, opacity: .95, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = .006;
    stage.add(shadow);

    const portal = new THREE.Group();
    portal.position.set(0, 1.2, -.7);
    portal.rotation.y = .28;
    stage.add(portal);
    const arcs = [];
    for (let i = 0; i < 3; i++) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(1.22 + i * .09, i === 0 ? .013 : .005, 6, 100, Math.PI * (i === 0 ? 1.68 : 1.22)),
        new THREE.MeshBasicMaterial({ color: i === 1 ? 0x64d8df : 0xd95dba, transparent: true, opacity: i === 0 ? .78 : .42 }));
      arc.rotation.z = i * 2.3;
      arcs.push(arc);
      portal.add(arc);
    }
    const tickGeometry = new THREE.BoxGeometry(.006, .038, .008);
    const tickMaterial = new THREE.MeshBasicMaterial({ color: 0x8dd8e9, transparent: true, opacity: .4 });
    const portalTicks = new THREE.InstancedMesh(tickGeometry, tickMaterial, 48);
    const tick = new THREE.Object3D();
    for (let i = 0; i < 48; i++) {
      const angle = i / 48 * Math.PI * 2;
      tick.position.set(Math.sin(angle) * 1.46, Math.cos(angle) * 1.46, 0);
      tick.rotation.z = -angle;
      tick.updateMatrix();
      portalTicks.setMatrixAt(i, tick.matrix);
    }
    portalTicks.instanceMatrix.needsUpdate = true;
    portal.add(portalTicks);
    const recordA = floatingRecord(.31, 0xf285bd);
    const recordB = floatingRecord(.24, 0x78e3df);
    stage.add(recordA, recordB);

    const motesCount = mobile ? 45 : 85;
    const motesPositions = new Float32Array(motesCount * 3);
    const motesBase = Array.from({ length: motesCount }, (_, i) => ({
      x: Math.sin(i * 12.9898) * 1.9, y: (i * .618 % 1) * 3, z: Math.cos(i * 7.231) * 1.05 - .25,
    }));
    const motesGeometry = new THREE.BufferGeometry();
    motesGeometry.setAttribute("position", new THREE.BufferAttribute(motesPositions, 3));
    const motes = new THREE.Points(motesGeometry, new THREE.PointsMaterial({
      map: glowTexture, size: .045, color: 0xb7d5ef, transparent: true, opacity: .65,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    }));
    stage.add(motes);
    const orb = createPlasmaOrb({ radius: .105, texture: glowTexture });
    const trail = createOrbTrail({ width: .065, spacing: .035 });
    const orbLight = new THREE.PointLight(0xea6ad9, 2.8, 2.5, 2);
    scene.add(orb.root, trail.mesh, orbLight);
    orb.root.visible = false;
    const oldOrb = new THREE.Vector3(), handPosition = new THREE.Vector3(), flightOrigin = new THREE.Vector3();
    const idleOrb = new THREE.Vector3(), flightPoint = new THREE.Vector3();
    let alive = true, mixer = null, model = null, idleAction = null, powerAction = null, rightHand = null;
    let powerDuration = .73, castAge = Infinity, time = 0, nextCast = 2.6, previousCast = Infinity;
    let frameId = 0, lastDraw = 0, dirty = true, visible = true, contextLost = false, lastPaused = controls.current.paused;

    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    Promise.allSettled([loader.loadAsync(IDLE_URL), loader.loadAsync(POWER_URL)]).then((results) => {
      const idle = results[0].status === "fulfilled" ? results[0].value : null;
      const power = results[1].status === "fulfilled" ? results[1].value : null;
      if (!alive || !idle) {
        disposeObjects([idle?.scene, power?.scene]);
        if (alive) setStatus("unavailable");
        return;
      }
      model = idle.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = 2.13 / Math.max(.01, size.y);
      model.scale.multiplyScalar(scale);
      model.position.set(-center.x * scale, -bounds.min.y * scale + .015, -center.z * scale);
      const hero = new THREE.Group();
      hero.rotation.y = -.12;
      hero.add(model);
      stage.add(hero);
      model.traverse((object) => {
        if (object.isBone && /RightHand$/.test(object.name)) rightHand = object;
        if (object.isMesh) object.frustumCulled = false;
      });
      const idleClip = stationaryClip(idle.animations.find((clip) => clip.duration > .25), "title-idle");
      const powerClip = stationaryClip(power?.animations.find((clip) => clip.duration > .25), "title-cast");
      if (idleClip) {
        mixer = new THREE.AnimationMixer(model);
        idleAction = mixer.clipAction(idleClip).play();
        if (powerClip) {
          powerDuration = powerClip.duration;
          powerAction = mixer.clipAction(powerClip);
          powerAction.setLoop(THREE.LoopOnce, 1);
          powerAction.clampWhenFinished = true;
        }
        mixer.update(0);
      }
      disposeObjects([power?.scene]);
      canvas.dataset.heroLoaded = "true";
      orb.root.visible = true;
      dirty = true;
      setStatus("ready");
    });

    function resize() {
      const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.2 : 1.5, Math.sqrt(900000 / (width * height))));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // Portrait and narrow desktop columns still show the entire figure.
      camera.fov = camera.aspect < 1 ? 41 : 34;
      camera.updateProjectionMatrix();
      dirty = true;
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; lastDraw = 0; dirty = true; });
    observer.observe(canvas);
    function onContextLost(event) {
      event.preventDefault();
      contextLost = true;
      setStatus("unavailable");
    }
    function onContextRestored() {
      environment.dispose();
      environment = createEnvironment();
      contextLost = false;
      dirty = true;
      setStatus(model ? "ready" : "loading");
    }
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    resize();

    function frame(now) {
      if (!alive) return;
      frameId = requestAnimationFrame(frame);
      if (contextLost || document.hidden || !visible) { lastDraw = now; return; }
      const frozen = controls.current.paused;
      if (lastPaused !== frozen) { dirty = true; lastPaused = frozen; }
      if (frozen && !dirty) { lastDraw = now; return; }
      if (!dirty && now - lastDraw < (mobile ? 1000 / 30 : 1000 / 45)) return;
      const dt = frozen ? 0 : Math.min(.05, lastDraw ? (now - lastDraw) / 1000 : .016);
      lastDraw = now;
      time += dt;
      if (model && !frozen && (controls.current.cast || time >= nextCast)) {
        controls.current.cast = false;
        if (castAge > 3.25) {
          castAge = 0;
          previousCast = 0;
          powerAction?.reset().setEffectiveWeight(1).play();
          nextCast = time + 8.5;
        }
      }
      castAge += dt;
      if (mixer) {
        const weight = castAge < powerDuration ? Math.min(1, castAge / .09, (powerDuration - castAge) / .2) : 0;
        powerAction?.setEffectiveWeight(Math.max(0, weight));
        idleAction.setEffectiveWeight(1 - Math.max(0, weight));
        mixer.update(dt);
      }
      groundRing.update(dt);
      arcs[1].rotation.z = 2.3 - time * .07;
      arcs[2].rotation.z = 4.6 + time * .045;
      portalTicks.rotation.z = time * .018;
      recordA.position.set(-1.12, .9 + Math.sin(time * .65) * .09, -.1);
      recordA.rotation.set(.15, .4 + Math.sin(time * .35) * .2, -.25);
      recordB.position.set(1.04, 1.83 + Math.cos(time * .6) * .08, -.35);
      recordB.rotation.set(-.2, -.35 + Math.sin(time * .3) * .16, .2);
      motesBase.forEach((point, i) => {
        motesPositions[i * 3] = point.x + Math.sin(time * .22 + i) * .07;
        motesPositions[i * 3 + 1] = (point.y + time * .045) % 3;
        motesPositions[i * 3 + 2] = point.z;
      });
      motesGeometry.attributes.position.needsUpdate = true;
      idleOrb.set(.72, 1.16 + Math.sin(time * 1.6) * .055, .52);
      oldOrb.copy(orb.root.position);
      if (rightHand) {
        model.updateWorldMatrix(true, true);
        rightHand.getWorldPosition(handPosition);
        handPosition.y += .06;
      } else handPosition.set(.43, 1.0, .4);
      if (castAge < .2) {
        orb.root.position.lerpVectors(idleOrb, handPosition, THREE.MathUtils.smoothstep(castAge, 0, .2));
        trail.mesh.visible = false;
      } else if (castAge < 2.95) {
        if (previousCast < .2) { flightOrigin.copy(handPosition); trail.reset(flightOrigin); oldOrb.copy(flightOrigin); }
        const progress = (castAge - .2) / 2.75;
        const sweep = Math.sin(Math.PI * progress);
        flightPoint.lerpVectors(flightOrigin, idleOrb, progress);
        flightPoint.x += Math.sin(Math.PI * 2 * progress) * 1.12;
        flightPoint.y += sweep * .83;
        flightPoint.z += sweep * 1.18;
        orb.root.position.copy(flightPoint);
        trail.update(oldOrb, flightPoint, progress > .55);
      } else {
        orb.root.position.copy(idleOrb);
        trail.mesh.visible = false;
      }
      previousCast = castAge;
      orb.setActive(castAge >= .2 && castAge < 2.95);
      orb.update(time, castAge < 2.95 ? 1.1 : .7);
      orbLight.position.copy(orb.root.position);
      orbLight.intensity = castAge < 2.95 ? 3.8 : 2.1;
      canvas.dataset.heroAction = castAge < 2.95 ? "orb" : "idle";
      renderer.render(scene, camera);
      dirty = false;
    }
    frameId = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      mixer?.stopAllAction();
      if (model) mixer?.uncacheRoot(model);
      portalTicks.dispose();
      disposeObjects([scene]);
      environment.dispose();
      renderer.dispose();
      // The game creates its own renderer. Release this context before entering it.
      renderer.forceContextLoss();
    };
  }, []);

  return <div className={"halloween-start-scene is-" + status}>
    <div className="halloween-start-scene-aura" aria-hidden="true" />
    <canvas ref={canvasRef} aria-label="NeonBoy animado invoca su orbe entre luces de neón y vinilos" />
    <div className="halloween-start-scene-caption" aria-hidden="true"><span>NEONBOY</span><small>EL SONIDO ATRAVIESA LA OSCURIDAD</small></div>
    {status === "loading" && <span className="halloween-start-scene-loading" role="status">Invocando a NeonBoy...</span>}
    {status === "ready" && <div className="halloween-start-scene-controls">
      <button type="button" onClick={() => { controls.current.cast = true; setPaused(false); }}><Sparkles size={14} /> INVOCAR ORBE</button>
      <button type="button" className="halloween-start-motion" onClick={() => setPaused((value) => !value)}
        aria-label={paused ? "Reanudar animación" : "Pausar animación"} aria-pressed={paused} title={paused ? "Reanudar animación" : "Pausar animación"}>
        {paused ? <Play size={14} /> : <Pause size={14} />}
      </button>
    </div>}
  </div>;
}
