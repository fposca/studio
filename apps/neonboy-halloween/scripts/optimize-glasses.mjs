import { spawnSync } from "node:child_process";
import { readFileSync, statSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("../../../src/assets/neonboy-animaciones/glasses.glb", import.meta.url));
const output = fileURLToPath(new URL("../models/glasses.mobile.glb", import.meta.url));
const cli = fileURLToPath(new URL("../../../node_modules/@gltf-transform/cli/bin/cli.js", import.meta.url));
const stages = ["simplify", "resize", "webp"].map((name) =>
  fileURLToPath(new URL("../models/glasses." + name + ".tmp.glb", import.meta.url)));

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

try {
  // A small pickup does not need the source's 255k triangles and three 2K maps.
  run(["simplify", source, stages[0], "--ratio", "0.18", "--error", "0.01"]);
  run(["resize", stages[0], stages[1], "--width", "512", "--height", "512"]);
  run(["webp", stages[1], stages[2], "--quality", "76"]);
  run(["meshopt", stages[2], output, "--level", "high"]);
  const gltf = glbJson(output);
  if (!gltf.meshes?.length ||
      !gltf.extensionsUsed?.includes("EXT_meshopt_compression") ||
      !gltf.extensionsUsed?.includes("EXT_texture_webp")) {
    throw new Error("Optimized glasses lost the mesh or compression");
  }
  const before = statSync(source).size;
  const after = statSync(output).size;
  if (after >= before) throw new Error("Optimized glasses are not smaller");
  console.log("glasses.glb: " + (before / 1048576).toFixed(2) + " -> " +
    (after / 1048576).toFixed(2) + " MiB");
} finally {
  for (const stage of stages) {
    try { unlinkSync(stage); } catch { /* No intermediate file. */ }
  }
}
