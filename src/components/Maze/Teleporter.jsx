import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Teleporter pad component
function Teleporter({ position }) {
  const meshRef = useRef();
  const ringRef = useRef();

  // Simple rotation animation for effect
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    // Add userData to the group for easier identification
    <group position={position} userData={{ type: "teleporter" }}>
      {/* Base Pad */}
      <mesh ref={meshRef} position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
        <meshStandardMaterial
          color="#8a2be2" // BlueViolet
          metalness={0.3}
          roughness={0.6}
          emissive="#4b0082" // Indigo
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Animated Ring */}
      <mesh ref={ringRef} position={[0, 0.15, 0]}>
        <ringGeometry args={[0.3, 0.35, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1.5}
          side={THREE.DoubleSide}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Optional: Light source */}
      <pointLight
        position={[0, 0.5, 0]}
        color="#8a2be2"
        intensity={2}
        distance={5}
      />
    </group>
  );
}

export default Teleporter;
