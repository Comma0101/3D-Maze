// src/components/Networking/useColyseus.js
import { useRef, useState, useEffect } from "react";
import { Client } from "colyseus.js";
import useGameStore from "../../state/gameStore";
import { SERVER_CONFIG } from "../../utils/constants";

export default function useColyseus() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [room, setRoom] = useState(null);
  const client = useRef(null);

  const {
    setPlayerPosition,
    setRaceFinished,
    addPlayerRanking,
    nextMaze,
    currentMazeIndex,
    playerId,
    playerName,
    startRace,
    setPlayerRankings,
    setMazeData,
  } = useGameStore((state) => state);

  // Connect to the Colyseus server
  useEffect(() => {
    const connectToServer = async () => {
      try {
        // Create a new Colyseus client
        client.current = new Client(SERVER_CONFIG.URL);
        console.log("Connecting to Colyseus server...");

        // Join or create a room using a valid name
        const effectiveName =
          playerName || `Player_${playerId.substring(0, 5)}`;
        const joinedRoom = await client.current.joinOrCreate(
          SERVER_CONFIG.ROOM_NAME,
          {
            playerId,
            name: effectiveName,
          }
        );

        console.log("Connected to room:", joinedRoom.id);
        setRoom(joinedRoom);
        setConnected(true);
        setError(null);

        // Handle room state changes
        joinedRoom.onStateChange((state) => {
          console.log("Room state changed:", state);
        });

        // Handle player movement updates
        joinedRoom.onMessage("move", (data) => {
          if (data.playerId !== playerId) {
            // Update other player's position in the store
            setPlayerPosition(data.playerId, data.position);
          }
        });

        // Handle player finish
        joinedRoom.onMessage("playerFinish", (data) => {
          console.log("Player finished:", data);

          // Update rankings in the store
          if (data.rankings) {
            setPlayerRankings(data.rankings);
          }

          // If this is the local player, mark the race as finished
          if (data.playerId === playerId) {
            setRaceFinished(true);
          }
        });

        // Handle race start
        joinedRoom.onMessage("raceStart", (data) => {
          console.log("Race started:", data);

          // If maze data is provided, update it in the store
          if (data.mazeData) {
            console.log("Received maze data:", data.mazeData);
            setMazeData(data.mazeData);
          }

          startRace();
        });

        // Handle maze updates
        joinedRoom.onMessage("mazeUpdate", (data) => {
          console.log("Maze updated:", data);

          // Update maze data in the store
          if (data.mazeData) {
            console.log("Received new maze data:", data.mazeData);
            setMazeData(data.mazeData);
          }
        });

        // Handle initial room state
        joinedRoom.onMessage("roomState", (data) => {
          console.log("Received room state:", data);

          // Update player positions
          if (data.players) {
            data.players.forEach((player) => {
              if (player.id !== playerId) {
                setPlayerPosition(player.id, player.position);
              }
            });
          }

          // Update rankings
          if (data.rankings) {
            setPlayerRankings(data.rankings);
          }

          // Update maze data
          if (data.mazeData) {
            console.log("Received initial maze data:", data.mazeData);
            setMazeData(data.mazeData);
          }
        });
      } catch (err) {
        console.error("Failed to connect to Colyseus server:", err);
        setError("Failed to connect to multiplayer server.");
        setConnected(false);
      }
    };

    connectToServer();

    // Cleanup function
    return () => {
      if (room) {
        room.leave();
      }
    };
  }, []);

  // Function to send movement updates
  const sendMove = (position) => {
    if (connected && room) {
      // Send position update to the server
      room.send("move", {
        playerId,
        position,
      });
    }
    // Position is already updated in the store by the Player component
  };

  // Function to notify that player finished the race
  const sendFinish = () => {
    if (connected && room) {
      // Send finish notification to the server
      room.send("finish", {
        playerId,
      });
    } else {
      // In single player mode, just add the player to rankings locally
      const currentTime = Date.now() - useGameStore.getState().raceStartTime;
      addPlayerRanking(playerId, playerName, currentTime);
    }
  };

  // Function to request moving to the next maze
  const requestNextMaze = () => {
    if (connected && room) {
      // Send next maze request to the server
      room.send("nextMaze");
    } else {
      // In single player mode, just move to the next maze locally
      nextMaze();
    }
  };

  return {
    sendMove,
    sendFinish,
    requestNextMaze,
    connected,
    error,
  };
}
