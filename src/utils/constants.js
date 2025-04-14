// src/utils/constants.js

// Game configuration
export const GAME_CONFIG = {
  TOTAL_MAZES: 5,
  DEFAULT_MAZE_WIDTH: 30,
  DEFAULT_MAZE_HEIGHT: 30,
  PLAYER_SPEED: 7,
  PLAYER_SIZE: 0.4,
  FINISH_DETECTION_THRESHOLD: 0.3,
  NEXT_MAZE_DELAY: 3000, // milliseconds
  RESPAWN_PENALTY_MS: 3000, // 3-second penalty on respawn
  MAX_RACE_TIME_MS: 300000, // 5 minutes max race time
};

// Cell types for maze generation
export const CELL_TYPES = {
  WALL: 1,
  PATH: 0,
  START: 3,
  FINISH: 2,
  SPIKE_WALL_TRAP: 4, // Added for the moving spike wall trap
  BLADE_TRAP: 5, // Added for the rotating blade trap
  CRUSHER_TRAP: 6, // Added for the vertical crusher trap
  TELEPORTER: 7, // Added for teleporter pads
  CHECKPOINT: 8, // Added for checkpoints
  MIRROR: 9, // Added for observation puzzle mirrors
};

// Camera modes
export const CAMERA_MODES = {
  FIRST_PERSON: "first-person",
  THIRD_PERSON: "third-person",
};

// Server configuration
export const SERVER_CONFIG = {
  URL: "ws://localhost:2567",
  ROOM_NAME: "maze_room",
};
