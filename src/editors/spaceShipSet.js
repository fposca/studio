import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import forgedMetalUrl from "../assets/environments/ship-forged-gunmetal-v1.png";
import { buildSpaceShipSet } from "./spaceShipInterior.js";
import { createSpaceShipProps } from "./spaceShipProps.js";

let areaLightsReady = false;

export function createSpaceShipSet(environment = null) {
  if (!areaLightsReady) {
    RectAreaLightUniformsLib.init();
    areaLightsReady = true;
  }
  const loader = new THREE.TextureLoader();
  const texture = (url, colorSpace, repeat) => {
    const map = loader.load(url);
    map.colorSpace = colorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(...repeat);
    map.anisotropy = 8;
    return map;
  };
  const set = buildSpaceShipSet({
    alloy: texture(forgedMetalUrl, THREE.SRGBColorSpace, [1.5, 1.5]),
    brushed: texture(forgedMetalUrl, THREE.SRGBColorSpace, [1.5, 1.5]),
    relief: texture(forgedMetalUrl, THREE.NoColorSpace, [1.5, 1.5])
  }, environment);
  const props = createSpaceShipProps();
  set.add(props);
  const animate = set.userData.animate;
  const dispose = set.userData.dispose;
  set.userData.animate = (time, active, reduced) => {
    animate(time, active, reduced);
    props.userData.animate(time, set.visible);
  };
  set.userData.dispose = () => {
    props.userData.dispose();
    dispose();
  };
  return set;
}
