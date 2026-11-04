import * as THREE from "three";

// Keep procedural artwork in CPU pixels, rather than depending on a live 2D
// canvas backing store surviving a GPU/context reset. This is Halloween-only.
export function snapshotCanvasTexture(source) {
  const canvas = source.image;
  const { width, height } = canvas;
  const pixels = canvas.getContext("2d").getImageData(0, 0, width, height).data;
  const data = new Uint8Array(pixels.length);
  const rowSize = width * 4;
  for (let row = 0; row < height; row++) {
    const from = (source.flipY ? height - row - 1 : row) * rowSize;
    data.set(pixels.subarray(from, from + rowSize), row * rowSize);
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
  for (const key of ["mapping", "channel", "wrapS", "wrapT", "magFilter", "minFilter", "anisotropy", "colorSpace", "generateMipmaps", "premultiplyAlpha", "rotation", "matrixAutoUpdate"]) {
    texture[key] = source[key];
  }
  texture.repeat.copy(source.repeat);
  texture.offset.copy(source.offset);
  texture.center.copy(source.center);
  texture.matrix.copy(source.matrix);
  texture.name = source.name || "halloween-procedural-artwork";
  texture.flipY = false; // Pixel rows were flipped explicitly above.
  texture.needsUpdate = true;
  return texture;
}

export function createHalloweenTextureCache() {
  const snapshots = new Map();
  return {
    prepare(root) {
      root.traverse(object => {
        for (const material of [object.material].flat().filter(Boolean)) {
          for (const [key, source] of Object.entries(material)) {
            if (!source?.isCanvasTexture) continue;
            if (!snapshots.has(source)) snapshots.set(source, snapshotCanvasTexture(source));
            material[key] = snapshots.get(source);
          }
        }
      });
    },
    restore() {
      for (const texture of snapshots.values()) texture.needsUpdate = true;
    },
    dispose() {
      for (const [source, texture] of snapshots) { source.dispose(); texture.dispose(); }
      snapshots.clear();
    },
  };
}
