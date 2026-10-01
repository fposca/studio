import * as THREE from "three";

export const DEFAULT_MAGIC_SETTINGS = Object.freeze({
  enabled: false, runes: true, particles: true, color: "#75d6cf",
  intensity: 0.8, count: 72, speed: 0.6, radius: 4.5, height: 3.2, x: 0, z: 0
});

export function normalizeMagicSettings(value = {}) {
  const result = { ...DEFAULT_MAGIC_SETTINGS, ...value };
  for (const [key, min, max] of [
    ["intensity", 0, 2], ["count", 0, 160], ["speed", 0, 3],
    ["radius", 1, 12], ["height", 0.3, 8], ["x", -30, 30], ["z", -30, 30]
  ]) {
    const number = Number(result[key]);
    result[key] = Number.isFinite(number) ? THREE.MathUtils.clamp(number, min, max) : DEFAULT_MAGIC_SETTINGS[key];
  }
  result.count = Math.round(result.count);
  for (const key of ["enabled", "runes", "particles"]) result[key] = Boolean(result[key]);
  if (!/^#[\da-f]{6}$/i.test(result.color)) result.color = DEFAULT_MAGIC_SETTINGS.color;
  return result;
}

function runePath(context, variant, size) {
  context.beginPath();
  context.moveTo(0, -size);
  context.lineTo(0, size);
  if (variant === 0) {
    context.moveTo(-size * 0.62, -size * 0.35);
    context.lineTo(0, -size * 0.75);
    context.lineTo(size * 0.62, -size * 0.35);
    context.moveTo(-size * 0.5, size * 0.45);
    context.lineTo(0, 0);
    context.lineTo(size * 0.5, size * 0.45);
  } else if (variant === 1) {
    context.moveTo(0, -size * 0.8);
    context.lineTo(size * 0.55, 0);
    context.lineTo(0, size * 0.8);
    context.lineTo(-size * 0.55, 0);
    context.closePath();
  } else if (variant === 2) {
    context.moveTo(-size * 0.65, -size * 0.7);
    context.lineTo(0, -size * 0.2);
    context.lineTo(size * 0.65, -size * 0.7);
    context.moveTo(-size * 0.65, size * 0.7);
    context.lineTo(0, size * 0.2);
    context.lineTo(size * 0.65, size * 0.7);
  } else {
    context.moveTo(-size * 0.7, 0);
    context.lineTo(size * 0.7, 0);
    context.moveTo(0, -size * 0.6);
    context.arc(0, 0, size * 0.6, -Math.PI / 2, Math.PI * 1.5);
  }
  context.stroke();
}

function magicTexture(seal = false) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const context = canvas.getContext("2d");
  context.strokeStyle = "#ffffff";
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = "#ffffff";
  context.shadowBlur = seal ? 5 : 12;
  context.lineWidth = seal ? 2 : 5;
  if (seal) {
    context.translate(256, 256);
    for (const radius of [184, 212]) {
      context.beginPath(); context.arc(0, 0, radius, 0, Math.PI * 2); context.stroke();
    }
    for (let i = 0; i < 12; i += 1) {
      context.save(); context.rotate(i * Math.PI / 6);
      context.translate(0, -198); runePath(context, i % 4, 9); context.restore();
    }
    context.beginPath();
    for (let i = 0; i <= 8; i += 1) {
      const angle = i * Math.PI * 3 / 4;
      if (i === 0) context.moveTo(Math.cos(angle) * 157, Math.sin(angle) * 157);
      else context.lineTo(Math.cos(angle) * 157, Math.sin(angle) * 157);
    }
    context.stroke();
  } else {
    for (let i = 0; i < 4; i += 1) {
      context.save(); context.translate(128 + (i % 2) * 256, 128 + Math.floor(i / 2) * 256);
      runePath(context, i, 72); context.restore();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createArcaneMagic() {
  const group = new THREE.Group();
  group.name = "Magia arcana";
  group.userData.editorHelper = true;
  group.visible = false;
  const atlas = magicTexture();
  const sealTexture = magicTexture(true);
  const runeMaterial = new THREE.MeshBasicMaterial({
    map: atlas, color: DEFAULT_MAGIC_SETTINGS.color, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false
  });
  runeMaterial.forceSinglePass = true;
  const runes = Array.from({ length: 4 }, (_, variant) => {
    const geometry = new THREE.PlaneGeometry(0.42, 0.62);
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i += 1) uv.setXY(i, (uv.getX(i) + variant % 2) / 2, (uv.getY(i) + Math.floor(variant / 2)) / 2);
    const mesh = new THREE.InstancedMesh(geometry, runeMaterial, 6);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.name = "Runas flotantes";
    group.add(mesh);
    return mesh;
  });
  const sealMaterial = new THREE.MeshBasicMaterial({
    map: sealTexture, color: DEFAULT_MAGIC_SETTINGS.color, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1
  });
  const seal = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), sealMaterial);
  seal.name = "Sello arcano";
  seal.rotation.x = -Math.PI / 2;
  seal.position.y = 0.08;
  group.add(seal);

  const pointGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(160 * 3);
  const colors = new Float32Array(160 * 3);
  pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  pointGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
  const pointMaterial = new THREE.PointsMaterial({
    color: DEFAULT_MAGIC_SETTINGS.color, size: 0.045, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, vertexColors: true, toneMapped: false
  });
  const particles = new THREE.Points(pointGeometry, pointMaterial);
  particles.name = "Polvo arcano";
  particles.frustumCulled = false;
  group.add(particles);
  const light = new THREE.PointLight(DEFAULT_MAGIC_SETTINGS.color, 0, 12, 2);
  light.position.y = 1;
  group.add(light);
  const dummy = new THREE.Object3D(), shade = new THREE.Color();
  const fract = value => value - Math.floor(value);

  group.userData.animate = (settings, time, camera, floorVisible = true) => {
    const config = settings || DEFAULT_MAGIC_SETTINGS;
    group.visible = Boolean(config.enabled && config.intensity > 0 && (config.runes || config.particles));
    if (!group.visible) return;
    const seconds = time * 0.001 * config.speed;
    group.position.set(config.x, 0, config.z);
    runeMaterial.color.set(config.color);
    runeMaterial.opacity = 0.6 * config.intensity;
    sealMaterial.color.set(config.color);
    sealMaterial.opacity = config.intensity * (0.13 + Math.sin(seconds * 1.4) * 0.025);
    seal.visible = config.runes && floorVisible;
    seal.scale.setScalar(config.radius);
    seal.rotation.z = seconds * 0.06;
    const runeCount = Math.min(24, Math.ceil(config.count / 6));
    runes.forEach((mesh, variant) => {
      mesh.visible = config.runes;
      mesh.count = Math.max(0, Math.ceil((runeCount - variant) / 4));
      for (let instance = 0; instance < mesh.count; instance += 1) {
        const i = instance * 4 + variant;
        const life = fract(i * 0.618034 + seconds * 0.075);
        const angle = i * 2.39996 + seconds * (0.06 + fract(i * 0.17) * 0.07);
        const radius = config.radius * (0.45 + fract(i * 0.731 + 0.2) * 0.5);
        dummy.position.set(Math.cos(angle) * radius, 0.18 + life * config.height, Math.sin(angle) * radius);
        dummy.quaternion.copy(camera.quaternion);
        dummy.rotateZ(Math.sin(seconds + i) * 0.13);
        dummy.scale.setScalar(0.7 + fract(i * 0.31 + 0.1) * 0.5);
        dummy.updateMatrix();
        mesh.setMatrixAt(instance, dummy.matrix);
        mesh.setColorAt(instance, shade.setScalar(Math.sin(life * Math.PI) ** 2));
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
    particles.visible = config.particles;
    pointMaterial.color.set(config.color);
    pointMaterial.opacity = config.intensity * 0.8;
    pointGeometry.setDrawRange(0, config.count);
    for (let i = 0; i < config.count; i += 1) {
      const life = fract(i * 0.618034 + seconds * (0.06 + fract(i * 0.17) * 0.06));
      const angle = i * 2.39996 + seconds * 0.12 + Math.sin(life * 4 + i) * 0.3;
      const radius = config.radius * Math.sqrt(fract(i * 0.731 + 0.13));
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0.12 + life * config.height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      const alpha = Math.sin(Math.PI * life) ** 2;
      colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = alpha;
    }
    pointGeometry.attributes.position.needsUpdate = true;
    pointGeometry.attributes.color.needsUpdate = true;
    light.color.set(config.color);
    light.distance = config.radius * 2 + 4;
    light.intensity = config.intensity * (2.4 + Math.sin(seconds * 1.4) * 0.2);
  };
  group.userData.dispose = () => {
    runes.forEach(mesh => { mesh.dispose(); mesh.geometry.dispose(); });
    [seal.geometry, pointGeometry].forEach(geometry => geometry.dispose());
    [runeMaterial, sealMaterial, pointMaterial].forEach(material => material.dispose());
    atlas.dispose(); sealTexture.dispose();
  };
  return group;
}
