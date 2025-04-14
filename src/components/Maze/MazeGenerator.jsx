// src/components/Maze/MazeGenerator.jsx
import { CELL_TYPES } from "../../utils/constants";
import { seededRandom } from "../../utils/helpers";
import { Queue } from "@datastructures-js/queue"; // Using a library for Queue

// Collection of 5 different maze layouts with increased complexity
const MAZE_LAYOUTS = [
  // Maze 1: Complex maze with multiple paths and dead ends
  {
    generate: (width, height, seed) => {
      return generateRandomMaze(width, height, 0.4, seed, 0.3);
    },
  },
  // Maze 2: Very complex maze with many intersections
  {
    generate: (width, height, seed) => {
      return generateRandomMaze(width, height, 0.5, seed, 0.4);
    },
  },
  // Maze 3: Maze with more open areas and islands
  {
    generate: (width, height, seed) => {
      return generateRandomMaze(width, height, 0.6, seed, 0.5);
    },
  },
  // Maze 4: Labyrinth with narrow corridors and many dead ends
  {
    generate: (width, height, seed) => {
      return generateRandomMaze(width, height, 0.35, seed, 0.6);
    },
  },
  // Maze 5: Extremely complex maze with varying path widths
  {
    generate: (width, height, seed) => {
      return generateRandomMaze(width, height, 0.45, seed, 0.7);
    },
  },
];

// Generate a maze using a recursive backtracking algorithm
export function generateMaze(
  width = 10,
  height = 10,
  mazeIndex = 0,
  seed = null
) {
  // Use the appropriate maze layout based on the index
  const safeIndex = mazeIndex % MAZE_LAYOUTS.length;
  return MAZE_LAYOUTS[safeIndex].generate(width, height, seed);
}

// Helper function to generate a random maze using a modified recursive backtracking algorithm
function generateRandomMaze(
  width,
  height,
  complexity = 0.3,
  seed = null,
  branchFactor = 0.3
) {
  // Create a seeded random function if a seed is provided
  const random = seed ? seededRandom(seed) : Math.random;
  // Ensure odd dimensions to have walls between all paths
  const w = Math.max(15, Math.floor(width / 2) * 2 + 1);
  const h = Math.max(15, Math.floor(height / 2) * 2 + 1);

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

      // Occasionally create a branch with increased probability
      if (Math.random() < branchFactor) {
        // Create a longer branch
        let branchLength = 1 + Math.floor(Math.random() * 3); // Branch length 1-3
        let branchX = currentX;
        let branchY = currentY;

        // Choose a random direction for the branch
        const branchDir = Math.floor(Math.random() * 4); // 0: up, 1: right, 2: down, 3: left

        for (let i = 0; i < branchLength; i++) {
          // Move in the branch direction
          if (branchDir === 0) branchY--;
          else if (branchDir === 1) branchX++;
          else if (branchDir === 2) branchY++;
          else branchX--;

          // Check if we're still in bounds
          if (
            branchX > 0 &&
            branchX < w - 1 &&
            branchY > 0 &&
            branchY < h - 1
          ) {
            maze[branchY][branchX] = CELL_TYPES.PATH;

            // Add some side paths from the branch
            if (Math.random() < 0.4) {
              const sideDir = (branchDir + (Math.random() < 0.5 ? 1 : 3)) % 4; // Perpendicular direction
              let sideX = branchX;
              let sideY = branchY;

              if (sideDir === 0) sideY--;
              else if (sideDir === 1) sideX++;
              else if (sideDir === 2) sideY++;
              else sideX--;

              if (sideX > 0 && sideX < w - 1 && sideY > 0 && sideY < h - 1) {
                maze[sideY][sideX] = CELL_TYPES.PATH;
              }
            }
          } else {
            break; // Stop if we hit the boundary
          }
        }
      }
    }

    // Add some random paths for variety
    for (let i = 0; i < w * h * 0.25; i++) {
      // Increased from 0.15 to 0.25 for more paths
      const rx = 1 + Math.floor(Math.random() * (w - 2));
      const ry = 1 + Math.floor(Math.random() * (h - 2));
      if (maze[ry][rx] === CELL_TYPES.WALL) {
        maze[ry][rx] = CELL_TYPES.PATH;

        // Create small connected areas with higher probability
        if (Math.random() < 0.6) {
          // Increased from 0.4 to 0.6
          const directions = [
            [0, 1],
            [1, 0],
            [0, -1],
            [-1, 0],
          ];

          // Create a small room or corridor
          const roomSize = Math.random() < 0.3 ? 2 : 1;
          for (let j = 0; j < roomSize; j++) {
            const dir =
              directions[Math.floor(Math.random() * directions.length)];
            const nx = rx + dir[0];
            const ny = ry + dir[1];

            if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
              maze[ny][nx] = CELL_TYPES.PATH;
            }
          }
        }
      }
    }

    // Add some loops to the maze to create multiple paths
    for (let i = 0; i < w * h * 0.05; i++) {
      const rx = 2 + Math.floor(Math.random() * (w - 4));
      const ry = 2 + Math.floor(Math.random() * (h - 4));

      // Only create loops in areas with existing paths
      let pathsNearby = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (maze[ry + dy][rx + dx] === CELL_TYPES.PATH) {
            pathsNearby++;
          }
        }
      }

      // If there are at least 2 paths nearby, create a connection
      if (pathsNearby >= 2 && maze[ry][rx] === CELL_TYPES.WALL) {
        maze[ry][rx] = CELL_TYPES.PATH;
      }
    }
  } else {
    // Carve paths using recursive backtracking
    carvePassages(startX, startY, maze, w, h, complexity);
  }

  // Ensure there's a path to the finish
  ensurePathToFinish(maze, finishX, finishY);

  // --- Find Solution Path using BFS ---
  // Note: We find the path *before* placing traps/teleporters/checkpoints
  // to get the 'ideal' path. Placement logic below will avoid critical path cells if needed.
  const startPos = { x: startX, y: startY };
  const finishPos = { x: finishX, y: finishY };
  const solutionPath = findSolutionPath(maze, startPos, finishPos);
  console.log("Solution path length:", solutionPath?.length);

  // --- Add Spike Wall Traps ---
  const trapProbability = 0.05; // 5% chance for a suitable spot to become a trap
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      // Check only path cells, not start/finish yet
      if (maze[y][x] === CELL_TYPES.PATH) {
        // Check for horizontal corridor: Wall above, Wall below, Path left, Path right
        if (
          maze[y - 1][x] === CELL_TYPES.WALL &&
          maze[y + 1][x] === CELL_TYPES.WALL &&
          maze[y][x - 1] === CELL_TYPES.PATH &&
          maze[y][x + 1] === CELL_TYPES.PATH &&
          random() < trapProbability
        ) {
          // Ensure it's not too close to start
          if (Math.abs(x - startX) > 2 || Math.abs(y - startY) > 2) {
            maze[y][x] = CELL_TYPES.SPIKE_WALL_TRAP;
          }
        }
        // Check for vertical corridor: Wall left, Wall right, Path above, Path below
        else if (
          maze[y][x - 1] === CELL_TYPES.WALL &&
          maze[y][x + 1] === CELL_TYPES.WALL &&
          maze[y - 1][x] === CELL_TYPES.PATH &&
          maze[y + 1][x] === CELL_TYPES.PATH &&
          random() < trapProbability
        ) {
          // Ensure it's not too close to start
          if (Math.abs(x - startX) > 2 || Math.abs(y - startY) > 2) {
            maze[y][x] = CELL_TYPES.SPIKE_WALL_TRAP;
          }
        }
      }
    }
  }
  // --- End Add Spike Wall Traps ---

  // --- Add Blade Traps ---
  const bladeTrapProbability = 0.03; // Lower probability for blade traps
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      // Check path cells that are NOT already spike traps
      if (maze[y][x] === CELL_TYPES.PATH) {
        // Place in slightly more open areas (e.g., 2x2 path squares or intersections)
        let pathNeighbors = 0;
        if (maze[y - 1][x] === CELL_TYPES.PATH) pathNeighbors++;
        if (maze[y + 1][x] === CELL_TYPES.PATH) pathNeighbors++;
        if (maze[y][x - 1] === CELL_TYPES.PATH) pathNeighbors++;
        if (maze[y][x + 1] === CELL_TYPES.PATH) pathNeighbors++;

        // Place if it's an intersection or part of a wider path (>= 2 path neighbors)
        if (pathNeighbors >= 2 && random() < bladeTrapProbability) {
          // Ensure it's not too close to start or finish
          if (
            (Math.abs(x - startX) > 3 || Math.abs(y - startY) > 3) &&
            (Math.abs(x - finishX) > 3 || Math.abs(y - finishY) > 3)
          ) {
            maze[y][x] = CELL_TYPES.BLADE_TRAP;
          }
        }
      }
    }
  }
  // --- End Add Blade Traps ---

  // --- Add Crusher Traps ---
  const crusherTrapProbability = 0.02; // Even lower probability
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      // Check path cells not already occupied by other traps
      if (maze[y][x] === CELL_TYPES.PATH && random() < crusherTrapProbability) {
        // Ensure it's not too close to start or finish
        if (
          (Math.abs(x - startX) > 4 || Math.abs(y - startY) > 4) && // Further away
          (Math.abs(x - finishX) > 4 || Math.abs(y - finishY) > 4)
        ) {
          // Check if it's a simple path (not intersection) for placement
          let wallNeighbors = 0;
          if (maze[y - 1][x] === CELL_TYPES.WALL) wallNeighbors++;
          if (maze[y + 1][x] === CELL_TYPES.WALL) wallNeighbors++;
          if (maze[y][x - 1] === CELL_TYPES.WALL) wallNeighbors++;
          if (maze[y][x + 1] === CELL_TYPES.WALL) wallNeighbors++;
          // Place in corridors (exactly 2 wall neighbors)
          if (wallNeighbors === 2) {
            maze[y][x] = CELL_TYPES.CRUSHER_TRAP;
          }
        }
      }
    }
  }
  // --- End Add Crusher Traps ---

  // --- Add Teleporter Pairs ---
  const potentialTeleporterLocations = [];
  const teleporterPairs = [];
  const maxTeleporterPairs = 2; // Create 2 pairs (4 teleporters total)

  // Find dead ends (path cells with exactly one path neighbor)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (maze[y][x] === CELL_TYPES.PATH) {
        let pathNeighbors = 0;
        if (maze[y - 1][x] === CELL_TYPES.PATH) pathNeighbors++;
        if (maze[y + 1][x] === CELL_TYPES.PATH) pathNeighbors++;
        if (maze[y][x - 1] === CELL_TYPES.PATH) pathNeighbors++;
        if (maze[y][x + 1] === CELL_TYPES.PATH) pathNeighbors++;

        if (pathNeighbors === 1) {
          // Ensure it's not too close to start or finish
          if (
            (Math.abs(x - startX) > 5 || Math.abs(y - startY) > 5) &&
            (Math.abs(x - finishX) > 5 || Math.abs(y - finishY) > 5)
          ) {
            potentialTeleporterLocations.push({ x, y });
          }
        }
      }
    }
  }

  // Shuffle potential locations
  potentialTeleporterLocations.sort(() => random() - 0.5);

  // Create pairs
  for (
    let i = 0;
    i < potentialTeleporterLocations.length - 1 &&
    teleporterPairs.length < maxTeleporterPairs;
    i += 2
  ) {
    const entry = potentialTeleporterLocations[i];
    const exit = potentialTeleporterLocations[i + 1];

    // Place teleporters in the maze grid
    maze[entry.y][entry.x] = CELL_TYPES.TELEPORTER;
    maze[exit.y][exit.x] = CELL_TYPES.TELEPORTER;

    // Store the pair (using grid coordinates)
    teleporterPairs.push({ entry, exit });
  }
  console.log("Generated Teleporter Pairs:", teleporterPairs);
  // --- End Add Teleporter Pairs ---

  // --- Add Checkpoints along the solution path ---
  const checkpoints = [];
  const checkpointInterval = 15; // Place a checkpoint roughly every 15 steps
  const minDistanceStartFinish = 5; // Don't place too close to start/finish

  if (solutionPath) {
    for (
      let i = checkpointInterval;
      i < solutionPath.length - minDistanceStartFinish;
      i += checkpointInterval
    ) {
      const { x, y } = solutionPath[i];
      // Ensure it's a standard path cell before placing checkpoint
      // Avoid overwriting traps or teleporters
      if (maze[y][x] === CELL_TYPES.PATH) {
        // Double check proximity to actual start/finish cells
        if (
          Math.abs(x - startX) > minDistanceStartFinish ||
          Math.abs(y - startY) > minDistanceStartFinish
        ) {
          if (
            Math.abs(x - finishX) > minDistanceStartFinish ||
            Math.abs(y - finishY) > minDistanceStartFinish
          ) {
            maze[y][x] = CELL_TYPES.CHECKPOINT;
            checkpoints.push({ x, y });
          }
        }
      }
    }
  }
  console.log("Placed Checkpoints:", checkpoints);
  // --- End Add Checkpoints ---

  // --- Mirrors Removed for Performance ---
  const mirrors = []; // Keep array empty
  // --- End Mirrors Removed ---

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
      // Only overwrite walls, leave paths/checkpoints/teleporters etc.
      if (maze[y][x] === CELL_TYPES.WALL) {
        maze[y][x] = CELL_TYPES.PATH;
      }
    }
  }

  // Ensure there's a clear path from multiple directions, avoiding overwrites
  const finishNeighbors = [
    [finishY - 1, finishX],
    [finishY, finishX - 1],
    [finishY + 1, finishX],
    [finishY, finishX + 1],
  ];
  for (const [ny, nx] of finishNeighbors) {
    if (maze[ny]?.[nx] === CELL_TYPES.WALL) {
      // Only carve if it's a wall
      maze[ny][nx] = CELL_TYPES.PATH;
    }
  }

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
  let spikeTrapCount = 0;
  let bladeTrapCount = 0;
  let crusherTrapCount = 0;
  let teleporterCellCount = 0;
  let checkpointCount = 0;
  // let mirrorCount = 0; // Removed mirror counter

  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      const cell = maze[y][x];
      if (cell === CELL_TYPES.WALL) wallCount++;
      else if (cell === CELL_TYPES.PATH) pathCount++;
      else if (cell === CELL_TYPES.START) startCount++;
      else if (cell === CELL_TYPES.FINISH) finishCount++;
      else if (cell === CELL_TYPES.SPIKE_WALL_TRAP) spikeTrapCount++;
      else if (cell === CELL_TYPES.BLADE_TRAP) bladeTrapCount++;
      else if (cell === CELL_TYPES.CRUSHER_TRAP) crusherTrapCount++;
      else if (cell === CELL_TYPES.TELEPORTER) teleporterCellCount++;
      else if (cell === CELL_TYPES.CHECKPOINT) checkpointCount++;
      // else if (cell === CELL_TYPES.MIRROR) mirrorCount++; // Removed mirror count
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
    finishCount,
    "Spike Traps:",
    spikeTrapCount,
    "Blade Traps:",
    bladeTrapCount,
    "Crusher Traps:",
    crusherTrapCount,
    "Teleporters:",
    teleporterCellCount,
    "Checkpoints:",
    checkpointCount
    // "Mirrors:", // Removed log
    // mirrorCount
  );

  // Return the maze grid, teleporter pairs, and checkpoint locations
  return { maze, teleporterPairs, checkpoints }; // Removed mirrors from return
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

// --- BFS Helper Function ---
// Finds a path considering only PATH, START, and FINISH cells as traversable initially.
function findSolutionPath(maze, start, finish) {
  const width = maze[0].length;
  const height = maze.length;
  const queue = new Queue();
  const visited = new Set();
  const parent = new Map(); // To reconstruct the path

  const startKey = `${start.x},${start.y}`;
  queue.enqueue(start);
  visited.add(startKey);

  const directions = [
    { dx: 0, dy: 1 }, // Down
    { dx: 1, dy: 0 }, // Right
    { dx: 0, dy: -1 }, // Up
    { dx: -1, dy: 0 }, // Left
  ];

  while (!queue.isEmpty()) {
    const current = queue.dequeue();
    const currentKey = `${current.x},${current.y}`;

    // Found the finish
    if (current.x === finish.x && current.y === finish.y) {
      // Reconstruct path
      const path = [];
      let node = current;
      let nodeKey = `${node.x},${node.y}`;
      while (nodeKey !== startKey) {
        path.push(node);
        node = parent.get(nodeKey);
        if (!node) break; // Should not happen if path exists
        nodeKey = `${node.x},${node.y}`;
      }
      path.push(start); // Add start node
      return path.reverse(); // Return path from start to finish
    }

    // Explore neighbors
    for (const dir of directions) {
      const nextX = current.x + dir.dx;
      const nextY = current.y + dir.dy;
      const nextKey = `${nextX},${nextY}`;

      // Check bounds and if it's a valid path/finish cell and not visited
      if (
        nextX >= 0 &&
        nextX < width &&
        nextY >= 0 &&
        nextY < height &&
        // Only allow traversing initial PATH, START, or FINISH cells for pathfinding
        (maze[nextY][nextX] === CELL_TYPES.PATH ||
          maze[nextY][nextX] === CELL_TYPES.FINISH ||
          maze[nextY][nextX] === CELL_TYPES.START) &&
        !visited.has(nextKey)
      ) {
        visited.add(nextKey);
        parent.set(nextKey, current); // Store parent for path reconstruction
        queue.enqueue({ x: nextX, y: nextY });
      }
    }
  }

  console.warn("BFS could not find a path from start to finish.");
  return null; // No path found
}
// --- End BFS Helper Function ---

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
