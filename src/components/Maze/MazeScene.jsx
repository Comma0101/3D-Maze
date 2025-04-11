// src/components/Maze/MazeScene.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { generateMaze, CELL_TYPES } from "./MazeGenerator";
import { PerspectiveCamera, Environment, Sky, Text } from "@react-three/drei";
import Player from "../Player/Player";
import useGameStore from "../../state/gameStore";
import useColyseus from "../Networking/useColyseus";

// A MazeScene that spawns a floor, walls, and the Player
export default function MazeScene() {
  const {
    currentMazeIndex,
    setRaceFinished,
    playerPositions,
    raceFinished,
    nextMaze,
  } = useGameStore((state) => state);
  const { sendFinish } = useColyseus();
  const [mazeSize, setMazeSize] = useState({ width: 20, height: 20 });
  const [playerStartPosition, setPlayerStartPosition] = useState([0, 0.5, 0]);
  const [finishPosition, setFinishPosition] = useState(null);
  const mazeRef = useRef();
  const { scene } = useThree();

  // Generate the maze based on the current maze index
  const mazeData = useMemo(() => {
    return generateMaze(mazeSize.width, mazeSize.height, currentMazeIndex);
  }, [mazeSize.width, mazeSize.height, currentMazeIndex]);

  // Find start and finish positions
  useEffect(() => {
    let startPos = [0, 0.5, 0];
    let finishPos = null;
    let foundFinish = false;

    console.log("CELL_TYPES.FINISH value:", CELL_TYPES.FINISH);
    console.log("Looking for finish position in maze data...");

    // Debug: Print the entire maze data to see what's in it
    console.log(
      "Maze data dimensions:",
      mazeData.length,
      "x",
      mazeData[0].length
    );

    // Count cells of each type for debugging
    let wallCount = 0;
    let pathCount = 0;
    let startCount = 0;
    let finishCount = 0;

    // Scan the maze data for start and finish positions
    for (let rowIndex = 0; rowIndex < mazeData.length; rowIndex++) {
      for (let colIndex = 0; colIndex < mazeData[rowIndex].length; colIndex++) {
        const cell = mazeData[rowIndex][colIndex];

        // Count cell types
        if (cell === CELL_TYPES.WALL) wallCount++;
        else if (cell === CELL_TYPES.PATH) pathCount++;
        else if (cell === CELL_TYPES.START) startCount++;
        else if (cell === CELL_TYPES.FINISH) finishCount++;

        if (cell === CELL_TYPES.START) {
          startPos = [
            colIndex - mazeSize.width / 2,
            0.5,
            rowIndex - mazeSize.height / 2,
          ];
          console.log("Found START at:", colIndex, rowIndex);
        } else if (cell === CELL_TYPES.FINISH) {
          finishPos = [
            colIndex - mazeSize.width / 2,
            0.5,
            rowIndex - mazeSize.height / 2,
          ];
          foundFinish = true;
          console.log("Found FINISH at:", colIndex, rowIndex);
          console.log("Calculated finish position:", finishPos);
        }
      }
    }

    console.log(
      "Cell counts - Wall:",
      wallCount,
      "Path:",
      pathCount,
      "Start:",
      startCount,
      "Finish:",
      finishCount
    );

    if (!foundFinish) {
      console.error("No finish position found in maze data!");
      // Force a finish position if none was found
      const lastRowIndex = mazeData.length - 1;
      const lastColIndex = mazeData[0].length - 1;

      // Use the bottom-right corner as the finish position
      finishPos = [
        lastColIndex - mazeSize.width / 2,
        0.5,
        lastRowIndex - mazeSize.height / 2,
      ];
      console.log("Forced finish position:", finishPos);

      // Also update the maze data to mark this position as a finish
      // This is just for consistency, not actually used for rendering
      const adjustedRow = lastRowIndex;
      const adjustedCol = lastColIndex;
      if (
        adjustedRow >= 0 &&
        adjustedRow < mazeData.length &&
        adjustedCol >= 0 &&
        adjustedCol < mazeData[0].length
      ) {
        console.log(
          "Setting finish in maze data at:",
          adjustedRow,
          adjustedCol
        );
        mazeData[adjustedRow][adjustedCol] = CELL_TYPES.FINISH;
      }
    }

    setPlayerStartPosition(startPos);
    setFinishPosition(finishPos);
    console.log("Final finish position set to:", finishPos);
  }, [mazeData, mazeSize]);

  // Reference for finish marker animation
  const finishMarkerRef = useRef();
  const startMarkerRef = useRef();

  // Move to next maze after a delay when race is finished
  useEffect(() => {
    if (raceFinished) {
      console.log("Race finished! Moving to next maze in 3 seconds...");
      const timer = setTimeout(() => {
        console.log("Moving to next maze now!");
        nextMaze();
      }, 3000); // 3 second delay

      return () => clearTimeout(timer);
    }
  }, [raceFinished, nextMaze]);

  // Create a ref for the finish tile
  const finishTileRef = useRef();
  const playerRef = useRef();

  // Check if player has reached the finish and animate markers
  useFrame((state) => {
    // Animate finish marker
    if (finishMarkerRef.current) {
      finishMarkerRef.current.position.y =
        5 + Math.sin(state.clock.elapsedTime * 2) * 1;
      finishMarkerRef.current.rotation.y += 0.03;

      // Also animate the scale for a pulsing effect
      const scale = 2 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
      finishMarkerRef.current.scale.set(scale, scale, scale);
    }

    // Animate start marker
    if (startMarkerRef.current) {
      startMarkerRef.current.position.y =
        5 + Math.sin(state.clock.elapsedTime * 2 + Math.PI) * 1;
      startMarkerRef.current.rotation.y += 0.03;

      // Also animate the scale for a pulsing effect
      const scale = 2 + Math.sin(state.clock.elapsedTime * 3 + Math.PI) * 0.3;
      startMarkerRef.current.scale.set(scale, scale, scale);
    }

    // DIRECT APPROACH: Just check if the player is near the finish position
    if (finishPosition && playerPositions.localPlayer && !raceFinished) {
      const playerPos = playerPositions.localPlayer;

      // Log player position every few frames for debugging
      if (Math.floor(state.clock.elapsedTime * 10) % 30 === 0) {
        console.log(
          "Player position:",
          JSON.stringify(playerPos),
          "Finish position:",
          JSON.stringify(finishPosition)
        );
      }

      // Check if player is within the finish area (using a very generous threshold)
      const xDiff = Math.abs(playerPos.x - finishPosition[0]);
      const zDiff = Math.abs(playerPos.z - finishPosition[2]);
      const totalDistance = Math.sqrt(xDiff * xDiff + zDiff * zDiff);

      // Debug logs - more frequent when player is close to finish
      if (totalDistance < 5) {
        console.log(
          `Player near finish! Distance: ${totalDistance.toFixed(
            2
          )}, X diff: ${xDiff.toFixed(2)}, Z diff: ${zDiff.toFixed(2)}`
        );
      }

      // If player is very close to finish in both X and Z coordinates
      // Using an even more generous threshold
      if (totalDistance < 3.5) {
        console.log("FINISH DETECTED! Player has reached the finish area!");
        console.log(
          `Final position - Player: ${JSON.stringify(
            playerPos
          )}, Finish: ${JSON.stringify(finishPosition)}`
        );
        setRaceFinished(true);
        sendFinish(); // Notify server that player finished
      }
    }
  });

  // Create maze elements
  const mazeElements = useMemo(() => {
    const elements = [];
    const halfWidth = mazeSize.width / 2;
    const halfHeight = mazeSize.height / 2;

    // Debug: Log maze data to see what's being generated
    console.log("Maze Data:", mazeData);

    mazeData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const position = [colIndex - halfWidth, 0.5, rowIndex - halfHeight];

        switch (cell) {
          case CELL_TYPES.WALL:
            elements.push(
              <mesh
                key={`wall-${rowIndex}-${colIndex}`}
                position={position}
                receiveShadow
                castShadow
                userData={{ type: "wall" }}
              >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#555" />
              </mesh>
            );
            break;
          case CELL_TYPES.PATH:
            // Add a subtle floor marker for paths
            elements.push(
              <mesh
                key={`path-${rowIndex}-${colIndex}`}
                position={[position[0], 0.05, position[2]]}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
              >
                <planeGeometry args={[0.9, 0.9]} />
                <meshStandardMaterial color="#444" />
              </mesh>
            );
            break;
          case CELL_TYPES.FINISH:
            // Add a more visible finish marker
            elements.push(
              <group key={`finish-${rowIndex}-${colIndex}`}>
                {/* Base finish tile */}
                <mesh
                  position={position}
                  receiveShadow
                  userData={{ type: "finish" }}
                >
                  <boxGeometry args={[1, 0.1, 1]} />
                  <meshStandardMaterial
                    color="gold"
                    emissive="orange"
                    emissiveIntensity={0.5}
                  />
                </mesh>

                {/* Massive beacon for the finish */}
                <mesh
                  position={[position[0], position[1] + 15, position[2]]}
                  scale={[2, 30, 2]}
                >
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial
                    color="#ff0000"
                    emissive="#ff0000"
                    emissiveIntensity={3}
                  />
                </mesh>

                {/* Add a second beacon for better visibility */}
                <mesh
                  position={[position[0], position[1] + 15, position[2]]}
                  scale={[3, 20, 3]}
                  rotation={[0, Math.PI / 4, 0]}
                >
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial
                    color="#ff0000"
                    emissive="#ff0000"
                    emissiveIntensity={2}
                    transparent={true}
                    opacity={0.7}
                  />
                </mesh>

                {/* Large floating marker above the finish */}
                <mesh
                  ref={finishMarkerRef}
                  position={[position[0], position[1] + 5, position[2]]}
                  rotation={[0, Math.PI / 4, 0]}
                  scale={[2, 2, 2]}
                >
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial
                    color="#ff0000"
                    emissive="#ff0000"
                    emissiveIntensity={2}
                    transparent={true}
                    opacity={0.9}
                  />
                </mesh>

                {/* Bright pulsing light */}
                <pointLight
                  position={[position[0], position[1] + 5, position[2]]}
                  color="#ff5500"
                  intensity={5}
                  distance={50}
                />

                {/* Additional light at the top */}
                <pointLight
                  position={[position[0], position[1] + 20, position[2]]}
                  color="#ff0000"
                  intensity={10}
                  distance={100}
                />
              </group>
            );
            break;
          case CELL_TYPES.START:
            // Add a more visible start marker
            elements.push(
              <group key={`start-${rowIndex}-${colIndex}`}>
                {/* Base start tile */}
                <mesh position={position} receiveShadow>
                  <boxGeometry args={[1, 0.1, 1]} />
                  <meshStandardMaterial
                    color="green"
                    emissive="green"
                    emissiveIntensity={0.5}
                  />
                </mesh>

                {/* Massive beacon for the start */}
                <mesh
                  position={[position[0], position[1] + 15, position[2]]}
                  scale={[2, 30, 2]}
                >
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial
                    color="#00ff00"
                    emissive="#00ff00"
                    emissiveIntensity={3}
                  />
                </mesh>

                {/* Add a second beacon for better visibility */}
                <mesh
                  position={[position[0], position[1] + 15, position[2]]}
                  scale={[3, 20, 3]}
                  rotation={[0, Math.PI / 4, 0]}
                >
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial
                    color="#00ff00"
                    emissive="#00ff00"
                    emissiveIntensity={2}
                    transparent={true}
                    opacity={0.7}
                  />
                </mesh>

                {/* Large floating marker above the start */}
                <mesh
                  ref={startMarkerRef}
                  position={[position[0], position[1] + 5, position[2]]}
                  rotation={[0, Math.PI / 4, 0]}
                  scale={[2, 2, 2]}
                >
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial
                    color="#00ff00"
                    emissive="#00ff00"
                    emissiveIntensity={2}
                    transparent={true}
                    opacity={0.9}
                  />
                </mesh>

                {/* Bright pulsing light */}
                <pointLight
                  position={[position[0], position[1] + 5, position[2]]}
                  color="#00ff00"
                  intensity={5}
                  distance={50}
                />

                {/* Additional light at the top */}
                <pointLight
                  position={[position[0], position[1] + 20, position[2]]}
                  color="#00ff00"
                  intensity={10}
                  distance={100}
                />
              </group>
            );
            break;
        }
      });
    });

    return elements;
  }, [mazeData, mazeSize]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <Sky sunPosition={[100, 10, 100]} />

      {/* Maze floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[mazeSize.width * 1.5, mazeSize.height * 1.5]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Maze elements group */}
      <group ref={mazeRef}>{mazeElements}</group>

      {/* Standalone finish marker (always visible) */}
      {finishPosition && (
        <group>
          {/* Massive vertical beam at finish */}
          <mesh
            position={[finishPosition[0], 15, finishPosition[2]]}
            scale={[1, 30, 1]}
            userData={{ type: "finish" }}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color="#ff0000"
              emissive="#ff0000"
              emissiveIntensity={5}
              transparent={true}
              opacity={0.8}
            />
          </mesh>

          {/* Animated floating marker */}
          <mesh
            ref={finishMarkerRef}
            position={[finishPosition[0], 5, finishPosition[2]]}
            rotation={[0, Math.PI / 4, 0]}
            scale={[3, 3, 3]}
            userData={{ type: "finish" }}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color="#ff0000"
              emissive="#ff0000"
              emissiveIntensity={3}
              transparent={true}
              opacity={0.9}
            />
          </mesh>

          {/* Bright spotlight */}
          <spotLight
            position={[finishPosition[0], 20, finishPosition[2]]}
            angle={0.3}
            penumbra={0.2}
            intensity={20}
            color="#ff0000"
            castShadow
            target-position={[finishPosition[0], 0, finishPosition[2]]}
          />
        </group>
      )}

      {/* Player */}
      <Player startPosition={playerStartPosition} />

      {/* Finish message */}
      {raceFinished && (
        <group position={[0, 10, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={1.5}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.1}
            outlineColor="#000000"
          >
            Maze Complete!
          </Text>
          <Text
            position={[0, -2, 0]}
            fontSize={1}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.1}
            outlineColor="#000000"
          >
            Next maze loading...
          </Text>
        </group>
      )}
    </>
  );
}
