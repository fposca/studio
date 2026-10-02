import { createPanoramaBackdrop } from "./panoramaBackdrop.js";

export function createChurchPanorama() {
  return createPanoramaBackdrop({
    name: "Panorama nitido de iglesia", horizontalRepeat: 3, horizonCompression: 3, intensity: 0.8
  });
}
