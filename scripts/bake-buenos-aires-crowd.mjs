// Offline, eight-view walking/phone impostors of the actual Meshy citizens.
// Run after optimize-buenos-aires-crowd.mjs. No baking/render loop runs in the game.
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const dependency = createRequire(realpathSync(path.join(root, "node_modules/@gltf-transform/cli/bin/cli.js")));
const sharp = dependency("sharp");
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5184", "--strictPort", "--configLoader", "runner"],
  { cwd: root, windowsHide: true, stdio: "ignore" });
let browser;
try {
  let up = false;
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch("http://127.0.0.1:5184")).ok) { up = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!up) throw new Error("Vite did not start on 5184");
  browser = await chromium.launch({ channel: "chrome", args: ["--enable-webgl", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage();
  page.on("pageerror", error => { throw error; });
  await page.route("**/crowd-bake", route => route.fulfill({ contentType: "text/html", body: "<html><body></body></html>" }));
  await page.goto("http://127.0.0.1:5184/crowd-bake");
  const families = [
    ["peaton-hombre-camina-celular", "peaton-hombre-quieto-celular"],
    ["peaton-mujer-camina-celular", "peaton-mujer-quieta-celular"],
    ["ejecutivo-camina-celular", "ejecutivo-quieto-celular"],
    ["senora-camina-celular", "senora-quieta-celular"],
    ["bsas/fatman-caminando", "bsas/fatman-inactivo"],
    ["bsas/viejo-caminando", "bsas/viejo-repsiando"],
    ["bsas/viejo-loro-caminando", "bsas/viejo-loro-inactivo"],
  ];
  for (const [name, idle] of families) {
    const png = await page.evaluate(async ({ name, idle }) => {
      const THREE = await import("/node_modules/three/build/three.module.js");
      const { GLTFLoader } = await import("/node_modules/three/examples/jsm/loaders/GLTFLoader.js");
      const { MeshoptDecoder } = await import("/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js");
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      const base = "/src/assets/neonboy-animaciones/";
      const asset = await loader.loadAsync(base + name + ".city.glb");
      const idleAsset = await loader.loadAsync(base + idle + ".anim.glb");
      const scene = new THREE.Scene(), model = asset.scene;
      const box = new THREE.Box3().setFromObject(model), pivot = new THREE.Group();
      pivot.scale.setScalar(1.85 / (box.max.y - box.min.y));
      model.position.y -= box.min.y; pivot.add(model); scene.add(pivot);
      scene.add(new THREE.HemisphereLight(0xe5f1ff, 0x858c9b, 2.1));
      const light = new THREE.DirectionalLight(0xffffff, 1.8); light.position.set(-3, 5, 5); scene.add(light);
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
      renderer.setSize(128, 256); renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      const camera = new THREE.OrthographicCamera(-.6, .6, 1.2, -1.2, .1, 20);
      const atlas = document.createElement("canvas"); atlas.width = 1024; atlas.height = 1280;
      const context = atlas.getContext("2d");
      const mixer = new THREE.AnimationMixer(model);
      for (let row = 0; row < 5; row++) {
        mixer.stopAllAction();
        const clip = (row === 4 ? idleAsset.animations[0] : asset.animations[0]).clone();
        for (const track of clip.tracks) if (/(Hips|Root)\.position$/.test(track.name))
          for (let k = 0, y = track.values[1]; k < track.values.length; k += 3) {
            track.values[k] = 0; track.values[k + 1] = y; track.values[k + 2] = 0;
          }
        mixer.clipAction(clip).play(); mixer.setTime(row === 4 ? clip.duration * .5 : clip.duration * (row + .25) / 4);
        for (let col = 0; col < 8; col++) {
          const angle = col * Math.PI / 4;
          camera.position.set(Math.sin(angle) * 5, 1.1, Math.cos(angle) * 5); camera.lookAt(0, 1.1, 0);
          renderer.render(scene, camera); context.drawImage(renderer.domElement, col * 128, row * 256);
        }
      }
      renderer.dispose(); return atlas.toDataURL("image/png").split(",")[1];
    }, { name, idle });
    const output = path.join(root, "src/assets/neonboy-animaciones", name + ".crowd.webp");
    const info = await sharp(Buffer.from(png, "base64")).webp({ quality: 88, alphaQuality: 100 }).toFile(output);
    console.log(name, info.size, "bytes", "8 directions / 4 walking poses + phone idle");
  }
} finally { await browser?.close(); server.kill(); }
