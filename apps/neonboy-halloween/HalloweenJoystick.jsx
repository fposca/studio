import React, { useEffect, useRef, useState } from "react";
import { joystickVector } from "./halloweenJoystick.js";

const STOP = { x: 0, y: 0 };

export default function HalloweenJoystick({ inputRef }) {
  const activePointer = useRef(null);
  const [offset, setOffset] = useState(STOP);

  const reset = () => {
    activePointer.current = null;
    inputRef.current = STOP;
    setOffset(STOP);
  };
  useEffect(() => {
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("blur", reset);
      inputRef.current = STOP;
    };
  }, [inputRef]);

  const move = (event) => {
    if (activePointer.current !== event.pointerId) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const travel = (Math.min(rect.width, rect.height) - 48) / 2;
    const { x, y, offsetX, offsetY } = joystickVector(event.clientX, event.clientY, rect, travel);
    inputRef.current = { x, y };
    setOffset({ x: offsetX, y: offsetY });
  };
  const release = (event) => {
    if (activePointer.current !== event.pointerId) return;
    event.preventDefault();
    reset();
    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return <div className="halloween-joystick" role="group" aria-label="Joystick para mover a NeonBoy"
    onPointerDown={(event) => {
      if (activePointer.current !== null) return;
      activePointer.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      move(event);
    }}
    onPointerMove={move} onPointerUp={release} onPointerCancel={release}
    onLostPointerCapture={(event) => { if (activePointer.current === event.pointerId) reset(); }}>
    <span className="halloween-joystick-track" aria-hidden="true" />
    <span className="halloween-joystick-knob" aria-hidden="true"
      style={{ transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)` }} />
  </div>;
}
