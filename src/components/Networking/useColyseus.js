// src/components/Networking/useColyseus.js
import { useRef, useState, useEffect } from "react";
import { Client } from "colyseus.js";
import useGameStore from "../../state/gameStore";

export default function useColyseus() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(
    "Multiplayer mode disabled - using single player mode"
  );

  const {
    setPlayerPosition,
    setRaceFinished,
    addPlayerRanking,
    nextMaze,
    currentMazeIndex,
    playerId,
    playerName,
    startRace,
  } = useGameStore((state) => state);

  // Start the race immediately in single player mode
  useEffect(() => {
    console.log("Starting single player mode");
    startRace();
    setConnected(false);
  }, []);

  // Function to send movement updates (no-op in single player)
  const sendMove = (position) => {
    // In single player mode, we don't need to send position to server
    // The position is already updated in the store by the Player component
  };

  // Function to notify that player finished the race
  const sendFinish = () => {
    // In single player mode, we just add the player to rankings locally
    const currentTime = Date.now() - useGameStore.getState().raceStartTime;
    addPlayerRanking(playerId, playerName, currentTime);
  };

  // Function to request moving to the next maze
  const requestNextMaze = () => {
    // In single player mode, we just move to the next maze locally
    nextMaze();
  };

  return {
    sendMove,
    sendFinish,
    requestNextMaze,
    connected,
    error,
  };
}
