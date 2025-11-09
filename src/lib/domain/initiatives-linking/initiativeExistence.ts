// initiativeExistence.ts
// Helper to check if an initiative exists by replaying events from the event store
import { _getAllEvents } from '../../db/event-store';

/**
 * Checks if an initiative with the given ID exists by replaying events from the event store.
 * @param initiativeId The initiative ID to check for existence
 * @returns true if the initiative exists, false otherwise
 */
export async function initiativeExists(initiativeId: string): Promise<boolean> {
  const events = await _getAllEvents();
  let exists = false;
  for (const event of events) {
    // InitiativeCreated: initiativeId is in event.metadata (see type)
    if (event.type === 'InitiativeCreated' && event.metadata && event.metadata.initiativeId === initiativeId) {
      exists = true;
    }
    // InitiativeDeleted: initiativeId is in event.payload
    if (event.type === 'InitiativeDeleted' && event.payload && event.payload.initiativeId === initiativeId) {
      exists = false;
    }
    // InitiativeDeleted (from linking slice): initiativeId is in event.payload
    if (event.type === 'InitiativeDeleted' && event.payload && event.payload.initiativeId === initiativeId) {
      exists = false;
    }
  }
  return exists;
}
