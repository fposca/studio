import * as THREE from "three";
import { buildSpaceShipSet } from "./spaceShipInterior.js";

function screenTexture(kind) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  ctx.fillStyle = "#07151b";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(82, 193, 199, 0.13)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "#3ddcce";
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, width - 36, height - 36);
  ctx.fillStyle = "#b7f5e8";
  ctx.font = "bold 24px monospace";
  ctx.fillText(kind === "human" ? "BIO-SCAN  /  HUMAN ANATOMY" : "ASTRO-SCAN  /  PLANETARY SYSTEM", 42, 57);
  ctx.fillStyle = "#e4b977";
  ctx.font = "16px monospace";
  ctx.fillText("NEON SCIENCE DIVISION", 44, height - 34);

  ctx.save();
  ctx.shadowColor = "#42e6e1";
  ctx.shadowBlur = 12;
  ctx.strokeStyle = "#72f1e9";
  ctx.lineWidth = 3;
  if (kind === "human") {
    ctx.translate(252, 92);
    ctx.beginPath();
    ctx.ellipse(0, 48, 36, 45, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-19, 91);
    ctx.lineTo(-23, 108);
    ctx.bezierCurveTo(-74, 106, -85, 130, -70, 202);
    ctx.lineTo(-53, 289);
    ctx.lineTo(-31, 302);
    ctx.lineTo(-26, 387);
    ctx.lineTo(-11, 397);
    ctx.lineTo(0, 304);
    ctx.lineTo(11, 397);
    ctx.lineTo(26, 387);
    ctx.lineTo(31, 302);
    ctx.lineTo(53, 289);
    ctx.lineTo(70, 202);
    ctx.bezierCurveTo(85, 130, 74, 106, 23, 108);
    ctx.lineTo(19, 91);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-28, 118);
    ctx.quadraticCurveTo(0, 143, 28, 118);
    ctx.moveTo(0, 130);
    ctx.lineTo(0, 287);
    ctx.moveTo(-42, 267);
    ctx.quadraticCurveTo(0, 293, 42, 267);
    for (let rib = 0; rib < 5; rib += 1) {
      const y = 150 + rib * 18;
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(-52, y - 27, -48 + rib * 3, y + 22);
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(52, y - 27, 48 - rib * 3, y + 22);
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(232, 151, 112, 0.72)";
    ctx.beginPath();
    ctx.ellipse(13, 188, 13, 19, -0.35, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(265, 270, 146, 0, Math.PI * 2);
    ctx.stroke();
    for (const scale of [0.34, 0.7]) {
      ctx.beginPath();
      ctx.ellipse(265, 270, 146, 146 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(265, 270, 146 * scale, 146, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = "#eab878";
    ctx.beginPath();
    ctx.ellipse(265, 270, 206, 73, -0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#f2c58b";
    ctx.beginPath();
    ctx.arc(463, 218, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7de6dd";
    ctx.beginPath();
    ctx.moveTo(120, 270);
    ctx.lineTo(410, 270);
    ctx.moveTo(265, 124);
    ctx.lineTo(265, 416);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "#96e7de";
  ctx.font = "18px monospace";
  const labels = kind === "human"
    ? ["CRANIAL MAP", "CARDIAC", "SKELETAL", "NEURAL", "VITALS  98.7"]
    : ["ORBITAL PATH", "ATMOSPHERE", "GRAVITY  0.92G", "SURFACE MAP", "SIGNAL  ACTIVE"];
  labels.forEach((label, index) => {
    const y = 135 + index * 68;
    ctx.fillText(label, 505, y);
    ctx.fillStyle = "rgba(76, 218, 213, 0.38)";
    ctx.fillRect(505, y + 10, 195, 7);
    ctx.fillStyle = "#96e7de";
    ctx.fillRect(505, y + 10, 58 + index * 24, 7);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function planetTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#1a3b57");
  gradient.addColorStop(0.45, "#376d84");
  gradient.addColorStop(1, "#142d47");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let seed = 4211;
  const random = () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 220; i += 1) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    ctx.fillStyle = i % 3 ? "rgba(178, 225, 220, 0.18)" : "rgba(10, 34, 52, 0.34)";
    ctx.beginPath();
    ctx.ellipse(x, y, 9 + random() * 65, 3 + random() * 14, random() * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function surfaceReliefTexture(kind) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#777";
  ctx.fillRect(0, 0, 512, 512);
  let seed = kind === "floor" ? 27491 : 39511;
  const random = () => {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let index = 0; index < 380; index += 1) {
    const x = random() * 512;
    const y = random() * 512;
    ctx.fillStyle = index % 3 ? "#858585" : "#686868";
    ctx.fillRect(x, y, 8 + random() * 85, 1);
  }
  if (kind === "floor") {
    for (let row = 0; row < 12; row += 1) {
      for (let column = 0; column < 13; column += 1) {
        const x = 18 + column * 42 + (row % 2) * 21;
        const y = 18 + row * 42;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#4f4f4f";
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 5);
        ctx.lineTo(x, y + 5);
        ctx.moveTo(x + 10, y - 5);
        ctx.lineTo(x, y + 5);
        ctx.stroke();
        ctx.strokeStyle = "#b0b0b0";
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 8);
        ctx.lineTo(x, y + 2);
        ctx.moveTo(x + 10, y - 8);
        ctx.lineTo(x, y + 2);
        ctx.stroke();
      }
    }
  } else {
    for (let y = 28; y < 512; y += 48) {
      ctx.fillStyle = "#4f4f4f";
      ctx.fillRect(0, y, 512, 5);
      ctx.fillStyle = "#a0a0a0";
      ctx.fillRect(0, y + 5, 512, 2);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

function operationsTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#07161b";
  ctx.fillRect(0, 0, 1024, 512);
  ctx.strokeStyle = "rgba(90, 204, 199, 0.13)";
  ctx.lineWidth = 1;
  for (let x = 0; x < 1024; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y < 512; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "#56d4c7";
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 16, 992, 480);
  ctx.fillStyle = "#c6f4e9";
  ctx.font = "bold 26px monospace";
  ctx.fillText("OPERATIONS  /  BRIDGE CONTROL", 40, 55);
  ctx.fillStyle = "#d5ae72";
  ctx.font = "17px monospace";
  ctx.fillText("NAVIGATION ARRAY  07", 40, 90);
  ctx.fillText("SYSTEMS NOMINAL", 785, 90);
  ctx.save();
  ctx.translate(382, 288);
  ctx.shadowColor = "#52d8d2";
  ctx.shadowBlur = 11;
  ctx.strokeStyle = "#72e3d7";
  ctx.lineWidth = 2;
  for (const radius of [62, 115, 168]) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-190, 0);
  ctx.lineTo(190, 0);
  ctx.moveTo(0, -190);
  ctx.lineTo(0, 190);
  ctx.stroke();
  ctx.fillStyle = "rgba(104, 223, 218, 0.28)";
  ctx.beginPath();
  ctx.moveTo(0, -68);
  ctx.lineTo(37, 44);
  ctx.lineTo(0, 23);
  ctx.lineTo(-37, 44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#efbb7f";
  ctx.beginPath();
  ctx.arc(0, 0, 145, -0.15, 0.66);
  ctx.stroke();
  ctx.restore();
  const systems = [
    ["REACTOR", 0.86],
    ["SHIELDS", 0.72],
    ["LIFE SUPPORT", 0.94],
    ["PROPULSION", 0.64],
    ["COMMS ARRAY", 0.78]
  ];
  ctx.font = "18px monospace";
  systems.forEach(([label, level], index) => {
    const y = 157 + index * 69;
    ctx.fillStyle = "#bce8df";
    ctx.fillText(label, 676, y);
    ctx.fillStyle = "#16444a";
    ctx.fillRect(676, y + 13, 266, 13);
    ctx.fillStyle = index === 3 ? "#d8ab73" : "#64d6ca";
    ctx.fillRect(676, y + 13, 266 * level, 13);
  });
  ctx.fillStyle = "#8fded3";
  ctx.font = "16px monospace";
  ctx.fillText("VECTOR  42.7 /  ORBIT LOCK", 50, 473);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createSpaceShipSet() {
  return buildSpaceShipSet({ screenTexture, planetTexture, surfaceReliefTexture, operationsTexture });
}
