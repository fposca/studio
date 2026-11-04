import { chromium } from "@playwright/test";
const browser = await chromium.launch({ headless: true, channel: "chrome", args: ["--enable-unsafe-swiftshader"] });
try {
  const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.route("**/shield-check", route => route.fulfill({ contentType: "text/html", body: '<html><body style="margin:0"></body></html>' }));
  await page.goto("http://127.0.0.1:5175/discografia/shield-check");
  const result = await page.evaluate(async () => {
    const url = "/discografia/halloweenDemonShield.js";
    const source = await (await fetch(url)).text();
    const THREE = await import(source.match(/from "([^"\n]+three[^"\n]+)"/)[1]);
    const { createHalloweenDemonShield } = await import(url);
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(640, 480);
    document.body.append(renderer.domElement);
    const shaderErrors = [];
    renderer.debug.onShaderError = (gl, program, vs, fs) => shaderErrors.push(gl.getProgramInfoLog(program) + gl.getShaderInfoLog(vs) + gl.getShaderInfoLog(fs));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d101a);
    scene.add(new THREE.HemisphereLight(0xbbddff, 0x22112c, 2));
    const actor = new THREE.Group();
    scene.add(actor);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.3, .7, 4, 24), new THREE.MeshStandardMaterial({ color: 0x4c445e }));
    body.position.y = 1;
    const head = new THREE.Mesh(new THREE.SphereGeometry(.22, 24, 16), body.material);
    head.position.y = 1.72;
    actor.add(body, head);
    for (const x of [-.15, .15]) {
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .48, 4, 16), body.material);
      leg.position.set(x, .35, 0); actor.add(leg);
    }
    const grid = new THREE.GridHelper(16, 16, 0x445566, 0x223344); scene.add(grid);
    const camera = new THREE.PerspectiveCamera(48, 640/480, .1, 20);
    camera.position.set(2.7, 2.5, 4.5); camera.lookAt(0, 1, 0);
    const shield = createHalloweenDemonShield(scene, actor);
    const gl = renderer.getContext();
    const read = () => { renderer.render(scene, camera); const data = new Uint8Array(640*480*4); gl.readPixels(0,0,640,480,gl.RGBA,gl.UNSIGNED_BYTE,data); return data; };
    const before = read();
    shield.flash(new THREE.Vector3(.3, 1.25, 1)); shield.update(.12);
    const after = read();
    const changed = after.reduce((n,v,i) => n + (Math.abs(v-before[i]) > 10 ? 1 : 0), 0);
    window.shieldPreview = { shield, renderer, scene, camera };
    const visibleAtImpact = shield.mesh.visible;
    shield.update(1);
    const faded = read();
    const residual = faded.reduce((n,v,i) => n + (v !== before[i] ? 1 : 0), 0);
    shield.flash(new THREE.Vector3(.3, 1.25, 1));
    shield.setDisabled(true);
    const matrix = read();
    const matrixResidual = matrix.reduce((n,v,i) => n + (v !== before[i] ? 1 : 0), 0);
    shield.setDisabled(false); shield.flash(new THREE.Vector3(.3,1.25,1)); shield.update(.12); read();
    return { changed, residual, matrixResidual, visibleAtImpact, shaderErrors, glError: gl.getError() };
  });
  await page.screenshot({ path: ".tmp/halloween-shield-preview.png" });
  console.log(JSON.stringify({ ...result, errors }));
  if (errors.length || result.shaderErrors.length || result.glError || result.changed < 5000 || result.residual || result.matrixResidual || !result.visibleAtImpact) throw new Error("Shield render check failed");
} finally { await browser.close(); }
