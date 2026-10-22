import * as THREE from "three";

export const CONCERT_SHOTS = [
  { id: "wide", label: "General de la banda", duration: 2, movementDuration: 8, target: "band", from: [0, 1.7, 7.9], to: [0.7, 1.5, 6.8], fov: [62, 57] },
  { id: "neonboy", label: "NeonBoy / acercamiento", duration: 2, movementDuration: 7, target: "neonboy", from: [1.3, 0.45, 3], to: [0.65, 0.2, 2.15], fov: [48, 42] },
  { id: "guitar", label: "Detalle de guitarra", duration: 2, movementDuration: 5, target: "neonboy-guitar", from: [-0.8, 0.3, 1.9], to: [0.3, 0.2, 1.6], fov: [43, 37] },
  { id: "john", label: "John Zool", duration: 2, movementDuration: 6, target: "john-zool", from: [-1.1, 0.45, 2.8], to: [-0.5, 0.15, 2.5], fov: [48, 43] },
  { id: "drums", label: "Luján / batería", duration: 2, movementDuration: 7, target: "lujan", from: [-1.9, 1.15, 1.1], to: [-1.65, 0.8, 0.65], fov: [53, 48] },
  { id: "audience", label: "Público", duration: 2, movementDuration: 7, target: "audience", from: [6, 1.4, -5.4], to: [4.2, 1.1, -5], fov: [63, 56] },
  { id: "bass", label: "Revenant / bajo", duration: 2, movementDuration: 6, target: "revenant", from: [1.4, 0.5, 2.8], to: [0.5, 0.25, 2.3], fov: [49, 43] },
  { id: "orbit", label: "Vuelta 360", duration: 2, movementDuration: 19, target: "band", fov: [65, 65] },
  { id: "friends", label: "Amigos del club", duration: 2, movementDuration: 6, target: "friends", from: [2.8, 0.9, -3.9], to: [1.4, 0.7, -3.4], fov: [56, 49] },
  { id: "high", label: "General elevado", duration: 2, movementDuration: 8, target: "band", from: [-3.2, 2.7, 6], to: [-0.6, 2.6, 6.4], fov: [65, 60] },
];
export const CONCERT_SEQUENCE_DURATION = CONCERT_SHOTS.reduce((sum, shot) => sum + shot.duration, 0);
export function concertShotAt(seconds, mode = "auto") {
  if (mode !== "auto") {
    const shot = CONCERT_SHOTS.find((entry) => entry.id === mode) || CONCERT_SHOTS[0];
    return { shot, progress: (Math.max(0, seconds) % shot.movementDuration) / shot.movementDuration };
  }
  let time = Math.max(0, seconds) % CONCERT_SEQUENCE_DURATION;
  for (const shot of CONCERT_SHOTS) {
    if (time < shot.duration) return { shot, progress: time / shot.duration };
    time -= shot.duration;
  }
  return { shot: CONCERT_SHOTS[0], progress: 0 };
}

export function createConcertCamera(camera, getTarget, reducedMotion = false) {
  let elapsed = 0, orbitElapsed = 0, previousMode = "auto", previousShot = null;
  const focus = new THREE.Vector3(), offset = new THREE.Vector3(), endOffset = new THREE.Vector3(), smoothedFocus = new THREE.Vector3();
  function update(dt, mode = "auto", editor = null) {
    if (mode !== previousMode) { elapsed = 0; previousMode = mode; }
    if (!editor?.open) elapsed += dt;
    let id, fov;
    if (editor?.open) {
      id = "editor";
      getTarget(editor.poseEditing ? "pose:" + editor.poseActor + ":" + editor.poseBone
        : editor.selected === "lujan" ? "lujan" : `${editor.selected}-guitar`, focus);
      const angle = THREE.MathUtils.degToRad(editor.angle || 0), distance = editor.distance || 2.7;
      offset.set(Math.sin(angle) * distance, distance * 0.22, Math.cos(angle) * distance);
      fov = 48;
    } else {
      const { shot, progress } = concertShotAt(elapsed, reducedMotion && mode === "auto" ? "wide" : mode);
      id = shot.id;
      const t = reducedMotion ? 0.5 : progress * progress * (3 - 2 * progress);
      getTarget(shot.target, focus);
      if (shot.id === "orbit") {
        // Accumulate only visible orbit time: a two-second cut must not spin 360 degrees.
        if (!reducedMotion) orbitElapsed += dt;
        const angle = (reducedMotion ? 0.15 : orbitElapsed / shot.movementDuration) * Math.PI * 2;
        offset.set(Math.sin(angle) * 6.3, 1.8 + Math.sin(angle) * 0.4, Math.cos(angle) * 2.75);
      } else offset.fromArray(shot.from).lerp(endOffset.fromArray(shot.to), t);
      fov = THREE.MathUtils.lerp(...shot.fov, t);
    }
    if (editor?.open || previousShot !== id) smoothedFocus.copy(focus);
    else smoothedFocus.lerp(focus, 1 - Math.exp(-dt * 5));
    previousShot = id;
    camera.position.copy(smoothedFocus).add(offset);
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -9.3, 9.3);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, 0.85, 4.85);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -18.2, 8.4);
    camera.lookAt(smoothedFocus);
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    return id;
  }
  return { update, reset() { elapsed = 0; orbitElapsed = 0; previousMode = "auto"; previousShot = null; } };
}
