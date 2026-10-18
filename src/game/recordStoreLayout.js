import { STORE_NPCS } from "./recordStoreDialogue.js";
export const STORE_LAYOUT = {
  roomWidth: 22.5,
  roomDepth: 30.2,
  roomCenterZ: 0.7,
  backWallZ: -14,
  sideWallX: 11.05,
  frontWallZ: 15.35,
  playerLimitX: 9.8,
  playerBackZ: -12.25,
  playerFrontZ: 14.2,
  spawnZ: 11.1,
  counter: { x: -7.2, z: 12.65 },
  cdRack: { x: 9.25, z: 12.15 },
  jukebox: { x: -10.12, z: 8.0, yaw: Math.PI * 0.4 },
  coinTable: { x: 1.8, z: 8.8 }
};

const binRows = [-6.2, -0.3, 5.6];
export const STORE_BIN_POSITIONS = binRows.flatMap((z) => [-3.8, 3.8].map((x) => ({ x, z, hx: 1.45, hz: 1.25 })));

export const STORE_ALBUM_POSITIONS = [
  ...[-8.4, -4.2, 0, 4.2, 8.4].map((x) => ({ x, z: -13.35, yaw: 0 })),
  ...[-9.3, -5.1, -0.9, 3.3].map((z) => ({ x: -10.72, z, yaw: Math.PI / 2 })),
  ...[-9.3, -5.1, -0.9, 3.3].map((z) => ({ x: 10.72, z, yaw: -Math.PI / 2 }))
];

export const STORE_OBSTACLES = [
  ...STORE_BIN_POSITIONS,
  { x: -8.2, z: -2.8, hx: 0.9, hz: 1.5 },
  { x: 8.2, z: -2.8, hx: 0.9, hz: 1.5 },
  { ...STORE_LAYOUT.counter, hx: 1.7, hz: 0.81 },
  { ...STORE_LAYOUT.cdRack, hx: 0.68, hz: 1.32 },
  { ...STORE_LAYOUT.jukebox, hx: 1.05, hz: 1.4 },
  { ...STORE_LAYOUT.coinTable, hx: 0.71, hz: 0.46 },
  ...STORE_NPCS.filter(({ id }) => !["roxy", "freddy", "jason"].includes(id)).map(({ x, z }) => ({ x, z, hx: 0.44, hz: 0.44 }))
];
