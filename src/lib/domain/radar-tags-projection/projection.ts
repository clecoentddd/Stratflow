// radar-tags-projection/projection.ts
// Projection for radar items, exposes getRadarItemById for use by command handler
import { AllEvents, registerProjectionHandler } from '../../db/event-store';

export interface RadarItem {
  id: string;
  name: string;
  [key: string]: any;
}

// In-memory store for radar items (populated by events)
const radarItems: Record<string, RadarItem> = {};

// Event handler for TagAdded/TagRemoved (expand as needed)
export function handleRadarTagEvent(event: AllEvents) {
  if (event.type === 'TagAdded' && event.entity === 'initiative') {
    // Add or update the radar item for the initiative tag
    radarItems[event.payload.radarItemId] = {
      id: event.payload.radarItemId,
      name: event.payload.radarName,
      ...event.payload
    };
  } else if (event.type === 'TagRemoved' && event.entity === 'initiative') {
    // Remove the radar item from the in-memory store
    delete radarItems[event.payload.radarItemId];
  }
}

export function getRadarItemById(id: string): RadarItem | undefined {
  return radarItems[id];
}

// Register projection handler for TagAdded/TagRemoved
registerProjectionHandler('TagAdded', handleRadarTagEvent);
registerProjectionHandler('TagRemoved', handleRadarTagEvent);

// Export for use by command handler

