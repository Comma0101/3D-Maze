// src/components/UI/HUD.jsx
import React, { useEffect } from "react";
import useGameStore from "../../state/gameStore";
import { formatTime } from "../../utils/helpers";
import { GAME_CONFIG } from "../../utils/constants";
import "./styles.css";

export default function HUD() {
  const {
    currentMazeIndex,
    totalMazes,
    currentTime,
    raceStarted,
    startRace,
    bestTimes,
    cameraMode,
    toggleCameraMode,
  } = useGameStore((state) => state);

  // Start the race timer when component mounts
  useEffect(() => {
    if (!raceStarted) {
      console.log("HUD: Starting race timer");
      const cleanup = startRace();

      // Make sure to clean up the timer when the component unmounts
      return () => {
        console.log("HUD: Cleaning up race timer");
        if (cleanup && typeof cleanup === "function") {
          cleanup();
        }
      };
    }
  }, [raceStarted, startRace]);

  // Get best time for current maze
  const bestTime = bestTimes[currentMazeIndex];

  return (
    <div className="hud-container">
      <div className="top-bar">
        <div className="maze-indicator">
          Maze: {currentMazeIndex + 1}/{totalMazes}
        </div>
        <div className="timer">Time: {formatTime(currentTime)}</div>
      </div>

      {bestTimes[currentMazeIndex] && (
        <div className="best-time">
          Best: {formatTime(bestTimes[currentMazeIndex])}
        </div>
      )}

      <div className="game-mode">Single Player Mode</div>

      <div className="controls">
        <div className="controls-box">
          <div className="controls-title">Controls</div>
          <div className="controls-text">W, A, S, D - Move</div>
          <div className="controls-text">
            <span style={{ color: "#00ff00" }}>Green Marker</span> - Start
          </div>
          <div className="controls-text">
            <span style={{ color: "#ff0000" }}>Red Marker</span> - Finish
          </div>
        </div>
      </div>

      {/* Camera toggle button */}
      <button className="camera-toggle-button" onClick={toggleCameraMode}>
        {cameraMode === "third-person"
          ? "Switch to First Person"
          : "Switch to Third Person"}
      </button>
    </div>
  );
}
