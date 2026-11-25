import { BUENOS_AIRES_PEDESTRIAN_ROUTES, canStandInBuenosAires } from "./buenosAiresLayout.js";

// Hard caps, including the unique Desconectada when she is nearby. Existing
// adaptive graphics sampling can lower these budgets without a scene reload.
export const CITY_POPULATION_PROFILES = Object.freeze({
  high: { near: 14, middle: 22, far: 28, nearRadius: 28, middleRadius: 68, farRadius: 125, middleHz: 8, farHz: 2 },
  medium: { near: 10, middle: 16, far: 22, nearRadius: 23, middleRadius: 57, farRadius: 105, middleHz: 6, farHz: 1.5 },
  low: { near: 6, maxNearTriangles: 130_000, middle: 10, far: 14, nearRadius: 18, middleRadius: 47, farRadius: 85, middleHz: 5, farHz: 1 },
});
export const populationProfile = tier => CITY_POPULATION_PROFILES[tier] || CITY_POPULATION_PROFILES.high;

export const CITY_CITIZENS = [
  { id: "ba-man-1", type: "man", route: 5, offset: 0, speed: .35, low: true, label: "Transeúnte con celular" },
  { id: "ba-woman-1", type: "woman", route: 5, offset: .77, speed: .78, low: true, label: "Transeúnte con celular" },
  { id: "ba-executive-1", type: "executive", route: 5, offset: .18, speed: .95, low: true, label: "Ejecutivo" },
  { id: "ba-elder-1", type: "elder", route: 3, offset: .23, speed: .59, low: true, label: "Señora con celular" },
  { id: "ba-man-2", type: "man", route: 4, offset: .12, speed: .84, low: true, label: "Transeúnte con celular" },
  { id: "ba-woman-2", type: "woman", route: 0, offset: .46, speed: .7, low: true, label: "Transeúnte con celular" },
  { id: "ba-man-3", type: "man", route: 1, offset: .48, speed: .79, label: "Transeúnte con celular" },
  { id: "ba-woman-3", type: "woman", route: 4, offset: .63, speed: .75, label: "Transeúnte con celular" },
  { id: "ba-executive-2", type: "executive", route: 3, offset: .69, speed: .98, label: "Ejecutivo" },
  { id: "ba-elder-2", type: "elder", route: 2, offset: .7, speed: .56, label: "Señora con celular" },
  { id: "ba-disconnected", type: "disconnected", x: -36, z: -21, low: true, label: "La Desconectada" },
];

export const CITY_WALK_ROUTES = BUENOS_AIRES_PEDESTRIAN_ROUTES.map(route => {
  const segments = route.points.map((from, i) => {
    const to = route.points[(i + 1) % route.points.length];
    return { from, to, length: Math.hypot(to[0] - from[0], to[1] - from[1]) };
  });
  return { id: route.id, segments, length: segments.reduce((n, s) => n + s.length, 0) };
});
export function sampleCityRoute(routeIndex, distance, direction = 1, lane = 0, out = {}) {
  const route = CITY_WALK_ROUTES[routeIndex];
  let d = ((distance % route.length) + route.length) % route.length;
  for (let i = 0; i < route.segments.length; i++) {
    const part = route.segments[i];
    if (d <= part.length || i === route.segments.length - 1) {
      const dx = (part.to[0] - part.from[0]) / part.length, dz = (part.to[1] - part.from[1]) / part.length;
      out.x = part.from[0] + dx * d + dz * lane;
      out.z = part.from[1] + dz * d - dx * lane;
      out.yaw = Math.atan2(dx * direction, dz * direction); out.segment = i;
      return out;
    }
    d -= part.length;
  }
}
export function canCitizenStand(x, z) {
  if (!canStandInBuenosAires(x, z)) return false;
  for (const side of [-1, 1]) {
    for (const lampZ of [-66, -46, -16, 8, 34, 62])
      if (Math.hypot(x - side * 32.4, z - lampZ) < .65) return false;
    for (const lightZ of [-28, 23])
      if (Math.hypot(x - side * 31, z - lightZ) < .65) return false;
  }
  return true;
}
// No appearance/respawn in a traffic lane. Only movement may enter crossings.
export function isCitizenSpawnSafe(x, z) {
  return canCitizenStand(x, z) && !(z > -41.3 && z < -26.8) &&
    (Math.abs(x) >= 31.5 || (Math.abs(x) <= 15.8 && z > -22 && z < 48));
}
export function crossingIsRed(x, z, nextX, nextZ, time) {
  const red = time % 20 < 12;
  const enteringAvenue = Math.abs(x) >= 31.5 && Math.abs(nextX) < 31.5 && z >= -27 && z <= -23;
  const enteringCorrientes = Math.abs(x) >= 37.5 && Math.abs(x) <= 42.5 &&
    (z >= -26.5 && nextZ < -26.5 || z <= -41.5 && nextZ > -41.5);
  return red && (enteringAvenue || enteringCorrientes);
}
export function createCityPopulation() {
  const configs = CITY_CITIZENS.map((config, i) => ({ ...config, index: i, direction: 1, lane: 0, ambient: false }));
  // Existing citizens keep their IDs; unsafe legacy starting offsets move along
  // the same route to a pavement, without changing their logical identity.
  for (const config of configs.filter(c => !c.ambient && c.route != null)) {
    let p = sampleCityRoute(config.route, CITY_WALK_ROUTES[config.route].length * config.offset);
    for (let i = 0; i < 200 && !isCitizenSpawnSafe(p.x, p.z); i++) {
      config.offset = (config.offset + .013) % 1;
      p = sampleCityRoute(config.route, CITY_WALK_ROUTES[config.route].length * config.offset);
    }
  }
  const positions = configs.map(config => config.route == null ? config :
    sampleCityRoute(config.route, CITY_WALK_ROUTES[config.route].length * config.offset));
  const routeWeights = [5, 0, 1, 5, 2, 3, 5, 0, 1, 4];
  const types = ["man", "woman", "executive", "elder", "fatman", "oldman", "parrotman"];
  for (let n = 0; n < 53; n++) {
    const route = routeWeights[n % routeWeights.length], length = CITY_WALK_ROUTES[route].length;
    let offset = (n * .61803398875 + .09) % 1;
    const lane = ((n % 3) - 1) * .32;
    let p;
    for (let attempt = 0; attempt < 500; attempt++) {
      p = sampleCityRoute(route, offset * length, 1, lane);
      if (isCitizenSpawnSafe(p.x, p.z) && positions.every(other => Math.hypot(other.x - p.x, other.z - p.z) > 1.3)) break;
      offset = (offset + .037) % 1;
    }
    if (!p || !isCitizenSpawnSafe(p.x, p.z)) throw new Error("Unsafe city population spawn");
    const type = types[(n * 3 + Math.floor(n / 7)) % types.length];
    configs.push({ id: "ba-crowd-" + n, index: configs.length, type, route, offset, lane,
      direction: n % 2 ? -1 : 1, speed: (type === "elder" || type === "oldman" || type === "parrotman" ? .48 : type === "fatman" ? .58 : .68) + (n % 7) * .065,
      ambient: true, behavior: n % 4 === 0 ? "advert" : "phone" });
    positions.push(p);
  }
  return configs;
}
