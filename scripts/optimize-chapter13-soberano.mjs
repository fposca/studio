import { spawnSync } from "node:child_process";
import { readFileSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = path.join(root, "src/assets/neonboy-animaciones/capitulo13");
const cli = path.join(root, "node_modules/@gltf-transform/cli/bin/cli.js");
const extractor = path.join(root, "scripts/extract-record-store-roxy-animations.mjs");
const base = path.join(directory, "soberano-respira.glb");
const clips = ["camina", "ataque", "invoca", "muerte"];
const output = path.join(directory, "soberano.mobile.glb");

function glbJson(file) {
  const bytes = readFileSync(file);
  if (bytes.toString("ascii", 0, 4) !== "glTF") throw new Error(`GLB inválido: ${file}`);
  return JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
}

function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Falló el procesamiento: ${args.join(" ")}`);
}

function rig(gltf) {
  return new Set((gltf.skins || []).flatMap((skin) => skin.joints.map((id) => gltf.nodes[id]?.name)));
}

const source = glbJson(base);
const sourceRig = rig(source);
if (!sourceRig.size || !source.meshes?.length || !source.animations?.length) throw new Error("El modelo base necesita rig, malla y animación");
for (const clip of clips) {
  const name = path.join(directory, `soberano-${clip}.glb`);
  const other = glbJson(name);
  const otherRig = rig(other);
  if (sourceRig.size !== otherRig.size || [...sourceRig].some((bone) => !otherRig.has(bone)))
    throw new Error(`Rig incompatible: ${clip}`);
  if (!other.animations?.length) throw new Error(`Falta la animación: ${clip}`);
}

const resized = path.join(directory, "soberano.resized.tmp.glb");
const textured = path.join(directory, "soberano.webp.tmp.glb");
try {
  run(cli, ["resize", base, resized, "--width", "1024", "--height", "1024"]);
  run(cli, ["webp", resized, textured, "--quality", "76"]);
  run(cli, ["meshopt", textured, output, "--level", "high"]);
  const mobile = glbJson(output);
  if (mobile.meshes?.length !== source.meshes.length || mobile.animations?.length !== source.animations.length ||
      !mobile.extensionsUsed?.includes("EXT_texture_webp") || !mobile.extensionsUsed?.includes("EXT_meshopt_compression"))
    throw new Error("La optimización perdió geometría, animación o compresión");
} finally {
  for (const temp of [resized, textured]) try { unlinkSync(temp); } catch { /* No se generó. */ }
}

run(extractor, clips.map((clip) => `capitulo13/soberano-${clip}`));
let originalBytes = statSync(base).size;
let optimizedBytes = statSync(output).size;
for (const clip of clips) {
  const original = path.join(directory, `soberano-${clip}.glb`);
  const animation = path.join(directory, `soberano-${clip}.anim.glb`);
  const originalJson = glbJson(original);
  const clipJson = glbJson(animation);
  if (clipJson.meshes?.length || clipJson.animations?.length !== originalJson.animations?.length)
    throw new Error(`La extracción perdió la animación: ${clip}`);
  originalBytes += statSync(original).size;
  optimizedBytes += statSync(animation).size;
}
console.log(`Soberano: ${(originalBytes / 1048576).toFixed(2)} MiB -> ${(optimizedBytes / 1048576).toFixed(2)} MiB`);
