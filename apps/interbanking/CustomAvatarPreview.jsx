import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { applyCustomAvatar } from "./customAvatar3d.js";
import { disposeObjects } from "./officeDispose.js";

const previewModel = new URL("./models/custom-respira.office.glb", import.meta.url).href;

export default function CustomAvatarPreview({ customization }) {
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const latestRef = useRef(customization);
  latestRef.current = customization;

  useEffect(() => {
    if (modelRef.current) applyCustomAvatar(modelRef.current, customization);
  }, [customization]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" }); }
    catch { return undefined; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xe8f5ff, 0x556982, 2.15));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(-1, 3, 3);
    scene.add(key);
    const camera = new THREE.PerspectiveCamera(38, 1, .01, 20);
    camera.position.set(0, 1.36, 1.15);
    camera.lookAt(0, 1.42, 0);
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const mixer = { current: null };
    let live = true, frame = 0, last = performance.now();
    loader.loadAsync(previewModel).then(asset => {
      if (!live) { disposeObjects([asset.scene]); return; }
      const model = asset.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const height = Math.max(.01, bounds.max.y - bounds.min.y);
      const scale = 1.64 / height;
      model.scale.setScalar(scale);
      model.position.set(-bounds.getCenter(new THREE.Vector3()).x * scale,
        -bounds.min.y * scale, -bounds.getCenter(new THREE.Vector3()).z * scale);
      applyCustomAvatar(model, latestRef.current);
      scene.add(model);
      modelRef.current = model;
      if (asset.animations[0]) {
        mixer.current = new THREE.AnimationMixer(model);
        mixer.current.clipAction(asset.animations[0]).play();
      }
    }).catch(() => { canvas.dataset.preview = "unavailable"; });
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width)), height = Math.max(1, Math.round(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    const animate = now => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min(.05, (now - last) / 1000);
      last = now;
      mixer.current?.update(dt);
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      mixer.current?.stopAllAction();
      modelRef.current = null;
      disposeObjects([scene]);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="office-custom-preview" aria-hidden="true" />;
}
