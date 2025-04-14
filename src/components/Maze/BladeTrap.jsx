import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Rotating blade trap component
function BladeTrap({ position }) {
  const bladeGroupRef = useRef();
  const speed = 1.5; // Reduced rotation speed from 3

  useFrame((state, delta) => {
    if (bladeGroupRef.current) {
      bladeGroupRef.current.rotation.y += speed * delta;
    }
  });

  return (
    <group position={position}>
      {/* Central Pole */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 1.8, 8]} /> {/* Pole geometry */}
        <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Rotating Blades Group */}
      <group ref={bladeGroupRef} position={[0, 0.9, 0]}>
        {/* Blade 1 */}
        <mesh
          position={[0.5, 0, 0]} // Offset from center
          rotation={[0, 0, Math.PI / 2]} // Rotate to be flat
          castShadow
          userData={{ type: "trap", damage: 100 }} // Add type for collision
        >
          <boxGeometry args={[1.0, 0.1, 0.3]} /> {/* Blade shape */}
          <meshStandardMaterial
            color="#b0c4de" // Light steel blue
            metalness={0.9}
            roughness={0.2}
            emissive="#555555"
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Blade 2 (opposite) */}
        <mesh
          position={[-0.5, 0, 0]} // Offset from center
          rotation={[0, 0, Math.PI / 2]} // Rotate to be flat
          castShadow
          userData={{ type: "trap", damage: 100 }} // Add type for collision
        >
          <boxGeometry args={[1.0, 0.1, 0.3]} /> {/* Blade shape */}
          <meshStandardMaterial
            color="#b0c4de"
            metalness={0.9}
            roughness={0.2}
            emissive="#555555"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* Base Plate (optional visual) */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
        <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.5} />
      </mesh>
    </group>
  );
}

export default BladeTrap;
