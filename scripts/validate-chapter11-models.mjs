import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = fileURLToPath(new URL("../src/assets/neonboy-animaciones/chapter11/", import.meta.url));
const actors = {
  centinela: ["centinela-ataque"],
  alma: ["alma-errante-camina"],
  barquero: ["barquero-caminar"],
  gargola: ["gargola-ataque"],
  testigo: ["testigo-patada", "testigo-patada-2"],
};

function glb(name) {
  const data = readFileSync(path.join(directory, name));
  if (data.toString("ascii", 0, 4) !== "glTF") throw new Error(`Invalid GLB: ${name}`);
  return JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString());
}

for (const [actor, files] of Object.entries(actors)) {
  const visual = glb(`${actor}.mobile.glb`);
  const names = new Set(visual.nodes.map((node) => node.name).filter(Boolean));
  if (!visual.meshes?.length || !visual.animations?.length) throw new Error(`${actor}: missing model or animation`);
  for (const file of files) {
    const clip = glb(`${file}.anim.glb`);
    if (clip.meshes?.length || !clip.animations?.length) throw new Error(`${file}: not an animation-only GLB`);
    const missing = [...new Set(clip.animations.flatMap((animation) => animation.channels.map((channel) => clip.nodes[channel.target.node]?.name)))].filter((name) => !names.has(name));
    if (missing.length) throw new Error(`${file}: ${missing.length} animation targets missing in ${actor}: ${missing.slice(0, 5).join(", ")}`);
  }
  console.log(`${actor}: geometry, idle/walk and ${files.length} extra clip file(s) compatible`);
}
