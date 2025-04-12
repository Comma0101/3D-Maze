// src/components/Player/Player.jsx
import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, Raycaster } from "three";
import { PerspectiveCamera } from "@react-three/drei";
import useKeyboardControls from "../../hooks/useKeyboardControls";
import useGameStore from "../../state/gameStore";
import useColyseus from "../Networking/useColyseus";
import { CELL_TYPES, CAMERA_MODES, GAME_CONFIG } from "../../utils/constants";
import { calculateDistance } from "../../utils/helpers";

export default function Player({ startPosition = [0, 0.5, 0] }) {
  const ref = useRef();
  const thirdPersonCameraRef = useRef();
  const firstPersonCameraRef = useRef();
  const { forward, backward, left, right } = useKeyboardControls();
  const { sendMove, sendFinish } = useColyseus();
  const {
    setPlayerPosition,
    playerPositions,
    raceFinished,
    setRaceFinished,
    playerId,
    currentMazeIndex,
    cameraMode,
  } = useGameStore((state) => state);
  const { scene } = useThree();
  const [collisionObjects, setCollisionObjects] = useState([]);
  const raycaster = new Raycaster();
  const playerSize = GAME_CONFIG.PLAYER_SIZE; // Half the size of the player for collision detection

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

  // Find all wall objects for collision detection and finish position
  useEffect(() => {
    // Get all meshes in the scene that could be walls
    const objects = [];
    let finishObject = null;

    scene.traverse((object) => {
      if (object.isMesh) {
        if (
          (object.userData.type === "wall" ||
            object.userData.type === "obstacle") &&
          object.userData.type !== "finish"
        ) {
          objects.push(object);
        }

        // Find the finish object
        if (object.userData.type === CELL_TYPES.FINISH) {
          finishObject = object;
        }
      }
    });

    console.log(
      "Found collision objects:",
      objects.length,
      "for maze index:",
      currentMazeIndex
    );
    setCollisionObjects(objects);
  }, [scene, currentMazeIndex]); // Re-run when maze changes

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
  const hasFinished = useRef(false);
  useEffect(() => {
    hasFinished.current = false;
  }, [currentMazeIndex]);

  useFrame((_, delta) => {
    if (raceFinished || !ref.current) return;
    if (hasFinished.current) return;

    // Increment frame counter
    frameCounter.current += 1;

    // Use speed from constants
    const speed = GAME_CONFIG.PLAYER_SPEED;
    const pos = ref.current.position.clone();

    // Create movement vectors for each direction
    let forwardVec, backwardVec, leftVec, rightVec;

    if (
      cameraMode === CAMERA_MODES.FIRST_PERSON &&
      firstPersonCameraRef.current
    ) {
      const camera = firstPersonCameraRef.current;
      const direction = new Vector3();
      camera.getWorldDirection(direction);
      direction.y = 0;
      direction.normalize();

      forwardVec = direction.clone();
      backwardVec = direction.clone().negate();

      rightVec = new Vector3()
        .crossVectors(forwardVec, new Vector3(0, 1, 0))
        .normalize();
      leftVec = rightVec.clone().negate();
    } else {
      forwardVec = new Vector3(0, 0, -1);
      backwardVec = new Vector3(0, 0, 1);
      leftVec = new Vector3(-1, 0, 0);
      rightVec = new Vector3(1, 0, 0);
    }

    // Store the original position to revert if collision occurs
    const originalPos = ref.current.position.clone();

    // Apply movement with collision detection
    if (cameraMode === CAMERA_MODES.FIRST_PERSON) {
      if (forward && !checkCollision(pos, forwardVec)) {
        ref.current.position.add(
          forwardVec.clone().multiplyScalar(speed * delta)
        );
      }
      if (backward && !checkCollision(pos, backwardVec)) {
        ref.current.position.add(
          backwardVec.clone().multiplyScalar(speed * delta)
        );
      }
      if (left && !checkCollision(pos, leftVec)) {
        ref.current.position.add(leftVec.clone().multiplyScalar(speed * delta));
      }
      if (right && !checkCollision(pos, rightVec)) {
        ref.current.position.add(
          rightVec.clone().multiplyScalar(speed * delta)
        );
      }
    } else {
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
    }

    // Update position in store
    const currentPos = ref.current.position;
    setPlayerPosition(playerId, {
      x: currentPos.x,
      y: currentPos.y,
      z: currentPos.z,
    });

    // Update position in store without logging

    // Check for finish directly in the player component as a backup detection method
    // This provides an additional way to detect reaching the finish
    if (!useGameStore.getState().raceFinished && !hasFinished.current) {
      // Find any finish objects in the scene
      let closestFinishDistance = Infinity;
      let closestFinishPos = null;

      scene.traverse((object) => {
        if (object.isMesh && object.userData.type === "finish") {
          const finishPos = object.position;
          const playerPos = ref.current.position;

          // Calculate distance to finish using helper function
          const totalDistance = calculateDistance(playerPos, finishPos);

          // Track the closest finish object
          if (totalDistance < closestFinishDistance) {
            closestFinishDistance = totalDistance;
            closestFinishPos = finishPos;
          }
        }
      });

      // Log the closest finish position every 60 frames
      if (frameCounter.current % 60 === 0 && closestFinishPos) {
        console.log("Closest finish position:", closestFinishPos);
        console.log("Distance to closest finish:", closestFinishDistance);
      }

      // Use threshold from constants
      if (closestFinishDistance < GAME_CONFIG.FINISH_DETECTION_THRESHOLD) {
        hasFinished.current = true;
        console.log("PLAYER COMPONENT: Detected finish position!");
        console.log("Distance to finish:", closestFinishDistance);
        setRaceFinished(true);
        sendFinish();
        return; // Stop further processing after finishing
      }
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

  useEffect(() => {
    console.log("DEBUG: raceFinished state changed:", raceFinished);
  }, [raceFinished]);

  // Mouse look for first-person camera
  useEffect(() => {
    const handleMouseMove = (event) => {
      if (
        cameraMode !== CAMERA_MODES.FIRST_PERSON ||
        !firstPersonCameraRef.current
      )
        return;

      const { movementX, movementY } = event;

      const camera = firstPersonCameraRef.current;
      camera.rotation.order = "YXZ"; // yaw-pitch-roll

      camera.rotation.y -= movementX * 0.002;
      camera.rotation.x -= movementY * 0.002;

      // Clamp vertical look
      const PI_2 = Math.PI / 2;
      camera.rotation.x = Math.max(-PI_2, Math.min(PI_2, camera.rotation.x));
    };

    const handleClick = () => {
      document.body.requestPointerLock();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleClick);
    };
  }, [cameraMode]);

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

        {/* Third-person camera - positioned behind and above the player */}
        <PerspectiveCamera
          ref={thirdPersonCameraRef}
          makeDefault={cameraMode === CAMERA_MODES.THIRD_PERSON}
          position={[0, 8, 8]}
          rotation={[-Math.PI / 4, 0, 0]}
          fov={60}
        />

        {/* First-person camera - positioned at eye level */}
        <PerspectiveCamera
          ref={firstPersonCameraRef}
          makeDefault={cameraMode === CAMERA_MODES.FIRST_PERSON}
          position={[0, 0.4, 0]}
          rotation={[0, 0, 0]}
          fov={75}
        />
      </mesh>

      {/* Other players */}
      {otherPlayers}
    </>
  );
}
