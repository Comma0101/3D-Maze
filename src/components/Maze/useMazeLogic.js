import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { CELL_TYPES } from "../../utils/constants";
import { calculateDistance } from "../../utils/helpers";
import useGameStore from "../../state/gameStore";
import useColyseus from "../Networking/useColyseus";

export default function useMazeLogic(generatedMaze, mazeSize) {
  const { setRaceFinished, playerPositions, raceFinished } = useGameStore();
  const { sendFinish } = useColyseus();
  const finishMarkerRef = useRef();
  const startMarkerRef = useRef();

  const [playerStartPosition, setPlayerStartPosition] = useState([0, 0.5, 0]);
  const [finishPosition, setFinishPosition] = useState(null);

  // Find start and finish positions
  const mazeString = JSON.stringify(generatedMaze);
  const sizeString = JSON.stringify(mazeSize);

  useEffect(() => {
    // Only recalculate if maze structure actually changed

    let startPos = [0, 0.5, 0];
    let finishPos = null;

    generatedMaze.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const position = [
          colIndex - mazeSize.width / 2,
          0.5,
          rowIndex - mazeSize.height / 2,
        ];

        if (cell === CELL_TYPES.START) {
          startPos = position;
        } else if (cell === CELL_TYPES.FINISH) {
          finishPos = position;
        }
      });
    });

    setPlayerStartPosition((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(startPos)) {
        return startPos;
      }
      return prev;
    });
    setFinishPosition((prev) => {
      const newPos = finishPos || [
        generatedMaze[0].length - 1 - mazeSize.width / 2,
        0.5,
        generatedMaze.length - 1 - mazeSize.height / 2,
      ];
      if (JSON.stringify(prev) !== JSON.stringify(newPos)) {
        return newPos;
      }
      return prev;
    });
  }, [mazeString, sizeString]);

  // Animation and finish detection
  useFrame((state) => {
    // Animate markers
    [finishMarkerRef, startMarkerRef].forEach((ref, i) => {
      if (ref.current) {
        const phase = i * Math.PI;
        ref.current.position.y =
          2 + Math.sin(state.clock.elapsedTime * 2 + phase) * 0.3;
        ref.current.rotation.y += 0.03;
        const scale = 0.8 + Math.sin(state.clock.elapsedTime * 3 + phase) * 0.1;
        ref.current.scale.set(scale, scale, scale);
      }
    });

    // Finish detection
    if (finishPosition && playerPositions.localPlayer && !raceFinished) {
      const dist = calculateDistance(playerPositions.localPlayer, {
        x: finishPosition[0],
        y: finishPosition[1],
        z: finishPosition[2],
      });

      if (dist < 12.0) {
        setRaceFinished(true);
        sendFinish();
      }
    }
  });

  return {
    playerStartPosition,
    finishPosition,
    finishMarkerRef,
    startMarkerRef,
  };
}
