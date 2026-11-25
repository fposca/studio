import { sampleCityRoute, canCitizenStand, crossingIsRed } from "./buenosAiresPopulation.js";

const GAP = 1.3;
const CORRIDOR_RADIUS = 2.15;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const routePoint = {}, nextPoint = {}, sidePoint = {};

// Collision tests include the whole movement segment. An existing contact may
// separate, but never get deeper; otherwise a newly activated LOD can deadlock.
function clearsCircle(from, x, z, centre, radius) {
  const dx = x - from.x, dz = z - from.z;
  const ox = from.x - centre.x, oz = from.z - centre.z;
  const start = ox * ox + oz * oz, end = (x - centre.x) ** 2 + (z - centre.z) ** 2;
  if (start < radius * radius - 1e-7) return end > start + 1e-8 && ox * dx + oz * dz >= -1e-8;
  const t = clamp(-(ox * dx + oz * dz) / Math.max(1e-12, dx * dx + dz * dz), 0, 1);
  return (ox + dx * t) ** 2 + (oz + dz * t) ** 2 >= radius * radius - 1e-7;
}

export function canMoveCitizen(actor, x, z, actors, player, canAvoid = () => true) {
  const from = actor.root.position;
  if (!canCitizenStand(x, z) || !canAvoid(x, z, from.x, from.z) ||
      !clearsCircle(from, x, z, player, actor.colliderRadius)) return false;
  return !actors.some(other => other !== actor && other.lod !== "off" &&
    !clearsCircle(from, x, z, other.root.position, GAP));
}

// Called at the existing LOD-dependent AI cadence, not from a new render loop.
// Keep a passing side for the whole encounter instead of selecting a new lane
// every tick. Lane signs are route-relative, so opposite directions keep right.
export function planCitizenStep(actor, actors, player, dt, time, canAvoid = () => true) {
  const { config, root } = actor;
  if (config.route == null) return;
  sampleCityRoute(config.route, actor.distance, config.direction, 0, routePoint);
  const fx = Math.sin(routePoint.yaw), fz = Math.cos(routePoint.yaw);
  const rx = fz, rz = -fx;
  let passing = 0, passingSide = 1, closest = Infinity, speed = config.speed, yieldToCrossing = false;
  const look = 3.8;
  for (const other of actors) {
    if (other === actor || other.lod === "off") continue;
    const dx = other.root.position.x - root.position.x, dz = other.root.position.z - root.position.z;
    if (dx * dx + dz * dz > look * look) continue;
    const ahead = dx * fx + dz * fz, side = dx * rx + dz * rz;
    const stopped = other.config.route == null || other.pause > 0 || other.synchronized;
    const heading = other.routeYaw ?? other.yaw;
    const alignment = fx * Math.sin(heading) + fz * Math.cos(heading);
    if (ahead > -.2 && Math.abs(side) < 1.55) {
      if (ahead < closest && (stopped || alignment < .65)) {
        closest = ahead; passingSide = Math.abs(side) > .25 ? -Math.sign(side) : 1;
      }
      if (stopped) passing = Math.max(passing, 1.6);
      else if (alignment < -.35) passing = Math.max(passing, .95);
      else if (alignment > .65 && ahead > 0) {
        // Match a slower walker rather than repeatedly bumping into their back.
        speed = Math.min(speed, Math.max(0, other.config.speed + (ahead - 1.65) * .8));
        if (other.waiting && ahead < 2.6) passing = Math.max(passing, 1.6);
      } else if (actor.config.index > other.config.index) {
        const vx = Math.sin(heading) * other.config.speed - fx * config.speed;
        const vz = Math.cos(heading) * other.config.speed - fz * config.speed;
        const t = clamp(-(dx * vx + dz * vz) / Math.max(.001, vx * vx + vz * vz), 0, 2);
        if (t > .1 && Math.hypot(dx + vx * t, dz + vz * t) < 1.65) yieldToCrossing = true;
      }
    }
  }
  const px = player.x - root.position.x, pz = player.z - root.position.z;
  if (px * fx + pz * fz > -.2 && px * fx + pz * fz < look && Math.abs(px * rx + pz * rz) < 1.65)
    passing = Math.max(passing, 1.7);

  // A crossing yields briefly, then commits to a side instead of renewing an
  // indefinite mutual wait against a citizen whose path is also obstructed.
  if (yieldToCrossing) {
    actor.yieldStarted ??= time;
    if (time - actor.yieldStarted > .8) { yieldToCrossing = false; passing = Math.max(passing, 1.6); }
  } else actor.yieldStarted = null;
  const probeDistance = actor.distance + config.direction * .8;
  const safeLane = lane => {
    for (const distance of [actor.distance, probeDistance]) {
      sampleCityRoute(config.route, distance, config.direction, lane, sidePoint);
      if (!canCitizenStand(sidePoint.x, sidePoint.z) || !canAvoid(sidePoint.x, sidePoint.z) ||
          Math.hypot(sidePoint.x - player.x, sidePoint.z - player.z) < actor.colliderRadius + .1) return false;
    }
    return true;
  };
  if (passing) {
    const side = actor.passUntil > time && actor.blocked < .8 ? Math.sign(actor.passLane * config.direction) : passingSide;
    let lane = side * Math.max(passing, actor.passUntil > time ? Math.abs(actor.passLane) : 0) * config.direction;
    if (!safeLane(lane) && safeLane(-lane)) lane *= -1;
    if (safeLane(lane)) {
      actor.passLane = lane; actor.passUntil = time + 1.8;
    }
  }
  let desiredLane = actor.passUntil > time ? actor.passLane : config.lane;
  if (!safeLane(desiredLane)) desiredLane = config.lane;
  const lane = (actor.lane ?? config.lane) + clamp(desiredLane - (actor.lane ?? config.lane), -dt * .85, dt * .85);
  // Route progress cannot run away while the body is yielding or sidestepping.
  const lead = (routePoint.x - root.position.x) * fx + (routePoint.z - root.position.z) * fz;
  const advance = yieldToCrossing ? 0 : Math.max(0, -lead) + Math.min(dt * speed, Math.max(0, .22 + dt * speed - Math.max(0, lead)));
  const next = actor.distance + advance * config.direction;
  sampleCityRoute(config.route, next, config.direction, lane, nextPoint);
  actor.routeYaw = routePoint.yaw;
  actor.trafficWait = crossingIsRed(root.position.x, root.position.z, nextPoint.x, nextPoint.z, time);
  if (actor.trafficWait) {
    actor.target.x = root.position.x; actor.target.z = root.position.z;
    return;
  }
  if (!canCitizenStand(nextPoint.x, nextPoint.z) || !canAvoid(nextPoint.x, nextPoint.z)) {
    // Move back toward the centre of the pavement before rounding a solid
    // corner. Testing only the forward sample would pin a passing lane to it.
    sampleCityRoute(config.route, actor.distance, config.direction, lane, nextPoint);
    if (!canCitizenStand(nextPoint.x, nextPoint.z) || !canAvoid(nextPoint.x, nextPoint.z)) return;
  } else actor.distance = next;
  actor.lane = lane;
  actor.target.x = nextPoint.x; actor.target.z = nextPoint.z;
  if (nextPoint.segment !== actor.segment && (nextPoint.segment + config.index) % 4 === 0) {
    actor.pause = config.behavior === "advert" ? 4 + config.index % 5 : 1.2 + config.index % 3;
    if (config.behavior === "advert" && Math.abs(nextPoint.x) > 30)
      actor.yaw = nextPoint.x < 0 ? -Math.PI / 2 : Math.PI / 2;
  }
  actor.segment = nextPoint.segment;
}

export function moveCitizen(actor, actors, player, dt, time, canAvoid = () => true) {
  if (dt <= 0) return 0;
  const from = actor.root.position;
  let dx = actor.target.x - from.x, dz = actor.target.z - from.z;
  const length = Math.hypot(dx, dz), maxStep = actor.config.speed * 1.15 * dt;
  const factor = Math.min(1 - Math.exp(-10 * dt), maxStep / Math.max(length, 1e-9));
  dx *= factor; dz *= factor;
  const safe = (x, z) => !crossingIsRed(from.x, from.z, x, z, time) &&
    canMoveCitizen(actor, x, z, actors, player, canAvoid);
  let moved = false;
  if (actor.steerUntil > time) {
    sampleCityRoute(actor.config.route, actor.distance, actor.config.direction, 0, routePoint);
    const sx = actor.steerX * maxStep * .65, sz = actor.steerZ * maxStep * .65;
    if (Math.hypot(from.x + sx - routePoint.x, from.z + sz - routePoint.z) <= CORRIDOR_RADIUS &&
        safe(from.x + sx, from.z + sz)) { dx = sx; dz = sz; moved = true; }
    else actor.steerUntil = 0;
  }
  if (!moved && length > 1e-5 && safe(from.x + dx, from.z + dz)) moved = true;
  if (!moved && !actor.trafficWait && actor.config.route != null && length > .03) {
    // If already touching, leave the contact smoothly. Otherwise continue the
    // chosen sidestep while waiting for enough room to move forward.
    let awayX = 0, awayZ = 0;
    for (const other of actors) {
      if (other === actor || other.lod === "off") continue;
      const ox = from.x - other.root.position.x, oz = from.z - other.root.position.z, d = Math.hypot(ox, oz);
      if (d > 1e-5 && d < GAP - .001) { awayX += ox / d; awayZ += oz / d; }
    }
    const side = Math.sign((actor.passLane ?? actor.config.direction) * actor.config.direction) || 1;
    const yaw = actor.routeYaw ?? actor.yaw;
    const choices = [[awayX, awayZ]];
    // Slide along the boundary of a blocking body instead of bouncing back
    // from it. This also lets walkers finish going around a stationary player.
    const slidePast = (centre, radius) => {
      const ox = from.x - centre.x, oz = from.z - centre.z, d = Math.hypot(ox, oz);
      if (d < 1e-5 || d > radius + .2) return;
      const nx = ox / d, nz = oz / d, inward = dx * nx + dz * nz;
      if (inward < 0) choices.push([dx - inward * nx, dz - inward * nz]);
    };
    slidePast(player, actor.colliderRadius);
    for (const other of actors) if (other !== actor && other.lod !== "off") slidePast(other.root.position, GAP);
    choices.push([Math.cos(yaw) * side, -Math.sin(yaw) * side]);
    if (actor.blocked > .6) choices.push([-Math.cos(yaw) * side, Math.sin(yaw) * side]);
    for (const [vx, vz] of choices) {
      const d = Math.hypot(vx, vz);
      if (d < 1e-5) continue;
      // Never alternate between forward and backward steps at a boundary.
      // Only an existing overlap is allowed to retreat to separate safely.
      if (awayX === 0 && awayZ === 0 && vx * Math.sin(yaw) + vz * Math.cos(yaw) < -1e-5) continue;
      const sx = vx / d * maxStep * .65, sz = vz / d * maxStep * .65;
      // Stay inside the route corridor; a dense group must not push walkers
      // indefinitely sideways into the avenue.
      sampleCityRoute(actor.config.route, actor.distance, actor.config.direction, 0, routePoint);
      if (Math.hypot(from.x + sx - routePoint.x, from.z + sz - routePoint.z) > CORRIDOR_RADIUS) continue;
      if (safe(from.x + sx, from.z + sz)) {
        dx = sx; dz = sz; moved = true;
        actor.steerX = vx / d; actor.steerZ = vz / d; actor.steerUntil = time + .45;
        break;
      }
    }
    if (!moved && actor.blocked > 1.2) {
      // A lower-priority walker gives a crowded corner room with one committed
      // retreat. Do not flip the route or alternate forward/back every frame.
      const priority = actors.some(other => other !== actor && other.lod !== "off" &&
        other.config.index < actor.config.index &&
        Math.hypot(other.root.position.x - from.x, other.root.position.z - from.z) < 2.2);
      if (priority) for (const angle of [Math.PI / 2, -Math.PI / 2, Math.PI * .75, -Math.PI * .75, Math.PI]) {
        const vx = Math.sin(yaw + angle), vz = Math.cos(yaw + angle);
        const x = from.x + vx * maxStep * .65, z = from.z + vz * maxStep * .65;
        sampleCityRoute(actor.config.route, actor.distance, actor.config.direction, 0, routePoint);
        if (Math.hypot(x - routePoint.x, z - routePoint.z) > CORRIDOR_RADIUS || !safe(x, z)) continue;
        dx = x - from.x; dz = z - from.z; moved = true;
        actor.steerX = vx; actor.steerZ = vz; actor.steerUntil = time + 1.1;
        break;
      }
    }
  }
  const distance = moved ? Math.hypot(dx, dz) : 0;
  if (moved) { from.x += dx; from.z += dz; }
  actor.blocked = distance < dt * .025 ? actor.blocked + dt : 0;
  actor.waiting = actor.blocked > .25;
  actor.motionSpeed = (actor.motionSpeed ?? actor.config.speed) +
    (distance / dt - (actor.motionSpeed ?? actor.config.speed)) * (1 - Math.exp(-5 * dt));
  if (distance > dt * .025) actor.yaw = Math.atan2(dx, dz);
  return distance;
}
