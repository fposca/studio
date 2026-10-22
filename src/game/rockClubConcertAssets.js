// These are animation-only copies of the exact Meshy playing exports. Regenerate
// with `node scripts/extract-rock-club-show-clips.mjs` after replacing a source.
const clip = (file, name) => ({
  url: new URL(`../assets/neonboy-animaciones/club-de-rock/${file}.show-anim.glb`, import.meta.url).href,
  name,
});

export const ROCK_CLUB_CONCERT_CLIPS = {
  neonboy: clip("neon-boy-playing", "_01a0d038_7988_77f9_bb15_b47353596412"),
  "john-zool": clip("john-zool-playing2", "_01a0d0e8_c7b8_76db_a277_f980714cd634"),
  "lilith-9": clip("lilith-9-playing", "Happy_Sway_Standing"),
  revenant: clip("revenant-playing", "_01a0cfc2_a99e_74e9_aaac_3ed0f0ca819b"),
  lujan: clip("lujan-playing", "_01a0d4b3_7071_75c4_bc19_c1d6d20fe6bd"),
  "club-rulo": clip("rulo-palying", "_01a0d0e8_c7b8_76db_a277_f980714cd634"),
  charly: clip("charly-playing", "_01a0d038_7988_77f9_bb15_b47353596412"),
  "club-drunk": clip("npc-drunk-playing", "FunnyDancing_02"),
  diego: clip("diego-playing", "Sit_and_Doze_Off"),
};

export const CONCERT_REACTOR_IDS = Object.keys(ROCK_CLUB_CONCERT_CLIPS).filter((id) => id !== "neonboy");
