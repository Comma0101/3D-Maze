// src/components/UI/HUD.jsx
import React, { useEffect, useMemo } from "react"; // Added useMemo
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
    playerPositions, // Get player positions
    playerId, // Get local player ID
  } = useGameStore((state) => state);

  // Calculate leaderboard ranks (simple Z-position based for now)
  const leaderboard = useMemo(() => {
    const players = Object.entries(playerPositions).map(([id, pos]) => ({
      id,
      z: pos.z, // Rank based on Z position (higher is better assumed)
    }));

    // Sort players by Z position descending (higher Z = better rank)
    players.sort((a, b) => b.z - a.z);

    // Find local player's rank
    const localPlayerRank = players.findIndex((p) => p.id === playerId) + 1;

    return {
      rankedPlayers: players,
      localPlayerRank,
    };
  }, [playerPositions, playerId]);

  // Start the race timer when component mounts, if not already started
  useEffect(() => {
    let cleanup = () => {}; // Initialize cleanup function
    // Check the state directly inside the effect
    if (!useGameStore.getState().raceStarted) {
      console.log("HUD: Starting race timer on mount");
      cleanup = startRace(); // Call startRace from the store
    }

    // Return the cleanup function provided by startRace
    return () => {
      console.log("HUD: Cleaning up race timer on unmount");
      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, [startRace]); // Depend only on startRace to ensure it's available

  // Get best time for current maze
  const bestTime = bestTimes[currentMazeIndex];

  return (
    <>
      {" "}
      {/* Use Fragment instead of hud-container div, ui-layer is in AppUI */}
      <div className="top-bar">
        {/* Group Left Elements */}
        <div className="top-left-hud">
          <div className="maze-indicator">
            Maze: {currentMazeIndex + 1}/{totalMazes}
          </div>
          {/* Mini Leaderboard */}
          <div className="mini-leaderboard">
            <div className="leaderboard-title">Leaderboard</div>
            {leaderboard.rankedPlayers.slice(0, 3).map((player, index) => (
              <div
                key={player.id}
                className={`leaderboard-entry ${
                  player.id === playerId ? "local-player" : ""
                }`}
              >
                <span>{index + 1}.</span> {player.id.substring(0, 6)}
              </div>
            ))}
            {leaderboard.localPlayerRank > 3 && (
              <>
                <div className="leaderboard-separator">...</div>
                <div className="leaderboard-entry local-player">
                  <span>{leaderboard.localPlayerRank}.</span>{" "}
                  {playerId.substring(0, 6)} (You)
                </div>
              </>
            )}
          </div>
          {/* End Mini Leaderboard */}
        </div>

        {/* Right Element */}
        <div className="timer">Time: {formatTime(currentTime)}</div>
      </div>
      {/* Other HUD elements remain outside top-bar */}
      {bestTimes[currentMazeIndex] && (
        <div className="best-time">
          Best: {formatTime(bestTimes[currentMazeIndex])}
        </div>
      )}
      {/* <div className="game-mode">Multiplayer Mode</div> */}{" "}
      {/* Assuming multiplayer now */}
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
    </>
  );
}
