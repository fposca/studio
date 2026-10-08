import { chromium } from '../node_modules/.pnpm/playwright@1.55.0/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true,
  executablePath: 'C:/Users/posca/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 760 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.route('**/__field_preview', route => route.fulfill({ contentType: 'text/html', body: '<body style="margin:0"></body>' }));
try {
  await page.goto('http://127.0.0.1:5173/__field_preview');
  await page.evaluate(async () => {
    const THREE = await import('/node_modules/.vite/deps/three.js');
    const { createFieldPanorama, configureFieldPanoramaTexture } = await import('/src/editors/fieldPanorama.js');
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    document.body.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
    camera.position.set(0, 4, 20);
    camera.lookAt(0, 4, -16);
    const old = await new THREE.TextureLoader().loadAsync('/src/assets/environments/field-panorama-enhanced-4k.jpg');
    old.colorSpace = THREE.SRGBColorSpace;
    old.mapping = THREE.EquirectangularReflectionMapping;
    old.wrapS = THREE.MirroredRepeatWrapping;
    old.repeat.x = 2;
    const source = await new THREE.TextureLoader().loadAsync('/src/assets/environments/field-panorama.png');
    configureFieldPanoramaTexture(source, renderer.capabilities.getMaxAnisotropy());
    const field = createFieldPanorama();
    field.userData.setTexture(source);
    scene.add(field);
    window.preview = { THREE, renderer, scene, camera, field, old, source };
    window.renderPreview = (useOld = false) => {
      field.visible = !useOld;
      scene.background = useOld ? old : new THREE.Color('#758b99');
      renderer.render(scene, camera);
      const canvas = document.createElement('canvas');
      canvas.width = 144; canvas.height = 76;
      const context = canvas.getContext('2d');
      context.drawImage(renderer.domElement, 0, 0, 144, 76);
      const data = context.getImageData(0, 0, 144, 76).data;
      let min = 255, max = 0, sum = 0, signature = 0;
      for (let i = 0; i < data.length; i += 4) {
        const value = (data[i] + data[i+1] + data[i+2]) / 3;
        min = Math.min(min, value); max = Math.max(max, value); sum += value;
        signature += (data[i] * 3 + data[i+1] * 5 + data[i+2] * 7) * (i % 97 + 1);
      }
      return { min, max, mean: sum / (144 * 76), signature };
    };
  });
  const results = {};
  results.before = await page.evaluate(() => window.renderPreview(true));
  await page.screenshot({ path: 'field-check-before.jpg', quality: 94 });
  results.after = await page.evaluate(() => window.renderPreview(false));
  await page.screenshot({ path: 'field-check-after.jpg', quality: 94 });
  results.characterScene = await page.evaluate(async () => {
    const { THREE, scene } = window.preview;
    const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
    const grass = await new THREE.TextureLoader().loadAsync('/src/assets/environments/grass-texture.png');
    grass.colorSpace = THREE.SRGBColorSpace;
    grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
    grass.repeat.set(80, 80);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(280, 280), new THREE.MeshStandardMaterial({ map: grass, color: 0x657b42 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor, new THREE.HemisphereLight(0xfff5dd, 0x66805a, 1));
    const light = new THREE.DirectionalLight(0xfff5dd, 2.6);
    light.position.set(5, 8, 4); scene.add(light);
    const gltf = await new GLTFLoader().loadAsync('/src/assets/neonboy-animaciones/neon-inactivo-hd.glb');
    const bounds = new THREE.Box3().setFromObject(gltf.scene);
    gltf.scene.scale.setScalar(4.8 / bounds.getSize(new THREE.Vector3()).y);
    bounds.setFromObject(gltf.scene);
    gltf.scene.position.y -= bounds.min.y;
    scene.add(gltf.scene);
    window.preview.floor = floor;
    window.preview.character = gltf.scene;
    return window.renderPreview(false);
  });
  await page.screenshot({ path: 'field-check-scene.jpg', quality: 94 });
  await page.evaluate(() => {
    const uniforms = window.preview.field.material.uniforms;
    uniforms.horizontalRepeat.value = 2;
    uniforms.horizontalOffset.value = 0;
    window.renderPreview(false);
  });
  await page.screenshot({ path: 'field-check-two-repeat.jpg', quality: 94 });
  await page.evaluate(() => {
    const uniforms = window.preview.field.material.uniforms;
    uniforms.horizontalRepeat.value = 4;
    uniforms.horizontalOffset.value = 0.5;
    window.renderPreview(false);
  });
  results.orbit = await page.evaluate(() => {
    window.preview.camera.lookAt(-30, 5, -12);
    return window.renderPreview(false);
  });
  await page.screenshot({ path: 'field-check-orbit.jpg', quality: 94 });
  await page.setViewportSize({ width: 430, height: 800 });
  results.mobile = await page.evaluate(() => {
    const { camera, renderer } = window.preview;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 4, -16);
    return window.renderPreview(false);
  });
  await page.screenshot({ path: 'field-check-mobile.jpg', quality: 94 });
  results.transparent = await page.evaluate(() => {
    const { renderer, scene, camera, field, floor, character } = window.preview;
    floor.visible = character.visible = field.visible = false;
    scene.background = null;
    renderer.setClearColor(0, 0);
    renderer.render(scene, camera);
    const pixels = new Uint8Array(4);
    const gl = renderer.getContext();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    field.visible = floor.visible = character.visible = true;
    return pixels[3] === 0;
  });
  results.director = await page.evaluate(() => {
    const { camera, renderer, source } = window.preview;
    const frames = [];
    for (let i = 0; i < 10; i++) {
      camera.position.set(Math.sin(i * 0.18) * 4, 4, 20 - i * 0.4);
      camera.lookAt(0, 3, 0);
      frames.push(window.renderPreview(false).signature);
    }
    return { changed: new Set(frames).size === 10, width: source.image.width, height: source.image.height, mipmaps: source.generateMipmaps };
  });
  results.errors = errors;
  console.log(JSON.stringify(results, null, 2));
  if (errors.length || !results.transparent || !results.director.changed || results.director.mipmaps
    || Object.values(results).some(value => value.min !== undefined && value.max - value.min < 20)) process.exitCode = 1;
} finally { await browser.close(); }
