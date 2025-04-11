// src/components/Maze/MazeGenerator.jsx

// Define maze cell types
export const CELL_TYPES = {
  WALL: 1,
  PATH: 0,
  START: 3,
  FINISH: 2,
};

// Collection of 5 different maze layouts
const MAZE_LAYOUTS = [
  // Maze 1: Simple maze with a single path
  {
    generate: (width, height) => {
      return generateRandomMaze(width, height, 0.3);
    },
  },
  // Maze 2: More complex maze with multiple paths
  {
    generate: (width, height) => {
      return generateRandomMaze(width, height, 0.4);
    },
  },
  // Maze 3: Maze with more open areas
  {
    generate: (width, height) => {
      return generateRandomMaze(width, height, 0.5);
    },
  },
  // Maze 4: Maze with narrow corridors
  {
    generate: (width, height) => {
      return generateRandomMaze(width, height, 0.25);
    },
  },
  // Maze 5: Complex maze with many dead ends
  {
    generate: (width, height) => {
      return generateRandomMaze(width, height, 0.35);
    },
  },
];

// Generate a maze using a recursive backtracking algorithm
export function generateMaze(width = 10, height = 10, mazeIndex = 0) {
  // Use the appropriate maze layout based on the index
  const safeIndex = mazeIndex % MAZE_LAYOUTS.length;
  return MAZE_LAYOUTS[safeIndex].generate(width, height);
}

// Helper function to generate a random maze using a modified recursive backtracking algorithm
function generateRandomMaze(width, height, complexity = 0.3) {
  // Ensure odd dimensions to have walls between all paths
  const w = Math.max(5, Math.floor(width / 2) * 2 + 1);
  const h = Math.max(5, Math.floor(height / 2) * 2 + 1);

  // Initialize the maze with all walls
  const maze = Array.from({ length: h }, () =>
    Array.from({ length: w }, () => CELL_TYPES.WALL)
  );

  // Define the starting point (always in the top-left area)
  const startX = 1;
  const startY = 1;
  maze[startY][startX] = CELL_TYPES.START;

  // Define the finish point (always in the bottom-right area)
  // We'll set this at the end to make sure it doesn't get overwritten
  const finishX = w - 2;
  const finishY = h - 2;

  console.log("Will set finish position at:", finishX, finishY);

  // Create a more interesting maze with multiple paths
  const createInterestingMaze = true;
  if (createInterestingMaze) {
    // Create a winding path from start to finish
    let currentX = startX;
    let currentY = startY;

    // Create a more interesting path with some randomness
    while (currentX < finishX || currentY < finishY) {
      // Decide whether to move horizontally or vertically
      const moveHorizontal = Math.random() < 0.5 || currentY === finishY;
      const moveVertical = !moveHorizontal || currentX === finishX;

      if (moveHorizontal && currentX < finishX) {
        currentX++;
        maze[currentY][currentX] = CELL_TYPES.PATH;
      } else if (moveVertical && currentY < finishY) {
        currentY++;
        maze[currentY][currentX] = CELL_TYPES.PATH;
      }

      // Occasionally create a branch
      if (Math.random() < 0.2) {
        const branchX = currentX + (Math.random() < 0.5 ? 1 : -1);
        const branchY = currentY + (Math.random() < 0.5 ? 1 : -1);

        if (branchX > 0 && branchX < w - 1 && branchY > 0 && branchY < h - 1) {
          maze[branchY][branchX] = CELL_TYPES.PATH;

          // Sometimes extend the branch
          if (Math.random() < 0.5) {
            const extendX = branchX + (Math.random() < 0.5 ? 1 : -1);
            const extendY = branchY + (Math.random() < 0.5 ? 1 : -1);

            if (
              extendX > 0 &&
              extendX < w - 1 &&
              extendY > 0 &&
              extendY < h - 1
            ) {
              maze[extendY][extendX] = CELL_TYPES.PATH;
            }
          }
        }
      }
    }

    // Add some random paths for variety
    for (let i = 0; i < w * h * 0.15; i++) {
      const rx = 1 + Math.floor(Math.random() * (w - 2));
      const ry = 1 + Math.floor(Math.random() * (h - 2));
      if (maze[ry][rx] === CELL_TYPES.WALL) {
        maze[ry][rx] = CELL_TYPES.PATH;

        // Create small connected areas
        if (Math.random() < 0.4) {
          const directions = [
            [0, 1],
            [1, 0],
            [0, -1],
            [-1, 0],
          ];

          const dir = directions[Math.floor(Math.random() * directions.length)];
          const nx = rx + dir[0];
          const ny = ry + dir[1];

          if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
            maze[ny][nx] = CELL_TYPES.PATH;
          }
        }
      }
    }
  } else {
    // Carve paths using recursive backtracking
    carvePassages(startX, startY, maze, w, h, complexity);
  }

  // Ensure there's a path to the finish
  ensurePathToFinish(maze, finishX, finishY);

  // NOW SET THE FINISH POSITION - after all maze generation is complete
  console.log("Setting finish position at:", finishX, finishY);

  // Create a clear area around the finish point (3x3 grid of paths)
  for (
    let y = Math.max(1, finishY - 1);
    y <= Math.min(h - 2, finishY + 1);
    y++
  ) {
    for (
      let x = Math.max(1, finishX - 1);
      x <= Math.min(w - 2, finishX + 1);
      x++
    ) {
      maze[y][x] = CELL_TYPES.PATH;
    }
  }

  // Ensure there's a clear path from multiple directions
  maze[finishY - 1][finishX] = CELL_TYPES.PATH; // Path above
  maze[finishY][finishX - 1] = CELL_TYPES.PATH; // Path to the left
  maze[finishY + 1][finishX] = CELL_TYPES.PATH; // Path below (if within bounds)
  maze[finishY][finishX + 1] = CELL_TYPES.PATH; // Path to the right (if within bounds)

  // FINALLY set the finish position
  maze[finishY][finishX] = CELL_TYPES.FINISH;

  // Log to confirm finish position was set
  console.log(
    "Finish position set:",
    maze[finishY][finishX] === CELL_TYPES.FINISH
  );
  console.log("CELL_TYPES.FINISH value:", CELL_TYPES.FINISH);

  // Count cells of each type for debugging
  let wallCount = 0;
  let pathCount = 0;
  let startCount = 0;
  let finishCount = 0;

  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      const cell = maze[y][x];
      if (cell === CELL_TYPES.WALL) wallCount++;
      else if (cell === CELL_TYPES.PATH) pathCount++;
      else if (cell === CELL_TYPES.START) startCount++;
      else if (cell === CELL_TYPES.FINISH) finishCount++;
    }
  }

  console.log(
    "Final maze cell counts - Wall:",
    wallCount,
    "Path:",
    pathCount,
    "Start:",
    startCount,
    "Finish:",
    finishCount
  );

  return maze;
}

// Carve passages using recursive backtracking
function carvePassages(x, y, maze, width, height, complexity) {
  // Define possible directions: [dx, dy]
  const directions = [
    [0, 2], // down
    [2, 0], // right
    [0, -2], // up
    [-2, 0], // left
  ];

  // Shuffle directions for randomness
  directions.sort(() => Math.random() - 0.5);

  // Try each direction
  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;

    // Check if the new position is within bounds and is a wall
    if (
      nx > 0 &&
      nx < width - 1 &&
      ny > 0 &&
      ny < height - 1 &&
      maze[ny][nx] === CELL_TYPES.WALL
    ) {
      // Carve a path
      maze[y + dy / 2][x + dx / 2] = CELL_TYPES.PATH;
      maze[ny][nx] = CELL_TYPES.PATH;

      // Continue recursively
      carvePassages(nx, ny, maze, width, height, complexity);
    }
  }

  // Add some random paths based on complexity factor
  if (Math.random() < complexity) {
    const rx = 1 + 2 * Math.floor(Math.random() * ((width - 1) / 2));
    const ry = 1 + 2 * Math.floor(Math.random() * ((height - 1) / 2));

    if (maze[ry][rx] === CELL_TYPES.WALL) {
      maze[ry][rx] = CELL_TYPES.PATH;
      carvePassages(rx, ry, maze, width, height, complexity);
    }
  }
}

// Ensure there's a path from start to finish
function ensurePathToFinish(maze, finishX, finishY) {
  // Simple implementation: ensure there's at least one adjacent path cell
  const directions = [
    [0, 1], // down
    [1, 0], // right
    [0, -1], // up
    [-1, 0], // left
  ];

  let hasPath = false;

  for (const [dx, dy] of directions) {
    const nx = finishX + dx;
    const ny = finishY + dy;

    if (nx > 0 && nx < maze[0].length - 1 && ny > 0 && ny < maze.length - 1) {
      if (maze[ny][nx] === CELL_TYPES.PATH) {
        hasPath = true;
        break;
      }
    }
  }

  // If no path exists, create one
  if (!hasPath) {
    // Create a path from the left
    maze[finishY][finishX - 1] = CELL_TYPES.PATH;
  }
}
