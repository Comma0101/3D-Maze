// src/state/gameStore.js
import { create } from "zustand";
import { CAMERA_MODES, GAME_CONFIG } from "../utils/constants";
import { generateUniqueId, generatePlayerName } from "../utils/helpers";

// Load persisted maze data from localStorage if available
const loadPersistedMazeData = () => {
  if (typeof window === "undefined") return null;

  try {
    const persistedData = localStorage.getItem("mazeGameData");
    if (!persistedData) return null;

    const data = JSON.parse(persistedData);
    // Validate persisted data structure
    if (!data || typeof data !== "object") {
      throw new Error("Invalid persisted data format");
    }
    return data;
  } catch (error) {
    console.error("Error loading persisted maze data:", error);
    // Clear corrupted data
    localStorage.removeItem("mazeGameData");
    return null;
  }
};

// Get initial values from localStorage or use defaults
const persistedData = loadPersistedMazeData();

const useGameStore = create((set, get) => ({
  // Game state
  currentMazeIndex: persistedData?.currentMazeIndex || 0,
  raceFinished: false,
  raceStarted: false,
  raceStartTime: null,
  raceResult: null, // Added: null | 'win' | 'timeout'
  playerPositions: {}, // { [playerId]: { x, y, z }, ... }
  playerRankings: [], // [{ id, time }, ...]
  totalMazes: GAME_CONFIG.TOTAL_MAZES,
  mazeData: persistedData?.mazeData || null, // { seed, width, height } from server
  rematchCounter: 0, // Added to force scene remount on play again
  teleporterPairs: [], // Added state for teleporter pairs [{entry: {x,y}, exit: {x,y}}, ...]
  checkpoints: [], // Added state for checkpoint locations [{x, y}, ...]
  lastCheckpoint: null, // Added state for the last checkpoint reached {x, y}
  // mirrors: [], // Removed mirror state

  // Player state
  playerId: generateUniqueId(),
  playerName: generatePlayerName(),
  cameraMode: CAMERA_MODES.THIRD_PERSON,

  // Timer state
  currentTime: 0,
  bestTimes: {}, // { [mazeIndex]: time }

  // Camera actions
  toggleCameraMode: () =>
    set((state) => ({
      cameraMode:
        state.cameraMode === CAMERA_MODES.THIRD_PERSON
          ? CAMERA_MODES.FIRST_PERSON
          : CAMERA_MODES.THIRD_PERSON,
    })),

  // Actions
  setPlayerPosition: (playerId, position) => {
    if (!playerId || !position || typeof position !== "object") {
      console.error("Invalid player position update", { playerId, position });
      return;
    }
    set((state) => ({
      playerPositions: {
        ...state.playerPositions,
        [playerId]: position,
      },
    }));
  },

  // Start the race and timer
  startRace: () => {
    const now = Date.now();
    set({
      raceStarted: true,
      raceStartTime: now,
      currentTime: 0,
      raceFinished: false, // Ensure race is not finished when starting
    });

    // Store the timer ID in a variable that persists between calls
    let timerId = null;

    // Clear any existing timer before starting a new one
    if (get().timerId) {
      clearInterval(get().timerId);
    }

    // Start the timer
    timerId = setInterval(() => {
      const state = get();
      if (state.raceFinished) {
        clearInterval(timerId);
        return;
      }

      const elapsed = Date.now() - state.raceStartTime;
      set({ currentTime: elapsed });

      // Check if max time exceeded
      if (elapsed >= GAME_CONFIG.MAX_RACE_TIME_MS) {
        console.log("GAME STORE: Max race time exceeded!");
        clearInterval(timerId);
        set({ timerId: null, raceFinished: true, raceResult: "timeout" }); // End the race, set result
        // Note: setRaceFinished(true) is not called here to avoid recording a 'best time' on timeout.
      }
    }, 100);

    // Store the timer ID in the state
    set({ timerId });

    return () => {
      clearInterval(timerId);
      set({ timerId: null });
    };
  },

  // End the race and record time
  setRaceFinished: (value) => {
    // Only process if we're changing from not finished to finished
    if (value && !get().raceFinished) {
      console.log("GAME STORE: Setting race as finished!");
      const finishTime = get().currentTime;
      const playerId = get().playerId;
      const mazeIndex = get().currentMazeIndex;
      const playerName = get().playerName;

      // Generate a unique ranking ID to avoid duplicate keys
      const rankingId = `${playerId}_${Date.now()}`;

      // Record best time for this maze
      set((state) => {
        // Check if this player already has a ranking for this maze
        const existingRankingIndex = state.playerRankings.findIndex((ranking) =>
          ranking.id.startsWith(playerId)
        );

        let updatedRankings;
        if (existingRankingIndex >= 0) {
          // Update existing ranking if it exists
          updatedRankings = [...state.playerRankings];
          updatedRankings[existingRankingIndex] = {
            id: rankingId, // Use unique ID
            name: playerName,
            time: finishTime,
          };
        } else {
          // Add new ranking
          updatedRankings = [
            ...state.playerRankings,
            { id: rankingId, name: playerName, time: finishTime },
          ];
        }

        // Sort rankings by time
        updatedRankings.sort((a, b) => a.time - b.time);

        return {
          bestTimes: {
            ...state.bestTimes,
            [mazeIndex]: Math.min(
              finishTime,
              state.bestTimes[mazeIndex] || Infinity
            ),
          },
          playerRankings: updatedRankings,
          raceFinished: true, // Set race as finished
          raceResult: "win", // Set result to 'win' on normal finish
        };
      });

      // Clear the timer if it exists
      if (get().timerId) {
        clearInterval(get().timerId);
        set({ timerId: null });
      }

      console.log("Race finished! Player rankings:", get().playerRankings);
    } else if (!value) {
      // If we're explicitly setting race to not finished
      set({ raceFinished: false });
    }
  },

  // Move to the next maze
  nextMaze: () => {
    const currentIndex = get().currentMazeIndex;
    const totalMazes = get().totalMazes;

    // If we've completed all mazes, reset to the first one
    const nextIndex = (currentIndex + 1) % GAME_CONFIG.TOTAL_MAZES;

    // Clear any existing timer
    if (get().timerId) {
      clearInterval(get().timerId);
    }

    set({
      currentMazeIndex: nextIndex,
      raceFinished: false,
      raceStarted: false,
      raceStartTime: null,
      currentTime: 0,
      playerRankings: [],
      timerId: null,
      raceResult: null, // Reset race result
      checkpoints: [], // Reset checkpoints for the new maze
      lastCheckpoint: null, // Reset last checkpoint
      mirrors: [], // Reset mirrors for the new maze
    });

    // Persist the updated maze index to localStorage
    try {
      const currentState = get();
      const dataToPersist = {
        currentMazeIndex: nextIndex,
        mazeData: currentState.mazeData,
      };
      localStorage.setItem("mazeGameData", JSON.stringify(dataToPersist));
      console.log("Persisted updated maze index to localStorage:", nextIndex);
    } catch (error) {
      console.error("Error persisting maze index:", error);
    }

    console.log("Moving to next maze:", nextIndex);
  },

  // Set player information
  setPlayerInfo: (id, name) => set({ playerId: id, playerName: name }),

  // Add another player to the rankings (for multiplayer)
  addPlayerRanking: (playerId, playerName, time) =>
    set((state) => {
      // Generate a unique ranking ID to avoid duplicate keys
      const rankingId = `${playerId}_${Date.now()}`;

      // Check if this player already has a ranking
      const existingRankingIndex = state.playerRankings.findIndex((ranking) =>
        ranking.id.startsWith(playerId)
      );

      let updatedRankings;
      if (existingRankingIndex >= 0) {
        // Update existing ranking if it exists
        updatedRankings = [...state.playerRankings];
        updatedRankings[existingRankingIndex] = {
          id: rankingId,
          name: playerName,
          time: time,
        };
      } else {
        // Add new ranking
        updatedRankings = [
          ...state.playerRankings,
          { id: rankingId, name: playerName, time },
        ];
      }

      // Sort rankings by time
      updatedRankings.sort((a, b) => a.time - b.time);

      return {
        playerRankings: updatedRankings,
      };
    }),

  // Set player rankings directly (for multiplayer)
  setPlayerRankings: (rankings) => set({ playerRankings: rankings }),

  // Set maze data from server
  setMazeData: (mazeData) => {
    if (!mazeData || !mazeData.seed || !mazeData.width || !mazeData.height) {
      console.error("Invalid maze data", mazeData);
      return;
    }

    set((state) => {
      const newState = {
        ...state,
        mazeData,
      };

      // Batch persist to localStorage
      if (typeof window !== "undefined") {
        try {
          const dataToPersist = {
            currentMazeIndex: newState.currentMazeIndex,
            mazeData: newState.mazeData,
          };
          localStorage.setItem("mazeGameData", JSON.stringify(dataToPersist));
        } catch (error) {
          console.error("Error persisting maze data:", error);
        }
      }

      return newState;
    });
  },

  // Action for "Play Again" button
  playAgain: () => {
    console.log("GAME STORE: Play Again triggered");
    // Clear any existing timer
    if (get().timerId) {
      clearInterval(get().timerId);
    }
    // Reset race state but keep the current maze index and best times
    set({
      raceFinished: false,
      raceStarted: false, // Will be set true by HUD useEffect
      raceStartTime: null,
      currentTime: 0,
      playerRankings: [], // Clear rankings for the new race
      timerId: null,
      raceResult: null, // Reset race result
      rematchCounter: get().rematchCounter + 1, // Increment counter,
      // Keep currentMazeIndex, bestTimes, mazeData
    });
    // The change in rematchCounter will be used as a key in App.jsx to remount MazeScene
  },

  // Action to set teleporter pairs
  setTeleporterPairs: (pairs) => set({ teleporterPairs: pairs }),

  // Action to set checkpoint locations
  setCheckpoints: (points) => set({ checkpoints: points }),

  // Action to update the last reached checkpoint
  setLastCheckpoint: (checkpoint) => set({ lastCheckpoint: checkpoint }),

  // Action to set mirror data - REMOVED
  // setMirrors: (mirrorData) => set({ mirrors: mirrorData }),

  // Action to apply respawn penalty
  applyRespawnPenalty: () => {
    set((state) => {
      if (state.raceStarted && !state.raceFinished) {
        // Add penalty to the race start time, effectively increasing current time
        const newStartTime =
          state.raceStartTime - GAME_CONFIG.RESPAWN_PENALTY_MS;
        // Calculate the new current time based on the adjusted start time
        const newCurrentTime = Date.now() - newStartTime;
        console.log(
          `Applying ${GAME_CONFIG.RESPAWN_PENALTY_MS}ms penalty. New current time: ${newCurrentTime}`
        );
        return { raceStartTime: newStartTime, currentTime: newCurrentTime };
      }
      return {}; // No change if race not started or already finished
    });
  },

  // Reset the game
  resetGame: () => {
    // Clear persisted maze data
    try {
      localStorage.removeItem("mazeGameData");
      console.log("Cleared persisted maze data from localStorage");
    } catch (error) {
      console.error("Error clearing persisted maze data:", error);
    }

    set({
      currentMazeIndex: 0,
      raceFinished: false,
      raceStarted: false,
      raceStartTime: null,
      currentTime: 0,
      playerRankings: [],
      mazeData: null,
      raceResult: null, // Reset race result
      teleporterPairs: [], // Reset teleporters on full game reset
      checkpoints: [], // Reset checkpoints on full game reset
      lastCheckpoint: null, // Reset last checkpoint
      // mirrors: [], // Removed mirror reset
    });
  },
}));

export default useGameStore;
