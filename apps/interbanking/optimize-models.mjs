import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const assets = path.join(root, "src/assets/neonboy-animaciones");
const output = path.join(root, "apps/interbanking/models");
const cli = path.join(root, "node_modules/@gltf-transform/cli/bin/cli.js");
const models = [
  ["interbanking/fernando-respira.glb", "fernando-respira.office.glb"],
  ["interbanking/fernando-camina.glb", "fernando-camina.office.glb"],
  ["interbanking/nuevaRoxy.glb", "roxy.office.glb"],
  ["interbanking/mujer-avatar-respirar.glb", "victoria-respira.office.glb"],
  ["interbanking/mujer-avatar-caminar.glb", "victoria-camina.office.glb"],
  ["interbanking/man.glb", "alfredo.office.glb"],
  ["interbanking/avatar-respirando.glb", "custom-respira.office.glb"],
  ["interbanking/avatar-caminando.glb", "custom-camina.office.glb"],
];
function glbJson(file) {
  const buffer = readFileSync(file);
  if (buffer.toString("ascii", 0, 4) !== "glTF") throw new Error(`Invalid GLB: ${file}`);
  return JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
}
function run(args) {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: root, stdio: "inherit" });
  if (result.error || result.status !== 0) throw result.error || new Error(`Model optimization failed: ${args[0]}`);
}
mkdirSync(output, { recursive: true });
let oldBytes = 0, newBytes = 0;
for (const [sourceName, destName] of models.filter(([, destName]) =>
  !process.argv.includes("--custom") || destName.startsWith("custom-"))) {
  const source = path.join(assets, sourceName);
  const target = path.join(output, destName);
  const temp = path.join(output, destName + ".tmp.glb");
  try {
    run(["webp", source, temp, "--quality", "84"]);
    run(["meshopt", temp, target, "--level", "high"]);
    const before = glbJson(source), after = glbJson(target);
    if (before.meshes?.length !== after.meshes?.length || before.animations?.length !== after.animations?.length ||
        before.skins?.length !== after.skins?.length ||
        !after.extensionsUsed?.includes("EXT_meshopt_compression"))
      throw new Error(`Optimization changed geometry or animation: ${sourceName}`);
    oldBytes += statSync(source).size;
    newBytes += statSync(target).size;
    console.log(`${destName}: ${(statSync(source).size / 1048576).toFixed(1)} → ${(statSync(target).size / 1048576).toFixed(1)} MiB`);
  } finally {
    try { unlinkSync(temp); } catch { /* No intermediate file produced. */ }
  }
}
console.log(`Interbanking models: ${(oldBytes / 1048576).toFixed(1)} → ${(newBytes / 1048576).toFixed(1)} MiB`);
