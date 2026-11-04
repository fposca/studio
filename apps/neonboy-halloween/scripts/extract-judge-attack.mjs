import { readFile, writeFile } from "node:fs/promises";

const source = new URL("../../../src/assets/neonboy-animaciones/demonFinal-attack.glb", import.meta.url);
const destination = new URL("../models/demonFinal-attack.anim.mobile.glb", import.meta.url);
const glb = await readFile(source);
if (glb.toString("ascii", 0, 4) !== "glTF" || glb.readUInt32LE(4) !== 2) throw new Error("Expected GLB v2");
const jsonLength = glb.readUInt32LE(12);
const json = JSON.parse(glb.toString("utf8", 20, 20 + jsonLength));
const binHeader = 20 + jsonLength;
if (glb.readUInt32LE(binHeader + 4) !== 0x004e4942) throw new Error("Missing BIN chunk");
const bin = glb.subarray(binHeader + 8, binHeader + 8 + glb.readUInt32LE(binHeader));
if (json.animations?.length !== 1) throw new Error("Expected one attack animation");
const animation = json.animations[0];
const accessorIds = [...new Set(animation.samplers.flatMap((sampler) => [sampler.input, sampler.output]))].sort((a, b) => a - b);
const viewIds = [...new Set(accessorIds.map((id) => json.accessors[id].bufferView))].sort((a, b) => a - b);
const viewMap = new Map();
const chunks = [];
let binaryLength = 0;
for (const id of viewIds) {
  const view = json.bufferViews[id];
  if (view.buffer !== 0 || view.extensions) throw new Error("Compressed or external buffer view");
  viewMap.set(id, viewMap.size);
  const bytes = Buffer.from(bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength));
  chunks.push(bytes);
  binaryLength += bytes.length;
  const padding = (4 - binaryLength % 4) % 4;
  if (padding) { chunks.push(Buffer.alloc(padding)); binaryLength += padding; }
}
let offset = 0;
const bufferViews = viewIds.map((id) => {
  const view = { ...json.bufferViews[id], buffer: 0, byteOffset: offset };
  offset += (view.byteLength + 3) & ~3;
  return view;
});
const accessorMap = new Map(accessorIds.map((id, index) => [id, index]));
const accessors = accessorIds.map((id) => {
  const accessor = json.accessors[id];
  if (accessor.sparse) throw new Error("Sparse animation accessor");
  return { ...accessor, bufferView: viewMap.get(accessor.bufferView) };
});
const minimal = {
  asset: json.asset,
  scene: json.scene,
  scenes: json.scenes,
  nodes: json.nodes.map(({ mesh, skin, ...node }) => node),
  animations: [{
    ...animation,
    samplers: animation.samplers.map((sampler) => ({
      ...sampler, input: accessorMap.get(sampler.input), output: accessorMap.get(sampler.output),
    })),
  }],
  accessors,
  bufferViews,
  buffers: [{ byteLength: binaryLength }],
};
const jsonBytes = Buffer.from(JSON.stringify(minimal), "utf8");
const jsonPadding = (4 - jsonBytes.length % 4) % 4;
const binBytes = Buffer.concat(chunks, binaryLength);
const output = Buffer.alloc(12 + 8 + jsonBytes.length + jsonPadding + 8 + binBytes.length);
output.write("glTF", 0, "ascii");
output.writeUInt32LE(2, 4);
output.writeUInt32LE(output.length, 8);
output.writeUInt32LE(jsonBytes.length + jsonPadding, 12);
output.writeUInt32LE(0x4e4f534a, 16);
jsonBytes.copy(output, 20);
output.fill(0x20, 20 + jsonBytes.length, 20 + jsonBytes.length + jsonPadding);
const binOffset = 20 + jsonBytes.length + jsonPadding;
output.writeUInt32LE(binBytes.length, binOffset);
output.writeUInt32LE(0x004e4942, binOffset + 4);
binBytes.copy(output, binOffset + 8);
await writeFile(destination, output);
console.log("Attack animation: " + glb.length + " -> " + output.length + " bytes");


