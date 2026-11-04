import * as THREE from "three";

export const DEMON_SHIELD = Object.freeze({ radius: .92, halfHeight: .22, centerY: 1.16 });
const DURATION = .78;

// One lightweight surface, allocated once; no textures or full-screen flashes.
export function createHalloweenDemonShield(scene, actor) {
  const { radius, halfHeight, centerY } = DEMON_SHIELD;
  const uniforms = {
    uAge: { value: 0 }, uStrength: { value: 0 },
    uImpact: { value: new THREE.Vector3(0, 0, radius) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.FrontSide, toneMapped: false,
    vertexShader: `
      varying vec3 vLocal;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vLocal = position;
        vec4 eye = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = -eye.xyz;
        gl_Position = projectionMatrix * eye;
      }
    `,
    fragmentShader: `
      uniform float uAge;
      uniform float uStrength;
      uniform vec3 uImpact;
      varying vec3 vLocal;
      varying vec3 vNormal;
      varying vec3 vView;
      // Hexagonal energy cells wrapped around the body.
      float cells(vec2 p) {
        vec2 grid = vec2(1.0, 1.7320508);
        vec2 a = mod(p, grid) - grid * 0.5;
        vec2 b = mod(p - grid * 0.5, grid) - grid * 0.5;
        vec2 cell = dot(a,a) < dot(b,b) ? a : b;
        cell = abs(cell);
        float edge = max(dot(cell, normalize(vec2(1.0, 1.7320508))), cell.x);
        return smoothstep(0.43, 0.49, edge);
      }
      void main() {
        float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.4);
        float longitude = atan(vLocal.z, vLocal.x);
        float hex = cells(vec2(longitude * 6.0, vLocal.y * 7.0));
        float distanceFromHit = length(vLocal - uImpact);
        float wave = exp(-pow((distanceFromHit - uAge * 4.6) * 12.0, 2.0));
        float afterWave = exp(-pow((distanceFromHit - max(0.0, uAge - 0.13) * 4.6) * 16.0, 2.0)) * 0.38;
        float contact = exp(-distanceFromHit * 7.0) * exp(-uAge * 9.0);
        float energy = uStrength * (0.055 + rim * 0.65 + hex * 0.33 + wave * 0.75 + afterWave * 0.25 + contact);
        vec3 color = mix(vec3(0.24, 0.4, 1.0), vec3(0.8, 0.24, 1.0), hex * 0.6);
        color = mix(color, vec3(0.65, 0.98, 1.0), clamp(wave + contact, 0.0, 1.0));
        gl_FragColor = vec4(color, min(0.85, energy));
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, halfHeight * 2, 6, 48), material);
  mesh.name = "Halloween / campo de fuerza del semidemonio";
  mesh.userData.halloweenCodeExclude = true;
  mesh.visible = false;
  mesh.renderOrder = 3;
  scene.add(mesh);
  let remaining = 0, disabled = false;
  const localHit = new THREE.Vector3(), axis = new THREE.Vector3();
  function follow() { mesh.position.copy(actor.position); mesh.position.y += centerY; }
  follow();
  return {
    mesh,
    setDisabled(value) {
      disabled = value;
      if (disabled) { remaining = 0; mesh.visible = false; uniforms.uStrength.value = 0; }
    },
    flash(worldHit) {
      if (disabled) return false;
      follow();
      localHit.copy(worldHit).sub(mesh.position);
      axis.set(0, THREE.MathUtils.clamp(localHit.y, -halfHeight, halfHeight), 0);
      localHit.sub(axis);
      if (localHit.lengthSq() < .00001) localHit.set(0, 0, 1);
      uniforms.uImpact.value.copy(localHit.normalize().multiplyScalar(radius).add(axis));
      remaining = DURATION;
      uniforms.uAge.value = 0;
      uniforms.uStrength.value = 1;
      mesh.visible = true;
      return true;
    },
    update(dt, reduceFlashing = false) {
      follow();
      remaining = Math.max(0, remaining - Math.max(0, dt));
      mesh.visible = !disabled && remaining > 0;
      uniforms.uAge.value = DURATION - remaining;
      uniforms.uStrength.value = Math.pow(remaining / DURATION, .7) * (reduceFlashing ? .45 : 1);
    },
  };
}
