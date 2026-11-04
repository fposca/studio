import * as THREE from "three";
import { snapshotCanvasTexture } from "./halloweenTextures.js";

// Adapted from the Universe's surface-code effect, isolated to this edition.
// Each object receives a separate material; its original is never recolored.
const GLYPHS = "0123456789ABCDEF<>/+\uff71\uff73\uff76\uff7f\uff86\uff8e\uff90\uff9d\uff66\uff85\uff98\uff92";
const VARYINGS = `
varying vec3 vHalloweenWorld;
#if defined(HALLOWEEN_PLAYER_CODE) || defined(HALLOWEEN_DEMON_CODE)
  varying vec3 vHalloweenActor;
#endif
`;
const HEADER = `
${VARYINGS}
uniform sampler2D halloweenGlyphs;
uniform float halloweenTime;
uniform float halloweenDemonHit;
uniform vec2 halloweenOrigin;
float halloweenHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
`;
const SURFACE_CODE = `
  vec3 codeNormal = normalize(cross(dFdx(vHalloweenWorld), dFdy(vHalloweenWorld)));
  vec3 codePosition = vHalloweenWorld;
  vec3 codeAxis = abs(codeNormal);
  #if defined(HALLOWEEN_PLAYER_CODE) || defined(HALLOWEEN_DEMON_CODE)
    // Keep the pattern aligned with NeonBoy when walking, turning or jumping.
    codePosition = vHalloweenActor;
    codeAxis = abs(normalize(cross(dFdx(vHalloweenActor), dFdy(vHalloweenActor))));
  #endif
  bool codeHorizontal = codeAxis.y > .65;
  vec2 codeSurface = codeHorizontal ? codePosition.xz
    : (codeAxis.x > codeAxis.z ? codePosition.zy : codePosition.xy);
  vec2 codeGrid = codeSurface * (codeHorizontal ? 3.8 : 6.0);
  #ifdef HALLOWEEN_PLAYER_CODE
    // Small, tightly packed symbols across the hood, armor, hands and legs.
    codeGrid = codeSurface * vec2(19.0, 23.0);
  #endif
  #ifdef HALLOWEEN_DEMON_CODE
    codeGrid = codeSurface * vec2(15.0, 20.0);
    // Corrupt only the struck body: displaced rows and rapidly changing symbols.
    float codeErrorBand = halloweenHash(vec2(floor(codePosition.y * 19.0), floor(halloweenTime * 16.0)));
    codeGrid.x += (codeErrorBand - .5) * 13.0 * halloweenDemonHit;
    codeGrid.y += floor(halloweenTime * 25.0) * halloweenDemonHit;
  #endif
  vec2 codeCell = floor(codeGrid);
  float codePlane = floor(dot(codePosition, codeAxis) * .5);
  float codeSeed = halloweenHash(vec2(codeCell.x, codePlane));
  float codeTrail = mod(codeCell.y + halloweenTime * (2.5 + codeSeed * 4.0) + codeSeed * 24.0, 24.0);
  float codeHead = 1.0 - smoothstep(.1, 1.2, codeTrail);
  float codeIntensity = .13 + exp(-codeTrail * .18) * .84;
  float codeGlyphId = floor(halloweenHash(codeCell + floor(halloweenTime * .65)) * 32.0);
  vec2 codeUv = clamp(fract(codeGrid), vec2(.025), vec2(.975));
  float codeGlyph = texture2D(halloweenGlyphs, vec2((codeGlyphId + codeUv.x) / 32.0, codeUv.y)).a;
  // Surface projection follows skinning, perspective and occlusion.
  vec3 codeView = normalize(cameraPosition - vHalloweenWorld);
  float codeRim = pow(1.0 - abs(dot(codeNormal, codeView)), 2.4);
  float codeFacing = abs(dot(codeNormal, normalize(vec3(.3, .8, .5))));
  vec3 codeBase = vec3(.0015, .011, .004) * (.5 + codeFacing);
  codeBase += vec3(.008, .065, .025) * codeRim;
  vec3 codeInk = mix(vec3(.025, .72, .16), vec3(.58, 1.0, .73), codeHead);
  float codeScanDistance = abs(distance(vHalloweenWorld.xz, halloweenOrigin) - mod(halloweenTime * 3.0, 36.0));
  float codeScan = 1.0 - smoothstep(.04, .22, codeScanDistance);
  #ifdef HALLOWEEN_PLAYER_CODE
    // Preserve the armor's lit relief beneath the amber code.
    float codeRelief = clamp(dot(outgoingLight, vec3(.2126, .7152, .0722)), 0.0, 1.0);
    codeBase = vec3(.055, .013, .002) * (.6 + codeFacing);
    codeBase += vec3(.34, .11, .018) * codeRelief;
    codeBase += vec3(.28, .065, .006) * codeRim;
    codeInk = mix(vec3(1.0, .24, .018), vec3(1.0, .74, .32), codeHead);
    codeIntensity = .38 + exp(-codeTrail * .14) * .75;
    float codeSweep = 1.0 - smoothstep(.025, .09, abs(codePosition.y - mod(halloweenTime * .38, 2.4)));
    // Fine horizontal data traces, with derivative smoothing at distance.
    float codeTraceWidth = max(fwidth(codeGrid.y) * .7, .035);
    float codeTrace = 1.0 - smoothstep(.02, .02 + codeTraceWidth, abs(fract(codeGrid.y) - .5));
    codeBase += vec3(.065, .017, .001) * codeTrace * codeSeed;
    outgoingLight = codeBase + codeInk * codeGlyph * codeIntensity;
    outgoingLight += vec3(.20, .065, .008) * codeSweep;
  #else
    outgoingLight = codeBase + codeInk * codeGlyph * codeIntensity;
    outgoingLight += vec3(.01, .10, .035) * codeScan;
    #ifdef HALLOWEEN_DEMON_CODE
      vec3 errorInk = mix(vec3(1.0, .025, .38), vec3(.94, 1.0, 1.0), codeErrorBand);
      float errorTrace = 1.0 - smoothstep(.015, max(.045, fwidth(codeGrid.y)), abs(fract(codeGrid.y) - .5));
      vec3 brokenCode = codeBase + errorInk * (codeGlyph * 1.65 + errorTrace * .22 + codeRim * .3);
      outgoingLight = mix(outgoingLight, brokenCode, halloweenDemonHit);
    #endif
  #endif
`;

function createGlyphAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 32;
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.textAlign = "center"; context.textBaseline = "middle";
  context.font = "bold 26px Consolas, monospace";
  Array.from(GLYPHS).slice(0, 32).forEach((glyph, index) => context.fillText(glyph, index * 32 + 16, 17, 24));
  const source = new THREE.CanvasTexture(canvas);
  source.anisotropy = 4;
  const atlas = snapshotCanvasTexture(source);
  source.dispose();
  return atlas;
}

export function createHalloweenCodeVision(scene, { atlas = createGlyphAtlas() } = {}) {
  const originals = new Map();
  // A material can be shared by a character and scenery: isolate both variants.
  const replacements = new Map();
  const profiles = new WeakMap();
  const uniforms = {
    halloweenGlyphs: { value: atlas },
    halloweenTime: { value: 0 },
    halloweenOrigin: { value: new THREE.Vector2() },
    halloweenPlayerPose: { value: new THREE.Vector4() },
    halloweenDemonPose: { value: new THREE.Vector4() },
    halloweenDemonHit: { value: 0 },
  };
  const background = scene.background;
  const fog = scene.fog;
  const codeBackground = new THREE.Color(0x010704);
  const codeFog = new THREE.Fog(0x021309, 22, 55);
  let active = false, demonHitRemaining = 0;

  function codeMaterial(original, profile) {
    if (!original?.isMeshStandardMaterial && !original?.isMeshBasicMaterial) return original;
    if (original.blending === THREE.AdditiveBlending) return original;
    let variants = replacements.get(original);
    if (!variants) { variants = new Map(); replacements.set(original, variants); }
    if (variants.has(profile)) return variants.get(profile);
    const material = original.clone();
    const previousCompile = original.onBeforeCompile;
    const previousKey = original.customProgramCacheKey.call(original);
    material.name = "halloween-surface-code:" + profile + ":" + original.name;
    if (profile === "player") material.defines = { ...material.defines, HALLOWEEN_PLAYER_CODE: 1 };
    if (profile === "demon") material.defines = { ...material.defines, HALLOWEEN_DEMON_CODE: 1 };
    material.onBeforeCompile = function(shader, renderer) {
      previousCompile.call(this, shader, renderer);
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = VARYINGS + "\nuniform vec4 halloweenPlayerPose;\nuniform vec4 halloweenDemonPose;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", `
        #include <project_vertex>
        vec4 codeWorld = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          codeWorld = instanceMatrix * codeWorld;
        #endif
        vHalloweenWorld = (modelMatrix * codeWorld).xyz;
        #if defined(HALLOWEEN_PLAYER_CODE) || defined(HALLOWEEN_DEMON_CODE)
          #ifdef HALLOWEEN_DEMON_CODE
            vec4 codePose = halloweenDemonPose;
          #else
            vec4 codePose = halloweenPlayerPose;
          #endif
          vec3 codeRelative = vHalloweenWorld - codePose.xyz;
          float codeCos = cos(codePose.w);
          float codeSin = sin(codePose.w);
          vHalloweenActor = vec3(codeRelative.x * codeCos - codeRelative.z * codeSin,
            codeRelative.y, codeRelative.x * codeSin + codeRelative.z * codeCos);
        #endif
      `);
      shader.fragmentShader = HEADER + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", SURFACE_CODE + "\n#include <opaque_fragment>");
    };
    material.customProgramCacheKey = () => previousKey + "/halloween-surface-code-v3/" + profile;
    material.needsUpdate = true;
    variants.set(profile, material);
    return material;
  }

  function applyCode(object, original) {
    const profile = profiles.get(object) || "world";
    object.material = Array.isArray(original) ? original.map(material => codeMaterial(material, profile)) : codeMaterial(original, profile);
  }

  function register(root = scene, { profile } = {}) {
    root.traverse(object => {
      if (!object.isMesh || (object.userData.halloweenVisionMessage || object.userData.halloweenSecretCover || object.userData.halloweenCodeExclude)) return;
      if (profile) profiles.set(object, profile);
      else if (originals.has(object)) return;
      if (!originals.has(object)) originals.set(object, object.material);
      if (active) applyCode(object, originals.get(object));
    });
  }

  register();
  return {
    register,
    setActive(next) {
      if (next === active) return;
      register();
      active = next;
      if (!active) { demonHitRemaining = 0; uniforms.halloweenDemonHit.value = 0; }
      for (const [object, original] of originals) {
        if (active) applyCode(object, original);
        else object.material = original;
      }
      scene.background = active ? codeBackground : background;
      scene.fog = active ? codeFog : fog;
    },
    hitDemon() { if (active) demonHitRemaining = .85; },
    update(dt, player, reducedMotion = false, demonRoot = null, reduceFlashing = false) {
      demonHitRemaining = Math.max(0, demonHitRemaining - dt);
      uniforms.halloweenDemonHit.value = (demonHitRemaining / .85) * (reducedMotion || reduceFlashing ? .45 : 1);
      if (demonRoot) {
        const { x, y, z } = demonRoot.position;
        uniforms.halloweenDemonPose.value.set(x, y, z, demonRoot.rotation.y);
      }
      if (active && !reducedMotion) uniforms.halloweenTime.value += dt;
      uniforms.halloweenOrigin.value.set(player.x, player.z);
      uniforms.halloweenPlayerPose.value.set(player.x, player.y ?? 0, player.z, player.yaw ?? 0);
    },
    dispose() {
      for (const [object, original] of originals) object.material = original;
      scene.background = background;
      scene.fog = fog;
      for (const variants of replacements.values()) for (const material of variants.values()) material.dispose();
      atlas.dispose();
      originals.clear(); replacements.clear();
    },
  };
}
