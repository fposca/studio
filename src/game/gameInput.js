const MOVEMENT_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight", "ShiftLeft", "ShiftRight", "KeyQ", "KeyE"]);

export function createGameInput(canvas, onPause, onInteract) {
  const keys = new Set();
  const held = new Set();
  const touch = { x: 0, z: 0 };
  let jump = false, attack = null, equipment = null, dragging = null, enabled = true;
  const orbit = { yaw: 0.15, pitch: 0.26, distance: 7.5 };
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const isField = (target) => /INPUT|TEXTAREA|SELECT/.test(target?.tagName) || target?.isContentEditable;
  function clear() { keys.clear(); held.clear(); touch.x = touch.z = 0; jump = false; attack = null; equipment = null; dragging = null; }
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
    const slot = /^(?:Digit|Numpad)([123])$/.exec(event.code);
    if (slot) {
      event.preventDefault();
      if (!event.repeat) equip(["unarmed", "sword", "hammer"][Number(slot[1]) - 1]);
      return;
    }
    if (MOVEMENT_KEYS.has(event.code) || ["Space", "KeyJ", "KeyK"].includes(event.code)) {
      event.preventDefault();
      onInteract?.();
      keys.add(event.code);
      if (!event.repeat) {
        if (event.code === "Space") action("jump");
        if (event.code === "KeyJ") action("punch");
        if (event.code === "KeyK") action("kick");
      }
    }
  }, options);
  window.addEventListener("keyup", (event) => keys.delete(event.code), options);
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
    } else if (event.button === 0) action("punch");
  }, options);
  canvas.addEventListener("pointermove", (event) => {
    if (!dragging || dragging.id !== event.pointerId) return;
    orbit.yaw -= (event.clientX - dragging.x) * 0.006;
    orbit.pitch = Math.max(0.12, Math.min(1.15, orbit.pitch + (event.clientY - dragging.y) * 0.004));
    dragging.x = event.clientX;
    dragging.y = event.clientY;
  }, options);
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) canvas.addEventListener(type, () => { dragging = null; }, options);
  canvas.addEventListener("wheel", (event) => {
    if (!enabled) return;
    event.preventDefault();
    orbit.distance = Math.max(3.5, Math.min(12, orbit.distance + event.deltaY * 0.006));
  }, { ...options, passive: false });
  return {
    orbit, touch, action, equip,
    hold(kind, pressed) { if (pressed && enabled) { held.add(kind); action(kind); } else held.delete(kind); },
    clear,
    setEnabled(value) { enabled = value; if (!value) clear(); },
    read(dt) {
      if (keys.has("KeyQ")) orbit.yaw += dt * 1.8;
      if (keys.has("KeyE")) orbit.yaw -= dt * 1.8;
      const value = { x: Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft")) + touch.x,
        z: Number(keys.has("KeyS") || keys.has("ArrowDown")) - Number(keys.has("KeyW") || keys.has("ArrowUp")) + touch.z,
        run: keys.has("ShiftLeft") || keys.has("ShiftRight"), yaw: orbit.yaw, jump, equip: equipment,
        attack: attack || (keys.has("KeyK") || held.has("kick") ? "kick" : keys.has("KeyJ") || held.has("punch") ? "punch" : null) };
      jump = false;
      attack = null;
      equipment = null;
      return value;
    },
    dispose() { controller.abort(); clear(); }
  };
}
