/**
 * Convert location ID format (e.g., "R1-S1-Left") to human-readable format (e.g., "Rack 1, Shelf 1, Left Section")
 * @param locationId - The location ID in the format R#-S#-Position
 * @returns Human-readable location string
 */
export const formatLocationId = (locationId: string): string => {
  if (!locationId) return '';

  // Parse the location ID format: R1-S1-Left -> Rack 1, Shelf 1, Left Section
  const match = locationId.match(/^R(\d+)-S(\d+)-(.+)$/);

  if (!match) {
    // If format doesn't match, return as is
    return locationId;
  }

  const [, rack, shelf, position] = match;

  // Format position (capitalize and add "Section")
  const formattedPosition = `${position.charAt(0).toUpperCase()}${position.slice(1).toLowerCase()} Section`;

  return `Rack ${rack}, Shelf ${shelf}, ${formattedPosition}`;
};

/**
 * Parse location ID to extract components
 * @param locationId - The location ID in the format R#-S#-Position
 * @returns Object with rack, shelf, and position components or null if invalid
 */
export const parseLocationId = (
  locationId: string,
): { rack: number; shelf: number; position: string } | null => {
  const match = locationId.match(/^R(\d+)-S(\d+)-(.+)$/);

  if (!match) {
    return null;
  }

  const [, rack, shelf, position] = match;

  return {
    rack: parseInt(rack, 10),
    shelf: parseInt(shelf, 10),
    position,
  };
};
