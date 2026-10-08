export const DEFAULT_RETRO_GAMER_LIGHTING = Object.freeze({ period: "day", lights: true });

export const RETRO_GAMER_LIGHTING_MODES = Object.freeze([
  { id: "day", name: "Dia", ambient: 1, key: 1, environment: 1, color: "#e4efff", window: 24 },
  { id: "sunset", name: "Atardecer", ambient: 0.42, key: 0.62, environment: 0.5, color: "#ffad67", window: 14 },
  { id: "night", name: "Noche", ambient: 0.065, key: 0.045, environment: 0.075, color: "#809bd1", window: 1.5 }
]);

export function normalizeRetroGamerLighting(value = {}) {
  return {
    period: RETRO_GAMER_LIGHTING_MODES.some((mode) => mode.id === value?.period) ? value.period : "day",
    lights: typeof value?.lights === "boolean" ? value.lights : true
  };
}

// Scope the room's ambient changes to each render, including still/video exports.
export function bindRetroGamerLighting(scene, room, { ambient, keyLight }) {
  const before = scene.onBeforeRender, after = scene.onAfterRender;
  let saved = null;
  const ambientColor = ambient.color.clone();
  const keyColor = keyLight.color.clone();
  const restore = () => {
    if (!saved) return;
    ambient.intensity = saved.ambient;
    keyLight.intensity = saved.key;
    scene.environmentIntensity = saved.environment;
    ambient.color.copy(ambientColor);
    keyLight.color.copy(keyColor);
    saved = null;
  };
  scene.onBeforeRender = function(...args) {
    before.apply(this, args);
    if (!room.visible) return;
    const settings = normalizeRetroGamerLighting(room.userData.lighting);
    const mode = RETRO_GAMER_LIGHTING_MODES.find((entry) => entry.id === settings.period);
    saved = { ambient: ambient.intensity, key: keyLight.intensity, environment: scene.environmentIntensity };
    ambientColor.copy(ambient.color);
    keyColor.copy(keyLight.color);
    ambient.intensity *= mode.ambient + (settings.lights ? 0.12 : 0);
    keyLight.intensity *= mode.key;
    scene.environmentIntensity *= mode.environment;
    ambient.color.set(mode.color);
    keyLight.color.set(mode.color);
  };
  scene.onAfterRender = function(...args) { restore(); after.apply(this, args); };
  return () => {
    restore();
    scene.onBeforeRender = before;
    scene.onAfterRender = after;
  };
}
