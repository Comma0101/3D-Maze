// src/components/Player/Player.jsx
import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, Raycaster } from "three";
import { PerspectiveCamera } from "@react-three/drei";
import useKeyboardControls from "../../hooks/useKeyboardControls";
import useGameStore from "../../state/gameStore";
import useColyseus from "../Networking/useColyseus";
import { CELL_TYPES } from "../Maze/MazeGenerator";

export default function Player({ startPosition = [0, 0.5, 0] }) {
  const ref = useRef();
  const { forward, backward, left, right } = useKeyboardControls();
  const { sendMove, sendFinish } = useColyseus();
  const {
    setPlayerPosition,
    playerPositions,
    raceFinished,
    setRaceFinished,
    playerId,
  } = useGameStore((state) => state);
  const { scene } = useThree();
  const [collisionObjects, setCollisionObjects] = useState([]);
  const raycaster = new Raycaster();
  const playerSize = 0.4; // Half the size of the player for collision detection

  // Set initial position
  useEffect(() => {
    if (ref.current) {
      ref.current.position.set(
        startPosition[0],
        startPosition[1],
        startPosition[2]
      );
    }
  }, [startPosition]);

  // Find all wall objects for collision detection
  useEffect(() => {
    // Get all meshes in the scene that could be walls
    const objects = [];
    scene.traverse((object) => {
      if (
        object.isMesh &&
        (object.userData.type === "wall" ||
          object.userData.type === "obstacle") &&
        object.userData.type !== "finish" // Exclude finish marker from collision objects
      ) {
        objects.push(object);
      }
    });
    console.log("Found collision objects:", objects.length);
    setCollisionObjects(objects);
  }, [scene]);

  // Check for collisions in a given direction
  const checkCollision = (position, direction) => {
    // Just check from the center position
    raycaster.set(position, direction);
    raycaster.far = playerSize + 0.1; // Only check for very nearby collisions
    const intersects = raycaster.intersectObjects(collisionObjects, false);

    if (intersects.length > 0) {
      console.log("Collision detected in direction:", direction);
      return true;
    }

    return false;
  };

  // Frame counter for logging
  const frameCounter = useRef(0);

  useFrame((_, delta) => {
    if (raceFinished || !ref.current) return;

    // Increment frame counter
    frameCounter.current += 1;

    // Faster speed for better gameplay
    const speed = 7;
    const pos = ref.current.position.clone();

    // Create movement vectors for each direction
    const forwardVec = new Vector3(0, 0, -1);
    const backwardVec = new Vector3(0, 0, 1);
    const leftVec = new Vector3(-1, 0, 0);
    const rightVec = new Vector3(1, 0, 0);

    // Store the original position to revert if collision occurs
    const originalPos = ref.current.position.clone();

    // Apply movement with collision detection
    if (forward && !checkCollision(pos, forwardVec)) {
      ref.current.position.z -= speed * delta;
    }
    if (backward && !checkCollision(pos, backwardVec)) {
      ref.current.position.z += speed * delta;
    }
    if (left && !checkCollision(pos, leftVec)) {
      ref.current.position.x -= speed * delta;
    }
    if (right && !checkCollision(pos, rightVec)) {
      ref.current.position.x += speed * delta;
    }

    // Update position in store
    const currentPos = ref.current.position;
    setPlayerPosition(playerId, {
      x: currentPos.x,
      y: currentPos.y,
      z: currentPos.z,
    });

    // Log player position every 60 frames (approximately once per second)
    if (frameCounter.current % 60 === 0) {
      console.log("Player position updated:", {
        x: currentPos.x.toFixed(2),
        y: currentPos.y.toFixed(2),
        z: currentPos.z.toFixed(2),
      });
    }

    // Send position to server
    sendMove({
      x: currentPos.x,
      y: currentPos.y,
      z: currentPos.z,
    });
  });

  // Render other players
  const otherPlayers = Object.entries(playerPositions)
    .filter(([id]) => id !== playerId) // Use the dynamic playerId from the store
    .map(([id, position]) => (
      <mesh key={id} position={[position.x, position.y, position.z]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#3377ff" />
      </mesh>
    ));

  return (
    <>
      {/* Local player */}
      <mesh
        ref={ref}
        position={startPosition}
        castShadow
        userData={{ type: "player" }}
      >
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#ff7733" />

        {/* Player camera - positioned behind and above the player */}
        <PerspectiveCamera
          makeDefault
          position={[0, 8, 8]}
          rotation={[-Math.PI / 4, 0, 0]}
          fov={60}
        />
      </mesh>

      {/* Other players */}
      {otherPlayers}
    </>
  );
}
