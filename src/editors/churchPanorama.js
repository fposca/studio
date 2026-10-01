import { createPanoramaBackdrop } from "./panoramaBackdrop.js";

export function createChurchPanorama() {
  return createPanoramaBackdrop({
    name: "Panorama nitido de iglesia", horizontalRepeat: 3, horizonCompression: 2, intensity: 0.8
  });
}
