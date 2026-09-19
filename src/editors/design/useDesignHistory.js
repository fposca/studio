import { useEffect, useRef, useState } from "react";

const copyState = (value) => structuredClone(value);

export default function useDesignHistory(value, setValue) {
  const valueRef = useRef(value);
  const undoRef = useRef([]);
  const redoRef = useRef([]);
  const [version, setVersion] = useState(0);

  useEffect(() => { valueRef.current = value; }, [value]);

  function record() {
    undoRef.current.push(copyState(valueRef.current));
    if (undoRef.current.length > 80) undoRef.current.shift();
    redoRef.current = [];
    setVersion((current) => current + 1);
  }

  function commit(updater) {
    record();
    setValue((current) => typeof updater === "function" ? updater(current) : updater);
  }

  function undo() {
    const previous = undoRef.current.pop();
    if (!previous) return;
    redoRef.current.push(copyState(valueRef.current));
    setValue(copyState(previous));
    setVersion((current) => current + 1);
  }

  function redo() {
    const next = redoRef.current.pop();
    if (!next) return;
    undoRef.current.push(copyState(valueRef.current));
    setValue(copyState(next));
    setVersion((current) => current + 1);
  }

  function reset() {
    undoRef.current = [];
    redoRef.current = [];
    setVersion((current) => current + 1);
  }

  return {
    canRedo: redoRef.current.length > 0,
    canUndo: undoRef.current.length > 0,
    commit,
    record,
    redo,
    reset,
    undo,
    version
  };
}
