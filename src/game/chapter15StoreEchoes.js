import * as THREE from "three";

// A memory of the ruined shop, never a replacement for its intact geometry.
// Owned/disposed by the chapter-15 visual root; no colliders or extra loop.
export function createChapter15StoreEchoes(parent) {
  const root = new THREE.Group();
  root.name = "chapter15-future-echoes";
  root.visible = false;
  parent.add(root);
  const spectral = new THREE.MeshBasicMaterial({ color: 0xc5a3ff, transparent: true,
    opacity: .32, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const cracks = [];
  function fissure(points, width, wall = false) {
    for (let i = 1; i < points.length; i++) {
      const [a, b] = [points[i - 1], points[i]];
      const shift = wall ? [0, width, 0] : [width, 0, 0];
      const c = b.map((v, j) => v + shift[j]), d = a.map((v, j) => v + shift[j]);
      cracks.push(...a, ...b, ...c, ...a, ...c, ...d);
    }
  }
  // Slightly above the original floor / in front of the wall: no z-fighting.
  fissure([[-.5,.018,8],[-.9,.018,6.5],[-.4,.018,5.5],[-1.3,.018,3.8],[-.8,.018,2.7],[-1.8,.018,1.3]], .028);
  fissure([[-1.3,.019,3.8],[-2.2,.019,4.3],[-2.8,.019,3.6]], .018);
  fissure([[-10.864,3.9,5.9],[-10.864,3.1,6.3],[-10.864,2.6,5.7],[-10.864,1.9,6.1],[-10.864,1.15,5.5]], .035, true);
  fissure([[-10.863,2.6,5.7],[-10.863,2.85,4.9],[-10.863,2.3,4.3]], .02, true);
  const crackGeometry = new THREE.BufferGeometry();
  crackGeometry.setAttribute("position", new THREE.Float32BufferAttribute(cracks, 3));
  const fractures = new THREE.Mesh(crackGeometry, spectral);
  fractures.name = "chapter15-future-fractures";
  root.add(fractures);

  const outline = new THREE.LineBasicMaterial({ color: 0xd3b6ff, transparent: true,
    opacity: .38, depthWrite: false, toneMapped: false });
  const contours = [];
  function brokenBoard(size, position, rotation) {
    const box = new THREE.BoxGeometry(...size), edges = new THREE.EdgesGeometry(box);
    const transform = new THREE.Matrix4().compose(new THREE.Vector3(...position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), new THREE.Vector3(1,1,1));
    edges.applyMatrix4(transform);
    contours.push(...edges.attributes.position.array);
    edges.dispose(); box.dispose();
  }
  // One fallen display and loose records, located beside the living shop's bins.
  brokenBoard([2.1,.075,1.05], [6.4,.22,4.7], [.12,.3,.11]);
  brokenBoard([1.1,.075,.95], [7.2,.38,4.4], [.22,-.4,.58]);
  brokenBoard([.07,.65,1.05], [5.5,.35,4.9], [.1,.3,.35]);
  for (let disc = 0; disc < 5; disc++) {
    const x = 5.8 + disc * .37, z = 6.1 + Math.sin(disc * 2) * .35;
    for (let segment = 0; segment < 24; segment++) {
      const a = segment / 24 * Math.PI * 2, b = (segment + 1) / 24 * Math.PI * 2;
      contours.push(x + Math.cos(a) * .26, .035, z + Math.sin(a) * .26,
        x + Math.cos(b) * .26, .035, z + Math.sin(b) * .26);
    }
  }
  const contourGeometry = new THREE.BufferGeometry();
  contourGeometry.setAttribute("position", new THREE.Float32BufferAttribute(contours, 3));
  const debris = new THREE.LineSegments(contourGeometry, outline);
  debris.name = "chapter15-fallen-display-echo";
  root.add(debris);

  const ashGeometry = new THREE.BufferGeometry(), ash = [];
  for (let i = 0; i < 16; i++) ash.push(5.3 + (i * .731) % 2.8, .15 + (i * .173) % 1.4, 4 + (i * .413) % 2.5);
  ashGeometry.setAttribute("position", new THREE.Float32BufferAttribute(ash, 3));
  const ashMaterial = new THREE.PointsMaterial({ color: 0xe4d3ff, size: .025, transparent: true,
    opacity: .3, depthWrite: false, toneMapped: false });
  const motes = new THREE.Points(ashGeometry, ashMaterial);
  root.add(motes);
  root.traverse(object => { object.userData.chapter15Effect = true; object.userData.invasionVisionPreserve = true; });
  return {
    root,
    update(time, visible, reducedMotion) {
      root.visible = visible;
      if (!visible) return;
      const breath = reducedMotion ? .85 : .8 + Math.sin(time * .65) * .2;
      spectral.opacity = .32 * breath; outline.opacity = .38 * breath;
      ashMaterial.opacity = .3 * breath;
      motes.position.y = reducedMotion ? 0 : Math.sin(time * .4) * .09;
    },
  };
}
