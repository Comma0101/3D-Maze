import React, { useMemo, memo } from "react";
import { CELL_TYPES } from "../../utils/constants";
import useGameStore from "../../state/gameStore"; // Import game store
import SpikeWallTrap from "./SpikeWallTrap";
import BladeTrap from "./BladeTrap";
import CrusherTrap from "./CrusherTrap";
import Teleporter from "./Teleporter";
import Checkpoint from "./Checkpoint";
// import Mirror from "./Mirror"; // Removed Mirror import

const MazeElements = memo(function MazeElements({
  generatedMaze,
  mazeSize,
  finishMarkerRef,
  startMarkerRef,
}) {
  // Removed mirror data access from store
  // const mirrors = useGameStore((state) => state.mirrors);

  return useMemo(() => {
    const elements = [];
    const halfWidth = mazeSize.width / 2;
    const halfHeight = mazeSize.height / 2;

    generatedMaze.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        // Base position calculation (center of the cell, Y slightly above floor)
        const position = [colIndex - halfWidth, 0.5, rowIndex - halfHeight];
        // Floor position calculation
        const floorPosition = [
          colIndex - halfWidth,
          0.05,
          rowIndex - halfHeight,
        ];

        switch (cell) {
          case CELL_TYPES.WALL:
            elements.push(
              <mesh
                key={`wall-${rowIndex}-${colIndex}`}
                position={[position[0], position[1] + 1, position[2]]} // Center Y at 1.5
                receiveShadow
                castShadow
                userData={{ type: "wall" }}
              >
                <boxGeometry args={[0.95, 2, 0.95]} />
                <meshStandardMaterial
                  color={`hsl(${
                    (rowIndex * 17 + colIndex * 13) % 360
                  }, 70%, 55%)`}
                  emissive="#444444"
                  emissiveIntensity={0.2}
                  roughness={0.4}
                  metalness={0.3}
                />
              </mesh>
            );
            break;

          case CELL_TYPES.PATH:
            elements.push(
              <mesh
                key={`path-${rowIndex}-${colIndex}`}
                position={floorPosition}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
              >
                <planeGeometry args={[0.95, 0.95]} />
                <meshStandardMaterial
                  color="#2e8b57"
                  emissive="#3cb371"
                  emissiveIntensity={0.3}
                  roughness={0.5}
                  metalness={0.3}
                  transparent={true}
                  opacity={0.95}
                />
              </mesh>
            );
            break;

          case CELL_TYPES.FINISH:
            elements.push(
              <group key={`finish-${rowIndex}-${colIndex}`}>
                <mesh
                  position={position} // Base position
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
                {/* Finish Marker Light Beam */}
                <mesh
                  position={[position[0], position[1] + 3, position[2]]}
                  scale={[0.5, 6, 0.5]}
                >
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial
                    color="#ff0000"
                    emissive="#ff0000"
                    emissiveIntensity={2}
                  />
                </mesh>
                {/* Finish Marker Rotating Box */}
                <mesh
                  ref={finishMarkerRef}
                  position={[position[0], position[1] + 2, position[2]]}
                  rotation={[0, Math.PI / 4, 0]}
                  scale={[0.8, 0.8, 0.8]}
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
                <pointLight
                  position={[position[0], position[1] + 2, position[2]]}
                  color="#ff5500"
                  intensity={3}
                  distance={20}
                />
              </group>
            );
            break;

          case CELL_TYPES.START:
            elements.push(
              <group key={`start-${rowIndex}-${colIndex}`}>
                {/* Start Pad */}
                <mesh position={position} receiveShadow>
                  <boxGeometry args={[1, 0.1, 1]} />
                  <meshStandardMaterial
                    color="green"
                    emissive="green"
                    emissiveIntensity={0.5}
                  />
                </mesh>
                {/* Start Marker Light Beam */}
                <mesh
                  position={[position[0], position[1] + 3, position[2]]}
                  scale={[0.5, 6, 0.5]}
                >
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial
                    color="#00ff00"
                    emissive="#00ff00"
                    emissiveIntensity={2}
                  />
                </mesh>
                {/* Start Marker Rotating Box */}
                <mesh
                  ref={startMarkerRef}
                  position={[position[0], position[1] + 2, position[2]]}
                  rotation={[0, Math.PI / 4, 0]}
                  scale={[0.8, 0.8, 0.8]}
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
                <pointLight
                  position={[position[0], position[1] + 2, position[2]]}
                  color="#00ff00"
                  intensity={3}
                  distance={20}
                />
              </group>
            );
            break;

          case CELL_TYPES.SPIKE_WALL_TRAP:
            let orientation = "horizontal";
            if (
              rowIndex > 0 &&
              rowIndex < generatedMaze.length - 1 &&
              generatedMaze[rowIndex - 1][colIndex] === CELL_TYPES.WALL &&
              generatedMaze[rowIndex + 1][colIndex] === CELL_TYPES.WALL
            ) {
              orientation = "horizontal";
            } else if (
              colIndex > 0 &&
              colIndex < row.length - 1 &&
              generatedMaze[rowIndex][colIndex - 1] === CELL_TYPES.WALL &&
              generatedMaze[rowIndex][colIndex + 1] === CELL_TYPES.WALL
            ) {
              orientation = "vertical";
            }
            elements.push(
              <SpikeWallTrap
                key={`trap-${rowIndex}-${colIndex}`}
                position={[position[0], position[1], position[2]]}
                orientation={orientation}
              />
            );
            elements.push(
              <mesh
                key={`trap-path-${rowIndex}-${colIndex}`}
                position={floorPosition}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
              >
                <planeGeometry args={[0.95, 0.95]} />
                <meshStandardMaterial
                  color="#444444"
                  roughness={0.6}
                  metalness={0.2}
                />
              </mesh>
            );
            break;

          case CELL_TYPES.BLADE_TRAP:
            elements.push(
              <BladeTrap
                key={`blade-trap-${rowIndex}-${colIndex}`}
                position={[position[0], 0, position[2]]}
              />
            );
            elements.push(
              <mesh
                key={`trap-path-${rowIndex}-${colIndex}`}
                position={floorPosition}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
              >
                <planeGeometry args={[0.95, 0.95]} />
                <meshStandardMaterial
                  color="#505050"
                  roughness={0.7}
                  metalness={0.1}
                />
              </mesh>
            );
            break;

          case CELL_TYPES.CRUSHER_TRAP:
            elements.push(
              <CrusherTrap
                key={`crusher-trap-${rowIndex}-${colIndex}`}
                position={[position[0], 0, position[2]]}
              />
            );
            elements.push(
              <mesh
                key={`trap-path-${rowIndex}-${colIndex}`}
                position={floorPosition}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
              >
                <planeGeometry args={[0.95, 0.95]} />
                <meshStandardMaterial
                  color="#606060"
                  roughness={0.8}
                  metalness={0.1}
                />
              </mesh>
            );
            break;

          case CELL_TYPES.TELEPORTER:
            elements.push(
              <Teleporter
                key={`teleporter-${rowIndex}-${colIndex}`}
                position={[position[0], 0, position[2]]}
              />
            );
            elements.push(
              <mesh
                key={`teleporter-path-${rowIndex}-${colIndex}`}
                position={floorPosition}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
              >
                <planeGeometry args={[0.95, 0.95]} />
                <meshStandardMaterial
                  color="#303030"
                  roughness={0.8}
                  metalness={0.1}
                />
              </mesh>
            );
            break;

          case CELL_TYPES.CHECKPOINT:
            elements.push(
              <group
                key={`checkpoint-group-${rowIndex}-${colIndex}`}
                position={[position[0], 0, position[2]]}
                userData={{
                  type: "checkpoint",
                  gridX: colIndex,
                  gridY: rowIndex,
                }}
              >
                <Checkpoint position={[0, 0, 0]} />
              </group>
            );
            elements.push(
              <mesh
                key={`checkpoint-path-${rowIndex}-${colIndex}`}
                position={floorPosition}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
              >
                <planeGeometry args={[0.95, 0.95]} />
                <meshStandardMaterial
                  color="#40E0D0"
                  roughness={0.7}
                  metalness={0.1}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            );
            break;

          // Removed MIRROR case
        }
      });
    });

    return elements;
  }, [generatedMaze, mazeSize, finishMarkerRef, startMarkerRef]); // Removed mirrors from dependency array
});

export default MazeElements;
