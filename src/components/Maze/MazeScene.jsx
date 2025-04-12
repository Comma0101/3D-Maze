import { useRef, useEffect, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import { Sky, Text } from "@react-three/drei";
import Player from "../Player/Player";
import useGameStore from "../../state/gameStore";
import { GAME_CONFIG } from "../../utils/constants";

// Custom hooks and components
import useMazeGenerator from "./useMazeGenerator";
import useMazeLogic from "./useMazeLogic";
import MazeElements from "./MazeElements";
import SceneLighting from "./SceneLighting";

export default function MazeScene() {
  // Store and scene references
  const {
    currentMazeIndex,
    setRaceFinished,
    playerPositions,
    raceFinished,
    nextMaze,
    mazeData,
  } = useGameStore();
  const { scene } = useThree();
  const mazeRef = useRef();

  // Custom hooks
  const { generatedMaze, mazeSize } = useMazeGenerator(
    currentMazeIndex,
    mazeData
  );
  const {
    playerStartPosition,
    finishPosition,
    finishMarkerRef,
    startMarkerRef,
  } = useMazeLogic(generatedMaze, mazeSize);

  // Move to next maze after a delay when race is finished
  const handleNextMaze = useCallback(() => {
    nextMaze();
    requestAnimationFrame(() => {
      useGameStore.getState().startRace();
    });
  }, [nextMaze]);

  useEffect(() => {
    if (!raceFinished) return;

    const timer = setTimeout(handleNextMaze, GAME_CONFIG.NEXT_MAZE_DELAY);
    let animationFrameId;

    // Cleanup Three.js resources
    return () => {
      clearTimeout(timer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      // Dispose geometry and materials
      scene.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            // Handle both single materials and material arrays
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    };
  }, [raceFinished, handleNextMaze, scene]);

  return (
    <>
      <SceneLighting />

      <Sky sunPosition={[100, 20, 100]} turbidity={10} rayleigh={0.5} />

      {/* Maze floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[mazeSize.width * 1.5, mazeSize.height * 1.5]} />
        <meshStandardMaterial color="#a89e8a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Maze elements */}
      <group ref={mazeRef}>
        <MazeElements
          generatedMaze={generatedMaze}
          mazeSize={mazeSize}
          finishMarkerRef={finishMarkerRef}
          startMarkerRef={startMarkerRef}
        />
      </group>

      {/* Player */}
      <Player startPosition={playerStartPosition} />

      {/* Persistent finish message with opacity control */}
      <group
        position={[0, 10, 0]}
        scale={raceFinished ? 1 : 0}
        visible={raceFinished}
      >
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
        <Text position={[0, -2, 0]} fontSize={1}>
          Next maze loading...
        </Text>
      </group>
    </>
  );
}
