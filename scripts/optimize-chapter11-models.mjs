import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourceDir = path.join(root, "src/assets/neonboy-animaciones");
const outputDir = path.join(sourceDir, "chapter11");
const cli = path.join(root, "node_modules/@gltf-transform/cli/bin/cli.js");
const extractor = path.join(root, "scripts/extract-record-store-roxy-animations.mjs");
const actors = [
  { id: "centinela", model: "centilnela-caminando", clips: ["centinela-ataque"] },
  { id: "alma", model: "alma-errante-respira", clips: ["alma-errante-camina"] },
  { id: "barquero", model: "barquero-respirar", clips: ["barquero-caminar"] },
  { id: "gargola", model: "gargola-caminar", clips: ["gargola-ataque"] },
  { id: "testigo", model: "testigo-camina", clips: ["testigo-patada", "testigo-patada-2"] },
];

function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Model processing failed: ${args[0]}`);
}
function glbJson(file) {
  const buffer = readFileSync(file);
  if (buffer.toString("ascii", 0, 4) !== "glTF") throw new Error(`Invalid GLB: ${file}`);
  return JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
}
function joints(json) {
  return new Set((json.skins || []).flatMap((skin) => skin.joints.map((id) => json.nodes[id]?.name)));
}

mkdirSync(outputDir, { recursive: true });
let originalBytes = 0;
let optimizedBytes = 0;
for (const { id, model, clips } of actors) {
  const input = path.join(sourceDir, `${model}.glb`);
  const output = path.join(outputDir, `${id}.mobile.glb`);
  const resized = path.join(outputDir, `${id}.resized.tmp.glb`);
  const textured = path.join(outputDir, `${id}.webp.tmp.glb`);
  const source = glbJson(input);
  const sourceJoints = joints(source);
  for (const clip of clips) {
    const clipJson = glbJson(path.join(sourceDir, `${clip}.glb`));
    const clipJoints = joints(clipJson);
    if (sourceJoints.size !== clipJoints.size || [...clipJoints].some((name) => !sourceJoints.has(name)))
      throw new Error(`Animation rig differs from ${model}: ${clip}`);
  }
  try {
    run(cli, ["resize", input, resized, "--width", "1024", "--height", "1024"]);
    run(cli, ["webp", resized, textured, "--quality", "76"]);
    run(cli, ["meshopt", textured, output, "--level", "high"]);
    const mobile = glbJson(output);
    if (mobile.meshes?.length !== source.meshes?.length || mobile.animations?.length !== source.animations?.length ||
      !mobile.extensionsUsed?.includes("EXT_texture_webp") || !mobile.extensionsUsed?.includes("EXT_meshopt_compression"))
      throw new Error(`Optimized model lost geometry, animation, or compression: ${model}`);
    originalBytes += statSync(input).size;
    optimizedBytes += statSync(output).size;
    console.log(`${id}: ${(statSync(input).size / 1048576).toFixed(2)} -> ${(statSync(output).size / 1048576).toFixed(2)} MiB`);
  } finally {
    for (const temp of [resized, textured]) { try { unlinkSync(temp); } catch { /* Not produced. */ } }
  }
  run(extractor, clips);
  for (const clip of clips) {
    const sourceAnimation = path.join(sourceDir, `${clip}.anim.glb`);
    const outputAnimation = path.join(outputDir, `${clip}.anim.glb`);
    const animation = glbJson(sourceAnimation);
    const original = glbJson(path.join(sourceDir, `${clip}.glb`));
    if (animation.meshes?.length || animation.animations?.length !== original.animations?.length)
      throw new Error(`Animation extraction failed: ${clip}`);
    renameSync(sourceAnimation, outputAnimation);
    originalBytes += statSync(path.join(sourceDir, `${clip}.glb`)).size;
    optimizedBytes += statSync(outputAnimation).size;
  }
}
console.log(`Chapter 11: ${(originalBytes / 1048576).toFixed(2)} -> ${(optimizedBytes / 1048576).toFixed(2)} MiB`);
