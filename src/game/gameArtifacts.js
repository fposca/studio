import * as THREE from "three";

function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function makeRelic(model, kind, materials) {
  const { stone, relief, clay, ink, ivory, bronze } = materials;
  if (kind === "seal") {
    const disk = mesh(model, new THREE.CylinderGeometry(0.32, 0.32, 0.09, 40), bronze);
    disk.rotation.x = Math.PI / 2;
    mesh(model, new THREE.TorusGeometry(0.28, 0.018, 8, 40), ivory, 0, 0, 0.054);
    for (const x of [-0.09, 0.09]) {
      mesh(model, new THREE.TorusGeometry(0.062, 0.015, 6, 16), ivory, x, 0.075, 0.065);
      mesh(model, new THREE.SphereGeometry(0.022, 8, 6), ink, x, 0.075, 0.067);
    }
    const body = mesh(model, new THREE.OctahedronGeometry(0.15), ivory, 0, -0.09, 0.06);
    body.scale.set(1, 1, 0.3);
  } else if (kind === "frieze") {
    mesh(model, new THREE.BoxGeometry(0.84, 0.5, 0.13), stone);
    for (const y of [-0.22, 0.22]) mesh(model, new THREE.BoxGeometry(0.9, 0.035, 0.17), relief, 0, y, 0);
    for (const x of [-0.23, 0.04, 0.3]) {
      mesh(model, new THREE.SphereGeometry(0.065, 12, 8), relief, x, 0.105, 0.09);
      mesh(model, new THREE.BoxGeometry(0.12, 0.19, 0.055), relief, x, -0.05, 0.09);
    }
  } else if (kind === "ostrakon") {
    const shape = new THREE.Shape();
    shape.moveTo(-0.4, -0.18); shape.lineTo(-0.26, 0.18); shape.lineTo(0.04, 0.27);
    shape.lineTo(0.36, 0.09); shape.lineTo(0.3, -0.24); shape.lineTo(-0.13, -0.29); shape.closePath();
    mesh(model, new THREE.ExtrudeGeometry(shape, { depth: 0.055, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.012, bevelSegments: 1 }), clay);
    for (const [x, y, width] of [[-0.1, 0.1, 0.3], [0, -0.03, 0.4], [-0.05, -0.15, 0.22]]) {
      const groove = mesh(model, new THREE.BoxGeometry(width, 0.012, 0.006), ink, x, y, 0.072);
      groove.rotation.z = -0.1;
    }
  } else if (kind === "lekythos") {
    const profile = [[0, -0.4], [0.16, -0.4], [0.18, -0.32], [0.2, -0.22], [0.19, 0.08],
      [0.11, 0.2], [0.07, 0.23], [0.065, 0.37], [0.13, 0.39], [0.13, 0.42], [0, 0.42]];
    mesh(model, new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 24), ivory);
    for (const y of [-0.28, -0.12, 0.16]) {
      const band = mesh(model, new THREE.TorusGeometry(y === 0.16 ? 0.1 : 0.196, 0.013, 6, 24), ink, 0, y, 0);
      band.rotation.x = Math.PI / 2;
    }
    const handle = mesh(model, new THREE.TorusGeometry(0.11, 0.026, 8, 16, Math.PI * 1.3), ivory, 0.14, 0.17, 0);
    handle.rotation.z = -0.35;
  } else if (kind === "stele") {
    mesh(model, new THREE.BoxGeometry(0.49, 0.69, 0.13), stone, 0, -0.06, 0);
    mesh(model, new THREE.SphereGeometry(0.245, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), stone, 0, 0.28, 0);
    mesh(model, new THREE.BoxGeometry(0.38, 0.02, 0.02), relief, 0, -0.31, 0.075);
    mesh(model, new THREE.SphereGeometry(0.045, 10, 8), bronze, 0, 0.04, 0.09);
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      const petal = mesh(model, new THREE.SphereGeometry(0.065, 10, 8), relief, Math.cos(angle) * 0.1, 0.04 + Math.sin(angle) * 0.1, 0.085);
      petal.scale.set(0.55, 1.1, 0.3);
      petal.rotation.z = angle - Math.PI / 2;
    }
  }
}

export function createGameArtifacts(parent, world) {
  const materials = {
    stone: new THREE.MeshStandardMaterial({ color: 0xb7ae99, roughness: 0.92 }),
    relief: new THREE.MeshStandardMaterial({ color: 0xe1d7b9, roughness: 0.84 }),
    clay: new THREE.MeshStandardMaterial({ color: 0xa66341, roughness: 0.89 }),
    ink: new THREE.MeshStandardMaterial({ color: 0x33302b, roughness: 0.95 }),
    ivory: new THREE.MeshStandardMaterial({ color: 0xddd2ae, roughness: 0.76 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0xb89554, metalness: 0.55, roughness: 0.45 })
  };
  const entries = world.artifacts.map((artifact, index) => {
    const group = new THREE.Group();
    group.name = `Hallazgo ${artifact.title}`;
    group.position.set(artifact.x, artifact.y, artifact.z);
    parent.add(group);
    mesh(group, new THREE.CylinderGeometry(0.39, 0.46, 0.16, 12), materials.ink, 0, 0.1, 0);
    const model = new THREE.Group();
    model.position.y = 0.94;
    makeRelic(model, artifact.model, materials);
    group.add(model);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xe1b66d, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
    const ring = mesh(group, new THREE.RingGeometry(0.48, 0.51, 36), ringMaterial, 0, 0.025, 0);
    ring.rotation.x = -Math.PI / 2;
    const light = new THREE.PointLight(0xf7dba4, 2.2, 2.8, 2);
    light.position.y = 1.05;
    group.add(light);
    return { artifact, group, model, ringMaterial, index };
  });
  return (time) => {
    for (const { artifact, group, model, ringMaterial, index } of entries) {
      group.visible = world.artifactAvailable(artifact);
      if (!group.visible) continue;
      model.position.y = 0.91 + Math.sin(time * 2.1 + index) * 0.06;
      model.rotation.y = Math.sin(time * 0.65 + index) * 0.23;
      ringMaterial.opacity = 0.35 + Math.sin(time * 2.1 + index) * 0.12;
    }
  };
}
