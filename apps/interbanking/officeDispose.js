// Dispose loaded Three.js objects without importing the game's character and asset catalog.
export function disposeObjects(roots) {
  const geometries = new Set(), materials = new Set(), textures = new Set(), skeletons = new Set();
  for (const root of roots) root?.traverse((object) => {
    if (object.userData.sharedGameAsset) return;
    if (object.geometry) geometries.add(object.geometry);
    if (object.skeleton) skeletons.add(object.skeleton);
    for (const material of [object.material].flat().filter(Boolean)) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  skeletons.forEach((value) => value.dispose());
  geometries.forEach((value) => value.dispose());
  materials.forEach((value) => value.dispose());
  textures.forEach((value) => value.dispose());
}
