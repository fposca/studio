import * as THREE from 'three';

// One shared glyph atlas and uniforms for the architecture; actors and puzzle colors stay readable.
const GLYPHS = '0123456789ABCDEF<>/+\uff71\uff73\uff76\uff7f\uff86\uff8e\uff90\uff9d\uff66\uff85\uff98\uff92';
const VARYINGS = `
varying vec3 vFrequencyPosition;
varying vec3 vFrequencyNormal;
`;
const FRAGMENT_HEADER = `
${VARYINGS}
uniform sampler2D frequencyAtlas;
uniform float frequencyAmount;
uniform float frequencyTime;
uniform vec2 frequencyOrigin;
float frequencyHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
`;
const SURFACE_CODE = `
if (frequencyAmount > .001) {
  vec3 surfaceNormal = abs(normalize(vFrequencyNormal));
  float horizontal = step(.65, surfaceNormal.y);
  vec2 surface = horizontal > .5 ? vFrequencyPosition.xz
    : (surfaceNormal.x > surfaceNormal.z ? vFrequencyPosition.zy : vFrequencyPosition.xy);
  vec2 grid = surface * mix(3.6, 2.5, horizontal);
  vec2 cell = floor(grid);
  float seed = frequencyHash(vec2(cell.x, floor(dot(vFrequencyPosition, surfaceNormal) * .25)));
  float scroll = frequencyTime * (2.5 + seed * 4.0);
  float trail = mod(cell.y + scroll + seed * 28.0, 28.0);
  float ink = .055 + exp(-trail * .19) * .76;
  float head = 1.0 - smoothstep(.05, 1.1, trail);
  float glyphId = floor(frequencyHash(cell + floor(frequencyTime * .8)) * 32.0);
  vec2 glyphUv = clamp(fract(grid), vec2(.025), vec2(.975));
  float glyph = texture2D(frequencyAtlas, vec2((glyphId + glyphUv.x) / 32.0, glyphUv.y)).a;
  float nearFade = 1.0 - smoothstep(24.0, 52.0, distance(vFrequencyPosition.xz, frequencyOrigin));
  float density = mix(1.0, .36, horizontal);
  float luminance = dot(outgoingLight, vec3(.2126, .7152, .0722));
  vec3 decoded = mix(outgoingLight * .28, luminance * vec3(.18, .63, .34), .78);
  decoded += vec3(.018, .052, .028);
  decoded += (vec3(.06, .85, .31) * ink + vec3(.50, 1.0, .72) * head * .52) * glyph * density * nearFade;
  float distanceFromScan = abs(distance(vFrequencyPosition.xz, frequencyOrigin) - mod(frequencyTime * 5.0, 44.0));
  float scan = (1.0 - smoothstep(.08, .65, distanceFromScan)) * .14;
  decoded += vec3(.12, .7, .32) * scan * nearFade;
  outgoingLight = mix(outgoingLight, decoded, frequencyAmount);
}
`;

function createGlyphAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 32;
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.textAlign = 'center'; context.textBaseline = 'middle';
  context.font = 'bold 26px Consolas, monospace';
  Array.from(GLYPHS).forEach((glyph, index) => context.fillText(glyph, index * 32 + 16, 17, 25));
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

export function createMatrixFrequencyVision(root, { key, fill, accents, streams, particles }) {
  const atlas = createGlyphAtlas();
  const uniforms = {
    frequencyAtlas: { value: atlas },
    frequencyAmount: { value: 0 },
    frequencyTime: { value: 0 },
    frequencyOrigin: { value: new THREE.Vector2() },
  };
  const materials = new Set();
  root.traverse(object => {
    if (object.isSkinnedMesh) return;
    for (const material of [object.material].flat()) {
      if (material?.isMeshStandardMaterial) materials.add(material);
    }
  });
  const originals = [];
  for (const material of materials) {
    const compile = material.onBeforeCompile, cacheKey = material.customProgramCacheKey;
    const originalKey = cacheKey.call(material);
    originals.push({ material, compile, cacheKey });
    material.onBeforeCompile = function(shader, renderer) {
      compile.call(this, shader, renderer);
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = VARYINGS + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
        #include <project_vertex>
        vec4 frequencyWorld = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          frequencyWorld = instanceMatrix * frequencyWorld;
        #endif
        vFrequencyPosition = (modelMatrix * frequencyWorld).xyz;
        vFrequencyNormal = inverseTransformDirection(transformedNormal, viewMatrix);
      `);
      shader.fragmentShader = FRAGMENT_HEADER + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', SURFACE_CODE + '\n#include <opaque_fragment>');
    };
    material.customProgramCacheKey = () => originalKey + '/matrix-frequency-vision-v1';
    material.needsUpdate = true;
  }
  const scene = root.parent;
  const colors = [
    [key.color, 0xa7efbb], [fill.color, 0x72e9a2], [fill.groundColor, 0x123b24],
    [accents[0].color, 0x41fa93], [accents[1].color, 0x61dfb6],
    [particles.material.color, 0x80ffad], [scene.background, 0x021009], [scene.fog.color, 0x061b11],
    ...streams.map(material => [material.color, 0x4aff87]),
  ].map(([target, color]) => ({ target, original: target.clone(), active: new THREE.Color(color) }));
  const streamOpacity = streams.map(material => material.opacity);
  let initialized = false, clock = 0;
  return {
    update(dt, progress, player, reducedMotion) {
      const target = progress.visionActive ? 1 : 0;
      // A saved/paused scene starts at its correct visual state. Live toggles fade over a fraction of a second.
      const amount = !initialized || reducedMotion || dt === 0 ? target
        : THREE.MathUtils.damp(uniforms.frequencyAmount.value, target, 7, dt);
      initialized = true;
      if (!reducedMotion) clock += dt;
      uniforms.frequencyAmount.value = amount;
      uniforms.frequencyTime.value = clock;
      uniforms.frequencyOrigin.value.set(player.x, player.z);
      for (const { target: color, original, active } of colors) color.copy(original).lerp(active, amount);
      streams.forEach((material, index) => { material.opacity = THREE.MathUtils.lerp(streamOpacity[index], .58, amount); });
    },
    dispose() {
      for (const { material, compile, cacheKey } of originals) {
        material.onBeforeCompile = compile; material.customProgramCacheKey = cacheKey;
      }
      for (const { target, original } of colors) target.copy(original);
      streams.forEach((material, index) => { material.opacity = streamOpacity[index]; });
      atlas.dispose();
    },
  };
}
