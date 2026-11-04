import * as THREE from "three";
import { canvasMap, roofRandom } from "./rooftopMaterials.js";

function facadeTexture(variant, emissive = false) {
  return canvasMap(512, 1024, ctx => {
    ctx.fillStyle = emissive ? "#000000" : ["#4e4b47", "#53504b", "#42474c", "#58514b"][variant];
    ctx.fillRect(0, 0, 512, 1024);
    for (let row = 0; row < 12; row++) {
      if (!emissive) {
        ctx.fillStyle = "#393b3d"; ctx.fillRect(0, row * 85, 512, 3);
        ctx.fillStyle = "#716c63"; ctx.fillRect(0, row * 85 + 3, 512, 2);
      }
      for (let col = 0; col < 6; col++) {
        const x = col * 85 + 20, y = row * 85 + 22;
        const lit = roofRandom(row * 41 + col + variant * 100) > .65;
        if (!emissive) { ctx.fillStyle = "#252d33"; ctx.fillRect(x - 3, y - 3, 49, 51); }
        ctx.fillStyle = lit ? ["#a6906a", "#c3a77b", "#8e997c"][col % 3] : emissive ? "#000000" : "#202a31";
        ctx.fillRect(x, y, 43, 44);
        ctx.fillStyle = emissive ? "#000000" : "#565955";
        ctx.fillRect(x + 20, y, 2, 44);
        if (lit && col % 2) { ctx.fillStyle = emissive ? "#55452f" : "#7d7768"; ctx.fillRect(x, y, 43, 9); }
        if (!emissive) { ctx.fillStyle = "#7c756b"; ctx.fillRect(x - 4, y + 45, 52, 4); }
      }
    }
  });
}
export function buildRooftopCity(scene, materials) {
  const city = new THREE.Group(); city.name = "Buenos Aires / skyline"; scene.add(city);
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x303940, roughness: 1 });
  const towers = [];
  for (let iz = -5; iz <= 5; iz++) for (let ix = -5; ix <= 5; ix++) {
    if (Math.abs(ix) <= 1 && Math.abs(iz) <= 1) continue;
    const index = (iz + 5) * 11 + ix + 5;
    const x = ix * 12.7 + (roofRandom(index) - .5) * 3;
    const z = iz * 12.7 + (roofRandom(index + 42) - .5) * 3;
    const near = Math.max(Math.abs(ix), Math.abs(iz)) === 2;
    const height = 10 + roofRandom(index + 51) * (near ? 9 : 17);
    towers.push({ x, z, height, width: 6 + roofRandom(index + 88) * 4, depth: 6 + roofRandom(index + 89) * 4, variant: index % 4 });
  }
  const dummy = new THREE.Object3D();
  for (let variant = 0; variant < 4; variant++) {
    const entries = towers.filter(t => t.variant === variant);
    const facade = new THREE.MeshStandardMaterial({ map: facadeTexture(variant), emissiveMap: facadeTexture(variant, true), emissive: 0xffd3a1, emissiveIntensity: .5, roughness: .95 });
    const mesh = new THREE.InstancedMesh(boxGeometry, [facade, facade, roofMaterial, roofMaterial, facade, facade], entries.length);
    entries.forEach((building, index) => {
      dummy.position.set(building.x, building.height / 2 - 17, building.z);
      dummy.scale.set(building.width, building.height, building.depth); dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true; city.add(mesh);
  }
  const cornices = new THREE.InstancedMesh(boxGeometry, materials.cap, towers.length);
  const tankGeometry = new THREE.CylinderGeometry(.62, .64, 1.1, 8);
  const tanks = new THREE.InstancedMesh(tankGeometry, materials.dark, Math.ceil(towers.length / 3));
  let tankIndex = 0;
  towers.forEach((b, i) => {
    dummy.position.set(b.x, b.height - 17 + .07, b.z); dummy.scale.set(b.width + .24, .18, b.depth + .24);
    dummy.updateMatrix(); cornices.setMatrixAt(i, dummy.matrix);
    if (i % 3 === 0) {
      dummy.position.set(b.x - 1.2, b.height - 17 + .85, b.z + .7); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
      tanks.setMatrixAt(tankIndex++, dummy.matrix);
    }
  });
  cornices.instanceMatrix.needsUpdate = true; tanks.instanceMatrix.needsUpdate = true;
  city.add(cornices, tanks);
  const streetMaterial = new THREE.MeshBasicMaterial({ color: 0x171f2b });
  const streets = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), streetMaterial);
  streets.rotation.x = -Math.PI / 2; streets.position.y = -17.1; city.add(streets);
  const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(.11, 4, 3), new THREE.MeshBasicMaterial({ color: 0xffbb72 }), 90);
  for (let i = 0; i < 90; i++) {
    const x = (i % 10 - 5) * 12.7 + 6, z = (Math.floor(i / 10) - 4) * 12.7;
    dummy.position.set(x, -15, z); dummy.scale.set(1, .6, 1); dummy.updateMatrix(); lamps.setMatrixAt(i, dummy.matrix);
  }
  lamps.instanceMatrix.needsUpdate = true; city.add(lamps);
  // A distant layer softens the horizon without surrounding the player with tall walls.
  const distant = new THREE.InstancedMesh(boxGeometry, new THREE.MeshStandardMaterial({ color: 0x273444, roughness: 1 }), 64);
  for (let i = 0; i < 64; i++) {
    const angle = i * Math.PI / 32, radius = 95 + roofRandom(i + 690) * 35, height = 9 + roofRandom(i + 780) * 23;
    dummy.position.set(Math.sin(angle) * radius, height / 2 - 14, Math.cos(angle) * radius);
    dummy.scale.set(5 + roofRandom(i + 890) * 8, height, 7); dummy.updateMatrix(); distant.setMatrixAt(i, dummy.matrix);
  }
  distant.instanceMatrix.needsUpdate = true; city.add(distant);

  const cloudTexture = canvasMap(512, 256, ctx => {
    ctx.clearRect(0, 0, 512, 256);
    for (let i = 0; i < 35; i++) {
      const x = 65 + roofRandom(i + 901) * 382, y = 55 + roofRandom(i + 921) * 146;
      const g = ctx.createRadialGradient(x, y, 5, x, y, 38 + roofRandom(i) * 45);
      g.addColorStop(0, "rgba(114,126,145,.25)"); g.addColorStop(1, "rgba(60,70,90,0)");
      ctx.fillStyle = g; ctx.fillRect(x - 90, y - 90, 180, 180);
    }
  });
  const clouds = new THREE.Group(); city.add(clouds);
  const cloudMaterial = new THREE.MeshBasicMaterial({ map: cloudTexture, color: 0x8c9aac, transparent: true, opacity: .42, depthWrite: false, side: THREE.DoubleSide, fog: false });
  for (let i = 0; i < 9; i++) {
    const cloud = new THREE.Mesh(new THREE.PlaneGeometry(85, 45), cloudMaterial);
    cloud.position.set((roofRandom(i + 939) - .5) * 170, 27 + i * 1.1, (roofRandom(i + 940) - .5) * 150);
    cloud.rotation.set(-Math.PI / 2, 0, roofRandom(i + 950) * 3); clouds.add(cloud);
  }
  return { update(dt, anomaly, reducedMotion) {
    if (!reducedMotion) clouds.rotation.y += dt * .0007;
    cloudMaterial.color.setHex(anomaly ? 0x93425c : 0x8c9aac);
  } };
}
