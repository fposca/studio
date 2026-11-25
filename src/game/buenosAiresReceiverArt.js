import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { cityGlowTexture } from "./buenosAiresArt.js";

// Shared machined assemblies, textures and animation uniforms for every receiver.
// No extra lights, render targets or frame loops, including on the mobile profile.
export function createBuenosAiresReceiverArt(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const geo = value => { geometries.add(value); return value; };
  const mat = value => { materials.add(value); return value; };
  const tex = value => { textures.add(value); return value; };
  const time = { value: 0 }, devices = [], assemblies = new Map();
  const metalCanvas = document.createElement("canvas"); metalCanvas.width = metalCanvas.height = 256;
  const ctx = metalCanvas.getContext("2d");
  ctx.fillStyle = "#969fa8"; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i++) {
    ctx.fillStyle = `rgba(225,238,250,${.025 + (i * 17 % 11) * .008})`;
    ctx.fillRect(0, i, 256, 1);
    ctx.fillStyle = "rgba(20,35,48,.12)"; ctx.fillRect(i * 43 % 256, i, 24 + i % 53, 1);
  }
  const brushed = tex(new THREE.CanvasTexture(metalCanvas));
  brushed.wrapS = brushed.wrapT = THREE.RepeatWrapping;
  const graphite = mat(new THREE.MeshStandardMaterial({ name: "Receptores / ceramica de grafito",
    color: 0x2c3e49, metalness: .44, roughness: .36, bumpMap: brushed, bumpScale: .006 }));
  const titanium = mat(new THREE.MeshStandardMaterial({ name: "Receptores / titanio cepillado",
    color: 0xc2cbd0, metalness: .62, roughness: .32, roughnessMap: brushed, bumpMap: brushed, bumpScale: .003 }));
  const copper = mat(new THREE.MeshStandardMaterial({ name: "Receptores / conectores de cobre",
    color: 0xad8060, metalness: .76, roughness: .32 }));
  const glass = mat(new THREE.MeshPhysicalMaterial({ name: "Receptores / lente de cuarzo",
    color: 0xb9e8f2, metalness: .18, roughness: .11, clearcoat: 1, clearcoatRoughness: .12,
    transparent: true, opacity: .23, depthWrite: false, envMapIntensity: 1.4 }));
  const glowMap = tex(cityGlowTexture());
  const shadowMat = mat(new THREE.MeshBasicMaterial({ map: glowMap, color: 0x010409, transparent: true,
    opacity: .65, depthWrite: false, toneMapped: false }));
  const box = geo(new THREE.BoxGeometry(1, 1, 1));
  const sphere = geo(new THREE.SphereGeometry(.38, 24, 16));
  const crystal = geo(new THREE.IcosahedronGeometry(.285, 3));
  const ring = geo(new THREE.TorusGeometry(.59, .048, 8, 48));
  const rail = geo(new THREE.TorusGeometry(.52, .014, 6, 48));
  const arc = geo(new THREE.TorusGeometry(.46, .012, 6, 32, Math.PI * 1.3));
  const cylinder = geo(new THREE.CylinderGeometry(1, 1, 1, 24));
  const bolt = geo(new THREE.CylinderGeometry(.027, .027, .023, 6));
  const plane = geo(new THREE.PlaneGeometry(1, 1));
  const base = geo(new THREE.LatheGeometry([
    [0, .025], [.60, .025], [.67, .06], [.67, .13], [.62, .18], [.49, .20],
    [.46, .25], [.29, .27], [.23, .62], [.27, .68], [.27, .73], [0, .73],
  ].map(([r, y]) => new THREE.Vector2(r, y)), 32));
  const dummy = new THREE.Object3D();
  // Assemble one prototype per material, then instance it across the eight devices.
  function part(geometry, material, position, scale = [1, 1, 1], rotation = [0, 0, 0]) {
    dummy.position.set(...position); dummy.scale.set(...scale); dummy.rotation.set(...rotation); dummy.updateMatrix();
    const copy = geometry.clone().applyMatrix4(dummy.matrix);
    if (!assemblies.has(material)) assemblies.set(material, []);
    assemblies.get(material).push(copy);
  }
  part(base, graphite, [0, 0, 0]);
  for (const [radius, y, h] of [[.648, .125, .028], [.48, .225, .026], [.252, .69, .045]])
    part(cylinder, titanium, [0, y, 0], [radius, h, radius]);
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    part(box, i % 3 ? graphite : copper, [Math.sin(a) * .258, .46, Math.cos(a) * .258], [.025, .30, .035], [0, a, 0]);
  }
  for (const side of [-1, 1]) {
    part(box, graphite, [side * .38, .83, 0], [.16, .39, .19], [0, 0, -side * .35]);
    part(box, titanium, [side * .42, .88, .107], [.05, .27, .025], [0, 0, -side * .35]);
    part(cylinder, copper, [side * .59, 1.32, 0], [.092, .10, .092], [0, 0, Math.PI / 2]);
  }
  part(ring, titanium, [0, 1.32, 0]);
  part(ring, graphite, [0, 1.32, -.065], [1.045, 1.045, 1]);
  for (let i = 0; i < 32; i++) {
    const a = i * Math.PI / 16, r = .565;
    part(box, i % 4 ? graphite : copper, [Math.sin(a) * r, 1.32 + Math.cos(a) * r, .045],
      [.012, i % 4 ? .027 : .055, .013], [0, 0, -a]);
  }
  for (const x of [-.43, .43]) for (const z of [-.35, .35])
    part(bolt, titanium, [x, .20, z]);
  part(box, titanium, [0, .38, .405], [.92, .255, .065], [-.15, 0, 0]);
  part(box, graphite, [0, .382, .444], [.86, .205, .018], [-.15, 0, 0]);
  const plaqueCanvas = document.createElement("canvas"); plaqueCanvas.width = 512; plaqueCanvas.height = 128;
  const plaqueCtx = plaqueCanvas.getContext("2d");
  plaqueCtx.fillStyle = "#091821"; plaqueCtx.fillRect(0, 0, 512, 128);
  plaqueCtx.strokeStyle = "#4e8a9c"; plaqueCtx.lineWidth = 2; plaqueCtx.strokeRect(9, 9, 494, 110);
  plaqueCtx.fillStyle = "#c6e6ed"; plaqueCtx.font = "600 38px Arial, sans-serif"; plaqueCtx.textAlign = "center";
  plaqueCtx.fillText("RED / RECEPTOR", 256, 59);
  plaqueCtx.fillStyle = "#7a9ca8"; plaqueCtx.font = "500 20px Arial, sans-serif"; plaqueCtx.fillText("ENLACE DE FRECUENCIA", 256, 94);
  const plaqueMap = tex(new THREE.CanvasTexture(plaqueCanvas)); plaqueMap.colorSpace = THREE.SRGBColorSpace;
  const plaqueMat = mat(new THREE.MeshBasicMaterial({ map: plaqueMap, toneMapped: false }));
  part(plane, plaqueMat, [0, .385, .457], [.83, .195, 1], [-.15, 0, 0]);
  part(plane, shadowMat, [0, .026, 0], [2.05, 2.05, 1], [-Math.PI / 2, 0, 0]);

  const states = {};
  for (const [name, color, energy] of [["idle", 0x5e9aaf, .24], ["active", 0xc1a0ff, 1], ["charged", 0x8cffe5, .7]]) {
    const signal = mat(new THREE.ShaderMaterial({
      name: "Receptor / circuito " + name, uniforms: { time, color: { value: new THREE.Color(color) }, energy: { value: energy } },
      vertexShader: "varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: `uniform float time; uniform vec3 color; uniform float energy; varying vec2 vUv;
        void main(){float trail=pow(.5+.5*cos(vUv.x*6.283185-time*1.6),16.);
          float segments=.55+.45*smoothstep(.05,.24,fract(vUv.x*32.));
          vec3 c=color*(.22+trail*.7)*segments*energy+color*.08;
          gl_FragColor=vec4(c,1.);
          #include <colorspace_fragment>
        }`, toneMapped: false,
    }));
    // Fine moving filaments sit inside the clear lens instead of a flat emissive blob.
    // The three states share one clock and program; no textures are redrawn per frame.
    const core = mat(new THREE.ShaderMaterial({ name: "Receptor / cristal " + name,
      uniforms: { time, color: { value: new THREE.Color(color) }, energy: { value: energy } },
      vertexShader: `varying vec3 p; varying vec3 n; varying vec3 view;
        void main(){p=position; n=normalize(normalMatrix*normal);
          vec4 mv=modelViewMatrix*vec4(position,1.); view=-mv.xyz; gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform float time; uniform vec3 color; uniform float energy;
        varying vec3 p; varying vec3 n; varying vec3 view;
        void main(){
          vec3 q=p*19.;
          float flow=sin(q.x+sin(q.y+time*.32))+sin(q.z-q.y*.8-time*.46);
          float veins=pow(1.-abs(sin(flow*3.4+q.y)),12.);
          float fissures=pow(1.-abs(sin(flow*7.7-q.z)),24.);
          vec3 normal=normalize(n), eye=normalize(view);
          float rim=pow(1.-max(0.,dot(normal,eye)),2.6);
          float light=.25+.75*max(0.,dot(normal,normalize(vec3(-.4,.8,.6))));
          float spec=pow(max(0.,dot(reflect(-normalize(vec3(-.4,.8,.6)),normal),eye)),48.);
          vec3 c=vec3(.012,.028,.045)*light+color*(.07+veins*.65+fissures*.16)*(.45+energy*.55);
          c+=mix(color,vec3(.85,.97,1.),.7)*(rim*.37+spec*.65);
          gl_FragColor=vec4(c,1.);
          #include <colorspace_fragment>
        }`, toneMapped: false,
    }));
    const halo = mat(new THREE.SpriteMaterial({ map: glowMap, color, transparent: true, opacity: energy * .16,
      depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    states[name] = { signal, core, halo };
  }
  const devicesRoot = new THREE.Group(); devicesRoot.name = "Red / receptores mecanizados"; root.add(devicesRoot);
  const mesh = (parent, geometry, material, name) => {
    const object = new THREE.Mesh(geometry, material); object.name = name;
    object.userData.cityKeep = true; object.userData.invasionVisionPreserve = true;
    object.receiveShadow = !material.isMeshBasicMaterial && !material.isShaderMaterial;
    parent.add(object); return object;
  };
  function create(x, z) {
    const group = new THREE.Group(); group.position.set(x, 0, z); group.name = "Receptor / nucleo optico"; devicesRoot.add(group);
    const core = mesh(group, crystal, states.idle.core, "Cristal facetado"); core.position.y = 1.32;
    const lens = mesh(group, sphere, glass, "Lente de cuarzo reflectante"); lens.position.y = 1.32;
    const band = mesh(group, rail, states.idle.signal, "Circuito LED de estado"); band.position.set(0, 1.32, .058);
    const orbit = mesh(group, arc, states.active.signal, "Barrido de frecuencia"); orbit.position.y = 1.32; orbit.rotation.x = .6; orbit.visible = false;
    const halo = new THREE.Sprite(states.idle.halo); halo.name = "Halo del receptor"; halo.position.y = 1.32; halo.scale.setScalar(1.4); group.add(halo);
    const item = { group, core, lens, band, orbit, halo, x, z, mirror: null, mirrorSignals: [] }; devices.push(item); return item;
  }
  function makeReflector(item) {
    item.core.visible = item.lens.visible = item.halo.visible = false;
    const panel = new THREE.Group(); panel.name = "Reflector / espejo orientable"; panel.position.y = 1.32; panel.rotation.y = Math.PI / 2; item.group.add(panel);
    mesh(panel, box, graphite, "Reverso ceramico del reflector").scale.set(.84, .72, .105);
    const surface = mesh(panel, box, titanium, "Espejo de titanio pulido"); surface.scale.set(.76, .64, .023); surface.position.z = .064;
    for (const s of [-1, 1]) {
      const edge = mesh(panel, box, copper, "Bisel del espejo"); edge.scale.set(.035, .71, .13); edge.position.x = s * .41;
      const track = mesh(panel, box, states.active.signal, "Guia luminosa del reflector"); track.scale.set(.66, .016, .012); track.position.set(0, s * .27, .081); item.mirrorSignals.push(track);
    }
    const etching = mesh(panel, rail, states.active.signal, "Reticula del reflector"); etching.scale.set(.44, .44, .5); etching.position.z = .086; item.mirrorSignals.push(etching);
    item.mirror = panel; return panel;
  }
  function finalize() {
    devicesRoot.updateMatrixWorld(true);
    for (const [material, parts] of assemblies) {
      const geometry = geo(mergeGeometries(parts)); parts.forEach(g => g.dispose());
      const batch = new THREE.InstancedMesh(geometry, material, devices.length);
      batch.name = "Receptores / " + material.name; batch.castShadow = !material.isMeshBasicMaterial;
      batch.receiveShadow = batch.castShadow; batch.userData.invasionVisionPreserve = true;
      devices.forEach((item, i) => { dummy.position.set(item.x, 0, item.z); dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); batch.setMatrixAt(i, dummy.matrix); });
      batch.instanceMatrix.needsUpdate = true; batch.computeBoundingSphere(); devicesRoot.add(batch);
    }
    assemblies.clear();
  }
  let low = false;
  function updateDevice(item, { active, charged, nearby, phase }) {
    const state = states[charged ? "charged" : active ? "active" : "idle"];
    item.group.visible = nearby;
    item.core.material = state.core; item.band.material = state.signal; item.halo.material = state.halo;
    item.halo.visible = active && !item.mirror && !low;
    item.lens.visible = !item.mirror && !low;
    for (const signal of item.mirrorSignals) signal.material = state.signal;
    item.orbit.visible = active && !item.mirror && !low;
    item.orbit.rotation.z = time.value * .4 + phase;
    item.core.rotation.y = time.value * .3 + phase;
    item.core.rotation.z = .18;
  }
  function exposed() {
    const group = new THREE.Group(); group.name = "Nucleo de la Red / cristal liberado";
    mesh(group, crystal, states.charged.core, "Corazon de la Red").scale.setScalar(2.2);
    mesh(group, sphere, glass, "Contenedor de cuarzo").scale.setScalar(2.2);
    for (const a of [-.6, .6]) {
      const orbit = mesh(group, arc, states.charged.signal, "Orbita del nucleo"); orbit.scale.setScalar(2.1); orbit.rotation.set(a, a, a);
    }
    return group;
  }
  return { create, makeReflector, finalize, updateDevice, exposed,
    update: elapsed => { time.value = elapsed; },
    applyQuality: tier => {
      low = tier === "low";
      for (const item of devices) {
        item.lens.visible = !low && !item.mirror;
        if (low) { item.halo.visible = false; item.orbit.visible = false; }
      }
    },
    dispose() { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); },
  };
}
