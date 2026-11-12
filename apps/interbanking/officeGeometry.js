import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export function createOfficeGeometry(world, materials) {
  const geometries = new Map();
  function cached(key, factory) {
    if (!geometries.has(key)) geometries.set(key, factory());
    return geometries.get(key);
  }
  function mesh(parent, geometry, material, x = 0, y = 0, z = 0, castShadow = true) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.castShadow = castShadow;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(parent, x, y, z, w, h, d, material, radius = 0) {
    const geometry = cached(`box:${w}:${h}:${d}:${radius}`, () => radius
      ? new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 2, h / 2, d / 2))
      : new THREE.BoxGeometry(w, h, d));
    return mesh(parent, geometry, material, x, y, z, h > .08 && y < 3.25);
  }
  function cylinder(parent, x, y, z, top, bottom, height, material, sides = 16) {
    return mesh(parent, cached(`cyl:${top}:${bottom}:${height}:${sides}`, () => new THREE.CylinderGeometry(top, bottom, height, sides)), material, x, y, z);
  }
  function shadow(x, z, width, depth) {
    const object = mesh(world, cached("shadow-plane", () => new THREE.PlaneGeometry(1, 1)), materials.contactShadow, x, .019, z, false);
    object.rotation.x = -Math.PI / 2;
    object.scale.set(width, depth, 1);
    object.receiveShadow = false;
    return object;
  }
  function tube(parent, key, points, radius, material, segments = 12) {
    return mesh(parent, cached(key, () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point))), segments, radius, 5, false)), material);
  }
  function batch() {
    world.updateMatrixWorld(true);
    const inverse = new THREE.Matrix4().copy(world.matrixWorld).invert(), matrix = new THREE.Matrix4();
    const groups = new Map();
    world.traverse(object => {
      if (!object.isMesh || object.isInstancedMesh || Array.isArray(object.material) || object.material.transparent) return;
      const key = `${object.geometry.uuid}:${object.material.uuid}:${object.castShadow}:${object.receiveShadow}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(object);
    });
    for (const objects of groups.values()) {
      if (objects.length < 3) continue;
      const first = objects[0], instances = new THREE.InstancedMesh(first.geometry, first.material, objects.length);
      instances.name = "Elementos repetidos de oficina";
      instances.castShadow = first.castShadow;
      instances.receiveShadow = first.receiveShadow;
      objects.forEach((object, i) => {
        matrix.multiplyMatrices(inverse, object.matrixWorld);
        instances.setMatrixAt(i, matrix);
        object.removeFromParent();
      });
      instances.instanceMatrix.needsUpdate = true;
      instances.computeBoundingSphere();
      world.add(instances);
    }
  }
  return { box, cylinder, mesh, cached, shadow, tube, batch };
}
