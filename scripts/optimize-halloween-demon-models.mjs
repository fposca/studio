import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourceDir = path.join(root, "src/assets/neonboy-animaciones");
const outputDir = path.join(root, "apps/neonboy-halloween/models");
const cli = path.join(root, "node_modules/@gltf-transform/cli/bin/cli.js");
const pairs = [
  ["reguetonero-breath", "reguetonero-walk", "reguetonero"],
  ["demonio-matrox-breath", "demoni-matrix-walking", "demonio-matrix"],
  ["demonioFinal-Breath", "demonioFinal-walk", "demonioFinal"],
];
const align4 = (value) => (value + 3) & ~3;
const glbJson = (buffer) => JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());

function run(args) {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: root, stdio: "inherit" });
  if (result.error || result.status !== 0) throw result.error || new Error(`glTF Transform failed: ${args[0]}`);
}

// Walking GLBs repeat the full model and textures. Export only tracks and rig nodes.
function extractAnimation(inputPath, outputPath, idlePath) {
  const input = readFileSync(inputPath), gltf = glbJson(input), idle = glbJson(readFileSync(idlePath));
  const idleJoints = new Set((idle.skins || []).flatMap(s => s.joints.map(index => idle.nodes[index]?.name)));
  const walkJoints = (gltf.skins || []).flatMap(s => s.joints.map(index => gltf.nodes[index]?.name));
  if (!walkJoints.length || idleJoints.size !== new Set(walkJoints).size || walkJoints.some(name => !idleJoints.has(name)))
    throw new Error(`Animation rig does not match idle rig: ${inputPath}`);
  const animations = structuredClone(gltf.animations || []);
  if (!animations.length) throw new Error(`No animation in ${inputPath}`);
  const jsonLength = input.readUInt32LE(12), binaryHeader = 20 + jsonLength;
  if (input.readUInt32LE(binaryHeader + 4) !== 0x004e4942) throw new Error(`Missing BIN chunk: ${inputPath}`);
  const binaryStart = binaryHeader + 8;
  const accessorIds = [...new Set(animations.flatMap(({ samplers }) => samplers.flatMap(({ input, output }) => [input, output])))];
  const viewIds = [...new Set(accessorIds.map(id => gltf.accessors[id].bufferView))];
  const chunks = [];
  let binaryLength = 0;
  const views = viewIds.map(id => {
    const source = gltf.bufferViews[id];
    if (source.buffer !== 0) throw new Error(`External buffer: ${inputPath}`);
    binaryLength = align4(binaryLength);
    const data = input.subarray(binaryStart + (source.byteOffset || 0), binaryStart + (source.byteOffset || 0) + source.byteLength);
    const offset = binaryLength;
    chunks.push({ offset, data });
    binaryLength += data.length;
    const { buffer, byteOffset, ...rest } = source;
    return { ...rest, buffer: 0, byteOffset: offset };
  });
  const viewMap = new Map(viewIds.map((id, index) => [id, index]));
  const accessorMap = new Map(accessorIds.map((id, index) => [id, index]));
  const accessors = accessorIds.map(id => ({ ...gltf.accessors[id], bufferView: viewMap.get(gltf.accessors[id].bufferView) }));
  for (const animation of animations) for (const sampler of animation.samplers) {
    sampler.input = accessorMap.get(sampler.input);
    sampler.output = accessorMap.get(sampler.output);
  }
  const output = {
    asset: gltf.asset, scene: gltf.scene, scenes: gltf.scenes,
    nodes: gltf.nodes.map(({ mesh, skin, ...node }) => node), animations, accessors,
    bufferViews: views, buffers: [{ byteLength: align4(binaryLength) }],
  };
  const json = Buffer.from(JSON.stringify(output)), jsonPadded = align4(json.length), binaryPadded = align4(binaryLength);
  const result = Buffer.alloc(12 + 8 + jsonPadded + 8 + binaryPadded);
  result.write("glTF", 0, 4, "ascii"); result.writeUInt32LE(2, 4); result.writeUInt32LE(result.length, 8);
  result.writeUInt32LE(jsonPadded, 12); result.writeUInt32LE(0x4e4f534a, 16);
  result.fill(0x20, 20, 20 + jsonPadded); json.copy(result, 20);
  result.writeUInt32LE(binaryPadded, 20 + jsonPadded); result.writeUInt32LE(0x004e4942, 24 + jsonPadded);
  for (const { offset, data } of chunks) data.copy(result, 28 + jsonPadded + offset);
  writeFileSync(outputPath, result);
}

mkdirSync(outputDir, { recursive: true });
for (const [idleName, walkName, outputName] of (process.argv.includes("--animations-only") || process.argv.includes("--final-death-only")) ? [] : process.argv.includes("--only-final") ? pairs.slice(-1) : pairs) {
  const idle = path.join(sourceDir, idleName + ".glb");
  const walk = path.join(sourceDir, walkName + ".glb");
  const prepared = path.join(outputDir, outputName + ".textures.tmp.glb");
  const mobile = path.join(outputDir, outputName + ".mobile.glb");
  const animation = path.join(outputDir, outputName + "-walk.anim.mobile.glb");
  try {
    run(["webp", idle, prepared, "--quality", "76"]);
    run(["meshopt", prepared, mobile, "--level", "high"]);
    extractAnimation(walk, animation, idle);
    const original = glbJson(readFileSync(idle)), optimized = glbJson(readFileSync(mobile));
    if (original.animations.length !== optimized.animations.length || !optimized.extensionsUsed?.includes("EXT_meshopt_compression"))
      throw new Error(`Animation or compression missing in ${mobile}`);
    console.log(`${outputName}: ${Math.round((statSync(idle).size + statSync(walk).size) / 1048576)} MiB -> ${((statSync(mobile).size + statSync(animation).size) / 1048576).toFixed(2)} MiB`);
  } finally { try { unlinkSync(prepared); } catch {} }
}
if (!process.argv.includes("--only-final") && !process.argv.includes("--final-death-only")) {
  extractAnimation(path.join(sourceDir, "reguetonero-attack.glb"), path.join(outputDir, "reguetonero-attack.anim.mobile.glb"), path.join(sourceDir, "reguetonero-breath.glb"));
}
if (!process.argv.includes("--final-death-only") && (process.argv.includes("--only-final") || !process.argv.includes("--animations-only"))) {
  extractAnimation(path.join(sourceDir, "demonioFinal-kick.glb"), path.join(outputDir, "demonioFinal-kick.anim.mobile.glb"), path.join(sourceDir, "demonioFinal-Breath.glb"));
}

if (process.argv.includes("--final-death-only") || process.argv.includes("--only-final") || !process.argv.includes("--animations-only")) {
  const input = path.join(sourceDir, "demonDieFinal.glb");
  const output = path.join(outputDir, "demonDieFinal.anim.mobile.glb");
  extractAnimation(input, output, path.join(sourceDir, "demonioFinal-Breath.glb"));
  console.log(`Final death animation: ${statSync(input).size} -> ${statSync(output).size} bytes (original unchanged)`);
}
