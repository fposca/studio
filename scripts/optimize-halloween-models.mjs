import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourceDir = path.join(root, "src/assets/neonboy-animaciones");
const outputDir = path.join(root, "apps/neonboy-halloween/models");
const cli = path.join(root, "node_modules/@gltf-transform/cli/bin/cli.js");
const visibleModels = [
  ["neon-inactivo-hd.store.glb", "neon-inactivo-hd.mobile.glb"],
  ["vendedor.store.glb", "vendedor.mobile.glb"],
  ["rulo-respira.glb", "rulo-respira.mobile.glb"],
  ["mujer-quieta.store.glb", "mujer-quieta.mobile.glb"],
  ["reemplazo-freddy-respirar.glb", "reemplazo-freddy-respirar.mobile.glb"],
  ["reemplazo-jason-respirar.glb", "reemplazo-jason-respirar.mobile.glb"],
  ["esuqeleto-bailando.store.glb", "esuqeleto-bailando.mobile.glb"]
];
const walkAnimations = [
  ["remplazo-fredy-caminar.glb", "remplazo-fredy-caminar.anim.mobile.glb", "reemplazo-freddy-respirar.glb"],
  ["reemplazo-jason-caminar.glb", "reemplazo-jason-caminar.anim.mobile.glb", "reemplazo-jason-respirar.glb"]
];
const align4 = (value) => (value + 3) & ~3;

function run(args) {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`glTF Transform failed: ${args[0]}`);
}

function glbJson(file) {
  const buffer = readFileSync(file);
  if (buffer.toString("ascii", 0, 4) !== "glTF") throw new Error(`Invalid GLB: ${file}`);
  return JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
}

// A walking GLB includes another full mesh and the same large textures as its idle GLB.
// The NPC loader uses only the animation, so package just its tracks and named nodes.
function extractAnimation(inputPath, outputPath, idlePath) {
  const input = readFileSync(inputPath);
  const gltf = glbJson(inputPath);
  const idle = glbJson(idlePath);
  const idleJoints = new Set((idle.skins || []).flatMap((skin) => skin.joints.map((index) => idle.nodes[index]?.name)));
  const walkJoints = (gltf.skins || []).flatMap((skin) => skin.joints.map((index) => gltf.nodes[index]?.name));
  if (!walkJoints.length || idleJoints.size !== new Set(walkJoints).size || walkJoints.some((name) => !idleJoints.has(name))) {
    throw new Error(`Walking rig does not match idle rig: ${inputPath}`);
  }
  const animations = structuredClone(gltf.animations || []);
  if (!animations.length) throw new Error(`No animation in ${inputPath}`);
  const jsonLength = input.readUInt32LE(12);
  const binaryHeader = 20 + jsonLength;
  if (input.readUInt32LE(binaryHeader + 4) !== 0x004e4942) throw new Error(`Missing BIN chunk in ${inputPath}`);
  const binaryStart = binaryHeader + 8;
  const accessorIds = [...new Set(animations.flatMap(({ samplers }) => samplers.flatMap(({ input, output }) => [input, output])))];
  const viewIds = [...new Set(accessorIds.map((id) => gltf.accessors[id].bufferView))];
  const chunks = [];
  let binaryLength = 0;
  const views = viewIds.map((id) => {
    const source = gltf.bufferViews[id];
    if (source.buffer !== 0) throw new Error(`External buffer in ${inputPath}`);
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
  const accessors = accessorIds.map((id) => {
    const source = gltf.accessors[id];
    if (source.sparse) throw new Error(`Sparse accessor in ${inputPath}`);
    return { ...source, bufferView: viewMap.get(source.bufferView) };
  });
  for (const animation of animations) for (const sampler of animation.samplers) {
    sampler.input = accessorMap.get(sampler.input);
    sampler.output = accessorMap.get(sampler.output);
  }
  const nodes = gltf.nodes.map(({ mesh, skin, ...node }) => node);
  const output = {
    asset: gltf.asset,
    scene: gltf.scene,
    scenes: gltf.scenes,
    nodes,
    animations,
    accessors,
    bufferViews: views,
    buffers: [{ byteLength: align4(binaryLength) }]
  };
  const json = Buffer.from(JSON.stringify(output));
  const jsonPadded = align4(json.length);
  const binaryPadded = align4(binaryLength);
  const result = Buffer.alloc(12 + 8 + jsonPadded + 8 + binaryPadded);
  result.write("glTF", 0, 4, "ascii");
  result.writeUInt32LE(2, 4);
  result.writeUInt32LE(result.length, 8);
  result.writeUInt32LE(jsonPadded, 12);
  result.writeUInt32LE(0x4e4f534a, 16);
  result.fill(0x20, 20, 20 + jsonPadded);
  json.copy(result, 20);
  result.writeUInt32LE(binaryPadded, 20 + jsonPadded);
  result.writeUInt32LE(0x004e4942, 24 + jsonPadded);
  for (const { offset, data } of chunks) data.copy(result, 28 + jsonPadded + offset);
  writeFileSync(outputPath, result);
}

mkdirSync(outputDir, { recursive: true });
let before = 0, after = 0;
for (const [sourceName, outputName] of visibleModels) {
  const input = path.join(sourceDir, sourceName);
  const output = path.join(outputDir, outputName);
  const intermediate = path.join(outputDir, `${outputName}.textures.tmp.glb`);
  const ruloStages = ["roughness", "simplified", "normal"].map((stage) => path.join(outputDir, `${outputName}.${stage}.tmp.glb`));
  try {
    let prepared = input;
    if (sourceName === "rulo-respira.glb") {
      // Keep the 2K color map sharp; the roughness and normal maps do not need 4K/2K on mobile.
      run(["resize", prepared, ruloStages[0], "--pattern", "*metallic_roughness*", "--width", "1024", "--height", "1024"]);
      run(["simplify", ruloStages[0], ruloStages[1], "--ratio", "0.55", "--error", "0.005"]);
      run(["resize", ruloStages[1], ruloStages[2], "--pattern", "normal", "--width", "1024", "--height", "1024"]);
      prepared = ruloStages[2];
    }
    run(["webp", prepared, intermediate, "--quality", sourceName === "rulo-respira.glb" ? "74" : "78"]);
    run(["meshopt", intermediate, output, "--level", "high"]);
    const original = glbJson(input);
    const mobile = glbJson(output);
    if ((original.animations?.length ?? 0) !== (mobile.animations?.length ?? 0)) throw new Error(`Animation count changed: ${sourceName}`);
    if (!mobile.extensionsUsed?.includes("EXT_meshopt_compression") || !mobile.extensionsUsed?.includes("EXT_texture_webp")) throw new Error(`Missing compression: ${sourceName}`);
    before += statSync(input).size;
    after += statSync(output).size;
    console.log(`${sourceName}: ${(statSync(input).size / 1048576).toFixed(1)} -> ${(statSync(output).size / 1048576).toFixed(1)} MiB`);
  } finally {
    for (const file of [intermediate, ...ruloStages]) {
      try { unlinkSync(file); } catch { /* No intermediate. */ }
    }
  }
}
for (const [sourceName, outputName, idleName] of walkAnimations) {
  const input = path.join(sourceDir, sourceName);
  const output = path.join(outputDir, outputName);
  extractAnimation(input, output, path.join(sourceDir, idleName));
  before += statSync(input).size;
  after += statSync(output).size;
  console.log(`${sourceName}: ${(statSync(input).size / 1048576).toFixed(1)} -> ${(statSync(output).size / 1048576).toFixed(2)} MiB (animation only)`);
}
console.log(`Halloween models: ${(before / 1048576).toFixed(1)} -> ${(after / 1048576).toFixed(1)} MiB`);
