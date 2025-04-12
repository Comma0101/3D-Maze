// src/utils/helpers.js

/**
 * Format time in milliseconds to MM:SS.ms format
 * @param {number} timeMs - Time in milliseconds
 * @returns {string} Formatted time string
 */
export const formatTime = (timeMs) => {
  if (!timeMs && timeMs !== 0) return "--:--:--";

  const totalSeconds = timeMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const ms = Math.floor((timeMs % 1000) / 10);

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
};

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
export const generateUniqueId = () => {
  return `id_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Generate a random player name
 * @returns {string} Random player name
 */
export const generatePlayerName = () => {
  return `Player_${Math.floor(Math.random() * 1000)}`;
};

/**
 * Check if a value is within a threshold of another value
 * @param {number} value1 - First value
 * @param {number} value2 - Second value
 * @param {number} threshold - Threshold
 * @returns {boolean} True if the values are within the threshold
 */
export const isWithinThreshold = (value1, value2, threshold) => {
  return Math.abs(value1 - value2) < threshold;
};

/**
 * Calculate distance between two 3D points
 * @param {Object} point1 - First point {x, y, z}
 * @param {Object} point2 - Second point {x, y, z}
 * @returns {number} Distance between the points
 */
export const calculateDistance = (point1, point2) => {
  const xDiff = point1.x - point2.x;
  const yDiff = point1.y - point2.y;
  const zDiff = point1.z - point2.z;
  return Math.sqrt(xDiff * xDiff + yDiff * yDiff + zDiff * zDiff);
};

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Seeded random number generator
 * @param {number} seed - Seed value
 * @returns {Function} Function that returns a random number between 0 and 1
 */
export const seededRandom = (seed) => {
  let state = seed || Math.floor(Math.random() * 1000000);

  return function () {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
};
