import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Basic spike wall trap component
function SpikeWallTrap({ position, orientation = "horizontal" }) {
  const trapRef = useRef();
  const initialPosition = useRef(new THREE.Vector3(...position)).current;
  const movementRange = 0.9; // How far it moves from center (total 1.8 units)
  const speed = 1; // Reduced speed from 2

  useFrame((state) => {
    if (trapRef.current) {
      const time = state.clock.elapsedTime * speed;
      const offset = Math.sin(time) * movementRange;

      if (orientation === "horizontal") {
        trapRef.current.position.x = initialPosition.x + offset;
        trapRef.current.position.z = initialPosition.z; // Keep Z fixed
      } else {
        // Vertical orientation (moves along Z)
        trapRef.current.position.z = initialPosition.z + offset;
        trapRef.current.position.x = initialPosition.x; // Keep X fixed
      }
      // Keep Y fixed
      trapRef.current.position.y = initialPosition.y;
    }
  });

  return (
    <mesh
      ref={trapRef}
      position={position} // Initial position set here
      castShadow
      receiveShadow
      userData={{ type: "trap", damage: 100 }} // Add type for collision
    >
      {/* Main wall body */}
      <boxGeometry args={[0.8, 1.8, 0.2]} /> {/* Adjust size as needed */}
      <meshStandardMaterial
        color="#555555"
        metalness={0.8}
        roughness={0.3}
        emissive="#333333"
        emissiveIntensity={0.4}
      />
      {/* Optional: Add simple spikes */}
      {[...Array(5)].map((_, i) => (
        <mesh
          key={`spike-${i}`}
          position={[
            orientation === "horizontal" ? 0 : (i - 2) * 0.15, // Spikes along Z for horizontal movement
            (i - 2) * 0.3, // Spread spikes vertically
            orientation === "horizontal" ? (i - 2) * 0.15 : 0, // Spikes along X for vertical movement
          ]}
          rotation={[
            orientation === "horizontal" ? Math.PI / 2 : 0,
            0,
            orientation === "vertical" ? Math.PI / 2 : 0,
          ]}
        >
          <coneGeometry args={[0.05, 0.3, 4]} /> {/* Small sharp cones */}
          <meshStandardMaterial
            color="#cccccc"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
      ))}
    </mesh>
  );
}

export default SpikeWallTrap;
