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
  { x: 0, z: -2.1, hx: 3.8, hz: 1.1 }, // console
  { x: -1.8, z: 1.1, hx: 1.1, hz: 0.85 }, // engineer's chair
  { x: -8.25, z: -3.6, hx: 0.75, hz: 2.4 }, // racks
  { x: -7.5, z: 3.8, hx: 1.4, hz: 0.7 }, // sofa
  { x: 8.1, z: -2.4, hx: 0.9, hz: 1.4 }, // guitar amps
  { x: -1.6, z: -10.1, hx: 7.75, hz: 0.16 }, // isolation wall and glass
  { x: 8.75, z: -10.1, hx: 0.48, hz: 0.16 },
  { x: -7.4, z: -15.65, hx: 0.9, hz: 0.8 }, // booth amplifier
];

export const STUDIO_EXAMINE = [
  { id: "console", label: "Consola", x: 0, z: -2.1, reach: 3.4, text: "Esta consola tiene más canales que una televisión por cable." },
  { id: "guitar", label: "Guitarra", x: 7.8, z: 3.5, reach: 2.15, text: "Una guitarra preparada para grabar el próximo solo." },
  { id: "computer", label: "Computadora", x: 1.42, z: -4.28, reach: 2.5, text: "Tecnología de última generación... para 1999." },
  { id: "microphone", label: "Micrófono", x: 0.5, z: -14.3, reach: 2.35, text: "Acá empiezan las canciones que después terminan en los discos." },
];
