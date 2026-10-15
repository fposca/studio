import * as THREE from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { PARTHENON_PERIODS } from "../editors/parthenonSet.js";
import { createDragonAnimationClips, DRAGON_BREATHING_CLIP, DRAGON_FLYING_CLIP } from "../editors/dragonAnimation.js";

const ease = (value) => {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

function cloudTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 4, 64, 64, 62);
  gradient.addColorStop(0, "rgba(255,255,255,0.78)");
  gradient.addColorStop(0.3, "rgba(255,255,255,0.53)");
  gradient.addColorStop(0.7, "rgba(255,255,255,0.16)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

export function createGameTempleSky(parent, world, dragonAsset) {
  const group = new THREE.Group(); group.name = "Ascenso entre neblina y nubes"; parent.add(group);
  const texture = cloudTexture();
  const mistMaterial = new THREE.SpriteMaterial({ map: texture, color: 0xa6adba, opacity: 0.32,
    transparent: true, depthWrite: false, fog: false });
  const cloudMaterial = new THREE.SpriteMaterial({ map: texture, color: 0xe4e2d8, opacity: 0.62,
    transparent: true, depthWrite: false, fog: false });
  const wisps = [];
  const ascent = world.platforms.filter((platform) => platform.sky);
  for (let index = 0; index < 40; index++) {
    const mist = index < 12;
    const step = mist ? ascent[Math.floor(index / 2)] : ascent[Math.min(ascent.length - 1, 5 + Math.floor((index - 12) / 2))];
    const sprite = new THREE.Sprite(mist ? mistMaterial : cloudMaterial);
    const x = step.x + (index % 2 ? (mist ? 3.5 : 4.7) : (mist ? -3.5 : -4.7));
    const y = step.y + (mist ? 0.45 : 1.15) + (index % 3) * 0.22;
    const z = step.z + (index % 3 - 1) * 1.6;
    sprite.position.set(x, y, z);
    sprite.scale.set(mist ? 8.4 : 6.3, mist ? 3.1 : 3.5, 1);
    sprite.userData.base = { x, y, z };
    group.add(sprite); wisps.push(sprite);
  }
  const puffMaterial = new THREE.SpriteMaterial({ map: texture, color: 0xb7c5d8,
    opacity: 0.7, transparent: true, depthWrite: false, fog: false });
  ascent.forEach((step, index) => {
    if (index < 6 || index % 3 !== 0) return;
    for (const side of [-1, 1]) for (let lobe = 0; lobe < 3; lobe++) {
      const puff = new THREE.Sprite(puffMaterial);
      puff.name = "Nube alta";
      puff.position.set(step.x + side * (4.4 + lobe * 0.65), step.y + 1.35 + lobe * 0.24,
        step.z + (lobe - 1) * 1.1);
      puff.scale.set(4.7 - lobe * 0.4, 2.8 + lobe * 0.18, 1);
      group.add(puff);
    }
  });
  for (const [x, y, z, width] of [[3.8, 22.4, -31.8, 5.2], [6.3, 25.1, -34.5, 6.6], [9.1, 28.3, -37.2, 8]]) {
    const cloud = new THREE.Sprite(puffMaterial);
    cloud.name = "Nube de despedida";
    cloud.position.set(x, y, z); cloud.scale.set(width, width * 0.55, 1);
    group.add(cloud);
  }
  const root = new THREE.Group(); root.name = "Dragon aliado"; group.add(root);
  const model = clone(dragonAsset.scene);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const scale = 3.5 / Math.max(size.y, 0.01);
  model.scale.setScalar(scale);
  model.position.set(-bounds.getCenter(new THREE.Vector3()).x * scale, -bounds.min.y * scale,
    -bounds.getCenter(new THREE.Vector3()).z * scale);
  model.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true; object.receiveShadow = true;
    object.frustumCulled = false; object.userData.sharedGameAsset = true;
  });
  root.add(model);
  model.userData.bundledModel = "dragon";
  const mixer = new THREE.AnimationMixer(model);
  const clips = createDragonAnimationClips(model);
  const breathing = mixer.clipAction(clips.find((clip) => clip.name === DRAGON_BREATHING_CLIP)).play();
  const flying = mixer.clipAction(clips.find((clip) => clip.name === DRAGON_FLYING_CLIP)).play();
  const perchGlow = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.3, 48),
    new THREE.MeshBasicMaterial({ color: 0xe4c68f, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false }));
  perchGlow.name = "Marca del dragon"; perchGlow.rotation.x = -Math.PI / 2;
  perchGlow.position.set(world.level.dragon.x, world.level.dragon.y + 0.035, world.level.dragon.z);
  group.add(perchGlow);
  const skyFog = new THREE.Color();
  const skeletons = new Set(); model.traverse((object) => { if (object.skeleton) skeletons.add(object.skeleton); });
  return {
    root: group,
    update(phase, period, time, player, scene) {
      group.visible = phase !== "title";
      const altitude = phase === "game" ? player.y : 0;
      const mist = ease((altitude - 2.8) / 4.8) * (1 - 0.78 * ease((altitude - 8) / 8));
      const mode = PARTHENON_PERIODS.find((entry) => entry.id === period) || PARTHENON_PERIODS[0];
      if (scene.fog) {
        scene.fog.near = THREE.MathUtils.lerp(70, 12, mist);
        scene.fog.far = THREE.MathUtils.lerp(280, 68, mist);
        skyFog.set(period === "night" ? 0x667487 : 0xd4d7cf);
        scene.fog.color.set(mode.skyHorizon).lerp(skyFog, mist * 0.74);
      }
      mistMaterial.color.set(period === "night" ? 0xa3acc1 : 0xd4d6cf);
      cloudMaterial.color.set(period === "night" ? 0xb9c5d6 : 0xf4f1e8);
      puffMaterial.color.set(period === "night" ? 0xb7c5d8 : 0xf1eee5);
      wisps.forEach((sprite, index) => {
        const base = sprite.userData.base;
        sprite.position.x = base.x + Math.sin(time * 0.13 + index * 0.7) * 0.4;
        sprite.position.z = base.z + Math.cos(time * 0.1 + index * 0.5) * 0.3;
      });
      const landing = ease((time - (world.level.dragon.landingTime - 4)) / 4);
      const angle = time * 0.2;
      const flight = new THREE.Vector3(3 + Math.cos(angle) * 9, 21.5 + Math.sin(time * 0.8) * 1.2,
        -20 + Math.sin(angle) * 9);
      root.position.copy(flight).lerp(new THREE.Vector3(world.level.dragon.x, world.level.dragon.y,
        world.level.dragon.z), landing);
      root.rotation.set(-0.08 - landing * 0.12, -angle - Math.PI / 2, Math.sin(time * 0.75) * 0.11 * (1 - landing));
      if (landing >= 1) root.rotation.y = Math.atan2(player.x - root.position.x, player.z - root.position.z);
      root.visible = true;
      root.scale.set(1, 1 - landing * 0.17, 1);
      const departure = world.dragonMet ? Math.max(0, time - (world.dragonDepartureTime ?? 0)) : 0;
      const flightWeight = world.dragonMet ? ease(departure / 0.35) : 1 - landing;
      breathing.setEffectiveWeight(1 - flightWeight);
      flying.setEffectiveWeight(flightWeight);
      mixer.setTime(time);
      perchGlow.visible = landing > 0.8;
      perchGlow.material.opacity = 0.38 + Math.sin(time * 2.1) * 0.08;
      if (world.dragonMet) {
        const lift = ease(departure / 1.2);
        const flightAway = ease((departure - 0.75) / 5.25);
        root.position.set(world.level.dragon.x + lift * 1.1 + flightAway * 9,
          world.level.dragon.y + lift * 1.5 + flightAway * 9.5 + Math.sin(departure * 6) * 0.16,
          world.level.dragon.z - lift * 1.2 - flightAway * 8);
        root.rotation.set(-0.2 - flightAway * 0.42, -Math.PI / 2 + flightAway * 0.32,
          Math.sin(departure * 5) * 0.15 + flightAway * 0.23);
        root.scale.setScalar(1 - ease((departure - 3.7) / 2.3) * 0.68);
        root.visible = departure < 6;
        perchGlow.visible = false;
      }
    },
    dispose() { mixer.stopAllAction(); mixer.uncacheRoot(model); skeletons.forEach((skeleton) => skeleton.dispose()); }
  };
}
