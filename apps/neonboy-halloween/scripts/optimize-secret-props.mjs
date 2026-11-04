import { spawnSync } from "node:child_process";
import { readFileSync, statSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";

const sourceDir = fileURLToPath(new URL("../../../src/assets/neonboy-animaciones/", import.meta.url));
const outputDir = fileURLToPath(new URL("../models/", import.meta.url));
const cli = fileURLToPath(new URL("../../../node_modules/@gltf-transform/cli/bin/cli.js", import.meta.url));
const props = [
  ["telefono", 512, .32],
  ["espejo", 768, .22],
  ["tv", 512, .28],
  ["vhs", 512, .16],
];
function run(args) {
  const result = spawnSync(process.execPath, [cli, ...args], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error("glTF Transform failed: " + args[0]);
}
function glbJson(path) {
  const data = readFileSync(path);
  if (data.toString("ascii", 0, 4) !== "glTF") throw new Error("Invalid GLB: " + path);
  return JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString());
}
for (const [name, resolution, ratio] of props) {
  const source = sourceDir + name + ".glb";
  const output = outputDir + name + ".mobile.glb";
  const stages = ["simple", "small", "webp"].map((part) => outputDir + name + "." + part + ".tmp.glb");
  try {
    run(["simplify", source, stages[0], "--ratio", String(ratio), "--error", "0.012"]);
    run(["resize", stages[0], stages[1], "--width", String(resolution), "--height", String(resolution)]);
    run(["webp", stages[1], stages[2], "--quality", "76"]);
    run(["meshopt", stages[2], output, "--level", "high"]);
    const gltf = glbJson(output);
    if (!gltf.meshes?.length || !gltf.extensionsUsed?.includes("EXT_meshopt_compression") ||
        !gltf.extensionsUsed?.includes("EXT_texture_webp") || statSync(output).size >= statSync(source).size) {
      throw new Error("Invalid optimized prop: " + name);
    }
    console.log(name + ": " + (statSync(source).size / 1048576).toFixed(2) + " -> " +
      (statSync(output).size / 1048576).toFixed(2) + " MiB");
  } finally {
    for (const stage of stages) { try { unlinkSync(stage); } catch { /* No temporary file. */ } }
  }
}
