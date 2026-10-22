import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// These assemblies stay inside the existing editable slots. Small details are
// merged by material; they do not each require a separate draw call or shadow.
export function createStudioFurnishings({ mats, box, cylinder, colliders }) {
  function rounded(parent, name, w, h, d, x, y, z, material, radius = 0.04) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 2, h / 2, d / 2)), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function bar(parent, name, start, end, radius, material) {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
    const mesh = cylinder(parent, name, radius, a.distanceTo(b), 0, 0, 0, material, 8);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
    return mesh;
  }
  function seam(parent, points, material = mats.piping, radius = 0.008, closed = false) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, "centripetal");
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, points.length * 3, radius, 5, closed), material);
    parent.add(mesh);
    return mesh;
  }
  function batch(parent) {
    const groups = new Map(), solid = new Set(colliders);
    for (const mesh of [...parent.children]) {
      if (!mesh.isMesh || solid.has(mesh)) continue;
      mesh.updateMatrix();
      const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrix);
      if (!groups.has(mesh.material)) groups.set(mesh.material, []);
      groups.get(mesh.material).push(geometry);
      parent.remove(mesh);
    }
    for (const [material, geometries] of groups) {
      const geometry = mergeGeometries(geometries, false);
      geometries.forEach((item) => item.dispose());
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = parent.name + " / " + (material.name || "details");
      mesh.castShadow = !material.isMeshBasicMaterial;
      mesh.receiveShadow = true;
      parent.add(mesh);
    }
  }

  function rack(parent) {
    box(parent, "outboard cabinet", 1.28, 2.45, 3.9, 0, 1.25, 0, mats.dark, true);
    for (const z of [-1.97, 1.97]) rounded(parent, "walnut rack cheek", 1.32, 2.5, 0.09, 0, 1.27, z, mats.walnut, 0.025);
    rounded(parent, "rack top", 1.34, 0.09, 4.02, 0, 2.54, 0, mats.walnut, 0.025);
    for (const bay of [-1.25, 0, 1.25]) {
      for (const edge of [-0.59, 0.59]) box(parent, "rack mounting rail", 0.05, 2.17, 0.035, 0.668, 1.27, bay + edge, mats.steel);
      for (let row = 0; row < 6; row++) {
        const y = 2.21 - row * 0.315;
        const geometry = new THREE.PlaneGeometry(1.13, 0.28);
        const uv = geometry.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - (row + 1 - uv.getY(i)) / 6);
        const face = new THREE.Mesh(geometry, mats.rackFace);
        face.position.set(0.68, y, bay);
        face.rotation.y = Math.PI / 2;
        parent.add(face);
        for (let knob = 0; knob < 3; knob++) {
          const z = bay - ((595 + knob * 139) / 1024 - 0.5) * 1.13;
          const ky = y - 0.009;
          cylinder(parent, "knob collar", 0.035, 0.012, 0.691, ky, z, mats.steel, 12).rotation.z = Math.PI / 2;
          cylinder(parent, "rotary control", 0.027, 0.045, 0.713, ky, z, mats.rubber, 12).rotation.z = Math.PI / 2;
          box(parent, "control indicator", 0.003, 0.015, 0.004, 0.738, ky + 0.013, z, mats.cream);
        }
        box(parent, "bypass switch", 0.03, 0.024, 0.035, 0.702, y - 0.025, bay - 0.493, mats.charcoal);
        box(parent, "status LED", 0.01, 0.012, 0.012, 0.704, y + 0.025, bay - 0.493, row % 3 ? mats.greenLed : mats.amberLed);
      }
      for (let i = 0; i < 13; i++) box(parent, "rack ventilation", 0.008, 0.014, 0.76, 0.684, 0.21 + i * 0.013, bay, mats.charcoal);
      for (const z of [bay - 0.47, bay + 0.47]) {
        bar(parent, "rack grab handle", [0.755, 0.27, z], [0.755, 0.46, z], 0.018, mats.steel);
        bar(parent, "handle mount", [0.68, 0.27, z], [0.755, 0.27, z], 0.018, mats.steel);
        bar(parent, "handle mount", [0.68, 0.46, z], [0.755, 0.46, z], 0.018, mats.steel);
      }
    }
    for (const x of [-0.48, 0.48]) for (const z of [-1.7, 1.7]) cylinder(parent, "rack isolation foot", 0.07, 0.07, x, 0.035, z, mats.rubber);
    batch(parent);
  }

  function sofa(parent) {
    box(parent, "sofa internal frame", 2.7, 0.31, 1.18, 0, 0.43, 0, mats.leather, true);
    rounded(parent, "walnut sofa plinth", 2.73, 0.12, 1.23, 0, 0.23, 0, mats.walnut);
    rounded(parent, "upholstered sofa base", 2.79, 0.3, 1.29, 0, 0.49, 0, mats.leather, 0.1);
    rounded(parent, "sofa back shell", 2.79, 1.02, 0.29, 0, 0.96, 0.51, mats.leather, 0.1);
    for (const x of [-1.26, 1.26]) {
      rounded(parent, "rolled leather arm", 0.32, 0.63, 1.35, x, 0.78, -0.015, mats.leather, 0.14);
      seam(parent, [[x, 0.98, -0.62], [x, 1.065, -0.5], [x, 1.085, 0.4], [x, 1.01, 0.56]]);
    }
    for (const x of [-0.74, 0, 0.74]) {
      rounded(parent, "soft leather seat", 0.72, 0.22, 0.97, x, 0.7, -0.11, mats.leatherHighlight, 0.09);
      const back = rounded(parent, "padded leather back", 0.72, 0.68, 0.22, x, 1.095, 0.30, mats.leatherHighlight, 0.085);
      back.rotation.x = -0.11;
      seam(parent, [[x - 0.31, 0.76, -0.53], [x, 0.78, -0.57], [x + 0.31, 0.76, -0.53], [x + 0.33, 0.76, 0.27], [x + 0.28, 0.76, 0.32], [x - 0.28, 0.76, 0.32], [x - 0.33, 0.76, 0.27]], mats.piping, 0.006, true);
      seam(parent, [[x - 0.29, 0.82, 0.16], [x - 0.31, 1.3, 0.20], [x, 1.39, 0.21], [x + 0.31, 1.3, 0.20], [x + 0.29, 0.82, 0.16]], mats.piping, 0.006);
      for (const dx of [-0.17, 0.17]) cylinder(parent, "leather tuft button", 0.017, 0.012, x + dx, 1.12, 0.179, mats.leather, 8).rotation.x = Math.PI / 2;
    }
    for (const x of [-1.1, 1.1]) for (const z of [-0.49, 0.49]) {
      cylinder(parent, "sofa brushed foot", 0.055, 0.17, x, 0.095, z, mats.steel);
      cylinder(parent, "sofa foot pad", 0.06, 0.024, x, 0.012, z, mats.rubber);
    }
    const pillow = rounded(parent, "woven sofa pillow", 0.43, 0.43, 0.15, -0.86, 0.99, -0.04, mats.felt, 0.075);
    pillow.rotation.set(-0.18, -0.12, 0.22);
    batch(parent);
  }

  function desk(parent) {
    const top = rounded(parent, "solid walnut desktop", 2.02, 0.11, 1.44, 0, 1.035, 0, mats.walnut, 0.035);
    colliders.push(top);
    rounded(parent, "desktop front moulding", 1.96, 0.06, 0.055, 0, 1.025, 0.716, mats.timberLight, 0.02);
    box(parent, "desk modesty panel", 1.73, 0.38, 0.05, 0, 0.77, -0.60, mats.timber);
    rounded(parent, "desk drawer pedestal", 0.44, 0.91, 1.17, 0.70, 0.52, 0, mats.walnut);
    for (let row = 0; row < 3; row++) {
      const y = 0.85 - row * 0.27;
      rounded(parent, "drawer front", 0.40, 0.24, 0.035, 0.70, y, 0.604, mats.timber, 0.012);
      bar(parent, "drawer handle", [0.59, y + 0.035, 0.65], [0.81, y + 0.035, 0.65], 0.012, mats.steel);
      for (const x of [0.59, 0.81]) bar(parent, "handle anchor", [x, y + 0.035, 0.62], [x, y + 0.035, 0.65], 0.012, mats.steel);
    }
    for (const z of [-0.54, 0.54]) {
      rounded(parent, "desk tubular leg", 0.065, 0.96, 0.065, -0.87, 0.5, z, mats.steel, 0.02);
      cylinder(parent, "desk levelling foot", 0.05, 0.04, -0.87, 0.025, z, mats.rubber);
    }
    bar(parent, "desk cross brace", [-0.87, 0.2, -0.54], [-0.87, 0.2, 0.54], 0.025, mats.steel);
    box(parent, "keyboard tray", 1.1, 0.045, 0.43, -0.25, 0.86, 0.47, mats.timberLight);
    for (const x of [-0.78, 0.28]) box(parent, "keyboard runner", 0.018, 0.03, 0.53, x, 0.9, 0.38, mats.steel);
    rounded(parent, "mouse mat", 0.35, 0.008, 0.33, 0.18, 1.094, 0.40, mats.rubber, 0.003);
    cylinder(parent, "desktop cable grommet", 0.055, 0.01, 0.8, 1.096, -0.50, mats.rubber, 12);
    for (let n = 0; n < 3; n++) {
      box(parent, "session notebook", 0.26, 0.023, 0.34, 0.67, 1.108 + n * 0.025, -0.25, n === 1 ? mats.cream : mats.felt);
    }
    batch(parent);
  }

  function guitarStand(parent, { cradleHeight = 0.215, backZ = -0.09 } = {}) {
    // Local +Z is the guitar's front; the slot turns the whole assembly together.
    // A low folding A-frame supports the body instead of intersecting the neck.
    const details = new THREE.Group();
    details.name = "padded folding guitar stand";
    parent.add(details);
    for (const side of [-1, 1]) {
      const x = side * 0.26;
      bar(details, "A-frame front leg", [x, 0.055, 0.32], [side * 0.20, 0.65, -0.17], 0.022, mats.dark);
      bar(details, "A-frame rear leg", [x, 0.055, -0.34], [side * 0.20, 0.65, -0.17], 0.022, mats.dark);
      for (const z of [-0.34, 0.32]) bar(details, "non-slip foot", [x - 0.047, 0.04, z], [x + 0.047, 0.04, z], 0.032, mats.rubber);
      bar(details, "padded body cradle", [side * 0.19, cradleHeight, -0.07], [side * 0.19, cradleHeight, 0.22], 0.027, mats.rubber);
      bar(details, "cradle stop", [side * 0.19, cradleHeight, 0.22], [side * 0.19, cradleHeight + 0.075, 0.245], 0.027, mats.rubber);
      const alongLeg = (cradleHeight - 0.055) / 0.595;
      const legX = side * (0.26 - alongLeg * 0.06), legZ = 0.32 - alongLeg * 0.49;
      bar(details, "cradle mounting bracket", [legX, cradleHeight, legZ], [side * 0.19, cradleHeight, legZ], 0.02, mats.dark);
      bar(details, "back cushion mount", [side * 0.20, 0.65, -0.17], [side * 0.20, 0.65, backZ], 0.02, mats.dark);
      cylinder(details, "stand hinge", 0.035, 0.035, side * 0.20, 0.65, -0.17, mats.steel).rotation.z = Math.PI / 2;
    }
    bar(details, "padded back support", [-0.20, 0.65, backZ], [0.20, 0.65, backZ], 0.032, mats.rubber);
    bar(details, "folding spreader", [-0.26, 0.13, -0.24], [0.26, 0.13, -0.24], 0.012, mats.steel);
    batch(details);
  }

  function acousticPanel(parent, x, y, z, rotation, variant = 0) {
    const group = new THREE.Group();
    group.name = "fabric lined acoustic diffuser";
    group.position.set(x, y, z); group.rotation.y = rotation;
    parent.add(group);
    box(group, "acoustic shadow gap", 1.7, 2.65, 0.06, 0, 0, 0, mats.rubber);
    rounded(group, "woven absorber", 1.55, 2.5, 0.14, 0, 0, 0.075, mats.acousticFabric, 0.04);
    for (const side of [-1, 1]) {
      box(group, "oak acoustic frame", 0.055, 2.65, 0.22, side * 0.835, 0, 0.075, mats.walnut);
      box(group, "oak acoustic frame", 1.62, 0.055, 0.22, 0, side * 1.3, 0.075, mats.walnut);
    }
    if (variant % 3 !== 1) for (let i = -4; i <= 4; i++) {
      const depth = 0.06 + ((i + 4) * (i + 4) % 7) * 0.018;
      rounded(group, "solid oak diffuser fin", 0.075, 2.42, depth, i * 0.168, 0, 0.16 + depth / 2, i % 3 ? mats.timber : mats.timberLight, 0.008);
    }
    else {
      // The occasional fabric absorber breaks up the repeated striped panels.
      for (const dx of [-0.69, 0.69]) for (const dy of [-1.16, 1.16]) cylinder(group, "panel fastening", 0.016, 0.012, dx, dy, 0.155, mats.steel, 8).rotation.x = Math.PI / 2;
      box(group, "absorber maker plate", 0.2, 0.045, 0.008, 0.53, -1.15, 0.155, mats.brass);
    }
    batch(group);
  }

  function rug(parent, name, w, d, x, y, z) {
    const group = new THREE.Group(); group.name = name; group.position.set(x, y, z); parent.add(group);
    rounded(group, "woven bound edge", w, 0.026, d, 0, 0, 0, mats.piping, 0.01);
    const surface = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.035, d - 0.035), mats.rug);
    surface.rotation.x = -Math.PI / 2; surface.position.y = 0.014; surface.receiveShadow = true;
    group.add(surface);
    // Short, irregular tassels live along the ends, clear of the walking routes.
    for (let i = 0; i < Math.floor(w / 0.075); i++) for (const end of [-1, 1]) {
      box(group, "rug fringe", 0.024, 0.006, 0.07 + (i % 3) * 0.012, -w / 2 + 0.05 + i * 0.075, 0, end * (d / 2 + 0.025), mats.cream);
    }
    batch(group);
  }
  return { rack, sofa, desk, guitarStand, acousticPanel, rug };
}
