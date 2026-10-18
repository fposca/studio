const MOVEMENT_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight", "ShiftLeft", "ShiftRight", "KeyQ", "KeyE"]);

export function createGameInput(canvas, onPause, onInteract, onToggleView) {
  const keys = new Set();
  const held = new Set();
  const touch = { x: 0, z: 0 };
  let jump = false, attack = null, attackReleased = false, equipment = null, dragging = null, enabled = true;
  const orbit = { yaw: 0.15, pitch: 0.26, distance: 7.5, firstPerson: false, lookPitch: 0 };
  let wasLocked = false, requestingMouse = false;
  const finePointer = () => window.matchMedia("(pointer: fine)").matches;
  function captureMouse() {
    if (!enabled || !orbit.firstPerson || !finePointer() || requestingMouse ||
      document.pointerLockElement === canvas || !canvas.requestPointerLock || !navigator.userActivation?.isActive) return;
    requestingMouse = true;
    try {
      Promise.resolve(canvas.requestPointerLock()).catch(() => {}).finally(() => { requestingMouse = false; });
    } catch { requestingMouse = false; }
  }
  function releaseMouse() { if (document.pointerLockElement === canvas) document.exitPointerLock(); }
  function look(dx, dy) {
    orbit.yaw -= dx * 0.004;
    if (orbit.firstPerson) orbit.lookPitch = Math.max(-1.25, Math.min(1.25, orbit.lookPitch - dy * 0.003));
    else orbit.pitch = Math.max(0.12, Math.min(1.15, orbit.pitch + dy * 0.004));
  }
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const isField = (target) => /INPUT|TEXTAREA|SELECT/.test(target?.tagName) || target?.isContentEditable;
  const primaryHeld = () => keys.has("KeyJ") || held.has("punch") || held.has("mouse");
  function clear() { keys.clear(); held.clear(); touch.x = touch.z = 0; jump = false; attack = null; attackReleased = false; equipment = null; dragging = null; }
  function equip(weapon) { if (enabled) { equipment = weapon; onInteract?.(); } }
  function action(kind) {
    if (!enabled) return;
    onInteract?.();
    if (kind === "jump") jump = true;
    else attack = kind;
  }
  window.addEventListener("keydown", (event) => {
    if (isField(event.target)) return;
    if (event.code === "Escape" || event.code === "KeyP") {
      if (!event.repeat) onPause();
      return;
    }
    if (!enabled) return;
    if (event.code === "KeyV") {
      event.preventDefault();
      if (!event.repeat) onToggleView?.();
      return;
    }
    const slot = /^(?:Digit|Numpad)([12345])$/.exec(event.code);
    if (slot) {
      event.preventDefault();
      if (!event.repeat) equip(["unarmed", "sword", "hammer", "axe", "crossbow"][Number(slot[1]) - 1]);
      return;
    }
    if (MOVEMENT_KEYS.has(event.code) || ["Space", "KeyJ", "KeyK"].includes(event.code)) {
      event.preventDefault();
      onInteract?.();
      keys.add(event.code);
      if (!event.repeat) {
        if (event.code === "Space") action("jump");
        if (event.code === "KeyJ") onInteract?.();
        if (event.code === "KeyK") action("kick");
      }
    }
  }, options);
  window.addEventListener("keyup", (event) => {
    const primary = event.code === "KeyJ" && keys.has("KeyJ");
    keys.delete(event.code);
    if (primary && !primaryHeld()) attackReleased = true;
  }, options);
  window.addEventListener("blur", () => { clear(); onPause(true); }, options);
  document.addEventListener("visibilitychange", () => { if (document.hidden) { clear(); onPause(true); } }, options);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault(), options);
  canvas.addEventListener("pointerdown", (event) => {
    if (!enabled) return;
    canvas.focus();
    onInteract?.();
    if (event.button === 2 || event.pointerType === "touch") {
      dragging = { id: event.pointerId, x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    } else if (event.button === 0) {
      // The first click attacks too; aiming already works before locking the cursor.
      captureMouse();
      held.add("mouse");
    }
  }, options);
  canvas.addEventListener("pointermove", (event) => {
    if (!enabled) return;
    if (document.pointerLockElement === canvas) { look(event.movementX, event.movementY); return; }
    if (!dragging && orbit.firstPerson && event.pointerType === "mouse") {
      look(event.movementX, event.movementY);
      return;
    }
    if (!dragging || dragging.id !== event.pointerId) return;
    look(event.clientX - dragging.x, event.clientY - dragging.y);
    dragging.x = event.clientX;
    dragging.y = event.clientY;
  }, options);
  document.addEventListener("pointerlockchange", () => {
    const locked = document.pointerLockElement === canvas;
    if (locked && (!enabled || !orbit.firstPerson)) { releaseMouse(); return; }
    if (wasLocked && !locked && enabled && orbit.firstPerson) { clear(); onPause(true); }
    wasLocked = locked;
  }, options);
  window.addEventListener("pointerup", () => {
    const primary = held.delete("mouse");
    if (primary && !primaryHeld()) attackReleased = true;
  }, options);
  window.addEventListener("pointercancel", () => held.delete("mouse"), options);
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) canvas.addEventListener(type, () => { dragging = null; }, options);
  canvas.addEventListener("wheel", (event) => {
    if (!enabled) return;
    event.preventDefault();
    if (orbit.firstPerson) return;
    orbit.distance = Math.max(3.5, Math.min(12, orbit.distance + event.deltaY * 0.006));
  }, { ...options, passive: false });
  return {
    orbit, touch, action, equip,
    setFirstPerson(value) { orbit.firstPerson = Boolean(value); clear(); if (!value) releaseMouse(); },
    hold(kind, pressed) {
      if (pressed && enabled) {
        if (!held.has(kind)) { held.add(kind); if (kind === "punch") onInteract?.(); else action(kind); }
      } else {
        const primary = kind === "punch" && held.has(kind);
        held.delete(kind);
        if (primary && !primaryHeld()) attackReleased = true;
      }
    },
    cancelHold(kind) { held.delete(kind); },
    clear,
    setEnabled(value) { enabled = value; if (!value) { clear(); releaseMouse(); } },
    read(dt) {
      if (keys.has("KeyQ")) orbit.yaw += dt * 1.8;
      if (keys.has("KeyE")) orbit.yaw -= dt * 1.8;
      const value = { x: Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft")) + touch.x,
        z: Number(keys.has("KeyS") || keys.has("ArrowDown")) - Number(keys.has("KeyW") || keys.has("ArrowUp")) + touch.z,
        run: keys.has("ShiftLeft") || keys.has("ShiftRight"), yaw: orbit.yaw, aimPitch: orbit.lookPitch, firstPerson: orbit.firstPerson, jump, equip: equipment,
        attack: attack || (keys.has("KeyK") || held.has("kick") ? "kick" : null),
        attackHeld: primaryHeld(), attackReleased };
      jump = false;
      attack = null;
      attackReleased = false;
      equipment = null;
      return value;
    },
    dispose() { enabled = false; controller.abort(); clear(); releaseMouse(); }
  };
}
