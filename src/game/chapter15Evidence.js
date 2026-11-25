import * as THREE from "three";
import { disposeObjects } from "./disposeGameObjects.js";

// Physical evidence belongs to existing furniture slots, including editor transforms.
export function createChapter15Evidence(base, interactions) {
  const desk = base.slots.get("pc-table").assembly;
  const consoleSlot = base.slots.get("console");
  const note = new THREE.Group(), tape = new THREE.Group();
  note.name = "chapter15-hugo-note"; tape.name = "chapter15-altered-tape";
  desk.add(note); consoleSlot.assembly.add(tape);
  note.position.set(.68, 1.092, .44); note.rotation.y = -.12;
  tape.position.set(2.65, 1.32, .79);
  const paper = new THREE.MeshStandardMaterial({ color: 0xe8d9b2, roughness: .88 });
  const shell = new THREE.MeshStandardMaterial({ color: 0x25232a, metalness: .24, roughness: .36 });
  const hub = new THREE.MeshStandardMaterial({ color: 0xc2b7a1, metalness: .4, roughness: .3 });
  const addBox = (parent, w, h, d, y, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.y = y; mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  addBox(note, .42, .004, .30, .002, paper);
  addBox(tape, .44, .065, .28, .033, shell);
  for (const x of [-.105, .105]) {
    const reel = new THREE.Mesh(new THREE.CylinderGeometry(.069, .069, .004, 24), hub);
    reel.position.set(x, .068, -.012); tape.add(reel);
    const spindle = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .005, 12), shell);
    spindle.position.set(x, .071, -.012); tape.add(spindle);
  }
  function label(parent, name, width, depth, y, z, paint) {
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 320;
    paint(canvas.getContext("2d"));
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshStandardMaterial({ map, roughness: .88 }));
    face.name = name; face.rotation.x = -Math.PI / 2; face.position.set(0, y, z); parent.add(face);
  }
  label(note, "chapter15-note-writing", .412, .292, .0045, 0, c => {
    c.fillStyle = "#e8d9b2"; c.fillRect(0, 0, 512, 320);
    c.fillStyle = "#574f42"; c.font = "bold 27px Arial";
    c.fillText("NEON RECORDING / 1999", 23, 40);
    c.fillStyle = "#33516b"; c.font = "italic 23px Arial";
    ["Primero: apagar el ruido.", "Luego: recuperar el pulso.", "Al final: el canal oculto.", "No figura en la consola.", "Hugo"].forEach((line, i) => c.fillText(line, 24, 92 + i * 43));
  });
  label(tape, "chapter15-tape-label", .37, .067, .067, .093, c => {
    c.fillStyle = "#c3b18c"; c.fillRect(0, 0, 512, 320);
    c.fillStyle = "#322b37"; c.font = "bold 72px Arial";
    c.fillText("NEON / AUX ?", 22, 123); c.font = "49px monospace"; c.fillText("1999  /  MASTER", 24, 240);
  });
  const point = new THREE.Vector3();
  const noteTarget = interactions.find(item => item.id === "ch15-note");
  const tapeTarget = interactions.find(item => item.id === "ch15-tape");
  function syncTargets() {
    for (const [object, target] of [[note, noteTarget], [tape, tapeTarget]]) {
      object.getWorldPosition(point); target.x = point.x; target.z = point.z;
    }
  }
  function settle() {
    // Measure the actual loaded/sloped console, not its bounding-box maximum.
    const support = consoleSlot.modelRoot || consoleSlot.placeholder;
    if (support) {
      const assembly = consoleSlot.assembly;
      assembly.updateWorldMatrix(true, true);
      const direction = new THREE.Vector3(0, -1, 0).transformDirection(assembly.matrixWorld);
      const ray = new THREE.Raycaster();
      const heights = [.65, .93].map(z => {
        ray.set(assembly.localToWorld(new THREE.Vector3(2.65, 4, z)), direction);
        const hit = ray.intersectObject(support, true)[0];
        return hit ? assembly.worldToLocal(hit.point).y : 1.30;
      });
      tape.position.y = (heights[0] + heights[1]) / 2 + .003;
      tape.rotation.x = -Math.atan((heights[1] - heights[0]) / .28);
    }
    syncTargets();
  }
  settle();
  return {
    settle,
    update(progress) { tape.visible = !progress?.tapeTaken; syncTargets(); },
    dispose() { disposeObjects([note, tape]); note.removeFromParent(); tape.removeFromParent(); },
  };
}
