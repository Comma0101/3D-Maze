import React, { useMemo, memo } from "react";
import { CELL_TYPES } from "../../utils/constants";

const MazeElements = memo(function MazeElements({
  generatedMaze,
  mazeSize,
  finishMarkerRef,
  startMarkerRef,
}) {
  return useMemo(() => {
    const elements = [];
    const halfWidth = mazeSize.width / 2;
    const halfHeight = mazeSize.height / 2;

    generatedMaze.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const position = [colIndex - halfWidth, 0.5, rowIndex - halfHeight];

        switch (cell) {
          case CELL_TYPES.WALL:
            elements.push(
              <mesh
                key={`wall-${rowIndex}-${colIndex}`}
                position={[position[0], position[1] + 1, position[2]]}
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
                position={[position[0], 0.05, position[2]]}
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
                <mesh position={position} receiveShadow>
                  <boxGeometry args={[1, 0.1, 1]} />
                  <meshStandardMaterial
                    color="green"
                    emissive="green"
                    emissiveIntensity={0.5}
                  />
                </mesh>
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
        }
      });
    });

    return elements;
  }, [generatedMaze, mazeSize, finishMarkerRef, startMarkerRef]);
});

export default MazeElements;
