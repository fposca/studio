// Positions are percentages of the original 1619 x 971 map image.
// A destination can be connected to a 3D scene when that scene is ready.
export const NEON_UNIVERSE_SCENARIOS = [
  {
    id: "record-store",
    name: "Tienda de Discos",
    description: "Recorré los vinilos de NeonBoy, escuchá la discografía y descubrí la rockola.",
    status: "available",
    position: { x: 15.1, y: 20.8 },
    destination: "discography",
  },
  {
    id: "recording-studio",
    name: "Neon Recording Studio",
    description: "Un estudio para crear, grabar y dar forma al próximo sonido de NeonBoy.",
    status: "locked",
    position: { x: 43.8, y: 17.2 },
    destination: "recording-studio",
  },
  {
    id: "rock-club",
    name: "Club de Rock 1999",
    description: "El escenario de luces y amplificadores donde la noche cobra vida.",
    status: "locked",
    position: { x: 69.1, y: 19.7 },
    destination: "rock-club",
  },
  {
    id: "arcade-1999",
    name: "Arcade 1999",
    description: "Máquinas, fichas y desafíos de otra época esperan tras sus puertas.",
    status: "locked",
    position: { x: 17.3, y: 52.9 },
    destination: "arcade-1999",
  },
  {
    id: "neonboy-rooftop",
    name: "Azotea de NeonBoy",
    description: "Una terraza sobre la ciudad para mirar las luces desde las alturas.",
    status: "locked",
    position: { x: 60.9, y: 71.7 },
    destination: null,
  },
  {
    id: "underworld",
    name: "Inframundo",
    description: "Un portal rojo oculta un lugar del que todavía no se sabe nada.",
    status: "secret",
    position: { x: 92.4, y: 47.1 },
    destination: null,
  },
];

export const NEON_UNIVERSE_STATUS = {
  available: "DISPONIBLE",
  locked: "BLOQUEADO",
  secret: "SECRETO",
};

// Temporary preview access; the permanent unlock status remains "locked".
// Set VITE_RECORDING_STUDIO_PREVIEW=true for a preview build or false in local dev.
export function getScenarioStatus(scenario, unlockedScenarios = [], env = import.meta.env ?? {}) {
  if (scenario.destination && unlockedScenarios.includes(scenario.id)) return "available";
  if (scenario.id === "arcade-1999" && env.VITE_ARCADE_1999_PREVIEW === "true") return "available";
  if (scenario.id === "rock-club" && (env.VITE_ROCK_CLUB_PREVIEW === "true" || (env.DEV && env.VITE_ROCK_CLUB_PREVIEW !== "false"))) return "available";
  if (scenario.id === "recording-studio" && (env.VITE_RECORDING_STUDIO_PREVIEW === "true" || (env.DEV && env.VITE_RECORDING_STUDIO_PREVIEW !== "false"))) return "available";
  return scenario.status;
}
