// server/index.js
import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { MazeRoom } from "./rooms/MazeRoom.js"; // Include the .js extension

const app = express();

// Configure CORS to allow requests from the client
app.use(
  cors({
    origin: "http://localhost:5173", // Vite's default port
    credentials: false,
  })
);

// Add headers to allow CORS for WebSockets
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const server = http.createServer(app);
const gameServer = new Server({
  server,
});

// Define the Colyseus room for the game
gameServer.define("maze_room", MazeRoom);

const port = process.env.PORT || 2567;
server.listen(port, () => {
  console.log(`Listening on ws://localhost:${port}`);
});
