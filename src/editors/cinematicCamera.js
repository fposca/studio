import * as THREE from "three";

export const CINEMATIC_SHOTS = [
  { id: "extreme-wide", name: "Extreme Wide", crop: 0, fill: 0.23, lens: 21, lookAt: "center" },
  { id: "wide", name: "Wide", crop: 0, fill: 0.56, lens: 28, lookAt: "center" },
  { id: "full", name: "Full", crop: 0, fill: 0.86, lens: 40, lookAt: "center" },
  { id: "cowboy", name: "Cowboy", crop: 0.22, fill: 0.83, lens: 40, lookAt: "chest" },
  { id: "medium", name: "Medium", crop: 0.46, fill: 0.82, lens: 50, lookAt: "chest" },
  { id: "medium-close", name: "Medium Close-Up", crop: 0.6, fill: 0.81, lens: 60, lookAt: "head" },
  { id: "close", name: "Close-Up", crop: 0.73, fill: 0.81, lens: 85, lookAt: "head", faceWidth: 0.36 },
  { id: "extreme-close", name: "Extreme Close-Up", crop: 0.84, fill: 0.88, lens: 100, lookAt: "head", faceWidth: 0.25 },
  { id: "detail", name: "Detail", crop: 0.87, fill: 0.89, lens: 100, lookAt: "head", faceWidth: 0.18 },
  { id: "ots", name: "OTS", crop: 0.55, fill: 0.78, lens: 70, lookAt: "head" },
  { id: "pov", name: "POV", crop: 0, fill: 0.8, lens: 35, lookAt: "head" },
  { id: "two", name: "Two Shot", crop: 0, fill: 0.7, lens: 50, lookAt: "center" }
];

export const CINEMATIC_ANGLES = [
  { id: "eye", name: "Eye Level", azimuth: 0, elevation: 0, roll: 0 },
  { id: "low", name: "Low Angle", azimuth: 0, elevation: -13, roll: 0 },
  { id: "high", name: "High Angle", azimuth: 0, elevation: 24, roll: 0 },
  { id: "top", name: "Top", azimuth: 0, elevation: 83, roll: 0 },
  { id: "worm", name: "Worm's Eye", azimuth: 0, elevation: -32, roll: 0 },
  { id: "dutch", name: "Dutch", azimuth: 12, elevation: 0, roll: 15 },
  { id: "profile", name: "Profile", azimuth: 90, elevation: 0, roll: 0 },
  { id: "three-front", name: "3/4 Front", azimuth: 38, elevation: 0, roll: 0 },
  { id: "three-back", name: "3/4 Back", azimuth: 142, elevation: 0, roll: 0 },
  { id: "back", name: "Back", azimuth: 180, elevation: 0, roll: 0 }
];

export const CINEMATIC_PRESETS = [
  { id: "hero", name: "Hero", shot: "cowboy", angle: "low", lens: 35, lookAt: "chest", azimuth: -22, composition: 0.08 },
  { id: "epic-hero", name: "Epic Hero", shot: "wide", angle: "low", lens: 26, lookAt: "chest", elevation: -18 },
  { id: "villain", name: "Villain", shot: "medium-close", angle: "low", lens: 60, lookAt: "head", elevation: -6, roll: -5 },
  { id: "dialogue", name: "Dialogue", shot: "medium-close", angle: "eye", lens: 75, lookAt: "head", azimuth: 24 },
  { id: "epic-environment", name: "Epic Environment", shot: "extreme-wide", angle: "eye", lens: 21, lookAt: "center" },
  { id: "intimate", name: "Intimate Close-Up", shot: "close", angle: "eye", lens: 85, lookAt: "head" },
  { id: "battle", name: "Battle", shot: "wide", angle: "low", lens: 28, lookAt: "center", azimuth: 20, elevation: -8, composition: 0.16 },
  { id: "horror", name: "Horror", shot: "medium", angle: "dutch", lens: 28, lookAt: "chest", roll: 16, distance: 0.82 },
  { id: "back-reveal", name: "Back Reveal", shot: "wide", angle: "back", lens: 28, lookAt: "chest", elevation: -5 },
  { id: "face-off", name: "Face Off", shot: "two", angle: "profile", lens: 50, lookAt: "center", faceOff: true }
];

export const DEFAULT_CINEMATIC_CAMERA = {
  shot: "full", angle: "eye", lens: 40, height: 0, distance: 1, azimuth: 0,
  lookAt: "center", transition: "smooth", duration: 0.8, composition: 0,
  roll: 0, elevation: 0, faceOff: false, preset: ""
};

const UP = new THREE.Vector3(0, 1, 0);

function rigPoint(object, names) {
  for (const name of names) {
    let match = null;
    object.traverse((child) => {
      const normalized = String(child.name || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
      if (!match && child.isBone && normalized.endsWith(name)) match = child;
    });
    if (match) return match.getWorldPosition(new THREE.Vector3());
  }
  return null;
}

function subjectData(object) {
  object.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(object);
  if (bounds.isEmpty()) return null;
  const size = bounds.getSize(new THREE.Vector3());
  if (![size.x, size.y, size.z].every(Number.isFinite)) return null;
  const front = new THREE.Vector3(0, 0, 1).transformDirection(object.matrixWorld);
  front.y = 0;
  if (front.lengthSq() < 0.0001) front.set(0, 0, 1);
  return { object, bounds, size, center: bounds.getCenter(new THREE.Vector3()), front: front.normalize() };
}

function lookAtPoint(subject, part) {
  const { object, bounds, size, center } = subject;
  if (part === "center") return center.clone();
  if (part === "feet") return new THREE.Vector3(center.x, bounds.min.y + size.y * 0.06, center.z);
  const names = part === "head" ? ["head", "neck"] : ["upperchest", "chest", "spine2", "spine1", "spine"];
  const bone = rigPoint(object, names);
  if (bone) return bone;
  return new THREE.Vector3(center.x, bounds.min.y + size.y * (part === "head" ? 0.88 : 0.67), center.z);
}

function makePose(position, target, fov, roll, bounds) {
  const viewDirection = target.clone().sub(position).normalize();
  const up = UP.clone().applyAxisAngle(viewDirection, THREE.MathUtils.degToRad(roll));
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().lookAt(position, target, up)
  );
  const nearest = bounds ? Math.max(bounds.distanceToPoint(position), 0.001) : position.distanceTo(target);
  return {
    position, target, up, quaternion, fov,
    near: Math.max(0.001, Math.min(0.05, nearest * 0.12))
  };
}

export function fovForLens(lens, aspect, filmGauge = 35) {
  const filmHeight = filmGauge / Math.max(aspect, 1);
  return THREE.MathUtils.radToDeg(2 * Math.atan(filmHeight / (2 * Math.max(lens, 1))));
}

function framingBounds(subject, shot) {
  const box = subject.bounds.clone();
  box.min.y = THREE.MathUtils.lerp(box.min.y, box.max.y, shot.crop);
  if (shot.faceWidth) {
    const head = lookAtPoint(subject, "head");
    head.clamp(subject.bounds.min, subject.bounds.max);
    const halfWidth = Math.min(subject.size.x * 0.5, subject.size.y * shot.faceWidth * 0.5);
    const halfDepth = Math.min(subject.size.z * 0.5, subject.size.y * shot.faceWidth * 0.5);
    box.min.x = Math.max(box.min.x, head.x - halfWidth);
    box.max.x = Math.min(box.max.x, head.x + halfWidth);
    box.min.z = Math.max(box.min.z, head.z - halfDepth);
    box.max.z = Math.min(box.max.z, head.z + halfDepth);
  }
  return box;
}

function distanceForFrame(box, target, direction, fov, aspect, fill, roll) {
  const right = UP.clone().cross(direction).normalize()
    .applyAxisAngle(direction, THREE.MathUtils.degToRad(roll));
  const screenUp = direction.clone().cross(right).normalize();
  const tanVertical = Math.tan(THREE.MathUtils.degToRad(fov) / 2);
  const tanHorizontal = tanVertical * Math.max(aspect, 0.1);
  let distance = 0;
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        const relative = new THREE.Vector3(x, y, z).sub(target);
        const depth = relative.dot(direction);
        const vertical = Math.abs(relative.dot(screenUp)) / (tanVertical * fill);
        const horizontal = Math.abs(relative.dot(right)) / (tanHorizontal * fill);
        distance = Math.max(distance, depth + Math.max(vertical, horizontal));
      }
    }
  }
  const span = box.getSize(new THREE.Vector3()).length();
  return Math.max(distance, span * 0.12, 0.005);
}

function distanceOutsideBounds(box, target, direction) {
  let frontDepth = 0;
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        frontDepth = Math.max(frontDepth, new THREE.Vector3(x, y, z).sub(target).dot(direction));
      }
    }
  }
  return frontDepth + Math.max(box.getSize(new THREE.Vector3()).length() * 0.01, 0.005);
}

function overShoulderPose(subjects, settings, fov) {
  const foreground = subjects[0];
  const background = subjects[1];
  const height = Math.max(foreground.size.y, 0.01);
  const eye = lookAtPoint(foreground, "head");
  const direction = background
    ? lookAtPoint(background, settings.lookAt).sub(eye).normalize()
    : foreground.front.clone();
  if (direction.lengthSq() < 0.0001) direction.copy(foreground.front);
  const side = direction.clone().cross(UP).normalize();
  const target = background
    ? lookAtPoint(background, settings.lookAt)
    : eye.clone().addScaledVector(direction, height * 3);
  const position = eye.clone()
    .addScaledVector(direction, -height * 0.65 * settings.distance)
    .addScaledVector(side, height * 0.3)
    .addScaledVector(UP, height * (settings.height - 0.12));
  const bounds = background ? foreground.bounds.clone().union(background.bounds) : foreground.bounds;
  return makePose(position, target, fov, settings.roll || 0, bounds);
}

function pointOfViewPose(subject, settings, fov) {
  const height = Math.max(subject.size.y, 0.01);
  const eye = lookAtPoint(subject, "head");
  const direction = subject.front.clone()
    .applyAxisAngle(UP, THREE.MathUtils.degToRad(settings.azimuth || 0));
  const position = eye.clone()
    .addScaledVector(direction, height * 0.12)
    .addScaledVector(UP, settings.height * height);
  const target = position.clone().addScaledVector(direction, height * 3 * settings.distance);
  return makePose(position, target, fov, settings.roll || 0, subject.bounds);
}

export function frameCinematicSubjects(objects, camera, settings) {
  const subjects = objects.map(subjectData).filter(Boolean);
  if (!subjects.length) return null;
  const shot = CINEMATIC_SHOTS.find((entry) => entry.id === settings.shot) || CINEMATIC_SHOTS[2];
  const angle = CINEMATIC_ANGLES.find((entry) => entry.id === settings.angle) || CINEMATIC_ANGLES[0];
  const fov = fovForLens(settings.lens, camera.aspect, camera.filmGauge);
  if (shot.id === "ots") return overShoulderPose(subjects, settings, fov);
  if (shot.id === "pov") return pointOfViewPose(subjects[0], settings, fov);

  const twoSubjects = subjects.length > 1 && (shot.id === "two" || settings.faceOff);
  const bounds = twoSubjects
    ? subjects[0].bounds.clone().union(subjects[1].bounds)
    : subjects[0].bounds.clone();
  const frame = twoSubjects ? bounds.clone() : framingBounds(subjects[0], shot);
  const target = twoSubjects
    ? bounds.getCenter(new THREE.Vector3())
    : lookAtPoint(subjects[0], settings.lookAt || shot.lookAt);
  const subjectHeight = Math.max(bounds.getSize(new THREE.Vector3()).y, 0.01);
  const front = subjects[0].front.clone();
  if (settings.faceOff && twoSubjects) {
    front.copy(subjects[1].center).sub(subjects[0].center).cross(UP);
    if (front.lengthSq() < 0.0001) front.copy(subjects[0].front);
    front.normalize();
  } else if (twoSubjects) {
    front.add(subjects[1].front);
    if (front.lengthSq() < 0.0001) front.copy(subjects[0].front);
    front.normalize();
  }
  const azimuth = settings.faceOff && twoSubjects ? 0 : settings.azimuth ?? angle.azimuth;
  const elevation = settings.elevation ?? angle.elevation;
  const roll = settings.roll ?? angle.roll;
  const horizontal = front.applyAxisAngle(UP, THREE.MathUtils.degToRad(azimuth));
  let direction = horizontal.clone().multiplyScalar(Math.cos(THREE.MathUtils.degToRad(elevation)))
    .addScaledVector(UP, Math.sin(THREE.MathUtils.degToRad(elevation))).normalize();

  if (settings.composition) {
    const right = UP.clone().cross(direction).normalize();
    target.addScaledVector(right, subjectHeight * settings.composition);
  }
  let distance = distanceForFrame(frame, target, direction, fov, camera.aspect, shot.fill, roll);
  if (settings.height) {
    direction = direction.multiplyScalar(distance)
      .addScaledVector(UP, subjectHeight * settings.height).normalize();
    distance = distanceForFrame(frame, target, direction, fov, camera.aspect, shot.fill, roll);
  }
  distance = Math.max(distance * (settings.distance || 1), distanceOutsideBounds(bounds, target, direction));
  const position = target.clone().addScaledVector(direction, distance);
  if (elevation < -5 || settings.height < 0) {
    position.y = Math.max(position.y, bounds.min.y + subjectHeight * 0.03);
  }
  return makePose(position, target, fov, roll, bounds);
}
