export function joystickVector(clientX, clientY, rect, travel, deadZone = 0.1) {
  const dx = clientX - (rect.left + rect.width / 2);
  const dy = clientY - (rect.top + rect.height / 2);
  const distance = Math.hypot(dx, dy);
  const radius = Math.max(1, travel);
  const limitedDistance = Math.min(distance, radius);
  const offsetX = distance ? dx / distance * limitedDistance : 0;
  const offsetY = distance ? dy / distance * limitedDistance : 0;
  const pressure = limitedDistance / radius;
  const amount = pressure <= deadZone ? 0 : (pressure - deadZone) / (1 - deadZone);
  return {
    x: distance ? dx / distance * amount : 0,
    y: distance ? -dy / distance * amount : 0,
    offsetX,
    offsetY,
  };
}
