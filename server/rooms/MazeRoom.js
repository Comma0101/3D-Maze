// server/rooms/MazeRoom.js
import { Room } from "colyseus";
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { ROOM_CONFIG, MAZE_CONFIG, PLAYER_CONFIG } from "../utils/constants.js";
import {
  generateRandomSeed,
  generatePlayerName,
  simplifyPlayer,
  simplifyRanking,
  sortRankings,
} from "../utils/helpers.js";

// Position schema
class Position extends Schema {
  constructor() {
    super();
    this.x = 0;
    this.y = 0.5;
    this.z = 0;
  }
}
type("number")(Position.prototype, "x");
type("number")(Position.prototype, "y");
type("number")(Position.prototype, "z");

// Player schema
class Player extends Schema {
  constructor(id, name) {
    super();
    this.id = id || "unknown";
    this.name = typeof name === "string" ? name : generatePlayerName(id);
    this.position = new Position();
    this.finishTime = 0;
    this.currentMaze = 0;
  }
}

// Define types for Player
type("string")(Player.prototype, "id");
type("string")(Player.prototype, "name");
type(Position)(Player.prototype, "position");
type("number")(Player.prototype, "finishTime");
type("number")(Player.prototype, "currentMaze");

// Ranking schema
class Ranking extends Schema {
  constructor(id, name, time) {
    super();
    this.id = id;
    this.name = name;
    this.time = time;
  }
}

// Define types for Ranking
type("string")(Ranking.prototype, "id");
type("string")(Ranking.prototype, "name");
type("number")(Ranking.prototype, "time");

// Define a schema for maze data
class MazeData extends Schema {
  constructor() {
    super();
    this.seed = generateRandomSeed();
    this.width = MAZE_CONFIG.DEFAULT_WIDTH;
    this.height = MAZE_CONFIG.DEFAULT_HEIGHT;
  }
}

// Define types for MazeData
type("number")(MazeData.prototype, "seed");
type("number")(MazeData.prototype, "width");
type("number")(MazeData.prototype, "height");

// Define the schema for the room state
class MazeState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.rankings = new ArraySchema();
    this.currentMaze = 0;
    this.raceStartTime = Date.now();
    this.raceActive = false;
    this.mazeData = new MazeData(); // Add maze data to the state
  }
}

// Define types for MazeState
type({ map: Player })(MazeState.prototype, "players");
type([Ranking])(MazeState.prototype, "rankings");
type("number")(MazeState.prototype, "currentMaze");
type("number")(MazeState.prototype, "raceStartTime");
type("boolean")(MazeState.prototype, "raceActive");
type(MazeData)(MazeState.prototype, "mazeData");

export class MazeRoom extends Room {
  onCreate(options) {
    this.setState(new MazeState());
    this.maxClients = ROOM_CONFIG.MAX_CLIENTS;

    // Listen for player movement
    this.onMessage("move", (client, data) => {
      const player = this.state.players[client.sessionId];

      if (player) {
        // Update player position
        player.position.x = data.position.x;
        player.position.y = data.position.y;
        player.position.z = data.position.z;

        // Broadcast updated position to all clients
        this.broadcast("move", {
          playerId: data.playerId, // Use the playerId from the message
          position: {
            x: player.position.x,
            y: player.position.y,
            z: player.position.z,
          },
        });
      }
    });

    // Listen for race finish
    this.onMessage("finish", (client, data) => {
      const player = this.state.players[client.sessionId];
      if (!player) return;
      const playerId =
        data?.playerId || client.userData?.playerId || client.sessionId;

      if (player && !player.finishTime) {
        // Calculate finish time
        const finishTime = Date.now() - this.state.raceStartTime;
        player.finishTime = finishTime;

        // Add to rankings
        const ranking = new Ranking(playerId, player.name, finishTime);
        this.state.rankings.push(ranking);

        // Sort rankings by time
        this.state.rankings.sort((a, b) => a.time - b.time);

        // Broadcast finish to all clients
        try {
          // Create simplified rankings using helper function
          const simplifiedRankings = [];
          for (let i = 0; i < this.state.rankings.length; i++) {
            try {
              const simplified = simplifyRanking(this.state.rankings[i]);
              if (simplified) {
                simplifiedRankings.push(simplified);
              }
            } catch (error) {
              console.error(`Error simplifying ranking at index ${i}:`, error);
            }
          }

          this.broadcast("playerFinish", {
            playerId: playerId,
            playerName: player.name || "Unknown",
            time: finishTime,
            rankings: simplifiedRankings,
          });

          console.log("Successfully broadcast player finish");
        } catch (error) {
          console.error("Error broadcasting player finish:", error);
        }

        // Check if all players have finished
        const allFinished = Object.values(this.state.players).every(
          (p) => p.finishTime !== null
        );

        if (allFinished) {
          // Wait before moving to the next maze
          setTimeout(() => {
            this.nextMaze();
          }, ROOM_CONFIG.NEXT_MAZE_DELAY);
        }
      }
    });

    // Listen for next maze request
    this.onMessage("nextMaze", (client) => {
      // Only the first player to request can trigger the next maze
      if (
        this.state.rankings.length > 0 &&
        this.state.rankings[0].id === client.sessionId
      ) {
        this.nextMaze();
      }
    });
  }

  onJoin(client, options) {
    options = options || {};
    console.log("DEBUG: onJoin received options:", options);
    if (!options.name) {
      console.warn(
        `Warning: options.name is undefined for client ${client.sessionId}`
      );
    }
    options.name = options.name || generatePlayerName(client.sessionId);
    console.log("DEBUG: onJoin final options:", options);
    console.log(
      `${client.sessionId} joined MazeRoom with playerId: ${options.playerId}`
    );

    // Create a new player using the provided playerId or fallback to sessionId
    const playerId = options.playerId || client.sessionId;
    const player = new Player(
      playerId,
      options.name || generatePlayerName(playerId)
    );

    // Store the player in the state using the client's sessionId as the key
    this.state.players[client.sessionId] = player;

    // Store the mapping between sessionId and playerId
    client.userData = { playerId };

    // If this is the first player, start the race
    if (Object.keys(this.state.players).length === 1) {
      this.startRace();
    }

    // Send current state to the new player
    try {
      // Create simplified players using helper function
      const simplifiedPlayers = [];
      for (const [id, p] of Object.entries(this.state.players)) {
        try {
          const simplified = simplifyPlayer(p);
          if (simplified) {
            // Override the id to use the session id as the key
            simplified.id = id;
            simplifiedPlayers.push(simplified);
          }
        } catch (error) {
          console.error(`Error simplifying player ${id}:`, error);
        }
      }

      // Create simplified rankings using helper function
      const simplifiedRankings = [];
      for (let i = 0; i < this.state.rankings.length; i++) {
        try {
          const simplified = simplifyRanking(this.state.rankings[i]);
          if (simplified) {
            simplifiedRankings.push(simplified);
          }
        } catch (error) {
          console.error(`Error simplifying ranking at index ${i}:`, error);
        }
      }

      // Send the simplified state with maze data
      client.send("roomState", {
        players: simplifiedPlayers,
        rankings: simplifiedRankings,
        currentMaze: this.state.currentMaze,
        raceActive: this.state.raceActive,
        mazeData: {
          seed: this.state.mazeData.seed,
          width: this.state.mazeData.width,
          height: this.state.mazeData.height,
        },
      });

      console.log("Successfully sent room state to client:", client.sessionId);
    } catch (error) {
      console.error("Error sending room state:", error);
    }
  }

  onLeave(client, consented) {
    console.log(`${client.sessionId} left MazeRoom`);

    // Remove the player
    delete this.state.players[client.sessionId];

    // If no players left, reset the room
    if (Object.keys(this.state.players).length === 0) {
      this.resetRoom();
    }
  }

  onDispose() {
    console.log("Disposing MazeRoom...");
  }

  // Start a new race
  startRace() {
    this.state.raceActive = true;
    this.state.raceStartTime = Date.now();
    this.state.rankings = new ArraySchema();

    // Reset all player finish times
    Object.values(this.state.players).forEach((player) => {
      player.finishTime = null;
    });

    // Broadcast race start with maze data
    this.broadcast("raceStart", {
      maze: this.state.currentMaze,
      startTime: this.state.raceStartTime,
      mazeData: {
        seed: this.state.mazeData.seed,
        width: this.state.mazeData.width,
        height: this.state.mazeData.height,
      },
    });
  }

  // Move to the next maze
  nextMaze() {
    // Increment maze index (cycle through mazes)
    this.state.currentMaze =
      (this.state.currentMaze + 1) % MAZE_CONFIG.TOTAL_MAZES;

    // Generate a new seed for the next maze
    this.state.mazeData.seed = generateRandomSeed();

    // Broadcast the new maze data to all clients
    this.broadcast("mazeUpdate", {
      currentMaze: this.state.currentMaze,
      mazeData: {
        seed: this.state.mazeData.seed,
        width: this.state.mazeData.width,
        height: this.state.mazeData.height,
      },
    });

    // Reset rankings
    this.state.rankings = new ArraySchema();

    // Start a new race
    this.startRace();
  }

  // Reset the room
  resetRoom() {
    this.state.currentMaze = 0;
    this.state.raceActive = false;
    this.state.rankings = new ArraySchema();
  }
}
