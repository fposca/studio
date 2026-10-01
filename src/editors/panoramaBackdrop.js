import * as THREE from "three";

export function createPanoramaBackdrop({ name, horizontalRepeat = 1, horizontalOffset = 0,
  horizonCompression = 1, verticalOffset = 0, verticalScale = 1, horizonFade = 0,
  horizonColor = "#000000", seamBlend = 0, intensity = 1, zenithCap = 0 }) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      panorama: { value: null }, intensity: { value: intensity },
      horizontalRepeat: { value: horizontalRepeat }, horizontalOffset: { value: horizontalOffset },
      horizonCompression: { value: horizonCompression },
      verticalOffset: { value: verticalOffset }, verticalScale: { value: verticalScale },
      horizonFade: { value: horizonFade }, horizonColor: { value: new THREE.Color(horizonColor) },
      seamBlend: { value: seamBlend }, zenithCap: { value: zenithCap }
    },
    vertexShader: `
      varying vec2 vPanoramaUv;
      varying vec3 vPanoramaDirection;
      void main() {
        vPanoramaUv = uv;
        vPanoramaDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position.z = gl_Position.w;
      }
    `,
    fragmentShader: `
      uniform sampler2D panorama;
      uniform float intensity;
      uniform float horizontalRepeat;
      uniform float horizontalOffset;
      uniform float horizonCompression;
      uniform float verticalOffset;
      uniform float verticalScale;
      uniform float horizonFade;
      uniform float seamBlend;
      uniform float zenithCap;
      uniform vec3 horizonColor;
      varying vec2 vPanoramaUv;
      varying vec3 vPanoramaDirection;
      void main() {
        float latitude = (vPanoramaUv.y - 0.5) * 2.0;
        float compressed = latitude * horizonCompression / (1.0 + (horizonCompression - 1.0) * abs(latitude));
        vec2 uv = vec2(fract(vPanoramaUv.x * horizontalRepeat + horizontalOffset), clamp(0.5 + compressed * 0.5 * verticalScale + verticalOffset, 0.0, 1.0));
        vec3 color = texture2D(panorama, uv).rgb * intensity;
        if (seamBlend > 0.0) {
          vec3 edgeColor = (texture2D(panorama, vec2(0.001, uv.y)).rgb
            + texture2D(panorama, vec2(0.999, uv.y)).rgb) * intensity * 0.5;
          float edgeWeight = smoothstep(0.0, seamBlend, uv.x)
            * (1.0 - smoothstep(1.0 - seamBlend, 1.0, uv.x));
          color = mix(edgeColor, color, edgeWeight);
        }
        if (horizonFade > 0.0) color = mix(horizonColor, color,
          smoothstep(0.5, 0.5 + horizonFade, vPanoramaUv.y));
        if (zenithCap > 0.0) {
          vec2 capUv = vec2(0.45 + vPanoramaDirection.x * 0.17,
            clamp(0.91 + vPanoramaDirection.z * 0.08, 0.82, 0.98));
          vec3 capColor = texture2D(panorama, capUv).rgb * intensity;
          color = mix(color, capColor, zenithCap * smoothstep(0.55, 0.72, vPanoramaUv.y));
        }
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), material);
  mesh.name = name;
  mesh.userData.editorHelper = true;
  mesh.visible = false;
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  const position = new THREE.Vector3();
  mesh.onBeforeRender = (_renderer, scene, camera) => {
    camera.getWorldPosition(position);
    mesh.matrixWorld.makeRotationFromEuler(scene.backgroundRotation);
    mesh.matrixWorld.setPosition(position);
  };
  mesh.userData.setTexture = (texture, brightness = intensity) => {
    material.uniforms.panorama.value = texture;
    material.uniforms.intensity.value = brightness;
    mesh.visible = Boolean(texture);
  };
  mesh.userData.dispose = () => { mesh.geometry.dispose(); material.dispose(); };
  return mesh;
}
