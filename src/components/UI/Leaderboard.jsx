import React from "react";
import ReactDOM from "react-dom";
import useGameStore from "../../state/gameStore";
import useColyseus from "../Networking/useColyseus";
import { formatTime } from "../../utils/helpers";
import { GAME_CONFIG } from "../../utils/constants";
import "./styles.css";

export default function Leaderboard() {
  const {
    playerRankings,
    currentMazeIndex,
    totalMazes,
    nextMaze,
    currentTime,
    resetGame,
  } = useGameStore((state) => state);

  const { requestNextMaze } = useColyseus();

  // Handle next maze button click
  const handleNextMaze = () => {
    nextMaze();
    requestNextMaze(); // Notify server to move to next maze
  };

  // Handle restart button click
  const handleRestart = () => {
    resetGame();
    // Force a small delay before starting the next race
    setTimeout(() => {
      nextMaze();
    }, 100);
  };

  // Determine if this is the last maze
  const isLastMaze = currentMazeIndex === totalMazes - 1;

  const leaderboardContent = (
    <div className="overlay">
      <div className="panel">
        <h2 className="title">
          {isLastMaze
            ? "Final Results"
            : `Maze ${currentMazeIndex + 1} Complete!`}
        </h2>
        <div className="leaderboard-game-mode">Single Player Mode</div>
        <div className="your-time">
          Your Time:{" "}
          <span className="time-value">{formatTime(currentTime)}</span>
        </div>
        <div className="rankings-container">
          <h3 className="rankings-title">Rankings</h3>
          {playerRankings.length > 0 ? (
            playerRankings.map((player, idx) => (
              <div key={player.id} className="row">
                <div className="rank">{idx + 1}</div>
                <div className="player-name">{player.name}</div>
                <div className="player-time">{formatTime(player.time)}</div>
              </div>
            ))
          ) : (
            <div className="no-rankings">No players have finished yet</div>
          )}
        </div>
        <div className="button-container">
          {isLastMaze ? (
            <button className="button" onClick={handleRestart}>
              Play Again
            </button>
          ) : (
            <button className="button" onClick={handleNextMaze}>
              Next Maze
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    leaderboardContent,
    document.getElementById("overlay-root")
  );
}
