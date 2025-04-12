// server/utils/helpers.js

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
export const generateUniqueId = () => {
  return `id_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Generate a random player name
 * @param {string} sessionId - Session ID to use as a fallback
 * @returns {string} Random player name
 */
export const generatePlayerName = (sessionId) => {
  const shortId = sessionId
    ? sessionId.substring(0, 5)
    : Math.floor(Math.random() * 1000);
  return `Player_${shortId}`;
};

/**
 * Generate a random seed for maze generation
 * @returns {number} Random seed
 */
export const generateRandomSeed = () => {
  return Math.floor(Math.random() * 1000000);
};

/**
 * Create a simplified version of a player object for transmission
 * @param {Object} player - Player object
 * @returns {Object} Simplified player object
 */
export const simplifyPlayer = (player) => {
  if (!player) return null;

  return {
    id: player.id || "unknown",
    name: player.name || "Unknown",
    position: player.position
      ? {
          x: player.position.x || 0,
          y: player.position.y || 0.5,
          z: player.position.z || 0,
        }
      : { x: 0, y: 0.5, z: 0 },
    finishTime: player.finishTime || 0,
  };
};

/**
 * Create a simplified version of a ranking object for transmission
 * @param {Object} ranking - Ranking object
 * @returns {Object} Simplified ranking object
 */
export const simplifyRanking = (ranking) => {
  if (!ranking) return null;

  return {
    id: ranking.id || "unknown",
    name: ranking.name || "Unknown",
    time: ranking.time || 0,
  };
};

/**
 * Sort rankings by time (fastest first)
 * @param {Array} rankings - Array of ranking objects
 * @returns {Array} Sorted rankings
 */
export const sortRankings = (rankings) => {
  if (!rankings || !Array.isArray(rankings)) return [];

  return [...rankings].sort((a, b) => a.time - b.time);
};
