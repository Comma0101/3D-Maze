// src/state/gameStore.js
import { create } from "zustand";

const useGameStore = create((set, get) => ({
  // Game state
  currentMazeIndex: 0,
  raceFinished: false,
  raceStarted: false,
  raceStartTime: null,
  playerPositions: {}, // { [playerId]: { x, y, z }, ... }
  playerRankings: [], // [{ id, time }, ...]
  totalMazes: 5,

  // Player state
  playerId: `player_${Math.random().toString(36).substring(2, 9)}`, // Generate a unique player ID
  playerName: `Player_${Math.floor(Math.random() * 1000)}`, // Generate a random player name

  // Timer state
  currentTime: 0,
  bestTimes: {}, // { [mazeIndex]: time }

  // Actions
  setPlayerPosition: (playerId, position) =>
    set((state) => ({
      playerPositions: {
        ...state.playerPositions,
        [playerId]: position,
      },
    })),

  // Start the race and timer
  startRace: () => {
    const now = Date.now();
    set({
      raceStarted: true,
      raceStartTime: now,
      currentTime: 0,
    });

    // Start the timer
    const timer = setInterval(() => {
      const state = get();
      if (state.raceFinished) {
        clearInterval(timer);
        return;
      }

      const elapsed = Date.now() - state.raceStartTime;
      set({ currentTime: elapsed });
    }, 100);

    return () => clearInterval(timer);
  },

  // End the race and record time
  setRaceFinished: (value) => {
    if (value && !get().raceFinished) {
      const finishTime = get().currentTime;
      const playerId = get().playerId;
      const mazeIndex = get().currentMazeIndex;

      // Record best time for this maze
      set((state) => ({
        bestTimes: {
          ...state.bestTimes,
          [mazeIndex]: Math.min(
            finishTime,
            state.bestTimes[mazeIndex] || Infinity
          ),
        },
        playerRankings: [
          ...state.playerRankings,
          { id: playerId, name: state.playerName, time: finishTime },
        ].sort((a, b) => a.time - b.time),
      }));
    }

    set({ raceFinished: value });
  },

  // Move to the next maze
  nextMaze: () => {
    const currentIndex = get().currentMazeIndex;
    const totalMazes = get().totalMazes;

    // If we've completed all mazes, reset to the first one
    const nextIndex = (currentIndex + 1) % totalMazes;

    set({
      currentMazeIndex: nextIndex,
      raceFinished: false,
      raceStarted: false,
      raceStartTime: null,
      currentTime: 0,
      playerRankings: [],
    });
  },

  // Set player information
  setPlayerInfo: (id, name) => set({ playerId: id, playerName: name }),

  // Add another player to the rankings (for multiplayer)
  addPlayerRanking: (playerId, playerName, time) =>
    set((state) => ({
      playerRankings: [
        ...state.playerRankings,
        { id: playerId, name: playerName, time },
      ].sort((a, b) => a.time - b.time),
    })),

  // Reset the game
  resetGame: () =>
    set({
      currentMazeIndex: 0,
      raceFinished: false,
      raceStarted: false,
      raceStartTime: null,
      currentTime: 0,
      playerRankings: [],
    }),
}));

export default useGameStore;
