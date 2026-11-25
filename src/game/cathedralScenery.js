import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { CATHEDRAL_ALTAR_PLATFORM, CATHEDRAL_INTERACTIONS, CATHEDRAL_RESONATOR_COLLIDERS, canStandInCathedral } from "./cathedralLayout.js";
import { createCathedralArt, cathedralStoneBox } from "./cathedralArt.js";
import { createCathedralEnergy } from "./cathedralEnergy.js";
import { createCathedralPresentation } from "./cathedralPresentation.js";
import { cathedralProfile } from "./cathedralQuality.js";
import { createCathedralAudio } from "./cathedralAudio.js";

const INSCRIPTION_FONT_URL = new URL("../assets/fonts/helvetiker_regular.typeface.json", import.meta.url).href;
let inscriptionFontPromise;
const loadInscriptionFont = () => inscriptionFontPromise ||= new FontLoader().loadAsync(INSCRIPTION_FONT_URL);
const INSCRIPTION_LINES = ["SOLO QUIEN RECUERDA", "COMPRENDE EL PASO", "DEL TIEMPO Y ENFRENTA", "LA VERDAD"];

const STONE_URL = new URL("../assets/environments/bridge-stone.chapter11.jpg", import.meta.url).href;
const BASALT_URL = new URL("../assets/environments/basalt.chapter11.jpg", import.meta.url).href;
const CUSTODIAN_URL = new URL("../assets/neonboy-animaciones/chapter12/custodio.mobile.glb", import.meta.url).href;
const CUSTODIAN_CLIPS = {
  walk: new URL("../assets/neonboy-animaciones/chapter12/custodio-camina.anim.glb", import.meta.url).href,
  talk: new URL("../assets/neonboy-animaciones/chapter12/custodio-habla.anim.glb", import.meta.url).href,
  point: new URL("../assets/neonboy-animaciones/chapter12/custodio-senala.anim.glb", import.meta.url).href,
  invoke: new URL("../assets/neonboy-animaciones/chapter12/custodio-invoca.anim.glb", import.meta.url).href,
};

export function buildCathedral(scene, { initialProgress, onFeedback, tier = "high" } = {}) {
  scene.name = "Capítulo 12 / La Catedral de los Condenados";
  scene.background = new THREE.Color(0x11121c);
  scene.fog = new THREE.FogExp2(0x242331, .021);
  const root = new THREE.Group(); root.name = "Catedral de los Condenados"; scene.add(root);
  const materials = {
    floor: new THREE.MeshStandardMaterial({ color: 0x9c9190, roughness: .84 }),
    wall: new THREE.MeshStandardMaterial({ color: 0x8a8793, roughness: .91 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x5c5868, roughness: .8, metalness: .08 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0x9d805b, roughness: .43, metalness: .55 }),
    violet: new THREE.MeshStandardMaterial({ color: 0x32253f, emissive: 0x6d4a90, emissiveIntensity: .25, roughness: .4, metalness: .2 }),
    inscriptionFace: new THREE.MeshStandardMaterial({ color: 0xd4b98d, roughness: .56, metalness: .32, emissive: 0x38251b, emissiveIntensity: .12 }),
    inscriptionEdge: new THREE.MeshStandardMaterial({ color: 0x5b463b, roughness: .78, metalness: .16 }),
  };
  const box = new THREE.BoxGeometry(1, 1, 1);
  const column = new THREE.CylinderGeometry(.56, .72, 8.1, 16);
  const torus = new THREE.TorusGeometry(1, .022, 8, 64);
  const sphere = new THREE.IcosahedronGeometry(1, 2);
  const stoneGeometries = [];
  const art = createCathedralArt(root, materials);
  const energy = createCathedralEnergy(root);
  let quality = cathedralProfile(tier);
  const audio = createCathedralAudio();
  const presentation = createCathedralPresentation(initialProgress, event => {
    if (event.type === "memory") audio.play("memory");
    if (event.type === "seal-open") audio.play("door");
    if (event.type === "cinema-start") audio.play(event.kind === "altar" ? "altar" : "transmission");
    onFeedback?.(event);
  });
  const cameraBasePosition = new THREE.Vector3(), cameraBaseQuaternion = new THREE.Quaternion(), cameraFocusQuaternion = new THREE.Quaternion();
  const cameraFocusPosition = new THREE.Vector3(), cameraFocusTarget = new THREE.Vector3();
  let cameraDecorated = false, cameraSuppressed = false;
  let latestFx = presentation.fx;
  const use = (geometry, material, name, x, y, z, sx = 1, sy = 1, sz = 1, parent = root) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name; mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
    mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const cube = (material, name, x, y, z, sx, sy, sz, parent) => {
    const textured = [materials.floor, materials.wall, materials.dark].includes(material);
    const geometry = textured ? cathedralStoneBox(sx, sy, sz) : box;
    if (textured) stoneGeometries.push(geometry);
    return use(geometry, material, name, x, y, z, sx, sy, sz, parent);
  };
  const slab = (name, z, depth) => {
    cube(materials.floor, name, 0, -.2, z, 16.8, .4, depth);
    // Only threshold inlays; the floor texture provides the masonry joints.
    cube(materials.bronze, "umbral de piedra", 0, .012, z - depth / 2 + .1, 16.5, .012, .035);
  };
  slab("Nave de los Ecos", -1.15, 28.3);
  slab("Archivo de los Condenados", -29.1, 27.6);
  slab("Altar de la Primera Voz", -51, 17);
  for (const side of [-1, 1]) {
    cube(materials.wall, "muro gótico", side * 8.8, 4.7, -23.3, .75, 9.4, 72);
    for (const z of [9, 0, -10, -22, -32, -47, -56]) {
      use(column, materials.dark, "columna infernal", side * 7.75, 4.05, z);
      cube(materials.bronze, "capitel", side * 7.75, 8.2, z, 1.55, .3, 1.5);
    }
  }
  cube(materials.wall, "muro del ábside", 0, 5, -59.65, 17.7, 10, .75);
  cube(materials.dark, "bóveda de la catedral", 0, 9.6, -23.3, 17.7, .65, 73);
  cube(materials.bronze, "eje de la bóveda", 0, 9.2, -23.3, .32, .25, 72);

  const gate = (z, name) => {
    const group = new THREE.Group(); group.name = name; group.position.z = z; root.add(group);
    cube(materials.wall, "marco izquierdo", -5.35, 4.5, 0, 6.2, 9, 1.1, group);
    cube(materials.wall, "marco derecho", 5.35, 4.5, 0, 6.2, 9, 1.1, group);
    cube(materials.wall, "dintel", 0, 7.85, 0, 4.7, 2.3, 1.15, group);
    const bars = new THREE.Group(); bars.name = "reja ritual"; group.add(bars);
    for (const x of [-1.5, -.75, 0, .75, 1.5]) cube(materials.bronze, "barrote", x, 2.65, .12, .14, 5.3, .15, bars);
    cube(materials.bronze, "travesaño", 0, 2.2, .12, 3.75, .15, .15, bars);
    const seal = art.sigil("verdad", 0, 3.8, .32, 1.45, group, name === "Umbral de la Primera Voz" ? "memories" : "seals");
    art.gateFrame(z, name);
    return { bars, seal };
  };
  const archiveGate = gate(-17, "Umbral del Archivo");
  const altarGate = gate(-42, "Umbral de la Primera Voz");
  energy.attachGate(altarGate);
  const returnGate = art.sigil("memoria", 0, 3, 12.65, 2.3);
  returnGate.name = "Puerta al Puente de las Almas";

  [
    { id: "memoria", x: -3.5, z: -5.3 }, { id: "tiempo", x: 0, z: -7.3 }, { id: "verdad", x: 3.5, z: -5.3 },
  ].forEach(({ id, x, z }, index) => {
    art.pedestal(x, z, id, index);
    art.sigil(id, x, 2.16, z);
  });
  // Raised, bevelled lettering belongs to the existing stone on both approaches.
  const inscription = cube(materials.dark, "inscripcion de los tres sellos", 0, 1.55, 6.1, 2.7, 1.7, .22);
  inscription.rotation.y = Math.PI;
  const inscriptionRing = new THREE.TorusGeometry(.28, .014, 8, 48);
  stoneGeometries.push(inscriptionRing);
  const inscriptionFaces = [];
  for (const side of [1, -1]) {
    const face = new THREE.Group();
    face.name = side === 1 ? "Inscripcion en relieve / entrada" : "Inscripcion en relieve / reverso";
    face.position.set(0, 0, 6.1 + side * .126);
    if (side === -1) face.rotation.y = Math.PI;
    root.add(face);
    inscriptionFaces.push(face);
    use(inscriptionRing, materials.bronze, "sello circular tallado", 0, 2.09, .012, 1, 1, 1, face);
    use(box, materials.bronze, "filete bajo el sello", 0, 1.76, .012, 1.5, .012, .018, face);
  }
  function addInscriptionRelief(font) {
    for (const face of inscriptionFaces) INSCRIPTION_LINES.forEach((line, index) => {
      const geometry = new TextGeometry(line, {
        font, size: .127, depth: .019, curveSegments: 3,
        bevelEnabled: true, bevelThickness: .004, bevelSize: .002, bevelSegments: 1,
      });
      geometry.computeBoundingBox();
      geometry.translate(-(geometry.boundingBox.min.x + geometry.boundingBox.max.x) / 2, 0, 0);
      stoneGeometries.push(geometry);
      use(geometry, [materials.inscriptionFace, materials.inscriptionEdge],
        "verso en relieve / " + (index + 1), 0, 1.59 - index * .24, .018, 1, 1, 1, face);
    });
  }

  for (const side of [-1, 1]) for (const z of [-22, -28, -35]) {
    cube(materials.dark, "estantería de registros", side * 6.55, 2.1, z, 1.35, 4.2, 3.6);
    for (const y of [1.05, 2, 2.95]) cube(materials.bronze, "anaquel de archivo", side * 6.55, y, z, 1.55, .12, 3.75);
  }
  [
    { id: "nave", x: -3.4, z: -26.5 }, { id: "partenon", x: 0, z: -30.4 }, { id: "fracturada", x: 3.4, z: -26.5 },
  ].forEach(({ id, x, z }, index) => {
    art.pedestal(x, z, null, index);
    energy.memory(id, x, z, index);
  });

  const custodian = new THREE.Group(); custodian.name = "Custodio de los Recuerdos";
  custodian.position.set(4.9, 0, -34.5); root.add(custodian);
  energy.attachCustodian(custodian);
  const fallback = new THREE.Group(); fallback.name = "Silueta provisional del Custodio"; custodian.add(fallback);
  use(new THREE.ConeGeometry(.64, 2.45, 8), materials.dark, "manto", 0, 1.34, 0, 1, 1, 1, fallback);
  use(sphere, materials.violet, "rostro velado", 0, 2.33, -.09, .31, .42, .26, fallback);
  use(torus, materials.violet, "aura del Custodio", 0, .07, 0, .88, .88, 1, fallback).rotation.x = Math.PI / 2;
  const custodianLight = new THREE.PointLight(0x9a5bca, 3.5, 7, 2);
  custodianLight.position.set(4.9, 3.1, -34.5); root.add(custodianLight);

  cube(materials.dark, "plataforma ceremonial", CATHEDRAL_ALTAR_PLATFORM.x, .36, CATHEDRAL_ALTAR_PLATFORM.z, CATHEDRAL_ALTAR_PLATFORM.hx * 2, .72, CATHEDRAL_ALTAR_PLATFORM.hz * 2);
  cube(materials.dark, "mesa de obsidiana del primer registro", 0, 1.1, -53.6, 3.6, .5, 2.1);
  cube(materials.bronze, "filete superior del altar", 0, 1.365, -53.6, 3.65, .035, 2.15);
  cube(materials.bronze, "filete inferior del altar", 0, .87, -53.6, 3.65, .035, 2.15);
  for (const x of [-1.69, 1.69]) for (const z of [-54.54, -52.66]) {
    cube(materials.bronze, "esquinero del altar", x, 1.1, z, .045, .47, .045);
  }
  energy.altar(0, -53.6);
  energy.portal(0, 3.2, -58.9);
  const altarLight = new THREE.PointLight(0xec477b, 5, 13, 2);
  altarLight.position.set(0, 4.2, -53.6); root.add(altarLight);
  const ambient = new THREE.HemisphereLight(0xa6b9d6, 0x322330, .85); root.add(ambient);
  const fill = new THREE.DirectionalLight(0xffd9b6, 1.6); fill.position.set(-4, 8, 7); root.add(fill);
  const rim = new THREE.DirectionalLight(0x9bafd9, .8); rim.position.set(6, 5, -25); root.add(rim);
  art.finish(); art.setQuality(quality);
  const obstacles = [
    // The entrance inscription is a solid stone slab, including its rear face.
    { x: 0, z: 6.1, hx: 1.35, hz: .11 },
    ...[[-3.5, -5.3], [0, -7.3], [3.5, -5.3], [-3.4, -26.5], [0, -30.4], [3.4, -26.5]].map(([x, z]) => ({ x, z, radius: .68 })),
    // Match the full raised stone platform, not only the altar table at its center.
    { ...CATHEDRAL_ALTAR_PLATFORM },
    ...CATHEDRAL_RESONATOR_COLLIDERS.map((node) => ({ ...node })),
  ];
  const interactions = CATHEDRAL_INTERACTIONS.map((spot) => ({ ...spot }));
  const custodianSpot = interactions.find((spot) => spot.id === "cathedral-custodian");
  const toneSpots = interactions.filter((spot) => spot.id.startsWith("cathedral-tone-"));
  const abyssSpot = interactions.find((spot) => spot.id === "cathedral-abyss");
  abyssSpot.reach = 0;
  let stoneTexture = null, basaltTexture = null, stoneBump = null, basaltBump = null;
  let custodianModel = null, mixer = null, disposed = false;
  let actions = {}, currentAction = null, pointing = false;
  let invoking = Boolean(initialProgress?.altarActivated), currentWaypoint = invoking ? 3 : 0;
  let lastPointCue = null;
  if (invoking) custodian.position.set(2.9, 0, -50.4);
  const ritualWaypoints = [{ x: 1.25, z: -37.8 }, { x: 1.25, z: -44 }, { x: 2.9, z: -50.4 }];
  function play(name, once = false) {
    const next = actions[name];
    if (!next || currentAction === next) return;
    currentAction?.fadeOut(.16);
    next.reset().fadeIn(.16);
    if (once) { next.setLoop(THREE.LoopOnce, 1); next.clampWhenFinished = true; }
    next.play();
    currentAction = next;
  }
  async function loadAssets(loader, isAlive = () => true) {
    const textureLoader = new THREE.TextureLoader();
    const [stone, basalt, model, inscriptionFont] = await Promise.allSettled([
      textureLoader.loadAsync(STONE_URL), textureLoader.loadAsync(BASALT_URL), loader.loadAsync(CUSTODIAN_URL), loadInscriptionFont(),
    ]);
    if (disposed || !isAlive()) {
      if (stone.status === "fulfilled") stone.value.dispose();
      if (basalt.status === "fulfilled") basalt.value.dispose();
      return true;
    }
    if (inscriptionFont.status === "fulfilled") addInscriptionRelief(inscriptionFont.value);
    if (stone.status === "fulfilled") {
      stoneTexture = stone.value; stoneTexture.colorSpace = THREE.SRGBColorSpace;
      stoneTexture.wrapS = stoneTexture.wrapT = THREE.RepeatWrapping;
      stoneTexture.anisotropy = 4;
      stoneBump = stoneTexture.clone(); stoneBump.colorSpace = THREE.NoColorSpace; stoneBump.needsUpdate = true;
      materials.floor.map = stoneTexture; materials.floor.bumpMap = stoneBump;
      materials.floor.bumpScale = .065; materials.floor.needsUpdate = true;
    }
    if (basalt.status === "fulfilled") {
      basaltTexture = basalt.value; basaltTexture.colorSpace = THREE.SRGBColorSpace;
      basaltTexture.wrapS = basaltTexture.wrapT = THREE.RepeatWrapping;
      basaltTexture.anisotropy = 4;
      basaltBump = basaltTexture.clone(); basaltBump.colorSpace = THREE.NoColorSpace; basaltBump.needsUpdate = true;
      for (const material of [materials.wall, materials.dark]) {
        material.map = basaltTexture; material.bumpMap = basaltBump; material.bumpScale = .045; material.needsUpdate = true;
      }
      art.setStoneTexture(basaltTexture, basaltBump);
    }
    if (model.status === "fulfilled") {
      custodianModel = model.value.scene;
      const bounds = new THREE.Box3().setFromObject(custodianModel);
      const size = bounds.getSize(new THREE.Vector3());
      const scale = 2.7 / Math.max(.01, size.y);
      const center = bounds.getCenter(new THREE.Vector3());
      custodianModel.scale.setScalar(scale);
      custodianModel.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      custodianModel.traverse((part) => { if (part.isMesh) { part.castShadow = false; part.receiveShadow = false; } });
      custodian.add(custodianModel); fallback.visible = false;
      if (model.value.animations.length) {
        mixer = new THREE.AnimationMixer(custodianModel);
        actions.idle = mixer.clipAction(model.value.animations[0]);
        const results = await Promise.allSettled(Object.entries(CUSTODIAN_CLIPS)
          .map(async ([name, url]) => [name, await loader.loadAsync(url)]));
        if (disposed || !isAlive()) return true;
        for (const result of results) if (result.status === "fulfilled") {
          const [name, gltf] = result.value;
          if (gltf.animations[0]) actions[name] = mixer.clipAction(gltf.animations[0]);
        }
        mixer.addEventListener("finished", ({ action }) => {
          if (action === actions.point || action === actions.invoke) {
            currentAction = null;
            play("idle");
          }
        });
        play("idle");
      }
    }
    return true;
  }
  function update(dt, elapsed, progress, player, paused, camera, reducedMotion = false, cue = null, options = {}) {
    const suspended = options.suspended ?? (paused && !cue);
    const step = suspended ? 0 : dt;
    const vision = progress?.visionActive === true;
    audio.update({ suspended, cue, position: player });
    latestFx = presentation.update(dt, progress, { suspended, cue, skip: options.skip || 0 });
    const ritual = latestFx.narrative || latestFx.altarAge < 3.4;
    const lightBlend = 1 - Math.exp(-step * 2.5);
    ambient.intensity = THREE.MathUtils.lerp(ambient.intensity, ritual ? .52 : .85, lightBlend);
    fill.intensity = THREE.MathUtils.lerp(fill.intensity, ritual ? 1.1 : 1.6, lightBlend);
    altarLight.intensity = THREE.MathUtils.lerp(altarLight.intensity, ritual ? 6 : progress?.altarOpen ? 5 : 2.5, lightBlend);
    art.update(dt, progress, suspended, reducedMotion, camera);
    energy.update(dt, progress, suspended, reducedMotion, camera, { fx: latestFx, player, profile: quality });
    // Before and after tuning, keep the altar prompt clear of the nearby resonators.
    const tuning = Boolean(progress?.altarTuning && !progress?.altarActivated);
    for (const spot of toneSpots) spot.reach = tuning ? 1.55 : 0;
    abyssSpot.reach = progress?.completed ? 2.4 : 0;
    scene.fog.color.setHex(vision ? 0x132d30 : 0x242331);
    archiveGate.bars.visible = !progress?.archiveOpen;
    archiveGate.seal.visible = !progress?.archiveOpen;
    custodianLight.position.set(custodian.position.x, 2.8, custodian.position.z + .7);
    custodianLight.intensity = vision ? 4 : 2.6;
    // One NPC walks through the existing open gate during the ritual; its prompt follows it.
    if (progress?.altarActivated && !invoking) {
      invoking = true;
      play("invoke", true);
    } else if (currentAction === actions.invoke) {
      // Let the one-shot ceremony finish before the Custodian starts walking.
    } else if (invoking && currentWaypoint < ritualWaypoints.length && cue?.speaker !== "CUSTODIO") {
      const target = ritualWaypoints[currentWaypoint];
      const dx = target.x - custodian.position.x, dz = target.z - custodian.position.z;
      const gap = Math.hypot(dx, dz);
      if (gap < .08) currentWaypoint++;
      else {
        const travel = Math.min(gap, step * 2.4);
        custodian.position.x += dx / gap * travel;
        custodian.position.z += dz / gap * travel;
        custodian.rotation.y = Math.atan2(dx, dz);
        play("walk");
      }
    } else if (cue?.id === "custodio-12" && lastPointCue !== cue.id) {
      pointing = true; lastPointCue = cue.id;
      play("point", true);
    } else if (currentAction !== actions.point && currentAction !== actions.invoke) {
      play(cue?.speaker === "CUSTODIO" ? "talk" : "idle");
      if (player && !suspended && Math.hypot(player.x - custodian.position.x, player.z - custodian.position.z) < 5) {
        const angle = Math.atan2(player.x - custodian.position.x, player.z - custodian.position.z);
        const difference = Math.atan2(Math.sin(angle - custodian.rotation.y), Math.cos(angle - custodian.rotation.y));
        custodian.rotation.y += THREE.MathUtils.clamp(difference, -step * .8, step * .8);
      }
    }
    custodianSpot.x = custodian.position.x;
    custodianSpot.z = custodian.position.z;
    if (cue?.id !== "custodio-12") lastPointCue = null;
    mixer?.update(step);
  }
  return {
    interactions, obstacles, colliders: [], canStand: canStandInCathedral,
    setQuality(tier) { quality = cathedralProfile(tier); art.setQuality(quality); },
    get quality() { return quality; },
    get presentationState() { return { memories: [...latestFx.memoryAges], seal: latestFx.sealAge, cinema: presentation.cinema }; },
    restoreCamera(camera) {
      if (cameraDecorated) { camera.position.copy(cameraBasePosition); camera.quaternion.copy(cameraBaseQuaternion); cameraDecorated = false; }
    },
    applyCamera(camera, player, { reducedMotion, firstPerson, input, suspended } = {}) {
      if (reducedMotion || firstPerson || suspended) return;
      if (latestFx.altarAge < .1) cameraSuppressed = false;
      if (input) cameraSuppressed = true;
      const age = latestFx.altarAge;
      const focus = !cameraSuppressed && age < 3.4 && player.z < -46 ? Math.sin(Math.PI * age / 3.4) ** 2 * .65 : 0;
      const memoryAge = Math.min(...latestFx.memoryAges);
      const impulse = memoryAge < .55 ? Math.sin(memoryAge * 9) * .009 * (1 - memoryAge / .55) : 0;
      if (focus < .0001 && Math.abs(impulse) < .0001) return;
      cameraBasePosition.copy(camera.position); cameraBaseQuaternion.copy(camera.quaternion); cameraDecorated = true;
      if (focus > .0001) {
        cameraFocusPosition.set(THREE.MathUtils.clamp(player.x + 1.5, -3.1, 3.1), 3.65, -49.4);
        cameraFocusTarget.set(0, 2.75, -53.6);
        camera.position.lerp(cameraFocusPosition, focus); camera.lookAt(cameraFocusTarget);
        cameraFocusQuaternion.copy(camera.quaternion);
        camera.quaternion.slerpQuaternions(cameraBaseQuaternion, cameraFocusQuaternion, focus);
      }
      camera.position.y += impulse;
    },
    getTargets: () => [], registerImpact: () => null, loadAssets, update,
    get modelLoaded() { return Boolean(custodianModel && Object.keys(actions).length === 5); },
    get animationState() { return Object.entries(actions).find(([, action]) => action === currentAction)?.[0] || "none"; },
    get pointed() { return pointing; },
    get invoked() { return invoking; },
    dispose() {
      disposed = true; mixer?.stopAllAction();
      art.dispose(); energy.dispose(); audio.dispose();
      stoneTexture?.dispose(); basaltTexture?.dispose(); stoneBump?.dispose(); basaltBump?.dispose();
      stoneGeometries.forEach((geometry) => geometry.dispose());
      for (const geometry of [box, column, torus, sphere]) geometry.dispose();
      fallback.children.forEach((child) => { if (child.geometry && ![box, column, torus, sphere].includes(child.geometry)) child.geometry.dispose(); });
      Object.values(materials).forEach((material) => material.dispose());
    },
  };
}
