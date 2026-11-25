import * as THREE from "three";
import { OBELISK, OBELISK_FIELD } from "./buenosAiresLayout.js";
import { cityLightPath } from "./buenosAiresLighting.js";

// One thin energy surface, shared emitter meshes and the city's existing clock.
// No extra render loop, shadow lights, physics bodies or animated textures.
export function addObeliskForceField(parent, { lighting, glowMap }) {
  const { halfExtent: h, cornerRadius: r, height, baseY } = OBELISK_FIELD;
  const root = new THREE.Group(); root.name = "Obelisco / campo de fuerza cian";
  root.position.set(OBELISK.x, 0, OBELISK.z); parent.add(root);
  const outline = new THREE.Shape();
  outline.moveTo(-h + r, -h); outline.lineTo(h - r, -h);
  outline.quadraticCurveTo(h, -h, h, -h + r); outline.lineTo(h, h - r);
  outline.quadraticCurveTo(h, h, h - r, h); outline.lineTo(-h + r, h);
  outline.quadraticCurveTo(-h, h, -h, h - r); outline.lineTo(-h, -h + r);
  outline.quadraticCurveTo(-h, -h, -h + r, -h);
  const points = outline.getPoints(10), positions = [], uv = [], indices = [];
  let length = 0;
  for (let i = 0; i < points.length; i++) {
    if (i) length += points[i].distanceTo(points[i - 1]);
    positions.push(points[i].x, baseY, points[i].y, points[i].x, baseY + height, points[i].y);
    uv.push(length, 0, length, height);
    if (i) { const a = (i - 1) * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const material = new THREE.ShaderMaterial({
    name: "Obelisco / membrana electromagnetica animada", transparent: true,
    depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true,
    blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { uTime: lighting.time, uHeight: { value: height }, uPerimeter: { value: length }, uStrength: { value: 1 } },
    vertexShader: `varying vec2 vField;
      void main() { vField = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime, uHeight, uPerimeter, uStrength;
      varying vec2 vField;
      void main() {
        vec2 p = vField * 1.35;
        vec2 lattice = vec2(1.73205, 3.0);
        vec2 a = mod(p, lattice) - lattice * .5;
        vec2 b = mod(p - lattice * .5, lattice) - lattice * .5;
        vec2 cell = abs(dot(a, a) < dot(b, b) ? a : b);
        float hex = max(cell.x, dot(cell, vec2(.5, .866025)));
        float mesh = 1.0 - smoothstep(.025, .065, abs(hex - .866025));
        float y = vField.y / uHeight;
        float edge = exp(-y * 30.0) + exp(-(1.0 - y) * 34.0);
        float sweep = exp(-pow((fract(y - uTime * .19) - .5) * 28.0, 2.0));
        float wave = .5 + .5 * sin(vField.x * .32 - uTime * 1.7);
        // Local electrical filaments ripple between emitters. Only the thin
        // discharge brightens; the whole barrier never flashes on and off.
        float cellId = floor(vField.x / 6.0);
        float bend = .13 * sin(vField.y * 19.0 + uTime * 3.0 + cellId)
                   + .09 * sin(vField.y * 39.0 - uTime * 2.0);
        float bolt = exp(-abs(mod(vField.x, 6.0) - 3.0 - bend) * 55.0);
        bolt *= .3 + .7 * pow(.5 + .5 * sin(uTime * 2.3 + cellId * 2.4), 4.0);
        float travel = abs(fract((vField.x - uTime * 7.0) / uPerimeter) - .5);
        float pulse = exp(-travel * travel * 2200.0);
        float scan = .92 + .08 * sin(vField.y * 130.0 - uTime * 4.0);
        float alpha = (.065 + mesh * (.12 + wave * .09) + edge * .34
                     + sweep * .19 + pulse * mesh * .38 + bolt * .62) * scan;
        vec3 cyan = mix(vec3(.025, .56, .78), vec3(.27, .96, 1.0), mesh * .45 + sweep * .3);
        cyan = mix(cyan, vec3(.74, 1.0, 1.0), clamp(bolt + edge * .45, 0.0, .8));
        gl_FragColor = vec4(cyan, min(alpha, .82) * uStrength);
        #include <colorspace_fragment>
      }`,
  });
  const surface = new THREE.Mesh(geometry, material);
  surface.name = "Obelisco / barrera de energia semitransparente";
  surface.userData.cityKeep = true; root.add(surface);

  const rail = cityLightPath(points.map(p => [p.x, baseY, p.y]));
  const metal = new THREE.MeshStandardMaterial({ name: "Campo de fuerza / titanio oscuro", color: 0x273c4b,
    metalness: .82, roughness: .3 });
  const railMesh = new THREE.Mesh(new THREE.TubeGeometry(rail, 112, .105, 5, false), metal);
  railMesh.receiveShadow = true; root.add(railMesh);
  for (const y of [baseY + .05, baseY + height])
    lighting.strip(root, cityLightPath(points.map(p => [p.x, y, p.y])),
      { radius: y > 1 ? .032 : .045, style: "landmark", phase: y * 5, halo: true, segments: 112 });

  const postGeo = new THREE.CylinderGeometry(.17, .25, 1, 6);
  const capGeo = new THREE.CylinderGeometry(.18, .18, .075, 12);
  const emitter = new THREE.MeshBasicMaterial({ name: "Campo de fuerza / emisor cian", color: 0x66f5ff, toneMapped: false });
  const poolMaterial = new THREE.MeshBasicMaterial({ map: glowMap, color: 0x26c9f2,
    transparent: true, opacity: .36, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const poolGeo = new THREE.PlaneGeometry(2.2, 2.2);
  for (let i = 0; i < 12; i++) {
    const point = rail.getPointAt(i / 12);
    const post = new THREE.Mesh(postGeo, metal);
    post.position.set(point.x, .48, point.z); post.scale.y = .86;
    post.castShadow = post.receiveShadow = true; root.add(post);
    for (const y of [.22, .77, .94]) {
      const cap = new THREE.Mesh(capGeo, emitter); cap.position.set(point.x, y, point.z); root.add(cap);
    }
    const pool = new THREE.Mesh(poolGeo, poolMaterial);
    pool.rotation.x = -Math.PI / 2; pool.position.set(point.x, .051, point.z); root.add(pool);
  }
  return { root, surface };
}
