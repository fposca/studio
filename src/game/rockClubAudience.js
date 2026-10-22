// Ambient club visitors do not open dialogues or change mission progress.
const crowd = (id, model, name, clip, fitHeight = 1.78, playbackRate = 0.78, phase = 0) => ({
  id, name, role: "Público del club",
  model,
  fitHeight, clip, playbackRate, phase, ambient: true,
});

export const ROCK_CLUB_AUDIENCE = [
  { ...crowd("club-spectator-1", new URL("../assets/neonboy-animaciones/club-de-rock/personaje-mujer-extra.glb", import.meta.url).href, "Espectadora", null, 1.74), loadWithScene: true },
  { ...crowd("club-drunk", new URL("../assets/neonboy-animaciones/club-de-rock/npc-caminante-borracho.glb", import.meta.url).href, "Espectador tambaleante", "Unsteady_Walk", 1.8, 0.85),
    walk: { dx: 0, dz: -3.2, speed: 0.62 }, loadWithScene: true },
  crowd("club-audience-1", new URL("../assets/neonboy-animaciones/club-de-rock/npc-1.glb", import.meta.url).href, "Público 1", "Cheer_with_Both_Hands", 1.8, 0.68, 0.15),
  crowd("club-audience-2", new URL("../assets/neonboy-animaciones/club-de-rock/npc-2.glb", import.meta.url).href, "Público 2", "Long_Breathe_and_Look_Around", 1.77, 0.82, 0.4),
  crowd("club-audience-3", new URL("../assets/neonboy-animaciones/club-de-rock/npc-3.glb", import.meta.url).href, "Público 3", "Cheer_with_Both_Hands_Up", 1.82, 0.7, 0.6),
  crowd("club-audience-5", new URL("../assets/neonboy-animaciones/club-de-rock/npc-5.glb", import.meta.url).href, "Público 5", null, 1.76, 0.8, 0.3),
  crowd("club-audience-6", new URL("../assets/neonboy-animaciones/club-de-rock/npc-6.glb", import.meta.url).href, "Público 6", "Cheer_with_Both_Hands_1", 1.83, 0.73, 0.5),
  crowd("club-audience-7", new URL("../assets/neonboy-animaciones/club-de-rock/npc-7.glb", import.meta.url).href, "Público 7", "Long_Breathe_and_Look_Around", 1.79, 0.8, 0.2),
  crowd("club-audience-8", new URL("../assets/neonboy-animaciones/club-de-rock/npc-8.glb", import.meta.url).href, "Público 8", "Cheer_with_Both_Hands_1", 1.75, 0.73, 0.8),
  crowd("club-audience-9", new URL("../assets/neonboy-animaciones/club-de-rock/npc-9.glb", import.meta.url).href, "Público 9", "Long_Breathe_and_Look_Around", 1.85, 0.78, 0.7),
];


// Keeps the walking clip in place while the actor travels between two points.
export function advanceRockClubPatrol(walk, dt) {
  const length = Math.hypot(walk.dx, walk.dz);
  if (length < 0.001) return { x: walk.originX, z: walk.originZ, yaw: 0, lean: 0, paused: true };
  walk.time += dt;
  if (walk.pause > 0) walk.pause = Math.max(0, walk.pause - dt);
  else {
    walk.progress += walk.direction * dt * walk.speed / length;
    if (walk.progress >= 1 || walk.progress <= 0) {
      walk.progress = Math.max(0, Math.min(1, walk.progress));
      walk.direction *= -1;
      walk.pause = 0.85;
    }
  }
  const wobble = 0.085 * Math.sin(walk.time * 4.2) * Math.sin(Math.PI * walk.progress);
  return {
    x: walk.originX + walk.dx * walk.progress + walk.dz / length * wobble,
    z: walk.originZ + walk.dz * walk.progress - walk.dx / length * wobble,
    yaw: Math.atan2(walk.dx * walk.direction, walk.dz * walk.direction),
    lean: 0.018 * Math.sin(walk.time * 3.1),
    paused: walk.pause > 0,
  };
}
