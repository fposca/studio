import * as THREE from "three";

function createInteriorBackdrop({ name, radius, height, bottomUv, intensity, sharpness }) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      panorama: { value: null }, intensity: { value: intensity },
      bottomUv: { value: bottomUv }, horizontalRepeat: { value: 3 }, sharpness: { value: sharpness },
      texelSize: { value: new THREE.Vector2(1 / 1024, 1 / 512) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D panorama;
      uniform float intensity;
      uniform float bottomUv;
      uniform float horizontalRepeat;
      uniform float sharpness;
      uniform vec2 texelSize;
      varying vec2 vUv;
      void main() {
        vec2 uv = vec2(fract(vUv.x * horizontalRepeat), mix(bottomUv, 1.0, vUv.y));
        vec3 center = texture2D(panorama, uv).rgb;
        vec3 neighbors = (
          texture2D(panorama, uv + vec2(texelSize.x, 0.0)).rgb
          + texture2D(panorama, uv - vec2(texelSize.x, 0.0)).rgb
          + texture2D(panorama, uv + vec2(0.0, texelSize.y)).rgb
          + texture2D(panorama, uv - vec2(0.0, texelSize.y)).rgb
        ) * 0.25;
        vec3 color = max(vec3(0.0), center + (center - neighbors) * sharpness);
        vec3 seam = 0.5 * (texture2D(panorama, vec2(0.002, uv.y)).rgb
          + texture2D(panorama, vec2(0.998, uv.y)).rgb);
        float edge = smoothstep(0.0, 0.025, uv.x) * (1.0 - smoothstep(0.975, 1.0, uv.x));
        color = mix(seam, color, edge) * intensity;
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide, fog: false, depthWrite: true
  });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 128, 1, true), material);
  mesh.name = name;
  mesh.position.y = height / 2;
  mesh.renderOrder = -1000;
  mesh.frustumCulled = false;
  mesh.visible = false;
  mesh.userData.editorHelper = true;
  mesh.userData.setTexture = (texture, brightness = intensity) => {
    material.uniforms.panorama.value = texture;
    material.uniforms.intensity.value = brightness;
    if (texture?.image) material.uniforms.texelSize.value.set(1 / texture.image.width, 1 / texture.image.height);
    mesh.visible = Boolean(texture);
  };
  mesh.userData.dispose = () => { mesh.geometry.dispose(); material.dispose(); };
  return mesh;
}

export const createCastleBackdrop = () => createInteriorBackdrop({
  name: "Panorama nitido del castillo", radius: 44, height: 30, bottomUv: 0.37,
  intensity: 0.88, sharpness: 0.8
});

export const createGothicChurchBackdrop = () => createInteriorBackdrop({
  name: "Panorama nitido de iglesia gotica", radius: 48, height: 34, bottomUv: 0.4,
  intensity: 0.92, sharpness: 0.85
});
