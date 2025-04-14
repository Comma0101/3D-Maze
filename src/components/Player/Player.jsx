// src/components/Player/Player.jsx
import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three"; // Import all of THREE
const { Vector3, Raycaster, Box3 } = THREE; // Destructure needed classes
import { PerspectiveCamera, Html } from "@react-three/drei"; // Import Html
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
    teleporterPairs,
    checkpoints, // Get checkpoint locations
    lastCheckpoint,
    setLastCheckpoint,
    applyRespawnPenalty, // Get penalty action
  } = useGameStore((state) => state);
  const { scene, camera } = useThree();
  const [collisionObjects, setCollisionObjects] = useState([]);
  const [trapObjects, setTrapObjects] = useState([]);
  const [teleporterObjects, setTeleporterObjects] = useState([]);
  const [checkpointObjects, setCheckpointObjects] = useState([]); // State for checkpoint groups
  const raycaster = new Raycaster();
  const playerSize = GAME_CONFIG.PLAYER_SIZE;
  const playerBox = useRef(new Box3());
  const trapBox = useRef(new Box3());
  const teleporterPosVec = useRef(new Vector3()); // Reusable vector for teleporter position
  const destinationPosVec = useRef(new Vector3()); // Reusable vector for destination
  const lastTeleportTime = useRef(0); // Cooldown timer for teleporting

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

  // Find all wall, trap, finish, and teleporter objects
  useEffect(() => {
    console.log("Traversing scene to find objects...");
    const walls = [];
    const traps = [];
    const teleporters = [];
    const checkpointsFound = []; // Temporary array for checkpoints
    let finishObject = null;

    scene.traverse((object) => {
      // Check for groups first (teleporters, checkpoints)
      if (object.isGroup) {
        if (object.userData?.type === "teleporter") {
          const basePad = object.children?.find(
            (child) =>
              child.isMesh && child.geometry instanceof THREE.CylinderGeometry
          );
          if (basePad) {
            teleporters.push(basePad); // Store the base pad mesh
          }
        } else if (object.userData?.type === "checkpoint") {
          checkpointsFound.push(object); // Store the group object
        }
      }
      // Check other mesh types
      else if (object.isMesh) {
        // Removed redundant teleporter check here
        switch (object.userData?.type) {
          case "wall":
          case "obstacle":
            walls.push(object);
            break;
          case "trap":
            traps.push(object);
            break;
          case "finish":
            finishObject = object;
            break;
          // No default needed
        }
      }
    });

    console.log(
      `Found objects for maze ${currentMazeIndex}: Walls=${
        walls.length
      }, Traps=${traps.length}, Teleporters=${
        teleporters.length
      }, Checkpoints=${checkpointsFound.length}, Finish=${finishObject ? 1 : 0}`
    );
    setCollisionObjects(walls);
    setTrapObjects(traps);
    setTeleporterObjects(teleporters);
    setCheckpointObjects(checkpointsFound); // Set checkpoint group objects
  }, [scene, currentMazeIndex]); // Rerun when scene changes (e.g., new maze)

  // Check for wall collisions in a given direction
  const checkCollision = (position, direction) => {
    raycaster.set(position, direction);
    raycaster.far = playerSize + 0.1;
    const intersects = raycaster.intersectObjects(collisionObjects, false);
    return intersects.length > 0;
  };

  // Respawn function - Updated to use lastCheckpoint and apply penalty
  const handleRespawn = () => {
    console.log("Player hit a trap! Respawning...");
    applyRespawnPenalty(); // Apply time penalty
    if (ref.current && scene.userData.halfWidth !== undefined) {
      let respawnX, respawnY, respawnZ;

      if (lastCheckpoint) {
        console.log("Respawning at last checkpoint:", lastCheckpoint);
        // Convert checkpoint grid coords back to world coords
        respawnX = lastCheckpoint.x - scene.userData.halfWidth;
        respawnZ = lastCheckpoint.y - scene.userData.halfHeight; // Grid Y maps to World Z
        respawnY = startPosition[1]; // Keep original Y height
      } else {
        console.log("No checkpoint reached, respawning at start.");
        respawnX = startPosition[0];
        respawnY = startPosition[1];
        respawnZ = startPosition[2];
      }

      ref.current.position.set(respawnX, respawnY, respawnZ);
      const respawnPos = { x: respawnX, y: respawnY, z: respawnZ };
      setPlayerPosition(playerId, respawnPos);
      sendMove(respawnPos);
    } else {
      console.error("Cannot respawn: Player ref or scene data missing.");
    }
  };

  // Frame counter for logging
  const frameCounter = useRef(0);
  const hasFinished = useRef(false);
  useEffect(() => {
    hasFinished.current = false; // Reset finish flag when maze changes
  }, [currentMazeIndex]);

  useFrame((_, delta) => {
    if (raceFinished || !ref.current) return;
    if (hasFinished.current) return;

    frameCounter.current += 1;
    const speed = GAME_CONFIG.PLAYER_SPEED;
    const pos = ref.current.position.clone();

    // --- Movement ---
    let forwardVec, backwardVec, leftVec, rightVec;
    if (
      cameraMode === CAMERA_MODES.FIRST_PERSON &&
      firstPersonCameraRef.current
    ) {
      const cam = firstPersonCameraRef.current;
      const direction = new Vector3();
      cam.getWorldDirection(direction);
      direction.y = 0;
      direction.normalize();
      forwardVec = direction;
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

    if (cameraMode === CAMERA_MODES.FIRST_PERSON) {
      if (forward && !checkCollision(pos, forwardVec))
        ref.current.position.add(
          forwardVec.clone().multiplyScalar(speed * delta)
        );
      if (backward && !checkCollision(pos, backwardVec))
        ref.current.position.add(
          backwardVec.clone().multiplyScalar(speed * delta)
        );
      if (left && !checkCollision(pos, leftVec))
        ref.current.position.add(leftVec.clone().multiplyScalar(speed * delta));
      if (right && !checkCollision(pos, rightVec))
        ref.current.position.add(
          rightVec.clone().multiplyScalar(speed * delta)
        );
    } else {
      if (forward && !checkCollision(pos, forwardVec))
        ref.current.position.z -= speed * delta;
      if (backward && !checkCollision(pos, backwardVec))
        ref.current.position.z += speed * delta;
      if (left && !checkCollision(pos, leftVec))
        ref.current.position.x -= speed * delta;
      if (right && !checkCollision(pos, rightVec))
        ref.current.position.x += speed * delta;
    }
    // --- End Movement ---

    const playerCurrentPos = ref.current.position;
    playerBox.current.setFromObject(ref.current); // Update player bounding box

    // --- Trap Collision Check ---
    for (const trap of trapObjects) {
      if (trap && trap.geometry && trap.visible) {
        trapBox.current.setFromObject(trap);
        if (playerBox.current.intersectsBox(trapBox.current)) {
          handleRespawn();
          return;
        }
      }
    }
    // --- End Trap Collision Check ---

    // --- Teleporter Collision Check ---
    const teleporterRadius = 0.4;
    const activationHeight = 0.8;
    if (
      teleporterObjects.length > 0 &&
      teleporterPairs.length > 0 &&
      scene.userData.halfWidth !== undefined
    ) {
      // Check pairs and scene data exist
      for (const teleporterBasePad of teleporterObjects) {
        if (teleporterBasePad.visible && teleporterBasePad.geometry) {
          // Get the CURRENT world position of the base pad mesh
          teleporterBasePad.getWorldPosition(teleporterPosVec.current);
          const teleporterPos = teleporterPosVec.current;

          const dx = playerCurrentPos.x - teleporterPos.x;
          const dz = playerCurrentPos.z - teleporterPos.z;
          const horizontalDistance = Math.sqrt(dx * dx + dz * dz);

          const isInRadius = horizontalDistance < teleporterRadius;
          const isAtHeight = playerCurrentPos.y < activationHeight;

          // Log distances and heights every few frames for debugging
          if (frameCounter.current % 10 === 0) {
            console.log(
              `Teleporter Check: Dist=${horizontalDistance.toFixed(
                2
              )}, PlayerY=${playerCurrentPos.y.toFixed(
                2
              )}, InRadius=${isInRadius}, AtHeight=${isAtHeight}`
            );
          }

          if (isInRadius && isAtHeight) {
            // Check cooldown
            const now = Date.now();
            if (now - lastTeleportTime.current < 1000) {
              // 1 second cooldown
              continue; // Skip if recently teleported
            }

            console.log(`Player activated teleporter!`);

            // Find the destination for this teleporter
            let destination = null;
            // Convert current teleporter world pos back to approximate grid coords
            const currentPadCoords = {
              x: Math.round(teleporterPos.x + scene.userData.halfWidth),
              y: Math.round(teleporterPos.z + scene.userData.halfHeight),
            };

            for (const pair of teleporterPairs) {
              if (
                pair.entry.x === currentPadCoords.x &&
                pair.entry.y === currentPadCoords.y
              ) {
                destination = pair.exit;
                break;
              }
              if (
                pair.exit.x === currentPadCoords.x &&
                pair.exit.y === currentPadCoords.y
              ) {
                destination = pair.entry;
                break;
              }
            }

            if (destination) {
              console.log(
                `Teleporting from ${JSON.stringify(
                  currentPadCoords
                )} to ${JSON.stringify(destination)}`
              );
              // Convert destination grid coords back to world coords
              const destWorldX = destination.x - scene.userData.halfWidth;
              const destWorldZ = destination.y - scene.userData.halfHeight;
              // Add small offset to avoid landing exactly on the exit pad center
              destinationPosVec.current.set(
                destWorldX + 0.1,
                playerCurrentPos.y,
                destWorldZ + 0.1
              );

              ref.current.position.copy(destinationPosVec.current);
              lastTeleportTime.current = now; // Update last teleport time

              // Update state immediately
              setPlayerPosition(playerId, {
                x: destinationPosVec.current.x,
                y: destinationPosVec.current.y,
                z: destinationPosVec.current.z,
              });
              // Send new position
              sendMove({
                x: destinationPosVec.current.x,
                y: destinationPosVec.current.y,
                z: destinationPosVec.current.z,
              });
            } else {
              console.warn(
                "Could not find destination for teleporter at:",
                currentPadCoords,
                "World:",
                teleporterPos
              );
              // Fallback: Teleport back to start if destination not found
              ref.current.position.set(
                startPosition[0],
                startPosition[1],
                startPosition[2]
              );
              setPlayerPosition(playerId, {
                x: startPosition[0],
                y: startPosition[1],
                z: startPosition[2],
              });
              sendMove({
                x: startPosition[0],
                y: startPosition[1],
                z: startPosition[2],
              });
            }
            return; // Stop processing this frame after teleport
          }
        }
      }
    }
    // --- End Teleporter Collision Check ---

    // --- Checkpoint Collision Check ---
    const checkpointRadius = 0.6; // Increased radius slightly
    if (
      checkpointObjects.length > 0 &&
      scene.userData.halfWidth !== undefined
    ) {
      for (const checkpointGroup of checkpointObjects) {
        if (
          checkpointGroup.visible &&
          checkpointGroup.userData?.type === "checkpoint"
        ) {
          const checkpointPos = checkpointGroup.position; // Group's position is the center
          const dx = playerCurrentPos.x - checkpointPos.x;
          const dz = playerCurrentPos.z - checkpointPos.z;
          const distance = Math.sqrt(dx * dx + dz * dz);

          if (distance < checkpointRadius) {
            // Log checkpoint collision detection
            console.log(
              `Collision detected with checkpoint at distance: ${distance.toFixed(
                2
              )}`
            );
            const currentCheckpointCoords = {
              x: checkpointGroup.userData.gridX,
              y: checkpointGroup.userData.gridY,
            };

            // Check if this is a *new* checkpoint
            if (
              !lastCheckpoint ||
              lastCheckpoint.x !== currentCheckpointCoords.x ||
              lastCheckpoint.y !== currentCheckpointCoords.y
            ) {
              console.log(
                "Player reached NEW checkpoint:",
                currentCheckpointCoords,
                "Previous:",
                lastCheckpoint
              );
              setLastCheckpoint(currentCheckpointCoords);
              // Optional: Add visual/audio feedback here
            } else {
              // Log if player hits the *same* checkpoint again (for debugging)
              // if (frameCounter.current % 60 === 0) { // Log less frequently
              //    console.log("Player at existing checkpoint:", currentCheckpointCoords);
              // }
            }
            // No need to 'break' or 'return', player can pass through multiple checkpoints
          }
        }
      }
    }
    // --- End Checkpoint Collision Check ---

    // Update position in store if no collision occurred
    setPlayerPosition(playerId, {
      x: playerCurrentPos.x,
      y: playerCurrentPos.y,
      z: playerCurrentPos.z,
    });

    // --- Finish Check ---
    if (!useGameStore.getState().raceFinished && !hasFinished.current) {
      let closestFinishDistance = Infinity;
      let closestFinishPos = null;
      scene.traverse((object) => {
        if (object.isMesh && object.userData.type === "finish") {
          const finishPos = object.position;
          const playerPos = ref.current.position;
          const totalDistance = calculateDistance(playerPos, finishPos);
          if (totalDistance < closestFinishDistance) {
            closestFinishDistance = totalDistance;
            closestFinishPos = finishPos;
          }
        }
      });

      if (closestFinishDistance < GAME_CONFIG.FINISH_DETECTION_THRESHOLD) {
        hasFinished.current = true;
        console.log("PLAYER COMPONENT: Detected finish position!");
        setRaceFinished(true);
        sendFinish();
        return;
      }
    }
    // --- End Finish Check ---

    // Send position to server if no collision occurred
    sendMove({
      x: playerCurrentPos.x,
      y: playerCurrentPos.y,
      z: playerCurrentPos.z,
    });
  });

  // Render other players
  const otherPlayers = Object.entries(playerPositions)
    .filter(([id]) => id !== playerId)
    .map(([id, position]) => (
      <mesh key={id} position={[position.x, position.y, position.z]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#3377ff" />
        <Html
          position={[0, 0.6, 0]}
          center
          distanceFactor={10}
          occlude={[ref]}
          style={{
            color: "white",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            padding: "2px 5px",
            borderRadius: "3px",
            fontSize: "10px",
            whiteSpace: "nowrap",
          }}
        >
          {id.substring(0, 6)}
        </Html>
      </mesh>
    ));

  // Mouse look effect
  useEffect(() => {
    const handleMouseMove = (event) => {
      if (
        cameraMode !== CAMERA_MODES.FIRST_PERSON ||
        !firstPersonCameraRef.current
      )
        return;
      const { movementX, movementY } = event;
      const cam = firstPersonCameraRef.current;
      cam.rotation.order = "YXZ";
      cam.rotation.y -= movementX * 0.002;
      cam.rotation.x -= movementY * 0.002;
      cam.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, cam.rotation.x)
      );
    };
    const handleClick = () => {
      document.body.requestPointerLock();
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleClick);
      document.exitPointerLock(); // Ensure pointer lock is released on unmount/mode change
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
        <PerspectiveCamera
          ref={thirdPersonCameraRef}
          makeDefault={cameraMode === CAMERA_MODES.THIRD_PERSON}
          position={[0, 8, 8]}
          rotation={[-Math.PI / 4, 0, 0]}
          fov={60}
        />
        <PerspectiveCamera
          ref={firstPersonCameraRef}
          makeDefault={cameraMode === CAMERA_MODES.FIRST_PERSON}
          position={[0, 0.4, 0]}
          rotation={[0, 0, 0]}
          fov={75}
        />
        <Html
          position={[0, 0.6, 0]}
          center
          distanceFactor={10}
          style={{
            color: "white",
            fontWeight: "bold",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: "2px 5px",
            borderRadius: "3px",
            fontSize: "10px",
            whiteSpace: "nowrap",
          }}
        >
          {playerId ? playerId.substring(0, 6) : "Me"}
        </Html>
      </mesh>
      {/* Other players */}
      {otherPlayers}
    </>
  );
}
