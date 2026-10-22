// Club-only performers. They are not dialogue targets or enemies.
export const ROCK_CLUB_BAND = [
  { id: "john-zool", name: "John Zool", role: "Segunda guitarra", model: new URL("../assets/neonboy-animaciones/club-de-rock/john-zool-playing2.glb", import.meta.url).href, fitHeight: 1.85, animationState: "waiting", idleClip: new URL("../assets/neonboy-animaciones/club-de-rock/john-zool.show-anim.glb", import.meta.url).href },
  { id: "lilith-9", name: "Lilith-9", role: "Cantante - waiting for show", model: new URL("../assets/neonboy-animaciones/club-de-rock/cantante-hablando.glb", import.meta.url).href, fitHeight: 1.78, animationState: "waiting" },
  { id: "revenant", name: "Revenant", role: "Bajista", model: new URL("../assets/neonboy-animaciones/club-de-rock/revenant-pose1.glb", import.meta.url).href, fitHeight: 1.88, animationState: "waiting" },
  { id: "lujan", name: "Luján", role: "Baterista", model: new URL("../assets/neonboy-animaciones/club-de-rock/baterista-lujan.glb", import.meta.url).href, fitHeight: 1.78, animationState: "drummerReady", nextAnimationState: "drummerPerforming" },
];

// A future recital can move the one playable NeonBoy to this mark.
export const ROCK_CLUB_STAGE_MARKS = { neonboy: { x: 2.45, y: 0.48, z: -13.85, yaw: 0 } };
