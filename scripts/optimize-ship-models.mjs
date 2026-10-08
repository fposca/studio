import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { MeshoptSimplifier } from "three/examples/jsm/libs/meshopt_simplifier.module.js";

const targets = {
  computer: 120_000,
  plataforma: 180_000,
  "reptil-holograma": 160_000,
  "hombre-holograma": 110_000,
  "sillon-nave": 180_000,
  "trono-satanas": 180_000,
  tipografia: 220_000,
  "fondo-tipografico": 350_000,
  "sillon-gamer-90": 180_000
};
const names = process.argv.slice(2);
if (!names.length || names.some((name) => !(name in targets))) {
  throw new Error(`Uso: node scripts/optimize-ship-models.mjs ${Object.keys(targets).join("|")}`);
}
await MeshoptSimplifier.ready;

const align4 = (value) => (value + 3) & ~3;

for (const name of names) {
  const sourcePath = resolve(`src/assets/neonboy-animaciones/${name}.glb`);
  const source = await readFile(sourcePath);
  if (source.toString("ascii", 0, 4) !== "glTF") throw new Error(`${name}: GLB invalido`);
  const jsonLength = source.readUInt32LE(12);
  const document = JSON.parse(source.toString("utf8", 20, 20 + jsonLength));
  const binaryStart = 28 + jsonLength;
  const primitive = document.meshes?.[0]?.primitives?.[0];
  if (document.meshes.length !== 1 || document.meshes[0].primitives.length !== 1 || primitive?.attributes?.POSITION === undefined) {
    throw new Error(`${name}: se esperaba una malla y una primitiva`);
  }
  const accessorBytes = (accessorId, componentBytes, width) => {
    const accessor = document.accessors[accessorId];
    const view = document.bufferViews[accessor.bufferView];
    if (view.byteStride || accessor.sparse) throw new Error(`${name}: atributo intercalado no admitido`);
    const offset = binaryStart + view.byteOffset + (accessor.byteOffset || 0);
    const length = accessor.count * width * componentBytes;
    return { accessor, bytes: source.subarray(offset, offset + length) };
  };
  const positionData = accessorBytes(primitive.attributes.POSITION, 4, 3);
  const indexData = accessorBytes(primitive.indices, 4, 1);
  if (positionData.accessor.componentType !== 5126 || indexData.accessor.componentType !== 5125) {
    throw new Error(`${name}: formato de vertices no admitido`);
  }
  const positions = new Float32Array(positionData.bytes.buffer, positionData.bytes.byteOffset, positionData.accessor.count * 3);
  const indices = new Uint32Array(indexData.bytes.buffer, indexData.bytes.byteOffset, indexData.accessor.count);
  const targetCount = targets[name] * 3;
  let [simplified, error] = MeshoptSimplifier.simplify(indices, positions, 3, targetCount, 0.04);
  if (simplified.length > targetCount * 1.3) {
    [simplified, error] = MeshoptSimplifier.simplifySloppy(indices, positions, 3, null, targetCount, 0.045);
  }
  if (!simplified.length || simplified.length % 3) throw new Error(`${name}: simplificacion fallida`);

  const remap = new Int32Array(positionData.accessor.count);
  remap.fill(-1);
  const used = [];
  const reducedIndices = new Uint32Array(simplified.length);
  for (let i = 0; i < simplified.length; i++) {
    const original = simplified[i];
    if (original >= remap.length) throw new Error(`${name}: indice fuera de rango`);
    if (remap[original] === -1) {
      remap[original] = used.length;
      used.push(original);
    }
    reducedIndices[i] = remap[original];
  }

  const sourceViews = document.bufferViews;
  const rebuiltViews = [];
  const chunks = [];
  let binaryLength = 0;
  const append = (bytes, target) => {
    const aligned = align4(binaryLength);
    if (aligned > binaryLength) chunks.push(Buffer.alloc(aligned - binaryLength));
    binaryLength = aligned;
    const viewId = rebuiltViews.length;
    rebuiltViews.push({ buffer: 0, byteOffset: binaryLength, byteLength: bytes.length, ...(target ? { target } : {}) });
    chunks.push(bytes);
    binaryLength += bytes.length;
    return viewId;
  };
  for (const [semantic, accessorId] of Object.entries(primitive.attributes)) {
    const accessor = document.accessors[accessorId];
    const width = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[accessor.type];
    const componentBytes = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 }[accessor.componentType];
    if (!width || !componentBytes) throw new Error(`${name}: ${semantic} no admitido`);
    const { bytes } = accessorBytes(accessorId, componentBytes, width);
    const vertexBytes = width * componentBytes;
    const compact = Buffer.allocUnsafe(used.length * vertexBytes);
    used.forEach((original, index) => bytes.copy(compact, index * vertexBytes, original * vertexBytes, (original + 1) * vertexBytes));
    accessor.bufferView = append(compact, 34962);
    accessor.byteOffset = 0;
    accessor.count = used.length;
    if (semantic === "POSITION") {
      const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
      const values = new Float32Array(compact.buffer, compact.byteOffset, used.length * 3);
      for (let index = 0; index < used.length; index++) for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis], values[index * 3 + axis]);
        max[axis] = Math.max(max[axis], values[index * 3 + axis]);
      }
      accessor.min = min;
      accessor.max = max;
    } else {
      delete accessor.min;
      delete accessor.max;
    }
  }
  const indexAccessor = document.accessors[primitive.indices];
  indexAccessor.bufferView = append(Buffer.from(reducedIndices.buffer), 34963);
  indexAccessor.byteOffset = 0;
  indexAccessor.count = reducedIndices.length;
  indexAccessor.componentType = 5125;
  delete indexAccessor.min;
  delete indexAccessor.max;
  for (const image of document.images || []) {
    if (image.bufferView === undefined) throw new Error(`${name}: textura externa no admitida`);
    const view = sourceViews[image.bufferView];
    image.bufferView = append(source.subarray(binaryStart + view.byteOffset, binaryStart + view.byteOffset + view.byteLength));
  }
  document.bufferViews = rebuiltViews;
  document.buffers[0].byteLength = align4(binaryLength);
  document.asset.generator = `${document.asset.generator || "GLB"} / MeshoptSimplifier`;
  const jsonBytes = Buffer.from(JSON.stringify(document));
  const paddedJson = Buffer.concat([jsonBytes, Buffer.alloc(align4(jsonBytes.length) - jsonBytes.length, 0x20)]);
  const paddedBinary = Buffer.concat([...chunks, Buffer.alloc(align4(binaryLength) - binaryLength)]);
  const header = Buffer.alloc(20);
  header.write("glTF", 0, "ascii");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + paddedJson.length + 8 + paddedBinary.length, 8);
  header.writeUInt32LE(paddedJson.length, 12);
  header.write("JSON", 16, "ascii");
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(paddedBinary.length, 0);
  binaryHeader.write("BIN\0", 4, "ascii");
  const suffix = ["fondo-tipografico", "sillon-gamer-90"].includes(name) ? "optimized" : "ship-optimized";
  const outputPath = resolve(`src/assets/neonboy-animaciones/${name}.${suffix}.glb`);
  await writeFile(outputPath, Buffer.concat([header, paddedJson, binaryHeader, paddedBinary]));
  console.log(`${name}: ${indices.length / 3 | 0} -> ${reducedIndices.length / 3 | 0} triangles, ${used.length} vertices, error ${error.toFixed(4)}, ${(header.length + paddedJson.length + binaryHeader.length + paddedBinary.length) / 1048576 | 0} MiB`);
}
