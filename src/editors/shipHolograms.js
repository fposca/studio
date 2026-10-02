import * as THREE from "three";

export function createShipHolograms() {
  const group = new THREE.Group();
  group.name = "Proyecciones interactivas de Space Ship";
  const geometries = new Set();
  const materials = new Set();
  const targets = [];
  const modes = { anatomy: 0, orbit: 0, navigation: 0 };
  let hovered = null;

  const hologramMaterial = (color) => {
    const material = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, color: { value: new THREE.Color(color) }, strength: { value: 1 } },
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vView;
        varying vec3 vWorld;
        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = -viewPosition.xyz;
          vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float strength;
        uniform vec3 color;
        varying vec3 vNormal;
        varying vec3 vView;
        varying vec3 vWorld;
        void main() {
          float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.0);
          float scan = smoothstep(0.78, 1.0, sin(vWorld.y * 74.0 - time * 3.0) * 0.5 + 0.5);
          float alpha = (0.045 + rim * 0.36 + scan * 0.11) * strength;
          gl_FragColor = vec4(color * (0.75 + rim * 0.4), alpha);
        }
      `
    });
    materials.add(material);
    return material;
  };
  const anatomyMaterial = hologramMaterial(0x72ddc1);
  const orbitMaterial = hologramMaterial(0x69cce2);
  const navigationMaterial = hologramMaterial(0xdac393);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x91ddd1, transparent: true, opacity: 0.55, depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const scanMaterial = new THREE.MeshBasicMaterial({
    color: 0x8df0d5, transparent: true, opacity: 0.45, depthWrite: false,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending
  });
  const hitMaterial = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  materials.add(lineMaterial);
  materials.add(scanMaterial);
  materials.add(hitMaterial);

  const mesh = (parent, geometry, material, position = [0, 0, 0], scale = [1, 1, 1]) => {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position);
    object.scale.set(...scale);
    parent.add(object);
    geometries.add(geometry);
    return object;
  };
  const line = (parent, points, closed = false) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(...point)));
    const object = closed ? new THREE.LineLoop(geometry, lineMaterial) : new THREE.Line(geometry, lineMaterial);
    parent.add(object);
    geometries.add(geometry);
    return object;
  };
  const circle = (parent, radius, y = 0) => line(parent, Array.from({ length: 64 }, (_, index) => {
    const angle = index / 64 * Math.PI * 2;
    return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
  }), true);
  const link = (parent, a, b, radius, material) => {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = end.clone().sub(start);
    const object = mesh(parent, new THREE.CylinderGeometry(radius, radius, direction.length(), 8), material);
    object.position.copy(start.add(end).multiplyScalar(0.5));
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return object;
  };
  const target = (id, position, size) => {
    const object = mesh(group, new THREE.BoxGeometry(...size), hitMaterial, position);
    object.name = "Holograma interactivo " + id;
    object.userData.shipInteraction = id;
    targets.push(object);
  };

  const human = new THREE.Group();
  human.name = "Holograma anatomico";
  human.position.set(-7.4, 3.6, -7.4);
  group.add(human);
  const silhouette = new THREE.Group();
  human.add(silhouette);
  mesh(silhouette, new THREE.SphereGeometry(0.22, 20, 16), anatomyMaterial, [0, 1.1, 0], [0.83, 1.15, 0.88]);
  mesh(silhouette, new THREE.SphereGeometry(1, 20, 16), anatomyMaterial, [0, 0.52, 0], [0.32, 0.49, 0.18]);
  mesh(silhouette, new THREE.SphereGeometry(1, 16, 12), anatomyMaterial, [0, -0.04, 0], [0.26, 0.22, 0.18]);
  const skeleton = new THREE.Group();
  human.add(skeleton);
  link(skeleton, [0, -0.16, 0], [0, 0.91, 0], 0.018, anatomyMaterial);
  for (const side of [-1, 1]) {
    const joints = [
      [[side * 0.29, 0.85, 0], [side * 0.49, 0.25, 0], 0.082],
      [[side * 0.49, 0.25, 0], [side * 0.43, -0.25, 0.04], 0.061],
      [[side * 0.16, -0.15, 0], [side * 0.2, -0.72, 0], 0.103],
      [[side * 0.2, -0.72, 0], [side * 0.19, -1.24, 0.035], 0.073]
    ];
    joints.forEach(([a, b, radius]) => {
      link(silhouette, a, b, radius, anatomyMaterial);
      link(skeleton, a, b, 0.021, anatomyMaterial);
      mesh(skeleton, new THREE.SphereGeometry(0.036, 8, 6), anatomyMaterial, a);
    });
    mesh(silhouette, new THREE.SphereGeometry(1, 12, 8), anatomyMaterial,
      [side * 0.19, -1.27, 0.08], [0.09, 0.055, 0.17]);
    for (let index = 0; index < 6; index += 1) {
      const y = 0.3 + index * 0.084;
      line(skeleton, Array.from({ length: 20 }, (_, point) => {
        const angle = point / 19 * Math.PI;
        return [side * Math.sin(angle) * (0.23 + index * 0.004), y + Math.cos(angle) * 0.035, Math.sin(angle) * 0.13];
      }));
    }
  }
  const humanScan = mesh(human, new THREE.RingGeometry(0.43, 0.57, 48), scanMaterial);
  humanScan.rotation.x = -Math.PI / 2;
  circle(human, 0.62, -1.46);
  target("anatomy", [-7.4, 3.6, -7.4], [1.4, 3.15, 1.4]);

  const orbital = new THREE.Group();
  orbital.name = "Holograma orbital";
  orbital.position.set(7.4, 3.8, -8.2);
  group.add(orbital);
  const planet = mesh(orbital, new THREE.SphereGeometry(0.8, 32, 24), orbitMaterial);
  const mapGrid = new THREE.Group();
  orbital.add(mapGrid);
  for (let latitude = -2; latitude <= 2; latitude += 1) {
    const height = latitude * 0.24;
    circle(mapGrid, Math.sqrt(0.82 ** 2 - height ** 2), height);
  }
  for (let longitude = 0; longitude < 6; longitude += 1) {
    const meridian = circle(mapGrid, 0.82);
    meridian.rotation.z = Math.PI / 2;
    meridian.rotation.y = longitude / 6 * Math.PI;
  }
  const orbits = new THREE.Group();
  orbital.add(orbits);
  const orbitA = circle(orbits, 1.38);
  orbitA.rotation.z = 0.32;
  const orbitB = circle(orbits, 1.15);
  orbitB.rotation.x = 0.65;
  const satellite = mesh(orbits, new THREE.SphereGeometry(0.105, 12, 8), orbitMaterial);
  circle(orbital, 1.1, -1.3);
  target("orbit", [7.4, 3.8, -8.2], [3.05, 2.85, 3.05]);

  const navigation = new THREE.Group();
  navigation.name = "Holograma de navegacion";
  navigation.position.set(0, 4.95, -16.1);
  group.add(navigation);
  const ship = new THREE.Group();
  navigation.add(ship);
  mesh(ship, new THREE.SphereGeometry(1, 16, 12), navigationMaterial, [0, 0, 0], [0.22, 0.16, 0.98]);
  const wings = [];
  for (const side of [-1, 1]) {
    const wing = mesh(ship, new THREE.ConeGeometry(0.6, 1.05, 3), navigationMaterial,
      [side * 0.38, -0.015, 0.2], [1, 1, 0.13]);
    wing.rotation.x = Math.PI / 2;
    wings.push(wing);
    const engine = mesh(ship, new THREE.CylinderGeometry(0.12, 0.14, 0.5, 12), navigationMaterial,
      [side * 0.32, 0, 0.69]);
    engine.rotation.x = Math.PI / 2;
  }
  const navigationRing = circle(navigation, 1.35, -0.4);
  navigationRing.rotation.z = 0.14;
  target("navigation", [0, 4.95, -16.1], [3, 2.25, 3]);

  const descriptions = {
    anatomy: ["Anatomia: escaneo corporal", "Anatomia: estructura interna"],
    orbit: ["Orbitas: seguimiento planetario", "Orbitas: cartografia de superficie"],
    navigation: ["Navegacion: vuelo orbital", "Navegacion: diagnostico de sistemas"]
  };
  const setMode = (id) => {
    if (id === "anatomy") silhouette.visible = modes.anatomy === 0;
    if (id === "orbit") orbits.visible = modes.orbit === 0;
  };
  group.userData.targets = targets;
  group.userData.getState = () => ({ ...modes });
  group.userData.hover = (id) => { hovered = Object.hasOwn(modes, id) ? id : null; };
  group.userData.activate = (id) => {
    if (!group.visible || !Object.hasOwn(modes, id)) return null;
    modes[id] = (modes[id] + 1) % 2;
    setMode(id);
    return descriptions[id][modes[id]];
  };
  group.userData.animate = (time, active, reduced = false) => {
    group.visible = active;
    if (!active) { hovered = null; return; }
    const seconds = time * 0.001;
    [anatomyMaterial, orbitMaterial, navigationMaterial].forEach((material, index) => {
      const id = ["anatomy", "orbit", "navigation"][index];
      material.uniforms.time.value = seconds;
      material.uniforms.strength.value = hovered === id ? 1.6 : 1;
    });
    human.rotation.y = Math.sin(seconds * Math.PI / 10) * 0.3;
    humanScan.position.y = -1.32 + (seconds % 6) / 6 * 2.7;
    humanScan.visible = modes.anatomy === 0;
    scanMaterial.opacity = 0.24 + Math.sin((seconds % 6) / 6 * Math.PI) * 0.3;
    planet.rotation.y = seconds * Math.PI / 16;
    mapGrid.rotation.y = seconds * Math.PI / 24;
    satellite.position.set(Math.cos(seconds * Math.PI / 6) * 1.38,
      Math.cos(seconds * Math.PI / 6) * 0.43, Math.sin(seconds * Math.PI / 6) * 1.38);
    orbitB.visible = !reduced;
    ship.rotation.y = seconds * Math.PI / 12;
    ship.rotation.z = Math.sin(seconds * Math.PI / 8) * 0.1;
    wings.forEach((wing, index) => {
      wing.position.x = (index ? 1 : -1) * (modes.navigation ? 0.67 : 0.38);
    });
  };
  group.userData.dispose = () => {
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
  };
  return group;
}
