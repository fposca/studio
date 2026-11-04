import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const sourceDir = path.join(root, "src/assets/neonboy-animaciones");
const outputDir = path.join(root, "apps/neonboy-halloween/models");

const align4 = (value) => (value + 3) & ~3;

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


const input = path.join(sourceDir, "demonio-matrix-muerte.glb");
const output = path.join(outputDir, "demonio-matrix-muerte.anim.glb");
mkdirSync(outputDir, { recursive: true });
extractAnimation(input, output, path.join(sourceDir, "demonio-matrox-breath.glb"));
console.log(`Demon death animation: ${(statSync(input).size / 1048576).toFixed(1)} -> ${(statSync(output).size / 1048576).toFixed(2)} MiB`);
