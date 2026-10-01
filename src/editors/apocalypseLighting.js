import * as THREE from "three";

export const DEFAULT_APOCALYPSE_LIGHTING = { enabled: false, intensity: 0.65 };

export function createApocalypseLighting() {
  const group = new THREE.Group();
  group.name = "Resplandor de incendios de apocalipsis";
  group.userData.editorHelper = true;
  group.visible = false;

  const fires = [
    new THREE.PointLight(0xff7736, 0, 24, 2),
    new THREE.PointLight(0xffa25c, 0, 25, 2)
  ];
  fires[0].position.set(-7, 1.8, 5);
  fires[1].position.set(9, 1.6, -11);
  const skyFill = new THREE.DirectionalLight(0x9cb4c5, 0);
  skyFill.position.set(5, 7, 11);
  group.add(...fires, skyFill);

  group.userData.animate = (settings, time, active, fireSettings) => {
    const intensity = Math.max(0, Math.min(1.5, Number(settings?.intensity) || 0));
    group.visible = Boolean(active && settings?.enabled && intensity > 0);
    if (!group.visible) return;
    const seconds = time * 0.001;
    const visibleFires = !(fireSettings?.enabled && fireSettings.count > 0);
    fires.forEach((light, index) => {
      light.visible = visibleFires;
      if (!visibleFires) return;
      const flicker = 0.93 + 0.055 * Math.sin(seconds * (4.6 + index) + index * 2.4)
        + 0.025 * Math.sin(seconds * (9.1 + index * 1.7));
      light.intensity = (10 + intensity * 48) * flicker;
    });
    skyFill.intensity = 0.1 + intensity * 0.55;
  };
  return group;
}
