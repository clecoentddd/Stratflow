// CommandHandler for AddUser slice
import type { Command } from './Command';
import type { Event } from './Event';


import { saveEvents } from '@/lib/db/event-store';
import { v4 as uuidv4 } from 'uuid';


export async function handleAddUserCommand(cmd: Command): Promise<Event> {
  const userId = cmd.userId || uuidv4();
  const event: Event = {
    type: 'UserAdded',
    payload: {
      userId,
      username: cmd.username,
      companyId: cmd.company,
      teamIds: cmd.teamIds,
      timestamp: new Date().toISOString(),
    },
  };
  // Patch: event store expects AllEvents with aggregateId, entity, timestamp at top level
  const storeEvent = {
    ...event,
    aggregateId: userId,
    entity: "user" as const,
    timestamp: event.payload.timestamp,
  };
  await saveEvents([storeEvent]);
  return event;
}
