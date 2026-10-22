import * as THREE from "three";

export const FREQUENCY09_LAYOUT = {
  playerLimitX: 4.2, playerBackZ: -17.8, playerFrontZ: 8.2, spawnZ: 6.4,
  cameraLimitX: 5.1, cameraBackZ: -18.4, cameraFrontZ: 8.8,
};

function placard(text, color = "#ed65bd") {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 192;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#090812"; ctx.fillRect(0, 0, 512, 192);
  ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.strokeRect(8, 8, 496, 176);
  ctx.font = "bold 37px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#f7e9d4";
  text.split("\n").forEach((line, index) => ctx.fillText(line, 256, 85 + index * 50));
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.1),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
}

export function buildFrequency09Realm(scene) {
  const ink = new THREE.MeshStandardMaterial({ color: 0x12121d, roughness: .86, metalness: .33 });
  const edge = new THREE.MeshStandardMaterial({ color: 0x4b254f, emissive: 0x9b2a78, emissiveIntensity: 1.45 });
  const pink = new THREE.MeshBasicMaterial({ color: 0xf35bc2 });
  const violet = new THREE.MeshBasicMaterial({ color: 0x9675f8 });
  const red = new THREE.MeshBasicMaterial({ color: 0xb71f4e });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd3a678, metalness: .55, roughness: .38 });
  const box = (w, h, d, material, x, y, z, parent = scene) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  };
  scene.background = new THREE.Color(0x05040b);
  scene.fog = new THREE.FogExp2(0x0e0719, .065);
  scene.add(new THREE.AmbientLight(0x6c4f8a, .48));
  const pulseLight = new THREE.PointLight(0xed54bb, 14, 12, 2);
  pulseLight.position.set(0, 3, -5); scene.add(pulseLight);
  const visionLight = new THREE.PointLight(0xe53e66, 0, 9, 2);
  visionLight.position.set(0, 2.8, -14); scene.add(visionLight);

  // A broken bridge over a void; its walkable center has continuous collision ground.
  box(7.1, .22, 26.7, ink, 0, -.16, -4.8);
  for (let i = 0; i < 17; i++) {
    const z = 7.2 - i * 1.48;
    box(6.75, .045, 1.32, ink, 0, -.025 + i % 3 * .008, z);
    box(6.7, .025, .028, i % 4 === 0 ? pink : edge, 0, .008, z - .65);
  }
  for (const side of [-1, 1]) {
    box(.08, .08, 26, edge, side * 3.58, .09, -4.8);
    for (let i = 0; i < 10; i++) {
      const z = 6.9 - i * 2.5;
      box(.08, 1.25 + i % 3 * .31, .08, i % 2 ? violet : pink, side * 3.58, .66, z);
      const shard = box(.5 + i % 3 * .24, .9 + i % 4 * .23, .12, ink,
        side * (4.1 + i % 2), 1.3 + i % 3 * .2, z);
      shard.rotation.set(.2 * i, .34 * i, .23 * side);
    }
  }
  const screens = [];
  for (const [x, z, label] of [
    [-2.8, 1, "CLUB\nSE\u00d1AL 09"], [2.8, -4.4, "TIEMPO\nALTERADO"],
  ]) {
    const group = new THREE.Group(); group.position.set(x, 1.95, z);
    group.rotation.y = x < 0 ? .24 : -.24;
    box(2.55, 1.68, .24, ink, 0, 0, 0, group);
    const sign = placard(label, x < 0 ? "#ed65bd" : "#9b80ff");
    sign.scale.set(.78, .78, 1); sign.position.z = .14; group.add(sign);
    scene.add(group); screens.push(group);
  }
  const future = new THREE.Group(); future.position.set(0, 0, -14.4);
  future.visible = false; scene.add(future);
  box(6.5, .13, 4.6, ink, 0, -.025, -.1, future);
  box(6.3, 2.2, .17, ink, 0, 1.05, -2.25, future);
  const sign = placard("LA TIENDA DE\nLOS DISCOS", "#c69b77");
  sign.scale.set(.74, .55, 1); sign.position.set(0, 1.85, -2.12); future.add(sign);
  for (const [i, x] of [-2.2, 2.2].entries()) {
    const shelf = new THREE.Group(); shelf.position.set(x, .6, -.65); shelf.rotation.z = i ? -.58 : .4;
    box(1.7, .15, 1.05, gold, 0, .2, 0, shelf);
    box(1.6, .95, .16, gold, 0, -.27, -.45, shelf);
    for (let j = 0; j < 8; j++) box(.11, .68, .64, j % 3 ? edge : red,
      -.67 + j * .19, .61 + j % 2 * .04, 0, shelf);
    future.add(shelf);
  }
  for (let i = 0; i < 14; i++) {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.27, .27, .017, 20), ink);
    disc.rotation.z = Math.PI / 2;
    disc.position.set((i * 17 % 53) / 9 - 2.8, .045, (i * 11 % 31) / 10 - 1.8);
    future.add(disc);
    const label = new THREE.Mesh(new THREE.CircleGeometry(.07, 12), i % 2 ? pink : violet);
    label.rotation.x = -Math.PI / 2; label.position.copy(disc.position);
    label.position.y += .012; future.add(label);
  }
  const shadow = new THREE.Group(); shadow.position.set(.65, 0, -1.65);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x05030a });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.32, 1.2, 5, 9), shadowMat);
  body.position.y = 1.1; shadow.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 8), shadowMat);
  head.position.y = 2.1; shadow.add(head);
  for (const x of [-.11, .11]) box(.045, .035, .025, red, x, 2.13, .28, shadow);
  future.add(shadow);
  const floaters = new THREE.Group(); scene.add(floaters);
  for (let i = 0; i < 38; i++) {
    const object = box(.05 + i % 3 * .035, .05 + i % 4 * .04, .025,
      i % 4 ? violet : pink, Math.sin(i * 12.9) * 5.6,
      .5 + i % 7 * .5, 7 - (i * 7.13) % 27, floaters);
    object.userData.baseY = object.position.y;
  }
  const interactions = [
    { id: "signal-club", label: "Eco del Club", x: -1.3, z: 1, reach: 2.25 },
    { id: "signal-time", label: "Pantalla del tiempo", x: 1.3, z: -4.4, reach: 2.25 },
    { id: "future-store", label: "Visi\u00f3n de la Tienda", x: 0, z: -10.3, reach: 2.35 },
  ];
  function update(dt, elapsed, phase, reducedMotion) {
    future.visible = ["vision", "presence", "collapse"].includes(phase);
    visionLight.intensity = future.visible ? 10 + Math.sin(elapsed * 14) * 2 : 0;
    pulseLight.intensity = 11 + Math.sin(elapsed * 3.9) * 2.4;
    if (reducedMotion) return;
    screens.forEach((screen) => { screen.position.y = 1.95 + Math.sin(elapsed * 1.8 + screen.position.z) * .035; });
    for (const object of floaters.children)
      object.position.y = object.userData.baseY + Math.sin(elapsed * 1.4 + object.position.z) * .09;
    shadow.position.x = .65 + Math.sin(elapsed * 1.2) * .11;
    future.rotation.z = phase === "collapse" ? Math.sin(elapsed * 23) * .012 : 0;
  }
  return { obstacles: [], colliders: [], interactions, update, mixers: [] };
}
