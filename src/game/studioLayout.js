// Coordinates shared by the provisional scenery and the existing explorer controller.
export const STUDIO_LAYOUT = {
  playerLimitX: 9.25,
  playerBackZ: -18.2,
  playerFrontZ: 8.3,
  spawnZ: 4.25,
  cameraLimitX: 9.45,
  cameraBackZ: -18.35,
  cameraFrontZ: 8.5,
};

// The 1.5m passage at the right of the glass connects both rooms.
export const STUDIO_OBSTACLES = [
  { id: "console", x: 0, z: -2.1, hx: 3.8, hz: 1.1 },
  { id: "chair", x: 0, z: 0.55, hx: 0.75, hz: 0.68 },
  { id: "pc-table", x: 5.2, z: -4.35, hx: 1.05, hz: 0.75 },
  { id: "monitor-left", x: -3, z: -4.45, hx: 0.44, hz: 0.4 },
  { id: "monitor-right", x: 3, z: -4.45, hx: 0.44, hz: 0.4 },
  { id: "rack", x: -8.25, z: -3.6, hx: 0.75, hz: 2.4 },
  { id: "sofa", x: -9.1, z: 3.82, hx: 1.5, hz: 0.75 },
  { id: "guitar", x: 8.65, z: 1, hx: 0.46, hz: 0.48 },
  { id: "guitar-2", x: 8.65, z: 3.1, hx: 0.46, hz: 0.48 },
  { id: "guitar-3", x: 8.65, z: 5.2, hx: 0.46, hz: 0.48 },
  { id: "isolation-window", x: -1.6, z: -10.1, hx: 7.75, hz: 0.16 },
  { id: "door-frame", x: 8.75, z: -10.1, hx: 0.48, hz: 0.16 },
  { id: "amplifier", x: -7.35, z: -13.1, hx: 0.78, hz: 0.48 },
  { id: "drumkit", x: -2, z: -16.25, hx: 1.46, hz: 1.06 },
  { id: "drum-bench", x: -2, z: -18, hx: 0.44, hz: 0.42 },
];

export const STUDIO_EXAMINE = [
  { id: "hugo-album:el-ternero-la-vaca-y-el-cosmos", label: "Disco", x: 9.5, z: -6.8, reach: 2.05 },
  { id: "hugo-album:bs-as-overdrive", label: "Disco", x: 9.5, z: -4.2, reach: 2.05 },
  { id: "hugo-album:voodoo-women-blues", label: "Disco", x: 9.5, z: -1.6, reach: 2.05 },
  { id: "console", label: "Consola", x: 0, z: -2.1, reach: 3.9, text: "Esta consola tiene más canales que una televisión por cable." },
  { id: "guitar", label: "Guitarra", x: 8.65, z: 3.1, reach: 2.4, text: "Una guitarra preparada para grabar el próximo solo." },
  { id: "computer", label: "Computadora", x: 5.0, z: -4.44, reach: 2.4, text: "Tecnología de última generación... para 1999." },
  { id: "microphone", label: "Micrófono", x: 2.55, z: -14.15, reach: 2.35, text: "Acá empiezan las canciones que después terminan en los discos." },
];
