// Keep original GLB materials, but cap oversized images before their first GPU upload.
// The source GLB and its texture files are never rewritten.
export function limitRockClubTextures(root, maximum = 2048) {
  const visited = new Set();
  root.traverse((object) => {
    for (const material of [object.material].flat().filter(Boolean)) {
      for (const value of Object.values(material)) {
        if (!value?.isTexture || visited.has(value)) continue;
        visited.add(value);
        const image = value.image;
        const width = image?.width, height = image?.height;
        if (!width || !height || Math.max(width, height) <= maximum) continue;
        const ratio = maximum / Math.max(width, height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width * ratio));
        canvas.height = Math.max(1, Math.round(height * ratio));
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) continue;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        value.image = canvas;
        value.needsUpdate = true;
      }
    }
  });
}
