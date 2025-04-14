import { useMemo, useEffect, useRef } from "react"; // Added useRef
import { generateMaze } from "./MazeGenerator";
import { GAME_CONFIG } from "../../utils/constants";
import useGameStore from "../../state/gameStore";

export default function useMazeGenerator(currentMazeIndex, mazeData) {
  const setTeleporterPairs = useGameStore((state) => state.setTeleporterPairs);
  const setCheckpoints = useGameStore((state) => state.setCheckpoints);
  // const setMirrors = useGameStore((state) => state.setMirrors); // Removed mirror setter
  // Use refs to temporarily store generated data from useMemo
  const generatedPairsRef = useRef([]);
  const generatedCheckpointsRef = useRef([]);
  // const generatedMirrorsRef = useRef([]); // Removed mirror ref
  const mazeSize = {
    width: GAME_CONFIG.DEFAULT_MAZE_WIDTH,
    height: GAME_CONFIG.DEFAULT_MAZE_HEIGHT,
  };

  const generatedMaze = useMemo(() => {
    console.log("Generating new maze for index:", currentMazeIndex);
    if (mazeData && mazeData.seed) {
      console.log("Using server seed for maze generation:", mazeData.seed);
      return generateMaze(
        mazeData.width || mazeSize.width,
        mazeData.height || mazeSize.height,
        currentMazeIndex,
        mazeData.seed
      );
    }
    // Generate both maze and pairs ONCE
    const result = generateMaze(
      mazeData?.width || mazeSize.width,
      mazeData?.height || mazeSize.height,
      currentMazeIndex,
      currentMazeIndex,
      mazeData?.seed
    );

    // Store pairs and checkpoints in refs
    generatedPairsRef.current = result.teleporterPairs || [];
    generatedCheckpointsRef.current = result.checkpoints || [];
    // generatedMirrorsRef.current = result.mirrors || []; // Removed mirror storage
    return result.maze; // Return only the maze grid for memoization
  }, [mazeSize.width, mazeSize.height, currentMazeIndex, mazeData]);

  // Effect to update the store AFTER the maze grid is generated/memoized
  useEffect(() => {
    // Only update if generatedMaze is valid (avoids initial undefined state)
    if (generatedMaze) {
      console.log(
        "Setting teleporter pairs in store:",
        generatedPairsRef.current
      );
      setTeleporterPairs(generatedPairsRef.current);
      console.log(
        "Setting checkpoints in store:",
        generatedCheckpointsRef.current
      );
      setCheckpoints(generatedCheckpointsRef.current);
      // console.log("Setting mirrors in store:", generatedMirrorsRef.current); // Removed mirror log
      // setMirrors(generatedMirrorsRef.current); // Removed mirror setter call
    }
    // Intentionally only run when generatedMaze changes or setters change identity
  }, [generatedMaze, setTeleporterPairs, setCheckpoints]); // Removed setMirrors dependency

  // Return generatedMaze and mazeSize, checkpoints are handled via store
  return { generatedMaze, mazeSize };
}
