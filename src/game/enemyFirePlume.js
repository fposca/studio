import * as THREE from "three";

// Two crossed sheets follow the projectile's local -Z axis. Procedural flames
// stay visible from above and from the side without lights or texture atlases.
export function createEnemyFirePlume(phase = 0) {
  const root = new THREE.Group();
  root.name = "Enemy orb / infernal flame";
  const geometry = new THREE.PlaneGeometry(.85, 1.5);
  geometry.translate(0, .75, 0);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: phase }, uFade: { value: 1 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uFade;
      varying vec2 vUv;
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3. - 2. * f);
        return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
          mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
      }
      void main() {
        float t = vUv.y;
        vec2 flow = vec2(vUv.x * 6., t * 6. - uTime * 4.);
        float turbulence = noise(flow) * .67 + noise(flow * 2.3) * .33;
        float bend = sin(t * 12. - uTime * 6.) * t * .055;
        float width = .32 * (1. - t) + sin(t * 3.14159) * .14;
        float edge = abs(vUv.x - .5 + bend) + turbulence * t * .24;
        float flame = 1. - smoothstep(width * .3, width + .035, edge);
        flame *= smoothstep(0., .06, t) * (1. - smoothstep(.65, 1., t));
        float heat = clamp(flame * .9 + (1. - t) * .35, 0., 1.);
        vec3 color = mix(vec3(.65, .014, .002), vec3(1., .23, .014), heat);
        color = mix(color, vec3(1., .86, .48), pow(heat, 4.));
        gl_FragColor = vec4(color, flame * uFade * .78);
        #include <colorspace_fragment>
      }
    `,
    // The halo adds glow; alpha blending keeps overlapping flames orange.
    transparent: true, blending: THREE.NormalBlending, side: THREE.DoubleSide,
    depthWrite: false, toneMapped: false,
  });
  const horizontal = new THREE.Mesh(geometry, material);
  const vertical = new THREE.Mesh(geometry, material);
  vertical.rotation.z = Math.PI / 2;
  root.add(horizontal, vertical);
  function update(time, fade) {
    material.uniforms.uTime.value = time + phase;
    material.uniforms.uFade.value = fade;
  }
  return { root, update };
}
