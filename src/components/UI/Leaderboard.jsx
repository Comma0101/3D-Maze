// src/components/UI/Leaderboard.jsx
import React from "react";
import useGameStore from "../../state/gameStore";
import useColyseus from "../Networking/useColyseus";

export default function Leaderboard() {
  const {
    playerRankings,
    currentMazeIndex,
    totalMazes,
    nextMaze,
    currentTime,
    resetGame,
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

  const { requestNextMaze } = useColyseus();

  // Handle next maze button click
  const handleNextMaze = () => {
    nextMaze();
    requestNextMaze(); // Notify server to move to next maze
  };

  // Handle restart button click
  const handleRestart = () => {
    resetGame();
  };

  // Determine if this is the last maze
  const isLastMaze = currentMazeIndex === totalMazes - 1;

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <h2 style={styles.title}>
          {isLastMaze
            ? "Final Results"
            : `Maze ${currentMazeIndex + 1} Complete!`}
        </h2>
        <div style={styles.gameMode}>Single Player Mode</div>

        <div style={styles.yourTime}>
          Your Time:{" "}
          <span style={styles.timeValue}>{formatTime(currentTime)}</span>
        </div>

        <div style={styles.rankingsContainer}>
          <h3 style={styles.rankingsTitle}>Rankings</h3>
          {playerRankings.length > 0 ? (
            playerRankings.map((player, idx) => (
              <div key={player.id} style={styles.row}>
                <div style={styles.rank}>{idx + 1}</div>
                <div style={styles.playerName}>{player.name}</div>
                <div style={styles.playerTime}>{formatTime(player.time)}</div>
              </div>
            ))
          ) : (
            <div style={styles.noRankings}>No players have finished yet</div>
          )}
        </div>

        <div style={styles.buttonContainer}>
          {isLastMaze ? (
            <button style={styles.button} onClick={handleRestart}>
              Play Again
            </button>
          ) : (
            <button style={styles.button} onClick={handleNextMaze}>
              Next Maze
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  panel: {
    background: "#fff",
    padding: "2rem",
    borderRadius: "10px",
    minWidth: "400px",
    maxWidth: "600px",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
    color: "#333",
  },
  title: {
    marginBottom: "0.5rem",
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#222",
  },
  gameMode: {
    fontSize: "1rem",
    fontWeight: "bold",
    color: "#ff7733",
    marginBottom: "1.5rem",
  },
  yourTime: {
    fontSize: "1.2rem",
    marginBottom: "2rem",
    padding: "1rem",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
  },
  timeValue: {
    fontWeight: "bold",
    fontSize: "1.4rem",
    color: "#ff7733",
    fontFamily: "monospace",
  },
  rankingsContainer: {
    marginBottom: "2rem",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    padding: "1rem",
  },
  rankingsTitle: {
    fontSize: "1.3rem",
    marginBottom: "1rem",
    color: "#444",
  },
  row: {
    padding: "0.8rem",
    borderBottom: "1px solid #eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rank: {
    fontWeight: "bold",
    fontSize: "1.2rem",
    width: "40px",
    textAlign: "center",
  },
  playerName: {
    flex: 1,
    textAlign: "left",
    fontWeight: "500",
  },
  playerTime: {
    fontFamily: "monospace",
    fontSize: "1.1rem",
    color: "#555",
  },
  noRankings: {
    padding: "1rem",
    color: "#777",
    fontStyle: "italic",
  },
  buttonContainer: {
    marginTop: "1rem",
  },
  button: {
    backgroundColor: "#ff7733",
    color: "white",
    border: "none",
    padding: "0.8rem 2rem",
    fontSize: "1.1rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
};
