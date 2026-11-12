import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = path.join(root, "src/assets/neonboy-animaciones");
const output = path.join(source, "chapter12");
const cli = path.join(root, "node_modules/@gltf-transform/cli/bin/cli.js");
const extractor = path.join(root, "scripts/extract-record-store-roxy-animations.mjs");
const clips = ["custodio-camina", "custodio-habla", "custodio-senala", "custodio-invoca"];
const base = "custodio-respira";
function json(file) {
  const bytes = readFileSync(file);
  if (bytes.toString("ascii", 0, 4) !== "glTF") throw Error("GLB invalido: " + file);
  return JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
}
function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) throw Error("Asset processing failed: " + args.join(" "));
}
const rig = (gltf) => new Set((gltf.skins || []).flatMap((skin) => skin.joints.map((id) => gltf.nodes[id]?.name)));
const sourceRig = rig(json(path.join(source, base + ".glb")));
for (const name of clips) {
  const gltf = json(path.join(source, name + ".glb"));
  const otherRig = rig(gltf);
  if (sourceRig.size !== otherRig.size || [...sourceRig].some((bone) => !otherRig.has(bone)))
    throw Error("Rig incompatible: " + name);
}
mkdirSync(output, { recursive: true });
const resized = path.join(output, "custodio.resized.tmp.glb");
const textured = path.join(output, "custodio.webp.tmp.glb");
const optimized = path.join(output, "custodio.mobile.glb");
try {
  run(cli, ["resize", path.join(source, base + ".glb"), resized, "--width", "1024", "--height", "1024"]);
  run(cli, ["webp", resized, textured, "--quality", "76"]);
  run(cli, ["meshopt", textured, optimized, "--level", "high"]);
  const model = json(optimized);
  if (!model.animations?.length || !model.meshes?.length || !model.extensionsUsed?.includes("EXT_meshopt_compression"))
    throw Error("El modelo optimizado perdio geometria o animacion");
} finally {
  for (const file of [resized, textured]) try { unlinkSync(file); } catch {}
}
run(extractor, clips);
for (const name of clips) {
  const input = path.join(source, name + ".anim.glb");
  const target = path.join(output, name + ".anim.glb");
  if (json(input).meshes?.length || !json(input).animations?.length) throw Error("Clip invalido: " + name);
  renameSync(input, target);
}
const bytes = statSync(optimized).size + clips.reduce((sum, name) => sum + statSync(path.join(output, name + ".anim.glb")).size, 0);
console.log("Custodio: 5 GLB originales -> " + (bytes / 1048576).toFixed(2) + " MiB para el juego");

