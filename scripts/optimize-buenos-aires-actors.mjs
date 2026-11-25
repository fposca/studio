import { spawnSync } from "node:child_process";
import { readFileSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = path.join(root, "src/assets/neonboy-animaciones");
const cli = path.join(root, "node_modules/@gltf-transform/cli/bin/cli.js");
const extractor = path.join(root, "scripts/extract-record-store-roxy-animations.mjs");
const families = [
  { base: "peaton-hombre-camina-celular", clips: ["peaton-hombre-quieto-celular", "peaton-hombre-reacciona"] },
  { base: "peaton-mujer-camina-celular", clips: ["peaton-mujer-quieta-celular", "peaton-mujer-reacciona"] },
  { base: "ejecutivo-camina-celular", clips: ["ejecutivo-quieto-celular"] },
  { base: "senora-camina-celular", clips: ["senora-quieta-celular"] },
  { base: "desconectada-respira", clips: ["desconectada-camina", "desconectada-habla"] },
];

function glbJson(file) {
  const bytes = readFileSync(file);
  if (bytes.toString("ascii", 0, 4) !== "glTF") throw new Error(`GLB inválido: ${file}`);
  return JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
}
function rig(gltf) {
  return (gltf.skins || []).flatMap(skin => skin.joints.map(id => gltf.nodes[id]?.name));
}
function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Falló: ${args.join(" ")}`);
}

let originalBytes = 0, optimizedBytes = 0;
for (const { base, clips } of families) {
  const source = path.join(directory, `${base}.glb`);
  const sourceJson = glbJson(source);
  const sourceRig = rig(sourceJson);
  if (!sourceRig.length || !sourceJson.animations?.length) throw new Error(`Falta animación/esqueleto: ${base}`);
  for (const clip of clips) {
    const other = glbJson(path.join(directory, `${clip}.glb`));
    if (JSON.stringify(rig(other)) !== JSON.stringify(sourceRig) || !other.animations?.length)
      throw new Error(`Rig o animación incompatible: ${clip}`);
  }
  const resized = path.join(directory, `${base}.resized.tmp.glb`);
  const textured = path.join(directory, `${base}.webp.tmp.glb`);
  const output = path.join(directory, `${base}.city.glb`);
  try {
    run(cli, ["resize", source, resized, "--width", "512", "--height", "512"]);
    run(cli, ["webp", resized, textured, "--quality", "75"]);
    run(cli, ["meshopt", textured, output, "--level", "high"]);
    const result = glbJson(output);
    if (result.meshes?.length !== sourceJson.meshes.length || result.animations?.length !== sourceJson.animations.length ||
        !result.extensionsUsed?.includes("EXT_texture_webp") || !result.extensionsUsed?.includes("EXT_meshopt_compression"))
      throw new Error(`Se perdió malla, animación o compresión: ${base}`);
  } finally {
    for (const temp of [resized, textured]) try { unlinkSync(temp); } catch { /* Ya se eliminó. */ }
  }
  run(extractor, clips);
  originalBytes += statSync(source).size;
  optimizedBytes += statSync(output).size;
  for (const clip of clips) {
    originalBytes += statSync(path.join(directory, `${clip}.glb`)).size;
    optimizedBytes += statSync(path.join(directory, `${clip}.anim.glb`)).size;
  }
}
console.log(`Peatones BA: ${(originalBytes / 1048576).toFixed(1)} → ${(optimizedBytes / 1048576).toFixed(1)} MiB`);
