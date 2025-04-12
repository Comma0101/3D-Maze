// server/utils/constants.js

// Server configuration
export const SERVER_CONFIG = {
  PORT: process.env.PORT || 2567,
  CORS_ORIGIN: "http://localhost:5173", // Vite's default port
};

// Room configuration
export const ROOM_CONFIG = {
  ROOM_NAME: "maze_room",
  MAX_CLIENTS: 8,
  NEXT_MAZE_DELAY: 10000, // 10 seconds
};

// Maze configuration
export const MAZE_CONFIG = {
  DEFAULT_WIDTH: 30,
  DEFAULT_HEIGHT: 30,
  TOTAL_MAZES: 5,
};

// Player configuration
export const PLAYER_CONFIG = {
  DEFAULT_POSITION: {
    x: 0,
    y: 0.5,
    z: 0,
  },
};
