import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import { disposeObjects } from "../../src/game/disposeGameObjects.js";

// One small render target, no extra lights or shadow pass. The actual scene is
// reflected, including animated characters and the active frequency materials.
export function createHalloweenMirror({ mobile = false, lowPower = false, reflectionEnabled = true } = {}) {
  const root = new THREE.Group();
  root.name = "Halloween / Mirror assembly";
  const resolution = lowPower ? 256 : mobile ? 512 : 1024;
  const surface = new Reflector(new THREE.PlaneGeometry(.96, 1.28), {
    textureWidth: resolution, textureHeight: resolution, multisample: 0,
    clipBias: .003, color: new THREE.Color(.5, .5, .5),
  });
  surface.name = "Halloween / Mirror reflection";
  surface.userData.halloweenCodeExclude = true;
  surface.position.z = .21;
  surface.material.uniforms.reflectionReady = { value: 0 };
  surface.material.vertexShader = surface.material.vertexShader
    .replace("varying vec4 vUv;", "varying vec4 vUv; varying vec2 glassUv;")
    .replace("void main() {", "void main() { glassUv = uv;");
  surface.material.fragmentShader = surface.material.fragmentShader
    .replace("varying vec4 vUv;", "varying vec4 vUv; varying vec2 glassUv; uniform float reflectionReady;")
    .replace("gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );", `
      vec3 reflected = blendOverlay(base.rgb, color);
      float edge = smoothstep(0.0, .035, min(min(glassUv.x, 1.0-glassUv.x), min(glassUv.y, 1.0-glassUv.y)));
      vec3 silver = vec3(.075, .085, .105) + .025 * (1.0-glassUv.y);
      gl_FragColor = vec4(mix(silver, reflected * mix(.82, 1.0, edge), reflectionReady), 1.0);
    `);
  root.add(surface);

  const haloCanvas = document.createElement("canvas");
  haloCanvas.width = 256; haloCanvas.height = 384;
  const haloContext = haloCanvas.getContext("2d");
  haloContext.fillStyle = "rgba(255,255,255,.025)";
  for (let i = 0; i < 30; i++) {
    haloContext.beginPath();
    haloContext.ellipse(128, 192, 126-i*1.3, 189-i*1.95, 0, 0, Math.PI*2);
    haloContext.fill();
  }
  const haloMap = new THREE.CanvasTexture(haloCanvas);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.38), new THREE.MeshBasicMaterial({
    map: haloMap, color: 0xf6c792, transparent: true, opacity: .30,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  }));
  halo.name = "Halloween / Mirror backlight";
  halo.userData.halloweenCodeExclude = true;
  halo.position.z = -.025;
  root.add(halo);

  const bezel = new THREE.Group();
  bezel.name = "Halloween / Mirror locator";
  const bronze = new THREE.MeshStandardMaterial({ color: 0xb99460, metalness: .7, roughness: .32, emissive: 0x352213, emissiveIntensity: .18 });
  for (const [x, y, w, h] of [[0,.655,1.01,.022],[0,-.655,1.01,.022],[-.495,0,.022,1.31],[.495,0,.022,1.31]]) {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(w,h,.026),bronze);
    edge.position.set(x,y,.21); edge.userData.halloweenCodeExclude = true; bezel.add(edge);
  }
  root.add(bezel);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.34,.18,.035),bronze);
  plate.position.set(0,-1.06,.065); plate.userData.halloweenCodeExclude = true;
  root.add(plate);
  const titleCanvas = document.createElement("canvas");
  titleCanvas.width = 1024; titleCanvas.height = 128;
  const ctx = titleCanvas.getContext("2d");
  ctx.fillStyle = "#17151b"; ctx.fillRect(0,0,1024,128);
  ctx.strokeStyle = "#9c815c55"; ctx.lineWidth = 2; ctx.strokeRect(12,12,1000,104);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f3e5cf"; ctx.font = '600 62px "Bahnschrift", sans-serif';
  ctx.fillText("ESPEJO DE LAS ALMAS",512,85,950);
  const titleMap = new THREE.CanvasTexture(titleCanvas); titleMap.colorSpace = THREE.SRGBColorSpace;
  const title = new THREE.Mesh(new THREE.PlaneGeometry(1.3,.163),new THREE.MeshBasicMaterial({map:titleMap,toneMapped:false}));
  title.name = "Halloween / Mirror title";
  title.position.set(0,-1.06,.084); title.userData.halloweenCodeExclude = true;
  root.add(title);

  const capture = surface.onBeforeRender;
  const mirrorPosition = new THREE.Vector3(), cameraPosition = new THREE.Vector3(), normal = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const interval = 1000 / (lowPower ? 10 : mobile ? 15 : 24);
  let enabled = reflectionEnabled, player = null, nextFrame = 0, active = false, failed = false;
  surface.onBeforeRender = function(renderer, scene, camera) {
    if (!enabled || failed) return;
    surface.getWorldPosition(mirrorPosition);
    camera.getWorldPosition(cameraPosition).sub(mirrorPosition);
    normal.set(0,0,1).applyQuaternion(surface.getWorldQuaternion(rotation));
    if (cameraPosition.lengthSq() > 144 || cameraPosition.dot(normal) <= 0) return;
    const now = performance.now();
    if (now < nextFrame) return;
    nextFrame = now + interval;
    const hidden = [];
    // Interaction badges belong to the UI, not to the reflected room.
    scene.traverseVisible(object => {
      if (object.name === "interaction-prompt" || object.userData.excludeFromMirror) hidden.push(object);
    });
    hidden.forEach(object => { object.visible = false; });
    const playerVisible = player?.visible;
    if (player) player.visible = true; // Also reflect NeonBoy in first person.
    const target = renderer.getRenderTarget(), shadows = renderer.shadowMap.autoUpdate, xr = renderer.xr.enabled;
    try {
      capture.call(surface,renderer,scene,camera);
      surface.material.uniforms.reflectionReady.value = 1;
    } catch (error) {
      failed = true;
      console.warn("No se pudo actualizar el reflejo del espejo.",error);
    } finally {
      surface.visible = true;
      if (player) player.visible = playerVisible;
      hidden.forEach(object => { object.visible = true; });
      renderer.shadowMap.autoUpdate = shadows; renderer.xr.enabled = xr;
      renderer.setRenderTarget(target);
    }
  };
  return {
    root, surface,
    setDepth(depth) { surface.position.z = depth; bezel.children.forEach(edge => { edge.position.z = depth-.008; }); },
    setPlayer(value) { player = value; },
    setEnabled(value) { enabled = value; },
    invalidate() { nextFrame = 0; failed = false; surface.material.uniforms.reflectionReady.value = 0; },
    setVision(value) {
      if (active === value) return;
      active = value; nextFrame = 0;
      halo.material.color.set(value ? 0x7cf2bd : 0xf6c792);
      bronze.color.set(value ? 0x7eae91 : 0xb99460);
      surface.material.uniforms.color.value.setRGB(value ? .39 : .5, value ? .55 : .5, value ? .45 : .5);
    },
    dispose() {
      surface.dispose();
      disposeObjects([root]);
      haloMap.dispose(); titleMap.dispose();
      root.removeFromParent();
    },
  };
}
