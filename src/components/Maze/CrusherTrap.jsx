import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Vertical crusher trap component
function CrusherTrap({ position }) {
  const crusherRef = useRef();
  const speed = 0.5; // Drastically reduced speed from 1.2
  const range = 1.8; // Vertical distance to travel (ceiling to near floor)
  const ceilingHeight = 2.5; // Y position when fully retracted
  const floorTarget = ceilingHeight - range; // Y position when fully extended
  // Removed delay and isActive state for simplification

  useFrame((state) => {
    if (crusherRef.current) {
      const time = state.clock.elapsedTime * speed; // Use elapsed time directly
      // Use a sine wave for smooth up/down motion, mapped to the range
      // Offset by PI/2 so it starts moving down
      const verticalOffset = (Math.sin(time - Math.PI / 2) + 1) / 2; // Normalize sine wave to 0-1 range
      let currentY = ceilingHeight - verticalOffset * range;
      // Round to 4 decimal places to potentially reduce jitter
      currentY = Math.round(currentY * 10000) / 10000;

      crusherRef.current.position.y = currentY;
    }
  });

  return (
    <mesh
      ref={crusherRef}
      position={[position[0], ceilingHeight, position[2]]} // Start at ceiling
      castShadow
      receiveShadow
      userData={{ type: "trap", damage: 100 }} // Add type for collision
    >
      <boxGeometry args={[0.9, 0.9, 0.9]} /> {/* Crusher block */}
      <meshStandardMaterial
        color="#696969" // Dark gray
        metalness={0.6}
        roughness={0.5}
        emissive="#333333"
        emissiveIntensity={0.2}
      />
      {/* Optional: Add some detail like bolts or panels */}
    </mesh>
  );
}

export default CrusherTrap;
