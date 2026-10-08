import * as THREE from "three";
import { createPanoramaBackdrop } from "./panoramaBackdrop.js";

export function configureFieldPanoramaTexture(texture, anisotropy = 1) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = Math.max(1, anisotropy);
  texture.needsUpdate = true;
  return texture;
}

export function createFieldPanorama() {
  const panorama = createPanoramaBackdrop({
    name: "Panorama nitido de campo",
    // The source is a landscape photograph, not a 360-degree equirectangular capture.
    horizontalRepeat: 4, horizontalOffset: 0.5, horizontalMirror: true,
    horizonCompression: 2.2, verticalScale: 2.6, verticalOffset: -0.18,
    zenithCap: 1
  });
  panorama.material.toneMapped = false;
  return panorama;
}
