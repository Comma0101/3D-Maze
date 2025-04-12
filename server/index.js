// server/index.js
import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { MazeRoom } from "./rooms/MazeRoom.js";
import { SERVER_CONFIG, ROOM_CONFIG } from "./utils/constants.js";

const app = express();

// Configure CORS to allow requests from the client
app.use(
  cors({
    origin: SERVER_CONFIG.CORS_ORIGIN,
    credentials: false,
  })
);

// Add headers to allow CORS for WebSockets
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", SERVER_CONFIG.CORS_ORIGIN);
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
gameServer.define(ROOM_CONFIG.ROOM_NAME, MazeRoom);

server.listen(SERVER_CONFIG.PORT, () => {
  console.log(`Listening on ws://localhost:${SERVER_CONFIG.PORT}`);
});
