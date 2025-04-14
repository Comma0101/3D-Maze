import MazeScene from "./components/Maze/MazeScene";
import useGameStore from "./state/gameStore"; // Import the store

export default function App() {
  // Get state needed for the key
  const currentMazeIndex = useGameStore((state) => state.currentMazeIndex);
  const rematchCounter = useGameStore((state) => state.rematchCounter);

  // Combine index and counter for a unique key that changes on next maze OR play again
  const sceneKey = `${currentMazeIndex}-${rematchCounter}`;

  return <MazeScene key={sceneKey} />; // Use the dynamic key
}
