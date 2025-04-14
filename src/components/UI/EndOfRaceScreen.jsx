import React, { useMemo } from "react"; // Combined imports
import useGameStore from "../../state/gameStore";
import { formatTime } from "../../utils/helpers";
import "./styles.css"; // Assuming styles will be added here

export default function EndOfRaceScreen() {
  const {
    currentTime, // Final time for this race
    bestTimes, // Object of best times per maze
    currentMazeIndex,
    playerRankings,
    playerId,
    playAgain,
    raceResult, // Get the race result ('win' or 'timeout')
  } = useGameStore((state) => state);

  // Calculate final rank, best time, and time difference
  const { finalRank, currentBestTime, timeDifference } = useMemo(() => {
    const rank = playerRankings.findIndex((p) => p.id.startsWith(playerId)) + 1;
    const best = bestTimes[currentMazeIndex];
    let diff = null;
    if (raceResult === "win" && best) {
      diff = currentTime - best;
    }
    return {
      finalRank: rank > 0 ? rank : "?",
      currentBestTime: best,
      timeDifference: diff,
    };
  }, [
    playerRankings,
    playerId,
    bestTimes,
    currentMazeIndex,
    currentTime,
    raceResult,
  ]);

  // Format the time difference for display
  const formatTimeDifference = (difference) => {
    if (difference === null || difference === undefined) return null;
    if (difference <= 0) {
      // Allow for a tiny margin of error for floating point comparison
      return (
        <span className="time-diff-best">
          New Best! ({formatTime(difference)})
        </span>
      );
    } else {
      return (
        <span className="time-diff-slower">+{formatTime(difference)}</span>
      );
    }
  };

  const handleRematch = () => {
    console.log("EndOfRaceScreen: Calling playAgain action");
    playAgain(); // Call the action from the store
  };

  return (
    <div className="overlay">
      {" "}
      {/* Reusing overlay style from leaderboard */}
      <div className="panel end-of-race-panel">
        <h2 className="title">
          {raceResult === "timeout" ? "Time's Up!" : "Race Finished!"}
        </h2>
        <div className="race-stats">
          {/* Only show time/rank if player won */}
          {raceResult === "win" && (
            <>
              <div className="stat-item">
                <span className="stat-label">Your Time:</span>
                <span className="stat-value time-value">
                  {formatTime(currentTime)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Rank:</span>
                <span className="stat-value">{finalRank}</span>
              </div>
              {currentBestTime && (
                <div className="stat-item">
                  <span className="stat-label">Best Time:</span>
                  <span className="stat-value time-value">
                    {formatTime(currentBestTime)}
                  </span>
                </div>
              )}
              {timeDifference !== null && (
                <div className="stat-item time-difference-item">
                  <span className="stat-label">Difference:</span>
                  <span className="stat-value time-value">
                    {formatTimeDifference(timeDifference)}
                  </span>
                </div>
              )}
            </>
          )}
          {/* Show message if timed out */}
          {raceResult === "timeout" && (
            <div className="stat-item timeout-message">
              <p>You ran out of time!</p>
            </div>
          )}
        </div>
        <div className="button-container">
          <button className="button" onClick={handleRematch}>
            Play Again
          </button>
          {/* TODO: Add Share button? */}
        </div>
      </div>
    </div>
  );
}
