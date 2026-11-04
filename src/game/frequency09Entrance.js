import * as THREE from "three";

// Lives in the existing Arcade renderer. No second canvas or postprocessing pass.
export function createFrequency09Entrance(machine) {
  const portal = new THREE.Group(); portal.position.set(0, 1.52, .57);
  portal.visible = false; machine.add(portal);
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const material = new THREE.MeshBasicMaterial({ color: i === 1 ? 0x83dfe9 : 0xed74cb,
      transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.62 + i * .13, .009, 4, 48, Math.PI * 1.8), material);
    ring.position.z = i * .025; portal.add(ring); rings.push(ring);
  }
  const streakMaterial = new THREE.MeshBasicMaterial({ color: 0xa0d9ef, transparent: true,
    opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const streaks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), streakMaterial, 48);
  streaks.frustumCulled = false; portal.add(streaks);
  const transform = new THREE.Object3D();
  const start = new THREE.Vector3(), startLook = new THREE.Vector3(), target = new THREE.Vector3();
  const end = new THREE.Vector3(), focus = new THREE.Vector3(), direction = new THREE.Vector3();
  let age = 0, started = false;
  return {
    update(dt, camera, reducedMotion) {
      if (!started) {
        start.copy(camera.position); camera.getWorldDirection(direction);
        startLook.copy(start).addScaledVector(direction, 4); started = true;
      }
      age += dt;
      const t = Math.min(1, age / 5.4), ease = t * t * (3 - 2 * t);
      machine.updateWorldMatrix(true, false);
      focus.set(0, 1.52, .57); machine.localToWorld(focus);
      end.set(0, 1.54, 1.18); machine.localToWorld(end);
      // Skip automatic travel for reduced motion; the UI fades still bridge the scenes.
      if (!reducedMotion) {
        camera.position.lerpVectors(start, end, ease);
        camera.lookAt(target.lerpVectors(startLook, focus, Math.min(1, t * 2.4)));
        camera.fov = 63 - ease * 13; camera.updateProjectionMatrix();
        camera.rotateZ(Math.sin(age * 1.8) * .009 * Math.sin(t * Math.PI));
      }
      portal.visible = !reducedMotion;
      rings.forEach((ring, i) => {
        ring.rotation.z = age * (i === 1 ? -.55 : .38) + i * 2;
        ring.scale.setScalar(1 + ease * .65);
        ring.material.opacity = Math.sin(t * Math.PI) * .55;
      });
      streakMaterial.opacity = Math.sin(t * Math.PI) * .45;
      for (let i = 0; i < 48; i++) {
        const travel = ((i / 48 + age * .27) % 1), radius = .2 + travel * 1.6;
        const angle = i * 2.399;
        transform.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * .7, travel * 3.1);
        transform.scale.set(.008, .008, .06 + travel * .24);
        transform.updateMatrix(); streaks.setMatrixAt(i, transform.matrix);
      }
      streaks.instanceMatrix.needsUpdate = true;
      return t;
    },
  };
}
