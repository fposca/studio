import * as THREE from "three";

const BAT_COUNT = 18;

function seededRandom(seed) {
  return () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function createBatGeometry() {
  const outline = [
    [-0.12, 0.04], [-0.28, 0.19], [-0.47, 0.22], [-0.73, 0.16], [-1, 0.2],
    [-0.83, -0.12], [-0.68, -0.02], [-0.56, -0.2], [-0.43, -0.08],
    [-0.31, -0.2], [-0.16, -0.09], [-0.12, -0.22], [0, -0.27],
    [0.12, -0.22], [0.16, -0.09], [0.31, -0.2], [0.43, -0.08],
    [0.56, -0.2], [0.68, -0.02], [0.83, -0.12], [1, 0.2],
    [0.73, 0.16], [0.47, 0.22], [0.28, 0.19], [0.12, 0.04],
    [0.11, 0.18], [0.065, 0.28], [0.035, 0.17], [-0.035, 0.17],
    [-0.065, 0.28], [-0.11, 0.18]
  ];
  const shape = new THREE.Shape();
  outline.forEach(([x, y], index) => {
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

export function createCemeteryBats({ name = "Murcielagos del cementerio", flocks: customFlocks,
  sizeScale = 1, batColor = 0x090d12 } = {}) {
  const group = new THREE.Group();
  group.name = name;
  group.userData.editorHelper = true;
  group.visible = false;

  const random = seededRandom(71921);
  const geometry = createBatGeometry();
  const phases = new Float32Array(BAT_COUNT);
  const flapSpeeds = new Float32Array(BAT_COUNT);
  const flocks = customFlocks || [
    { x: -12, z: -18, height: 5.1, range: 7 },
    { x: 13, z: -21, height: 5.5, range: 6.5 },
    { x: 0, z: -35, height: 8, range: 12 }
  ];
  const trajectories = Array.from({ length: BAT_COUNT }, (_, index) => {
    const flock = flocks[index % flocks.length];
    const phase = random() * Math.PI * 2;
    phases[index] = random() * Math.PI * 2;
    flapSpeeds[index] = 12 + random() * 7;
    return {
      x: flock.x + (random() - 0.5) * 3.5,
      z: flock.z + (random() - 0.5) * 4,
      height: flock.height + (random() - 0.5) * 2.6,
      range: flock.range * (0.55 + random() * 0.5),
      depth: 1.1 + random() * 2,
      speed: 0.36 + random() * 0.27,
      phase,
      size: ((index % flocks.length === 2 ? 0.29 : 0.43) + random() * 0.22) * sizeScale
    };
  });
  geometry.setAttribute("aFlapPhase", new THREE.InstancedBufferAttribute(phases, 1));
  geometry.setAttribute("aFlapSpeed", new THREE.InstancedBufferAttribute(flapSpeeds, 1));

  const material = new THREE.MeshBasicMaterial({
    color: batColor, side: THREE.DoubleSide, toneMapped: false
  });
  let shader = null;
  material.onBeforeCompile = (program) => {
    shader = program;
    program.uniforms.uBatTime = { value: 0 };
    program.vertexShader = program.vertexShader.replace("#include <common>",
      "#include <common>\nattribute float aFlapPhase;\nattribute float aFlapSpeed;\nuniform float uBatTime;");
    program.vertexShader = program.vertexShader.replace("#include <begin_vertex>", `
      #include <begin_vertex>
      float span = smoothstep(0.13, 1.0, abs(position.x));
      float flap = sin(uBatTime * aFlapSpeed + aFlapPhase);
      transformed.x *= 1.0 - span * max(flap, 0.0) * 0.22;
      transformed.y += span * span * flap * 0.34;
      transformed.z += span * flap * 0.08;
    `);
  };
  material.customProgramCacheKey = () => "cemetery-bat-flap-v1";

  const bats = new THREE.InstancedMesh(geometry, material, BAT_COUNT);
  bats.name = "Bandada de murcielagos";
  bats.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  bats.frustumCulled = false;
  const color = new THREE.Color();
  for (let index = 0; index < BAT_COUNT; index += 1) {
    const shade = 0.78 + random() * 0.16;
    bats.setColorAt(index, color.setRGB(shade, shade, shade));
  }
  group.add(bats);

  const dummy = new THREE.Object3D();
  group.userData.animate = (time, camera, reduced = false) => {
    if (!camera) return;
    const seconds = time * 0.001;
    if (shader) shader.uniforms.uBatTime.value = seconds;
    bats.count = reduced ? 12 : BAT_COUNT;
    for (let index = 0; index < bats.count; index += 1) {
      const path = trajectories[index];
      const travel = seconds * path.speed + path.phase;
      dummy.position.set(
        path.x + Math.sin(travel) * path.range,
        path.height + Math.sin(travel * 2 + path.phase) * 0.42 + Math.sin(seconds * 1.5 + path.phase) * 0.16,
        path.z + Math.sin(travel * 2 + path.phase) * path.depth
      );
      dummy.quaternion.copy(camera.quaternion);
      dummy.rotateZ(Math.sin(travel) * 0.22);
      dummy.scale.setScalar(path.size);
      dummy.updateMatrix();
      bats.setMatrixAt(index, dummy.matrix);
    }
    bats.instanceMatrix.needsUpdate = true;
  };
  group.userData.dispose = () => {
    geometry.dispose();
    material.dispose();
  };
  group.userData.count = BAT_COUNT;
  return group;
}
