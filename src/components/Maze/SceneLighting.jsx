import { useMemo } from "react";

export default function SceneLighting() {
  return useMemo(
    () => (
      <>
        <ambientLight intensity={0.5} color="#ffffff" />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        >
          <orthographicCamera
            attach="shadow-camera"
            args={[-10, 10, 10, -10]}
          />
        </directionalLight>
        <pointLight position={[0, 20, 0]} intensity={0.5} color="#ffffff" />
        <fog attach="fog" args={["#222222", 5, 50]} />
      </>
    ),
    []
  );
}
