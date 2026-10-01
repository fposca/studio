import * as THREE from "three";

export const DEFAULT_CEMETERY_LIGHTING = Object.freeze({
  enabled: false, darkness: 0.55, moon: 1, rim: 1, color: "#8aa9bf"
});

export function normalizeCemeteryLighting(value = {}) {
  const result = { ...DEFAULT_CEMETERY_LIGHTING, ...value };
  result.enabled = Boolean(result.enabled);
  for (const [key, max] of [["darkness", 1], ["moon", 2], ["rim", 2]]) {
    const number = Number(result[key]);
    result[key] = Number.isFinite(number) ? THREE.MathUtils.clamp(number, 0, max) : DEFAULT_CEMETERY_LIGHTING[key];
  }
  result.color = /^#[0-9a-f]{6}$/i.test(result.color) ? result.color : DEFAULT_CEMETERY_LIGHTING.color;
  return result;
}

export function createCemeteryLighting(scene, { ambient, keyLight, fill, moonLights, panorama }) {
  const before = scene.onBeforeRender;
  const after = scene.onAfterRender;
  const baseFillColor = fill.color.clone();
  const baseMoonColors = moonLights.map((light) => light.color.clone());
  const baseMoonIntensities = moonLights.map((light) => light.intensity);
  const baseMoonTargets = moonLights.map((light) => light.target.position.clone());
  const baseFillIntensity = fill.intensity;
  let config = DEFAULT_CEMETERY_LIGHTING;
  let active = false;
  let saved = null;

  const restore = () => {
    if (!saved) return;
    ambient.intensity = saved.ambient;
    keyLight.intensity = saved.key;
    scene.environmentIntensity = saved.environment;
    if (panorama) panorama.material.uniforms.intensity.value = saved.panorama;
    saved = null;
  };

  scene.onBeforeRender = function(...args) {
    before.apply(this, args);
    if (!active) return;
    saved = {
      ambient: ambient.intensity,
      key: keyLight.intensity,
      environment: scene.environmentIntensity,
      panorama: panorama?.material.uniforms.intensity.value
    };
    ambient.intensity *= 1 - config.darkness * 0.72;
    keyLight.intensity *= 1 - config.darkness * 0.86;
    scene.environmentIntensity *= 1 - config.darkness * 0.38;
    if (panorama) panorama.material.uniforms.intensity.value *= 1 - config.darkness * 0.36;
  };
  scene.onAfterRender = function(...args) {
    restore();
    after.apply(this, args);
  };

  return {
    update(settings, inCemetery) {
      config = normalizeCemeteryLighting(settings);
      active = Boolean(inCemetery && config.enabled);
      if (active) {
        fill.color.set(config.color);
        fill.intensity = baseFillIntensity * config.moon * (0.85 - config.darkness * 0.28);
        moonLights.forEach((light, index) => {
          light.color.set(config.color);
          light.intensity = baseMoonIntensities[index] * config.moon * (index === 0 ? 1 : config.rim);
        });
        moonLights[1]?.target.position.set(2, 1, -2);
      } else {
        fill.color.copy(baseFillColor);
        fill.intensity = baseFillIntensity;
        moonLights.forEach((light, index) => {
          light.color.copy(baseMoonColors[index]);
          light.intensity = baseMoonIntensities[index];
          light.target.position.copy(baseMoonTargets[index]);
        });
      }
    },
    dispose() {
      restore();
      scene.onBeforeRender = before;
      scene.onAfterRender = after;
    }
  };
}
