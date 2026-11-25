import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

function sparkleTexture() {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const halo = ctx.createRadialGradient(64, 64, 0, 64, 64, 63);
  halo.addColorStop(0, "rgba(235,255,255,1)"); halo.addColorStop(.09, "rgba(183,249,255,.95)");
  halo.addColorStop(.25, "rgba(92,222,255,.35)"); halo.addColorStop(1, "rgba(48,177,255,0)");
  ctx.fillStyle = halo; ctx.fillRect(0, 0, 128, 128);
  for (const [w, h] of [[116, 9], [9, 116]]) {
    ctx.save(); ctx.translate(64, 64); ctx.scale(w / 2, h / 2);
    const ray = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    ray.addColorStop(0, "rgba(255,255,255,1)"); ray.addColorStop(.12, "rgba(219,255,255,.9)"); ray.addColorStop(1, "rgba(143,239,255,0)");
    ctx.fillStyle = ray; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

const landmarkStyle = style => style === "landmark" || style === "monument";
const circuitTiming = style => style === "monument" ? { period: 22, speed: 10 }
  : style === "landmark" ? { period: 4.5, speed: 2.1 } : { period: 7, speed: 1.7 };

// Flat display circuits use two triangles per straight section. Their bright
// face needs no cylindrical back faces, unlike the freestanding landmark LEDs.
function displayRibbon(curve, radius, normal) {
  const vertices = [], normals = [], uvs = [], indices = [], length = curve.getLength();
  let distance = 0;
  for (const line of curve.curves) {
    const a = line.v1, b = line.v2, segment = a.distanceTo(b);
    const offset = new THREE.Vector3().subVectors(b, a).normalize().cross(normal).multiplyScalar(radius);
    const start = vertices.length / 3;
    for (const [point, side, along] of [[a, -1, distance], [a, 1, distance], [b, 1, distance + segment], [b, -1, distance + segment]]) {
      vertices.push(point.x + offset.x * side, point.y + offset.y * side, point.z + offset.z * side);
      normals.push(normal.x, normal.y, normal.z); uvs.push(along / length, (side + 1) / 2);
    }
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3); distance += segment;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices);
  return geometry;
}

// A single clock drives the city. LED tubes and textures stay static; only
// the small, shared glint buffer moves along the landmark outlines.
export function createCityLighting() {
  const time = { value: 0 }, strips = [], materials = new Map(), sparkleRoutes = [];
  let sparklePoints, sparklePositions, sparkleStrengths;
  const sparklePosition = new THREE.Vector3();
  const updateSparkles = () => {
    if (!sparklePoints) return;
    let index = 0;
    for (const route of sparkleRoutes) {
      const { period, speed } = circuitTiming(route.style);
      const offset = THREE.MathUtils.euclideanModulo(time.value * speed - route.phase + period * .5, period);
      for (let i = 0; i < route.count; i++, index++) {
        const distance = offset + i * period;
        route.curve.getPointAt(Math.min(distance / route.length, 1), sparklePosition).applyMatrix4(route.matrix);
        sparklePositions.setXYZ(index, sparklePosition.x, sparklePosition.y, sparklePosition.z);
        // The glints fade at each end instead of popping or flashing the whole outline.
        const fade = Math.min(1, distance / .2, Math.max(0, route.length - distance) / .2);
        sparkleStrengths.setX(index, fade * (.8 + .2 * Math.sin(time.value * 2 + i)));
      }
    }
    sparklePositions.needsUpdate = true; sparkleStrengths.needsUpdate = true;
  };
  const materialFor = (style, halo) => {
    const key = `${style}/${halo}`;
    if (materials.has(key)) return materials.get(key);
    const prominent = landmarkStyle(style), red = style === "red", amber = style === "amber";
    const material = new THREE.MeshBasicMaterial({
      name: `Ciudad / LED animado / ${key}`, color: red ? 0xff354c : amber ? 0xffc17a : 0x68e8f2,
      toneMapped: false, transparent: halo, opacity: halo ? (prominent ? .28 : .11) : 1,
      blending: halo ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !halo,
    });
    material.userData.cityTime = time;
    material.onBeforeCompile = shader => {
      shader.uniforms.uCityTime = time;
      const { period, speed } = circuitTiming(style);
      shader.uniforms.uCircuitPeriod = { value: period };
      shader.uniforms.uCircuitSpeed = { value: speed };
      shader.uniforms.uCircuitProminence = { value: prominent ? 1 : 0 };
      shader.vertexShader = `attribute float circuitDistance; varying float vCircuitDistance;\n${shader.vertexShader}`
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvCircuitDistance = circuitDistance;");
      shader.fragmentShader = `uniform float uCityTime; uniform float uCircuitPeriod; uniform float uCircuitSpeed; uniform float uCircuitProminence; varying float vCircuitDistance;\n${shader.fragmentShader}`
        .replace("#include <color_fragment>", `#include <color_fragment>
          float cycle = fract((vCircuitDistance - uCityTime * uCircuitSpeed) / uCircuitPeriod);
          float phase = abs(cycle - .5);
          float pulse = exp(-phase * phase * 170.0);
          float diffuser = .82 + .18 * smoothstep(.05, .22, fract(vCircuitDistance * 9.0));
          vec3 subtle = mix(diffuseColor.rgb * .48, vec3(.85, .98, 1.0), pulse * .84);
          float head = 1.0 - smoothstep(.02, .105, phase);
          float trail = smoothstep(.08, .5, cycle) * (1.0 - smoothstep(.5, .57, cycle));
          vec3 landmark = diffuseColor.rgb * (.08 + .28 * trail) + vec3(.91, .99, 1.0) * head;
          diffuseColor.rgb = mix(subtle, landmark, uCircuitProminence) * diffuser;
          diffuseColor.a *= mix(1.0, .35 + .65 * max(head, trail), uCircuitProminence);
        `);
    };
    material.customProgramCacheKey = () => "city-led-circuit-v2";
    materials.set(key, material); return material;
  };
  return {
    time,
    strip(parent, curve, { radius = .025, style = "ice", phase = 0, halo = false, segments = 96, ribbonNormal = null } = {}) {
      if (landmarkStyle(style)) {
        const length = curve.getLength();
        if (length > .01) sparkleRoutes.push({ parent, curve, length, phase, style, count: Math.ceil(length / circuitTiming(style).period) });
      }
      for (const glow of halo ? [false, true] : [false]) {
        const width = radius * (glow ? (landmarkStyle(style) ? 5.2 : 3.6) : 1);
        const geometry = ribbonNormal ? displayRibbon(curve, width, ribbonNormal)
          : new THREE.TubeGeometry(curve, segments, width, 3, false);
        const uv = geometry.getAttribute("uv"), distance = new Float32Array(uv.count), length = curve.getLength();
        for (let i = 0; i < uv.count; i++) distance[i] = uv.getX(i) * length + phase;
        geometry.setAttribute("circuitDistance", new THREE.BufferAttribute(distance, 1));
        const mesh = new THREE.Mesh(geometry, materialFor(style, glow));
        mesh.name = `Circuito LED / ${style}`; mesh.userData.cityKeep = true;
        parent.add(mesh); strips.push(mesh);
      }
    },
    screenMaterial(map, { accent = "#7ed8ef", phase = 0 } = {}) {
      const material = new THREE.MeshBasicMaterial({ name: "Cartel / proyeccion holografica", map,
        transparent: true, depthWrite: false, alphaTest: .025, toneMapped: false });
      material.userData.cityTime = time;
      material.onBeforeCompile = shader => {
        shader.uniforms.uCityTime = time;
        shader.uniforms.uHoloAccent = { value: new THREE.Color(accent) };
        shader.uniforms.uHoloAspect = { value: map.image.width / map.image.height };
        shader.uniforms.uHoloPhase = { value: phase };
        shader.fragmentShader = `uniform float uCityTime; uniform vec3 uHoloAccent; uniform float uHoloAspect; uniform float uHoloPhase;\n${shader.fragmentShader}`
          .replace("#include <map_fragment>", `#include <map_fragment>
            float clock = uCityTime + uHoloPhase;
            vec2 instrument = (vMapUv - vec2(.830078, .5)) * vec2(uHoloAspect, 1.0);
            float radius = length(instrument);
            float angle = atan(instrument.y, instrument.x) / 6.2831853;
            float width = max(fwidth(radius) * 1.1, .0025);
            float orbit = 1.0 - smoothstep(width, width * 2.6, abs(radius - .31));
            float inner = 1.0 - smoothstep(width, width * 2.1, abs(radius - .255));
            float turn = fract(angle - clock * .16);
            float tail = pow(turn, 5.0);
            float segments = smoothstep(.14, .22, fract(angle * 12.0 + clock * .7));
            float signal = orbit * (.15 + .85 * tail) + inner * segments * .42;
            float radar = pow(fract(angle + clock * .105), 24.0) *
              smoothstep(.07, .16, radius) * (1.0 - smoothstep(.22, .3, radius));
            // Moving chevrons live below the label, leaving the name steady.
            float rail = (1.0 - smoothstep(.009, .024, abs(vMapUv.y - .10))) *
              step(.05, vMapUv.x) * (1.0 - step(.62, vMapUv.x));
            float chevron = 1.0 - smoothstep(.09, .19,
              abs(fract(vMapUv.x * 17.0 - clock * 1.3 - abs(vMapUv.y - .1) * 26.0) - .5));
            float scan = exp(-pow((vMapUv.y - fract(clock * .19)) * 48.0, 2.0));
            float luminance = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));
            float background = 1.0 - smoothstep(.18, .7, luminance);
            diffuseColor.rgb += uHoloAccent * (signal * 1.3 + radar * .46 + rail * chevron * .85);
            diffuseColor.rgb += uHoloAccent * scan * .16 * background;
            diffuseColor.a = max(diffuseColor.a, min(.94, signal + radar + rail * chevron));
          `);
      };
      material.customProgramCacheKey = () => "city-holographic-display-v2";
      return material;
    },
    projectionMaterial(warm = false) {
      const key = `projection/${warm}`;
      if (materials.has(key)) return materials.get(key);
      const material = new THREE.ShaderMaterial({ name: "Cartel / haz del proyector",
        uniforms: { uCityTime: time, uColor: { value: new THREE.Color(warm ? 0xffd2aa : 0x6ce9ff) } },
        transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false,
        vertexShader: `varying vec2 vProjectionUv;
          void main() {
            vProjectionUv = uv;
            vec4 localPosition = vec4(position, 1.0);
            #ifdef USE_INSTANCING
              localPosition = instanceMatrix * localPosition;
            #endif
            gl_Position = projectionMatrix * modelViewMatrix * localPosition;
          }`,
        fragmentShader: `uniform float uCityTime; uniform vec3 uColor; varying vec2 vProjectionUv;
          void main() {
            float edge = smoothstep(0.0, .12, vProjectionUv.x) * (1.0 - smoothstep(.88, 1.0, vProjectionUv.x));
            float rays = .44 + .28 * pow(.5 + .5 * sin(vProjectionUv.x * 115.0 + uCityTime * 1.7), 6.0);
            float height = .32 + .68 * pow(1.0 - vProjectionUv.y, 2.0);
            float scan = exp(-pow((vProjectionUv.y - fract(uCityTime * .3)) * 18.0, 2.0));
            gl_FragColor = vec4(uColor, edge * height * (rays + scan * .24) * .28);
          }`,
      });
      materials.set(key, material); return material;
    },
    finalize(root) {
      // Hundreds of segments, just one draw per colour/style. Keep path distances
      // in their own attribute so merging never changes the travelling pulse.
      root.updateMatrixWorld(true);
      const inverse = root.matrixWorld.clone().invert(), groups = new Map();
      for (const mesh of strips) {
        mesh.geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld));
        if (!groups.has(mesh.material)) groups.set(mesh.material, []);
        groups.get(mesh.material).push(mesh.geometry); mesh.removeFromParent();
      }
      for (const [material, geometries] of groups) {
        const merged = mergeGeometries(geometries), mesh = new THREE.Mesh(merged, material);
        mesh.name = material.name; mesh.userData.cityKeep = true; root.add(mesh);
        geometries.forEach(geometry => geometry.dispose());
      }
      strips.length = 0;
      if (sparkleRoutes.length) {
        const count = sparkleRoutes.reduce((total, route) => total + route.count, 0);
        const geometry = new THREE.BufferGeometry(), sizes = new Float32Array(count);
        sparklePositions = new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage);
        sparkleStrengths = new THREE.BufferAttribute(new Float32Array(count), 1).setUsage(THREE.DynamicDrawUsage);
        let index = 0;
        for (const route of sparkleRoutes) {
          route.matrix = new THREE.Matrix4().multiplyMatrices(inverse, route.parent.matrixWorld);
          for (let i = 0; i < route.count; i++) sizes[index++] = route.style === "monument" ? 1.9 : .72;
        }
        geometry.setAttribute("position", sparklePositions);
        geometry.setAttribute("sparkStrength", sparkleStrengths);
        geometry.setAttribute("sparkSize", new THREE.BufferAttribute(sizes, 1));
        const material = new THREE.PointsMaterial({ name: "Monumentos / destellos viajeros", map: sparkleTexture(), color: 0xe0fbff,
          size: 1, sizeAttenuation: true, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
        material.onBeforeCompile = shader => {
          shader.vertexShader = `attribute float sparkSize; attribute float sparkStrength; varying float vSparkStrength;\n${shader.vertexShader}`
            .replace("gl_PointSize = size;", "gl_PointSize = sparkSize; vSparkStrength = sparkStrength;");
          shader.fragmentShader = `varying float vSparkStrength;\n${shader.fragmentShader}`
            .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.a *= vSparkStrength;");
        };
        material.customProgramCacheKey = () => "city-landmark-sparkles-v1";
        sparklePoints = new THREE.Points(geometry, material); sparklePoints.name = "BA y Obelisco / destellos animados";
        sparklePoints.frustumCulled = false; root.add(sparklePoints); updateSparkles();
      }
    },
    update(dt, paused) {
      if (!paused) { time.value += Math.min(Math.max(dt, 0), .1); updateSparkles(); }
    },
  };
}

export function cityLightPath(points, smooth = false) {
  const vertices = points.map(p => new THREE.Vector3(...p));
  if (smooth) return new THREE.CatmullRomCurve3(vertices, false, "centripetal");
  const curve = new THREE.CurvePath();
  for (let i = 1; i < vertices.length; i++) curve.add(new THREE.LineCurve3(vertices[i - 1], vertices[i]));
  return curve;
}
