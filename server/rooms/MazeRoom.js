// server/rooms/MazeRoom.js
import { Room } from "colyseus";
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

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
    this.id = id;
    this.name = name || `Player_${id.substring(0, 5)}`;
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

// Define the schema for the room state
class MazeState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.rankings = new ArraySchema();
    this.currentMaze = 0;
    this.raceStartTime = Date.now();
    this.raceActive = false;
  }
}

// Define types for MazeState
type({ map: Player })(MazeState.prototype, "players");
type([Ranking])(MazeState.prototype, "rankings");
type("number")(MazeState.prototype, "currentMaze");
type("number")(MazeState.prototype, "raceStartTime");
type("boolean")(MazeState.prototype, "raceActive");

export class MazeRoom extends Room {
  onCreate(options) {
    this.setState(new MazeState());
    this.maxClients = 8; // Maximum number of players

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
        this.broadcast("playerFinish", {
          playerId: playerId,
          playerName: player.name,
          time: finishTime,
          rankings: this.state.rankings.map((r) => ({
            id: r.id,
            name: r.name,
            time: r.time,
          })),
        });

        // Check if all players have finished
        const allFinished = Object.values(this.state.players).every(
          (p) => p.finishTime !== null
        );

        if (allFinished) {
          // Wait a bit before moving to the next maze
          setTimeout(() => {
            this.nextMaze();
          }, 10000); // 10 seconds
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
    console.log(
      `${client.sessionId} joined MazeRoom with playerId: ${options.playerId}`
    );

    // Create a new player using the provided playerId or fallback to sessionId
    const playerId = options.playerId || client.sessionId;
    const player = new Player(playerId, options.name);

    // Store the player in the state using the client's sessionId as the key
    this.state.players[client.sessionId] = player;

    // Store the mapping between sessionId and playerId
    client.userData = { playerId };

    // If this is the first player, start the race
    if (Object.keys(this.state.players).length === 1) {
      this.startRace();
    }

    // Send current state to the new player
    client.send("roomState", {
      players: Object.entries(this.state.players).map(([id, p]) => ({
        id,
        name: p.name,
        position: p.position,
        finishTime: p.finishTime,
      })),
      rankings: this.state.rankings.map((r) => ({
        id: r.id,
        name: r.name,
        time: r.time,
      })),
      currentMaze: this.state.currentMaze,
      raceActive: this.state.raceActive,
    });
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

    // Broadcast race start
    this.broadcast("raceStart", {
      maze: this.state.currentMaze,
      startTime: this.state.raceStartTime,
    });
  }

  // Move to the next maze
  nextMaze() {
    // Increment maze index (cycle through 5 mazes)
    this.state.currentMaze = (this.state.currentMaze + 1) % 5;

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
