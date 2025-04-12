// src/main.jsx
import { createRoot } from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import "./index.css";
import App from "./App.jsx";
import AppUI from "./AppUI.jsx";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <>
    {/* 3D Scene rendered via react-three-fiber */}
    <Canvas
      shadows
      camera={{ position: [0, 0, 0], fov: 75 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <App />
    </Canvas>
    {/* UI Overlay rendered normally in the DOM */}
    <AppUI />
  </>
);
