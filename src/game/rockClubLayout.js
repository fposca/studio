// Shared coordinates for the club scenery and NeonBoy's existing explorer.
export const ROCK_CLUB_LAYOUT = {
  playerLimitX: 9.28,
  playerBackZ: -18.45,
  playerFrontZ: 8.35,
  spawnZ: 4.1,
  cameraLimitX: 9.55,
  cameraBackZ: -18.7,
  cameraFrontZ: 8.65,
};

export const ROCK_CLUB_FRIENDS_TABLE = {
  id: "friendsTable", label: "Mesa de los amigos", x: -5.4, z: 1.3, reach: 2.15,
};

export const ROCK_CLUB_STAGE_HEIGHT = 0.48;

export function rockClubFloorHeight(x, z) {
  if (Math.abs(x) > 7.2) return 0;
  if (z <= -11.5) return ROCK_CLUB_STAGE_HEIGHT;
  if (Math.abs(x) <= 2.3 && z < -9.7)
    return Math.min(ROCK_CLUB_STAGE_HEIGHT, (-9.7 - z) / 1.8 * ROCK_CLUB_STAGE_HEIGHT);
  return 0;
}

export const ROCK_CLUB_OBSTACLES = [
  { id: "bar", x: 7.3, z: -3.5, hx: 0.84, hz: 3.2 },
  { id: "ticket-desk", x: -7.65, z: 5.2, hx: 0.9, hz: 0.55 },
  { id: "table-a", x: -5.7, z: 0.6, hx: 0.52, hz: 0.52 },
  { id: "table-b", x: -5.5, z: -5.7, hx: 0.52, hz: 0.52 },
  { id: "sound-desk", x: -3.8, z: -3.3, hx: 0.85, hz: 0.55 },
  { id: "barrel", x: -8.35, z: -7.7, hx: 0.47, hz: 0.47 },
  { id: "stage-lip-left", x: -5, z: -11.52, hx: 2.7, hz: 0.1 },
  { id: "stage-lip-right", x: 5, z: -11.52, hx: 2.7, hz: 0.1 },
  { id: "stage-side-left", x: -7.7, z: -15.1, hx: 0.12, hz: 3.55 },
  { id: "stage-side-right", x: 7.7, z: -15.1, hx: 0.12, hz: 3.55 },
  { id: "drums", x: 0, z: -16.8, hx: 1.23, hz: 0.9 },
  { id: "guitar-stand", x: -4.95, z: -13.85, hx: 0.3, hz: 0.3 },
  { id: "bass-stand", x: 5.45, z: -14.15, hx: 0.3, hz: 0.3 },
  { id: "amp-left", x: -5.25, z: -16.2, hx: 0.65, hz: 0.48 },
  { id: "amp-right", x: 5.25, z: -16.2, hx: 0.65, hz: 0.48 },
  { id: "pa-left", x: -6.35, z: -12.3, hx: 0.72, hz: 0.55 },
  { id: "pa-right", x: 6.35, z: -12.3, hx: 0.72, hz: 0.55 },
  { id: "monitor-left", x: -2.9, z: -12.2, hx: 0.52, hz: 0.45 },
  { id: "monitor-right", x: 2.9, z: -12.2, hx: 0.52, hz: 0.45 },
];

export const ROCK_CLUB_EXAMINE = [
  { id: "stage", label: "Escenario", x: 0, z: -11.15, reach: 2.1, text: "Acá empieza el próximo recital de NeonBoy." },
  { id: "microphone", label: "Micrófono", x: 0, z: -14.2, reach: 2.05, text: "Listo para hacer temblar el club." },
  { id: "drums", label: "Batería", x: 0, z: -16.8, reach: 2.1, text: "Lista para hacer temblar el club." },
  { id: "amplifier", label: "Amplificador principal", x: -5.25, z: -16.2, reach: 2.3, text: "El amplificador principal necesita una revisión antes del show." },
  { id: "mixer", label: "Mesa de sonido", x: -3.8, z: -2.3, reach: 2.1, text: "Los canales de sonido necesitan una revisión antes del show." },
  { id: "bar", label: "Barra", x: 6.25, z: -3.5, reach: 2.1, text: "Todavía no hay nadie atendiendo." },
  { id: "backstage", label: "Puerta backstage", x: 8.8, z: -15.9, reach: 2.35, text: "Todavía no puedo pasar por acá." },
];
