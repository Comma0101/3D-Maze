// src/components/UI/HUD.jsx
import React, { useEffect } from "react";
import useGameStore from "../../state/gameStore";

export default function HUD() {
  const {
    currentMazeIndex,
    totalMazes,
    currentTime,
    raceStarted,
    startRace,
    bestTimes,
  } = useGameStore((state) => state);

  // Format time in milliseconds to MM:SS.ms format
  const formatTime = (timeMs) => {
    if (!timeMs && timeMs !== 0) return "--:--:--";

    const totalSeconds = timeMs / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const ms = Math.floor((timeMs % 1000) / 10);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  // Start the race timer when component mounts
  useEffect(() => {
    if (!raceStarted) {
      const cleanup = startRace();
      return cleanup;
    }
  }, [raceStarted, startRace]);

  // Get best time for current maze
  const bestTime = bestTimes[currentMazeIndex];

  return (
    <div style={styles.hudContainer}>
      <div style={styles.topBar}>
        <div style={styles.mazeIndicator}>
          Maze: {currentMazeIndex + 1}/{totalMazes}
        </div>
        <div style={styles.timer}>Time: {formatTime(currentTime)}</div>
      </div>

      {bestTime && (
        <div style={styles.bestTime}>Best: {formatTime(bestTime)}</div>
      )}

      <div style={styles.gameMode}>Single Player Mode</div>

      <div style={styles.controls}>
        <div style={styles.controlsBox}>
          <div style={styles.controlsTitle}>Controls</div>
          <div style={styles.controlsText}>W, A, S, D - Move</div>
          <div style={styles.controlsText}>
            <span style={{ color: "#00ff00" }}>Green Marker</span> - Start
          </div>
          <div style={styles.controlsText}>
            <span style={{ color: "#ff0000" }}>Red Marker</span> - Finish
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  hudContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none", // let clicks pass through
    display: "flex",
    flexDirection: "column",
    color: "#fff",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    padding: "16px",
  },
  mazeIndicator: {
    background: "rgba(0,0,0,0.6)",
    padding: "12px 16px",
    borderRadius: "4px",
    fontSize: "18px",
    fontWeight: "bold",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },
  timer: {
    background: "rgba(0,0,0,0.6)",
    padding: "12px 16px",
    borderRadius: "4px",
    fontSize: "18px",
    fontWeight: "bold",
    fontFamily: "monospace",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },
  bestTime: {
    position: "absolute",
    top: "70px",
    right: "16px",
    background: "rgba(0,0,0,0.6)",
    padding: "8px 16px",
    borderRadius: "4px",
    fontSize: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },
  gameMode: {
    position: "absolute",
    top: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.6)",
    padding: "8px 16px",
    borderRadius: "4px",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#ff7733",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },
  controls: {
    position: "absolute",
    bottom: "16px",
    left: "16px",
  },
  controlsBox: {
    background: "rgba(0,0,0,0.6)",
    padding: "12px",
    borderRadius: "4px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },
  controlsTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  controlsText: {
    fontSize: "14px",
  },
};
