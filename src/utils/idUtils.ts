/**
 * Utility functions for handling IDs in the application
 */

/**
 * Converts a numeric game ID to a UUID-compatible format
 * Uses a deterministic approach to always generate the same UUID for a given game ID
 */
export const gameIdToUuid = (gameId: string | number): string => {
  // Ensure gameId is a string
  const gameIdStr = String(gameId);
  
  // Return a UUID v5-like format with a fixed prefix
  // This ensures a valid UUID syntax while maintaining the original ID information
  return `00000000-0000-0000-0000-${gameIdStr.padStart(12, '0')}`;
};

/**
 * Extracts the original numeric game ID from a UUID-formatted ID
 */
export const uuidToGameId = (uuid: string): number => {
  // If the UUID follows our format, extract the last 12 characters and convert to number
  if (uuid && uuid.startsWith('00000000-0000-0000-0000-')) {
    const numericPart = uuid.slice(-12);
    return parseInt(numericPart.replace(/^0+/, ''), 10);
  }
  
  // Fallback - try parsing the whole string as a number
  return parseInt(uuid, 10) || 0;
};
