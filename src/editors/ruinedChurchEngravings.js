export function churchTileEngraving(column, row) {
  const seed = (Math.imul(column + 128, 73856093) ^ Math.imul(row + 128, 19349663)) >>> 0;
  const choice = seed % 10;
  return [choice < 3 ? 0 : choice < 6 ? 1 : choice < 8 ? 2 : 3,
    0.65 + ((seed >>> 5) % 100) / 285, (seed >>> 16) % 4];
}

export function applyChurchEngravings(material) {
  const strength = { value: 1 };
  const mossStrength = { value: 1 };
  material.userData.engravingStrength = strength;
  material.userData.mossStrength = mossStrength;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uChurchEngravingStrength = strength;
    shader.uniforms.uChurchMossStrength = mossStrength;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `
      #include <common>
      attribute vec3 churchEngraving;
      varying vec2 vChurchTile;
      varying vec3 vChurchEngraving;
      varying vec3 vChurchStoneWorld;
    `).replace('#include <begin_vertex>', `
      #include <begin_vertex>
      vChurchTile = position.xz;
      vChurchEngraving = churchEngraving;
      vec4 churchStonePosition = vec4(position, 1.0);
      #ifdef USE_INSTANCING
        churchStonePosition = instanceMatrix * churchStonePosition;
      #endif
      vChurchStoneWorld = (modelMatrix * churchStonePosition).xyz;
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
      #include <common>
      uniform float uChurchEngravingStrength;
      uniform float uChurchMossStrength;
      varying vec2 vChurchTile;
      varying vec3 vChurchEngraving;
      varying vec3 vChurchStoneWorld;
      float carvingHash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float carvingNoise(vec2 p) {
        vec2 cell = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(carvingHash(cell), carvingHash(cell + vec2(1.0, 0.0)), f.x),
          mix(carvingHash(cell + vec2(0.0, 1.0)), carvingHash(cell + vec2(1.0)), f.x), f.y);
      }
      float carvingSegment(vec2 p, vec2 a, vec2 b) {
        vec2 edge = b - a;
        return length(p - a - edge * clamp(dot(p - a, edge) / dot(edge, edge), 0.0, 1.0));
      }
      float carvingDistance(vec2 local) {
        // The frame follows the slab; the medallion can turn independently.
        vec2 q = abs(local) - vec2(0.375, 0.28);
        float frame = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.025;
        float line = min(abs(frame), abs(frame + 0.026));
        float angle = vChurchEngraving.z * 1.570796327;
        vec2 p = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * local;
        float motif;
        if (vChurchEngraving.x < 1.5) {
          vec2 lobes = abs(p);
          float quatrefoil = min(length(lobes - vec2(0.096, 0.0)),
            length(lobes - vec2(0.0, 0.096))) - 0.115;
          motif = min(abs(quatrefoil), abs(length(p) - 0.233));
          motif = min(motif, abs(length(p) - 0.052));
        } else if (vChurchEngraving.x < 2.5) {
          float cross = min(carvingSegment(p, vec2(0.0, -0.18), vec2(0.0, 0.16)),
            carvingSegment(p, vec2(-0.13, 0.06), vec2(0.13, 0.06)));
          motif = min(abs(cross - 0.018), abs(length(p) - 0.225));
        } else {
          float diamond = (abs(p.x) * 0.85 + abs(p.y) - 0.21) / 1.3124;
          motif = min(abs(diamond), abs(diamond + 0.024));
          vec2 petals = abs(p);
          motif = min(motif, abs(length(petals - vec2(0.052, 0.052)) - 0.066));
        }
        return min(line, motif);
      }
    `).replace('#include <map_fragment>', `
      #include <map_fragment>
      float stoneWear = carvingNoise(vChurchStoneWorld.xz * 3.8) * 0.54 +
        carvingNoise(vChurchStoneWorld.xz * 22.0 + 19.1) * 0.32 +
        carvingNoise(vChurchStoneWorld.xz * 83.0) * 0.14;
      float darkVeins = smoothstep(0.4, 0.72,
        carvingNoise(vChurchStoneWorld.xz * vec2(9.0, 30.0) + 31.0));
      diffuseColor.rgb *= (0.82 + stoneWear * 0.36) * (1.0 - darkVeins * 0.12);
      float carvingPixel = max(fwidth(vChurchTile.x), fwidth(vChurchTile.y));
      float carvingFade = 1.0 - smoothstep(0.025, 0.075, carvingPixel);
      float carvingLine = carvingDistance(vChurchTile);
      float carvingAA = max(fwidth(carvingLine), 0.0007);
      float carvingWear = carvingNoise(vChurchTile * 38.0 + vChurchEngraving.y * 17.0);
      float carvingWidth = mix(0.0055, 0.010, carvingWear);
      float carvingPresence = carvingFade * step(0.5, vChurchEngraving.x) *
        vChurchEngraving.y * uChurchEngravingStrength * mix(0.68, 1.0, carvingWear);
      float carvingCut = (1.0 - smoothstep(carvingWidth - carvingAA,
        carvingWidth + carvingAA, carvingLine)) * carvingPresence;
      float carvingBevel = (1.0 - smoothstep(carvingWidth, carvingWidth + 0.005 + carvingAA,
        carvingLine)) * carvingPresence;
      diffuseColor.rgb *= 1.0 - carvingCut * 0.85;
      diffuseColor.rgb *= 1.0 + max(0.0, carvingBevel - carvingCut) * 0.2;

      // World-space colonies cross tile boundaries; finer growth fades before it aliases.
      vec2 mossPosition = vChurchStoneWorld.xz;
      float dampPatch = carvingNoise(mossPosition * 0.23) * 0.7 +
        carvingNoise(mossPosition * 0.94 + 7.3) * 0.3;
      float mossClumps = carvingNoise(mossPosition * 5.2);
      float mossPixel = max(length(dFdx(mossPosition)), length(dFdy(mossPosition)));
      float mossDetailFade = 1.0 - smoothstep(0.012, 0.055, mossPixel);
      float mossGrain = mix(0.5, carvingNoise(mossPosition * 42.0), mossDetailFade);
      float tileEdge = max(abs(vChurchTile.x) / 0.48, abs(vChurchTile.y) / 0.39);
      float mossEdge = smoothstep(0.5, 0.96, tileEdge + (mossClumps - 0.5) * 0.32);
      float moss = smoothstep(0.38, 0.68, dampPatch) *
        clamp(mossEdge * 0.92 + smoothstep(0.58, 0.76, dampPatch) * 0.42 + carvingCut * 0.18, 0.0, 1.0);
      moss *= mix(0.52, 1.0, smoothstep(0.2, 0.75, mossClumps)) * uChurchMossStrength;
      vec3 mossColor = mix(vec3(0.024, 0.052, 0.013), vec3(0.13, 0.18, 0.047),
        mossClumps * 0.6 + mossGrain * 0.4);
      mossColor *= (0.78 + mossGrain * 0.44) * (1.0 - carvingCut * 0.6);
      diffuseColor.rgb = mix(diffuseColor.rgb, mossColor, moss * 0.65);
      float carvingHeight = -0.012 * carvingBevel *
        (0.4 + 0.6 * (1.0 - smoothstep(0.0, carvingWidth + carvingAA, carvingLine)));
      float churchSurfaceHeight = carvingHeight + moss * (0.003 + mossGrain * 0.007);
    `).replace('#include <normal_fragment_maps>', `
      #include <normal_fragment_maps>
      #ifdef USE_BUMPMAP
        normal = perturbNormalArb(-vViewPosition, normal,
          vec2(dFdx(churchSurfaceHeight), dFdy(churchSurfaceHeight)) /
            max(vec2(length(dFdx(vViewPosition)), length(dFdy(vViewPosition))), vec2(0.0001)), faceDirection);
      #endif
    `);
  };
  material.customProgramCacheKey = () => 'ruined-church-engravings-v4';
}
