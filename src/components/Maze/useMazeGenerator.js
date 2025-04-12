import { useMemo } from "react";
import { generateMaze } from "./MazeGenerator";
import { GAME_CONFIG } from "../../utils/constants";

export default function useMazeGenerator(currentMazeIndex, mazeData) {
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
    return generateMaze(mazeSize.width, mazeSize.height, currentMazeIndex);
  }, [mazeSize.width, mazeSize.height, currentMazeIndex, mazeData]);

  return { generatedMaze, mazeSize };
}
