import * as THREE from "three";

// The chapter reuses the studio renderer and its existing lights.
export function createStudioSignalEffects(scene, studio) {
  const material = new THREE.MeshBasicMaterial({ color: 0xf459d6, transparent: true, opacity: .08, depthWrite: false });
  const leds = [];
  const geometry = new THREE.BoxGeometry(.075, .018, .025);
  for (let index = 0; index < 12; index++) {
    const led = new THREE.Mesh(geometry, material.clone());
    led.position.set(-.55 + index * .1, 1.46, -.35);
    led.visible = false;
    scene.add(led);
    leds.push(led);
  }
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 96;
  const paint = canvas.getContext("2d");
  paint.fillStyle = "#160b21"; paint.fillRect(0, 0, 128, 96);
  paint.fillStyle = "#b4399f";
  for (let row = 2; row < 96; row += 6) paint.fillRect(0, row, 128, 1);
  paint.fillStyle = "#09070d";
  paint.beginPath(); paint.ellipse(63, 36, 13, 18, -.1, 0, Math.PI * 2); paint.fill();
  paint.beginPath(); paint.moveTo(48, 58); paint.lineTo(76, 58); paint.lineTo(90, 96); paint.lineTo(34, 96); paint.closePath(); paint.fill();
  paint.fillStyle = "#ee80d1";
  for (let row = 8; row < 96; row += 15) paint.fillRect(8 + row % 21, row, 40 + row % 13, 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(.54, .4),
    new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
  );
  screen.position.set(5, 1.72, -4.06);
  screen.visible = false;
  scene.add(screen);
  const glow = new THREE.PointLight(0xf934c4, 0, 5.5, 2);
  glow.position.set(4.8, 1.8, -4.0);
  scene.add(glow);
  const bases = studio.roomLights.map((light) => light.intensity);
  let soundContext = null;
  let soundSource = null;
  let soundGain = null;
  let lastResume = -10;
  return {
    update(elapsed, age, completed, reducedMotion, paused, nearConsole) {
      const active = age !== null;
      const pulse = reducedMotion ? .7 : .5 + .5 * Math.sin(elapsed * 24);
      studio.roomLights.forEach((light, index) => {
        light.intensity = active
          ? index === 1 && age > 4 && age < 8
            ? bases[index] * (reducedMotion ? .35 : Math.sin(age * 15) > .35 ? .12 : .7)
            : bases[index] * (age > 3 && age < 10 ? .6 : 1)
          : completed && index === 1 && !paused && !reducedMotion && Math.sin(elapsed * 2.1) > .995
            ? bases[index] * .68 : bases[index];
      });
      leds.forEach((led, index) => {
        led.visible = active || completed;
        led.material.opacity = active ? (index < Math.min(12, Math.floor(age * 1.5)) ? .85 * pulse : .12)
          : .09 + (index === 8 ? .18 * pulse : 0);
      });
      screen.visible = active && age > 5.2 && age < 7.5 || completed;
      screen.material.opacity = active ? age > 5.2 && age < 7.5 ? .18 + .58 * pulse : 0
        : completed ? .045 + .035 * pulse : 0;
      glow.intensity = active && age > 5 && age < 8 ? 3.5 * pulse : completed ? .15 : 0;
      if (completed && nearConsole && !paused && !soundContext) {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            soundContext = new AudioContext();
            soundSource = soundContext.createOscillator();
            soundGain = soundContext.createGain();
            soundSource.type = "sine";
            soundSource.frequency.value = 58;
            soundGain.gain.value = 0;
            soundSource.connect(soundGain).connect(soundContext.destination);
            soundSource.start();
          }
        } catch { soundContext = null; }
      }
      if (soundContext && soundGain) {
        if (nearConsole && !paused && soundContext.state === "suspended" && elapsed - lastResume > 2) {
          lastResume = elapsed;
          soundContext.resume().catch(() => {});
        }
        soundGain.gain.setTargetAtTime(completed && nearConsole && !paused ? .007 : 0, soundContext.currentTime, .25);
      }
    },
    dispose() {
      try { soundSource?.stop(); } catch { /* Sound already stopped. */ }
      soundSource?.disconnect();
      soundGain?.disconnect();
      soundContext?.close().catch(() => {});
    }
  };
}
