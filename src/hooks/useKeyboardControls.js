// src/hooks/useKeyboardControls.js
import { useState, useEffect } from "react";

export default function useKeyboardControls() {
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.code === "KeyW") setKeys((k) => ({ ...k, forward: true }));
      if (e.code === "KeyS") setKeys((k) => ({ ...k, backward: true }));
      if (e.code === "KeyA") setKeys((k) => ({ ...k, left: true }));
      if (e.code === "KeyD") setKeys((k) => ({ ...k, right: true }));
    }
    function handleKeyUp(e) {
      if (e.code === "KeyW") setKeys((k) => ({ ...k, forward: false }));
      if (e.code === "KeyS") setKeys((k) => ({ ...k, backward: false }));
      if (e.code === "KeyA") setKeys((k) => ({ ...k, left: false }));
      if (e.code === "KeyD") setKeys((k) => ({ ...k, right: false }));
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return keys;
}
