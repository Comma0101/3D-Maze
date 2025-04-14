import React, { useRef, useEffect } from "react";
import * as THREE from "three";

const Checkpoint = ({ position }) => {
  const meshRef = useRef();
  const pointLightRef = useRef();

  useEffect(() => {
    // Optional: Add subtle animation or effect on load/activation later
  }, []);

  return (
    <group position={position}>
      {/* Checkpoint Pad */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
      >
        <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
        <meshStandardMaterial
          color="#40E0D0" // Turquoise color
          emissive="#40E0D0"
          emissiveIntensity={0.6}
          metalness={0.2}
          roughness={0.6}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Point Light for Glow */}
      <pointLight
        ref={pointLightRef}
        position={[0, 0.5, 0]}
        color="#40E0D0"
        intensity={5} // Adjust intensity for desired glow
        distance={3} // Adjust distance for glow falloff
        decay={2}
      />
    </group>
  );
};

export default Checkpoint;
