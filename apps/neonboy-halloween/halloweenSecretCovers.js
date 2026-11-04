import { SECRET_COVERS } from "./halloweenSecretsLogic.js";

export function createHalloweenSecretCovers(scene, shop, albums) {
  const entries = new Map();
  for (const [id, config] of Object.entries(SECRET_COVERS)) {
    if (!config.alternateId) continue;
    const sourceIndex = albums.findIndex((album) => album.id === id);
    const altIndex = albums.findIndex((album) => album.id === config.alternateId);
    if (sourceIndex < 0 || altIndex < 0) continue;
    const original = shop.covers[sourceIndex], alternate = shop.covers[altIndex];
    if (!original || !alternate) continue;
    const materials = new Set();
    scene.traverse((object) => {
      if (!object.isMesh) return;
      for (const material of [object.material].flat().filter(Boolean)) {
        if (material.map !== original) continue;
        object.userData.halloweenSecretCover = true;
        materials.add(material);
      }
    });
    entries.set(id, { original, alternate, materials });
  }
  let active = false;
  const seen = new Set();
  return {
    setActive(next) {
      if (active === next) return;
      active = next;
      for (const { original, alternate, materials } of entries.values())
        for (const material of materials) {
          material.map = active ? alternate : original;
          material.needsUpdate = true;
        }
    },
    discover(player, onSecret) {
      if (!active) return;
      for (const [id, config] of Object.entries(SECRET_COVERS)) {
        if (seen.has(id)) continue;
        const nearby = shop.albumTargets.some((spot) => spot.id === id &&
          Math.hypot(player.x - spot.x, player.z - spot.z) < Math.min(2.5, spot.reach + .2));
        if (!nearby) continue;
        seen.add(id);
        onSecret?.(id, config.message);
        break;
      }
    },
    reset() { this.setActive(false); seen.clear(); },
    getCover(id) {
      const item = entries.get(id);
      return active && item ? albums.find((album) => album.id === SECRET_COVERS[id].alternateId)?.cover : null;
    },
  };
}
