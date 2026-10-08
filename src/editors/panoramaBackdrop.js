import * as THREE from "three";

export function createPanoramaBackdrop({ name, horizontalRepeat = 1, horizontalOffset = 0,
  horizonCompression = 1, verticalOffset = 0, verticalScale = 1, horizonFade = 0,
  horizonColor = "#000000", seamBlend = 0, intensity = 1, zenithCap = 0,
  horizontalMirror = false }) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      panorama: { value: null }, zenithTexture: { value: null }, zenithTextureEnabled: { value: 0 },
      panoramaTexelSize: { value: new THREE.Vector2(1, 1) }, detailStrength: { value: 0 },
      intensity: { value: intensity },
      horizontalRepeat: { value: horizontalRepeat }, horizontalOffset: { value: horizontalOffset },
      horizontalMirror: { value: horizontalMirror ? 1 : 0 },
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
      uniform vec2 panoramaTexelSize;
      uniform float detailStrength;
      uniform sampler2D zenithTexture;
      uniform float zenithTextureEnabled;
      uniform float intensity;
      uniform float horizontalRepeat;
      uniform float horizontalOffset;
      uniform float horizontalMirror;
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
        float horizontalUv = vPanoramaUv.x * horizontalRepeat + horizontalOffset;
        float verticalUv = 0.5 + compressed * 0.5 * verticalScale + verticalOffset;
        vec2 uv = vec2(horizontalMirror > 0.5
          ? 1.0 - abs(mod(horizontalUv, 2.0) - 1.0)
          : fract(horizontalUv), clamp(verticalUv, 0.0, 1.0));
        vec3 color = texture2D(panorama, uv).rgb;
        if (detailStrength > 0.0) {
          vec2 x = vec2(panoramaTexelSize.x, 0.0);
          vec2 y = vec2(0.0, panoramaTexelSize.y);
          vec3 neighbors = (texture2D(panorama, clamp(uv + x, 0.0, 1.0)).rgb
            + texture2D(panorama, clamp(uv - x, 0.0, 1.0)).rgb
            + texture2D(panorama, clamp(uv + y, 0.0, 1.0)).rgb
            + texture2D(panorama, clamp(uv - y, 0.0, 1.0)).rgb) * 0.25;
          color = clamp(color + (color - neighbors) * detailStrength, 0.0, 1.0);

          vec2 starGrid = vPanoramaUv * vec2(800.0, 400.0);
          vec2 cell = floor(starGrid);
          float seed = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
          if (seed > 0.994) {
            vec2 starPosition = vec2(
              fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453),
              fract(sin(dot(cell, vec2(269.5, 183.3))) * 43758.5453)
            );
            float star = 1.0 - smoothstep(0.04, 0.4, length(fract(starGrid) - starPosition));
            color += mix(vec3(0.38, 0.7, 0.9), vec3(0.95, 0.9, 0.75), seed) * star * 0.46;
          }
        }
        color *= intensity;
        if (seamBlend > 0.0 && horizontalMirror < 0.5) {
          vec3 edgeColor = (texture2D(panorama, vec2(0.001, uv.y)).rgb
            + texture2D(panorama, vec2(0.999, uv.y)).rgb) * intensity * 0.5;
          float edgeWeight = smoothstep(0.0, seamBlend, uv.x)
            * (1.0 - smoothstep(1.0 - seamBlend, 1.0, uv.x));
          color = mix(edgeColor, color, edgeWeight);
        }
        if (horizonFade > 0.0) color = mix(horizonColor, color,
          smoothstep(0.5, 0.5 + horizonFade, vPanoramaUv.y));
        if (zenithCap > 0.0) {
          vec3 capColor;
          if (zenithTextureEnabled > 0.5) {
            vec2 capUv = clamp(normalize(vPanoramaDirection).xz * 0.55 + 0.5, 0.0, 1.0);
            capColor = texture2D(zenithTexture, capUv).rgb * intensity;
          } else {
            vec2 capUv = vec2(0.45 + vPanoramaDirection.x * 0.17,
              clamp(0.91 + vPanoramaDirection.z * 0.08, 0.82, 0.98));
            capColor = texture2D(panorama, capUv).rgb * intensity;
          }
          float capWeight = smoothstep(0.55, 0.72, vPanoramaUv.y);
          if (zenithTextureEnabled > 0.5) capWeight = max(capWeight, smoothstep(0.88, 0.98, verticalUv));
          color = mix(color, capColor, zenithCap * capWeight);
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
    const image = texture?.image;
    material.uniforms.panoramaTexelSize.value.set(1 / (image?.width || 1), 1 / (image?.height || 1));
    material.uniforms.intensity.value = brightness;
    mesh.visible = Boolean(texture);
  };
  mesh.userData.setZenithTexture = (texture) => {
    material.uniforms.zenithTexture.value = texture;
    material.uniforms.zenithTextureEnabled.value = texture ? 1 : 0;
  };
  mesh.userData.dispose = () => { mesh.geometry.dispose(); material.dispose(); };
  return mesh;
}
