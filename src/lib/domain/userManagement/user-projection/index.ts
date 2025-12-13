// User projection: builds a list of users from UserAdded events
import { _getAllEvents } from '@/lib/db/event-store';
import type { UserEvent } from '../UserEvent';

export interface UserProjection {
  userId: string;
  username?: string;
  companyId?: string;
  teamIds: string[];
  timestamp: string;
}

export async function getUsersProjection(): Promise<UserProjection[]> {
  const allEvents = await _getAllEvents();
  // Filter for user events
  const userEvents = allEvents.filter(e => e.entity === 'user') as UserEvent[];
  
  const users = new Map<string, UserProjection>();

  for (const event of userEvents) {
      if (event.type === 'UserAdded') {
          users.set(event.payload.userId, {
              userId: event.payload.userId,
              username: event.payload.username,
              companyId: event.payload.companyId,
              teamIds: event.payload.teamIds,
              timestamp: event.payload.timestamp
          });
      } else if (event.type === 'UserAssignedToOrganization') {
          const existing = users.get(event.payload.userId) || {
              userId: event.payload.userId,
              username: event.payload.userId, // Default username to email/id if not set
              teamIds: [],
              timestamp: event.payload.timestamp
          };
          
          existing.companyId = event.payload.companyId;
          if (event.payload.teamId && !existing.teamIds.includes(event.payload.teamId)) {
              existing.teamIds.push(event.payload.teamId);
          }
          users.set(event.payload.userId, existing);
      }
  }
  
  return Array.from(users.values());
}
